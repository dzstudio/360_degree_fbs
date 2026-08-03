<template>
  <div class="max-w-4xl mx-auto">
    <div class="flex items-center gap-4 mb-6">
      <button class="btn btn-secondary" @click="router.push('/admin/projects')">
        <ArrowLeft :size="16" />
        返回
      </button>
      <h1 class="text-2xl font-bold" style="color: var(--color-text-primary)">
        {{ isEdit ? '编辑项目' : '创建项目' }}
      </h1>
    </div>

    <!-- Loading -->
    <LoadingSpinner v-if="loadingInitial" text="加载中..." />

    <!-- Form -->
    <form v-else @submit.prevent="handleSubmit">
      <!-- Basic info -->
      <div class="card p-6 mb-6">
        <h2 class="text-lg font-semibold mb-4" style="color: var(--color-text-primary)">
          基本信息
        </h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2" style="color: var(--color-text-primary)">
              项目名称 *
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="请输入项目名称"
              class="input"
              :class="{ 'input-error': errors.name }"
            />
            <p v-if="errors.name" class="text-sm mt-1" style="color: var(--color-danger)">
              {{ errors.name }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2" style="color: var(--color-text-primary)">
              项目描述
            </label>
            <textarea
              v-model="form.description"
              placeholder="请输入项目描述"
              class="input min-h-[100px] resize-y"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2" style="color: var(--color-text-primary)">
              问卷模板
            </label>
            <select v-model="form.templateId" class="input">
              <option :value="undefined">使用默认模板</option>
              <option
                v-for="template in templates"
                :key="template.id"
                :value="template.id"
              >
                {{ template.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Members -->
      <div class="card p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold" style="color: var(--color-text-primary)">
            选择成员
          </h2>
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                :checked="isAllSelected"
                @change="toggleSelectAll"
                class="w-4 h-4 rounded"
              />
              <span class="text-sm" style="color: var(--color-text-secondary)">全选</span>
            </label>
            <span class="text-sm" style="color: var(--color-text-muted)">
              已选 {{ form.memberIds.length }} 人
            </span>
          </div>
        </div>

        <p v-if="errors.memberIds" class="text-sm mb-3" style="color: var(--color-danger)">
          {{ errors.memberIds }}
        </p>

        <!-- Search -->
        <div class="relative mb-4">
          <Search
            class="absolute left-3 top-1/2 -translate-y-1/2"
            :size="18"
            style="color: var(--color-text-muted)"
          />
          <input
            v-model="memberSearch"
            type="text"
            placeholder="搜索成员..."
            class="input input-icon-left"
          />
        </div>

        <!-- Member list -->
        <div class="max-h-[400px] overflow-y-auto space-y-2">
          <label
            v-for="member in filteredMembers"
            :key="member.id"
            class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <input
              v-model="form.memberIds"
              :value="member.id"
              type="checkbox"
              class="w-4 h-4 rounded"
            />
            <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <User :size="18" style="color: var(--color-primary)" />
            </div>
            <div class="flex-1">
              <p class="font-medium" style="color: var(--color-text-primary)">
                {{ member.name }}
              </p>
              <p class="text-sm" style="color: var(--color-text-muted)">
                {{ member.department || '' }} {{ member.position ? `· ${member.position}` : '' }}
              </p>
            </div>
          </label>
        </div>

        <div v-if="filteredMembers.length === 0" class="text-center py-8">
          <Users :size="32" class="mx-auto mb-2" style="color: var(--color-text-muted)" />
          <p class="text-sm" style="color: var(--color-text-muted)">未找到匹配的成员</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-4">
        <button type="button" class="btn btn-secondary" @click="router.push('/admin/projects')">
          取消
        </button>
        <button type="submit" class="btn btn-primary" :disabled="submitting">
          <Loader2 v-if="submitting" :size="16" class="animate-spin" />
          {{ submitting ? '提交中...' : (isEdit ? '保存修改' : '创建项目') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { projectsApi } from '@/api/projects'
import { usersApi } from '@/api/users'
import { templatesApi } from '@/api/templates'
import type { User, QuestionnaireTemplate } from '@/types/api'
import {
  ArrowLeft,
  Search,
  Users,
  Loader2,
} from 'lucide-vue-next'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)
const projectId = computed(() => Number(route.params.id))

const loadingInitial = ref(true)
const submitting = ref(false)
const members = ref<User[]>([])
const templates = ref<QuestionnaireTemplate[]>([])
const memberSearch = ref('')

const form = reactive({
  name: '',
  description: '',
  templateId: undefined as number | undefined,
  memberIds: [] as number[],
})

const errors = reactive({
  name: '',
  memberIds: '',
})

const filteredMembers = computed(() => {
  const search = memberSearch.value.toLowerCase()
  if (!search) return members.value
  return members.value.filter(
    (m) =>
      m.name.toLowerCase().includes(search) ||
      m.username.toLowerCase().includes(search) ||
      m.department?.toLowerCase().includes(search)
  )
})

const isAllSelected = computed(() => {
  return (
    filteredMembers.value.length > 0 &&
    filteredMembers.value.every((m) => form.memberIds.includes(m.id))
  )
})

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    const filteredIds = filteredMembers.value.map((m) => m.id)
    form.memberIds = form.memberIds.filter((id) => !filteredIds.includes(id))
  } else {
    const newIds = filteredMembers.value
      .map((m) => m.id)
      .filter((id) => !form.memberIds.includes(id))
    form.memberIds = [...form.memberIds, ...newIds]
  }
}

const fetchData = async () => {
  loadingInitial.value = true
  try {
    const [membersRes, templatesRes] = await Promise.all([
      usersApi.getAllMembers(),
      templatesApi.getList(),
    ])
    members.value = membersRes
    templates.value = templatesRes

    if (isEdit.value) {
      const project = await projectsApi.getDetail(projectId.value)
      form.name = project.name
      form.description = project.description || ''
      form.templateId = project.templateId
      form.memberIds = project.members?.map((m) => m.userId) || []
    }
  } catch (error) {
    console.error('Failed to fetch data:', error)
    alert('加载数据失败')
  } finally {
    loadingInitial.value = false
  }
}

const validate = () => {
  errors.name = ''
  errors.memberIds = ''
  let valid = true

  if (!form.name.trim()) {
    errors.name = '请输入项目名称'
    valid = false
  }

  if (form.memberIds.length < 2) {
    errors.memberIds = '至少需要选择2个成员'
    valid = false
  }

  return valid
}

const handleSubmit = async () => {
  if (!validate()) return

  submitting.value = true
  try {
    if (isEdit.value) {
      await projectsApi.update(projectId.value, {
        name: form.name,
        description: form.description,
        memberIds: form.memberIds,
        templateId: form.templateId,
      })
    } else {
      await projectsApi.create({
        name: form.name,
        description: form.description,
        memberIds: form.memberIds,
        templateId: form.templateId,
      })
    }
    router.push('/admin/projects')
  } catch (error: any) {
    alert(error.message || '操作失败，请重试')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>