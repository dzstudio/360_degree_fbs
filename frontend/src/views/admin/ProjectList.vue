<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold" style="color: var(--color-text-primary)">
        评估项目
      </h1>
      <router-link to="/admin/projects/create" class="btn btn-primary">
        <Plus :size="16" />
        创建项目
      </router-link>
    </div>

    <!-- Filters -->
    <div class="card p-4 mb-6">
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div class="flex-1 relative min-w-0">
          <Search
            class="absolute left-3 top-1/2 -translate-y-1/2"
            :size="18"
            style="color: var(--color-text-muted)"
          />
          <input
            v-model="keyword"
            type="text"
            placeholder="搜索项目名称..."
            class="input input-icon-left"
            @input="handleSearch"
          />
        </div>
        <select v-model="statusFilter" class="input w-full sm:w-36 flex-shrink-0" @change="fetchProjects">
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="active">进行中</option>
          <option value="completed">已完成</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <LoadingSpinner v-if="loading" text="加载中..." />

    <!-- Project list -->
    <div v-else>
      <!-- Desktop table -->
      <div class="hidden md:block card overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr style="border-bottom: 1px solid var(--color-border)">
              <th class="text-left p-4 text-sm font-medium" style="color: var(--color-text-secondary)">
                项目信息
              </th>
              <th class="text-left p-4 text-sm font-medium" style="color: var(--color-text-secondary)">
                成员数
              </th>
              <th class="text-left p-4 text-sm font-medium" style="color: var(--color-text-secondary)">
                状态
              </th>
              <th class="text-left p-4 text-sm font-medium" style="color: var(--color-text-secondary)">
                创建时间
              </th>
              <th class="text-right p-4 text-sm font-medium" style="color: var(--color-text-secondary)">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="project in projects"
              :key="project.id"
              class="hover:bg-gray-50 cursor-pointer"
              style="border-bottom: 1px solid var(--color-border-light)"
              @click="router.push(`/admin/projects/${project.id}`)"
            >
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FolderKanban :size="20" style="color: var(--color-primary)" />
                  </div>
                  <div>
                    <p class="font-medium" style="color: var(--color-text-primary)">
                      {{ project.name }}
                    </p>
                    <p class="text-sm" style="color: var(--color-text-muted)">
                      {{ project.projectNo }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="p-4 text-sm" style="color: var(--color-text-secondary)">
                {{ project.members?.length || 0 }} 人
              </td>
              <td class="p-4">
                <StatusBadge :status="project.status" type="project" />
              </td>
              <td class="p-4 text-sm" style="color: var(--color-text-secondary)">
                {{ formatDate(project.createTime) }}
              </td>
              <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-2" @click.stop>
                  <button
                    v-if="project.status === 'draft'"
                    class="btn btn-success btn-sm"
                    @click="handleActivate(project)"
                  >
                    <Play :size="14" />
                    激活
                  </button>
                  <button
                    v-if="project.status === 'active'"
                    class="btn btn-secondary btn-sm"
                    @click="handleComplete(project)"
                  >
                    <CheckCircle :size="14" />
                    完成
                  </button>
                  <button
                    class="btn btn-secondary btn-sm"
                    @click="router.push(`/admin/projects/${project.id}/edit`)"
                  >
                    <Edit :size="14" />
                    编辑
                  </button>
                  <button
                    class="btn btn-danger btn-sm"
                    @click="handleDelete(project)"
                  >
                    <Trash2 :size="14" />
                    删除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile cards -->
      <div class="md:hidden space-y-4">
        <div
          v-for="project in projects"
          :key="project.id"
          class="card p-4 cursor-pointer"
          @click="router.push(`/admin/projects/${project.id}`)"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FolderKanban :size="20" style="color: var(--color-primary)" />
              </div>
              <div>
                <p class="font-medium" style="color: var(--color-text-primary)">
                  {{ project.name }}
                </p>
                <p class="text-sm" style="color: var(--color-text-muted)">
                  {{ project.projectNo }}
                </p>
              </div>
            </div>
            <StatusBadge :status="project.status" type="project" />
          </div>

          <div class="flex items-center gap-4 text-sm mb-3" style="color: var(--color-text-secondary)">
            <span>{{ project.members?.length || 0 }} 人</span>
            <span>{{ formatDate(project.createTime) }}</span>
          </div>

          <div class="flex items-center gap-2" @click.stop>
            <button
              v-if="project.status === 'draft'"
              class="btn btn-success btn-sm flex-1"
              @click="handleActivate(project)"
            >
              <Play :size="14" />
              激活
            </button>
            <button
              v-if="project.status === 'active'"
              class="btn btn-secondary btn-sm flex-1"
              @click="handleComplete(project)"
            >
              <CheckCircle :size="14" />
              完成
            </button>
            <button
              class="btn btn-secondary btn-sm flex-1"
              @click="router.push(`/admin/projects/${project.id}/edit`)"
            >
              <Edit :size="14" />
              编辑
            </button>
            <button
              class="btn btn-danger btn-sm flex-1"
              @click="handleDelete(project)"
            >
              <Trash2 :size="14" />
              删除
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="projects.length === 0" class="card text-center py-12">
        <FolderKanban :size="48" class="mx-auto mb-3" style="color: var(--color-text-muted)" />
        <p class="text-sm mb-4" style="color: var(--color-text-muted)">暂无评估项目</p>
        <router-link to="/admin/projects/create" class="btn btn-primary">
          <Plus :size="16" />
          创建项目
        </router-link>
      </div>

      <!-- Pagination -->
      <div class="mt-6">
        <PaginationBar
          :total="total"
          :current-page="currentPage"
          :page-size="pageSize"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { projectsApi } from '@/api/projects'
import type { AssessmentProject } from '@/types/api'
import { formatDate } from '@/utils/format'
import { confirm } from '@/composables/useConfirm'
import {
  Plus,
  Search,
  FolderKanban,
  Play,
  CheckCircle,
  Edit,
  Trash2,
} from 'lucide-vue-next'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import PaginationBar from '@/components/PaginationBar.vue'

const router = useRouter()

const projects = ref<AssessmentProject[]>([])
const loading = ref(true)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const statusFilter = ref('')

let searchTimeout: ReturnType<typeof setTimeout>

const fetchProjects = async () => {
  loading.value = true
  try {
    const res = await projectsApi.getList({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: keyword.value,
      status: statusFilter.value,
    })
    projects.value = res.list
    total.value = res.total
  } catch (error) {
    console.error('Failed to fetch projects:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchProjects()
  }, 300)
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchProjects()
}

const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  fetchProjects()
}

const handleActivate = async (project: AssessmentProject) => {
  const confirmed = await confirm(`确定要激活项目 "${project.name}" 吗？激活后将为所有成员生成评估任务。`)
  if (!confirmed) return

  try {
    await projectsApi.activate(project.id)
    fetchProjects()
  } catch (error: any) {
    alert(error.message || '激活失败，请重试')
  }
}

const handleComplete = async (project: AssessmentProject) => {
  const confirmed = await confirm(`确定要完成项目 "${project.name}" 吗？完成后将无法再提交评估。`)
  if (!confirmed) return

  try {
    await projectsApi.complete(project.id)
    fetchProjects()
  } catch (error: any) {
    alert(error.message || '操作失败，请重试')
  }
}

const handleDelete = async (project: AssessmentProject) => {
  const confirmed = await confirm(`确定要删除项目 "${project.name}" 吗？此操作不可恢复。`)
  if (!confirmed) return

  try {
    await projectsApi.delete(project.id)
    fetchProjects()
  } catch (error: any) {
    alert(error.message || '删除失败，请重试')
  }
}

onMounted(() => {
  fetchProjects()
})
</script>

<style scoped>
.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}
</style>