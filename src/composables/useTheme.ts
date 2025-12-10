// src/composables/theme.ts
import { useStorage } from '@vueuse/core'

export type ThemeType = 'light' | 'dark' | 'tokyo-night'

// 持久化存储当前主题
export const currentTheme = useStorage<ThemeType>('app-theme', 'light')

interface ThemeOption {
  label: string
  value: ThemeType
  icon: string
}

export const themeOptions: ThemeOption[] = [
  { label: 'Light', value: 'light', icon: 'i-carbon-sun' },
  { label: 'Dark', value: 'dark', icon: 'i-carbon-moon' },
  { label: 'Tokyo Night', value: 'tokyo-night', icon: 'i-carbon-laptop' },
]

/**
 * 切换主题的函数
 * 会自动处理 html 标签的 class="dark" 和 data-theme="..."
 */
export function toggleTheme(theme: ThemeType) {
  currentTheme.value = theme
  updateTheme()
}

// 初始化或响应变化
export function updateTheme() {
  const html = document.documentElement
  const theme = currentTheme.value

  // 1. 处理 data-theme 属性 (用于 CSS 变量覆盖)
  if (theme === 'tokyo-night') {
    html.setAttribute('data-theme', 'tokyo-night')
  }
  else {
    html.removeAttribute('data-theme')
  }

  // 2. 处理 Vitesse 原有的 .dark 类 (用于兼容 UnoCSS 的 dark:前缀)
  // Tokyo Night 和 Dark 都被视为“暗色模式”
  if (theme === 'dark' || theme === 'tokyo-night') {
    html.classList.add('dark')
    // 如果你使用了 Vitesse 的 isDark ref，也可以在这里同步
    // isDark.value = true
  }
  else {
    html.classList.remove('dark')
    // isDark.value = false
  }
}

onMounted(() => {
  // 监听变化 (确保在应用启动或 storage 变化时生效)
  watchEffect(() => {
    updateTheme()
  })
})
