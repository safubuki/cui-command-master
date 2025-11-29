/**
 * Arcadeタスク定義 - 単一コマンド練習タスク
 */

import { ArcadeTask, CommandCategory, VFSState, DynamicContext } from '../types';
import * as vfs from '../lib/vfs';
import { hydrateTemplate } from '../lib/dynamicVars';

/** カテゴリ別タスクプール */
export const ARCADE_TASKS: ArcadeTask[] = [
  // ============================================
  // Linux - ファイル操作
  // ============================================
  {
    id: 'ls-basic',
    commandId: 'ls',
    category: 'Linux',
    taskTemplate: 'カレントディレクトリの内容を一覧表示しなさい',
    formatHint: 'ls',
    expectation: 'ls',
    requiredVars: [],
    difficulty: 1,
  },
  {
    id: 'ls-la',
    commandId: 'ls',
    category: 'Linux',
    taskTemplate: '隠しファイルを含むすべてのファイルを詳細表示しなさい',
    formatHint: 'ls -la',
    expectation: 'ls -la',
    requiredVars: [],
    difficulty: 1,
  },
  {
    id: 'ls-dir',
    commandId: 'ls',
    category: 'Linux',
    taskTemplate: '`{dir}` ディレクトリの内容を表示しなさい',
    formatHint: 'ls <ディレクトリ>',
    expectation: 'ls {dir}',
    requiredVars: ['dir'],
    difficulty: 1,
    setupVfs: (currentVfs, dynamic) => {
      const homeDir = dynamic._homeDir || '/home/user';
      const dir = dynamic.dir || 'logs';
      let newVfs = vfs.mkdir(currentVfs, `${homeDir}/${dir}`);
      newVfs = vfs.addFile(newVfs, `${homeDir}/${dir}/app.log`, 'INFO: Application started');
      newVfs = vfs.addFile(newVfs, `${homeDir}/${dir}/error.log`, 'ERROR: Connection failed');
      return newVfs;
    },
  },
  {
    id: 'cd-dir',
    commandId: 'cd',
    category: 'Linux',
    taskTemplate: '`{dir}` ディレクトリに移動しなさい',
    formatHint: 'cd <ディレクトリ>',
    expectation: 'cd {dir}',
    requiredVars: ['dir'],
    difficulty: 1,
    setupVfs: (currentVfs, dynamic) => {
      const homeDir = dynamic._homeDir || '/home/user';
      const dir = dynamic.dir || 'documents';
      return vfs.mkdir(currentVfs, `${homeDir}/${dir}`);
    },
    goal: {
      type: 'current-dir',
      path: '/home/user/{dir}',
    },
  },
  {
    id: 'pwd-basic',
    commandId: 'pwd',
    category: 'Linux',
    taskTemplate: '現在のディレクトリパスを表示しなさい',
    formatHint: 'pwd',
    expectation: 'pwd',
    requiredVars: [],
    difficulty: 1,
  },
  {
    id: 'mkdir-create',
    commandId: 'mkdir',
    category: 'Linux',
    taskTemplate: '`{dir}` という名前のディレクトリを作成しなさい',
    formatHint: 'mkdir <ディレクトリ名>',
    expectation: 'mkdir {dir}',
    requiredVars: ['dir'],
    difficulty: 1,
    goal: {
      type: 'dir-exists',
      path: '/home/user/{dir}',
    },
  },
  {
    id: 'touch-create',
    commandId: 'touch',
    category: 'Linux',
    taskTemplate: '`{filename}` という空ファイルを作成しなさい',
    formatHint: 'touch <ファイル名>',
    expectation: 'touch {filename}',
    requiredVars: ['filename'],
    difficulty: 1,
    goal: {
      type: 'file-exists',
      path: '/home/user/{filename}',
    },
  },
  {
    id: 'rm-file',
    commandId: 'rm',
    category: 'Linux',
    taskTemplate: '`{filename}` を削除しなさい',
    formatHint: 'rm <ファイル名>',
    expectation: 'rm {filename}',
    requiredVars: ['filename'],
    difficulty: 1,
    setupVfs: (currentVfs, dynamic) => {
      const homeDir = dynamic._homeDir || '/home/user';
      const filename = dynamic.filename || 'temp.txt';
      return vfs.touch(currentVfs, `${homeDir}/${filename}`);
    },
  },
  {
    id: 'rm-rf',
    commandId: 'rm',
    category: 'Linux',
    taskTemplate: '`{dir}` ディレクトリを再帰的に強制削除しなさい',
    formatHint: 'rm -rf <ディレクトリ>',
    expectation: 'rm -rf {dir}',
    requiredVars: ['dir'],
    difficulty: 2,
    setupVfs: (currentVfs, dynamic) => {
      const homeDir = dynamic._homeDir || '/home/user';
      const dir = dynamic.dir || 'old_backup';
      let newVfs = vfs.mkdir(currentVfs, `${homeDir}/${dir}`);
      newVfs = vfs.touch(newVfs, `${homeDir}/${dir}/file1.txt`);
      newVfs = vfs.touch(newVfs, `${homeDir}/${dir}/file2.txt`);
      return newVfs;
    },
  },
  {
    id: 'cp-file',
    commandId: 'cp',
    category: 'Linux',
    taskTemplate: '`{src_file}` を `{dest_dir}` にコピーしなさい',
    formatHint: 'cp <コピー元> <コピー先>',
    expectation: 'cp {src_file} {dest_dir}',
    requiredVars: ['src_file', 'dest_dir'],
    difficulty: 2,
    setupVfs: (currentVfs, dynamic) => {
      const homeDir = dynamic._homeDir || '/home/user';
      const srcFile = dynamic.src_file || 'data.csv';
      const destDir = dynamic.dest_dir || 'backup';
      let newVfs = vfs.addFile(currentVfs, `${homeDir}/${srcFile}`, 'Sample data content');
      newVfs = vfs.mkdir(newVfs, `${homeDir}/${destDir}`);
      return newVfs;
    },
    goal: {
      type: 'file-in-dir',
      dirName: '/home/user/{dest_dir}',
      fileName: '{src_file}',
    },
  },
  {
    id: 'mv-file',
    commandId: 'mv',
    category: 'Linux',
    taskTemplate: '`{src_file}` を `{dest_dir}` に移動しなさい',
    formatHint: 'mv <移動元> <移動先>',
    expectation: 'mv {src_file} {dest_dir}',
    requiredVars: ['src_file', 'dest_dir'],
    difficulty: 2,
    setupVfs: (currentVfs, dynamic) => {
      const homeDir = dynamic._homeDir || '/home/user';
      const srcFile = dynamic.src_file || 'report.txt';
      const destDir = dynamic.dest_dir || 'archive';
      let newVfs = vfs.addFile(currentVfs, `${homeDir}/${srcFile}`, 'Report content here');
      newVfs = vfs.mkdir(newVfs, `${homeDir}/${destDir}`);
      return newVfs;
    },
    goal: {
      type: 'file-in-dir',
      dirName: '/home/user/{dest_dir}',
      fileName: '{src_file}',
    },
  },
  {
    id: 'cat-file',
    commandId: 'cat',
    category: 'Linux',
    taskTemplate: '`{filename}` の内容を表示しなさい',
    formatHint: 'cat <ファイル名>',
    expectation: 'cat {filename}',
    requiredVars: ['filename'],
    difficulty: 1,
    setupVfs: (currentVfs, dynamic) => {
      const homeDir = dynamic._homeDir || '/home/user';
      const filename = dynamic.filename || 'readme.txt';
      return vfs.addFile(currentVfs, `${homeDir}/${filename}`, 'This is sample content.\nLine 2 of the file.');
    },
  },
  
  // ============================================
  // Linux - システム
  // ============================================
  {
    id: 'ps-basic',
    commandId: 'ps',
    category: 'Linux',
    taskTemplate: '現在のプロセス一覧を表示しなさい',
    formatHint: 'ps',
    expectation: 'ps',
    requiredVars: [],
    difficulty: 1,
  },
  {
    id: 'ps-aux',
    commandId: 'ps',
    category: 'Linux',
    taskTemplate: '全ユーザーの全プロセスを詳細表示しなさい',
    formatHint: 'ps aux',
    expectation: 'ps aux',
    requiredVars: [],
    difficulty: 2,
  },
  {
    id: 'top-basic',
    commandId: 'top',
    category: 'Linux',
    taskTemplate: 'リアルタイムでプロセスを監視しなさい',
    formatHint: 'top',
    expectation: 'top',
    requiredVars: [],
    difficulty: 1,
  },
  {
    id: 'kill-pid',
    commandId: 'kill',
    category: 'Linux',
    taskTemplate: 'プロセスID `{pid}` を終了しなさい',
    formatHint: 'kill <プロセスID>',
    expectation: 'kill {pid}',
    requiredVars: ['pid'],
    difficulty: 2,
  },
  {
    id: 'df-h',
    commandId: 'df',
    category: 'Linux',
    taskTemplate: 'ディスク使用量を人間が読みやすい形式で表示しなさい',
    formatHint: 'df -h',
    expectation: 'df -h',
    requiredVars: [],
    difficulty: 1,
  },
  {
    id: 'free-basic',
    commandId: 'free',
    category: 'Linux',
    taskTemplate: 'メモリ使用量を表示しなさい',
    formatHint: 'free',
    expectation: 'free',
    requiredVars: [],
    difficulty: 1,
  },
  
  // ============================================
  // Git
  // ============================================
  {
    id: 'git-status',
    commandId: 'git.status',
    category: 'Git',
    taskTemplate: 'リポジトリの状態を確認しなさい',
    formatHint: 'git status',
    expectation: 'git status',
    requiredVars: [],
    difficulty: 1,
  },
  {
    id: 'git-add-file',
    commandId: 'git.add',
    category: 'Git',
    taskTemplate: '`{filename}` をステージングエリアに追加しなさい',
    formatHint: 'git add <ファイル名>',
    expectation: 'git add {filename}',
    requiredVars: ['filename'],
    difficulty: 1,
    setupVfs: (currentVfs, dynamic) => {
      const homeDir = dynamic._homeDir || '/home/user';
      const filename = dynamic.filename || 'app.js';
      return vfs.addFile(currentVfs, `${homeDir}/${filename}`, '// JavaScript code');
    },
  },
  {
    id: 'git-commit',
    commandId: 'git.commit',
    category: 'Git',
    taskTemplate: '「{commit_msg}」というメッセージでコミットしなさい',
    formatHint: 'git commit -m "<メッセージ>"',
    expectation: 'git commit -m "{commit_msg}"',
    requiredVars: ['commit_msg'],
    difficulty: 2,
  },
  {
    id: 'git-push',
    commandId: 'git.push',
    category: 'Git',
    taskTemplate: 'リモートリポジトリにプッシュしなさい',
    formatHint: 'git push',
    expectation: 'git push',
    requiredVars: [],
    difficulty: 1,
  },
  {
    id: 'git-pull',
    commandId: 'git.pull',
    category: 'Git',
    taskTemplate: 'リモートリポジトリから変更を取得しなさい',
    formatHint: 'git pull',
    expectation: 'git pull',
    requiredVars: [],
    difficulty: 1,
  },
  {
    id: 'git-log',
    commandId: 'git.log',
    category: 'Git',
    taskTemplate: 'コミット履歴を表示しなさい',
    formatHint: 'git log',
    expectation: 'git log',
    requiredVars: [],
    difficulty: 1,
  },
  
  // ============================================
  // Docker
  // ============================================
  {
    id: 'docker-ps',
    commandId: 'docker.ps',
    category: 'Docker',
    taskTemplate: '起動中のコンテナを一覧表示しなさい',
    formatHint: 'docker ps',
    expectation: 'docker ps',
    requiredVars: [],
    difficulty: 1,
  },
  {
    id: 'docker-ps-a',
    commandId: 'docker.ps',
    category: 'Docker',
    taskTemplate: '停止中を含むすべてのコンテナを表示しなさい',
    formatHint: 'docker ps -a',
    expectation: 'docker ps -a',
    requiredVars: [],
    difficulty: 1,
  },
  {
    id: 'docker-stop',
    commandId: 'docker.stop',
    category: 'Docker',
    taskTemplate: 'コンテナ `{container}` を停止しなさい',
    formatHint: 'docker stop <コンテナ名>',
    expectation: 'docker stop {container}',
    requiredVars: ['container'],
    difficulty: 2,
  },
  {
    id: 'docker-rm',
    commandId: 'docker.rm',
    category: 'Docker',
    taskTemplate: 'コンテナ `{container}` を削除しなさい',
    formatHint: 'docker rm <コンテナ名>',
    expectation: 'docker rm {container}',
    requiredVars: ['container'],
    difficulty: 2,
  },
  {
    id: 'docker-rmi',
    commandId: 'docker.rmi',
    category: 'Docker',
    taskTemplate: 'イメージ `{image}` を削除しなさい',
    formatHint: 'docker rmi <イメージ名>',
    expectation: 'docker rmi {image}',
    requiredVars: ['image'],
    difficulty: 2,
  },
  {
    id: 'docker-run',
    commandId: 'docker.run',
    category: 'Docker',
    taskTemplate: 'イメージ `{image}` からコンテナをデタッチモードで起動しなさい',
    formatHint: 'docker run -d <イメージ名>',
    expectation: 'docker run -d {image}',
    requiredVars: ['image'],
    difficulty: 2,
  },
  {
    id: 'docker-compose-up',
    commandId: 'docker.compose.up',
    category: 'Docker',
    taskTemplate: 'Docker Composeでサービスをバックグラウンド起動しなさい',
    formatHint: 'docker compose up -d',
    expectation: 'docker compose up -d',
    requiredVars: [],
    difficulty: 2,
  },
  {
    id: 'docker-compose-down',
    commandId: 'docker.compose.down',
    category: 'Docker',
    taskTemplate: 'Docker Composeでサービスを停止しなさい',
    formatHint: 'docker compose down',
    expectation: 'docker compose down',
    requiredVars: [],
    difficulty: 2,
  },
  
  // ============================================
  // Python
  // ============================================
  {
    id: 'python-venv',
    commandId: 'python.venv',
    category: 'Python',
    taskTemplate: '`{venv_name}` という名前で仮想環境を作成しなさい',
    formatHint: 'python3 -m venv <環境名>',
    expectation: 'python3 -m venv {venv_name}',
    requiredVars: ['venv_name'],
    difficulty: 2,
    goal: {
      type: 'dir-exists',
      path: '/home/user/{venv_name}',
    },
  },
  {
    id: 'source-activate',
    commandId: 'source',
    category: 'Python',
    taskTemplate: '仮想環境 `{venv_name}` を有効化しなさい',
    formatHint: 'source <環境名>/bin/activate',
    expectation: 'source {venv_name}/bin/activate',
    requiredVars: ['venv_name'],
    difficulty: 2,
    setupVfs: (currentVfs, dynamic) => {
      const homeDir = dynamic._homeDir || '/home/user';
      const venvName = dynamic.venv_name || 'venv';
      let newVfs = vfs.mkdir(currentVfs, `${homeDir}/${venvName}`);
      newVfs = vfs.mkdir(newVfs, `${homeDir}/${venvName}/bin`);
      newVfs = vfs.touch(newVfs, `${homeDir}/${venvName}/bin/activate`);
      return newVfs;
    },
  },
  {
    id: 'pip-install',
    commandId: 'pip.install',
    category: 'Python',
    taskTemplate: '`{package}` パッケージをインストールしなさい',
    formatHint: 'pip install <パッケージ名>',
    expectation: 'pip install {package}',
    requiredVars: ['package'],
    difficulty: 1,
  },
  {
    id: 'pip-list',
    commandId: 'pip.list',
    category: 'Python',
    taskTemplate: 'インストール済みパッケージを一覧表示しなさい',
    formatHint: 'pip list',
    expectation: 'pip list',
    requiredVars: [],
    difficulty: 1,
  },
  
  // ============================================
  // Network
  // ============================================
  {
    id: 'ping-ip',
    commandId: 'ping',
    category: 'Network',
    taskTemplate: 'サーバー `{ip}` への疎通確認を行いなさい',
    formatHint: 'ping <IPアドレス>',
    expectation: 'ping {ip}',
    requiredVars: ['ip'],
    difficulty: 1,
  },
  {
    id: 'ssh-connect',
    commandId: 'ssh',
    category: 'Network',
    taskTemplate: 'ユーザー `{user}` で `{ip}` にSSH接続しなさい',
    formatHint: 'ssh <ユーザー>@<ホスト>',
    expectation: 'ssh {user}@{ip}',
    requiredVars: ['user', 'ip'],
    difficulty: 2,
  },
  {
    id: 'scp-upload',
    commandId: 'scp',
    category: 'Network',
    taskTemplate: '`{filename}` を `{user}@{ip}` のホームにコピーしなさい',
    formatHint: 'scp <ファイル> <ユーザー>@<ホスト>:~/',
    expectation: 'scp {filename} {user}@{ip}:~/',
    requiredVars: ['filename', 'user', 'ip'],
    difficulty: 3,
    setupVfs: (currentVfs, dynamic) => {
      const homeDir = dynamic._homeDir || '/home/user';
      const filename = dynamic.filename || 'data.txt';
      return vfs.addFile(currentVfs, `${homeDir}/${filename}`, 'Data to transfer');
    },
  },
  {
    id: 'exit-session',
    commandId: 'exit',
    category: 'Network',
    taskTemplate: '現在のセッションを終了しなさい',
    formatHint: 'exit',
    expectation: 'exit',
    requiredVars: [],
    difficulty: 1,
  },
];

