<template>
  <div class="max-w-4xl mx-auto">
    <!-- Loading -->
    <LoadingSpinner v-if="loading" text="加载中..." />

    <template v-else-if="template">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <button class="btn btn-secondary mb-3" @click="router.push('/admin/templates')">
            <ArrowLeft :size="16" />
            返回模板列表
          </button>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold" style="color: var(--color-text-primary)">
              {{ template.name }}
            </h1>
            <span v-if="template.isDefault" class="badge badge-info">默认</span>
          </div>
          <p v-if="template.description" class="mt-1 text-sm" style="color: var(--color-text-secondary)">
            {{ template.description }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button class="btn btn-secondary" @click="handleEditTemplate">
            <Edit :size="16" />
            编辑
          </button>
          <button class="btn btn-danger" @click="handleDeleteTemplate">
            <Trash2 :size="16" />
            删除
          </button>
        </div>
      </div>

      <!-- Dimensions -->
      <div class="space-y-6">
        <div
          v-for="dimension in template.dimensions"
          :key="dimension.id"
          class="card p-6 fade-in"
        >
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="text-lg font-semibold" style="color: var(--color-text-primary)">
                {{ dimension.name }}
              </h3>
              <p v-if="dimension.description" class="text-sm mt-1" style="color: var(--color-text-secondary)">
                {{ dimension.description }}
              </p>
              <p class="text-sm mt-1" style="color: var(--color-text-muted)">
                权重: {{ (dimension.weight * 100).toFixed(0) }}%
              </p>
            </div>

            <div class="flex items-center gap-2">
              <button class="btn btn-secondary btn-sm" @click="handleEditDimension(dimension)">
                <Edit :size="14" />
              </button>
              <button class="btn btn-danger btn-sm" @click="handleDeleteDimension(dimension)">
                <Trash2 :size="14" />
              </button>
            </div>
          </div>

          <!-- Questions -->
          <div class="space-y-3">
            <div
              v-for="(question, index) in dimension.questions"
              :key="question.id"
              class="flex items-center gap-3 p-3 rounded-lg"
              style="background: var(--color-bg)"
            >
              <span class="text-sm font-medium" style="color: var(--color-text-muted)">
                {{ index + 1 }}
              </span>
              <div class="flex-1">
                <p class="text-sm" style="color: var(--color-text-primary)">
                  {{ question.content }}
                </p>
                <p class="text-xs mt-1" style="color: var(--color-text-muted)">
                  {{ question.type === 'rating' ? '评分题' : '文本题' }}
                </p>
              </div>
              <div class="flex items-center gap-1">
                <button class="btn btn-secondary btn-sm" @click="handleEditQuestion(question)">
                  <Edit :size="12" />
                </button>
                <button class="btn btn-danger btn-sm" @click="handleDeleteQuestion(question)">
                  <Trash2 :size="12" />
                </button>
              </div>
            </div>

            <button
              class="btn btn-secondary w-full"
              @click="handleAddQuestion(dimension.id)"
            >
              <Plus :size="16" />
              添加题目
            </button>
          </div>
        </div>

        <button class="btn btn-primary w-full" @click="handleAddDimension">
          <Plus :size="16" />
          添加评估维度
        </button>
      </div>
    </template>

    <!-- Dimension dialog -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showDimensionDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50" @click="closeDimensionDialog"></div>
          <div class="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 fade-in">
            <h3 class="text-lg font-semibold mb-4" style="color: var(--color-text-primary)">
              {{ editingDimension ? '编辑维度' : '添加维度' }}
            </h3>

            <form @submit.prevent="handleSubmitDimension">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium mb-2" style="color: var(--color-text-primary)">
                    维度名称 *
                  </label>
                  <input
                    v-model="dimensionForm.name"
                    type="text"
                    placeholder="例如：工作能力、沟通协作"
                    class="input"
                    :class="{ 'input-error': dimensionErrors.name }"
                  />
                  <p v-if="dimensionErrors.name" class="text-sm mt-1" style="color: var(--color-danger)">
                    {{ dimensionErrors.name }}
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2" style="color: var(--color-text-primary)">
                    描述
                  </label>
                  <textarea
                    v-model="dimensionForm.description"
                    placeholder="请输入维度描述"
                    class="input min-h-[80px] resize-y"
                  ></textarea>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2" style="color: var(--color-text-primary)">
                    权重 (0-1)
                  </label>
                  <input
                    v-model.number="dimensionForm.weight"
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    class="input"
                  />
                </div>
              </div>

              <div class="flex justify-end gap-3 mt-6">
                <button type="button" class="btn btn-secondary" @click="closeDimensionDialog">
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

    <!-- Question dialog -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showQuestionDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50" @click="closeQuestionDialog"></div>
          <div class="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 fade-in">
            <h3 class="text-lg font-semibold mb-4" style="color: var(--color-text-primary)">
              {{ editingQuestion ? '编辑题目' : '添加题目' }}
            </h3>

            <form @submit.prevent="handleSubmitQuestion">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium mb-2" style="color: var(--color-text-primary)">
                    题目内容 *
                  </label>
                  <textarea
                    v-model="questionForm.content"
                    placeholder="请输入题目内容"
                    class="input min-h-[80px] resize-y"
                    :class="{ 'input-error': questionErrors.content }"
                  ></textarea>
                  <p v-if="questionErrors.content" class="text-sm mt-1" style="color: var(--color-danger)">
                    {{ questionErrors.content }}
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2" style="color: var(--color-text-primary)">
                    题目类型
                  </label>
                  <select v-model="questionForm.type" class="input">
                    <option value="rating">评分题 (1-5分)</option>
                    <option value="text">文本题</option>
                  </select>
                </div>
              </div>

              <div class="flex justify-end gap-3 mt-6">
                <button type="button" class="btn btn-secondary" @click="closeQuestionDialog">
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

    <!-- Edit template dialog -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showEditDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50" @click="showEditDialog = false"></div>
          <div class="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 fade-in">
            <h3 class="text-lg font-semibold mb-4" style="color: var(--color-text-primary)">
              编辑模板
            </h3>

            <form @submit.prevent="handleUpdateTemplate">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium mb-2" style="color: var(--color-text-primary)">
                    模板名称 *
                  </label>
                  <input
                    v-model="templateForm.name"
                    type="text"
                    placeholder="请输入模板名称"
                    class="input"
                    :class="{ 'input-error': templateErrors.name }"
                  />
                  <p v-if="templateErrors.name" class="text-sm mt-1" style="color: var(--color-danger)">
                    {{ templateErrors.name }}
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2" style="color: var(--color-text-primary)">
                    描述
                  </label>
                  <textarea
                    v-model="templateForm.description"
                    placeholder="请输入模板描述"
                    class="input min-h-[80px] resize-y"
                  ></textarea>
                </div>
              </div>

              <div class="flex justify-end gap-3 mt-6">
                <button type="button" class="btn btn-secondary" @click="showEditDialog = false">
                  取消
                </button>
                <button type="submit" class="btn btn-primary" :disabled="submitting">
                  <Loader2 v-if="submitting" :size="16" class="animate-spin" />
                  {{ submitting ? '保存中...' : '保存' }}
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
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { templatesApi } from '@/api/templates'
import type { QuestionnaireTemplate, Dimension, Question } from '@/types/api'
import { confirm } from '@/composables/useConfirm'
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Loader2,
} from 'lucide-vue-next'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()

