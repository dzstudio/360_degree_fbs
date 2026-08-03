<template>
  <div
    class="min-h-screen flex items-center justify-center p-4"
    style="background: linear-gradient(135deg, #EBF5FF 0%, #F0F9FF 50%, #ECFEFF 100%)"
  >
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8 fade-in">
        <div class="mb-4">
          <ClipboardCheck :size="48" class="mx-auto" style="color: var(--color-primary)" />
        </div>
        <h1 class="text-2xl font-bold" style="color: var(--color-text-primary)">
          360度绩效评估系统
        </h1>
        <p class="text-sm mt-2" style="color: var(--color-text-secondary)">
          请登录以继续使用
        </p>
      </div>

      <!-- Login form -->
      <div class="card p-8 fade-in" style="animation-delay: 0.1s">
        <form @submit.prevent="handleLogin">
          <!-- Username -->
          <div class="mb-5">
            <label class="block text-sm font-medium mb-2" style="color: var(--color-text-primary)">
              用户名
            </label>
            <div class="relative">
              <User
                class="absolute left-3 top-1/2 -translate-y-1/2"
                :size="18"
                style="color: var(--color-text-muted)"
              />
              <input
                v-model="form.username"
                type="text"
                placeholder="请输入用户名"
                class="input input-icon-left"
                :class="{ 'input-error': errors.username }"
              />
            </div>
            <p v-if="errors.username" class="text-sm mt-1" style="color: var(--color-danger)">
              {{ errors.username }}
            </p>
          </div>

          <!-- Password -->
          <div class="mb-6">
            <label class="block text-sm font-medium mb-2" style="color: var(--color-text-primary)">
              密码
            </label>
            <div class="relative">
              <Lock
                class="absolute left-3 top-1/2 -translate-y-1/2"
                :size="18"
                style="color: var(--color-text-muted)"
              />
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                class="input input-icon-left input-icon-right"
                :class="{ 'input-error': errors.password }"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2"
                style="color: var(--color-text-muted)"
              >
                <EyeOff v-if="showPassword" :size="18" />
                <Eye v-else :size="18" />
              </button>
            </div>
            <p v-if="errors.password" class="text-sm mt-1" style="color: var(--color-danger)">
              {{ errors.password }}
            </p>
          </div>

          <!-- Error message -->
          <div
            v-if="loginError"
            class="mb-4 p-3 rounded-lg text-sm"
            style="background: #FEE2E2; color: var(--color-danger)"
          >
            {{ loginError }}
          </div>

          <!-- Submit button -->
          <button type="submit" class="btn btn-primary w-full py-3" :disabled="loading">
            <Loader2 v-if="loading" :size="18" class="animate-spin" />
            <span>{{ loading ? '登录中...' : '登 录' }}</span>
          </button>
        </form>
      </div>

      <!-- Footer -->
      <p class="text-center text-sm mt-6" style="color: var(--color-text-muted)">
        360度绩效评估系统 V1.0
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/api/auth'
import { ClipboardCheck, User, Lock, Eye, EyeOff, Loader2 } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = reactive({
  username: '',
  password: '',
})

const errors = reactive({
  username: '',
  password: '',
})

const showPassword = ref(false)
const loading = ref(false)
const loginError = ref('')

const validate = () => {
  errors.username = ''
  errors.password = ''
  let valid = true

  if (!form.username.trim()) {
    errors.username = '请输入用户名'
    valid = false
  }

  if (!form.password) {
    errors.password = '请输入密码'
    valid = false
  }

  return valid
}

const handleLogin = async () => {
  if (!validate()) return

  loading.value = true
  loginError.value = ''

  try {
    const res = await authApi.login({
      username: form.username,
      password: form.password,
    })

    authStore.setAuth(res.token, res.user)

    // 检查是否有 redirect 参数
    const redirect = route.query.redirect as string
    if (redirect) {
      router.push(redirect)
    } else {
      // 根据角色跳转
      if (res.user.role === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/tasks')
      }
    }
  } catch (error: any) {
    loginError.value = error.message || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>