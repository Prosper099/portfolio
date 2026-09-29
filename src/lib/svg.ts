/** Tiny typed SVG element builder. */

const NS = 'http://www.w3.org/2000/svg'

export type Attrs = Record<string, string | number | boolean | undefined | null>

export function el<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs?: Attrs,
  children?: (Node | null | undefined)[],
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, tag)
  if (attrs) setAttrs(node, attrs)
  if (children) for (const c of children) if (c) node.appendChild(c)
  return node
}

export function setAttrs(node: Element, attrs: Attrs) {
  for (const k in attrs) {
    const val = attrs[k]
    if (val === undefined || val === null || val === false) node.removeAttribute(k)
    else node.setAttribute(k, String(val))
  }
}

export const g = (attrs?: Attrs, children?: (Node | null)[]) => el('g', attrs, children)
export const path = (d: string, attrs?: Attrs) => el('path', { d, ...attrs })
export const rect = (attrs?: Attrs) => el('rect', attrs)
export const circle = (attrs?: Attrs) => el('circle', attrs)
export const ellipse = (attrs?: Attrs) => el('ellipse', attrs)

/**
 * A capsule / tapered limb segment drawn along +X from (0,0) to (len,0),
 * with a rounded cap at the far end. Bones are built like this so the rig can
 * rotate them by a single number and the joint always stays covered.
 */
export function bonePath(len: number, r0: number, r1: number) {
  // start cap is flat-ish (slightly rounded), end cap fully round
  return [
    `M 0 ${-r0}`,
    `A ${r0} ${r0} 0 0 1 0 ${r0}`,
    `L ${len} ${-r1}`,
    `A ${r1} ${r1} 0 0 1 ${len} ${r1}`,
    `L ${len - r1 * 0.2} ${r1}`,
    `L ${len - r1 * 0.2} ${-r1}`,
    `Z`,
  ].join(' ')
}
