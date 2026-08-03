<template>
  <div class="min-h-screen flex flex-col" style="background: var(--color-bg)">
    <!-- Header -->
    <header
      class="sticky top-0 z-30 flex items-center justify-between h-16 px-6"
      style="background: var(--color-bg-white); border-bottom: 1px solid var(--color-border)"
    >
      <div class="flex items-center gap-3">
        <ClipboardCheck :size="24" style="color: var(--color-primary)" />
        <h1 class="text-lg font-semibold" style="color: var(--color-text-primary)">
          360评估系统
        </h1>
      </div>

      <div class="flex items-center gap-4">
        <span class="text-xs px-2 py-1 rounded" style="color: var(--color-text-muted); background: var(--color-bg)">v1.0.0</span>
        <router-link
          to="/tasks"
          class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
          :class="{ 'bg-blue-50 text-blue-600': route.path === '/tasks' }"
        >
          <ListTodo :size="16" />
          <span class="text-sm">待办任务</span>
        </router-link>

        <router-link
          to="/profile"
          class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
          :class="{ 'bg-blue-50 text-blue-600': route.path === '/profile' }"
        >
          <User :size="16" />
          <span class="text-sm">个人中心</span>
        </router-link>

        <button
          class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
          @click="handleLogout"
        >
          <LogOut :size="16" style="color: var(--color-text-muted)" />
          <span class="text-sm" style="color: var(--color-text-muted)">退出</span>
        </button>
      </div>
    </header>

    <!-- Page content -->
    <main class="flex-1 p-6">
      <router-view />
    </main>

    <!-- Mobile bottom nav -->
    <nav
      class="fixed bottom-0 left-0 right-0 flex items-center justify-around h-16 md:hidden"
      style="background: var(--color-bg-white); border-top: 1px solid var(--color-border)"
    >
      <router-link
        to="/tasks"
        class="flex flex-col items-center gap-1"
        :class="{ 'text-blue-600': route.path === '/tasks' }"
      >
        <ListTodo :size="20" />
        <span class="text-xs">待办</span>
      </router-link>

      <router-link
        to="/profile"
        class="flex flex-col items-center gap-1"
        :class="{ 'text-blue-600': route.path === '/profile' }"
      >
        <User :size="20" />
        <span class="text-xs">我的</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ClipboardCheck, ListTodo, User, LogOut } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>