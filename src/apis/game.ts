import type {
  Character,
  CharacterSearchReq,
  CreateGameRequest,
  Game,
  GameInstance,
  GameListReq,
  GameListResponse,
  PersonSearchReq,
  ScraperDetailReq,
  ScraperSearchReq,
  Staff,
  UpdatePolicyReq,
} from '~/types'
import request from '~/utils/request'

export const gameApi = {
  // 获取游戏列表
  search(data: Partial<GameListReq>) {
    return request.post<GameListResponse>('/game/search', data)
  },
  // 新建游戏
  create(data: Partial<CreateGameRequest>) {
    return request.put('/game', data)
  },
  // 更新游戏
  update(data: Partial<Game>) {
    return request.patch<Game>(`/game`, data)
  },
  get(id: number) {
    return request.get<Game>(`/game?id=${id}`)
  },
  getIns(id: number) {
    return request.get(`/game/ins?id=${id}`)
  },
  download(id: number) {
    return request.post(`/game/download`, { game_id: id })
  },
  downloadAll() {
    return request.post(`/game/download/all`)
  },
  createGameIns(data: Partial<GameInstance>) {
    return request.post('/game/ins', data)
  },
  updateGameIns(data: Partial<GameInstance>) {
    return request.patch(`/game/ins`, data)
  },
}

export const scrapApi = {
  search(data: Partial<ScraperSearchReq>) {
    return request.post<string>('/scraper', data)
  },
  scrap(data: ScraperDetailReq | undefined) {
    return request.post('/scraper/scrape', data)
  },
  get(rid: string) {
    return request.get(`/scraper`, { params: { request_id: rid } })
  },
}

export const fileApi = {
  get(name: string) {
    return request.get(`/file/${name}`)
  },
}

export const categoryApi = {
  create(name: string) {
    return request.post('/categories', { name })
  },
  list() {
    return request.get('/categories')
  },
  delete(ids: string[]) {
    return request.delete(`/categories`, { ids })
  },
  update(id: number, name: string) {
    return request.patch(`/categories`, { id, name })
  },
}

export const seriesApi = {
  create(name: string) {
    return request.post('/series', { name })
  },
  list() {
    return request.get('/series')
  },
  delete(ids: string[]) {
    return request.delete(`/series`, { ids })
  },
  update(id: number, name: string) {
    return request.patch(`/series`, { id, name })
  },
}

export const brandApi = {
  create(name: string) {
    return request.post('/brand', { name })
  },
  list() {
    return request.get('/brand')
  },
  delete(ids: string[]) {
    return request.delete(`/brand`, { ids })
  },
  update(id: number, name: string) {
    return request.patch(`/brand`, { id, name })
  },
}

export const tagApi = {
  create(name: string) {
    return request.post('/tags', { name })
  },
  list() {
    return request.get('/tags')
  },
  delete(ids: string[]) {
    return request.delete(`/tags`, { ids })
  },
  update(id: number, name: string) {
    return request.patch(`/tags`, { id, name })
  },
}

export const characterApi = {
  create(data: Character) {
    return request.post('/character', data)
  },
  search(data: Partial<CharacterSearchReq>) {
    return request.post('/character/search', data)
  },
  delete(ids: string[]) {
    return request.delete(`/character`, { ids })
  },
  update(data: Character) {
    return request.patch(`/character`, data)
  },
  get(id: number) {
    return request.get(`/character/${id}`)
  },
}

export const personApi = {
  upsert(data: Staff) {
    return request.post('/person', data)
  },
  search(data: Partial<PersonSearchReq>) {
    return request.post('/person/search', data)
  },
  delete(ids: string[]) {
    return request.delete(`/person`, { ids })
  },
  get(id: number) {
    return request.get(`/person/${id}`)
  },
}

export const libraryApi = {
  ls(path: string, onlyNoScrap: boolean) {
    return request.get(`/library?path=${path}&only_no_scrap=${onlyNoScrap}`)
  },
}

export const policyApi = {
  get() {
    return request.get<Record<string, string>>(`/policy`)
  },
  update(data: UpdatePolicyReq) {
    return request.patch(`/policy`, data)
  },
}
