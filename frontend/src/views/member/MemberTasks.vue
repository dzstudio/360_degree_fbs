<template>
  <div class="max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-6" style="color: var(--color-text-primary)">
      我的评估
    </h1>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2" style="border-color: var(--color-primary)"></div>
    </div>

    <!-- 项目列表 -->
    <div v-else-if="projects.length > 0" class="space-y-6">
      <div v-for="project in projects" :key="project.id" class="rounded-lg shadow-md overflow-hidden" style="background: #ffffff">
        <!-- 项目头部 -->
        <div class="p-6 border-b" style="border-color: var(--color-border)">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3">
                <h2 class="text-xl font-semibold" style="color: var(--color-text)">{{ project.name }}</h2>
                <span
                  v-if="project.isSubmitted"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style="background: #dcfce7; color: #166534"
                >
                  <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  已提交
                </span>
                <span
                  v-else
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style="background: #fef9c3; color: #854d0e"
                >
                  <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  待提交
                </span>
              </div>
              <p v-if="project.description" class="mt-1 text-sm" style="color: var(--color-text-muted)">
                {{ project.description }}
              </p>
              <p class="text-sm mt-1" style="color: var(--color-text-muted)">
                项目编号: {{ project.projectNo }}
              </p>
            </div>
            <button
              v-if="project.canSubmit"
              @click="submitProject(project)"
              class="px-4 py-2 text-sm font-medium rounded-md transition-colors"
              style="background: var(--color-primary); color: white"
            >
              提交项目
            </button>
          </div>

          <!-- 完成进度 -->
          <div class="mt-4 p-4 rounded-lg" style="background: var(--color-bg-muted)">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium" style="color: var(--color-text)">完成进度</span>
              <span class="text-sm" style="color: var(--color-text-muted)">{{ project.completedCount }}/{{ project.totalCount }} 人</span>
            </div>
            <div class="w-full rounded-full h-3" style="background: var(--color-border)">
              <div
                class="h-3 rounded-full transition-all"
                :style="{
                  width: project.completionRate + '%',
                  background: project.completionRate === 100 ? '#22c55e' : 'var(--color-primary)',
                }"
              ></div>
            </div>
            <div class="text-right mt-1">
              <span class="text-lg font-bold" style="color: var(--color-text)">{{ project.completionRate }}%</span>
            </div>
          </div>

          <!-- 评分分布 -->
          <div class="mt-3 p-4 rounded-lg" style="background: var(--color-bg-muted)">
            <div class="text-sm font-medium mb-4" style="color: var(--color-text)">评分分布</div>

            <!-- 高分 -->
            <div class="mb-4">
              <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center gap-2">
                  <span class="text-xs" style="color: var(--color-text-muted)">高分 (4-5分)</span>
                  <div v-if="project.distribution.high.names.length > 0" class="flex flex-wrap gap-1">
                    <span v-for="name in project.distribution.high.names" :key="name" class="inline-flex items-center px-1.5 py-0.5 rounded text-xs" style="background: #dcfce7; color: #166534">
                      {{ name }}
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-medium" style="color: #22c55e">
                    {{ project.distribution.high.ratio }}%
                    <span v-if="project.distribution.high.count > 0" class="ml-1" style="color: var(--color-text-muted)">({{ project.distribution.high.count }}人)</span>
                  </span>
                  <span v-if="getHighDiff(project) !== 0" class="text-xs" :style="{ color: getHighDiff(project) > 0 ? '#ef4444' : '#3b82f6' }">
                    {{ getHighDiff(project) > 0 ? '超出' : '缺少' }} {{ Math.abs(getHighDiff(project)) }}人
                  </span>
                </div>
              </div>
              <div class="w-full rounded-full h-2.5" style="background: var(--color-border)">
                <div class="h-2.5 rounded-full" style="background: #22c55e" :style="{ width: project.distribution.high.ratio + '%' }"></div>
              </div>
            </div>

            <!-- 中分 -->
            <div class="mb-4">
              <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center gap-2">
                  <span class="text-xs" style="color: var(--color-text-muted)">中分 (3-4分)</span>
                  <div v-if="project.distribution.mid.names.length > 0" class="flex flex-wrap gap-1">
                    <span v-for="name in project.distribution.mid.names" :key="name" class="inline-flex items-center px-1.5 py-0.5 rounded text-xs" style="background: #dbeafe; color: #1e40af">
                      {{ name }}
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-medium" style="color: #3b82f6">
                    {{ project.distribution.mid.ratio }}%
                    <span v-if="project.distribution.mid.count > 0" class="ml-1" style="color: var(--color-text-muted)">({{ project.distribution.mid.count }}人)</span>
                  </span>
                  <span v-if="getMidDiff(project) !== 0" class="text-xs" :style="{ color: getMidDiff(project) > 0 ? '#ef4444' : '#3b82f6' }">
                    {{ getMidDiff(project) > 0 ? '超出' : '缺少' }} {{ Math.abs(getMidDiff(project)) }}人
                  </span>
                </div>
              </div>
              <div class="w-full rounded-full h-2.5" style="background: var(--color-border)">
                <div class="h-2.5 rounded-full" style="background: #3b82f6" :style="{ width: project.distribution.mid.ratio + '%' }"></div>
              </div>
            </div>

            <!-- 低分 -->
            <div class="mb-4">
              <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center gap-2">
                  <span class="text-xs" style="color: var(--color-text-muted)">低分 (1-3分)</span>
                  <div v-if="project.distribution.low.names.length > 0" class="flex flex-wrap gap-1">
                    <span v-for="name in project.distribution.low.names" :key="name" class="inline-flex items-center px-1.5 py-0.5 rounded text-xs" style="background: #fee2e2; color: #991b1b">
                      {{ name }}
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-medium" style="color: #ef4444">
                    {{ project.distribution.low.ratio }}%
                    <span v-if="project.distribution.low.count > 0" class="ml-1" style="color: var(--color-text-muted)">({{ project.distribution.low.count }}人)</span>
                  </span>
                  <span v-if="getLowDiff(project) !== 0" class="text-xs" :style="{ color: getLowDiff(project) > 0 ? '#ef4444' : '#3b82f6' }">
                    {{ getLowDiff(project) > 0 ? '超出' : '缺少' }} {{ Math.abs(getLowDiff(project)) }}人
                  </span>
                </div>
              </div>
              <div class="w-full rounded-full h-2.5" style="background: var(--color-border)">
                <div class="h-2.5 rounded-full" style="background: #ef4444" :style="{ width: project.distribution.low.ratio + '%' }"></div>
              </div>
            </div>

            <!-- 分布提示 -->
            <div class="mt-4 p-2.5 rounded text-xs text-center" style="background: #fef3c7; color: #92400e">
              <svg class="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              评估对象分数需符合正态分布
            </div>
          </div>
        </div>

        <!-- 评估任务列表 -->
        <div class="p-6">
          <h3 class="text-sm font-medium mb-4" style="color: var(--color-text-muted)">评估对象</h3>
          <div class="space-y-3">
            <div
              v-for="task in project.tasks"
              :key="task.id"
              class="flex items-center justify-between p-4 rounded-lg border transition-colors hover:shadow-md"
              style="border-color: var(--color-border)"
            >
              <div class="flex items-center">
                <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium" style="background: var(--color-primary)">
                  {{ task.targetUser.name.charAt(0) }}
                </div>
                <div class="ml-3">
                  <div class="text-sm font-medium" style="color: var(--color-text)">{{ task.targetUser.name }}</div>
                  <div class="text-xs" style="color: var(--color-text-muted)">{{ task.targetUser.department }} · {{ task.targetUser.position }}</div>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <!-- 得分显示 -->
                <span
                  v-if="task.status === 'completed' && task.score != null"
                  class="text-sm font-semibold px-2 py-1 rounded"
                  :style="{ background: getScoreBg(task.score), color: getScoreColor(task.score) }"
                >
                  {{ task.score.toFixed(1) }} 分
                </span>
                <!-- 完成状态 -->
                <span
                  v-if="task.status === 'completed'"
                  class="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium"
                  style="background: #dcfce7; color: #166534"
                >
                  已完成
                </span>
                <button
                  v-else
                  @click="startTask(task.id)"
                  class="px-3 py-1.5 text-xs font-medium rounded transition-colors"
                  style="background: var(--color-primary); color: white"
                >
                  开始评估
                </button>
                <!-- 修改评估按钮（仅在未提交项目且任务已完成时显示） -->
                <button
                  v-if="task.status === 'completed' && !project.isSubmitted"
                  @click.prevent="resetTask(task.id)"
                  class="px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer hover:opacity-80"
                  style="background: var(--color-bg-muted); color: var(--color-text); border: 1px solid var(--color-border)"
                >
                  修改评估
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="text-center py-12">
      <svg class="w-12 h-12 mx-auto" fill="none" stroke="var(--color-text-muted)" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
      <h3 class="mt-4 text-lg font-medium" style="color: var(--color-text)">暂无评估项目</h3>
      <p class="mt-2 text-sm" style="color: var(--color-text-muted)">当前没有需要您参与的评估项目</p>
    </div>

    <!-- 提交确认对话框 -->
    <Teleport to="body">
      <div v-if="showSubmitDialog" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0" style="background: rgba(0, 0, 0, 0.5)" @click="showSubmitDialog = false"></div>
        <div class="relative rounded-lg shadow-xl max-w-md w-full mx-4 p-6" style="background: #ffffff">
          <h3 class="text-lg font-semibold mb-4" style="color: var(--color-text)">确认提交</h3>

          <div v-if="submitProjectData" class="space-y-4">
            <p class="text-sm" style="color: var(--color-text-muted)">
              您即将提交「{{ submitProjectData.name }}」的评估结果。提交后将无法修改。
            </p>

            <!-- 分布预览 -->
            <div class="p-4 rounded-lg" style="background: var(--color-bg-muted)">
              <div class="text-sm font-medium mb-3" style="color: var(--color-text)">评分分布</div>
              <div class="space-y-3">
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs" style="color: var(--color-text-muted)">高分</span>
                    <span class="text-xs" style="color: var(--color-text)">{{ submitProjectData.distribution.high.ratio }}%</span>
                  </div>
                  <div class="w-full rounded-full h-3" style="background: var(--color-border)">
                    <div class="h-3 rounded-full" style="background: #22c55e" :style="{ width: submitProjectData.distribution.high.ratio + '%' }"></div>
                  </div>
                </div>
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs" style="color: var(--color-text-muted)">中分</span>
                    <span class="text-xs" style="color: var(--color-text)">{{ submitProjectData.distribution.mid.ratio }}%</span>
                  </div>
                  <div class="w-full rounded-full h-3" style="background: var(--color-border)">
                    <div class="h-3 rounded-full" style="background: #3b82f6" :style="{ width: submitProjectData.distribution.mid.ratio + '%' }"></div>
                  </div>
                </div>
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs" style="color: var(--color-text-muted)">低分</span>
                    <span class="text-xs" style="color: var(--color-text)">{{ submitProjectData.distribution.low.ratio }}%</span>
                  </div>
                  <div class="w-full rounded-full h-3" style="background: var(--color-border)">
                    <div class="h-3 rounded-full" style="background: #ef4444" :style="{ width: submitProjectData.distribution.low.ratio + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 分布校验提示 - 醒目样式 -->
            <div
              v-if="distributionWarning"
              class="p-4 rounded-lg border-2"
              style="background: #fef2f2; border-color: #ef4444"
            >
              <div class="flex items-center">
                <svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="#ef4444" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span class="text-sm font-medium" style="color: #dc2626">{{ distributionWarning }}</span>
              </div>
              <p class="mt-2 text-xs" style="color: #b91c1c">请调整评分后再提交，评分分布需符合正态分布要求。</p>
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button
              @click="showSubmitDialog = false"
              class="px-4 py-2 text-sm font-medium rounded-md transition-colors"
              style="background: var(--color-bg-muted); color: var(--color-text)"
            >
              取消
            </button>
            <button
              @click="confirmSubmit"
              :disabled="submitting || !!distributionWarning"
              class="px-4 py-2 text-sm font-medium rounded-md transition-colors"
              :style="{
                background: distributionWarning ? '#d1d5db' : 'var(--color-primary)',
                color: distributionWarning ? '#6b7280' : 'white',
                cursor: distributionWarning ? 'not-allowed' : 'pointer'
              }"
            >
              {{ submitting ? '提交中...' : '确认提交' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { projectsApi, type MyProject } from '@/api/projects'
import { tasksApi } from '@/api/tasks'

const router = useRouter()
const loading = ref(true)
const projects = ref<MyProject[]>([])
const showSubmitDialog = ref(false)
const submitProjectData = ref<MyProject | null>(null)
const submitting = ref(false)

// 理想正态分布比例：高分 25%，中分 50%，低分 25%
const IDEAL_HIGH = 25
const IDEAL_MID = 50
const IDEAL_LOW = 25

const getHighDiff = (project: MyProject) => {
  const total = project.distribution.high.count + project.distribution.mid.count + project.distribution.low.count
  if (total === 0) return 0
  const expected = Math.round(total * IDEAL_HIGH / 100)
  return project.distribution.high.count - expected
}

const getMidDiff = (project: MyProject) => {
  const total = project.distribution.high.count + project.distribution.mid.count + project.distribution.low.count
  if (total === 0) return 0
  const expected = Math.round(total * IDEAL_MID / 100)
  return project.distribution.mid.count - expected
}

const getLowDiff = (project: MyProject) => {
  const total = project.distribution.high.count + project.distribution.mid.count + project.distribution.low.count
  if (total === 0) return 0
  const expected = Math.round(total * IDEAL_LOW / 100)
  return project.distribution.low.count - expected
}

const getScoreBg = (score: number) => {
  if (score >= 4) return '#dcfce7'
  if (score >= 3) return '#dbeafe'
  return '#fee2e2'
}

const getScoreColor = (score: number) => {
  if (score >= 4) return '#166534'
  if (score >= 3) return '#1e40af'
  return '#991b1b'
}

// 检查分布是否符合要求（正态分布）
const checkDistribution = (project: MyProject): string | null => {
  const { high, mid, low } = project.distribution
  const total = high.count + mid.count + low.count

  if (total < 3) return '评估人数不足，无法进行分布校验'

  // 正态分布校验规则：三档都必须有人
  if (high.count === 0) {
    return '评分分布不符合要求：缺少高分（4-5分），请调整评分'
  }
  if (mid.count === 0) {
    return '评分分布不符合要求：缺少中分（3-4分），请调整评分'
  }
  if (low.count === 0) {
    return '评分分布不符合要求：缺少低分（1-3分），请调整评分'
  }

  // 高分占比不能过高
  if (high.ratio > 60) return `高分占比过高(${high.ratio}%)，请调整评分`

  // 低分占比不能过高
  if (low.ratio > 60) return `低分占比过高(${low.ratio}%)，请调整评分`

  return null
}

const distributionWarning = computed(() => {
  if (!submitProjectData.value) return null
  return checkDistribution(submitProjectData.value)
})

const fetchProjects = async () => {
  loading.value = true
  try {
    const res = await projectsApi.getMyList()
    projects.value = res
  } catch (err) {
    console.error('获取项目列表失败:', err)
  } finally {
    loading.value = false
  }
}

const startTask = (taskId: number) => {
  router.push(`/tasks/${taskId}`)
}

const resetTask = async (taskId: number) => {
  try {
    await tasksApi.reset(taskId)
    router.push(`/tasks/${taskId}`)
  } catch (err: any) {
    console.error('修改评估失败:', err)
  }
}

const submitProject = (project: MyProject) => {
  // 先检查分布是否符合要求
  const warning = checkDistribution(project)
  if (warning) {
    alert(warning)
    return
  }
  submitProjectData.value = project
  showSubmitDialog.value = true
}

const confirmSubmit = async () => {
  if (!submitProjectData.value || distributionWarning.value) return

  submitting.value = true
  try {
    await projectsApi.submit(submitProjectData.value.id)
    showSubmitDialog.value = false
    await fetchProjects()
    alert('提交成功！')
  } catch (err: any) {
    const message = err.response?.data?.message || '提交失败'
    alert(message)
  } finally {
    submitting.value = false
  }
}

onMounted(fetchProjects)
</script>
