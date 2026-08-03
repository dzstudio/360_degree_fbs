import { Router, Response } from 'express'
import { prisma } from '../main.js'
import { success, error, paginate } from '../utils/response.js'
import { authenticate, AuthRequest } from '../middleware/auth.js'

const router = Router()

// 所有任务路由需要认证
router.use(authenticate)

// 获取我的待办任务
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query
    const where: any = {
      assessorId: req.user!.id,
    }

    if (status) {
      where.status = status
    }

    const skip = (Number(page) - 1) * Number(pageSize)
    const take = Number(pageSize)

    const [list, total] = await Promise.all([
      prisma.assessmentTask.findMany({
        where,
        orderBy: { createTime: 'desc' },
        skip,
        take,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              projectNo: true,
            },
          },
          targetUser: {
            select: {
              id: true,
              name: true,
              department: true,
              position: true,
            },
          },
        },
      }),
      prisma.assessmentTask.count({ where }),
    ])

    paginate(res, list, total, Number(page), Number(pageSize))
  } catch (err) {
    console.error('Get tasks error:', err)
    error(res, '获取任务列表失败')
  }
})

// 获取任务详情
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const task = await prisma.assessmentTask.findUnique({
      where: { id: Number(id) },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectNo: true,
            templateId: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            name: true,
            department: true,
            position: true,
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
    })

    if (!task) {
      return error(res, '任务不存在', 404)
    }

    // 验证是否是当前用户的任务
    if (task.assessorId !== req.user!.id) {
      return error(res, '无权访问此任务', 403)
    }

    success(res, task)
  } catch (err) {
    console.error('Get task error:', err)
    error(res, '获取任务信息失败')
  }
})

// 暂存答案
router.post('/:id/save', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { answers } = req.body

    const task = await prisma.assessmentTask.findUnique({
      where: { id: Number(id) },
    })

    if (!task) {
      return error(res, '任务不存在', 404)
    }

    // 验证是否是当前用户的任务
    if (task.assessorId !== req.user!.id) {
      return error(res, '无权操作此任务', 403)
    }

    if (task.status === 'completed') {
      return error(res, '已完成的任务不能修改', 400)
    }

    // 更新任务状态为进行中
    await prisma.assessmentTask.update({
      where: { id: Number(id) },
      data: {
        status: 'in_progress',
        startTime: task.startTime || new Date(),
      },
    })

    // 保存或更新答案
    if (answers && answers.length > 0) {
      for (const answer of answers) {
        await prisma.answer.upsert({
          where: {
            taskId_questionId: {
              taskId: Number(id),
              questionId: answer.questionId,
            },
          },
          update: {
            ratingValue: answer.ratingValue,
            textValue: answer.textValue,
          },
          create: {
            taskId: Number(id),
            questionId: answer.questionId,
            ratingValue: answer.ratingValue,
            textValue: answer.textValue,
          },
        })
      }
    }

    const updatedTask = await prisma.assessmentTask.findUnique({
      where: { id: Number(id) },
      include: {
        answers: true,
      },
    })

    success(res, updatedTask)
  } catch (err) {
    console.error('Save answers error:', err)
    error(res, '保存答案失败')
  }
})

// 提交评估
router.post('/:id/submit', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { answers } = req.body

    const task = await prisma.assessmentTask.findUnique({
      where: { id: Number(id) },
      include: {
        project: {
          include: {
            template: {
              include: {
                dimensions: {
                  include: {
                    questions: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!task) {
      return error(res, '任务不存在', 404)
    }

    // 验证是否是当前用户的任务
    if (task.assessorId !== req.user!.id) {
      return error(res, '无权操作此任务', 403)
    }

    if (task.status === 'completed') {
      return error(res, '任务已经完成', 400)
    }

    // 验证是否所有题目都已作答
    const allQuestions = task.project.template?.dimensions.flatMap((d) => d.questions) || []
    if (allQuestions.length > 0 && (!answers || answers.length < allQuestions.length)) {
      return error(res, '请完成所有题目后再提交', 400)
    }

    // 保存答案
    if (answers && answers.length > 0) {
      for (const answer of answers) {
        await prisma.answer.upsert({
          where: {
            taskId_questionId: {
              taskId: Number(id),
              questionId: answer.questionId,
            },
          },
          update: {
            ratingValue: answer.ratingValue,
            textValue: answer.textValue,
          },
          create: {
            taskId: Number(id),
            questionId: answer.questionId,
            ratingValue: answer.ratingValue,
            textValue: answer.textValue,
          },
        })
      }
    }

    // 更新任务状态为已完成
    const updatedTask = await prisma.assessmentTask.update({
      where: { id: Number(id) },
      data: {
        status: 'completed',
        endTime: new Date(),
      },
      include: {
        answers: true,
      },
    })

    success(res, updatedTask)
  } catch (err) {
    console.error('Submit task error:', err)
    error(res, '提交评估失败')
  }
})

// 修改评估（允许基于已有答案修改）
router.post('/:id/reset', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const task = await prisma.assessmentTask.findUnique({
      where: { id: Number(id) },
      include: {
        answers: true,
      },
    })

    if (!task) {
      return error(res, '任务不存在', 404)
    }

    // 验证是否是当前用户的任务
    if (task.assessorId !== req.user!.id) {
      return error(res, '无权操作此任务', 403)
    }

    // 只有已完成的任务才能修改
    if (task.status !== 'completed') {
      return error(res, '只能修改已完成的任务', 400)
    }

    // 检查项目是否已提交
    const projectMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId: req.user!.id,
        },
      },
    })

    if (projectMember?.submitted) {
      return error(res, '项目已提交，无法修改评估', 400)
    }

    // 将任务状态改为进行中，保留已有答案
    const updatedTask = await prisma.assessmentTask.update({
      where: { id: Number(id) },
      data: {
        status: 'in_progress',
        endTime: null,
      },
      include: {
        answers: true,
      },
    })

    success(res, updatedTask)
  } catch (err) {
    console.error('Reset task error:', err)
    error(res, '修改评估失败')
  }
})

export default router