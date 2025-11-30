/**
 * CUI Typing Master - 共通型定義
 */

/** 動的変数のキー種別（生成用） */
export type GeneratedDynamicKey =
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
  | 'package'       // パッケージ名 (例: requests, numpy)
  | 'pid';          // プロセスID

/** 動的変数のキー種別（内部キー含む） */
export type DynamicKey = GeneratedDynamicKey | '_homeDir';

/** 動的変数のコンテキスト */
export type DynamicContext = Partial<Record<DynamicKey, string>>;

/** ターミナル環境設定 */
export interface TerminalEnvironment {
  hostname: string;         // ホスト名 (例: ubuntu-server)
  username: string;         // ユーザー名 (例: user)
  homeDir: string;          // ホームディレクトリ (例: /home/user)
}

/** コマンド実行結果 */
export interface CommandExecutionResult {
  output: string[];         // 出力行の配列
  success: boolean;         // コマンドが成功したか
  newVfs?: VFSState;        // 更新されたVFS状態（変更があった場合）
}

/** コマンドカテゴリ */
export type CommandCategory = 'Linux' | 'Git' | 'Docker' | 'Python' | 'Network';

/** 判定結果のエラータイプ */
export type JudgeErrorType = 
  | 'command'     // コマンド名が間違い
  | 'subcommand'  // サブコマンドが間違い
  | 'option'      // オプションが間違い
  | 'argument'    // 引数が間違い
  | 'order'       // 順序が間違い
  | 'extra'       // 余分な要素
  | 'missing';    // 不足している要素

/** 判定結果 */
export interface JudgeResult {
  ok: boolean;
  messages: string[];           // エラーメッセージ配列
  errorType?: JudgeErrorType;
}

/** VFSノード */
export interface VFSNode {
  type: 'file' | 'directory';
  name: string;
  children?: Record<string, VFSNode>;  // ディレクトリの場合
  content?: string;                     // ファイルの場合
}

/** VFS状態 */
export interface VFSState {
  root: VFSNode;
  currentPath: string;
  /** 仮想環境の状態（Dockerコンテナ、Pythonパッケージなど） */
  virtualEnv?: VirtualEnvState;
}

/** 仮想環境の状態 */
export interface VirtualEnvState {
  /** インストール済みPythonパッケージ */
  installedPackages: string[];
  /** 実行中のDockerコンテナ */
  runningContainers: string[];
  /** ダウンロード済みDockerイメージ */
  pulledImages: string[];
  /** 現在アクティブなGitブランチ */
  currentBranch: string;
  /** 作成済みGitブランチ */
  branches: string[];
  /** Git stashスタック */
  stashStack: number;
  /** アクティブなPython仮想環境名（nullの場合は非アクティブ） */
  activePythonVenv: string | null;
}

/** 判定時コンテキスト */
export interface JudgeContext {
  vfs: VFSState;                // 仮想ファイルシステム状態
  dynamic: DynamicContext;      // 動的変数
  env: TerminalEnvironment;     // ターミナル環境
}

/** タスク完了条件 */
export interface TaskGoal {
  type: 'file-exists' | 'file-in-dir' | 'dir-exists' | 'current-dir' | 'command-executed';
  path?: string;                // 対象パス
  fileName?: string;            // ファイル名
  dirName?: string;             // ディレクトリ名
  commandPattern?: string;      // コマンドパターン（正規表現）
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

/** Arcadeタスク定義 */
export interface ArcadeTask {
  id: string;
  commandId: string;            // 対応するCOMMAND_DEFSのキー
  category: CommandCategory;
  taskTemplate: string;         // 日本語タスク説明（プレースホルダー含む）
  formatHint: string;           // フォーマットヒント
  expectation: string;          // 期待コマンド（プレースホルダー含む）
  requiredVars: GeneratedDynamicKey[];   // 必要な動的変数
  difficulty: 1 | 2 | 3;        // 難易度
  setupVfs?: (vfs: VFSState, dynamic: DynamicContext) => VFSState;  // VFS初期化関数
  goal?: TaskGoal;              // タスク完了条件（VFS状態判定用）
}

/** シナリオステップ */
export interface ScenarioStep {
  taskHint: string;             // 日本語タスク説明
  formatHint: string;           // フォーマットヒント
  expectation: string;          // 期待コマンド（プレースホルダー含む）
  commandId?: string;           // 対応COMMAND_DEF（カスタム判定時は省略可）
  validator?: (tokens: string[], ctx: JudgeContext) => JudgeResult;
  goal?: TaskGoal;              // ステップ完了条件
}

/** シナリオ定義 */
export interface Scenario {
  id: string;
  title: string;                // 日本語タイトル
  description: string;          // 状況説明
  category: CommandCategory;
  steps: ScenarioStep[];
  requiredVars: GeneratedDynamicKey[];   // シナリオ全体で必要な動的変数
  setupVfs?: (vfs: VFSState, dynamic: DynamicContext) => VFSState;  // VFS初期化関数
}

/** ターミナル行の種類 */
export type TerminalLineType = 'input' | 'output' | 'success' | 'error' | 'info';

/** ターミナル行 */
export interface TerminalLine {
  type: TerminalLineType;
  content: string;
  timestamp: number;
  /** 入力行の場合、その時点のプロンプトを保存 */
  prompt?: string;
}

/** コマンド統計 */
export interface CommandStats {
  correct: number;
  total: number;
}

/** 永続化される状態 */
export interface PersistedState {
  commandStats: Record<string, CommandStats>;
  completedScenarios: string[];
  preferences: {
    fontSize: 'small' | 'medium' | 'large';
    weakCommandMode: boolean;
    lastCategory: CommandCategory | 'all';
  };
}

/** アプリケーションモード */
export type AppMode = 'arcade' | 'scenario';

/** ヒント表示状態 */
export interface HintState {
  taskHint: string;
  formatHint: string;
  showExtraHint: boolean;
}
