/**
 * The director drives Prosper around the stage: where he stands, which way
 * he faces, how he walks, what he does with his hands, and what he says.
 *
 * It owns one Rig and one requestAnimationFrame loop. Chapters never touch the
 * DOM of the character — they call semantic methods and await them.
 */

import { Rig } from './rig'
import { POSES, type PoseName } from './poses'
import { LEN } from './parts'
import { clamp, damp } from '../lib/math'

export type Facing = 1 | -1

type Bubble = {
  el: HTMLDivElement
  text: HTMLSpanElement
  caret: HTMLSpanElement
  timer: number
  full: string
  shown: number
  until: number
  visible: boolean
}

const WALK_SPEED = 135 // px per second
const WALK_CADENCE = 2.5 // steps per second

export class Director {
  rig: Rig
  host: HTMLElement
  stage: HTMLElement
  bubble: Bubble

  /** feet position, in stage pixels */
  x = 0
  y = 0
  private toX = 0
  private moving = false
  private walkResolvers: (() => void)[] = []

  facing: Facing = 1
  private wantFacing: Facing = 1
  private gait = 0
  private prevX = 0
  private pxSpeed = 0

  private rest: PoseName = 'stand'
  private holdUntil = 0
  private now = 0
  private last = 0
  private raf = 0
  private scale = 1
  private reduced = false
  private mq: MediaQueryList | null = null
  private mqOn: (() => void) | null = null
  private alive = true

  onFrame?: (d: Director) => void

  constructor(stage: HTMLElement, host: HTMLElement, bubbleHost: HTMLElement) {
    this.stage = stage
    this.host = host
    this.reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    this.rig = new Rig({ reduced: this.reduced })

    const svg = this.rig.svg
    svg.removeAttribute('width')
    svg.removeAttribute('height')
    host.appendChild(svg)

    const el = document.createElement('div')
    el.className = 'bubble'
    el.setAttribute('aria-live', 'polite')
    const text = document.createElement('span')
    text.className = 'bubble__text'
    const caret = document.createElement('span')
    caret.className = 'bubble__caret'
    el.append(text, caret)
    bubbleHost.appendChild(el)
    el.style.opacity = '0'
    this.bubble = { el, text, caret, timer: 0, full: '', shown: 0, until: 0, visible: false }

    this.rig.setTarget(POSES.stand)
    this.measure()
  }

  /* ---------------------------------------------------------------- sizing */

  measure() {
    const h = this.host.clientHeight || 96
    this.scale = h / 186
  }

  /** character's height on screen, in px */
  get height() {
    return LEN.floor - LEN.crownY > 0 ? (LEN.floor - LEN.crownY) * this.scale : 0
  }

  private place() {
    const w = this.host.clientWidth
    const h = this.host.clientHeight
    // the SVG viewBox is (-56 -96 112 186); feet sit at local y = LEN.floor
    const left = this.x - w / 2
    const top = this.y - h * ((96 + LEN.floor) / 186)
    this.host.style.transform = `translate3d(${left.toFixed(2)}px, ${top.toFixed(2)}px, 0)`
    this.rig.refs.facing.setAttribute(
      'transform',
      this.facing === 1 ? '' : 'scale(-1 1)',
    )
  }

  /** where the top of his head is, in stage px — used to anchor the bubble */
  headPoint() {
    const h = this.host.clientHeight
    const w = this.host.clientWidth
    const left = this.x - w / 2
    const top = this.y - h * ((96 + LEN.floor) / 186)
    const hy = this.rig.headWorld.y
    return { x: left + w / 2, y: top + h * ((96 + hy) / 186) }
  }

  /* -------------------------------------------------------------- movement */

  setGround(y: number) {
    this.y = y
  }

  /** jump to a spot with no walk */
  teleport(x: number, y?: number) {
    this.x = this.toX = x
    if (y !== undefined) this.y = y
    this.moving = false
    this.walkResolvers.forEach((r) => r())
    this.walkResolvers = []
    this.gait = 0
    this.pxSpeed = 0
    this.prevX = x
    this.rig.gait = 0
    this.rig.stride = 0
    this.place()
  }

  face(dir: Facing) {
    this.wantFacing = dir
  }

  /** walk to an x position; resolves when he arrives */
  walkTo(x: number, opts: { face?: Facing } = {}): Promise<void> {
    if (opts.face) this.wantFacing = opts.face
    this.toX = x
    if (this.reduced || Math.abs(x - this.x) < 1.5) {
      this.x = this.toX = x
      this.prevX = x
      this.pxSpeed = 0
      this.gait = 0
      this.rig.gait = 0
      this.rig.stride = 0
      this.place()
      return Promise.resolve()
    }
    if (this.x === this.toX && this.moving) return Promise.resolve()
    this.moving = true
    return new Promise((res) => this.walkResolvers.push(res))
  }

  get isWalking() {
    return this.moving
  }

  /* ------------------------------------------------------------------ acts */

  /** hold a pose until told otherwise */
  hold(name: PoseName) {
    this.rest = name
    this.holdUntil = Infinity
    this.rig.setTarget(POSES[name])
  }

