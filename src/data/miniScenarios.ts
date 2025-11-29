/**
 * ミニシナリオ定義
 * Arcadeモードで3〜4ステップの連続問題を出題
 */

import { 
  CommandCategory, 
  GeneratedDynamicKey, 
  VFSState, 
  DynamicContext,
  JudgeContext,
  JudgeResult
} from '../types';
import { mkdir, touch, addFile } from '../lib/vfs';

/** ミニシナリオのステップ定義 */
export interface MiniScenarioStep {
  taskTemplate: string;         // 日本語タスク説明（プレースホルダー含む）
  formatHint: string;           // フォーマットヒント
  expectation: string;          // 期待コマンド（プレースホルダー含む）
  commandId: string;            // コマンドID
  validator?: (tokens: string[], ctx: JudgeContext) => JudgeResult;
}

/** ミニシナリオ定義 */
export interface MiniScenario {
  id: string;
  title: string;                // シナリオタイトル
  description: string;          // 簡単な説明
  category: CommandCategory;
  difficulty: 1 | 2 | 3;
  requiredVars: GeneratedDynamicKey[];
  steps: MiniScenarioStep[];
  setupVfs?: (vfs: VFSState, dynamic: DynamicContext, homeDir: string) => VFSState;
}

// ========================================
// Linux基礎シナリオ
// ========================================

const LINUX_SCENARIOS: MiniScenario[] = [
  {
    id: 'linux-file-ops-basic',
    title: 'ファイル操作基礎',
    description: 'ls, cp, rm の基本フロー',
    category: 'Linux',
    difficulty: 1,
    requiredVars: ['filename', 'dest_dir'],
    steps: [
      {
        taskTemplate: '現在のディレクトリのファイルを確認しなさい',
        formatHint: 'ls',
        expectation: 'ls',
        commandId: 'ls',
      },
      {
        taskTemplate: '`{filename}` を `{dest_dir}` にコピーしなさい',
        formatHint: 'cp <元ファイル> <コピー先>',
        expectation: 'cp {filename} {dest_dir}',
        commandId: 'cp',
      },
      {
        taskTemplate: '元の `{filename}` を削除しなさい',
        formatHint: 'rm <ファイル名>',
        expectation: 'rm {filename}',
        commandId: 'rm',
      },
    ],
    setupVfs: (vfs, dynamic, homeDir) => {
      const filename = dynamic.filename || 'file.txt';
      const destDir = dynamic.dest_dir || 'backup/';
      vfs = mkdir(vfs, `${homeDir}/${destDir.replace('/', '')}`);
      vfs = touch(vfs, `${homeDir}/${filename}`);
      vfs.currentPath = homeDir;
      return vfs;
    },
  },
  {
    id: 'linux-dir-navigation',
    title: 'ディレクトリ移動',
    description: 'mkdir, cd, pwd の基本フロー',
    category: 'Linux',
    difficulty: 1,
    requiredVars: ['dir'],
    steps: [
      {
        taskTemplate: '`{dir}` ディレクトリを作成しなさい',
        formatHint: 'mkdir <ディレクトリ名>',
        expectation: 'mkdir {dir}',
        commandId: 'mkdir',
      },
      {
        taskTemplate: '`{dir}` ディレクトリに移動しなさい',
        formatHint: 'cd <ディレクトリ名>',
        expectation: 'cd {dir}',
        commandId: 'cd',
      },
      {
        taskTemplate: '現在のディレクトリを確認しなさい',
        formatHint: 'pwd',
        expectation: 'pwd',
        commandId: 'pwd',
      },
      {
        taskTemplate: '親ディレクトリに戻りなさい',
        formatHint: 'cd ..',
        expectation: 'cd ..',
        commandId: 'cd',
      },
    ],
    setupVfs: (vfs, dynamic, homeDir) => {
      vfs.currentPath = homeDir;
      return vfs;
    },
  },
  {
    id: 'linux-file-content',
    title: 'ファイル内容確認',
    description: 'cat, grep でファイル内容を確認',
    category: 'Linux',
    difficulty: 1,
    requiredVars: ['filename'],
    steps: [
      {
        taskTemplate: '現在のディレクトリのファイルを確認しなさい',
        formatHint: 'ls',
        expectation: 'ls',
        commandId: 'ls',
      },
      {
        taskTemplate: '`{filename}` の内容を表示しなさい',
        formatHint: 'cat <ファイル名>',
        expectation: 'cat {filename}',
        commandId: 'cat',
      },
      {
        taskTemplate: '`{filename}` から "error" を含む行を検索しなさい',
        formatHint: 'grep <パターン> <ファイル>',
        expectation: 'grep error {filename}',
        commandId: 'grep',
      },
    ],
    setupVfs: (vfs, dynamic, homeDir) => {
      const filename = dynamic.filename || 'app.log';
      vfs = addFile(vfs, `${homeDir}/${filename}`, 
        'INFO: Application started\nerror: Connection failed\nINFO: Retrying...\nerror: Timeout\nINFO: Success');
      vfs.currentPath = homeDir;
      return vfs;
    },
  },
  {
    id: 'linux-move-rename',
    title: 'ファイル移動・リネーム',
    description: 'mv でファイルを移動・名前変更',
    category: 'Linux',
    difficulty: 2,
    requiredVars: ['src_file', 'dest_dir', 'filename'],
    steps: [
      {
        taskTemplate: '`{src_file}` を `{dest_dir}` に移動しなさい',
        formatHint: 'mv <元> <先>',
        expectation: 'mv {src_file} {dest_dir}',
        commandId: 'mv',
      },
      {
        taskTemplate: '`{dest_dir}` ディレクトリに移動しなさい',
        formatHint: 'cd <ディレクトリ>',
        expectation: 'cd {dest_dir}',
        commandId: 'cd',
      },
      {
        taskTemplate: 'ファイル一覧を確認しなさい',
        formatHint: 'ls',
        expectation: 'ls',
        commandId: 'ls',
      },
    ],
    setupVfs: (vfs, dynamic, homeDir) => {
      const srcFile = dynamic.src_file || 'data.txt';
      const destDir = dynamic.dest_dir || 'archive/';
      vfs = mkdir(vfs, `${homeDir}/${destDir.replace('/', '')}`);
      vfs = touch(vfs, `${homeDir}/${srcFile}`);
      vfs.currentPath = homeDir;
      return vfs;
    },
  },
  {
    id: 'linux-recursive-delete',
    title: 'ディレクトリ削除',
    description: 'rm -rf でディレクトリを削除',
    category: 'Linux',
    difficulty: 2,
    requiredVars: ['dir'],
    steps: [
      {
        taskTemplate: 'ファイル一覧を詳細表示しなさい',
        formatHint: 'ls -la',
        expectation: 'ls -la',
        commandId: 'ls',
      },
      {
        taskTemplate: '`{dir}` ディレクトリを再帰的に削除しなさい',
        formatHint: 'rm -rf <ディレクトリ>',
        expectation: 'rm -rf {dir}',
        commandId: 'rm',
      },
      {
        taskTemplate: '削除されたことを確認しなさい',
        formatHint: 'ls',
        expectation: 'ls',
        commandId: 'ls',
      },
    ],
    setupVfs: (vfs, dynamic, homeDir) => {
      const dir = dynamic.dir || 'temp';
      vfs = mkdir(vfs, `${homeDir}/${dir}`);
      vfs = touch(vfs, `${homeDir}/${dir}/file1.txt`);
      vfs = touch(vfs, `${homeDir}/${dir}/file2.txt`);
      vfs.currentPath = homeDir;
      return vfs;
    },
  },
];

