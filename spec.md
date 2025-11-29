# CUI Command Trainer — React版 実装仕様書

> **目的**: CUI操作（Linux, Git, Docker, Python, Network）を正確な構文と実務フローで習得するための Web トレーニングアプリを React で実装し、GitHub Pages で公開する。

---

## 1. プロジェクト概要

### 1.1 コンセプト

- **名称**: 「CUI Typing Master」×「Micro Ops Simulator」
- **学習目標**:
  1. 正しいオプションと引数の順序（Syntax）を指に覚え込ませる
  2. 3〜5手の短い実務フロー（Workflow）を反復練習する
- **暗記防止**: ファイル名、ディレクトリ名、IPアドレス、コンテナID等は毎回ランダム生成（Dynamic Variable System）
- **ヒント設計**: ユーザーが「ノーヒントで完璧なコマンド」を打つことは想定せず、段階的なヒントを提供

### 1.2 技術スタック

| 項目 | 選定 | 理由 |
|------|------|------|
| フレームワーク | React 18 + TypeScript | 状態管理の明確化・型安全性 |
| ビルドツール | Vite | 高速開発・GitHub Pages向け静的出力 |
| 状態管理 | React Context + useReducer | グローバル状態（モード、VFS、スコア等）の共有 |
| スタイリング | CSS Modules | コンポーネント単位のスタイル分離 |
| デプロイ | GitHub Pages | 無料ホスティング・GitHub Actions連携 |
| テスト | Vitest + Testing Library | 軽量・Vite親和性 |

### 1.3 動作環境

- Node.js 20.x 以上
- モダンブラウザ（Chrome, Firefox, Safari, Edge 最新版）
- レスポンシブ対応（768px以上: 2カラム、モバイル: 縦積み）

---

## 2. GitHub Pages 公開設定

### 2.1 Vite 設定

```typescript
// vite.config.ts
export default defineConfig({
  base: '/typing_command/',  // リポジトリ名に合わせる
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
});
```

### 2.2 GitHub Actions ワークフロー

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

### 2.3 公開手順

1. GitHub リポジトリの Settings → Pages で Source を「GitHub Actions」に設定
2. `main` ブランチにプッシュすると自動デプロイ
3. 公開URL: `https://<username>.github.io/typing_command/`

---

## 3. ディレクトリ構成

```
typing_command/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions デプロイ設定
├── public/
│   └── favicon.ico
├── src/
│   ├── main.tsx                # エントリーポイント
│   ├── App.tsx                 # メインレイアウト
│   ├── components/
│   │   ├── Terminal/
│   │   │   ├── Terminal.tsx          # ターミナルUI全体
│   │   │   ├── TerminalOutput.tsx    # 出力表示エリア
│   │   │   ├── TerminalInput.tsx     # コマンド入力欄
│   │   │   └── Terminal.module.css
│   │   ├── Hint/
│   │   │   ├── HintPanel.tsx         # ヒント表示パネル
│   │   │   ├── FormatHint.tsx        # フォーマットヒント
│   │   │   └── Hint.module.css
│   │   ├── Mode/
│   │   │   ├── ModeSwitcher.tsx      # モード切替タブ
│   │   │   ├── ArcadeMode.tsx        # Arcadeモード画面
│   │   │   ├── ScenarioMode.tsx      # Scenarioモード画面
│   │   │   └── CategoryFilter.tsx    # カテゴリフィルタ
│   │   ├── Score/
│   │   │   ├── ScoreBoard.tsx        # スコア表示
│   │   │   └── WeakCommandList.tsx   # 苦手コマンド一覧
│   │   ├── Scenario/
│   │   │   ├── ScenarioProgress.tsx  # ステップ進行表示
│   │   │   └── ScenarioList.tsx      # シナリオ選択
│   │   └── Common/
│   │       ├── Button.tsx
│   │       ├── Modal.tsx             # 解説モーダル
│   │       └── Common.module.css
│   ├── hooks/
│   │   ├── useTokenizer.ts           # コマンドトークナイズ
│   │   ├── useCommandJudge.ts        # コマンド判定
│   │   ├── useVFS.ts                 # VFS操作
│   │   ├── useDynamicVars.ts         # 動的変数生成
│   │   └── useLocalStorage.ts        # 永続化
│   ├── context/
│   │   ├── AppContext.tsx            # グローバル状態
│   │   ├── ScenarioContext.tsx       # シナリオ進行状態
│   │   └── types.ts                  # 型定義
│   ├── data/
│   │   ├── commandDefs.ts            # コマンド定義
│   │   ├── arcadeTasks.ts            # Arcadeタスク集
│   │   ├── scenarios.ts              # シナリオ定義
│   │   └── randomPools.ts            # ランダム値候補
│   ├── lib/
│   │   ├── tokenizer.ts              # トークナイザ実装
│   │   ├── vfs.ts                    # VFS実装
│   │   ├── dynamicVars.ts            # 動的変数処理
│   │   └── analytics.ts              # 統計処理
│   ├── styles/
│   │   ├── globals.css               # 全体スタイル
│   │   └── variables.css             # CSS変数
│   └── types/
│       └── index.ts                  # 共通型定義
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 4. データモデル定義

### 4.1 Dynamic Variable System

```typescript
// src/types/index.ts

