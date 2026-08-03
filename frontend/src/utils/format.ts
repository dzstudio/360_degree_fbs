import dayjs from 'dayjs'

// 格式化日期
export function formatDate(date: string | Date, format: string = 'YYYY-MM-DD HH:mm:ss') {
  return dayjs(date).format(format)
}

// 格式化项目状态
export function formatProjectStatus(status: string) {
  const statusMap: Record<string, { label: string; class: string }> = {
    draft: { label: '草稿', class: 'badge-warning' },
    active: { label: '进行中', class: 'badge-info' },
    completed: { label: '已完成', class: 'badge-success' },
  }
  return statusMap[status] || { label: status, class: '' }
}

// 格式化任务状态
export function formatTaskStatus(status: string) {
  const statusMap: Record<string, { label: string; class: string }> = {
    pending: { label: '待处理', class: 'badge-warning' },
    in_progress: { label: '进行中', class: 'badge-info' },
    completed: { label: '已完成', class: 'badge-success' },
  }
  return statusMap[status] || { label: status, class: '' }
}

// 格式化用户角色
export function formatUserRole(role: string) {
  const roleMap: Record<string, { label: string; class: string }> = {
    admin: { label: '管理员', class: 'badge-danger' },
    member: { label: '成员', class: 'badge-info' },
  }
  return roleMap[role] || { label: role, class: '' }
}

// 格式化分数
export function formatScore(score: number, maxScore: number = 5) {
  return `${score.toFixed(1)}/${maxScore}`
}

// 格式化百分比
export function formatPercentage(value: number) {
  return `${(value * 100).toFixed(1)}%`
}