// ========================================
// Git シナリオ
// ========================================

const GIT_SCENARIOS: MiniScenario[] = [
  {
    id: 'git-basic-commit',
    title: '基本コミットフロー',
    description: 'status, add, commit の基本フロー',
    category: 'Git',
    difficulty: 1,
    requiredVars: ['filename', 'commit_msg'],
    steps: [
      {
        taskTemplate: 'リポジトリの状態を確認しなさい',
        formatHint: 'git status',
        expectation: 'git status',
        commandId: 'git.status',
      },
      {
        taskTemplate: '`{filename}` をステージングエリアに追加しなさい',
        formatHint: 'git add <ファイル>',
        expectation: 'git add {filename}',
        commandId: 'git.add',
      },
      {
        taskTemplate: '"{commit_msg}" というメッセージでコミットしなさい',
        formatHint: 'git commit -m "<メッセージ>"',
        expectation: 'git commit -m "{commit_msg}"',
        commandId: 'git.commit',
      },
    ],
    setupVfs: (vfs, dynamic, homeDir) => {
      const filename = dynamic.filename || 'index.html';
      vfs = mkdir(vfs, `${homeDir}/project`);
      vfs = mkdir(vfs, `${homeDir}/project/.git`);
      vfs = touch(vfs, `${homeDir}/project/${filename}`);
      vfs.currentPath = `${homeDir}/project`;
      return vfs;
    },
  },
  {
    id: 'git-branch-workflow',
    title: 'ブランチ操作',
    description: 'branch, checkout でブランチを操作',
    category: 'Git',
    difficulty: 2,
    requiredVars: ['branch'],
    steps: [
      {
        taskTemplate: '現在のブランチ一覧を確認しなさい',
        formatHint: 'git branch',
        expectation: 'git branch',
        commandId: 'git.branch',
      },
      {
        taskTemplate: '`{branch}` ブランチを作成して切り替えなさい',
        formatHint: 'git checkout -b <ブランチ名>',
        expectation: 'git checkout -b {branch}',
        commandId: 'git.checkout',
      },
      {
        taskTemplate: 'ブランチが切り替わったことを確認しなさい',
        formatHint: 'git branch',
        expectation: 'git branch',
        commandId: 'git.branch',
      },
    ],
    setupVfs: (vfs, dynamic, homeDir) => {
      vfs = mkdir(vfs, `${homeDir}/project`);
      vfs = mkdir(vfs, `${homeDir}/project/.git`);
      vfs.currentPath = `${homeDir}/project`;
      return vfs;
    },
  },
  {
    id: 'git-view-history',
    title: 'コミット履歴確認',
    description: 'log, diff で履歴を確認',
    category: 'Git',
    difficulty: 1,
    requiredVars: ['filename'],
    steps: [
      {
        taskTemplate: 'コミット履歴を確認しなさい',
        formatHint: 'git log',
        expectation: 'git log',
        commandId: 'git.log',
      },
      {
        taskTemplate: '変更差分を確認しなさい',
        formatHint: 'git diff',
        expectation: 'git diff',
        commandId: 'git.diff',
      },
      {
        taskTemplate: 'リポジトリの状態を確認しなさい',
        formatHint: 'git status',
        expectation: 'git status',
        commandId: 'git.status',
      },
    ],
    setupVfs: (vfs, dynamic, homeDir) => {
      vfs = mkdir(vfs, `${homeDir}/project`);
      vfs = mkdir(vfs, `${homeDir}/project/.git`);
      vfs.currentPath = `${homeDir}/project`;
      return vfs;
    },
  },
  {
    id: 'git-stash-workflow',
    title: '変更の一時退避',
    description: 'stash で作業を一時保存',
    category: 'Git',
    difficulty: 2,
    requiredVars: [],
    steps: [
      {
        taskTemplate: '現在の変更を一時退避しなさい',
        formatHint: 'git stash',
        expectation: 'git stash',
        commandId: 'git.stash',
      },
      {
        taskTemplate: 'スタッシュの一覧を確認しなさい',
        formatHint: 'git stash list',
        expectation: 'git stash list',
        commandId: 'git.stash',
      },
      {
        taskTemplate: '退避した変更を戻しなさい',
        formatHint: 'git stash pop',
        expectation: 'git stash pop',
        commandId: 'git.stash',
      },
    ],
    setupVfs: (vfs, dynamic, homeDir) => {
      vfs = mkdir(vfs, `${homeDir}/project`);
      vfs = mkdir(vfs, `${homeDir}/project/.git`);
      vfs.currentPath = `${homeDir}/project`;
      return vfs;
    },
  },
];

