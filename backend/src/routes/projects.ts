import { Router, Response } from 'express'
import { prisma } from '../main.js'
import { success, error, paginate } from '../utils/response.js'
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js'
import { generateNo } from '../utils/generator.js'

const router = Router()

// 所有项目路由需要认证
router.use(authenticate)

// 获取项目列表（管理员）
router.get('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { keyword, status, page = 1, pageSize = 20 } = req.query
    const where: any = {}

    if (keyword) {
      where.OR = [
        { name: { contains: keyword as string } },
        { projectNo: { contains: keyword as string } },
      ]
    }

    if (status) {
      where.status = status
    }

    const skip = (Number(page) - 1) * Number(pageSize)
    const take = Number(pageSize)

    const [list, total] = await Promise.all([
      prisma.assessmentProject.findMany({
        where,
        orderBy: { createTime: 'desc' },
        skip,
        take,
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  department: true,
                  position: true,
                },
              },
            },
          },
          _count: {
            select: { tasks: true },
          },
        },
      }),
      prisma.assessmentProject.count({ where }),
    ])

    paginate(res, list, total, Number(page), Number(pageSize))
  } catch (err) {
    console.error('Get projects error:', err)
    error(res, '获取项目列表失败')
  }
})

// 获取我的项目列表（成员视角，按项目分组）
router.get('/my/list', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id

    // 获取用户参与的所有项目
    const projects = await prisma.assessmentProject.findMany({
      where: {
        status: 'active',
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, department: true, position: true },
            },
          },
        },
        tasks: {
          where: { assessorId: userId },
          include: {
            targetUser: {
              select: { id: true, name: true, department: true, position: true },
            },
            answers: true,
          },
        },
        template: {
          include: {
            dimensions: true,
          },
        },
      },
      orderBy: { createTime: 'desc' },
    })

    // 获取用户在各项目的提交状态
    const memberRecords = await prisma.projectMember.findMany({
      where: { userId },
    })

    const submittedMap = new Map(memberRecords.map((r) => [r.projectId, r.submitted]))

    // 组装返回数据
    const result = projects.map((project) => {
      const myTasks = project.tasks
      const completedCount = myTasks.filter((t) => t.status === 'completed').length
      const totalCount = myTasks.length
      const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
      const isSubmitted = submittedMap.get(project.id) || false

      // 计算分数分布（已完成的任务）
      const completedTasks = myTasks.filter((t) => t.status === 'completed')
      const taskScores: Record<number, number> = {}
      const scores: number[] = []
      const highNames: string[] = []
      const midNames: string[] = []
      const lowNames: string[] = []

      for (const task of completedTasks) {
        const validAnswers = task.answers.filter((a) => a.ratingValue !== null)
        if (validAnswers.length > 0) {
          const avg = validAnswers.reduce((sum, a) => sum + (a.ratingValue || 0), 0) / validAnswers.length
          const score = Math.round(avg * 10) / 10
          taskScores[task.targetUserId] = score
          scores.push(score)

          const name = task.targetUser?.name || ''
          if (score >= 4) {
            highNames.push(name)
          } else if (score >= 3) {
            midNames.push(name)
          } else {
            lowNames.push(name)
          }
        }
      }

      const highCount = highNames.length
      const midCount = midNames.length
      const lowCount = lowNames.length

      return {
        id: project.id,
        projectNo: project.projectNo,
        name: project.name,
        description: project.description,
        completionRate,
        completedCount,
        totalCount,
        isSubmitted,
        canSubmit: completedCount === totalCount && !isSubmitted,
        distribution: {
          high: { count: highCount, ratio: scores.length > 0 ? Math.round((highCount / scores.length) * 100) : 0, names: highNames },
          mid: { count: midCount, ratio: scores.length > 0 ? Math.round((midCount / scores.length) * 100) : 0, names: midNames },
          low: { count: lowCount, ratio: scores.length > 0 ? Math.round((lowCount / scores.length) * 100) : 0, names: lowNames },
        },
        tasks: myTasks.map((t) => ({
          id: t.id,
          targetUser: t.targetUser,
          status: t.status,
          score: taskScores[t.targetUserId] || null,
        })),
        members: project.members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          department: m.user.department,
          position: m.user.position,
        })),
        dimensions: project.template?.dimensions.map((d) => ({
          id: d.id,
          name: d.name,
          weight: d.weight,
        })) || [],
      }
    })

    success(res, result)
  } catch (err) {
    console.error('Get my projects error:', err)
    error(res, '获取项目列表失败')
  }
})

