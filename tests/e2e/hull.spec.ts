import { test, expect, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
const fixture = JSON.parse(
  await readFile(new URL('../../public/sample-workspace.json', import.meta.url), 'utf8'),
)
async function importData(page: Page, value: unknown) {
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  await page.getByLabel('Workspace JSON', { exact: true }).fill(JSON.stringify(value))
  await page.getByRole('button', { name: 'Import workspace', exact: true }).click()
  await expect(page.locator('dialog[open]')).toHaveCount(0)
}
async function deliver(page: Page, label: string) {
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: label, exact: true }).click()
  const file = await pending
  return { name: file.suggestedFilename(), buffer: await readFile((await file.path())!) }
}

test('named point/selection models update actual SVG geometry and preserve unrelated pending fields and keyed circles', async ({
  page,
}) => {
  await page.goto('/')
  const dot = page.locator('[data-point="p-1"]')
  await dot.evaluate((e) => {
    ;(window as any).__dot = e
  })
  await page.getByRole('textbox', { name: 'Workspace name', exact: true }).fill('A pending garden')
  await dot.focus()
  await dot.press('ArrowRight')
  await expect(dot).toHaveAttribute('cx', '97.6')
  await expect(page.getByRole('spinbutton', { name: 'X coordinate', exact: true })).toHaveValue(
    '-34',
  )
  await expect(page.getByRole('textbox', { name: 'Workspace name', exact: true })).toHaveValue(
    'A pending garden',
  )
  expect(await dot.evaluate((e) => e === (window as any).__dot)).toBe(true)
  await page.getByRole('spinbutton', { name: 'X coordinate', exact: true }).fill('-30')
  await page.getByRole('button', { name: 'Apply workspace name', exact: true }).click()
  await expect(page.getByRole('spinbutton', { name: 'X coordinate', exact: true })).toHaveValue(
    '-30',
  )
  await page.getByRole('button', { name: 'Apply point', exact: true }).click()
  await expect(dot).toHaveAttribute('cx', '112')
  await page.reload()
  await expect(page.getByRole('spinbutton', { name: 'X coordinate', exact: true })).toHaveValue(
    '-30',
  )
  await expect(page.getByRole('textbox', { name: 'Workspace name', exact: true })).toHaveValue(
    'A pending garden',
  )
})
test('actual pointer mapping snaps coordinates and keyboard collision/boundary edits retain the last valid point', async ({
  page,
}) => {
  await page.goto('/')
  await importData(page, {
    ...fixture,
    points: [
      { id: 'a', x: -20, y: -20 },
      { id: 'b', x: 20, y: -20 },
      { id: 'c', x: 0, y: 20 },
    ],
  })
  const svg = page.locator('[data-ui="hull-plot"]')
  await svg.scrollIntoViewIfNeeded()
  const positions = await svg.evaluate((e: SVGSVGElement) => {
    const m = e.getScreenCTM()!,
      a = new DOMPoint(148, 292).matrixTransform(m),
      b = new DOMPoint(220, 220).matrixTransform(m)
    return { a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y } }
  })
  await page.mouse.move(positions.a.x, positions.a.y)
  await page.mouse.down()
  await page.mouse.move(positions.b.x, positions.b.y, { steps: 5 })
  await page.mouse.up()
  await expect(page.getByRole('spinbutton', { name: 'X coordinate', exact: true })).toHaveValue('0')
  await expect(page.getByRole('spinbutton', { name: 'Y coordinate', exact: true })).toHaveValue('0')
  await expect(page.locator('[data-ui="area"]')).toHaveText('200')
  await importData(page, {
    ...fixture,
    points: [
      { id: 'a', x: 19, y: -20 },
      { id: 'b', x: 20, y: -20 },
      { id: 'c', x: 0, y: 20 },
    ],
  })
  const dot = page.locator('[data-point="a"]')
  await dot.focus()
  await dot.press('ArrowRight')
  await expect(page.locator('[data-ui="plot-error"]')).toContainText('coordinates must be unique')
  await expect(dot).toHaveAttribute('cx', '288.4')
  await dot.press('Shift+ArrowUp')
  await expect(page.getByRole('spinbutton', { name: 'Y coordinate', exact: true })).toHaveValue(
    '-15',
  )
  await expect(page.locator('[data-ui="plot-error"]')).toHaveText('')
  await importData(page, { ...fixture, points: [{ id: 'a', x: 50, y: 50 }] })
  await page.locator('[data-point="a"]').focus()
  await page.locator('[data-point="a"]').press('ArrowRight')
  await expect(page.getByRole('spinbutton', { name: 'X coordinate', exact: true })).toHaveValue(
    '50',
  )
})
test('degenerate geometry, strict point forms and bounded confirmed collection operations keep stable panels', async ({
  page,
}) => {
  await page.goto('/')
  const panel = page.locator('[data-ui="preview-panel"]'),
    height = await panel.evaluate((e) => e.getBoundingClientRect().height)
  await importData(page, { ...fixture, points: [{ id: 'a', x: 0, y: 0 }] })
  await expect(page.locator('[data-ui="area"]')).toHaveText('0')
  await expect(page.locator('[data-ui="length"]')).toHaveText('0.00')
  await expect(page.getByRole('button', { name: 'Remove point', exact: true })).toBeDisabled()
  await page.getByRole('spinbutton', { name: 'X coordinate', exact: true }).fill('51')
  await page.getByRole('button', { name: 'Apply point', exact: true }).click()
  await expect(page.locator('[data-ui="point-form"]').getByRole('alert')).toContainText('-50 to 50')
  const points = Array.from({ length: 23 }, (_, i) => ({
    id: 'point-' + (i + 1),
    x: i - 11,
    y: 10,
  }))
  await importData(page, { ...fixture, points })
  await page.getByRole('button', { name: 'Add point near center', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Add point near center', exact: true }),
  ).toBeDisabled()
  await expect(page.locator('[data-ui="point-list"] button')).toHaveCount(24)
  await page.getByRole('button', { name: 'Remove point', exact: true }).click()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.locator('[data-ui="point-list"] button')).toHaveCount(24)
  await page.getByRole('button', { name: 'Remove point', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Remove point', exact: true }).click()
  await expect(page.locator('[data-ui="point-list"] button')).toHaveCount(23)
  expect(await panel.evaluate((e) => e.getBoundingClientRect().height)).toBe(height)
  await importData(page, {
    ...fixture,
    points: [
      { id: 'a', x: 0, y: 0 },
      { id: 'mid', x: 2, y: 0 },
      { id: 'b', x: 4, y: 0 },
    ],
  })
  await expect(page.locator('[data-ui="hull-count"]')).toHaveText('2 vertices')
  await expect(page.locator('[data-ui="length"]')).toHaveText('4.00')
  await expect(page.locator('[data-ui="centroid"]')).toContainText('Not defined')
})
test('real SVG/CSV/TXT contain all original points and derived hull while JSON excludes selection and calculated results', async ({
  page,
}) => {
  await page.goto('/')
  await importData(page, { ...fixture, name: '<script>Garden</script>' })
  const svg = await deliver(page, 'Hull SVG'),
    facts = await page.evaluate((s) => {
      const d = new DOMParser().parseFromString(s, 'image/svg+xml')
      return {
        bad: d.querySelectorAll('script,parsererror').length,
        title: d.querySelector('title')?.textContent,
        points: d.querySelectorAll('[data-point]').length,
        paths: [...d.querySelectorAll('path')].map((e) => e.getAttribute('d')),
      }
    }, svg.buffer.toString('utf8'))
  expect(svg.name).toMatch(/^HC-[A-F0-9]{8}\.svg$/)
  expect(facts.bad).toBe(0)
  expect(facts.title).toBe('<script>Garden</script>')
  expect(facts.points).toBe(8)
  expect(facts.paths).toContain(await page.locator('[data-ui="hull-path"]').getAttribute('d'))
  const csv = (await deliver(page, 'Points CSV')).buffer.toString('utf8')
  expect(csv.trim().split('\r\n')).toHaveLength(9)
  expect(csv).toContain('p-7,0,0,false,,')
  expect(csv).toContain('p-6,-38,20,true,1,')
  const txt = (await deliver(page, 'Geometry TXT')).buffer.toString('utf8')
  expect(txt).toContain('Area: 4575.5')
  expect(txt).toContain('8. p-8: 12, 10')
  const json = JSON.parse((await deliver(page, 'JSON')).buffer.toString('utf8'))
  expect(json.selected).toBeUndefined()
  expect(json.boundary).toBeUndefined()
  expect(json.points).toHaveLength(8)
})
