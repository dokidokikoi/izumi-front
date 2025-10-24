<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'
import { ElMessage } from 'element-plus'
import { gameApi } from '~/apis/game'
import { loadLanguageAsync } from '~/modules/i18n'
import { useGameStore } from '~/stores/gameStore'

// 移动端侧边栏状态由父组件或全局状态控制
const emit = defineEmits<{
  (e: 'toggleCollapse'): boolean
  (e: 'toggleSidebar'): void
}>()

// i18n
const { locale } = useI18n()

// dark mode
const isDark = useDark()
const toggleDark = useToggle(isDark)

// 切换语言
async function switchLocale() {
  const newLocale = locale.value === 'en' ? 'zh-CN' : 'en'
  await loadLanguageAsync(newLocale)
  locale.value = newLocale
}

const route = useRoute()

// 判断是否在游戏列表页面
const showSearch = computed(() => route.name === '/game/')
const showScraper = computed(() => route.name === '/scrap/')
const showEdit = computed(() => route.name === '/game/[id]')
const showUpdateSetting = computed(() => route.name === '/policy')
const showLogo = computed(() => route.name !== '/')

// 搜索框内容
const searchQuery = ref('')
// 筛选按钮开关
const showSortMenu = ref(false)

// 排序选项
const sortOptions = [
  { label: '按名称排序', value: 'name desc' },
  { label: '按创建时间排序', value: 'id desc' },
]

const gameStore = useGameStore()
function handleEnter(e: KeyboardEvent) {
  gameStore.triggerSearch()
  gameStore.searchQuery = (e.target as HTMLInputElement).value
}

function selectSort(option: string) {
  gameStore.setSort(option)
  showSortMenu.value = false
}

function downloadGameInfo() {
  const id = route.params?.id
  if (typeof id === 'string') {
    gameApi.download(Number(id)).then(() => {
      ElMessage.success('succeeded')
    })
  }
}
</script>

<template>
  <header
    class="flex items-center justify-between bg-white px-6 py-3 shadow-md dark:bg-gray-900"
    un-border="b gray-100 dark:gray-700"
  >
    <!-- 左侧 Logo -->
    <div class="flex items-center gap-2">
      <button icon-btn @click="emit('toggleCollapse')">
        <div i="carbon-list" class="z-20 mr-4 h-6 w-6" />
      </button>

      <img v-show="showLogo" src="/pwa-192x192.png" alt="Logo" class="h-8 w-8">
      <span class="text-1.4rem font-900">Izumi</span>

      <!-- 搜索框（仅在游戏列表页面显示） -->
      <div v-if="showSearch" class="mx-6 max-w-lg flex-1">
        <el-autocomplete
          v-model="searchQuery"
          placeholder="搜索游戏..."
          @keydown.enter="handleEnter"
        />
      </div>
    </div>

    <!-- 右侧功能区 -->
    <div class="flex items-center gap-4">
      <!-- （仅在游戏列表页面显示） -->
      <template v-if="showSearch">
        <!-- 筛选按钮 -->
        <div class="relative">
          <!-- 下拉菜单 -->
          <el-dropdown placement="bottom-start">
            <button icon-btn class="flex items-center" @click="showSortMenu = !showSortMenu">
              <div i="carbon-filter" class="z-20 mr-4 h-6 w-6" />
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="option in sortOptions"
                  :key="option.value"
                  @click="selectSort(option.value)"
                >
                  {{ option.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <!-- 高级搜索 -->
        <button icon-btn class="flex items-center" @click="gameStore.showAdvanced = !gameStore.showAdvanced">
          <div i="carbon-add-alt" class="z-20 mr-4 h-6 w-6" />
        </button>
      </template>

      <template v-if="showScraper">
        <el-select v-model="gameStore.selectScrapResult" placeholder="挂削结果" class="mr-6 w64">
          <el-option v-for="s in gameStore.scrapResults" :key="s" :value="s" />
        </el-select>
        <!-- 刮削 -->
        <button icon-btn class="flex items-center" title="刮削" @click="gameStore.showScraper = !gameStore.showScraper">
          <div i="carbon-download" class="z-20 mr-4 h-6 w-6" />
        </button>
      </template>

      <template v-if="showEdit">
        <!-- 编辑 -->
        <button icon-btn class="flex items-center" title="编辑" @click="gameStore.showEdit = !gameStore.showEdit">
          <div i="carbon-edit" class="z-20 mr-4 h-6 w-6" />
        </button>

        <!-- 下载 -->
        <button icon-btn class="flex items-center" title="下载元数据" @click="downloadGameInfo()">
          <div i="carbon-download" class="z-20 mr-4 h-6 w-6" />
        </button>
      </template>

      <template v-if="showUpdateSetting">
        <!-- 编辑 -->
        <button icon-btn class="flex items-center" title="提交" @click="gameStore.showUpdateSetting = !gameStore.showUpdateSetting">
          <div i="carbon-cloud-upload" class="z-20 mr-4 h-6 w-6" />
        </button>
      </template>

      <!-- 语言切换 -->
      <button
        class="rounded px-2 py-1 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        @click="switchLocale"
      >
        {{ locale === 'en' ? 'EN' : '中文' }}
      </button>

      <!-- 主题切换 -->
      <button
        class="rounded p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        @click="toggleDark()"
      >
        <div v-if="isDark">
          🌙
        </div>
        <div v-else>
          ☀️
        </div>
      </button>

      <!-- 移动端侧边栏按钮 -->
      <button class="p-2 md:hidden" @click="emit('toggleSidebar')">
        ☰
      </button>
    </div>
  </header>
</template>
