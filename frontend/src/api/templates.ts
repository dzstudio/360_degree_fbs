import request from '@/utils/request'
import type { QuestionnaireTemplate, Dimension, Question } from '@/types/api'

export const templatesApi = {
  // 获取模板列表
  getList() {
    return request.get<any, QuestionnaireTemplate[]>('/templates')
  },

  // 获取模板详情
  getDetail(id: number) {
    return request.get<any, QuestionnaireTemplate>(`/templates/${id}`)
  },

  // 创建模板
  create(data: Partial<QuestionnaireTemplate>) {
    return request.post<any, QuestionnaireTemplate>('/templates', data)
  },

  // 更新模板
  update(id: number, data: Partial<QuestionnaireTemplate>) {
    return request.put<any, QuestionnaireTemplate>(`/templates/${id}`, data)
  },

  // 删除模板
  delete(id: number) {
    return request.delete<any, null>(`/templates/${id}`)
  },

  // 创建维度
  createDimension(templateId: number, data: Partial<Dimension>) {
    return request.post<any, Dimension>(`/templates/${templateId}/dimensions`, data)
  },

  // 更新维度
  updateDimension(id: number, data: Partial<Dimension>) {
    return request.put<any, Dimension>(`/templates/dimensions/${id}`, data)
  },

  // 删除维度
  deleteDimension(id: number) {
    return request.delete<any, null>(`/templates/dimensions/${id}`)
  },

  // 创建题目
  createQuestion(dimensionId: number, data: Partial<Question>) {
    return request.post<any, Question>(`/templates/dimensions/${dimensionId}/questions`, data)
  },

  // 更新题目
  updateQuestion(id: number, data: Partial<Question>) {
    return request.put<any, Question>(`/templates/questions/${id}`, data)
  },

  // 删除题目
  deleteQuestion(id: number) {
    return request.delete<any, null>(`/templates/questions/${id}`)
  },
}