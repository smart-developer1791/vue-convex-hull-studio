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

test('maximum escaped workspace downloads and reimports losslessly at 320 px with complete artifacts', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 1000 })
  await page.goto('/')
  let value: any = { ...fixture, name: '<script>' + '"'.repeat(64) }
  value = {
    ...value,
    points: Array.from({ length: 24 }, (_, i) => ({
      id: 'point-' + i,
      x: i * 4 - 46,
      y: i % 2 ? 50 : -50,
    })),
  }

  await importData(page, value)
  const file = await deliver(page, 'JSON'),
    json = JSON.parse(file.buffer.toString('utf8'))
  for (const k of Object.keys(value).filter((k) => k !== 'provenance'))
    expect(json[k]).toEqual(value[k])
  await importData(page, json)
  expect((await deliver(page, 'JSON')).buffer.toString('utf8')).toBe(file.buffer.toString('utf8'))
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(
    (await deliver(page, 'Hull SVG')).buffer.toString('utf8').match(/data-point=/g) || [],
  ).toHaveLength(24)
  expect(
    (await deliver(page, 'Points CSV')).buffer.toString('utf8').trim().split('\r\n'),
  ).toHaveLength(25)
})
