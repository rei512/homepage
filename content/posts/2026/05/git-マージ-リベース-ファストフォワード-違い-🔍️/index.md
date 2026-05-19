+++
title = 'Git マージ リベース ファストフォワード 違い 🔍️'
date = 2026-05-19T02:57:57+09:00
draft = false
categories = []
tags = ['git']
image = ''
description = 'ここに記事の解説'
ogpImage = ''
+++


 
``` * branch            master     -> FETCH_HEAD
   601c26f..dc58be5  master     -> origin/master
hint: You have divergent branches and need to specify how to reconcile them.
hint: You can do so by running one of the following commands sometime before
hint: your next pull:
hint: 
hint:   git config pull.rebase false  # merge
hint:   git config pull.rebase true   # rebase
hint:   git config pull.ff only       # fast-forward only
hint: 
hint: You can replace "git config" with "git config --global" to set a default
hint: preference for all repositories. You can also pass --rebase, --no-rebase,
hint: or --ff-only on the command line to override the configured default per
hint: invocation.
fatal: Need to specify how to reconcile divergent branches.
```

い　つ　も　の\




# Git: マージ / リベース / ファストフォワードの違い

ブランチを統合する操作は大きく分けて **merge** と **rebase** の2系統。さらに merge には条件によって **fast-forward** という特殊ケースがある。\

### マージ
2つのブランチの変更を統合するマージコミットを新たに作って合流させる。\
分岐して戻る\
### リベース
ブランチを切って編集したコミットを，リベース先の先端にくっつける\
コミットのハッシュが変わるため他の人(端末?)も弄るブランチをリベースしてはいけないらしい\
一直線\
### ファストフォワード
リベース先のコミットが分岐時から新たに作られていない場合，そのままリベース元がリベース先だったということにする．一直線．\


## 使い分けの指針(by Claude)
### マージ (--no-ff) を選ぶ場面
- **共有ブランチへの統合**（`develop` → `main`、PRマージなど）
- 機能単位の取り込みを履歴に残したいとき（後から「この機能はどのPRで入ったか」を辿れる）
- GitHub/GitLab の PR/MR でデフォルトのマージ方式
### リベースを選ぶ場面
- ローカルの `feature` ブランチを最新の `main` に追従させたいとき（`git pull --rebase` 含む）
- PRを出す前に、自分のコミット履歴を整理したいとき（`rebase -i`）
- 一直線の履歴ポリシーを採用しているチーム
### ファストフォワード を選ぶ場面
- 短命なトピックブランチで、`main` が進んでいないとき
- 履歴を極力シンプルに保ちたい個人プロジェクト
## よくあるワークフロー

### パターンA: rebase で追従 → FF でマージ（一直線派）
```bash
git checkout feature
git rebase main          # featureをmainの先端に積み直す
git checkout main
git merge feature        # FFで取り込み（マージコミットなし）
```

### パターンB: --no-ff でマージコミットを残す（分岐記録派）

```bash
git checkout main
git merge --no-ff feature   # 必ずマージコミットを作る
```

### パターンC: pull のたびに rebase
```bash
git pull --rebase origin main
# または恒久設定:
git config --global pull.rebase true
```

---

## 一行で言うと

- **Merge**: 分岐の歴史を残して合流。安全だが履歴が複雑化。
- **Rebase**: 歴史を書き換えて一直線化。きれいだが共有ブランチでは禁忌。
- **Fast-forward**: ポインタを進めるだけ。一番軽い。

愚直にマージ(no-rebase)するのが事故らない?\