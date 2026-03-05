import type { NormalizedProduct, RecommendationSlot } from '@/lib/types'

interface ProductCardProps {
  product: NormalizedProduct
  slot: RecommendationSlot
}

const slotLabels: Record<RecommendationSlot, string> = {
  best: 'ベストチョイス',
  value: 'コスパ重視',
  upgrade: '1ランク上',
}

const slotDescriptions: Record<RecommendationSlot, string> = {
  best: 'あなたの条件に最も合った1台',
  value: '同じ条件で最もお得な1台',
  upgrade: '将来的な拡張性を考慮した上位モデル',
}

const specRankColors: Record<string, string> = {
  A: 'bg-green-100 text-green-700 border-green-200',
  B: 'bg-blue-100 text-blue-700 border-blue-200',
  C: 'bg-orange-100 text-orange-700 border-orange-200',
}

const slotStyles: Record<RecommendationSlot, string> = {
  best: 'ring-2 ring-primary-500 ring-offset-2',
  value: 'border-2 border-green-400',
  upgrade: 'border-2 border-purple-400',
}

export default function ProductCard({ product, slot }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${slotStyles[slot]}`}>
      {/* ヘッダー */}
      <div className="bg-gray-50 px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-gray-800">
              {slotLabels[slot]}
            </span>
            <p className="text-xs text-gray-500">
              {slotDescriptions[slot]}
            </p>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${specRankColors[product.specRank]}`}>
            {product.friendlySpec}
          </span>
        </div>
      </div>

      {/* 商品画像 */}
      <div className="aspect-square bg-gray-100 relative">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            画像なし
          </div>
        )}
      </div>

      {/* 商品情報 */}
      <div className="p-4">
        {/* 価格 */}
        <div className="text-2xl font-bold text-primary-600 mb-2">
          {formatPrice(product.price)}
        </div>

        {/* 商品名 */}
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2">
          {product.name}
        </h3>

        {/* ショップ名 */}
        <div className="flex items-center text-xs text-gray-500 mb-3">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          {product.shopName}
        </div>

        {/* レビュー */}
        {product.reviewScore !== undefined && (
          <div className="flex items-center text-xs text-gray-500 mb-3">
            <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            <span>{product.reviewScore.toFixed(1)}</span>
            {product.reviewCount && (
              <span className="ml-1">({product.reviewCount}件)</span>
            )}
          </div>
        )}

        {/* CTAボタン */}
        <a
          href={product.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-primary-500 hover:bg-primary-600 text-white text-center py-3 rounded-xl font-medium transition-colors"
        >
          詳細を見る
        </a>
      </div>
    </div>
  )
}