/** 動的変数のキー種別 */
export type DynamicKey = 
  | 'filename'      // ファイル名 (例: report.txt, data.csv)
  | 'dir'           // ディレクトリ名 (例: logs, backup)
  | 'src_file'      // コピー元ファイル
  | 'dest_dir'      // コピー先ディレクトリ
  | 'ip'            // IPアドレス (例: 192.168.1.100)
  | 'container'     // コンテナ名/ID (例: nginx-web, abc123)
  | 'image'         // イメージ名 (例: nginx:latest)
  | 'user'          // ユーザー名 (例: admin, devuser)
  | 'port'          // ポート番号 (例: 8080, 3000)
  | 'branch'        // Gitブランチ名 (例: feature/login)
  | 'commit_msg'    // コミットメッセージ
  | 'venv_name'     // 仮想環境名 (例: myenv, venv)
  | 'package';      // パッケージ名 (例: requests, numpy)

/** 動的変数のコンテキスト */
export type DynamicContext = Partial<Record<DynamicKey, string>>;

/** プレースホルダー置換関数 */
// {filename} → 実際の値に置換
export function hydrateTemplate(template: string, ctx: DynamicContext): string;
```

### 4.2 コマンド定義 (COMMAND_DEFS)

```typescript
// src/data/commandDefs.ts

/** コマンドカテゴリ */
export type CommandCategory = 'Linux' | 'Git' | 'Docker' | 'Python' | 'Network';

/** 判定結果 */
export interface JudgeResult {
  ok: boolean;
  messages: string[];           // エラーメッセージ配列
  errorType?: 'command' | 'option' | 'argument' | 'order' | 'extra' | 'missing';
}

/** 判定時コンテキスト */
export interface JudgeContext {
  vfs: VFSState;                // 仮想ファイルシステム状態
  dynamic: DynamicContext;      // 動的変数
  step?: ScenarioStep;          // シナリオステップ情報（あれば）
}

/** コマンド定義 */
export interface CommandDef {
  id: string;                   // 一意ID (例: 'rm', 'git.commit')
  command: string;              // コマンド名 (例: 'rm', 'git')
  subcommand?: string;          // サブコマンド (例: 'commit', 'add')
  category: CommandCategory;
  syntax: string;               // 人間向け構文 (例: "rm [-r|-rf] <target>")
  formatHint: string;           // ヒント用フォーマット (例: "rm -rf <dir>")
  description: string;          // 日本語解説
  
  /**
   * コマンド判定関数
   * @param tokens トークン配列 ['rm', '-rf', 'logs']
   * @param ctx 判定コンテキスト
   * @returns 判定結果
   */
  check(tokens: string[], ctx: JudgeContext): JudgeResult;
}

/** コマンド定義マップ */
export const COMMAND_DEFS: Record<string, CommandDef> = {
  // ============================================
  // File Operations
  // ============================================
  
  'ls': {
    id: 'ls',
    command: 'ls',
    category: 'Linux',
    syntax: 'ls [-a] [-l] [-h] [path]',
    formatHint: 'ls [オプション] [パス]',
    description: 'ディレクトリの内容を一覧表示します。-a: 隠しファイル表示、-l: 詳細表示、-h: サイズを人間が読みやすい形式で表示',
    check(tokens, ctx) {
      // 実装: オプション順序チェック、パス存在チェック等
    }
  },
  
  'cp': {
    id: 'cp',
    command: 'cp',
    category: 'Linux',
    syntax: 'cp <source> <destination>',
    formatHint: 'cp <コピー元> <コピー先>',
    description: 'ファイルまたはディレクトリをコピーします。引数の順序: 元 → 先',
    check(tokens, ctx) {
      // 実装: source/dest順序チェック
      // エラー例: "source と dest の順序が逆です"
    }
  },
  
  'rm': {
    id: 'rm',
    command: 'rm',
    category: 'Linux',
    syntax: 'rm [-r|-rf] <target>',
    formatHint: 'rm -rf <削除対象>',
    description: 'ファイルまたはディレクトリを削除します。ディレクトリ削除には -r オプションが必要です',
    check(tokens, ctx) {
      // 実装: ディレクトリに対する -r チェック
      // エラー例: "これはディレクトリです。-r オプションが必要です"
    }
  },
  
  // ... 他のコマンド定義
  
  // ============================================
  // Git Commands
  // ============================================
  
  'git.status': {
    id: 'git.status',
    command: 'git',
    subcommand: 'status',
    category: 'Git',
    syntax: 'git status',
    formatHint: 'git status',
    description: 'ワーキングツリーの状態を表示します',
    check(tokens, ctx) { /* ... */ }
  },
  
  'git.commit': {
    id: 'git.commit',
    command: 'git',
    subcommand: 'commit',
    category: 'Git',
    syntax: 'git commit -m "<message>"',
    formatHint: 'git commit -m "<メッセージ>"',
    description: 'ステージされた変更をコミットします。-m オプションでメッセージを指定',
    check(tokens, ctx) { /* ... */ }
  },
  
  // ============================================
  // Docker Commands
  // ============================================
  
  'docker.ps': {
    id: 'docker.ps',
    command: 'docker',
    subcommand: 'ps',
    category: 'Docker',
    syntax: 'docker ps [-a]',
    formatHint: 'docker ps [-a]',
    description: 'コンテナ一覧を表示します。-a: 停止中のコンテナも表示',
    check(tokens, ctx) { /* ... */ }
  },
  
  // ... 他のDockerコマンド
};
```

### 4.3 Arcadeタスク定義

```typescript
// src/data/arcadeTasks.ts

