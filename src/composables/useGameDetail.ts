import type { Brand, Category, Game, GameInstance, Series, Tag } from '~/types'
import { brandApi, categoryApi, gameApi, seriesApi, tagApi } from '~/apis/game'
import { useGameStore } from '~/stores/gameStore'

/**
 * 游戏详情页数据层:游戏本体、版本实例、字典数据(分类/系列/标签/品牌)
 */
export function useGameDetail(gameId: Ref<number>) {
  const gameStore = useGameStore()

  const game = ref<Partial<Game>>({})
  const gameIns = ref<GameInstance[]>([])
  const editGame = ref<Partial<Game>>({})
  const editGameIns = ref<GameInstance[]>([])

  const categories = ref<Category[]>([])
  const series = ref<Series[]>([])
  const tags = ref<Tag[]>([])
  const brands = ref<Brand[]>([])

  // 全版本聚合后的平台/语言(去重)
  const platforms = computed(() => [...new Set(gameIns.value.flatMap(i => i.platform || []))])
  const languages = computed(() => [...new Set(gameIns.value.flatMap(i => i.language || []))])

  function getGame() {
    gameApi.get(gameId.value).then((res) => {
      game.value = res.data
      gameStore.gameName = game.value.name || ''
      editGame.value = structuredClone(res.data)
    })
  }

  function getIns() {
    gameApi.getIns(gameId.value).then((res) => {
      gameIns.value = res.data
      editGameIns.value = structuredClone(res.data)
    })
  }

  function getBrands() {
    return brandApi.list().then((res) => {
      brands.value = res.data.list
    })
  }

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

  function initData() {
    getCategories()
    getSeries()
    getTags()
    getBrands()
  }

  onMounted(() => {
    getGame()
    getIns()
    initData()
  })

  return {
    gameStore,
    game,
    gameIns,
    editGame,
    editGameIns,
    categories,
    series,
    tags,
    brands,
    platforms,
    languages,
    getGame,
    getIns,
    getBrands,
    getCategories,
    getSeries,
    getTags,
    initData,
  }
}
