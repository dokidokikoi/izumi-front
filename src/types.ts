import type { ViteSSGContext } from 'vite-ssg'

export type UserModule = (ctx: ViteSSGContext) => void

// 游戏标签
export interface Tag {
  id: number
  name: string
  created_at: string
  updated_at: string
}

// 游戏类型
export interface Category {
  id: number
  name: string
  created_at: string
  updated_at: string
}

// 游戏系列
export interface Series {
  id: number
  name: string
  created_at: string
  updated_at: string
}

// 游戏厂商
export interface Brand {
  id: number
  name: string
  created_at: string
  updated_at: string
}

// 游戏参与人员
export interface Staff {
  id: number
  name: string
  alias: string[]
  cover: string
  images: string[]
  tags: Tag[]
  summary: string
  gender: string
  relation: string[]
  created_at: string | null
  updated_at: string | null
}

// 游戏角色
export interface Character {
  id: number
  name: string
  alias: string[]
  cover: string
  images: string[]
  tags: Tag[]
  summary: string
  gender: string
  relation: string
  cv: Staff | null
  games: Game[]
  weight: number
  created_at: string
  updated_at: string
}

// 游戏链接
export interface Link {
  name: string
  url: string
  type: string
}

// 游戏
export interface Game {
  id: number
  jan_code: string
  code: string
  name: string
  alias: string[]
  cover: string
  images: string[]
  category: Category | null
  series: Series[]
  brands: Brand[] | null
  price: string
  issue_date: string // ISO 时间字符串，例如 "2025-08-25T12:34:56Z"
  story: string
  platform: string
  tags: Tag[]
  characters: Character[]
  links: Link[]
  other_info: string
  staff: Staff[]
  created_at: string // ISO 时间字符串
}

export interface GameInstance {
  id: number
  game_id: number
  version: string
  path: string
  size: string
  language: string[]
  platform: string[]
  comment: string
  created_at: string
}

// 游戏列表响应
export interface GameListResponse {
  list: Game[]
  total: number
}

export interface Policy {
  key: string
  policy: string
}

//
export interface GameListReq {
  keyword: string
  tags: string[]
  series: number
  category: number
  staff: number
  character: number
  brand: number

  page: number
  page_size: number
  order_by: string
}

//
export interface CreateGameRequest {
  game: Partial<Game>
  game_ins: Partial<GameInstance>
}

//
export interface ScraperSearchReq {
  name: string
  keyword: string
  page: number
  request_id: string
}

//
export interface ScraperGetRespItem {
  name: string
  cover: string
  scraper_name: string
  summary: string
  url: string
}

//
export interface ScraperDetailReqObj {
  name: string
  url: string
}
export interface ScraperDetailReq {
  request_id: string
  objs: ScraperDetailReqObj[]
}
export interface ScraperAutoReq {
  objs: ScraperDetailReqObj[]
  path: string
  version: string
}

//
export interface CharacterSearchReq {
  keyword: string
  tags: number[]
  created_at_range: string[]
  gender: string
  cv: number[]
  full_text: string

  page: number
  page_size: number
  order_by: string
}

//
export interface PersonSearchReq {
  keyword: string
  tags: number[]
  created_at_range: string[]
  gender: string
  full_text: string

  page: number
  page_size: number
  order_by: string
}

//
export interface PathInfo {
  path: string
  is_dir: boolean
  child: PathInfo[]
}

//
export interface UpdatePolicyReq {
  key: string
  policy: string
}
