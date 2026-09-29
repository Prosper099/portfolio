/**
 * All copy lives here. Swap these values and the whole site follows.
 * The project entries are written as real, complete case-study content so the
 * layout can be judged honestly — replace them with your own work.
 */

export const person = {
  first: 'Prosper',
  last: 'Ndubuizu',
  role: ['Product thinker.', 'Builder.', 'Problem solver.'],
  email: 'hello@prosperndubuizu.com',
  location: 'Lagos, NG',
  available: 'Open to product work, 2026',
  links: [
    { label: 'Email', value: 'hello@prosperndubuizu.com', href: 'mailto:hello@prosperndubuizu.com' },
    { label: 'LinkedIn', value: '/in/prosperndubuizu', href: 'https://linkedin.com/in/prosperndubuizu' },
    { label: 'Resume', value: 'PDF · 214 KB', href: '/resume.pdf' },
    { label: 'GitHub', value: '/prosperndubuizu', href: 'https://github.com/prosperndubuizu' },
  ],
  social: [
    { label: 'LinkedIn', href: 'https://linkedin.com/in/prosperndubuizu' },
    { label: 'GitHub', href: 'https://github.com/prosperndubuizu' },
    { label: 'Read.cv', href: 'https://read.cv' },
  ],
}

export type ChapterId = 'start' | 'why' | 'work' | 'method' | 'build'

export const chapters: { id: ChapterId; index: string; title: string; sub: string }[] = [
  { id: 'start', index: '01', title: 'Start Here', sub: 'Come in.' },
  { id: 'why', index: '02', title: 'The Why', sub: 'What I care about.' },
  { id: 'work', index: '03', title: 'The Work', sub: 'Selected projects.' },
  { id: 'method', index: '04', title: 'The Method', sub: 'How I get there.' },
  { id: 'build', index: '05', title: "Let's Build", sub: 'Your move.' },
]

/* ---------------------------------------------------------------- 02 — why */

export type Note = {
  id: string
  label: string
  kicker: string
  body: string[]
  /** rough placement inside the chapter, in % of the stage */
  at: { x: number; y: number }
}

export const statement = {
  lead: 'I like finding the confusing part',
  tail: 'and making it make sense.',
}

export const notes: Note[] = [
  {
    id: 'who',
    label: 'Who I am',
    kicker: 'A product designer who thinks like an engineer and argues like a researcher.',
    body: [
      'I am Prosper Ndubuizu. I design and ship software products — mostly the unglamorous middle of a project, where the brief is still fuzzy and the answer is not obvious.',
      'I work best with teams who have a real problem and a real deadline, and who would rather hear a useful no than a polite yes.',
    ],
    at: { x: 20, y: 63 },
  },
  {
    id: 'what',
    label: 'What I do',
    kicker: 'Product design, discovery, and the unglamorous work of getting things shipped.',
    body: [
      'Discovery and framing: talking to users, reading the data, and deciding what is actually worth building.',
      'Interaction and interface design: flows, systems, and the thousand small decisions that make software feel considered.',
      'Prototyping early enough to be wrong, and shipping carefully enough that being wrong is cheap.',
    ],
    at: { x: 41, y: 27 },
  },
  {
    id: 'shaped',
    label: 'What shaped me',
    kicker: 'Small systems, tight constraints, and people who expected more.',
    body: [
      'I grew up fixing things — bikes, radios, other people\'s projects. That is still roughly the job, just with more stakeholders.',
      'Most of what I know came from being wrong in public, on time, with a deadline attached.',
    ],
    at: { x: 66, y: 56 },
  },
  {
    id: 'how',
    label: 'How I think',
    kicker: 'Find the constraint. Name it out loud. Then make the smallest thing that tests it.',
    body: [
      'I start by trying to be wrong. If a cheap artefact can kill the idea in a week, it should.',
      'I write things down. Ambiguity hides in documents nobody argues with.',
      'I would rather ship something slightly wrong this month than something perfect in six.',
    ],
    at: { x: 82, y: 30 },
  },
  {
    id: 'care',
    label: 'What I care about',
    kicker: 'Clarity, access, and software that respects the person using it.',
    body: [
      'Clarity over cleverness. A screen should explain itself before it impresses anyone.',
      'Access is a feature, not a phase. Keyboard paths, contrast, and error states are product decisions.',
      'Software that respects people — their time, their attention, and their data — is the whole job.',
    ],
    at: { x: 30, y: 84 },
  },
]

