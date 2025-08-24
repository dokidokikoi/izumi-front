<script setup lang="ts">
import VueEasyLightbox from 'vue-easy-lightbox'

// 模拟接口数据，实际应从 API 获取
const route = useRoute()
const gameId = computed(() => (route.params as { id: number }).id)

const game = ref<any>(null)

// lightbox 状态
const previewVisible = ref(false)
const previewIndex = ref(0)

function openPreview(index: number) {
  previewIndex.value = index
  previewVisible.value = true
}
function closePreview() {
  previewVisible.value = false
}

// 模拟请求游戏详情
onMounted(() => {
  game.value = {
    id: gameId.value,
    name: '塞尔达传说：旷野之息',
    cover: 'https://placehold.co/300x400',
    aliases: ['Zelda: Breath of the Wild'],
    developer: 'Nintendo',
    categories: ['动作', '冒险'],
    tags: ['开放世界', '探索', 'RPG'],
    publishDate: '2017-03-03',
    story: '这是一个关于林克在海拉鲁大陆冒险的故事……',
    characters: ['林克', '塞尔达', '加农', '林克', '塞尔达', '加农'],
    gallery: [
      'https://placehold.co/600x400',
      'https://placehold.co/601x401',
      'https://placehold.co/602x402',
      'https://placehold.co/603x403',
    ],
    staff: ['导演：藤林秀麿', '制作人：青沼英二'],
  }
})

// tabs
const tabs = ['故事', '角色', '图片集', '参与成员']
const activeTab = ref('故事')
</script>

<template>
  <div text-left>
    <h1 class="mb6 text-4xl font-bold">
      {{ game?.name }}
    </h1>
    <div>
      <!-- 顶部元数据 -->
      <div class="flex flex-col gap-6 md:flex-row">
        <div class="w-64 flex-shrink-0">
          <img :src="game?.cover" alt="cover" class="w-full rounded-xl object-cover shadow-lg">
        </div>
        <div class="flex-1 space-y-3">
          <div><span class="font-semibold">别名：</span>{{ game?.aliases?.join(', ') }}</div>
          <div><span class="font-semibold">开发厂商：</span>{{ game?.developer }}</div>
          <div><span class="font-semibold">分类：</span>{{ game?.categories?.join(', ') }}</div>
          <div><span class="font-semibold">标签：</span>{{ game?.tags?.join(', ') }}</div>
          <div><span class="font-semibold">发布时间：</span>{{ game?.publishDate }}</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="mt-8">
        <div class="flex border-b border-gray-300">
          <div
            v-for="tab in tabs"
            :key="tab"
            class="cursor-pointer px-4 py-2"
            :class="activeTab === tab ? 'border-b-2 border-blue-500 text-blue-500 font-semibold' : 'text-gray-600'"
            @click="activeTab = tab"
          >
            {{ tab }}
          </div>
        </div>

        <!-- Tab 内容 -->
        <div class="mt-4 min-h-[200px]">
          <!-- 故事 -->
          <div v-if="activeTab === '故事'">
            <p class="leading-relaxed">
              {{ game?.story }}
            </p>
          </div>

          <!-- 角色 -->
          <div v-else-if="activeTab === '角色'" class="space-y-4">
            <div
              v-for="character in game.characters"
              :key="character.id"
              class="flex items-center rounded-lg bg-white p-4 shadow"
            >
              <img
                :src="character.avatar"
                alt="角色头像"
                class="mr-4 h-16 w-16 rounded-lg object-cover"
              >
              <div class="flex-1">
                <h3 class="text-lg font-semibold">
                  {{ character.name }}
                </h3>
                <p class="text-sm text-gray-500">
                  {{ character.role }}
                </p>
              </div>
            </div>
          </div>

          <!-- 图片集 -->
          <div v-else-if="activeTab === '图片集'" class="grid grid-cols-2 gap-4 lg:grid-cols-4 md:grid-cols-3">
            <div
              v-for="(img, i) in game?.gallery"
              :key="i"
              class="relative cursor-pointer"
              @click="openPreview(i)"
            >
              <img :src="img" class="h-40 w-full rounded-lg object-cover">
            </div>
            <!-- Lightbox 预览 -->
            <VueEasyLightbox
              :visible="previewVisible"
              :imgs="game?.gallery"
              :index="previewIndex"
              @hide="closePreview"
            />
          </div>

          <!-- 参与成员 -->
          <div v-else-if="activeTab === '参与成员'">
            <ul class="list-disc list-inside space-y-1">
              <li v-for="s in game?.staff" :key="s">
                {{ s }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>

<route lang="yaml">
meta:
  layout: default
</route>
