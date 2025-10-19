<script setup lang="ts">
import type { UploadInstance, UploadRawFile } from 'element-plus'
import type { Category, Character, Developer, Game, GameInstance, Series, Staff, Tag } from '~/types'
import { Clock, FolderOpened, Guide, Monitor, OfficeBuilding, Plus } from '@element-plus/icons-vue'
import { genFileId } from 'element-plus'
import { categoryApi, developerApi, gameApi, personApi, seriesApi, tagApi } from '~/apis/game'

import { imageUrl } from '~/utils/image'

// 模拟接口数据，实际应从 API 获取
const route = useRoute()
const gameId = computed(() => (route.params as { id: number }).id)

const game = ref<Partial<Game>>({})
const gameIns = ref<GameInstance[]>([])
const editGame = ref<Partial<Game>>({})
const editGameIns = ref<GameInstance[]>([])
const categories = ref<Category[]>([])
const series = ref<Series[]>([])
const tags = ref<Tag[]>([])
const developers = ref<Developer[]>([])

const gameStore = useGameStore()

const createCategoryID = ref<number>(0)
const createDeveloperID = ref(0)
function getGame() {
  gameApi.get(gameId.value).then((res) => {
    game.value = res.data
    editGame.value = JSON.parse(JSON.stringify(res.data))
    if (res.data.category) {
      createCategoryID.value = res.data.category.id
    }
    if (res.data.developer) {
      createDeveloperID.value = res.data.developer.id
    }
  })
}

function getIns() {
  gameApi.getIns(gameId.value).then((res) => {
    gameIns.value = res.data.list
    editGameIns.value = JSON.parse(JSON.stringify(res.data.list))
  })
}

// 初始化
function getCategories() {
  return categoryApi.list().then((res) => {
    categories.value = res.data
  })
}
function getSeries() {
  return seriesApi.list().then((res) => {
    series.value = res.data.list
  })
}
function getTags() {
  return tagApi.list().then((res) => {
    tags.value = res.data.list
  })
}
function getDevelopers() {
  return developerApi.list().then((res) => {
    developers.value = res.data.list
  })
}

onMounted(() => {
  getGame()
  getIns()
  getTags()
  getCategories()
  getSeries()
  getDevelopers()
})

// tabs
const tabs = ['故事', '角色', '图片集', '参与成员', '相关链接']
const activeTab = ref('故事')

// 监听 showEdit，执行游戏更新
const showUpdate = ref(false)
function updateGame() {
  gameApi.update(editGame.value).then(() => {
    showUpdate.value = false
    game.value = editGame.value
    getGame()
    getIns()
  })
}
watch(
  () => gameStore.showEdit,
  (newVal) => {
    if (!newVal) {
      showUpdate.value = true
    }
  },
)

// 别名
const showAddAlias = ref(false)
const createAlias = ref('')
function appendAlias() {
  if (!editGame.value.alias) {
    editGame.value.alias = []
  }
  editGame.value.alias?.push(createAlias.value)
  createAlias.value = ''
  showAddAlias.value = false
}
function removeAlias(index: number) {
  editGame.value.alias?.splice(index, 1)
}

// 游戏发行商
const createDeveloper = ref<string>('')
const showAddDeveloper = ref(false)
function appendDeveloper(d: string | undefined) {
  if (!d) {
    return
  }
  developerApi.create(d).then((res) => {
    getDevelopers().then(() => {
      developers.value.forEach((d) => {
        if (d.id === res.data) {
          editGame.value.developer = d
          createDeveloperID.value = res.data
        }
      })
    })
  })
}
// 监听 createDeveloperID
watch(
  () => createDeveloperID.value,
  (newVal) => {
    if (newVal) {
      editGame.value.developer = developers.value.find(t => t.id === newVal)
    }
  },
)

// 分类
const createCategory = ref<string>('')
const showCategory = ref(false)
function appendCategory(category: string | undefined) {
  if (!category) {
    return
  }
  categoryApi.create(category).then((res) => {
    getCategories().then(() => {
      categories.value.forEach((category) => {
        if (category.id === res.data) {
          editGame.value.category = category
          createCategoryID.value = res.data
        }
      })
    })
  })
}
// 监听 createCategoryID
watch(
  () => createCategoryID.value,
  (newVal) => {
    if (newVal) {
      editGame.value.category = categories.value.find(category => category.id === newVal)
    }
  },
)

// 游戏系列
const createSeries = ref<string>('')
const showAddSeries = ref(false)
const createSeriesID = ref(0)
function removeSeries(index: number) {
  editGame.value.series?.splice(index, 1)
}
function appendSeries(s: string | undefined) {
  if (!s) {
    return
  }
  if (!editGame.value.series) {
    editGame.value.series = []
  }
  seriesApi.create(s).then((res) => {
    getSeries().then(() => {
      series.value.forEach((s) => {
        if (s.id === res.data) {
          editGame.value.series?.push(s)
        }
      })
    })
  })
}
// 监听 createSeriesID
watch(
  () => createSeriesID.value,
  (newVal) => {
    if (newVal) {
      if (!editGame.value.series) {
        editGame.value.series = []
      }
      const s = series.value.find(t => t.id === newVal)
      if (s) {
        editGame.value.series?.push(s)
        createSeriesID.value = 0
      }
    }
  },
)

