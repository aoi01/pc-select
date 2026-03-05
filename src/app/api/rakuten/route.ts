import { NextRequest, NextResponse } from 'next/server'

/**
 * 楽天API プロキシエンドポイント
 * クライアントから直接楽天APIを呼ぶとCORSエラーになるため、
 * サーバーサイドでプロキシする
 *
 * 認証情報の使い分け：
 * - Application ID → applicationIdパラメータ（必須）
 * - Affiliate ID → affiliateIdパラメータ（オプション）
 * - application_secret → OAuth用（通常APIでは未使用）
 */

// 新しいエンドポイント（Microservices形式）
const RAKUTEN_API_URL = 'https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  // 必要なパラメータを取得
  const keyword = searchParams.get('keyword')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const hits = searchParams.get('hits') || '30'

  console.log('[API Route] リクエスト受信:', { keyword, minPrice, maxPrice, hits })

  if (!keyword) {
    return NextResponse.json(
      { error: 'keyword parameter is required' },
      { status: 400 }
    )
  }

  // 環境変数からAPIキーを取得
  // 優先順位: RAKUTEN_APPLICATION_ID > RAKUTEN_ACCESS_KEY > NEXT_PUBLIC_*
  const applicationId = process.env.RAKUTEN_APPLICATION_ID
    || process.env.RAKUTEN_ACCESS_KEY
    || process.env.NEXT_PUBLIC_RAKUTEN_APPLICATION_ID
    || process.env.NEXT_PUBLIC_RAKUTEN_ACCESS_KEY

  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID
    || process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID

  console.log('[API Route] Application ID:', applicationId ? `${applicationId.slice(0, 8)}...` : '未設定')
  console.log('[API Route] Affiliate ID:', affiliateId || '未設定')

  if (!applicationId) {
    console.error('[API Route] エラー: Application ID未設定')
    return NextResponse.json(
      { error: 'Application ID not configured. Please set RAKUTEN_APPLICATION_ID in .env.local' },
      { status: 500 }
    )
  }

  // 楽天API用のURLを構築
  const rakutenUrl = new URL(RAKUTEN_API_URL)
  rakutenUrl.searchParams.set('applicationId', applicationId)  // 必須
  rakutenUrl.searchParams.set('keyword', keyword)
  rakutenUrl.searchParams.set('format', 'json')
  rakutenUrl.searchParams.set('hits', hits)

  if (minPrice) rakutenUrl.searchParams.set('minPrice', minPrice)
  if (maxPrice) rakutenUrl.searchParams.set('maxPrice', maxPrice)
  if (affiliateId) rakutenUrl.searchParams.set('affiliateId', affiliateId)

  console.log('[API Route] 楽天API URL:', rakutenUrl.toString().replace(applicationId, '***'))

  try {
    const response = await fetch(rakutenUrl.toString(), {
      method: 'GET',
    })

    console.log('[API Route] 楽天API レスポンス:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API Route] 楽天API エラー詳細:', errorText)

      return NextResponse.json(
        {
          error: `楽天API エラー: ${response.status}`,
          details: errorText
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[API Route] 成功: 商品数:', data.count || 0)
    return NextResponse.json(data)
  } catch (error) {
    console.error('[API Route] Fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from Rakuten API', details: String(error) },
      { status: 500 }
    )
  }
}