/* ---------------------------------------------------------------- 03 — work */

export type Project = {
  id: string
  index: string
  name: string
  category: string
  year: string
  role: string
  /** the object's look on the page */
  artefact: 'fold' | 'screen' | 'diagram' | 'stack'
  /** rough placement inside the chapter, in % of the stage */
  at: { x: number; y: number }
  /** the height as a % of the stage height */
  h: number
  lede: string
  roleBlurb: string
  problem: string[]
  approach: { label: string; text: string }[]
  outcome: string[]
  metrics: { value: string; label: string }[]
}

export const projects: Project[] = [
  {
    id: 'atlas',
    index: '01',
    name: 'Atlas',
    category: 'Logistics · Platform',
    year: '2025',
    role: 'Lead product designer',
    artefact: 'fold',
    at: { x: 33, y: 46 },
    h: 46,
    lede: 'A dispatch console for a fleet that never stopped moving and a team that never had a clear picture of it.',
    roleBlurb:
      'I owned discovery and the core console: the live map, the exception queue, and the shift handover that tied them together.',
    problem: [
      'Dispatchers were running the business from three tools and a whiteboard. Every disruption cost the same first ten minutes: figuring out what actually changed.',
      'The data was good. The problem was that it arrived in a shape built for reporting, not for deciding.',
    ],
    approach: [
      { label: 'Framing', text: 'Two weeks shadowing three shifts. The real unit of work was not a delivery — it was an exception.' },
      { label: 'Structure', text: 'Rebuilt the console around a single ranked exception queue, with the map as context rather than the interface.' },
      { label: 'Testing', text: 'Weekly paper prototypes with live dispatchers until the queue order stopped needing explanation.' },
    ],
    outcome: [
      'The whiteboard came down in week six. Median time-to-dispatch for a new exception dropped from eleven minutes to under four.',
      'Shift handover became a written artefact instead of a conversation, which turned out to matter more than the queue itself.',
    ],
    metrics: [
      { value: '−64%', label: 'time to dispatch' },
      { value: '3→1', label: 'tools per dispatcher' },
      { value: '11k', label: 'users at rollout' },
    ],
  },
  {
    id: 'signal',
    index: '02',
    name: 'Signal',
    category: 'Fintech · Mobile',
    year: '2024',
    role: 'Product designer',
    artefact: 'screen',
    at: { x: 63, y: 40 },
    h: 54,
    lede: 'A spending app for people whose income does not arrive on the same day every month.',
    roleBlurb:
      'I designed the cash-flow model, the onboarding, and the notification system — the three places this product lives or dies.',
    problem: [
      'Most budgeting apps assume a monthly salary. Ours assumed nothing, and paid for it: the first session was a wall of setup and the second was a wall of shame.',
      'The product was technically correct and emotionally brutal.',
    ],
    approach: [
      { label: 'Research', text: 'Diary studies with 24 people on irregular income. The pattern was not discipline — it was timing.' },
      { label: 'Model', text: 'Replaced the budget with a rolling fourteen-day cash position that updates itself from transactions.' },
      { label: 'Voice', text: 'Rewrote every string to describe a situation rather than a failure. No red, no shame, no "overspent".' },
    ],
    outcome: [
      'Onboarding completion went from 38% to 81% in the first release.',
      'Week-four retention roughly doubled, driven almost entirely by the notification copy.',
    ],
    metrics: [
      { value: '+43pt', label: 'onboarding completion' },
      { value: '2.1×', label: 'week-4 retention' },
      { value: '4.8★', label: 'app store, 2.3k reviews' },
    ],
  },
  {
    id: 'relay',
    index: '03',
    name: 'Relay',
    category: 'Developer tool · Web',
    year: '2024',
    role: 'Founding designer',
    artefact: 'diagram',
    at: { x: 22, y: 72 },
    h: 40,
    lede: 'A deployment pipeline you can read. Built for teams of eleven, not eleven thousand.',
    roleBlurb:
      'Everything: the visual pipeline model, the YAML schema, the docs, and the mascot that eventually became this character.',
    problem: [
      'CI configuration had become folklore. New engineers needed a week to make their first safe deploy, and the pipeline graph nobody could explain.',
      'The incumbents were excellent at scale and actively hostile to small teams.',
    ],
    approach: [
      { label: 'Metaphor', text: 'Made the pipeline a first-class object — draggable, inspectable, diffable — instead of a log you scroll.' },
      { label: 'Schema', text: 'Twelve lines of configuration. Invalid states are unrepresentable rather than merely warned about.' },
      { label: 'Docs', text: 'Wrote the docs as a tutorial that actually runs. Every snippet is executed in CI.' },
    ],
    outcome: [
      'Time to first deploy dropped from days to under an hour for new engineers.',
      'The visual model became the thing the team screenshot into planning docs, which was not the plan but was fine.',
    ],
    metrics: [
      { value: '<1h', label: 'first deploy' },
      { value: '12', label: 'lines of config' },
      { value: '1.8k', label: 'GitHub stars' },
    ],
  },
  {
    id: 'quiet',
    index: '04',
    name: 'Quiet Hours',
    category: 'Experiment · Wellbeing',
    year: '2023',
    role: 'Solo',
    artefact: 'stack',
    at: { x: 79, y: 68 },
    h: 38,
    lede: 'A small, deliberately limited app that silences a phone for three hours and gets out of the way.',
    roleBlurb: 'Research, product, brand, and code. Built because I needed it and could not find it.',
    problem: [
      'Focus apps are all dashboards. They give you a score, a streak, and a chart of your own avoidance.',
      'I wanted a switch, not a scoreboard.',
    ],
    approach: [
      { label: 'Constraint', text: 'One screen. One number. No streaks, no graphs, no account.' },
      { label: 'Craft', text: 'The whole interface is a single arc that fills. It ends by itself.' },
      { label: 'Stop', text: 'Shipped, wrote about it, and stopped. No roadmap.' },
    ],
    outcome: [
      'A few thousand people use it. It has never asked me for anything, which is the entire point.',
    ],
    metrics: [
      { value: '1', label: 'screen' },
      { value: '0', label: 'notifications' },
      { value: '3h', label: 'default quiet' },
    ],
  },
]

