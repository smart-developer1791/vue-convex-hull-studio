import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const fixture = JSON.parse(
  readFileSync(new URL('../public/sample-workspace.json', import.meta.url), 'utf8'),
)

import {
  parse,
  serialize,
  cross,
  hull,
  metrics,
  nextPoint,
  px,
  py,
  svgExport,
  csvExport,
  textExport,
} from '../src/domain/hull.ts'
test('sample has the exact six CCW vertices, shoelace area, centroid and canonical UTF-8 provenance', () => {
  const w = parse(fixture),
    m = metrics(w.points)
  assert.deepEqual(
    m.boundary.map((p) => p.id),
    ['p-6', 'p-1', 'p-2', 'p-3', 'p-4', 'p-5'],
  )
  assert.equal(m.area, 4575.5)
  assert.ok(Math.abs(m.length - 253.4937276237931) < 1e-10)
  assert.ok(Math.abs(m.centroid!.x + 0.3650967107419954) < 1e-12)
  assert.deepEqual(serialize(w), fixture)
})
test('point, segment, straight runs and edge-interior points obey explicit degenerate geometry', () => {
  const p = (id: string, x: number, y: number) => ({ id, x, y }),
    a = p('a', 0, 0),
    b = p('b', 4, 0),
    c = p('c', 4, 3),
    d = p('d', 0, 3)
  assert.deepEqual(metrics([a]), { boundary: [a], area: 0, length: 0, centroid: null })
  assert.equal(metrics([a, c]).length, 5)
  assert.deepEqual(hull([p('m', 2, 0), b, a]), [a, b])
  const m = metrics([a, b, c, d, p('edge', 2, 0), p('inside', 2, 1)])
  assert.equal(m.area, 12)
  assert.equal(m.length, 14)
  assert.deepEqual(m.centroid, { x: 2, y: 1.5 })
  assert.equal(m.boundary.length, 4)
})
test('varied 24-point clouds satisfy containment, strict convexity and order independence', () => {
  for (let seed = 0; seed < 60; seed++) {
    const points = Array.from({ length: 24 }, (_, i) => ({
        id: 'p-' + i,
        x: ((i * 17 + seed * 3) % 101) - 50,
        y: ((i * i * 13 + seed * 7) % 101) - 50,
      })),
      w = parse({ ...fixture, points }),
      m = metrics(w.points)
    assert.deepEqual(hull(points.toReversed()), m.boundary)
    for (let i = 0; i < m.boundary.length; i++) {
      const a = m.boundary[i]!,
        b = m.boundary[(i + 1) % m.boundary.length]!,
        c = m.boundary[(i + 2) % m.boundary.length]!
      assert.ok(cross(a, b, c) > 0)
      for (const p of points) assert.ok(cross(a, b, p) >= 0)
    }
    assert.ok(m.area >= metrics(points.slice(0, 12)).area)
    assert.ok(m.area <= 10000)
  }
})
test('strict coordinate/id/schema bounds reject duplicates, coercion, empty clouds and excessive lists', () => {
  for (const change of [
    (w: any) => (w.points = []),
    (w: any) => (w.points = Array(25).fill(w.points[0])),
    (w: any) => (w.points[0].x = '4'),
    (w: any) => (w.points[0].y = 1.5),
    (w: any) => (w.points[0].x = 51),
    (w: any) => (w.points[0].id = 'constructor'),
    (w: any) => (w.points[1] = { ...w.points[0], id: 'other' }),
    (w: any) => (w.points[1].id = w.points[0].id),
    (w: any) => (w.version = 2),
    (w: any) => (w.name = []),
  ]) {
    const w = structuredClone(fixture)
    change(w)
    assert.throws(() => parse(w))
  }
})
test('new points choose unused identities and central integer positions without changing existing data', () => {
  const points = [
      { id: 'point-2', x: 0, y: 0 },
      { id: 'custom', x: 1, y: 0 },
    ],
    before = structuredClone(points),
    next = nextPoint(points)
  assert.equal(next.id, 'point-1')
  assert.deepEqual([next.x, next.y], [-1, 0])
  assert.deepEqual(points, before)
  assert.equal(px(-50), 40)
  assert.equal(px(50), 400)
  assert.equal(py(50), 40)
  assert.equal(py(-50), 400)
})
test('maximum SVG/CSV/TXT include all points, escaped title, ordered hull and distinct Unicode markers', () => {
  const points = Array.from({ length: 24 }, (_, i) => ({
      id: 'point-' + i,
      x: i * 4 - 46,
      y: i % 2 ? 50 : -50,
    })),
    w = parse({ ...fixture, name: '<script>' + '"'.repeat(64), points }),
    svg = svgExport(w)
  assert.equal((svg.match(/data-point=/g) || []).length, 24)
  assert.ok(svg.includes('&lt;script&gt;'))
  assert.equal(svg.includes('<script>'), false)
  assert.equal(csvExport(w).trim().split('\r\n').length, 25)
  assert.ok(textExport(w).includes('24. point-23'))
  assert.ok(textExport(w).includes('Boundary order: point-0 -> point-22 -> point-23 -> point-1'))
  assert.deepEqual(parse(serialize(w)), w)
  assert.notEqual(
    serialize({ ...w, name: '🙂' }).provenance.marker,
    serialize({ ...w, name: '🙃' }).provenance.marker,
  )
})
