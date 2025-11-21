import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGameStore = defineStore('game', () => {
  const searchQuery = ref('') // 输入框内容
  const searchTrigger = ref(false) // 用来触发搜索
  const sortBy = ref('')
  const showAdvanced = ref(false)
  const showEdit = ref(false)
  const showUpdateSetting = ref(false)
  const gameName = ref('')
  const showScraper = ref(false)

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
    sortBy,
    searchTrigger,
    showAdvanced,
    showEdit,
    showUpdateSetting,
    gameName,
    showScraper,
    setSearchQuery,
    triggerSearch,
    setSort,
  }
})
