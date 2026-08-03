<template>
  <div class="max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold mb-6" style="color: var(--color-text-primary)">
      个人设置
    </h1>

    <!-- User info -->
    <div class="card p-6 mb-6">
      <div class="flex items-center gap-4 mb-6">
        <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
          <Shield :size="32" style="color: var(--color-primary)" />
        </div>
        <div>
          <h2 class="text-xl font-semibold" style="color: var(--color-text-primary)">
            {{ authStore.userInfo?.name }}
          </h2>
          <p class="text-sm" style="color: var(--color-text-secondary)">
            {{ authStore.userInfo?.username }}
          </p>
          <span class="badge badge-danger mt-1">管理员</span>
        </div>
      </div>
    </div>

    <!-- Change password -->
    <div class="card p-6">
      <h3 class="text-lg font-semibold mb-4" style="color: var(--color-text-primary)">
        修改密码
      </h3>

      <form @submit.prevent="handleChangePassword">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2" style="color: var(--color-text-primary)">
              当前密码
            </label>
            <input
              v-model="passwordForm.oldPassword"
              type="password"
              placeholder="请输入当前密码"
              class="input"
              :class="{ 'input-error': errors.oldPassword }"
            />
            <p v-if="errors.oldPassword" class="text-sm mt-1" style="color: var(--color-danger)">
              {{ errors.oldPassword }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2" style="color: var(--color-text-primary)">
              新密码
            </label>
            <input
              v-model="passwordForm.newPassword"
              type="password"
              placeholder="请输入新密码"
              class="input"
              :class="{ 'input-error': errors.newPassword }"
            />
            <p v-if="errors.newPassword" class="text-sm mt-1" style="color: var(--color-danger)">
              {{ errors.newPassword }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2" style="color: var(--color-text-primary)">
              确认新密码
            </label>
            <input
              v-model="passwordForm.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              class="input"
              :class="{ 'input-error': errors.confirmPassword }"
            />
            <p v-if="errors.confirmPassword" class="text-sm mt-1" style="color: var(--color-danger)">
              {{ errors.confirmPassword }}
            </p>
          </div>
        </div>

        <div
          v-if="changePasswordError"
          class="mt-4 p-3 rounded-lg text-sm"
          style="background: #FEE2E2; color: var(--color-danger)"
        >
          {{ changePasswordError }}
        </div>

        <div
          v-if="changePasswordSuccess"
          class="mt-4 p-3 rounded-lg text-sm"
          style="background: #DCFCE7; color: #16A34A"
        >
          密码修改成功
        </div>

        <button
          type="submit"
          class="btn btn-primary mt-4"
          :disabled="changingPassword"
        >
          <Loader2 v-if="changingPassword" :size="16" class="animate-spin" />
          {{ changingPassword ? '修改中...' : '修改密码' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/api/auth'
import { Shield, Loader2 } from 'lucide-vue-next'

const authStore = useAuthStore()

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const errors = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const changingPassword = ref(false)
const changePasswordError = ref('')
const changePasswordSuccess = ref(false)

const validate = () => {
  errors.oldPassword = ''
  errors.newPassword = ''
  errors.confirmPassword = ''
  let valid = true

  if (!passwordForm.oldPassword) {
    errors.oldPassword = '请输入当前密码'
    valid = false
  }

  if (!passwordForm.newPassword) {
    errors.newPassword = '请输入新密码'
    valid = false
  } else if (passwordForm.newPassword.length < 6) {
    errors.newPassword = '密码长度不能少于6位'
    valid = false
  }

  if (!passwordForm.confirmPassword) {
    errors.confirmPassword = '请再次输入新密码'
    valid = false
  } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    errors.confirmPassword = '两次输入的密码不一致'
    valid = false
  }

  return valid
}

const handleChangePassword = async () => {
  if (!validate()) return

  changingPassword.value = true
  changePasswordError.value = ''
  changePasswordSuccess.value = false

  try {
    await authApi.changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    })
    changePasswordSuccess.value = true
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (error: any) {
    changePasswordError.value = error.message || '密码修改失败，请重试'
  } finally {
    changingPassword.value = false
  }
}
</script>