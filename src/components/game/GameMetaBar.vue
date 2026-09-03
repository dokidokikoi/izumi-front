<script setup lang="ts">
import type { Brand, Category, Game, GameInstance } from '~/types'
import { Clock, Compass, Connection, FolderOpened, Monitor, OfficeBuilding, Plus, Reading } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { iconMap } from '~/config/icon'

const props = defineProps<{
  game: Partial<Game>
  gameIns: GameInstance[]
  showEdit: boolean
  brands: Brand[]
  categories: Category[]
  platforms: string[]
  languages: string[]
}>()

const emit = defineEmits<{
  (e: 'goto', path: string): void
  (e: 'addIns'): void
}>()
// v-model 双向绑定:编辑态对象与父组件共享同一引用,嵌套字段就地修改
const editGame = defineModel<Partial<Game>>('editGame', { required: true })
const editGameIns = defineModel<GameInstance[]>('editGameIns', { required: true })

const gameInsIdx = defineModel<number>('gameInsIdx', { default: 0 })
const editGameInsIdx = defineModel<number>('editGameInsIdx', { default: 0 })

const { t } = useI18n()

// --- 品牌(编辑态) ---
const createBrandID = ref(0)
watch(createBrandID, (newVal) => {
  if (newVal) {
    if (!editGame.value.brands)
      editGame.value.brands = []
    if (!editGame.value.brands.find(b => b.id === newVal)) {
      const b = props.brands.find(b => b.id === newVal)
      if (b)
        editGame.value.brands.push(b)
    }
    createBrandID.value = 0
  }
})

// --- 分类(编辑态) ---
const createCategoryID = ref(0)
watch(createCategoryID, (newVal) => {
  if (newVal)
    editGame.value.category = props.categories.find(c => c.id === newVal)
})
</script>

