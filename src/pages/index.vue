<script setup lang="ts">
import type { Series } from '~/types'
import { gameApi, seriesApi } from '~/apis/game'

defineOptions({
  name: 'IndexPage',
})

const router = useRouter()
const { t } = useI18n()

useHead({
  title: () => t('button.home'),
})

// --- 模拟数据 (后续可替换为 API 请求) ---
const stats = ref([
  { label: '库游戏数', value: 0, sub: '刮削游戏数', icon: 'i-carbon-game-console', color: 'text-primary', bgColor: 'bg-primary' },
  { label: '本地游戏数', value: 0, sub: '已下载/保存', icon: 'i-carbon-vmdk-disk', color: 'text-success', bgColor: 'bg-success' },
  { label: '标签总数', value: 0, sub: '全部分类标签', icon: 'i-carbon-tag', color: 'text-warning', bgColor: 'bg-warning' },
  { label: '活跃标签', value: 0, sub: '已关联游戏', icon: 'i-carbon-bookmark-filled', color: 'text-error', bgColor: 'bg-error' },
])

gameApi.panel().then((res) => {
  stats.value[0].value = res.data.games
  stats.value[1].value = res.data.local_games
  stats.value[2].value = res.data.tags
  stats.value[3].value = res.data.used_tags
})

const seriesList = ref<Series[]>([])
const pageSize = ref(10)
function getSeries() {
  seriesApi.list(1, pageSize.value).then((res) => {
    seriesList.value = res.data.list
  })
}
function toggleSeries() {
  pageSize.value = pageSize.value === 0 ? 10 : 0
  getSeries()
}
getSeries()

const playLists = [
  { name: '周末必玩', status: 'Active', date: '2h ago' },
  { name: 'JRPG 补完计划', status: 'Paused', date: '1d ago' },
  { name: '恐怖游戏合集', status: 'Active', date: '3d ago' },
  { name: '合家欢', status: 'Done', date: '1w ago' },
]

function go(seriesId: number) {
  const { href } = router.resolve(`/games?series=${seriesId}`)
  window.open(href, '_blank')
}
</script>

<template>
  <!-- 外层容器：限制最大宽度，居中，使用主题背景色 -->
  <div class="min-h-full w-full p-6 text-main lg:p-10">
    <!-- 1. 头部区域 (Hero Section) -->
    <div class="mb-10 flex flex-col items-center gap-4 md:flex-row md:items-start">
      <img src="/pwa-512x512.png" alt="Logo" class="h-20 w-20 rounded-xl shadow-sm transition hover:scale-105">
      <div class="text-center md:text-left">
        <h1 class="text-3xl font-bold tracking-tight">
          Game Library
        </h1>
        <p class="mt-1 text-muted">
          欢迎回来，这里是你的游戏数据管理中心。
        </p>
      </div>
    </div>

    <!-- 2. 统计卡片区域 (Stats Grid) -->
    <!-- 使用 grid 布局，自动适配屏幕宽度 -->
    <div class="grid grid-cols-1 mb-10 gap-6 lg:grid-cols-4 sm:grid-cols-2">
      <div
        v-for="item in stats"
        :key="item.label"
        class="group relative overflow-hidden border border-base rounded-xl bg-card p-6 shadow-sm transition duration-300 hover:shadow-md hover:-translate-y-1"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-muted font-medium">
              {{ item.label }}
            </p>
            <p class="mt-2 text-3xl font-extrabold tracking-tight">
              {{ item.value }}
            </p>
            <p class="mt-1 text-xs text-faint">
              {{ item.sub }}
            </p>
          </div>
          <!-- 图标背景装饰 -->
          <div :class="`rounded-lg p-3 bg-opacity-10 ${item.bgColor}`">
            <div :class="`${item.icon} text-2xl ${item.color}`" />
          </div>
        </div>
      </div>
    </div>

    <!-- 分割线 (可选，如果觉得卡片间距够大也可以去掉) -->
    <!-- <div class="h-px w-full bg-border-base mb-10 opacity-50" /> -->

    <!-- 3. 内容列表区域 (Content Grid) -->
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <!-- 左侧：游戏系列 (占 2/3 宽度或 1/3 取决于需求，这里设为 2:1 比例的左侧示例) -->
      <div class="col-span-1 border border-base rounded-xl bg-card shadow-sm lg:col-span-2">
        <div class="flex items-center justify-between border-b border-base px-6 py-4">
          <h3 class="flex items-center gap-2 text-lg font-semibold">
            <div i-carbon-list class="text-primary" />
            游戏系列
          </h3>
          <button class="text-xs text-primary transition hover:text-hover" @click="toggleSeries">
            <span v-if="pageSize">
              View All
            </span>
            <span v-else>
              Limited
            </span>
          </button>
        </div>
        <ul class="p-2">
          <li
            v-for="(series, idx) in seriesList"
            :key="idx"
            class="group flex cursor-pointer items-center justify-between rounded-lg p-3 transition hover:bg-page"
            @click="go(series.id)"
          >
            <div class="flex items-center gap-3">
              <div class="h-8 w-8 flex items-center justify-center rounded bg-input text-sm text-muted font-bold transition group-hover:bg-primary group-hover:text-white">
                {{ idx + 1 }}
              </div>
              <span class="font-medium">{{ series.name }}</span>
            </div>
            <span class="border border-base rounded-full bg-input px-2.5 py-0.5 text-xs text-muted">
              {{ series.games }} games
            </span>
          </li>
        </ul>
      </div>

      <!-- 右侧：最近游玩列表 -->
      <div class="col-span-1 border border-base rounded-xl bg-card shadow-sm">
        <div class="flex items-center justify-between border-b border-base px-6 py-4">
          <h3 class="flex items-center gap-2 text-lg font-semibold">
            <div i-carbon-play-filled class="text-success" />
            游玩列表
          </h3>
        </div>
        <ul class="divide-y divide-base">
          <li
            v-for="(list, idx) in playLists"
            :key="idx"
            class="flex items-center justify-between p-4 transition hover:bg-page"
          >
            <div>
              <p class="text-sm font-medium">
                {{ list.name }}
              </p>
              <!-- <p class="mt-0.5 text-xs text-muted">
                {{ list.date }}
              </p> -->
            </div>
            <div
              class="h-2 w-2 rounded-full"
              :class="list.status === 'Active' ? 'bg-success' : list.status === 'Paused' ? 'bg-warning' : 'bg-muted'"
              :title="list.status"
            />
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 如果需要微调某些特定样式 */
</style>

<route lang="yaml">
meta:
  layout: default
</route>
