<script setup lang="ts">
import type { Game, Tag } from '~/types'
import { Close, More, Plus } from '@element-plus/icons-vue'
import { tagApi } from '~/apis/game'

defineProps<{
  game: Partial<Game>
  showEdit: boolean
}>()

const emit = defineEmits<{
  (e: 'goto', path: string): void
}>()
// v-model 双向绑定:与父组件共享同一引用,嵌套字段就地修改
const editGame = defineModel<Partial<Game>>('editGame', { required: true })
const tags = defineModel<Tag[]>('tags', { required: true })

const TAG_LIMIT = 25
const isTagsExpanded = ref(false)
const showAddTag = ref(false)
const createTag = ref('')
const createTagID = ref(0)

function removeTag(tagName: string) {
  editGame.value.tags = editGame.value.tags?.filter(t => t.name !== tagName)
}

function appendTag(t: string | undefined) {
  if (!t) {
    showAddTag.value = false
    return
  }
  tagApi.create(t).then((res) => {
    tagApi.list().then((r) => {
      tags.value.splice(0, tags.value.length, ...r.data.list)
      const tag = tags.value.find(item => item.id === res.data)
      if (tag) {
        if (!editGame.value.tags)
          editGame.value.tags = []
        editGame.value.tags.push(tag)
      }
    })
  }).finally(() => {
    showAddTag.value = false
  })
}

watch(createTagID, (newVal) => {
  if (newVal) {
    if (!editGame.value.tags)
      editGame.value.tags = []
    if (!editGame.value.tags.find(t => t.id === newVal)) {
      const t = tags.value.find(item => item.id === newVal)
      if (t)
        editGame.value.tags.push(t)
    }
    createTagID.value = 0
  }
})
</script>

<template>
  <div class="rounded-2xl bg-white/60 p-6 shadow-sm backdrop-blur-sm dark:bg-gray-800/40">
    <div class="flex flex-wrap items-center gap-2.5">
      <span
        v-for="(tag, index) in (showEdit ? editGame.tags : game.tags)"
        v-show="showEdit || index < TAG_LIMIT || isTagsExpanded"
        :key="tag.id"
        class="group flex cursor-pointer items-center gap-1.5 border border-indigo-200 rounded-full from-indigo-50 to-blue-50 bg-gradient-to-r px-3.5 py-1.5 text-xs text-indigo-700 font-semibold shadow-sm transition-all hover:scale-105 dark:border-indigo-700 hover:border-indigo-300 dark:from-indigo-900/40 dark:to-blue-900/40 dark:text-indigo-300 hover:shadow-md"
        @click="emit('goto', `/games?tags=${tag.id}`)"
      >
        <span class="opacity-80">#</span>{{ tag.name }}
        <el-icon v-if="showEdit" class="ml-0.5 opacity-60 transition-opacity group-hover:text-red-500 group-hover:opacity-100" @click.stop="removeTag(tag.name)">
          <Close />
        </el-icon>
      </span>
      <button
        v-if="!showEdit && !isTagsExpanded && (game.tags?.length || 0) > TAG_LIMIT"
        class="flex items-center rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-600 font-bold transition-all dark:bg-gray-700 hover:bg-gray-200 dark:text-gray-300"
        @click="isTagsExpanded = true"
      >
        <el-icon class="mr-1">
          <More />
        </el-icon> 还有 {{ (game.tags?.length || 0) - TAG_LIMIT }} 个
      </button>
      <button v-if="!showEdit && isTagsExpanded" class="px-3 py-1.5 text-xs text-gray-400 font-medium hover:text-blue-500" @click="isTagsExpanded = false">
        收起
      </button>
      <div v-if="showEdit" class="ml-2 flex items-center gap-2">
        <el-select v-model="createTagID" size="small" filterable placeholder="选择标签" :empty-values="[null, undefined, 0]" class="w-36">
          <el-option v-for="t in tags" :key="t.id" :label="t.name" :value="t.id" />
        </el-select>
        <el-input v-if="showAddTag" v-model="createTag" size="small" placeholder="新建" class="w-28" @keyup.enter="appendTag(createTag)" />
        <el-button v-else size="small" :icon="Plus" circle @click="showAddTag = true" />
      </div>
    </div>
  </div>
</template>
