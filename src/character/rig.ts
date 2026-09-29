/**
 * The rig.
 *
 * Every frame:
 *   1. damp each field of the live pose toward the target pose
 *   2. layer procedural motion on top (breath, blink, walk cycle, springs)
 *   3. solve both arms and both legs with 2-bone IK
 *   4. solve the laptop, and re-derive the hand target from it in hand mode
 *   5. write the result to the DOM as plain transform strings
 *
 * Nothing here can produce a detached hand: hands are children of forearms,
 * and every IK target is clamped to the chain's actual reach.
 */

import { buildProsper, LEN, C, type Refs } from './parts'
import { REST, type Pose, type ArmCmd, type LegCmd } from './poses'
import { ik2, damp, clamp, r2, smoothstep, TAU, lerp, rot2, RAD } from '../lib/math'

const clonePose = (p: Pose): Pose => ({
  ...p,
  armN: { ...p.armN },
  armF: { ...p.armF },
  legN: { ...p.legN },
  legF: { ...p.legF },
  lap: { ...p.lap },
})

/** damp rate per channel — limbs are quick, everything else is unhurried */
const R_FAST = 17
const R_MED = 11
const R_SLOW = 7
const R_FACE = 13

export type RigOpts = { reduced?: boolean }

export class Rig {
  refs: Refs
  cur: Pose
  target: Pose
  reduced: boolean

  /* procedural state */
  t = 0
  phase = 0
  gait = 0 // 0..1 how much walk cycle to blend in
  /** stride half-amplitude in character units, set by the director from the
   *  real walking speed so the planted foot never slides */
  stride = 10.5
  walking = 0 // 0..1 whether the cycle is advancing
  breath = 0
  shift = 0
  blinkAt = 1.6
  blinkT = -1
  gazeHold = 0
  gazeT = 0

  /* springs (secondary motion) */
  private hairV = 0
  private hairX = 0
  private lapV = 0
  private lapX = 0
  private lapVY = 0
  private lapY = 0

  /* laptop render state */
  private lapR = { x: 0, y: 0, rot: 0, lid: 90 }

  /* output of the last solve, handy for the bubble anchor */
  headWorld = { x: 0, y: 0 }

  constructor(opts: RigOpts = {}) {
    this.refs = buildProsper()
    this.reduced = !!opts.reduced
    this.cur = clonePose(REST)
    this.target = clonePose(REST)
    this.lapR = { x: 0, y: 0, rot: 0, lid: 90 }
  }

  get svg() {
    return this.refs.svg
  }

  setTarget(p: Pose) {
    this.target = clonePose(p)
  }

  /* ---------------------------------------------------------------- */