// 游戏标签
const createTag = ref<string>('')
const showAddTag = ref(false)
const createTagID = ref(0)
function removeTag(tag: string) {
  if (editGame.value.tags?.find(t => t.name === tag)) {
    editGame.value.tags = editGame.value.tags?.filter(t => t.name !== tag)
  }
}
function appendTag(t: string | undefined) {
  if (!t) {
    return
  }
  if (!editGame.value.tags) {
    editGame.value.tags = []
  }
  else if (editGame.value.tags.find(tag => tag.name === t)) {
    return
  }
  const tt = tags.value.find(tag => tag.name === t)
  if (tt) {
    editGame.value.tags.push(tt)
    return
  }
  tagApi.create(t).then((res) => {
    getTags().then(() => {
      tags.value.forEach((t) => {
        if (t.id === res.data) {
          editGame.value.tags?.push(t)
        }
      })
    })
  })
}
// 监听 createTagID
watch(
  () => createTagID.value,
  (newVal) => {
    if (newVal) {
      if (!editGame.value.tags) {
        editGame.value.tags = []
      }
      if (editGame.value.tags.find(t => t.id === newVal)) {
        createTagID.value = 0
        return
      }
      const t = tags.value.find(t => t.id === newVal)
      if (t) {
        editGame.value.tags?.push(t)
        createTagID.value = 0
      }
    }
  },
)

