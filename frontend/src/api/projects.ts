import request from '@/utils/request'
import type {
  AssessmentProject,
  CreateProjectParams,
  PaginatedResponse,
  PaginationParams,
  AssessmentResult,
  ProjectStatistics,
} from '@/types/api'

export interface MyProject {
  id: number
  projectNo: string
  name: string
  description?: string
  completionRate: number
  completedCount: number
  totalCount: number
  isSubmitted: boolean
  canSubmit: boolean
  distribution: {
    high: { count: number; ratio: number; names: string[] }
    mid: { count: number; ratio: number; names: string[] }
    low: { count: number; ratio: number; names: string[] }
  }
  tasks: {
    id: number
    targetUser: { id: number; name: string; department?: string; position?: string }
    status: string
    score: number | null
  }[]
  members: { id: number; name: string; department?: string; position?: string }[]
  dimensions: { id: number; name: string; weight: number }[]
}

export interface SubmitResult {
  submitted: boolean
  distribution: {
    high: { count: number; ratio: number }
    mid: { count: number; ratio: number }
    low: { count: number; ratio: number }
  }
  scores: number[]
}

export const projectsApi = {
  // 获取我的项目列表（成员视角）
  getMyList() {
    return request.get<any, MyProject[]>('/projects/my/list')
  },

  // 提交项目评估
  submit(id: number) {
    return request.post<any, SubmitResult>(`/projects/${id}/submit`)
  },

  // 获取项目列表
  getList(params?: PaginationParams & { keyword?: string; status?: string }) {
    return request.get<any, PaginatedResponse<AssessmentProject>>('/projects', { params })
  },

  // 获取项目详情
  getDetail(id: number) {
    return request.get<any, AssessmentProject>(`/projects/${id}`)
  },

  // 创建项目
  create(data: CreateProjectParams) {
    return request.post<any, AssessmentProject>('/projects', data)
  },

  // 更新项目
  update(id: number, data: Partial<CreateProjectParams>) {
    return request.put<any, AssessmentProject>(`/projects/${id}`, data)
  },

  // 删除项目
  delete(id: number) {
    return request.delete<any, null>(`/projects/${id}`)
  },

  // 激活项目
  activate(id: number) {
    return request.post<any, AssessmentProject>(`/projects/${id}/activate`)
  },

  // 完成项目
  complete(id: number) {
    return request.post<any, AssessmentProject>(`/projects/${id}/complete`)
  },

  // 获取项目评估结果
  getResults(id: number) {
    return request.get<any, AssessmentResult[]>(`/projects/${id}/results`)
  },

  // 获取个人评估结果
  getResult(id: number, userId: number) {
    return request.get<any, AssessmentResult>(`/projects/${id}/results/${userId}`)
  },

  // 获取项目统计数据
  getStatistics(id: number) {
    return request.get<any, ProjectStatistics>(`/projects/${id}/statistics`)
  },
}