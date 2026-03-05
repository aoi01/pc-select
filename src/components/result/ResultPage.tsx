'use client'

import { useEffect, useState, useCallback } from 'react'
import ProductCard from './ProductCard'
import type { DiagnoseAnswers, NormalizedProduct, Recommendation, SearchQuery } from '@/lib/types'
import { buildSearchQuery, buildUpgradeSearchQuery } from '@/lib/diagnose'
import { searchAndNormalize, selectRecommendations, isApiConfigured } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  RefreshCw,
  RotateCcw,
  AlertCircle,
  Monitor,
  Sparkles,
  CheckCircle2,
  Search,
  Filter
} from 'lucide-react'

interface ResultPageProps {
  answers: DiagnoseAnswers
  onRestart: () => void
}

interface ResultState {
  isLoading: boolean
  error: string | null
  searchQuery: SearchQuery | null
  recommendations: Recommendation[]
  isDemo: boolean
}

export default function ResultPage({ answers, onRestart }: ResultPageProps) {
  const [state, setState] = useState<ResultState>({
    isLoading: true,
    error: null,
    searchQuery: null,
    recommendations: [],
    isDemo: false,
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
        isDemo: mainResult.isDemo,
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <Search className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse-soft" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            最適なPCを探しています...
          </h2>
          <p className="text-gray-600">
            あなたの条件に合わせて検索中です
          </p>
          <div className="mt-6 flex justify-center gap-2">
            {['スペック分析中', '価格比較中', 'レビュー確認中'].map((step, i) => (
              <Badge
                key={step}
                variant="secondary"
                className="animate-pulse"
                style={{ animationDelay: `${i * 300}ms` }}
              >
                {step}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // エラー状態
  if (state.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full border-red-200 bg-red-50/50 animate-scale-in">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              エラーが発生しました
            </h2>
            <p className="text-gray-600 mb-6">{state.error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={fetchRecommendations} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                再試行
              </Button>
              <Button variant="outline" onClick={onRestart} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                最初からやり直す
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const validRecommendations = state.recommendations.filter(r => r.product)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* ヘッダー */}
      <div className="sticky top-0 z-50 glass border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="w-6 h-6 text-primary" />
              <span className="font-bold text-lg">診断結果</span>
            </div>
            <Button variant="ghost" onClick={onRestart} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              やり直す
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 成功ヘッダー */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 mb-4">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">診断完了</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            あなたへのおすすめPC
          </h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            診断結果に基づいて、{validRecommendations.length}つの提案をご用意しました
          </p>

          {/* デモモード警告 */}
          {state.isDemo && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              デモモード: サンプル商品を表示中
            </div>
          )}

          {/* 検索条件 */}
          {state.searchQuery && (
            <Card className="mt-6 inline-flex bg-white/60 border-gray-200">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Filter className="w-4 h-4" />
                    <span>検索条件:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {state.searchQuery.keyword.split(' ').map((word, i) => (
                      <Badge key={i} variant="secondary" className="font-normal">
                        {word}
                      </Badge>
                    ))}
                    {state.searchQuery.minPrice && (
                      <Badge variant="outline" className="font-normal">
                        予算: {state.searchQuery.minPrice / 10000}〜{state.searchQuery.maxPrice! / 10000}万円
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 提案カード */}
        {validRecommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {state.recommendations.map((rec, index) => (
              <div key={rec.slot}>
                {rec.product ? (
                  <ProductCard
                    product={rec.product}
                    slot={rec.slot}
                    index={index}
                  />
                ) : (
                  <Card className="h-full flex items-center justify-center p-8 border-dashed border-2 border-gray-200">
                    <div className="text-center text-gray-400">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>条件に合う商品が見つかりませんでした</p>
                    </div>
                  </Card>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Card className="max-w-md mx-auto text-center p-8">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-bold mb-2">商品が見つかりませんでした</h3>
            <p className="text-gray-600 mb-4">
              条件を変更して再度お試しください
            </p>
            <Button onClick={onRestart}>診断をやり直す</Button>
          </Card>
        )}

        {/* フッターアクション */}
        <div className="mt-12 text-center">
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={onRestart}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              もう一度診断する
            </Button>
            <Button
              size="lg"
              className="gap-2"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <Sparkles className="w-4 h-4" />
              結果を見直す
            </Button>
          </div>
        </div>

        {/* ヒント */}
        <div className="mt-8 max-w-2xl mx-auto p-4 rounded-xl bg-blue-50 border border-blue-100">
          <p className="text-sm text-blue-700">
            💡 <strong>ヒント:</strong> 複数の商品を比較検討し、あなたに最適な1台を見つけてください。
            価格やスペックだけでなく、ショップの評判や保証内容も確認することをおすすめします。
          </p>
        </div>
      </div>
    </div>
  )
}