// 获取项目详情
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const project = await prisma.assessmentProject.findUnique({
      where: { id: Number(id) },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                department: true,
                position: true,
              },
            },
          },
        },
        tasks: {
          include: {
            assessor: {
              select: { id: true, name: true },
            },
            targetUser: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    if (!project) {
      return error(res, '项目不存在', 404)
    }

    success(res, project)
  } catch (err) {
    console.error('Get project error:', err)
    error(res, '获取项目信息失败')
  }
})

// 创建项目（管理员）
router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, memberIds, templateId } = req.body

    if (!name) {
      return error(res, '项目名称不能为空', 400)
    }

    if (!memberIds || memberIds.length < 3) {
      return error(res, '至少需要选择3个成员', 400)
    }

    // 生成项目编号
    const count = await prisma.assessmentProject.count()
    const projectNo = generateNo('project', count + 1)

    const project = await prisma.assessmentProject.create({
      data: {
        projectNo,
        name,
        description,
        templateId: templateId || null,
        createdBy: req.user!.id,
        members: {
          create: memberIds.map((userId: number) => ({
            userId,
          })),
        },
      },
      include: {
        members: true,
      },
    })

    success(res, project)
  } catch (err) {
    console.error('Create project error:', err)
    error(res, '创建项目失败')
  }
})

// 更新项目（管理员）
router.put('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { name, description, memberIds, templateId } = req.body

    const project = await prisma.assessmentProject.findUnique({
      where: { id: Number(id) },
    })

    if (!project) {
      return error(res, '项目不存在', 404)
    }

    if (project.status !== 'draft') {
      return error(res, '只能编辑草稿状态的项目', 400)
    }

    // 更新项目基本信息
    const updatedProject = await prisma.assessmentProject.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        templateId: templateId || null,
      },
    })

    // 更新成员
    if (memberIds) {
      // 删除原有成员
      await prisma.projectMember.deleteMany({
        where: { projectId: Number(id) },
      })

      // 添加新成员
      await prisma.projectMember.createMany({
        data: memberIds.map((userId: number) => ({
          projectId: Number(id),
          userId,
        })),
      })
    }

    const result = await prisma.assessmentProject.findUnique({
      where: { id: Number(id) },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                department: true,
                position: true,
              },
            },
          },
        },
      },
    })

    success(res, result)
  } catch (err) {
    console.error('Update project error:', err)
    error(res, '更新项目失败')
  }
})

// 删除项目（管理员）
router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const project = await prisma.assessmentProject.findUnique({
      where: { id: Number(id) },
    })

    if (!project) {
      return error(res, '项目不存在', 404)
    }

    if (project.status === 'active') {
      return error(res, '不能删除进行中的项目', 400)
    }

    await prisma.assessmentProject.delete({
      where: { id: Number(id) },
    })

    success(res, null)
  } catch (err) {
    console.error('Delete project error:', err)
    error(res, '删除项目失败')
  }
})

