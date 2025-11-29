/**
 * シナリオ定義 - 複数ステップの実務フロー練習
 */

import { Scenario, CommandCategory, VFSState, DynamicContext } from '../types';
import * as vfs from '../lib/vfs';

export const SCENARIOS: Scenario[] = [
  // ============================================
  // 1. System Maintenance（システムメンテナンス）
  // ============================================
  {
    id: 'system-maintenance',
    title: 'システムメンテナンス',
    description: 'ディスク容量を確認し、不要なログファイルを削除する実務フローを練習します。',
    category: 'Linux',
    requiredVars: ['dir'],
    setupVfs: (currentVfs, dynamic) => {
      const homeDir = dynamic._homeDir || '/home/user';
      const dir = dynamic.dir || 'old_logs';
      let newVfs = vfs.mkdir(currentVfs, `${homeDir}/${dir}`);
      newVfs = vfs.addFile(newVfs, `${homeDir}/${dir}/app.log`, 'Log entry 1\nLog entry 2');
      newVfs = vfs.addFile(newVfs, `${homeDir}/${dir}/error.log`, 'Error 1\nError 2');
      newVfs = vfs.addFile(newVfs, `${homeDir}/${dir}/access.log`, 'Access log data');
      return newVfs;
    },
    steps: [
      {
        taskHint: 'ディスク容量の状況を確認しなさい',
        formatHint: 'df -h',
        expectation: 'df -h',
        commandId: 'df',
      },
      {
        taskHint: '`{dir}` ディレクトリの中身を詳細表示しなさい',
        formatHint: 'ls -la <ディレクトリ>',
        expectation: 'ls -la {dir}',
        commandId: 'ls',
      },
      {
        taskHint: '`{dir}` ディレクトリを再帰的に削除しなさい',
        formatHint: 'rm -rf <ディレクトリ>',
        expectation: 'rm -rf {dir}',
        commandId: 'rm',
      },
    ],
  },
  
  // ============================================
  // 2. Docker Environment Reset
  // ============================================
  {
    id: 'docker-reset',
    title: 'Docker環境リセット',
    description: '不要なDockerコンテナとイメージをクリーンアップする手順を練習します。',
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
  },
  
  // ============================================
  // 3. Git Workflow
  // ============================================
  {
    id: 'git-workflow',
    title: 'Git基本ワークフロー',
    description: '変更をステージしてコミット、プッシュまでの基本的なGit操作フローを練習します。',
    category: 'Git',
    requiredVars: ['filename', 'commit_msg'],
    setupVfs: (currentVfs, dynamic) => {
      const homeDir = dynamic._homeDir || '/home/user';
      const filename = dynamic.filename || 'app.js';
      let newVfs = vfs.mkdir(currentVfs, `${homeDir}/project`);
      newVfs = vfs.addFile(newVfs, `${homeDir}/project/${filename}`, 'console.log("Hello");');
      newVfs = vfs.mkdir(newVfs, `${homeDir}/project/.git`);
      return newVfs;
    },
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
  },
  
  // ============================================
  // 4. Python Setup
  // ============================================
  {
    id: 'python-setup',
    title: 'Python仮想環境セットアップ',
    description: '仮想環境を作成し、パッケージをインストールする手順を練習します。',
    category: 'Python',
    requiredVars: ['venv_name', 'package'],
    setupVfs: (currentVfs, _dynamic) => {
      let newVfs = vfs.mkdir(currentVfs, '/home/user/myproject');
      newVfs = vfs.addFile(newVfs, '/home/user/myproject/requirements.txt', 'requests\nflask');
      return newVfs;
    },
    steps: [
      {
        taskHint: '`{venv_name}` という名前で仮想環境を作成しなさい',
        formatHint: 'python3 -m venv <環境名>',
        expectation: 'python3 -m venv {venv_name}',
        commandId: 'python.venv',
        goal: {
          type: 'dir-exists',
          path: '/home/user/{venv_name}',
        },
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
      {
        taskHint: 'インストール済みパッケージを確認しなさい',
        formatHint: 'pip list',
        expectation: 'pip list',
        commandId: 'pip.list',
      },
    ],
  },
  
  // ============================================
  // 5. Remote Operation
  // ============================================
  {
    id: 'remote-operation',
    title: 'リモートサーバー操作',
    description: 'リモートサーバーへの接続とファイル転送の基本操作を練習します。',
    category: 'Network',
    requiredVars: ['ip', 'user', 'filename'],
    setupVfs: (currentVfs, dynamic) => {
      const filename = dynamic.filename || 'deploy.sh';
      return vfs.addFile(currentVfs, `/home/user/${filename}`, '#!/bin/bash\necho "Deploying..."');
    },
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
        taskHint: '`{filename}` をリモートサーバーのホームディレクトリにコピーしなさい',
        formatHint: 'scp <ファイル> <ユーザー>@<ホスト>:~/',
        expectation: 'scp {filename} {user}@{ip}:~/',
        commandId: 'scp',
      },
    ],
  },
  
  // ============================================
  // 6. File Organization
  // ============================================
  {
    id: 'file-organization',
    title: 'ファイル整理',
    description: 'ディレクトリの作成、ファイルのコピー・移動などの基本操作を練習します。',
    category: 'Linux',
    requiredVars: ['dir', 'src_file', 'dest_dir'],
    setupVfs: (currentVfs, dynamic) => {
      const srcFile = dynamic.src_file || 'important.txt';
      let newVfs = vfs.addFile(currentVfs, `/home/user/${srcFile}`, 'Important data');
      newVfs = vfs.touch(newVfs, '/home/user/other_file.txt');
      newVfs = vfs.mkdir(newVfs, '/home/user/existing_folder');
      return newVfs;
    },
    steps: [
      {
        taskHint: '`{dir}` ディレクトリを作成しなさい',
        formatHint: 'mkdir <ディレクトリ名>',
        expectation: 'mkdir {dir}',
        commandId: 'mkdir',
        goal: {
          type: 'dir-exists',
          path: '/home/user/{dir}',
        },
      },
      {
        taskHint: 'ディレクトリの内容を確認しなさい',
        formatHint: 'ls -la',
        expectation: 'ls -la',
        commandId: 'ls',
      },
      {
        taskHint: '`{src_file}` を `{dest_dir}` にコピーしなさい',
        formatHint: 'cp <コピー元> <コピー先>',
        expectation: 'cp {src_file} {dest_dir}',
        commandId: 'cp',
        goal: {
          type: 'file-in-dir',
          dirName: '/home/user/{dest_dir}',
          fileName: '{src_file}',
        },
      },
      {
        taskHint: '現在のディレクトリパスを表示しなさい',
        formatHint: 'pwd',
        expectation: 'pwd',
        commandId: 'pwd',
      },
    ],
  },
  
  // ============================================
  // 7. Docker Compose Workflow
  // ============================================
  {
    id: 'docker-compose-workflow',
    title: 'Docker Composeワークフロー',
    description: 'Docker Composeを使ったサービスの起動と停止を練習します。',
    category: 'Docker',
    requiredVars: [],
    setupVfs: (currentVfs, _dynamic) => {
      let newVfs = vfs.mkdir(currentVfs, '/home/user/webapp');
      newVfs = vfs.addFile(newVfs, '/home/user/webapp/docker-compose.yml', 
        'version: "3"\nservices:\n  web:\n    image: nginx');
      return newVfs;
    },
    steps: [
      {
        taskHint: '停止中を含むすべてのコンテナを確認しなさい',
        formatHint: 'docker ps -a',
        expectation: 'docker ps -a',
        commandId: 'docker.ps',
      },
      {
        taskHint: 'Docker Composeでサービスをバックグラウンド起動しなさい',
        formatHint: 'docker compose up -d',
        expectation: 'docker compose up -d',
        commandId: 'docker.compose.up',
      },
      {
        taskHint: '起動中のコンテナを確認しなさい',
        formatHint: 'docker ps',
        expectation: 'docker ps',
        commandId: 'docker.ps',
      },
      {
        taskHint: 'Docker Composeでサービスを停止しなさい',
        formatHint: 'docker compose down',
        expectation: 'docker compose down',
        commandId: 'docker.compose.down',
      },
    ],
  },
  
  // ============================================
  // 8. Process Management
  // ============================================
  {
    id: 'process-management',
    title: 'プロセス管理',
    description: 'プロセスの確認と終了操作を練習します。',
    category: 'Linux',
    requiredVars: ['pid'],
    steps: [
      {
        taskHint: '全プロセスを詳細表示しなさい',
        formatHint: 'ps aux',
        expectation: 'ps aux',
        commandId: 'ps',
      },
      {
        taskHint: 'プロセスID `{pid}` を終了しなさい',
        formatHint: 'kill <プロセスID>',
        expectation: 'kill {pid}',
        commandId: 'kill',
      },
      {
        taskHint: 'メモリ使用量を確認しなさい',
        formatHint: 'free',
        expectation: 'free',
        commandId: 'free',
      },
    ],
  },
];

