<script setup lang="ts">
import type { Brand, Category, Character, Game, GameInstance, Series, Staff, Tag } from '~/types'
import { ElMessage, ElNotification } from 'element-plus'
import { brandApi, categoryApi, characterApi, gameApi, personApi, scrapApi, seriesApi, tagApi } from '~/apis/game'
import { genderEnum, languageEnum, platformEnum, roleEnum, workEnum } from '~/config/enum'
import { useGameStore } from '~/stores/gameStore'
import { imageUrl } from '~/utils/image'
import { useWebSocket } from '~/utils/websocket'

const props = defineProps({
  visible: { type: Boolean, default: false },
  gamePath: { type: String, default: '' },
})

const gameStore = useGameStore()
const rid = ref('')

const scrapAllGames = ref<Game[]>([])
const scrapGameIndex = ref(0)
const createGame = ref<Partial<Game>>({
  images: [],
})
const createGameIns = ref<Partial<GameInstance>>({
  path: props.gamePath,
})
const showGameIns = ref(false)

const categories = ref<Category[]>([])
const series = ref<Series[]>([])
const tags = ref<Tag[]>([])
const brands = ref<Brand[]>([])

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
function getBrands() {
  return brandApi.list().then((res) => {
    brands.value = res.data.list
  })
}

onMounted(() => {
  getCategories()
  getSeries()
  getTags()
  getBrands()
})

async function copyText(text: string) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      ElMessage.success('复制成功')
    }
    else {
      // 兼容性处理
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      textArea.remove()
      ElMessage.success('复制成功')
    }
  }
  catch (err) {
    console.error('复制失败:', err)
  }
};

// 图片
const showAddImage = ref(false)
const imageDetails = ref(true)
function imageDetailsToggle(e: Event) {
  imageDetails.value = (e.target as HTMLDetailsElement).open
}
function toggleImage(image: string) {
  if (!createGame.value.images) {
    createGame.value.images = [image]
    return
  }
  if (!createGame.value.images?.find(img => img === image)) {
    createGame.value.images?.push(image)
  }
  else {
    createGame.value.images = createGame.value.images?.filter(img => img !== image)
  }
}
function removeImage(image: string) {
  if (createGame.value.images?.find(img => img === image)) {
    createGame.value.images = createGame.value.images?.filter(img => img !== image)
  }
}

// 别名
const showAddAlias = ref(false)
const createAlias = ref('')
function appendAlias() {
  if (!createGame.value.alias) {
    createGame.value.alias = []
  }
  createGame.value.alias?.push(createAlias.value)
  createAlias.value = ''
  showAddAlias.value = false
}
function removeAlias(index: number) {
  createGame.value.alias?.splice(index, 1)
}

// 分类
const createCategoryID = ref<number>(0)
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
          createGame.value.category = category
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
      createGame.value.category = categories.value.find(category => category.id === newVal)
    }
  },
)

