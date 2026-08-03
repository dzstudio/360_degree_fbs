<template>
  <div class="min-h-screen flex" style="background: var(--color-bg)">
    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300"
      :class="sidebarCollapsed ? 'w-16' : 'w-64'"
      style="background: var(--color-bg-white); border-right: 1px solid var(--color-border)"
    >
      <!-- Logo -->
      <div class="flex items-center h-16 px-4 border-b" style="border-color: var(--color-border)">
        <LayoutDashboard :size="24" style="color: var(--color-primary)" />
        <span
          v-if="!sidebarCollapsed"
          class="ml-3 font-semibold text-lg"
          style="color: var(--color-text-primary)"
        >
          360评估管理
        </span>
      </div>

      <!-- Menu -->
      <nav class="flex-1 py-4 overflow-y-auto">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center px-4 py-3 mx-2 rounded-lg transition-colors"
          :class="isActive(item.path) ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'"
          style="color: var(--color-text-secondary)"
        >
          <component :is="item.icon" :size="20" />
          <span v-if="!sidebarCollapsed" class="ml-3">{{ item.label }}</span>
        </router-link>
      </nav>

      <!-- User info -->
      <div class="p-4 border-t" style="border-color: var(--color-border)">
        <div class="flex items-center">
          <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <User :size="16" style="color: var(--color-primary)" />
          </div>
          <div v-if="!sidebarCollapsed" class="ml-3 flex-1">
            <p class="text-sm font-medium" style="color: var(--color-text-primary)">
              {{ authStore.userInfo?.name }}
            </p>
            <p class="text-xs" style="color: var(--color-text-muted)">管理员</p>
          </div>
          <button
            v-if="!sidebarCollapsed"
            class="ml-2 p-1 rounded hover:bg-gray-100"
            @click="handleLogout"
          >
            <LogOut :size="16" style="color: var(--color-text-muted)" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <div
      class="flex-1 transition-all duration-300"
      :class="sidebarCollapsed ? 'ml-16' : 'ml-64'"
    >
      <!-- Header -->
      <header
        class="sticky top-0 z-30 flex items-center justify-between h-16 px-6"
        style="background: var(--color-bg-white); border-bottom: 1px solid var(--color-border)"
      >
        <button
          class="p-2 rounded-lg hover:bg-gray-100"
          @click="sidebarCollapsed = !sidebarCollapsed"
        >
          <Menu :size="20" style="color: var(--color-text-secondary)" />
        </button>

        <div class="flex items-center gap-4">
          <span class="text-xs px-2 py-1 rounded" style="color: var(--color-text-muted); background: var(--color-bg)">v1.0.0</span>
          <router-link
            to="/admin/profile"
            class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
          >
            <Settings :size="16" style="color: var(--color-text-secondary)" />
            <span class="text-sm" style="color: var(--color-text-secondary)">设置</span>
          </router-link>
        </div>
      </header>

      <!-- Page content -->
      <main class="p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  Settings,
  LogOut,
  Menu,
  User,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const sidebarCollapsed = ref(false)

const menuItems = [
  { path: '/admin/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { path: '/admin/users', label: '用户管理', icon: Users },
  { path: '/admin/projects', label: '评估项目', icon: FolderKanban },
  { path: '/admin/templates', label: '问卷模板', icon: FileText },
]

const isActive = (path: string) => {
  return route.path.startsWith(path)
}

const handleLogout = () => {
  authStore.logout()
  router.push('/admin/login')
}
</script>