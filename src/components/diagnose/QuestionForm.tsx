'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { questions } from '@/lib/diagnose'
import type { DiagnoseAnswers } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  HiOutlineAcademicCap,
  HiOutlineCode,
  HiOutlineFilm,
  HiOutlineDesktopComputer,
  HiOutlineLightningBolt,
  HiOutlineBriefcase,
  HiOutlineHome,
  HiOutlineCurrencyDollar,
  HiOutlineRulerHorizontal,
  HiOutlineCube,
  HiOutlineSparkles,
  HiOutlineCheckCircle,
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
} from 'react-icons/hi'
import {
  RiGamepadLine,
  RiBattery2ChargeLine,
  RiCheckLine,
} from 'react-icons/ri'

interface QuestionFormProps {
  onComplete: (answers: DiagnoseAnswers) => void
}

// アイコンマッピング - React Icons
const questionIcons: Record<string, React.ReactNode> = {
  report: <HiOutlineAcademicCap className="w-5 h-5" />,
  programming: <HiOutlineCode className="w-5 h-5" />,
  video3d: <HiOutlineFilm className="w-5 h-5" />,
  gaming: <RiGamepadLine className="w-5 h-5" />,
  short: <RiBattery2ChargeLine className="w-5 h-5" />,
  medium: <RiBattery2ChargeLine className="w-5 h-5" />,
  long: <RiBattery2ChargeLine className="w-5 h-5" />,
  allday: <RiBattery2ChargeLine className="w-5 h-5" />,
  daily: <HiOutlineBriefcase className="w-5 h-5" />,
  weekly: <HiOutlineBriefcase className="w-5 h-5" />,
  home: <HiOutlineHome className="w-5 h-5" />,
  budget1: <HiOutlineCurrencyDollar className="w-5 h-5" />,
  budget2: <HiOutlineCurrencyDollar className="w-5 h-5" />,
  budget3: <HiOutlineCurrencyDollar className="w-5 h-5" />,
  compact: <HiOutlineRulerHorizontal className="w-5 h-5" />,
  standard: <HiOutlineRulerHorizontal className="w-5 h-5" />,
  any: <HiOutlineDesktopComputer className="w-5 h-5" />,
  used: <HiOutlineCube className="w-5 h-5" />,
  new: <HiOutlineSparkles className="w-5 h-5" />,
}

// Framer Motion variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    x: -50,
    transition: { duration: 0.2 },
  },
}

const progressVariants = {
  initial: { width: 0 },
  animate: (progress: number) => ({
    width: `${progress}%`,
    transition: { duration: 0.5, ease: 'easeOut' },
  }),
}