export interface ArcadeTask {
  id: string;
  commandId: string;            // 対応するCOMMAND_DEFSのキー
  category: CommandCategory;
  taskTemplate: string;         // 日本語タスク説明（プレースホルダー含む）
  formatHint: string;           // フォーマットヒント
  expectation: string;          // 期待コマンド（プレースホルダー含む）
  requiredVars: DynamicKey[];   // 必要な動的変数
  difficulty: 1 | 2 | 3;        // 難易度
}

export const ARCADE_TASKS: ArcadeTask[] = [
  // ============================================
  // Linux 基本操作
  // ============================================
  {
    id: 'linux-mkdir-1',
    commandId: 'mkdir',
    category: 'Linux',
    taskTemplate: '`/home/user` 配下に `{dir}` フォルダを作成しなさい',
    formatHint: 'mkdir <ディレクトリ名>',
    expectation: 'mkdir {dir}',
    requiredVars: ['dir'],
    difficulty: 1,
  },
  {
    id: 'linux-cp-1',
    commandId: 'cp',
    category: 'Linux',
    taskTemplate: '`{src_file}` を `{dest_dir}` にコピーしなさい',
    formatHint: 'cp <コピー元> <コピー先>',
    expectation: 'cp {src_file} {dest_dir}',
    requiredVars: ['src_file', 'dest_dir'],
    difficulty: 1,
  },
  {
    id: 'linux-rm-dir-1',
    commandId: 'rm',
    category: 'Linux',
    taskTemplate: '`{dir}` ディレクトリを削除しなさい',
    formatHint: 'rm -rf <ディレクトリ>',
    expectation: 'rm -rf {dir}',
    requiredVars: ['dir'],
    difficulty: 2,
  },
  
  // ============================================
  // Git操作
  // ============================================
  {
    id: 'git-commit-1',
    commandId: 'git.commit',
    category: 'Git',
    taskTemplate: '「{commit_msg}」というメッセージでコミットしなさい',
    formatHint: 'git commit -m "<メッセージ>"',
    expectation: 'git commit -m "{commit_msg}"',
    requiredVars: ['commit_msg'],
    difficulty: 2,
  },
  
  // ============================================
  // Docker操作
  // ============================================
  {
    id: 'docker-stop-1',
    commandId: 'docker.stop',
    category: 'Docker',
    taskTemplate: 'コンテナ `{container}` を停止しなさい',
    formatHint: 'docker stop <コンテナ名>',
    expectation: 'docker stop {container}',
    requiredVars: ['container'],
    difficulty: 1,
  },
  
  // ... 他のタスク（各カテゴリ10問以上推奨）
];
```

### 4.4 シナリオ定義

```typescript
// src/data/scenarios.ts

export interface ScenarioStep {
  taskHint: string;             // 日本語タスク説明
  formatHint: string;           // フォーマットヒント
  expectation: string;          // 期待コマンド（プレースホルダー含む）
  commandId?: string;           // 対応COMMAND_DEF（カスタム判定時は省略可）
  validator?: (tokens: string[], ctx: JudgeContext) => JudgeResult;
}

export interface Scenario {
  id: string;
  title: string;                // 日本語タイトル
  description: string;          // 状況説明
  category: CommandCategory;
  steps: ScenarioStep[];
  requiredVars: DynamicKey[];   // シナリオ全体で必要な動的変数
  
  /** シナリオ開始時の初期化（VFS等） */
  onEnter(ctx: ScenarioContext): ScenarioContext;
  
  /** シナリオ完了時の処理 */
  onComplete(ctx: ScenarioContext): void;
}

