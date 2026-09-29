import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Director } from './character/director'
import { DirectorCtx, useReducedMotion } from './character/context'
import StartHere from './chapters/StartHere'
import TheWhy from './chapters/TheWhy'
import TheWork from './chapters/TheWork'
import TheMethod from './chapters/TheMethod'
import LetsBuild from './chapters/LetsBuild'
import { chapters, lines, type ChapterId } from './data/site'

const DARK: ChapterId[] = ['work']

export default function App() {
  const stageRef = useRef<HTMLDivElement>(null)
  const charRef = useRef<HTMLDivElement>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const dRef = useRef<Director | null>(null)
  const [d, setD] = useState<Director | null>(null)

  const [chapter, setChapter] = useState<ChapterId>('start')
  const [visit, setVisit] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'in' | 'out'>('idle')
  const [wiping, setWiping] = useState(false)
  const [opening, setOpening] = useState(false)
  const [entered, setEntered] = useState(false)
  const busy = useRef(false)
  const reduce = useReducedMotion()

  /* ------------------------------------------------ mount the character */
  useLayoutEffect(() => {
    if (!stageRef.current || !charRef.current || !bubbleRef.current) return
    const dir = new Director(stageRef.current, charRef.current, bubbleRef.current)
    dRef.current = dir
    setD(dir)
    dir.start()
    dir.measure()
    const onResize = () => dir.measure()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      dir.destroy()
      dRef.current = null
      setD(null)
    }
  }, [])

  /* ---------------------------------------------------------- navigation */
  const go = useCallback(
    async (next: ChapterId, unlock = false) => {
      const dir = dRef.current
      if (!unlock && busy.current) return
      if (next === chapter) {
        busy.current = false
        return
      }
      busy.current = true
      dir?.calm()
      if (reduce) {
        // no plane sweep for anyone who asked for less motion — just swap
        setChapter(next)
        setVisit((v) => v + 1)
        busy.current = false
        return
      }
      await new Promise((r) => requestAnimationFrame(() => r(null)))
      setWiping(true)
      setPhase('in')
      await new Promise((r) => setTimeout(r, 380))
      setChapter(next)
      setVisit((v) => v + 1)
      await new Promise((r) => setTimeout(r, 30))
      setPhase('out')
      await new Promise((r) => setTimeout(r, 640))
      setPhase('idle')
      setWiping(false)
      busy.current = false
    },
    [chapter, reduce],
  )

  /* ------------------------------------------------- the opening sequence */
  const enterWorld = useCallback(async () => {
    const d = dRef.current
    if (!d || busy.current) return
    busy.current = true
    setOpening(true)
    setEntered(true)
    d.hush()

    d.act('surprised', 340)
    await d.wait(230)
    d.act('excited', 420)
    d.say(lines.react, 1400)
    await d.wait(420)
    d.hold('sitRest')
    await d.wait(220)
    d.hold('carry') // stands, laptop shut, tucked under one arm
    await d.wait(520)
    await d.walkTo(window.innerWidth * 0.5, { face: 1 })
    d.hold('stand')
    d.act('waveHigh', 820)
    d.say(lines.invite, 1800)
    await d.wait(880)
    d.hold('present')
    await d.wait(520)
    // `unlock` hands the navigation lock straight over to the transition
    await go('why', true)
    busy.current = false
  }, [go])

  /* ------------------------------------------------------------- keyboard */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      const i = chapters.findIndex((c) => c.id === chapter)
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault()
        void go(chapters[Math.min(i + 1, chapters.length - 1)].id)
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        void go(chapters[Math.max(i - 1, 0)].id)
      } else if (/^[1-5]$/.test(e.key)) {
        void go(chapters[Number(e.key) - 1].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [chapter, go])

  /* ------------------------------------------------------------------ view */
  const theme = DARK.includes(chapter) ? 'dark' : 'light'
  const idx = chapters.findIndex((c) => c.id === chapter)

  return (
    <DirectorCtx.Provider value={d}>
      <div className="stage" data-theme={theme} ref={stageRef}>
        <div className="grain" aria-hidden="true" />

        {d && (
          <div className="stage__layer is-only" data-active="true" data-leaving="false">
            {chapter === 'start' && <StartHere key={`start-${visit}`} onEnter={enterWorld} opening={opening} entered={entered} />}
            {chapter === 'why' && <TheWhy key={`why-${visit}`} />}
            {chapter === 'work' && <TheWork key={`work-${visit}`} />}
            {chapter === 'method' && <TheMethod key={`method-${visit}`} />}
            {chapter === 'build' && <LetsBuild key={`build-${visit}`} />}
          </div>
        )}

        {/* character */}
        <div className="actor" aria-hidden="true">
          <div className="actor__scale">
            <div className="actor__box" ref={charRef} />
            <div className="bubbles" ref={bubbleRef} />
          </div>
        </div>

        {/* chapter wipe — a cobalt plane that covers, swaps, then uncovers */}
        {wiping && (
          <div
            className="wipe"
            data-state={phase}
            style={{ clipPath: phase === 'in' ? 'inset(0 0 0 0)' : 'inset(0 0 0 100%)' }}
          />
        )}

        {/* chrome */}
        <nav className="rail" aria-label="Chapters">
          <ol className="rail__list">
            {chapters.map((c, i) => (
              <li key={c.id} className={`rail__item${i === idx ? ' is-active' : ''}${i < idx ? ' is-past' : ''}`}>
                <button onClick={() => void go(c.id)} aria-current={i === idx ? 'step' : undefined}>
                  <span className="rail__n">{c.index}</span>
                  <span className="rail__t">{c.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className="pager">
          <button
            className="pager__btn"
            onClick={() => void go(chapters[Math.max(idx - 1, 0)].id)}
            disabled={idx === 0}
            aria-label="Previous chapter"
          >
            ←
          </button>
          <span className="pager__count eyebrow">
            {chapters[idx].index} / {String(chapters.length).padStart(2, '0')}
          </span>
          <button
            className="pager__btn"
            onClick={() => void go(chapters[Math.min(idx + 1, chapters.length - 1)].id)}
            disabled={idx === chapters.length - 1}
            aria-label="Next chapter"
          >
            →
          </button>
        </div>
      </div>
    </DirectorCtx.Provider>
  )
}
