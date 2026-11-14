import { record, list, unique } from './validation.ts'
import { single, id, integer, provenance } from './shared.ts'
export interface Point {
  id: string
  x: number
  y: number
}
export interface Workspace {
  version: 1
  name: string
  points: Point[]
}
export function parse(value: unknown): Workspace {
  const w = record(value, 'Workspace')
  if (w.version !== 1) throw new Error('Workspace version must be 1.')
  const points = list(w.points, 'Points', 24).map((v) => {
    const p = record(v, 'Point')
    return {
      id: id(p.id),
      x: integer(p.x, 'X coordinate', -50, 50),
      y: integer(p.y, 'Y coordinate', -50, 50),
    }
  })
  if (!points.length) throw new Error('Keep at least one point.')
  unique(
    points.map((p) => p.id),
    'Point IDs',
  )
  unique(
    points.map((p) => p.x + ',' + p.y),
    'Point coordinates',
  )
  return { version: 1, name: single(w.name, 'Workspace name', 80), points }
}
export function serialize(value: unknown) {
  const w = parse(value)
  return { ...w, provenance: provenance('HC', 'vue-convex-hull-studio', w) }
}
export function cross(a: Point, b: Point, c: Point) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
}
export function hull(points: readonly Point[]): Point[] {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y)
  if (sorted.length <= 2) return sorted
  const lower: Point[] = [],
    upper: Point[] = []
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower.at(-1)!, p) <= 0) lower.pop()
    lower.push(p)
  }
  for (const p of sorted.slice().reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper.at(-1)!, p) <= 0) upper.pop()
    upper.push(p)
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1))
}
export function metrics(points: readonly Point[]) {
  const boundary = hull(points)
  let twice = 0,
    cx = 0,
    cy = 0,
    length = 0
  if (boundary.length === 2)
    length = Math.hypot(boundary[1]!.x - boundary[0]!.x, boundary[1]!.y - boundary[0]!.y)
  if (boundary.length >= 3)
    for (let i = 0; i < boundary.length; i++) {
      const a = boundary[i]!,
        b = boundary[(i + 1) % boundary.length]!,
        c = a.x * b.y - b.x * a.y
      twice += c
      cx += (a.x + b.x) * c
      cy += (a.y + b.y) * c
      length += Math.hypot(b.x - a.x, b.y - a.y)
    }
  return {
    boundary,
    area: Math.abs(twice) / 2,
    length,
    centroid: twice ? { x: cx / (3 * twice), y: cy / (3 * twice) } : null,
  }
}
export function nextPoint(points: readonly Point[]): Point {
  let n = 1
  while (points.some((p) => p.id === 'point-' + n)) n++
  const coords = [0, ...Array.from({ length: 50 }, (_, i) => [i + 1, -i - 1]).flat()]
  for (const y of coords)
    for (const x of coords)
      if (!points.some((p) => p.x === x && p.y === y)) return { id: 'point-' + n, x, y }
  throw new Error('No coordinate is available.')
}
export const px = (x: number) => 40 + (x + 50) * 3.6
export const py = (y: number) => 400 - (y + 50) * 3.6
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!,
  )
export function svgExport(value: Workspace) {
  const w = parse(value),
    m = metrics(w.points),
    path =
      m.boundary.map((p, i) => (i ? 'L' : 'M') + px(p.x) + ' ' + py(p.y)).join(' ') +
      (m.boundary.length >= 3 ? ' Z' : ''),
    dots = w.points
      .map(
        (p, i) =>
          '<g data-point="' +
          p.id +
          '"><title>' +
          escape(p.id + ' (' + p.x + ', ' + p.y + ')') +
          '</title><circle cx="' +
          px(p.x) +
          '" cy="' +
          py(p.y) +
          '" r="4" fill="#597e78"/><text x="' +
          (px(p.x) + 7) +
          '" y="' +
          (py(p.y) - 7) +
          '" font-size="10">' +
          (i + 1) +
          '</text></g>',
      )
      .join('')
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="440" height="510" viewBox="0 0 440 510"><title>' +
    escape(w.name) +
    '</title><rect width="440" height="510" fill="#eef5f1"/><g font-family="sans-serif" fill="#292632"><text x="24" y="24" font-size="17">Convex Hull · ' +
    m.boundary.length +
    ' hull vertices</text><path d="M40 220h360M220 40v360" stroke="#b8cec4"/><rect x="40" y="40" width="360" height="360" fill="none" stroke="#c8d9d0"/><path d="' +
    path +
    '" fill="' +
    (m.boundary.length >= 3 ? '#597e7820' : 'none') +
    '" stroke="#597e78" stroke-width="2"/>' +
    dots +
    '<text x="24" y="438" font-size="12">Area ' +
    m.area +
    ' · boundary length ' +
    m.length.toFixed(3) +
    '</text><text x="24" y="463" font-size="11">Coordinates −50…50 · labels follow original point order</text><text x="24" y="490" font-size="10">' +
    serialize(w).provenance.marker +
    ' · CodeSculptor</text></g></svg>'
  )
}
export function csvExport(value: Workspace) {
  const w = parse(value),
    m = metrics(w.points)
  return (
    'point_id,x,y,is_hull_vertex,hull_order,marker\r\n' +
    w.points
      .map((p) => {
        const n = m.boundary.findIndex((v) => v.id === p.id)
        return [p.id, p.x, p.y, n >= 0, n >= 0 ? n + 1 : '', serialize(w).provenance.marker].join(
          ',',
        )
      })
      .join('\r\n') +
    '\r\n'
  )
}
export function textExport(value: Workspace) {
  const w = parse(value),
    m = metrics(w.points)
  return (
    w.name +
    '\n' +
    serialize(w).provenance.marker +
    ' · CodeSculptor\nArea: ' +
    m.area +
    ' square units\nBoundary length: ' +
    m.length.toFixed(6) +
    ' units\nArea centroid: ' +
    (m.centroid
      ? m.centroid.x.toFixed(6) + ', ' + m.centroid.y.toFixed(6)
      : 'not defined for a point or segment') +
    '\nBoundary order: ' +
    m.boundary.map((p) => p.id).join(' -> ') +
    '\n\n' +
    w.points.map((p, i) => i + 1 + '. ' + p.id + ': ' + p.x + ', ' + p.y).join('\n') +
    '\n'
  )
}
