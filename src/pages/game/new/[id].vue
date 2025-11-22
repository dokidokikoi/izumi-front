<script setup lang="ts">
// 导入你的类型和API
import type { Brand, Category, Character, Game, GameInstance, Series, Tag } from '~/types'
import {
  Camera,
  Clock,
  Compass,
  Connection,
  Delete,
  Female,
  Folder,
  FolderOpened,
  Guide,
  Male,
  Monitor,
  More,
  OfficeBuilding,
  Plus,
  Star,
} from '@element-plus/icons-vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { brandApi, categoryApi, gameApi, seriesApi, tagApi } from '~/apis/game'
import { genderEnum, languageEnum, platformEnum, roleEnum } from '~/config/enum'
import { iconMap } from '~/config/icon'
import { useGameStore } from '~/stores/gameStore'
import { imageUrl } from '~/utils/image'

const route = useRoute()
const gameStore = useGameStore()
const { t } = useI18n()

// --- 核心数据 ---
const gameId = computed(() => (route.params as { id: number }).id)
const game = ref<Partial<Game>>({})
const gameIns = ref<GameInstance[]>([])

// --- 编辑状态数据 ---
const editGame = ref<Partial<Game>>({})
const editGameIns = ref<GameInstance[]>([])
const createGameIns = ref<Partial<GameInstance>>({ game_id: Number(gameId.value) })
const gameInsIdx = ref<number>(0)
const editGameInsIdx = ref<number>(0)
const editGameCharacterIdx = ref<number>(0)

// --- 字典数据 ---
const categories = ref<Category[]>([])
const series = ref<Series[]>([])
const tags = ref<Tag[]>([])
const brands = ref<Brand[]>([])
const languages = ref<string[]>([])
const platforms = ref<string[]>([])

// --- UI 状态控制 ---
const activeTab = ref('角色')
const tabs = ['角色', '图片集', '参与成员', '相关链接', '其他信息']
const isStoryExpanded = ref(false)
const isTagsExpanded = ref(false)
const TAG_LIMIT = 50
const showUpdate = ref(false)
const showAddGameIns = ref(false)

// --- 辅助变量 ---
const createCategoryID = ref<number>(0)
const createBrandID = ref(0)
const showAddAlias = ref(false)
const createAlias = ref('')
const createSeriesID = ref(0)
const showAddTag = ref(false)
const createTag = ref('')
const createTagID = ref(0)
const showCharacterEdit = ref(false)

// --- 初始化逻辑 ---
function getGame() {
  gameApi.get(gameId.value).then((res) => {
    game.value = res.data
    gameStore.gameName = game.value.name ? game.value.name : ''
    editGame.value = JSON.parse(JSON.stringify(res.data))
    if (res.data.category) {
      createCategoryID.value = res.data.category.id
    }
  })
}

function getIns() {
  gameApi.getIns(gameId.value).then((res) => {
    gameIns.value = res.data
    editGameIns.value = JSON.parse(JSON.stringify(res.data))
    platforms.value = []
    languages.value = []
    for (const ins of res.data) {
      if (ins.platform) {
        for (const plat of ins.platform) {
          if (!platforms.value.find(p => p === plat))
            platforms.value.push(plat)
        }
      }
      if (ins.language) {
        for (const lang of ins.language) {
          if (!languages.value.find(l => l === lang))
            languages.value.push(lang)
        }
      }
    }
  })
}

function getBrands() {
  return brandApi.list().then((res) => {
    brands.value = res.data.list
  })
}

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

function initData() {
  getCategories()
  getSeries()
  getTags()
  getBrands()
}

onMounted(() => {
  getGame()
  getIns()
  initData()
})

// --- 更新逻辑 ---
async function updateGame() {
  for (const ins of editGameIns.value) {
    await gameApi.updateGameIns(ins)
  }
  getIns()
  gameApi.update(editGame.value).then(() => {
    showUpdate.value = false
    game.value = JSON.parse(JSON.stringify(editGame.value))
    getGame()
  }).finally(() => {
    gameStore.showEdit = false
  })
}

function addGameIns() {
  gameApi.createGameIns(createGameIns.value).then(() => {
    createGameIns.value = {}
    getIns()
    showAddGameIns.value = false
  })
}

// --- 标签/品牌/系列/别名 操作逻辑 ---
function appendAlias() {
  if (!editGame.value.alias)
    editGame.value.alias = []

  if (createAlias.value) {
    editGame.value.alias.push(createAlias.value)
    createAlias.value = ''
    showAddAlias.value = false
  }
}

// 游戏发行商
const createBrand = ref<string>('')
const showAddBrand = ref(false)
function appendBrand(d: string | undefined) {
  if (!d) {
    return
  }
  brandApi.create(d).then((res) => {
    getBrands().then(() => {
      brands.value.forEach((d) => {
        if (d.id === res.data) {
          if (!editGame.value.brands) {
            editGame.value.brands = [d]
          }
          editGame.value.brands.push(d)
        }
      })
    })
  })
}
// 监听 createBrandID
watch(createBrandID, (newVal) => {
  if (newVal) {
    if (!editGame.value.brands)
      editGame.value.brands = []
    if (!editGame.value.brands.find(b => b.id === newVal)) {
      const b = brands.value.find(b => b.id === newVal)
      if (b)
        editGame.value.brands.push(b)
    }
    createBrandID.value = 0
  }
})

// 分类
const createCategory = ref<string>('')
const showCategory = ref(false)
function appendCategory(category: string | undefined) {
  if (!category) {
    return
  }
  categoryApi.create(category).then((res) => {
    getCategories().then(() => {
      categories.value.forEach((category) => {
        if (category.id === res.data) {
          editGame.value.category = category
          createCategoryID.value = res.data
        }
      })
    })
  })
}
// 监听 createCategoryID
watch(
  () => createCategoryID.value,
  (newVal) => {
    if (newVal) {
      editGame.value.category = categories.value.find(category => category.id === newVal)
    }
  },
)
watch(createCategoryID, (newVal) => {
  if (newVal)
    editGame.value.category = categories.value.find(c => c.id === newVal)
})

// 游戏系列
const createSeries = ref<string>('')
const showAddSeries = ref(false)
function appendSeries(s: string | undefined) {
  if (!s) {
    return
  }
  if (!editGame.value.series) {
    editGame.value.series = []
  }
  seriesApi.create(s).then((res) => {
    getSeries().then(() => {
      series.value.forEach((s) => {
        if (s.id === res.data) {
          editGame.value.series?.push(s)
        }
      })
    })
  })
}
// 监听 createSeriesID
watch(createSeriesID, (newVal) => {
  if (newVal) {
    if (!editGame.value.series)
      editGame.value.series = []
    if (!editGame.value.series.find(s => s.id === newVal)) {
      const s = series.value.find(item => item.id === newVal)
      if (s)
        editGame.value.series.push(s)
    }
    createSeriesID.value = 0
  }
})