  step(dt: number) {
    dt = clamp(dt, 0, 0.05)
    const R = this.refs
    const cur = this.cur
    const tg = this.target

    this.t += dt

    /* ---- 1. damp toward the target pose ---- */
    const S = (k: keyof Pose, rate: number) => {
      ;(cur[k] as number) = damp(cur[k] as number, tg[k] as number, rate, dt)
    }
    S('lean', R_SLOW)
    S('stretch', R_MED)
    S('headRot', R_MED)
    S('headX', R_MED)
    S('headY', R_MED)
    S('lookX', R_FACE)
    S('lookY', R_FACE)
    S('eyeOpen', 26)
    S('browN', R_FACE)
    S('browF', R_FACE)
    S('browRaise', R_FACE)
    S('mouthCurve', R_FACE)
    S('mouthOpen', R_FACE)
    S('mouthWidth', R_FACE)

    const armD = (a: ArmCmd, b: ArmCmd) => {
      a.x = damp(a.x, b.x, R_MED, dt)
      a.y = damp(a.y, b.y, R_MED, dt)
      a.wrist = damp(a.wrist, b.wrist, R_MED, dt)
      a.bend = b.bend
    }
    const legD = (a: LegCmd, b: LegCmd) => {
      a.x = damp(a.x, b.x, R_FAST, dt)
      a.y = damp(a.y, b.y, R_FAST, dt)
      a.foot = damp(a.foot, b.foot, R_FAST, dt)
      a.bend = b.bend
    }
    armD(cur.armN, tg.armN)
    armD(cur.armF, tg.armF)
    legD(cur.legN, tg.legN)
    legD(cur.legF, tg.legF)

    // laptop: mode is discrete, everything else blends
    cur.lap.mode = tg.lap.mode
    cur.lap.x = damp(cur.lap.x, tg.lap.x, R_MED, dt)
    cur.lap.y = damp(cur.lap.y, tg.lap.y, R_MED, dt)
    cur.lap.rot = damp(cur.lap.rot, tg.lap.rot, R_MED, dt)
    cur.lap.lid = damp(cur.lap.lid, tg.lap.lid, R_MED, dt)

    /* ---- 2. procedural layers ---- */
    this.breath += dt * 1.55
    this.shift += dt * 0.42
    const br = Math.sin(this.breath)
    const sway = Math.sin(this.shift) * (1 - this.gait)

    let lean = cur.lean + br * 0.5 + sway * 1.5
    let bob = cur.bob + br * 0.45 - this.gait * 1.4
    const sy = 1 + cur.stretch * 0.05

    // blink
    if (!this.reduced) {
      this.blinkAt -= dt
      if (this.blinkAt <= 0 && this.blinkT < 0) {
        this.blinkT = 0
        this.blinkAt = 1.8 + Math.random() * 4.2
      }
    }
    let eyeOpen = cur.eyeOpen
    if (this.blinkT >= 0) {
      this.blinkT += dt
      const k = this.blinkT
      const lid = k < 0.07 ? 1 - k / 0.07 : k < 0.17 ? (k - 0.07) / 0.1 : 0
      eyeOpen *= 1 - 0.94 * clamp(lid, 0, 1)
      if (k > 0.17) this.blinkT = -1
    }

    // eyes drift a little so a stare never freezes
    const driftX = Math.sin(this.t * 0.63) * 0.09 + Math.sin(this.t * 0.21 + 1.3) * 0.06
    const driftY = Math.cos(this.t * 0.47) * 0.07
    const lookX = clamp(cur.lookX + driftX * (1 - Math.abs(cur.lookX)), -1.3, 1.3)
    const lookY = clamp(cur.lookY + driftY * (1 - Math.abs(cur.lookY)), -1.2, 1.2)

    // ---- walk cycle ----
    // The cycle advances at a fixed cadence; the stride amplitude comes from
    // the real speed. That is the combination that keeps a planted foot
    // exactly still while it is on the ground.
    const gait = this.gait
    // the pelvis drops at double support, which is also what buys the leg
    // enough reach to take a real stride
    const drop = 4.6 * gait * Math.abs(Math.cos(this.phase))
    if (gait > 0.002) {
      const stride = clamp(this.stride, 0, 22) * gait
      const lift = Math.min(stride * 0.3, 8.5)
      const swing = Math.min(stride * 0.5, 12)

      // Stance moves the foot backwards relative to the body at exactly the
      // body's own speed, so on screen the planted foot is nailed to the
      // floor. Swing is eased and lifts clear.
      const cyc = (ph: number, base: number) => {
        const p = ((ph % TAU) + TAU) % TAU
        if (p < Math.PI) {
          const t = p / Math.PI
          return {
            x: base + stride * (1 - 2 * t),
            y: LEN.ankleY - cur.bob - drop,
            foot: -14 + 22 * t,
          }
        }
        const t = (p - Math.PI) / Math.PI
        const e = 0.5 - 0.5 * Math.cos(t * Math.PI)
        return {
          x: base + stride * (2 * e - 1),
          y: LEN.ankleY - cur.bob - drop - Math.sin(t * Math.PI) * lift,
          foot: lerp(8, -14, e) + 21 * Math.sin(t * Math.PI),
        }
      }
      const n = cyc(this.phase, LEN.hipX)
      const f = cyc(this.phase + Math.PI, -LEN.hipX)
      cur.legN.x = lerp(cur.legN.x, n.x, gait)
      cur.legN.y = lerp(cur.legN.y, n.y, gait)
      cur.legN.foot = lerp(cur.legN.foot, n.foot, gait)
      cur.legF.x = lerp(cur.legF.x, f.x, gait)
      cur.legF.y = lerp(cur.legF.y, f.y, gait)
      cur.legF.foot = lerp(cur.legF.foot, f.foot, gait)

      cur.armN.x -= Math.cos(this.phase) * swing
      cur.armF.x += Math.cos(this.phase) * swing
      cur.armN.y -= 1.6 * gait * (0.5 + 0.5 * Math.cos(this.phase * 2))
      cur.armF.y -= 1.6 * gait * (0.5 + 0.5 * Math.cos(this.phase * 2))

      // body is lowest at double support, highest at single support
      bob += Math.cos(this.phase * 2) * 1.8 * gait
      lean += Math.cos(this.phase * 2) * 0.7 * gait
    }

    /* ---- 3. solve ---- */
    const sy2 = sy
    // arms (solved in torso space; the spine transform is applied to the group)
    const shN = { x: LEN.shoulderX, y: LEN.shoulderY }
    const shF = { x: -LEN.shoulderXF, y: LEN.shoulderY }
    const aN = ik2(shN.x, shN.y, cur.armN.x, cur.armN.y, LEN.upperArm, LEN.foreArm, cur.armN.bend)
    const aF = ik2(shF.x, shF.y, cur.armF.x, cur.armF.y, LEN.upperArm, LEN.foreArm, cur.armF.bend)

    // legs (root space, so the spine transform does not touch them)
    const hpN = { x: LEN.hipX, y: 0 }
    const hpF = { x: -LEN.hipX, y: 0 }
    const lN = ik2(hpN.x, hpN.y, cur.legN.x, cur.legN.y, LEN.thigh, LEN.shin, cur.legN.bend)
    const lF = ik2(hpF.x, hpF.y, cur.legF.x, cur.legF.y, LEN.thigh, LEN.shin, cur.legF.bend)

    /* ---- laptop ---- */
    const lapT = cur.lap
    let lx = lapT.x
    let ly = lapT.y
    let lrot = lapT.rot
    let llid = lapT.lid
    if (lapT.mode === 'hand') {
      // the laptop hangs from the middle of the palm. The IK already lands the
      // wrist exactly on the target, so read it from there rather than
      // re-deriving it from bone angles.
      const fore = (aN.upper + aN.lower) * RAD
      const hx = cur.armN.x + Math.cos(fore) * 3.4
      const hy = cur.armN.y + Math.sin(fore) * 3.4
      const grip = rot2(10, 0, lapT.rot)
      lx = hx - grip.x
      ly = hy - grip.y
    } else if (lapT.mode === 'none') {
      lx = 0
      ly = 0
    }
    // carry sway while walking
    const swayAmp = lapT.mode === 'hand' ? Math.sin(this.phase * 2 + 0.4) * 2.6 * gait : 0
    lrot += swayAmp

    // spring: the slab lags the hand a touch, which reads as weight
    const kx = kSpring(this.lapX, lx, this.lapV, 150, 17, dt)
    this.lapX = kx.x
    this.lapV = kx.v
    const ky = kSpring(this.lapY, ly, this.lapVY, 150, 17, dt)
    this.lapY = ky.x
    this.lapVY = ky.v
    this.lapR.x = this.lapX
    this.lapR.y = this.lapY
    this.lapR.rot = damp(this.lapR.rot, lrot, 14, dt)
    this.lapR.lid = damp(this.lapR.lid, llid, 12, dt)

    const lapX = this.lapR.x
    const lapY = this.lapR.y

    /* ---- 4. hair spring (lags the head) ---- */
    const headVel = (cur.headRot - (this.prevHeadRot ?? cur.headRot)) / Math.max(dt, 1e-4)
    this.prevHeadRot = cur.headRot
    const hs = kSpring(this.hairX, clamp(-headVel * 0.09, -9, 9), this.hairV, 120, 14, dt)
    this.hairX = hs.x
    this.hairV = hs.v

    /* ---- 5. write DOM ---- */
    const set = (node: Element, t: string) => node.setAttribute('transform', t)
    const A = R.arms
    const L = R.legSets

    set(R.root, `translate(0 ${r2(drop)})`)
    set(R.spine, `translate(0 ${r2(bob)}) scale(1 ${r2(sy2)})`)
    set(R.lean, `rotate(${r2(lean)})`)
    set(R.headG, `translate(0 ${LEN.neckY}) rotate(${r2(cur.headRot)}) translate(${r2(cur.headX)} ${r2(cur.headY)})`)
    set(R.head.hair, `rotate(${r2(this.hairX * 0.5)}) translate(0 ${r2(this.hairX * 0.25)})`)

    // face
    const eo = Math.max(0.04, eyeOpen)
    set(R.head.eyeN.firstElementChild as Element, `scale(1 ${r2(eo)})`)
    set(R.head.eyeF.firstElementChild as Element, `scale(1 ${r2(eo)})`)
    set(R.head.look, `translate(${r2(lookX * 1.15)} ${r2(lookY * 0.85)})`)
    set(R.head.browN, `translate(7.6 ${r2(-18.6 + cur.browRaise)}) rotate(${r2(cur.browN)})`)
    set(R.head.browF, `translate(-7.6 ${r2(-18.6 + cur.browRaise * 0.7)}) rotate(${r2(-cur.browF)}) scale(-1 1)`)

    const w = cur.mouthWidth
    const c = cur.mouthCurve
    const o = cur.mouthOpen
    const openVis = smoothstep(o * 2.1)
    set(R.head.mouthOpen, `translate(0 ${r2(-o * 0.5)}) scale(${r2(0.9 + o * 0.1)} ${r2(0.5 + o * 1.35)})`)
    ;(R.head.mouthOpen as SVGEllipseElement).setAttribute('opacity', String(r2(openVis)))
    R.head.mouthLine.setAttribute(
      'd',
      `M ${r2(-w)} ${r2(-o * 1.5)} Q 0 ${r2(-o * 1.5 + c * 2.1)} ${r2(w)} ${r2(-o * 1.5)}`,
    )
    ;(R.head.mouthLine as SVGPathElement).setAttribute('opacity', String(r2(1 - openVis)))

    // arms
    set(A.near.upper, `rotate(${r2(aN.upper)})`)
    set(A.near.fore, `translate(${LEN.upperArm} 0) rotate(${r2(aN.lower)})`)
    set(A.near.hand, `translate(${LEN.foreArm} 0) rotate(${r2(aN.lower + cur.armN.wrist)})`)
    set(A.far.upper, `rotate(${r2(aF.upper)})`)
    set(A.far.fore, `translate(${LEN.upperArm} 0) rotate(${r2(aF.lower)})`)
    set(A.far.hand, `translate(${LEN.foreArm} 0) rotate(${r2(aF.lower + cur.armF.wrist)})`)

    // legs
    set(L.near.thigh, `rotate(${r2(lN.upper)})`)
    set(L.near.shin, `translate(${LEN.thigh} 0) rotate(${r2(lN.lower)})`)
    set(L.near.foot, `translate(${LEN.shin} 0) rotate(${r2(cur.legN.foot - lN.upper - lN.lower)})`)
    set(L.far.thigh, `rotate(${r2(lF.upper)})`)
    set(L.far.shin, `translate(${LEN.thigh} 0) rotate(${r2(lF.lower)})`)
    set(L.far.foot, `translate(${LEN.shin} 0) rotate(${r2(cur.legF.foot - lF.upper - lF.lower)})`)

    // laptop
    const lidOpen = clamp(this.lapR.lid / 100, 0, 1)
    const lidVis = smoothstep(lidOpen * 1.5)
    set(R.lap, `translate(${r2(lapX)} ${r2(lapY)}) rotate(${r2(lrot)})`)
    const h = 0.05 + 0.95 * lidVis
    set(R.lid, `skewX(${r2(-3.5 * h)}) scale(1 ${r2(h)})`)
    ;(R.lid as SVGGElement).style.opacity = String(r2(lidVis))
    ;(R.slab as SVGGElement).style.opacity = String(r2(1 - lidVis))
    ;(R.lap as SVGGElement).style.opacity = cur.lap.mode === 'none' ? '0' : '1'

    // shadow reacts to how much weight is on the ground
    const lift = clamp((LEN.ankleY - cur.legN.y) / 8, 0, 1)
    set(R.shadow, `translate(0 0) scale(${r2(1 - lift * 0.22 - cur.stretch * 0.1)} 1)`)
    ;(R.shadow as SVGEllipseElement).setAttribute('opacity', String(r2(0.9 - lift * 0.35)))

    // head anchor for the speech bubble (root space, character units)
    const hr = rot2(cur.headX, LEN.neckY + cur.headY - 6, cur.headRot)
    this.headWorld = { x: hr.x, y: hr.y + bob }
  }

  private prevHeadRot: number | undefined
}

function kSpring(x: number, target: number, vel: number, k: number, c: number, dt: number) {
  const a = -k * (x - target) - c * vel
  const nv = vel + a * dt
  return { x: x + nv * dt, v: nv }
}

/* convenience for the QA sheet */
export { LEN, C, TAU }
