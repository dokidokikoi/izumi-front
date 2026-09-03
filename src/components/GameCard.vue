<script setup lang="ts">
import type { Game } from '~/types'
import { Calendar, Loading, PictureFilled } from '@element-plus/icons-vue'
import { ref } from 'vue'
import { imageUrl } from '~/utils/image'

defineProps<{
  game: Partial<Game>
}>()

// 图片状态管理
const isImageLoaded = ref(false)
const isImageError = ref(false)

function handleImageLoad() {
  isImageLoaded.value = true
}

function handleImageError() {
  isImageError.value = true
  isImageLoaded.value = true // 错误也算加载结束，用于移除骨架屏
}
</script>

<template>
  <!--
    结构:封面(右上角日期徽章、左下角类型胶囊) + 卡片下方的游戏名称
    悬停只有封面上浮与阴影,不再弹出信息面板
  -->
  <div class="group cursor-pointer">
    <!-- 封面区域 -->
    <div
      class="relative aspect-[9/12] w-full overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-black/5 transition-all duration-300 dark:bg-gray-900 group-hover:shadow-xl dark:ring-white/10 group-hover:ring-indigo-500/50 group-hover:-translate-y-1.5"
    >
      <div class="relative h-full w-full">
        <!-- 骨架屏/占位背景 -->
        <div
          v-if="!isImageLoaded || isImageError"
          class="absolute inset-0 z-10 flex items-center justify-center bg-gray-100 dark:bg-gray-900"
        >
          <div v-if="!isImageLoaded && !isImageError" class="animate-pulse">
            <Loading class="h-8 w-8 animate-spin text-gray-400 dark:text-gray-600" />
          </div>

          <div v-else class="flex flex-col items-center p-4 text-center text-gray-400 dark:text-gray-500">
            <PictureFilled class="mb-2 h-8 w-8" />
            <span class="w-full truncate text-xs">{{ game.name }}</span>
          </div>
        </div>

        <!-- 真实图片 -->
        <img
          v-if="!isImageError && game.cover"
          :src="imageUrl(game.cover)"
          :alt="game.name"
          loading="lazy"
          class="block h-full w-full object-cover"
          :class="{ 'opacity-0': !isImageLoaded, 'opacity-100': isImageLoaded }"
          @load="handleImageLoad"
          @error="handleImageError"
        >

        <div v-else-if="!game.cover" class="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
          <span class="text-xs">No Cover</span>
        </div>
      </div>

      <!-- 发售日期:右上角带图标徽章 -->
      <div class="pointer-events-none absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] text-white/90 font-medium backdrop-blur-sm">
        <el-icon :size="11">
          <Calendar />
        </el-icon>
        <span>{{ game.issue_date?.slice(0, 10) || '-' }}</span>
      </div>

      <!-- 常驻信息:左下角类型胶囊 -->
      <div class="pointer-events-none absolute bottom-2 left-2 z-10">
        <span class="shrink-0 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white/90 font-medium backdrop-blur-sm">
          {{ game.category?.name || '-' }}
        </span>
      </div>
    </div>

    <!-- 卡片下方:游戏名称 -->
    <h3 class="mt-2 truncate text-center text-sm text-gray-800 font-medium dark:text-gray-200" :title="game.name">
      {{ game.name }}
    </h3>
  </div>
</template>
