import { createContext, useContext } from 'react'
import type { Director } from './director'

export const DirectorCtx = createContext<Director | null>(null)

export function useDirector() {
  const d = useContext(DirectorCtx)
  if (!d) throw new Error('useDirector must be used inside <DirectorCtx.Provider>')
  return d
}

export type { Director }

/* ------------------------------------------------------------------ */

import { useEffect, useState } from 'react'

export function useStageSize() {
  const [s, setS] = useState(() => ({
    w: typeof window === 'undefined' ? 1280 : window.innerWidth,
    h: typeof window === 'undefined' ? 800 : window.innerHeight,
  }))
  useEffect(() => {
    const on = () => setS({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return s
}

export const useReducedMotion = () => {
  const [r, setR] = useState(false)
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setR(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return r
}
