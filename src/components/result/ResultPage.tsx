'use client'

import { useEffect, useState, useCallback } from 'react'
import ProductCard from './ProductCard'
import type { DiagnoseAnswers, NormalizedProduct, Recommendation, SearchQuery } from '@/lib/types'
import { buildSearchQuery, buildUpgradeSearchQuery } from '@/lib/diagnose'
import { searchAndNormalize, selectRecommendations } from '@/lib/api'

interface ResultPageProps {
  answers: DiagnoseAnswers
  onRestart: () => void
}

interface ResultState {
  isLoading: boolean
  error: string | null
  searchQuery: SearchQuery | null
  recommendations: Recommendation[]
}

export default function ResultPage({ answers, onRestart }: ResultPageProps) {
  const [state, setState] = useState<ResultState>({
    isLoading: true,
    error: null,
    searchQuery: null,
    recommendations: [],
  })

  const fetchRecommendations = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      // メイン検索クエリを構築
      const mainQuery = buildSearchQuery(answers)
      const budget = mainQuery.minPrice && mainQuery.maxPrice
        ? { min: mainQuery.minPrice, max: mainQuery.maxPrice }
        : undefined

      // メイン検索実行
      const mainResult = await searchAndNormalize(
        {
          keyword: mainQuery.keyword,
          minPrice: mainQuery.minPrice,
          maxPrice: mainQuery.maxPrice,
          hits: 30,
        },
        mainQuery.specRank
      )

      // ベスト・コスパを選出
      const { best, value } = selectRecommendations(
        mainResult.items.map(p => ({
          itemCode: p.externalId,
          itemName: p.name,
          itemPrice: p.price,
          itemUrl: p.affiliateUrl,
          affiliateUrl: p.affiliateUrl,
          mediumImageUrls: [p.imageUrl],
          shopName: p.shopName,
          shopCode: p.shopCode || '',
          availability: p.isAvailable ? 1 : 0,
          reviewAverage: p.reviewScore,
          reviewCount: p.reviewCount,
        })),
        mainQuery.specRank,
        budget
      )

      // ③ 1ランク上を検索
      const upgradeQuery = buildUpgradeSearchQuery(answers)
      const upgradeResult = await searchAndNormalize(
        {
          keyword: upgradeQuery.keyword,
          minPrice: upgradeQuery.minPrice,
          hits: 10,
        },
        upgradeQuery.specRank
      )

      // アップグレード版のベストを選出
      const upgradeProduct = upgradeResult.items[0] || null

      setState({
        isLoading: false,
        error: null,
        searchQuery: mainQuery,
        recommendations: [
          { slot: 'best', label: 'ベストチョイス', product: best },
          { slot: 'value', label: 'コスパ重視', product: value },
          { slot: 'upgrade', label: '1ランク上', product: upgradeProduct },
        ],
      })
    } catch (err) {
      console.error('検索エラー:', err)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : '検索中にエラーが発生しました',
      }))
    }
  }, [answers])

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  // ローディング状態
  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            最適なPCを探しています...
          </h2>
          <p className="text-gray-600">
            あなたの条件に合わせて検索中です
          </p>
        </div>
      </div>
    )
  }

  // エラー状態
  if (state.error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            エラーが発生しました
          </h2>
          <p className="text-gray-600 mb-6">{state.error}</p>
          <div className="space-x-4">
            <button
              onClick={fetchRecommendations}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              再試行
            </button>
            <button
              onClick={onRestart}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              最初からやり直す
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            あなたへのおすすめPC
          </h1>
          <p className="mt-2 text-gray-600">
            診断結果に基づいた3つの提案です
          </p>

          {/* 検索条件 */}
          {state.searchQuery && (
            <div className="mt-4 inline-block bg-white rounded-lg px-4 py-2 text-sm text-gray-600 shadow">
              検索条件: {state.searchQuery.keyword}
              {state.searchQuery.minPrice && (
                <span className="ml-2">
                  / 予算: {state.searchQuery.minPrice / 10000}〜{state.searchQuery.maxPrice! / 10000}万円
                </span>
              )}
            </div>
          )}
        </div>

        {/* 提案カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {state.recommendations.map(rec => (
            <div key={rec.slot}>
              {rec.product ? (
                <ProductCard product={rec.product} slot={rec.slot} />
              ) : (
                <div className="bg-gray-100 rounded-2xl p-6 text-center text-gray-500">
                  <p>条件に合う商品が見つかりませんでした</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* フッターアクション */}
        <div className="text-center">
          <button
            onClick={onRestart}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            もう一度診断する
          </button>
        </div>
      </div>
    </div>
  )
}
