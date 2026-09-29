import { useEffect, useRef } from 'react'
import { useDirector } from '../character/context'
import { person, lines } from '../data/site'

type Props = { onEnter: () => void; opening: boolean; entered: boolean }

export default function StartHere({ onEnter, opening, entered }: Props) {
  const d = useDirector()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    let dead = false
    const script = async () => {
      d.face(1)
      d.teleport(window.innerWidth * 0.845, window.innerHeight * 0.845)
      d.hold('sitType')
      await d.wait(420)
      if (dead) return
      d.act('sitLook', 2600)
      d.say(lines.hello, 2400)
      await d.wait(3400)
      if (dead || opening) return
      d.hold('sitType')
    }
    d.play_(script)
    return () => {
      dead = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="ch ch--start">
      <div className="start__rule start__rule--top" />
      <div className="start__rule start__rule--base" />

      <header className="anim" style={{ '--d': '80ms' } as React.CSSProperties}>
        <span className="eyebrow">01 — Start here</span>
        <span className="eyebrow start__stamp">{person.location} · {person.available}</span>
      </header>

      <div className="start__body">
        <h1
          className={`start__name display${opening ? ' is-open' : ''}`}
          style={{ '--d': '160ms' } as React.CSSProperties}
        >
          <span className="start__word">{person.first}</span>
          <span className="start__word">{person.last}</span>
        </h1>

        <p
          className={`start__role${opening ? ' is-open' : ''}`}
          style={{ '--d': '260ms' } as React.CSSProperties}
        >
          {person.role.map((r) => (
            <span key={r} className="start__role-word">
              {r}
            </span>
          ))}
        </p>
      </div>

      <div className="start__foot" style={{ '--d': '420ms' } as React.CSSProperties}>
        <button
          className="enter"
          onClick={onEnter}
          disabled={entered}
          aria-label="Step inside and begin the tour"
        >
          <span className="enter__rule" aria-hidden="true" />
          <span className="enter__label">{lines.enter}</span>
          <span className="enter__arrow" aria-hidden="true">
            →
          </span>
        </button>
        <p className="start__hint eyebrow">
          {entered ? 'One moment.' : 'Or use the arrow keys'}
        </p>
      </div>

      <div className="start__coords" aria-hidden="true">
        <span>x: 0.500</span>
        <span>y: 0.845</span>
        <span>scale: 1:1</span>
      </div>
    </div>
  )
}