// 激活项目（管理员）
router.post('/:id/activate', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const project = await prisma.assessmentProject.findUnique({
      where: { id: Number(id) },
      include: {
        members: true,
      },
    })

    if (!project) {
      return error(res, '项目不存在', 404)
    }

    if (project.status !== 'draft') {
      return error(res, '只能激活草稿状态的项目', 400)
    }

    if (project.members.length < 2) {
      return error(res, '至少需要3个成员才能激活项目', 400)
    }

    // 生成评估任务：每个成员需要评估其他所有成员
    const tasks = []
    for (const assessor of project.members) {
      for (const target of project.members) {
        if (assessor.userId !== target.userId) {
          tasks.push({
            projectId: project.id,
            assessorId: assessor.userId,
            targetUserId: target.userId,
          })
        }
      }
    }

    // 批量创建任务
    await prisma.assessmentTask.createMany({
      data: tasks,
    })

    // 更新项目状态
    const updatedProject = await prisma.assessmentProject.update({
      where: { id: Number(id) },
      data: { status: 'active' },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        tasks: {
          include: {
            assessor: {
              select: { id: true, name: true },
            },
            targetUser: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    success(res, updatedProject)
  } catch (err) {
    console.error('Activate project error:', err)
    error(res, '激活项目失败')
  }
})

// 成员提交项目（带正态分布校验）
router.post('/:id/submit', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const project = await prisma.assessmentProject.findUnique({
      where: { id: Number(id) },
      include: {
        tasks: {
          where: { assessorId: userId },
          include: {
            targetUser: {
              select: { id: true, name: true },
            },
            answers: {
              include: {
                question: {
                  include: { dimension: true },
                },
              },
            },
          },
        },
        members: true,
      },
    })

    if (!project) {
      return error(res, '项目不存在', 404)
    }

    if (project.status !== 'active') {
      return error(res, '项目未激活', 400)
    }

    // 检查当前用户是否是项目成员
    const isMember = project.members.some((m) => m.userId === userId)
    if (!isMember) {
      return error(res, '您不是该项目成员', 403)
    }

    // 检查是否已完成所有评估任务
    const myTasks = project.tasks
    const incompleteTasks = myTasks.filter((t) => t.status !== 'completed')
    if (incompleteTasks.length > 0) {
      return error(res, `还有 ${incompleteTasks.length} 个评估任务未完成`, 400)
    }

    // 计算每个被评人的总分，用于正态分布校验
    const targetScores: Record<number, { name: string; scores: number[] }> = {}

    for (const task of myTasks) {
      const targetId = task.targetUserId
      if (!targetScores[targetId]) {
        targetScores[targetId] = { name: task.targetUser?.name || '', scores: [] }
      }

      // 计算该任务的平均分
      const validAnswers = task.answers.filter((a) => a.ratingValue !== null)
      if (validAnswers.length > 0) {
        const avg = validAnswers.reduce((sum, a) => sum + (a.ratingValue || 0), 0) / validAnswers.length
        targetScores[targetId].scores.push(avg)
      }
    }

    // 计算每个人的最终得分
    const finalScores = Object.values(targetScores).map((t) => {
      const avg = t.scores.length > 0 ? t.scores.reduce((a, b) => a + b, 0) / t.scores.length : 0
      return Math.round(avg * 10) / 10
    })

    // 正态分布校验：检查分数分布是否合理
    // 理想分布：高分(4-5)约20-30%，中分(3-4)约40-50%，低分(1-3)约20-30%
    const total = finalScores.length
    if (total < 3) {
      return error(res, '评估人数不足，无法进行分布校验', 400)
    }

    const highScores = finalScores.filter((s) => s >= 4).length
    const midScores = finalScores.filter((s) => s >= 3 && s < 4).length
    const lowScores = finalScores.filter((s) => s < 3).length

    const highRatio = highScores / total
    const midRatio = midScores / total
    const lowRatio = lowScores / total

    // 校验分布：三档都必须有人
    if (highScores === 0) {
      return error(res, '评分分布不符合要求：缺少高分（4-5分），请调整评分', 400)
    }
    if (midScores === 0) {
      return error(res, '评分分布不符合要求：缺少中分（3-4分），请调整评分', 400)
    }
    if (lowScores === 0) {
      return error(res, '评分分布不符合要求：缺少低分（1-3分），请调整评分', 400)
    }
    // 高分不能超过60%
    if (highRatio > 0.6) {
      return error(res, `评分分布不合理：高分占比过高(${Math.round(highRatio * 100)}%)，请调整评分`, 400)
    }
    // 低分不能超过60%
    if (lowRatio > 0.6) {
      return error(res, `评分分布不合理：低分占比过高(${Math.round(lowRatio * 100)}%)，请调整评分`, 400)
    }

    // 标记该成员已提交
    await prisma.projectMember.update({
      where: {
        projectId_userId: {
          projectId: Number(id),
          userId,
        },
      },
      data: {
        submitted: true,
        submitTime: new Date(),
      },
    })

    // 返回分布信息供前端显示
    success(res, {
      submitted: true,
      distribution: {
        high: { count: highScores, ratio: Math.round(highRatio * 100) },
        mid: { count: midScores, ratio: Math.round(midRatio * 100) },
        low: { count: lowScores, ratio: Math.round(lowRatio * 100) },
      },
      scores: finalScores,
    })
  } catch (err) {
    console.error('Submit project error:', err)
    error(res, '提交失败')
  }
})

