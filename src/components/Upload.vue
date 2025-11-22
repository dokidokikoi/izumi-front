<script setup lang="ts">
import axios from 'axios'
import { ElMessage } from 'element-plus'

interface Props {
  modelValue?: string | null // 上传后的文件 URL
  action: string // 上传接口
  accept?: string // 接受的类型
  multiple?: boolean // 多选
  autoUpload?: boolean // 自动上传
}

const props = withDefaults(defineProps<Props>(), {
  accept: '*',
  multiple: false,
  autoUpload: true,
})

const emit = defineEmits(['update:modelValue', 'success', 'error'])

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const progress = ref(0)
const dragActive = ref(false)

function openPicker() {
  fileInput.value?.click()
}

function onFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files || files.length === 0)
    return

  if (!props.autoUpload)
    return

  upload(files[0])
}

async function upload(file: File) {
  uploading.value = true
  progress.value = 0

  const form = new FormData()
  form.append('file', file)

  try {
    const res = await axios.post(props.action, form, {
      onUploadProgress(e) {
        if (e.total) {
          progress.value = Math.round((e.loaded / e.total) * 100)
        }
      },
    })

    emit('update:modelValue', res.data.path)
    emit('success', res.data)

    ElMessage.success('上传成功')
  }
  catch (err) {
    emit('error', err)
    ElMessage.error('上传失败')
  }
  finally {
    uploading.value = false
  }
}

// 拖拽
function onDragOver(e: DragEvent) {
  e.preventDefault()
  dragActive.value = true
}

function onDragLeave() {
  dragActive.value = false
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  dragActive.value = false
  if (!e.dataTransfer?.files?.length)
    return

  upload(e.dataTransfer.files[0])
}
</script>

<template>
  <div
    class="upload-wrapper flex cursor-pointer select-none items-center justify-center border-2 border-gray-300 rounded-xl border-dashed p4 transition dark:border-gray-700 hover:border-primary"
    :class="dragActive ? 'border-primary' : 'border-gray-300 dark:border-gray-600'"
    @click="openPicker"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <input
      ref="fileInput"
      type="file"
      class="hidden"
      :accept="accept"
      :multiple="multiple"
      @change="onFileChange"
    >

    <slot name="content">
      <!-- 默认渲染样式 -->
      <!-- 内容 -->
      <div class="flex flex-col items-center gap2 text-center">
        <div
          v-if="!uploading"
          class="i-carbon-upload h-8 w-8 text-gray-400"
        />
        <div
          v-else
          class="i-carbon-circle-dash relative h-8 w-8 animate-spin text-blue-500"
        />

        <div class="text-sm text-gray-500 dark:text-gray-400">
          <template v-if="!uploading">
            点击或拖拽上传
          </template>
          <template v-else>
            上传中 {{ progress }}%
          </template>
        </div>
      </div>
    </slot>

    <!-- 进度条 -->
    <div
      v-if="uploading"
      class="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all"
      :style="{ width: `${progress}%` }"
    />
  </div>
</template>

<style scoped>
</style>
