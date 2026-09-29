/* Small math toolkit for the rig. Everything is frame-rate independent. */

export const TAU = Math.PI * 2
export const DEG = 180 / Math.PI
export const RAD = Math.PI / 180

export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const invLerp = (a: number, b: number, v: number) => (b === a ? 0 : (v - a) / (b - a))
export const mix = (a: number, b: number, t: number) => a + (b - a) * clamp(t, 0, 1)

export function smoothstep(t: number) {
  const x = clamp(t, 0, 1)
  return x * x * (3 - 2 * x)
}
export function easeOutCubic(t: number) {
  const x = clamp(t, 0, 1)
  return 1 - Math.pow(1 - x, 3)
}
export function easeInOutCubic(t: number) {
  const x = clamp(t, 0, 1)
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}
export function easeOutBack(t: number) {
  const c1 = 1.70158
  const c3 = c1 + 1
  const x = clamp(t, 0, 1)
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}

/**
 * Exponential damping toward a target. `rate` is roughly "how many e-foldings
 * per second" — higher = snappier. This is what keeps every joint in the rig
 * from ever snapping or overshooting into a broken pose.
 */
export function damp(current: number, target: number, rate: number, dt: number) {
  return lerp(current, target, 1 - Math.exp(-rate * dt))
}

/** Damping for angles, taking the short way around the circle. */
export function dampAngle(current: number, target: number, rate: number, dt: number) {
  let d = (target - current) % TAU
  if (d > Math.PI) d -= TAU
  if (d < -Math.PI) d += TAU
  return current + d * (1 - Math.exp(-rate * dt))
}

/** Deterministic-ish pseudo random in [0,1). */
export function rnd(seed: number) {
  const x = Math.sin(seed * 127.1) * 43758.5453
  return x - Math.floor(x)
}

/** Cheap 1D value noise for organic idle motion. */
export function noise1(t: number, seed = 0) {
  const i = Math.floor(t)
  const f = t - i
  const a = rnd(i + seed * 57.3)
  const b = rnd(i + 1 + seed * 57.3)
  return lerp(a, b, smoothstep(f))
}

export type Vec2 = { x: number; y: number }

export const v = (x = 0, y = 0): Vec2 => ({ x, y })
export const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(bx - ax, by - ay)

/**
 * Two-bone IK.
 *
 * Returns the joint angles (degrees) for a chain rooted at (sx, sy) reaching
 * for (tx, ty). `bend` picks the elbow/knee side (+1 / -1).
 *
 * The target is *always* clamped into the annulus the chain can actually
 * reach, so a hand can never fly off, stretch rubber-band style, or invert.
 * That clamp is the single most important reason the hands read as attached.
 */
export function ik2(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  l1: number,
  l2: number,
  bend: number,
) {
  let dx = tx - sx
  let dy = ty - sy
  let d = Math.hypot(dx, dy)
  if (d < 1e-4) {
    dx = 1e-4
    d = 1e-4
  }
  const dMax = (l1 + l2) * 0.999
  const dMin = Math.abs(l1 - l2) + 0.0001
  d = clamp(d, dMin, dMax)
  // keep the original direction
  const ux = dx / Math.hypot(dx, dy)
  const uy = dy / Math.hypot(dx, dy)

  // angle at the root between the root->target line and the first bone
  const cosA = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)
  const a = Math.acos(cosA)
  const base = Math.atan2(uy, ux) * DEG
  const upper = base + a * DEG * bend
  // world angle of the second bone
  const ex = sx + Math.cos(upper * RAD) * l1
  const ey = sy + Math.sin(upper * RAD) * l1
  const lower = Math.atan2(ty - ey, tx - ex) * DEG

  return {
    upper,
    lower: lower - upper, // local rotation of the child bone
    endX: ex,
    endY: ey,
    reached: Math.hypot(tx - ex, ty - ey) <= l2 + 0.01,
  }
}

/** Point on a rotated local coordinate. */
export function rot2(x: number, y: number, deg: number): Vec2 {
  const a = deg * RAD
  const c = Math.cos(a)
  const s = Math.sin(a)
  return { x: x * c - y * s, y: x * s + y * c }
}

/** Rounded / 2 = 0 decimals. Keeps transform strings short. */
export const r2 = (n: number) => Math.round(n * 100) / 100
export const r3 = (n: number) => Math.round(n * 1000) / 1000