export const SCENARIOS: Scenario[] = [
  // ============================================
  // 1. System Maintenance（システムメンテナンス）
  // ============================================
  {
    id: 'system-maintenance',
    title: 'システムメンテナンス',
    description: 'ディスク容量を確認し、不要なログファイルを削除します。',
    category: 'Linux',
    requiredVars: ['dir', 'filename'],
    steps: [
      {
        taskHint: 'ディスク容量の状況を確認しなさい',
        formatHint: 'df -h',
        expectation: 'df -h',
        commandId: 'df',
      },
      {
        taskHint: '`{dir}` ディレクトリの中身を確認しなさい',
        formatHint: 'ls -la <ディレクトリ>',
        expectation: 'ls -la {dir}',
        commandId: 'ls',
      },
      {
        taskHint: '`{dir}` ディレクトリを削除しなさい',
        formatHint: 'rm -rf <ディレクトリ>',
        expectation: 'rm -rf {dir}',
        commandId: 'rm',
      },
    ],
    onEnter(ctx) {
      // VFSに {dir} ディレクトリと中身を作成
      return ctx;
    },
    onComplete(ctx) {
      console.info('システムメンテナンス完了！');
    },
  },
  
  // ============================================
  // 2. Docker Environment Reset
  // ============================================
  {
    id: 'docker-reset',
    title: 'Docker環境リセット',
    description: '不要なDockerコンテナとイメージをクリーンアップします。',
    category: 'Docker',
    requiredVars: ['container', 'image'],
    steps: [
      {
        taskHint: '起動中のコンテナを確認しなさい',
        formatHint: 'docker ps',
        expectation: 'docker ps',
        commandId: 'docker.ps',
      },
      {
        taskHint: 'コンテナ `{container}` を停止しなさい',
        formatHint: 'docker stop <コンテナ名>',
        expectation: 'docker stop {container}',
        commandId: 'docker.stop',
      },
      {
        taskHint: 'コンテナ `{container}` を削除しなさい',
        formatHint: 'docker rm <コンテナ名>',
        expectation: 'docker rm {container}',
        commandId: 'docker.rm',
      },
      {
        taskHint: 'イメージ `{image}` を削除しなさい',
        formatHint: 'docker rmi <イメージ名>',
        expectation: 'docker rmi {image}',
        commandId: 'docker.rmi',
      },
    ],
    onEnter(ctx) { return ctx; },
    onComplete(ctx) {
      console.info('Docker環境リセット完了！');
    },
  },
  
  // ============================================
  // 3. Git Workflow
  // ============================================
  {
    id: 'git-workflow',
    title: 'Git基本ワークフロー',
    description: '変更をステージしてコミット、プッシュまでの流れを練習します。',
    category: 'Git',
    requiredVars: ['filename', 'commit_msg'],
    steps: [
      {
        taskHint: 'リポジトリの状態を確認しなさい',
        formatHint: 'git status',
        expectation: 'git status',
        commandId: 'git.status',
      },
      {
        taskHint: '`{filename}` をステージングエリアに追加しなさい',
        formatHint: 'git add <ファイル名>',
        expectation: 'git add {filename}',
        commandId: 'git.add',
      },
      {
        taskHint: '「{commit_msg}」というメッセージでコミットしなさい',
        formatHint: 'git commit -m "<メッセージ>"',
        expectation: 'git commit -m "{commit_msg}"',
        commandId: 'git.commit',
      },
      {
        taskHint: 'リモートリポジトリにプッシュしなさい',
        formatHint: 'git push',
        expectation: 'git push',
        commandId: 'git.push',
      },
    ],
    onEnter(ctx) { return ctx; },
    onComplete(ctx) {
      console.info('Gitワークフロー完了！');
    },
  },
  
  // ============================================
  // 4. Python Setup
  // ============================================
  {
    id: 'python-setup',
    title: 'Python仮想環境セットアップ',
    description: '仮想環境を作成し、パッケージをインストールします。',
    category: 'Python',
    requiredVars: ['venv_name', 'package'],
    steps: [
      {
        taskHint: '`{venv_name}` という名前で仮想環境を作成しなさい',
        formatHint: 'python3 -m venv <環境名>',
        expectation: 'python3 -m venv {venv_name}',
        commandId: 'python.venv',
      },
      {
        taskHint: '仮想環境を有効化しなさい',
        formatHint: 'source <環境名>/bin/activate',
        expectation: 'source {venv_name}/bin/activate',
        commandId: 'source',
      },
      {
        taskHint: '`{package}` パッケージをインストールしなさい',
        formatHint: 'pip install <パッケージ名>',
        expectation: 'pip install {package}',
        commandId: 'pip.install',
      },
    ],
    onEnter(ctx) { return ctx; },
    onComplete(ctx) {
      console.info('Python環境セットアップ完了！');
    },
  },
  
  // ============================================
  // 5. Remote Operation
  // ============================================
  {
    id: 'remote-operation',
    title: 'リモートサーバー操作',
    description: 'リモートサーバーへの接続とファイル転送を練習します。',
    category: 'Network',
    requiredVars: ['ip', 'user', 'filename'],
    steps: [
      {
        taskHint: 'サーバー `{ip}` への疎通を確認しなさい',
        formatHint: 'ping <IPアドレス>',
        expectation: 'ping {ip}',
        commandId: 'ping',
      },
      {
        taskHint: 'ユーザー `{user}` で `{ip}` にSSH接続しなさい',
        formatHint: 'ssh <ユーザー>@<ホスト>',
        expectation: 'ssh {user}@{ip}',
        commandId: 'ssh',
      },
      {
        taskHint: '`{filename}` をリモートサーバーにコピーしなさい',
        formatHint: 'scp <ファイル> <ユーザー>@<ホスト>:<パス>',
        expectation: 'scp {filename} {user}@{ip}:~/',
        commandId: 'scp',
      },
    ],
    onEnter(ctx) { return ctx; },
    onComplete(ctx) {
      console.info('リモート操作完了！');
    },
  },
  
  // ============================================
  // ここにシナリオを追加できます
  // 以下のテンプレートをコピーして、新しいシナリオを作成してください
  // ============================================
  /*
  {
    id: 'new-scenario',
    title: '新しいシナリオ',
    description: 'シナリオの説明',
    category: 'Linux',
    requiredVars: ['var1', 'var2'],
    steps: [
      {
        taskHint: 'ステップ1の説明',
        formatHint: 'command <arg>',
        expectation: 'command {var1}',
        commandId: 'command-id',
      },
    ],
    onEnter(ctx) { return ctx; },
    onComplete(ctx) { console.info('完了！'); },
  },
  */
];
```

---

## 5. コアロジック実装

### 5.1 トークナイザ

```typescript
// src/lib/tokenizer.ts

