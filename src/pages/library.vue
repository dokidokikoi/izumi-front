<script setup lang="ts">
import type { PathInfo } from '~/types'
import {
  ArrowDown,
  Check,
  Clock,
  Document,
  Folder,
  FolderOpened,
  Refresh,
  Search,
  Star,
} from '@element-plus/icons-vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { libraryApi, policyApi } from '~/apis/game'

defineOptions({ name: 'LibraryScanPage' })

const router = useRouter()
const libraries = ref<PathInfo[]>([])
const loading = ref(false)
const expandedItems = ref<Record<string, boolean>>({})
const gameLibrary = ref<string[]>([])
const selectedGameLibrary = ref('')
const searchKeyword = ref('')

// 批量选择
const selectedItems = ref<Set<string>>(new Set())
const isAllSelected = computed(() => libraries.value.length > 0 && libraries.value.every(item => selectedItems.value.has(item.path)))
const selectedCount = computed(() => selectedItems.value.size)

// 获取文件名/文件夹名
function getName(path: string) {
  if (!path)
    return ''
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

// 批量刮削
function batchScrape() {
  if (selectedItems.value.size === 0)
    return
  const items = Array.from(selectedItems.value)
  // 使用第一个项目的路径，多个项目可在刮削页面处理
  const firstItem = libraries.value.find(item => item.path === items[0])
  if (firstItem) {
    router.push({
      path: '/scrap',
      query: {
        keyword: searchKeyword.value || '',
        path: firstItem.path,
        batch: items.join(','),
      },
    })
  }
}

// 切换展开/折叠
function toggleExpand(path: string) {
  expandedItems.value[path] = !expandedItems.value[path]
}

// 全选/取消全选
function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedItems.value.clear()
  }
  else {
    libraries.value.forEach(item => selectedItems.value.add(item.path))
  }
}

// 切换单项选择
function toggleItem(path: string) {
  if (selectedItems.value.has(path)) {
    selectedItems.value.delete(path)
  }
  else {
    selectedItems.value.add(path)
  }
}

// 过滤后的列表
const filteredLibraries = computed(() => {
  if (!searchKeyword.value)
    return libraries.value
  const keyword = searchKeyword.value.toLowerCase()
  return libraries.value.filter(item => getName(item.path).toLowerCase().includes(keyword))
})

const libraryNoScrap = ref(true)
// 获取列表数据
function list(path: string) {
  if (!path)
    return
  // loading.value = true
  libraryApi.ls(path, libraryNoScrap.value)
    .then((res) => {
      libraries.value = res.data.list.filter((e: PathInfo) => e.is_dir)
    })
    .finally(() => {
      loading.value = false
    })
}

// 初始化
onMounted(() => {
  const noScrap = localStorage.getItem('libraryNoScrap')
  if (noScrap !== null) {
    libraryNoScrap.value = noScrap === 'true'
  }
  policyApi.get().then((res) => {
    const systemConfig = Object.entries(res.data).find(([k]) => k === 'system')
    if (systemConfig) {
      const config = JSON.parse(systemConfig[1] as string)
      gameLibrary.value = config.game_library || []
      if (gameLibrary.value.length > 0) {
        if (!selectedGameLibrary.value || !gameLibrary.value.includes(selectedGameLibrary.value)) {
          selectedGameLibrary.value = gameLibrary.value[0]
        }
      }
    }
    if (selectedGameLibrary.value) {
      list(selectedGameLibrary.value)
    }
  })
})

// 监听变化
watch(() => libraryNoScrap.value, (newVal) => {
  localStorage.setItem('libraryNoScrap', String(newVal))
  list(selectedGameLibrary.value)
})
watch(() => selectedGameLibrary.value, (newVal) => {
  if (newVal) {
    list(newVal)
  }
})
</script>

