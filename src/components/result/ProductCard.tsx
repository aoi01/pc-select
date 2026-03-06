'use client'

import { motion } from 'framer-motion'
import type { NormalizedProduct, RecommendationSlot } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  HiOutlineStar,
  HiOutlineShoppingBag,
  HiOutlineExternalLink,
  HiOutlineCheck,
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
  border: string
  badge: string
  glow: string
}> = {
  best: {
    label: 'ベストチョイス',
    description: 'あなたに最適な1台',
    icon: <RiVipCrownLine className="w-5 h-5" />,
    gradient: 'from-amber-400 via-orange-500 to-rose-500',
    border: 'border-amber-200',
    badge: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-200',
    glow: 'shadow-amber-500/20',
  },
  value: {
    label: 'コスパ重視',
    description: 'お得に購入できる1台',
    icon: <RiRocketLine className="w-5 h-5" />,
    gradient: 'from-emerald-400 via-green-500 to-teal-500',
    border: 'border-emerald-200',
    badge: 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-200',
    glow: 'shadow-emerald-500/20',
  },
  upgrade: {
    label: 'ワンランク上',
    description: '将来を見据えた上位モデル',
    icon: <RiFlashlightLine className="w-5 h-5" />,
    gradient: 'from-violet-400 via-purple-500 to-fuchsia-500',
    border: 'border-violet-200',
    badge: 'bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 border-violet-200',
    glow: 'shadow-violet-500/20',
  },
}

const specRankConfig: Record<string, { color: string; label: string; gradient: string }> = {
  A: {
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    label: '高スペック',
    gradient: 'from-emerald-500 to-teal-500',
  },
  B: {
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    label: '中スペック',
    gradient: 'from-blue-500 to-cyan-500',
  },
  C: {
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    label: 'エントリー',
    gradient: 'from-amber-500 to-orange-500',
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
      delay: index * 0.15,
    },
  }),
}

const imageVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.08 },
}

export default function ProductCard({ product, slot, index }: ProductCardProps) {
  const config = slotConfig[slot]
  const specConfig = specRankConfig[product.specRank] || specRankConfig.C

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      whileHover={{ y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card className={cn(
        "relative overflow-hidden border-2 transition-all duration-300",
        config.border,
        "shadow-xl hover:shadow-2xl",
        config.glow
      )}>
        {/* Gradient top border */}
        <motion.div
          className={cn("absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r", config.gradient)}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        />

        {/* Slot label badge */}
        <div className="absolute top-4 left-4 z-10">
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, delay: index * 0.1 + 0.2 }}
          >
            <Badge className={cn("gap-1.5 font-semibold border", config.badge)}>
              {config.icon}
              {config.label}
            </Badge>
          </motion.div>
        </div>

        <CardContent className="pt-16 pb-5 px-5">
          {/* Product image */}
          <motion.div
            className="aspect-square bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-2xl mb-4 overflow-hidden relative group"
            initial="initial"
            whileHover="hover"
            variants={imageVariants}
          >
            {product.imageUrl ? (
              <motion.img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain p-5"
                variants={imageVariants}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <HiOutlineShoppingBag className="w-20 h-20" />
              </div>
            )}

            {/* Hover overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
          </motion.div>

          {/* Spec rank */}
          <div className="flex items-center gap-2 mb-3">
            <Badge
              variant="outline"
              className={cn("text-xs font-medium", specConfig.color)}
            >
              {specConfig.label}
            </Badge>
            <span className="text-xs text-gray-500">
              {product.friendlySpec}
            </span>
          </div>

          {/* Price */}
          <motion.div
            className="mb-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 + 0.3 }}
          >
            <span className={cn(
              "text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
              config.gradient
            )}>
              {formatPrice(product.price)}
            </span>
          </motion.div>

          {/* Product name */}
          <h3 className="text-sm font-medium text-gray-700 line-clamp-2 mb-4 min-h-[40px] leading-relaxed">
            {product.name}
          </h3>

          {/* Shop & Review */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-5">
            <div className="flex items-center gap-1.5">
              <HiOutlineShoppingBag className="w-4 h-4" />
              <span className="truncate max-w-[120px]">{product.shopName}</span>
            </div>
            {product.reviewScore !== undefined && (
              <div className="flex items-center gap-1">
                <HiOutlineStar className="w-4 h-4 text-amber-400" />
                <span className="font-medium">{product.reviewScore.toFixed(1)}</span>
                {product.reviewCount && (
                  <span className="text-gray-400">({product.reviewCount})</span>
                )}
              </div>
            )}
          </div>

          {/* CTA Button */}
          <motion.a
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              className={cn(
                "w-full gap-2 shadow-lg transition-all duration-300",
                `bg-gradient-to-r ${config.gradient} hover:opacity-90`,
                "text-white font-medium"
              )}
              size="lg"
            >
              <HiOutlineCheck className="w-4 h-4" />
              詳細を見る
              <HiOutlineExternalLink className="w-4 h-4" />
            </Button>
          </motion.a>
        </CardContent>
      </Card>
    </motion.div>
  )
}
