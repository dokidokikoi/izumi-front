<script setup lang="ts">
import type { Game } from '~/types'
import { Camera, Close, Guide } from '@element-plus/icons-vue'
import { imageUrl } from '~/utils/image'

defineProps<{
  game: Partial<Game>
  showEdit: boolean
}>()

// v-model:edit-game —— 编辑态对象与父组件共享同一引用,嵌套字段就地修改
const editGame = defineModel<Partial<Game>>('editGame', { required: true })

const showAddAlias = ref(false)
const createAlias = ref('')

function getUploadUrl() {
  const prefix = import.meta.env.VITE_API_BASE || window.location.origin.concat('/api')
  return prefix.concat('/file/upload')
}

function appendAlias() {
  if (!editGame.value.alias)
    editGame.value.alias = []

  if (createAlias.value) {
    editGame.value.alias.push(createAlias.value)
    createAlias.value = ''
    showAddAlias.value = false
  }
}
</script>

<template>
  <!-- === 顶部 Banner (Hero Section) === -->
  <div class="relative h-[45vh] w-full overflow-hidden md:h-[55vh]">
    <!-- Banner 图片 -->
    <div class="absolute inset-0">
      <img
        v-if="game?.cover"
        :src="imageUrl(game?.cover)"
        :alt="`${game?.name} banner`"
        class="h-full w-full object-cover object-top"
      >
      <!-- 双层渐变遮罩 -->
      <div class="absolute inset-0 from-gray-50 via-gray-50/50 to-transparent bg-gradient-to-b dark:from-[#0f1216] dark:via-[#0f1216]/70" />
      <div class="absolute inset-0 from-black/20 to-transparent bg-gradient-to-t" />
    </div>

    <!-- 头部信息块 (海报 + 标题) -->
    <div class="absolute bottom-0 left-0 right-0 z-20 w-full px-4 pb-16">
      <div class="mx-auto max-w-6xl w-full flex flex-col items-end gap-8 md:flex-row">
        <!-- 封面图 (Poster) -->
        <div class="group relative aspect-[2/3] w-[200px] shrink-0 overflow-hidden rounded-2xl bg-gray-200 shadow-2xl ring-1 ring-white/20 md:w-[260px] dark:bg-gray-800 dark:ring-white/10">
          <div class="absolute inset-0 z-10 from-black/40 via-transparent to-transparent bg-gradient-to-t opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <img
            v-if="!showEdit"
            :src="imageUrl(game?.cover)"
            :alt="`${game?.name} 封面`"
            class="h-full w-full object-cover transition-transform duration-700 group-hover:rotate-1 group-hover:scale-110"
          >
          <!-- 编辑模式：更换封面 -->
          <template v-else>
            <img :src="imageUrl(editGame?.cover)" :alt="`${editGame?.name} 封面`" class="h-full w-full object-cover opacity-40 blur-sm">
            <div class="absolute inset-0 flex flex-col cursor-pointer items-center justify-center bg-black/50 transition-opacity hover:bg-black/70">
              <Upload class="absolute inset-0" :action="getUploadUrl()" @success="(data: any) => { editGame.cover = data.data.path }">
                <template #content>
                  <div class="h-full flex flex-col items-center justify-center text-white">
                    <div class="mb-3 rounded-full bg-white/20 p-3 backdrop-blur-sm">
                      <Camera class="h-6 w-6" />
                    </div>
                    <span class="text-sm font-semibold">更换封面</span>
                  </div>
                </template>
              </Upload>
            </div>
          </template>
        </div>

        <!-- 标题与元数据 -->
        <div class="flex-1 pb-4">
          <!-- 标题 -->
          <h1 v-if="!showEdit" class="mb-4 text-left text-3xl text-gray-900 font-extrabold leading-tight tracking-tight drop-shadow-2xl sm:text-4xl dark:text-white">
            {{ game?.name }}
          </h1>
          <el-input v-else v-model="editGame.name" class="mb-4 !text-3xl !font-extrabold" size="large" placeholder="游戏名称" />

          <!-- 别名与标签 -->
          <div class="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <div class="rounded-full bg-white/80 p-2 shadow-sm backdrop-blur-sm dark:bg-gray-800/80">
              <el-icon class="text-blue-500">
                <Guide />
              </el-icon>
            </div>

            <template v-if="!showEdit">
              <span
                v-for="alias in game?.alias" :key="alias"
                class="rounded-full bg-white/90 px-3 py-1 text-xs text-gray-600 font-medium shadow-sm backdrop-blur-sm dark:bg-gray-800/90 dark:text-gray-300"
              >
                {{ alias }}
              </span>
            </template>

            <template v-else>
              <span v-for="(alias, idx) in editGame?.alias" :key="alias" class="flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700 font-medium dark:bg-blue-900/30 dark:text-blue-300">
                {{ alias }}
                <button class="ml-2 rounded-full p-0.5 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30" @click="editGame.alias?.splice(idx, 1)">
                  <el-icon :size="12"><Close /></el-icon>
                </button>
              </span>
              <el-button type="primary" link size="small" @click="showAddAlias = true">
                + 别名
              </el-button>
            </template>
            <div v-if="showAddAlias" class="mt-2 w-full flex gap-2">
              <el-input v-model="createAlias" size="small" placeholder="输入别名" class="flex-1" @keyup.enter="appendAlias" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
