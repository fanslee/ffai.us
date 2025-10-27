import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { showToast, getStorageSync, setStorageSync } from '@tarojs/taro'

export const STEAL_COOLDOWN_MS = 60000

export type PandaLevel = 1 | 2 | 3 | 4 | 5
export interface PandaSkin { id: string; name: string; level: PandaLevel }
export interface Panda { id: string; name: string; level: PandaLevel; skinId: string }
export interface Food { id: string; name: string; quality: number; price: number }
export interface Qingtuan { amount: number; color: string; level: PandaLevel }
export interface MarketListing { id: string; sellerId: string; unitPrice: number; minPrice: number; qingtuan: Qingtuan; title?: string; createdAt: number }
export interface MarketBid { id: string; buyerId: string; level: PandaLevel; quantity: number; originalQuantity: number; maxUnitPrice: number; createdAt: number; remainingBudget: number }
export interface Player { id: string; name: string; balance: number; frozen: number; frozenListed: number }
export type TxType = 'feed' | 'steal' | 'recharge' | 'list' | 'buy' | 'friendFeed' | 'sell'
export interface Transaction { id: string; type: TxType; amount: number; note?: string; time: number; meta?: { level?: PandaLevel; quantity?: number; unitPrice?: number } }

interface GameState {
  player: Player
  pandas: Panda[]
  foods: Food[]
  listings: MarketListing[]
  bids: MarketBid[]
  transactions: Transaction[]
  stealCooldowns: Record<string, number>
  friendships: Record<string, number>
  risk: { blockedUntil: number; violations: number; actionWindows: Record<string, number[]> }
}

interface GameContextValue extends GameState {
  feedPanda: (pandaId: string, foodId: string) => void
  stealFromFriend: (targetPlayerId: string) => void
  feedFriend: (targetPlayerId: string) => void
  listQingtuan: (unitPrice: number, minPrice: number, qt: Qingtuan, title?: string) => void
  buyListing: (listingId: string) => void
  marketBuy: (level: PandaLevel, quantity: number, maxUnitPrice: number, minUnitPrice: number) => void
  placeBid: (level: PandaLevel, quantity: number, maxUnitPrice: number) => void
  cancelBid: (bidId: string) => void
  cancelListing: (listingId: string) => void
  marketSell: (level: PandaLevel, quantity: number, minUnitPrice: number) => void
  updateListingPrice: (listingId: string, newUnitPrice: number) => void
  recharge: (amount: number) => void
  markAction: (key: string) => boolean
  exportSave: () => string
  importSave: (json: string) => boolean
  importSaveMerge: (json: string, mode: 'marketOnly' | 'transactionsOnly' | 'playerOnly') => boolean
  resetAll: () => void
  // Auth
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  signUp: (email: string, password: string) => Promise<boolean>
}

const GameContext = createContext<GameContextValue | null>(null)

const initialState: GameState = {
  player: { id: 'u1', name: '我', balance: 100, frozen: 0, frozenListed: 0 },
  pandas: [
    { id: 'p1', name: '团团', level: 1, skinId: 'skin-l1-1' },
    { id: 'p2', name: '圆圆', level: 2, skinId: 'skin-l2-1' }
  ],
  foods: [
    { id: 'f1', name: '竹叶', quality: 1, price: 1 },
    { id: 'f2', name: '蜂蜜竹', quality: 2, price: 3 },
    { id: 'f3', name: '灵竹', quality: 3, price: 8 }
  ],
  listings: [],
  bids: [],
  transactions: [],
  stealCooldowns: {},
  friendships: {},
  risk: { blockedUntil: 0, violations: 0, actionWindows: {} }
}

const STORAGE_KEY = 'CutePartySave'

// —— Serverless API 集成（Vercel Functions /api/*） ——
const apiBase = '' // 同源部署，使用相对路径
import { getAccessToken, login as authLogin, logout as authLogout, signUp as authSignUp } from '../lib/auth'

