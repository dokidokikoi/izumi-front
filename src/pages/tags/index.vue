<script setup lang="ts">
import type { Tag } from '~/types'
import { CircleCheckFilled, CirclePlus, Delete, EditPen, Link, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { tagApi } from '~/apis/game'

// --- 列表数据 ---
const tags = ref<Tag[]>([])
const loading = ref(false)

// --- 筛选 + 分页(服务端) ---
const ETAG_NS_OPTIONS = ['artist', 'group', 'parody', 'character', 'female', 'male', 'mixed', 'other', 'language', 'reclass']
const filterNs = ref('')
const filterKey = ref('')
const PAGE_SIZE = 20
const page = ref(1)
const total = ref(0)

function getTags() {
  loading.value = true
  tagApi.list(filterNs.value, filterKey.value.trim(), page.value, PAGE_SIZE).then((res) => {
    tags.value = res.data.list
    total.value = res.data.total ?? res.data.list.length
  }).finally(() => {
    loading.value = false
  })
}

// 筛选条件变化:防抖后回到第一页重新查询
let filterTimer: ReturnType<typeof setTimeout> | undefined
watch([filterNs, filterKey], () => {
  clearTimeout(filterTimer)
  filterTimer = setTimeout(() => {
    page.value = 1
    getTags()
  }, 300)
})

// 翻页
watch(page, getTags)

onMounted(getTags)

// --- 新增 ---
const showCreate = ref(false)
const createName = ref('')

function createTag() {
  const name = createName.value.trim()
  if (!name) {
    ElMessage.warning('请输入标签名')
    return
  }
  tagApi.create(name).then(() => {
    ElMessage.success('创建成功')
    showCreate.value = false
    createName.value = ''
    getTags()
  })
}

// --- 重命名(行内编辑) ---
const editingId = ref<number | null>(null)
const editingNs = ref('')
const editingKey = ref('')
const editingName = ref('')

function startEdit(tag: Tag) {
  editingId.value = tag.id
  editingNs.value = tag.ns
  editingKey.value = tag.key
  editingName.value = tag.name
}

function cancelEdit() {
  editingId.value = null
  editingNs.value = ''
  editingKey.value = ''
  editingName.value = ''
}

function confirmEdit() {
  const ns = editingNs.value.trim()
  const key = editingKey.value.trim()
  const name = editingName.value.trim()
  if (!name) {
    ElMessage.warning('标签名不能为空')
    return
  }
  const tag = tags.value.find(t => t.id === editingId.value)
  if (!tag)
    return
  if (ns === tag.ns && key === tag.key && name === tag.name) {
    cancelEdit()
    return
  }
  tagApi.update({ id: tag.id, ns, key, name }).then(() => {
    tag.ns = ns
    tag.key = key
    tag.name = name
    ElMessage.success('已更新')
    cancelEdit()
  })
}

// --- 删除 ---
function removeTag(tag: Tag) {
  ElMessageBox.confirm(
    `确定删除标签「${tag.name}」吗?已使用该标签的游戏将同时移除。`,
    '删除确认',
    { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' },
  ).then(() => {
    tagApi.delete([String(tag.id)]).then(() => {
      tags.value = tags.value.filter(t => t.id !== tag.id)
      ElMessage.success('已删除')
    })
  }).catch(() => {})
}

// --- ETag 匹配(标签统一化) ---
// 对应后端 /tags/ehtag 返回结构
interface ETagCandidate {
  id: number
  ns: string
  key: string // 原始标签值(英文)
  name: string // 翻译名
  intro: string
  lang: string
  created_at: string
  updated_at: string
}

const showMatch = ref(false)
const matchTag = ref<Tag | null>(null) // 当前正在匹配的标签
const matchResults = ref<ETagCandidate[]>([])
const matchLoading = ref(false)

// 搜索条件:命名空间和 key 均可修改
const matchNs = ref('')
const matchKey = ref('')

function startMatch(tag: Tag) {
  matchTag.value = tag
  matchNs.value = tag.ns
  matchKey.value = tag.key || tag.name
  matchResults.value = []
  showMatch.value = true
  searchETag()
}

function searchETag() {
  matchLoading.value = true
  tagApi.getETag(matchNs.value.trim(), matchKey.value.trim()).then((res) => {
    matchResults.value = (res.data as ETagCandidate[]) || []
  }).finally(() => {
    matchLoading.value = false
  })
}

// 候选项展示名:优先翻译名,其次原始 key
function candidateName(c: ETagCandidate) {
  return c.name || c.key || '-'
}

function confirmMatch(c: ETagCandidate) {
  if (!matchTag.value)
    return
  ElMessageBox.confirm(
    `将「${matchTag.value.name}」统一为「${candidateName(c)}」吗?`,
    '确认匹配',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'info' },
  ).then(() => {
    tagApi.patchDecided({
      ...matchTag.value!,
      name: candidateName(c),
    }).then(() => {
      ElMessage.success('已保存统一标签')
      showMatch.value = false
      getTags()
    })
  }).catch(() => {})
}
</script>

<template>
  <div class="mx-auto max-w-5xl p-6 pb-24">
    <!-- 顶部标题 -->
    <div class="mb-8 flex items-end justify-between">
      <div>
        <h1 class="mb-2 text-3xl text-main font-extrabold">
          标签管理
        </h1>
        <p class="text-sm text-muted">
          共 {{ total }} 个标签
        </p>
      </div>
      <el-button
        type="primary"
        :icon="CirclePlus"
        class="rounded-xl shadow-blue-500/25 shadow-lg"
        @click="showCreate = true"
      >
        新建标签
      </el-button>
    </div>

    <!-- 筛选栏 -->
    <div class="mb-6 flex flex-wrap items-center gap-2">
      <el-select
        v-model="filterNs"
        clearable
        filterable
        allow-create
        default-first-option
        placeholder="命名空间"
        class="w-40"
      >
        <el-option v-for="ns in ETAG_NS_OPTIONS" :key="ns" :label="ns" :value="ns" />
      </el-select>
      <el-input
        v-model="filterKey"
        placeholder="筛选 key..."
        clearable
        :prefix-icon="Search"
        class="w-48"
      />
    </div>

    <!-- 标签列表 -->
    <div class="rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:bg-gray-800/60 md:p-6">
      <el-table
        v-loading="loading"
        :data="tags"
        stripe
        :header-cell-style="{ background: 'transparent' }"
      >
        <el-table-column prop="ns" label="命名空间" min-width="130">
          <template #default="{ row }">
            <el-select
              v-if="editingId === row.id"
              v-model="editingNs"
              size="small"
              filterable
              allow-create
              default-first-option
              placeholder="ns"
            >
              <el-option v-for="ns in ETAG_NS_OPTIONS" :key="ns" :label="ns" :value="ns" />
            </el-select>
            <span v-else class="text-sm text-gray-500 dark:text-gray-400">{{ row.ns || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="key" label="Key" min-width="150">
          <template #default="{ row }">
            <el-input
              v-if="editingId === row.id"
              v-model="editingKey"
              size="small"
              placeholder="key"
              @keyup.enter="confirmEdit"
              @keyup.esc="cancelEdit"
            />
            <code v-else class="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">{{ row.key || '-' }}</code>
          </template>
        </el-table-column>

        <el-table-column label="名称" min-width="200">
          <template #default="{ row }">
            <template v-if="editingId === row.id">
              <el-input
                v-model="editingName"
                size="small"
                placeholder="标签名"
                @keyup.enter="confirmEdit"
                @keyup.esc="cancelEdit"
              />
            </template>
            <template v-else>
              <span class="rounded-full from-indigo-50 to-blue-50 bg-gradient-to-r px-3 py-1 text-xs text-indigo-700 font-semibold dark:from-indigo-900/40 dark:to-blue-900/40 dark:text-indigo-300">
                # {{ row.name }}
              </span>
            </template>
          </template>
        </el-table-column>

        <!-- <el-table-column label="创建时间" min-width="170">
          <template #default="{ row }">
            <span class="text-sm text-gray-400">{{ formatDate(row.created_at) }}</span>
          </template>
        </el-table-column> -->

        <el-table-column label="操作" width="220" align="right">
          <template #default="{ row }">
            <template v-if="editingId === row.id">
              <el-button size="small" type="primary" :icon="CircleCheckFilled" @click="confirmEdit">
                保存
              </el-button>
              <el-button size="small" @click="cancelEdit">
                取消
              </el-button>
            </template>
            <template v-else>
              <el-button size="small" type="primary" link :icon="Link" @click="startMatch(row)">
                匹配
              </el-button>
              <el-button size="small" type="primary" link :icon="EditPen" @click="startEdit(row)">
                重命名
              </el-button>
              <el-button size="small" type="danger" link :icon="Delete" @click="removeTag(row)">
                删除
              </el-button>
            </template>
          </template>
        </el-table-column>

        <!-- 空状态 -->
        <template #empty>
          <div class="flex flex-col items-center py-12 text-gray-300 dark:text-gray-600">
            <div i="carbon-tag" class="mb-3 h-12 w-12" />
            <span class="text-sm">{{ filterNs || filterKey ? '没有匹配的标签' : '暂无标签,点击右上角新建' }}</span>
          </div>
        </template>
      </el-table>

      <!-- 分页 -->
      <div class="mt-4 flex justify-center">
        <el-pagination
          v-model:current-page="page"
          :total="total"
          :page-size="PAGE_SIZE"
          :pager-count="7"
          background
          layout="prev, pager, next, total"
          hide-on-single-page
        />
      </div>
    </div>

    <!-- 新建标签弹窗 -->
    <el-dialog v-model="showCreate" title="新建标签" width="400px" center>
      <el-input
        v-model="createName"
        placeholder="输入标签名"
        maxlength="50"
        clearable
        @keyup.enter="createTag"
      />
      <template #footer>
        <div class="flex justify-center gap-4">
          <el-button @click="showCreate = false">
            取消
          </el-button>
          <el-button type="primary" @click="createTag">
            创建
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ETag 匹配弹窗(标签统一化) -->
    <el-dialog
      v-model="showMatch"
      :title="`匹配 ETag - ${matchTag?.name || ''}`"
      width="560px"
      top="8vh"
    >
      <!-- 搜索条件:命名空间 + key 均可修改 -->
      <div class="mb-4 flex gap-2">
        <el-select
          v-model="matchNs"
          filterable
          allow-create
          default-first-option
          placeholder="命名空间"
          class="w-36 shrink-0"
        >
          <el-option v-for="ns in ETAG_NS_OPTIONS" :key="ns" :label="ns" :value="ns" />
        </el-select>
        <el-input
          v-model="matchKey"
          placeholder="key / 关键词"
          clearable
          @keyup.enter="searchETag"
        />
        <el-button type="primary" :icon="Search" :loading="matchLoading" @click="searchETag">
          搜索
        </el-button>
      </div>

      <!-- 候选列表 -->
      <div v-loading="matchLoading" class="max-h-[50vh] overflow-y-auto pr-1 space-y-2">
        <button
          v-for="(c, idx) in matchResults"
          :key="idx"
          class="w-full cursor-pointer border border-gray-200 rounded-xl bg-white p-3 text-left transition-all dark:border-gray-700 hover:border-blue-400 dark:bg-gray-800 hover:shadow-md dark:hover:border-blue-500"
          @click="confirmMatch(c)"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="text-gray-800 font-semibold dark:text-gray-100">{{ candidateName(c) }}</span>
            <el-tag v-if="c.ns" size="small" type="info">
              {{ c.ns }}
            </el-tag>
          </div>
          <div v-if="c.key && c.key !== candidateName(c)" class="mt-1 truncate text-xs text-gray-400">
            原始值:{{ c.key }}
          </div>
          <p v-if="c.intro" class="line-clamp-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{ c.intro }}
          </p>
        </button>

        <!-- 空状态 -->
        <div v-if="!matchLoading && !matchResults.length" class="flex flex-col items-center py-10 text-gray-300 dark:text-gray-600">
          <div i="carbon-search-location" class="mb-3 h-10 w-10" />
          <span class="text-sm">没有搜索结果,换个关键词试试</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>
