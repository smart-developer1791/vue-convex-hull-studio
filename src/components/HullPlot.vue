<script setup lang="ts">
import { computed, ref, useId, useTemplateRef } from 'vue'
import { hull, px, py, type Point } from '../domain/hull.ts'
const points = defineModel<Point[]>('points', { required: true }),
  selected = defineModel<string>('selected', { required: true }),
  svg = useTemplateRef<SVGSVGElement>('svg'),
  titleId = useId(),
  drag = ref<{ id: string; pointer: number } | null>(null)
const boundary = computed(() => hull(points.value)),
  path = computed(
    () =>
      boundary.value.map((p, i) => (i ? 'L' : 'M') + px(p.x) + ' ' + py(p.y)).join(' ') +
      (boundary.value.length >= 3 ? ' Z' : ''),
  )
function move(id: string, x: number, y: number) {
  points.value = points.value.map((p) =>
    p.id === id
      ? {
          ...p,
          x: Math.max(-50, Math.min(50, Math.round(x))),
          y: Math.max(-50, Math.min(50, Math.round(y))),
        }
      : p,
  )
}
function begin(event: PointerEvent, id: string) {
  if (event.button !== 0) return
  event.preventDefault()
  selected.value = id
  const target = event.currentTarget as SVGCircleElement
  target.focus()
  target.setPointerCapture(event.pointerId)
  drag.value = { id, pointer: event.pointerId }
}
function update(event: PointerEvent) {
  if (!drag.value || drag.value.pointer !== event.pointerId) return
  const matrix = svg.value?.getScreenCTM()
  if (!matrix) return
  const local = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
  move(drag.value.id, (local.x - 40) / 3.6 - 50, 50 - (local.y - 40) / 3.6)
}
function end(event: PointerEvent) {
  if (drag.value?.pointer === event.pointerId) drag.value = null
}
function key(event: KeyboardEvent, p: Point) {
  const delta = event.shiftKey ? 5 : 1,
    steps: Record<string, [number, number]> = {
      ArrowLeft: [-delta, 0],
      ArrowRight: [delta, 0],
      ArrowUp: [0, delta],
      ArrowDown: [0, -delta],
    }
  const change = steps[event.key]
  if (change) {
    event.preventDefault()
    move(p.id, p.x + change[0], p.y + change[1])
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    selected.value = p.id
  }
}
</script>
<template>
  <div
    class="flex h-[450px] items-center justify-center overflow-auto rounded-xl border border-line bg-background p-3"
    data-ui="plot-frame"
  >
    <svg
      ref="svg"
      viewBox="0 0 440 440"
      class="block aspect-square max-h-full w-full max-w-[420px] shrink-0"
      role="group"
      :aria-labelledby="titleId"
      data-ui="hull-plot"
      @pointermove="update"
      @pointerup="end"
      @pointercancel="end"
      @lostpointercapture="end"
    >
      <title :id="titleId">
        Editable point cloud: drag a point or use arrow keys, Shift for five units
      </title>
      <defs>
        <pattern
          :id="titleId + '-grid'"
          width="36"
          height="36"
          x="40"
          y="40"
          patternUnits="userSpaceOnUse"
        >
          <path d="M36 0H0V36" fill="none" stroke="#d4e0da" stroke-width=".6" />
        </pattern>
      </defs>
      <rect
        x="40"
        y="40"
        width="360"
        height="360"
        :fill="'url(#' + titleId + '-grid)'"
        stroke="#c3d6cc"
      />
      <path d="M40 220h360M220 40v360" stroke="#b3cac0" />
      <path
        :d="path"
        :fill="boundary.length >= 3 ? '#597e7820' : 'none'"
        stroke="#597e78"
        stroke-width="2"
        data-ui="hull-path"
      />
      <g v-for="(point, i) in points" :key="point.id">
        <circle
          :cx="px(point.x)"
          :cy="py(point.y)"
          :r="selected === point.id ? 7 : 5"
          role="button"
          tabindex="0"
          :aria-label="'Point ' + (i + 1) + ', x ' + point.x + ', y ' + point.y"
          :aria-pressed="selected === point.id"
          :data-point="point.id"
          class="cursor-grab touch-none stroke-white outline-none focus:stroke-ink focus:[stroke-width:3] active:cursor-grabbing"
          :class="selected === point.id ? 'fill-accent' : 'fill-accent/70'"
          stroke-width="2"
          @pointerdown="begin($event, point.id)"
          @focus="selected = point.id"
          @keydown="key($event, point)"
        />
        <text
          :x="px(point.x) + 9"
          :y="py(point.y) - 9"
          class="pointer-events-none font-mono text-[11px]"
          fill="#292632"
        >
          {{ i + 1 }}
        </text>
      </g>
      <text x="40" y="425" class="text-[10px]" fill="#6a6572">−50</text>
      <text x="389" y="425" class="text-[10px]" fill="#6a6572">50</text>
      <text x="12" y="45" class="text-[10px]" fill="#6a6572">50</text>
      <text x="6" y="405" class="text-[10px]" fill="#6a6572">−50</text>
    </svg>
  </div>
</template>
