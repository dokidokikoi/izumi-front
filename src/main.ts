import type { UserModule } from './types'

import ElementPlus from 'element-plus'
import { setupLayouts } from 'virtual:generated-layouts'
import { ViteSSG } from 'vite-ssg'
import { routes } from 'vue-router/auto-routes'
import { useWsNotify } from '~/composables/useWsNotify'
import App from './App.vue'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

import '@unocss/reset/tailwind.css'
import './styles/main.css'
import 'uno.css'

useWsNotify().connect('')
// https://github.com/antfu/vite-ssg
export const createApp = ViteSSG(
  App,
  {
    routes: setupLayouts(routes),
    base: import.meta.env.BASE_URL,
  },
  (ctx) => {
    // install all modules under `modules/`
    Object.values(import.meta.glob<{ install: UserModule }>('./modules/*.ts', { eager: true }))
      .forEach(i => i.install?.(ctx))
    // ctx.app.use(Previewer)
    ctx.app.use(ElementPlus)
  },
)
