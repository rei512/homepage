# ΔV Lab

個人ブログサイト。Hugo + 自作テーマ (retro-theme) で構築。

## 構成

```
new_blog/
├── content/
│   ├── about.md
│   ├── posts/          # ブログ記事
│   └── projects/       # プロジェクト紹介
├── static/
│   └── images/
│       └── Headers/    # ホーム画像（ランダム表示）
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
│   │   │   └── tab-menu.html   # タブナビゲーション
│   │   └── index.html          # ホームページ
│   └── static/
│       ├── css/main.css
│       └── js/
│           ├── random-content.js  # ランダム画像・テキスト
│           └── lightbox.js        # 画像拡大表示
└── hugo.toml
```

## テーマの特徴

- 1カラム・中央寄せレイアウト (max-width: 800px)
- 明朝体サイトタイトル
- チルダ (~) 装飾のタブメニュー
- ドットパターン背景
- ホームにランダム画像・ポエム表示
- クリックで画像拡大 (ライトボックス)
- 青モノクロ配色 (#DDDDEE / #6666AA / #4444AA / #333366)

## 使い方

### 開発サーバー起動

```sh
hugo server --disableFastRender
```

### ビルド

```sh
hugo
```

### 記事の追加

```sh
hugo new posts/2026/my-article.md
```

Front matter で `tags` を指定:

```yaml
---
title: "記事タイトル"
date: 2026-02-04
tags: ["hugo", "web"]
---
```

### ホーム画像の追加

`static/images/Headers/` に jpg を配置し、`themes/retro-theme/static/js/random-content.js` の `images` 配列にパスを追加。

## ライセンス

画像素材: [publicdomainq.net](https://publicdomainq.net)
