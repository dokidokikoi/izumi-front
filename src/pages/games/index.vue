<script setup lang="ts">
import type { Brand, Category, Game, GameListReq, Series, Tag } from '~/types'
import { RefreshLeft, Search } from '@element-plus/icons-vue'
import { useDebounceFn } from '@vueuse/core'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { brandApi, categoryApi, gameApi, seriesApi, tagApi } from '~/apis/game'
import { useGameStore } from '~/stores/gameStore'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()

// --- 1. 核心状态 ---
const loadMoreTrigger = ref<HTMLElement | null>(null)
const games = ref<Game[]>([])
const loading = ref(false)
const hasMore = ref(true)
const isInitialLoad = ref(true)

// 字典数据
const dicts = reactive({
  categories: [] as Category[],
  series: [] as Series[],
  tags: [] as Tag[],
  brands: [] as Brand[],
})

// 筛选条件 (与 URL 参数保持一致)
const filters = reactive<Partial<GameListReq>>({
  page: 1,
  page_size: 24,
  order_by: 'id desc',
  keyword: '',
  tags: [],
  category: undefined,
  series: undefined,
  brand: undefined,
})

// --- 2. 初始化与数据同步 ---

// 初始化：获取字典 + 从 URL 恢复状态
onMounted(async () => {
  // 并行请求字典，不阻塞主列表加载
  Promise.all([
    categoryApi.list().then(res => dicts.categories = res.data),
    seriesApi.list().then(res => dicts.series = res.data.list),
    tagApi.list().then(res => dicts.tags = res.data.list),
    brandApi.list().then(res => dicts.brands = res.data.list),
  ])

  restoreFiltersFromUrl()
  // 立即触发第一次搜索
  await doSearch({ reset: true })

  // 启动无限滚动监听
  setupIntersectionObserver()
})

function restoreFiltersFromUrl() {
  const q = route.query
  if (q.tags)
    filters.tags = Array.isArray(q.tags) ? q.tags.map(Number) : [Number(q.tags)]
  if (q.category)
    filters.category = Number(q.category)
  if (q.series)
    filters.series = Number(q.series)
  if (q.brand)
    filters.brand = Number(q.brand)
  if (q.keyword) {
    filters.keyword = q.keyword as string
    gameStore.searchQuery = q.keyword as string // 同步到 Store
  }
  if (q.order_by)
    filters.order_by = q.order_by as string
}

// --- 3. 搜索核心逻辑 (优化版) ---

/**
 * 执行搜索
 * @param opt.reset 是否重置列表（用于筛选条件变化时），false 则为追加模式
 */
async function doSearch(opt: { reset: boolean } = { reset: false }) {
  if (loading.value)
    return
  loading.value = true

  try {
    if (opt.reset) {
      filters.page = 1
      hasMore.value = true
      // 如果不是初始化，平滑滚动到顶部
      if (!isInitialLoad.value)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // 确保 Store 的关键词同步
    filters.keyword = gameStore.searchQuery

    // 发起请求
    const res = await gameApi.search(filters)
    const list = res.data.list || []

    if (opt.reset) {
      games.value = list
    }
    else {
      games.value.push(...list)
    }

    // 计算是否有更多数据
    hasMore.value = list.length >= (filters.page_size || 24)

    // 页码递增准备下一次
    if (hasMore.value)
      filters.page!++

    // 搜索成功后，静默更新 URL (不刷新页面)
    syncUrl()
  }
  catch (error) {
    console.error('Search failed:', error)
  }
  finally {
    loading.value = false
    isInitialLoad.value = false
    gameStore.searchTrigger = false
  }
}

// 防抖搜索：用于 keyword 输入或筛选变化
// 500ms 内多次变化只会触发一次
const debouncedSearch = useDebounceFn(() => {
  doSearch({ reset: true })
}, 500)

// 更新 URL Query 参数，方便分享
function syncUrl() {
  const query: any = { ...filters }
  // 移除空值和无关字段，保持 URL 干净
  delete query.page
  delete query.page_size
  if (!query.keyword)
    delete query.keyword
  if (!query.category)
    delete query.category
  if (!query.series)
    delete query.series
  if (!query.brand)
    delete query.brand
  if (Array.isArray(query.tags) && query.tags.length === 0)
    delete query.tags

  router.replace({ query })
}

// --- 4. 监听器 ---

// 监听 filters 变化自动搜索
// 注意：排除 page 的变化，因为 page 变化是由 loadMore 触发的，不需要防抖重置
watch(
  () => [filters.category, filters.series, filters.brand, filters.tags],
  () => {
    debouncedSearch()
  },
)

// 监听全局搜索词 (Store)
watch(() => gameStore.searchTrigger, (val) => {
  filters.order_by = gameStore.sortBy
  if (val)
    debouncedSearch()
})

// 监听重置
function resetFilters() {
  filters.tags = []
  filters.category = undefined
  filters.series = undefined
  filters.brand = undefined
  filters.order_by = 'id desc'
  gameStore.searchQuery = ''
  debouncedSearch()
}

// --- 5. 无限滚动 ---
function setupIntersectionObserver() {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasMore.value && !loading.value) {
      // 节流加载更多，防止瞬间多次触发
      doSearch({ reset: false })
    }
  }, { rootMargin: '400px' }) // 提前 400px 预加载，体验更顺滑

  if (loadMoreTrigger.value)
    observer.observe(loadMoreTrigger.value)
}

