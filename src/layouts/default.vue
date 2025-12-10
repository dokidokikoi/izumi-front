<script setup lang="ts">
import { ElNotification } from 'element-plus'
import { useWsNotify } from '~/composables/useWsNotify'

const { on } = useWsNotify()
const isSidebarOpen = ref(false) // 移动端
const isCollapsed = ref(false) // 折叠状态

// 从 localStorage 恢复
onMounted(() => {
  const saved = localStorage.getItem('sidebar-collapsed')
  if (saved !== null) {
    isCollapsed.value = saved === 'true'
  }

  on(({ event, data }) => {
    if (event === 'scraper:autoscrap' || event === 'info_file:download' || event === 'info_file:load') {
      ElNotification({
        title: data.message,
        type: data.success ? 'success' : 'error',
        duration: 10000,
        position: 'top-right',
      })
    }
  })
})

// 监听并保存
watch(isCollapsed, (val) => {
  localStorage.setItem('sidebar-collapsed', String(val))
})

const toggleSidebar = () => (isSidebarOpen.value = !isSidebarOpen.value)
const closeSidebar = () => (isSidebarOpen.value = false)
const toggleCollapse = () => (isCollapsed.value = !isCollapsed.value)
</script>

<template>
  <TheHeader @toggle-sidebar="toggleSidebar" @toggle-collapse="toggleCollapse" />
  <div class="flex">
    <TheSidebar :is-open="isSidebarOpen" :collapsed="isCollapsed" :close-sidebar="closeSidebar" />
    <el-backtop target=".mainRef" :right="80" :bottom="60" z-100 />
    <main class="flex-1 bg-page">
      <div
        class="mainRef"
        text="center main overflow-auto"
        style="height: calc(100vh - 64px);"
        flex-1 overflow-auto px-6 pt-6
      >
        <router-view />
      </div>
    </main>
  </div>
</template>

<style>
input::-webkit-input-placeholder {
  color: rgba(var(--c-text-faint), 1) !important;
}
</style>
