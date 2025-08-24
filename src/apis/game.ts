import type { Game, GameListResponse } from '~/types'
import request from '~/utils/request'

export const gameApi = {
  // 获取游戏列表
  list(params?: any) {
    return request.get<GameListResponse>('/games', { params })
  },

  // 获取游戏详情
  detail(id: number | string) {
    return request.get<Game>(`/games/${id}`)
  },

  // 新建游戏
  create(data: Partial<Game>) {
    return request.post<Game>('/games', data)
  },

  // 更新游戏
  update(id: number | string, data: Partial<Game>) {
    return request.put<Game>(`/games/${id}`, data)
  },

  // 删除游戏
  delete(id: number | string) {
    return request.delete(`/games/${id}`)
  },
}
