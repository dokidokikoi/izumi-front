<script setup lang="ts">
const isSidebarOpen = ref(false) // 移动端
const isCollapsed = ref(false) // 折叠状态

// 从 localStorage 恢复
onMounted(() => {
  const saved = localStorage.getItem('sidebar-collapsed')
  if (saved !== null) {
    isCollapsed.value = saved === 'true'
  }
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

    <main class="flex-1">
      <div

        text="center gray-700 dark:gray-200 overflow-auto"
        style="height: calc(100vh - 64px);"
        flex-1 overflow-auto p6
      >
        <router-view />
      </div>
    </main>
  </div>
</template>
