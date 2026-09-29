/**
 * PROSPER — part geometry + skeleton builder.
 *
 * Coordinate space: the root origin sits at the pelvis (hip joint centre).
 * +y is down. The floor is at y = +71.8. The character is ~146 units tall,
 * roughly four heads — stylised, not chibi.
 *
 * Bones are drawn along +x and rotated by a single angle, so a joint is
 * always covered by the shape attached to it. Hands are children of the
 * forearm, never siblings: they physically cannot drift off the arm.
 *
 * Value plan (this is what carries the read at 56px tall):
 *   near-black overshirt · one cream crew neckline · warm skin
 *   darker far-side limbs for depth · cream shoes · a single cobalt accent
 */

import { el, g, path, circle, ellipse, rect } from '../lib/svg'

export const C = {
  skin: '#7d5339',
  skinFar: '#5d3b27',
  skinHi: '#9c6d4a',
  hair: '#141219',
  hairHi: '#2b2532',
  jacket: '#272531',
  jacketFar: '#1a1821',
  jacketHi: '#343140',
  shirt: '#efe9dc',
  trousers: '#46424f',
  trousersFar: '#2e2b37',
  shoe: '#252330',
  shoeFar: '#1a1822',
  shoeSole: '#e8e3d6',
  accent: '#1a2bff',
  laptop: '#2c2a35',
  laptopLo: '#1b1922',
  screen: '#121118',
  dark: '#191720',
  shade: 'rgba(25,23,32,0.11)',
} as const

export const LEN = {
  upperArm: 21,
  foreArm: 19,
  hand: 8,
  thigh: 35,
  shin: 32,
  hipX: 6.4,
  ankleY: 65.4,
  floor: 71.8,
  shoulderX: 12.4,
  shoulderXF: 8.2,
  shoulderY: -29.6,
  neckY: -37.6,
  crownY: -69.6,
} as const

/* ------------------------------------------------------------------ *
 * path data
 * ------------------------------------------------------------------ */

/** Overshirt silhouette: shoulders, slight A-line, hem below the hip. */
const TORSO =
  'M -15 -28.6 C -16.1 -19.4 -14.4 -5.6 -13 6.8 C -5.7 8.9 5.7 8.9 13 6.8 ' +
  'C 14.4 -5.6 16.1 -19.4 15 -28.6 C 10.6 -34.9 -10.6 -34.9 -15 -28.6 Z'

/** crew-neck tee: the sliver that shows between chin and collar */
const TEE = 'M -9.4 0.6 C -9.4 -2.6 -5.2 -4.6 0 -4.6 C 5.2 -4.6 9.4 -2.6 9.4 0.6 L 9.4 11.2 L -9.4 11.2 Z'
/** neck cylinder: chin down into the collar */
const NECK = 'M -4.8 -2.6 C -5.4 0.4 -5.4 5.2 -4.7 9.6 L 4.7 9.6 C 5.4 5.2 5.4 0.4 4.8 -2.6 Z'
/** collar band, drawn in front of both */
const COLLAR =
  'M -12.4 12.6 L -12.4 8.6 C -9.6 6.4 -5 5.4 0 5.4 C 5 5.4 9.6 6.4 12.4 8.6 L 12.4 12.6 Z'

const HIPS =
  'M -12.6 -1 C -13.2 7 -12.2 11.8 -11 15 C -3.8 16.4 3.8 16.4 11 15 ' +
  'C 12.2 11.8 13.2 7 12.6 -1 C 7.8 -3 -7.8 -3 -12.6 -1 Z'

const HEAD_SHAPE =
  'M 0 -32 C -12.9 -32 -18.7 -23.8 -18.7 -13.6 C -18.7 -4.3 -11 5.5 0 5.5 ' +
  'C 11 5.5 18.7 -4.3 18.7 -13.6 C 18.7 -23.8 12.9 -32 0 -32 Z'

