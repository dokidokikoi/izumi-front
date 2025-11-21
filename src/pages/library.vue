<script setup lang="ts">
import type { PathInfo } from '~/types'
import {
  Document,
  Folder,
  FolderOpened,
  Refresh,
  Search,
} from '@element-plus/icons-vue'
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { libraryApi, policyApi } from '~/apis/game'
import { useGameStore } from '~/stores/gameStore' // 假设 store 路径

defineOptions({ name: 'LibraryScanPage' })

const router = useRouter()
const gameStore = useGameStore()
const library = ref('/')
const libraries = ref<PathInfo[]>([])
const loading = ref(false)
// 控制折叠展开的状态 map，key为路径
const expandedItems = ref<Record<string, boolean>>({})

// 获取文件名/文件夹名
function getName(path: string) {
  if (!path)
    return ''
  // 兼容 Windows(\) 和 Unix(/) 路径分隔符
  const parts = path.split(/[/\\]/)
  return parts[parts.length - 1] || path
}

// 跳转刮削页面
function goToScrape(keyword: string, path: string) {
  router.push({
    path: '/scrap',
    query: { keyword, path },
  })
}

// 切换展开/折叠
function toggleExpand(path: string) {
  expandedItems.value[path] = !expandedItems.value[path]
}

// 获取列表数据
function list(path: string) {
  if (!path)
    return
  loading.value = true
  libraryApi.ls(path, gameStore.libraryNoScrap)
    .then((res) => {
      // 过滤只显示文件夹作为顶级项 (根据原逻辑)
      libraries.value = res.data.list.filter((e: PathInfo) => e.is_dir)
    })
    .finally(() => {
      loading.value = false
    })
}

// 初始化
onMounted(() => {
  policyApi.get().then((res) => {
    // 查找配置中的 library 路径
    const systemConfig = Object.entries(res.data).find(([k]) => k === 'system')
    if (systemConfig) {
      const config = JSON.parse(systemConfig[1] as string)
      gameStore.gameLibrary = config.game_library || []

      // 设置默认选中的库
      if (gameStore.gameLibrary.length > 0) {
        if (!gameStore.selectedGameLibrary || !gameStore.gameLibrary.includes(gameStore.selectedGameLibrary)) {
          gameStore.selectedGameLibrary = gameStore.gameLibrary[0]
        }
      }
    }
    // 触发第一次加载
    if (gameStore.selectedGameLibrary) {
      library.value = gameStore.selectedGameLibrary
      list(library.value)
    }
  })
})

// 监听变化
watch(() => gameStore.libraryNoScrap, () => list(library.value))
watch(() => gameStore.selectedGameLibrary, (newVal) => {
  if (newVal) {
    library.value = newVal
    list(newVal)
  }
})
</script>