// ========================================
// Docker シナリオ
// ========================================

const DOCKER_SCENARIOS: MiniScenario[] = [
  {
    id: 'docker-container-basic',
    title: 'コンテナ基本操作',
    description: 'ps, run, stop の基本フロー',
    category: 'Docker',
    difficulty: 1,
    requiredVars: ['container', 'image'],
    steps: [
      {
        taskTemplate: '実行中のコンテナを確認しなさい',
        formatHint: 'docker ps',
        expectation: 'docker ps',
        commandId: 'docker.ps',
      },
      {
        taskTemplate: '`{image}` イメージからコンテナを起動しなさい',
        formatHint: 'docker run <イメージ>',
        expectation: 'docker run {image}',
        commandId: 'docker.run',
      },
      {
        taskTemplate: 'もう一度コンテナを確認しなさい',
        formatHint: 'docker ps',
        expectation: 'docker ps',
        commandId: 'docker.ps',
      },
    ],
    setupVfs: (vfs, dynamic, homeDir) => {
      vfs.currentPath = homeDir;
      return vfs;
    },
  },
  {
    id: 'docker-image-management',
    title: 'イメージ管理',
    description: 'images, pull でイメージを管理',
    category: 'Docker',
    difficulty: 1,
    requiredVars: ['image'],
    steps: [
      {
        taskTemplate: 'ローカルのイメージ一覧を確認しなさい',
        formatHint: 'docker images',
        expectation: 'docker images',
        commandId: 'docker.images',
      },
      {
        taskTemplate: '`{image}` イメージをダウンロードしなさい',
        formatHint: 'docker pull <イメージ>',
        expectation: 'docker pull {image}',
        commandId: 'docker.pull',
      },
      {
        taskTemplate: 'イメージが追加されたことを確認しなさい',
        formatHint: 'docker images',
        expectation: 'docker images',
        commandId: 'docker.images',
      },
    ],
    setupVfs: (vfs, dynamic, homeDir) => {
      vfs.currentPath = homeDir;
      return vfs;
    },
  },
  {
    id: 'docker-container-debug',
    title: 'コンテナデバッグ',
    description: 'logs, exec でコンテナを調査',
    category: 'Docker',
    difficulty: 2,
    requiredVars: ['container'],
    steps: [
      {
        taskTemplate: '実行中のコンテナを確認しなさい',
        formatHint: 'docker ps',
        expectation: 'docker ps',
        commandId: 'docker.ps',
      },
      {
        taskTemplate: '`{container}` のログを確認しなさい',
        formatHint: 'docker logs <コンテナ>',
        expectation: 'docker logs {container}',
        commandId: 'docker.logs',
      },
      {
        taskTemplate: '`{container}` 内でbashを起動しなさい',
        formatHint: 'docker exec -it <コンテナ> bash',
        expectation: 'docker exec -it {container} bash',
        commandId: 'docker.exec',
      },
    ],
    setupVfs: (vfs, dynamic, homeDir) => {
      vfs.currentPath = homeDir;
      return vfs;
    },
  },
  {
    id: 'docker-stop-remove',
    title: 'コンテナ停止・削除',
    description: 'stop, rm でコンテナをクリーンアップ',
    category: 'Docker',
    difficulty: 2,
    requiredVars: ['container'],
    steps: [
      {
        taskTemplate: '実行中のコンテナを確認しなさい',
        formatHint: 'docker ps',
        expectation: 'docker ps',
        commandId: 'docker.ps',
      },
      {
        taskTemplate: '`{container}` を停止しなさい',
        formatHint: 'docker stop <コンテナ>',
        expectation: 'docker stop {container}',
        commandId: 'docker.stop',
      },
      {
        taskTemplate: '`{container}` を削除しなさい',
        formatHint: 'docker rm <コンテナ>',
        expectation: 'docker rm {container}',
        commandId: 'docker.rm',
      },
    ],
    setupVfs: (vfs, dynamic, homeDir) => {
      vfs.currentPath = homeDir;
      return vfs;
    },
  },
];

