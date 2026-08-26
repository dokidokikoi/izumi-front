<script setup lang="ts">
import type {
  PathInfo,
  ScraperAutoReq,
  ScraperDetailReq,
  ScraperGetRespItem,
  ScraperSearchReq,
} from '~/types'
import {
  ArrowDown,
  Check,
  Delete,
  Document,
  Folder,
  FolderOpened,
  Loading,
  MagicStick,
  Search,
} from '@element-plus/icons-vue'
import { ElMessage, ElNotification } from 'element-plus'
import { computed, onMounted, ref, watch } from 'vue'
import { libraryApi, policyApi, scrapApi } from '~/apis/game'
import { useWsNotify } from '~/composables/useWsNotify'
import { useGameStore } from '~/stores/gameStore'
import { imageUrl } from '~/utils/image'

const gameStore = useGameStore()
const { onEvent } = useWsNotify()

// --- Library State ---
const libraries = ref<PathInfo[]>([])
const selectedLibraryPath = ref('')
const expandedItems = ref<Record<string, boolean>>({})
const gameLibrary = ref<string[]>([])
const selectedGameLibrary = ref('')
const libraryNoScrap = ref(true)

// --- Search State ---
const searchParam = ref<Partial<ScraperSearchReq>>({
  name: 'all',
  keyword: '',
  page: 1,
})
const scrapers = [
  { label: '全部源', value: 'all' },
  { label: 'Bangumi', value: 'bangumi' },
  { label: 'DLsite', value: 'dlsite' },
  { label: 'Getchu', value: 'getchu' },
  { label: 'GGBases', value: 'ggbases' },
  { label: '2DFan', value: '2dfan' },
  { label: 'VNDB', value: 'vndb' },
]

// --- Results State ---
const scrapResultsMap = ref(new Map<string, ScraperGetRespItem[]>())
const resultSources = ref<string[]>([])
const activeSource = ref('')
const loading = ref(false)
const process = ref(0)

// --- Selection State ---
const selectedGames = ref<ScraperGetRespItem[]>([])
const selectedItem = ref<PathInfo | null>(null) // Currently selected folder

// --- Computed ---
const currentDisplayGames = computed(() => {
  if (!activeSource.value)
    return []
  return scrapResultsMap.value.get(activeSource.value) || []
})

const filteredLibraries = computed(() => {
  return libraries.value.filter(item => item.is_dir)
})

// --- Helper Functions ---
function getName(path: string) {
  if (!path)
    return ''
  const parts = path.split(/[/\\]/)
  return parts[parts.length - 1] || path
}

// --- Library Functions ---
function list(path: string) {
  if (!path)
    return
  libraryApi.ls(path, libraryNoScrap.value).then((res) => {
    libraries.value = res.data.list.filter((e: PathInfo) => e.is_dir)
  })
}

function toggleExpand(path: string) {
  expandedItems.value[path] = !expandedItems.value[path]
}

function selectItem(item: PathInfo) {
  selectedItem.value = item
  selectedLibraryPath.value = item.path
  // Auto-search with the folder name
  searchParam.value.keyword = getName(item.path)
  handleSearch()
}

// --- Search Functions ---
function handleSearch() {
  if (!searchParam.value.keyword)
    return

  loading.value = true
  scrapResultsMap.value.clear()
  resultSources.value = []
  activeSource.value = ''

  scrapApi.search(searchParam.value)
    .then(() => {
      ElMessage.info('搜索请求已发送，请等待结果...')
    })
    .catch(() => {
      loading.value = false
    })
}

function toggleSelect(game: ScraperGetRespItem) {
  const index = selectedGames.value.findIndex(g => g.url === game.url)
  if (index > -1) {
    selectedGames.value.splice(index, 1)
  }
  else {
    selectedGames.value.push(game)
  }
}

function isSelected(game: ScraperGetRespItem) {
  return selectedGames.value.some(g => g.url === game.url)
}

