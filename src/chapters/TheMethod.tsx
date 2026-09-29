import { useEffect, useRef, useState } from 'react'
import { useDirector } from '../character/context'
import { method, principles, lines } from '../data/site'

export default function TheMethod() {
  const d = useDirector()
  const [active, setActive] = useState(0)
  const ran = useRef(false)
  const track = useRef<HTMLOListElement>(null)
  const slots = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    const script = async () => {
      d.face(1)
      d.teleport(window.innerWidth * 0.08, window.innerHeight * 0.88)
      d.hold('stand')
      await d.walkTo(window.innerWidth * 0.18)
      d.act('point', 1200)
      d.say(lines.methodIntro, 2600)
      await d.wait(3200)
      d.hold('stand')
    }
    d.play_(script)
  }, [d])

  const pick = async (i: number) => {
    setActive(i)
    const el = slots.current[i]
    const r = el?.getBoundingClientRect()
    if (r) await d.walkTo(r.left + r.width / 2 - 30, { face: 1 })
    d.act(i === 0 ? 'point' : 'lookUp', 1000)
  }

  return (
    <div className="ch ch--method">
      <header className="anim ch__head" style={{ '--d': '60ms' } as React.CSSProperties}>
        <span className="eyebrow">04 — The method</span>
        <span className="eyebrow">Five moves, in order</span>
      </header>

      <p className="method__lede serif" style={{ '--d': '120ms' } as React.CSSProperties}>
        Product work is mostly deciding what to do next. This is how I decide.
      </p>

      <ol className="method__track" ref={track}>
        {method.map((s, i) => (
          <li key={s.n} className="method__step" style={{ '--d': `${180 + i * 80}ms` } as React.CSSProperties}>
            <button
              ref={(el) => {
                slots.current[i] = el
              }}
              className={`method__btn${active === i ? ' is-active' : ''}`}
              onClick={() => pick(i)}
              aria-pressed={active === i}
            >
              <span className="method__n eyebrow">{s.n}</span>
              <span className="method__name serif">{s.name}</span>
              <span className="method__gloss">{s.gloss}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="method__detail" key={active}>
        <span className="eyebrow">
          {method[active].n} / {String(method.length).padStart(2, '0')}
        </span>
        <p className="method__body">{method[active].body}</p>
      </div>

      <ul className="method__principles">
        {principles.map((p, i) => (
          <li key={p.k} className="principle" style={{ '--d': `${520 + i * 90}ms` } as React.CSSProperties}>
            <span className="principle__k">{p.k}</span>
            <span className="principle__v serif-i">{p.v}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
