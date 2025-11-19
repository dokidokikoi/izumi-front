<script setup lang="ts">
import type { CollapseModelValue } from 'element-plus'
import type { PathInfo } from '~/types'
import { Document, Folder, Select, SwitchFilled } from '@element-plus/icons-vue'
import { libraryApi, policyApi } from '~/apis/game'

defineOptions({
  name: 'IndexPage',
})
const gameStore = useGameStore()
const library = ref('/')
const libraries = ref<PathInfo[]>([])
const activeNames = ref('')
function handleChange(val: CollapseModelValue) {
  console.warn(val)
}

function list(path: string) {
  libraryApi.ls(path, gameStore.libraryNoScrap).then((res) => {
    libraries.value = res.data.list
    libraries.value = libraries.value.filter((e) => {
      return e.is_dir
    })
  })
}

function getName(path: string) {
  return path.split('/')[path.split('/').length - 1]
}

onMounted(() => {
  policyApi.get().then((res) => {
    for (const [k, v] of Object.entries(res.data)) {
      if (k === 'system') {
        gameStore.gameLibrary = JSON.parse(v).game_library
        break
      }
    }
    if (gameStore.gameLibrary.length > 0) {
      if (gameStore.selectedGameLibrary !== gameStore.gameLibrary[0]) {
        gameStore.selectedGameLibrary = gameStore.gameLibrary[0]
      }
      else {
        list(library.value)
      }
    }
  })
})

watch(
  () => gameStore.libraryNoScrap,
  () => {
    list(library.value)
  },
)

watch(
  () => gameStore.selectedGameLibrary,
  () => {
    library.value = gameStore.selectedGameLibrary
    list(library.value)
  },
)
</script>

<template>
  <div class="demo-collapse">
    <el-collapse v-model="activeNames" accordion @change="handleChange">
      <el-collapse-item v-for="item in libraries" :key="item.path" :title="item.path" :name="item.path">
        <template #title>
          <div flex items-center>
            <el-icon :size="20" ml-1 mr-2>
              <SwitchFilled />
            </el-icon>
            <span mr-2 text-lg font-800>{{ getName(item.path) }}</span>
            <a style="" :href="`/scrap?keyword=${getName(item.path)}&path=${item.path}`"><el-icon class="check"><Select /></el-icon></a>
          </div>
        </template>
        <div>
          <p
            v-for="i in item.child" :key="i.path"
            style="font-size: 16px;padding-left: 16px;"
            class="bg-#191919 text-left"
          >
            <el-icon v-if="i.is_dir">
              <Folder />
            </el-icon>
            <el-icon v-else>
              <Document />
            </el-icon>
            {{ i.path.split("/")[i.path.split("/").length - 1] }}

            <a style="" :href="`/scrap?keyword=${getName(i.path)}&path=${item.path}`"><el-icon class="check"><Select /></el-icon></a>
          </p>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
</route>
