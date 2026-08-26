<script setup lang="ts">
import type { Character, GameInstance } from '~/types'
import {
  ArrowDown,
  ArrowRight,
  Close,
  Connection,
  Delete,
  Document,
  Edit,
  Plus,
} from '@element-plus/icons-vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { gameApi } from '~/apis/game'
import { useGameDetail } from '~/composables/useGameDetail'
import { languageEnum, platformEnum } from '~/config/enum'
import { imageUrl } from '~/utils/image'

const route = useRoute()
const router = useRouter()

// --- 核心数据(数据层见 composables/useGameDetail.ts) ---
const gameId = computed(() => Number((route.params as { id: number }).id))
const {
  gameStore,
  game,
  gameIns,
  editGame,
  editGameIns,
  categories,
  brands,
  tags,
  platforms,
  languages,
  getGame,
  getIns,
} = useGameDetail(gameId)

// --- 编辑状态数据 ---
const createGameIns = ref<Partial<GameInstance>>({ game_id: Number(gameId.value) })
const editGameCharacterIdx = ref(0)
const editGameStaffIdx = ref(0)

// --- UI 状态控制 ---
const activeTab = ref('角色')
const tabs = ['角色', '图片集', '参与成员', '相关链接', '其他信息']
const isStoryExpanded = ref(false)
const showUpdate = ref(false)
const showAddGameIns = ref(false)
const showCharacterEdit = ref(false)
const showStaffEdit = ref(false)

function goto(path: string) {
  const { href } = router.resolve(path)
  window.open(href, '_blank')
}

function getUploadUrl() {
  const prefix = import.meta.env.VITE_API_BASE || window.location.origin.concat('/api')
  return prefix.concat('/file/upload')
}