/**
 * コマンド文字列をトークン配列に分解する
 * 
 * @example
 * tokenize('git commit -m "fix bug"')
 * // => ['git', 'commit', '-m', 'fix bug']
 * 
 * @param input ユーザー入力文字列
 * @returns トークン配列
 */
export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';
  
  for (const char of input.trim()) {
    if ((char === '"' || char === "'") && !inQuote) {
      inQuote = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuote) {
      inQuote = false;
      quoteChar = '';
    } else if (char === ' ' && !inQuote) {
      if (current) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }
  
  if (current) {
    tokens.push(current);
  }
  
  return tokens;
}

// TODO: パイプ(|)やリダイレクト(>, >>)は将来対応
// 現在は単一コマンドのみサポート
```

### 5.2 Virtual File System (VFS)

```typescript
// src/lib/vfs.ts

export interface VFSNode {
  type: 'file' | 'directory';
  name: string;
  children?: Record<string, VFSNode>;  // ディレクトリの場合
  content?: string;                     // ファイルの場合
}

export interface VFSState {
  root: VFSNode;
  currentPath: string;
}

/**
 * 仮想ファイルシステムの初期状態を作成
 */
export function createInitialVFS(): VFSState {
  return {
    root: {
      type: 'directory',
      name: '/',
      children: {
        home: {
          type: 'directory',
          name: 'home',
          children: {
            user: {
              type: 'directory',
              name: 'user',
              children: {},
            },
          },
        },
        tmp: {
          type: 'directory',
          name: 'tmp',
          children: {},
        },
      },
    },
    currentPath: '/home/user',
  };
}

/**
 * パスからノードを取得
 */
export function getNode(vfs: VFSState, path: string): VFSNode | null;

/**
 * ディレクトリを作成
 */
export function mkdir(vfs: VFSState, dirName: string): VFSState;

/**
 * ファイル/ディレクトリを削除
 */
export function rm(vfs: VFSState, target: string, recursive: boolean): VFSState;

/**
 * ファイルをコピー
 */
export function cp(vfs: VFSState, src: string, dest: string): VFSState;

/**
 * カレントディレクトリを変更
 */
export function cd(vfs: VFSState, path: string): VFSState;
```

### 5.3 動的変数生成

```typescript
// src/lib/dynamicVars.ts

import { DynamicContext, DynamicKey } from '../types';

