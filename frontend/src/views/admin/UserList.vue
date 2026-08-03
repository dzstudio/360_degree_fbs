<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold" style="color: var(--color-text-primary)">
        用户管理
      </h1>
      <button class="btn btn-primary" @click="showCreateDialog = true">
        <Plus :size="16" />
        添加成员
      </button>
    </div>

    <!-- Search -->
    <div class="card p-4 mb-6">
      <div class="flex items-center gap-4">
        <div class="flex-1 relative">
          <Search
            class="absolute left-3 top-1/2 -translate-y-1/2"
            :size="18"
            style="color: var(--color-text-muted)"
          />
          <input
            v-model="keyword"
            type="text"
            placeholder="搜索用户名、姓名、部门..."
            class="input input-icon-left"
            @input="handleSearch"
          />
        </div>
      </div>
    </div>

    <!-- Loading -->
    <LoadingSpinner v-if="loading" text="加载中..." />

    <!-- User list -->
    <div v-else class="card">
      <!-- Desktop table -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr style="border-bottom: 1px solid var(--color-border)">
              <th class="text-left p-4 text-sm font-medium" style="color: var(--color-text-secondary)">
                用户
              </th>
              <th class="text-left p-4 text-sm font-medium" style="color: var(--color-text-secondary)">
                部门
              </th>
              <th class="text-left p-4 text-sm font-medium" style="color: var(--color-text-secondary)">
                职位
              </th>
              <th class="text-left p-4 text-sm font-medium" style="color: var(--color-text-secondary)">
                状态
              </th>
              <th class="text-right p-4 text-sm font-medium" style="color: var(--color-text-secondary)">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in users"
              :key="user.id"
              class="hover:bg-gray-50"
              style="border-bottom: 1px solid var(--color-border-light)"
            >
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span class="font-bold" style="color: var(--color-primary)">
                      {{ user.name?.charAt(0) || '?' }}
                    </span>
                  </div>
                  <div>
                    <p class="font-medium" style="color: var(--color-text-primary)">
                      {{ user.name }}
                    </p>
                    <p class="text-sm" style="color: var(--color-text-muted)">
                      {{ user.username }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="p-4 text-sm" style="color: var(--color-text-secondary)">
                {{ user.department || '-' }}
              </td>
              <td class="p-4 text-sm" style="color: var(--color-text-secondary)">
                {{ user.position || '-' }}
              </td>
              <td class="p-4">
                <span
                  class="badge"
                  :class="user.status === 'active' ? 'badge-success' : 'badge-danger'"
                >
                  {{ user.status === 'active' ? '正常' : '禁用' }}
                </span>
              </td>
              <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    class="btn btn-secondary btn-sm"
                    @click="handleEdit(user)"
                  >
                    <Edit :size="14" />
                    编辑
                  </button>
                  <button
                    class="btn btn-danger btn-sm"
                    @click="handleDelete(user)"
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
      <div class="md:hidden p-4 space-y-4">
        <div
          v-for="user in users"
          :key="user.id"
          class="p-4 rounded-lg border"
          style="border-color: var(--color-border)"
        >
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span class="font-bold" style="color: var(--color-primary)">
                {{ user.name?.charAt(0) || '?' }}
              </span>
            </div>
            <div class="flex-1">
              <p class="font-medium" style="color: var(--color-text-primary)">
                {{ user.name }}
              </p>
              <p class="text-sm" style="color: var(--color-text-muted)">
                {{ user.username }}
              </p>
            </div>
            <span
              class="badge"
              :class="user.status === 'active' ? 'badge-success' : 'badge-danger'"
            >
              {{ user.status === 'active' ? '正常' : '禁用' }}
            </span>
          </div>
          <div class="text-sm mb-3" style="color: var(--color-text-secondary)">
            <p v-if="user.department">部门: {{ user.department }}</p>
            <p v-if="user.position">职位: {{ user.position }}</p>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn btn-secondary btn-sm flex-1" @click="handleEdit(user)">
              <Edit :size="14" />
              编辑
            </button>
            <button class="btn btn-danger btn-sm flex-1" @click="handleDelete(user)">
              <Trash2 :size="14" />
              删除
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="users.length === 0" class="text-center py-12">
        <Users :size="48" class="mx-auto mb-3" style="color: var(--color-text-muted)" />
        <p class="text-sm" style="color: var(--color-text-muted)">暂无用户数据</p>
      </div>

      <!-- Pagination -->
      <div class="p-4">
        <PaginationBar
          :total="total"
          :current-page="currentPage"
          :page-size="pageSize"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </div>
    </div>

    <!-- Create/Edit dialog -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showCreateDialog || editingUser" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50" @click="closeDialog"></div>
          <div class="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 fade-in">
            <h3 class="text-lg font-semibold mb-4" style="color: var(--color-text-primary)">
              {{ editingUser ? '编辑用户' : '添加用户' }}
            </h3>

            <form @submit.prevent="handleSubmit">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium mb-2" style="color: var(--color-text-primary)">
                    用户名 *
                  </label>
                  <input
                    v-model="form.username"
                    type="text"
                    placeholder="请输入用户名"
                    class="input"
                    :disabled="!!editingUser"
                    :class="{ 'input-error': formErrors.username }"
                  />
                  <p v-if="formErrors.username" class="text-sm mt-1" style="color: var(--color-danger)">
                    {{ formErrors.username }}
                  </p>
                </div>

                <div v-if="!editingUser">
                  <label class="block text-sm font-medium mb-2" style="color: var(--color-text-primary)">
                    密码 *
                  </label>
                  <input
                    v-model="form.password"
                    type="password"
                    placeholder="请输入密码"
                    class="input"
                    :class="{ 'input-error': formErrors.password }"
                  />
                  <p v-if="formErrors.password" class="text-sm mt-1" style="color: var(--color-danger)">
                    {{ formErrors.password }}
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2" style="color: var(--color-text-primary)">
                    姓名 *
                  </label>
                  <input
                    v-model="form.name"
                    type="text"
                    placeholder="请输入姓名"
                    class="input"
                    :class="{ 'input-error': formErrors.name }"
                  />
                  <p v-if="formErrors.name" class="text-sm mt-1" style="color: var(--color-danger)">
                    {{ formErrors.name }}
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2" style="color: var(--color-text-primary)">
                    部门
                  </label>
                  <input
                    v-model="form.department"
                    type="text"
                    placeholder="请输入部门"
                    class="input"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2" style="color: var(--color-text-primary)">
                    职位
                  </label>
                  <input
                    v-model="form.position"
                    type="text"
                    placeholder="请输入职位"
                    class="input"
                  />
                </div>
              </div>

              <div class="flex justify-end gap-3 mt-6">
                <button type="button" class="btn btn-secondary" @click="closeDialog">
                  取消
                </button>
                <button type="submit" class="btn btn-primary" :disabled="submitting">
                  <Loader2 v-if="submitting" :size="16" class="animate-spin" />
                  {{ submitting ? '提交中...' : '确定' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { usersApi } from '@/api/users'
import type { User } from '@/types/api'
import { confirm } from '@/composables/useConfirm'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Loader2,
} from 'lucide-vue-next'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import PaginationBar from '@/components/PaginationBar.vue'

const users = ref<User[]>([])
const loading = ref(true)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const showCreateDialog = ref(false)
const editingUser = ref<User | null>(null)
const submitting = ref(false)

const form = reactive({
  username: '',
  password: '',
  name: '',
  department: '',
  position: '',
})

const formErrors = reactive({
  username: '',
  password: '',
  name: '',
})

let searchTimeout: ReturnType<typeof setTimeout>

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await usersApi.getList({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: keyword.value,
    })
    users.value = res.list
    total.value = res.total
  } catch (error) {
    console.error('Failed to fetch users:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchUsers()
  }, 300)
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchUsers()
}

