<template>
  <div class="max-w-4xl mx-auto">
    <!-- Loading -->
    <LoadingSpinner v-if="loading" text="加载中..." />

    <template v-else-if="project">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <button class="btn btn-secondary mb-3" @click="router.push('/admin/projects')">
            <ArrowLeft :size="16" />
            返回项目列表
          </button>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold" style="color: var(--color-text-primary)">
              {{ project.name }}
            </h1>
            <StatusBadge :status="project.status" type="project" />
          </div>
          <p v-if="project.description" class="mt-2 text-sm" style="color: var(--color-text-secondary)">
            {{ project.description }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            v-if="project.status === 'draft'"
            class="btn btn-success"
            @click="handleActivate"
          >
            <Play :size="16" />
            激活项目
          </button>
          <button
            v-if="project.status === 'active'"
            class="btn btn-secondary"
            @click="handleComplete"
          >
            <CheckCircle :size="16" />
            完成项目
          </button>
          <button
            v-if="project.status !== 'draft'"
            class="btn btn-primary"
            @click="router.push(`/admin/projects/${project.id}/results`)"
          >
            <BarChart3 :size="16" />
            查看结果
          </button>
          <button
            class="btn btn-secondary"
            @click="router.push(`/admin/projects/${project.id}/edit`)"
          >
            <Edit :size="16" />
            编辑
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="card p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm" style="color: var(--color-text-secondary)">参与成员</p>
              <p class="text-2xl font-bold mt-1" style="color: var(--color-text-primary)">
                {{ project.members?.length || 0 }}
              </p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users :size="20" style="color: var(--color-primary)" />
            </div>
          </div>
        </div>

        <div class="card p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm" style="color: var(--color-text-secondary)">评估任务</p>
              <p class="text-2xl font-bold mt-1" style="color: var(--color-text-primary)">
                {{ project.tasks?.length || 0 }}
              </p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <ClipboardList :size="20" style="color: #22C55E" />
            </div>
          </div>
        </div>

        <div class="card p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm" style="color: var(--color-text-secondary)">完成率</p>
              <p class="text-2xl font-bold mt-1" style="color: var(--color-text-primary)">
                {{ completionRate }}%
              </p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Percent :size="20" style="color: #8B5CF6" />
            </div>
          </div>
        </div>
      </div>

      <!-- Members and tasks -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold" style="color: var(--color-text-primary)">
            成员评估任务
          </h2>
          <p class="text-sm" style="color: var(--color-text-muted)">
            点击链接图标可复制成员专属评估链接
          </p>
        </div>

        <div class="space-y-4">
          <div
            v-for="member in project.members"
            :key="member.id"
            class="border rounded-lg p-4"
            style="border-color: var(--color-border)"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span class="font-bold" style="color: var(--color-primary)">
                    {{ member.user?.name?.charAt(0) || '?' }}
                  </span>
                </div>
                <div>
                  <p class="font-medium" style="color: var(--color-text-primary)">
                    {{ member.user?.name }}
                  </p>
                  <p class="text-sm" style="color: var(--color-text-muted)">
                    {{ member.user?.username }}
                    {{ member.user?.department ? ` · ${member.user.department}` : '' }}
                    {{ member.user?.position ? ` · ${member.user.position}` : '' }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <span
                  class="text-sm font-medium"
                  :style="{ color: isMemberCompleted(member.userId) ? '#16A34A' : 'var(--color-text-secondary)' }"
                >
                  {{ getMemberTaskStats(member.userId) }}
                </span>
                <button
                  v-if="project.status === 'active'"
                  class="btn btn-secondary btn-sm"
                  :class="{ 'btn-success': copiedUserId === member.userId }"
                  @click="copyInviteLink(member.userId)"
                  :title="copiedUserId === member.userId ? '已复制' : '复制评估链接'"
                >
                  <Check v-if="copiedUserId === member.userId" :size="14" />
                  <Link v-else :size="14" />
                  {{ copiedUserId === member.userId ? '已复制' : '复制链接' }}
                </button>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <span
                v-for="task in getMemberTasks(member.userId)"
                :key="task.id"
                class="badge"
                :class="getTaskBadgeClass(task)"
              >
                {{ task.targetUser?.name }}
                <span v-if="task.status === 'completed'" class="ml-1">✓</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { projectsApi } from '@/api/projects'
import type { AssessmentProject, AssessmentTask } from '@/types/api'
import { confirm } from '@/composables/useConfirm'
import {
  ArrowLeft,
  Play,
  CheckCircle,
  BarChart3,
  Edit,
  Users,
  ClipboardList,
  Percent,
  Check,
  Link,
} from 'lucide-vue-next'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import StatusBadge from '@/components/StatusBadge.vue'

const route = useRoute()
const router = useRouter()

const project = ref<AssessmentProject | null>(null)
const loading = ref(true)
const copiedUserId = ref<number | null>(null)

const projectId = computed(() => Number(route.params.id))

const completionRate = computed(() => {
  if (!project.value?.tasks?.length) return 0
  const completed = project.value.tasks.filter((t) => t.status === 'completed').length
  return Math.round((completed / project.value.tasks.length) * 100)
})

const fetchProject = async () => {
  loading.value = true
  try {
    project.value = await projectsApi.getDetail(projectId.value)
  } catch (error) {
    console.error('Failed to fetch project:', error)
  } finally {
    loading.value = false
  }
}

const getMemberTasks = (userId: number): AssessmentTask[] => {
  return project.value?.tasks?.filter((t) => t.assessorId === userId) || []
}

const getMemberTaskStats = (userId: number): string => {
  const tasks = getMemberTasks(userId)
  const completed = tasks.filter((t) => t.status === 'completed').length
  if (tasks.length > 0 && completed === tasks.length) {
    return '已全部完成'
  }
  return `${completed}/${tasks.length} 已完成`
}

const isMemberCompleted = (userId: number): boolean => {
  const tasks = getMemberTasks(userId)
  return tasks.length > 0 && tasks.every((t) => t.status === 'completed')
}

const getTaskBadgeClass = (task: AssessmentTask): string => {
  if (task.status === 'completed') return 'badge-success'
  if (task.status === 'in_progress') return 'badge-info'
  return 'badge-warning'
}

const getMemberInviteLink = (): string => {
  const baseUrl = window.location.origin
  return `${baseUrl}/login?redirect=/tasks&projectId=${projectId.value}`
}

const copyInviteLink = async (userId: number) => {
  const link = getMemberInviteLink()
  try {
    await navigator.clipboard.writeText(link)
    copiedUserId.value = userId
    setTimeout(() => {
      copiedUserId.value = null
    }, 2000)
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = link
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    copiedUserId.value = userId
    setTimeout(() => {
      copiedUserId.value = null
    }, 2000)
  }
}

const handleActivate = async () => {
  if (!project.value) return
  const confirmed = await confirm(`确定要激活项目 "${project.value.name}" 吗？激活后将为所有成员生成评估任务。`)
  if (!confirmed) return

  try {
    await projectsApi.activate(project.value.id)
    fetchProject()
  } catch (error: any) {
    alert(error.message || '激活失败，请重试')
  }
}

const handleComplete = async () => {
  if (!project.value) return
  const confirmed = await confirm(`确定要完成项目 "${project.value.name}" 吗？完成后将无法再提交评估。`)
  if (!confirmed) return

  try {
    await projectsApi.complete(project.value.id)
    fetchProject()
  } catch (error: any) {
    alert(error.message || '操作失败，请重试')
  }
}

onMounted(() => {
  fetchProject()
})
</script>

<style scoped>
.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}
</style>