/** ランダム値候補プール */
const POOLS: Record<DynamicKey, string[]> = {
  filename: ['report.txt', 'data.csv', 'config.json', 'app.log', 'notes.md'],
  dir: ['logs', 'backup', 'temp', 'cache', 'archive'],
  src_file: ['document.pdf', 'image.png', 'script.sh', 'readme.txt'],
  dest_dir: ['backup/', 'archive/', 'storage/', 'output/'],
  ip: ['192.168.1.100', '10.0.0.50', '172.16.0.10', '192.168.0.1'],
  container: ['nginx-web', 'mysql-db', 'redis-cache', 'app-server'],
  image: ['nginx:latest', 'mysql:8', 'redis:alpine', 'node:20'],
  user: ['admin', 'devuser', 'deploy', 'operator'],
  port: ['8080', '3000', '5000', '9000'],
  branch: ['feature/login', 'fix/bug-123', 'develop', 'hotfix/security'],
  commit_msg: ['Fix typo', 'Add feature', 'Update config', 'Refactor code'],
  venv_name: ['myenv', 'venv', 'devenv', 'testenv'],
  package: ['requests', 'numpy', 'flask', 'pandas'],
};

/**
 * 指定されたキーの動的変数を生成
 */
export function generateDynamicContext(keys: DynamicKey[]): DynamicContext {
  const ctx: DynamicContext = {};
  
  for (const key of keys) {
    const pool = POOLS[key];
    ctx[key] = pool[Math.floor(Math.random() * pool.length)];
  }
  
  return ctx;
}

/**
 * テンプレート文字列のプレースホルダーを置換
 * 
 * @example
 * hydrateTemplate('cp {src_file} {dest_dir}', { src_file: 'data.csv', dest_dir: 'backup/' })
 * // => 'cp data.csv backup/'
 */
export function hydrateTemplate(template: string, ctx: DynamicContext): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => ctx[key as DynamicKey] || `{${key}}`);
}
```

### 5.4 コマンド判定

```typescript
// src/hooks/useCommandJudge.ts

import { COMMAND_DEFS } from '../data/commandDefs';
import { tokenize } from '../lib/tokenizer';
import { JudgeResult, JudgeContext } from '../types';

/**
 * コマンド判定フック
 */
export function useCommandJudge() {
  
  /**
   * ユーザー入力を判定
   */
  const judge = (
    input: string,
    expectation: string,
    ctx: JudgeContext
  ): JudgeResult => {
    const userTokens = tokenize(input);
    const expectedTokens = tokenize(expectation);
    
    if (userTokens.length === 0) {
      return {
        ok: false,
        messages: ['コマンドが入力されていません'],
        errorType: 'missing',
      };
    }
    
    // コマンド名を取得
    const commandName = userTokens[0];
    
    // git, docker などサブコマンドを持つ場合
    const subcommand = userTokens[1];
    const defKey = subcommand && COMMAND_DEFS[`${commandName}.${subcommand}`]
      ? `${commandName}.${subcommand}`
      : commandName;
    
    const def = COMMAND_DEFS[defKey];
    
    if (!def) {
      return {
        ok: false,
        messages: [`不明なコマンドです: ${commandName}`],
        errorType: 'command',
      };
    }
    
    // コマンド固有の判定関数を実行
    return def.check(userTokens, ctx);
  };
  
  return { judge };
}
```

---

## 6. React コンポーネント設計

### 6.1 アプリ全体構造

```tsx
// src/App.tsx

import { AppProvider } from './context/AppContext';
import { Terminal } from './components/Terminal/Terminal';
import { HintPanel } from './components/Hint/HintPanel';
import { ModeSwitcher } from './components/Mode/ModeSwitcher';
import { ScoreBoard } from './components/Score/ScoreBoard';

export function App() {
  return (
    <AppProvider>
      <div className="app-container">
        <header>
          <h1>CUI Typing Master</h1>
          <ModeSwitcher />
        </header>
        
        <main className="main-layout">
          <section className="terminal-section">
            <Terminal />
          </section>
          
          <aside className="sidebar">
            <HintPanel />
            <ScoreBoard />
          </aside>
        </main>
      </div>
    </AppProvider>
  );
}
```

### 6.2 Context 設計

```typescript
// src/context/AppContext.tsx

interface AppState {
  mode: 'arcade' | 'scenario';
  vfs: VFSState;
  dynamic: DynamicContext;
  currentTask: ArcadeTask | null;
  currentScenario: Scenario | null;
  currentStepIndex: number;
  categoryFilter: CommandCategory | 'all';
  weakCommandMode: boolean;
  terminalHistory: TerminalLine[];
  commandStats: Record<string, { correct: number; total: number }>;
}

type AppAction =
  | { type: 'SET_MODE'; payload: 'arcade' | 'scenario' }
  | { type: 'SET_CATEGORY_FILTER'; payload: CommandCategory | 'all' }
  | { type: 'NEW_ARCADE_TASK' }
  | { type: 'START_SCENARIO'; payload: string }
  | { type: 'ADVANCE_STEP' }
  | { type: 'SUBMIT_COMMAND'; payload: string }
  | { type: 'UPDATE_VFS'; payload: VFSState }
  | { type: 'RECORD_RESULT'; payload: { commandId: string; correct: boolean } };
