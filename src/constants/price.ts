import type { PandaLevel } from '../store/game'

// 青团不同等级的初始价（最低价）
export const BASE_QINGTUAN_PRICE: Record<PandaLevel, number> = {
  1: 1,
  2: 3,
  3: 8,
  4: 16,
  5: 32
}

// 青团不同等级的上限价（用于防止报价过高）
export const MAX_QINGTUAN_PRICE: Record<PandaLevel, number> = {
  1: 10,
  2: 30,
  3: 80,
  4: 160,
  5: 320
}
