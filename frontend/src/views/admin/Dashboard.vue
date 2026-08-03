<template>
  <div>
    <h1 class="text-2xl font-bold mb-6" style="color: var(--color-text-primary)">
      仪表盘
    </h1>

    <!-- Loading -->
    <LoadingSpinner v-if="loading" text="加载中..." />

    <!-- Stats -->
    <template v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="card p-6 fade-in">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm" style="color: var(--color-text-secondary)">团队成员</p>
              <p class="text-3xl font-bold mt-1" style="color: var(--color-text-primary)">
                {{ stats.totalMembers }}
              </p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users :size="24" style="color: var(--color-primary)" />
            </div>
          </div>
        </div>

        <div class="card p-6 fade-in" style="animation-delay: 0.1s">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm" style="color: var(--color-text-secondary)">评估项目</p>
              <p class="text-3xl font-bold mt-1" style="color: var(--color-text-primary)">
                {{ stats.totalProjects }}
              </p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <FolderKanban :size="24" style="color: #22C55E" />
            </div>
          </div>
        </div>

        <div class="card p-6 fade-in" style="animation-delay: 0.2s">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm" style="color: var(--color-text-secondary)">进行中项目</p>
              <p class="text-3xl font-bold mt-1" style="color: var(--color-text-primary)">
                {{ stats.activeProjects }}
              </p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock :size="24" style="color: #F59E0B" />
            </div>
          </div>
        </div>

        <div class="card p-6 fade-in" style="animation-delay: 0.3s">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm" style="color: var(--color-text-secondary)">待完成评估</p>
              <p class="text-3xl font-bold mt-1" style="color: var(--color-text-primary)">
                {{ stats.pendingTasks }}
              </p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <ClipboardList :size="24" style="color: #8B5CF6" />
            </div>
          </div>
        </div>
      </div>

      <!-- Recent projects -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold" style="color: var(--color-text-primary)">
            最近的评估项目
          </h2>
          <router-link to="/admin/projects" class="btn btn-secondary btn-sm">
            查看全部
          </router-link>
        </div>

        <div v-if="recentProjects.length === 0" class="text-center py-8">
          <FolderKanban :size="48" class="mx-auto mb-3" style="color: var(--color-text-muted)" />
          <p class="text-sm" style="color: var(--color-text-muted)">暂无评估项目</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="project in recentProjects"
            :key="project.id"
            class="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 cursor-pointer"
            @click="router.push(`/admin/projects/${project.id}`)"
          >
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FolderKanban :size="20" style="color: var(--color-primary)" />
              </div>
              <div>
                <p class="font-medium" style="color: var(--color-text-primary)">
                  {{ project.name }}
                </p>
                <p class="text-sm" style="color: var(--color-text-muted)">
                  {{ formatDate(project.createTime) }}
                </p>
              </div>
            </div>
            <StatusBadge :status="project.status" type="project" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { projectsApi } from '@/api/projects'
import { usersApi } from '@/api/users'
import type { AssessmentProject } from '@/types/api'
import { formatDate } from '@/utils/format'
import {
  Users,
  FolderKanban,
  Clock,
  ClipboardList,
} from 'lucide-vue-next'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import StatusBadge from '@/components/StatusBadge.vue'

const router = useRouter()

const loading = ref(true)
const stats = ref({
  totalMembers: 0,
  totalProjects: 0,
  activeProjects: 0,
  pendingTasks: 0,
})
const recentProjects = ref<AssessmentProject[]>([])

const fetchDashboard = async () => {
  loading.value = true
  try {
    const [membersRes, projectsRes] = await Promise.all([
      usersApi.getList({ pageSize: 1 }),
      projectsApi.getList({ pageSize: 5 }),
    ])

    stats.value.totalMembers = membersRes.total
    stats.value.totalProjects = projectsRes.total
    stats.value.activeProjects = projectsRes.list.filter(
      (p) => p.status === 'active'
    ).length

    recentProjects.value = projectsRes.list
  } catch (error) {
    console.error('Failed to fetch dashboard:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboard()
})
</script>

<style scoped>
.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}
</style>