// 完成项目（管理员）
router.post('/:id/complete', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const project = await prisma.assessmentProject.findUnique({
      where: { id: Number(id) },
    })

    if (!project) {
      return error(res, '项目不存在', 404)
    }

    if (project.status !== 'active') {
      return error(res, '只能完成进行中的项目', 400)
    }

    const updatedProject = await prisma.assessmentProject.update({
      where: { id: Number(id) },
      data: { status: 'completed' },
    })

    success(res, updatedProject)
  } catch (err) {
    console.error('Complete project error:', err)
    error(res, '完成项目失败')
  }
})

// 获取项目评估结果（管理员）
router.get('/:id/results', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const project = await prisma.assessmentProject.findUnique({
      where: { id: Number(id) },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                department: true,
                position: true,
              },
            },
          },
        },
      },
    })

    if (!project) {
      return error(res, '项目不存在', 404)
    }

    // 获取每个成员的评估结果
    const results = []
    for (const member of project.members) {
      // 获取该成员被评估的任务
      const tasks = await prisma.assessmentTask.findMany({
        where: {
          projectId: Number(id),
          targetUserId: member.userId,
        },
        include: {
          answers: {
            include: {
              question: {
                include: {
                  dimension: true,
                },
              },
            },
          },
        },
      })

      // 计算各维度分数
      const dimensionScores: Record<number, { name: string; weight: number; total: number; count: number }> = {}

      for (const task of tasks) {
        if (task.status === 'completed') {
          for (const answer of task.answers) {
            if (answer.ratingValue) {
              const dimensionId = answer.question.dimensionId
              if (!dimensionScores[dimensionId]) {
                dimensionScores[dimensionId] = {
                  name: answer.question.dimension.name,
                  weight: answer.question.dimension.weight,
                  total: 0,
                  count: 0,
                }
              }
              dimensionScores[dimensionId].total += answer.ratingValue
              dimensionScores[dimensionId].count++
            }
          }
        }
      }

      // 计算加权总分
      let weightedTotalScore = 0
      let totalWeight = 0
      const dimensionResults = Object.entries(dimensionScores).map(([dimId, data]) => {
        const avgScore = data.count > 0 ? data.total / data.count : 0
        weightedTotalScore += avgScore * data.weight
        totalWeight += data.weight
        return {
          dimensionId: Number(dimId),
          dimensionName: data.name,
          score: avgScore,
          maxScore: 5,
        }
      })

      const completedCount = tasks.filter((t) => t.status === 'completed').length

      results.push({
        userId: member.userId,
        user: member.user,
        totalScore: totalWeight > 0 ? weightedTotalScore / totalWeight : 0,
        dimensionScores: dimensionResults,
        completedCount,
        totalCount: tasks.length,
      })
    }

    success(res, results)
  } catch (err) {
    console.error('Get results error:', err)
    error(res, '获取评估结果失败')
  }
})

