import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'
import type { ApiResponse } from '@/types/api'

const instance = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
})

// 请求拦截：自动附加 Authorization
instance.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`
  }
  return config
})

// 响应拦截：解包 ApiResponse，code !== 0 抛错，401 跳登录
instance.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse
    if (data.code !== 0) {
      return Promise.reject(new Error(data.message || '请求失败'))
    }
    return data.data  // 直接返回 data 字段，调用方无需再 .data
  },
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
      // 根据当前路径判断跳转到哪个登录页
      const currentPath = router.currentRoute.value.path
      if (currentPath.startsWith('/admin')) {
        router.push('/admin/login')
      } else {
        router.push('/login')
      }
    }
    return Promise.reject(error)
  }
)

export default instance