/* -------------------------------------------------------------- 04 — method */

export type Step = {
  n: string
  name: string
  gloss: string
  body: string
}

export const method: Step[] = [
  {
    n: '01',
    name: 'Understand',
    gloss: 'Before anything is designed.',
    body: 'Read the support tickets. Sit with the people using it. Find the sentence they use that the product does not. I am looking for the problem in their words, not the one in the brief.',
  },
  {
    n: '02',
    name: 'Frame',
    gloss: 'Say what we are actually doing.',
    body: 'Write the problem down in a sentence a stranger could check. If we cannot agree on that sentence, no amount of design will save us. Most projects are saved or lost here.',
  },
  {
    n: '03',
    name: 'Explore',
    gloss: 'Make the cheap wrong things.',
    body: 'Three directions, none of them precious. Rough on purpose — a finished-looking option gets defended, and a rough one gets criticised, which is what I want.',
  },
  {
    n: '04',
    name: 'Test',
    gloss: 'Find out while it is still cheap.',
    body: 'Weekly sessions with real people. I watch, I do not pitch. The moment someone invents a use I did not design for is the moment we are closest to right.',
  },
  {
    n: '05',
    name: 'Refine',
    gloss: 'Then, and only then, make it good.',
    body: 'Typography, motion, empty states, error copy, the keyboard path nobody will mention in the kickoff. This is the part that makes people trust the product enough to keep using it.',
  },
]

export const principles = [
  {
    k: 'Clarity beats cleverness',
    v: 'If a screen needs a tooltip to explain itself, the screen is wrong. Not the user.',
  },
  {
    k: 'Ship the wrong thing early',
    v: 'A bad idea found in a week is a win. A good idea found in six months is a story about a good idea.',
  },
  {
    k: 'Details are the product',
    v: 'Nobody compliments the loading state. They do notice it was missing.',
  },
]

/* -------------------------------------------------------------------- copy */

export const lines = {
  hello: 'Hi. I’m Prosper.',
  idle: 'Working on something. One sec.',
  react: 'Oh — you’re here.',
  invite: 'This way.',
  follow: 'Come on, I’ll show you around.',
  enter: 'Step inside',
  reachFail: 'I’m not tall enough for this one.',
  reachOk: 'You take it from here.',
  proud: 'Okay, this one is actually good.',
  whyIntro: 'Start anywhere.',
  methodIntro: 'This is the boring part. It is also the part that works.',
  buildIntro: 'Your move.',
  waveBye: 'See you around.',
}