const templateId = computed(() => Number(route.params.id))

const template = ref<QuestionnaireTemplate | null>(null)
const loading = ref(true)
const submitting = ref(false)

// Dimension dialog
const showDimensionDialog = ref(false)
const editingDimension = ref<Dimension | null>(null)
const dimensionForm = reactive({
  name: '',
  description: '',
  weight: 0.2,
})
const dimensionErrors = reactive({
  name: '',
})

// Question dialog
const showQuestionDialog = ref(false)
const editingQuestion = ref<Question | null>(null)
const currentDimensionId = ref<number>(0)
const questionForm = reactive({
  content: '',
  type: 'rating' as 'rating' | 'text',
})
const questionErrors = reactive({
  content: '',
})

// Template edit dialog
const showEditDialog = ref(false)
const templateForm = reactive({
  name: '',
  description: '',
})
const templateErrors = reactive({
  name: '',
})

const fetchTemplate = async () => {
  loading.value = true
  try {
    template.value = await templatesApi.getDetail(templateId.value)
  } catch (error) {
    console.error('Failed to fetch template:', error)
  } finally {
    loading.value = false
  }
}

// Template operations
const handleEditTemplate = () => {
  if (!template.value) return
  templateForm.name = template.value.name
  templateForm.description = template.value.description || ''
  showEditDialog.value = true
}

