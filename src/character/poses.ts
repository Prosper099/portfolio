/**
 * Poses.
 *
 * A pose is a full description of the rig. The director damps every field
 * toward the active pose, so switching states is always a blend — there is no
 * code path that can snap a limb from one place to another.
 *
 * Hands and feet are stored as *targets* in the body's own space and solved
 * with 2-bone IK every frame. The solver clamps each target to the chain's real
 * reach, so a hand is always exactly one forearm away from its elbow.
 *
 * Arms are authored as (angle, distance) from the shoulder joint rather than
 * raw coordinates: 0° points forward, 90° points straight down, -90° is up.
 * Keeping the distance near the chain's full length (40) keeps elbows from
 * folding across the chest.
 */

import { LEN } from './parts'
import { RAD } from '../lib/math'

export type ArmCmd = { x: number; y: number; bend: 1 | -1; wrist: number }
export type LegCmd = { x: number; y: number; bend: 1 | -1; foot: number }
export type LapMode = 'none' | 'lap' | 'hand'

export type Pose = {
  lean: number
  bob: number
  stretch: number
  headRot: number
  headX: number
  headY: number
  lookX: number
  lookY: number
  eyeOpen: number
  browN: number
  browF: number
  browRaise: number
  mouthCurve: number
  mouthOpen: number
  mouthWidth: number
  armN: ArmCmd
  armF: ArmCmd
  legN: LegCmd
  legF: LegCmd
  lap: { mode: LapMode; x: number; y: number; rot: number; lid: number }
}

const REACH_ARM = LEN.upperArm + LEN.foreArm
const REACH_LEG = LEN.thigh + LEN.shin

/** hand target from an angle + distance off the shoulder */
const armAt = (deg: number, d: number, wrist = 0, side: 1 | -1 = 1): ArmCmd => ({
  x: (side < 0 ? -LEN.shoulderXF : LEN.shoulderX) + Math.cos(deg * RAD) * d,
  y: LEN.shoulderY + Math.sin(deg * RAD) * d,
  bend: 1,
  wrist,
})

/** foot target from an angle + distance off the hip */
const legAt = (deg: number, d: number, foot = 0, side: 1 | -1 = 1): LegCmd => ({
  x: LEN.hipX * side + Math.cos(deg * RAD) * d,
  y: Math.sin(deg * RAD) * d,
  bend: -1,
  foot,
})

/* the arm hangs: nearly straight, elbow just behind the shoulder line */
const ARM_DOWN_N = armAt(85, 38.5, 12)
const ARM_DOWN_F = armAt(96, 38, 8, -1)
/* legs: almost full extension, one foot a touch back */
const LEG_STAND_N = legAt(87, 65)
const LEG_STAND_F = legAt(93, 65, -2, -1)
/* seated: hips drop, knees forward, feet under them */
const SIT = { bob: 17, legN: legAt(60, 48, 7), legF: legAt(104, 48, 3, -1) }
const LAP_ON = { mode: 'lap' as const, x: 3, y: 2, rot: 19, lid: 100 }

export const REST: Pose = {
  lean: 1.5,
  bob: 0,
  stretch: 0,
  headRot: -1,
  headX: 0,
  headY: 0,
  lookX: 0.35,
  lookY: 0.1,
  eyeOpen: 1,
  browN: -3,
  browF: 3,
  browRaise: 0,
  mouthCurve: 0.35,
  mouthOpen: 0,
  mouthWidth: 2.7,
  armN: ARM_DOWN_N,
  armF: ARM_DOWN_F,
  legN: LEG_STAND_N,
  legF: LEG_STAND_F,
  lap: { mode: 'none', x: 0, y: 0, rot: 0, lid: 0 },
}

const from = (over: Partial<Pose>): Pose => {
  const p = REST
  const out = { ...p, ...over } as Pose
  out.armN = { ...p.armN, ...(over.armN ?? {}) }
  out.armF = { ...p.armF, ...(over.armF ?? {}) }
  out.legN = { ...p.legN, ...(over.legN ?? {}) }
  out.legF = { ...p.legF, ...(over.legF ?? {}) }
  out.lap = { ...p.lap, ...(over.lap ?? {}) }
  return out
}