/**
 * カテゴリでシナリオをフィルタリング
 */
export function getScenariosByCategory(category: CommandCategory | 'all'): Scenario[] {
  if (category === 'all') {
    return SCENARIOS;
  }
  return SCENARIOS.filter(scenario => scenario.category === category);
}

/**
 * シナリオIDからシナリオを取得
 */
export function getScenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find(scenario => scenario.id === id);
}

/**
 * すべてのカテゴリを取得
 */
export function getAllCategories(): CommandCategory[] {
  const categories = new Set<CommandCategory>();
  for (const scenario of SCENARIOS) {
    categories.add(scenario.category);
  }
  return Array.from(categories);
}

/**
 * シナリオ用のVFS環境をセットアップ
 */
export function setupScenarioVfs(
  currentVfs: VFSState,
  scenario: Scenario,
  dynamic: DynamicContext,
  homeDir: string = '/home/user'
): VFSState {
  // ホームディレクトリと基本構造を作成
  let newVfs = vfs.mkdir(currentVfs, homeDir);
  newVfs = vfs.mkdir(newVfs, `${homeDir}/documents`);
  newVfs = vfs.mkdir(newVfs, `${homeDir}/downloads`);
  newVfs = vfs.mkdir(newVfs, `${homeDir}/projects`);
  
  // 一般的なファイルを追加
  newVfs = vfs.touch(newVfs, `${homeDir}/.bashrc`);
  newVfs = vfs.touch(newVfs, `${homeDir}/.profile`);
  
  // ダミーファイルを追加
  newVfs = vfs.addFile(newVfs, `${homeDir}/documents/notes.txt`, 'Meeting notes');
  newVfs = vfs.addFile(newVfs, `${homeDir}/downloads/setup.sh`, '#!/bin/bash');
  
  // カレントパスをホームに設定
  newVfs = vfs.cd(newVfs, homeDir);
  
  // シナリオ固有のセットアップ
  if (scenario.setupVfs) {
    const extendedDynamic = { ...dynamic, _homeDir: homeDir };
    newVfs = scenario.setupVfs(newVfs, extendedDynamic);
  }
  
  return newVfs;
}
