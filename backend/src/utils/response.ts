import { Response } from 'express'

interface ApiResponse<T = any> {
  code: number
  message: string
  data: T | null
}

export function success<T>(res: Response, data: T): void {
  res.json({ code: 0, message: 'success', data })
}

export function error(res: Response, message: string, code: number = 500): void {
  res.json({ code, message, data: null })
}

export function paginate<T>(res: Response, list: T[], total: number, page: number, pageSize: number): void {
  success(res, { list, total, page, pageSize })
}