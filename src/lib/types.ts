// ============================================
// 基本型定義
// ============================================

/**
 * APIプロバイダー種別
 * 将来的にAmazon等を追加可能
 */
export type ApiProvider = 'rakuten' | 'valuecommerce' | 'amazon'

/**
 * スペックランク
 * A: 高スペック（動画編集・ゲーム）
 * B: 中スペック（プログラミング）
 * C: エントリー（レポート・調べ物）
 */
export type SpecRank = 'A' | 'B' | 'C'

// ============================================
// 商品関連型
// ============================================

/**
 * 正規化された商品データ
 * 設計書 §5 に基づく
 *
 * 【重要】検索キーワード戦略により、parsedSpecフィールドは不要
 * キーワードがスペックを暗黙的に保証する
 */
export interface NormalizedProduct {
  // 基本情報
  provider: ApiProvider
  externalId: string      // 各プロバイダー固有の商品ID
  name: string            // 商品名
  price: number           // 価格（円）
  imageUrl: string        // 商品画像URL
  affiliateUrl: string    // アフィリエイトリンク

  // ショップ情報
  shopName: string
  shopCode?: string       // 楽天: ショップ絞り込み用
  shopUrl?: string

  // スペック情報（キーワードから推定）
  specRank: SpecRank
  friendlySpec: string    // 初心者向け説明文

  // 在庫・評価
  isAvailable: boolean
  reviewScore?: number    // 0-5の評価
  reviewCount?: number    // レビュー件数

  // メタ情報
  lastSyncedAt: number    // 最終同期日時（Unix timestamp）

  // バリューコマース用
  pvImgTag?: string       // PVカウント用タグ（表示必須）
}

// ============================================
// 診断質問関連型
// ============================================

/**
 * 質問ID
 * Q1〜Q6の識別子
 */
export type QuestionId = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Q5' | 'Q6'

/**
 * 質問の選択肢
 */
export interface QuestionOption {
  id: string              // 選択肢ID（例: 'report', 'programming'）
  label: string           // 表示テキスト
  keyword?: string        // 検索キーワード（設計書 §4.2 マッピング）
  priceRange?: {          // 価格帯（Q4用）
    min: number
    max: number
  }
}

/**
 * 質問定義
 */
export interface Question {
  id: QuestionId
  title: string           // 質問タイトル
  description: string     // 補足説明
  options: QuestionOption[]
  required: boolean       // 必須回答かどうか
  multiSelect?: boolean   // 複数選択可能かどうか
}

/**
 * ユーザーの回答
 * Q1は複数選択可能なのでstring[]
 * その他は単一選択なのでstring
 */
export type DiagnoseAnswers = {
  Q1?: string[]           // 複数選択可能
} & Partial<Omit<Record<QuestionId, string>, 'Q1'>>

/**
 * 検索クエリ構築結果
 */
export interface SearchQuery {
  keyword: string         // 結合された検索キーワード
  minPrice?: number       // 価格下限
  maxPrice?: number       // 価格上限
  specRank: SpecRank      // 推定スペックランク
}

// ============================================
// API レスポンス型
// ============================================

/**
 * 楽天API商品アイテム
 * https://webservice.rakuten.co.jp/api/ichibaitemsearch/
 */
export interface RakutenItem {
  itemCode: string
  itemName: string
  itemPrice: number
  itemUrl: string
  affiliateUrl?: string
  mediumImageUrls?: string[]
  shopName: string
  shopCode: string
  shopUrl?: string
  availability: number    // 1: 在庫あり
  reviewAverage?: number
  reviewCount?: number
}

/**
 * 楽天API レスポンス
 */
export interface RakutenSearchResponse {
  count: number
  page: number
  first: number
  last: number
  hits: number
  carrier: number
  pageCount: number
  Items: { Item: RakutenItem }[]
}

/**
 * バリューコマースAPI商品アイテム
 */
export interface ValueCommerceItem {
  guid: string
  title: string
  link: string            // アフィリエイトURL
  description?: string
  price: number
  images?: {
    large?: { url: string }
    medium?: { url: string }
    small?: { url: string }
  }
  merchantName: string
  stock?: string          // '0' = 在庫切れ
  pvImg?: string          // PVカウント用タグ
}

// ============================================
// 提案結果型
// ============================================

/**
 * 提案枠の種類
 */
export type RecommendationSlot = 'best' | 'value' | 'upgrade'

/**
 * 提案結果
 */
export interface Recommendation {
  slot: RecommendationSlot
  label: string           // 表示名（「ベスト」「コスパ」「1ランク上」）
  product: NormalizedProduct | null
}

/**
 * 診断結果全体
 */
export interface DiagnoseResult {
  answers: DiagnoseAnswers
  searchQuery: SearchQuery
  recommendations: Recommendation[]
  searchedAt: number
}