// --- Scrape Functions ---
function submitAutoScrape() {
  if (selectedGames.value.length === 0 || !selectedLibraryPath.value) {
    ElMessage.warning('请先选择要刮削的游戏和目标路径')
    return
  }

  let name = ''
  for (const game of selectedGames.value) {
    if (game.scraper_name === 'vndb') {
      name = game.name
    }
  }

  const req: ScraperAutoReq = {
    objs: selectedGames.value.map(g => ({ name: g.scraper_name, url: g.url })),
    path: selectedLibraryPath.value,
    version: 'v0',
    name,
  }

  scrapApi.auto(req).then(() => {
    ElMessage.success('刮削任务已提交，请耐心等待后台处理')
    selectedGames.value = []
    selectedItem.value = null
    selectedLibraryPath.value = ''
    // Refresh library list
    list(selectedGameLibrary.value)
  })
}

// Manual scrape dialog
const scraperDetailReq = ref<ScraperDetailReq>({
  request_id: '',
  objs: [],
})
watch(
  () => gameStore.showScraper,
  (newVal) => {
    if (newVal) {
      scraperDetailReq.value.objs = []
      for (const item of selectedGames.value) {
        scraperDetailReq.value?.objs.push({
          name: item.scraper_name,
          url: item.url,
        })
      }
      scrapApi.scrap(scraperDetailReq.value)
    }
  },
)

// --- WebSocket ---
onMounted(() => {
  // Load settings
  const noScrap = localStorage.getItem('libraryNoScrap')
  if (noScrap !== null) {
    libraryNoScrap.value = noScrap === 'true'
  }

  // Load game libraries
  policyApi.get().then((res) => {
    const systemConfig = Object.entries(res.data).find(([k]) => k === 'system')
    if (systemConfig) {
      const config = JSON.parse(systemConfig[1] as string)
      gameLibrary.value = config.game_library || []
      if (gameLibrary.value.length > 0) {
        selectedGameLibrary.value = gameLibrary.value[0]
        list(selectedGameLibrary.value)
      }
    }
  })

  // WebSocket event
  onEvent('scraper:search', (data: any) => {
    loading.value = false
    if (data.success) {
      scrapApi.get(data.rid).then((res) => {
        for (const sourceKey in res.data) {
          const list = res.data[sourceKey]
          scrapResultsMap.value.set(sourceKey, list)
          if (list && list.length > 0 && !resultSources.value.includes(sourceKey)) {
            resultSources.value.push(sourceKey)
          }
        }
        if (!activeSource.value && resultSources.value.length > 0) {
          activeSource.value = resultSources.value[0]
        }
      }).finally(() => {
        process.value = scrapResultsMap.value.size / (scrapers.length - 1) * 100
      })
    }
    else {
      if (data.data?.name) {
        scrapResultsMap.value.set(data.data?.name, [])
      }
      ElNotification.error({ title: '搜索失败', message: data.data?.name || '未知错误' })
    }
    process.value = scrapResultsMap.value.size / (scrapers.length - 1) * 100
  })
})

