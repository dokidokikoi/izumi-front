<script setup lang="ts">
import type { Game } from '~/types'
import { imageUrl } from '~/utils/image'

defineProps<{
  game: Partial<Game>
}>()
</script>

<template>
  <div
    class="group relative cursor-pointer overflow-hidden rounded-xl shadow-lg"
  >
    <!-- 封面图容器，固定 9:12 比例 -->
    <div class="aspect-[9/12] w-full overflow-hidden">
      <img
        :src="imageUrl(game.cover)"
        :alt="game.name"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      >
    </div>

    <!-- 入库标识 -->
    <!-- <div
      v-if="game.inLibrary"
      class="absolute left-2 top-2 rounded-md bg-green-600 px-2 py-1 text-xs text-white shadow"
    >
      已入库
    </div> -->

    <!-- 底部信息面板：默认隐藏，hover时滑出 -->
    <div
      class="absolute bottom-0 left-0 w-full translate-y-full transform bg-black/70 p-3 text-white transition-transform duration-300 ease-out group-hover:translate-y-0"
    >
      <h3 class="truncate text-lg font-semibold">
        {{ game.name }}
      </h3>
      <p class="text-xs opacity-80">
        发行公司: {{ game.brand?.name }}
      </p>
      <p class="text-xs opacity-80">
        类型: {{ game.category?.name }}
      </p>
      <p class="text-xs opacity-80">
        时间: {{ game.issue_date }}
      </p>
      <div class="mt-1 flex flex-wrap gap-1">
        <span
          v-for="tag in game.tags"
          :key="tag.id"
          class="rounded-md bg-white/20 px-2 py-0.5 text-[10px]"
        >
          {{ tag.name }}
        </span>
      </div>
    </div>
  </div>
</template>