function removeTag(tagName: string) {
  editGame.value.tags = editGame.value.tags?.filter(t => t.name !== tagName)
}

function appendTag(t: string | undefined) {
  if (!t) {
    showAddTag.value = false
    return
  }
  tagApi.create(t).then((res) => {
    tagApi.list().then((r) => {
      tags.value = r.data.list
      const tag = tags.value.find(item => item.id === res.data)
      if (tag) {
        if (!editGame.value.tags)
          editGame.value.tags = []
        editGame.value.tags.push(tag)
      }
    })
  }).finally(() => {
    showAddTag.value = false
  })
}

watch(createTagID, (newVal) => {
  if (newVal) {
    if (!editGame.value.tags)
      editGame.value.tags = []
    if (!editGame.value.tags.find(t => t.id === newVal)) {
      const t = tags.value.find(item => item.id === newVal)
      if (t)
        editGame.value.tags.push(t)
    }
    createTagID.value = 0
  }
})

// --- 角色/Staff 操作逻辑 ---
// 游戏角色
const showCharacterAddAlias = ref(false)
const createCharacterAlias = ref('')
// const searchCharacterLoading = ref(false)
function removeCharacterAlias(idx: number, alias: string) {
  if (!editGame.value.characters || !editGame.value.characters[idx].alias) {
    return
  }
  editGame.value.characters[idx].alias = editGame.value.characters[idx].alias.filter(a => a !== alias)
}
function appendCharacterAlias(idx: number, alias: string) {
  if (!editGame.value.characters) {
    showCharacterAddAlias.value = false
    return
  }
  if (!editGame.value.characters[idx].alias) {
    editGame.value.characters[idx].alias = []
  }
  editGame.value.characters[idx].alias.push(alias)
  showCharacterAddAlias.value = false
}
function addCharacter() {
  if (!editGame.value.characters)
    editGame.value.characters = []
  editGame.value.characters.unshift({
    id: 0,
    name: '',
    alias: [],
    cover: '',
    images: [],
    tags: [],
    summary: '',
    gender: '',
    relation: '',
    cv: { id: 0, name: '', alias: [], cover: '', images: [], tags: [], summary: '', gender: '', relation: [], created_at: '', updated_at: '' },
    games: [],
    created_at: '',
    updated_at: '',
    weight: 1,
    personal_info: {},
  })
  activeTab.value = '角色'
}
// 上传角色图片
function handleCharacterImageUploadSuccess(response: any) {
  console.warn('@')
  console.warn(response)
  if (!editGame.value.characters![editGameCharacterIdx.value].images) {
    editGame.value.characters![editGameCharacterIdx.value].images = []
  }
  editGame.value.characters![editGameCharacterIdx.value].images.push(response.data.path)
}
function rmCharacterImage(idx: number, image: string) {
  if (editGame.value.characters![idx].images) {
    editGame.value.characters![idx].images = editGame.value.characters![idx].images.filter(t => t !== image)
  }
}

function addStaff() {
  if (!editGame.value.staff)
    editGame.value.staff = []
  editGame.value.staff.unshift({
    id: 0,
    name: '',
    alias: [],
    cover: '',
    images: [],
    tags: [],
    summary: '',
    gender: '',
    relation: [],
    created_at: '',
    updated_at: '',
  })
  activeTab.value = '参与成员'
}

// --- 角色详情弹窗控制 ---
const showCharacterModal = ref(false)
const selectedCharacter = ref<Character | null>(null)
function openCharacterDetail(char: Character) {
  selectedCharacter.value = char
  showCharacterModal.value = true
}

// --- 上传相关逻辑 ---
function getUploadUrl() {
  const prefix = import.meta.env.VITE_API_BASE || window.location.origin.concat('/api')
  return prefix.concat('/file/upload')
}

function handleImageUploadSuccess(res: any) {
  if (!editGame.value.images) {
    editGame.value.images = []
  }
  editGame.value.images.unshift(res.data.path)
}

function rmImage(img: string) {
  editGame.value.images = editGame.value.images?.filter(t => t !== img)
}
</script>

