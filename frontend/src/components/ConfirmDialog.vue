<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50" @click="$emit('cancel')"></div>

        <!-- Dialog -->
        <div class="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 fade-in">
          <h3 class="text-lg font-semibold mb-4" style="color: var(--color-text-primary)">
            确认操作
          </h3>
          <p class="mb-6" style="color: var(--color-text-secondary)">
            {{ message }}
          </p>
          <div class="flex justify-end gap-3">
            <button class="btn btn-secondary" @click="$emit('cancel')">取消</button>
            <button class="btn btn-primary" @click="$emit('confirm')">确定</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  message: string
}>()

defineEmits<{
  cancel: []
  confirm: []
}>()
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>