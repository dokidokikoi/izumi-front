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

// 执行搜索;opt.reset 为 true 时重置列表(筛选条件变化),否则为追加模式
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
  <div class="min-h-screen from-gray-50 to-gray-100 bg-gradient-to-b pb-16 dark:from-[#0f1216] dark:to-[#14181d]">
    <!-- 1. 顶部筛选控制栏 (吸顶) -->
    <div
      class="sticky top-0 z-30 border-b transition-all"
      :class="gameStore.showAdvanced ? 'bg-white/95 dark:bg-[#1a1d21]/95 shadow-lg border-gray-200/80 dark:border-gray-700/50 backdrop-blur-2xl' : 'bg-transparent border-transparent'"
    >
      <div v-show="gameStore.showAdvanced" class="mx-auto max-w-[1600px] px-4 py-5 sm:px-6">
        <!-- 筛选器网格 -->
        <div class="grid grid-cols-2 mb-5 gap-4 lg:grid-cols-4 xl:grid-cols-5 sm:gap-5">
          <!-- 标签 (多选) - 占据更大空间 -->
          <div class="col-span-2 lg:col-span-2 xl:col-span-2">
            <label class="mb-1.5 block text-[10px] text-gray-400 font-semibold tracking-widest uppercase">
              Tags
            </label>
            <el-select
              v-model="filters.tags"
              multiple collapse-tags collapse-tags-tooltip
              placeholder="选择标签筛选..."
              class="w-full"
              size="large"
            >
              <el-option v-for="tag in dicts.tags" :key="tag.id" :value="tag.id" :label="tag.name" />
            </el-select>
          </div>

          <!-- 分类 -->
          <div>
            <label class="mb-1.5 block text-[10px] text-gray-400 font-semibold tracking-widest uppercase">
              Category
            </label>
            <el-select v-model="filters.category" clearable placeholder="全部分类" class="w-full" size="large">
              <el-option v-for="c in dicts.categories" :key="c.id" :value="c.id" :label="c.name" />
            </el-select>
          </div>

          <!-- 系列 -->
          <div>
            <label class="mb-1.5 block text-[10px] text-gray-400 font-semibold tracking-widest uppercase">
              Series
            </label>
            <el-select v-model="filters.series" clearable filterable placeholder="全部系列" class="w-full" size="large">
              <el-option v-for="s in dicts.series" :key="s.id" :value="s.id" :label="s.name" />
            </el-select>
          </div>

          <!-- 开发商 -->
          <div>
            <label class="mb-1.5 block text-[10px] text-gray-400 font-semibold tracking-widest uppercase">
              Brand
            </label>
            <el-select v-model="filters.brand" clearable filterable placeholder="全部厂商" class="w-full" size="large">
              <el-option v-for="d in dicts.brands" :key="d.id" :value="d.id" :label="d.name" />
            </el-select>
          </div>
        </div>

        <!-- 底部状态行 -->
        <div class="flex items-center justify-between border-t border-gray-100/50 pt-4 dark:border-gray-700/30">
          <div class="flex items-center gap-4">
            <!-- 加载状态 -->
            <transition name="fade">
              <span v-if="loading" class="flex items-center gap-2 text-sm text-blue-600 font-medium dark:text-blue-400">
                <div class="relative h-3 w-3">
                  <div class="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-75" />
                  <div class="absolute inset-0 rounded-full bg-blue-500" />
                </div>
                正在搜索...
              </span>
            </transition>

            <!-- 结果计数 -->
            <transition name="fade">
              <span v-if="!loading" class="text-sm text-gray-500 dark:text-gray-400">
                <span class="text-gray-800 font-semibold dark:text-gray-200">{{ games.length }}</span>
                <span class="mx-1 text-gray-300">/</span>
                个结果
              </span>
            </transition>

            <!-- 已选条件徽章 -->
            <transition name="scale-in">
              <span v-if="hasActiveFilters" class="inline-flex items-center gap-1.5 rounded-full from-blue-50 to-indigo-50 bg-gradient-to-r px-3 py-1 text-[11px] text-blue-700 font-medium ring-1 ring-blue-200 dark:from-blue-500/10 dark:to-indigo-500/10 dark:text-blue-300 dark:ring-blue-500/30">
                <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd" />
                </svg>
                已启用筛选
              </span>
            </transition>
          </div>

          <!-- 清除按钮 -->
          <transition name="slide-up">
            <button
              v-if="hasActiveFilters"
              class="group flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-gray-500 font-medium transition-all hover:bg-red-50 dark:text-gray-400 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
              @click="resetFilters"
            >
              <el-icon class="transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-180">
                <RefreshLeft />
              </el-icon>
              清除筛选
            </button>
          </transition>
        </div>
      </div>
    </div>

    <!-- 2. 列表主体 -->
    <div class="mx-auto max-w-[1920px] px-4 py-8 lg:px-8 lg:py-10 sm:px-6 sm:py-6">
      <!-- 骨架屏 (Loading Skeleton) -->
      <transition name="fade" mode="out-in">
        <div v-if="isInitialLoad" key="skeleton" class="grid grid-cols-2 gap-4 2xl:grid-cols-6 lg:grid-cols-4 md:grid-cols-3 xl:grid-cols-5 2xl:gap-5 sm:gap-5">
          <div v-for="i in 18" :key="i" class="flex flex-col gap-3">
            <div class="aspect-[9/12] w-full animate-pulse rounded-2xl from-gray-200 to-gray-300 bg-gradient-to-br dark:from-gray-800 dark:to-gray-700" />
            <div class="space-y-2">
              <div class="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              <div class="h-3 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>
        </div>

        <!-- 真实列表 -->
        <div v-else key="list" class="grid grid-cols-2 gap-4 2xl:grid-cols-6 lg:grid-cols-4 md:grid-cols-3 xl:grid-cols-5 2xl:gap-5 sm:gap-5">
          <GameCard
            v-for="game in games"
            :key="game.id"
            :game="game"
            class="group/card"
            @click="go(game.id)"
          />
        </div>
      </transition>

      <!-- 3. 底部状态与触发器 -->
      <div ref="loadMoreTrigger" class="mt-16 flex flex-col items-center justify-center gap-6 py-10">
        <!-- 加载中动画 -->
        <div v-if="loading && !isInitialLoad" class="dark:to-gray-850 flex items-center gap-3 rounded-full from-blue-50 to-indigo-50 bg-gradient-to-r px-6 py-3 shadow-blue-500/10 shadow-lg ring-1 ring-blue-100 dark:from-gray-800 dark:ring-gray-700">
          <div class="relative h-5 w-5">
            <div class="absolute inset-0 animate-spin border-2 border-blue-500/30 rounded-full" />
            <div class="absolute inset-0 animate-spin border-2 border-transparent border-t-blue-500 rounded-full" />
          </div>
          <span class="text-sm text-gray-700 font-medium dark:text-gray-300">加载更多游戏...</span>
        </div>

        <!-- 到底了 -->
        <div v-else-if="!hasMore && games.length > 0" class="flex items-center gap-5 text-xs text-gray-400 tracking-[0.2em] uppercase dark:text-gray-600">
          <span class="h-px w-16 from-transparent to-gray-300 bg-gradient-to-r dark:to-gray-700" />
          <span class="font-medium">已到底部</span>
          <span class="h-px w-16 from-transparent to-gray-300 bg-gradient-to-l dark:to-gray-700" />
        </div>

        <!-- 空状态 -->
        <div v-else-if="!loading && games.length === 0" class="flex flex-col items-center py-16">
          <div class="relative mb-6">
            <div class="absolute inset-0 animate-pulse rounded-full bg-blue-500/10 blur-2xl" />
            <div class="relative h-24 w-24 flex items-center justify-center rounded-full from-gray-100 to-gray-200 bg-gradient-to-br shadow-xl dark:from-gray-800 dark:to-gray-700">
              <el-icon :size="40" class="text-gray-400 dark:text-gray-500">
                <Search />
              </el-icon>
            </div>
          </div>
          <h3 class="mb-2 text-xl text-gray-800 font-bold dark:text-gray-100">
            没有找到相关游戏
          </h3>
          <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
            尝试切换筛选条件或更换搜索关键词
          </p>
          <button
            class="group inline-flex items-center gap-2 rounded-xl from-blue-500 to-indigo-500 bg-gradient-to-r px-6 py-2.5 text-sm text-white font-semibold shadow-blue-500/25 shadow-lg transition-all hover:scale-105 hover:shadow-blue-500/30 hover:shadow-xl"
            @click="resetFilters"
          >
            <el-icon class="transition-transform group-hover:-rotate-180">
              <RefreshLeft />
            </el-icon>
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
  border-radius: 0.75rem !important;
  transition: all 0.2s ease;
  padding: 0.5rem 0.75rem !important;
}

