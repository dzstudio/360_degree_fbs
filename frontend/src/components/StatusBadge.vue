<template>
  <span class="badge" :class="badgeClass">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatProjectStatus, formatTaskStatus, formatUserRole } from '@/utils/format'

const props = defineProps<{
  status: string
  type: 'project' | 'task' | 'role'
}>()

const statusInfo = computed(() => {
  switch (props.type) {
    case 'project':
      return formatProjectStatus(props.status)
    case 'task':
      return formatTaskStatus(props.status)
    case 'role':
      return formatUserRole(props.status)
    default:
      return { label: props.status, class: '' }
  }
})

const label = computed(() => statusInfo.value.label)
const badgeClass = computed(() => statusInfo.value.class)
</script>