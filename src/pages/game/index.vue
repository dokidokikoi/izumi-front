<script setup lang="ts">
import type { Category, Developer, Game, GameListReq, Series, Tag } from '~/types'
import { categoryApi, developerApi, gameApi, seriesApi, tagApi } from '~/apis/game'
import { useGameStore } from '~/stores/gameStore'

const router = useRouter()
const gameStore = useGameStore()
const loadMoreTrigger = ref<HTMLElement | null>(null)

const games = ref<Game[]>([])

const loading = ref(false)
const hasMore = ref(true)

// 高级搜索字段
const filters = ref<Partial<GameListReq>>({
  page: 0,
  page_size: 20,
})

const categories = ref<Category[]>([])
const series = ref<Series[]>([])
const tags = ref<Tag[]>([])
const developers = ref<Developer[]>([])

// 初始化
function getCategories() {
  return categoryApi.list().then((res) => {
    categories.value = res.data
  })
}
function getSeries() {
  return seriesApi.list().then((res) => {
    series.value = res.data.list
  })
}
function getTags() {
  return tagApi.list().then((res) => {
    tags.value = res.data.list
  })
}
function getDevelopers() {
  return developerApi.list().then((res) => {
    developers.value = res.data.list
  })
}

getCategories()
getSeries()
getTags()
getDevelopers()

// 搜索方法（可以替换成 API 调用）
function searchGames(query: string, append: boolean = false) {
  loading.value = true
  filters.value.keyword = query
  if (append) {
    if (!filters.value.page) {
      filters.value.page = 0
    }
    filters.value.page++
  }
  else {
    filters.value.page = 1
  }
  gameApi.search(filters.value).then((res) => {
    if (!append) {
      games.value = []
    }
    games.value.push(...res.data.list)

    loading.value = false
    gameStore.searchTrigger = false
  })
}

// 监听 searchTrigger，执行搜索
watch(
  () => gameStore.searchTrigger,
  (newVal) => {
    if (newVal) {
      searchGames(gameStore.searchQuery)
    }
  },
)

// 滚动加载
function initObserver() {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        searchGames(gameStore.searchQuery, true)
      }
    },
    { rootMargin: '100px' }, // 提前100px触发加载
  )
  if (loadMoreTrigger.value)
    observer.observe(loadMoreTrigger.value)
}

onMounted(() => {
  initObserver()
})

function go(id: number) {
  router.push(`/game/${id}`)
}
</script>

<template>
  <!-- 高级搜索面板 -->
  <transition name="fade">
    <div
      v-if="gameStore.showAdvanced"
      class="mt-6 border rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800"
    >
      <!-- 分类 -->
      <!-- <div class="flex items-center">
        <span class="w-20 font-medium">类别：</span>
        <div class="flex flex-1 flex-wrap gap-2">
          <button
            v-for="cat in categories"
            :key="cat.id"
            class="border rounded px-2 text-sm transition" :class="[
              cat.selected
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-200',
            ]"
          >
            {{ cat.name }}
          </button>
        </div>
      </div> -->

      <el-row>
        <!-- 标签 -->
        <el-col :span="8">
          <div class="flex items-center">
            <span class="w-20 font-medium">标签: </span>
            <el-select v-model="filters.tags" multiple clearable w-80>
              <el-option v-for="tag in tags" :key="tag.id" :value="tag.name" :label="tag.name" />
            </el-select>
          </div>
          <div
            class="grid grid-cols-2 mb-4 gap-3 pt4 md:grid-cols-3"
          />
        </el-col>
      </el-row>

      <el-row>
        <!-- 分类 -->
        <el-col :span="8">
          <div class="flex items-center">
            <span class="w-20 font-medium">分类: </span>
            <el-select v-model="filters.category" clearable w-80>
              <el-option v-for="c in categories" :key="c.id" :value="c.id" :label="c.name" />
            </el-select>
          </div>
        </el-col>

        <!-- 系列 -->
        <el-col :span="8">
          <div class="flex items-center">
            <span class="w-20 font-medium">系列: </span>
            <el-select v-model="filters.series" clearable w-80>
              <el-option v-for="s in series" :key="s.id" :value="s.id" :label="s.name" />
            </el-select>
          </div>
        </el-col>

        <!-- 开发商 -->
        <el-col :span="8">
          <div class="flex items-center">
            <span class="w-20 font-medium">开发商: </span>
            <el-select v-model="filters.developer" clearable w-80>
              <el-option v-for="d in developers" :key="d.id" :value="d.id" :label="d.name" />
            </el-select>
          </div>
        </el-col>
      </el-row>
    </div>
  </transition>

  <div
    class="grid grid-cols-1 gap-6 p-4 2xl:grid-cols-7 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 xl:grid-cols-5"
  >
    <GameCard v-for="game in games" :key="game.id" :game="game" @click="go(game.id)" />
  </div>

  <!-- 加载提示 -->
  <div ref="loadMoreTrigger" class="h-10 flex items-center justify-center">
    <span v-if="loading">加载中...</span>
    <span v-else-if="!hasMore">没有更多了</span>
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
</route>
