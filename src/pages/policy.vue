<script setup lang="ts">
import { policyApi } from '~/apis/game'

const gameStore = useGameStore()

const policies = ref<Record<string, any>>({
  system: {
    game_library: [],
  },
})
const headers = ref<Record<string, any[]>>({})

function getProxy() {
  policyApi.get().then((res) => {
    for (const [k, v] of Object.entries(res.data)) {
      policies.value[k] = JSON.parse(v)
      if (k === 'scraper') {
        for (const [name, value] of Object.entries(policies.value[k])) {
          headers.value[name] = []
          // 类型断言，假设 value 是一个包含 header 的对象
          const scraperItem = value as { header: Record<string, string> }
          if (scraperItem.header && typeof scraperItem.header === 'object') {
            for (const [ke, val] of Object.entries(scraperItem.header)) {
              headers.value[name].push({ name: ke, v: val })
            }
          }
        }
      }
    }
    if (!policies.value.system.game_library || policies.value.system.game_library.length === 0) {
      policies.value.system.game_library = ['']
    }
  })
}

async function updatePolicy() {
  await policyApi.update({ key: 'system', policy: JSON.stringify(policies.value.system) })
  for (const [name, _] of Object.entries(policies.value.scraper)) {
    policies.value.scraper[name].header = {}
    for (const [_, v] of Object.entries(headers.value[name])) {
      policies.value.scraper[name].header[v.name] = v.v
    }
  }
  await policyApi.update({ key: 'scraper', policy: JSON.stringify(policies.value.scraper) })

  gameStore.showUpdateSetting = false
  getProxy()
}

function addHeader(scraperName: string) {
  headers.value[scraperName].push({ name: '', v: '' })
}

function rmHeader(scraperName: string, index: number) {
  headers.value[scraperName].splice(index, 1)
}

function addLibrary() {
  policies.value.system.game_library.push('')
}

onMounted(() => {
  getProxy()
})
</script>

<template>
  <el-row :gutter="20" mb-5>
    <el-col>
      <Card title="系统设置">
        <div class="mb-4 mt-2 flex items-center">
          <h2 text-left font-800>
            game library
          </h2>
          <button class="ml-2 flex items-center rounded-full bg-green-500 p1" @click="addLibrary">
            <div i="carbon-add-large" class="z-20 h-4 w-4" />
          </button>
        </div>

        <div>
          <div
            v-for="(_, idx) in policies.system.game_library"
            :key="idx"
            mb-2 flex items-center
          >
            <el-input
              v-model="policies.system.game_library[idx]"
              placeholder="game library path"
              class="mr-2"
            />
            <button class="flex items-center rounded bg-red-500 p1 pl-2 pr-2" @click="policies.system.game_library.splice(idx, 1)">
              <div i="carbon-subtract-large" class="z-20 h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>
    </el-col>
  </el-row>
  <el-row :gutter="20" mb-12>
    <el-col>
      <Card title="刮削器设置">
        <el-tabs tab-position="top" :stretch="true">
          <el-tab-pane v-for="(item, k) in policies.scraper" :key="k" :label="k">
            <div class="mb-3 flex items-center">
              <h2 text-left font-800>
                header
              </h2>
              <button class="ml-2 flex items-center rounded-full bg-green-500 p1" @click="addHeader(k)">
                <div i="carbon-add-large" class="z-20 h-4 w-4" />
              </button>
            </div>

            <div v-for="(h, i) in headers[k]" :key="i" mb-2 flex items-center>
              <el-input v-model="headers[k][i].name" class="mr-2 w-64" />
              <el-input v-model="headers[k][i].v" />
              <div ml-2 w-24 flex flex-1 items-center>
                <button class="flex items-center rounded bg-red-500 p1 pl-2 pr-2" @click="rmHeader(k, i)">
                  <div i="carbon-subtract-large" class="z-20 h-4 w-4" />
                </button>
              </div>
            </div>

            <h2 mb-3 mt-4 text-left font-800>
              proxy
            </h2>
            <div>
              <el-input v-model="item.proxy" placeholder="e.g. socks5://127.0.0.1:7890" />
            </div>
          </el-tab-pane>
        </el-tabs>
      </Card>
    </el-col>
  </el-row>

  <el-dialog
    v-model="gameStore.showUpdateSetting"
    title="Update confirm"
    width="500"
  >
    <span>是否更新设置</span>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="gameStore.showUpdateSetting = false">
          Cancel
        </el-button>
        <el-button type="primary" @click="updatePolicy">
          Confirm
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<route lang="yaml">
meta:
  layout: default
</route>
