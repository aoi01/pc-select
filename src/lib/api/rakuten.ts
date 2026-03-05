import type {
  NormalizedProduct,
  RakutenSearchResponse,
  RakutenItem,
  SpecRank,
} from '../types'
import { generateFriendlySpec } from '../diagnose'

/**
 * 楽天API設定
 * 環境変数から読み込む
 * Next.jsクライアントサイドでは NEXT_PUBLIC_ プレフィックスが必要
 */
const RAKUTEN_CONFIG = {
  baseUrl: 'https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601',
  // 新しい認証方式: Bearer Token
  accessToken: process.env.NEXT_PUBLIC_RAKUTEN_ACCESS_KEY || '',
  // 旧認証方式（フォールバック）
  applicationId: process.env.NEXT_PUBLIC_RAKUTEN_APPLICATION_ID || '',
  affiliateId: process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID || '',
}

/**
 * デモ用モックデータ
 * APIキーがない場合に使用
 */
const MOCK_PRODUCTS: NormalizedProduct[] = [
  {
    provider: 'rakuten',
    externalId: 'demo-001',
    name: '【中古】Lenovo ThinkPad X1 Carbon Gen9 Core i5 16GB SSD512GB 14インチ',
    price: 69800,
    imageUrl: 'https://thumbnail.image.rakuten.co.jp/@0_mall/dospara/cabinet/lenovo/20xx0001.jpg',
    affiliateUrl: 'https://item.rakuten.co.jp/dospara/123456/',
    shopName: 'ドスパラ楽天市場店',
    shopCode: 'dospara',
    specRank: 'B',
    friendlySpec: '中スペック - 日常使いから開発まで余裕',
    isAvailable: true,
    reviewScore: 4.5,
    reviewCount: 128,
    lastSyncedAt: Date.now(),
  },
  {
    provider: 'rakuten',
    externalId: 'demo-002',
    name: 'HP 15.6インチ ノートパソコン Ryzen 5 8GB SSD256GB Windows11',
    price: 54800,
    imageUrl: 'https://thumbnail.image.rakuten.co.jp/@0_mall/hp/cabinet/15-xxx.jpg',
    affiliateUrl: 'https://item.rakuten.co.jp/hp/234567/',
    shopName: 'HP Direct 楽天市場店',
    shopCode: 'hpdirect',
    specRank: 'C',
    friendlySpec: 'エントリー - 文書作成・Web閲覧に最適',
    isAvailable: true,
    reviewScore: 4.2,
    reviewCount: 89,
    lastSyncedAt: Date.now(),
  },
  {
    provider: 'rakuten',
    externalId: 'demo-003',
    name: '【新品】ASUS ゲーミングノート TUF Gaming F15 RTX4050 16GB 512GB',
    price: 159800,
    imageUrl: 'https://thumbnail.image.rakuten.co.jp/@0_mall/asus/cabinet/tuf-f15.jpg',
    affiliateUrl: 'https://item.rakuten.co.jp/asus/345678/',
    shopName: 'ASUS 楽天市場店',
    shopCode: 'asus',
    specRank: 'A',
    friendlySpec: '高スペック - 重い作業もサクサク快適',
    isAvailable: true,
    reviewScore: 4.7,
    reviewCount: 256,
    lastSyncedAt: Date.now(),
  },
  {
    provider: 'rakuten',
    externalId: 'demo-004',
    name: 'Dell Inspiron 14 Core i5 16GB SSD512GB Office付き 新品',
    price: 89800,
    imageUrl: 'https://thumbnail.image.rakuten.co.jp/@0_mall/dell/cabinet/inspiron14.jpg',
    affiliateUrl: 'https://item.rakuten.co.jp/dell/456789/',
    shopName: 'Dell 楽天市場店',
    shopCode: 'dell',
    specRank: 'B',
    friendlySpec: '中スペック - 日常使いから開発まで余裕',
    isAvailable: true,
    reviewScore: 4.3,
    reviewCount: 167,
    lastSyncedAt: Date.now(),
  },
  {
    provider: 'rakuten',
    externalId: 'demo-005',
    name: '【中古良品】MacBook Air M1 8GB SSD256GB 13.3インチ',
    price: 78000,
    imageUrl: 'https://thumbnail.image.rakuten.co.jp/@0_mall/apple/cabinet/macbook-air-m1.jpg',
    affiliateUrl: 'https://item.rakuten.co.jp/apple/567890/',
    shopName: 'Apple認定リセラー楽天店',
    shopCode: 'apple',
    specRank: 'B',
    friendlySpec: '中スペック - 日常使いから開発まで余裕',
    isAvailable: true,
    reviewScore: 4.8,
    reviewCount: 512,
    lastSyncedAt: Date.now(),
  },
]

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
 * APIキーが設定されているかチェック
 */
export function isApiConfigured(): boolean {
  // 新しい認証方式（accessKey）または旧方式（applicationId）をチェック
  return !!(RAKUTEN_CONFIG.accessToken || RAKUTEN_CONFIG.applicationId)
}

/**
 * 楽天商品検索APIを実行
 * CORS回避のため、自前のAPI Routeを経由する
 *
 * @param params 検索パラメータ
 * @returns 検索結果
 * @throws ネットワークエラー、APIエラー
 */
export async function searchRakutenItems(
  params: RakutenSearchParams
): Promise<RakutenSearchResponse> {
  // API Routeを経由してリクエスト（CORS回避）
  const apiUrl = new URL('/api/rakuten', window.location.origin)

  // パラメータを設定
  apiUrl.searchParams.set('keyword', params.keyword)
  if (params.minPrice !== undefined) {
    apiUrl.searchParams.set('minPrice', params.minPrice.toString())
  }
  if (params.maxPrice !== undefined) {
    apiUrl.searchParams.set('maxPrice', params.maxPrice.toString())
  }
  if (params.hits !== undefined) {
    apiUrl.searchParams.set('hits', params.hits.toString())
  }

  console.log('[楽天API] リクエスト:', apiUrl.toString())

  const response = await fetch(apiUrl.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    // エラー詳細を取得
    let errorDetail = ''
    try {
      const errorData = await response.json()
      errorDetail = errorData.error || JSON.stringify(errorData)
      console.error('[楽天API] エラー詳細:', errorData)
    } catch {
      errorDetail = await response.text()
    }
    throw new Error(`楽天API エラー: ${response.status} - ${errorDetail}`)
  }

  const data = await response.json()

  // APIエラーチェック
  if (data.error) {
    throw new Error(`楽天API エラー: ${data.error}`)
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
  isDemo: boolean
}> {
  // API Routeを経由してリクエスト（CORS回避）
  const response = await searchRakutenItems(params)

  const items = response.Items?.map(item =>
    normalizeRakutenItem(item.Item, specRank)
  ) ?? []

  return {
    items,
    total: response.count,
    isDemo: false,
  }
}
