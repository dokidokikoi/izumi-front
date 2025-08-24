<script setup lang="ts">
import { useGameStore } from '~/stores/gameStore'

const gameStore = useGameStore()
const loadMoreTrigger = ref<HTMLElement | null>(null)

const allGames = [
  {
    id: 1,
    cover: 'https://picsum.photos/400/200?random=1',
    name: 'Elden Ring',
    createdAt: '2022-02-25',
    type: 'RPG',
    tags: ['开放世界', '魂系', '冒险'],
    publisher: 'FromSoftware',
    inLibrary: true,
  },
  {
    id: 2,
    cover: '//img.dlsite.jp/modpub/images2/work/professional/VJ014000/VJ013965_img_main.jpg',
    name: 'Cyberpunk 2077',
    createdAt: '2020-12-10',
    type: '动作角色扮演',
    tags: ['科幻', '开放世界', '射击'],
    publisher: 'CD Projekt',
    inLibrary: false,
  },
  {
    id: 3,
    cover: 'https://picsum.photos/400/200?random=3',
    name: 'Genshin Impact',
    createdAt: '2020-09-28',
    type: '动作角色扮演',
    tags: ['二次元', '抽卡', '开放世界'],
    publisher: 'miHoYo',
    inLibrary: true,
  },
  {
    id: 4,
    cover: 'https://picsum.photos/400/200?random=4',
    name: 'Baldur’s Gate 3',
    createdAt: '2023-08-03',
    type: 'RPG',
    tags: ['回合制', 'DND', '多人'],
    publisher: 'Larian Studios',
    inLibrary: false,
  },
  {
    id: 1,
    cover: 'https://picsum.photos/400/200?random=1',
    name: 'Elden Ring',
    createdAt: '2022-02-25',
    type: 'RPG',
    tags: ['开放世界', '魂系', '冒险'],
    publisher: 'FromSoftware',
    inLibrary: true,
  },
  {
    id: 2,
    cover: '//img.dlsite.jp/modpub/images2/work/professional/VJ014000/VJ013965_img_main.jpg',
    name: 'Cyberpunk 2077',
    createdAt: '2020-12-10',
    type: '动作角色扮演',
    tags: ['科幻', '开放世界', '射击'],
    publisher: 'CD Projekt',
    inLibrary: false,
  },
  {
    id: 3,
    cover: 'https://picsum.photos/400/200?random=3',
    name: 'Genshin Impact',
    createdAt: '2020-09-28',
    type: '动作角色扮演',
    tags: ['二次元', '抽卡', '开放世界'],
    publisher: 'miHoYo',
    inLibrary: true,
  },
  {
    id: 4,
    cover: 'https://picsum.photos/400/200?random=4',
    name: 'Baldur’s Gate 3',
    createdAt: '2023-08-03',
    type: 'RPG',
    tags: ['回合制', 'DND', '多人'],
    publisher: 'Larian Studios',
    inLibrary: false,
  },
  {
    id: 1,
    cover: 'https://picsum.photos/400/200?random=1',
    name: 'Elden Ring',
    createdAt: '2022-02-25',
    type: 'RPG',
    tags: ['开放世界', '魂系', '冒险'],
    publisher: 'FromSoftware',
    inLibrary: true,
  },
  {
    id: 2,
    cover: '//img.dlsite.jp/modpub/images2/work/professional/VJ014000/VJ013965_img_main.jpg',
    name: 'Cyberpunk 2077',
    createdAt: '2020-12-10',
    type: '动作角色扮演',
    tags: ['科幻', '开放世界', '射击'],
    publisher: 'CD Projekt',
    inLibrary: false,
  },
  {
    id: 3,
    cover: 'https://picsum.photos/400/200?random=3',
    name: 'Genshin Impact',
    createdAt: '2020-09-28',
    type: '动作角色扮演',
    tags: ['二次元', '抽卡', '开放世界'],
    publisher: 'miHoYo',
    inLibrary: true,
  },
  {
    id: 4,
    cover: 'https://picsum.photos/400/200?random=4',
    name: 'Baldur’s Gate 3',
    createdAt: '2023-08-03',
    type: 'RPG',
    tags: ['回合制', 'DND', '多人'],
    publisher: 'Larian Studios',
    inLibrary: false,
  },
  {
    id: 1,
    cover: 'https://picsum.photos/400/200?random=1',
    name: 'Elden Ring',
    createdAt: '2022-02-25',
    type: 'RPG',
    tags: ['开放世界', '魂系', '冒险'],
    publisher: 'FromSoftware',
    inLibrary: true,
  },
  {
    id: 2,
    cover: '//img.dlsite.jp/modpub/images2/work/professional/VJ014000/VJ013965_img_main.jpg',
    name: 'Cyberpunk 2077',
    createdAt: '2020-12-10',
    type: '动作角色扮演',
    tags: ['科幻', '开放世界', '射击'],
    publisher: 'CD Projekt',
    inLibrary: false,
  },
  {
    id: 3,
    cover: 'https://picsum.photos/400/200?random=3',
    name: 'Genshin Impact',
    createdAt: '2020-09-28',
    type: '动作角色扮演',
    tags: ['二次元', '抽卡', '开放世界'],
    publisher: 'miHoYo',
    inLibrary: true,
  },
  {
    id: 4,
    cover: 'https://picsum.photos/400/200?random=4',
    name: 'Baldur’s Gate 3',
    createdAt: '2023-08-03',
    type: 'RPG',
    tags: ['回合制', 'DND', '多人'],
    publisher: 'Larian Studios',
    inLibrary: false,
  },
]
const games = ref(allGames)

