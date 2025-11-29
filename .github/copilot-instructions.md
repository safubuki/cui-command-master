# CUI Typing Master - Copilot Instructions

## プロジェクト概要
CUI操作（Linux, Git, Docker, Python, Network）を正確な構文と実務フローで習得するためのWebトレーニングアプリです。React + TypeScript + Viteで構築され、GitHub Pagesでホスティングされます。

## 技術スタック
- **フレームワーク**: React 18 + TypeScript
- **ビルドツール**: Vite
- **状態管理**: React Context + useReducer
- **スタイリング**: CSS Modules
- **デプロイ**: GitHub Pages (GitHub Actions)

## プロジェクト構造
```
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

## コーディング規約

### TypeScript
- 厳密な型付けを使用する（`any`は避ける）
- インターフェースは明確に定義し、`src/types/index.ts`に集約
- 関数にはJSDocコメントを付与

### React
- 関数コンポーネントとフックを使用
- `useReducer`でグローバル状態を管理
- CSS Modulesでスタイルを管理

### コメント
- 日本語でコメントを記述
- 複雑なロジックには説明を追加

## 主要な概念

### Dynamic Variable System
ファイル名、ディレクトリ名、IPアドレス等は毎回ランダム生成して暗記を防止します。
- `{filename}` → `report.txt`
- `{ip}` → `192.168.1.100`
- `{container}` → `nginx-web`

### コマンド判定
各コマンドは`COMMAND_DEFS`で定義され、`check`関数で入力を検証します。
- トークナイザでコマンドを分解
- オプションの順序は柔軟に対応（`-la`と`-al`は同等）
- エラーメッセージは日本語で具体的に

### モード
1. **Arcade**: ランダムな単一コマンド練習
2. **Scenario**: 3〜5ステップの実務フロー練習

## 新機能追加時のガイドライン

### 新しいコマンドの追加
1. `src/data/commandDefs.ts`に`CommandDef`を追加
2. `check`関数で検証ロジックを実装
3. `src/data/arcadeTasks.ts`に対応タスクを追加

### 新しいシナリオの追加
1. `src/data/scenarios.ts`の`SCENARIOS`配列に追加
2. `requiredVars`に必要な動的変数を指定
3. 各ステップの`taskHint`, `formatHint`, `expectation`を記述

## テスト
- Vitestを使用
- コンポーネントテストはReact Testing Library

## デプロイ
- `main`ブランチへのプッシュで自動デプロイ
- GitHub Actionsで`npm run build`を実行
- `dist/`フォルダがGitHub Pagesに公開