async function fetchJson<T = any>(url: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken()
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {}
  const res = await fetch(`${apiBase}${url}`, { ...(init || {}), headers: { 'Content-Type': 'application/json', ...authHeader, ...(init?.headers || {}) } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function mapServerListing(x: any): MarketListing {
  return {
    id: x.id,
    sellerId: x.seller_id,
    unitPrice: Number(x.unit_price),
    minPrice: Number(x.min_price),
    qingtuan: { amount: Number(x.amount), color: 'green', level: Number(x.level) as PandaLevel },
    title: x.title || undefined,
    createdAt: new Date(x.created_at).getTime()
  }
}

function mapServerBid(x: any): MarketBid {
  return {
    id: x.id,
    buyerId: x.buyer_id,
    level: Number(x.level) as PandaLevel,
    quantity: Number(x.quantity),
    originalQuantity: Number(x.original_quantity ?? x.quantity),
    maxUnitPrice: Number(x.max_unit_price),
    createdAt: new Date(x.created_at).getTime(),
    remainingBudget: Number(x.remaining_budget ?? x.quantity * x.max_unit_price)
  }
}

async function syncListingsFromServer() {
  try {
    const data = await fetchJson<{ items: any[] }>(`/api/market/listings?page=1&size=50`)
    setState(s => ({ ...s, listings: (data.items || []).map(mapServerListing) }))
  } catch {}
}

async function syncBidsFromServer() {
  try {
    const data = await fetchJson<{ items: any[] }>(`/api/market/bids?page=1&size=50`)
    setState(s => ({ ...s, bids: (data.items || []).map(mapServerBid) }))
  } catch {}
}

function mintQingtuan(level: PandaLevel, quality: number): Qingtuan {
  // 简化算法：产量=level*quality，颜色按等级
  const amount = level * quality
  const colors = { 1: 'green', 2: 'jade', 3: 'emerald', 4: 'teal', 5: 'cyan' } as const
  return { amount, color: colors[level], level }
}

// 风控与限频：简单本地反刷机制（窗口计数 + 封禁）
const ACTION_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  feed: { limit: 20, windowMs: 60_000 },
  friend: { limit: 20, windowMs: 60_000 },
  steal: { limit: 5, windowMs: 60_000 },
  list: { limit: 10, windowMs: 60_000 },
  bid: { limit: 15, windowMs: 60_000 },
  buy: { limit: 30, windowMs: 60_000 },
  sell: { limit: 30, windowMs: 60_000 },
  export: { limit: 10, windowMs: 60_000 },
}

function isBlocked(s: GameState) {
  return s.risk.blockedUntil && s.risk.blockedUntil > Date.now()
}

function recordAction(s: GameState, key: string) {
  const now = Date.now()
  const winMs = ACTION_LIMITS[key]?.windowMs ?? 60_000
  const limit = ACTION_LIMITS[key]?.limit ?? 10
  const win = s.risk.actionWindows[key] || []
  const cutoff = now - winMs
  const filtered = win.filter(t => t > cutoff)
  filtered.push(now)
  let blockedUntil = s.risk.blockedUntil
  let violations = s.risk.violations
  let actionWindows = { ...s.risk.actionWindows, [key]: filtered }
  const over = filtered.length > limit
  if (over) {
    violations += 1
    // 简单封禁策略：连续3次过频，封禁5分钟
    if (violations >= 3) blockedUntil = now + 5 * 60_000
  }
  return { blockedUntil, violations, actionWindows, over }
}

function guardAction(s: GameState, key: string) {
  if (isBlocked(s)) {
    showToast({ title: '操作受限，请稍后再试', icon: 'error' })
    return { blocked: true }
  }
  const { blockedUntil, violations, actionWindows, over } = recordAction(s, key)
  if (over) showToast({ title: '操作过于频繁', icon: 'error' })
  return { blocked: false, over, nextRisk: { blockedUntil, violations, actionWindows } }
}

export function getActionQuota(risk: GameState['risk']) {
  const now = Date.now()
  const keys = Object.keys(ACTION_LIMITS)
  return keys.map(k => {
    const winMs = ACTION_LIMITS[k].windowMs
    const limit = ACTION_LIMITS[k].limit
    const arr = risk.actionWindows[k] || []
    const cutoff = now - winMs
    const used = arr.filter(t => t > cutoff).length
    return { key: k, used, limit, remain: Math.max(0, limit - used) }
  })
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(initialState)

  // —— 启动时尝试从本地存储加载 ——
  useEffect(() => {
    try {
      const text = getStorageSync(STORAGE_KEY)
      if (text) {
        const ok = importSave(String(text))
        if (!ok) throw new Error('invalid save')
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // —— 存档导出：序列化当前状态为 JSON 字符串，并进行简易校验 ——
  const exportSave = () => {
    const snapshot = { ...state }
    try {
      const json = JSON.stringify(snapshot)
      try { setStorageSync(STORAGE_KEY, json) } catch {}
      return json
    } catch (e) {
      showToast({ title: '导出失败', icon: 'error' })
      return ''
    }
  }

  // —— 存档导入：解析 JSON，进行基本结构校验与风控复位策略 ——
  const importSave = (json: string) => {
    try {
      const obj = JSON.parse(json)
      // 基本字段校验（防止结构不符导致崩溃），只接受白名单字段
      const safe: GameState = {
        player: obj.player,
        pandas: obj.pandas,
        foods: obj.foods,
        listings: obj.listings,
        bids: obj.bids,
        transactions: obj.transactions,
        stealCooldowns: obj.stealCooldowns || {},
        friendships: obj.friendships || {},
        // 风控不完全信任：导入后清理窗口并保留封禁时间下限（不可把封禁时间缩短）
        risk: {
          blockedUntil: Math.max(state.risk.blockedUntil || 0, obj?.risk?.blockedUntil || 0),
          violations: 0, // 违规次数清零，避免旧数据误封禁叠加
          actionWindows: {} // 清空窗口，重新计数，避免绕过限频
        }
      }
      // 进一步类型检查（简化）：确保必要字段存在
      if (!safe.player || !Array.isArray(safe.pandas) || !Array.isArray(safe.foods)) {
        showToast({ title: '存档结构不合法', icon: 'error' })
        return false
      }
      setState(safe)
      showToast({ title: '导入成功', icon: 'success' })
      return true
    } catch (e) {
      showToast({ title: '导入失败：JSON不合法', icon: 'error' })
      return false
    }
  }

  // —— 部分合并导入：仅合并指定模块（避免覆盖其他数据） ——
  const importSaveMerge = (json: string, mode: 'marketOnly' | 'transactionsOnly' | 'playerOnly') => {
    try {
      const obj = JSON.parse(json)
      setState(s => {
        const next = { ...s }
        if (mode === 'marketOnly') {
          next.listings = Array.isArray(obj.listings) ? obj.listings : s.listings
          next.bids = Array.isArray(obj.bids) ? obj.bids : s.bids
          // 风控：清空窗口，保留封禁时间下限
          next.risk = { ...s.risk, blockedUntil: Math.max(s.risk.blockedUntil || 0, obj?.risk?.blockedUntil || 0), actionWindows: {}, violations: 0 }
        } else if (mode === 'transactionsOnly') {
          next.transactions = Array.isArray(obj.transactions) ? obj.transactions : s.transactions
        } else if (mode === 'playerOnly') {
          if (obj.player && typeof obj.player.balance === 'number' && typeof obj.player.frozen === 'number' && typeof obj.player.frozenListed === 'number') {
            next.player = { ...s.player, balance: obj.player.balance, frozen: obj.player.frozen, frozenListed: obj.player.frozenListed }
          }
        }
        return next
      })
      showToast({ title: '合并导入完成', icon: 'success' })
      return true
    } catch (e) {
      showToast({ title: '合并导入失败：JSON不合法', icon: 'error' })
      return false
    }
  }

  // —— 一键重置：恢复到初始状态，但保留当前封禁状态（避免重置绕过封禁） ——
  const resetAll = () => {
    setState(s => ({
      ...initialState,
      risk: { ...initialState.risk, blockedUntil: Math.max(initialState.risk.blockedUntil, s.risk.blockedUntil) }
    }))
    showToast({ title: '已重置为初始存档' })
  }

  const feedPanda = (pandaId: string, foodId: string) => {
    const guard = guardAction(state, 'feed')
    if (guard.blocked) return
    const panda = state.pandas.find(p => p.id === pandaId)
    const food = state.foods.find(f => f.id === foodId)
    if (!panda || !food) return
    const qt = mintQingtuan(panda.level, food.quality)
    setState(s => ({
      ...s,
      player: { ...s.player, balance: s.player.balance + qt.amount },
      risk: guard.nextRisk ? guard.nextRisk : s.risk,
      transactions: [
        { id: `t${Date.now()}`, type: 'feed', amount: qt.amount, note: `喂养 ${panda.name} 等级${panda.level}，食物品质${food.quality}`, time: Date.now() },
        ...s.transactions
      ]
    }))
    showToast({ title: `喂养成功，获得青团 +${qt.amount}`, icon: 'success' })
  }

  const stealFromFriend = (targetPlayerId: string) => {
    const guard = guardAction(state, 'steal')
    if (guard.blocked) return
    const now = Date.now()
    const last = state.stealCooldowns[targetPlayerId] || 0
    const remain = STEAL_COOLDOWN_MS - (now - last)
    if (remain > 0) {
      const sec = Math.ceil(remain / 1000)
      showToast({ title: `冷却中，${sec}s 后可再次偷取` })
      return
    }
    const gain = Math.floor(Math.random() * 3) + 1
    setState(s => ({
      ...s,
      player: { ...s.player, balance: s.player.balance + gain },
      risk: guard.nextRisk ? guard.nextRisk : s.risk,
      transactions: [
        { id: `t${Date.now()}`, type: 'steal', amount: gain, note: '从好友偷取', time: Date.now() },
        ...s.transactions
      ],
      stealCooldowns: { ...s.stealCooldowns, [targetPlayerId]: now }
    }))
    showToast({ title: `偷偷成功，获得青团 +${gain}` })
  }

  const feedFriend = (targetPlayerId: string) => {
    const guard = guardAction(state, 'friend')
    if (guard.blocked) return
    const gain = 1 + Math.floor(Math.random() * 2) // 1-2 亲密互喂奖励
    setState(s => ({
      ...s,
      player: { ...s.player, balance: s.player.balance + gain },
      risk: guard.nextRisk ? guard.nextRisk : s.risk,
      friendships: { ...s.friendships, [targetPlayerId]: (s.friendships[targetPlayerId] || 0) + 1 },
      transactions: [
        { id: `t${Date.now()}`, type: 'friendFeed', amount: gain, note: '与好友互喂', time: Date.now() },
        ...s.transactions
      ]
    }))
    showToast({ title: `互喂成功，获得青团 +${gain}` })
  }

  const listQingtuan = async (unitPrice: number, minPrice: number, qt: Qingtuan, title?: string) => {
    const guard = guardAction(state, 'list')
    if (guard.blocked) return
    if (unitPrice < minPrice) { showToast({ title: '挂牌价不得低于初始价', icon: 'error' }); return }
    if (qt.amount <= 0) { showToast({ title: '数量需大于0', icon: 'error' }); return }
    try {
      await fetchJson(`/api/market/listings`, {
        method: 'POST',
        body: JSON.stringify({ seller_id: state.player.id, level: qt.level, amount: qt.amount, unit_price: unitPrice, min_price: minPrice, title })
      })
      setState(s => ({ ...s, player: { ...s.player, frozenListed: (s.player.frozenListed || 0) + qt.amount }, risk: guard.nextRisk ? guard.nextRisk : s.risk }))
      await syncListingsFromServer()
      showToast({ title: '挂牌成功' })
    } catch (e) {
      showToast({ title: '挂牌失败', icon: 'error' })
    }
  }

  const cancelListing = async (listingId: string) => {
    const guard = guardAction(state, 'list')
    if (guard.blocked) return
    const l = state.listings.find(x => x.id === listingId)
    if (!l) return
    if (l.sellerId !== state.player.id) { showToast({ title: '只能撤销自己的挂单', icon: 'error' }); return }
    try {
      await fetchJson(`/api/market/listings/${encodeURIComponent(listingId)}?seller_id=${encodeURIComponent(state.player.id)}`, { method: 'DELETE' })
      setState(s => ({
        ...s,
        player: { ...s.player, frozenListed: Math.max(0, (s.player.frozenListed || 0) - l.qingtuan.amount) },
        risk: guard.nextRisk ? guard.nextRisk : s.risk,
        transactions: [ { id: `t${Date.now()}`, type: 'list', amount: 0, note: `撤销挂牌 等级${l.qingtuan.level} 数量${l.qingtuan.amount}`, time: Date.now() }, ...s.transactions ]
      }))
      await syncListingsFromServer()
      showToast({ title: '撤单成功' })
    } catch {
      showToast({ title: '撤单失败', icon: 'error' })
    }
  }

  const updateListingPrice = async (listingId: string, newUnitPrice: number) => {
    const guard = guardAction(state, 'list')
    if (guard.blocked) return
    const l = state.listings.find(x => x.id === listingId)
    if (!l) return
    if (l.sellerId !== state.player.id) { showToast({ title: '只能修改自己的挂单', icon: 'error' }); return }
    if (newUnitPrice <= 0) { showToast({ title: '价格需大于0', icon: 'error' }); return }
    try {
      const resp = await fetchJson(`/api/market/listings/${encodeURIComponent(listingId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ seller_id: state.player.id, unit_price: newUnitPrice })
      })
      // 同步最新列表（服务端为准）
      await syncListingsFromServer()
      showToast({ title: '改价成功' })
    } catch {
      showToast({ title: '改价失败', icon: 'error' })
    }
  }

  const buyListing = (listingId: string) => {
    const guard = guardAction(state, 'buy')
    if (guard.blocked) return
    const listing = state.listings.find(l => l.id === listingId)
    if (!listing) return
    const total = listing.unitPrice * listing.qingtuan.amount
    if (state.player.balance < total) {
      showToast({ title: '余额不足', icon: 'error' })
      return
    }
    setState(s => ({
      ...s,
      player: { ...s.player, balance: s.player.balance - total, frozenListed: listing.sellerId === s.player.id ? Math.max(0, (s.player.frozenListed || 0) - listing.qingtuan.amount) : (s.player.frozenListed || 0) },
      risk: guard.nextRisk ? guard.nextRisk : s.risk,
      listings: s.listings.filter(l => l.id !== listingId),
      transactions: [
        { id: `t${Date.now()}`, type: 'buy', amount: -total, note: `购买 等级${listing.qingtuan.level} x${listing.qingtuan.amount} 单价${listing.unitPrice}`, time: Date.now(), meta: { level: listing.qingtuan.level, quantity: listing.qingtuan.amount, unitPrice: listing.unitPrice } },
        ...s.transactions
      ]
    }))
    showToast({ title: '购买成功', icon: 'success' })
  }

  // 市价买入撮合：先冻结预算，再按最低价优先撮合卖单，成交按对手价，未用预算解冻并返还余额
  const marketBuy = async (level: PandaLevel, quantity: number, maxUnitPrice: number, minUnitPrice: number) => {
    const guard = guardAction(state, 'buy')
    if (guard.blocked) return
    if (quantity <= 0 || maxUnitPrice <= 0) { showToast({ title: '数量与价格需大于0' }); return }
    const needBudget = quantity * maxUnitPrice
    if (state.player.balance < needBudget) { showToast({ title: '余额不足以冻结买入预算', icon: 'error' }); return }
    try {
      // 先冻结预算（前端本地）
      setState(s => ({ ...s, player: { ...s.player, balance: s.player.balance - needBudget, frozen: s.player.frozen + needBudget } }))
      const resp = await fetchJson<{ matchedQty: number; spent: number; avgPrice: number }>(`/api/market/match/buy`, {
        method: 'POST',
        body: JSON.stringify({ buyer_id: state.player.id, level, quantity, max_unit_price: maxUnitPrice, min_unit_price: minUnitPrice })
      })
      const { matchedQty, spent, avgPrice } = resp as any
      const refund = needBudget - (spent || 0)
      setState(s => ({
        ...s,
        player: { ...s.player, balance: s.player.balance + refund, frozen: Math.max(0, s.player.frozen - (spent || 0) - refund), frozenListed: Math.max(0, (s.player.frozenListed || 0) - (matchedQty || 0)) },
        transactions: spent > 0 ? [ { id: `t${Date.now()}`, type: 'buy', amount: -(spent||0), note: `快速购买 等级${level} 成交${matchedQty}/${quantity}`, time: Date.now(), meta: { level, quantity: matchedQty, unitPrice: avgPrice } }, ...s.transactions ] : s.transactions
      }))
      await syncListingsFromServer()
      await syncBidsFromServer()
      showToast({ title: '市价买入完成' })
    } catch (e) {
      // 失败则返还预算
      setState(s => ({ ...s, player: { ...s.player, balance: s.player.balance + needBudget, frozen: Math.max(0, s.player.frozen - needBudget) } }))
      showToast({ title: '市价买入失败', icon: 'error' })
    }
  }

  const recharge = (amount: number) => {
    setState(s => ({
      ...s,
      player: { ...s.player, balance: s.player.balance + amount },
      transactions: [
        { id: `t${Date.now()}`, type: 'recharge', amount, note: '充值', time: Date.now() },
        ...s.transactions
      ]
    }))
    showToast({ title: `充值 +${amount}` })
  }

  // 下买单加入队列（买单队列）
  const placeBid = async (level: PandaLevel, quantity: number, maxUnitPrice: number) => {
    const guard = guardAction(state, 'bid')
    if (guard.blocked) return
    if (quantity <= 0 || maxUnitPrice <= 0) { showToast({ title: '数量与价格需大于0' }); return }
    const needBudget = quantity * maxUnitPrice
    if (state.player.balance < needBudget) { showToast({ title: '余额不足以冻结买单资金', icon: 'error' }); return }
    try {
      const resp = await fetchJson<{ item: any }>(`/api/market/bids`, {
        method: 'POST',
        body: JSON.stringify({ buyer_id: state.player.id, level, quantity, original_quantity: quantity, max_unit_price: maxUnitPrice, remaining_budget: needBudget })
      })
      const bid = mapServerBid(resp.item)
      setState(s => ({
        ...s,
        player: { ...s.player, balance: s.player.balance - needBudget, frozen: s.player.frozen + needBudget },
        risk: guard.nextRisk ? guard.nextRisk : s.risk,
        bids: [bid, ...s.bids],
        transactions: [ { id: `t${Date.now()}`, type: 'buy', amount: 0, note: `冻结买单资金 等级${level} 数量${quantity} 最高价${maxUnitPrice}`, time: Date.now(), meta: { level, quantity, unitPrice: maxUnitPrice } }, ...s.transactions ]
      }))
      showToast({ title: '买单已提交，资金已冻结' })
    } catch {
      showToast({ title: '买单提交失败', icon: 'error' })
    }
  }

  // 快速卖出撮合：按单价从高到低撮合买单，可部分成交
  const cancelBid = async (bidId: string) => {
    const guard = guardAction(state, 'bid')
    if (guard.blocked) return
    const bid = state.bids.find(b => b.id === bidId)
    if (!bid) return
    if (bid.buyerId !== state.player.id) { showToast({ title: '只能撤销自己的买单', icon: 'error' }); return }
    const refund = bid.remainingBudget ?? (bid.quantity * bid.maxUnitPrice)
    try {
      await fetchJson(`/api/market/bids?id=${encodeURIComponent(bidId)}&buyer_id=${encodeURIComponent(state.player.id)}`, { method: 'DELETE' })
      setState(s => ({
        ...s,
        player: { ...s.player, balance: s.player.balance + refund, frozen: Math.max(0, s.player.frozen - refund) },
        risk: guard.nextRisk ? guard.nextRisk : s.risk
      }))
      await syncBidsFromServer()
      showToast({ title: '撤单成功，资金已解冻' })
    } catch {
      showToast({ title: '撤单失败', icon: 'error' })
    }
  }

  const marketSell = async (level: PandaLevel, quantity: number, minUnitPrice: number) => {
    const guard = guardAction(state, 'sell')
    if (guard.blocked) return
    if (quantity <= 0) { showToast({ title: '数量需大于0' }); return }
    try {
      const resp = await fetchJson<{ matchedQty: number; income: number; avgPrice: number }>(`/api/market/match/sell`, {
        method: 'POST',
        body: JSON.stringify({ seller_id: state.player.id, level, quantity, min_unit_price: minUnitPrice })
      })
      const { matchedQty, income, avgPrice } = resp as any
      if (!income || income <= 0) { showToast({ title: '无成交' }); return }
      setState(s => ({
        ...s,
        player: { ...s.player, balance: s.player.balance + income, frozen: Math.max(0, s.player.frozen - income) },
        transactions: [ { id: `t${Date.now()}`, type: 'sell', amount: income, note: `快速卖出 等级${level} 成交${matchedQty}/${quantity}`, time: Date.now(), meta: { level, quantity: matchedQty, unitPrice: avgPrice } }, ...s.transactions ]
      }))
      await syncBidsFromServer()
      showToast({ title: `成交 ${matchedQty}/${quantity}` })
    } catch (e) {
      showToast({ title: '市价卖出失败', icon: 'error' })
    }
  }

  const markAction = (key: string) => {
    const guard = guardAction(state, key)
    if (guard.blocked) return false
    setState(s => ({ ...s, risk: guard.nextRisk ? guard.nextRisk : s.risk }))
    // 异步服务端记录限频事件（不影响前端体验）
    fetchJson(`/api/risk/mark`, { method: 'POST', body: JSON.stringify({ key }) }).catch(()=>{})
    return true
  }

  const login = async (email: string, password: string) => {
    const r = await authLogin(email, password)
    if (!r.ok) { showToast({ title: r.error || '登录失败', icon: 'error' }); return false }
    // 初始化/加载服务端用户并同步到本地 player
    try {
      const init = await fetchJson<{ user: any }>(`/api/player/init`, { method: 'POST' })
      const me = await fetchJson<{ user: any; block: any }>(`/api/player/me`)
      const uid = init.user?.id || me.user?.id
      const balance = Number(me.user?.balance ?? 0)
      const frozen = Number(me.user?.frozen ?? 0)
      const frozenListed = Number(me.user?.frozen_listed ?? 0)
      setState(s => ({ ...s, player: { ...s.player, id: uid || s.player.id, balance, frozen, frozenListed } }))
    } catch {}
    await Promise.all([syncListingsFromServer(), syncBidsFromServer()])
    showToast({ title: '登录成功', icon: 'success' })
    return true
  }
  const logout = async () => { await authLogout(); showToast({ title: '已退出登录' }) }
  const signUp = async (email: string, password: string) => {
    const r = await authSignUp(email, password)
    if (!r.ok) { showToast({ title: r.error || '注册失败', icon: 'error' }); return false }
    showToast({ title: '注册成功，请登录', icon: 'success' })
    return true
  }

  const value = useMemo<GameContextValue>(() => ({
    ...state,
    feedPanda,
    stealFromFriend,
    feedFriend,
    listQingtuan,
    buyListing,
    marketBuy,
    placeBid,
    cancelBid,
    cancelListing,
    marketSell,
    updateListingPrice,
    recharge,
    markAction,
    exportSave,
    importSave,
    importSaveMerge,
    resetAll,
    login,
    logout,
    signUp
  }), [state])

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('GameContext not provided')
  return ctx
}
