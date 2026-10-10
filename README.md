# 360度绩效评估系统

一个用于企业内部员工互评的 360 度绩效评估系统，包含统一管理后台和成员评估端，支持问卷模板自定义、评估任务自动生成与结果统计。

## 功能特性

- **统一管理后台** — 管理员统一管理用户、问卷模板和评估项目
- **成员独立视角** — 成员登录后查看待办任务并完成评估
- **评估项目管理** — 创建、激活、完成评估项目
- **问卷模板配置** — 自定义评估维度、题目和权重
- **待办任务自动生成** — 激活项目后自动为每位成员生成评估任务
- **评估结果统计** — 管理员查看完成状态、分数分布和评估结果
- **响应式设计** — 支持 PC 端和移动端访问

## 技术栈

### 前端
- Vue 3 + TypeScript
- Vite
- TailwindCSS v4
- Pinia（状态管理）
- Vue Router 4
- Axios
- ECharts（图表）
- Lucide Vue Next（图标）

### 后端
- Express.js + TypeScript
- Prisma ORM
- SQLite
- JWT 认证
- bcryptjs（密码加密）

### 部署
- Docker 单容器部署（前端静态资源由后端一并托管）
- Docker Compose

## 端口配置

| 服务 | 端口 | 地址 |
|------|------|------|
| 前端开发服务器 | 5175 | http://localhost:5175 |
| 后端 API 服务器 | 8085 | http://localhost:8085 |
| 生产环境 | 5176 | http://localhost:5176 |

开发环境下 Vite 会把 `/api` 请求代理到 `http://localhost:8085`。

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/dzstudio/360_degree_fbs.git
cd 360_degree_fbs
```

### 2. 安装依赖

```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

### 3. 配置环境变量

复制示例文件并按需修改：

```bash
cp .env.example backend/.env
```

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | SQLite 数据库路径，如 `file:./data/assessment.db` |
| `PORT` | 后端监听端口（开发环境默认 8085） |
| `NODE_ENV` | 运行环境，`development` / `production` |
| `JWT_SECRET` | JWT 签名密钥，**生产环境务必设置成足够随机的长字符串** |

### 4. 初始化数据库

```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

首次启动后端时会自动创建默认管理员账号和默认问卷模板。

### 5. 启动开发服务器

```bash
# 在项目根目录同时启动前端和后端
npm run dev

# 或者分别启动
npm run dev:frontend  # 前端: http://localhost:5175
npm run dev:backend   # 后端: http://localhost:8085
```

## 生产环境部署

### 初次部署

**Step 1 — 进入服务器目录并克隆代码**

```bash
cd /var/data/360_degree_fbs
git clone https://github.com/dzstudio/360_degree_fbs.git .
```

**Step 2 — 修改 JWT_SECRET**

`JWT_SECRET` 是用于签发和校验登录令牌的签名密钥。**仓库里带的是一个公开的占位符值，直接部署等于鉴权形同虚设** —— 任何看到本仓库的人都能用它伪造出管理员令牌，登录后台。

先生成一个随机密钥：

```bash
openssl rand -base64 48
```

再打开 `docker-compose.yml`，把 `environment` 中这一行替换掉：

```yaml
environment:
  - JWT_SECRET=你刚生成的随机字符串
