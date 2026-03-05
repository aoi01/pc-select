import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PC診断・レコメンド',
  description: 'あなたにぴったりのパソコンを診断で見つけよう。学生さん向けのPC選びをサポートします。',
  keywords: ['パソコン', 'PC', '診断', 'レコメンド', '学生', 'ノートPC'],
  openGraph: {
    title: 'PC診断・レコメンド',
    description: 'あなたにぴったりのパソコンを診断で見つけよう',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
