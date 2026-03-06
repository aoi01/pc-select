import type { Question, QuestionId } from '../types'

/**
 * 診断質問定義
 * 設計書 §4.2 に基づく6つの質問
 */
export const questions: Question[] = [
  {
    id: 'Q1',
    title: '主な使用用途は？',
    description: 'どのような目的でパソコンを使いますか？',
    required: true,
    options: [
      {
        id: 'report',
        label: '大学のレポート・調べ物',
        keyword: 'Core i5 8GB SSD',
        // specRank: C（エントリー）は keywordMapper で判定
      },
      {
        id: 'programming',
        label: 'プログラミング',
        keyword: 'Core i5 16GB SSD 512GB',
      },
      {
        id: 'video3d',
        label: '動画編集・3D',
        keyword: 'Core i7 32GB SSD 1TB',
      },
      {
        id: 'gaming',
        label: 'ゲーム',
        keyword: 'ゲーミング RTX 16GB',
      },
    ],
  },
  {
    id: 'Q2',
    title: '1日の使用時間は？',
    description: 'どのくらい長時間使いますか？',
    required: true,
    options: [
      {
        id: 'short',
        label: '1コマ程度（〜2時間）',
        // キーワードなし
      },
      {
        id: 'medium',
        label: '2コマ（〜4時間）',
        // キーワードなし
      },
      {
        id: 'long',
        label: '半日以上（〜8時間）',
        keyword: 'バッテリー良好',
      },
      {
        id: 'allday',
        label: 'ほぼ一日中',
        keyword: 'バッテリー良好',
      },
    ],
  },
  {
    id: 'Q3',
    title: '持ち運び頻度は？',
    description: '外出先に持っていくことはありますか？',
    required: true,
    options: [
      {
        id: 'daily',
        label: '毎日通学に持っていく',
        keyword: '軽量',
      },
      {
        id: 'weekly',
        label: '週数回',
        // キーワードなし
      },
      {
        id: 'home',
        label: 'ほぼ自宅のみ',
        // キーワードなし
      },
    ],
  },
  {
    id: 'Q4',
    title: '予算は？',
    description: 'いくらくらいの予算を考えていますか？',
    required: true,
    options: [
      {
        id: 'budget1',
        label: '5〜10万円',
        priceRange: { min: 50000, max: 100000 },
      },
      {
        id: 'budget2',
        label: '10〜15万円',
        priceRange: { min: 100000, max: 150000 },
      },
      {
        id: 'budget3',
        label: '15〜20万円',
        priceRange: { min: 150000, max: 200000 },
      },
    ],
  },
  {
    id: 'Q5',
    title: '画面サイズの希望は？',
    description: 'コンパクトさと見やすさ、どちらを優先しますか？',
    required: false,
    options: [
      {
        id: 'compact',
        label: 'コンパクト（12インチ）',
        keyword: '12インチ',
      },
      {
        id: 'standard',
        label: '標準（13〜14インチ）',
        keyword: '14インチ',
      },
      {
        id: 'any',
        label: 'こだわらない',
        // キーワードなし
      },
    ],
  },
  {
    id: 'Q6',
    title: '中古・新品の希望は？',
    description: '中古品でも構いませんか？',
    required: false,
    options: [
      {
        id: 'used',
        label: '中古でもOK',
        keyword: '中古',
      },
      {
        id: 'new',
        label: '新品が良い',
        keyword: '新品',
      },
      {
        id: 'any',
        label: 'こだわらない',
        // キーワードなし = 中古・新品両方を検索
      },
    ],
  },
]

/**
 * 質問IDから質問を取得
 */
export function getQuestionById(id: QuestionId): Question | undefined {
  return questions.find(q => q.id === id)
}

/**
 * 全質問のIDリスト
 */
export const questionIds: QuestionId[] = questions.map(q => q.id)
