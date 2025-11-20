<script setup lang="ts">
import type { Brand, Category, Game, GameListReq, Series, Tag } from '~/types'
import { RefreshLeft, Search } from '@element-plus/icons-vue'
// 建议安装 @vueuse/core
import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { brandApi, categoryApi, gameApi, seriesApi, tagApi } from '~/apis/game'
import { useGameStore } from '~/stores/gameStore'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()

// --- 状态管理 ---
const loadMoreTrigger = ref<HTMLElement | null>(null)
const games = ref<Game[]>([])
const loading = ref(false)
const hasMore = ref(true)
const isInitialLoad = ref(true) // 用于显示初始骨架屏

// 筛选条件
const filters = reactive<Partial<GameListReq>>({
  page: 1,
  page_size: 24, // 调整为 2/3/4/6 的倍数，布局更整齐
  order_by: 'id desc',
  keyword: '',
  tags: [],
  category: undefined,
  series: undefined,
  brand: undefined,
  character: undefined,
  staff: undefined,
})

// 字典数据
const categories = ref<Category[]>([])
const series = ref<Series[]>([])
const tags = ref<Tag[]>([])
const brands = ref<Brand[]>([])

// --- 初始化逻辑 ---
function initFiltersFromRoute() {
  const q = route.query
  if (q.tags)
    filters.tags = Array.isArray(q.tags) ? q.tags as string[] : [q.tags as string]
  if (q.series)
    filters.series = Number(q.series)
  if (q.category)
    filters.category = Number(q.category)
  if (q.brand)
    filters.brand = Number(q.brand)
  if (q.keyword)
    filters.keyword = q.keyword as string
}

function fetchDicts() {
  Promise.all([
    categoryApi.list().then(res => categories.value = res.data),
    seriesApi.list().then(res => series.value = res.data.list),
    tagApi.list().then(res => tags.value = res.data.list),
    brandApi.list().then(res => brands.value = res.data.list),
  ])
}

// --- 搜索核心 ---
async function searchGames(append = false) {
  if (loading.value)
    return // 防止重复触发

  loading.value = true

  // 如果不是追加模式，重置页码
  if (!append) {
    filters.page = 1
    hasMore.value = true
    // 滚动回顶部
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  try {
    // 同步 Store 的搜索词
    filters.keyword = gameStore.searchQuery

    const res = await gameApi.search(filters)
    const list = res.data.list || []

    if (append) {
      games.value.push(...list)
    }
    else {
      games.value = list
    }

    // 判断是否还有更多
    hasMore.value = list.length >= (filters.page_size || 20)
    if (append && list.length > 0)
      filters.page!++
    else if (!append && list.length > 0)
      filters.page = 2
  }
  catch (error) {
    console.error(error)
  }
  finally {
    loading.value = false
    isInitialLoad.value = false
    gameStore.searchTrigger = false
  }
}

// --- 自动触发逻辑 ---
// 使用防抖，当筛选条件变化时自动搜索
// const debouncedSearch = useDebounceFn(() => {
//   searchGames(false)
// }, 500)

// 监听 filters 的变化 (深度监听)
// watch(filters, () => {
//   searchGames(false)
// }, { deep: true })

// 监听全局搜索触发
watch(() => gameStore.searchTrigger, (val) => {
  if (val)
    searchGames(false)
})

// 重置筛选
function resetFilters() {
  filters.tags = []
  filters.category = undefined
  filters.series = undefined
  filters.brand = undefined
  gameStore.searchQuery = '' // 清空搜索框
  searchGames(false)
}

// --- 生命周期 ---
onMounted(() => {
  initFiltersFromRoute()
  fetchDicts()
  searchGames(false)

  // 无限滚动
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasMore.value && !loading.value) {
      searchGames(true)
    }
  }, { rootMargin: '200px' })

  if (loadMoreTrigger.value)
    observer.observe(loadMoreTrigger.value)
})

function go(id: number) {
  router.push(`/game/${id}`)
}
</script>