// --- 更新逻辑 ---
async function updateGame() {
  for (const ins of editGameIns.value) {
    await gameApi.updateGameIns(ins)
  }
  getIns()
  gameApi.update(editGame.value).then(() => {
    showUpdate.value = false
    game.value = structuredClone(editGame.value)
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

// --- 图片集上传 ---
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
  <div class="relative min-h-screen w-full from-gray-50 via-white to-gray-50 bg-gradient-to-b pb-24 text-gray-800 dark:from-[#0f1216] dark:via-[#14181d] dark:to-[#0f1216] dark:text-gray-100">
    <!-- === 顶部 Banner (Hero Section) === -->
    <GameHero v-model:edit-game="editGame" :game="game" :show-edit="gameStore.showEdit" />

    <!-- 2. 主要内容区域 -->
    <div class="relative z-10 mx-auto max-w-6xl w-full px-4 md:px-8">
      <!-- 紧凑信息横条（替代侧边栏） -->
      <GameMetaBar
        v-model:edit-game="editGame" v-model:edit-game-ins="editGameIns"
        :game="game" :game-ins="gameIns"
        :show-edit="gameStore.showEdit" :brands="brands" :categories="categories"
        :platforms="platforms" :languages="languages"
        @goto="goto" @add-ins="showAddGameIns = true"
      />

      <!-- 核心内容：全宽布局 -->
      <div class="flex-1">
        <!-- 1. 标签云 (带折叠功能) -->
        <GameTagCloud v-model:edit-game="editGame" v-model:tags="tags" :game="game" :show-edit="gameStore.showEdit" @goto="goto" />

        <!-- 2. 简介 (带折叠) -->
        <div class="relative overflow-hidden rounded-2xl bg-white/80 p-8 shadow-sm backdrop-blur-sm dark:bg-gray-800/60">
          <div class="mb-4 flex items-center gap-3">
            <div class="rounded-lg from-blue-500 to-indigo-500 bg-gradient-to-br p-2">
              <el-icon :size="20" class="text-white">
                <Document />
              </el-icon>
            </div>
            <h3 class="text-sm text-gray-400 font-bold tracking-wider uppercase">
              游戏简介
            </h3>
          </div>
          <div v-if="!gameStore.showEdit">
            <div
              class="prose-sm max-w-none overflow-hidden text-left text-gray-700 leading-relaxed transition-all duration-300 prose dark:prose-invert"
              :class="isStoryExpanded ? '' : 'line-clamp-[18] max-h-[400px]'"
              v-html="game?.story || '<span class=\'text-gray-400 italic\'>暂无简介</span>'"
            />
            <div v-if="!isStoryExpanded && (game.story?.length || 0) > 100" class="absolute bottom-0 left-0 h-24 w-full flex items-end justify-center rounded-b-2xl from-white via-white/90 to-transparent bg-gradient-to-t pb-6 dark:from-gray-800 dark:via-gray-800/90">
              <button class="group inline-flex items-center gap-2 rounded-full from-blue-500 to-indigo-500 bg-gradient-to-r px-6 py-2.5 text-sm text-white font-semibold shadow-blue-500/25 shadow-lg transition-all hover:scale-105 hover:shadow-blue-500/30 hover:shadow-xl" @click="isStoryExpanded = true">
                <span>展开阅读全文</span>
                <el-icon class="transition-transform group-hover:translate-y-0.5">
                  <ArrowDown />
                </el-icon>
              </button>
            </div>
            <div v-else-if="isStoryExpanded" class="mt-6 text-center">
              <button class="text-sm text-gray-400 font-medium hover:text-gray-600 dark:hover:text-gray-300" @click="isStoryExpanded = false">
                收起简介
              </button>
            </div>
          </div>
          <el-input v-else v-model="editGame.story" type="textarea" :rows="14" placeholder="输入简介..." />
        </div>

        <!-- 3. Tabs 导航与内容 -->
        <div>
          <!-- Sticky Tab Header -->
          <div class="sticky top-4 z-20 mb-6 rounded-2xl bg-white/80 px-4 pt-2 shadow-sm backdrop-blur-md -mx-4 md:mx-0 dark:bg-gray-800/80 md:px-0 md:shadow-none">
            <div class="no-scrollbar flex gap-1 overflow-x-auto px-2 md:px-0">
              <button
                v-for="tab in tabs" :key="tab" class="relative whitespace-nowrap px-5 py-3 text-base font-medium transition-all"
                :class="activeTab === tab
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
                @click="activeTab = tab"
              >
                {{ tab }}
                <span v-if="activeTab === tab" class="absolute bottom-0 left-0 right-0 h-0.5 rounded-full from-blue-500 to-indigo-500 bg-gradient-to-r" />
              </button>
            </div>
          </div>

          <!-- Tab Contents -->
          <div class="min-h-[300px]">
            <!-- 角色 Tab -->
            <div v-show="activeTab === '角色'" class="animate-fade-in">
              <div v-if="gameStore.showEdit" class="mb-6 flex justify-end">
                <el-button type="primary" :icon="Plus" class="rounded-xl shadow-blue-500/25 shadow-lg" @click="addCharacter">
                  添加角色
                </el-button>
              </div>

              <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                <CharacterCard
                  v-for="(char, idx) in (gameStore.showEdit ? editGame.characters : game.characters)"
                  :key="`${char.id}-${idx}`"
                  :char="char"
                  :show-edit="gameStore.showEdit"
                  @open="openCharacterDetail"
                  @edit="showCharacterEdit = true; editGameCharacterIdx = idx"
                  @remove="() => { if (editGame.characters) editGame.characters.splice(idx, 1) }"
                />
              </div>
            </div>

            <!-- 图片集 Tab -->
            <div v-show="activeTab === '图片集'" class="animate-fade-in">
              <div class="grid grid-cols-2 gap-4 lg:grid-cols-4 sm:grid-cols-3">
                <div v-if="gameStore.showEdit" class="group relative aspect-video flex cursor-pointer items-center justify-center border-2 border-gray-300 rounded-2xl border-dashed bg-gray-50/50 transition dark:border-gray-700 hover:border-blue-400 dark:bg-gray-800/50 hover:bg-blue-50/50 dark:hover:border-blue-500 dark:hover:bg-blue-900/20">
                  <Upload
                    :action="getUploadUrl()"
                    class="h-full w-full"
                    @success="handleImageUploadSuccess"
                  >
                    <div class="h-full flex flex-col items-center justify-center gap-2">
                      <div class="rounded-full bg-gray-200 p-3 transition-colors dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50">
                        <Plus class="text-gray-500 transition-colors dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400" :size="24" />
                      </div>
                      <span class="text-sm text-gray-500 font-medium transition-colors dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">添加图片</span>
                    </div>
                  </Upload>
                </div>
                <div v-for="(img, i) in (gameStore.showEdit ? editGame.images : game.images)" :key="i" class="group relative aspect-video cursor-pointer overflow-hidden rounded-2xl bg-gray-100">
                  <el-image
                    :src="imageUrl(img)"
                    class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    fit="cover"
                    :preview-src-list="game.images?.map(u => imageUrl(u))"
                    :initial-index="i"
                    loading="lazy"
                  />
                  <div class="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
                  <button
                    v-if="gameStore.showEdit"
                    class="absolute right-2 top-2 h-8 w-8 flex items-center justify-center rounded-full bg-white/90 opacity-0 shadow-lg transition-all dark:bg-gray-700/90 hover:bg-red-500 hover:text-white group-hover:opacity-100"
                    @click="rmImage(img)"
                  >
                    <Delete :size="14" />
                  </button>
                </div>
              </div>
            </div>

            <!-- 参与成员 Tab -->
            <div v-show="activeTab === '参与成员'" class="animate-fade-in rounded-2xl bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:bg-gray-800/60">
              <div v-if="gameStore.showEdit" class="mb-6 flex justify-end">
                <el-button type="primary" :icon="Plus" class="rounded-xl shadow-blue-500/25 shadow-lg" @click="addStaff">
                  添加成员
                </el-button>
              </div>
              <div class="space-y-8">
                <div v-for="(_, roleName) in { writer: '剧本', painter: '原画', cv: '声优', music: '音乐' }" :key="roleName">
                  <div class="mb-4 flex items-center gap-3">
                    <div class="h-1 flex-1 from-blue-500/50 to-transparent bg-gradient-to-r" />
                    <h4 class="px-4 text-center text-sm text-gray-400 font-bold tracking-widest uppercase">
                      {{ roleName }}
                    </h4>
                    <div class="h-1 flex-1 from-blue-500/50 to-transparent bg-gradient-to-l" />
                  </div>
                  <div class="flex flex-wrap gap-3">
                    <template v-for="(s, idx) in (gameStore.showEdit ? editGame.staff : game.staff)" :key="`${s.id}-${idx}`">
                      <div v-if="s.relation.includes(roleName as any)" class="group flex items-center gap-3 rounded-xl from-gray-50 to-gray-100 bg-gradient-to-br px-4 py-2.5 transition-all dark:from-gray-700/50 dark:to-gray-800/50 hover:shadow-md">
                        <el-avatar :size="40" :src="imageUrl(s.cover)" class="ring-2 ring-white dark:ring-gray-700" />
                        <span class="text-sm text-gray-800 font-semibold dark:text-gray-200">{{ s.name }}</span>
                        <div v-if="gameStore.showEdit" class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <el-button size="small" type="primary" link :icon="Edit" @click="showStaffEdit = true; editGameStaffIdx = idx" />
                          <el-button size="small" type="danger" link :icon="Close" @click="editGame.staff?.splice(idx, 1)" />
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <!-- 相关链接 Tab -->
            <div v-show="activeTab === '相关链接'" class="animate-fade-in rounded-2xl bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:bg-gray-800/60">
              <div v-if="!gameStore.showEdit" class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <a v-for="link in game.links" :key="link.url" :href="link.url" target="_blank" class="group flex items-center gap-4 border border-gray-200 rounded-xl p-4 transition-all dark:border-gray-700 hover:border-blue-400 hover:shadow-blue-500/10 hover:shadow-lg">
                  <div class="rounded-xl from-blue-500 to-indigo-500 bg-gradient-to-br p-3 text-white shadow-md transition-transform group-hover:scale-110">
                    <el-icon :size="22"><Connection /></el-icon>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="text-left text-gray-900 font-bold transition-colors dark:text-white group-hover:text-blue-600">{{ link.name }}</div>
                    <div class="max-w-[200px] truncate text-left text-xs text-gray-400">{{ link.url }}</div>
                  </div>
                  <el-icon class="text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-blue-400">
                    <ArrowRight />
                  </el-icon>
                </a>
              </div>
              <div v-else>
                <div v-for="(l, i) in editGame.links" :key="i" class="mb-3 flex gap-3">
                  <el-input v-model="l.name" placeholder="名称" class="flex-1" />
                  <el-input v-model="l.url" placeholder="URL" class="flex-[2]" />
                  <el-button type="danger" :icon="Delete" circle @click="editGame.links?.splice(i, 1)" />
                </div>
                <el-button type="primary" plain :icon="Plus" class="w-full rounded-xl" @click="() => { if (!editGame.links) editGame.links = []; editGame.links.push({ name: '', url: '', type: '' }) }">
                  添加链接
                </el-button>
              </div>
            </div>

            <!-- 其他信息 Tab -->
            <div v-show="activeTab === '其他信息'" class="animate-fade-in rounded-2xl bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:bg-gray-800/60">
              <div v-if="!gameStore.showEdit" class="prose-sm max-w-none prose dark:prose-invert" v-html="game.other_info" />
              <el-input v-else v-model="editGame.other_info" type="textarea" :rows="10" />
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
  <CharacterDetailDialog v-model="showCharacterModal" :character="selectedCharacter" />

  <!-- 角色/成员编辑抽屉(共用组件) -->
  <EntityEditDrawer
    v-model="showCharacterEdit"
    :edit-game="editGame"
    :index="editGameCharacterIdx"
    :original-cover="game.characters?.[editGameCharacterIdx]?.cover"
    type="character"
  />
  <EntityEditDrawer
    v-model="showStaffEdit"
    :edit-game="editGame"
    :index="editGameStaffIdx"
    :original-cover="game.staff?.[editGameStaffIdx]?.cover"
    type="staff"
  />

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

/* 操作按钮容器 */
.action-container {
  width: 56px;
  height: 56px;
  overflow: visible;
  position: fixed;
}

.action-container .save-btn {
  left: 0;
  opacity: 0;
}

.action-container:hover {
  width: 110px;
}

.action-container:hover .save-btn {
  left: 60px;
  opacity: 1;
}

/* Element Plus 样式覆盖 */
:deep(.el-input__wrapper) {
  background-color: transparent;
  box-shadow: 0 0 0 1px theme('colors.gray.200') inset;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px theme('colors.blue.400') inset;
}

:deep(.el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 2px theme('colors.blue.500') inset;
}

:deep(.el-input__inner) {
  color: theme('colors.gray.700');
}

:deep(.el-select__wrapper) {
  background-color: transparent;
  box-shadow: 0 0 0 1px theme('colors.gray.200') inset;
  border-radius: 0.5rem;
}

:deep(.el-textarea__inner) {
  background-color: transparent;
  border-color: theme('colors.gray.200');
  border-radius: 0.5rem;
  color: theme('colors.gray.700');
}

:deep(.el-textarea__inner:focus) {
  border-color: theme('colors.blue.500');
}

:deep(.el-button) {
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, theme('colors.blue.500'), theme('colors.indigo.500'));
  border: none;
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, theme('colors.blue.600'), theme('colors.indigo.600'));
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

:deep(.el-button--primary.is-plain) {
  background: transparent;
  border-color: theme('colors.blue.500');
  color: theme('colors.blue.500');
}

:deep(.el-button--primary.is-plain:hover) {
  background: theme('colors.blue.50');
}

:deep(.el-image-viewer__wrapper) {
  z-index: 9999999 !important;
}

/* 暗黑模式适配 */
.dark :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px theme('colors.gray.700') inset;
}

.dark :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px theme('colors.blue.500') inset;
}