// ========================================
// Python シナリオ
// ========================================

const PYTHON_SCENARIOS: MiniScenario[] = [
  {
    id: 'python-venv-setup',
    title: '仮想環境セットアップ',
    description: 'venv 作成から有効化まで',
    category: 'Python',
    difficulty: 1,
    requiredVars: ['venv_name'],
    steps: [
      {
        taskTemplate: '`{venv_name}` という名前の仮想環境を作成しなさい',
        formatHint: 'python -m venv <名前>',
        expectation: 'python -m venv {venv_name}',
        commandId: 'python.venv',
      },
      {
        taskTemplate: '仮想環境を有効化しなさい',
        formatHint: 'source <venv名>/bin/activate',
        expectation: 'source {venv_name}/bin/activate',
        commandId: 'source.activate',
      },
      {
        taskTemplate: '仮想環境を無効化しなさい',
        formatHint: 'deactivate',
        expectation: 'deactivate',
        commandId: 'deactivate',
      },
    ],
    setupVfs: (vfs, dynamic, homeDir) => {
      vfs.currentPath = homeDir;
      return vfs;
    },
  },
  {
    id: 'python-pip-workflow',
    title: 'パッケージ管理',
    description: 'pip でパッケージをインストール',
    category: 'Python',
    difficulty: 1,
    requiredVars: ['package'],
    steps: [
      {
        taskTemplate: 'インストール済みパッケージを確認しなさい',
        formatHint: 'pip list',
        expectation: 'pip list',
        commandId: 'pip.list',
      },
      {
        taskTemplate: '`{package}` をインストールしなさい',
        formatHint: 'pip install <パッケージ>',
        expectation: 'pip install {package}',
        commandId: 'pip.install',
      },
      {
        taskTemplate: 'インストールされたことを確認しなさい',
        formatHint: 'pip list',
        expectation: 'pip list',
        commandId: 'pip.list',
      },
    ],
    setupVfs: (vfs, dynamic, homeDir) => {
      vfs.currentPath = homeDir;
      return vfs;
    },
  },
  {
    id: 'python-requirements',
    title: '依存関係管理',
    description: 'freeze と requirements.txt',
    category: 'Python',
    difficulty: 2,
    requiredVars: ['package'],
    steps: [
      {
        taskTemplate: '`{package}` をインストールしなさい',
        formatHint: 'pip install <パッケージ>',
        expectation: 'pip install {package}',
        commandId: 'pip.install',
      },
      {
        taskTemplate: 'インストール済みパッケージを requirements.txt 形式で出力しなさい',
        formatHint: 'pip freeze',
        expectation: 'pip freeze',
        commandId: 'pip.freeze',
      },
    ],
    setupVfs: (vfs, dynamic, homeDir) => {
      vfs.currentPath = homeDir;
      return vfs;
    },
  },
];

