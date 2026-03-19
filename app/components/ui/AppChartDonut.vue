<template>
  <div class="chart-wrap">
    <canvas ref="canvas" />
  </div>
</template>

<script setup lang="ts">
import {
  Chart,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'

if (import.meta.client) {
  Chart.register(DoughnutController, ArcElement, Tooltip, Legend)
}

const props = defineProps<{
  labels: string[]
  data: number[]
  colors: string[]
  cutout?: string
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

function buildChart() {
  if (!canvas.value) return
  chart?.destroy()
  chart = new Chart(canvas.value, {
    type: 'doughnut',
    data: {
      labels: props.labels,
      datasets: [{
        data: props.data,
        backgroundColor: props.colors,
        borderWidth: 0,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: props.cutout ?? '0%',
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, padding: 16 } },
        tooltip: { callbacks: {
          label: ctx => ` ${ctx.label}: ${ctx.parsed}`,
        }},
      },
    },
  })
}

onMounted(() => nextTick(buildChart))
watch(() => props.data, () => nextTick(buildChart), { deep: true })
onBeforeUnmount(() => chart?.destroy())
</script>

<style scoped>
.chart-wrap {
  position: relative;
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
}
</style>
