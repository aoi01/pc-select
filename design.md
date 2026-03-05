# PC診断・レコメンド Webアプリ 設計レビュー・設計書

> **元文書:** READEME.md（要件定義書 v1.2）  
> **作成日:** 2026年2月28日  
> **目的:** READMEの分析、API調査結果、疑問点の整理、スペック決定ロジックの具体化

---

## 1. 機能要件

### 1.1 タブバー構成（モバイルファースト）

| # | タブ名 | 概要 | レンダリング |
|---|--------|------|-------------|
| 1 | 診断 | 質問に答えておすすめPCを表示 | SSR |
| 2 | ランキング | 人気・クリック率が高いPCを表示 | ISR |
| 3 | PCの選び方（ブログ） | PC購入時のポイント解説記事 | SSG |
---

## 2. API調査結果

### 2.1 楽天市場商品検索API（Ichiba Item Search API）

| 項目 | 詳細 |
|------|------|
| **エンドポイント** | `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601` |
| **認証** | Bearer Token（`Authorization: Bearer {accessKey}`） |
| **必須パラメータ** | `keyword` / `genreId` / `itemCode` / `shopCode` のいずれか1つ |
| **PC検索に有用なパラメータ** | `keyword`（キーワード検索）、`genreId`（ジャンルID）、`minPrice`/`maxPrice`（価格帯フィルタ）、`sort`（ソート）、`hits`（取得件数、最大30） |
| **ショップ絞り込み** | 入力: `shopCode`で特定ショップに絞り込み可能。出力: `shopName`, `shopCode`, `shopUrl`, `shopAffiliateUrl` を返却 |
| **レスポンス** | `itemName`, `itemPrice`, `itemUrl`, `affiliateUrl`, `imageUrl`, `shopName` 等 |
| **アフィリエイト** | リクエストに `affiliateId` を含めると `affiliateUrl` が自動生成される |
| **レート制限** | 短時間に同一URLへの大量アクセスで一時的にブロック |
| **formatVersion** | `formatVersion=2` を推奨（レスポンス構造がシンプル） |

> [!IMPORTANT]
> 楽天APIのレスポンスにはCPU、RAM、ストレージ等の**構造化されたスペック情報は含まれない**。`itemName`（商品名）や`itemCaption`（商品説明文）からテキスト解析でスペック情報を抽出する必要がある。

### 2.2 楽天市場ランキングAPI（Ichiba Item Ranking API）

| 項目 | 詳細 |
|------|------|
| **エンドポイント** | `https://openapi.rakuten.co.jp/ichibaranking/api/IchibaItem/Ranking/20220601` |
| **フィルタ** | `genreId`（ジャンルID）、`sex`（性別）、`age`（年代）で絞り込み可 |
| **最大取得** | 1000位まで取得可能 |
| **制約** | `genreId`と`sex`/`age`の同時指定は不可 |

### 2.3 バリューコマース商品API


| 項目 | 詳細 |
|------|------|
| **エンドポイント** | `http://webservice.valuecommerce.ne.jp/productdb/search` |
| **認証** | `token`パラメータ（アフィリエイトサイトのアクセスキー） |
| **必須パラメータ** | `keyword` / `category` / `位置情報` / `sub_store` / `product_id` のいずれか |
| **検索パラメータ** | `keyword`, `category`, `price_min`/`price_max`, `sort_by`(`score`/`price`), `sort_order`, `page`, `result_per_page` |
| **レスポンス形式** | RSS 2.0 (XML) または JSON/JSONP |
| **戻り値** | `title`, `link`（アフィリエイトURL）, `description`, `vc:price`, `vc:image`, `vc:merchantName`, `vc:stock`, `vc:pvImg`（表示カウント用） |
| **レート制限** | 明示的な制限なし（ただし短期間の大量リクエストで制限の可能性） |
| **最大取得件数** | 100,000件（1ページ最大100件 × 1,000ページ） |

> [!WARNING]
> バリューコマースAPIでは `vc:pvImg`（広告表示カウント用タグ）を**必ず表示する必要がある**。未使用の場合、不正と見なされ提携解除・退会のリスクあり。

> [!IMPORTANT]
> バリューコマースAPIも楽天API同様、**構造化されたPCスペック情報（CPU / RAM / ストレージ等）は直接取得できない**。商品名・説明文からのパース処理が必要。

---

## 3. 設計決定：スペック情報の取得方法

### 3.1 問題の本質

楽天API・バリューコマースAPIのいずれも、CPU/RAM/ストレージ等の**構造化スペックデータを直接返さない**。

### 3.2 効率比較 → **D: 検索キーワード戦略を採用**

| 観点 | A: テキスト解析 | B: 手動 | C: ハイブリッド | **D: キーワード戦略** |
|------|---|---|---|---|
| 開発工数 | 高（正規表現大量） | 低 | 高（両方構築） | **★ 最低** |
| 運用負荷 | 高（フォーマット変更対応） | 非常に高 | 中 | **★ 低** |
| 精度 | 中（ショップ毎にバラツキ） | 非常に高 | 高 | **中〜高** |
| スケーラビリティ | 高 | 非常に低 | 中 | **★ 高** |
| 1人開発との相性 | × | × | △ | **★ ◎** |

