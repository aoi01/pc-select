'use client'

import { useState, useCallback } from 'react'
import { QuestionForm } from '@/components/diagnose'
import { ResultPage } from '@/components/result'
import type { DiagnoseAnswers } from '@/lib/types'

type AppPhase = 'diagnose' | 'result'

export default function HomePage() {
  const [phase, setPhase] = useState<AppPhase>('diagnose')
  const [answers, setAnswers] = useState<DiagnoseAnswers>({})

  /**
   * 診断完了時のハンドラ
   */
  const handleDiagnoseComplete = useCallback((completedAnswers: DiagnoseAnswers) => {
    setAnswers(completedAnswers)
    setPhase('result')
  }, [])

  /**
   * 最初からやり直し
   */
  const handleRestart = useCallback(() => {
    setAnswers({})
    setPhase('diagnose')
  }, [])

  if (phase === 'result') {
    return (
      <ResultPage
        answers={answers}
        onRestart={handleRestart}
      />
    )
  }

  return (
    <QuestionForm onComplete={handleDiagnoseComplete} />
  )
}
