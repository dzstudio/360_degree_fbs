// 通用分页参数
export interface PaginationParams {
  page?: number
  pageSize?: number
}

// 通用 API 响应
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 分页响应
export interface PaginatedResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// 用户
export interface User {
  id: number
  username: string
  name: string
  department?: string
  position?: string
  role: 'admin' | 'member'
  status: 'active' | 'inactive'
  createTime: string
  updateTime: string
}

// 评估项目
export interface AssessmentProject {
  id: number
  projectNo: string
  name: string
  description?: string
  templateId?: number
  status: 'draft' | 'active' | 'completed'
  createdBy: number
  creator?: User
  members?: ProjectMember[]
  tasks?: AssessmentTask[]
  createTime: string
  updateTime: string
}

// 项目成员
export interface ProjectMember {
  id: number
  projectId: number
  userId: number
  user?: User
  createTime: string
}

// 评估任务
export interface AssessmentTask {
  id: number
  projectId: number
  project?: AssessmentProject & { templateId?: number }
  assessorId: number
  assessor?: User
  targetUserId: number
  targetUser?: User
  status: 'pending' | 'in_progress' | 'completed'
  startTime?: string
  endTime?: string
  answers?: Answer[]
  createTime: string
  updateTime: string
}

// 问卷模板
export interface QuestionnaireTemplate {
  id: number
  name: string
  description?: string
  isDefault: boolean
  dimensions?: Dimension[]
  createTime: string
  updateTime: string
}

// 评估维度
export interface Dimension {
  id: number
  name: string
  description?: string
  weight: number
  templateId: number
  sortOrder: number
  questions?: Question[]
  createTime: string
  updateTime: string
}

// 评估题目
export interface Question {
  id: number
  content: string
  type: 'rating' | 'text'
  dimensionId: number
  sortOrder: number
  createTime: string
  updateTime: string
}

// 答案
export interface Answer {
  id: number
  taskId: number
  questionId: number
  question?: Question
  ratingValue?: number
  textValue?: string
  createTime: string
  updateTime: string
}

// 评估结果
export interface AssessmentResult {
  userId: number
  user?: User
  totalScore: number
  dimensionScores: DimensionScore[]
  textFeedbacks?: { question: string; answer?: string; answers?: string[]; count?: number }[]
  completedCount: number
  totalCount: number
}

// 维度分数
export interface DimensionScore {
  dimensionId: number
  dimensionName: string
  score: number
  maxScore: number
}

// 项目统计
export interface ProjectStatistics {
  totalMembers: number
  totalTasks: number
  completedTasks: number
  completionRate: number
  averageScore: number
  dimensionAverages: DimensionScore[]
}

// 创建用户参数
export interface CreateUserParams {
  username: string
  password: string
  name: string
  department?: string
  position?: string
}

// 创建项目参数
export interface CreateProjectParams {
  name: string
  description?: string
  memberIds: number[]
  templateId?: number
}

// 登录参数
export interface LoginParams {
  username: string
  password: string
}

// 登录响应
export interface LoginResponse {
  token: string
  user: User
}