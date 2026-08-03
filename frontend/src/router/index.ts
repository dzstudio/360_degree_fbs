import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 成员端路由
    {
      path: '/login',
      component: () => import('@/views/member/Login.vue'),
      meta: { public: true, role: 'member' },
    },
    {
      path: '/',
      component: () => import('@/layouts/MemberLayout.vue'),
      meta: { role: 'member' },
      children: [
        {
          path: '',
          redirect: '/tasks',
        },
        {
          path: 'tasks',
          component: () => import('@/views/member/MemberTasks.vue'),
        },
        {
          path: 'tasks/:id',
          component: () => import('@/views/member/TaskDetail.vue'),
        },
        {
          path: 'profile',
          component: () => import('@/views/member/Profile.vue'),
        },
      ],
    },

    // 管理端路由
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { role: 'admin' },
      children: [
        {
          path: '',
          redirect: '/admin/dashboard',
        },
        {
          path: 'dashboard',
          component: () => import('@/views/admin/Dashboard.vue'),
        },
        {
          path: 'users',
          component: () => import('@/views/admin/UserList.vue'),
        },
        {
          path: 'projects',
          component: () => import('@/views/admin/ProjectList.vue'),
        },
        {
          path: 'projects/create',
          component: () => import('@/views/admin/ProjectForm.vue'),
        },
        {
          path: 'projects/:id',
          component: () => import('@/views/admin/ProjectDetail.vue'),
        },
        {
          path: 'projects/:id/edit',
          component: () => import('@/views/admin/ProjectForm.vue'),
        },
        {
          path: 'projects/:id/results',
          component: () => import('@/views/admin/ProjectResults.vue'),
        },
        {
          path: 'projects/:id/results/:userId',
          component: () => import('@/views/admin/UserResult.vue'),
        },
        {
          path: 'templates',
          component: () => import('@/views/admin/TemplateList.vue'),
        },
        {
          path: 'templates/:id',
          component: () => import('@/views/admin/TemplateDetail.vue'),
        },
        {
          path: 'profile',
          component: () => import('@/views/admin/Profile.vue'),
        },
      ],
    },

    // 404
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login',
    },
  ],
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  // 公开页面直接放行
  if (to.meta.public) {
    // 已登录用户访问登录页，重定向到对应首页
    if (authStore.isLoggedIn) {
      if (to.path.startsWith('/admin')) {
        if (authStore.isAdmin) {
          return next('/admin/dashboard')
        }
      } else {
        if (authStore.isMember) {
          // 检查是否有 redirect 参数
          const redirect = to.query.redirect as string
          if (redirect) {
            return next(redirect)
          }
          return next('/tasks')
        }
      }
    }
    return next()
  }

  // 未登录跳转登录页
  if (!authStore.isLoggedIn) {
    // 保存当前路径和查询参数，登录后跳转
    const redirectPath = to.fullPath
    return next(`/login?redirect=${encodeURIComponent(redirectPath)}`)
  }

  // 角色检查 - 已登录用户访问错误角色的页面，重定向到对应首页
  if (to.meta.role === 'admin' && !authStore.isAdmin) {
    return next('/tasks')
  }

  if (to.meta.role === 'member' && !authStore.isMember) {
    return next('/admin/dashboard')
  }

  next()
})

export default router