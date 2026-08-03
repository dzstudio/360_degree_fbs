import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8080
export const prisma = new PrismaClient()

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')))

// API 路由挂载
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import projectRoutes from './routes/projects.js'
import templateRoutes from './routes/templates.js'
import taskRoutes from './routes/tasks.js'

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/projects', projectRoutes)
app.use('/api/v1/templates', templateRoutes)
app.use('/api/v1/tasks', taskRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'ok', data: null })
})

// 生产环境：serve 前端 + SPA fallback
if (process.env.NODE_ENV === 'production') {
  const staticDir = path.resolve(__dirname, '../../frontend/dist')
  app.use(express.static(staticDir))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'))
  })
}

async function start() {
  await prisma.$connect()
  console.log('Database connected')

  // 初始化管理员账号
  await initAdmin()

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

async function initAdmin() {
  const bcryptModule = await import('bcryptjs')
  const bcrypt = bcryptModule.default || bcryptModule
  const admin = await prisma.user.findUnique({
    where: { username: 'admin' },
  })

  if (!admin) {
    const hashedPassword = await bcrypt.hash('12345678', 10)
    await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        name: '管理员',
        role: 'admin',
      },
    })
    console.log('Admin account created: admin / 12345678')
  }

  // 初始化默认问卷模板
  await initDefaultTemplate()
}

async function initDefaultTemplate() {
  const template = await prisma.questionnaireTemplate.findFirst({
    where: { isDefault: true },
  })

  if (!template) {
    await prisma.questionnaireTemplate.create({
      data: {
        name: '默认360评估问卷',
        description: '包含工作能力、沟通协作、工作态度、创新能力、执行能力五个维度及综合评价',
        isDefault: true,
        dimensions: {
          create: [
            {
              name: '工作能力',
              description: '评估专业技能、问题解决、学习能力和工作质量',
              weight: 0.25,
              sortOrder: 1,
              questions: {
                create: [
                  { content: '该同事是否具备岗位所需的专业知识和技能？能否独立完成工作任务？', type: 'rating', sortOrder: 1 },
                  { content: '面对复杂问题时，该同事是否能够分析根本原因并提出有效的解决方案？', type: 'rating', sortOrder: 2 },
                  { content: '该同事是否主动学习新知识、新技能，并将其应用到实际工作中？', type: 'rating', sortOrder: 3 },
                  { content: '该同事交付的工作成果是否准确、完整，符合质量标准和要求？', type: 'rating', sortOrder: 4 },
                ],
              },
            },
            {
              name: '沟通协作',
              description: '评估团队合作、沟通表达、冲突处理和跨部门协作能力',
              weight: 0.25,
              sortOrder: 2,
              questions: {
                create: [
                  { content: '该同事是否积极参与团队合作，乐于分享经验和资源，帮助他人完成任务？', type: 'rating', sortOrder: 1 },
                  { content: '该同事是否能够清晰、准确地表达自己的想法，并认真倾听他人意见？', type: 'rating', sortOrder: 2 },
                  { content: '当出现分歧或冲突时，该同事是否能够理性沟通，寻求双赢的解决方案？', type: 'rating', sortOrder: 3 },
                  { content: '该同事是否能够与其他部门有效协作，推动跨部门项目的顺利进行？', type: 'rating', sortOrder: 4 },
                ],
              },
            },
            {
              name: '工作态度',
              description: '评估责任心、工作主动性、纪律性和敬业精神',
              weight: 0.20,
              sortOrder: 3,
              questions: {
                create: [
                  { content: '该同事是否对工作认真负责，勇于承担责任，不推诿扯皮？', type: 'rating', sortOrder: 1 },
                  { content: '该同事是否能够主动发现问题、提出建议，而不是被动等待指令？', type: 'rating', sortOrder: 2 },
                  { content: '该同事是否遵守公司规章制度，按时出勤，服从工作安排？', type: 'rating', sortOrder: 3 },
                  { content: '该同事是否对工作充满热情，愿意为达成目标付出额外的努力？', type: 'rating', sortOrder: 4 },
                ],
              },
            },
            {
              name: '创新能力',
              description: '评估创新思维、改进意识、新方法应用和问题预防能力',
              weight: 0.15,
              sortOrder: 4,
              questions: {
                create: [
                  { content: '该同事是否能够跳出固有思维模式，提出新颖的想法和解决方案？', type: 'rating', sortOrder: 1 },
                  { content: '该同事是否关注工作中的不足，主动寻求改进和优化的机会？', type: 'rating', sortOrder: 2 },
                  { content: '该同事是否愿意尝试新工具、新方法，提高工作效率和质量？', type: 'rating', sortOrder: 3 },
                  { content: '该同事是否能够预见潜在风险，提前采取措施预防问题发生？', type: 'rating', sortOrder: 4 },
                ],
              },
            },
            {
              name: '执行能力',
              description: '评估工作效率、时间管理、目标达成和细节把控能力',
              weight: 0.15,
              sortOrder: 5,
              questions: {
                create: [
                  { content: '该同事是否能够在规定时间内高效完成工作任务，不拖延？', type: 'rating', sortOrder: 1 },
                  { content: '该同事是否能够合理安排工作优先级，有效管理时间和精力？', type: 'rating', sortOrder: 2 },
                  { content: '该同事是否能够达成既定的工作目标和绩效指标？', type: 'rating', sortOrder: 3 },
                  { content: '该同事是否注重工作细节，减少错误和返工？', type: 'rating', sortOrder: 4 },
                ],
              },
            },
            {
              name: '综合评价',
              description: '开放式问题，提供更全面、具体的反馈',
              weight: 0,
              sortOrder: 6,
              questions: {
                create: [
                  { content: '您认为该同事最突出的优点和亮点是什么？请举例说明。', type: 'text', sortOrder: 1 },
                  { content: '您认为该同事在哪些方面还有提升空间？有什么具体的改进建议？', type: 'text', sortOrder: 2 },
                  { content: '其他您想对该同事说的话，或者对团队管理的建议。', type: 'text', sortOrder: 3 },
                ],
              },
            },
          ],
        },
      },
    })
    console.log('Default questionnaire template created')
  }
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})