import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../main.js'
import { error } from '../utils/response.js'

const JWT_SECRET = process.env.JWT_SECRET || '360-assessment-secret-key'

export interface AuthRequest extends Request {
  user?: {
    id: number
    username: string
    role: string
  }
}

// 验证 JWT token
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, '未提供认证令牌', 401)
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number
      username: string
      role: string
    }

    // 验证用户是否存在且状态正常
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    })

    if (!user || user.status !== 'active') {
      return error(res, '用户不存在或已被禁用', 401)
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    }

    next()
  } catch (err) {
    return error(res, '认证令牌无效或已过期', 401)
  }
}

// 验证管理员权限
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return error(res, '需要管理员权限', 403)
  }
  next()
}

// 生成 JWT token
export function generateToken(user: { id: number; username: string; role: string }): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' })
}