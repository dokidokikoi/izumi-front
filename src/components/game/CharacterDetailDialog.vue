<script setup lang="ts">
import type { Character } from '~/types'
import { Female, Male } from '@element-plus/icons-vue'
import { imageUrl } from '~/utils/image'

defineProps<{
  character: Character | null
}>()

const model = defineModel<boolean>({ required: true })
</script>

<template>
  <el-dialog
    v-model="model"
    width="1000px"
    destroy-on-close align-center
    class="overflow-hidden rounded-2xl"
  >
    <div v-if="character" class="flex flex-col gap-8 -mx-6 -mb-6 -mt-6 md:flex-row">
      <!-- 左侧：立绘大图 -->
      <div class="relative w-full flex-shrink-0 bg-gray-100 md:w-80 dark:bg-gray-900">
        <img
          :src="imageUrl(character.cover)"
          class="h-full min-h-[400px] w-full object-cover md:h-[600px]"
        >
        <!-- CV 浮层 -->
        <div class="absolute bottom-0 left-0 w-full from-black/80 to-transparent bg-gradient-to-t p-6 pt-20">
          <div class="mb-1 text-xs text-gray-300 tracking-wider uppercase">
            Voice Actor
          </div>
          <div class="text-xl text-white font-bold">
            {{ character.cv?.name || '未知' }}
          </div>
        </div>
      </div>
      <!-- 右侧：详细信息 -->
      <div class="max-h-[600px] flex flex-1 flex-col overflow-y-auto py-8 pl-8 pr-8 md:pl-0">
        <!-- 头部：姓名与性别 -->
        <div class="mb-6 flex items-start justify-between">
          <div>
            <h2 class="mb-1 mb-4 text-3xl text-gray-900 font-extrabold dark:text-white">
              {{ character.name }}
            </h2>
            <div class="flex flex-wrap gap-2">
              <span v-for="alias in character.alias" :key="alias" class="rounded bg-gray-100 px-2 py-0.5 text-nowrap text-sm text-gray-500 dark:bg-gray-800">{{ alias }}</span>
            </div>
          </div>
          <div class="flex rounded-full bg-gray-50 p-2 dark:bg-gray-800">
            <el-icon v-if="character.gender === 'female'" :size="20" color="pink">
              <Female />
            </el-icon>
            <el-icon v-else-if="character.gender === 'male'" :size="20" color="#409EFF">
              <Male />
            </el-icon>
          </div>
        </div>
        <!-- 简介 -->
        <div class="mb-8 border border-gray-100 rounded-xl bg-gray-50 p-4 text-sm text-gray-600 leading-relaxed prose dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-300 dark:prose-invert" v-html="character.summary || '暂无角色简介...'" />
        <!-- 属性网格 -->
        <div class="grid grid-cols-2 mb-8 gap-4 sm:grid-cols-3">
          <div class="border border-gray-100 rounded-lg bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <div class="mb-1 text-xs text-gray-400">
              生日
            </div>
            <div class="font-medium">
              <template v-if="character.personal_info?.birth_year">
                {{ character.personal_info.birth_year }}年
              </template>
              <template v-if="character.personal_info?.birthday">
                {{ character.personal_info.birthday[0] }}月{{ character.personal_info.birthday[1] }}日
              </template>
              <template v-if="!character.personal_info?.birthday && !character.personal_info?.birth_year">
                -
              </template>
            </div>
          </div>
          <div class="border border-gray-100 rounded-lg bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <div class="mb-1 text-xs text-gray-400">
              身高
            </div>
            <div class="font-medium">
              {{ character.personal_info?.height || '-' }}
            </div>
          </div>
          <div class="border border-gray-100 rounded-lg bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <div class="mb-1 text-xs text-gray-400">
              体重
            </div>
            <div class="font-medium">
              {{ character.personal_info?.weight || '-' }}
            </div>
          </div>
          <div class="border border-gray-100 rounded-lg bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <div class="mb-1 text-xs text-gray-400">
              B (胸围)
            </div>
            <div class="font-medium">
              {{ character.personal_info?.bust || '-' }} <span v-if="character.personal_info?.cup" class="text-xs text-gray-400">({{ character.personal_info.cup }})</span>
            </div>
          </div>
          <div class="border border-gray-100 rounded-lg bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <div class="mb-1 text-xs text-gray-400">
              W (腰围)
            </div>
            <div class="font-medium">
              {{ character.personal_info?.waist || '-' }}
            </div>
          </div>
          <div class="border border-gray-100 rounded-lg bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <div class="mb-1 text-xs text-gray-400">
              H (臀围)
            </div>
            <div class="font-medium">
              {{ character.personal_info?.hip || '-' }}
            </div>
          </div>
        </div>
        <!-- 图集 -->
        <div v-if="character.images && character.images.length > 0">
          <h3 class="mb-4 text-xs text-gray-400 font-bold tracking-wider uppercase">
            图集
          </h3>
          <div class="no-scrollbar flex gap-3 overflow-x-auto pb-2">
            <el-image
              v-for="(img, idx) in character.images"
              :key="idx"
              :src="imageUrl(img)"
              :preview-src-list="character.images.map(i => imageUrl(i))"
              :initial-index="idx"
              class="h-24 w-24 flex-shrink-0 cursor-pointer border border-gray-200 rounded-lg object-cover dark:border-gray-700"
              fit="cover"
            />
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
