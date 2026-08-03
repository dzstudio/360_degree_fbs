<template>
  <div class="max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-6" style="color: var(--color-text-primary)">
      我的评估待办
    </h1>

    <!-- Loading -->
    <LoadingSpinner v-if="loading" text="加载中..." />

    <!-- Empty state -->
    <EmptyState
      v-else-if="tasks.length === 0"
      :icon="ClipboardList"
      message="暂无评估待办任务"
    />

    <!-- Task list -->
    <div v-else class="space-y-4">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="card p-5 hover:shadow-md transition-shadow cursor-pointer fade-in"
        @click="goToTask(task.id)"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h3 class="font-semibold" style="color: var(--color-text-primary)">
                评估 {{ task.targetUser?.name }}
              </h3>
              <StatusBadge :status="task.status" type="task" />
            </div>

            <div class="flex items-center gap-4 text-sm" style="color: var(--color-text-secondary)">
              <span v-if="task.targetUser?.department">
                <Building2 :size="14" class="inline mr-1" />
                {{ task.targetUser.department }}
              </span>
              <span v-if="task.targetUser?.position">
                <Briefcase :size="14" class="inline mr-1" />
                {{ task.targetUser.position }}
              </span>
              <span v-if="task.project">
                <FolderKanban :size="14" class="inline mr-1" />
                {{ task.project.name }}
              </span>
            </div>
          </div>

          <ChevronRight :size="20" style="color: var(--color-text-muted)" />
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <PaginationBar
      v-if="tasks.length > 0"
      :total="total"
      :current-page="currentPage"
      :page-size="pageSize"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { tasksApi } from '@/api/tasks'
import type { AssessmentTask } from '@/types/api'
import {
  ClipboardList,
  Building2,
  Briefcase,
  FolderKanban,
  ChevronRight,
} from 'lucide-vue-next'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import EmptyState from '@/components/EmptyState.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import PaginationBar from '@/components/PaginationBar.vue'

const router = useRouter()

const tasks = ref<AssessmentTask[]>([])
const loading = ref(true)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

const fetchTasks = async () => {
  loading.value = true
  try {
    const res = await tasksApi.getMyTasks({
      page: currentPage.value,
      pageSize: pageSize.value,
    })
    tasks.value = res.list
    total.value = res.total
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
  } finally {
    loading.value = false
  }
}

const goToTask = (id: number) => {
  router.push(`/tasks/${id}`)
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchTasks()
}

const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  fetchTasks()
}

onMounted(() => {
  fetchTasks()
})
</script>