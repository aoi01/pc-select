import type { DiagnoseAnswers, SearchQuery, SpecRank, QuestionId } from '../types'
import { questions } from './questions'

/**
 * Q1の回答からスペックランクを判定
 * 設計書 §4.2 の用途→キーワード対応に基づく
 */
function getSpecRankFromQ1(q1Answer: string): SpecRank {
  switch (q1Answer) {
    case 'report':
      return 'C'  // エントリー
    case 'programming':
      return 'B'  // 中スペック
    case 'video3d':
    case 'gaming':
      return 'A'  // 高スペック
    default:
      return 'C'  // デフォルト
  }
}

/**
 * スペックランクから初心者向け説明文を生成
 */
export function generateFriendlySpec(rank: SpecRank): string {
  switch (rank) {
    case 'A':
      return '高スペック - 重い作業もサクサク快適'
    case 'B':
      return '中スペック - 日常使いから開発まで余裕'
    case 'C':
      return 'エントリー - 文書作成・Web閲覧に最適'
    default:
      return ''
  }
}

/**
 * 「1ランク上」のスペックランクを取得
 * 設計書 §4.4 の③提案枠用
 */
export function getUpgradeSpecRank(currentRank: SpecRank): SpecRank {
  switch (currentRank) {
    case 'C':
      return 'B'
    case 'B':
      return 'A'
    case 'A':
      return 'A'  // 最上位なのでそのまま
    default:
      return 'A'
  }
}

/**
 * スペックランクからQ1のキーワードを取得
 */
function getKeywordForSpecRank(rank: SpecRank): string {
  switch (rank) {
    case 'C':
      return 'Core i5 8GB SSD'
    case 'B':
      return 'Core i5 16GB SSD 512GB'
    case 'A':
      return 'Core i7 32GB SSD 1TB'
    default:
      return 'Core i5 8GB SSD'
  }
}

/**
 * キーワードのフォールバック優先度
 * 検索結果が少ない場合、この順序でキーワードを削減する
 * 設計書 §4.3 TIP参照
 *
 * 削減優先度: サイズ > 携帯性 > 状態 > バッテリー
 * （スペック系キーワードは最後まで残す）
 */
const FALLBACK_PRIORITY: QuestionId[] = ['Q5', 'Q3', 'Q6', 'Q2']

/**
 * 回答から検索クエリを構築
 * 設計書 §4.1, §4.2, §4.3 に基づく
 *
 * @param answers ユーザーの回答
 * @param reduceLevel フォールバックレベル（0=削減なし, 1+=削減増加）
 */
export function buildSearchQuery(
  answers: DiagnoseAnswers,
  reduceLevel: number = 0
): SearchQuery {
  const keywords: string[] = ['ノートパソコン']  // ベースキーワード
  let minPrice: number | undefined
  let maxPrice: number | undefined
  let specRank: SpecRank = 'C'

  // Q1の回答からスペックランクを決定
  if (answers.Q1) {
    specRank = getSpecRankFromQ1(answers.Q1)
  }

  // スペック系キーワード（Q1）はフォールバックの影響を受けない
  const q1Question = questions.find(q => q.id === 'Q1')
  const q1Option = q1Question?.options.find(o => o.id === answers.Q1)
  if (q1Option?.keyword) {
    keywords.push(q1Option.keyword)
  }

  // 各質問のキーワードを収集（フォールバック考慮）
  const questionsToSkip = new Set(FALLBACK_PRIORITY.slice(0, reduceLevel))

  for (const question of questions) {
    // Q1は既に処理済み
    if (question.id === 'Q1') continue

    // フォールバックでスキップする質問
    if (questionsToSkip.has(question.id)) continue

    const answerId = answers[question.id]
    if (!answerId) continue

    const option = question.options.find(o => o.id === answerId)
    if (!option) continue

    // キーワードを追加
    if (option.keyword) {
      keywords.push(option.keyword)
    }

    // 価格帯を設定（Q4）
    if (option.priceRange) {
      minPrice = option.priceRange.min
      maxPrice = option.priceRange.max
    }
  }

  return {
    keyword: keywords.join(' '),
    minPrice,
    maxPrice,
    specRank,
  }
}

/**
 * アップグレード用の検索クエリを構築
 * 設計書 §4.4 ③「1ランク上」の提案枠用
 */
export function buildUpgradeSearchQuery(answers: DiagnoseAnswers): SearchQuery {
  const baseQuery = buildSearchQuery(answers, 0)
  const upgradeRank = getUpgradeSpecRank(baseQuery.specRank)
  const upgradeKeyword = getKeywordForSpecRank(upgradeRank)

  // Q1のキーワードをアップグレード版に置換
  const keywordParts = baseQuery.keyword.split(' ')
  const baseKeyword = getKeywordForSpecRank(baseQuery.specRank)
  const keywordIndex = keywordParts.findIndex(part => baseKeyword.includes(part))

  if (keywordIndex !== -1) {
    // 元のスペックキーワードを削除してアップグレード版を追加
    const baseParts = baseKeyword.split(' ')
    const upgradeParts = upgradeKeyword.split(' ')

    // 元のスペック系単語を削除
    const filteredParts = keywordParts.filter(
      part => !baseParts.some(bp => part.includes(bp))
    )

    return {
      keyword: [...filteredParts.slice(0, 1), upgradeKeyword, ...filteredParts.slice(1)].join(' '),
      minPrice: baseQuery.minPrice,
      maxPrice: undefined,  // アップグレード版は上限を緩和
      specRank: upgradeRank,
    }
  }

  return {
    ...baseQuery,
    keyword: `${baseQuery.keyword} ${upgradeKeyword}`,
    specRank: upgradeRank,
  }
}

/**
 * 検索結果の件数に基づいてフォールバックレベルを決定
 * @param hitCount 検索結果の件数
 * @returns 推奨フォールバックレベル
 */
export function determineFallbackLevel(hitCount: number): number {
  if (hitCount === 0) return 4   // 全削減
  if (hitCount < 3) return 3     // Q2, Q6, Q3, Q5 削減
  if (hitCount < 5) return 2     // Q6, Q3, Q5 削減
  if (hitCount < 10) return 1    // Q5 削減
  return 0                        // 削減なし
}
