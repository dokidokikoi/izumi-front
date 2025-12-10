<script setup lang="ts">
import type {
  ScraperAutoReq,
  ScraperDetailReq,
  ScraperGetRespItem,
  ScraperSearchReq,
} from '~/types'
import { Delete, Loading, MagicStick, Search } from '@element-plus/icons-vue'
import { ElMessage, ElNotification } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { scrapApi } from '~/apis/game'
import { useWsNotify } from '~/composables/useWsNotify'
import { useGameStore } from '~/stores/gameStore'
import { imageUrl } from '~/utils/image'

const route = useRoute()
const gameStore = useGameStore()
const { onEvent } = useWsNotify()

// --- 状态管理 ---
const loading = ref(false)
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

// 搜索结果数据
const scrapResultsMap = ref(new Map<string, ScraperGetRespItem[]>())
const resultSources = ref<string[]>([]) // 存所有有结果的源 key
const activeSource = ref('') // 当前选中的 Tab

// 已选数据
const selectedGames = ref<ScraperGetRespItem[]>([])
const gamePath = ref<string>('')

// 计算当前显示的列表
const currentDisplayGames = computed(() => {
  if (!activeSource.value)
    return []
  return scrapResultsMap.value.get(activeSource.value) || []
})

const process = ref(0)

// --- 核心逻辑 ---

