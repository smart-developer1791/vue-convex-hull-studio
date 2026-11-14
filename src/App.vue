<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import sample from '../public/sample-workspace.json'
import StudioHeader from './components/StudioHeader.vue'
import DataTools from './components/DataTools.vue'
import AppDialog from './components/AppDialog.vue'
import HullPlot from './components/HullPlot.vue'
import {
  parse,
  serialize,
  metrics,
  nextPoint,
  svgExport,
  csvExport,
  textExport,
  type Point,
} from './domain/hull.ts'
import { useDraft } from './services/draft.ts'
import { download } from './services/files.ts'
const { draft, storageStatus } = useDraft('vue-convex-hull-studio:v1', parse(sample), parse)
const identity = computed(() => serialize(draft.value).provenance.marker),
  result = computed(() => metrics(draft.value.points)),
  selected = ref(draft.value.points[0]!.id),
  point = computed(() => draft.value.points.find((p) => p.id === selected.value)!),
  title = ref(draft.value.name),
  x = ref<string | number>(point.value.x),
  y = ref<string | number>(point.value.y),
  error = ref(''),
  pointError = ref(''),
  plotError = ref(''),
  about = ref(false),
  remove = ref(false)
const points = computed({
  get: () => draft.value.points,
  set: (value: Point[]) => {
    try {
      draft.value = parse({ ...draft.value, points: value })
      plotError.value = ''
    } catch (e) {
      plotError.value = (e as Error).message
    }
  },
})
function syncPoint() {
  x.value = point.value.x
  y.value = point.value.y
  pointError.value = ''
}
watch(() => JSON.stringify(point.value), syncPoint)
watch(
  () => draft.value.name,
  () => {
    title.value = draft.value.name
    error.value = ''
  },
)
function replace(value: unknown) {
  const next = parse(value)
  selected.value = next.points[0]!.id
  draft.value = next
  title.value = next.name
  error.value = ''
  plotError.value = ''
  remove.value = false
  syncPoint()
}
function number(v: string | number) {
  return typeof v === 'number' ? v : v.trim() ? Number(v) : NaN
}
function save() {
  try {
    draft.value = parse({ ...draft.value, name: title.value })
    error.value = ''
  } catch (e) {
    error.value = (e as Error).message
  }
}
function savePoint() {
  try {
    draft.value = parse({
      ...draft.value,
      points: draft.value.points.map((p) =>
        p.id === selected.value ? { ...p, x: number(x.value), y: number(y.value) } : p,
      ),
    })
    syncPoint()
    plotError.value = ''
  } catch (e) {
    pointError.value = (e as Error).message
  }
}
function add() {
  if (draft.value.points.length >= 24) return
  const p = nextPoint(draft.value.points)
  draft.value = parse({ ...draft.value, points: [...draft.value.points, p] })
  selected.value = p.id
  syncPoint()
}
function deletePoint() {
  if (draft.value.points.length <= 1) return
  const next = parse({
    ...draft.value,
    points: draft.value.points.filter((p) => p.id !== selected.value),
  })
  selected.value = next.points[0]!.id
  draft.value = next
  remove.value = false
  syncPoint()
}
function exportSvg() {
  download(identity.value + '.svg', svgExport(draft.value), 'image/svg+xml')
}
function exportCsv() {
  download(identity.value + '-points.csv', csvExport(draft.value), 'text/csv;charset=utf-8')
}
function exportText() {
  download(identity.value + '-geometry.txt', textExport(draft.value), 'text/plain;charset=utf-8')
}
</script>
<template>
  <div data-project="vue-convex-hull-studio" class="min-h-screen">
    <StudioHeader title="Convex Hull Studio" subtitle="Find the edge of a small cloud" code="HC"
      ><DataTools
        :workspace="draft"
        :sample="sample"
        :parse="parse"
        :serialize="serialize"
        @replace="replace"
      /><button class="bg-surface hover:bg-soft" @click="about = true">About</button></StudioHeader
    >
    <main class="mx-auto max-w-[1480px] px-4 py-7 sm:px-6 lg:px-8">
      <section class="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div class="min-w-0 max-w-2xl">
          <p class="mb-2 text-xs font-bold uppercase tracking-[.18em] text-accent">
            THE SHAPE AROUND THE POINTS
          </p>
          <h1 class="break-words font-display text-3xl font-semibold leading-tight sm:text-4xl">
            {{ draft.name }}
          </h1>
          <p class="mt-3 max-w-xl leading-relaxed text-muted">
            Move a point and watch the boundary respond. Find the corners that matter, the area they
            enclose, and the points that stay inside.
          </p>
        </div>
        <div class="rounded-xl border border-line bg-surface px-4 py-3 text-right">
          <span class="block font-mono text-xs text-accent" data-ui="marker">{{ identity }}</span
          ><span class="mt-1 block text-xs text-muted" role="status">{{ storageStatus }}</span>
        </div>
      </section>
      <div
        data-ui="workspace"
        class="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]"
      >
        <section
          class="flex h-[1060px] min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface"
          data-ui="editor-panel"
        >
          <div class="border-b border-line p-5">
            <h2 class="text-lg font-semibold">A little cloud of coordinates</h2>
            <p class="mt-1 text-xs text-muted">1–24 unique points · whole units from −50 to 50</p>
          </div>
          <div class="min-h-0 flex-1 space-y-5 overflow-auto p-5">
            <form @submit.prevent="save" novalidate data-ui="settings-form">
              <label>Workspace name<input v-model="title" maxlength="80" /></label>
              <p role="alert" class="mt-3 min-h-6 text-xs text-danger">{{ error }}</p>
              <button
                class="mt-2 w-full border-accent! bg-accent text-on-accent hover:brightness-110"
              >
                Apply workspace name
              </button>
            </form>
            <div>
              <div class="flex flex-wrap items-center justify-between gap-3">
                <h3 class="font-semibold">Point notebook</h3>
                <span class="font-mono text-xs text-muted">{{ draft.points.length }} / 24</span>
              </div>
              <div
                class="mt-3 h-64 overflow-auto rounded-xl border border-line"
                data-ui="point-list"
              >
                <button
                  v-for="(p, i) in draft.points"
                  :key="p.id"
                  @click="selected = p.id"
                  :data-point-id="p.id"
                  :aria-pressed="selected === p.id"
                  class="flex w-full justify-between! gap-3 rounded-none! border-0! border-b! border-line! text-left text-xs"
                  :class="
                    selected === p.id
                      ? 'bg-soft text-accent'
                      : 'bg-white text-muted hover:bg-background'
                  "
                >
                  <span class="font-mono">{{ i + 1 }} · {{ p.id }}</span
                  ><span class="font-mono"
                    >{{ p.x }}, {{ p.y
                    }}<span class="ml-2 text-[10px]">{{
                      result.boundary.some((v) => v.id === p.id) ? 'hull' : 'other'
                    }}</span></span
                  >
                </button>
              </div>
              <button
                @click="add"
                :disabled="draft.points.length >= 24"
                class="mt-3 w-full bg-background text-xs hover:bg-soft"
              >
                Add point near center
              </button>
            </div>
            <form
              @submit.prevent="savePoint"
              novalidate
              class="border-t border-line pt-5"
              data-ui="point-form"
            >
              <h3 class="font-semibold">Selected · {{ point.id }}</h3>
              <div class="mt-3 grid grid-cols-2 gap-3">
                <label
                  >X coordinate<input
                    v-model="x"
                    type="number"
                    min="-50"
                    max="50"
                    step="1" /></label
                ><label
                  >Y coordinate<input v-model="y" type="number" min="-50" max="50" step="1"
                /></label>
              </div>
              <p role="alert" class="mt-3 min-h-6 text-xs text-danger">{{ pointError }}</p>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <button class="bg-background text-accent hover:bg-soft">Apply point</button
                ><button
                  type="button"
                  @click="remove = true"
                  :disabled="draft.points.length <= 1"
                  class="bg-background text-danger hover:bg-soft"
                >
                  Remove point
                </button>
              </div>
            </form>
            <div class="rounded-xl border border-line bg-soft p-4">
              <h3 class="font-semibold">Imagine an elastic loop</h3>
              <p class="mt-2 text-xs leading-relaxed text-muted">
                The convex hull is the smallest convex boundary containing every point. Interior
                points and points lying in the middle of a straight edge do not become hull
                vertices.
              </p>
              <p class="mt-3 text-xs leading-relaxed text-muted">
                Drag a dot, or focus one and use arrow keys. Shift moves five units. Coordinates
                snap to the integer grid; an occupied position keeps the last valid point.
              </p>
            </div>
          </div>
        </section>
        <section
          class="flex h-[1060px] min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface"
          data-ui="preview-panel"
        >
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
            <div>
              <h2 class="text-lg font-semibold">The outside of the cloud</h2>
              <p class="mt-1 text-xs text-muted">
                {{
                  result.boundary.length >= 3
                    ? 'Counterclockwise convex polygon'
                    : result.boundary.length === 2
                      ? 'One straight segment'
                      : 'One point'
                }}
              </p>
            </div>
            <span
              class="rounded-full bg-soft px-3 py-1 font-mono text-xs text-accent"
              data-ui="hull-count"
              >{{ result.boundary.length }}
              {{ result.boundary.length === 1 ? 'vertex' : 'vertices' }}</span
            >
          </div>
          <div class="min-h-0 flex-1 space-y-5 overflow-auto p-5">
            <HullPlot v-model:points="points" v-model:selected="selected" />
            <p role="alert" class="min-h-6 text-xs text-danger" data-ui="plot-error">
              {{ plotError }}
            </p>
            <div class="grid grid-cols-3 gap-2">
              <div class="rounded-xl border border-line p-3">
                <p class="text-[10px] uppercase text-muted">Area</p>
                <p class="mt-1 break-words font-mono text-lg" data-ui="area">{{ result.area }}</p>
              </div>
              <div class="rounded-xl border border-line p-3">
                <p class="text-[10px] uppercase text-muted">Length</p>
                <p class="mt-1 break-words font-mono text-lg" data-ui="length">
                  {{ result.length.toFixed(2) }}
                </p>
              </div>
              <div class="rounded-xl border border-line p-3">
                <p class="text-[10px] uppercase text-muted">Other / hull</p>
                <p class="mt-1 font-mono text-lg">
                  {{ draft.points.length - result.boundary.length }} / {{ result.boundary.length }}
                </p>
              </div>
            </div>
            <div class="rounded-xl border border-line bg-soft p-4">
              <h3 class="font-semibold">Area centroid</h3>
              <p class="mt-2 break-words font-mono text-sm" data-ui="centroid">
                {{
                  result.centroid
                    ? result.centroid.x.toFixed(3) + ', ' + result.centroid.y.toFixed(3)
                    : 'Not defined for a point or segment'
                }}
              </p>
              <p class="mt-3 text-xs leading-relaxed text-muted">
                Area is in square units. A polygon’s length closes its boundary; a segment uses its
                single end-to-end length. A lone point has zero area and length.
              </p>
            </div>
            <div>
              <h3 class="font-semibold">Boundary order</h3>
              <ol class="mt-3 flex flex-wrap gap-2" data-ui="boundary-order">
                <li
                  v-for="p in result.boundary"
                  :key="p.id"
                  class="rounded-lg border border-line bg-background px-3 py-2 font-mono text-xs"
                >
                  {{ p.id }}
                </li>
              </ol>
              <p class="mt-3 text-xs leading-relaxed text-muted">
                Order begins at the smallest x, then y. The diagram’s y axis points upward. Point
                labels follow the original notebook order.
              </p>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-2 border-t border-line p-4">
            <button @click="exportSvg" class="bg-background text-xs hover:bg-soft">Hull SVG</button
            ><button @click="exportCsv" class="bg-background text-xs hover:bg-soft">
              Points CSV</button
            ><button @click="exportText" class="bg-background text-xs hover:bg-soft">
              Geometry TXT
            </button>
          </div>
        </section>
      </div>
      <footer
        class="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-xs text-muted"
      >
        <span>Made with Vue · Stored on this device</span><span>CodeSculptor · MIT · 2026</span>
      </footer>
    </main>
    <AppDialog v-model="remove" title="Remove the selected point?"
      ><p class="leading-relaxed text-muted">
        This removes the point and recalculates the hull. At least one point stays in the notebook.
      </p>
      <div class="mt-6 flex justify-end gap-2">
        <button @click="remove = false" class="hover:bg-soft">Cancel</button
        ><button
          @click="deletePoint"
          class="border-accent! bg-accent text-on-accent hover:brightness-110"
        >
          Remove point
        </button>
      </div></AppDialog
    ><AppDialog v-model="about" title="About Convex Hull Studio"
      ><div class="space-y-4 leading-relaxed text-muted">
        <p>
          A bounded coordinate notebook with monotone-chain convex hulls. Typed named Vue models
          share points and selection between an accessible SVG plot and a validated parent
          workspace.
        </p>
        <p>
          JSON keeps the editable workspace. Local storage stays on this browser; exports let you
          keep a copy elsewhere.
        </p>
        <a href="/sample-workspace.json" class="font-semibold text-accent underline" download
          >Download the complete sample</a
        >
      </div></AppDialog
    >
  </div>
</template>
