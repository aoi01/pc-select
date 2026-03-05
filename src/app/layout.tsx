import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PC診断・レコメンド | あなたにぴったりのPCを見つけよう',
  description: '6つの質問に答えるだけで、あなたにぴったりのパソコンを診断。学生さん向けのPC選びをサポートします。',
  keywords: ['パソコン', 'PC', '診断', 'レコメンド', '学生', 'ノートPC', 'パソコン選び'],
  authors: [{ name: 'PC Select' }],
  openGraph: {
    title: 'PC診断・レコメンド',
    description: 'あなたにぴったりのパソコンを診断で見つけよう',
    type: 'website',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PC診断・レコメンド',
    description: 'あなたにぴったりのパソコンを診断で見つけよう',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className="smooth-scroll">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