// 游戏系列
const createSeries = ref<string>('')
const showAddSeries = ref(false)
const createSeriesID = ref(0)
function removeSeries(index: number) {
  createGame.value.series?.splice(index, 1)
}
function appendSeries(s: string | undefined) {
  if (!s) {
    return
  }
  if (!createGame.value.series) {
    createGame.value.series = []
  }
  seriesApi.create(s).then((res) => {
    getSeries().then(() => {
      series.value.forEach((s) => {
        if (s.id === res.data) {
          createGame.value.series?.push(s)
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
      if (!createGame.value.series) {
        createGame.value.series = []
      }
      const s = series.value.find(t => t.id === newVal)
      if (s) {
        createGame.value.series?.push(s)
        createSeriesID.value = 0
      }
    }
  },
)

// 游戏标签
const createTag = ref<string>('')
const showAddTag = ref(false)
const createTagID = ref(0)
function toggleTag(tag: string) {
  if (!createGame.value.tags) {
    appendTag(tag)
    return
  }
  if (!createGame.value.tags?.find(t => t.name === tag)) {
    appendTag(tag)
  }
  else {
    createGame.value.tags = createGame.value.tags?.filter(t => t.name !== tag)
  }
}
function removeTag(tag: string) {
  if (createGame.value.tags?.find(t => t.name === tag)) {
    createGame.value.tags = createGame.value.tags?.filter(t => t.name !== tag)
  }
}
function appendTag(t: string | undefined) {
  if (!t) {
    return
  }
  if (!createGame.value.tags) {
    createGame.value.tags = []
  }
  else if (createGame.value.tags.find(tag => tag.name === t)) {
    return
  }
  const tt = tags.value.find(tag => tag.name === t)
  if (tt) {
    createGame.value.tags.push(tt)
    return
  }
  tagApi.create(t).then((res) => {
    getTags().then(() => {
      tags.value.forEach((t) => {
        if (t.id === res.data) {
          createGame.value.tags?.push(t)
        }
      })
    })
  })
}
function appendTags(ts: Tag[] | undefined) {
  if (!ts) {
    return
  }
  for (const t of ts) {
    appendTag(t.name)
  }
}
// 监听 createTagID
watch(
  () => createTagID.value,
  (newVal) => {
    if (newVal) {
      if (!createGame.value.tags) {
        createGame.value.tags = []
      }
      if (createGame.value.tags.find(t => t.id === newVal)) {
        createTagID.value = 0
        return
      }
      const t = tags.value.find(t => t.id === newVal)
      if (t) {
        createGame.value.tags?.push(t)
        createTagID.value = 0
      }
    }
  },
)

// 游戏发行商
const createBrand = ref<string>('')
const showAddBrand = ref(false)
const createBrandID = ref(0)
function appendBrand(d: string | undefined) {
  if (!d) {
    return
  }
  brandApi.create(d).then((res) => {
    getBrands().then(() => {
      brands.value.forEach((d) => {
        if (d.id === res.data) {
          createGame.value.brand = d
          createBrandID.value = res.data
        }
      })
    })
  })
}
// 监听 createBrandID
watch(
  () => createBrandID.value,
  (newVal) => {
    if (newVal) {
      createGame.value.brand = brands.value.find(t => t.id === newVal)
    }
  },
)

// 游戏角色
const characterDetails = ref(false)
const showCharacterAddAlias = ref(false)
const createCharacterAlias = ref('')
const searchCharacterLoading = ref(false)
const characters = ref<Character[]>([])
const searchCharacterID = ref(0)
function characterDetailsToggle(e: Event) {
  characterDetails.value = (e.target as HTMLDetailsElement).open
}
function removeCharacterAlias(idx: number, alias: string) {
  if (!createGame.value.characters || !createGame.value.characters[idx].alias) {
    return
  }
  createGame.value.characters[idx].alias = createGame.value.characters[idx].alias.filter(a => a !== alias)
}
function appendCharacterAlias(idx: number, alias: string) {
  if (!createGame.value.characters) {
    return
  }
  if (!createGame.value.characters[idx].alias) {
    createGame.value.characters[idx].alias = []
  }
  createGame.value.characters[idx].alias.push(alias)
}
function addCharacter() {
  if (!createGame.value.characters) {
    createGame.value.characters = []
  }
  createGame.value.characters.unshift({
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
    weight: 0,
  })
}
function moveCharacter(idx: number | null) {
  if (!createGame.value.characters) {
    createGame.value.characters = []
  }
  if (idx === null) {
    scrapAllGames.value[scrapGameIndex.value].characters.forEach((c) => {
      createGame.value.characters?.push({
        id: c.id,
        name: c.name,
        alias: c.alias,
        cover: c.cover,
        images: c.images,
        tags: c.tags,
        summary: c.summary,
        gender: c.gender,
        relation: c.relation,
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
        games: c.games,
        created_at: c.created_at,
        updated_at: c.updated_at,
        weight: c.weight,
      })
    })
  }
  else if (
    scrapAllGames.value[scrapGameIndex.value]
    && scrapAllGames.value[scrapGameIndex.value].characters
    && scrapAllGames.value[scrapGameIndex.value].characters[idx]) {
    const c = scrapAllGames.value[scrapGameIndex.value].characters[idx]
    createGame.value.characters?.push({
      id: c.id,
      name: c.name,
      alias: c.alias,
      cover: c.cover,
      images: c.images,
      tags: c.tags,
      summary: c.summary,
      gender: c.gender,
      relation: c.relation,
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
      games: c.games,
      created_at: c.created_at,
      updated_at: c.updated_at,
      weight: 0,
    })
  }
}
function searchCharacter(keyword: string) {
  searchCharacterLoading.value = true
  characters.value = []
  if (keyword === '') {
    searchCharacterLoading.value = false
    return
  }

  characterApi.search({
    keyword,
  }).then((res) => {
    characters.value = res.data.list
    searchCharacterLoading.value = false
  })
}
// 监听 searchCharacterID
watch(
  () => searchCharacterID.value,
  (newVal) => {
    if (newVal) {
      if (!createGame.value.characters) {
        createGame.value.characters = []
      }
      if (!createGame.value.characters.find(t => t.id === newVal)) {
        const c = characters.value.find(t => t.id === newVal)
        if (c) {
          if (c.cv && c.cv.id) {
            if (!createGame.value.staff) {
              createGame.value.staff = []
            }
            if (!createGame.value.staff.find(t => t.id === c.cv?.id)) {
              personApi.get(c.cv?.id).then((res) => {
                if (!res.data.relation) {
                  res.data.relation = []
                }
                res.data.relation.push('cv')
                createGame.value.staff?.push(res.data)
              })
            }
          }
          createGame.value.characters.unshift(c)
        }
      }
    }
  },
)

// 游戏参与人员
const staffDetails = ref(false)
const searchPersonID = ref(0)
const searchPersonLoading = ref(false)
const persons = ref<Staff[]>([])
function staffDetailsToggle(e: Event) {
  staffDetails.value = (e.target as HTMLDetailsElement).open
}
function addStaff() {
  if (!createGame.value.staff) {
    createGame.value.staff = []
  }
  createGame.value.staff.unshift({
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
function moveStaff(idx: number | null) {
  if (!createGame.value.staff) {
    createGame.value.staff = []
  }
  if (idx === null) {
    scrapAllGames.value[scrapGameIndex.value].staff.forEach((s) => {
      createGame.value.staff?.push({
        id: s.id,
        name: s.name,
        alias: s.alias,
        cover: s.cover,
        images: s.images,
        tags: s.tags,
        summary: s.summary,
        gender: s.gender,
        relation: s.relation,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    })
  }
  else if (scrapAllGames.value[scrapGameIndex.value]
    && scrapAllGames.value[scrapGameIndex.value].staff
    && scrapAllGames.value[scrapGameIndex.value].staff[idx]) {
    const s = scrapAllGames.value[scrapGameIndex.value].staff[idx]
    createGame.value.staff?.push({
      id: s.id,
      name: s.name,
      alias: s.alias,
      cover: s.cover,
      images: s.images,
      tags: s.tags,
      summary: s.summary,
      gender: s.gender,
      relation: s.relation,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }
}
function createStaff(index: number) {
  if (!createGame.value.staff) {
    return
  }
  personApi.upsert(createGame.value.staff[index]).then((res) => {
    if (!createGame.value.staff) {
      return
    }
    createGame.value.staff[index].id = res.data
  })
}
function searchPerson(keyword: string) {
  searchPersonLoading.value = true
  persons.value = []
  if (keyword === '') {
    searchPersonLoading.value = false
    return
  }

  personApi.search({
    keyword,
  }).then((res) => {
    persons.value = res.data.list
    searchPersonLoading.value = false
  })
}
// 监听 searchPersonID
watch(
  () => searchPersonID.value,
  (newVal) => {
    if (newVal) {
      if (!createGame.value.staff) {
        createGame.value.staff = []
      }
      if (!createGame.value.staff.find(t => t.id === newVal)) {
        const p = persons.value.find(t => t.id === newVal)
        if (p) {
          createGame.value.staff.unshift(p)
        }
      }
    }
  },
)

// 游戏相关链接
function appendLink() {
  if (!createGame.value.links) {
    createGame.value.links = []
  }
  createGame.value.links.push({
    name: '',
    url: '',
    type: '',
  })
}
function removeLink(index: number) {
  createGame.value.links?.splice(index, 1)
}
function moveLink() {
  if (!createGame.value.links) {
    createGame.value.links = []
  }
  createGame.value.links?.push(...scrapAllGames.value[scrapGameIndex.value].links)
}

//
function commit() {
  gameApi.create({
    game: createGame.value,
    game_ins: createGameIns.value,
  }).then(() => {
    clear()
    showGameIns.value = false
    gameStore.showScraper = false
  })
}

function clear() {
  createGame.value = {
    images: [],
  }
  scrapAllGames.value = []
}

function fetchScrap() {
  scrapApi.get(rid.value).then((res) => {
    scrapAllGames.value = res.data
  })
}

onMounted(() => {
  const { connection } = useWebSocket('/notify?topic=scraper&uid=izumi_scrap')
  if (connection && connection.value) {
    connection.value.onmessage = function (event) {
      const data = JSON.parse(event.data)
      rid.value = data.rid
      if (data.event === 'detail') {
        if (data.message === 'success') {
          scrapApi.get(data.rid).then((res) => {
            scrapAllGames.value = res.data
          })
        }
        ElNotification({
          title: 'Title',
          message: data.message,
          type: 'success',
          duration: 5000,
          position: 'bottom-right',
        })
      }
    }
  }
})
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
  >
    <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900">
      <!-- header -->
      <div class="flex items-center justify-between border-b bg-gray-100 p-4 dark:bg-gray-900">
        <div class="flex items-center gap-2" />

        <div class="flex items-center gap-2">
          <button class="flex items-center rounded-full bg-red-500 p2" title="清空" @click="clear">
            <div i="carbon-trash-can" class="z-20 h-4 w-4" />
          </button>
          <button class="flex items-center rounded-full bg-green-500 p2" title="刷新" @click="fetchScrap">
            <div i="carbon-renew" class="z-20 h-4 w-4" />
          </button>
          <select v-model="scrapGameIndex" class="w120 border rounded px-2 py-1">
            <option v-for="(game, index) in scrapAllGames" :key="index" :value="index">
              {{ game.name }}
            </option>
          </select>
          <button class="flex items-center rounded bg-red-500 px-3 py-1 text-white" @click="gameStore.showScraper = !gameStore.showScraper">
            <div i="carbon-close-filled" class="w-4carbon:close-filled z-20 mr-2 h-4" />
            <p>Close</p>
          </button>
          <button class="flex items-center rounded bg-green-500 px-3 py-1 text-white" @click="showGameIns = true">
            <div i="carbon-checkmark-filled" class="w-4carbon:close-filled z-20 mr-2 h-4" />
            <p>Commit</p>
          </button>
        </div>
      </div>

      <!-- content -->
      <div class="flex-1 overflow-y-auto p-4">
        <div class="grid grid-cols-[1fr_auto_1fr] items-start gap-4">
          <!-- 游戏封面 -->
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">封面</label>
            <div flex-1>
              <div class="mb-2 aspect-[9/14] w32 overflow-hidden">
                <el-image
                  fit="cover"
                  :src="imageUrl(createGame.cover)"
                  class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <input v-model="createGame.cover" type="text" class="mt-0 w-full border rounded px-2 py-1" placeholder="输入图片地址">
            </div>
          </div>
          <button class="flex items-center rounded-full bg-green-500 p2" @click="createGame.cover = scrapAllGames[scrapGameIndex]?.cover">
            <div i="carbon-arrow-left" class="z-20 h-6 w-6" />
          </button>
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">封面</label>
            <div class="mb-2 aspect-[9/14] w32 overflow-hidden">
              <el-image
                fit="cover"
                :src="imageUrl(scrapAllGames[scrapGameIndex]?.cover)"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>

          <!-- 游戏图片 -->
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">图片</label>
            <details flex-1 text-left :open="imageDetails" @toggle="imageDetailsToggle">
              <div flex flex-1 flex-wrap items-center>
                <el-image v-for="image in createGame.images" :key="image" fit="cover" :src="imageUrl(image)" class="h-40 w-50 cursor-pointer object-cover" alt="" @click="removeImage(image)" />
                <input v-if="showAddImage" type="text" class="mt-0 w-full border rounded px-2 py-1" autofocus placeholder="输入图片地址" @keydown.enter="showAddImage = false">
                <button v-else class="ml-4 flex items-center rounded-full bg-green-500 p2" @click="showAddImage = true || createGame.images?.push('')">
                  <div i="carbon-add-large" class="z-20 h-4 w-4" />
                </button>
              </div>
            </details>
          </div>
          <button class="flex items-center rounded-full bg-green-500 p2" @click="createGame.images = scrapAllGames[scrapGameIndex]?.images">
            <div i="carbon-arrow-left" class="z-20 h-6 w-6" />
          </button>
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">图片</label>
            <details flex-1 text-left :open="imageDetails" @toggle="imageDetailsToggle">
              <div flex flex-1 flex-wrap items-center>
                <el-image
                  v-for="image in scrapAllGames[scrapGameIndex]?.images"
                  :key="image" fit="cover"
                  :src="imageUrl(image)"
                  class="h-40 w-50 cursor-pointer object-cover"
                  alt=""
                  @click="toggleImage(image)"
                  @contextmenu.prevent="copyText(image)"
                />
              </div>
            </details>
          </div>

          <!-- 游戏名称 -->
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">名称</label>
            <input v-model="createGame.name" type="text" class="mt-0 flex-1 border rounded p-2" placeholder="输入游戏名称">
          </div>
          <button class="flex items-center rounded-full bg-green-500 p2" @click="createGame.name = scrapAllGames[scrapGameIndex]?.name">
            <div i="carbon-arrow-left" class="z-20 h-6 w-6" />
          </button>
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">游戏名</label>
            <p class="flex-1 border rounded bg-gray-50 p-2 text-left dark:bg-gray-600">
              {{ scrapAllGames[scrapGameIndex]?.name }}
            </p>
          </div>

          <!-- 游戏别名 -->
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">别名</label>
            <div flex flex-1 flex-wrap items-center>
              <template v-for="(alias, index) in createGame.alias" :key="index">
                <p
                  class="mb-1 mr-2 flex items-center border rounded bg-gray-50 px-1 text-center dark:bg-gray-600"
                >
                  {{ alias }}
                  <button class="ml-1 flex cursor-pointer items-center rounded-full hover:bg-gray-800" @click="removeAlias(index)">
                    <div i="carbon-close" class="z-20 h-4 w-4" />
                  </button>
                </p>
              </template>
              <input
                v-if="showAddAlias"
                v-model="createAlias"
                type="text"
                class="mt-0 flex-1 border rounded p-2"
                placeholder="输入游戏别名"
                @keydown.enter="appendAlias"
              >
              <button v-else class="flex items-center rounded-full bg-green-500 p1" @click="showAddAlias = true">
                <div i="carbon-add-large" class="z-20 h-4 w-4" />
              </button>
            </div>
          </div>
          <button class="flex items-center rounded-full bg-green-500 p2" @click="createGame.alias = scrapAllGames[scrapGameIndex]?.alias">
            <div i="carbon-arrow-left" class="z-20 h-6 w-6" />
          </button>
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">别名</label>
            <div flex flex-1 flex-wrap items-center>
              <template v-for="(alias, index) in scrapAllGames[scrapGameIndex]?.alias" :key="index">
                <p
                  class="mb-1 mr-2 flex items-center border rounded bg-gray-50 px-1 text-center dark:bg-gray-600"
                >
                  {{ alias }}
                </p>
              </template>
            </div>
          </div>

          <!-- 游戏code -->
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">code</label>
            <input v-model="createGame.code" type="text" class="mt-0 flex-1 border rounded p-2" placeholder="输入游戏code">
          </div>
          <button class="flex items-center rounded-full bg-green-500 p2" @click="createGame.code = scrapAllGames[scrapGameIndex]?.code">
            <div i="carbon-arrow-left" class="z-20 h-6 w-6" />
          </button>
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">code</label>
            <p class="flex-1 border rounded bg-gray-50 p-2 text-left dark:bg-gray-600">
              {{ scrapAllGames[scrapGameIndex]?.code }}
            </p>
          </div>

          <!-- 游戏jan code -->
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">jan code</label>
            <input v-model="createGame.jan_code" type="text" class="mt-0 flex-1 border rounded p-2" placeholder="输入游戏jan code">
          </div>
          <button class="flex items-center rounded-full bg-green-500 p2" @click="createGame.jan_code = scrapAllGames[scrapGameIndex]?.jan_code">
            <div i="carbon-arrow-left" class="z-20 h-6 w-6" />
          </button>
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">jan code</label>
            <p class="flex-1 border rounded bg-gray-50 p-2 text-left dark:bg-gray-600">
              {{ scrapAllGames[scrapGameIndex]?.jan_code }}
            </p>
          </div>

          <!-- 游戏发售日期 -->
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">发售日期</label>
            <input v-model="createGame.issue_date" type="text" class="mt-0 flex-1 border rounded p-2" placeholder="输入游戏发售日期">
          </div>
          <button class="flex items-center rounded-full bg-green-500 p2" @click="createGame.issue_date = scrapAllGames[scrapGameIndex]?.issue_date">
            <div i="carbon-arrow-left" class="z-20 h-6 w-6" />
          </button>
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">发售日期</label>
            <p class="flex-1 border rounded bg-gray-50 p-2 text-left dark:bg-gray-600">
              {{ scrapAllGames[scrapGameIndex]?.issue_date }}
            </p>
          </div>

          <!-- 游戏分类 -->
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">分类</label>
            <div flex flex-1 flex-wrap items-center>
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
          <button class="flex items-center rounded-full bg-green-500 p2" @click="appendCategory(scrapAllGames[scrapGameIndex]?.category?.name)">
            <div i="carbon-arrow-left" class="z-20 h-6 w-6" />
          </button>
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">分类</label>
            <p class="flex-1 border rounded bg-gray-50 p-2 text-left dark:bg-gray-600">
              {{ scrapAllGames[scrapGameIndex]?.category?.name }}
            </p>
          </div>

          <!-- 游戏系列 -->
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">系列</label>
            <div flex flex-1 flex-wrap items-center>
              <template v-for="(s, index) in createGame.series" :key="index">
                <p
                  class="mr-2 flex items-center border rounded bg-gray-50 px-1 text-center dark:bg-gray-600"
                >
                  {{ s.name }}
                  <button class="ml-1 flex cursor-pointer items-center rounded-full hover:bg-gray-800" @click="removeSeries(index)">
                    <div i="carbon-close" class="z-20 h-4 w-4" />
                  </button>
                </p>
              </template>
              <el-select v-model="createSeriesID" :empty-values="[null, undefined, 0]" placeholder="游戏系列" class="mr-2 w64">
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
          <button class="flex items-center rounded-full bg-green-500 p2">
            <div i="carbon-arrow-left" class="z-20 h-6 w-6" />
          </button>
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">系列</label>
            <div flex flex-wrap items-center>
              <template v-for="(s, index) in scrapAllGames[scrapGameIndex]?.series" :key="index">
                <p
                  class="mr-2 flex items-center border rounded bg-gray-50 px-1 text-center dark:bg-gray-600"
                >
                  {{ s.name }}
                </p>
              </template>
            </div>
          </div>

          <!-- 游戏tag -->
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">标签</label>
            <div flex flex-1 flex-wrap items-center>
              <template v-for="(tag, index) in createGame.tags" :key="index">
                <p
                  class="mb-1 mr-2 flex items-center border rounded bg-gray-50 px-1 text-center dark:bg-gray-600"
                >
                  {{ tag.name }}
                  <button class="ml-1 flex cursor-pointer items-center rounded-full hover:bg-gray-800" @click="removeTag(tag.name)">
                    <div i="carbon-close" class="z-20 h-4 w-4" />
                  </button>
                </p>
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
          <button class="flex items-center rounded-full bg-green-500 p2" @click="appendTags(scrapAllGames[scrapGameIndex]?.tags)">
            <div i="carbon-arrow-left" class="z-20 h-6 w-6" />
          </button>
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">标签</label>
            <div flex flex-1 flex-wrap items-center>
              <template v-for="(tag, index) in scrapAllGames[scrapGameIndex]?.tags" :key="index">
                <p
                  class="mb-1 mr-2 flex cursor-pointer items-center border rounded bg-gray-50 px-1 text-center dark:bg-gray-600"
                  @click="toggleTag(tag.name)"
                >
                  {{ tag.name }}
                </p>
              </template>
            </div>
          </div>

          <!-- 游戏故事 -->
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">故事</label>
            <textarea
              v-model="createGame.story"
              type="textarea"
              rows="4"
              class="w-full flex-1 border rounded p-2"
            />
          </div>
          <button class="flex items-center rounded-full bg-green-500 p2" @click="createGame.story = scrapAllGames[scrapGameIndex]?.story">
            <div i="carbon-arrow-left" class="z-20 h-6 w-6" />
          </button>
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">故事</label>
            <textarea
              v-if="scrapAllGames[scrapGameIndex]"
              v-model="scrapAllGames[scrapGameIndex].story"
              type="textarea"
              rows="4"
              class="w-full flex-1 border rounded p-2"
              readonly
            />
          </div>

          <!-- 游戏发行商 -->
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">发行商</label>
            <div flex flex-1 flex-wrap items-center>
              <el-select v-model="createBrandID" placeholder="游戏发行商" :empty-values="[null, undefined, 0]" style="width: 240px" mr-2>
                <el-option
                  v-for="brand in brands" :key="brand.id"
                  :value="brand.id"
                  :label="brand.name"
                />
              </el-select>
              <input
                v-if="showAddBrand"
                v-model="createBrand"
                type="text"
                class="mt-0 flex-1 border rounded p-1"
                placeholder="输入游戏发行商"
                @keydown.enter="() => { appendBrand(createBrand); showAddBrand = false; createBrand = '' }"
              >
              <button v-else class="flex items-center rounded-full bg-green-500 p1" @click="showAddBrand = true">
                <div i="carbon-add-large" class="z-20 h-4 w-4" />
              </button>
            </div>
          </div>
          <button class="flex items-center rounded-full bg-green-500 p2" @click="appendBrand(scrapAllGames[scrapGameIndex]?.brand?.name)">
            <div i="carbon-arrow-left" class="z-20 h-6 w-6" />
          </button>
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">发行商</label>
            <p class="flex-1 border rounded bg-gray-50 p-2 text-left dark:bg-gray-600">
              {{ scrapAllGames[scrapGameIndex]?.brand?.name }}
            </p>
          </div>

          <!-- 游戏角色 -->
          <div class="flex-start flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">角色</label>
            <div relative flex-1>
              <div absolute right-0 top--2 flex items-center>
                <el-select
                  v-model="searchCharacterID"

                  placeholder="搜索角色"
                  :remote-method="searchCharacter"
                  :loading="searchCharacterLoading"
                  :empty-values="[null, undefined, 0]"

                  clearable filterable remote reserve-keyword w-80
                >
                  <el-option
                    v-for="c in characters"
                    :key="c.id"
                    :label="c.name"
                    :value="c.id"
                  />
                </el-select>
                <button class="ml-2 h-7 w-10 flex items-center justify-center rounded-md bg-green-500 p1" @click="addCharacter()">
                  <div i="carbon-add-large" class="z-20 h-4 w-4" />
                </button>
              </div>
              <details text-left :open="characterDetails" @toggle="characterDetailsToggle">
                <div v-for="(character, idx) in createGame.characters" :key="character.id" relative>
                  <button class="flex items-center rounded-full bg-red-500 p1" absolute right--3 top-0 @click="() => { if (createGame.characters) createGame.characters.splice(idx, 1) }">
                    <div i="carbon-subtract-large" class="z-20 h-4 w-4" />
                  </button>
                  <Card mt-4>
                    <template v-if="createGame.characters && createGame.characters[idx]">
                      <div mb-2 flex>
                        <el-image fit="cover" :src="imageUrl(character.cover)" class="h-30 w-30" alt="" />
                        <div ml-4 flex-1>
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
                          <div flex>
                            <el-select v-model="createGame.characters[idx].gender" placeholder="性别" style="width: 120px" mr-4>
                              <el-option
                                v-for="(v, k) in genderEnum" :key="k"
                                :label="v"
                                :value="k"
                              />
                            </el-select>
                            <el-select v-model="createGame.characters[idx].relation" placeholder="角色" style="width: 120px">
                              <el-option
                                v-for="(v, k) in roleEnum" :key="k"
                                :label="v"
                                :value="k"
                              />
                            </el-select>
                          </div>
                        </div>
                      </div>
                      <div flex>
                        <el-image v-for="image in createGame.characters[idx].images" :key="image" fit="cover" :src="imageUrl(image)" class="h-20 w-20 object-cover" alt="" />
                      </div>
                      <div flex items-center>
                        <input v-model="createGame.characters[idx].cover" type="text" class="mb-2 mt-0 mt-2 w-full flex-1 border rounded p-1" placeholder="封面">
                        <button class="ml-2 h-7 w-10 flex items-center justify-center rounded-md bg-green-500 p1" @click="createGame.characters[idx].images.push('')">
                          <div i="carbon-add-large" class="z-20 h-4 w-4" />
                        </button>
                      </div>
                      <div v-for="(image, index) in createGame.characters[idx].images" :key="image" flex items-center>
                        <input v-model="createGame.characters[idx].images[index]" type="text" class="mb-2 mt-0 w-full flex-1 border rounded p-1" placeholder="图片">
                        <button class="ml-2 h-7 w-10 flex items-center justify-center rounded-md bg-red-500 p1" @click="() => { if (createGame.characters) createGame.characters[idx].images.splice(index, 1) }">
                          <div i="carbon-subtract-large" class="z-20 h-4 w-4" />
                        </button>
                      </div>

                      <el-select
                        v-if="createGame.characters[idx].cv"
                        v-model="createGame.characters[idx].cv.id"
                        placeholder="CV"
                        :empty-values="[null, undefined, 0]"
                        mb-2 mr-2 w-full
                      >
                        <template v-for="s in createGame.staff" :key="s.id">
                          <el-option
                            v-if="s.id !== 0 && s.relation.find(r => r === 'cv')"
                            :label="s.name"
                            :value="s.id"
                          />
                        </template>
                      </el-select>
                      <textarea
                        v-model="createGame.characters[idx].summary"
                        type="textarea"
                        rows="2"
                        class="w-full flex-1 border rounded p-2"
                        placeholder="角色描述"
                      />
                    </template>
                  </Card>
                </div>
              </details>
            </div>
          </div>
          <button class="flex items-center rounded-full bg-green-500 p2" @click="moveCharacter(null)">
            <div i="carbon-arrow-left" class="z-20 h-6 w-6" />
          </button>
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">角色</label>
            <div flex-1>
              <details text-left :open="characterDetails" @toggle="characterDetailsToggle">
                <div v-for="(character, index) in scrapAllGames[scrapGameIndex]?.characters" :key="index" relative>
                  <button class="flex items-center rounded-full bg-green-500 p1" absolute left--3 top-0 @click="moveCharacter(index)">
                    <div i="carbon-arrow-left" class="z-20 h-4 w-4" />
                  </button>
                  <Card mt-4>
                    <div mb-2 flex>
                      <el-image fit="cover" :src="imageUrl(character.cover)" class="h-30 w-30 object-cover" alt="" />
                      <div ml-4 flex-1>
                        <h1 class="mb2 text-xl font-bold">
                          {{ character.name }}
                        </h1>
                        <div mb-2 flex flex-1 flex-wrap items-center>
                          <template v-for="(alias, index) in character.alias" :key="index">
                            <p
                              class="mb-1 mr-2 flex items-center border rounded bg-gray-50 px-1 text-center dark:bg-gray-600"
                            >
                              {{ alias }}
                            </p>
                          </template>
                        </div>
                        <div flex>
                          <p>
                            <span>性别：</span>
                            <span>{{ character.gender }}</span>
                          </p>
                          <p ml-4>
                            <span>角色：</span>
                            <span>{{ character.relation }}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div flex>
                      <el-image v-for="(image, index) in character.images" :key="index" fit="cover" :src="imageUrl(image)" class="h-20 w-20 object-cover" alt="" />
                    </div>
                    <p mb-2 mt-2>
                      <span>CV：</span>
                      <span>{{ character.cv?.name }}</span>
                    </p>
                    <textarea
                      v-model="character.summary"
                      type="textarea"
                      disabled
                      rows="2"
                      class="w-full flex-1 border rounded p-2"
                      placeholder="角色描述"
                    />
                  </Card>
                </div>
              </details>
            </div>
          </div>

          <!-- 游戏参与人员 -->
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">参与人员</label>
            <div relative flex-1>
              <div absolute right-0 top--2 flex items-center>
                <el-select
                  v-model="searchPersonID"
                  filterable
                  remote
                  reserve-keyword
                  placeholder="搜索参与人员"
                  :remote-method="searchPerson"
                  :loading="searchPersonLoading"
                  :empty-values="[null, undefined, 0]"
                  clearable
                  w-80
                >
                  <el-option
                    v-for="p in persons"
                    :key="p.id"
                    :label="p.name"
                    :value="p.id"
                  />
                </el-select>
                <button class="ml-2 h-7 w-10 flex items-center justify-center rounded-md bg-green-500 p1" @click="addStaff">
                  <div i="carbon-add-large" class="z-20 h-4 w-4" />
                </button>
              </div>
              <details text-left :open="staffDetails" @toggle="staffDetailsToggle">
                <div v-for="(s, idx) in createGame.staff" :key="s.id" relative>
                  <button v-if="s.id === 0" class="flex items-center rounded-full bg-green-500 p1" absolute right--3 top-0 @click="createStaff(idx)">
                    <div i="carbon-checkmark" class="z-20 h-4 w-4" />
                  </button>
                  <button class="flex items-center rounded-full bg-red-500 p1" absolute right--3 top-8 @click="() => { if (createGame.staff) createGame.staff.splice(idx, 1) }">
                    <div i="carbon-subtract-large" class="z-20 h-4 w-4" />
                  </button>
                  <Card mt-4>
                    <template v-if="createGame.staff">
                      <div mb-2 flex>
                        <el-image fit="cover" :src="imageUrl(s.cover)" class="h-30 w-30 object-cover" alt="" />
                        <div ml-4 flex-1>
                          <input v-model="createGame.staff[idx].name" type="text" class="mb-2 mt-0 w-full flex-1 border rounded px-2 py-1" placeholder="姓名">
                          <div mb-2>
                            <el-select v-model="createGame.staff[idx].gender" placeholder="性别" style="width: 240px">
                              <el-option
                                v-for="(v, k) in genderEnum" :key="k"
                                :label="v"
                                :value="k"
                              />
                            </el-select>
                          </div>
                          <div>
                            <el-select v-model="createGame.staff[idx].relation" multiple placeholder="分工" style="width: 240px">
                              <el-option
                                v-for="(v, k) in workEnum" :key="k"
                                :label="v"
                                :value="k"
                              />
                            </el-select>
                          </div>
                        </div>
                      </div>
                      <div flex>
                        <el-image v-for="image in s.images" :key="image" fit="cover" :src="imageUrl(image)" class="h-20 w-20 object-cover" alt="" />
                      </div>
                      <div flex items-center>
                        <input v-model="createGame.staff[idx].cover" type="text" class="mb-2 mt-0 mt-2 w-full flex-1 border rounded p-1" placeholder="封面">
                        <button class="ml-2 h-7 w-10 flex items-center justify-center rounded-md bg-green-500 p1" @click="createGame.staff[idx].images.push('')">
                          <div i="carbon-add-large" class="z-20 h-4 w-4" />
                        </button>
                      </div>
                      <div v-for="(image, index) in s.images" :key="image" flex items-center>
                        <input v-model="createGame.staff[idx].images[index]" type="text" class="mb-2 mt-0 mt-2 w-full flex-1 border rounded p-1" placeholder="图片">
                        <button class="ml-2 h-7 w-10 flex items-center justify-center rounded-md bg-green-500 p1" @click="() => { if (createGame.staff) createGame.staff[idx].images.splice(index, 1) }">
                          <div i="carbon-subtract-large" class="z-20 h-4 w-4" />
                        </button>
                      </div>
                      <textarea
                        v-model="createGame.staff[idx].summary"
                        type="textarea"
                        rows="2"
                        class="w-full flex-1 border rounded p-2"
                        placeholder="描述"
                      />
                    </template>
                  </Card>
                </div>
              </details>
            </div>
          </div>
          <button class="flex items-center rounded-full bg-green-500 p2" @click="moveStaff(null)">
            <div i="carbon-arrow-left" class="z-20 h-6 w-6" />
          </button>
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">参与人员</label>
            <div flex-1>
              <details text-left :open="staffDetails" @toggle="staffDetailsToggle">
                <div v-for="(staff, index) in scrapAllGames[scrapGameIndex]?.staff" :key="index" relative>
                  <button class="flex items-center rounded-full bg-green-500 p1" absolute left--3 top-0 @click="moveStaff(index)">
                    <div i="carbon-arrow-left" class="z-20 h-4 w-4" />
                  </button>
                  <Card mt-4>
                    <div mb-2 flex>
                      <el-image fit="cover" :src="imageUrl(staff.cover)" class="h-30 w-30 object-cover" alt="" />
                      <div ml-4 flex-1>
                        <h1 class="mb2 text-xl font-bold">
                          {{ staff.name }}
                        </h1>
                        <p>
                          <span>性别：</span>
                          <span>{{ staff.gender }}</span>
                        </p>
                        <p>
                          <span>分工：</span>
                          <span>{{ staff.relation }}</span>
                        </p>
                      </div>
                    </div>
                    <div mb-2>
                      <el-image v-for="image in staff.images" :key="image" fit="cover" :src="imageUrl(image)" class="h-20 w-20 object-cover" alt="" />
                    </div>
                    <textarea
                      v-model="staff.summary"
                      type="textarea"
                      disabled
                      rows="2"
                      class="w-full flex-1 border rounded p-2"
                      placeholder="人物描述"
                    />
                  </Card>
                </div>
              </details>
            </div>
          </div>

          <!-- 游戏相关链接 -->
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">相关链接</label>
            <div flex-1>
              <div v-for="index in createGame.links?.length" :key="index" mb-2 flex items-center>
                <input
                  v-if="createGame.links"
                  v-model="createGame.links[index - 1].name"
                  type="text"
                  mr-2
                  class="mt-0 flex-1 border rounded p-1"
                  placeholder="输入游戏相关链接名"
                >
                <input
                  v-if="createGame.links"
                  v-model="createGame.links[index - 1].url"
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
          </div>
          <button class="flex items-center rounded-full bg-green-500 p2" @click="moveLink">
            <div i="carbon-arrow-left" class="z-20 h-6 w-6" />
          </button>
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">相关链接</label>
            <div items-start>
              <template v-for="(link, index) in scrapAllGames[scrapGameIndex]?.links" :key="index">
                <el-link type="primary" :href="link.url" target="_blank" mr-2>
                  {{ link.name }}
                </el-link>
              </template>
            </div>
          </div>

          <!-- 游戏价格 -->
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">售价</label>
            <input v-model="createGame.price" type="text" class="mt-0 flex-1 border rounded p-2" placeholder="输入游戏价格">
          </div>
          <button class="flex items-center rounded-full bg-green-500 p2" @click="createGame.price = scrapAllGames[scrapGameIndex]?.price">
            <div i="carbon-arrow-left" class="z-20 h-6 w-6" />
          </button>
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">售价</label>
            <p class="flex-1 border rounded bg-gray-50 p-2 text-left dark:bg-gray-600">
              {{ scrapAllGames[scrapGameIndex]?.price }}
            </p>
          </div>

          <!-- 游戏其它信息 -->
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">其它信息</label>
            <textarea
              v-model="createGame.other_info"
              type="textarea"
              rows="4"
              class="w-full flex-1 border rounded p-2"
              placeholder="输入游戏其它信息"
            />
          </div>
          <button class="flex items-center rounded-full bg-green-500 p2" @click="createGame.other_info = scrapAllGames[scrapGameIndex]?.other_info">
            <div i="carbon-arrow-left" class="z-20 h-6 w-6" />
          </button>
          <div class="flex items-center">
            <label class="mr-4 w22 text-center text-right font-medium">其它信息</label>
            <textarea
              v-model="createGame.other_info"
              type="textarea"
              rows="4"
              class="w-full flex-1 border rounded p-2"
              readonly
            />
          </div>
        </div>
      </div>
    </div>
  </div>

  <el-dialog
    v-model="showGameIns"
    title="游戏实体信息"
  >
    <el-row :gutter="4" mb-2>
      <el-col :span="4">
        <div h-full flex items-center>
          <label class="mr-4 w22 text-center text-right font-medium">游戏路径</label>
        </div>
      </el-col>
      <el-col :span="20">
        <input v-model="createGameIns.path" type="text" class="mt-0 w-full border rounded px-2 py-1" autofocus placeholder="输入游戏路径">
      </el-col>
    </el-row>
    <el-row :gutter="4" mb-2>
      <el-col :span="4">
        <div h-full flex items-center>
          <label class="mr-4 w22 text-center text-right font-medium">游戏版本</label>
        </div>
      </el-col>
      <el-col :span="20">
        <input v-model="createGameIns.version" type="text" class="mt-0 w-full border rounded px-2 py-1" autofocus placeholder="输入游戏版本">
      </el-col>
    </el-row>
    <el-row :gutter="4" mb-2>
      <el-col :span="4">
        <div h-full flex items-center>
          <label class="mr-4 w22 text-center text-right font-medium">游戏语言</label>
        </div>
      </el-col>
      <el-col :span="20">
        <div flex items-start>
          <el-select v-model="createGameIns.language" multiple placeholder="游戏语言" clearable style="width: 300px">
            <el-option
              v-for="(v, k) in languageEnum" :key="k"
              :label="v"
              :value="k"
            />
          </el-select>
        </div>
      </el-col>
    </el-row>
    <el-row :gutter="4" mb-2>
      <el-col :span="4">
        <div h-full flex items-center>
          <label class="mr-4 w22 text-center text-right font-medium">游戏平台</label>
        </div>
      </el-col>
      <el-col :span="20">
        <div flex items-start>
          <el-select v-model="createGameIns.platform" multiple placeholder="游戏平台" clearable style="width: 300px">
            <el-option
              v-for="(v, k) in platformEnum" :key="k"
              :value="k"
            >
              <div :class="v" />
            </el-option>
          </el-select>
        </div>
      </el-col>
    </el-row>
    <el-row :gutter="4" mb-2>
      <el-col :span="4">
        <div h-full flex items-center>
          <label class="mr-4 w22 text-center text-right font-medium">实体描述</label>
        </div>
      </el-col>
      <el-col :span="20">
        <textarea
          v-model="createGameIns.comment"
          type="textarea"
          rows="2"
          class="w-full flex-1 border rounded p-2"
          placeholder="描述"
        />
      </el-col>
    </el-row>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="showGameIns = false">
          Cancel
        </el-button>
        <el-button type="primary" @click="commit">
          Confirm
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