:deep(.el-select:hover .el-input__wrapper) {
  border-color: theme('colors.blue.400') !important;
  background-color: theme('colors.gray.100') !important;
}

:deep(.el-select .el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
  border-color: theme('colors.blue.500') !important;
  background-color: white !important;
}

:deep(.el-input__inner) {
  font-size: 0.875rem;
  font-weight: 500;
  color: theme('colors.gray.700');
}

:deep(.el-select__placeholder) {
  color: theme('colors.gray.400');
  font-weight: 400;
}

/* 暗黑模式适配 */
.dark :deep(.el-input__wrapper) {
  background-color: theme('colors.gray.800') !important;
  border-color: theme('colors.gray.700') !important;
}

.dark :deep(.el-select:hover .el-input__wrapper) {
  border-color: theme('colors.blue.500') !important;
  background-color: theme('colors.gray.700') !important;
}

.dark :deep(.el-select .el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2) !important;
  border-color: theme('colors.blue.400') !important;
  background-color: theme('colors.gray.900') !important;
}

.dark :deep(.el-input__inner) {
  color: theme('colors.gray.200');
}

.dark :deep(.el-select__placeholder) {
  color: theme('colors.gray.500');
}

/* 下拉菜单样式 */
:deep(.el-select-dropdown__item) {
  border-radius: 0.5rem;
  margin: 0.125rem 0.5rem;
  transition: all 0.15s ease;
}

:deep(.el-select-dropdown__item:hover) {
  background-color: theme('colors.blue.50');
}

:deep(.el-select-dropdown__item.is-selected) {
  background-color: theme('colors.blue.500');
  color: white;
  font-weight: 500;
}

.dark :deep(.el-select-dropdown__item:hover) {
  background-color: rgba(59, 130, 246, 0.15);
}

.dark :deep(.el-select-dropdown__item.is-selected) {
  background-color: theme('colors.blue.600');
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-in-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.scale-in-leave-active {
  transition: all 0.2s ease-in;
}

.scale-in-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.scale-in-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.25s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