const HAIR =
  'M -18.9 -17.6 C -21 -30.4 -12.8 -35.4 -1.2 -35.4 C 10.6 -35.4 19.4 -29.4 18.9 -16.2 ' +
  'C 17.6 -19.8 15.3 -21.7 12.3 -22.3 C 8.9 -23 7 -20.4 4 -21.3 ' +
  'C 0.2 -22.3 -2.4 -19.5 -5.8 -20.6 C -9.6 -21.7 -12.5 -20.3 -15.3 -21.3 ' +
  'C -17.5 -22.2 -18.7 -20.2 -18.9 -17.6 Z'

const EAR = 'M 0 -3.6 C 2.6 -4.4 3.9 -1.8 3.7 1.4 C 3.5 4 2.2 5.4 0.4 5.2 Z'
const BROW = 'M -3.7 0.9 C -1.6 -0.7 1.6 -0.7 3.7 0.5 L 3.5 2.1 C 1.4 0.9 -1.4 1 -3.5 2 Z'

const HAND =
  'M 0.4 -1.7 C 1.4 -3.8 3.7 -4.8 5.7 -4.1 C 7.7 -3.4 8.5 -1.2 8.1 0.9 ' +
  'C 7.7 3 5.6 4 3.6 3.5 C 1.6 3 0.2 0.7 0.4 -1.7 Z'

const SHOE_MIDSOLE =
  'M -5.2 1.4 C -2 3.6 2.4 4.4 6.6 4 C 9.6 3.7 11.6 2.8 12 2 L 12 4.4 ' +
  'C 11.4 6.4 8.4 7.4 4.4 7.4 C 0.4 7.4 -3.6 6.2 -4.8 4.2 C -5.3 3.2 -5.4 2.2 -5.2 1.4 Z'
const SHOE_UPPER =
  'M -4.6 -2.4 C -4.9 -4.6 -3.3 -6 -1.4 -6 C 1.7 -6 6.1 -4.2 9 -1.9 ' +
  'C 11.1 -0.4 12.1 0.6 12.1 1.8 L -4.8 1.8 C -5.4 0.6 -5.4 -0.8 -4.6 -2.4 Z'
const SHOE_HEEL = 'M -4.5 -2.5 C -4.8 -4.5 -3.2 -5.8 -1.5 -5.8 L 0.6 -5.6 L -1.2 -2.3 Z'

const LAP_BASE =
  'M 0 0 L 29.4 0 C 30.6 0 31.2 0.6 31.2 1.6 L 31.2 3.4 C 31.2 4.4 30.6 5 29.4 5 L 0 5 ' +
  'C -1 5 -1.6 4.4 -1.6 3.4 L -1.6 1.6 C -1.6 0.6 -1 0 0 0 Z'

/** limb segment along +x, origin at the proximal joint */
const seg = (len: number, r0: number, r1: number) =>
  [
    `M 0 ${-r0}`,
    `A ${r0} ${r0} 0 0 0 0 ${r0}`,
    `L ${len - r1} ${-r1}`,
    `A ${r1} ${r1} 0 0 1 ${len} 0`,
    `A ${r1} ${r1} 0 0 1 ${len - r1} ${r1}`,
    `L 0 ${r0}`,
    'Z',
  ].join(' ')

/* ------------------------------------------------------------------ *
 * skeleton
 * ------------------------------------------------------------------ */

