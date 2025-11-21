import {
  createLocalFontProcessor,
} from '@unocss/preset-web-fonts/local'
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetUno,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

// 辅助函数：构建支持透明度的 RGB 变量字符串
// 输入 'c-primary' -> 输出 'rgba(var(--c-primary), %alpha)'
const k = (cssVarName: string) => `rgba(var(--${cssVarName}), %alpha)`

export default defineConfig({
  shortcuts: [
    ['btn', 'px-4 py-1 rounded inline-block bg-teal-700 text-white cursor-pointer !outline-none hover:bg-teal-800 disabled:cursor-default disabled:bg-gray-600 disabled:opacity-50'],
    ['icon-btn', 'inline-block cursor-pointer select-none opacity-75 transition duration-200 ease-in-out hover:opacity-100 hover:text-teal-600'],
  ],
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
    }),
    presetTypography(),
    presetWebFonts({
      fonts: {
        sans: 'DM Sans',
        serif: 'DM Serif Display',
        mono: 'DM Mono',
      },
      processors: createLocalFontProcessor(),
    }),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
  safelist: 'prose prose-sm m-auto text-left'.split(' '),
  theme: {
    colors: {
      // === 1. 背景类 (Backgrounds) ===
      // 使用方式: bg-page, bg-card, bg-input ...
      page: k('c-bg-page'),
      card: k('c-bg-card'),
      overlay: k('c-bg-overlay'),
      input: k('c-bg-input'),

      // === 2. 文字类 (Text) ===
      // 使用方式: text-main, text-muted ...
      main: k('c-text-main'),
      muted: k('c-text-muted'),
      faint: k('c-text-faint'),

      // === 边框 (Borders) ===
      // 使用方式: border-base, border-strong
      // 注意：这里用 'base' 而不是 'border' 以避免和 'border-border' 这种怪异写法冲突，或者你可以直接覆盖默认 border 颜色
      base: k('c-border'),
      strong: k('c-border-strong'),

      // === 3. 品牌色 (Primary) ===
      // 使用方式: bg-primary, text-primary, border-primary, bg-primary-hover
      primary: k('c-primary'),
      hover: k('c-primary-hover'),
      text: k('c-text-on-primary'), // 按钮上的文字色

      // === 4. 状态色 (Functional) ===
      success: k('c-success'),
      warning: k('c-warning'),
      error: k('c-error'),
    },
  },
})
