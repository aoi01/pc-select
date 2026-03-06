'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ProductCard from './ProductCard'
import type { DiagnoseAnswers, NormalizedProduct, Recommendation, SearchQuery } from '@/lib/types'
import { buildSearchQuery, buildUpgradeSearchQuery } from '@/lib/diagnose'
import { searchAndNormalize, selectRecommendations } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  HiOutlineRefresh,
  HiOutlineReply,
  HiOutlineExclamationCircle,
  HiOutlineDesktopComputer,
  HiOutlineSparkles,
  HiOutlineCheckCircle,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineLightBulb,
} from 'react-icons/hi'
import { RiLoader4Line } from 'react-icons/ri'

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

// Loading animation variants
const loadingContainerVariants = {
  animate: {
    transition: {
      staggerChildren: 0.2,
    },
  },
}

const loadingDotVariants = {
  initial: { y: 0 },
  animate: {
    y: [-10, 0, -10],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

const fadeInUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
}

const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
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

      const mainQuery = buildSearchQuery(answers)
      const budget = mainQuery.minPrice && mainQuery.maxPrice
        ? { min: mainQuery.minPrice, max: mainQuery.maxPrice }
        : undefined

      const mainResult = await searchAndNormalize(
        {
          keyword: mainQuery.keyword,
          minPrice: mainQuery.minPrice,
          maxPrice: mainQuery.maxPrice,
          hits: 30,
        },
        mainQuery.specRank
      )

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

  // Loading state
  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-mesh flex items-center justify-center relative overflow-hidden">
        {/* Animated background blobs */}
        <motion.div
          className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-violet-300/40 to-fuchsia-300/40 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-gradient-to-br from-cyan-300/40 to-blue-300/40 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          className="text-center z-10"
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Animated search icon */}
          <motion.div
            className="relative w-28 h-28 mx-auto mb-8"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <div className="absolute inset-0 rounded-full border-4 border-violet-200" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-500" />
            <div className="absolute inset-4 rounded-full border-4 border-fuchsia-200" />
            <div className="absolute inset-4 rounded-full border-4 border-transparent border-b-fuchsia-500" />
            <motion.div
              className="absolute inset-0 m-auto w-10 h-10 text-violet-500"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <HiOutlineSearch className="w-full h-full" />
            </motion.div>
          </motion.div>

          <motion.h2
            variants={fadeInUpVariants}
            className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3"
          >
            最適なPCを探しています...
          </motion.h2>
          <motion.p
            variants={fadeInUpVariants}
            className="text-gray-500 mb-8"
          >
            あなたの条件に合わせて検索中です
          </motion.p>

          {/* Loading steps */}
          <motion.div
            variants={fadeInUpVariants}
            className="flex justify-center gap-3 flex-wrap"
          >
            {['スペック分析中', '価格比較中', 'レビュー確認中'].map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.2 + 0.3 }}
              >
                <Badge
                  variant="secondary"
                  className="px-4 py-2 bg-white/80 backdrop-blur border border-violet-100 text-violet-700 font-medium"
                >
                  <RiLoader4Line className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  {step}
                </Badge>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // Error state
  if (state.error) {
    return (
      <div className="min-h-screen bg-gradient-mesh flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Card className="max-w-md w-full border-red-200 bg-white/80 backdrop-blur shadow-xl">
            <CardContent className="pt-8 pb-6 text-center">
              <motion.div
                className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
              >
                <HiOutlineExclamationCircle className="w-10 h-10 text-red-500" />
              </motion.div>

              <motion.h2
                className="text-xl font-bold text-gray-800 mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                エラーが発生しました
              </motion.h2>

              <motion.p
                className="text-gray-500 mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {state.error}
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-3 justify-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  onClick={fetchRecommendations}
                  className="gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
                >
                  <HiOutlineRefresh className="w-4 h-4" />
                  再試行
                </Button>
                <Button variant="outline" onClick={onRestart} className="gap-2">
                  <HiOutlineReply className="w-4 h-4" />
                  最初からやり直す
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  const validRecommendations = state.recommendations.filter(r => r.product)

  return (
    <div className="min-h-screen bg-gradient-mesh relative overflow-hidden">
      {/* Background decorations */}
      <motion.div
        className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-violet-200/50 to-fuchsia-200/50 rounded-full blur-3xl"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-20 left-10 w-64 h-64 bg-gradient-to-br from-cyan-200/50 to-blue-200/50 rounded-full blur-3xl"
        animate={{ scale: [1.1, 1, 1.1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Header */}
      <motion.div
        className="sticky top-0 z-50 glass border-b border-white/20"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <HiOutlineDesktopComputer className="w-5 h-5 text-white" />
              </motion.div>
              <span className="font-bold text-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                診断結果
              </span>
            </div>
            <Button
              variant="ghost"
              onClick={onRestart}
              className="gap-2 hover:bg-white/50"
            >
              <HiOutlineReply className="w-4 h-4" />
              やり直す
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Success header */}
        <motion.div
          className="text-center mb-10"
          initial="hidden"
          animate="visible"
          variants={staggerContainerVariants}
        >
          <motion.div
            variants={fadeInUpVariants}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 mb-5 shadow-sm"
          >
            <HiOutlineCheckCircle className="w-5 h-5" />
            <span className="font-semibold">診断完了</span>
          </motion.div>

          <motion.h1
            variants={fadeInUpVariants}
            className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-clip-text text-transparent mb-3"
          >
            あなたへのおすすめPC
          </motion.h1>

          <motion.p
            variants={fadeInUpVariants}
            className="text-gray-500 max-w-lg mx-auto"
          >
            診断結果に基づいて、{validRecommendations.length}つの提案をご用意しました
          </motion.p>

          {/* Demo mode warning */}
          <AnimatePresence>
            {state.isDemo && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-700 text-sm shadow-sm"
              >
                <HiOutlineExclamationCircle className="w-4 h-4" />
                デモモード: サンプル商品を表示中
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search conditions */}
          {state.searchQuery && (
            <motion.div
              variants={fadeInUpVariants}
              className="mt-6"
            >
              <Card className="inline-flex bg-white/70 backdrop-blur border-gray-200/50 shadow-sm">
                <CardContent className="py-3.5 px-5">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <HiOutlineFilter className="w-4 h-4" />
                      <span>検索条件:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {state.searchQuery.keyword.split(' ').map((word, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="font-normal bg-violet-50 text-violet-700 border border-violet-100"
                        >
                          {word}
                        </Badge>
                      ))}
                      {state.searchQuery.minPrice && (
                        <Badge
                          variant="outline"
                          className="font-normal bg-emerald-50 text-emerald-700 border-emerald-200"
                        >
                          予算: {state.searchQuery.minPrice / 10000}〜{state.searchQuery.maxPrice! / 10000}万円
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>

        {/* Recommendation cards */}
        {validRecommendations.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={staggerContainerVariants}
          >
            {state.recommendations.map((rec, index) => (
              <div key={rec.slot}>
                {rec.product ? (
                  <ProductCard
                    product={rec.product}
                    slot={rec.slot}
                    index={index}
                  />
                ) : (
                  <motion.div
                    variants={fadeInUpVariants}
                  >
                    <Card className="h-full flex items-center justify-center p-8 border-dashed border-2 border-gray-200 bg-white/50">
                      <div className="text-center text-gray-400">
                        <HiOutlineExclamationCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>条件に合う商品が見つかりませんでした</p>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="max-w-md mx-auto text-center p-8 bg-white/70 backdrop-blur shadow-xl">
              <HiOutlineExclamationCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-bold mb-2">商品が見つかりませんでした</h3>
              <p className="text-gray-500 mb-4">
                条件を変更して再度お試しください
              </p>
              <Button
                onClick={onRestart}
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500"
              >
                診断をやり直す
              </Button>
            </Card>
          </motion.div>
        )}

        {/* Footer actions */}
        <motion.div
          className="mt-14 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={onRestart}
              className="gap-2 border-gray-200 hover:bg-white/50"
            >
              <HiOutlineRefresh className="w-4 h-4" />
              もう一度診断する
            </Button>
            <Button
              size="lg"
              className="gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 shadow-lg shadow-violet-500/25"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <HiOutlineSparkles className="w-4 h-4" />
              結果を見直す
            </Button>
          </div>
        </motion.div>

        {/* Hint */}
        <motion.div
          className="mt-10 max-w-2xl mx-auto p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100/50 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <HiOutlineLightBulb className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-blue-700 leading-relaxed">
              <span className="font-semibold">ヒント:</span> 複数の商品を比較検討し、あなたに最適な1台を見つけてください。
              価格やスペックだけでなく、ショップの評判や保証内容も確認することをおすすめします。
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