<template>
  <!-- 全局容器：相对定位，用于放置背景 -->
  <div class="relative min-h-screen w-full pb-20 text-gray-800 dark:text-gray-100">
    <!-- 1. 沉浸式背景层 (Hero Background) -->
    <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <!-- 背景图：高斯模糊 + 暗色遮罩 -->
      <img
        v-if="game?.cover"
        :src="imageUrl(game.cover)"
        class="h-full w-full scale-110 object-cover opacity-60 blur-3xl dark:opacity-40"
      >
      <div class="absolute inset-0 from-white/30 via-white/80 to-white bg-gradient-to-b dark:from-gray-900/30 dark:via-gray-900/80 dark:to-gray-900" />
    </div>

    <!-- 2. 主要内容区域 (z-index 提升) -->
    <div class="relative z-10 mx-auto max-w-[100rem] px-4 pt-8 lg:px-8 sm:px-6">
      <!-- 核心布局：两栏设计 (移除了 items-start 以实现等高拉伸) -->
      <div class="relative flex flex-col gap-8 md:flex-row">
        <!-- [左栏] 粘性侧边栏容器：负责占位和高度拉伸 -->
        <div class="relative w-full flex-shrink-0 md:w-80">
          <!-- 视觉分割线 (可选) -->
          <div class="absolute bottom-0 top-0 hidden w-px bg-gray-200/50 -right-4 md:block dark:bg-gray-800/50" />

          <!-- 真正的内容层：负责吸顶 (Sticky) -->
          <div class="md:sticky md:top-24 space-y-6">
            <!-- 封面图 -->
            <div class="group relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-gray-200 shadow-2xl ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
              <img
                v-if="!gameStore.showEdit"
                :src="imageUrl(game?.cover)"
                class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              >
              <!-- 编辑模式：更换封面 -->
              <template v-else>
                <img
                  :src="imageUrl(editGame?.cover)"
                  class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                >
                <div class="absolute inset-0 flex flex-col cursor-pointer items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <!-- <input id="cover-uploader" type="file" accept=".jpg, .jpeg, .png" style="display: none;" /> -->
                  <Upload class="absolute top-0 h-full w-full" :action="getUploadUrl()" @success="(data) => { editGame.cover = data.data.path }">
                    <template #content>
                      <div class="flex flex-col items-center">
                        <el-icon :size="32" color="#fff">
                          <Camera />
                        </el-icon>
                        <span class="mt-2 text-white font-bold">更换封面</span>
                        <div i="carbon-trash-can" class="z-20 mt-2 hover:text-red" @click.stop="editGame.cover = game.cover" />
                      </div>
                    </template>
                  </Upload>
                </div>
              </template>
            </div>

            <!-- 快捷按钮组 -->
            <div class="flex gap-3">
              <button class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-white font-bold shadow-blue-500/30 shadow-lg transition active:scale-95 hover:bg-blue-700">
                <el-icon><Monitor /></el-icon> 开始游戏
              </button>
              <button class="flex items-center border border-gray-200 rounded-lg bg-white p-2.5 text-yellow-500 shadow transition active:scale-95 dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                <el-icon :size="20">
                  <Star />
                </el-icon>
              </button>
            </div>

            <!-- 硬核信息表 (Info Table) -->
            <div class="border border-base rounded-xl bg-card p-5 text-sm shadow-sm backdrop-blur-md">
              <h4 class="mb-4 text-xs text-gray-400 font-bold tracking-wider uppercase">
                游戏信息
              </h4>
              <div class="space-y-4">
                <!-- 品牌 -->
                <div class="flex items-center justify-between">
                  <div w-30 flex items-center>
                    <div mr-1 flex items-center rounded-lg bg-gray-100 p-1 dark:bg-gray-800>
                      <el-icon :size="20">
                        <OfficeBuilding color-blue />
                      </el-icon>
                    </div>
                    <span class="text-gray-500 dark:text-gray-400">品牌</span>
                  </div>
                  <div class="ml-4 flex-1 text-right font-medium">
                    <template v-if="!gameStore.showEdit">
                      <span v-for="b in game.brands" :key="b.id" class="block cursor-pointer text-blue-600 dark:text-blue-400 hover:underline">{{ b.name }}</span>
                    </template>
                    <div v-else class="flex flex-1 flex-wrap items-center">
                      <div>
                        <span
                          v-for="(brand, index) in editGame.brands" :key="index"
                          class="mb-1 mr-1 inline-block flex cursor-pointer items-center whitespace-nowrap border border-gray-600 rounded px-2 py-[1px] text-sm dark:border-white"
                        >
                          {{ brand.name }}
                          <button class="ml-1 flex cursor-pointer items-center rounded-full hover:bg-gray-800" @click="editGame.brands?.splice(index, 1)">
                            <div i="carbon-close" class="z-20 h-4 w-4" />
                          </button>
                        </span>
                      </div>
                      <div class="mb-1 flex">
                        <el-select v-model="createBrandID" placeholder="品牌" size="small" :empty-values="[null, undefined, 0]" mr-2 style="width: 130px">
                          <el-option
                            v-for="brand in brands" :key="brand.id"
                            :value="brand.id"
                            :label="brand.name"
                          />
                        </el-select>
                        <button class="flex items-center rounded-full bg-green-500 p1" @click="showAddBrand = true">
                          <div i="carbon-add-large" class="z-20 h-4 w-4" />
                        </button>
                      </div>
                      <input
                        v-if="showAddBrand"
                        v-model="createBrand"
                        type="text"
                        class="mt-0 flex-1 border rounded p-1"
                        placeholder="输入游戏品牌"
                        @keydown.enter="() => { appendBrand(createBrand); showAddBrand = false; createBrand = '' }"
                      >
                    </div>
                  </div>
                </div>
                <!-- 发行日期 -->
                <div class="flex items-center justify-between">
                  <div w-30 flex items-center>
                    <div mr-1 flex items-center rounded-lg bg-gray-100 p-1 dark:bg-gray-800>
                      <el-icon :size="20">
                        <Clock color-blue />
                      </el-icon>
                    </div>
                    <span class="text-gray-500 dark:text-gray-400">发行日期</span>
                  </div>
                  <span v-if="!gameStore.showEdit" class="font-medium">{{ game.issue_date?.slice(0, 10) || '-' }}</span>
                  <el-date-picker v-else v-model="editGame.issue_date" type="date" size="small" style="width: 164px" />
                </div>
                <!-- 分类 -->
                <div class="flex items-center justify-between">
                  <div w-30 flex items-center>
                    <div mr-1 flex items-center rounded-lg bg-gray-100 p-1 dark:bg-gray-800>
                      <el-icon :size="20">
                        <FolderOpened color-blue />
                      </el-icon>
                    </div>
                    <span class="text-gray-500 dark:text-gray-400">分类</span>
                  </div>
                  <span v-if="!gameStore.showEdit" class="font-medium">{{ game.category?.name || '-' }}</span>
                  <div v-else>
                    <div class="mb-1 flex">
                      <el-select v-model="createCategoryID" size="small" :empty-values="[null, undefined, 0]" placeholder="分类" mr-2 style="width: 130px">
                        <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
                      </el-select>
                      <button class="flex items-center rounded-full bg-green-500 p1" @click="showCategory = true">
                        <div i="carbon-add-large" class="z-20 h-4 w-4" />
                      </button>
                    </div>
                    <input
                      v-if="showCategory"
                      v-model="createCategory"
                      type="text"
                      size="small"
                      class="mt-0 flex-1 border rounded px-2 py-1"
                      placeholder="输入游戏分类"
                      @keydown.enter="() => { appendCategory(createCategory); showCategory = false; createCategory = '' }"
                    >
                  </div>
                </div>
                <!-- 游戏系列 -->
                <div class="flex items-center justify-between">
                  <div w-30 flex items-center>
                    <div mr-1 flex items-center rounded-lg bg-gray-100 p-1 dark:bg-gray-800>
                      <el-icon :size="20">
                        <Connection color-blue />
                      </el-icon>
                    </div>
                    <span class="text-gray-500 dark:text-gray-400">系列：</span>
                  </div>
                  <div v-if="!gameStore.showEdit">
                    <span
                      v-for="s in game.series" :key="s.id"
                      class="mr-1 block max-w-[120px] cursor-pointer truncate text-right text-blue-600 dark:text-blue-400 hover:underline"
                      :title="s.name"
                    >
                      {{ s.name }}
                    </span>
                  </div>
                  <div v-else class="flex flex-1 flex-wrap items-center">
                    <div class="flex flex-wrap">
                      <div
                        v-for="(series, index) in editGame.series" :key="index"
                        class="mb-1 mr-1 flex items-center border border-gray-600 rounded px-2 py-[1px] text-sm dark:border-white"
                        :title="series.name"
                      >
                        <span
                          class="inline-block max-w-[120px] truncate"
                        >
                          {{ series.name }}
                        </span>
                        <button class="ml-1 flex cursor-pointer items-center rounded-full hover:bg-gray-800" @click="editGame.series?.splice(index, 1)">
                          <div i="carbon-close" class="z-20 h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div class="mb-1 flex">
                      <el-select v-model="createSeriesID" :empty-values="[null, undefined, 0]" size="small" placeholder="游戏系列" mr-2 style="width: 130px">
                        <el-option
                          v-for="s in series" :key="s.id"
                          :value="s.id"
                          :label="s.name"
                        />
                      </el-select>

                      <button class="flex items-center rounded-full bg-green-500 p1" @click="showAddSeries = true">
                        <div i="carbon-add-large" class="z-20 h-4 w-4" />
                      </button>
                    </div>
                    <input
                      v-if="showAddSeries"
                      v-model="createSeries"
                      type="text"
                      class="mt-0 flex-1 border rounded px-2 py-1"
                      placeholder="输入游戏系列"
                      @keydown.enter="() => { appendSeries(createSeries); showAddSeries = false; createSeries = '' }"
                    >
                  </div>
                </div>
                <!-- 版本 -->
                <div class="flex items-center justify-between">
                  <div w-30 flex items-center>
                    <div mr-1 flex items-center rounded-lg bg-gray-100 p-1 dark:bg-gray-800>
                      <el-icon :size="20">
                        <Compass color-blue />
                      </el-icon>
                    </div>
                    <span class="text-gray-500 dark:text-gray-400">版本</span>
                  </div>
                  <div>
                    <el-select v-if="!gameStore.showEdit" v-model="gameInsIdx" size="small" placeholder="版本" :empty-values="[null, undefined, 0]" class="mr-2 w-[130px]" clearable>
                      <el-option
                        v-for="(ins, idx) in gameIns" :key="ins.id"
                        :value="idx + 1"
                        :label="ins.version"
                      />
                    </el-select>
                    <div v-else class="mb-1 flex">
                      <el-input v-if="editGameInsIdx" v-model="editGameIns[editGameInsIdx - 1].version" size="small" class="mr-1" style="width: 40px" />
                      <el-select v-model="editGameInsIdx" placeholder="版本" size="small" :empty-values="[null, undefined, 0]" class="mr-2 w-[130px]" clearable>
                        <el-option
                          v-for="(ins, idx) in editGameIns" :key="ins.id"
                          :value="idx + 1"
                          :label="ins.version"
                        />
                      </el-select>
                      <button class="flex items-center rounded-full bg-green-500 p1" @click="showAddGameIns = true">
                        <div i="carbon-add-large" class="z-20 h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <!-- 平台 -->
                <div class="flex items-center justify-between">
                  <div w-30 flex items-center>
                    <div mr-1 flex items-center rounded-lg bg-gray-100 p-1 dark:bg-gray-800>
                      <el-icon :size="20">
                        <Monitor color-blue />
                      </el-icon>
                    </div>
                    <span class="text-gray-500 dark:text-gray-400">平台</span>
                  </div>
                  <div flex-1>
                    <template v-if="!gameStore.showEdit">
                      <template v-if="gameInsIdx">
                        <div
                          v-for="plat in gameIns[gameInsIdx - 1].platform" :key="plat"
                          :class="iconMap[plat]"
                          class="z-20 mr-2 h-6 w-6"
                          inline-block
                        />
                      </template>
                      <template v-else>
                        <div
                          v-for="plat in platforms" :key="plat"
                          :class="iconMap[plat]"
                          class="z-20 mr-2 h-6 w-6"
                          inline-block
                        />
                      </template>
                    </template>
                    <template v-else>
                      <template v-if="!editGameInsIdx">
                        <div
                          v-for="plat in platforms" :key="plat"
                          :class="iconMap[plat]"
                          class="z-20 mr-2 h-6 w-6"
                          inline-block
                        />
                      </template>
                      <template v-else>
                        <el-select v-model="editGameIns[editGameInsIdx - 1].platform" size="small" placeholder="游戏平台" clearable multiple class="w-[160px]">
                          <el-option
                            v-for="(v, k) in platformEnum" :key="k"
                            :value="k"
                          >
                            <div :class="v" />
                          </el-option>
                        </el-select>
                      </template>
                    </template>
                  </div>
                </div>
                <!-- 游戏语言 -->
                <div flex items-center>
                  <div w-30 flex items-center>
                    <div mr-1 flex items-center rounded-lg bg-gray-100 p-1 dark:bg-gray-800>
                      <div i="carbon-ibm-watson-language-translator" class="z-20 h-[20px] w-[20px] color-blue" />
                    </div>
                    <span class="text-gray-500 dark:text-gray-400">语言: </span>
                  </div>
                  <div flex-1>
                    <template v-if="!gameStore.showEdit">
                      <template v-if="gameInsIdx">
                        <span
                          v-for="lang in gameIns[gameInsIdx - 1].language" :key="lang"
                          mr-2
                        >
                          {{ t(lang) }}
                        </span>
                      </template>
                      <template v-else>
                        <span
                          v-for="lang in languages" :key="lang"
                          mr-2
                        >
                          {{ t(lang) }}
                        </span>
                      </template>
                    </template>
                    <template v-else>
                      <template v-if="!editGameInsIdx">
                        <span
                          v-for="lang in languages" :key="lang"
                          mr-2
                        >
                          {{ t(lang) }}
                        </span>
                      </template>
                      <template v-else>
                        <el-select v-model="editGameIns[editGameInsIdx - 1].language" size="small" multiple placeholder="游戏语言" clearable style="width: 160px">
                          <el-option
                            v-for="(v, k) in languageEnum" :key="k"
                            :label="v"
                            :value="k"
                          />
                        </el-select>
                      </template>
                    </template>
                  </div>
                </div>
                <!-- 游戏路径 -->
                <div v-if="gameInsIdx && !gameStore.showEdit" flex items-center>
                  <div w-30 flex items-center>
                    <div mr-1 flex items-center rounded-lg bg-gray-100 p-1 dark:bg-gray-800>
                      <el-icon :size="20">
                        <Folder color-blue />
                      </el-icon>
                    </div>
                    <span class="text-gray-500 dark:text-gray-400">游戏路径：</span>
                  </div>
                  <div flex-1>
                    <span>{{ gameIns[gameInsIdx - 1].path }}</span>
                  </div>
                </div>
                <div v-if="gameStore.showEdit && editGameInsIdx" flex items-center>
                  <div w-30 flex items-center>
                    <div mr-1 flex items-center rounded-lg bg-gray-100 p-1 dark:bg-gray-800>
                      <el-icon :size="20">
                        <Folder color-blue />
                      </el-icon>
                    </div>
                    <span class="text-gray-500 dark:text-gray-400">游戏路径：</span>
                  </div>
                  <div flex-1>
                    <el-input
                      v-model="editGameIns[editGameInsIdx - 1].path"
                      size="small"
                      placeholder="game path"
                    />
                  </div>
                </div>
                <!-- 相关链接 -->
                <div class="border-t border-gray-200 pt-3 dark:border-gray-700">
                  <div class="flex flex-col gap-2">
                    <a v-for="link in game.links" :key="link.url" :href="link.url" target="_blank" class="flex items-center gap-2 text-gray-600 transition dark:text-gray-300 hover:text-blue-500">
                      <el-icon><Connection /></el-icon> {{ link.name }}
                    </a>
                    <div v-if="gameStore.showEdit">
                      <el-button size="small" icon="Edit" @click="activeTab = '相关链接'">
                        编辑链接
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- [右栏] 内容流：标题 -> 标签 -> 简介 -> Tabs -->
        <div class="min-w-0 flex flex-1 flex-col gap-8">
          <!-- 1. 头部信息 -->
          <div>
            <h1 v-if="!gameStore.showEdit" class="mb-3 text-4xl text-gray-900 font-extrabold leading-tight tracking-tight drop-shadow-sm md:text-5xl dark:text-white">
              {{ game?.name }}
            </h1>
            <el-input v-else v-model="editGame.name" class="mb-3 text-4xl font-bold" size="large" />

            <!-- 别名显示 -->
            <div class="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <el-icon><Guide /></el-icon>
              <span v-for="alias in game?.alias" :key="alias" class="rounded bg-gray-100 px-2 py-0.5 dark:bg-gray-800">{{ alias }}</span>
              <el-button v-if="gameStore.showEdit" type="primary" link size="small" @click="showAddAlias = true">
                + 别名
              </el-button>
            </div>
            <div v-if="showAddAlias" class="mt-2 flex gap-2">
              <el-input v-model="createAlias" size="small" placeholder="输入别名" @keyup.enter="appendAlias" />
            </div>
          </div>

          <!-- 2. 标签云 (带折叠功能) -->
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span
                v-for="(tag, index) in (gameStore.showEdit ? editGame.tags : game.tags)"
                v-show="gameStore.showEdit || index < TAG_LIMIT || isTagsExpanded"
                :key="tag.id"
                class="flex cursor-pointer items-center gap-1 border border-indigo-100 rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-600 font-medium transition hover:scale-105 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
              >
                #{{ tag.name }}
                <el-icon v-if="gameStore.showEdit" class="hover:text-red-500" @click.stop="removeTag(tag.name)"><Delete /></el-icon>
              </span>
              <button
                v-if="!gameStore.showEdit && !isTagsExpanded && (game.tags?.length || 0) > TAG_LIMIT"
                class="flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 font-bold transition dark:bg-gray-700 hover:bg-gray-200 dark:text-gray-300"
                @click="isTagsExpanded = true"
              >
                <el-icon class="mr-1">
                  <More />
                </el-icon> 还有 {{ (game.tags?.length || 0) - TAG_LIMIT }} 个
              </button>
              <button v-if="!gameStore.showEdit && isTagsExpanded" class="text-xs text-gray-400 hover:text-blue-500" @click="isTagsExpanded = false">
                收起
              </button>
              <div v-if="gameStore.showEdit" class="flex items-center gap-2">
                <el-select v-model="createTagID" size="small" filterable placeholder="选择标签" :empty-values="[null, undefined, 0]" class="w-32">
                  <el-option v-for="t in tags" :key="t.id" :label="t.name" :value="t.id" />
                </el-select>
                <el-input v-if="showAddTag" v-model="createTag" size="small" placeholder="新建" class="w-24" @keyup.enter="appendTag(createTag)" />
                <el-button v-else size="small" :icon="Plus" circle @click="showAddTag = true" />
              </div>
            </div>
          </div>

          <!-- 3. 简介 (带折叠) -->
          <div class="relative border border-base rounded-2xl bg-card p-6 backdrop-blur-sm">
            <h3 class="mb-3 text-xs text-gray-400 font-bold tracking-wider uppercase">
              简介
            </h3>
            <div v-if="!gameStore.showEdit">
              <div
                class="overflow-hidden text-left text-gray-700 leading-relaxed transition-all duration-300 dark:text-gray-300"
                :class="isStoryExpanded ? '' : 'line-clamp-16 max-h-100'"
                v-html="game?.story || '<span class=\'text-gray-400 italic\'>暂无简介</span>'"
              />
              <div v-if="!isStoryExpanded && (game.story?.length || 0) > 100" class="absolute bottom-0 left-0 h-16 w-full flex items-end justify-center rounded-b-2xl from-white to-transparent bg-gradient-to-t pb-2 dark:from-gray-800">
                <button class="border border-gray-100 rounded-full bg-white/90 px-4 py-1.5 text-xs text-blue-600 font-bold shadow-sm dark:border-gray-700 dark:bg-gray-800/90 dark:text-blue-400 hover:underline" @click="isStoryExpanded = true">
                  展开阅读全文
                </button>
              </div>
              <div v-else-if="isStoryExpanded" class="mt-2 text-center">
                <button class="text-xs text-gray-400 hover:text-gray-600" @click="isStoryExpanded = false">
                  收起
                </button>
              </div>
            </div>
            <el-input v-else v-model="editGame.story" type="textarea" :rows="12" placeholder="输入简介..." />
          </div>

          <!-- 4. Tabs 导航与内容 -->
          <div>
            <!-- Sticky Tab Header -->
            <div class="sticky top--4 z-20 mb-6 border-b border-base bg-card px-4 pt-2 backdrop-blur -mx-4 md:mx-0 md:rounded-lg md:px-3">
              <div class="no-scrollbar flex gap-8 overflow-x-auto px-4">
                <button
                  v-for="tab in tabs" :key="tab" class="whitespace-nowrap border-b-2 px-1 pb-2 text-base font-medium transition-colors"
                  :class="activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
                  @click="activeTab = tab"
                >
                  {{ tab }}
                </button>
              </div>
            </div>

            <!-- Tab Contents -->
            <div class="min-h-[300px]">
              <!-- 角色 Tab -->
              <div v-show="activeTab === '角色'" class="animate-fade-in">
                <div v-if="gameStore.showEdit" class="mb-4 flex justify-end">
                  <el-button type="primary" :icon="Plus" @click="addCharacter">
                    添加角色
                  </el-button>
                </div>

                <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                  <div
                    v-for="(char, idx) in (gameStore.showEdit ? editGame.characters : game.characters)"
                    :key="char.id"
                    class="group relative cursor-pointer overflow-hidden border border-gray-100 rounded-xl bg-white shadow-sm transition dark:border-gray-700 dark:bg-gray-800 hover:shadow-md"
                    @click="!gameStore.showEdit && openCharacterDetail(char)"
                  >
                    <div class="relative aspect-square overflow-hidden bg-gray-200">
                      <img :src="imageUrl(char.cover)" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110">
                      <div class="absolute bottom-0 left-0 w-full from-black/90 to-transparent bg-gradient-to-t p-3 pt-8">
                        <div class="text-xs text-white font-medium opacity-90">
                          CV: {{ char.cv?.name || '未知' }}
                        </div>
                      </div>
                    </div>
                    <div class="p-3">
                      <div class="mb-1 flex items-center justify-between">
                        <div class="flex-1 truncate text-gray-900 font-bold dark:text-white" :title="char.name">
                          {{ char.name }}
                        </div>
                        <el-icon v-if="char.gender === 'female'" color="pink">
                          <Female />
                        </el-icon>
                        <el-icon v-else-if="char.gender === 'male'" color="#409EFF">
                          <Male />
                        </el-icon>
                      </div>
                      <p class="line-clamp-2 h-8 text-xs text-gray-500 dark:text-gray-400">
                        {{ char.summary || '暂无描述' }}
                      </p>
                    </div>

                    <div
                      v-if="gameStore.showEdit"
                      class="character-container absolute right-1 top-1 z-10 rounded-full transition-all duration-300"
                    >
                      <div
                        class="z-10 flex cursor-pointer items-center rounded-full bg-hover p1 shadow-md hover:bg-primary"
                        @click="showCharacterEdit = true"
                      >
                        <div i="carbon-edit" class="h-4 w-4" />
                      </div>
                      <div
                        class="delete-btn absolute top-0 flex cursor-pointer items-center rounded-full bg-hover p1 shadow-md transition-all duration-300 hover:bg-primary"
                        @click="() => { if (editGame.characters) editGame.characters.splice(idx, 1) }"
                      >
                        <div i="carbon-trash-can" class="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 图片集 Tab -->
              <div v-show="activeTab === '图片集'" class="animate-fade-in">
                <div class="grid grid-cols-2 gap-4 lg:grid-cols-4 sm:grid-cols-3">
                  <div v-if="gameStore.showEdit" class="aspect-video flex flex-col items-center justify-center border-2 border-gray-300 rounded-xl border-dashed bg-gray-50 transition dark:border-gray-700 hover:border-blue-500 dark:bg-gray-800/50">
                    <el-upload :show-file-list="false" :action="getUploadUrl()" :on-success="handleImageUploadSuccess" class="h-full w-full flex items-center justify-center">
                      <div class="text-center">
                        <el-icon :size="28" class="text-gray-400">
                          <Plus />
                        </el-icon>
                        <div class="mt-2 text-xs text-gray-500">
                          上传图片
                        </div>
                      </div>
                    </el-upload>
                  </div>
                  <div v-for="(img, i) in (gameStore.showEdit ? editGame.images : game.images)" :key="i" class="group relative aspect-video cursor-pointer overflow-hidden rounded-xl bg-gray-100">
                    <el-image
                      :src="imageUrl(img)"
                      class="h-full w-full object-cover transition group-hover:opacity-90"
                      fit="cover"
                      :preview-src-list="game.images?.map(u => imageUrl(u))"
                      :initial-index="i"
                      loading="lazy"
                    />
                    <div v-if="gameStore.showEdit" class="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100">
                      <el-button type="danger" icon="Delete" circle size="small" @click="rmImage(img)" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- 参与成员 Tab -->
              <div v-show="activeTab === '参与成员'" class="animate-fade-in border border-gray-100 rounded-xl bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div v-if="gameStore.showEdit" class="mb-4 flex justify-end">
                  <el-button type="primary" icon="Plus" @click="addStaff">
                    添加成员
                  </el-button>
                </div>
                <div class="space-y-6">
                  <div v-for="(roleGroup, roleName) in { writer: '剧本', painter: '原画', cv: '声优', music: '音乐' }" :key="roleName">
                    <h4 class="mb-3 border-l-4 border-blue-500 pl-3 text-gray-900 font-bold dark:text-white">
                      {{ roleName }}
                    </h4>
                    <div class="flex flex-wrap gap-3">
                      <template v-for="(s, idx) in (gameStore.showEdit ? editGame.staff : game.staff)" :key="s.id">
                        <div v-if="s.relation.includes(roleName as any)" class="flex items-center gap-2 border border-gray-200 rounded-lg bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-700/50">
                          <el-avatar :size="32" :src="imageUrl(s.cover)" />
                          <span class="text-sm font-medium">{{ s.name }}</span>
                          <el-button v-if="gameStore.showEdit" size="small" type="danger" link icon="Close" @click="editGame.staff?.splice(idx, 1)" />
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 相关链接 Tab -->
              <div v-show="activeTab === '相关链接'" class="animate-fade-in border border-gray-100 rounded-xl bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div v-if="!gameStore.showEdit" class="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <a v-for="link in game.links" :key="link.url" :href="link.url" target="_blank" class="group flex items-center border border-gray-200 rounded-lg p-4 transition dark:border-gray-700 hover:border-blue-500 hover:shadow-md">
                    <div class="mr-3 rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/30"><el-icon :size="20"><Connection /></el-icon></div>
                    <div>
                      <div class="text-gray-900 font-bold dark:text-white group-hover:text-blue-600">{{ link.name }}</div>
                      <div class="max-w-[200px] truncate text-xs text-gray-400">{{ link.url }}</div>
                    </div>
                  </a>
                </div>
                <div v-else>
                  <div v-for="(l, i) in editGame.links" :key="i" class="mb-2 flex gap-2">
                    <el-input v-model="l.name" placeholder="名称" />
                    <el-input v-model="l.url" placeholder="URL" />
                    <el-button type="danger" icon="Delete" circle @click="editGame.links?.splice(i, 1)" />
                  </div>
                  <el-button type="primary" plain icon="Plus" class="mt-2 w-full" @click="() => { if (!editGame.links) editGame.links = []; editGame.links.push({ name: '', url: '', type: '' }) }">
                    添加链接
                  </el-button>
                </div>
              </div>

              <!-- 其他信息 Tab -->
              <div v-show="activeTab === '其他信息'" class="animate-fade-in border border-gray-100 rounded-xl bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div v-if="!gameStore.showEdit" class="max-w-none prose dark:prose-invert" v-html="game.other_info" />
                <el-input v-else v-model="editGame.other_info" type="textarea" :rows="10" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 弹窗组件 -->
    <el-dialog v-model="showUpdate" title="更新确认" width="400px" center>
      <span class="block py-4 text-center text-lg">确认保存所有修改吗？</span>
      <template #footer>
        <div class="flex justify-center gap-4">
          <el-button @click="showUpdate = false">
            取消
          </el-button>
          <el-button type="primary" @click="updateGame">
            确认保存
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="showAddGameIns" title="添加游戏资源" width="500px">
      <div class="px-2 space-y-4">
        <el-input v-model="createGameIns.path" placeholder="路径">
          <template #prepend>
            路径
          </template>
        </el-input>
        <el-input v-model="createGameIns.version" placeholder="版本">
          <template #prepend>
            版本
          </template>
        </el-input>
        <el-select v-model="createGameIns.platform" multiple placeholder="平台" class="w-full">
          <el-option v-for="(v, k) in platformEnum" :key="k" :value="k" :label="v" />
        </el-select>
        <el-select v-model="createGameIns.language" multiple placeholder="语言" class="w-full">
          <el-option v-for="(v, k) in languageEnum" :key="k" :value="k" :label="v" />
        </el-select>
        <el-input v-model="createGameIns.comment" type="textarea" placeholder="备注" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="showAddGameIns = false">
            取消
          </el-button><el-button type="primary" @click="addGameIns">
            添加
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>

  <!-- 角色详情弹窗 -->
  <el-dialog
    v-model="showCharacterModal"
    width="1000px"
    destroy-on-close align-center
    class="overflow-hidden rounded-2xl"
  >
    <div v-if="selectedCharacter" class="flex flex-col gap-8 -mx-6 -mb-6 -mt-6 md:flex-row">
      <!-- 左侧：立绘大图 -->
      <div class="relative w-full flex-shrink-0 bg-gray-100 md:w-80 dark:bg-gray-900">
        <img
          :src="imageUrl(selectedCharacter.cover)"
          class="h-full min-h-[400px] w-full object-cover md:h-[600px]"
        >
        <!-- CV 浮层 -->
        <div class="absolute bottom-0 left-0 w-full from-black/80 to-transparent bg-gradient-to-t p-6 pt-20">
          <div class="mb-1 text-xs text-gray-300 tracking-wider uppercase">
            Voice Actor
          </div>
          <div class="text-xl text-white font-bold">
            {{ selectedCharacter.cv?.name || '未知' }}
          </div>
        </div>
      </div>
      <!-- 右侧：详细信息 -->
      <div class="max-h-[600px] flex flex-1 flex-col overflow-y-auto py-8 pl-8 pr-8 md:pl-0">
        <!-- 头部：姓名与性别 -->
        <div class="mb-6 flex items-start justify-between">
          <div>
            <h2 class="mb-1 mb-4 text-3xl text-gray-900 font-extrabold dark:text-white">
              {{ selectedCharacter.name }}
            </h2>
            <div class="flex flex-wrap gap-2">
              <span v-for="alias in selectedCharacter.alias" :key="alias" class="rounded bg-gray-100 px-2 py-0.5 text-nowrap text-sm text-gray-500 dark:bg-gray-800">{{ alias }}</span>
            </div>
          </div>
          <div class="flex rounded-full bg-gray-50 p-2 dark:bg-gray-800">
            <el-icon v-if="selectedCharacter.gender === 'female'" :size="20" color="pink">
              <Female />
            </el-icon>
            <el-icon v-else-if="selectedCharacter.gender === 'male'" :size="20" color="#409EFF">
              <Male />
            </el-icon>
          </div>
        </div>
        <!-- 简介 -->
        <div class="mb-8 border border-gray-100 rounded-xl bg-gray-50 p-4 text-sm text-gray-600 leading-relaxed prose dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-300 dark:prose-invert">
          {{ selectedCharacter.summary || '暂无角色简介...' }}
        </div>
        <!-- 属性网格 -->
        <div class="grid grid-cols-2 mb-8 gap-4 sm:grid-cols-3">
          <div class="border border-gray-100 rounded-lg bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <div class="mb-1 text-xs text-gray-400">
              生日
            </div>
            <div class="font-medium">
              <template v-if="selectedCharacter.personal_info?.birth_year">
                {{ selectedCharacter.personal_info.birth_year }}年
              </template>
              <template v-if="selectedCharacter.personal_info?.birthday">
                {{ selectedCharacter.personal_info.birthday[0] }}月{{ selectedCharacter.personal_info.birthday[1] }}日
              </template>
              <template v-if="!selectedCharacter.personal_info?.birthday && !selectedCharacter.personal_info?.birth_year">
                -
              </template>
            </div>
          </div>
          <div class="border border-gray-100 rounded-lg bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <div class="mb-1 text-xs text-gray-400">
              身高
            </div>
            <div class="font-medium">
              {{ selectedCharacter.personal_info?.height || '-' }}
            </div>
          </div>
          <div class="border border-gray-100 rounded-lg bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <div class="mb-1 text-xs text-gray-400">
              体重
            </div>
            <div class="font-medium">
              {{ selectedCharacter.personal_info?.weight || '-' }}
            </div>
          </div>
          <div class="border border-gray-100 rounded-lg bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <div class="mb-1 text-xs text-gray-400">
              B (胸围)
            </div>
            <div class="font-medium">
              {{ selectedCharacter.personal_info?.bust || '-' }} <span v-if="selectedCharacter.personal_info?.cup" class="text-xs text-gray-400">({{ selectedCharacter.personal_info.cup }})</span>
            </div>
          </div>
          <div class="border border-gray-100 rounded-lg bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <div class="mb-1 text-xs text-gray-400">
              W (腰围)
            </div>
            <div class="font-medium">
              {{ selectedCharacter.personal_info?.waist || '-' }}
            </div>
          </div>
          <div class="border border-gray-100 rounded-lg bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <div class="mb-1 text-xs text-gray-400">
              H (臀围)
            </div>
            <div class="font-medium">
              {{ selectedCharacter.personal_info?.hip || '-' }}
            </div>
          </div>
        </div>
        <!-- 图集 -->
        <div v-if="selectedCharacter.images && selectedCharacter.images.length > 0">
          <h3 class="mb-4 text-xs text-gray-400 font-bold tracking-wider uppercase">
            图集
          </h3>
          <div class="no-scrollbar flex gap-3 overflow-x-auto pb-2">
            <el-image
              v-for="(img, idx) in selectedCharacter.images"
              :key="idx"
              :src="imageUrl(img)"
              :preview-src-list="selectedCharacter.images.map(i => imageUrl(i))"
              :initial-index="idx"
              class="h-24 w-24 flex-shrink-0 cursor-pointer border border-gray-200 rounded-lg object-cover dark:border-gray-700"
              fit="cover"
            />
          </div>
        </div>
      </div>
    </div>
  </el-dialog>

  <!-- 角色详情编辑 -->
  <el-drawer
    v-model="showCharacterEdit"
    title="角色编辑"
    direction="rtl"
  >
    <div
      v-if="editGame.characters"
    >
      <el-row w-full>
        <el-col :span="6">
          <el-row>
            <el-col>
              <el-image
                :src="imageUrl(editGame.characters[editGameCharacterIdx].cover)"
                alt="角色头像"
                :preview-src-list="[imageUrl(editGame.characters[editGameCharacterIdx].cover)]"
                fit="cover"
              />
            </el-col>
          </el-row>
        </el-col>
        <el-col :span="18">
          <div v-if="editGame.characters[editGameCharacterIdx]" ml-4 flex-1>
            <input v-model="editGame.characters[editGameCharacterIdx].name" type="text" class="mb-2 mt-0 w-full flex-1 border rounded p-1" placeholder="角色名">
            <div mb-2 flex flex-1 flex-wrap items-center>
              <template v-for="(alias, index) in editGame.characters[editGameCharacterIdx].alias" :key="index">
                <p
                  class="mb-1 mr-2 flex items-center border rounded bg-gray-50 px-1 text-center dark:bg-gray-600"
                >
                  {{ alias }}
                  <button class="ml-1 flex cursor-pointer items-center rounded-full hover:bg-gray-800" @click="removeCharacterAlias(editGameCharacterIdx, alias)">
                    <div i="carbon-close" class="z-20 h-4 w-4" />
                  </button>
                </p>
              </template>
              <input
                v-if="showCharacterAddAlias"
                v-model="createCharacterAlias"
                type="text"
                class="mt-0 flex-1 border rounded p-1"
                placeholder="输入角色别名"
                @keydown.enter="appendCharacterAlias(editGameCharacterIdx, createCharacterAlias)"
              >
              <button v-else class="flex items-center rounded-full bg-green-500 p1" @click="showCharacterAddAlias = true">
                <div i="carbon-add-large" class="z-20 h-4 w-4" />
              </button>
            </div>
            <el-select
              v-if="editGame.characters[editGameCharacterIdx].cv"
              v-model="editGame.characters[editGameCharacterIdx].cv.id"
              placeholder="CV"
              :empty-values="[null, undefined, 0]"
              mb-2 mr-2 w-full
            >
              <template v-for="s in editGame.staff" :key="s.id">
                <el-option
                  v-if="s.id !== 0 && s.relation.find(r => r === 'cv')"
                  :label="s.name"
                  :value="s.id"
                />
              </template>
            </el-select>
            <div flex>
              <el-select v-model="editGame.characters[editGameCharacterIdx].gender" placeholder="性别" style="width: 120px" mr-4>
                <el-option
                  v-for="(v, k) in genderEnum" :key="k"
                  :label="v"
                  :value="k"
                />
              </el-select>
              <el-select v-model="editGame.characters[editGameCharacterIdx].relation" placeholder="角色" style="width: 120px">
                <el-option
                  v-for="(v, k) in roleEnum" :key="k"
                  :label="v"
                  :value="k"
                />
              </el-select>
            </div>
          </div>
        </el-col>
      </el-row>
      <el-input
        v-model="editGame.characters[editGameCharacterIdx].summary"
        type="textarea"
        autosize
        class="mb-4 mt-2"
        placeholder="角色描述"
      />
      <el-row>
        <el-col>
          <div v-if="editGame.characters && editGame.characters[editGameCharacterIdx]" flex>
            <Upload
              :action="getUploadUrl()"
              class="mr-1 h-40 w-34 bg-gray-50 dark:bg-gray-800/50"
              @success="handleCharacterImageUploadSuccess"
            />
            <div
              v-for="image in editGame.characters[editGameCharacterIdx].images"
              :key="image"
              relative
            >
              <button class="z-10 flex items-center rounded-full bg-red-500 p1" absolute right--1 top--1 @click="rmCharacterImage(editGameCharacterIdx, image)">
                <div i="carbon-subtract-large" class="h-3 w-3" />
              </button>
              <el-image
                fit="cover"
                :src="imageUrl(image)"
                class="mr-1 h-40 w-34 rounded object-cover"
                :preview-src-list="editGame.characters[editGameCharacterIdx].images?.map((img) => imageUrl(img))"
                alt=""
              />
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </el-drawer>

  <div
    class="action-container fixed bottom-[120px] left-[calc(100%-127px)] z-20 flex items-center rounded-full bg-card p1 shadow-md transition-all duration-300"
  >
    <!-- Edit 按钮 -->
    <div
      class="edit-btn z-10 flex cursor-pointer items-center rounded-full bg-hover p2 shadow-md hover:bg-primary"
      @click="gameStore.showEdit = !gameStore.showEdit"
    >
      <div i="carbon-edit" class="h-6 w-6" />
    </div>

    <!-- Save 按钮（默认隐藏在左边） -->
    <div
      class="save-btn absolute flex cursor-pointer items-center rounded-full bg-hover p2 shadow-md transition-all duration-300 hover:bg-primary"
      @click="showUpdate = true"
    >
      <div i="carbon-save" class="h-6 w-6" />
    </div>
  </div>
