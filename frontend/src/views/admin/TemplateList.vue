<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold" style="color: var(--color-text-primary)">
        问卷模板
      </h1>
      <button class="btn btn-primary" @click="showCreateDialog = true">
        <Plus :size="16" />
        创建模板
      </button>
    </div>

    <!-- Loading -->
    <LoadingSpinner v-if="loading" text="加载中..." />

    <!-- Template list -->
    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="template in templates"
          :key="template.id"
          class="card p-6 hover:shadow-md transition-shadow cursor-pointer fade-in"
          @click="router.push(`/admin/templates/${template.id}`)"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText :size="24" style="color: var(--color-primary)" />
            </div>
            <span v-if="template.isDefault" class="badge badge-info">默认</span>
          </div>

          <h3 class="font-semibold mb-2" style="color: var(--color-text-primary)">
            {{ template.name }}
          </h3>
          <p class="text-sm mb-4" style="color: var(--color-text-secondary)">
            {{ template.description || '暂无描述' }}
          </p>

          <div class="flex items-center justify-between text-sm" style="color: var(--color-text-muted)">
            <span>{{ template.dimensions?.length || 0 }} 个维度</span>
            <ChevronRight :size="16" />
          </div>
        </div>
      </div>

      <div v-if="templates.length === 0" class="card text-center py-12">
        <FileText :size="48" class="mx-auto mb-3" style="color: var(--color-text-muted)" />
        <p class="text-sm mb-4" style="color: var(--color-text-muted)">暂无问卷模板</p>
        <button class="btn btn-primary" @click="showCreateDialog = true">
          <Plus :size="16" />
          创建模板
        </button>
      </div>
    </div>

    <!-- Create dialog -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showCreateDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50" @click="showCreateDialog = false"></div>
          <div class="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 fade-in">
            <h3 class="text-lg font-semibold mb-4" style="color: var(--color-text-primary)">
              创建问卷模板
            </h3>

            <form @submit.prevent="handleCreate">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium mb-2" style="color: var(--color-text-primary)">
                    模板名称 *
                  </label>
                  <input
                    v-model="form.name"
                    type="text"
                    placeholder="请输入模板名称"
                    class="input"
                    :class="{ 'input-error': errors.name }"
                  />
                  <p v-if="errors.name" class="text-sm mt-1" style="color: var(--color-danger)">
                    {{ errors.name }}
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2" style="color: var(--color-text-primary)">
                    描述
                  </label>
                  <textarea
                    v-model="form.description"
                    placeholder="请输入模板描述"
                    class="input min-h-[80px] resize-y"
                  ></textarea>
                </div>
              </div>

              <div class="flex justify-end gap-3 mt-6">
                <button type="button" class="btn btn-secondary" @click="showCreateDialog = false">
                  取消
                </button>
                <button type="submit" class="btn btn-primary" :disabled="submitting">
                  <Loader2 v-if="submitting" :size="16" class="animate-spin" />
                  {{ submitting ? '创建中...' : '创建' }}
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
import { useRouter } from 'vue-router'
import { templatesApi } from '@/api/templates'
import type { QuestionnaireTemplate } from '@/types/api'
import {
  Plus,
  FileText,
  ChevronRight,
  Loader2,
} from 'lucide-vue-next'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const router = useRouter()

const templates = ref<QuestionnaireTemplate[]>([])
const loading = ref(true)
const showCreateDialog = ref(false)
const submitting = ref(false)

const form = reactive({
  name: '',
  description: '',
})

const errors = reactive({
  name: '',
})

const fetchTemplates = async () => {
  loading.value = true
  try {
    templates.value = await templatesApi.getList()
  } catch (error) {
    console.error('Failed to fetch templates:', error)
  } finally {
    loading.value = false
  }
}

const validate = () => {
  errors.name = ''
  if (!form.name.trim()) {
    errors.name = '请输入模板名称'
    return false
  }
  return true
}

const handleCreate = async () => {
  if (!validate()) return

  submitting.value = true
  try {
    await templatesApi.create({
      name: form.name,
      description: form.description,
    })
    showCreateDialog.value = false
    form.name = ''
    form.description = ''
    fetchTemplates()
  } catch (error: any) {
    alert(error.message || '创建失败，请重试')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchTemplates()
})
</script>