**Dが最も効率的な理由:**

1. **検索キーワード自体がスペックフィルタとして機能** — 「Core i5 16GB SSD」で検索すれば、該当スペックのPCが自然に返る
2. **`shopCode`ホワイトリストと併用** — 信頼できるショップの結果のみ表示、商品名も正確
3. **`minPrice`/`maxPrice`で予算フィルタもAPIレベルで完結**
4. **パース処理のコードが一切不要** — 保守コストゼロ
5. **加重スコア方式との相性◎** — スコアが「どのキーワードで検索するか」を決定する

> [!NOTE]
> D方式では`products`テーブルの`cpu`/`ram`/`storage`等のフィールドは**キーワードから推定した「期待スペック」として設定**するか、またはフィールド自体を省略して`specRank`のみで管理する。

---

## 4. スペック決定ロジック：回答→キーワード直接マッピング方式（確定）

加重スコア方式を廃止し、**各質問の回答に検索キーワードを1つずつ割り当て、それらを結合してAPIに投げる**シンプルな方式を採用。

### 4.1 設計思想

```
最終検索クエリ = ベース + Q1キーワード + Q3キーワード + Q5キーワード + Q6キーワード
API価格パラメータ = Q4 → minPrice / maxPrice
Q2 = 結果の並び替え・フィルタリング条件
```

スコア計算・ランク判定・予算クランプ等の中間処理が一切不要になり、**回答がそのまま検索条件に直結**する。

### 4.2 回答→キーワード マッピングテーブル

#### Q1: 主な使用用途（→ スペック系キーワード）

| 選択肢 | キーワード | 理由 |
|--------|-----------|------|
| レポート・調べ物 | `Core i5 8GB SSD` | ライトユースに十分 |
| プログラミング | `Core i5 16GB SSD 512GB` | マルチタスク・IDE対応 |
| 動画編集・3D | `Core i7 32GB SSD 1TB` | 高負荷処理対応 |
| ゲーム | `ゲーミング RTX 16GB` | 専用GPU必須 |

#### Q2: 1日の使用時間（→ プロバイダーにより動作が異なる）

| 選択肢 | 楽天 | バリューコマース（Yahoo!） |
|--------|------|--------------------------|
| 1コマ程度（〜2h） | — | — |
| 2コマ（〜4h） | — | — |
| 半日以上（〜8h） | 結果に注記 | キーワード `バッテリー良好` |
| ほぼ一日中 | 結果に注記 | キーワード `バッテリー良好` |

#### Q3: 持ち運び頻度（→ 携帯性キーワード）

| 選択肢 | キーワード |
|--------|-----------|
| 毎日通学に持っていく | `軽量` |
| 週数回 | — |
| ほぼ自宅のみ | — |

#### Q4: 予算（→ APIの価格パラメータに直接反映）

| 選択肢 | API パラメータ |
|--------|---------------|
| 5〜10万円 | `minPrice=50000 & maxPrice=100000` |
| 10〜15万円 | `minPrice=100000 & maxPrice=150000` |
| 15〜20万円 | `minPrice=150000 & maxPrice=200000` |

#### Q5: 画面サイズの希望（→ サイズキーワード）

| 選択肢 | キーワード |
|--------|-----------|
| コンパクト（12インチ） | `12インチ` |
| 標準（13〜14インチ） | `14インチ` |
| こだわらない | — |

#### Q6: 中古・新品の希望（→ 状態キーワード）

| 選択肢 | キーワード | 備考 |
|--------|-----------|------|
| 中古でもOK | `中古` | コスパ重視。READMEの「5〜6万円の中古でも十分」を訴求 |
| 新品が良い | `新品` | — |
| こだわらない | — | 中古・新品両方を検索 |

### 4.3 検索クエリ組み立て例

```
ベース: "ノートパソコン"

例1: レポート用 × 毎日持ち運び × コンパクト × 5〜10万円 × 中古OK
  → keyword: "ノートパソコン Core i5 8GB SSD 軽量 12インチ 中古"
  → minPrice: 50000, maxPrice: 100000

例2: プログラミング × 自宅のみ × 標準 × 10〜15万円 × 新品
  → keyword: "ノートパソコン Core i5 16GB SSD 512GB 14インチ 新品"
  → minPrice: 100000, maxPrice: 150000

例3: ゲーム × 自宅のみ × こだわらない × 15〜20万円 × こだわらない
  → keyword: "ノートパソコン ゲーミング RTX 16GB"
  → minPrice: 150000, maxPrice: 200000
```

> [!TIP]
> キーワードが多すぎるとヒット数が少なくなる可能性がある。ヒット数が少ない場合は**キーワードを段階的に減らす**フォールバック戦略を実装する（例: サイズキーワードを外す → 携帯性キーワードを外す）。

### 4.4 結果3台の選び方ロジック

