<template>
  <div class="chart-wrap">
    <canvas ref="canvas" />
  </div>
</template>

<script setup lang="ts">
import {
  Chart,
  LineElement,
  LineController,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'

if (import.meta.client) {
  Chart.register(LineElement, LineController, PointElement, CategoryScale, LinearScale, Filler, Tooltip, Legend)
}

const props = defineProps<{
  labels: string[]
  datasets: {
    label: string
    data: number[]
    color: string
  }[]
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function buildChart() {
  if (!canvas.value) return
  chart?.destroy()
  chart = new Chart(canvas.value, {
    type: 'line',
    data: {
      labels: props.labels,
      datasets: props.datasets.map(d => ({
        label: d.label,
        data: d.data,
        borderColor: d.color,
        backgroundColor: hexToRgba(d.color, 0.15),
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, padding: 16 } },
        tooltip: { mode: 'index', intersect: false },
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { precision: 0 } },
      },
    },
  })
}

function onResize() { chart?.resize() }

onMounted(() => {
  nextTick(buildChart)
  window.addEventListener('resize', onResize)
})
watch(() => props.datasets, () => nextTick(buildChart), { deep: true })
onBeforeUnmount(() => {
  chart?.destroy()
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.chart-wrap { position: relative; width: 100%; overflow: hidden; }
.chart-wrap canvas { max-width: 100%; }
</style>
