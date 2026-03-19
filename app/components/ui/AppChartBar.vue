<template>
  <div class="chart-wrap">
    <canvas ref="canvas" />
  </div>
</template>

<script setup lang="ts">
import {
  Chart,
  BarElement,
  BarController,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'

if (import.meta.client) {
  Chart.register(BarElement, BarController, CategoryScale, LinearScale, Tooltip, Legend)
}

const props = defineProps<{
  labels: string[]
  datasets: {
    label: string
    data: number[]
    color: string | string[]
  }[]
  legend?: boolean
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

function buildChart() {
  if (!canvas.value) return
  chart?.destroy()
  chart = new Chart(canvas.value, {
    type: 'bar',
    data: {
      labels: props.labels,
      datasets: props.datasets.map(d => ({
        label: d.label,
        data: d.data,
        backgroundColor: d.color,
        borderRadius: 4,
        barPercentage: 0.5,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: props.legend !== false, position: 'bottom', labels: { boxWidth: 12, padding: 16 } },
        tooltip: { mode: 'index', intersect: false },
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { precision: 0 } },
      },
    },
  })
}

onMounted(() => nextTick(buildChart))
watch(() => props.datasets, () => nextTick(buildChart), { deep: true })
onBeforeUnmount(() => chart?.destroy())
</script>

<style scoped>
.chart-wrap { position: relative; width: 100%; }
</style>
