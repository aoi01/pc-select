/** @type {import('next').NextConfig} */
const nextConfig = {
  // API Routesを使用するため静的エクスポートを解除
  // Cloudflare PagesへはFunctionsを使用してデプロイ可能
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'thumbnail.image.rakuten.co.jp',
      },
      {
        protocol: 'https',
        hostname: '*.rakuten.co.jp',
      },
    ],
  },
  // 環境変数の公開設定
  env: {
    NEXT_PUBLIC_APP_NAME: 'PC診断・レコメンド',
  },
}

module.exports = nextConfig