```

> **关于已登录用户**：修改密钥后，所有此前签发的令牌会立即失效，用户需要重新登录。

**Step 3 — 添加执行权限并部署**

```bash
chmod +x rebuild.sh
./rebuild.sh
```

### 后续更新

```bash
git pull && ./rebuild.sh
```

`rebuild.sh` 会创建 `data/`、`uploads/`、`logs/` 目录，然后执行 `docker compose up -d --build` 重新构建并重启容器。

### 访问系统

- 应用地址：http://your-server-ip:5176
- 管理员登录：http://your-server-ip:5176/admin/login
- 成员登录：http://your-server-ip:5176/login

## 项目结构

```
360_degree_fbs/
├── frontend/              # 前端项目
│   ├── src/
│   │   ├── api/           # 接口封装
│   │   ├── components/    # 通用组件
│   │   ├── composables/   # 组合式函数
│   │   ├── layouts/       # 布局组件
│   │   ├── router/        # 路由配置
│   │   ├── stores/        # Pinia 状态
│   │   ├── types/         # TypeScript 类型
│   │   ├── utils/         # 工具函数
│   │   └── views/
│   │       ├── admin/     # 管理端页面
│   │       └── member/    # 成员端页面
│   └── vite.config.ts
├── backend/               # 后端项目
│   ├── src/
│   │   ├── routes/        # API 路由
│   │   ├── middleware/    # 中间件（JWT 鉴权等）
│   │   ├── utils/         # 工具函数
│   │   └── main.ts        # 应用入口
│   └── prisma/            # 数据库模型
├── Dockerfile             # Docker 配置
├── docker-compose.yml     # Docker Compose 配置
├── rebuild.sh             # 服务器端部署脚本
├── data/                  # 数据库文件（不纳入版本控制）
└── uploads/               # 上传文件（不纳入版本控制）
```

## 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | 12345678 |

> ⚠️ **安全提醒**：这是首次启动时自动创建的默认账号。部署到生产环境后请立即登录并修改密码（`个人中心 → 修改密码`），或直接删除该账号后另建管理员账号。

## 访问地址

| 页面 | 地址 |
|------|------|
| 管理员登录 | http://localhost:5175/admin/login |
| 成员登录 | http://localhost:5175/login |

## 评估维度

系统默认包含以下五个评估维度：

| 维度 | 权重 | 评估要点 |
|------|------|----------|
| 工作能力 | 25% | 专业技能水平、问题分析与解决能力、学习能力和知识更新、工作质量把控 |
| 沟通协作 | 25% | 团队合作精神、沟通表达能力、冲突处理能力、跨部门协作 |
| 工作态度 | 20% | 责任心、工作主动性、纪律性、敬业精神 |
| 创新能力 | 15% | 创新思维、改进意识、新方法应用、问题预防 |
| 执行能力 | 15% | 工作效率、时间管理、目标达成、细节把控 |

维度、题目和权重均可在「问卷模板」中自定义。

## 使用流程

### 管理员

1. 使用 admin 账号登录管理后台
2. 在「用户管理」中创建团队成员账号
3. 在「问卷模板」中配置评估维度和题目
4. 在「评估项目」中创建项目，选择参与成员
5. 激活项目，系统自动为每个成员生成评估任务
6. 查看评估完成状态和评估结果

### 成员

1. 使用管理员分配的账号登录系统
2. 查看待办评估任务列表
3. 进入评估，为其他成员打分
4. 提交评估，任务状态变为已完成

## API 文档

所有接口以 `/api` 为前缀，遵循 RESTful 风格，返回统一格式：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

### 认证 `/api/auth`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/login` | 用户登录，返回 JWT token |
| GET | `/me` | 获取当前登录用户信息 |
| PUT | `/password` | 修改当前用户密码 |
| POST | `/logout` | 退出登录 |

### 用户 `/api/users`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 用户列表 |
| GET | `/members` | 成员列表 |
| GET | `/:id` | 用户详情 |
| POST | `/` | 创建用户 |
| PUT | `/:id` | 更新用户 |
| DELETE | `/:id` | 删除用户 |

### 评估项目 `/api/projects`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 项目列表（管理员） |
| GET | `/my/list` | 我参与的项目 |
| GET | `/:id` | 项目详情 |
| POST | `/` | 创建项目（管理员） |
| PUT | `/:id` | 更新项目（管理员） |
| DELETE | `/:id` | 删除项目（管理员） |
| POST | `/:id/activate` | 激活项目并生成评估任务（管理员） |
| POST | `/:id/submit` | 提交评估 |
| POST | `/:id/complete` | 完成项目（管理员） |
| GET | `/:id/results` | 评估结果（管理员） |
| GET | `/:id/statistics` | 结果统计（管理员） |
| GET | `/:id/results/:userId` | 指定成员的评估结果（管理员） |

### 评估任务 `/api/tasks`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 我的待办任务列表 |
| GET | `/:id` | 任务详情 |
| POST | `/:id/save` | 暂存评估内容 |
| POST | `/:id/submit` | 提交评估 |
| POST | `/:id/reset` | 重置任务以便重新评估 |

### 问卷模板 `/api/templates`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 模板列表 |
| GET | `/:id` | 模板详情 |
| POST | `/` | 创建模板（管理员） |
| PUT | `/:id` | 更新模板（管理员） |
| DELETE | `/:id` | 删除模板（管理员） |
| POST | `/:id/dimensions` | 新增维度（管理员） |
| PUT | `/dimensions/:id` | 更新维度（管理员） |
| DELETE | `/dimensions/:id` | 删除维度（管理员） |
| POST | `/dimensions/:id/questions` | 新增题目（管理员） |
| PUT | `/questions/:id` | 更新题目（管理员） |
| DELETE | `/questions/:id` | 删除题目（管理员） |

## 常见问题

**Q：数据库文件存在哪里？**
默认在 `backend/data/assessment.db`（开发环境）或容器内 `/app/data/assessment.db`（生产环境，通过 `docker-compose.yml` 挂载到宿主机 `./data`）。数据库文件和 `uploads/` 目录都不会提交到仓库。

**Q：如何修改 JWT 密钥？**
在 `backend/.env`（开发）或 `docker-compose.yml` 的 `JWT_SECRET` 环境变量（生产）中设置。修改后所有已签发的 token 会立即失效。

**Q：生产环境忘记管理员密码怎么办？**
可直接操作数据库将 `User` 表中 `role = 'admin'` 的账号删除，重启后端后会重新创建默认管理员账号。

## 许可证

MIT License
