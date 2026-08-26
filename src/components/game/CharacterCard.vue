<script setup lang="ts">
import type { Character } from '~/types'
import { Delete, Edit, Female, Male, Microphone } from '@element-plus/icons-vue'
import { imageUrl } from '~/utils/image'

defineProps<{
  char: Character
  showEdit: boolean
}>()

const emit = defineEmits<{
  (e: 'open', char: Character): void
  (e: 'edit'): void
  (e: 'remove'): void
}>()
</script>

<template>
  <div
    class="group relative cursor-pointer overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 dark:bg-gray-800 hover:shadow-indigo-500/20 hover:shadow-xl hover:-translate-y-1"
    @click="!showEdit && emit('open', char)"
  >
    <div class="relative aspect-square overflow-hidden">
      <img :src="imageUrl(char.cover)" class="h-full w-full object-cover transition-transform duration-500 group-hover:rotate-1 group-hover:scale-110">
      <div class="absolute inset-0 from-black/0 via-black/0 to-black/60 bg-gradient-to-t transition-all duration-300" />
      <div class="absolute bottom-0 left-0 w-full p-4 pt-10 transition-transform duration-300 group-hover:translate-y-[-4px]">
        <div class="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 backdrop-blur-sm">
          <el-icon :size="12" class="text-white">
            <Microphone />
          </el-icon>
          <span class="text-xs text-white font-medium">
            {{ char.cv?.name || '未知' }}
          </span>
        </div>
      </div>
    </div>
    <div class="p-4">
      <div class="mb-2 flex items-start justify-between gap-2">
        <div class="flex-1 truncate text-lg text-gray-900 font-bold dark:text-white" :title="char.name">
          {{ char.name }}
        </div>
        <div class="shrink-0 rounded-full p-1">
          <el-icon v-if="char.gender === 'female'" :size="16" color="pink">
            <Female />
          </el-icon>
          <el-icon v-else-if="char.gender === 'male'" :size="16" color="#409EFF">
            <Male />
          </el-icon>
        </div>
      </div>
      <p class="line-clamp-2 text-sm text-gray-500 dark:text-gray-400" v-html="char.summary || '暂无描述'" />
    </div>

    <div v-if="showEdit" class="character-container absolute right-2 top-2 z-10">
      <button
        class="z-10 h-9 w-9 flex items-center justify-center rounded-full bg-white/90 shadow-md transition-all dark:bg-gray-700/90 hover:bg-blue-500 hover:text-white"
        @click="emit('edit')"
      >
        <Edit :size="14" />
      </button>
      <button
        class="delete-btn absolute top-0 h-9 w-9 flex items-center justify-center rounded-full bg-white/90 shadow-md transition-all dark:bg-gray-700/90 hover:bg-red-500 hover:text-white"
        @click="emit('remove')"
      >
        <Delete :size="14" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.character-container {
  overflow: visible;
}

.character-container .delete-btn {
  left: 0;
  opacity: 0;
  transform: translateY(-100%);
}

.character-container:hover .delete-btn {
  top: 38px;
  opacity: 1;
  transform: translateY(0);
}
</style>