```

### 6.3 主要コンポーネント

#### Terminal コンポーネント

```tsx
// src/components/Terminal/Terminal.tsx

export function Terminal() {
  const { state, dispatch } = useApp();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'SUBMIT_COMMAND', payload: input });
    setHistory(prev => [...prev, input]);
    setInput('');
  };
  
  const handleKeyDown = (e: KeyboardEvent) => {
    // ↑↓キーで履歴参照
  };
  
  return (
    <div className="terminal">
      <TerminalOutput lines={state.terminalHistory} />
      <form onSubmit={handleSubmit}>
        <span className="prompt">$ </span>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </form>
    </div>
  );
}
```

#### HintPanel コンポーネント

```tsx
// src/components/Hint/HintPanel.tsx

export function HintPanel() {
  const { state } = useApp();
  const [showExtraHint, setShowExtraHint] = useState(false);
  
  const currentHint = state.mode === 'arcade'
    ? state.currentTask
    : state.currentScenario?.steps[state.currentStepIndex];
  
  if (!currentHint) return null;
  
  return (
    <div className="hint-panel">
      <h3>📝 お題</h3>
      <p className="task-hint">{currentHint.taskHint}</p>
      
      <h4>💡 フォーマット</h4>
      <code className="format-hint">{currentHint.formatHint}</code>
      
      <button onClick={() => setShowExtraHint(true)}>
        もっとヒント
      </button>
      
      {showExtraHint && (
        <div className="extra-hint">
          {/* 追加ヒント（完全な正解は表示しない） */}
        </div>
      )}
    </div>
  );
}
```

---

## 7. UI/UX 要件

### 7.1 デザイン仕様

| 要素 | 仕様 |
|------|------|
| ターミナル背景 | `#1e1e1e`（ダークグレー） |
| フォント | `'Consolas', 'Monaco', monospace` |
| プロンプト | `$` + グリーン (`#4ec9b0`) |
| 正解表示 | グリーン (`#4caf50`) |
| エラー表示 | レッド (`#f44336`) |
| ヒントパネル | ライトグレー背景、サイドバー配置 |

### 7.2 レスポンシブ対応

```css
/* 768px以上: 2カラムレイアウト */
@media (min-width: 768px) {
  .main-layout {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 1rem;
  }
}

/* モバイル: 縦積み */
@media (max-width: 767px) {
  .main-layout {
    display: flex;
    flex-direction: column;
  }
}
```

### 7.3 アクセシビリティ

- 判定結果に `aria-live="polite"` を設定
- キーボード操作のみで全機能利用可能
- フォントサイズ調整UI（小/中/大）
- ハイコントラストモード対応

### 7.4 言語設定

- **UIテキスト**: 日本語
- **ターミナル出力**: 英語（実際のCUI環境を模倣）

---

## 8. 状態永続化

### 8.1 localStorage 保存項目

```typescript
interface PersistedState {
  commandStats: Record<string, { correct: number; total: number }>;
  completedScenarios: string[];
  preferences: {
    fontSize: 'small' | 'medium' | 'large';
    weakCommandMode: boolean;
    lastCategory: CommandCategory | 'all';
  };
}
```

### 8.2 苦手コマンド抽出

```typescript
/**
 * 正答率が閾値以下のコマンドを抽出
 */
export function getWeakCommands(
  stats: Record<string, { correct: number; total: number }>,
  threshold: number = 0.6
): string[] {
  return Object.entries(stats)
    .filter(([_, { correct, total }]) => total >= 3 && correct / total < threshold)
    .map(([id]) => id);
}
```

---

## 9. テスト戦略

### 9.1 単体テスト（Vitest）

```typescript
// src/lib/__tests__/tokenizer.test.ts

describe('tokenize', () => {
  it('基本的なコマンドをトークン化できる', () => {
    expect(tokenize('ls -la')).toEqual(['ls', '-la']);
  });
  
  it('引用符内のスペースを保持する', () => {
    expect(tokenize('git commit -m "fix bug"'))
      .toEqual(['git', 'commit', '-m', 'fix bug']);
  });
});

// src/data/__tests__/commandDefs.test.ts

describe('COMMAND_DEFS', () => {
  describe('cp', () => {
    it('正しい順序を受け入れる', () => {
      const result = COMMAND_DEFS['cp'].check(
        ['cp', 'source.txt', 'dest/'],
        mockContext
      );
      expect(result.ok).toBe(true);
    });
    
    it('逆順でエラーを返す', () => {
      // ...
    });
  });
});
```

### 9.2 コンポーネントテスト

```typescript
// src/components/__tests__/Terminal.test.tsx

describe('Terminal', () => {
  it('コマンド入力でsubmitイベントが発火する', () => {
    // ...
  });
  
  it('↑キーで履歴を参照できる', () => {
    // ...
  });
});
```

