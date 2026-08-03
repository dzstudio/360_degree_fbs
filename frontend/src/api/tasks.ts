import request from '@/utils/request'
import type { AssessmentTask, Answer, PaginatedResponse, PaginationParams } from '@/types/api'

export const tasksApi = {
  // 获取我的待办任务
  getMyTasks(params?: PaginationParams & { status?: string }) {
    return request.get<any, PaginatedResponse<AssessmentTask>>('/tasks', { params })
  },

  // 获取任务详情
  getDetail(id: number) {
    return request.get<any, AssessmentTask>(`/tasks/${id}`)
  },

  // 暂存答案
  saveAnswers(id: number, data: { answers: Partial<Answer>[] }) {
    return request.post<any, AssessmentTask>(`/tasks/${id}/save`, data)
  },

  // 提交评估
  submit(id: number, data: { answers: Partial<Answer>[] }) {
    return request.post<any, AssessmentTask>(`/tasks/${id}/submit`, data)
  },

  // 重置任务（重新评估）
  reset(id: number) {
    return request.post<any, AssessmentTask>(`/tasks/${id}/reset`)
  },
}