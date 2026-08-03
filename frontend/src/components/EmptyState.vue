<template>
  <div class="flex flex-col items-center justify-center py-12">
    <component
      :is="icon"
      :size="48"
      class="mb-4"
      style="color: var(--color-text-muted)"
    />
    <p class="text-sm" style="color: var(--color-text-muted)">
      {{ message }}
    </p>
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon: Component
  message: string
}>()
</script>