# CUI Typing Master

CUI操作（Linux, Git, Docker, Python, Network）を正確な構文と実務フローで習得するためのWebトレーニングアプリです。

## ✨ 特徴

- **🎮 Arcade Mode**: ランダムに出題されるコマンドを入力して練習
- **📖 Scenario Mode**: 実務で使う一連のコマンドフローを練習
- **🔄 Dynamic Variable System**: ファイル名やIPアドレスが毎回変わり、暗記を防止
- **💡 段階的ヒント**: フォーマットヒントで構文を確認
- **📊 統計機能**: 正答率や苦手コマンドを可視化

## 🚀 環境構築

### 必要な環境

- Node.js 20.x 以上
- npm 9.x 以上

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/<username>/typing_command.git
cd typing_command

# 依存関係をインストール
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開いてください。

## 📖 利用手順

### Arcade Mode

1. 画面上部の「🎮 Arcade」タブをクリック
2. カテゴリを選択（すべて / Linux / Git / Docker / Python / Network）
3. 表示されたお題に従ってコマンドを入力
4. Enterキーで送信
5. 正解すると次の問題が出題されます

### Scenario Mode

1. 画面上部の「📖 Scenario」タブをクリック
2. 練習したいシナリオを選択
3. 各ステップのお題に従ってコマンドを入力
4. すべてのステップを完了するとシナリオ達成

### ヒント機能

- **フォーマットヒント**: コマンドの基本構文を表示
- **もっとヒント**: 追加のヒントを表示（完全な答えは表示されません）

### 履歴機能

- ↑キー: 前のコマンド履歴を表示
- ↓キー: 次のコマンド履歴を表示

## 🌐 GitHub Pages へのデプロイ

### 自動デプロイ（推奨）

1. GitHubリポジトリの Settings → Pages を開く
2. Source を「GitHub Actions」に変更
3. `main`ブランチにプッシュすると自動でデプロイされます

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 公開URL

```text
https://<username>.github.io/typing_command/
```

### 手動デプロイ

```bash
# ビルド
npm run build

# dist フォルダの内容を任意のホスティングサービスにアップロード
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

# テスト
npm run test
```

## 📁 プロジェクト構成

```text
src/
├── main.tsx              # エントリーポイント
├── App.tsx               # メインコンポーネント
├── components/           # UIコンポーネント
│   ├── Terminal/         # ターミナルUI
│   ├── Hint/             # ヒントパネル
│   ├── Mode/             # モード切替・選択
│   └── Score/            # スコア表示
├── context/              # グローバル状態管理
├── hooks/                # カスタムフック
├── data/                 # コマンド・タスク定義
├── lib/                  # ユーティリティ
├── types/                # 型定義
└── styles/               # グローバルスタイル
```

## 🎯 対応コマンド

### Linux

- ファイル操作: `ls`, `cd`, `pwd`, `mkdir`, `rm`, `cp`, `mv`, `touch`, `cat`
- システム: `ps`, `top`, `kill`, `df`, `free`

### Git

- `git status`, `git add`, `git commit`, `git push`, `git pull`, `git log`

### Docker

- `docker ps`, `docker run`, `docker stop`, `docker rm`, `docker rmi`
- `docker compose up`, `docker compose down`

### Python

- `python3 -m venv`, `source`, `pip install`, `pip list`

### Network

- `ping`, `ssh`, `scp`, `exit`

## 📝 ライセンス

MIT License

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 新しいブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成