// 获取项目统计数据（管理员）
router.get('/:id/statistics', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const project = await prisma.assessmentProject.findUnique({
      where: { id: Number(id) },
      include: {
        members: true,
        tasks: true,
      },
    })

    if (!project) {
      return error(res, '项目不存在', 404)
    }

    const totalMembers = project.members.length
    const totalTasks = project.tasks.length
    const completedTasks = project.tasks.filter((t) => t.status === 'completed').length

    // 计算平均分
    const allAnswers = await prisma.answer.findMany({
      where: {
        task: {
          projectId: Number(id),
          status: 'completed',
        },
        ratingValue: { not: null },
      },
      include: {
        question: {
          include: {
            dimension: true,
          },
        },
      },
    })

    const dimensionScores: Record<number, { name: string; weight: number; total: number; count: number }> = {}

    for (const answer of allAnswers) {
      if (answer.ratingValue) {
        const dimensionId = answer.question.dimensionId
        if (!dimensionScores[dimensionId]) {
          dimensionScores[dimensionId] = {
            name: answer.question.dimension.name,
            weight: answer.question.dimension.weight,
            total: 0,
            count: 0,
          }
        }
        dimensionScores[dimensionId].total += answer.ratingValue
        dimensionScores[dimensionId].count++
      }
    }

    // 计算加权平均分
    let weightedTotalScore = 0
    let totalWeight = 0
    const dimensionAverages = Object.entries(dimensionScores).map(([dimId, data]) => {
      const avgScore = data.count > 0 ? data.total / data.count : 0
      weightedTotalScore += avgScore * data.weight
      totalWeight += data.weight
      return {
        dimensionId: Number(dimId),
        dimensionName: data.name,
        score: avgScore,
        maxScore: 5,
      }
    })

    const averageScore = totalWeight > 0 ? weightedTotalScore / totalWeight : 0

    success(res, {
      totalMembers,
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? completedTasks / totalTasks : 0,
      averageScore,
      dimensionAverages,
    })
  } catch (err) {
    console.error('Get statistics error:', err)
    error(res, '获取统计数据失败')
  }
})

// 获取个人评估详情（管理员）
router.get('/:id/results/:userId', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id, userId } = req.params

    const project = await prisma.assessmentProject.findUnique({
      where: { id: Number(id) },
    })

    if (!project) {
      return error(res, '项目不存在', 404)
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        id: true,
        name: true,
        department: true,
        position: true,
      },
    })

    if (!user) {
      return error(res, '用户不存在', 404)
    }

    // 获取该成员被评估的所有任务
    const tasks = await prisma.assessmentTask.findMany({
      where: {
        projectId: Number(id),
        targetUserId: Number(userId),
      },
      include: {
        answers: {
          include: {
            question: {
              include: {
                dimension: true,
              },
            },
          },
        },
      },
    })

    // 计算各维度分数和收集文字反馈
    const dimensionScores: Record<number, { name: string; weight: number; total: number; count: number }> = {}
    const textFeedbacksMap: Record<string, { question: string; answers: string[] }> = {}

    for (const task of tasks) {
      if (task.status === 'completed') {
        for (const answer of task.answers) {
          const dimensionName = answer.question.dimension.name

          if (answer.ratingValue) {
            const dimensionId = answer.question.dimensionId
            if (!dimensionScores[dimensionId]) {
              dimensionScores[dimensionId] = {
                name: dimensionName,
                weight: answer.question.dimension.weight,
                total: 0,
                count: 0,
              }
            }
            dimensionScores[dimensionId].total += answer.ratingValue
            dimensionScores[dimensionId].count++
          }

          // 收集文字反馈，按题目聚合
          if (answer.textValue && answer.textValue.trim()) {
            const questionKey = answer.question.content
            if (!textFeedbacksMap[questionKey]) {
              textFeedbacksMap[questionKey] = {
                question: questionKey,
                answers: [],
              }
            }
            textFeedbacksMap[questionKey].answers.push(answer.textValue)
          }
        }
      }
    }

    const completedCount = tasks.filter((t) => t.status === 'completed').length

    // 计算加权总分
    let weightedTotalScore = 0
    let totalWeight = 0
    const dimensionResults = Object.entries(dimensionScores).map(([dimId, data]) => {
      const avgScore = data.count > 0 ? data.total / data.count : 0
      weightedTotalScore += avgScore * data.weight
      totalWeight += data.weight
      return {
        dimensionId: Number(dimId),
        dimensionName: data.name,
        score: avgScore,
        maxScore: 5,
      }
    })

    // 转换文字反馈为数组格式
    const textFeedbacks = Object.values(textFeedbacksMap).map((item) => ({
      question: item.question,
      answers: item.answers,
      count: item.answers.length,
    }))

    const result = {
      userId: Number(userId),
      user,
      totalScore: totalWeight > 0 ? weightedTotalScore / totalWeight : 0,
      dimensionScores: dimensionResults,
      textFeedbacks,
      completedCount,
      totalCount: tasks.length,
    }

    success(res, result)
  } catch (err) {
    console.error('Get user result error:', err)
    error(res, '获取个人评估结果失败')
  }
})

export default router