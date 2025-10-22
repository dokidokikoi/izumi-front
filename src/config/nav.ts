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
  { name: 'Setting', path: '/policy', icon: 'i-carbon-settings' },
  { name: 'Library', path: '/game', icon: 'i-carbon-game-console' },

  { divider: true },

  { name: 'LocalLibrary', path: '/library', icon: 'i-carbon-ibm-cloud-bare-metal-server' },
  { name: 'Scrap', path: '/scrap', icon: 'i-carbon-shopping-cart-arrow-down' },

  { divider: true },

  { name: 'GitHub', path: 'https://github.com/dokidokikoi/izumi', external: true, icon: 'i-carbon-logo-github' },
]