.dark :deep(.el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 2px theme('colors.blue.400') inset;
}

.dark :deep(.el-input__inner) {
  color: theme('colors.gray.200');
}

.dark :deep(.el-select__wrapper) {
  box-shadow: 0 0 0 1px theme('colors.gray.700') inset;
}

.dark :deep(.el-textarea__inner) {
  background-color: transparent;
  border-color: theme('colors.gray.700');
  color: theme('colors.gray.200');
}

.dark :deep(.el-textarea__inner:focus) {
  border-color: theme('colors.blue.400');
}

/* Dialog 样式 */
:deep(.el-dialog) {
  border-radius: 1rem;
  overflow: hidden;
}

:deep(.el-dialog__header) {
  padding: 1.5rem;
  border-bottom: 1px solid theme('colors.gray.100');
}

:deep(.el-dialog__body) {
  padding: 1.5rem;
}

.dark :deep(.el-dialog__header) {
  border-bottom-color: theme('colors.gray.800');
}

/* Drawer 样式 */
:deep(.el-drawer) {
  border-radius: 1rem 0 0 1rem;
}

:deep(.el-drawer__header) {
  padding: 1.5rem;
  margin-bottom: 0;
  border-bottom: 1px solid theme('colors.gray.100');
}

.dark :deep(.el-drawer__header) {
  border-bottom-color: theme('colors.gray.800');
}

/* 图片预览 */
:deep(.el-image) {
  display: block;
}

/* 标签选择器 */
:deep(.el-select-dropdown__item) {
  border-radius: 0.5rem;
  margin: 0.125rem 0.5rem;
}

:deep(.el-select-dropdown__item.is-selected) {
  background: linear-gradient(135deg, theme('colors.blue.500'), theme('colors.indigo.500'));
  color: white;
}

/* 日期选择器 */
:deep(.el-date-editor) {
  width: 100%;
}

:deep(.el-date-editor .el-input__wrapper) {
  box-shadow: 0 0 0 1px theme('colors.gray.200') inset;
}

.dark :deep(.el-date-editor .el-input__wrapper) {
  box-shadow: 0 0 0 1px theme('colors.gray.700') inset;
}
</style>