/**
 * カテゴリでタスクをフィルタリング
 */
export function getTasksByCategory(category: CommandCategory | 'all'): ArcadeTask[] {
  if (category === 'all') {
    return ARCADE_TASKS;
  }
  return ARCADE_TASKS.filter(task => task.category === category);
}

/**
 * ランダムなタスクを取得
 */
export function getRandomTask(category: CommandCategory | 'all'): ArcadeTask | null {
  const tasks = getTasksByCategory(category);
  if (tasks.length === 0) return null;
  
  const index = Math.floor(Math.random() * tasks.length);
  return tasks[index];
}

/**
 * タスク用のVFS環境をセットアップ
 */
export function setupTaskVfs(
  currentVfs: VFSState,
  task: ArcadeTask,
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
  
  // ダミーファイルを追加してリアリティを増す
  newVfs = vfs.addFile(newVfs, `${homeDir}/documents/notes.txt`, 'Meeting notes for today');
  newVfs = vfs.addFile(newVfs, `${homeDir}/documents/memo.md`, '# TODO List\n- Task 1\n- Task 2');
  newVfs = vfs.touch(newVfs, `${homeDir}/downloads/setup.sh`);
  newVfs = vfs.addFile(newVfs, `${homeDir}/projects/README.md`, '# My Project\nDescription here');
  
  // カレントパスをホームに設定
  newVfs = vfs.cd(newVfs, homeDir);
  
  // タスク固有のセットアップ（相対パスはホームディレクトリからの相対パスとして解釈）
  if (task.setupVfs) {
    // dynamic に homeDir を追加してセットアップ関数に渡す
    const extendedDynamic = { ...dynamic, _homeDir: homeDir };
    newVfs = task.setupVfs(newVfs, extendedDynamic);
  }
  
  return newVfs;
}

/**
 * 難易度でタスクをフィルタリング
 */
export function getTasksByDifficulty(
  tasks: ArcadeTask[],
  difficulty: 1 | 2 | 3
): ArcadeTask[] {
  return tasks.filter(task => task.difficulty === difficulty);
}