// ========================================
// Network シナリオ
// ========================================

const NETWORK_SCENARIOS: MiniScenario[] = [
  {
    id: 'network-connectivity',
    title: '接続確認',
    description: 'ping, curl で接続確認',
    category: 'Network',
    difficulty: 1,
    requiredVars: ['ip'],
    steps: [
      {
        taskTemplate: '`{ip}` に ping を送信しなさい',
        formatHint: 'ping <IPアドレス>',
        expectation: 'ping {ip}',
        commandId: 'ping',
      },
      {
        taskTemplate: '`{ip}` に curl でアクセスしなさい',
        formatHint: 'curl <URL>',
        expectation: 'curl {ip}',
        commandId: 'curl',
      },
    ],
    setupVfs: (vfs, dynamic, homeDir) => {
      vfs.currentPath = homeDir;
      return vfs;
    },
  },
  {
    id: 'network-download',
    title: 'ファイルダウンロード',
    description: 'wget, curl でファイル取得',
    category: 'Network',
    difficulty: 1,
    requiredVars: ['ip', 'filename'],
    steps: [
      {
        taskTemplate: '`{ip}/{filename}` を wget でダウンロードしなさい',
        formatHint: 'wget <URL>',
        expectation: 'wget {ip}/{filename}',
        commandId: 'wget',
      },
      {
        taskTemplate: 'ダウンロードしたファイルを確認しなさい',
        formatHint: 'ls',
        expectation: 'ls',
        commandId: 'ls',
      },
    ],
    setupVfs: (vfs, dynamic, homeDir) => {
      vfs.currentPath = homeDir;
      return vfs;
    },
  },
  {
    id: 'network-scp-transfer',
    title: 'SCP転送',
    description: 'scp でファイル転送',
    category: 'Network',
    difficulty: 2,
    requiredVars: ['filename', 'user', 'ip'],
    steps: [
      {
        taskTemplate: 'ファイル一覧を確認しなさい',
        formatHint: 'ls',
        expectation: 'ls',
        commandId: 'ls',
      },
      {
        taskTemplate: '`{filename}` を `{user}@{ip}:/tmp/` に転送しなさい',
        formatHint: 'scp <ファイル> <ユーザー>@<ホスト>:<パス>',
        expectation: 'scp {filename} {user}@{ip}:/tmp/',
        commandId: 'scp',
      },
    ],
    setupVfs: (vfs, dynamic, homeDir) => {
      const filename = dynamic.filename || 'data.txt';
      vfs = touch(vfs, `${homeDir}/${filename}`);
      vfs.currentPath = homeDir;
      return vfs;
    },
  },
];

// ========================================
// 全シナリオをエクスポート
// ========================================

export const MINI_SCENARIOS: MiniScenario[] = [
  ...LINUX_SCENARIOS,
  ...GIT_SCENARIOS,
  ...DOCKER_SCENARIOS,
  ...PYTHON_SCENARIOS,
  ...NETWORK_SCENARIOS,
];

/**
 * カテゴリでフィルタしてランダムに1つ取得
 */
export function getRandomMiniScenario(category: CommandCategory | 'all'): MiniScenario | null {
  let candidates = MINI_SCENARIOS;
  
  if (category !== 'all') {
    candidates = candidates.filter(s => s.category === category);
  }
  
  if (candidates.length === 0) return null;
  
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * IDでシナリオを取得
 */
export function getMiniScenarioById(id: string): MiniScenario | null {
  return MINI_SCENARIOS.find(s => s.id === id) || null;
}

/**
 * カテゴリ別のシナリオ数を取得
 */
export function getScenarioCountByCategory(): Record<CommandCategory | 'all', number> {
  return {
    all: MINI_SCENARIOS.length,
    Linux: LINUX_SCENARIOS.length,
    Git: GIT_SCENARIOS.length,
    Docker: DOCKER_SCENARIOS.length,
    Python: PYTHON_SCENARIOS.length,
    Network: NETWORK_SCENARIOS.length,
  };
}
