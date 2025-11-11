<script setup lang="ts">
import type { Tag } from '~/types'
import { nextTick } from 'vue'

const props = defineProps<{
  tags: Tag[]
  maxHeight?: number
}>()

const maxHeight = props.maxHeight ?? 120
const expanded = ref(false)
const showToggle = ref(false)
const tagContainer = ref<HTMLElement | null>(null)

async function waitForRenderAndMeasure() {
  let tries = 0
  while (tries < 10) {
    await nextTick()
    await new Promise(r => requestAnimationFrame(r))
    const el = tagContainer.value
    if (el && el.scrollHeight > 0) {
      showToggle.value = el.scrollHeight > maxHeight
      return
    }
    tries++
  }
}

onMounted(async () => {
  waitForRenderAndMeasure()
})
</script>

<template>
  <div class="relative">
    <!-- 标签容器 -->
    <div
      ref="tagContainer"
      class="flex flex-wrap gap-1 overflow-hidden transition-all duration-300"
      :style="{ maxHeight: expanded ? 'none' : `${maxHeight}px` }"
      :class="expanded ? 'mb-10' : ''"
    >
      <!-- slot 支持自定义标签渲染 -->
      <template v-for="(tag, index) in tags" :key="index">
        <slot name="tag" :tag="tag">
          <!-- 默认渲染样式 -->
          <span
            class="cursor-default rounded-md bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700"
          >
            {{ tag }}
          </span>
        </slot>
      </template>
    </div>

    <!-- 渐变遮罩 + 按钮 -->
    <div
      v-if="showToggle"
      class="absolute left-0 h-[60px] w-full flex items-end justify-center"
      :class="expanded ? 'bottom--10' : 'bottom-0'"
    >
      <!-- 半透明渐变层 -->
      <div
        v-if="!expanded"
        class="pointer-events-none absolute inset-0 from-white/95 via-white/60 to-transparent bg-gradient-to-t dark:from-gray-900/95 dark:via-gray-900/60 dark:to-transparent"
      />

      <!-- 按钮浮在渐变上 -->
      <button
        class="relative z-10 mb-1 rounded-md bg-white/80 px-3 py-1 text-sm text-blue-500 backdrop-blur-sm transition dark:bg-gray-800/80 hover:bg-white/90 dark:hover:bg-gray-700/90"
        @click="expanded = !expanded"
      >
        {{ expanded ? '收起' : '显示全部' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
</style>