| 提案枠 | 選定ルール |
|--------|-----------|
| ① ベスト | 検索結果の中で、予算中央値に近くレビュー評価が高い商品 |
| ② コスパ重視 | 検索結果の中で最安の商品 |
| ③ 1ランク上 | Q1のキーワードを1段階上げて再検索した結果から選定 |

**③ 1ランク上の検索キーワード対応:**

| 元の用途 | 1ランク上のキーワード |
|----------|---------------------|
| レポート → | プログラミングのキーワード |
| プログラミング → | 動画編集のキーワード |
| 動画編集 → | そのまま（最上位） |
| ゲーム → | そのまま（最上位） |

### 4.5 ショップ絞り込み戦略

楽天APIの `shopCode` パラメータを活用し、信頼できるPC販売ショップに限定した検索が可能。

| 方法 | 説明 |
|------|------|
| **ホワイトリスト方式** | 信頼できるショップの`shopCode`を事前に登録し、そのショップのみ検索対象とする |
| **キーワード+ショップ併用** | キーワード検索で広く取得し、`shopCode`でフィルタリング |

> [!TIP]


---

## 5. NormalizedProduct 型の具体的定義

```typescript
interface NormalizedProduct {
  provider: "rakuten" | "valuecommerce" | "amazon";
  externalId: string;
  name: string;
  price: number;
  imageUrl: string;
  affiliateUrl: string;
  
  // ショップ情報（楽天APIから取得、絞り込みにも使用）
  shopName: string;
  shopCode?: string;         // 楽天: shopCode（ショップ絞り込み用）
  shopUrl?: string;
  
  // D方式: parsedSpecは不要。specRankのみで管理。
  // 検索キーワードがスペックを暗黙的に保証する。
  
  specRank: "A" | "B" | "C";
  friendlySpec: string;       // ランク別の初心者向け説明
  isAvailable: boolean;
  reviewScore?: number;
  reviewCount?: number;
  lastSyncedAt: number;
}
```

### 5.1 楽天API → NormalizedProduct マッピング

```typescript
function normalizeRakutenItem(item: RakutenItem, specRank: SpecRank): NormalizedProduct {
  return {
    provider: "rakuten",
    externalId: item.itemCode,
    name: item.itemName,
    price: item.itemPrice,
    imageUrl: item.mediumImageUrls?.[0] ?? "",
    affiliateUrl: item.affiliateUrl ?? item.itemUrl,
    shopName: item.shopName,
    shopCode: item.shopCode,
    shopUrl: item.shopUrl,
    specRank,  // 検索キーワードから決定済み
    friendlySpec: generateFriendlySpec(specRank),
    isAvailable: item.availability === 1,
    reviewScore: item.reviewAverage,
    reviewCount: item.reviewCount,
    lastSyncedAt: Date.now(),
  };
}
```

### 5.2 バリューコマースAPI → NormalizedProduct マッピング

```typescript
function normalizeValueCommerceItem(item: VCItem, specRank: SpecRank): NormalizedProduct {
  return {
    provider: "valuecommerce",
    externalId: item.guid,
    name: item.title,
    price: item.price,
    imageUrl: item.images?.large?.url ?? "",
    affiliateUrl: item.link,  // vc:pvImg も別途表示必須
    shopName: item.merchantName,
    specRank,
    friendlySpec: generateFriendlySpec(specRank),
    isAvailable: item.stock !== "0",
    lastSyncedAt: Date.now(),
  };
}
```

---

## 6. データモデル修正提案

### products テーブルへの追加フィールド

| フィールド | 型 | 理由 |
|-----------|---|------|
| `shopName` | `string` | 購買判断に重要 |
| `shopCode` | `string?` | ショップコード（楽天、絞り込み用） |
| `shopUrl` | `string?` | ショップURL |
| `reviewScore` | `number?` | レビュー評価 |
| `reviewCount` | `number?` | レビュー件数 |
| `os` | `string?` | OS情報 |
| `gpu` | `string?` | GPU情報（要件定義に記載あるがテーブルに未定義） |
| `pvImgTag` | `string?` | バリューコマース用PVカウントタグ |

---

## 7. 質問ステータス

### ✅ 解決済み

| # | 質問 | 回答 |
|---|------|------|
| 1 | スペック情報の取得方法 | **D: 検索キーワード戦略** |
| 2 | スペック決定ロジック | **回答→キーワード直接マッピング方式** |
| 3 | APIキー取得 | ✅ 取得済み |
| 4 | 初期実装優先 | **楽天API先行** |
| 5 | 中古PCの取り扱い | **Q6として診断質問に追加**（中古/新品/こだわらない） |

### ❓ 未回答（中優先）

6. **MBTIフレーバーテキスト** — 何パターン？（16×3=48? or 16?）
7. **アクセサリ自動提案** — 固定リスト＋ランク連動でOK？
8. **ISRのCloudflare Pages対応** — Workers+KV擬似ISR or CSR+SWR？
9. **ランキングページ** — 自サイトのみ or 楽天ランキングAPI併用？

### ❓ 未回答（低優先）

10. Convexプラン / 11. ステージング環境 / 12. CMS認証 / 13. ジャンルID / 14. OGP動的生成 / 15. 16タイプ診断のUI表記
