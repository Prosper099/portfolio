import { useEffect, useRef } from 'react'
import { useDirector } from '../character/context'
import { person, lines } from '../data/site'

export default function LetsBuild() {
  const d = useDirector()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    const script = async () => {
      d.face(1)
      d.teleport(window.innerWidth * 0.78, window.innerHeight * 0.845)
      d.hold('sitRest')
      await d.wait(600)
      d.act('sitWave', 1400)
      d.say(lines.buildIntro, 2400)
      await d.wait(3200)
      d.hold('sitRest')
      await d.wait(600)
      d.act('pointUp', 1400)
    }
    d.play_(script)
  }, [d])

  return (
    <div className="ch ch--build">
      <header className="anim ch__head" style={{ '--d': '60ms' } as React.CSSProperties}>
        <span className="eyebrow">05 — Let’s build</span>
        <span className="eyebrow">{person.available}</span>
      </header>

      <h2 className="build__title display" style={{ '--d': '120ms' } as React.CSSProperties}>
        Want to build
        <br />
        something <em className="serif-i build__em">interesting?</em>
      </h2>

      <a
        className="build__mail"
        href={`mailto:${person.email}`}
        style={{ '--d': '260ms' } as React.CSSProperties}
      >
        {person.email}
      </a>

      <ul className="build__links" style={{ '--d': '380ms' } as React.CSSProperties}>
        {person.links.map((l) => (
          <li key={l.label}>
            <a className="linkrow" href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
              <span className="linkrow__label eyebrow">{l.label}</span>
              <span className="linkrow__value">{l.value}</span>
              <span className="linkrow__arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>

      <footer className="build__foot" style={{ '--d': '480ms' } as React.CSSProperties}>
        <span className="eyebrow">{person.location}</span>
        <span className="eyebrow">© {new Date().getFullYear()} {person.first} {person.last}</span>
        <span className="eyebrow">Built by hand, mostly at night</span>
      </footer>
    </div>
  )
}
