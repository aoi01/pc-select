/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pagesへのデプロイを考慮した設定
  output: 'export',
  images: {
    unoptimized: true, // 静的エクスポート時は画像最適化を無効化
  },
  // 環境変数の公開設定
  env: {
    NEXT_PUBLIC_APP_NAME: 'PC診断・レコメンド',
  },
}

module.exports = nextConfig
