<template>
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <button class="btn btn-secondary mb-3" @click="router.push(`/admin/projects/${projectId}`)">
          <ArrowLeft :size="16" />
          返回项目详情
        </button>
        <h1 class="text-2xl font-bold" style="color: var(--color-text-primary)">
          评估结果
        </h1>
        <p v-if="project" class="mt-1 text-sm" style="color: var(--color-text-secondary)">
          {{ project.name }}
        </p>
      </div>
    </div>

    <!-- Loading -->
    <LoadingSpinner v-if="loading" text="加载中..." />

    <template v-else>
      <!-- Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="card p-5">
          <p class="text-sm" style="color: var(--color-text-secondary)">参与人数</p>
          <p class="text-2xl font-bold mt-1" style="color: var(--color-text-primary)">
            {{ statistics?.totalMembers || 0 }}
          </p>
        </div>
        <div class="card p-5">
          <p class="text-sm" style="color: var(--color-text-secondary)">评估任务总数</p>
          <p class="text-2xl font-bold mt-1" style="color: var(--color-text-primary)">
            {{ statistics?.totalTasks || 0 }}
          </p>
        </div>
        <div class="card p-5">
          <p class="text-sm" style="color: var(--color-text-secondary)">已完成</p>
          <p class="text-2xl font-bold mt-1" style="color: var(--color-text-primary)">
            {{ statistics?.completedTasks || 0 }}
          </p>
        </div>
        <div class="card p-5">
          <p class="text-sm" style="color: var(--color-text-secondary)">平均分</p>
          <p class="text-2xl font-bold mt-1" style="color: var(--color-text-primary)">
            {{ statistics?.averageScore?.toFixed(1) || '-' }}
          </p>
        </div>
      </div>

      <!-- Dimension averages -->
      <div class="card p-6 mb-8">
        <h2 class="text-lg font-semibold mb-4" style="color: var(--color-text-primary)">
          各维度平均分
        </h2>
        <div class="space-y-4">
          <div
            v-for="dim in statistics?.dimensionAverages"
            :key="dim.dimensionId"
            class="flex items-center gap-4"
          >
            <div class="w-32 text-sm font-medium" style="color: var(--color-text-primary)">
              {{ dim.dimensionName }}
            </div>
            <div class="flex-1">
              <div class="h-6 rounded-full overflow-hidden" style="background: var(--color-border-light)">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :style="{
                    width: `${(dim.score / dim.maxScore) * 100}%`,
                    background: getScoreColor(dim.score / dim.maxScore),
                  }"
                ></div>
              </div>
            </div>
            <div class="w-20 text-right text-sm font-medium" style="color: var(--color-text-primary)">
              {{ dim.score.toFixed(1) }}/{{ dim.maxScore }}
            </div>
          </div>
        </div>
      </div>

      <!-- Individual results -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold" style="color: var(--color-text-primary)">
            个人评估结果
          </h2>
        </div>

        <div class="space-y-4">
          <div
            v-for="result in results"
            :key="result.userId"
            class="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
            style="border-color: var(--color-border)"
            @click="router.push(`/admin/projects/${projectId}/results/${result.userId}`)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span class="font-bold" style="color: var(--color-primary)">
                    {{ result.user?.name?.charAt(0) || '?' }}
                  </span>
                </div>
                <div>
                  <p class="font-medium" style="color: var(--color-text-primary)">
                    {{ result.user?.name }}
                  </p>
                  <p class="text-sm" style="color: var(--color-text-muted)">
                    {{ result.user?.department || '' }} {{ result.user?.position ? `· ${result.user.position}` : '' }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-6">
                <div class="text-right">
                  <p class="text-sm" style="color: var(--color-text-secondary)">完成率</p>
                  <p class="font-medium" style="color: var(--color-text-primary)">
                    {{ result.completedCount }}/{{ result.totalCount }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-sm" style="color: var(--color-text-secondary)">总分</p>
                  <p class="text-xl font-bold" style="color: var(--color-primary)">
                    {{ result.totalScore.toFixed(1) }}
                  </p>
                </div>
                <ChevronRight :size="20" style="color: var(--color-text-muted)" />
              </div>
            </div>
          </div>
        </div>

        <div v-if="results.length === 0" class="text-center py-8">
          <BarChart3 :size="48" class="mx-auto mb-3" style="color: var(--color-text-muted)" />
          <p class="text-sm" style="color: var(--color-text-muted)">暂无评估结果</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { projectsApi } from '@/api/projects'
import type { AssessmentProject, AssessmentResult, ProjectStatistics } from '@/types/api'
import {
  ArrowLeft,
  ChevronRight,
  BarChart3,
} from 'lucide-vue-next'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()

const projectId = computed(() => Number(route.params.id))

const project = ref<AssessmentProject | null>(null)
const results = ref<AssessmentResult[]>([])
const statistics = ref<ProjectStatistics | null>(null)
const loading = ref(true)

const fetchData = async () => {
  loading.value = true
  try {
    const [projectRes, resultsRes, statsRes] = await Promise.all([
      projectsApi.getDetail(projectId.value),
      projectsApi.getResults(projectId.value),
      projectsApi.getStatistics(projectId.value),
    ])
    project.value = projectRes
    results.value = resultsRes
    statistics.value = statsRes
  } catch (error) {
    console.error('Failed to fetch results:', error)
  } finally {
    loading.value = false
  }
}

const getScoreColor = (ratio: number): string => {
  if (ratio >= 0.8) return '#22C55E'
  if (ratio >= 0.6) return '#3B82F6'
  if (ratio >= 0.4) return '#F59E0B'
  return '#EF4444'
}

onMounted(() => {
  fetchData()
})
</script>