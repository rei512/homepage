+++
title = 'Obsidian → Hugo 自動公開パイプライン'
date = 2026-05-13T03:49:14+09:00
draft = false
categories = ['Projects']
tags = ['Docker', 'Hugo', 'Obsidian', 'Python', '自動化', 'Cloudflare']
image = ''
description = 'Obsidian Syncで管理するVaultの記事を、任意のデバイスから書くだけでHugoブログへ自動変換・デプロイするパイプラインの設計と実装記録'
ogpImage = ''
+++

## 概要

Hugo + Cloudflare Pagesで運用している個人ブログへの記事投稿フローを自動化したシステムの設計・実装記録。\
Obsidian Syncで管理している公開専用Vaultの内容を，headlessサーバ上で受け取り，Hugoのフォーマットに変換してGitHubへpushする。\
Cloudflare Pagesがpushを検知して自動デプロイするところまでを含めたパイプライン全体をDockerで構成している。\

## 背景と要件

もともとGitHub PushをトリガーとしたCloudflare Pagesの自動デプロイは設定済みだった。\
問題はそこに至るまでのフロー——Obsidianで書いた記事をHugoのMarkdown形式に変換し，GitHubにpushするまでの工程——を毎回手動でこなしていたことにある。\

最初に立てた要件は次の通り。\

- 任意のデバイス（PC・スマートフォン）からObsidianクライアント1本で記事を書ける
- 既存のObsidian Sync契約を活かす
- 機密情報を含むメインVaultは絶対に外部に出さない
- ローカルに常駐サーバやデーモンを置きたくない
- 変更があったときだけデプロイが走ること

## 設計の変遷

当初はGitHub Actionsによる純粋クラウド完結構成を検討した。\
しかしObsidian Syncは独自プロトコルを採用しており，サードパーティからデータを取得できるAPIが存在しない。\
「Obsidian Syncのデータを外に出すには，動作中のObsidianが必要」という制約から，GitHub Actions単体での実現は構造的に不可能だった。\

次にEnveloppなどのObsidianプラグイン経由でGitHub APIに直接pushする案を検討したが，\
プラグインはObsidianが起動しているデバイスに依存するため「クラウド完結」の要件を満たさなかった。\

最終的に「Obsidian Syncのクライアントとして機能する常駐プロセスを1つだけ持つ」という方針に落ち着いた。\
これは要件の一部妥協ではあるが，Obsidian本体の操作フローには一切影響しないため，ユーザー体験上はほぼ透過的に機能する。\

## システム構成

```
[編集デバイス: Mac / PC / iPhone 等]
  ↕ Obsidian Sync (既存)
[Arch Linuxサーバ]
  ├─ ob-sync コンテナ: ob sync --continuous で常時同期
  └─ converter コンテナ: 1日1回，変換 → git push
[GitHub: Hugoリポジトリ]
  ↓ push検知
[Cloudflare Pages: 自動デプロイ (既存)]
```

コンテナは3つで構成されている。\

**ob-sync**: 公式のheadlessクライアント `obsidian-headless`（2026年2月リリース）を用いて，公開専用Vaultを `ob sync --continuous` で常時同期する。\

**converter**: 1日1回，VaultのMarkdownをHugo形式に変換してgit pushする。cronは使わず，`sleep 86400` のループで実装している。即時反映が必要な場合は `docker compose exec converter /opt/converter/run.sh` で手動起動できる。\

**hugo-dev**: `--profile dev` でのみ起動するオンデマンドサービス。テーマ開発・デバッグ用の `hugo server` を提供する。本番ビルドはCloudflare側に任せるため，ローカルの成果物は確認専用。\

3サービスとも同一Dockerイメージを異なるコマンドで起動する構成であり，Dockerfileは1枚に収まっている。\
イメージはNode.js 22（obsidian-headlessの要件）をベースに，Hugo extended（バージョン固定）とPython 3を積んでいる。\

## プライバシー設計

多層のフェイルセーフを設けている。\

まずVaultレベルで，機密情報を含むメインVaultはサーバに一切同期しない。\
`ob sync-setup` で公開専用Vaultのみを選択することで，物理的にデータが存在しない状態を作る。\

次にフォルダレベルで，公開Vault内の `posts/` または `projects/` 配下に置いたファイルのみがconverterの対象となる。\
下書きを別フォルダに置いておけばconverterには触れられない。\

最後にgitレベルで，converterの `git add` は `content/posts/` と `content/projects/` のみを対象にしている。\
テーマファイルの手動編集が誤ってpushされる事故を構造的に防いでいる。\

## 変換ロジック

converter（Python実装）が行う変換は主に3つ。\

**フロントマター変換**: ObsidianのYAML Propertiesを読み込み，Hugoテーマ準拠のTOML形式（`+++`区切り）で書き出す。日付はJST（+09:00）に変換する。フロントマターを持たないノートはファイル名とmtimeから最低限のフィールドを自動生成する。\

**画像Embed変換**: Obsidian固有の `![[image.png]]` 記法を標準Markdown記法に変換する。添付ファイルはVault内の `res/` フォルダを再帰的に探索して見つけ，各記事のPage Bundleディレクトリにコピーする。ファイル名にスペースが含まれる場合（Obsidianの貼り付け画像に多い）はハイフンに正規化する。\

**ハード改行挿入**: CommonMarkでは単一改行がスペースに変換されるため，テキスト行の末尾にバックスラッシュを挿入してハード改行とする。見出し・コードブロック・リスト・水平線・引用は除外する。\

## Hugo出力構造

セクションごとに異なるディレクトリ構造を取る。\

```
content/
├── posts/
│   └── YYYY/
│       └── MM/          ← 月単位でグループ化
│           └── {slug}/
│               └── index.md
└── projects/
    └── {slug}/          ← 日付なし，タイトルそのまま
        └── index.md
```

各記事はHugoのPage Bundle形式を採用しており，添付画像は `index.md` と同ディレクトリに配置される。\
これにより記事の削除・移動時に関連ファイルも一括管理できる。\

## 差分検知とgit履歴

converterはソースファイルのmtimeと出力ファイルのmtimeを比較し，変更のないファイルは変換処理ごとスキップする。\
gitのコミット対象はコンテンツが実際に変化したファイルのみであるため，git logは記事の実際の変更履歴を正確に反映する。\

記事のリネーム・移動はMARKERファイル（`.obsidian-sync`）による管理で追従する。\
旧bundleはcleanupで削除され，新bundleが生成される。git上ではdelete + addとなるためファイル単位の履歴は切れるが，ブログ記事の性質上リネームは稀であるため許容している。\

converterのロジック更新時など全ファイルを強制再変換したい場合は `FORCE_REBUILD=1` 環境変数で制御できる。\

## Hugoバージョン管理

ローカルのDocker環境とCloudflare Pages本番環境でHugoバージョンを固定・統一している。\
本プロジェクト構築時点ではHugo extended v0.161.1を使用。\
Cloudflare Pages側は環境変数 `HUGO_VERSION=0.161.1`，`HUGO_EXTENDED=true` で固定している。\

## 課題・今後

現状，記事のリネームはgit履歴が切れる問題が残っている。\
`git mv` を使ったリネーム追従はVault側の状態管理が必要になるため，実装コストと運用頻度を考慮して保留している。\

また `ob sync --continuous` プロセスのサイレント障害（プロセスは生きているがSyncが止まっている状態）の検知は現状手動ログ確認に依存しており，dead man's switchの仕組みを入れることが課題として残っている。\