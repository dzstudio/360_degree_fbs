<template>
  <div class="max-w-4xl mx-auto">
    <!-- Loading -->
    <LoadingSpinner v-if="loading" text="加载中..." />

    <!-- Task detail -->
    <template v-else-if="task">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <button class="btn btn-secondary mb-3" @click="router.push('/tasks')">
            <ArrowLeft :size="16" />
            返回待办列表
          </button>
          <h1 class="text-2xl font-bold" style="color: var(--color-text-primary)">
            评估 {{ task.targetUser?.name }}
          </h1>
          <div class="flex items-center gap-4 mt-2 text-sm" style="color: var(--color-text-secondary)">
            <span v-if="task.targetUser?.department">
              <Building2 :size="14" class="inline mr-1" />
              {{ task.targetUser.department }}
            </span>
            <span v-if="task.targetUser?.position">
              <Briefcase :size="14" class="inline mr-1" />
              {{ task.targetUser.position }}
            </span>
          </div>
        </div>
        <StatusBadge :status="task.status" type="task" />
      </div>

      <!-- Completed message -->
      <div
        v-if="task.status === 'completed'"
        class="card p-6 text-center mb-6"
        style="background: #DCFCE7"
      >
        <CheckCircle :size="48" class="mx-auto mb-3" style="color: #16A34A" />
        <h3 class="text-lg font-semibold mb-1" style="color: #16A34A">评估已完成</h3>
        <p class="text-sm" style="color: #166534">感谢您完成本次评估</p>
      </div>

      <!-- Warning notice -->
      <div
        v-if="task.status !== 'completed'"
        class="flex items-start gap-3 p-4 mb-6 rounded-lg"
        style="background: #FEF3C7; border: 1px solid #FDE68A"
      >
        <AlertTriangle :size="20" class="flex-shrink-0 mt-0.5" style="color: #D97706" />
        <p class="text-sm" style="color: #92400E">
          <strong>温馨提示：</strong>360度评估是衡量员工工作表现的重要数据来源，评估结果将作为绩效考核、晋升发展的重要参考依据。请您基于客观事实，认真、公正地完成每一道题目的评价。
        </p>
      </div>

      <!-- Dimensions and questions -->
      <div v-for="dimension in dimensions" :key="dimension.id" class="card p-6 mb-6 fade-in">
        <div class="mb-4">
          <h2 class="text-lg font-semibold" style="color: var(--color-text-primary)">
            {{ dimension.name }}
          </h2>
        </div>
        <p v-if="dimension.description" class="text-sm mb-4" style="color: var(--color-text-secondary)">
          {{ dimension.description }}
        </p>

        <div class="space-y-6">
          <div
            v-for="question in dimension.questions"
            :key="question.id"
            class="border-b pb-6 last:border-0 last:pb-0"
            style="border-color: var(--color-border-light)"
          >
            <p class="font-medium mb-3" style="color: var(--color-text-primary)">
              {{ question.content }}
            </p>

            <!-- Rating question -->
            <div v-if="question.type === 'rating'" class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-sm" style="color: var(--color-text-muted)">非常差</span>
                <span class="text-sm" style="color: var(--color-text-muted)">非常好</span>
              </div>
              <div class="flex items-center gap-2">
                <button
                  v-for="score in 5"
                  :key="score"
                  class="flex-1 py-3 rounded-lg text-center font-medium transition-colors cursor-pointer"
                  :class="getAnswerRating(question.id) === score ? getScoreClass(score) : 'bg-gray-100 hover:bg-gray-200'"
                  :disabled="task.status === 'completed'"
                  :style="task.status === 'completed' ? 'cursor: not-allowed' : ''"
                  @click="setAnswerRating(question.id, score)"
                >
                  {{ score }}
                </button>
              </div>
              <p class="text-center text-sm" style="color: var(--color-text-muted)">
                {{ getScoreLabel(getAnswerRating(question.id)) }}
              </p>
            </div>

            <!-- Text question -->
            <div v-else-if="question.type === 'text'">
              <textarea
                :value="getAnswerText(question.id)"
                :disabled="task.status === 'completed'"
                placeholder="请输入您的评价..."
                class="input min-h-[100px] resize-y"
                @input="handleTextAnswer(question.id, $event)"
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div
        v-if="task.status !== 'completed'"
        class="flex items-center justify-end gap-4 mt-6"
      >
        <button class="btn btn-secondary" :disabled="saving" @click="handleSave">
          <Save v-if="!saving" :size="16" />
          <Loader2 v-else :size="16" class="animate-spin" />
          {{ saving ? '暂存中...' : '暂存草稿' }}
        </button>
        <button class="btn btn-primary" :disabled="submitting" @click="handleSubmit">
          <Send v-if="!submitting" :size="16" />
          <Loader2 v-else :size="16" class="animate-spin" />
          {{ submitting ? '提交中...' : '提交评估' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tasksApi } from '@/api/tasks'
import { templatesApi } from '@/api/templates'
import type { AssessmentTask, Dimension, Answer } from '@/types/api'
import { confirm } from '@/composables/useConfirm'
import {
  ArrowLeft,
  Building2,
  Briefcase,
  CheckCircle,
  Save,
  Send,
  Loader2,
  AlertTriangle,
} from 'lucide-vue-next'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import StatusBadge from '@/components/StatusBadge.vue'

const route = useRoute()
const router = useRouter()

const task = ref<AssessmentTask | null>(null)
const dimensions = ref<Dimension[]>([])
const answers = ref<Map<number, Partial<Answer>>>(new Map())
const loading = ref(true)
const saving = ref(false)
const submitting = ref(false)

const taskId = computed(() => Number(route.params.id))

const fetchTask = async () => {
  loading.value = true
  try {
    const res = await tasksApi.getDetail(taskId.value)
    task.value = res

    // 加载问卷模板维度和题目
    // 优先使用项目指定的模板，否则使用默认模板
    let templateId = res.project?.templateId
    if (!templateId) {
      // 获取默认模板
      const templates = await templatesApi.getList()
      const defaultTemplate = templates.find((t) => t.isDefault)
      if (defaultTemplate) {
        templateId = defaultTemplate.id
      }
    }

    if (templateId) {
      const template = await templatesApi.getDetail(templateId)
      dimensions.value = template.dimensions || []
    }

    // 加载已保存的答案
    if (res.answers) {
      for (const answer of res.answers) {
        answers.value.set(answer.questionId, {
          questionId: answer.questionId,
          ratingValue: answer.ratingValue,
          textValue: answer.textValue,
        })
      }
    }
  } catch (error) {
    console.error('Failed to fetch task:', error)
  } finally {
    loading.value = false
  }
}

const getAnswerRating = (questionId: number): number | undefined => {
  return answers.value.get(questionId)?.ratingValue
}

const setAnswerRating = (questionId: number, value: number) => {
  if (task.value?.status === 'completed') return
  const existing = answers.value.get(questionId) || { questionId }
  answers.value.set(questionId, { ...existing, ratingValue: value })
}

const getAnswerText = (questionId: number): string => {
  return answers.value.get(questionId)?.textValue || ''
}

const setAnswerText = (questionId: number, value: string) => {
  if (task.value?.status === 'completed') return
  const existing = answers.value.get(questionId) || { questionId }
  answers.value.set(questionId, { ...existing, textValue: value })
}

const handleTextAnswer = (questionId: number, event: Event) => {
  const target = event.target as HTMLTextAreaElement
  setAnswerText(questionId, target.value)
}

const getScoreClass = (score: number): string => {
  const classes: Record<number, string> = {
    1: 'bg-red-100 text-red-700',
    2: 'bg-orange-100 text-orange-700',
    3: 'bg-yellow-100 text-yellow-700',
    4: 'bg-blue-100 text-blue-700',
    5: 'bg-green-100 text-green-700',
  }
  return classes[score] || 'bg-gray-100'
}

const getScoreLabel = (score?: number): string => {
  const labels: Record<number, string> = {
    1: '非常差',
    2: '较差',
    3: '一般',
    4: '较好',
    5: '非常好',
  }
  return score ? labels[score] : '请评分'
}

const getAnswersArray = (): Partial<Answer>[] => {
  return Array.from(answers.value.values())
}

const handleSave = async () => {
  saving.value = true
  try {
    await tasksApi.saveAnswers(taskId.value, {
      answers: getAnswersArray(),
    })
    alert('暂存成功')
  } catch (error) {
    console.error('Failed to save answers:', error)
    alert('暂存失败，请重试')
  } finally {
    saving.value = false
  }
}

const handleSubmit = async () => {
  // 验证是否所有题目都已作答
  const allQuestions = dimensions.value.flatMap((d) => d.questions || [])
  const unanswered = allQuestions.filter((q) => {
    const answer = answers.value.get(q.id)
    if (q.type === 'rating') return !answer?.ratingValue
    if (q.type === 'text') return !answer?.textValue?.trim()
    return false
  })

  if (unanswered.length > 0) {
    alert(`还有 ${unanswered.length} 道题目未完成，请完成后再提交`)
    return
  }

  const confirmed = await confirm('确定要提交评估吗？提交后可在项目提交前修改。')
  if (!confirmed) return

  submitting.value = true
  try {
    await tasksApi.submit(taskId.value, {
      answers: getAnswersArray(),
    })
    alert('评估提交成功')
    router.push('/tasks')
  } catch (error) {
    console.error('Failed to submit task:', error)
    alert('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchTask()
})
</script>