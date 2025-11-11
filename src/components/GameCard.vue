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
        class="h-full w-full object-cover transition-transform duration-300"
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
      <el-row justify="center" :gutter="8" class="text-left text-xs opacity-80">
        <el-col :span="10" text-right>
          品牌:
        </el-col>
        <el-col :span="12">
          {{ game.brands?.length > 0 ? game.brands[0].name : "" }}
        </el-col>
      </el-row>
      <el-row justify="center" :gutter="8" class="text-left text-xs opacity-80">
        <el-col :span="10" text-right>
          类型:
        </el-col>
        <el-col :span="12">
          {{ game.category?.name }}
        </el-col>
      </el-row>
      <el-row justify="center" :gutter="8" class="text-left text-xs opacity-80">
        <el-col :span="10" text-right>
          发布时间:
        </el-col>
        <el-col :span="12">
          {{ game.issue_date?.slice(0, 10) }}
        </el-col>
      </el-row>
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