// Watch for changes
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
  <div class="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
    <!-- Header -->
    <div class="border-b border-gray-200 bg-white px-6 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div class="flex items-center gap-6">
        <!-- Logo / Title -->
        <div class="flex items-center gap-3">
          <div class="rounded-lg from-blue-500 to-indigo-600 bg-gradient-to-br p-2 shadow-lg">
            <MagicStick :size="18" class="text-white" />
          </div>
          <div>
            <h1 class="text-lg text-gray-900 font-bold dark:text-white">
              游戏刮削
            </h1>
            <p class="text-xs text-gray-500">
              TMM 风格单页工作流
            </p>
          </div>
        </div>

        <!-- Library Selection -->
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

        <!-- Filter Toggle -->
        <div class="flex items-center gap-2 border border-gray-200 rounded-lg bg-gray-50 px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800">
          <span class="text-xs text-gray-500">仅未入库</span>
          <el-switch v-model="libraryNoScrap" size="small" />
        </div>

        <div class="flex-1" />
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Left Panel: Library Browser -->
      <div class="w-80 flex flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div class="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <h2 class="flex items-center gap-2 text-sm text-gray-800 font-semibold dark:text-white">
            <FolderOpened :size="16" class="text-blue-500" />
            未入库游戏
          </h2>
          <p class="mt-1 text-xs text-gray-500">
            {{ filteredLibraries.length }} 个文件夹
          </p>
        </div>

        <!-- Library List -->
        <div class="flex-1 overflow-y-auto">
          <div
            v-for="item in filteredLibraries"
            :key="item.path"
            class="group cursor-pointer border-b border-gray-100 transition-all dark:border-gray-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
            :class="{ 'bg-blue-50 dark:bg-blue-900/20': selectedItem?.path === item.path }"
            @click="selectItem(item)"
          >
            <div class="flex items-center gap-3 px-4 py-3">
              <!-- Folder Icon -->
              <div class="h-10 w-10 flex shrink-0 items-center justify-center rounded-lg from-gray-100 to-gray-200 bg-gradient-to-br dark:from-gray-800 dark:to-gray-700">
                <Folder :size="18" class="text-gray-500 dark:text-gray-400" />
              </div>

              <!-- Info -->
              <div class="min-w-0 flex-1">
                <h3 class="truncate text-sm text-gray-900 font-medium dark:text-white">
                  {{ getName(item.path) }}
                </h3>
                <p class="flex items-center gap-1 text-xs text-gray-500">
                  <Document :size="10" />
                  {{ item.child?.length || 0 }} 个文件
                </p>
              </div>

              <!-- Expand Button -->
              <el-button
                v-if="item.child && item.child.length > 0"
                size="small"
                text
                @click.stop="toggleExpand(item.path)"
              >
                <el-icon class="transition-transform" :class="{ 'rotate-180': expandedItems[item.path] }">
                  <ArrowDown :size="14" />
                </el-icon>
              </el-button>
            </div>

            <!-- Expanded Files -->
            <div v-show="expandedItems[item.path]" class="border-t border-gray-100 bg-gray-50/50 px-4 py-2 dark:border-gray-800 dark:bg-gray-800/50">
              <div
                v-for="file in item.child"
                :key="file.path"
                class="flex items-center justify-between rounded px-2 py-1.5 hover:bg-white dark:hover:bg-gray-800"
                @click.stop="selectItem(item)"
              >
                <div class="flex items-center gap-2">
                  <el-icon v-if="file.is_dir" class="text-yellow-500">
                    <Folder :size="14" />
                  </el-icon>
                  <el-icon v-else class="text-gray-400">
                    <Document :size="14" />
                  </el-icon>
                  <span class="truncate text-xs text-gray-700 dark:text-gray-300">
                    {{ getName(file.path) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Middle Panel: Search Results -->
      <div class="flex flex-1 flex-col bg-gray-50 dark:bg-gray-950">
        <!-- Search Bar -->
        <div class="border-b border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div class="flex items-center gap-3">
            <el-select v-model="searchParam.name" class="w-32" placeholder="源">
              <el-option v-for="s in scrapers" :key="s.value" :value="s.value" :label="s.label" />
            </el-select>

            <el-input
              v-model="searchParam.keyword"
              placeholder="输入游戏名称进行搜索..."
              class="flex-1"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #prepend>
                <el-button :icon="Search" @click="handleSearch" />
              </template>
            </el-input>

            <el-input-number v-model="searchParam.page" :min="1" class="w-20" controls-position="right" />

            <el-button type="primary" :loading="loading" @click="handleSearch">
              搜索
            </el-button>
          </div>

          <!-- Result Tabs -->
          <div v-if="resultSources.length > 0" class="mt-3 flex gap-2 overflow-x-auto">
            <button
              v-for="source in resultSources"
              :key="source"
              class="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              :class="activeSource === source
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'"
              @click="activeSource = source"
            >
              {{ source.toUpperCase() }}
              <span class="ml-1 rounded-full bg-white/20 px-1">
                {{ scrapResultsMap.get(source)?.length }}
              </span>
            </button>
          </div>

          <el-progress
            v-if="loading || resultSources.length > 0"
            :percentage="process"
            :stroke-width="2"
            :show-text="false"
            class="mt-3"
          />
        </div>

        <!-- Results Grid -->
        <div class="flex-1 overflow-y-auto p-4">
          <!-- Loading -->
          <div v-if="loading" class="h-full flex items-center justify-center">
            <div class="flex flex-col items-center gap-3">
              <el-icon class="is-loading text-blue-500" :size="40">
                <Loading />
              </el-icon>
              <p class="text-sm text-gray-500">
                正在从各大站点抓取数据...
              </p>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else-if="resultSources.length === 0" class="h-full flex flex-col items-center justify-center text-gray-400">
            <el-icon :size="48" class="mb-3 opacity-30">
              <Search />
            </el-icon>
            <p class="text-sm">
              {{ selectedItem ? '输入关键词搜索游戏信息' : '从左侧选择一个文件夹开始' }}
            </p>
          </div>

          <!-- Grid -->
          <div v-else class="grid grid-cols-2 gap-4 lg:grid-cols-5 md:grid-cols-4 xl:grid-cols-6">
            <div
              v-for="g in currentDisplayGames"
              :key="g.url"
              class="group relative cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm transition-all dark:bg-gray-900 hover:shadow-lg"
              :class="isSelected(g) ? 'ring-2 ring-blue-500' : ''"
              @click="toggleSelect(g)"
            >
              <!-- Selected Badge -->
              <div v-if="isSelected(g)" class="absolute right-0 top-0 z-10 rounded-bl-lg bg-blue-500 px-2 py-1 text-white shadow-sm">
                <el-icon><Check :size="14" /></el-icon>
              </div>

              <!-- Image -->
              <div class="aspect-[9/12] w-full bg-gray-100 dark:bg-gray-800">
                <img
                  v-if="g.cover"
                  :src="imageUrl(g.cover)"
                  :alt="g.name"
                  loading="lazy"
                  class="h-full w-full object-cover"
                >
                <div v-else class="h-full flex items-center justify-center text-gray-400">
                  <span class="text-xs">No Cover</span>
                </div>
              </div>

              <!-- Hover Info -->
              <div class="p-2">
                <h3 class="truncate text-xs text-gray-900 font-medium dark:text-white" :title="g.name">
                  {{ g.name }}
                </h3>
                <p class="text-[10px] text-gray-500">
                  {{ g.scraper_name }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel: Cart -->
      <div class="w-72 flex flex-col border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div class="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <h2 class="flex items-center gap-2 text-sm text-gray-800 font-semibold dark:text-white">
            <MagicStick :size="16" class="text-indigo-500" />
            待刮削 ({{ selectedGames.length }})
          </h2>
          <p v-if="selectedLibraryPath" class="mt-1 truncate text-xs text-gray-500" :title="selectedLibraryPath">
            {{ getName(selectedLibraryPath) }}
          </p>
        </div>

        <!-- Selected List -->
        <div class="flex-1 overflow-y-auto p-3">
          <div v-if="selectedGames.length === 0" class="py-8 text-center text-sm text-gray-400">
            点击搜索结果<br>添加到刮削队列
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="g in selectedGames"
              :key="g.url"
              class="group flex items-center gap-2 border border-gray-200 rounded-lg p-2 transition dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            >
              <img :src="imageUrl(g.cover)" class="h-12 w-10 rounded bg-gray-100 object-cover">
              <div class="min-w-0 flex-1">
                <div class="truncate text-xs text-gray-900 font-medium dark:text-white">
                  {{ g.name }}
                </div>
                <div class="text-[10px] text-gray-500">
                  {{ g.scraper_name }}
                </div>
              </div>
              <button
                class="rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-800"
                @click="toggleSelect(g)"
              >
                <el-icon><Delete :size="14" /></el-icon>
              </button>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="border-t border-gray-200 p-3 dark:border-gray-800">
          <el-button
            type="primary"
            class="w-full"
            :disabled="selectedGames.length === 0 || !selectedLibraryPath"
            @click="submitAutoScrape"
          >
            开始自动刮削
          </el-button>
          <div class="mt-2 flex justify-center gap-2">
            <el-button link size="small" @click="gameStore.showScraper = true">
              手动刮削
            </el-button>
            <el-button link size="small" @click="selectedGames = []">
              清空
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <GameMergeDialog :visible="gameStore.showScraper" :game-path="selectedLibraryPath" @close="gameStore.showScraper = false" />
</template>

<style scoped>
:deep(.el-select__wrapper) {
  background-color: rgba(var(--c-bg-input), 1);
  box-shadow: 0 0 0 1px rgba(var(--c-border-strong), 1) inset;
}

:deep(.el-input__wrapper) {
  background-color: rgba(var(--c-bg-input), 1);
  box-shadow: 0 0 0 1px rgba(var(--c-border-strong), 1) inset;
}

:deep(.el-input-group__prepend) {
  --el-input-border-color: rgba(var(--c-border), 1);
}

:deep(.el-input-number.is-controls-right) {
  --el-border: rgba(var(--c-border), 1);
}
</style>