function handleSearch() {
  if (!searchParam.value.keyword)
    return

  loading.value = true
  // 清空旧数据
  scrapResultsMap.value.clear()
  resultSources.value = []
  activeSource.value = ''
  // selectedGames.value = []

  scrapApi.search(searchParam.value)
    .then(() => {
      // 仅发送了请求，等待 WebSocket 回调
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

// 提交自动刮削
function submitAutoScrape() {
  if (selectedGames.value.length === 0)
    return

  let name = ''
  for (const game of selectedGames.value) {
    if (game.scraper_name === 'vndb') {
      name = game.name
    }
  }

  const req: ScraperAutoReq = {
    objs: selectedGames.value.map(g => ({ name: g.scraper_name, url: g.url })),
    path: gamePath.value,
    version: 'v0',
    name,
  }

  scrapApi.auto(req).then(() => {
    ElMessage.success('刮削任务已提交，请耐心等待后台处理')
    // 可以在这里跳转回首页或清空选择
    selectedGames.value = []
  })
}

// 监听 selectScrapResult，执行刮削
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

// --- 初始化 & WebSocket ---

onMounted(() => {
  searchParam.value.keyword = route.query.keyword as string
  gamePath.value = route.query.path as string

  if (searchParam.value.keyword) {
    handleSearch()
  }

  onEvent('scraper:search', (data: any) => {
    loading.value = false
    if (data.success) {
      // 获取具体结果详情
      scrapApi.get(data.rid).then((res) => {
        // 整理数据
        for (const sourceKey in res.data) {
          const list = res.data[sourceKey]
          scrapResultsMap.value.set(sourceKey, list)
          if (list && list.length > 0 && !resultSources.value.includes(sourceKey)) {
            resultSources.value.push(sourceKey)
          }
        }
        // 如果当前没有选中 Tab，默认选第一个有数据的
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
</script>

<template>
  <div class="h-[calc(100vh-104px)] flex flex-col bg-overlay">
    <!-- 1. 顶部搜索栏 -->
    <div class="relative z-10 border-b border-base bg-card p-4 shadow-sm">
      <div class="mx-auto max-w-7xl flex items-center gap-4">
        <!-- 搜索源 -->
        <el-select v-model="searchParam.name" class="w-32" placeholder="源">
          <el-option v-for="s in scrapers" :key="s.value" :value="s.value" :label="s.label" />
        </el-select>

        <!-- 搜索框 -->
        <el-input
          v-model="searchParam.keyword"
          placeholder="输入游戏名称..."
          class="max-w-2xl flex-1"
          size="large"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prepend>
            <el-button :icon="Search" @click="handleSearch" />
          </template>
        </el-input>

        <!-- 分页 (可选) -->
        <el-input-number v-model="searchParam.page" :min="1" class="w-24" controls-position="right" />

        <el-button type="primary" size="large" :loading="loading" @click="handleSearch">
          搜索
        </el-button>
      </div>

      <!-- 2. 搜索结果 Tabs (如有结果) -->
      <div v-if="resultSources.length > 0" class="mx-auto mt-4 max-w-7xl flex gap-2 overflow-x-auto pb-1">
        <button
          v-for="source in resultSources"
          :key="source"
          class="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          :class="activeSource === source
            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'"
          @click="activeSource = source"
        >
          {{ source.toUpperCase() }}
          <span class="ml-1 rounded-full bg-white/50 px-1.5 text-xs opacity-70">
            {{ scrapResultsMap.get(source)?.length }}
          </span>
        </button>
      </div>

      <el-progress :percentage="process" :stroke-width="2" :show-text="false" color="rgba(var(--c-primary), 1)" class="absolute inset-x-0 bottom-0 left-0 z-10" />
    </div>

    <!-- 3. 主体内容：结果 + 购物车 -->
    <div class="mx-auto w-full flex flex-1 overflow-hidden">
      <!-- 左侧：结果网格 -->
      <div class="relative flex-1 overflow-y-auto p-6">
        <!-- 加载状态 -->
        <div v-if="loading" class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/80">
          <el-icon class="is-loading mb-2 text-blue-500" :size="40">
            <Loading />
          </el-icon>
          <p class="text-gray-500">
            正在从各大站点抓取数据，请稍候...
          </p>
        </div>

        <!-- 空状态 -->
        <div v-else-if="resultSources.length === 0" class="h-full flex flex-col items-center justify-center text-gray-400">
          <el-icon :size="60" class="mb-4 opacity-20">
            <Search />
          </el-icon>
          <p>暂无搜索结果，请尝试更换关键词或数据源</p>
        </div>

        <!-- Grid 列表 -->
        <div v-else class="grid grid-cols-2 gap-6 2xl:grid-cols-6 lg:grid-cols-4 md:grid-cols-3 xl:grid-cols-5">
          <div
            v-for="g in currentDisplayGames"
            :key="g.url"
            class="group relative cursor-pointer overflow-hidden border-2 rounded-xl bg-white shadow-sm transition-all dark:bg-gray-800 hover:shadow-md"
            :class="isSelected(g) ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'"
            @click="toggleSelect(g)"
          >
            <!-- 选中角标 -->
            <div v-if="isSelected(g)" class="absolute right-0 top-0 z-10 rounded-bl-lg bg-blue-500 px-2 py-1 text-white shadow-sm">
              <el-icon><Check /></el-icon>
            </div>

            <!-- 复用你的 GameCard，或者直接写结构 -->
            <GameCard :game="g" class="pointer-events-none" />

            <!-- Hover 遮罩 -->
            <div class="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/5" />
          </div>
        </div>
      </div>

      <!-- 右侧：待处理清单 (Cart) -->
      <div class="z-30 w-80 flex flex-col border-l border-base bg-card shadow-xl">
        <div class="border-b border-base p-4">
          <h2 class="flex items-center gap-2 text-gray-800 font-bold dark:text-white">
            <el-icon><MagicStick /></el-icon>
            已选游戏 ({{ selectedGames.length }})
          </h2>
          <p class="mt-1 truncate text-xs text-gray-500" :title="gamePath">
            目标路径: {{ gamePath }}
          </p>
        </div>

        <!-- 已选列表 -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
          <div v-if="selectedGames.length === 0" class="py-10 text-center text-sm text-gray-400">
            点击左侧卡片<br>添加到刮削队列
          </div>

          <div
            v-for="g in selectedGames"
            :key="g.url"
            class="group flex items-center gap-3 border border-base rounded-lg p-2 hover:border-strong"
          >
            <!-- 缩略图 -->
            <img :src="imageUrl(g.cover)" class="h-16 w-12 rounded bg-gray-200 object-cover">
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm text-main font-bold">
                {{ g.name }}
              </div>
              <div class="text-xs text-muted">
                {{ g.scraper_name }}
              </div>
            </div>
            <!-- 删除按钮 -->
            <button
              class="rounded-md p-1.5 text-gray-400 transition hover:bg-hover hover:text-red-500"
              @click.stop="toggleSelect(g)"
            >
              <el-icon><Delete /></el-icon>
            </button>
          </div>
        </div>

        <!-- 底部操作栏 -->
        <div class="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <el-button
            type="primary"
            size="large"
            class="w-full !h-12 !text-lg !font-bold"
            :disabled="selectedGames.length === 0"
            @click="submitAutoScrape"
          >
            开始自动刮削
          </el-button>
          <div class="mt-2 text-center">
            <el-button link size="small" type="info" @click="gameStore.showScraper = true">
              手动刮削
            </el-button>
            <el-button link size="small" type="info" @click="selectedGames = []">
              清空选择
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <GameMergeDialog :visible="gameStore.showScraper" :game-path="gamePath" @close="gameStore.showScraper = false" />
</template>

<style scoped>
/* 优化 GameCard 的样式，确保它填充父容器 */
:deep(.game-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
}
:deep(.el-select__wrapper) {
  background-color: rgba(var(--c-bg-input), 1);
  box-shadow: 0 0 0 1px rgba(var(--c-border-strong), 1) inset;
}
/* 输入框背景适配 */
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
:deep(.el-button:hover) {
  background-color: rgba(var(--c-primary), 1);
  border-color: rgba(var(--c-border-strong), 1);
  color: white;
}
</style>
