'use client'

import { useState, useCallback } from 'react'
import { questions } from '@/lib/diagnose'
import type { DiagnoseAnswers } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Monitor,
  GraduationCap,
  Code,
  Film,
  Gamepad2,
  Battery,
  Briefcase,
  Home,
  Wallet,
  Ruler,
  Package,
  CheckCircle2,
  Check
} from 'lucide-react'

interface QuestionFormProps {
  onComplete: (answers: DiagnoseAnswers) => void
}

// アイコンマッピング
const questionIcons: Record<string, React.ReactNode> = {
  report: <GraduationCap className="w-5 h-5" />,
  programming: <Code className="w-5 h-5" />,
  video3d: <Film className="w-5 h-5" />,
  gaming: <Gamepad2 className="w-5 h-5" />,
  short: <Battery className="w-5 h-5" />,
  medium: <Battery className="w-5 h-5" />,
  long: <Battery className="w-5 h-5" />,
  allday: <Battery className="w-5 h-5" />,
  daily: <Briefcase className="w-5 h-5" />,
  weekly: <Briefcase className="w-5 h-5" />,
  home: <Home className="w-5 h-5" />,
  budget1: <Wallet className="w-5 h-5" />,
  budget2: <Wallet className="w-5 h-5" />,
  budget3: <Wallet className="w-5 h-5" />,
  compact: <Ruler className="w-5 h-5" />,
  standard: <Ruler className="w-5 h-5" />,
  any: <Monitor className="w-5 h-5" />,
  used: <Package className="w-5 h-5" />,
  new: <Sparkles className="w-5 h-5" />,
}

export default function QuestionForm({ onComplete }: QuestionFormProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<DiagnoseAnswers>({})
  const [animating, setAnimating] = useState(false)

  const currentQuestion = questions[currentIndex]
  const totalQuestions = questions.length
  const progress = ((currentIndex + 1) / totalQuestions) * 100
  const isMultiSelect = currentQuestion?.multiSelect ?? false

  // 回答数をカウント（Q1は配列なので長さをカウント）
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
    if (animating) return

    setAnimating(true)
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: optionId,
    }
    setAnswers(newAnswers)

    setTimeout(() => {
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex(prev => prev + 1)
      } else {
        onComplete(newAnswers)
      }
      setAnimating(false)
    }, 200)
  }, [currentQuestion, currentIndex, totalQuestions, answers, onComplete, animating])

  // 選択ハンドラ（複数選択か単一選択かで分岐）
  const handleSelect = useCallback((optionId: string) => {
    if (isMultiSelect) {
      toggleMultiSelect(optionId)
    } else {
      handleSingleSelect(optionId)
    }
  }, [isMultiSelect, toggleMultiSelect, handleSingleSelect])

  // 次へ進む（複数選択用）
  const handleNext = useCallback(() => {
    if (animating) return
    setAnimating(true)

    setTimeout(() => {
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex(prev => prev + 1)
      } else {
        onComplete(answers)
      }
      setAnimating(false)
    }, 200)
  }, [currentIndex, totalQuestions, answers, onComplete, animating])

  const handleSkip = useCallback(() => {
    if (animating) return
    setAnimating(true)

    setTimeout(() => {
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex(prev => prev + 1)
      } else {
        onComplete(answers)
      }
      setAnimating(false)
    }, 200)
  }, [currentIndex, totalQuestions, answers, onComplete, animating])

  const handleBack = useCallback(() => {
    if (currentIndex > 0 && !animating) {
      setAnimating(true)
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1)
        setAnimating(false)
      }, 150)
    }
  }, [currentIndex, animating])

  // 選択状態を判定
  const isSelected = (optionId: string): boolean => {
    if (isMultiSelect) {
      return (answers.Q1 ?? []).includes(optionId)
    }
    return answers[currentQuestion.id] === optionId
  }

  // 複数選択で何か選択されているか
  const hasSelection = isMultiSelect ? (answers.Q1?.length ?? 0) > 0 : !!answers[currentQuestion.id]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* ヘッダー */}
      <div className="sticky top-0 z-50 glass border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Monitor className="w-6 h-6 text-primary" />
              <span className="font-bold text-lg">PC診断</span>
            </div>
            <Badge variant="secondary" className="font-medium">
              {answeredCount} / {totalQuestions} 回答
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>質問 {currentIndex + 1} / {totalQuestions}</span>
            <span>{Math.round(progress)}% 完了</span>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className={cn(
          "border-0 shadow-xl bg-white/80 backdrop-blur transition-all duration-300",
          animating && "opacity-50 scale-[0.98]"
        )}>
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/30">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {currentQuestion?.title}
            </CardTitle>
            <CardDescription className="text-base">
              {currentQuestion?.description}
            </CardDescription>
            {isMultiSelect && (
              <Badge variant="outline" className="mt-2 mx-auto">
                <Check className="w-3 h-3 mr-1" />
                複数選択可
              </Badge>
            )}
          </CardHeader>

          <CardContent className="space-y-3">
            {currentQuestion?.options.map((option, index) => {
              const selected = isSelected(option.id)
              const icon = questionIcons[option.id] || <Monitor className="w-5 h-5" />

              return (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 group",
                    "hover:shadow-lg hover:scale-[1.02]",
                    selected
                      ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                      : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                      selected
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600 group-hover:bg-primary/10 group-hover:text-primary"
                    )}>
                      {icon}
                    </div>
                    <div className="flex-1">
                      <span className={cn(
                        "font-medium text-base",
                        selected && "text-primary"
                      )}>
                        {option.label}
                      </span>
                    </div>
                    {selected && (
                      <CheckCircle2 className="w-6 h-6 text-primary animate-scale-in" />
                    )}
                  </div>
                </button>
              )
            })}
          </CardContent>
        </Card>

        {/* ナビゲーション */}
        <div className="flex justify-between items-center mt-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentIndex === 0 || animating}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            戻る
          </Button>

          <div className="flex gap-2">
            {/* 複数選択の場合は「次へ」ボタンを表示 */}
            {isMultiSelect ? (
              <Button
                onClick={handleNext}
                disabled={!hasSelection || animating}
                className="gap-2"
              >
                次へ
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              !currentQuestion?.required && (
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  disabled={animating}
                  className="gap-2"
                >
                  スキップ
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )
            )}
          </div>
        </div>

        {/* ヒント */}
        <div className="mt-8 p-4 rounded-xl bg-blue-50 border border-blue-100">
          <p className="text-sm text-blue-700">
            {isMultiSelect ? (
              <>
                💡 <strong>ヒント:</strong> 当てはまるものをすべて選んでから「次へ」を押してください。
                複数選んだ場合、最も負荷のかかる用途に合わせてPCを提案します。
              </>
            ) : (
              <>
                💡 <strong>ヒント:</strong> すべての質問に答える必要はありません。
                こだわらない項目はスキップしてOKです。
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