<template>
  <div class="min-h-screen bg-white pb-10 dark:bg-gray-900">
    <!-- 1. 顶部筛选面板 (折叠式) -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform -translate-y-2 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform -translate-y-2 opacity-0"
    >
      <div
        v-show="gameStore.showAdvanced"
        class="sticky top-[0px] z-30 transition-all duration-300"
        :class="gameStore.showAdvanced
          ? 'py-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm'
          : 'h-0 overflow-hidden py-0 border-none'"
      >
        <!-- 使用 v-show 控制内容显示，配合外层 div 的高度动画 -->
        <div v-show="gameStore.showAdvanced" class="mx-auto max-w-7xl px-4 lg:px-8 sm:px-6">
          <!-- 2. 响应式网格布局 (Grid Layout) -->
          <!-- 手机单列，平板双列，电脑四列 -->
          <div class="grid grid-cols-1 gap-4 lg:grid-cols-4 sm:grid-cols-2">
            <!-- 标签 (最常用，放在第一个) -->
            <div class="space-y-1.5">
              <label class="pl-1 text-[10px] text-gray-400 font-bold tracking-wider uppercase">Tags / 标签</label>
              <el-select
                v-model="filters.tags"
                multiple
                collapse-tags
                collapse-tags-tooltip
                filterable
                clearable
                placeholder="选择标签..."
                class="w-full"
                popper-class="custom-select-popper"
              >
                <el-option v-for="tag in tags" :key="tag.id" :value="tag.name" :label="tag.name" />
              </el-select>
            </div>

            <!-- 分类 -->
            <div class="space-y-1.5">
              <label class="pl-1 text-[10px] text-gray-400 font-bold tracking-wider uppercase">Category / 分类</label>
              <el-select v-model="filters.category" clearable placeholder="全部" class="w-full">
                <el-option v-for="c in categories" :key="c.id" :value="c.id" :label="c.name" />
              </el-select>
            </div>

            <!-- 系列 -->
            <div class="space-y-1.5">
              <label class="pl-1 text-[10px] text-gray-400 font-bold tracking-wider uppercase">Series / 系列</label>
              <el-select v-model="filters.series" clearable filterable placeholder="全部" class="w-full">
                <el-option v-for="s in series" :key="s.id" :value="s.id" :label="s.name" />
              </el-select>
            </div>

            <!-- 开发商 -->
            <div class="space-y-1.5">
              <label class="pl-1 text-[10px] text-gray-400 font-bold tracking-wider uppercase">Brand / 开发商</label>
              <el-select v-model="filters.brand" clearable filterable placeholder="全部" class="w-full">
                <el-option v-for="d in brands" :key="d.id" :value="d.id" :label="d.name" />
              </el-select>
            </div>

            <!-- 还可以加排序方式 -->
            <!-- <div class="space-y-1.5">
          <label class="text-[10px] font-bold tracking-wider text-gray-400 uppercase pl-1">Sort / 排序</label>
          <el-select v-model="filters.order_by" class="w-full">
             <el-option label="最新入库" value="id desc" />
             <el-option label="发行日期" value="issue_date desc" />
             <el-option label="评分最高" value="rating desc" />
          </el-select>
        </div> -->
          </div>

          <!-- 3. 底部状态栏：结果数 + 重置按钮 -->
          <div class="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700">
            <div class="flex items-center gap-2 text-xs text-gray-500">
              <span v-if="loading" class="flex items-center gap-1"><div class="h-2 w-2 animate-pulse rounded-full bg-blue-500" /> 搜索中...</span>
              <span v-else>共找到 <b>{{ games.length }}</b> 个游戏</span>
            </div>

            <button
              class="flex items-center gap-1 text-xs text-gray-400 font-medium transition-colors hover:text-gray-600 dark:hover:text-gray-200"
              @click="resetFilters"
            >
              <el-icon><RefreshLeft /></el-icon> 重置筛选
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 2. 游戏列表主体 -->
    <div class="mx-auto max-w-[1920px] p-4 sm:p-6">
      <!-- 初始加载骨架屏 -->
      <div v-if="isInitialLoad" class="grid grid-cols-2 gap-6 2xl:grid-cols-6 lg:grid-cols-4 md:grid-cols-3 xl:grid-cols-5">
        <div v-for="i in 12" :key="i" class="space-y-3">
          <div class="aspect-[2/3] animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
          <div class="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          <div class="h-3 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>

      <!-- 真实数据列表 -->
      <div v-else class="grid grid-cols-2 gap-6 2xl:grid-cols-6 lg:grid-cols-4 md:grid-cols-3 xl:grid-cols-5">
        <!--
             注意：这里移除了 el-tooltip。
             如果 GameCard 内部有 truncate 处理，建议依靠 CSS title 属性或者在 GameCard 内部实现轻量 hover。
             渲染几百个 el-tooltip 会极度卡顿。
        -->
        <GameCard
          v-for="game in games"
          :key="game.id"
          :game="game"
          class="transition-transform duration-300 hover:-translate-y-1"
          @click="go(game.id)"
        />
      </div>

      <!-- 3. 底部加载触发器 & 状态 -->
      <div ref="loadMoreTrigger" class="flex items-center justify-center py-10">
        <div v-if="loading && !isInitialLoad" class="flex items-center gap-2 text-gray-500">
          <div class="h-5 w-5 animate-spin border-2 border-blue-500 border-t-transparent rounded-full" />
          <span>加载更多...</span>
        </div>
        <div v-else-if="!hasMore && games.length > 0" class="text-sm text-gray-400">
          - 到底了 -
        </div>
        <div v-else-if="!loading && games.length === 0" class="flex flex-col items-center py-20 text-gray-400">
          <el-icon :size="48" class="mb-2 opacity-20">
            <Search />
          </el-icon>
          <p>没有找到相关游戏</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 优化 Element Select 在暗色模式下的显示 (可选) */
:deep(.el-input__wrapper) {
  background-color: transparent;
}
</style>

<route lang="yaml">
meta:
  layout: default
</route>