// 辅助：判断是否有筛选条件处于激活状态
const hasActiveFilters = computed(() => {
  return !!(filters.category || filters.series || filters.brand || filters.tags?.length)
})

function go(id: number) {
  const { href } = router.resolve(`/games/${id}`)
  window.open(href, '_blank')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50/50 pb-10 dark:bg-[#0f1216]">
    <!-- 1. 顶部筛选控制栏 (吸顶) -->
    <div
      class="sticky top-0 z-30 border-b transition-all"
      :class="gameStore.showAdvanced ? 'bg-white/80 dark:bg-[#1a1d21]/90 shadow-sm border-base backdrop-blur-xl' : 'bg-transparent border-transparent'"
    >
      <div v-show="gameStore.showAdvanced" class="mx-auto max-w-[1600px] px-4 py-4 sm:px-6">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <!-- 主要筛选区 (占据较大空间) -->
          <div class="grid col-span-1 grid-cols-2 gap-3 lg:col-span-12 sm:grid-cols-4">
            <!-- 标签 (多选) -->
            <div class="col-span-2 sm:col-span-1">
              <label class="mb-1 block text-[10px] text-gray-400 font-bold tracking-wider uppercase">Tags</label>
              <el-select
                v-model="filters.tags"
                multiple collapse-tags collapse-tags-tooltip
                placeholder="标签筛选"
                class="w-full"
                size="large"
              >
                <el-option v-for="tag in dicts.tags" :key="tag.id" :value="tag.id" :label="tag.name" />
              </el-select>
            </div>

            <!-- 分类 -->
            <div>
              <label class="mb-1 block text-[10px] text-gray-400 font-bold tracking-wider uppercase">Category</label>
              <el-select v-model="filters.category" clearable placeholder="全部分类" class="w-full" size="large">
                <el-option v-for="c in dicts.categories" :key="c.id" :value="c.id" :label="c.name" />
              </el-select>
            </div>

            <!-- 系列 -->
            <div>
              <label class="mb-1 block text-[10px] text-gray-400 font-bold tracking-wider uppercase">Series</label>
              <el-select v-model="filters.series" clearable filterable placeholder="全部系列" class="w-full" size="large">
                <el-option v-for="s in dicts.series" :key="s.id" :value="s.id" :label="s.name" />
              </el-select>
            </div>

            <!-- 开发商 -->
            <div>
              <label class="mb-1 block text-[10px] text-gray-400 font-bold tracking-wider uppercase">Brand</label>
              <el-select v-model="filters.brand" clearable filterable placeholder="全部厂商" class="w-full" size="large">
                <el-option v-for="d in dicts.brands" :key="d.id" :value="d.id" :label="d.name" />
              </el-select>
            </div>
          </div>
        </div>

        <!-- 底部状态行 -->
        <div class="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700/50">
          <div class="flex items-center gap-3 text-xs">
            <span v-if="loading" class="flex items-center gap-1.5 text-blue-500">
              <div class="h-1.5 w-1.5 animate-ping rounded-full bg-blue-500" />
              正在搜索...
            </span>
            <span v-else class="text-gray-500">
              找到 <b class="text-gray-900 dark:text-gray-100">{{ games.length }}</b> 个结果
            </span>

            <!-- 已选条件提示 pill -->
            <transition name="fade">
              <span v-if="hasActiveFilters" class="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-600 dark:bg-blue-500/10">
                Filters Active
              </span>
            </transition>
          </div>

          <button
            v-if="hasActiveFilters"
            class="group flex items-center gap-1.5 text-xs text-gray-400 font-medium transition-colors hover:text-red-500"
            @click="resetFilters"
          >
            <el-icon class="transition-transform group-hover:-rotate-180">
              <RefreshLeft />
            </el-icon>
            清除筛选
          </button>
        </div>
      </div>
    </div>

    <!-- 2. 列表主体 -->
    <div class="mx-auto max-w-[1920px] p-4 lg:p-8 sm:p-6">
      <!-- 骨架屏 (Loading Skeleton) -->
      <transition name="fade" mode="out-in">
        <div v-if="isInitialLoad" key="skeleton" class="grid grid-cols-2 gap-6 2xl:grid-cols-6 lg:grid-cols-4 md:grid-cols-3 xl:grid-cols-5">
          <div v-for="i in 18" :key="i" class="flex flex-col gap-3">
            <div class="aspect-[2/3] w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
            <div class="space-y-2">
              <div class="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              <div class="h-3 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>
        </div>

        <!-- 真实列表 -->
        <div v-else key="list" class="grid grid-cols-2 gap-6 2xl:grid-cols-6 lg:grid-cols-4 md:grid-cols-3 xl:grid-cols-5">
          <!-- 这里使用 TransitionGroup 会导致大量 DOM 时的性能问题，建议直接渲染 -->
          <GameCard
            v-for="game in games"
            :key="game.id"
            :game="game"
            class="transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5"
            @click="go(game.id)"
          />
        </div>
      </transition>

      <!-- 3. 底部状态与触发器 -->
      <div ref="loadMoreTrigger" class="mt-12 flex flex-col items-center justify-center gap-4 py-8">
        <!-- 加载中动画 -->
        <div v-if="loading && !isInitialLoad" class="flex items-center gap-3 border border-gray-100 rounded-full bg-white px-5 py-2 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div class="h-4 w-4 animate-spin border-2 border-blue-500 border-t-transparent rounded-full" />
          <span class="text-sm text-gray-600 font-medium dark:text-gray-300">加载更多数据...</span>
        </div>

        <!-- 到底了 -->
        <div v-else-if="!hasMore && games.length > 0" class="flex items-center gap-4 text-xs text-gray-300 font-medium tracking-widest uppercase">
          <span class="h-px w-12 bg-gray-200 dark:bg-gray-800" />
          End of List
          <span class="h-px w-12 bg-gray-200 dark:bg-gray-800" />
        </div>

        <!-- 空状态 -->
        <div v-else-if="!loading && games.length === 0" class="flex flex-col items-center py-10 opacity-60">
          <div class="mb-4 h-20 w-20 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <el-icon :size="32" class="text-gray-400">
              <Search />
            </el-icon>
          </div>
          <h3 class="text-lg text-gray-700 font-bold dark:text-gray-200">
            没有找到相关游戏
          </h3>
          <p class="text-sm text-gray-500">
            尝试切换筛选条件或更换搜索关键词
          </p>
          <button
            class="mt-4 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-600 font-medium dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20"
            @click="resetFilters"
          >
            清空所有筛选
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Element UI 覆盖样式：让 Select 看起来更干净 */
:deep(.el-input__wrapper) {
  box-shadow: none !important;
  background-color: theme('colors.gray.50') !important;
  border: 1px solid theme('colors.gray.200') !important;
  transition: all 0.2s;
}
:deep(.el-select:hover .el-input__wrapper) {
  border-color: theme('colors.blue.400') !important;
}
:deep(.el-select .el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 1px theme('colors.blue.500') !important;
  border-color: theme('colors.blue.500') !important;
}
/* 暗黑模式适配 */
.dark :deep(.el-input__wrapper) {
  background-color: theme('colors.gray.800') !important;
  border-color: theme('colors.gray.700') !important;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
