import type { NormalizedProduct, RecommendationSlot } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Star,
  Store,
  ExternalLink,
  Crown,
  TrendingUp,
  Zap,
  Check
} from 'lucide-react'

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
}> = {
  best: {
    label: 'ベストチョイス',
    description: 'あなたの条件に最適な1台',
    icon: <Crown className="w-5 h-5" />,
    gradient: 'from-amber-500 to-orange-500',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
  },
  value: {
    label: 'コスパ重視',
    description: 'お得に購入できる1台',
    icon: <TrendingUp className="w-5 h-5" />,
    gradient: 'from-green-500 to-emerald-500',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-700',
  },
  upgrade: {
    label: 'ワンランク上',
    description: '将来を見据えた上位モデル',
    icon: <Zap className="w-5 h-5" />,
    gradient: 'from-purple-500 to-pink-500',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
  },
}

const specRankConfig: Record<string, { color: string; label: string }> = {
  A: { color: 'bg-green-100 text-green-700 border-green-200', label: '高スペック' },
  B: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: '中スペック' },
  C: { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'エントリー' },
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
    <Card className={cn(
      "relative overflow-hidden border-2 transition-all duration-300 card-hover",
      config.border,
      "animate-slide-up"
    )} style={{ animationDelay: `${index * 150}ms` }}>
      {/* ヘッダーバッジ */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r",
        config.gradient
      )} />

      {/* スロットラベル */}
      <div className="absolute top-3 left-3 z-10">
        <Badge className={cn("gap-1 font-medium", config.badge)}>
          {config.icon}
          {config.label}
        </Badge>
      </div>

      <CardContent className="pt-14 pb-4 px-4">
        {/* 商品画像 */}
        <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl mb-4 overflow-hidden relative group">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Store className="w-16 h-16" />
            </div>
          )}
        </div>

        {/* スペックランク */}
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className={cn("text-xs", specConfig.color)}>
            {specConfig.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {product.friendlySpec}
          </span>
        </div>

        {/* 価格 */}
        <div className="mb-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            {formatPrice(product.price)}
          </span>
        </div>

        {/* 商品名 */}
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-3 min-h-[40px]">
          {product.name}
        </h3>

        {/* ショップ & レビュー */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Store className="w-3.5 h-3.5" />
            <span className="truncate max-w-[120px]">{product.shopName}</span>
          </div>
          {product.reviewScore !== undefined && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{product.reviewScore.toFixed(1)}</span>
              {product.reviewCount && (
                <span className="text-gray-400">({product.reviewCount})</span>
              )}
            </div>
          )}
        </div>

        {/* CTAボタン */}
        <a
          href={product.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Button className="w-full gap-2 shadow-lg shadow-primary/20" size="lg">
            <Check className="w-4 h-4" />
            詳細を見る
            <ExternalLink className="w-4 h-4" />
          </Button>
        </a>
      </CardContent>
    </Card>
  )
}