const loading = ref(false)
const hasMore = ref(true)

// 高级搜索字段
const filters = ref({
  tags: '',
  series: '',
  category: '',
  developer: '',
})

// 假装有下拉选项（实际可以从API获取）
const tagOptions = ['动作', '冒险', 'RPG', '开放世界']
const seriesOptions = ['塞尔达', '魂系列', '最终幻想']
const categoryOptions = reactive([
  { id: 1, name: '动作', selected: false },
  { id: 2, name: '角色扮演', selected: false },
  { id: 3, name: '策略', selected: false },
  { id: 4, name: '休闲', selected: false },
  { id: 1, name: '动作', selected: false },
  { id: 2, name: '角色扮演', selected: false },
  { id: 3, name: '策略', selected: false },
  { id: 4, name: '休闲', selected: false },
  { id: 1, name: '动作', selected: false },
  { id: 2, name: '角色扮演', selected: false },
  { id: 3, name: '策略', selected: false },
  { id: 4, name: '休闲', selected: false },
])
const developerOptions = ['Nintendo', 'FromSoftware', 'Square Enix']

// 搜索方法（可以替换成 API 调用）
function searchGames(query: string) {
  loading.value = true
  games.value = allGames.filter(game =>
    game.name.includes(query),
  )
  gameStore.searchTrigger = false
  setTimeout(() => {
    loading.value = false
    games.value.push(...[
      {
        id: 1,
        cover: 'https://picsum.photos/400/200?random=1',
        name: 'Elden Ring',
        createdAt: '2022-02-25',
        type: 'RPG',
        tags: ['开放世界', '魂系', '冒险'],
        publisher: 'FromSoftware',
        inLibrary: true,
      },
      {
        id: 2,
        cover: '//img.dlsite.jp/modpub/images2/work/professional/VJ014000/VJ013965_img_main.jpg',
        name: 'Cyberpunk 2077',
        createdAt: '2020-12-10',
        type: '动作角色扮演',
        tags: ['科幻', '开放世界', '射击'],
        publisher: 'CD Projekt',
        inLibrary: false,
      },
      {
        id: 3,
        cover: 'https://picsum.photos/400/200?random=3',
        name: 'Genshin Impact',
        createdAt: '2020-09-28',
        type: '动作角色扮演',
        tags: ['二次元', '抽卡', '开放世界'],
        publisher: 'miHoYo',
        inLibrary: true,
      },
      {
        id: 4,
        cover: 'https://picsum.photos/400/200?random=4',
        name: 'Baldur’s Gate 3',
        createdAt: '2023-08-03',
        type: 'RPG',
        tags: ['回合制', 'DND', '多人'],
        publisher: 'Larian Studios',
        inLibrary: false,
      },
    ])
  }, 1000)
}

// 监听 searchTrigger，每次 +1 就执行搜索
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
        searchGames(gameStore.searchQuery)
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
</script>

<template>
  <!-- 高级搜索面板 -->
  <transition name="fade">
    <div
      v-if="gameStore.showAdvanced"
      class="mt-6 border rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800"
    >
      <!-- 分类 -->
      <div class="flex items-center">
        <span class="w-20 font-medium">类别：</span>
        <div class="flex flex-1 flex-wrap gap-2">
          <button
            v-for="cat in categoryOptions"
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
      </div>
      <div
        class="grid grid-cols-2 mb-4 gap-3 pt4 md:grid-cols-3"
      >
        <!-- 标签 -->
        <div class="flex items-center">
          <span class="w-20 font-medium">标签: </span>
          <select v-model="filters.tags" class="w-full border rounded px-2 py-1">
            <option value="">
              全部
            </option>
            <option v-for="tag in tagOptions" :key="tag" :value="tag">
              {{ tag }}
            </option>
          </select>
        </div>

        <!-- 系列 -->
        <div class="flex items-center">
          <span class="w-20 font-medium">系列: </span>
          <select v-model="filters.series" class="w-full border rounded px-2 py-1">
            <option value="">
              全部
            </option>
            <option v-for="s in seriesOptions" :key="s" :value="s">
              {{ s }}
            </option>
          </select>
        </div>

        <!-- 开发商 -->
        <div class="flex items-center">
          <span class="w-20 font-medium">开发商: </span>
          <select v-model="filters.developer" class="w-full border rounded px-2 py-1">
            <option value="">
              全部
            </option>
            <option v-for="d in developerOptions" :key="d" :value="d">
              {{ d }}
            </option>
          </select>
        </div>
      </div>
    </div>
  </transition>

  <div
    class="<!-- 默认手机：1列 <!-- ≥640px 平板：2列 <!-- ≥768px 中屏：3列 <!-- ≥1024px 大屏：4列 <!-- ≥1280px 超大屏：5列 <!-- ≥1536px 超宽屏：6列 3xl:grid-cols-8 <!-- ≥1536px 超宽屏：8列 --> --> --> --> --> --> --> grid grid-cols-1 gap-6 p-4 2xl:grid-cols-7 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 xl:grid-cols-5"
  >
    <GameCard v-for="game in games" :key="game.id" :game="game" />
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
