'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { questions } from '@/lib/diagnose'
import type { DiagnoseAnswers } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BlurText } from '@/components/reactbits'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/utils'
import {
  HiOutlineAcademicCap,
  HiOutlineCode,
  HiOutlineFilm,
  HiOutlineDesktopComputer,
  HiOutlineBriefcase,
  HiOutlineHome,
  HiOutlineCurrencyDollar,
  HiOutlineSwitchHorizontal,
  HiOutlineCube,
  HiOutlineSparkles,
  HiOutlineCheckCircle,
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineSun,
  HiOutlineMoon,
} from 'react-icons/hi'
import {
  RiGamepadLine,
  RiBattery2ChargeLine,
  RiCheckLine,
} from 'react-icons/ri'

interface QuestionFormProps {
  onComplete: (answers: DiagnoseAnswers) => void
}

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
  compact: <HiOutlineSwitchHorizontal className="w-5 h-5" />,
  standard: <HiOutlineSwitchHorizontal className="w-5 h-5" />,
  any: <HiOutlineDesktopComputer className="w-5 h-5" />,
  used: <HiOutlineCube className="w-5 h-5" />,
  new: <HiOutlineSparkles className="w-5 h-5" />,
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' as const },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' as const },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.15 },
  },
}

export default function QuestionForm({ onComplete }: QuestionFormProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<DiagnoseAnswers>({})
  const [direction, setDirection] = useState(0)
  const { theme, toggleTheme } = useTheme()

  const currentQuestion = questions[currentIndex]
  const totalQuestions = questions.length
  const progress = ((currentIndex + 1) / totalQuestions) * 100
  const isMultiSelect = currentQuestion?.multiSelect ?? false

  const answeredCount = Object.entries(answers).reduce((count, [key, value]) => {
    if (key === 'Q1' && Array.isArray(value)) {
      return count + (value.length > 0 ? 1 : 0)
    }
    return count + (value ? 1 : 0)
  }, 0)

  const toggleMultiSelect = useCallback((optionId: string) => {
    setAnswers(prev => {
      const current = prev.Q1 ?? []
      const isSelected = current.includes(optionId)
      return {
        ...prev,
        Q1: isSelected
          ? current.filter(id => id !== optionId)
          : [...current, optionId],
      }
    })
  }, [])

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

  const handleSelect = useCallback((optionId: string) => {
    if (isMultiSelect) {
      toggleMultiSelect(optionId)
    } else {
      handleSingleSelect(optionId)
    }
  }, [isMultiSelect, toggleMultiSelect, handleSingleSelect])

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

  const isSelected = (optionId: string): boolean => {
    if (isMultiSelect) {
      return (answers.Q1 ?? []).includes(optionId)
    }
    return answers[currentQuestion.id] === optionId
  }

  const hasSelection = isMultiSelect ? (answers.Q1?.length ?? 0) > 0 : !!answers[currentQuestion.id]

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Header */}
      <motion.div
        className="sticky top-0 z-50 glass"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center"
                style={{ boxShadow: '0 0 20px rgba(0,212,255,0.2)' }}
              >
                <HiOutlineDesktopComputer className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg gradient-text">
                PC診断
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
              <Badge className="font-medium bg-foreground/5 border border-foreground/10 text-foreground/70">
                {answeredCount} / {totalQuestions} 回答
              </Badge>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative h-1.5 bg-foreground/5 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-foreground/30">
            <span>Q{currentIndex + 1} / {totalQuestions}</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
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
            <div className="glass-card rounded-2xl overflow-hidden">
              {/* Gradient top accent */}
              <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

              <div className="p-6 sm:p-8 text-center">
                {/* Question icon */}
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-foreground/10 flex items-center justify-center">
                  <HiOutlineSparkles className="w-8 h-8 text-cyan-400" />
                </div>

                {/* Question title with BlurText */}
                <BlurText
                  key={`title-${currentIndex}`}
                  text={currentQuestion?.title ?? ''}
                  delay={80}
                  animateBy="characters"
                  direction="top"
                  className="text-2xl font-bold text-foreground justify-center mb-2"
                />

                <motion.p
                  className="text-foreground/40 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                >
                  {currentQuestion?.description}
                </motion.p>

                {isMultiSelect && (
                  <div className="mt-3">
                    <Badge className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs">
                      <RiCheckLine className="w-3 h-3 mr-1" />
                      複数選択可
                    </Badge>
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-2.5"
                >
                  {currentQuestion?.options.map((option) => {
                    const selected = isSelected(option.id)
                    const icon = questionIcons[option.id] || <HiOutlineDesktopComputer className="w-5 h-5" />

                    return (
                      <motion.button
                        key={option.id}
                        variants={itemVariants}
                        onClick={() => handleSelect(option.id)}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden",
                          selected
                            ? "border-cyan-500/40 bg-cyan-500/10"
                            : "border-foreground/6 bg-foreground/[0.02] hover:border-foreground/12 hover:bg-foreground/[0.04]"
                        )}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex items-center gap-4 relative z-10">
                          <div
                            className={cn(
                              "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200",
                              selected
                                ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white"
                                : "bg-foreground/5 text-foreground/40 group-hover:bg-foreground/8 group-hover:text-foreground/60"
                            )}
                          >
                            {icon}
                          </div>

                          <span className={cn(
                            "font-medium text-[15px] transition-colors",
                            selected ? "text-cyan-300" : "text-foreground/70 group-hover:text-foreground/90"
                          )}>
                            {option.label}
                          </span>

                          <div className="ml-auto">
                            {selected && (
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                <HiOutlineCheckCircle className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-6 animate-fade-in">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentIndex === 0}
            className="gap-2 text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5 disabled:opacity-20"
          >
            <HiOutlineArrowLeft className="w-4 h-4" />
            戻る
          </Button>

          <div className="flex gap-2">
            {isMultiSelect ? (
              <Button
                onClick={handleNext}
                disabled={!hasSelection}
                className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0 shadow-lg shadow-cyan-500/20 disabled:opacity-30"
              >
                次へ
                <HiOutlineArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              !currentQuestion?.required && (
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="gap-2 border-foreground/10 text-foreground/50 hover:text-foreground/70 hover:bg-foreground/5"
                >
                  スキップ
                  <HiOutlineArrowRight className="w-4 h-4" />
                </Button>
              )
            )}
          </div>
        </div>

        {/* Hint */}
        <div className="mt-8 p-4 rounded-xl bg-foreground/[0.02] border border-foreground/6 animate-fade-in">
          <p className="text-sm text-foreground/30 leading-relaxed">
            {isMultiSelect ? (
              <>
                <span className="text-cyan-400/70 font-medium">Hint:</span>{' '}
                当てはまるものをすべて選んでから「次へ」を押してください。
                複数選んだ場合、最も負荷のかかる用途に合わせてPCを提案します。
              </>
            ) : (
              <>
                <span className="text-cyan-400/70 font-medium">Hint:</span>{' '}
                すべての質問に答える必要はありません。
                こだわらない項目はスキップしてOKです。
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
