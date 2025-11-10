<script setup lang="ts">
import type {
  ScraperAutoReq,
  ScraperDetailReq,
  ScraperGetRespItem,
  ScraperSearchReq,
} from '~/types'
import { ElNotification } from 'element-plus'
import { scrapApi } from '~/apis/game'
import { useGameStore } from '~/stores/gameStore'
import { useWebSocket } from '~/utils/websocket'

const route = useRoute()
const gameStore = useGameStore()
const searchParam = ref<Partial<ScraperSearchReq>>({
  name: 'all',
  keyword: '彼女',
  page: 1,
})
const requestId = ref('')
const scrapers = ref([
  { label: 'all', value: 'all' },
  { label: 'bangumi', value: 'bangumi' },
  { label: 'dlsite', value: 'dlsite' },
  { label: 'getchu', value: 'getchu' },
  { label: 'ggbases', value: 'ggbases' },
  { label: '2dfan', value: '2dfan' },
  { label: 'vndb', value: 'vndb' },
])

const games = ref<ScraperGetRespItem[]>([])
const scrapGames = ref(new Map<string, ScraperGetRespItem[]>())
const gamePath = ref<string>('')

const selectedGames = ref<ScraperGetRespItem[]>([])

function handleSearch() {
  scrapApi.search(searchParam.value).then((res) => {
    requestId.value = res.data
  })
}

searchParam.value.keyword = route.query.keyword as string
gamePath.value = route.query.path as string

function toggleSelect(game: ScraperGetRespItem) {
  if (selectedGames.value.find(g => g.url === game.url)) {
    selectedGames.value = selectedGames.value.filter(g => g.url !== game.url)
  }
  else {
    selectedGames.value.push(game)
  }
}

// 监听 searchTrigger，执行搜索
watch(
  () => gameStore.selectScrapResult,
  (newVal) => {
    if (newVal) {
      games.value = scrapGames.value.get(newVal) ?? []
    }
  },
)

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

// 监听 selectScrapResult，执行刮削
const scraperAutoReq = ref<ScraperAutoReq>({
  objs: [],
  path: '',
  version: 'v0',
})
watch(
  () => gameStore.autoScraper,
  (newVal) => {
    if (newVal) {
      scraperAutoReq.value.objs = []
      scraperAutoReq.value.path = gamePath.value
      for (const item of selectedGames.value) {
        scraperAutoReq.value?.objs.push({
          name: item.scraper_name,
          url: item.url,
        })
      }
      scrapApi.auto(scraperAutoReq.value)
    }
  },
)

onMounted(() => {
  const { connection } = useWebSocket('/notify?topic=scraper&uid=izumi_search')
  if (connection && connection.value) {
    connection.value.onmessage = function (event) {
      const data = JSON.parse(event.data)
      if (data.event === 'search') {
        if (data.message === 'success') {
          scrapApi.get(data.rid).then((res) => {
            scrapGames.value.clear()
            gameStore.scrapResults = []
            for (const item in res.data) {
              gameStore.scrapResults.push(item)
              scrapGames.value.set(item, res.data[item])
            }
          })
        }
        ElNotification({
          title: 'Title',
          message: data.message,
          type: 'success',
          duration: 5000,
          position: 'bottom-right',
        })
      }
    }
  }
})
</script>

<template>
  <div class="h-screen flex flex-col" style="height: calc(100vh - 112px);">
    <!-- 顶部搜索栏 -->
    <div class="flex items-center gap-4 border-b px-4 pb-4">
      <el-input
        v-model="searchParam.keyword"
        type="text"
        placeholder="输入游戏名称..."
        class="flex-1"
      />
      <el-input
        v-model.number="searchParam.page"
        type="text"
        placeholder="分页"
        class="w16"
      />
      <el-select v-model="searchParam.name" class="w32">
        <el-option v-for="s in scrapers" :key="s.value" :value="s.value" :label="s.label" />
      </el-select>
      <button
        class="rounded bg-blue-500 px-4 py-1 text-3.6 text-white transition"
        @click="handleSearch"
      >
        搜索
      </button>
    </div>

    <!-- 主体区域 -->
    <div class="flex flex-1 overflow-hidden">
      <div
        class="grid grid auto-rows-max grid-cols-1 flex-1 gap-4 gap-6 overflow-y-auto p-4 p-4 2xl:grid-cols-8 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 xl:grid-cols-5"
      >
        <el-tooltip
          v-for="g in games"
          :key="g.url"
          effect="light"
          placement="right-end"
        >
          <template #content>
            <p style="word-break: normal; white-space: pre-wrap; word-wrap: break-word;">
              {{ g.name }}
            </p>
          </template>
          <GameCard
            :game="g"
            class="cursor-pointer"
            @click="toggleSelect(g)"
          />
        </el-tooltip>
      </div>

      <!-- 右侧已选择竖条，固定 -->
      <div class="w-38 overflow-y-auto border-l bg-gray-50 p-4 dark:bg-gray-700">
        <h2 class="mb-2 font-bold">
          已选择
        </h2>
        <GameCard
          v-for="game in selectedGames"
          :key="game.url"
          :game="game"
          class="cursor-pointer"
          mb-4
          @click="toggleSelect(game)"
        />
      </div>
    </div>
  </div>

  <GameMergeDialog :visible="gameStore.showScraper" :game-path="gamePath" @close="gameStore.showScraper = false" />
</template>
