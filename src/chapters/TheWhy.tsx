import { useEffect, useRef, useState } from 'react'
import { useDirector } from '../character/context'
import { notes, statement, lines } from '../data/site'

export default function TheWhy() {
  const d = useDirector()
  const [open, setOpen] = useState<string | null>(null)
  const ran = useRef(false)
  const stage = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    const script = async () => {
      d.face(1)
      d.teleport(window.innerWidth * 0.12, window.innerHeight * 0.9)
      d.hold('still')
      await d.walkTo(window.innerWidth * 0.3)
      d.act('lookUp', 1600)
      await d.wait(500)
      d.say(lines.whyIntro, 2000)
      await d.wait(2600)
      d.hold('stand')
    }
    d.play_(script)
  }, [d])

  const select = async (id: string) => {
    const same = open === id
    setOpen(same ? null : id)
    if (same) {
      d.hold('stand')
      return
    }
    const el = stage.current?.querySelector<HTMLElement>(`[data-note="${id}"]`)
    const r = el?.getBoundingClientRect()
    if (r) {
      await d.walkTo(r.left + Math.min(r.width * 0.5, 210) - 24, { face: 1 })
    }
    d.act('pointUp', 1200)
  }

  return (
    <div className="ch ch--why" ref={stage}>
      <header className="anim ch__head" style={{ '--d': '60ms' } as React.CSSProperties}>
        <span className="eyebrow">02 — The why</span>
        <span className="eyebrow">{notes.length} notes pinned</span>
      </header>

      <div className={`why__statement${open ? ' is-dimmed' : ''}`}>
        <p className="serif why__lead">
          {statement.lead}
          <br />
          <em className="serif-i why__tail">{statement.tail}</em>
        </p>
      </div>

      <ul className="why__notes">
        {notes.map((n, i) => {
          const isOpen = open === n.id
          return (
            <li
              key={n.id}
              className="why__note"
              data-note={n.id}
              style={{ '--d': `${140 + i * 70}ms` } as React.CSSProperties}
            >
              <button
                className={`pin${isOpen ? ' is-open' : ''}`}
                onClick={() => select(n.id)}
                aria-expanded={isOpen}
                aria-controls={`note-${n.id}`}
              >
                <span className="pin__dot" aria-hidden="true" />
                <span className="pin__n">{String(i + 1).padStart(2, '0')}</span>
                <span className="pin__label">{n.label}</span>
                <span className="pin__sign" aria-hidden="true">
                  {isOpen ? '−' : '+'}
                </span>
              </button>
              <svg className="why__leader" aria-hidden="true" preserveAspectRatio="none">
                <line x1="0" y1="0" x2="100%" y2="0" />
              </svg>
            </li>
          )
        })}
      </ul>

      <div className={`why__panel${open ? ' is-open' : ''}`} role="region" aria-live="polite">
        {open ? (
          (() => {
            const n = notes.find((x) => x.id === open)!
            return (
              <div className="why__panel-inner" id={`note-${n.id}`}>
                <span className="eyebrow">{n.label}</span>
                <p className="serif why__kicker">{n.kicker}</p>
                {n.body.map((p) => (
                  <p key={p} className="why__body">
                    {p}
                  </p>
                ))}
              </div>
            )
          })()
        ) : (
          <p className="why__hint eyebrow">Pick a note — or just read it as it is.</p>
        )}
      </div>
    </div>
  )
}
