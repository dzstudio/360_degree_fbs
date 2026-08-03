import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('assessment_token') || '')
  const userInfo = ref<User | null>(JSON.parse(localStorage.getItem('assessment_user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => userInfo.value?.role === 'admin')
  const isMember = computed(() => userInfo.value?.role === 'member')

  function setAuth(t: string, user: User) {
    token.value = t
    userInfo.value = user
    localStorage.setItem('assessment_token', t)
    localStorage.setItem('assessment_user', JSON.stringify(user))
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('assessment_token')
    localStorage.removeItem('assessment_user')
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    isAdmin,
    isMember,
    setAuth,
    logout,
  }
})