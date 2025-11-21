<script setup lang="ts">
import {
  Connection,
  Delete,
  DocumentAdd,
  Folder,
  Plus,
  Setting,
  Warning,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { policyApi } from '~/apis/game'

// --- 类型定义 ---
interface ScraperHeader {
  key: string
  value: string
}

interface ScraperConfig {
  proxy: string
  header: ScraperHeader[] // 将 Map 转换为数组方便前端编辑
}

// interface SystemConfig {
//   game_library: string[]
// }

// --- 状态管理 ---
const loading = ref(false)
const saving = ref(false)

// 表单数据
const form = reactive({
  system: {
    game_library: [] as string[],
  },
  scraper: {} as Record<string, ScraperConfig>,
})

// --- 核心逻辑 ---

// 1. 加载设置并转换数据结构 (Map -> Array)
async function loadSettings() {
  loading.value = true
  try {
    const res = await policyApi.get()
    const data = res.data

    // 解析 System
    if (data.system) {
      const sys = JSON.parse(data.system)
      form.system.game_library = sys.game_library || []
      if (form.system.game_library.length === 0) {
        form.system.game_library.push('')
      }
    }

    // 解析 Scraper
    if (data.scraper) {
      const scrapers = JSON.parse(data.scraper)
      for (const [name, config] of Object.entries(scrapers) as [string, any][]) {
        const headersArray: ScraperHeader[] = []
        if (config.header) {
          for (const [k, v] of Object.entries(config.header)) {
            headersArray.push({ key: k, value: v as string })
          }
        }

        form.scraper[name] = {
          proxy: config.proxy || '',
          header: headersArray,
        }
      }
    }
  }
  catch (err) {
    console.error(err)
    ElMessage.error('加载设置失败')
  }
  finally {
    loading.value = false
  }
}

// 2. 保存设置并还原数据结构 (Array -> Map)
async function saveSettings() {
  try {
    await ElMessageBox.confirm('确定要保存当前修改的设置吗？', '保存确认', {
      confirmButtonText: '保存',
      cancelButtonText: '取消',
      type: 'warning',
    })

    saving.value = true

    // 2.1 保存 System
    // 过滤空路径
    const cleanLibrary = form.system.game_library.filter(p => p.trim() !== '')
    await policyApi.update({
      key: 'system',
      policy: JSON.stringify({ game_library: cleanLibrary }),
    })

    // 2.2 保存 Scraper
    const scraperPayload: Record<string, any> = {}
    for (const [name, config] of Object.entries(form.scraper)) {
      // 转换 headers 数组回对象
      const headerMap: Record<string, string> = {}
      config.header.forEach((h) => {
        if (h.key)
          headerMap[h.key] = h.value
      })

      scraperPayload[name] = {
        proxy: config.proxy,
        header: headerMap,
      }
    }
    await policyApi.update({
      key: 'scraper',
      policy: JSON.stringify(scraperPayload),
    })

    ElMessage.success('设置保存成功')
    await loadSettings() // 重新加载以确保同步
  }
  catch (e) {
    // Cancelled or Error
    if (e !== 'cancel')
      console.error(e)
  }
  finally {
    saving.value = false
  }
}

// --- 辅助操作 ---
function addLibraryPath() {
  form.system.game_library.push('')
}
function removeLibraryPath(index: number) {
  form.system.game_library.splice(index, 1)
}

function addHeader(scraperName: string) {
  form.scraper[scraperName].header.push({ key: '', value: '' })
}
function removeHeader(scraperName: string, index: number) {
  form.scraper[scraperName].header.splice(index, 1)
}

onMounted(() => {
  loadSettings()
})
</script>

<template>
  <div class="mx-auto max-w-5xl p-6 pb-24 text-main">
    <!-- 顶部标题 -->
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="mb-2 text-3xl text-main font-extrabold">
          系统设置
        </h1>
        <p class="text-sm text-muted">
          管理游戏库路径与刮削器配置
        </p>
      </div>
      <!-- 顶部保存按钮 (快捷) -->
      <el-button type="primary" size="large" :loading="saving" @click="saveSettings">
        保存修改
      </el-button>
    </div>

    <div v-loading="loading" class="space-y-8">
      <!-- 1. 游戏库设置 -->
      <div class="overflow-hidden border border-base rounded-xl bg-card shadow-sm">
        <div class="flex items-center justify-between border-b border-base bg-page/50 px-6 py-4">
          <h2 class="flex items-center gap-2 text-lg font-bold">
            <el-icon class="text-primary">
              <Folder />
            </el-icon>
            游戏库路径
          </h2>
          <el-button size="small" plain :icon="Plus" @click="addLibraryPath">
            添加路径
          </el-button>
        </div>

        <div class="p-6 space-y-3">
          <div v-if="form.system.game_library.length === 0" class="py-4 text-center text-muted">
            暂无配置路径，请添加。
          </div>

          <div
            v-for="(path, idx) in form.system.game_library"
            :key="idx"
            class="group flex items-center gap-3"
          >
            <div class="w-8 text-right text-sm text-muted font-mono">
              {{ idx + 1 }}
            </div>
            <el-input
              v-model="form.system.game_library[idx]"
              placeholder="请输入 NAS 中的绝对路径 (例如 /volume1/games)"
              class="flex-1"
            >
              <template #prefix>
                <el-icon><Folder /></el-icon>
              </template>
            </el-input>
            <el-button
              type="danger"
              plain
              circle
              :icon="Delete"
              class="opacity-0 transition-opacity group-hover:opacity-100"
              @click="removeLibraryPath(idx)"
            />
          </div>
        </div>
      </div>

      <!-- 2. 刮削器设置 -->
      <div class="overflow-hidden border border-base rounded-xl bg-card shadow-sm">
        <div class="border-b border-base bg-page/50 px-6 py-4">
          <h2 class="flex items-center gap-2 text-lg font-bold">
            <el-icon class="text-primary">
              <Connection />
            </el-icon>
            刮削器配置
          </h2>
        </div>

        <div class="p-0">
          <el-tabs tab-position="left" class="demo-tabs custom-tabs">
            <el-tab-pane
              v-for="(config, name) in form.scraper"
              :key="name"
              :label="name"
            >
              <div class="h-full min-h-[300px] p-6">
                <!-- 代理设置 -->
                <div class="mb-8">
                  <h3 class="mb-3 flex items-center gap-2 text-sm text-muted font-bold tracking-wider uppercase">
                    <el-icon><Setting /></el-icon> 代理设置 (Proxy)
                  </h3>
                  <el-input
                    v-model="config.proxy"
                    placeholder="例如: socks5://127.0.0.1:7890"
                    clearable
                  >
                    <template #prepend>
                      Proxy URL
                    </template>
                  </el-input>
                  <p class="mt-1 pl-1 text-xs text-muted">
                    留空则走环境变量，支持 http/socks5 协议。
                  </p>
                </div>

                <!-- Headers 设置 -->
                <div>
                  <div class="mb-3 flex items-center justify-between">
                    <h3 class="flex items-center gap-2 text-sm text-muted font-bold tracking-wider uppercase">
                      <el-icon><DocumentAdd /></el-icon> 请求头 (Headers)
                    </h3>
                    <el-button size="small" text bg :icon="Plus" @click="addHeader(name as string)">
                      添加 Header
                    </el-button>
                  </div>

                  <div class="border border-base rounded-lg bg-page p-4 space-y-2">
                    <div v-if="config.header.length === 0" class="py-2 text-center text-xs text-muted">
                      无自定义请求头
                    </div>

                    <div
                      v-for="(header, idx) in config.header"
                      :key="idx"
                      class="flex items-center gap-2"
                    >
                      <el-input v-model="header.key" placeholder="Key (e.g. User-Agent)" class="w-1/3" />
                      <span class="text-muted">:</span>
                      <el-input v-model="header.value" placeholder="Value" class="flex-1" />
                      <el-button
                        type="danger"
                        link
                        :icon="Delete"
                        @click="removeHeader(name as string, idx)"
                      />
                    </div>
                  </div>
                  <p class="mt-2 flex items-center gap-1 pl-1 text-xs text-muted">
                    <el-icon><Warning /></el-icon>
                    Cookie 等敏感信息请在此配置，Key 必须唯一。
                  </p>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>

    <!-- 底部悬浮保存栏 (当页面很长时很有用) -->
    <!-- <div class="fixed bottom-6 left-1/2 z-20 -translate-x-1/2">
      <transition name="el-zoom-in-bottom">
        <div v-if="true" class="flex cursor-pointer items-center gap-4 rounded-full bg-main px-6 py-3 text-white opacity-95 shadow-xl backdrop-blur transition-transform hover:scale-105 dark:bg-white dark:text-black" @click="saveSettings">
          <span class="text-sm font-bold">保存所有更改</span>
          <el-icon :class="{ 'is-loading': saving }">
            <Connection />
          </el-icon>
        </div>
      </transition>
    </div> -->
  </div>
</template>

<style scoped>
/* 优化 Tabs 样式，使其适应卡片 */
:deep(.el-tabs__header) {
  margin-right: 0 !important;
  background-color: rgba(var(--c-bg-page), 0.5);
  border-right: 1px solid rgba(var(--c-border), 1);
  min-height: 400px;
}
:deep(.el-tabs__item) {
  text-align: left;
  padding-left: 20px !important;
  justify-content: flex-start;
}
:deep(.el-tabs__item.is-active) {
  background-color: rgba(var(--c-bg-card), 1);
  font-weight: bold;
  border-right: 2px solid rgba(var(--c-primary), 1);
  color: rgba(var(--c-primary), 1);
  z-index: 1;
}
/* 输入框背景适配 */
:deep(.el-input__wrapper) {
  background-color: rgba(var(--c-bg-input), 1);
  box-shadow: 0 0 0 1px rgba(var(--c-border-strong), 1) inset;
}

:deep(.el-button:hover) {
  background-color: rgba(var(--c-primary), 1);
  border-color: rgba(var(--c-border-strong), 1);
  color: white;
}
:deep(.el-button) {
  border-color: rgba(var(--c-border), 1);
}
:deep(.el-input-group__prepend) {
  --el-input-border-color: rgba(var(--c-border-strong), 1);
}
</style>

<route lang="yaml">
meta:
  layout: default
</route>
