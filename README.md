# ΔV Lab

個人ブログサイト。Hugo + 自作テーマ (retro-theme) で構築。

**デプロイ先:** https://blog.deltav-lab.org

## 構成

```
new_blog/
├── content/
│   ├── about.md
│   ├── posts/          # ブログ記事 (Page Bundle形式)
│   └── projects/       # プロジェクト紹介 (Page Bundle形式)
├── static/
│   └── images/
│       ├── Headers/        # ホーム画像（ランダム表示）
│       ├── dV_LAB_header.png  # ヘッダーロゴ
│       ├── favicon.png     # ファビコン
│       ├── top_page.png    # トップページOGP画像
│       ├── no-image.svg    # サムネイルなし用
│       └── ogp-default.svg # デフォルトOGP画像
├── assets/
│   └── images/
│       └── ogp-overlay.png # OGPオーバーレイ画像
├── themes/retro-theme/
│   ├── layouts/
│   │   ├── _default/
│   │   │   ├── baseof.html     # ベースレイアウト
│   │   │   ├── single.html     # 記事ページ
│   │   │   ├── list.html       # 一覧ページ
│   │   │   ├── about.html      # Aboutページ
│   │   │   ├── taxonomy.html   # タグ一覧
│   │   │   └── term.html       # 個別タグ
│   │   ├── partials/
│   │   │   ├── tab-menu.html       # タブナビゲーション
│   │   │   ├── ogp.html            # OGPメタタグ
│   │   │   └── post-thumbnail.html # サムネイル抽出
│   │   ├── index.html          # ホームページ
│   │   └── 404.html            # 404ページ
│   └── static/
│       ├── css/main.css
│       └── js/
│           ├── random-content.js  # ランダム画像・テキスト
│           ├── random-404.js      # 404用ランダムテキスト
│           └── lightbox.js        # 画像拡大表示
└── hugo.toml
```

## テーマの特徴

- 1カラム・中央寄せレイアウト (max-width: 800px)
- ヘッダーロゴ画像 + サブタイトル
- チルダ (~) 装飾のタブメニュー
- ドットパターン背景
- ホームにランダム画像・ポエム表示
- クリックで画像拡大 (ライトボックス)
- 青モノクロ配色 (#DDDDEE / #6666AA / #4444AA / #333366)
- OGP対応（Twitter Card / Open Graph）
- 記事画像にオーバーレイ自動合成
- サムネイル自動抽出（記事一覧）
- 404ページ（ランダムポエム）

## 使い方

### 開発サーバー起動

```sh
hugo server --disableFastRender
```

### ビルド

```sh
hugo
```

### 記事の追加（Page Bundle形式）

```sh
mkdir -p content/posts/my-article
touch content/posts/my-article/index.md
```

Front matter:

```yaml
---
title: "記事タイトル"
date: 2026-02-04
tags: ["hugo", "web"]
ogpImage: "thumbnail.png"  # 任意：OGP/サムネイル画像を明示指定
---
```

画像は同じフォルダに配置し、相対パスで参照:

```markdown
![説明](./image.png)
```

### ホーム画像の追加

1. `static/images/Headers/` に jpg を配置
2. `themes/retro-theme/static/js/random-content.js` の `images` 配列にパスを追加
3. 404用も変更する場合は `random-404.js` も更新

### OGP画像のカスタマイズ

- **トップページ:** `static/images/top_page.png` (1200x630px推奨)
- **記事ページ:** 自動で記事内の最初の画像を使用、または `ogpImage` で指定
- **オーバーレイ:** `assets/images/ogp-overlay.png` (1200x630px、透過PNG)

## ライセンス

画像素材: [publicdomainq.net](https://publicdomainq.net)
