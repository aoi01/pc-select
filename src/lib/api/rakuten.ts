import type {
  NormalizedProduct,
  RakutenSearchResponse,
  RakutenItem,
  SpecRank,
} from '../types'
import { generateFriendlySpec } from '../diagnose'

/**
 * 楽天API設定
 * 環境変数から読み込む（セキュリティのためハードコードしない）
 */
const RAKUTEN_CONFIG = {
  baseUrl: 'https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601',
  applicationId: process.env.RAKUTEN_APPLICATION_ID || '',
  affiliateId: process.env.RAKUTEN_AFFILIATE_ID || '',
}

/**
 * 楽天API検索パラメータ
 */
interface RakutenSearchParams {
  keyword: string
  minPrice?: number
  maxPrice?: number
  hits?: number        // 取得件数（1-30、デフォルト30）
  page?: number        // ページ番号
  sort?: string        // ソート順
  shopCode?: string    // ショップコードで絞り込み
  genreId?: number     // ジャンルID
}

/**
 * 楽天APIのソート順
 */
export const RAKUTEN_SORT = {
  STANDARD: 'standard',           // 標準
  PRICE_ASC: '+itemPrice',        // 価格昇順
  PRICE_DESC: '-itemPrice',       // 価格降順
  REVIEW_COUNT: '-reviewCount',   // レビュー件数順
  REVIEW_AVERAGE: '-reviewAverage', // レビュー評価順
} as const

/**
 * 信頼できるPC販売ショップのホワイトリスト
 * 設計書 §4.5 に基づく
 */
export const TRUSTED_SHOPS = {
  // TODO: 実際のshopCodeを調査して登録
  // 例: ドスパラ、NTT-X Store、ビックカメラ等
  DOSPARA: 'dospara',
  NTTX: 'nttxstore',
  BICCAMERA: 'biccamera',
  YODOBASHI: 'yodobashi',
} as const

/**
 * 楽天商品検索APIを実行
 *
 * @param params 検索パラメータ
 * @returns 検索結果
 * @throws ネットワークエラー、APIエラー
 */
export async function searchRakutenItems(
  params: RakutenSearchParams
): Promise<RakutenSearchResponse> {
  const url = new URL(RAKUTEN_CONFIG.baseUrl)

  // 必須パラメータ
  url.searchParams.set('applicationId', RAKUTEN_CONFIG.applicationId)
  url.searchParams.set('keyword', params.keyword)
  url.searchParams.set('formatVersion', '2')  // シンプルなレスポンス形式

  // オプションパラメータ
  if (params.minPrice !== undefined) {
    url.searchParams.set('minPrice', params.minPrice.toString())
  }
  if (params.maxPrice !== undefined) {
    url.searchParams.set('maxPrice', params.maxPrice.toString())
  }
  if (params.hits !== undefined) {
    url.searchParams.set('hits', params.hits.toString())
  }
  if (params.page !== undefined) {
    url.searchParams.set('page', params.page.toString())
  }
  if (params.sort !== undefined) {
    url.searchParams.set('sort', params.sort)
  }
  if (params.shopCode !== undefined) {
    url.searchParams.set('shopCode', params.shopCode)
  }
  if (params.genreId !== undefined) {
    url.searchParams.set('genreId', params.genreId.toString())
  }

  // アフィリエイトID（ある場合はアフィリエイトURLを自動生成）
  if (RAKUTEN_CONFIG.affiliateId) {
    url.searchParams.set('affiliateId', RAKUTEN_CONFIG.affiliateId)
  }

  // APIリクエスト実行
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`楽天API エラー: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  // APIエラーチェック
  if (data.error) {
    throw new Error(`楽天API エラー: ${data.error_description || data.error}`)
  }

  return data as RakutenSearchResponse
}

/**
 * 楽天APIのアイテムを正規化
 *
 * @param item 楽天APIのアイテム
 * @param specRank スペックランク（検索キーワードから推定済み）
 * @returns 正規化された商品データ
 */
export function normalizeRakutenItem(
  item: RakutenItem,
  specRank: SpecRank
): NormalizedProduct {
  return {
    provider: 'rakuten',
    externalId: item.itemCode,
    name: item.itemName,
    price: item.itemPrice,
    imageUrl: item.mediumImageUrls?.[0] ?? '',
    affiliateUrl: item.affiliateUrl ?? item.itemUrl,
    shopName: item.shopName,
    shopCode: item.shopCode,
    shopUrl: item.shopUrl,
    specRank,
    friendlySpec: generateFriendlySpec(specRank),
    isAvailable: item.availability === 1,
    reviewScore: item.reviewAverage,
    reviewCount: item.reviewCount,
    lastSyncedAt: Date.now(),
  }
}

/**
 * 検索結果から3台の提案を選出
 * 設計書 §4.4 に基づく
 *
 * @param items 検索結果アイテム
 * @param specRank スペックランク
 * @param budget 予算情報（中央値計算用）
 * @returns 3台の提案（ベスト、コスパ、1ランク上は別途検索）
 */
export function selectRecommendations(
  items: RakutenItem[],
  specRank: SpecRank,
  budget?: { min: number; max: number }
): {
  best: NormalizedProduct | null
  value: NormalizedProduct | null
} {
  // 在庫ありの商品のみフィルタ
  const availableItems = items.filter(item => item.availability === 1)

  if (availableItems.length === 0) {
    return { best: null, value: null }
  }

  // ① ベスト: 予算中央値に近く、レビュー評価が高い商品
  const budgetMid = budget ? (budget.min + budget.max) / 2 : 100000

  const sortedByBest = [...availableItems].sort((a, b) => {
    // 価格の予算中央値からの距離
    const aDiff = Math.abs(a.itemPrice - budgetMid)
    const bDiff = Math.abs(b.itemPrice - budgetMid)

    // 同じ距離ならレビュー評価で比較
    if (aDiff === bDiff) {
      return (b.reviewAverage ?? 0) - (a.reviewAverage ?? 0)
    }

    return aDiff - bDiff
  })

  const bestItem = sortedByBest[0]

  // ② コスパ重視: 最安の商品
  const sortedByPrice = [...availableItems].sort(
    (a, b) => a.itemPrice - b.itemPrice
  )
  const valueItem = sortedByPrice[0]

  return {
    best: normalizeRakutenItem(bestItem, specRank),
    value: normalizeRakutenItem(valueItem, specRank),
  }
}

/**
 * 検索実行 + 正規化 + 提案選出を一括実行
 *
 * @param params 検索パラメータ
 * @param specRank スペックランク
 * @returns 正規化された商品リストと提案
 */
export async function searchAndNormalize(
  params: RakutenSearchParams,
  specRank: SpecRank
): Promise<{
  items: NormalizedProduct[]
  total: number
}> {
  const response = await searchRakutenItems(params)

  const items = response.Items?.map(item =>
    normalizeRakutenItem(item.Item, specRank)
  ) ?? []

  return {
    items,
    total: response.count,
  }
}
