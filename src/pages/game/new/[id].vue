<script setup lang="ts">
// 导入你的类型和API
import type { Brand, Category, Character, Game, GameInstance, Series, Tag } from '~/types'
import {
  Camera,
  Clock,
  Connection,
  Delete,
  Female,
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
import { languageEnum, platformEnum } from '~/config/enum'
import { iconMap } from '~/config/icon'
import { useGameStore } from '~/stores/gameStore'
import { imageUrl } from '~/utils/image'

const route = useRoute()
const gameStore = useGameStore()

// --- 核心数据 ---
const gameId = computed(() => (route.params as { id: number }).id)
const game = ref<Partial<Game>>({})
const gameIns = ref<GameInstance[]>([])

// --- 编辑状态数据 ---
const editGame = ref<Partial<Game>>({})
const editGameIns = ref<GameInstance[]>([])
const createGameIns = ref<Partial<GameInstance>>({ game_id: Number(gameId.value) })

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

// --- 初始化逻辑 ---
function getGame() {
  gameApi.get(gameId.value).then((res) => {
    game.value = res.data
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

function initData() {
  categoryApi.list().then(res => categories.value = res.data)
  seriesApi.list().then(res => series.value = res.data.list)
  tagApi.list().then(res => tags.value = res.data.list)
  brandApi.list().then(res => brands.value = res.data.list)
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
  })
}

watch(() => gameStore.showEdit, (newVal) => {
  if (!newVal)
    showUpdate.value = true
})

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

watch(createCategoryID, (newVal) => {
  if (newVal)
    editGame.value.category = categories.value.find(c => c.id === newVal)
})

watch(createSeriesID, (newVal) => {
  if (newVal) {
    if (!editGame.value.series)
      editGame.value.series = []
    const s = series.value.find(t => t.id === newVal)
    if (s)
      editGame.value.series.push(s)
    createSeriesID.value = 0
  }
})

function removeTag(tagName: string) {
  editGame.value.tags = editGame.value.tags?.filter(t => t.name !== tagName)
}

function appendTag(t: string | undefined) {
  if (!t)
    return
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
        class="h-full w-full scale-110 object-cover opacity-40 blur-3xl dark:opacity-20"
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
                :src="imageUrl(game?.cover)"
                class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              >
              <!-- 编辑模式：更换封面 -->
              <div v-if="gameStore.showEdit" class="absolute inset-0 flex flex-col cursor-pointer items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                <el-icon :size="32" color="#fff">
                  <Camera />
                </el-icon>
                <span class="mt-2 text-white font-bold">更换封面</span>
              </div>
            </div>

            <!-- 快捷按钮组 -->
            <div class="flex gap-3">
              <button class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-white font-bold shadow-blue-500/30 shadow-lg transition active:scale-95 hover:bg-blue-700">
                <el-icon><Monitor /></el-icon> 开始游戏
              </button>
              <button class="border border-gray-200 rounded-lg bg-white p-2.5 text-yellow-500 shadow transition active:scale-95 dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
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
                <!-- 开发商 -->
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
                    <div v-else class="flex flex-col gap-1">
                      <div v-for="(b, idx) in editGame.brands" :key="b.id" class="flex items-center justify-end gap-1">
                        <span>{{ b.name }}</span><el-icon class="cursor-pointer text-red-500" @click="editGame.brands?.splice(idx, 1)">
                          <Delete />
                        </el-icon>
                      </div>
                      <el-select v-model="createBrandID" size="small" placeholder="添加" filterable>
                        <el-option v-for="b in brands" :key="b.id" :label="b.name" :value="b.id" />
                      </el-select>
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
                  <el-date-picker v-else v-model="editGame.issue_date" type="date" size="small" style="width: 130px" />
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
                  <div class="flex gap-1">
                    <div v-for="p in platforms" :key="p" :class="iconMap[p]" class="h-5 w-5" :title="p" />
                  </div>
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
                  <el-select v-else v-model="createCategoryID" size="small" style="width: 130px">
                    <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
                  </el-select>
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
                <el-select v-model="createTagID" size="small" filterable placeholder="选择标签" class="w-32">
                  <el-option v-for="t in tags" :key="t.id" :label="t.name" :value="t.id" />
                </el-select>
                <el-input v-if="showAddTag" v-model="createTag" size="small" placeholder="新建" class="w-24" @keyup.enter="appendTag(createTag)" />
                <el-button v-else size="small" icon="Plus" circle @click="showAddTag = true" />
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
            <el-input v-else v-model="editGame.story" type="textarea" :rows="6" placeholder="输入简介..." />
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
                  <el-button type="primary" icon="Plus" @click="addCharacter">
                    添加角色
                  </el-button>
                </div>

                <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                  <div
                    v-for="(char, idx) in (gameStore.showEdit ? editGame.characters : game.characters)"
                    :key="char.id"
                    class="group relative overflow-hidden border border-gray-100 rounded-xl bg-white shadow-sm transition dark:border-gray-700 dark:bg-gray-800 hover:shadow-md"
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
                        <el-icon v-if="char.gender === 'Female'" color="pink">
                          <Female />
                        </el-icon>
                        <el-icon v-else-if="char.gender === 'Male'" color="#409EFF">
                          <Male />
                        </el-icon>
                      </div>
                      <p class="line-clamp-2 h-8 text-xs text-gray-500 dark:text-gray-400">
                        {{ char.summary || '暂无描述' }}
                      </p>
                      <div v-if="gameStore.showEdit" class="mt-2 border-t border-gray-100 pt-2 dark:border-gray-700">
                        <div class="flex justify-between">
                          <el-button size="small" text bg>
                            编辑
                          </el-button>
                          <el-button size="small" type="danger" icon="Delete" circle text @click="editGame.characters?.splice(idx, 1)" />
                        </div>
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
    align-center destroy-on-close
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
              class="h-24 w-24 flex-shrink-0 cursor-pointer border border-gray-200 rounded-lg object-cover dark:border-gray-700 hover:opacity-80"
              fit="cover"
            />
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
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
</style>

<route lang="yaml">
meta:
  layout: default
</route>
