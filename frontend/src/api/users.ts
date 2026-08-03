import request from '@/utils/request'
import type { User, CreateUserParams, PaginatedResponse, PaginationParams } from '@/types/api'

export const usersApi = {
  // 获取用户列表
  getList(params?: PaginationParams & { keyword?: string }) {
    return request.get<any, PaginatedResponse<User>>('/users', { params })
  },

  // 获取用户详情
  getDetail(id: number) {
    return request.get<any, User>(`/users/${id}`)
  },

  // 创建用户
  create(data: CreateUserParams) {
    return request.post<any, User>('/users', data)
  },

  // 更新用户
  update(id: number, data: Partial<CreateUserParams>) {
    return request.put<any, User>(`/users/${id}`, data)
  },

  // 删除用户
  delete(id: number) {
    return request.delete<any, null>(`/users/${id}`)
  },

  // 获取所有成员（用于选择）
  getAllMembers() {
    return request.get<any, User[]>('/users/members')
  },
}