<template>
  <div class="min-h-screen from-gray-50 to-gray-100 bg-gradient-to-br dark:from-[#0f1216] dark:to-[#14181d]">
    <!-- 顶部工具栏 -->
    <div class="sticky top-0 z-40 border-b border-gray-200 bg-white/95 px-6 py-4 shadow-sm backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/95">
      <div class="mx-auto max-w-7xl">
        <div class="flex items-center gap-6">
          <!-- Logo / 标题 -->
          <div class="flex items-center gap-3">
            <div class="rounded-xl from-blue-500 to-indigo-600 bg-gradient-to-br p-2.5 shadow-lg">
              <FolderOpened :size="24" class="text-white" />
            </div>
            <div>
              <h1 class="text-xl text-gray-900 font-extrabold dark:text-white">
                媒体库扫描
              </h1>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                发现并刮削本地游戏
              </p>
            </div>
          </div>

          <!-- 分隔线 -->
          <div class="h-8 w-px bg-gray-200 dark:bg-gray-700" />

          <!-- 搜索框 -->
          <div class="relative max-w-md flex-1">
            <el-icon class="absolute left-3 top-1/2 text-gray-400 -translate-y-1/2">
              <Search :size="18" />
            </el-icon>
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜索游戏名称..."
              class="w-full border border-gray-200 rounded-lg bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all dark:border-gray-700 focus:border-blue-500 dark:bg-gray-800 focus:bg-white dark:text-gray-200 focus:ring-2 focus:ring-blue-500/20"
            >
          </div>

          <!-- 库选择 -->
          <el-select
            v-model="selectedGameLibrary"
            placeholder="选择库"
            class="w-48"
          >
            <template #prefix>
              <el-icon><Folder /></el-icon>
            </template>
            <el-option v-for="lib in gameLibrary" :key="lib" :label="lib" :value="lib" />
          </el-select>

          <!-- 刷新 -->
          <el-button circle :icon="Refresh" :loading="loading" @click="list(selectedGameLibrary)" />

          <!-- 过滤开关 -->
          <div class="flex items-center gap-2 border border-gray-200 rounded-lg bg-gray-50 px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800">
            <span class="text-xs text-gray-500 dark:text-gray-400">仅未入库</span>
            <el-switch v-model="libraryNoScrap" size="small" />
          </div>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="mx-auto max-w-7xl px-6 py-6">
      <!-- 批量操作栏 -->
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <label class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">
            <input
              type="checkbox"
              :checked="isAllSelected"
              class="h-4 w-4 border-gray-300 rounded text-blue-600 dark:border-gray-600 dark:bg-gray-800 focus:ring-blue-500"
              @change="toggleSelectAll"
            >
            <span class="text-sm text-gray-700 font-medium dark:text-gray-300">
              全选
            </span>
          </label>
          <span v-if="selectedCount > 0" class="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <Check :size="16" />
            已选择 {{ selectedCount }} 项
          </span>
        </div>
        <el-button
          v-if="selectedCount > 0"
          type="primary"
          :icon="Search"
          @click="batchScrape"
        >
          批量刮削
        </el-button>
      </div>

      <!-- 列表区域 -->
      <div class="rounded-2xl bg-white shadow-xl dark:bg-gray-900 dark:shadow-gray-900/50">
        <!-- 加载状态 -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-32">
          <div class="mb-4 h-12 w-12 animate-spin border-4 border-gray-200 border-t-blue-500 rounded-full" />
          <p class="text-sm text-gray-500 dark:text-gray-400">
            正在扫描目录...
          </p>
        </div>

        <!-- 空状态 -->
        <div v-else-if="filteredLibraries.length === 0" class="flex flex-col items-center justify-center py-32">
          <div class="mb-4 rounded-full bg-gray-100 p-6 dark:bg-gray-800">
            <Folder :size="48" class="text-gray-400 dark:text-gray-600" />
          </div>
          <p class="text-lg text-gray-600 font-medium dark:text-gray-400">
            {{ searchKeyword ? '未找到匹配的项目' : '没有发现未入库的游戏' }}
          </p>
          <p v-if="!searchKeyword" class="mt-1 text-sm text-gray-400 dark:text-gray-500">
            所有游戏可能已经完成刮削
          </p>
        </div>

        <!-- 列表 -->
        <div v-else>
          <!-- 表头 -->
          <div class="flex items-center gap-4 border-b border-gray-100 px-6 py-3 text-xs text-gray-500 font-semibold tracking-wider uppercase dark:border-gray-800 dark:text-gray-400">
            <div class="w-10" />
            <div class="flex-1">
              游戏名称
            </div>
            <div class="w-48 text-center">
              文件数量
            </div>
            <div class="w-48 text-center">
              路径
            </div>
            <div class="w-32 text-center">
              状态
            </div>
            <div class="w-40 text-right">
              操作
            </div>
          </div>

          <!-- 列表项 -->
          <div class="divide-y divide-gray-100 dark:divide-gray-800">
            <div
              v-for="item in filteredLibraries"
              :key="item.path"
              class="group flex items-center gap-4 px-6 py-4 transition-all hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
              :class="{ 'bg-blue-50/30 dark:bg-blue-900/20': selectedItems.has(item.path) }"
            >
              <!-- 选择框 -->
              <div class="w-10">
                <input
                  type="checkbox"
                  :checked="selectedItems.has(item.path)"
                  class="h-4 w-4 border-gray-300 rounded text-blue-600 dark:border-gray-600 dark:bg-gray-800 focus:ring-blue-500"
                  @change="toggleItem(item.path)"
                >
              </div>

              <!-- 游戏图标/封面占位 -->
              <div class="flex flex-1 items-center gap-4">
                <div class="h-12 w-12 flex shrink-0 items-center justify-center rounded-lg from-gray-100 to-gray-200 bg-gradient-to-br dark:from-gray-800 dark:to-gray-700">
                  <Folder :size="20" class="text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <h3 class="text-gray-900 font-semibold dark:text-white">
                    {{ getName(item.path) }}
                  </h3>
                  <p class="text-xs text-gray-400 font-mono">
                    {{ item.path }}
                  </p>
                </div>
              </div>

              <!-- 文件数量 -->
              <div class="w-48 text-center">
                <span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600 font-medium dark:bg-gray-800 dark:text-gray-400">
                  <Document :size="12" />
                  {{ item.child?.length || 0 }} 个文件
                </span>
              </div>

              <!-- 路径 -->
              <div class="w-48 text-center">
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ selectedGameLibrary }}
                </span>
              </div>

              <!-- 状态 -->
              <div class="w-32 text-center">
                <span class="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-700 font-medium dark:bg-amber-900/30 dark:text-amber-400">
                  <Clock :size="12" />
                  未入库
                </span>
              </div>

              <!-- 操作 -->
              <div class="w-40 flex justify-end gap-2">
                <!-- 展开文件 -->
                <el-button
                  v-if="item.child && item.child.length > 0"
                  size="small"
                  text
                  @click="toggleExpand(item.path)"
                >
                  <el-icon class="transition-transform" :class="{ 'rotate-180': expandedItems[item.path] }">
                    <ArrowDown :size="16" />
                  </el-icon>
                </el-button>

                <!-- 刮削按钮 -->
                <el-button type="primary" size="small" @click="goToScrape(getName(item.path), item.path)">
                  <Search :size="14" />
                  刮削
                </el-button>
              </div>
            </div>

            <!-- 展开的文件列表 -->
            <div v-show="expandedItems[item.path]" class="border-t border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/30">
              <div class="px-6 py-2">
                <div class="grid gap-1">
                  <div
                    v-for="file in item.child"
                    :key="file.path"
                    class="flex items-center justify-between rounded-lg px-4 py-2 transition hover:bg-white dark:hover:bg-gray-800"
                  >
                    <div class="flex items-center gap-3">
                      <el-icon v-if="file.is_dir" class="text-yellow-500">
                        <Folder :size="16" />
                      </el-icon>
                      <el-icon v-else class="text-gray-400">
                        <Document :size="16" />
                      </el-icon>
                      <span class="text-sm text-gray-700 dark:text-gray-300">
                        {{ getName(file.path) }}
                      </span>
                    </div>
                    <el-button
                      type="primary"
                      link
                      size="small"
                      @click="goToScrape(getName(file.path), item.path)"
                    >
                      刮削此文件
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部统计栏 -->
        <div v-if="filteredLibraries.length > 0" class="flex items-center justify-between border-t border-gray-100 px-6 py-3 text-sm dark:border-gray-800">
          <span class="text-gray-500 dark:text-gray-400">
            共找到 <span class="text-gray-700 font-semibold dark:text-gray-300">{{ filteredLibraries.length }}</span> 个未入库的游戏
          </span>
          <div class="flex items-center gap-2 text-gray-400">
            <Star :size="14" />
            <span>支持批量刮削</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.el-select__wrapper) {
  background-color: transparent;
  box-shadow: 0 0 0 1px theme('colors.gray.200') inset;
  border-radius: 0.5rem;
}

.dark :deep(.el-select__wrapper) {
  box-shadow: 0 0 0 1px theme('colors.gray.700') inset;
}

:deep(.el-button) {
  border-radius: 0.375rem;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, theme('colors.blue.500'), theme('colors.indigo.500'));
  border: none;
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, theme('colors.blue.600'), theme('colors.indigo.600'));
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

:deep(.el-switch.is-checked) {
  --el-switch-on-color: theme('colors.blue.500');
}
</style>

<route lang="yaml">
meta:
  layout: default
</route>
