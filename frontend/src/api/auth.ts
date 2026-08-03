import request from '@/utils/request'
import type { LoginParams, LoginResponse, User } from '@/types/api'

export const authApi = {
  // 登录
  login(data: LoginParams) {
    return request.post<any, LoginResponse>('/auth/login', data)
  },

  // 登出
  logout() {
    return request.post<any, null>('/auth/logout')
  },

  // 获取当前用户信息
  getMe() {
    return request.get<any, User>('/auth/me')
  },

  // 修改密码
  changePassword(data: { oldPassword: string; newPassword: string }) {
    return request.put<any, null>('/auth/password', data)
  },
}