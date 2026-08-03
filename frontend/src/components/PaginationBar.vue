<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
    <!-- 总条数 -->
    <div class="text-sm" style="color: var(--color-text-muted)">
      共 {{ total }} 条记录
    </div>

    <!-- 分页控件 -->
    <div class="flex items-center gap-2">
      <!-- 首页 -->
      <button
        class="btn btn-secondary btn-sm"
        :disabled="currentPage <= 1"
        @click="$emit('update:page', 1)"
      >
        <ChevronsLeft :size="16" />
      </button>

      <!-- 上一页 -->
      <button
        class="btn btn-secondary btn-sm"
        :disabled="currentPage <= 1"
        @click="$emit('update:page', currentPage - 1)"
      >
        <ChevronLeft :size="16" />
      </button>

      <!-- 页码 -->
      <template v-for="pageNum in displayPages" :key="pageNum">
        <button
          v-if="pageNum < 0"
          class="btn btn-secondary btn-sm cursor-default"
          disabled
        >
          ...
        </button>
        <button
          v-else
          class="btn btn-sm"
          :class="pageNum === currentPage ? 'btn-primary' : 'btn-secondary'"
          @click="$emit('update:page', pageNum)"
        >
          {{ pageNum }}
        </button>
      </template>

      <!-- 下一页 -->
      <button
        class="btn btn-secondary btn-sm"
        :disabled="currentPage >= totalPages"
        @click="$emit('update:page', currentPage + 1)"
      >
        <ChevronRight :size="16" />
      </button>

      <!-- 末页 -->
      <button
        class="btn btn-secondary btn-sm"
        :disabled="currentPage >= totalPages"
        @click="$emit('update:page', totalPages)"
      >
        <ChevronsRight :size="16" />
      </button>

      <!-- 每页条数 -->
      <select
        class="input w-20 ml-2"
        :value="pageSize"
        @change="handlePageSizeChange"
      >
        <option :value="10">10条</option>
        <option :value="20">20条</option>
        <option :value="50">50条</option>
        <option :value="100">100条</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-vue-next'

const props = defineProps<{
  total: number
  currentPage: number
  pageSize: number
}>()

const emit = defineEmits<{
  'update:page': [page: number]
  'update:pageSize': [size: number]
}>()

const handlePageSizeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:pageSize', Number(target.value))
}

const totalPages = computed(() => Math.ceil(props.total / props.pageSize))

const displayPages = computed(() => {
  const pages: number[] = []
  const current = props.currentPage
  const total = totalPages.value

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    pages.push(1)

    if (current > 3) {
      pages.push(-1) // 用-1表示省略号
    }

    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (current < total - 2) {
      pages.push(-2) // 用-2表示省略号
    }

    pages.push(total)
  }

  return pages
})
</script>

<style scoped>
.btn-sm {
  padding: 6px 10px;
  font-size: 13px;
}
</style>