import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../main.js'
import { success, error, paginate } from '../utils/response.js'
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js'

const router = Router()

// 所有用户路由需要认证和管理员权限
router.use(authenticate, requireAdmin)

// 获取用户列表
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { keyword, page = 1, pageSize = 20 } = req.query
    const where: any = {
      role: 'member', // 只查询成员
    }

    if (keyword) {
      where.OR = [
        { username: { contains: keyword as string } },
        { name: { contains: keyword as string } },
        { department: { contains: keyword as string } },
      ]
    }

    const skip = (Number(page) - 1) * Number(pageSize)
    const take = Number(pageSize)

    const [list, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createTime: 'desc' },
        skip,
        take,
        select: {
          id: true,
          username: true,
          name: true,
          department: true,
          position: true,
          role: true,
          status: true,
          createTime: true,
          updateTime: true,
        },
      }),
      prisma.user.count({ where }),
    ])

    paginate(res, list, total, Number(page), Number(pageSize))
  } catch (err) {
    console.error('Get users error:', err)
    error(res, '获取用户列表失败')
  }
})

// 获取所有成员（用于选择）
router.get('/members', async (req: AuthRequest, res: Response) => {
  try {
    const members = await prisma.user.findMany({
      where: {
        role: 'member',
        status: 'active',
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        username: true,
        name: true,
        department: true,
        position: true,
      },
    })

    success(res, members)
  } catch (err) {
    console.error('Get members error:', err)
    error(res, '获取成员列表失败')
  }
})

// 获取用户详情
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        username: true,
        name: true,
        department: true,
        position: true,
        role: true,
        status: true,
        createTime: true,
        updateTime: true,
      },
    })

    if (!user) {
      return error(res, '用户不存在', 404)
    }

    success(res, user)
  } catch (err) {
    console.error('Get user error:', err)
    error(res, '获取用户信息失败')
  }
})

// 创建用户
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, name, department, position } = req.body

    if (!username || !password || !name) {
      return error(res, '用户名、密码和姓名不能为空', 400)
    }

    if (password.length < 6) {
      return error(res, '密码长度不能少于6位', 400)
    }

    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      return error(res, '用户名已存在', 400)
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        department,
        position,
        role: 'member',
      },
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

    success(res, user)
  } catch (err) {
    console.error('Create user error:', err)
    error(res, '创建用户失败')
  }
})

// 更新用户
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { name, department, position, status } = req.body

    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
    })

    if (!user) {
      return error(res, '用户不存在', 404)
    }

    if (user.role === 'admin') {
      return error(res, '不能修改管理员账号', 400)
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        name,
        department,
        position,
        status,
      },
      select: {
        id: true,
        username: true,
        name: true,
        department: true,
        position: true,
        role: true,
        status: true,
        createTime: true,
        updateTime: true,
      },
    })

    success(res, updatedUser)
  } catch (err) {
    console.error('Update user error:', err)
    error(res, '更新用户失败')
  }
})

// 删除用户
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
    })

    if (!user) {
      return error(res, '用户不存在', 404)
    }

    if (user.role === 'admin') {
      return error(res, '不能删除管理员账号', 400)
    }

    await prisma.user.delete({
      where: { id: Number(id) },
    })

    success(res, null)
  } catch (err) {
    console.error('Delete user error:', err)
    error(res, '删除用户失败')
  }
})

export default router