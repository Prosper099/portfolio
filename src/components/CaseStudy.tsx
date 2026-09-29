import { useEffect, useRef } from 'react'
import type { Project } from '../data/site'

export default function CaseStudy({ project: p, onClose }: { project: Project; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeBtn.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('a[href], button')
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div className="cs" role="dialog" aria-modal="true" aria-label={`${p.name} case study`}>
      <div className="cs__scrim" onClick={onClose} aria-hidden="true" />
      <article className="cs__panel" ref={panel}>
        <header className="cs__bar">
          <span className="eyebrow">
            {p.index} — {p.name}
          </span>
          <button ref={closeBtn} className="cs__close" onClick={onClose} aria-label="Close case study">
            <span aria-hidden="true">Close</span>
            <svg viewBox="0 0 16 16" aria-hidden="true" width="14" height="14">
              <path d="M1 1 L15 15 M15 1 L1 15" />
            </svg>
          </button>
        </header>

        <div className="cs__scroll">
          <div className="cs__hero">
            <h2 className="display cs__name">{p.name}</h2>
            <p className="cs__lede serif">{p.lede}</p>
          </div>

          <dl className="cs__meta">
            <div>
              <dt>Year</dt>
              <dd>{p.year}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{p.role}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{p.category}</dd>
            </div>
          </dl>

          <section className="cs__section">
            <h3 className="cs__h eyebrow">The problem</h3>
            {p.problem.map((t) => (
              <p key={t} className="cs__p">
                {t}
              </p>
            ))}
          </section>

          <section className="cs__section">
            <h3 className="cs__h eyebrow">My role</h3>
            <p className="cs__p">{p.roleBlurb}</p>
          </section>

          <section className="cs__section">
            <h3 className="cs__h eyebrow">How it went</h3>
            <ol className="cs__steps">
              {p.approach.map((a) => (
                <li key={a.label}>
                  <span className="cs__step-label">{a.label}</span>
                  <span className="cs__step-text">{a.text}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="cs__section">
            <h3 className="cs__h eyebrow">What changed</h3>
            {p.outcome.map((t) => (
              <p key={t} className="cs__p">
                {t}
              </p>
            ))}
          </section>

          <ul className="cs__metrics">
            {p.metrics.map((m) => (
              <li key={m.label}>
                <span className="cs__metric-value display">{m.value}</span>
                <span className="cs__metric-label eyebrow">{m.label}</span>
              </li>
            ))}
          </ul>

          <footer className="cs__foot">
            <button className="cs__next" onClick={onClose}>
              <span>Back to the room</span>
              <span aria-hidden="true">↓</span>
            </button>
          </footer>
        </div>
      </article>
    </div>
  )
}
