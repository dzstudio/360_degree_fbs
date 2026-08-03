<template>
  <div class="flex items-center justify-center" :class="containerClass">
    <Loader2 :size="size" class="animate-spin" style="color: var(--color-primary)" />
    <span v-if="text" class="ml-2 text-sm" style="color: var(--color-text-secondary)">
      {{ text }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    size?: number
    text?: string
    containerClass?: string
  }>(),
  {
    size: 24,
    containerClass: 'py-8',
  }
)
</script>