export const POSES = {
  /** standing, weight settled, easy half-smile */
  stand: from({}),

  /** chin up, following something drifting past */
  lookUp: from({
    headRot: -18,
    lookX: 0.15,
    lookY: -0.95,
    mouthCurve: 0.5,
    mouthOpen: 0.24,
    browN: -8,
    browF: 8,
    headX: 0.8,
  }),

  /** a small wave, elbow out */
  wave: from({
    headRot: -4,
    mouthCurve: 0.9,
    mouthOpen: 0.34,
    eyeOpen: 0.68,
    browN: -7,
    browF: 7,
    armN: armAt(-70, 34, -22),
  }),

  /** arm thrown properly up — a real hello */
  waveHigh: from({
    headRot: -2,
    mouthCurve: 1,
    mouthOpen: 0.44,
    eyeOpen: 0.6,
    browN: -10,
    browF: 10,
    armN: armAt(-84, REACH_ARM - 2, -34),
  }),

  /** both arms up on tiptoe, straining for something out of reach */
  reach: from({
    lean: -2,
    stretch: 1,
    headRot: -20,
    lookX: 0.25,
    lookY: -1,
    eyeOpen: 0.5,
    mouthCurve: -0.2,
    mouthOpen: 0.55,
    browN: -14,
    browF: 14,
    armN: armAt(-82, REACH_ARM - 1.5, -6),
    armF: armAt(-93, REACH_ARM - 5, -6, -1),
    legN: legAt(84, 61, 17),
    legF: legAt(96, 62, 21, -1),
  }),

  /** giving up — shoulders drop, turns to the visitor */
  shrug: from({
    lean: 0.5,
    headRot: 4,
    lookX: 0.85,
    lookY: 0.15,
    browN: 3,
    browF: -9,
    mouthCurve: 0.1,
    mouthOpen: 0.2,
    armN: armAt(74, 33, 30),
    armF: armAt(102, 33, 26, -1),
  }),

  /** pointing off to the right */
  point: from({
    headRot: -3,
    lookX: 0.9,
    lookY: -0.1,
    mouthCurve: 0.6,
    mouthOpen: 0.26,
    browN: -6,
    browF: 6,
    armN: armAt(-14, REACH_ARM - 2, -3),
  }),

  /** pointing up and to the right */
  pointUp: from({
    headRot: -15,
    lookX: 0.35,
    lookY: -0.9,
    mouthCurve: 0.55,
    mouthOpen: 0.32,
    browN: -9,
    browF: 9,
    armN: armAt(-62, 34, -26),
  }),

  /** presenting something with both hands, faintly theatrical */
  present: from({
    lean: -1,
    headRot: -2,
    lookX: 0.65,
    mouthCurve: 0.75,
    mouthOpen: 0.32,
    browN: -7,
    browF: 7,
    armN: armAt(-18, 33, -20),
    armF: armAt(-30, 30, -16, -1),
  }),

  /** quietly pleased with himself */
  proud: from({
    lean: -2.5,
    headRot: -9,
    headY: -0.6,
    lookX: 0.15,
    lookY: -0.4,
    eyeOpen: 0.8,
    browN: -10,
    browF: 10,
    mouthCurve: 0.85,
    armN: armAt(74, 33, 18),
    armF: armAt(106, 33, 14, -1),
  }),

  /** one brow up — genuinely puzzled */
  confused: from({
    lean: 2.5,
    headRot: 8,
    lookX: 0.6,
    lookY: 0.3,
    browN: -15,
    browF: 11,
    mouthCurve: -0.3,
    mouthOpen: 0.12,
    mouthWidth: 2.2,
    armN: armAt(80, 36, 16),
    armF: armAt(64, 30, 40, -1),
  }),

  /** caught off guard */
  surprised: from({
    lean: -1,
    stretch: 0.3,
    headRot: -5,
    headY: -1,
    eyeOpen: 1.12,
    browN: -17,
    browF: 17,
    mouthCurve: 0,
    mouthOpen: 0.55,
    mouthWidth: 3,
    armN: armAt(56, 33, 24),
    armF: armAt(120, 33, 20, -1),
  }),

  /** a hop of excitement */
  excited: from({
    lean: -3,
    stretch: 0.45,
    headRot: -7,
    eyeOpen: 0.62,
    browN: -11,
    browF: 11,
    mouthCurve: 1,
    mouthOpen: 0.6,
    armN: armAt(-52, 32, -26),
    armF: armAt(66, 32, -22, -1),
  }),

  /** absorbed in something, head down */
  think: from({
    lean: 7,
    headRot: 13,
    lookX: -0.15,
    lookY: -0.4,
    eyeOpen: 0.5,
    browN: -5,
    browF: 13,
    mouthCurve: -0.15,
    armN: armAt(80, 37, 18),
    armF: armAt(100, 36, 12, -1),
  }),

  /** a beat of stillness between two actions */
  still: from({
    headRot: 0,
    lookX: 0.5,
    mouthCurve: 0.25,
    armN: ARM_DOWN_N,
    armF: ARM_DOWN_F,
  }),

  /* ---------------- seated ---------------- */
  sitType: from({
    ...SIT,
    lean: 9,
    headRot: 8,
    lookX: 0.1,
    lookY: 0.4,
    eyeOpen: 0.78,
    mouthCurve: 0.25,
    armN: armAt(66, 33, 16),
    armF: armAt(100, 31, 14, -1),
    lap: LAP_ON,
  }),

  sitLook: from({
    ...SIT,
    lean: 6,
    headRot: -7,
    lookX: 0.9,
    lookY: 0.1,
    eyeOpen: 0.92,
    mouthCurve: 0.8,
    mouthOpen: 0.36,
    browN: -5,
    browF: 5,
    armN: armAt(70, 32, 18),
    armF: armAt(102, 30, 14, -1),
    lap: LAP_ON,
  }),

  sitWave: from({
    ...SIT,
    lean: 6,
    headRot: -3,
    eyeOpen: 0.66,
    mouthCurve: 0.95,
    mouthOpen: 0.42,
    browN: -8,
    browF: 8,
    armN: armAt(-68, 33, -26),
    armF: armAt(102, 30, 14, -1),
    lap: LAP_ON,
  }),

  sitRest: from({
    bob: 19,
    lean: 3,
    headRot: 0,
    lookX: 0.5,
    mouthCurve: 0.4,
    legN: legAt(66, 46, 11),
    legF: legAt(108, 46, 6, -1),
    armN: armAt(74, 31, 26),
    armF: armAt(104, 31, 22, -1),
  }),

  /* ---------------- with the laptop ---------------- */
  /** standing, laptop shut, tucked against his side */
  carry: from({
    lean: 2,
    headRot: -2,
    lookX: 0.6,
    mouthCurve: 0.6,
    mouthOpen: 0.22,
    browN: -5,
    browF: 5,
    armN: armAt(84, 38, 6),
    armF: ARM_DOWN_F,
    lap: { mode: 'hand', x: 0, y: 0, rot: 97, lid: 0 },
  }),

  /** crouching to set it down */
  plant: from({
    lean: 17,
    bob: 10,
    headRot: 15,
    lookX: 0.1,
    lookY: 0.75,
    browN: 2,
    browF: 9,
    mouthCurve: 0.2,
    legN: legAt(78, 54, 2),
    legF: legAt(102, 54, -5, -1),
    armN: armAt(70, 34, 14),
    armF: armAt(100, 34, 10, -1),
    lap: { mode: 'hand', x: 0, y: 0, rot: 46, lid: 0 },
  }),

  /** leaning in over the keyboard */
  leanIn: from({
    lean: 16,
    bob: 5,
    headRot: 11,
    lookX: 0.2,
    lookY: 0.45,
    eyeOpen: 0.55,
    browN: -7,
    browF: 9,
    mouthCurve: 0.15,
    legN: legAt(84, 59, 5),
    legF: legAt(98, 59, -2, -1),
    armN: armAt(64, 32, 12),
    armF: armAt(102, 32, 10, -1),
  }),
} satisfies Record<string, Pose>

export type PoseName = keyof typeof POSES
export { REACH_ARM, REACH_LEG }
