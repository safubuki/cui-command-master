# CUI Command Master

🐢 **指が覚える、本物のコマンド力。**

CUI操作（Linux, Network, Python, Git, Docker）を正確な構文と実務フローで習得するためのWebトレーニングアプリです。

## ✨ 特徴

- **📖 ミニシナリオ形式**: 3〜4ステップの実務フローでコマンドを練習
- **🔄 Dynamic Variable System**: ファイル名・IPアドレス・コンテナ名が毎回変わり、暗記を防止
- **🖥️ 仮想ターミナル**: コマンド実行をシミュレーションし、結果を表示
- **💡 ヒント機能**: フォーマットヒントで構文を確認
- **📚 解説・応用パターン**: 正解後にコマンドの活用シーンと応用例を表示
- **📊 統計機能**: 正答率や回答数を可視化

## 🚀 環境構築

### 必要な環境

- Node.js 20.x 以上
- npm 9.x 以上

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/safubuki/cui-command-master.git
cd cui-command-master

# 依存関係をインストール
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開いてください。

## 📖 利用手順

### 基本的な使い方

1. 画面上部のカテゴリボタンで練習したい分野を選択
   - **すべて**: 全カテゴリからランダムに出題
   - **Linux**: ファイル操作・システム管理
   - **Network**: SSH・SCP・ping
   - **Python**: 仮想環境・pip管理
   - **Git**: バージョン管理
   - **Docker**: コンテナ操作
2. ミニシナリオ（3〜4ステップ）が開始
3. 各ステップのお題に従ってコマンドを入力
4. Enterキーで送信、正解すると次のステップへ
5. すべてのステップを完了すると次のシナリオが自動で開始

### ヒント機能

- **💡 ヒント**: コマンドの基本構文と説明を表示
- **📚 解説・応用パターン**: 正解後に表示、実務での活用シーンを学習

### ターミナル機能

- コマンドを入力すると実行結果がシミュレーション表示されます
- ↑↓キーで履歴を表示
- スキップボタンで次のシナリオへ移動可能

## 🌐 GitHub Pages へのデプロイ

### 自動デプロイ（推奨）

1. GitHubリポジトリの Settings → Pages を開く
2. Source を「GitHub Actions」に変更
3. `main`ブランチにプッシュすると自動でデプロイされます

```bash
git add .
git commit -m "Update"
git push origin main
```

### 公開URL

```text
https://safubuki.github.io/cui-command-master/
```

## 🛠️ 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# ビルド結果のプレビュー
npm run preview

# リント
npm run lint
```

## 📁 プロジェクト構成

```text
src/
├── main.tsx              # エントリーポイント
├── App.tsx               # メインコンポーネント
├── components/           # UIコンポーネント
│   ├── Terminal/         # ターミナルUI
│   ├── Hint/             # ヒントパネル
│   └── Score/            # スコア表示
├── context/              # グローバル状態管理
├── data/                 # コマンド・シナリオ定義
│   ├── miniScenarios.ts  # ミニシナリオ定義
│   ├── commandDefs.ts    # コマンド検証定義
│   └── commandTips.ts    # コマンド解説
├── lib/                  # ユーティリティ
│   ├── commandExecutor.ts # コマンド実行シミュレーション
│   ├── vfs.ts            # 仮想ファイルシステム
│   └── dynamicVars.ts    # 動的変数生成
├── types/                # 型定義
└── styles/               # グローバルスタイル
```

## 🎯 対応コマンド

### Linux

- ファイル操作: `ls`, `cd`, `pwd`, `mkdir`, `rm`, `cp`, `mv`, `touch`, `cat`, `grep`
- システム: `ps`, `top`, `kill`, `df`, `free`

### Network

- `ping`, `ssh`, `scp`, `wget`, `curl`, `exit`

### Python

- `python3 -m venv`, `source <venv>/bin/activate`, `deactivate`
- `pip install`, `pip list`, `pip freeze`

### Git

- `git status`, `git add`, `git commit`, `git push`, `git pull`, `git log`
- `git branch`, `git checkout`, `git diff`, `git stash`

### Docker

- `docker ps`, `docker images`, `docker run`, `docker stop`, `docker rm`, `docker rmi`
- `docker pull`, `docker logs`, `docker exec`
- `docker compose up`, `docker compose down`

## 📝 ライセンス

MIT License

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 新しいブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成