  /** play a pose for a beat, then fall back to `fallback` (default: rest) */
  play(name: PoseName, ms = 700, fallback?: PoseName) {
    this.rig.setTarget(POSES[name])
    this.holdUntil = this.now + ms / 1000
    this._fallback = fallback
  }

  private _fallback: PoseName | undefined

  /** a short action, then back to whatever he was doing */
  act(name: PoseName, ms = 800) {
    this._fallback = this.rest
    this.rig.setTarget(POSES[name])
    this.holdUntil = this.now + ms / 1000
  }

  say(text: string, ms = 2600) {
    const b = this.bubble
    window.clearInterval(b.timer)
    b.full = text
    b.shown = 0
    b.visible = true
    b.el.style.opacity = '1'
    b.el.dataset.state = 'typing'
    b.timer = window.setInterval(() => {
      b.shown++
      b.text.textContent = text.slice(0, b.shown)
      if (b.shown >= text.length) {
        window.clearInterval(b.timer)
        b.el.dataset.state = 'done'
      }
    }, 22)
    b.until = this.now + ms / 1000 + text.length * 0.022
  }

  /** cancel any timed action or speech and settle back into the rest pose */
  calm() {
    this.hush()
    this.holdUntil = 0
    this._fallback = undefined
    this.rig.setTarget(POSES[this.rest])
  }

  hush() {
    const b = this.bubble
    window.clearInterval(b.timer)
    b.visible = false
    b.el.style.opacity = '0'
    b.el.dataset.state = ''
  }

  /** position the bubble over his head (or to the side when mirrored) */
  private placeBubble() {
    const b = this.bubble
    if (!b.visible) return
    const p = this.headPoint()
    const side = this.facing === 1 ? 1 : -1
    const w = b.el.offsetWidth || 120
    const x = clamp(p.x + side * 14 - (this.facing === 1 ? 0 : w), 12, this.stage.clientWidth - w - 12)
    b.el.style.transform = `translate3d(${x.toFixed(1)}px, ${(p.y - b.el.offsetHeight - 10).toFixed(1)}px, 0)`
  }

  /* ------------------------------------------------------------------ loop */

  start() {
    // honour a mid-session change to the motion preference
    if (typeof window.matchMedia === 'function') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
      const on = () => {
        this.reduced = mq.matches
        this.rig.reduced = mq.matches
      }
      mq.addEventListener('change', on)
      this.mq = mq
      this.mqOn = on
    }
    this.last = performance.now()
    const tick = (t: number) => {
      if (!this.alive) return
      const dt = Math.min((t - this.last) / 1000, 0.05)
      this.last = t
      this.now += dt
      this.update(dt)
      this.raf = requestAnimationFrame(tick)
    }
    this.raf = requestAnimationFrame(tick)
  }

  destroy() {
    this.alive = false
    if (this.mq && this.mqOn) this.mq.removeEventListener('change', this.mqOn)
    cancelAnimationFrame(this.raf)
    window.clearInterval(this.bubble.timer)
    this.rig.svg.remove()
    this.bubble.el.remove()
  }

  private update(dt: number) {
    // fall back to the resting pose when a timed action expires
    if (this.now >= this.holdUntil) {
      this.holdUntil = Infinity
      if (this._fallback) this.rig.setTarget(POSES[this._fallback])
      this._fallback = undefined
    }

    // walk
    const moved = this.x - this.prevX
    this.pxSpeed = damp(this.pxSpeed, Math.abs(moved) / Math.max(dt, 1e-3), 12, dt)
    this.prevX = this.x

    const dist = this.toX - this.x
    if (this.moving || Math.abs(dist) > 0.05) {
      const step = Math.sign(dist) * Math.min(Math.abs(dist), WALK_SPEED * dt)
      this.x += step
      this.moving = Math.abs(this.toX - this.x) > 0.6
      if (!this.moving) {
        this.walkResolvers.forEach((r) => r())
        this.walkResolvers = []
      }
      if (Math.abs(dist) > 2) this.wantFacing = dist > 0 ? 1 : -1
    }
    this.gait = damp(this.gait, clamp(this.pxSpeed / WALK_SPEED, 0, 1), 11, dt)
    this.rig.gait = this.gait
    // stride length that makes the planted foot stationary on the ground
    this.rig.stride = clamp(this.pxSpeed / this.scale / (4 * WALK_CADENCE), 0, 22)
    this.rig.walking = damp(this.rig.walking, this.moving && this.pxSpeed > 4 ? 1 : 0, 9, dt)
    this.rig.phase += dt * WALK_CADENCE * Math.PI * 2 * this.rig.walking

    // face — only flip once the turn is under way, so it reads as a turn
    if (this.wantFacing !== this.facing) {
      this.facing = this.wantFacing
    }

    this.rig.step(dt)
    this.place()
    this.placeBubble()
    this.onFrame?.(this)
  }

  /* ------------------------------------------------------------- scripting */

  wait(ms: number) {
    return new Promise((r) => setTimeout(r, this.reduced ? Math.min(ms, 120) : ms))
  }

  /** run a blocking script; results are dropped if the scene changes */
  async play_(fn: (d: Director) => Promise<void>) {
    try {
      await fn(this)
    } catch {
      /* scene changed under us */
    }
  }
}