// 游戏角色
const showCharacterAddAlias = ref(false)
const createCharacterAlias = ref('')
// const searchCharacterLoading = ref(false)
const characters = ref<Character[]>([])
const searchCharacterID = ref(0)
function removeCharacterAlias(idx: number, alias: string) {
  if (!editGame.value.characters || !editGame.value.characters[idx].alias) {
    return
  }
  editGame.value.characters[idx].alias = editGame.value.characters[idx].alias.filter(a => a !== alias)
}
function appendCharacterAlias(idx: number, alias: string) {
  if (!editGame.value.characters) {
    showCharacterAddAlias.value = false
    return
  }
  if (!editGame.value.characters[idx].alias) {
    editGame.value.characters[idx].alias = []
  }
  editGame.value.characters[idx].alias.push(alias)
  showCharacterAddAlias.value = false
}
function addCharacter() {
  if (!editGame.value.characters) {
    editGame.value.characters = []
  }
  editGame.value.characters.unshift({
    id: 0,
    name: '',
    alias: [],
    cover: '',
    images: [],
    tags: [],
    summary: '',
    gender: '',
    relation: '',
    cv: {
      id: 0,
      name: '',
      alias: [],
      cover: '',
      images: [],
      tags: [],
      summary: '',
      gender: '',
      relation: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    games: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    weight: 1,
  })
}
// function searchCharacter(keyword: string) {
//   searchCharacterLoading.value = true
//   characters.value = []
//   if (keyword === '') {
//     searchCharacterLoading.value = false
//     return
//   }

//   characterApi.search({
//     keyword,
//   }).then((res) => {
//     characters.value = res.data.list
//     searchCharacterLoading.value = false
//   })
// }
// 监听 searchCharacterID
watch(
  () => searchCharacterID.value,
  (newVal) => {
    if (newVal) {
      if (!editGame.value.characters) {
        editGame.value.characters = []
      }
      if (!editGame.value.characters.find(t => t.id === newVal)) {
        const c = characters.value.find(t => t.id === newVal)
        if (c) {
          if (c.cv && c.cv.id) {
            if (!editGame.value.staff) {
              editGame.value.staff = []
            }
            if (!editGame.value.staff.find(t => t.id === c.cv?.id)) {
              personApi.get(c.cv?.id).then((res) => {
                if (!res.data.relation) {
                  res.data.relation = []
                }
                res.data.relation.push('cv')
                editGame.value.staff?.push(res.data)
              })
            }
          }
          editGame.value.characters.unshift(c)
        }
      }
    }
  },
)

// 游戏参与人员
const searchPersonID = ref(0)
// const searchPersonLoading = ref(false)
const persons = ref<Staff[]>([])
function addStaff() {
  if (!editGame.value.staff) {
    editGame.value.staff = []
  }
  editGame.value.staff.unshift({
    id: 0,
    name: '',
    alias: [],
    cover: '',
    images: [],
    tags: [],
    summary: '',
    gender: '',
    relation: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
}
function createStaff(index: number) {
  if (!editGame.value.staff) {
    return
  }
  personApi.upsert(editGame.value.staff[index]).then((res) => {
    if (!editGame.value.staff) {
      return
    }
    editGame.value.staff[index].id = res.data
  })
}
// function searchPerson(keyword: string) {
//   searchPersonLoading.value = true
//   persons.value = []
//   if (keyword === '') {
//     searchPersonLoading.value = false
//     return
//   }

//   personApi.search({
//     keyword,
//   }).then((res) => {
//     persons.value = res.data.list
//     searchPersonLoading.value = false
//   })
// }
// 监听 searchPersonID
watch(
  () => searchPersonID.value,
  (newVal) => {
    if (newVal) {
      if (!editGame.value.staff) {
        editGame.value.staff = []
      }
      if (!editGame.value.staff.find(t => t.id === newVal)) {
        const p = persons.value.find(t => t.id === newVal)
        if (p) {
          editGame.value.staff.unshift(p)
        }
      }
    }
  },
)

// 游戏相关链接
function appendLink() {
  if (!editGame.value.links) {
    editGame.value.links = []
  }
  editGame.value.links.push({
    name: '',
    url: '',
    type: '',
  })
}
function removeLink(index: number) {
  editGame.value.links?.splice(index, 1)
}

// 上传角色封面
const characterCoverUploadRefs = ref<Record<number, UploadInstance | null>>({})
function getUploadUrl() {
  const prefix = import.meta.env.VITE_API_BASE || window.location.origin.concat('/api')
  return prefix.concat('/file/upload')
}
function handleCharacterCoverExceed(idx: number, files: File[]) {
  const uploadRef = characterCoverUploadRefs.value[idx]
  if (!uploadRef)
    return
  uploadRef.clearFiles()
  const file = files[0] as UploadRawFile
  file.uid = genFileId()
  uploadRef.handleStart(file)
  uploadRef.submit()
}
function handleCharacterCoverUploadSuccess(idx: number) {
  return (response: any) => {
    editGame.value.characters![idx].cover = response.data.path
  }
}
function handleCharacterCoverBeforeRemove(idx: number) {
  return () => {
    editGame.value.characters![idx].cover = ''
  }
}

// 上传角色图片
const characterImageUploadRefs = ref<Record<number, UploadInstance | null>>({})
function handleCharacterImageUploadSuccess(idx: number) {
  return (response: any) => {
    if (!editGame.value.characters![idx].images) {
      editGame.value.characters![idx].images = []
    }
    editGame.value.characters![idx].images.push(response.data.path)
  }
}
function rmCharacterImage(idx: number, image: string) {
  if (editGame.value.characters![idx].images) {
    editGame.value.characters![idx].images = editGame.value.characters![idx].images.filter(t => t !== image)
  }
}

// 上传游戏图片
const imageUploadRef = ref<UploadInstance>()
function handleImageUploadSuccess(response: any) {
  if (!editGame.value.images) {
    editGame.value.images = []
  }
  editGame.value.images.unshift(response.data.path)
}
function rmImage(image: string) {
  editGame.value.images = editGame.value.images?.filter(t => t !== image)
}
</script>

<template>
  <div text-left>
    <h1 v-if="!gameStore.showEdit" class="mb6 text-4xl font-bold">
      {{ game?.name }}
    </h1>
    <div v-if="gameStore.showEdit" class="mb6 text-4xl font-bold">
      <TheInput v-model="editGame.name" w-full text-left placeholder="请输入游戏名称" />
    </div>
    <div>
      <!-- 顶部元数据 -->
      <div class="flex flex-col gap-6 md:flex-row">
        <div class="w-64 flex-shrink-0">
          <img :src="imageUrl(game?.cover)" alt="cover" class="w-full rounded-xl object-cover shadow-lg">
        </div>
        <div class="flex-1 space-y-3">
          <div flex items-start>
            <div w-30 flex items-center>
              <div mr-1 flex items-center rounded-lg bg-gray-100 p-1 dark:bg-gray-800>
                <el-icon :size="20">
                  <Guide color-blue />
                </el-icon>
              </div>
              <span class="font-semibold">别名：</span>
            </div>
            <div flex-1>
              <span v-if="!gameStore.showEdit" text-lg>{{ game?.alias?.join(', ') }}</span>
              <div v-else flex items-center>
                <template v-for="(alias, index) in editGame.alias" :key="index">
                  <p
                    class="mb-1 mr-2 mt-1 flex items-center border rounded bg-gray-50 px-1 text-center dark:bg-gray-600"
                  >
                    {{ alias }}
                    <button class="ml-1 flex flex-1 cursor-pointer items-center rounded-full hover:bg-gray-800" @click="removeAlias(index)">
                      <div i="carbon-close" class="z-20 h-4 w-4" />
                    </button>
                  </p>
                </template>
                <input
                  v-if="showAddAlias"
                  v-model="createAlias"
                  type="text"
                  class="mt-0 flex-1 border rounded pl-2"
                  placeholder="输入游戏别名"
                  @keydown.enter="appendAlias"
                >
                <button v-else class="flex items-center rounded-full bg-green-500 p1" @click="showAddAlias = true">
                  <div i="carbon-add-large" class="z-20 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <div flex items-center>
            <div w-30 flex items-center>
              <div mr-1 flex items-center rounded-lg bg-gray-100 p-1 dark:bg-gray-800>
                <el-icon :size="20">
                  <OfficeBuilding color-blue />
                </el-icon>
              </div>
              <span class="font-semibold">厂商：</span>
            </div>
            <div flex-1>
              <span v-if="!gameStore.showEdit" text-lg>{{ game?.developer?.name }}</span>
              <div v-else flex flex-1 flex-wrap items-center>
                <el-select v-model="createDeveloperID" placeholder="游戏发行商" :empty-values="[null, undefined, 0]" mr-2 w-64>
                  <el-option
                    v-for="developer in developers" :key="developer.id"
                    :value="developer.id"
                    :label="developer.name"
                  />
                </el-select>
                <input
                  v-if="showAddDeveloper"
                  v-model="createDeveloper"
                  type="text"
                  class="mt-0 flex-1 border rounded p-1"
                  placeholder="输入游戏发行商"
                  @keydown.enter="() => { appendDeveloper(createDeveloper); showAddDeveloper = false; createDeveloper = '' }"
                >
                <button v-else class="flex items-center rounded-full bg-green-500 p1" @click="showAddDeveloper = true">
                  <div i="carbon-add-large" class="z-20 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <div flex items-center>
            <div w-30 flex items-center>
              <div mr-1 flex items-center rounded-lg bg-gray-100 p-1 dark:bg-gray-800>
                <el-icon :size="20">
                  <FolderOpened color-blue />
                </el-icon>
              </div>
              <span class="font-semibold">分类：</span>
            </div>
            <div flex-1>
              <span v-if="!gameStore.showEdit" text-lg>{{ game?.category?.name }}</span>
              <div v-else flex flex-1 flex-wrap items-center>
                <el-select v-model="createCategoryID" placeholder="游戏分类" :empty-values="[null, undefined, 0]" class="mr-2 w64">
                  <el-option
                    v-for="category in categories" :key="category.id"
                    :value="category.id"
                    :label="category.name"
                  />
                </el-select>
                <input
                  v-if="showCategory"
                  v-model="createCategory"
                  type="text"
                  class="mt-0 flex-1 border rounded px-2 py-1"
                  placeholder="输入游戏分类"
                  @keydown.enter="() => { appendCategory(createCategory); showCategory = false; createCategory = '' }"
                >
                <button v-else class="flex items-center rounded-full bg-green-500 p1" @click="showCategory = true">
                  <div i="carbon-add-large" class="z-20 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <div flex items-center>
            <div w-30 flex items-center>
              <div mr-1 flex items-center rounded-lg bg-gray-100 p-1 dark:bg-gray-800>
                <el-icon :size="20">
                  <FolderOpened color-blue />
                </el-icon>
              </div>
              <span class="font-semibold">系列：</span>
            </div>
            <div flex-1>
              <template v-if="!gameStore.showEdit">
                <p v-for="s in game.series" :key="s.id" text-lg>
                  {{ s.name }}
                </p>
              </template>
              <div v-else flex flex-1 flex-wrap items-center>
                <template v-for="(s, index) in editGame.series" :key="index">
                  <p
                    class="mr-2 flex items-center border rounded bg-gray-50 px-1 text-center dark:bg-gray-600"
                  >
                    {{ s.name }}
                    <button class="ml-1 flex cursor-pointer items-center rounded-full hover:bg-gray-800" @click="removeSeries(index)">
                      <div i="carbon-close" class="z-20 h-4 w-4" />
                    </button>
                  </p>
                </template>
                <el-select v-model="createSeriesID" :empty-values="[null, undefined, 0]" placeholder="游戏系列" class="mr-2 w96">
                  <el-option
                    v-for="s in series" :key="s.id"
                    :value="s.id"
                    :label="s.name"
                  />
                </el-select>
                <input
                  v-if="showAddSeries"
                  v-model="createSeries"
                  type="text"
                  class="mt-0 flex-1 border rounded px-2 py-1"
                  placeholder="输入游戏系列"
                  @keydown.enter="() => { appendSeries(createSeries); showAddSeries = false; createSeries = '' }"
                >
                <button v-else class="flex items-center rounded-full bg-green-500 p1" @click="showAddSeries = true">
                  <div i="carbon-add-large" class="z-20 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <div flex items-start>
            <div w-30 flex items-center>
              <div mr-1 flex items-center rounded-lg bg-gray-100 p-1 dark:bg-gray-800>
                <div i="carbon-tag" class="z-20 h-[20px] w-[20px] color-blue" />
              </div>
              <span class="font-semibold">标签：</span>
            </div>
            <div flex-1>
              <template v-if="!gameStore.showEdit">
                <span
                  v-for="tag in game.tags" :key="tag.id"
                  class="mb-1 mr-1 inline-block cursor-pointer whitespace-nowrap border border-gray-600 rounded px-2 py-1 text-sm dark:border-white"
                >
                  {{ tag.name }}
                </span>
              </template>
              <div v-else flex flex-1 flex-wrap items-center>
                <template v-for="(tag, index) in editGame.tags" :key="index">
                  <span
                    class="mb-1 mr-1 inline-block flex cursor-pointer items-center whitespace-nowrap border border-gray-600 rounded px-2 py-1 text-sm dark:border-white"
                  >
                    {{ tag.name }}
                    <button class="ml-1 flex cursor-pointer items-center rounded-full hover:bg-gray-800" @click="removeTag(tag.name)">
                      <div i="carbon-close" class="z-20 h-4 w-4" />
                    </button>
                  </span>
                </template>
                <el-select v-model="createTagID" placeholder="标签" :empty-values="[null, undefined, 0]" class="mr-2 w64">
                  <el-option
                    v-for="tag in tags" :key="tag.id"
                    :value="tag.id"
                    :label="tag.name"
                  />
                </el-select>
                <input
                  v-if="showAddTag"
                  v-model="createTag"
                  type="text"
                  class="mt-0 flex-1 border rounded px-2 py-1"
                  placeholder="输入游戏标签"
                  @keydown.enter="() => { appendTag(createTag); showAddTag = false; createTag = '' }"
                >
                <button v-else class="flex items-center rounded-full bg-green-500 p1" @click="showAddTag = true">
                  <div i="carbon-add-large" class="z-20 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <div flex items-center>
            <div w-30 flex items-center>
              <div mr-1 flex items-center rounded-lg bg-gray-100 p-1 dark:bg-gray-800>
                <el-icon :size="20">
                  <Monitor color-blue />
                </el-icon>
              </div>
              <span class="font-semibold">平台: </span>
            </div>
            <div flex-1>
              <span />
            </div>
          </div>
          <div flex items-center>
            <div w-30 flex items-center>
              <div mr-1 flex items-center rounded-lg bg-gray-100 p-1 dark:bg-gray-800>
                <div i="carbon-ibm-watson-language-translator" class="z-20 h-[20px] w-[20px] color-blue" />
              </div>
              <span class="font-semibold">语言: </span>
            </div>
            <div flex-1>
              <span />
            </div>
          </div>
          <div flex items-center>
            <div w-30 flex items-center>
              <div mr-1 flex items-center rounded-lg bg-gray-100 p-1 dark:bg-gray-800>
                <el-icon :size="20">
                  <Clock color-blue />
                </el-icon>
              </div>
              <span class="font-semibold">发布时间：</span>
            </div>
            <div flex-1>
              <span v-if="!gameStore.showEdit">{{ game.issue_date?.slice(0, 10) }}</span>
              <el-date-picker
                v-else
                v-model="editGame.issue_date"
                type="date"
                placeholder="Pick a day"
                size="default"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="mt-8">
        <div class="flex border-b border-gray-300">
          <div
            v-for="tab in tabs"
            :key="tab"
            class="cursor-pointer px-4 py-2"
            :class="activeTab === tab ? 'border-b-2 border-blue-500 text-blue-500 font-semibold' : 'text-gray-400'"
            @click="activeTab = tab"
          >
            <div flex items-center>
              {{ tab }}
              <button v-if="gameStore.showEdit && tab === '参与成员'" class="ml-1 flex items-center rounded-full bg-green-500 p1" @click="addStaff">
                <div i="carbon-add-large" class="z-20 h-4 w-4" />
              </button>
              <button v-if="gameStore.showEdit && tab === '角色'" class="ml-1 flex items-center rounded-full bg-green-500 p1" @click="addCharacter">
                <div i="carbon-add-large" class="z-20 h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Tab 内容 -->
        <div class="mt-4 min-h-[200px]">
          <!-- 故事 -->
          <div v-if="activeTab === '故事'">
            <div class="flex items-center rounded-lg bg-white p-4 shadow dark:bg-gray-800">
              <p v-if="!gameStore.showEdit" class="leading-relaxed" v-html="game?.story" />
              <el-input
                v-else
                v-model="editGame.story"
                type="textarea"
                autosize
              />
            </div>
          </div>

          <!-- 角色 -->
          <div v-else-if="activeTab === '角色'" class="space-y-4">
            <template v-if="!gameStore.showEdit">
              <div
                v-for="character in game.characters"
                :key="character.id"
                class="items-center rounded-lg bg-white p-4 shadow dark:bg-gray-800"
              >
                <el-row :gutter="20" w-full>
                  <el-col :span="6">
                    <el-image
                      :src="imageUrl(character.cover)"
                      alt="角色头像"
                      :preview-src-list="[imageUrl(character.cover)]"
                      fit="cover"
                    />
                  </el-col>
                  <el-col :span="18">
                    <h3 class="mb-4 text-xl font-semibold">
                      {{ character.name }}
                    </h3>
                    <p v-html="character.summary" />
                  </el-col>
                </el-row>
                <el-row>
                  <el-col>
                    <div flex>
                      <el-image
                        v-for="image in character.images"
                        :key="image"
                        fit="cover"
                        :src="imageUrl(image)"
                        class="mr-1 h-25 w-25 rounded object-cover"
                        :preview-src-list="character.images?.map((img) => imageUrl(img))"
                        alt=""
                      />
                    </div>
                  </el-col>
                </el-row>
              </div>
            </template>
            <template v-else>
              <div
                v-for="(character, idx) in editGame.characters"
                :key="character.id"
                class="relative items-center rounded-lg bg-white p-4 shadow dark:bg-gray-800"
              >
                <button class="flex items-center rounded-full bg-red-500 p1" absolute right--3 top--1 @click="() => { if (editGame.characters) editGame.characters.splice(idx, 1) }">
                  <div i="carbon-subtract-large" class="z-20 h-4 w-4" />
                </button>
                <el-row w-full>
                  <el-col :span="6">
                    <el-row>
                      <el-col>
                        <el-image
                          :src="imageUrl(character.cover)"
                          alt="角色头像"
                          :preview-src-list="[imageUrl(character.cover)]"
                          fit="cover"
                        />
                      </el-col>
                    </el-row>
                    <el-row>
                      <el-col>
                        <el-upload
                          :ref="(el: UploadInstance) => { if (el) characterCoverUploadRefs[idx] = el }"
                          :action="getUploadUrl()"
                          :limit="1"
                          :on-exceed="(files: File[]) => handleCharacterCoverExceed(idx, files)"
                          :on-success="handleCharacterCoverUploadSuccess(idx)"
                          :before-remove="handleCharacterCoverBeforeRemove(idx)"
                        >
                          <template #trigger>
                            <el-button type="primary">
                              select file
                            </el-button>
                          </template>
                        </el-upload>
                      </el-col>
                    </el-row>
                  </el-col>
                  <el-col :span="18">
                    <div v-if="editGame.characters && editGame.characters[idx]" ml-4 flex-1>
                      <input v-model="character.name" type="text" class="mb-2 mt-0 w-full flex-1 border rounded p-1" placeholder="角色名">
                      <div mb-2 flex flex-1 flex-wrap items-center>
                        <template v-for="(alias, index) in character.alias" :key="index">
                          <p
                            class="mb-1 mr-2 flex items-center border rounded bg-gray-50 px-1 text-center dark:bg-gray-600"
                          >
                            {{ alias }}
                            <button class="ml-1 flex cursor-pointer items-center rounded-full hover:bg-gray-800" @click="removeCharacterAlias(idx, alias)">
                              <div i="carbon-close" class="z-20 h-4 w-4" />
                            </button>
                          </p>
                        </template>
                        <input
                          v-if="showCharacterAddAlias"
                          v-model="createCharacterAlias"
                          type="text"
                          class="mt-0 flex-1 border rounded p-1"
                          placeholder="输入角色别名"
                          @keydown.enter="appendCharacterAlias(idx, createCharacterAlias)"
                        >
                        <button v-else class="flex items-center rounded-full bg-green-500 p1" @click="showCharacterAddAlias = true">
                          <div i="carbon-add-large" class="z-20 h-4 w-4" />
                        </button>
                      </div>
                      <el-select
                        v-if="editGame.characters[idx].cv"
                        v-model="editGame.characters[idx].cv.id"
                        placeholder="CV"
                        :empty-values="[null, undefined, 0]"
                        mb-2 mr-2 w-full
                      >
                        <template v-for="s in editGame.staff" :key="s.id">
                          <el-option
                            v-if="s.id !== 0 && s.relation.find(r => r === 'cv')"
                            :label="s.name"
                            :value="s.id"
                          />
                        </template>
                      </el-select>
                      <div flex>
                        <el-select v-model="editGame.characters[idx].gender" placeholder="性别" style="width: 120px" mr-4>
                          <el-option
                            label="男"
                            value="male"
                          />
                          <el-option
                            label="女"
                            value="female"
                          />
                          <el-option
                            label="扶她"
                            value="futa"
                          />
                        </el-select>
                        <el-select v-model="editGame.characters[idx].relation" placeholder="角色" style="width: 120px">
                          <el-option
                            label="主角"
                            value="main"
                          />
                          <el-option
                            label="配角"
                            value="minor"
                          />
                          <el-option
                            label="路人"
                            value="mob"
                          />
                        </el-select>
                      </div>
                      <el-input
                        v-model="editGame.characters[idx].summary"
                        type="textarea"
                        autosize
                        class="mt-2"
                        placeholder="角色描述"
                      />
                    </div>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col>
                    <div v-if="editGame.characters && editGame.characters[idx]" flex>
                      <el-upload
                        :ref="(el: UploadInstance) => { if (el) characterImageUploadRefs[idx] = el }"
                        class="custom-upload align-center mr-1 h-25 w-25"
                        drag
                        :action="getUploadUrl()"
                        :show-file-list="false"
                        :on-success="handleCharacterImageUploadSuccess(idx)"
                      >
                        <el-icon class="avatar-uploader-icon">
                          <Plus />
                        </el-icon>
                      </el-upload>
                      <div
                        v-for="image in editGame.characters[idx].images"
                        :key="image"
                        relative
                      >
                        <button class="z-10 flex items-center rounded-full bg-red-500 p1" absolute right--1 top--1 @click="rmCharacterImage(idx, image)">
                          <div i="carbon-subtract-large" class="h-3 w-3" />
                        </button>
                        <el-image
                          fit="cover"
                          :src="imageUrl(image)"
                          class="mr-1 h-25 w-25 rounded object-cover"
                          :preview-src-list="character.images?.map((img) => imageUrl(img))"
                          alt=""
                        />
                      </div>
                    </div>
                  </el-col>
                </el-row>
              </div>
            </template>
          </div>

          <!-- 图片集 -->
          <div v-else-if="activeTab === '图片集'" class="grid grid-cols-2 gap-4 lg:grid-cols-4 md:grid-cols-3">
            <template v-if="!gameStore.showEdit">
              <div
                v-for="(img, i) in game?.images"
                :key="i"
                class="relative cursor-pointer"
              >
                <el-image
                  :src="imageUrl(img)"
                  show-progress
                  :initial-index="i"
                  :preview-src-list="game.images?.map((img) => imageUrl(img))"
                  fit="cover"
                  class="aspect-[8/5] w-full overflow-hidden"
                />
              </div>
            </template>
            <template v-else>
              <el-upload
                ref="imageUploadRef"
                class="custom-upload h-full"
                drag
                :action="getUploadUrl()"
                :show-file-list="false"
                :on-success="handleImageUploadSuccess"
              >
                <el-icon>
                  <Plus />
                </el-icon>
              </el-upload>
              <div
                v-for="(img, i) in editGame?.images"
                :key="i"
                class="relative cursor-pointer"
              >
                <button class="z-10 flex items-center rounded-full bg-red-500 p1" absolute right--1 top--1 @click="rmImage(img)">
                  <div i="carbon-subtract-large" class="h-3 w-3" />
                </button>
                <el-image
                  :src="imageUrl(img)"
                  show-progress
                  :initial-index="i"
                  :preview-src-list="editGame.images?.map((img) => imageUrl(img))"
                  fit="cover"
                  class="aspect-[8/5] w-full overflow-hidden"
                />
              </div>
            </template>
          </div>

          <!-- 参与成员 -->
          <div v-else-if="activeTab === '参与成员'">
            <template v-if="!gameStore.showEdit">
              <!-- 剧本 -->
              <div class="mb-2 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                <p mb-2 text-lg font-semibold>
                  剧本:
                </p>
                <template v-for="s in game?.staff" :key="s.id">
                  <span v-if="s.relation.find((r) => r === 'writer')" inline-block whitespace-nowrap>{{ s.name }} <span>, </span> </span>
                </template>
              </div>
              <!-- 原画 -->
              <div class="mb-2 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                <p mb-2 text-lg font-semibold>
                  原画:
                </p>
                <template v-for="s in game?.staff" :key="s.id">
                  <span v-if="s.relation.find((r) => r === 'painter')" inline-block whitespace-nowrap>{{ s.name }} <span>, </span> </span>
                </template>
              </div>
              <!-- 声优 -->
              <div class="mb-2 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                <p mb-2 text-lg font-semibold>
                  声优:
                </p>
                <template v-for="s in game?.staff" :key="s.id">
                  <span v-if="s.relation.find((r) => r === 'cv')" inline-block whitespace-nowrap>{{ s.name }} <span>, </span> </span>
                </template>
              </div>
              <!-- 音乐 -->
              <div class="mb-2 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                <p mb-2 text-lg font-semibold>
                  音乐:
                </p>
                <template v-for="s in game?.staff" :key="s.id">
                  <span v-if="s.relation.find((r) => r === 'music')" inline-block whitespace-nowrap>{{ s.name }} <span>, </span> </span>
                </template>
              </div>
            </template>
            <template v-else>
              <div v-for="(s, idx) in editGame.staff" :key="s.id" class="relative mb-2 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                <template v-if="editGame.staff && editGame.staff[idx]">
                  <button v-if="s.id === 0" class="flex items-center rounded-full bg-green-500 p1" absolute right--3 top-0 @click="createStaff(idx)">
                    <div i="carbon-checkmark" class="z-20 h-4 w-4" />
                  </button>
                  <button class="flex items-center rounded-full bg-red-500 p1" absolute right--3 top-8 @click="() => { if (editGame.staff) editGame.staff.splice(idx, 1) }">
                    <div i="carbon-subtract-large" class="z-20 h-4 w-4" />
                  </button>
                  <div mb-2 flex>
                    <el-image fit="cover" :src="imageUrl(s.cover)" class="h-30 w-30 object-cover" alt="" />
                    <div ml-4 flex-1>
                      <input v-model="editGame.staff[idx].name" type="text" class="mb-2 mt-0 w-full flex-1 border rounded px-2 py-1" placeholder="姓名">
                      <div mb-2>
                        <el-select v-model="editGame.staff[idx].gender" placeholder="性别" style="width: 240px">
                          <el-option
                            label="男"
                            value="male"
                          />
                          <el-option
                            label="女"
                            value="female"
                          />
                          <el-option
                            label="扶她"
                            value="futa"
                          />
                        </el-select>
                      </div>
                      <div>
                        <el-select v-model="editGame.staff[idx].relation" multiple placeholder="分工" style="width: 240px">
                          <el-option
                            label="剧本"
                            value="writer"
                          />
                          <el-option
                            label="原画"
                            value="painter"
                          />
                          <el-option
                            label="声优"
                            value="cv"
                          />
                          <el-option
                            label="音乐"
                            value="music"
                          />
                        </el-select>
                      </div>
                    </div>
                  </div>
                  <div flex>
                    <el-image v-for="image in s.images" :key="image" fit="cover" :src="imageUrl(image)" class="h-20 w-20 object-cover" alt="" />
                  </div>
                  <div flex items-center>
                    <input v-model="editGame.staff[idx].cover" type="text" class="mb-2 mt-0 mt-2 w-full flex-1 border rounded p-1" placeholder="封面">
                    <button class="ml-2 h-7 w-10 flex items-center justify-center rounded-md bg-green-500 p1" @click="editGame.staff[idx].images.push('')">
                      <div i="carbon-add-large" class="z-20 h-4 w-4" />
                    </button>
                  </div>
                  <div v-for="(image, index) in s.images" :key="image" flex items-center>
                    <input v-model="editGame.staff[idx].images[index]" type="text" class="mb-2 mt-0 mt-2 w-full flex-1 border rounded p-1" placeholder="图片">
                    <button class="ml-2 h-7 w-10 flex items-center justify-center rounded-md bg-green-500 p1" @click="() => { if (editGame.staff) editGame.staff[idx].images.splice(index, 1) }">
                      <div i="carbon-subtract-large" class="z-20 h-4 w-4" />
                    </button>
                  </div>
                  <textarea
                    v-model="editGame.staff[idx].summary"
                    type="textarea"
                    rows="2"
                    class="w-full flex-1 border rounded p-2"
                    placeholder="描述"
                  />
                </template>
              </div>
            </template>
          </div>

          <div v-else-if="activeTab === '相关链接'">
            <template v-if="!gameStore.showEdit">
              <p v-for="link in game.links" :key="link.url" mb-2>
                <el-link type="success" :href="link.url" target="_blank" text-lg>
                  {{ link.name }}
                </el-link>
              </p>
            </template>
            <template v-else>
              <div flex-1>
                <div v-for="index in editGame.links?.length" :key="index" mb-2 flex items-center>
                  <input
                    v-if="editGame.links"
                    v-model="editGame.links[index - 1].name"
                    type="text"
                    mr-2
                    class="mt-0 flex-1 border rounded p-1"
                    placeholder="输入游戏相关链接名"
                  >
                  <input
                    v-if="editGame.links"
                    v-model="editGame.links[index - 1].url"
                    type="text"
                    mr-2
                    class="mt-0 flex-1 border rounded p-1"
                    placeholder="输入游戏相关链接"
                  >
                  <button class="flex items-center rounded-full bg-red-500 p1" @click="removeLink(index - 1)">
                    <div i="carbon-close" class="z-20 h-4 w-4" />
                  </button>
                </div>
                <button class="flex items-center rounded-full bg-green-500 p1" @click="appendLink">
                  <div i="carbon-add-large" class="z-20 h-4 w-4" />
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>

  <el-dialog
    v-model="showUpdate"
    title="Update confirm"
    width="500"
  >
    <span>是否更新游戏信息</span>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="showUpdate = false">
          Cancel
        </el-button>
        <el-button type="primary" @click="updateGame">
          Confirm
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
:deep(.custom-upload .is-drag) {
  height: 100%;
  width: 100%;
}
:deep(.custom-upload .el-upload-dragger) {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

<route lang="yaml">
meta:
  layout: default
</route>
