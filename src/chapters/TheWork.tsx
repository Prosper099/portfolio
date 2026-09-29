import { useEffect, useRef, useState } from 'react'
import { useDirector } from '../character/context'
import { projects, lines, type Project } from '../data/site'
import CaseStudy from '../components/CaseStudy'

/* ------------------------------------------------------------------ *
 * project artefacts — each one a different physical object, because a
 * grid of identical cards would turn the work into a spreadsheet
 * ------------------------------------------------------------------ */

function Fold({ p, onOpen }: { p: Project; onOpen: () => void }) {
  return (
    <button className="art art--fold" onClick={onOpen} aria-label={`Open case study: ${p.name}`}>
      <span className="art__shadow" aria-hidden="true" />
      <span className="art__sheet" aria-hidden="true">
        <span className="art__crease" />
        <span className="art__fold" />
        <span className="art__face">
          <span className="art__rows">
            <i style={{ width: '72%' }} />
            <i style={{ width: '54%' }} />
            <i style={{ width: '63%' }} />
          </span>
          <span className="art__block" />
        </span>
      </span>
      <span className="art__tag">
        <span className="art__idx">{p.index}</span>
        <span className="art__name">{p.name}</span>
        <span className="art__cat">{p.category}</span>
      </span>
    </button>
  )
}

function Screen({ p, onOpen }: { p: Project; onOpen: () => void }) {
  return (
    <button className="art art--screen" onClick={onOpen} aria-label={`Open case study: ${p.name}`}>
      <span className="art__shadow" aria-hidden="true" />
      <span className="art__device" aria-hidden="true">
        <span className="art__bar">
          <i />
          <i />
          <i />
        </span>
        <span className="art__canvas">
          <span className="art__hud">
            <b />
            <b />
            <b />
          </span>
          <svg className="art__curve" viewBox="0 0 100 46" preserveAspectRatio="none">
            <path d="M0 40 C 18 40, 22 12, 40 14 C 58 16, 60 34, 100 6" />
            <path className="art__curve-fill" d="M0 40 C 18 40, 22 12, 40 14 C 58 16, 60 34, 100 6 L100 46 L0 46 Z" />
          </svg>
        </span>
      </span>
      <span className="art__tag">
        <span className="art__idx">{p.index}</span>
        <span className="art__name">{p.name}</span>
        <span className="art__cat">{p.category}</span>
      </span>
    </button>
  )
}

function Diagram({ p, onOpen }: { p: Project; onOpen: () => void }) {
  return (
    <button className="art art--diagram" onClick={onOpen} aria-label={`Open case study: ${p.name}`}>
      <span className="art__shadow" aria-hidden="true" />
      <svg className="art__graph" viewBox="0 0 200 132" aria-hidden="true">
        <g className="art__edges">
          <path d="M28 66 L74 30" />
          <path d="M28 66 L74 102" />
          <path d="M74 30 L126 22" />
          <path d="M74 30 L126 70" />
          <path d="M74 102 L126 70" />
          <path d="M126 22 L172 50" />
          <path d="M126 70 L172 50" />
        </g>
        <g className="art__nodes">
          <circle cx="28" cy="66" r="9" />
          <circle cx="74" cy="30" r="6" />
          <circle cx="74" cy="102" r="6" />
          <circle cx="126" cy="22" r="11" />
          <circle cx="126" cy="70" r="8" />
          <circle cx="172" cy="50" r="7" />
        </g>
      </svg>
      <span className="art__tag">
        <span className="art__idx">{p.index}</span>
        <span className="art__name">{p.name}</span>
        <span className="art__cat">{p.category}</span>
      </span>
    </button>
  )
}

function Stack({ p, onOpen }: { p: Project; onOpen: () => void }) {
  return (
    <button className="art art--stack" onClick={onOpen} aria-label={`Open case study: ${p.name}`}>
      <span className="art__shadow" aria-hidden="true" />
      <span className="art__cards" aria-hidden="true">
        <i />
        <i />
        <i className="is-top">
          <span className="art__arc" />
          <span className="art__digit">3</span>
        </i>
      </span>
      <span className="art__tag">
        <span className="art__idx">{p.index}</span>
        <span className="art__name">{p.name}</span>
        <span className="art__cat">{p.category}</span>
      </span>
    </button>
  )
}

const ARTS = { fold: Fold, screen: Screen, diagram: Diagram, stack: Stack }

/* ------------------------------------------------------------------ */

export default function TheWork() {
  const d = useDirector()
  const [openId, setOpenId] = useState<string | null>(null)
  const ran = useRef(false)
  const [focus, setFocus] = useState<string | null>(null)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    const script = async () => {
      const p = projects[0]
      d.face(1)
      d.teleport(window.innerWidth * 0.1, window.innerHeight * 0.9)
      d.hold('carry')
      await d.walkTo(window.innerWidth * (p.at.x / 100) - 34, { face: 1 })
      d.act('lookUp', 1100)
      await d.wait(700)
      d.act('reach', 1500) // too short
      await d.wait(1500)
      d.act('shrug', 1000)
      await d.wait(400)
      d.act('point', 2000) // your turn
      d.say(lines.reachOk, 2600)
      await d.wait(3000)
      d.hold('stand')
    }
    d.play_(script)
  }, [d])

  const open = projects.find((p) => p.id === openId)

  return (
    <div className="ch ch--work">
      <header className="anim ch__head" style={{ '--d': '60ms' } as React.CSSProperties}>
        <span className="eyebrow">03 — The work</span>
        <span className="eyebrow">{projects.length} selected · 2023—2025</span>
      </header>

      <h2 className="work__title display" style={{ '--d': '120ms' } as React.CSSProperties}>
        Selected
        <br />
        <span className="work__title-thin">Work</span>
      </h2>

      <div className="work__field">
        {projects.map((p, i) => {
          const Art = ARTS[p.artefact]
          return (
            <div
              key={p.id}
              className={`work__slot${focus === p.id ? ' is-focus' : ''}`}
              style={
                {
                  left: `${p.at.x}%`,
                  top: `${p.at.y}%`,
                  '--h': `${p.h}%`,
                  '--d': `${200 + i * 90}ms`,
                } as React.CSSProperties
              }
              onMouseEnter={() => setFocus(p.id)}
              onMouseLeave={() => setFocus(null)}
            >
              <Art p={p} onOpen={() => setOpenId(p.id)} />
            </div>
          )
        })}
      </div>

      <p className="work__hint eyebrow" style={{ '--d': '620ms' } as React.CSSProperties}>
        Click anything to read it properly
      </p>

      {open && <CaseStudy project={open} onClose={() => setOpenId(null)} />}
    </div>
  )
}
