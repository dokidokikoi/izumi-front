export interface NavItem {
  name?: string // 菜单名
  path?: string // 路径
  icon?: any // 图标组件
  external?: boolean // 是否外部链接
  divider?: boolean // 是否显示分割线
}
// @unocss-include
export const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: 'i-carbon-dashboard' },
  { name: 'Library', path: '/game', icon: 'i-carbon-game-console' },

  { divider: true },

  { name: 'Contact', path: '/contact', icon: 'i-carbon-campsite' },
  { name: 'GitHub', path: 'https://github.com/antfu-collective/vitesse', external: true, icon: 'i-carbon-logo-github' },
]
