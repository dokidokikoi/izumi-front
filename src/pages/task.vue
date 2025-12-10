<script setup lang="ts">
import type { ListTaskReq, Task, TaskStatus, TaskType } from '~/types'
import { computed, ref } from 'vue'
import { taskApi } from '~/apis/game'
import { useWsNotify } from '~/composables/useWsNotify'

const { on, wsState } = useWsNotify()
// --- 1. 状态管理 ---
const activeTab = ref<TaskType | 'all'>('all')
const req = ref<ListTaskReq>({
  type: '',
  status: '',
  page: 1,
  page_size: 10,
})
const taskList = ref<Task[]>([])

// --- 2. 计算属性：根据 Tab 筛选任务 ---
const filteredTasks = computed(() => {
  if (activeTab.value === 'all')
    return taskList.value
  return taskList.value.filter(t => t.type === activeTab.value)
})

onMounted(() => {
  taskApi.list(req.value).then((res) => {
    taskList.value = res.data.list
    for (const task of taskList.value) {
      if (task.state === 'canceled' || task.state === 'failed' || task.state === 'done') {
        task.progress = 100
      }
    }
  })
})

// --- 4. 视觉辅助函数 ---
// 获取类型对应的渐变色背景和图标
function getTypeStyle(type: TaskType) {
  switch (type) {
    case 'scrap': return { bg: 'bg-blue-500/10 text-blue-600', icon: 'i-carbon-shopping-cart-arrow-down', gradient: 'from-blue-500 to-cyan-400' }
    case 'load': return { bg: 'bg-purple-500/10 text-purple-600', icon: 'i-carbon-upload', gradient: 'from-purple-500 to-pink-400' }
    case 'download': return { bg: 'bg-amber-500/10 text-amber-600', icon: 'i-carbon-download ', gradient: 'from-amber-500 to-orange-400' }
    default: return { bg: 'bg-gray-100 text-gray-500', icon: 'i-carbon-document', gradient: 'from-gray-400 to-gray-300' }
  }
}

// 获取状态对应的 Badge 样式
function getStatusBadge(status: TaskStatus) {
  switch (status) {
    case 'running': return 'bg-blue-50 text-blue-600 ring-blue-500/20'
    case 'done': return 'bg-emerald-50 text-emerald-600 ring-emerald-500/20'
    case 'failed': return 'bg-rose-50 text-rose-600 ring-rose-500/20'
    default: return 'bg-slate-50 text-slate-500 ring-slate-500/20'
  }
}

on(({ event, data }) => {
  if (event === 'scraper:autoscraping' || event === 'info_file:downloading' || event === 'info_file:loading') {
    const idx = taskList.value.findIndex(task => task.id === data.data.task_id)
    if (idx >= 0) {
      taskList.value[idx].progress = Math.round(data.data.proccess / data.data.total * 100)
    }
  }
})
</script>

<template>
  <div class="mx-auto max-w-5xl p-6 pb-24 text-main">
    <!-- 顶部标题 -->
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="mb-2 text-3xl text-main font-extrabold">
          任务中心
        </h1>
        <p class="text-sm text-muted">
          任务运行进展
        </p>
      </div>
      <div class="flex items-center gap-2 text-sm">
        <span :class="wsState === 1 ? 'bg-green-500' : 'bg-red-500'" class="h-2 w-2 rounded-full" />
        <span class="text-gray-500">{{ wsState === 1 ? '已连接' : '未连接' }}</span>
      </div>
    </div>

    <!-- Tabs 切换 -->
    <div class="mb-6 flex gap-4 border-b border-base">
      <button
        v-for="tab in ['all', 'download', 'load', 'scrap']" :key="tab"
        class="pb-2 text-sm capitalize transition-colors"
        :class="activeTab === tab ? 'border-b-2 border-primary text-primary font-medium' : 'text-muted hover:text-hover'"
        @click="(activeTab = tab as any)"
      >
        {{ tab === 'all' ? '全部' : tab }}
      </button>
    </div>

    <!-- 任务列表容器 -->
    <TransitionGroup
      name="list"
      tag="div"
      class="space-y-4"
    >
      <div
        v-for="task in filteredTasks"
        :key="task.id"
        class="group relative overflow-hidden border border-base rounded-2xl bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-slate-200/50 hover:shadow-xl hover:-translate-y-1 dark:hover:shadow-black/30"
      >
        <!-- 卡片内容布局 -->
        <div class="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <!-- 1. 图标区域 -->
          <div
            class="h-14 w-14 flex shrink-0 items-center justify-center rounded-2xl text-2xl shadow-inner transition-colors duration-300"
            :class="getTypeStyle(task.type).bg"
          >
            <div :class="getTypeStyle(task.type).icon" />
          </div>

          <!-- 2. 信息区域 -->
          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="truncate text-base text-slate-800 font-bold dark:text-slate-100">
                  {{ task.param.name }}
                </h3>
                <div class="mt-1 flex items-center gap-3 text-xs text-muted">
                  <span class="font-mono">#{{ task.id }}</span>
                  <!-- <span v-if="task.speed && task.status === 'running'" class="flex items-center gap-1 text-blue-500 font-medium">
                      <div class="i-carbon-flash animate-pulse" />
                      {{ task.speed }}
                    </span> -->
                </div>
              </div>

              <!-- 状态徽章 -->
              <div
                class="ml-2 shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold tracking-wider uppercase ring-1 ring-inset"
                :class="getStatusBadge(task.state)"
              >
                {{ task.state }}
              </div>
            </div>

            <!-- 3. 进度条区域 -->
            <div class="mt-4 flex items-center gap-3">
              <div class="relative h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                <!-- 实际进度 -->
                <div
                  class="absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-out"
                  :class="[
                    task.state === 'failed' ? 'bg-rose-500' : `bg-gradient-to-r ${getTypeStyle(task.type).gradient}`,
                  ]"
                  :style="{ width: `${task.progress}%` }"
                >
                  <!-- 运行中的流光特效 -->
                  <div
                    v-if="task.state === 'running'"
                    class="animate-shimmer absolute inset-0 from-transparent via-white/30 to-transparent bg-gradient-to-r"
                    style="background-size: 200% 100%;"
                  />
                </div>
              </div>
              <span class="w-10 text-right text-xs text-slate-500 font-bold dark:text-slate-400">
                {{ task.progress }}%
              </span>
            </div>
          </div>
        </div>

        <!-- 错误信息 (仅失败显示) -->
        <div v-if="task.result && task.state === 'failed'" class="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 p-2 text-xs text-rose-500 font-medium dark:bg-rose-900/20">
          <div class="i-carbon-warning-filled" />
          {{ task.result }}
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* 列表动画 */
.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

/* 流光动画定义 */
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
.animate-shimmer {
  animation: shimmer 1.5s infinite linear;
}
</style>