export default function QuestionForm({ onComplete }: QuestionFormProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<DiagnoseAnswers>({})
  const [direction, setDirection] = useState(0)

  const currentQuestion = questions[currentIndex]
  const totalQuestions = questions.length
  const progress = ((currentIndex + 1) / totalQuestions) * 100
  const isMultiSelect = currentQuestion?.multiSelect ?? false

  // 回答数をカウント
  const answeredCount = Object.entries(answers).reduce((count, [key, value]) => {
    if (key === 'Q1' && Array.isArray(value)) {
      return count + (value.length > 0 ? 1 : 0)
    }
    return count + (value ? 1 : 0)
  }, 0)

  // 複数選択のトグル
  const toggleMultiSelect = useCallback((optionId: string) => {
    setAnswers(prev => {
      const current = prev.Q1 ?? []
      const isSelected = current.includes(optionId)

      return {
        ...prev,
        Q1: isSelected
          ? current.filter(id => id !== optionId)
          : [...current, optionId]
      }
    })
  }, [])

  // 単一選択
  const handleSingleSelect = useCallback((optionId: string) => {
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: optionId,
    }
    setAnswers(newAnswers)

    setTimeout(() => {
      setDirection(1)
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex(prev => prev + 1)
      } else {
        onComplete(newAnswers)
      }
    }, 300)
  }, [currentQuestion, currentIndex, totalQuestions, answers, onComplete])

  // 選択ハンドラ
  const handleSelect = useCallback((optionId: string) => {
    if (isMultiSelect) {
      toggleMultiSelect(optionId)
    } else {
      handleSingleSelect(optionId)
    }
  }, [isMultiSelect, toggleMultiSelect, handleSingleSelect])

  // 次へ進む
  const handleNext = useCallback(() => {
    setDirection(1)
    setTimeout(() => {
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex(prev => prev + 1)
      } else {
        onComplete(answers)
      }
    }, 200)
  }, [currentIndex, totalQuestions, answers, onComplete])

  const handleSkip = useCallback(() => {
    setDirection(1)
    setTimeout(() => {
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex(prev => prev + 1)
      } else {
        onComplete(answers)
      }
    }, 200)
  }, [currentIndex, totalQuestions, answers, onComplete])

  const handleBack = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1)
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1)
      }, 200)
    }
  }, [currentIndex])

  // 選択状態を判定
  const isSelected = (optionId: string): boolean => {
    if (isMultiSelect) {
      return (answers.Q1 ?? []).includes(optionId)
    }
    return answers[currentQuestion.id] === optionId
  }

  const hasSelection = isMultiSelect ? (answers.Q1?.length ?? 0) > 0 : !!answers[currentQuestion.id]

  return (
    <div className="min-h-screen bg-gradient-mesh relative overflow-hidden">
      {/* Decorative blobs */}
      <motion.div
        className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-200/40 to-fuchsia-200/40 rounded-full blur-3xl"
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-br from-cyan-200/40 to-blue-200/40 rounded-full blur-3xl"
        animate={{
          x: [0, -20, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* ヘッダー */}
      <motion.div
        className="sticky top-0 z-50 glass border-b border-white/20"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <HiOutlineDesktopComputer className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <span className="font-bold text-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                  PC診断
                </span>
              </div>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <Badge
                variant="secondary"
                className="font-medium bg-white/80 backdrop-blur border border-violet-100"
              >
                {answeredCount} / {totalQuestions} 回答
              </Badge>
            </motion.div>
          </div>

          {/* Progress bar with animation */}
          <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
              variants={progressVariants}
              initial="initial"
              animate="animate"
              custom={progress}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>質問 {currentIndex + 1} / {totalQuestions}</span>
            <span>{Math.round(progress)}% 完了</span>
          </div>
        </div>
      </motion.div>

      {/* メインコンテンツ */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Card className="border-0 shadow-2xl glass-card overflow-hidden">
              {/* Gradient top border */}
              <div className="h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />

              <CardHeader className="text-center pb-2">
                <motion.div
                  className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-xl"
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                >
                  <HiOutlineSparkles className="w-10 h-10 text-white" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    {currentQuestion?.title}
                  </CardTitle>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <CardDescription className="text-base text-gray-500">
                    {currentQuestion?.description}
                  </CardDescription>
                </motion.div>

                {isMultiSelect && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 }}
                  >
                    <Badge
                      variant="outline"
                      className="mt-2 mx-auto bg-violet-50 border-violet-200 text-violet-700"
                    >
                      <RiCheckLine className="w-3 h-3 mr-1" />
                      複数選択可
                    </Badge>
                  </motion.div>
                )}
              </CardHeader>

              <CardContent className="space-y-3">
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  {currentQuestion?.options.map((option, index) => {
                    const selected = isSelected(option.id)
                    const icon = questionIcons[option.id] || <HiOutlineDesktopComputer className="w-5 h-5" />

                    return (
                      <motion.button
                        key={option.id}
                        variants={itemVariants}
                        onClick={() => handleSelect(option.id)}
                        className={cn(
                          "w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 group relative overflow-hidden",
                          selected
                            ? "border-violet-400 bg-gradient-to-r from-violet-50 to-fuchsia-50 shadow-lg shadow-violet-500/10"
                            : "border-gray-100 bg-white/50 hover:border-violet-200 hover:bg-white/80 hover:shadow-md"
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Selection indicator animation */}
                        {selected && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}

                        <div className="flex items-center gap-4 relative z-10">
                          <motion.div
                            className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                              selected
                                ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg"
                                : "bg-gray-100 text-gray-500 group-hover:bg-violet-100 group-hover:text-violet-600"
                            )}
                            whileHover={{ rotate: selected ? 0 : 5 }}
                          >
                            {icon}
                          </motion.div>

                          <div className="flex-1">
                            <span className={cn(
                              "font-medium text-base transition-colors",
                              selected ? "text-violet-700" : "text-gray-700"
                            )}>
                              {option.label}
                            </span>
                          </div>

                          <AnimatePresence>
                            {selected && (
                              <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 180 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                              >
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-md">
                                  <HiOutlineCheckCircle className="w-5 h-5 text-white" />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.button>
                    )
                  })}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* ナビゲーション */}
        <motion.div
          className="flex justify-between items-center mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentIndex === 0}
            className="gap-2 hover:bg-white/50"
          >
            <HiOutlineArrowLeft className="w-4 h-4" />
            戻る
          </Button>

          <div className="flex gap-2">
            {isMultiSelect ? (
              <Button
                onClick={handleNext}
                disabled={!hasSelection}
                className="gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 shadow-lg shadow-violet-500/25"
              >
                次へ
                <HiOutlineArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              !currentQuestion?.required && (
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="gap-2 border-gray-200 hover:bg-white/50"
                >
                  スキップ
                  <HiOutlineArrowRight className="w-4 h-4" />
                </Button>
              )
            )}
          </div>
        </motion.div>

        {/* ヒント */}
        <motion.div
          className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100/50 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-sm text-blue-700">
            {isMultiSelect ? (
              <>
                <span className="font-semibold">💡 ヒント:</span> 当てはまるものをすべて選んでから「次へ」を押してください。
                複数選んだ場合、最も負荷のかかる用途に合わせてPCを提案します。
              </>
            ) : (
              <>
                <span className="font-semibold">💡 ヒント:</span> すべての質問に答える必要はありません。
                こだわらない項目はスキップしてOKです。
              </>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  )
}
