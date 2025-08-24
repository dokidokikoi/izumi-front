import type { ViteSSGContext } from 'vite-ssg'

export type UserModule = (ctx: ViteSSGContext) => void

// 游戏标签
export interface GameTag {
  id: number
  name: string
}

// 游戏类型
export interface GameCategory {
  id: number
  name: string
}

// 游戏实体
export interface Game {
  id: number
  name: string
  alias?: string
  publisher: string
  developer?: string
  categories: GameCategory[]
  tags: GameTag[]
  cover: string
  releaseDate: string
  createdAt: string
}

// 游戏列表响应
export interface GameListResponse {
  list: Game[]
  total: number
}
