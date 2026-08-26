<script setup lang="ts">
import type { Character, Game } from '~/types'
import { Camera } from '@element-plus/icons-vue'
import { genderEnum, roleEnum, workEnum } from '~/config/enum'
import { imageUrl } from '~/utils/image'

// type 为 character 时编辑角色,否则编辑参与成员;两者表单几乎一致,仅 CV/分工字段不同
const props = withDefaults(defineProps<{
  editGame: Partial<Game>
  index: number
  originalCover?: string
  type?: 'character' | 'staff'
}>(), {
  originalCover: '',
  type: 'character',
})

const model = defineModel<boolean>({ required: true })

const showAddAlias = ref(false)
const createAlias = ref('')

function getUploadUrl() {
  const prefix = import.meta.env.VITE_API_BASE || window.location.origin.concat('/api')
  return prefix.concat('/file/upload')
}

const entity = computed(() =>
  props.type === 'character'
    ? props.editGame.characters?.[props.index]
    : props.editGame.staff?.[props.index],
)

function removeAlias(alias: string) {
  if (!entity.value?.alias)
    return
  entity.value.alias = entity.value.alias.filter(a => a !== alias)
}

function appendAlias(alias: string) {
  if (!entity.value)
    return
  if (!entity.value.alias)
    entity.value.alias = []
  entity.value.alias.push(alias)
  createAlias.value = ''
  showAddAlias.value = false
}

function handleImageUploadSuccess(res: any) {
  if (!entity.value)
    return
  if (!entity.value.images)
    entity.value.images = []
  entity.value.images.push(res.data.path)
}

function rmImage(image: string) {
  if (entity.value?.images)
    entity.value.images = entity.value.images.filter(t => t !== image)
}
</script>

<template>
  <el-drawer
    v-model="model"
    :title="type === 'character' ? '角色编辑' : '参与成员编辑'"
    direction="rtl"
  >
    <div v-if="entity">
      <el-row w-full>
        <el-col :span="6">
          <el-row>
            <el-col class="relative min-h-120px overflow-hidden rounded-xl">
              <img
                :src="imageUrl(entity.cover)"
                alt="头像"
                fit="cover"
                class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              >
              <div class="absolute top-0 h-full w-full hover:bg-black/60">
                <Upload
                  class="absolute top-0 h-full w-full opacity-0 hover:opacity-100"
                  :action="getUploadUrl()"
                  @success="(data: any) => { if (entity) entity.cover = data.data.path }"
                >
                  <template #content>
                    <div class="flex flex-col items-center">
                      <el-icon :size="32" color="#fff">
                        <Camera />
                      </el-icon>
                      <span class="mt-2 text-white font-bold">更换封面</span>
                      <div i="carbon-trash-can" class="z-20 mt-2 hover:text-red" @click.stop="entity.cover = originalCover" />
                    </div>
                  </template>
                </Upload>
              </div>
            </el-col>
          </el-row>
        </el-col>
        <el-col :span="18">
          <div v-if="entity" ml-4 flex-1>
            <input v-model="entity.name" type="text" class="mb-2 mt-0 w-full flex-1 border rounded p-1" :placeholder="type === 'character' ? '角色名' : '成员名'">
            <div v-if="type === 'character'" mb-2 flex flex-1 flex-wrap items-center>
              <template v-for="alias in entity.alias" :key="alias">
                <p class="mb-1 mr-2 flex items-center border rounded bg-gray-50 px-1 text-center dark:bg-gray-600">
                  {{ alias }}
                  <button class="ml-1 flex cursor-pointer items-center rounded-full hover:bg-gray-800" @click="removeAlias(alias)">
                    <div i="carbon-close" class="z-20 h-4 w-4" />
                  </button>
                </p>
              </template>
              <input
                v-if="showAddAlias"
                v-model="createAlias"
                type="text"
                class="mt-0 flex-1 border rounded p-1"
                placeholder="输入角色别名"
                @keydown.enter="appendAlias(createAlias)"
              >
              <button v-else class="flex items-center rounded-full bg-green-500 p1" @click="showAddAlias = true">
                <div i="carbon-add-large" class="z-20 h-4 w-4" />
              </button>
            </div>
            <el-select
              v-if="type === 'character'"
              v-model="(entity as Character).cv!.id"
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
              <el-select v-model="entity.gender" placeholder="性别" style="width: 120px" mr-4>
                <el-option
                  v-for="(v, k) in genderEnum" :key="k"
                  :label="v"
                  :value="k"
                />
              </el-select>
              <el-select v-if="type === 'character'" v-model="entity.relation" placeholder="角色" style="width: 120px">
                <el-option
                  v-for="(v, k) in roleEnum" :key="k"
                  :label="v"
                  :value="k"
                />
              </el-select>
              <el-select v-else v-model="entity.relation" multiple placeholder="分工">
                <el-option
                  v-for="(v, k) in workEnum" :key="k"
                  :label="v"
                  :value="k"
                />
              </el-select>
            </div>
          </div>
        </el-col>
      </el-row>
      <el-input
        v-model="entity.summary"
        type="textarea"
        autosize
        class="mb-4 mt-2"
        :placeholder="type === 'character' ? '角色描述' : '成员描述'"
      />
      <el-row>
        <el-col>
          <div flex>
            <Upload
              :action="getUploadUrl()"
              class="mr-1 h-40 w-34 bg-gray-50 dark:bg-gray-800/50"
              @success="handleImageUploadSuccess"
            />
            <div
              v-for="image in entity.images"
              :key="image"
              relative
            >
              <button class="z-10 flex items-center rounded-full bg-red-500 p1" absolute right--1 top--1 @click="rmImage(image)">
                <div i="carbon-subtract-large" class="h-3 w-3" />
              </button>
              <el-image
                fit="cover"
                :src="imageUrl(image)"
                class="mr-1 h-40 w-34 rounded object-cover"
                :preview-src-list="entity.images?.map((img) => imageUrl(img))"
                alt=""
              />
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </el-drawer>
</template>