<template>
  <!-- 紧凑信息横条 -->
  <div class="overflow-x-auto -mx-4 md:mx-0">
    <div class="no-scrollbar flex gap-2 px-4 md:px-0">
      <!-- 品牌 -->
      <div class="group flex shrink-0 items-center gap-2 rounded-lg bg-white/60 px-3 py-2 shadow-sm backdrop-blur-sm transition dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800">
        <el-icon :size="16" class="text-blue-500">
          <OfficeBuilding />
        </el-icon>
        <div v-if="!showEdit" class="flex items-center gap-1">
          <span class="text-xs text-gray-400 dark:text-gray-500">品牌</span>
          <span
            v-for="b in game.brands" :key="b.id"
            class="cursor-pointer text-xs text-blue-600 font-medium dark:text-blue-400 hover:underline"
            @click="emit('goto', `/games?brand=${b.id}`)"
          >
            {{ b.name }}
          </span>
        </div>
        <el-select v-else v-model="createBrandID" size="small" filterable :empty-values="[null, undefined, 0]" placeholder="品牌" class="w-24">
          <el-option v-for="brand in brands" :key="brand.id" :value="brand.id" :label="brand.name" />
        </el-select>
      </div>

      <!-- 分类 -->
      <div class="group flex shrink-0 items-center gap-2 rounded-lg bg-white/60 px-3 py-2 shadow-sm backdrop-blur-sm transition dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800">
        <el-icon :size="16" class="text-purple-500">
          <FolderOpened />
        </el-icon>
        <div v-if="!showEdit" class="flex items-center gap-1">
          <span class="text-xs text-gray-400 dark:text-gray-500">分类</span>
          <span
            class="cursor-pointer text-xs text-purple-600 font-medium dark:text-purple-400 hover:underline"
            @click="emit('goto', `/games?category=${game?.category?.id}`)"
          >
            {{ game.category?.name || '-' }}
          </span>
        </div>
        <el-select v-else v-model="createCategoryID" size="small" :empty-values="[null, undefined, 0]" placeholder="分类" class="w-24">
          <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </div>

      <!-- 系列 -->
      <div v-if="game.series?.length" class="group flex shrink-0 items-center gap-2 rounded-lg bg-white/60 px-3 py-2 shadow-sm backdrop-blur-sm transition dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800">
        <el-icon :size="16" class="text-emerald-500">
          <Connection />
        </el-icon>
        <div v-if="!showEdit" class="flex items-center gap-1">
          <span class="text-xs text-gray-400 dark:text-gray-500">系列</span>
          <span
            v-for="s in game.series" :key="s.id"
            class="cursor-pointer text-xs text-emerald-600 font-medium dark:text-emerald-400 hover:underline"
            @click="emit('goto', `/games?series=${s.id}`)"
          >
            {{ s.name }}
          </span>
        </div>
      </div>

      <!-- 发行日期 -->
      <div class="group flex shrink-0 items-center gap-2 rounded-lg bg-white/60 px-3 py-2 shadow-sm backdrop-blur-sm transition dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800">
        <el-icon :size="16" class="text-amber-500">
          <Clock />
        </el-icon>
        <span v-if="!showEdit" class="text-xs text-gray-700 font-medium dark:text-gray-300">{{ game.issue_date?.slice(0, 10) || '-' }}</span>
        <el-date-picker v-else v-model="editGame.issue_date" type="date" size="small" class="w-32" />
      </div>

      <!-- 版本 -->
      <div class="group flex shrink-0 items-center gap-2 rounded-lg bg-white/60 px-3 py-2 shadow-sm backdrop-blur-sm transition dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800">
        <el-icon :size="16" class="text-rose-500">
          <Compass />
        </el-icon>
        <template v-if="!showEdit">
          <el-select v-model="gameInsIdx" size="small" placeholder="版本" :empty-values="[null, undefined, 0]" class="w-24" clearable>
            <el-option v-for="(ins, idx) in gameIns" :key="ins.id" :value="idx + 1" :label="ins.version" />
          </el-select>
        </template>
        <template v-else>
          <div class="flex items-center gap-1">
            <el-input v-if="editGameInsIdx" v-model="editGameIns[editGameInsIdx - 1].version" size="small" class="w-12" />
            <el-select v-model="editGameInsIdx" placeholder="版本" size="small" :empty-values="[null, undefined, 0]" class="w-24" clearable>
              <el-option v-for="(ins, idx) in editGameIns" :key="ins.id" :value="idx + 1" :label="ins.version" />
            </el-select>
            <el-button size="small" type="primary" :icon="Plus" circle @click="emit('addIns')" />
          </div>
        </template>
      </div>

      <!-- 平台图标 -->
      <div v-if="platforms.length || editGameInsIdx" class="group flex shrink-0 items-center gap-2 rounded-lg bg-white/60 px-3 py-2 shadow-sm backdrop-blur-sm transition dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800">
        <el-icon :size="16" class="text-cyan-500">
          <Monitor />
        </el-icon>
        <div class="flex gap-1">
          <div
            v-for="plat in (showEdit && editGameInsIdx ? editGameIns[editGameInsIdx - 1].platform : (gameInsIdx ? gameIns[gameInsIdx - 1].platform : platforms))" :key="plat"
            :class="iconMap[plat]"
            class="h-5 w-5"
          />
        </div>
      </div>

      <!-- 语言 -->
      <div class="group flex shrink-0 items-center gap-2 rounded-lg bg-white/60 px-3 py-2 shadow-sm backdrop-blur-sm transition dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800">
        <el-icon :size="16" class="text-indigo-500">
          <Reading />
        </el-icon>
        <div class="flex gap-1">
          <span
            v-for="lang in (showEdit && editGameInsIdx ? editGameIns[editGameInsIdx - 1].language : (gameInsIdx ? gameIns[gameInsIdx - 1].language : languages))" :key="lang"
            class="text-xs text-gray-600 font-medium dark:text-gray-300"
          >
            {{ t(lang) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