<template>
  <div class="mx-auto max-w-5xl min-h-screen p-6">
    <!-- 1. 顶部工具栏 -->
    <div class="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 class="mb-1 text-3xl font-extrabold">
          本地库扫描
        </h1>
        <p class="text-sm text-muted">
          扫描 NAS 目录，发现未入库的游戏并进行匹配
        </p>
      </div>

      <div class="flex items-center gap-3 border border-gray-100 rounded-xl bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <!-- 库选择 -->
        <el-select
          v-model="gameStore.selectedGameLibrary"
          placeholder="选择库路径"
          style="width: 200px"
          class="no-border"
        >
          <template #prefix>
            <el-icon><FolderOpened /></el-icon>
          </template>
          <el-option v-for="lib in gameStore.gameLibrary" :key="lib" :label="lib" :value="lib" />
        </el-select>

        <!-- 刷新按钮 -->
        <el-button circle :icon="Refresh" :loading="loading" @click="list(library)" />

        <!-- 过滤开关 -->
        <div class="h-6 flex items-center border-l border-gray-200 px-3 dark:border-gray-700">
          <el-switch
            v-model="gameStore.libraryNoScrap"
            style="--el-switch-off-color: gray; --el-switch-on-color: rgba(var(--c-primary), 1);"
            inline-prompt
            active-text="未刮削"
            inactive-text="全部"
          />
        </div>
      </div>
    </div>

    <!-- 2. 空状态 / 加载状态 -->
    <div v-if="loading" class="py-20 text-center text-gray-400">
      <el-icon class="is-loading mb-2" :size="30">
        <Refresh />
      </el-icon>
      <p>正在扫描目录...</p>
    </div>

    <div v-else-if="libraries.length === 0" class="border-2 border-gray-200 rounded-2xl border-dashed bg-gray-50 py-20 text-center text-gray-400 dark:border-gray-700 dark:bg-gray-800/50">
      <el-icon :size="40" class="mb-2 opacity-50">
        <Folder />
      </el-icon>
      <p>当前目录下没有找到文件夹，或者所有游戏已入库。</p>
    </div>

    <!-- 3. 文件夹列表 (卡片式) -->
    <div v-else class="space-y-4">
      <div
        v-for="item in libraries"
        :key="item.path"
        class="group border border-base rounded-xl bg-card shadow-sm transition-all duration-300 hover:border-strong hover:shadow-md"
      >
        <!-- 卡片主体行 -->
        <div class="flex items-center gap-4 p-4">
          <!-- 图标 -->
          <div class="h-12 w-12 flex flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-900/20">
            <el-icon :size="24">
              <Folder />
            </el-icon>
          </div>

          <!-- 信息 -->
          <div class="min-w-0 flex-1">
            <div class="mb-1 flex items-center gap-2">
              <h3 class="truncate text-lg text-gray-900 font-bold dark:text-white" :title="getName(item.path)">
                {{ getName(item.path) }}
              </h3>
              <span class="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500 font-medium dark:bg-gray-700 dark:text-gray-300">目录</span>
            </div>
            <p class="truncate text-left text-xs text-gray-400 font-mono" :title="item.path">
              {{ item.path }}
            </p>
          </div>

          <!-- 快捷操作按钮 -->
          <div class="flex items-center gap-2 opacity-90 transition-opacity group-hover:opacity-100">
            <!-- 查看文件按钮 -->
            <el-button
              v-if="item.child && item.child.length > 0"
              size="default"
              text
              @click="toggleExpand(item.path)"
            >
              {{ expandedItems[item.path] ? '收起文件' : `查看文件 (${item.child.length})` }}
              <el-icon class="ml-1 transition-transform" :class="{ 'rotate-180': expandedItems[item.path] }">
                <ArrowDown />
              </el-icon>
            </el-button>

            <!-- 核心动作：去刮削 -->
            <el-button type="primary" round class="px-6" @click="goToScrape(getName(item.path), item.path)">
              <el-icon class="mr-1">
                <Search />
              </el-icon> 匹配元数据
            </el-button>
          </div>
        </div>

        <!-- 展开的文件列表 (类似于抽屉) -->
        <div v-show="expandedItems[item.path]" class="border-t border-gray-100 rounded-b-xl bg-gray-50 dark:border-gray-700 dark:bg-gray-900/30">
          <div class="grid grid-cols-1 gap-2 p-2 md:grid-cols-2">
            <div
              v-for="file in item.child"
              :key="file.path"
              class="group/file flex items-center justify-between rounded p-2 transition hover:bg-white dark:hover:bg-gray-700"
            >
              <div class="min-w-0 flex items-center gap-2">
                <el-icon v-if="file.is_dir" class="text-yellow-500">
                  <Folder />
                </el-icon>
                <el-icon v-else class="text-gray-400">
                  <Document />
                </el-icon>
                <span class="truncate text-sm text-gray-600 dark:text-gray-300">{{ getName(file.path) }}</span>
              </div>
              <!-- 针对单个文件也能刮削 -->
              <el-button
                type="primary"
                link
                size="small"
                class="opacity-0 group-hover/file:opacity-100"
                @click="goToScrape(getName(file.path), item.path)"
              >
                匹配此文件
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rotate-180 {
  transform: rotate(180deg);
}
/* 输入框背景适配 */
:deep(.el-select__wrapper) {
  background-color: rgba(var(--c-bg-input), 1);
  box-shadow: 0 0 0 1px rgba(var(--c-border-strong), 1) inset;
}
:deep(.el-switch.is-checked.el-switch__core) {
  background-color: rgba(var(--c-primary), 1);
}
</style>

<route lang="yaml">
meta:
  layout: default
</route>
