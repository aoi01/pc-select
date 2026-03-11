'use client'

import { ThemeProvider } from './ThemeProvider'
import dynamic from 'next/dynamic'

const Galaxy = dynamic(() => import('@/components/reactbits/Galaxy'), { ssr: false })

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="galaxy-bg fixed inset-0 z-0 pointer-events-none">
        <Galaxy transparent hueShift={140} speed={0.5} rotationSpeed={0.05} glowIntensity={0.3} />
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </ThemeProvider>
  )
}
