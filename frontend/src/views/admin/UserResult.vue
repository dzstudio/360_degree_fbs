<template>
  <div class="max-w-4xl mx-auto">
    <!-- Loading -->
    <LoadingSpinner v-if="loading" text="加载中..." />

    <template v-else-if="result">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <button class="btn btn-secondary mb-3" @click="router.back()">
            <ArrowLeft :size="16" />
            返回
          </button>
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span class="text-lg font-bold" style="color: var(--color-primary)">
                {{ result.user?.name?.charAt(0) || '?' }}
              </span>
            </div>
            <div>
              <h1 class="text-2xl font-bold" style="color: var(--color-text-primary)">
                {{ result.user?.name }} 的评估结果
              </h1>
              <p class="text-sm" style="color: var(--color-text-secondary)">
                {{ result.user?.department || '' }} {{ result.user?.position ? `· ${result.user.position}` : '' }}
              </p>
            </div>
          </div>
        </div>
        <div class="text-right">
          <p class="text-sm" style="color: var(--color-text-secondary)">综合得分</p>
          <p class="text-4xl font-bold" style="color: var(--color-primary)">
            {{ result.totalScore.toFixed(1) }}
          </p>
          <p class="text-sm" style="color: var(--color-text-muted)">
            {{ result.completedCount }}/{{ result.totalCount }} 人已完成评估
          </p>
        </div>
      </div>

      <!-- Radar Chart -->
      <div class="card p-6 mb-6">
        <h2 class="text-lg font-semibold mb-4" style="color: var(--color-text-primary)">
          能力雷达图
        </h2>
        <div class="flex justify-center">
          <div ref="radarChartRef" style="width: 100%; max-width: 500px; height: 400px;"></div>
        </div>
      </div>

      <!-- Dimension Scores -->
      <div class="card p-6 mb-6">
        <h2 class="text-lg font-semibold mb-4" style="color: var(--color-text-primary)">
          各维度得分
        </h2>
        <div class="space-y-4">
          <div
            v-for="dim in result.dimensionScores"
            :key="dim.dimensionId"
            class="p-4 rounded-lg"
            style="background: var(--color-bg)"
          >
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-medium" style="color: var(--color-text-primary)">
                {{ dim.dimensionName }}
              </h3>
              <span class="text-lg font-bold" style="color: var(--color-primary)">
                {{ dim.score.toFixed(1) }}
              </span>
            </div>
            <div class="h-3 rounded-full overflow-hidden" style="background: var(--color-border-light)">
              <div
                class="h-full rounded-full transition-all duration-500"
                :style="{
                  width: `${(dim.score / dim.maxScore) * 100}%`,
                  background: getScoreColor(dim.score / dim.maxScore),
                }"
              ></div>
            </div>
            <div class="flex justify-between mt-1">
              <span class="text-xs" style="color: var(--color-text-muted)">0</span>
              <span class="text-xs" style="color: var(--color-text-muted)">{{ dim.maxScore }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Text Feedback -->
      <div class="card p-6 mb-6">
        <h2 class="text-lg font-semibold mb-4" style="color: var(--color-text-primary)">
          文字评价反馈
        </h2>
        <div v-if="textFeedbacks.length > 0" class="space-y-6">
          <div
            v-for="(feedback, index) in textFeedbacks"
            :key="index"
            class="p-4 rounded-lg"
            style="background: var(--color-bg)"
          >
            <div class="flex items-center justify-between mb-3">
              <p class="font-medium" style="color: var(--color-text-primary)">
                {{ feedback.question }}
              </p>
              <span class="text-sm" style="color: var(--color-text-muted)">
                {{ feedback.count || 0 }} 人回答
              </span>
            </div>
            <div class="space-y-2">
              <div
                v-for="(answer, answerIndex) in feedback.answers || (feedback.answer ? [feedback.answer] : [])"
                :key="answerIndex"
                class="p-3 rounded-lg border"
                style="border-color: var(--color-border); background: white"
              >
                <p style="color: var(--color-text-primary)">
                  {{ answer }}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8">
          <MessageSquare :size="48" class="mx-auto mb-3" style="color: var(--color-text-muted)" />
          <p style="color: var(--color-text-muted)">暂无文字评价</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { projectsApi } from '@/api/projects'
import type { AssessmentResult } from '@/types/api'
import * as echarts from 'echarts'
import {
  ArrowLeft,
  MessageSquare,
} from 'lucide-vue-next'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()

const projectId = computed(() => Number(route.params.id))
const userId = computed(() => Number(route.params.userId))

const result = ref<AssessmentResult | null>(null)
const textFeedbacks = ref<{ question: string; answer?: string; answers?: string[]; count?: number }[]>([])
const loading = ref(true)
const radarChartRef = ref<HTMLElement | null>(null)

const fetchResult = async () => {
  loading.value = true
  try {
    const res = await projectsApi.getResult(projectId.value, userId.value)
    result.value = res

    // 获取文字反馈
    if (res.textFeedbacks) {
      textFeedbacks.value = res.textFeedbacks
    }
  } catch (error) {
    console.error('Failed to fetch result:', error)
  } finally {
    loading.value = false
    // 等待DOM更新后渲染雷达图
    await nextTick()
    setTimeout(() => {
      renderRadarChart()
    }, 100)
  }
}

const renderRadarChart = () => {
  if (!radarChartRef.value || !result.value?.dimensionScores?.length) return

  const chart = echarts.init(radarChartRef.value)

  const indicator = result.value.dimensionScores.map((dim) => ({
    name: dim.dimensionName,
    max: dim.maxScore,
  }))

  const values = result.value.dimensionScores.map((dim) => dim.score)

  const option = {
    tooltip: {
      trigger: 'item',
    },
    radar: {
      indicator,
      shape: 'polygon',
      splitNumber: 5,
      axisName: {
        color: '#64748B',
        fontSize: 12,
      },
      splitLine: {
        lineStyle: {
          color: '#E2E8F0',
        },
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['#F8FAFC', '#F1F5F9', '#E2E8F0', '#CBD5E1', '#94A3B8'],
        },
      },
      axisLine: {
        lineStyle: {
          color: '#E2E8F0',
        },
      },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: values,
            name: '能力得分',
            areaStyle: {
              color: 'rgba(59, 130, 246, 0.2)',
            },
            lineStyle: {
              color: '#3B82F6',
              width: 2,
            },
            itemStyle: {
              color: '#3B82F6',
            },
          },
        ],
      },
    ],
  }

  chart.setOption(option)

  // 响应式
  window.addEventListener('resize', () => {
    chart.resize()
  })
}

const getScoreColor = (ratio: number): string => {
  if (ratio >= 0.8) return '#22C55E'
  if (ratio >= 0.6) return '#3B82F6'
  if (ratio >= 0.4) return '#F59E0B'
  return '#EF4444'
}

onMounted(() => {
  fetchResult()
})
</script>