const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  fetchUsers()
}

const resetForm = () => {
  form.username = ''
  form.password = ''
  form.name = ''
  form.department = ''
  form.position = ''
  formErrors.username = ''
  formErrors.password = ''
  formErrors.name = ''
}

const handleEdit = (user: User) => {
  editingUser.value = user
  form.username = user.username
  form.password = ''
  form.name = user.name
  form.department = user.department || ''
  form.position = user.position || ''
}

const closeDialog = () => {
  showCreateDialog.value = false
  editingUser.value = null
  resetForm()
}

const validate = () => {
  formErrors.username = ''
  formErrors.password = ''
  formErrors.name = ''
  let valid = true

  if (!form.username.trim()) {
    formErrors.username = '请输入用户名'
    valid = false
  }

  if (!editingUser.value && !form.password) {
    formErrors.password = '请输入密码'
    valid = false
  } else if (!editingUser.value && form.password.length < 6) {
    formErrors.password = '密码长度不能少于6位'
    valid = false
  }

  if (!form.name.trim()) {
    formErrors.name = '请输入姓名'
    valid = false
  }

  return valid
}

const handleSubmit = async () => {
  if (!validate()) return

  submitting.value = true
  try {
    if (editingUser.value) {
      await usersApi.update(editingUser.value.id, {
        name: form.name,
        department: form.department,
        position: form.position,
      })
    } else {
      await usersApi.create({
        username: form.username,
        password: form.password,
        name: form.name,
        department: form.department,
        position: form.position,
      })
    }
    closeDialog()
    fetchUsers()
  } catch (error: any) {
    alert(error.message || '操作失败，请重试')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (user: User) => {
  const confirmed = await confirm(`确定要删除用户 "${user.name}" 吗？`)
  if (!confirmed) return

  try {
    await usersApi.delete(user.id)
    fetchUsers()
  } catch (error: any) {
    alert(error.message || '删除失败，请重试')
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}
</style>