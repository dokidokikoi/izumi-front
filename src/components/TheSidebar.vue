<script setup lang="ts">
import { navItems } from '~/config/nav' // 自己的菜单配置文件

// Props
const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  collapsed: {
    type: Boolean,
    required: true,
  },
  closeSidebar: {
    type: Function as PropType<(event: MouseEvent) => void>,
    required: false,
    default: () => {},
  },
})

// 创建响应式的大屏幕检测计算属性
const isLargeScreen = computed(() => {
  if (typeof window !== 'undefined') {
    return window.innerWidth >= 768
  }
  return false
})

const hoverIndex = ref<number>(-1) // 当前悬停的菜单项
</script>

<template>
  <aside
    v-if="props.isOpen || isLargeScreen"
    class="fixed inset-y-0 left-0 z-50 flex flex-col bg-white p-2 shadow-lg transition-all duration-200 md:static dark:bg-gray-900" :class="[
      props.collapsed ? 'w-18' : 'w-54',
    ]"
    style="height: calc(100vh - 64px);"
  >
    <nav class="relative flex flex-col gap-1">
      <template v-for="(item, index) in navItems" :key="item.name || item.path || index">
        <!-- 分割线 -->
        <div
          v-if="item.divider"
          class="my-1 border-t-2 border-gray-200 dark:border-gray-700" :class="[
            props.collapsed ? 'mx-auto w-1/2' : 'mx-0 w-full',
          ]"
          style="margin: 10px auto;"
        />

        <!-- 菜单项 -->
        <RouterLink
          v-else-if="item.path && !item.external"
          :to="item.path"
          class="group hover:text-primary hover:text-primary relative z-10 flex items-center gap-3 rounded p-2 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          :class="[
            props.collapsed ? 'justify-center' : 'gap-3',
          ]"
          active-class="bg-gray-100 dark:bg-gray-800 font-semibold"
          @mouseenter="hoverIndex = index"
          @mouseleave="hoverIndex = -1"
          @click="props.closeSidebar"
        >
          <div :class="item.icon" class="z-20 h-6 w-6" />

          <!-- 正常折叠文字隐藏 -->
          <span
            v-if="!props.collapsed"
            class="truncate transition-all duration-200"
          >
            {{ item.name }}
          </span>

          <!-- 折叠状态下悬浮展开 -->
          <transition name="expand-item">
            <div
              v-if="props.collapsed && hoverIndex === index"
              class="absolute left-full top-0 z-50 h-10 flex scale-110 transform items-center rounded bg-white px-3 shadow-lg dark:bg-gray-800"
            >
              <span>{{ item.name }}</span>
            </div>
          </transition>
        </RouterLink>

        <!-- 外部链接 -->
        <a
          v-else-if="item.path && item.external"
          :href="item.path"
          target="_blank"
          rel="noopener"
          class="group hover:text-primary hover:text-primary relative z-10 flex items-center gap-3 rounded p-2 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          :class="[
            props.collapsed ? 'justify-center' : 'gap-3',
          ]"
          @mouseenter="hoverIndex = index"
          @mouseleave="hoverIndex = -1"
          @click="props.closeSidebar"
        >
          <div :class="item.icon" class="z-20 h-6 w-6" />

          <span v-if="!props.collapsed" class="truncate">{{ item.name }}</span>

          <transition name="expand-item">
            <div
              v-if="props.collapsed && hoverIndex === index"
              class="absolute left-full top-0 z-50 h-10 flex scale-110 transform items-center rounded bg-white px-3 shadow-lg dark:bg-gray-800"
            >
              <span>{{ item.name }}</span>
            </div>
          </transition>
        </a>
      </template>
    </nav>
  </aside>
</template>

<style scoped>
/* 悬浮展开动画 */
.expand-item-enter-active,
.expand-item-leave-active {
  transition: all 0.2s ease;
}
.expand-item-enter-from,
.expand-item-leave-to {
  transform: scale(0.9);
  opacity: 0;
}
.expand-item-enter-to,
.expand-item-leave-from {
  transform: scale(1.1);
  opacity: 1;
}
</style>
