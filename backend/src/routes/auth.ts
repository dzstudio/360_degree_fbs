import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../main.js'
import { success, error } from '../utils/response.js'
import { authenticate, generateToken, AuthRequest } from '../middleware/auth.js'

const router = Router()

// 登录
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return error(res, '用户名和密码不能为空', 400)
    }

    const user = await prisma.user.findUnique({
      where: { username },
    })

    if (!user) {
      return error(res, '用户名或密码错误', 401)
    }

    if (user.status !== 'active') {
      return error(res, '账号已被禁用', 401)
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return error(res, '用户名或密码错误', 401)
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
    })

    success(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        department: user.department,
        position: user.position,
        role: user.role,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    error(res, '登录失败')
  }
})

// 获取当前用户信息
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        username: true,
        name: true,
        department: true,
        position: true,
        role: true,
        status: true,
        createTime: true,
      },
    })

    if (!user) {
      return error(res, '用户不存在', 404)
    }

    success(res, user)
  } catch (err) {
    console.error('Get user info error:', err)
    error(res, '获取用户信息失败')
  }
})

// 修改密码
router.put('/password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      return error(res, '请提供原密码和新密码', 400)
    }

    if (newPassword.length < 6) {
      return error(res, '新密码长度不能少于6位', 400)
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    })

    if (!user) {
      return error(res, '用户不存在', 404)
    }

    const isValidPassword = await bcrypt.compare(oldPassword, user.password)
    if (!isValidPassword) {
      return error(res, '原密码错误', 400)
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { password: hashedPassword },
    })

    success(res, null)
  } catch (err) {
    console.error('Change password error:', err)
    error(res, '修改密码失败')
  }
})

// 登出（前端处理，后端无需操作）
router.post('/logout', (req, res) => {
  success(res, null)
})

export default router