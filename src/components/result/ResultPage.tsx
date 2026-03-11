'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ProductCard from './ProductCard'
import type { DiagnoseAnswers, NormalizedProduct, Recommendation, SearchQuery } from '@/lib/types'
import { buildSearchQuery, buildUpgradeSearchQuery } from '@/lib/diagnose'
import { searchAndNormalize, selectRecommendations } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BlurText } from '@/components/reactbits'
import { useTheme } from '@/components/ThemeProvider'
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
  HiOutlineSun,
  HiOutlineMoon,
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

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' as const },
  },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
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
  const { theme, toggleTheme } = useTheme()

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

      // rawItemsを直接渡してスペック解析スコアリングを活用
      const { best, value } = selectRecommendations(
        mainResult.rawItems,
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

      // upgradeもスコアリングで最良の1台を選出
      const upgradeSelection = selectRecommendations(
        upgradeResult.rawItems,
        upgradeQuery.specRank
      )
      const upgradeProduct = upgradeSelection.best || upgradeResult.items[0] || null

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
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <motion.div
          className="text-center z-10"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Simple spinner */}
          <motion.div
            className="relative w-16 h-16 mx-auto mb-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-500" />
            <div className="absolute inset-0 flex items-center justify-center">
              <HiOutlineSearch className="w-6 h-6 text-cyan-400" />
            </div>
          </motion.div>

          <motion.h2
            variants={fadeInUp}
            className="text-xl font-bold text-foreground mb-2"
          >
            最適なPCを探しています...
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-foreground/30 mb-8 text-sm"
          >
            あなたの条件に合わせて検索中です
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="flex justify-center gap-2 flex-wrap"
          >
            {['スペック分析中', '価格比較中', 'レビュー確認中'].map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.15 + 0.2, duration: 0.2 }}
              >
                <Badge className="px-3 py-1.5 bg-foreground/5 border border-foreground/10 text-foreground/50 text-xs font-medium">
                  <RiLoader4Line className="w-3 h-3 mr-1.5 animate-spin" />
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
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="max-w-md w-full"
        >
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <HiOutlineExclamationCircle className="w-8 h-8 text-red-400" />
            </div>

            <h2 className="text-lg font-bold text-foreground mb-2">
              エラーが発生しました
            </h2>
            <p className="text-foreground/40 text-sm mb-6">
              {state.error}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={fetchRecommendations}
                className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0"
              >
                <HiOutlineRefresh className="w-4 h-4" />
                再試行
              </Button>
              <Button
                variant="outline"
                onClick={onRestart}
                className="gap-2 border-foreground/10 text-foreground/60 hover:bg-foreground/5"
              >
                <HiOutlineReply className="w-4 h-4" />
                最初からやり直す
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  const validRecommendations = state.recommendations.filter(r => r.product)

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Header */}
      <motion.div
        className="sticky top-0 z-50 glass"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center"
                style={{ boxShadow: '0 0 20px rgba(0,212,255,0.2)' }}
              >
                <HiOutlineDesktopComputer className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg gradient-text">
                診断結果
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-foreground/50 hover:text-foreground/80 hover:bg-foreground/5 transition-colors"
                aria-label="テーマ切替"
              >
                {theme === 'dark' ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
              </button>
              <Button
                variant="ghost"
                onClick={onRestart}
                className="gap-2 text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5"
              >
                <HiOutlineReply className="w-4 h-4" />
                やり直す
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Success header */}
        <motion.div
          className="text-center mb-10"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp}>
            <Badge className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-5">
              <HiOutlineCheckCircle className="w-4 h-4" />
              <span className="font-semibold text-xs">診断完了</span>
            </Badge>
          </motion.div>

          <BlurText
            text="あなたへのおすすめPC"
            delay={100}
            animateBy="characters"
            direction="bottom"
            className="text-3xl md:text-4xl font-bold text-foreground justify-center mb-3"
          />

          <motion.p
            variants={fadeInUp}
            className="text-foreground/30 text-sm max-w-lg mx-auto"
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
                className="mt-5"
              >
                <Badge className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
                  <HiOutlineExclamationCircle className="w-4 h-4" />
                  デモモード: サンプル商品を表示中
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search conditions */}
          {state.searchQuery && (
            <motion.div variants={fadeInUp} className="mt-6">
              <div className="inline-flex glass-card rounded-xl py-3 px-5">
                <div className="flex items-center gap-3 text-sm flex-wrap">
                  <div className="flex items-center gap-2 text-foreground/30">
                    <HiOutlineFilter className="w-4 h-4" />
                    <span className="text-xs">検索条件</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {state.searchQuery.keyword.split(' ').map((word, i) => (
                      <Badge
                        key={i}
                        className="font-normal text-xs bg-cyan-500/10 border border-cyan-500/15 text-cyan-400/70"
                      >
                        {word}
                      </Badge>
                    ))}
                    {state.searchQuery.minPrice && (
                      <Badge className="font-normal text-xs bg-emerald-500/10 border border-emerald-500/15 text-emerald-400/70">
                        {state.searchQuery.minPrice / 10000}〜{state.searchQuery.maxPrice! / 10000}万円
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Recommendation cards */}
        {validRecommendations.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
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
                  <motion.div variants={fadeInUp}>
                    <div className="h-full flex items-center justify-center p-8 rounded-2xl border border-dashed border-foreground/10 bg-foreground/[0.02]">
                      <div className="text-center text-foreground/20">
                        <HiOutlineExclamationCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">条件に合う商品が見つかりませんでした</p>
                      </div>
                    </div>
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
            <div className="max-w-md mx-auto text-center p-8 glass-card rounded-2xl">
              <HiOutlineExclamationCircle className="w-12 h-12 mx-auto mb-4 text-foreground/15" />
              <h3 className="text-lg font-bold text-foreground mb-2">商品が見つかりませんでした</h3>
              <p className="text-foreground/30 text-sm mb-5">条件を変更して再度お試しください</p>
              <Button
                onClick={onRestart}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0"
              >
                診断をやり直す
              </Button>
            </div>
          </motion.div>
        )}

        {/* Footer actions */}
        <div className="mt-14 text-center animate-fade-in">
          <div className="inline-flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={onRestart}
              className="gap-2 border-foreground/10 text-foreground/50 hover:text-foreground/70 hover:bg-foreground/5"
            >
              <HiOutlineRefresh className="w-4 h-4" />
              もう一度診断する
            </Button>
            <Button
              size="lg"
              className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 shadow-lg shadow-cyan-500/20"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <HiOutlineSparkles className="w-4 h-4" />
              結果を見直す
            </Button>
          </div>
        </div>

        {/* Hint */}
        <div className="mt-10 max-w-2xl mx-auto p-4 rounded-xl bg-foreground/[0.02] border border-foreground/6 animate-fade-in">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <HiOutlineLightBulb className="w-4 h-4 text-cyan-400/70" />
              </div>
            </div>
            <p className="text-sm text-foreground/30 leading-relaxed">
              <span className="text-cyan-400/70 font-medium">Hint:</span>{' '}
              複数の商品を比較検討し、あなたに最適な1台を見つけてください。
              価格やスペックだけでなく、ショップの評判や保証内容も確認することをおすすめします。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