const handleUpdateTemplate = async () => {
  if (!templateForm.name.trim()) {
    templateErrors.name = '请输入模板名称'
    return
  }

  submitting.value = true
  try {
    await templatesApi.update(templateId.value, {
      name: templateForm.name,
      description: templateForm.description,
    })
    showEditDialog.value = false
    fetchTemplate()
  } catch (error: any) {
    alert(error.message || '更新失败，请重试')
  } finally {
    submitting.value = false
  }
}

const handleDeleteTemplate = async () => {
  if (!template.value) return
  const confirmed = await confirm(`确定要删除模板 "${template.value.name}" 吗？`)
  if (!confirmed) return

  try {
    await templatesApi.delete(templateId.value)
    router.push('/admin/templates')
  } catch (error: any) {
    alert(error.message || '删除失败，请重试')
  }
}

// Dimension operations
const handleAddDimension = () => {
  editingDimension.value = null
  dimensionForm.name = ''
  dimensionForm.description = ''
  dimensionForm.weight = 0.2
  showDimensionDialog.value = true
}

const handleEditDimension = (dimension: Dimension) => {
  editingDimension.value = dimension
  dimensionForm.name = dimension.name
  dimensionForm.description = dimension.description || ''
  dimensionForm.weight = dimension.weight
  showDimensionDialog.value = true
}

const closeDimensionDialog = () => {
  showDimensionDialog.value = false
  editingDimension.value = null
  dimensionErrors.name = ''
}

const handleSubmitDimension = async () => {
  if (!dimensionForm.name.trim()) {
    dimensionErrors.name = '请输入维度名称'
    return
  }

  submitting.value = true
  try {
    if (editingDimension.value) {
      await templatesApi.updateDimension(editingDimension.value.id, {
        name: dimensionForm.name,
        description: dimensionForm.description,
        weight: dimensionForm.weight,
      })
    } else {
      await templatesApi.createDimension(templateId.value, {
        name: dimensionForm.name,
        description: dimensionForm.description,
        weight: dimensionForm.weight,
      })
    }
    closeDimensionDialog()
    fetchTemplate()
  } catch (error: any) {
    alert(error.message || '操作失败，请重试')
  } finally {
    submitting.value = false
  }
}

const handleDeleteDimension = async (dimension: Dimension) => {
  const confirmed = await confirm(`确定要删除维度 "${dimension.name}" 吗？该维度下的所有题目也将被删除。`)
  if (!confirmed) return

  try {
    await templatesApi.deleteDimension(dimension.id)
    fetchTemplate()
  } catch (error: any) {
    alert(error.message || '删除失败，请重试')
  }
}

// Question operations
const handleAddQuestion = (dimensionId: number) => {
  editingQuestion.value = null
  currentDimensionId.value = dimensionId
  questionForm.content = ''
  questionForm.type = 'rating'
  showQuestionDialog.value = true
}

const handleEditQuestion = (question: Question) => {
  editingQuestion.value = question
  currentDimensionId.value = question.dimensionId
  questionForm.content = question.content
  questionForm.type = question.type
  showQuestionDialog.value = true
}

const closeQuestionDialog = () => {
  showQuestionDialog.value = false
  editingQuestion.value = null
  questionErrors.content = ''
}

const handleSubmitQuestion = async () => {
  if (!questionForm.content.trim()) {
    questionErrors.content = '请输入题目内容'
    return
  }

  submitting.value = true
  try {
    if (editingQuestion.value) {
      await templatesApi.updateQuestion(editingQuestion.value.id, {
        content: questionForm.content,
        type: questionForm.type,
      })
    } else {
      await templatesApi.createQuestion(currentDimensionId.value, {
        content: questionForm.content,
        type: questionForm.type,
      })
    }
    closeQuestionDialog()
    fetchTemplate()
  } catch (error: any) {
    alert(error.message || '操作失败，请重试')
  } finally {
    submitting.value = false
  }
}

const handleDeleteQuestion = async (question: Question) => {
  const confirmed = await confirm('确定要删除这道题目吗？')
  if (!confirmed) return

  try {
    await templatesApi.deleteQuestion(question.id)
    fetchTemplate()
  } catch (error: any) {
    alert(error.message || '删除失败，请重试')
  }
}

onMounted(() => {
  fetchTemplate()
})
</script>

<style scoped>
.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}
</style>