</template>

<style scoped>
/* 隐藏滚动条但允许滚动 */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
/* 淡入动画 */
.animate-fade-in {
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.action-container {
  width: 48px; /* 默认显示 Edit 时的宽度 */
  height: 48px;
  overflow: visible;
  position: fixed;
}
/* 保存按钮初始在左边看不到的位置 */
.action-container .save-btn {
  left: 0;
  opacity: 0;
}
/* 悬停时容器展开 */
.action-container:hover {
  width: 95px; /* 容器向右扩展 */
}
/* 悬停时 Save 按钮滑到右边 */
.action-container:hover .save-btn {
  left: 50px;
  opacity: 1;
  transform: translateX(0);
}

.character-container {
  overflow: visible;
}
.character-container .delete-btn {
  left: 0;
  opacity: 0;
}
.character-container:hover {
  height: 95px; /* 容器向下扩展 */
}
.character-container:hover .delete-btn {
  top: 30px;
  opacity: 1;
  transform: translateX(0);
}

/* 输入框背景适配 */
:deep(.el-input__wrapper) {
  background-color: rgba(var(--c-bg-input), 1);
  box-shadow: 0 0 0 1px rgba(var(--c-border-strong), 1) inset;
}

:deep(.el-button:hover) {
  background-color: rgba(var(--c-primary), 1);
  border-color: rgba(var(--c-border-strong), 1);
  color: white;
}
:deep(.el-button) {
  border-color: rgba(var(--c-border), 1);
}
:deep(.el-input-group__prepend) {
  --el-input-border-color: rgba(var(--c-border-strong), 1);
}
:deep(.el-select__wrapper) {
  background-color: rgba(var(--c-bg-input), 1);
  box-shadow: 0 0 0 1px rgba(var(--c-border-strong), 1) inset;
}
:deep(.el-switch.is-checked.el-switch__core) {
  background-color: rgba(var(--c-primary), 1);
}
:deep(.el-textarea__inner) {
  background-color: rgba(var(--c-bg-input), 1);
  --el-input-border-color: rgba(var(--c-border), 1);
}
:deep(.el-image-viewer__wrapper) {
  z-index: 9999999 !important;
}
:deep(.el-image-viewer__mask) {
  z-index: 9999998 !important;
}
</style>

<route lang="yaml">
meta:
  layout: default
</route>
