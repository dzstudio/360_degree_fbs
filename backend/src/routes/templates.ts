import { Router, Response } from 'express'
import { prisma } from '../main.js'
import { success, error } from '../utils/response.js'
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js'

const router = Router()

// 所有模板路由需要认证
router.use(authenticate)

// 获取模板列表
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const templates = await prisma.questionnaireTemplate.findMany({
      orderBy: { createTime: 'desc' },
      include: {
        dimensions: {
          include: {
            questions: true,
          },
        },
      },
    })

    success(res, templates)
  } catch (err) {
    console.error('Get templates error:', err)
    error(res, '获取模板列表失败')
  }
})

// 获取模板详情
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const template = await prisma.questionnaireTemplate.findUnique({
      where: { id: Number(id) },
      include: {
        dimensions: {
          orderBy: { sortOrder: 'asc' },
          include: {
            questions: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    })

    if (!template) {
      return error(res, '模板不存在', 404)
    }

    success(res, template)
  } catch (err) {
    console.error('Get template error:', err)
    error(res, '获取模板信息失败')
  }
})

// 创建模板（管理员）
router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body

    if (!name) {
      return error(res, '模板名称不能为空', 400)
    }

    const template = await prisma.questionnaireTemplate.create({
      data: {
        name,
        description,
      },
    })

    success(res, template)
  } catch (err) {
    console.error('Create template error:', err)
    error(res, '创建模板失败')
  }
})

// 更新模板（管理员）
router.put('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { name, description } = req.body

    const template = await prisma.questionnaireTemplate.findUnique({
      where: { id: Number(id) },
    })

    if (!template) {
      return error(res, '模板不存在', 404)
    }

    const updatedTemplate = await prisma.questionnaireTemplate.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
      },
    })

    success(res, updatedTemplate)
  } catch (err) {
    console.error('Update template error:', err)
    error(res, '更新模板失败')
  }
})

// 删除模板（管理员）
router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const template = await prisma.questionnaireTemplate.findUnique({
      where: { id: Number(id) },
    })

    if (!template) {
      return error(res, '模板不存在', 404)
    }

    if (template.isDefault) {
      return error(res, '不能删除默认模板', 400)
    }

    // 检查模板是否被项目使用
    const projectsUsingTemplate = await prisma.assessmentProject.count({
      where: { templateId: Number(id) },
    })

    if (projectsUsingTemplate > 0) {
      return error(res, '该模板正在被项目使用，无法删除', 400)
    }

    await prisma.questionnaireTemplate.delete({
      where: { id: Number(id) },
    })

    success(res, null)
  } catch (err) {
    console.error('Delete template error:', err)
    error(res, '删除模板失败')
  }
})

// 创建维度（管理员）
router.post('/:id/dimensions', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { name, description, weight } = req.body

    if (!name) {
      return error(res, '维度名称不能为空', 400)
    }

    const template = await prisma.questionnaireTemplate.findUnique({
      where: { id: Number(id) },
    })

    if (!template) {
      return error(res, '模板不存在', 404)
    }

    // 获取当前最大排序号
    const maxOrder = await prisma.dimension.findFirst({
      where: { templateId: Number(id) },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    const dimension = await prisma.dimension.create({
      data: {
        name,
        description,
        weight: weight || 0.2,
        templateId: Number(id),
        sortOrder: (maxOrder?.sortOrder || 0) + 1,
      },
    })

    success(res, dimension)
  } catch (err) {
    console.error('Create dimension error:', err)
    error(res, '创建维度失败')
  }
})

// 更新维度（管理员）
router.put('/dimensions/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { name, description, weight, sortOrder } = req.body

    const dimension = await prisma.dimension.findUnique({
      where: { id: Number(id) },
    })

    if (!dimension) {
      return error(res, '维度不存在', 404)
    }

    const updatedDimension = await prisma.dimension.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        weight,
        sortOrder,
      },
    })

    success(res, updatedDimension)
  } catch (err) {
    console.error('Update dimension error:', err)
    error(res, '更新维度失败')
  }
})

// 删除维度（管理员）
router.delete('/dimensions/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const dimension = await prisma.dimension.findUnique({
      where: { id: Number(id) },
    })

    if (!dimension) {
      return error(res, '维度不存在', 404)
    }

    await prisma.dimension.delete({
      where: { id: Number(id) },
    })

    success(res, null)
  } catch (err) {
    console.error('Delete dimension error:', err)
    error(res, '删除维度失败')
  }
})

// 创建题目（管理员）
router.post('/dimensions/:id/questions', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { content, type } = req.body

    if (!content) {
      return error(res, '题目内容不能为空', 400)
    }

    const dimension = await prisma.dimension.findUnique({
      where: { id: Number(id) },
    })

    if (!dimension) {
      return error(res, '维度不存在', 404)
    }

    // 获取当前最大排序号
    const maxOrder = await prisma.question.findFirst({
      where: { dimensionId: Number(id) },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    const question = await prisma.question.create({
      data: {
        content,
        type: type || 'rating',
        dimensionId: Number(id),
        sortOrder: (maxOrder?.sortOrder || 0) + 1,
      },
    })

    success(res, question)
  } catch (err) {
    console.error('Create question error:', err)
    error(res, '创建题目失败')
  }
})

// 更新题目（管理员）
router.put('/questions/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { content, type, sortOrder } = req.body

    const question = await prisma.question.findUnique({
      where: { id: Number(id) },
    })

    if (!question) {
      return error(res, '题目不存在', 404)
    }

    const updatedQuestion = await prisma.question.update({
      where: { id: Number(id) },
      data: {
        content,
        type,
        sortOrder,
      },
    })

    success(res, updatedQuestion)
  } catch (err) {
    console.error('Update question error:', err)
    error(res, '更新题目失败')
  }
})

// 删除题目（管理员）
router.delete('/questions/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const question = await prisma.question.findUnique({
      where: { id: Number(id) },
    })

    if (!question) {
      return error(res, '题目不存在', 404)
    }

    await prisma.question.delete({
      where: { id: Number(id) },
    })

    success(res, null)
  } catch (err) {
    console.error('Delete question error:', err)
    error(res, '删除题目失败')
  }
})

export default router