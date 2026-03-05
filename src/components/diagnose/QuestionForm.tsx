'use client'

import { useState, useCallback } from 'react'
import { questions, questionIds } from '@/lib/diagnose'
import type { DiagnoseAnswers, QuestionId } from '@/lib/types'

interface QuestionFormProps {
  onComplete: (answers: DiagnoseAnswers) => void
}

export default function QuestionForm({ onComplete }: QuestionFormProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<DiagnoseAnswers>({})

  const currentQuestion = questions[currentIndex]
  const totalQuestions = questions.length
  const progress = ((currentIndex + 1) / totalQuestions) * 100

  const handleSelect = useCallback((optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }))

    // 次の質問へ
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      // 最後の質問完了
      onComplete({
        ...answers,
        [currentQuestion.id]: optionId,
      })
    }
  }, [currentQuestion, currentIndex, totalQuestions, answers, onComplete])

  const handleSkip = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      onComplete(answers)
    }
  }, [currentIndex, totalQuestions, answers, onComplete])

  const handleBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }, [currentIndex])

  const isAnswered = answers[currentQuestion?.id] !== undefined

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-8">
      <div className="mx-auto max-w-lg">
        {/* ヘッダー */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800">
            PC診断
          </h1>
          <p className="mt-2 text-gray-600">
            あなたにぴったりのPCを見つけましょう
          </p>
        </div>

        {/* 進捗バー */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>質問 {currentIndex + 1} / {totalQuestions}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 質問カード */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {currentQuestion?.title}
          </h2>
          <p className="text-gray-600 mb-6">
            {currentQuestion?.description}
          </p>

          {/* 選択肢 */}
          <div className="space-y-3">
            {currentQuestion?.options.map(option => {
              const isSelected = answers[currentQuestion.id] === option.id
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={`
                    w-full text-left px-5 py-4 rounded-xl border-2 transition-all
                    ${isSelected
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="font-medium">{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ナビゲーション */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={currentIndex === 0}
            className={`
              px-4 py-2 rounded-lg text-gray-600
              ${currentIndex === 0
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-100'
              }
            `}
          >
            ← 戻る
          </button>

          {!currentQuestion?.required && (
            <button
              onClick={handleSkip}
              className="px-4 py-2 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              スキップ →
            </button>
          )}
        </div>

        {/* デバッグ: 現在の回答状態（開発用） */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded text-xs text-gray-600">
            <p className="font-bold">Debug - Current Answers:</p>
            <pre>{JSON.stringify(answers, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
