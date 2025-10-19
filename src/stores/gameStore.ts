import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGameStore = defineStore('game', () => {
  const searchQuery = ref('') // 输入框内容
  const searchTrigger = ref(false) // 用来触发搜索
  const sortBy = ref('')
  const showAdvanced = ref(false)
  const showScraper = ref(false)
  const selectScrapResult = ref('')
  const scrapResults = ref<string[]>([])
  const showEdit = ref(false)

  function setSearchQuery(query: string) {
    searchQuery.value = query
  }

  function triggerSearch() {
    searchTrigger.value = true
  }

  function setSort(sort: string) {
    sortBy.value = sort
    triggerSearch() // 改变排序也触发刷新
  }

  return {
    searchQuery,
    searchTrigger,
    showAdvanced,
    showScraper,
    selectScrapResult,
    scrapResults,
    showEdit,
    setSearchQuery,
    triggerSearch,
    setSort,
  }
})