### 9.3 E2Eテスト（Playwright）

```typescript
// e2e/arcade.spec.ts

test('Arcadeモードで正解を入力すると次の問題に進む', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Arcade');
  // ...
});
```

---

## 10. 開発ガイドライン

### 10.1 新しいコマンドの追加手順

1. `src/data/commandDefs.ts` に `CommandDef` を追加
2. `check` 関数でトークン検証ロジックを実装
3. `src/data/arcadeTasks.ts` に対応する `ArcadeTask` を追加
4. 単体テストを追加

### 10.2 新しいシナリオの追加手順

1. `src/data/scenarios.ts` の `SCENARIOS` 配列に追加
2. 必要な動的変数を `requiredVars` に指定
3. 各ステップの `taskHint`, `formatHint`, `expectation` を記述
4. 必要に応じて `onEnter` でVFS初期化

### 10.3 コードスタイル

- ESLint + Prettier でフォーマット統一
- 日本語コメントで意図を説明
- 関数には JSDoc コメントを付与

---

## 11. 今後の拡張案

| 優先度 | 項目 | 説明 |
|--------|------|------|
| 高 | オプション順序柔軟化 | `-la` と `-al` 両方を正解にする |
| 中 | パイプ・リダイレクト対応 | `ls | grep` 等の複合コマンド |
| 中 | 多言語対応 | UI英語化、他言語追加 |
| 低 | マルチプレイヤー | ランキング・対戦機能 |
| 低 | 音声フィードバック | 正解/不正解の効果音 |

---

## 12. リリースチェックリスト

- [ ] `npm run lint` エラーなし
- [ ] `npm run test` 全パス
- [ ] `npm run build` 成功
- [ ] Lighthouse スコア 90以上（Performance, Accessibility, Best Practices）
- [ ] 動的変数が毎回変わることを確認
- [ ] 全シナリオをクリアできることを確認
- [ ] GitHub Pages で正常動作
- [ ] README.md に利用手順を記載

---

## 付録A: 対応コマンド一覧

### Linux 基本

| コマンド | 構文 | 説明 |
|----------|------|------|
| `ls` | `ls [-a] [-l] [-h] [path]` | ディレクトリ一覧表示 |
| `cd` | `cd <path>` | ディレクトリ移動 |
| `pwd` | `pwd` | カレントディレクトリ表示 |
| `mkdir` | `mkdir <dir>` | ディレクトリ作成 |
| `rm` | `rm [-r\|-rf] <target>` | ファイル/ディレクトリ削除 |
| `cp` | `cp <src> <dest>` | コピー |
| `mv` | `mv <src> <dest>` | 移動/リネーム |
| `touch` | `touch <file>` | ファイル作成 |
| `cat` | `cat <file>` | ファイル内容表示 |

### System

| コマンド | 構文 | 説明 |
|----------|------|------|
| `ps` | `ps [-aux]` | プロセス一覧 |
| `top` | `top` | リアルタイムプロセス監視 |
| `kill` | `kill <pid>` | プロセス終了 |
| `df` | `df [-h]` | ディスク使用量 |
| `free` | `free` | メモリ使用量 |

### Network

| コマンド | 構文 | 説明 |
|----------|------|------|
| `ping` | `ping <host>` | 疎通確認 |
| `ssh` | `ssh <user>@<host>` | リモート接続 |
| `scp` | `scp <src> <user>@<host>:<dest>` | ファイル転送 |
| `exit` | `exit` | 接続終了 |

### Git

| コマンド | 構文 | 説明 |
|----------|------|------|
| `git status` | `git status` | 状態確認 |
| `git add` | `git add <file>` | ステージング |
| `git commit` | `git commit -m "<msg>"` | コミット |
| `git push` | `git push` | プッシュ |
| `git log` | `git log` | 履歴表示 |

### Docker

| コマンド | 構文 | 説明 |
|----------|------|------|
| `docker ps` | `docker ps [-a]` | コンテナ一覧 |
| `docker run` | `docker run [-d] [-it] <image>` | コンテナ起動 |
| `docker stop` | `docker stop <container>` | コンテナ停止 |
| `docker rm` | `docker rm <container>` | コンテナ削除 |
| `docker rmi` | `docker rmi <image>` | イメージ削除 |
| `docker compose up` | `docker compose up [-d]` | Compose起動 |
| `docker compose down` | `docker compose down` | Compose停止 |

### Python

| コマンド | 構文 | 説明 |
|----------|------|------|
| `python3 -m venv` | `python3 -m venv <name>` | 仮想環境作成 |
| `source` | `source <venv>/bin/activate` | 仮想環境有効化 |
| `pip install` | `pip install <package>` | パッケージインストール |
| `pip list` | `pip list` | パッケージ一覧 |
