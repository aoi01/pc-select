'use client'

import { motion } from 'framer-motion'
import type { NormalizedProduct, RecommendationSlot } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SpotlightCard, StarBorder, CountUp } from '@/components/reactbits'
import { cn } from '@/lib/utils'
import {
  HiOutlineStar,
  HiOutlineShoppingBag,
  HiOutlineExternalLink,
} from 'react-icons/hi'
import {
  RiVipCrownLine,
  RiRocketLine,
  RiFlashlightLine,
} from 'react-icons/ri'

interface ProductCardProps {
  product: NormalizedProduct
  slot: RecommendationSlot
  index: number
}

const slotConfig: Record<RecommendationSlot, {
  label: string
  description: string
  icon: React.ReactNode
  gradient: string
  spotlightColor: string
  glowClass: string
  textGradient: string
  starColor: string
  badgeBg: string
}> = {
  best: {
    label: 'ベストチョイス',
    description: 'あなたに最適な1台',
    icon: <RiVipCrownLine className="w-4 h-4" />,
    gradient: 'from-amber-400 via-orange-500 to-rose-500',
    spotlightColor: 'rgba(245, 158, 11, 0.15)',
    glowClass: 'glow-amber',
    textGradient: 'from-amber-400 to-orange-400',
    starColor: '#f59e0b',
    badgeBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  },
  value: {
    label: 'コスパ重視',
    description: 'お得に購入できる1台',
    icon: <RiRocketLine className="w-4 h-4" />,
    gradient: 'from-emerald-400 via-green-500 to-teal-500',
    spotlightColor: 'rgba(16, 185, 129, 0.15)',
    glowClass: 'glow-emerald',
    textGradient: 'from-emerald-400 to-teal-400',
    starColor: '#10b981',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  },
  upgrade: {
    label: 'ワンランク上',
    description: '将来を見据えた上位モデル',
    icon: <RiFlashlightLine className="w-4 h-4" />,
    gradient: 'from-violet-400 via-purple-500 to-fuchsia-500',
    spotlightColor: 'rgba(139, 92, 246, 0.15)',
    glowClass: 'glow-violet',
    textGradient: 'from-violet-400 to-fuchsia-400',
    starColor: '#8b5cf6',
    badgeBg: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
  },
}

const specRankConfig: Record<string, { label: string; color: string }> = {
  A: { label: '高スペック', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
  B: { label: '中スペック', color: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
  C: { label: 'エントリー', color: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut' as const,
      delay: index * 0.1,
    },
  }),
}

export default function ProductCard({ product, slot, index }: ProductCardProps) {
  const config = slotConfig[slot]
  const specConfig = specRankConfig[product.specRank] || specRankConfig.C

  const cardContent = (
    <SpotlightCard
      spotlightColor={config.spotlightColor}
      className="h-full"
    >
      <div className="relative bg-card rounded-[1.25rem] border border-foreground/[0.06] overflow-hidden h-full">
        {/* Gradient top line */}
        <div className={cn("absolute top-0 left-0 right-0 h-px bg-gradient-to-r", config.gradient)} />

        {/* Slot badge */}
        <div className="absolute top-4 left-4 z-10">
          <Badge className={cn("gap-1.5 font-semibold text-xs border", config.badgeBg)}>
            {config.icon}
            {config.label}
          </Badge>
        </div>

        <div className="pt-14 pb-5 px-5">
          {/* Product image */}
          <div className="aspect-square bg-foreground/[0.03] rounded-xl mb-4 overflow-hidden relative group border border-foreground/[0.04] transition-transform duration-200 hover:scale-[1.02]">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain p-5 transition-transform duration-200 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-foreground/10">
                <HiOutlineShoppingBag className="w-16 h-16" />
              </div>
            )}
          </div>

          {/* Spec rank */}
          <div className="flex items-center gap-2 mb-3">
            <Badge className={cn("text-xs font-medium border", specConfig.color)}>
              {specConfig.label}
            </Badge>
            <span className="text-xs text-foreground/30">
              {product.friendlySpec}
            </span>
          </div>

          {/* Price with CountUp */}
          <div className="mb-2">
            <span className="text-xs text-foreground/30 mr-1">¥</span>
            <span className={cn("text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent", config.textGradient)}>
              <CountUp
                to={product.price}
                separator=","
                duration={1.5}
                delay={index * 0.15}
                className={cn("text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent", config.textGradient)}
              />
            </span>
          </div>

          {/* Product name */}
          <h3 className="text-sm font-medium text-foreground/70 line-clamp-2 mb-4 min-h-[40px] leading-relaxed">
            {product.name}
          </h3>

          {/* Shop & Review */}
          <div className="flex items-center justify-between text-xs text-foreground/30 mb-5">
            <div className="flex items-center gap-1.5">
              <HiOutlineShoppingBag className="w-3.5 h-3.5" />
              <span className="truncate max-w-[120px]">{product.shopName}</span>
            </div>
            {product.reviewScore !== undefined && (
              <div className="flex items-center gap-1">
                <HiOutlineStar className="w-3.5 h-3.5 text-amber-400/70" />
                <span className="font-medium text-foreground/50">{product.reviewScore.toFixed(1)}</span>
                {product.reviewCount && (
                  <span className="text-foreground/20">({product.reviewCount})</span>
                )}
              </div>
            )}
          </div>

          {/* CTA Button */}
          <a
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button
              className={cn(
                "w-full gap-2 font-medium border-0 text-white transition-opacity hover:opacity-90",
                `bg-gradient-to-r ${config.gradient}`,
              )}
              size="lg"
              style={{ boxShadow: `0 0 20px ${config.spotlightColor}` }}
            >
              詳細を見る
              <HiOutlineExternalLink className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </div>
    </SpotlightCard>
  )

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      className="transition-transform duration-200 hover:-translate-y-1"
    >
      {slot === 'best' ? (
        <StarBorder color={config.starColor} speed="8s" thickness={2}>
          {cardContent}
        </StarBorder>
      ) : (
        cardContent
      )}
    </motion.div>
  )
}