export function buildProsper() {
  /* ---- arm ---- */
  function buildArm(upper: string, fore: string, handC: string) {
    const up = g({ class: 'up' })
    up.appendChild(path(seg(LEN.upperArm, 6.3, 4.7), { fill: upper }))
    const fo = g({ transform: `translate(${LEN.upperArm} 0)` })
    fo.appendChild(path(seg(LEN.foreArm, 4.7, 3.5), { fill: fore }))
    // rolled cuff: a short band of sleeve colour sitting on the forearm
    fo.appendChild(path(seg(3.8, 5.1, 4.8), { fill: upper }))
    const ha = g({ transform: `translate(${LEN.foreArm} 0)` })
    ha.appendChild(path(HAND, { fill: handC }))
    ha.appendChild(ellipse({ cx: 1.1, cy: 1.5, rx: 1.9, ry: 1.6, fill: handC, transform: 'rotate(-30 1.1 1.5)' }))
    fo.appendChild(ha)
    up.appendChild(fo)
    return { upper: up, fore: fo, hand: ha }
  }

  /* ---- leg ---- */
  function buildLeg(pant: string, pantDark: string, shoe: string, sole: string) {
    const th = g({ class: 'th' })
    th.appendChild(path(seg(LEN.thigh, 8.8, 7.1), { fill: pant }))
    const sh = g({ transform: `translate(${LEN.thigh} 0)` })
    sh.appendChild(path(seg(LEN.shin, 7.1, 4.9), { fill: pant }))
    sh.appendChild(
      path(seg(3, 5.3, 5), { fill: pantDark, transform: `translate(${LEN.shin - 4.4} 0)` }),
    )
    const ft = g({ transform: `translate(${LEN.shin} 0)` })
    ft.appendChild(path(SHOE_MIDSOLE, { fill: sole }))
    ft.appendChild(path(SHOE_UPPER, { fill: shoe }))
    ft.appendChild(path(SHOE_HEEL, { fill: C.accent }))
    ft.appendChild(
      path('M 2 -3.8 L 5.2 -2.6 M 3.4 -4.6 L 6.6 -3.4 M 4.8 -5.2 L 8 -4', {
        fill: 'none',
        stroke: 'rgba(255,255,255,0.34)',
        'stroke-width': 0.7,
        'stroke-linecap': 'round',
      }),
    )
    sh.appendChild(ft)
    th.appendChild(sh)
    return { thigh: th, shin: sh, foot: ft }
  }

  /* ---- head ---- */
  function buildHead() {
    const head = g({ class: 'head' })
    // neckline stack: tee, then neck, then collar in front
    head.appendChild(path(TEE, { fill: C.shirt }))
    head.appendChild(path(NECK, { fill: C.skinFar }))
    head.appendChild(path(COLLAR, { fill: C.jacketHi }))

    head.appendChild(path(EAR, { fill: C.skinFar, transform: 'translate(-17.3 -10) scale(-0.82 0.88)' }))
    head.appendChild(path(HEAD_SHAPE, { fill: C.skin }))
    head.appendChild(
      ellipse({ cx: 9.8, cy: -14, rx: 6.2, ry: 9.4, fill: C.skinHi, opacity: 0.2, transform: 'rotate(-12 9.8 -14)' }),
    )
    head.appendChild(path(EAR, { fill: C.skin, transform: 'translate(17.1 -10) scale(0.88 0.93)' }))
    head.appendChild(path(EAR, { fill: C.skinFar, opacity: 0.4, transform: 'translate(17.3 -9.6) scale(0.58 0.58)' }))

    const hair = g({ class: 'hair' })
    hair.appendChild(path(HAIR, { fill: C.hair }))
    hair.appendChild(
      path('M -12.6 -30.8 C -6 -33.8 6 -33.6 12.4 -30.4 C 4.8 -31.6 -4.8 -31.4 -12.6 -30.8 Z', {
        fill: C.hairHi,
        opacity: 0.5,
      }),
    )
    head.appendChild(hair)

    const look = g({ class: 'look' })
    const mkEye = (x: number) => {
      const e = g({ transform: `translate(${x} -11.4)` })
      const inner = g({ class: 'es' })
      inner.appendChild(ellipse({ rx: 3.3, ry: 3.7, fill: C.dark }))
      inner.appendChild(ellipse({ cx: -1.15, cy: -1.5, rx: 1.2, ry: 1.3, fill: '#fff', opacity: 0.94 }))
      inner.appendChild(ellipse({ cx: 1.2, cy: 1.5, rx: 0.55, ry: 0.6, fill: '#fff', opacity: 0.4 }))
      e.appendChild(inner)
      return e
    }
    const eyeF = mkEye(-7.6)
    const eyeN = mkEye(7.6)
    const browF = g({ class: 'brow' }, [path(BROW, { fill: C.dark, transform: 'scale(-1 1)' })])
    const browN = g({ class: 'brow' }, [path(BROW, { fill: C.dark })])
    look.append(eyeF, browF, eyeN, browN)
    head.appendChild(look)

    head.appendChild(
      path('M 1.2 -7.6 C 2.6 -6.4 3 -4.9 1.7 -4.3', {
        fill: 'none',
        stroke: C.skinFar,
        'stroke-width': 0.95,
        'stroke-linecap': 'round',
        opacity: 0.85,
      }),
    )

    const mouth = g({ class: 'mouth', transform: 'translate(0 1.2)' })
    const mouthOpen = ellipse({ rx: 3.2, ry: 2.4, fill: C.dark, opacity: 0 })
    const mouthLine = path('M -2.7 0 Q 0 1.4 2.7 0', {
      fill: 'none',
      stroke: C.dark,
      'stroke-width': 1.05,
      'stroke-linecap': 'round',
    })
    mouth.append(mouthOpen, mouthLine)
    head.appendChild(mouth)

    return { head, hair, look, eyeN, eyeF, browN, browF, mouth, mouthOpen, mouthLine }
  }

  /* ---- laptop ----
     `lid` is the open angle: 0 = shut, 100 = wide open. A closed lid cannot be
     a rotation of the open one (21 deep vs 5 thick), so shut/open cross-fade
     between a slab and a screen instead of faking a fold. */
  function buildLaptop() {
    const lap = g({ class: 'lap' })
    lap.appendChild(path(LAP_BASE, { fill: C.laptop }))
    lap.appendChild(rect({ x: 1.4, y: 0.7, width: 25.4, height: 2.2, rx: 0.6, fill: C.laptopLo }))
    lap.appendChild(rect({ x: 9.4, y: 0.9, width: 9.4, height: 1.8, rx: 0.4, fill: 'rgba(255,255,255,0.13)' }))

    // shut: the lid lying flat on the base
    const slab = g({ class: 'slab' })
    slab.appendChild(
      path('M 0 0.4 L 29.2 0.4 C 30.4 0.4 31 0.9 31 1.7 L 31 3 C 31 3.6 30.4 3.9 29.2 3.9 L 0 3.9 Z', {
        fill: C.laptop,
      }),
    )
    slab.appendChild(path('M 1.6 1.3 L 27 1.3', { fill: 'none', stroke: 'rgba(255,255,255,0.16)', 'stroke-width': 0.7 }))
    lap.appendChild(slab)

    // open: the screen, hinged at the base's back edge
    const lid = g({ class: 'lid' })
    lid.appendChild(rect({ x: 0, y: -21.4, width: 29.8, height: 21.4, rx: 1.7, fill: C.laptop }))
    lid.appendChild(rect({ x: 1.4, y: -19.9, width: 27, height: 17.4, rx: 0.9, fill: C.screen }))
    lid.appendChild(rect({ x: 3.1, y: -17.8, width: 12, height: 1.5, rx: 0.7, fill: 'rgba(255,255,255,0.17)' }))
    lid.appendChild(rect({ x: 3.1, y: -14.6, width: 20, height: 1.1, rx: 0.5, fill: 'rgba(255,255,255,0.09)' }))
    lid.appendChild(rect({ x: 3.1, y: -12.2, width: 16, height: 1.1, rx: 0.5, fill: 'rgba(255,255,255,0.09)' }))
    lid.appendChild(rect({ x: 3.1, y: -6.4, width: 9, height: 3.2, rx: 0.7, fill: C.accent, opacity: 0.85 }))
    lid.appendChild(circle({ cx: 24.4, cy: -3.6, r: 2.5, fill: C.accent }))
    lid.appendChild(circle({ cx: 23.3, cy: -4.4, r: 0.8, fill: 'rgba(255,255,255,0.5)' }))
    lap.appendChild(lid)

    return { lap, lid, slab }
  }

  /* ---- assemble ----
     facing  ─ root space; the whole character mirrors here
       ├ shadow + legs   root space, untouched by lean or stretch
       ├ lean > spine    torso, head, arms — these breathe and stretch
       └ lap             solved in torso space, converted out to root
  */
  const root = g({ class: 'root' })
  const facing = g({})
  const legsG = g({})
  const lean = g({})
  const spine = g({})
  const body = g({})

  const shadow = ellipse({ class: 'shadow', cx: 0, cy: LEN.floor, rx: 15, ry: 3.1, fill: C.shade })

  const far = buildLeg(C.trousersFar, '#1f1d26', C.shoeFar, '#b4afa0')
  const near = buildLeg(C.trousers, C.trousersFar, C.shoe, C.shoeSole)
  const armFar = buildArm(C.jacketFar, C.skinFar, C.skinFar)
  const armNear = buildArm(C.jacket, C.skin, C.skin)
  const headParts = buildHead()
  const lap = buildLaptop()

  const farLegG = g({ transform: `translate(${-LEN.hipX} 0)` }, [far.thigh])
  const nearLegG = g({ transform: `translate(${LEN.hipX} 0)` }, [near.thigh])
  const farArmG = g({ transform: `translate(${-LEN.shoulderXF} ${LEN.shoulderY})` }, [armFar.upper])
  const nearArmG = g({ transform: `translate(${LEN.shoulderX} ${LEN.shoulderY})` }, [armNear.upper])
  const headG = g({ transform: `translate(0 ${LEN.neckY})` }, [headParts.head])

  const torso = g({ class: 'torso' })
  torso.append(
    path(HIPS, { fill: C.trousers }),
    path(TORSO, { fill: C.jacket }),
    // chest seam + hem seam
    path('M 0 -30 C 0.2 -20 0.2 -8 0 4', {
      fill: 'none',
      stroke: 'rgba(0,0,0,0.3)',
      'stroke-width': 0.7,
    }),
    path('M -12.9 5.4 C -5.7 7.5 5.7 7.5 12.9 5.4', {
      fill: 'none',
      stroke: 'rgba(0,0,0,0.26)',
      'stroke-width': 0.8,
    }),
    // patch pocket
    path('M 6 -3.4 L 11.8 -5.2 L 12 1.6 L 6.2 0.4 Z', {
      fill: 'none',
      stroke: 'rgba(0,0,0,0.24)',
      'stroke-width': 0.8,
    }),
  )

  body.append(farArmG, torso, headG, lap.lap, nearArmG)
  spine.appendChild(body)
  lean.appendChild(spine)
  legsG.append(farLegG, nearLegG)
  facing.append(shadow, legsG, lean)
  root.appendChild(facing)

  const svg = el('svg', {
    viewBox: '-56 -96 112 186',
    width: 112,
    height: 186,
    class: 'prosper-svg',
    'aria-hidden': 'true',
  })
  svg.appendChild(root)

  return {
    svg,
    root,
    facing,
    lean,
    spine,
    legs: legsG,
    body,
    shadow,
    head: headParts,
    lap: lap.lap,
    lid: lap.lid,
    slab: lap.slab,
    headG,
    torso,
    farLegG,
    nearLegG,
    farArmG,
    nearArmG,
    arms: { far: armFar, near: armNear },
    legSets: { far, near },
  }
}

export type Refs = ReturnType<typeof buildProsper>
