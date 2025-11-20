<script setup lang="ts">
import type { Game } from '~/types'
import { computed, ref } from 'vue'
import { imageUrl } from '~/utils/image'

const props = defineProps<{
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

// 计算属性：仅显示前3个标签，避免溢出
const displayTags = computed(() => {
  return props.game.tags?.slice(0, 10) || []
})

// 计算属性：品牌名称安全获取
const brandName = computed(() => {
  return props.game.brands?.[0]?.name || '-'
})
</script>

<template>
  <!--
    1. 外层容器配色：
       Light: 白底 (bg-white), 浅灰描边 (ring-black/5)
       Dark:  黑底 (dark:bg-gray-900), 浅白描边 (dark:ring-white/10)
  -->
  <div
    class="group relative isolate aspect-[9/12] w-full transform-gpu cursor-pointer overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-black/5 transition-all dark:bg-gray-900 hover:shadow-xl dark:ring-white/10 hover:ring-indigo-500/50"
  >
    <div class="relative h-full w-full">
      <!-- 2. 骨架屏/占位背景 -->
      <!-- Light: 浅灰背景 (bg-gray-100) | Dark: 深灰背景 (dark:bg-gray-900) -->
      <div
        v-if="!isImageLoaded || isImageError"
        class="absolute inset-0 z-10 flex items-center justify-center bg-gray-100 dark:bg-gray-900"
      >
        <div v-if="!isImageLoaded && !isImageError" class="animate-pulse">
          <!-- Icon 颜色适配 -->
          <Loader2 class="h-8 w-8 animate-spin text-gray-400 dark:text-gray-600" />
        </div>

        <div v-else class="flex flex-col items-center p-4 text-center text-gray-400 dark:text-gray-500">
          <ImageOff class="mb-2 h-8 w-8" />
          <span class="w-full truncate text-xs">{{ game.name }}</span>
        </div>
      </div>

      <!-- 真实图片 (不需要改动，图片本身不随主题变) -->
      <img
        v-if="!isImageError && game.cover"
        :src="imageUrl(game.cover)"
        :alt="game.name"
        loading="lazy"
        class="block h-full w-full object-cover transition-transform duration-500 will-change-transform"
        :class="{ 'opacity-0': !isImageLoaded, 'opacity-100': isImageLoaded }"
        @load="handleImageLoad"
        @error="handleImageError"
      >

      <div v-else-if="!game.cover" class="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
        <span class="text-xs">No Cover</span>
      </div>
    </div>

    <!-- 3. 底部悬浮面板 -->
    <!-- Light: 90%白色背景 + 深色字 | Dark: 90%黑蓝背景 + 浅色字 -->
    <div
      class="absolute bottom-0 left-0 z-20 w-full translate-y-[100%] transform bg-white/95 p-3 text-slate-800 transition-transform duration-300 ease-out group-hover:translate-y-0 dark:bg-slate-950/90 dark:text-white"
    >
      <h3 class="mb-2 truncate text-base text-slate-900 font-bold dark:text-slate-100" :title="game.name">
        {{ game.name }}
      </h3>

      <div class="grid grid-cols-[40%_60%] gap-x-2 gap-y-1 text-xs">
        <!-- 标签列：浅色模式下稍微淡一点的深灰，深色模式下灰白 -->
        <div class="text-right text-slate-500 dark:text-slate-400">
          品牌:
        </div>
        <div class="truncate text-left text-slate-700 font-medium dark:text-slate-200">
          {{ brandName }}
        </div>

        <div class="text-right text-slate-500 dark:text-slate-400">
          类型:
        </div>
        <div class="truncate text-left text-slate-700 dark:text-slate-300">
          {{ game.category?.name || '-' }}
        </div>

        <div class="text-right text-slate-500 dark:text-slate-400">
          日期:
        </div>
        <div class="text-left text-slate-700 dark:text-slate-300">
          {{ game.issue_date?.slice(0, 10) || '-' }}
        </div>
      </div>

      <!-- 4. Tags 标签配色 -->
      <!-- Light: 浅蓝底深蓝字 | Dark: 透明底荧光字带边框 -->
      <div class="mt-3 flex flex-wrap gap-1.5">
        <span
          v-for="tag in displayTags"
          :key="tag.id"
          class="border border-indigo-100 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-600 transition-colors dark:border-indigo-500/30 dark:bg-indigo-500/20 dark:text-indigo-200"
        >
          {{ tag.name }}
        </span>
        <!-- <span v-if="(game.tags?.length || 0) > 4" class="text-[10px] px-1 text-slate-400 dark:text-slate-600">...</span> -->
      </div>
    </div>

    <!-- 移动端标题 (为了保证在任何封面上都看清，这里保持深色渐变 + 白字 通常是最安全的) -->
    <!-- 但也可以适配：在浅色模式下如果想要浅色渐变，文字需要是黑色的。 -->
    <!-- 不过考虑到游戏封面通常复杂，这里保留“黑渐变白字”作为一种通用的 Overlay 风格比较稳妥 -->
    <div class="absolute bottom-0 left-0 w-full from-black/80 to-transparent bg-gradient-to-t p-4 pt-12 transition-opacity duration-300 md:hidden group-hover:opacity-0">
      <h3 class="truncate text-center text-sm text-white font-medium shadow-black drop-shadow-md">
        {{ game.name }}
      </h3>
    </div>
  </div>
</template>
