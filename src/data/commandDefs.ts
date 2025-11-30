/**
 * コマンド定義 - 各コマンドの構文と判定ロジック
 */

import { CommandDef, JudgeResult, JudgeContext } from '../types';
import { tokenize } from '../lib/tokenizer';

/**
 * 成功結果を返す
 */
function success(): JudgeResult {
  return { ok: true, messages: [] };
}

/**
 * エラー結果を返す
 */
function error(message: string, errorType: JudgeResult['errorType']): JudgeResult {
  return { ok: false, messages: [message], errorType };
}

/**
 * オプションを正規化（-la と -l -a を同等に扱う）
 */
function normalizeOptions(tokens: string[]): string[] {
  const result: string[] = [];
  
  for (const token of tokens) {
    // 複合オプション（-la）を分解
    if (token.startsWith('-') && !token.startsWith('--') && token.length > 2) {
      for (const char of token.slice(1)) {
        result.push(`-${char}`);
      }
    } else {
      result.push(token);
    }
  }
  
  return result;
}

/**
 * オプションをソートして比較可能にする
 */
function sortOptions(tokens: string[]): string[] {
  const options = tokens.filter(t => t.startsWith('-'));
  const args = tokens.filter(t => !t.startsWith('-'));
  return [...options.sort(), ...args];
}

/**
 * 期待コマンドと入力コマンドを比較
 */
function compareCommands(
  inputTokens: string[],
  expectedTokens: string[],
  ctx: JudgeContext
): JudgeResult {
  const normalizedInput = normalizeOptions(inputTokens);
  const normalizedExpected = normalizeOptions(expectedTokens);
  
  // コマンド名の比較
  if (normalizedInput[0] !== normalizedExpected[0]) {
    return error(`コマンドが違います。期待: ${normalizedExpected[0]}`, 'command');
  }
  
  // サブコマンドの比較（git, docker など）
  const hasSubcommand = ['git', 'docker', 'pip', 'python3'].includes(normalizedExpected[0]);
  if (hasSubcommand && normalizedInput.length > 1 && normalizedExpected.length > 1) {
    if (normalizedInput[1] !== normalizedExpected[1]) {
      return error(`サブコマンドが違います。期待: ${normalizedExpected[1]}`, 'subcommand');
    }
  }
  
  // オプションと引数を分離
  const inputOptions = normalizedInput.filter(t => t.startsWith('-'));
  const expectedOptions = normalizedExpected.filter(t => t.startsWith('-'));
  const inputArgs = normalizedInput.filter(t => !t.startsWith('-')).slice(hasSubcommand ? 2 : 1);
  const expectedArgs = normalizedExpected.filter(t => !t.startsWith('-')).slice(hasSubcommand ? 2 : 1);
  
  // オプションの比較（順序を無視）
  const sortedInputOpts = inputOptions.sort();
  const sortedExpectedOpts = expectedOptions.sort();
  
  if (sortedInputOpts.length < sortedExpectedOpts.length) {
    const missing = sortedExpectedOpts.filter(o => !sortedInputOpts.includes(o));
    return error(`オプションが不足しています: ${missing.join(', ')}`, 'missing');
  }
  
  if (sortedInputOpts.length > sortedExpectedOpts.length) {
    const extra = sortedInputOpts.filter(o => !sortedExpectedOpts.includes(o));
    return error(`余分なオプションがあります: ${extra.join(', ')}`, 'extra');
  }
  
  for (const opt of sortedExpectedOpts) {
    if (!sortedInputOpts.includes(opt)) {
      return error(`オプション ${opt} が必要です`, 'option');
    }
  }
  
  // 引数の比較
  if (inputArgs.length < expectedArgs.length) {
    return error('引数が不足しています', 'missing');
  }
  
  if (inputArgs.length > expectedArgs.length) {
    return error('引数が多すぎます', 'extra');
  }
  
  for (let i = 0; i < expectedArgs.length; i++) {
    if (inputArgs[i] !== expectedArgs[i]) {
      return error(`引数が違います。期待: ${expectedArgs[i]}、入力: ${inputArgs[i]}`, 'argument');
    }
  }
  
  return success();
}

/**
 * コマンド定義マップ
 */
export const COMMAND_DEFS: Record<string, CommandDef> = {
  // ============================================
  // Linux 基本 - ファイル操作
  // ============================================
  
  'ls': {
    id: 'ls',
    command: 'ls',
    category: 'Linux',
    syntax: 'ls [-a] [-l] [-h] [path]',
    formatHint: 'ls [オプション] [パス]',
    description: 'ディレクトリの内容を一覧表示します。-a: 隠しファイル表示、-l: 詳細表示、-h: サイズを人間が読みやすい形式で表示',
    check(tokens, ctx) {
      if (tokens[0] !== 'ls') {
        return error('コマンドが違います', 'command');
      }
      return success();
    }
  },
  
  'cd': {
    id: 'cd',
    command: 'cd',
    category: 'Linux',
    syntax: 'cd <path>',
    formatHint: 'cd <ディレクトリパス>',
    description: 'カレントディレクトリを変更します',
    check(tokens, ctx) {
      if (tokens[0] !== 'cd') {
        return error('コマンドが違います', 'command');
      }
      if (tokens.length < 2) {
        return error('移動先のパスを指定してください', 'missing');
      }
      return success();
    }
  },
  
  'pwd': {
    id: 'pwd',
    command: 'pwd',
    category: 'Linux',
    syntax: 'pwd',
    formatHint: 'pwd',
    description: 'カレントディレクトリのフルパスを表示します',
    check(tokens, ctx) {
      if (tokens[0] !== 'pwd') {
        return error('コマンドが違います', 'command');
      }
      return success();
    }
  },
  
  'mkdir': {
    id: 'mkdir',
    command: 'mkdir',
    category: 'Linux',
    syntax: 'mkdir <dir>',
    formatHint: 'mkdir <ディレクトリ名>',
    description: '新しいディレクトリを作成します',
    check(tokens, ctx) {
      if (tokens[0] !== 'mkdir') {
        return error('コマンドが違います', 'command');
      }
      if (tokens.length < 2) {
        return error('ディレクトリ名を指定してください', 'missing');
      }
      return success();
    }
  },
  
  'rm': {
    id: 'rm',
    command: 'rm',
    category: 'Linux',
    syntax: 'rm [-r|-rf] <target>',
    formatHint: 'rm [-rf] <削除対象>',
    description: 'ファイルまたはディレクトリを削除します。ディレクトリ削除には -r オプションが必要です',
    check(tokens, ctx) {
      if (tokens[0] !== 'rm') {
        return error('コマンドが違います', 'command');
      }
      if (tokens.length < 2) {
        return error('削除対象を指定してください', 'missing');
      }
      return success();
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
      if (tokens[0] !== 'cp') {
        return error('コマンドが違います', 'command');
      }
      const args = tokens.filter(t => !t.startsWith('-'));
      if (args.length < 3) {
        return error('コピー元とコピー先を指定してください', 'missing');
      }
      return success();
    }
  },
  
  'mv': {
    id: 'mv',
    command: 'mv',
    category: 'Linux',
    syntax: 'mv <source> <destination>',
    formatHint: 'mv <移動元> <移動先>',
    description: 'ファイルまたはディレクトリを移動またはリネームします',
    check(tokens, ctx) {
      if (tokens[0] !== 'mv') {
        return error('コマンドが違います', 'command');
      }
      const args = tokens.filter(t => !t.startsWith('-'));
      if (args.length < 3) {
        return error('移動元と移動先を指定してください', 'missing');
      }
      return success();
    }
  },
  
  'touch': {
    id: 'touch',
    command: 'touch',
    category: 'Linux',
    syntax: 'touch <file>',
    formatHint: 'touch <ファイル名>',
    description: '空のファイルを作成するか、既存ファイルのタイムスタンプを更新します',
    check(tokens, ctx) {
      if (tokens[0] !== 'touch') {
        return error('コマンドが違います', 'command');
      }
      if (tokens.length < 2) {
        return error('ファイル名を指定してください', 'missing');
      }
      return success();
    }
  },
  
  'cat': {
    id: 'cat',
    command: 'cat',
    category: 'Linux',
    syntax: 'cat <file>',
    formatHint: 'cat <ファイル名>',
    description: 'ファイルの内容を表示します',
    check(tokens, ctx) {
      if (tokens[0] !== 'cat') {
        return error('コマンドが違います', 'command');
      }
      if (tokens.length < 2) {
        return error('ファイル名を指定してください', 'missing');
      }
      return success();
    }
  },
  
  'tail': {
    id: 'tail',
    command: 'tail',
    category: 'Linux',
    syntax: 'tail [-n <num>] [-f] <file>',
    formatHint: 'tail [-f] <ファイル名>',
    description: 'ファイルの末尾を表示します。-f: リアルタイム監視、-n: 表示行数指定',
    check(tokens, ctx) {
      if (tokens[0] !== 'tail') {
        return error('コマンドが違います', 'command');
      }
      const args = tokens.filter(t => !t.startsWith('-'));
      if (args.length < 2) {
        return error('ファイル名を指定してください', 'missing');
      }
      return success();
    }
  },
  
  'head': {
    id: 'head',
    command: 'head',
    category: 'Linux',
    syntax: 'head [-n <num>] <file>',
    formatHint: 'head [-n <行数>] <ファイル名>',
    description: 'ファイルの先頭を表示します。-n: 表示行数指定',
    check(tokens, ctx) {
      if (tokens[0] !== 'head') {
        return error('コマンドが違います', 'command');
      }
      const args = tokens.filter(t => !t.startsWith('-'));
      if (args.length < 2) {
        return error('ファイル名を指定してください', 'missing');
      }
      return success();
    }
  },
  
  'grep': {
    id: 'grep',
    command: 'grep',
    category: 'Linux',
    syntax: 'grep <pattern> <file>',
    formatHint: 'grep <パターン> <ファイル名>',
    description: 'ファイル内の文字列を検索します',
    check(tokens, ctx) {
      if (tokens[0] !== 'grep') {
        return error('コマンドが違います', 'command');
      }
      const args = tokens.filter(t => !t.startsWith('-'));
      if (args.length < 3) {
        return error('検索パターンとファイル名を指定してください', 'missing');
      }
      return success();
    }
  },
  
  'find': {
    id: 'find',
    command: 'find',
    category: 'Linux',
    syntax: 'find <path> -name <pattern>',
    formatHint: 'find <パス> -name <パターン>',
    description: 'ファイルやディレクトリを検索します',
    check(tokens, ctx) {
      if (tokens[0] !== 'find') {
        return error('コマンドが違います', 'command');
      }
      if (tokens.length < 2) {
        return error('検索パスを指定してください', 'missing');
      }
      return success();
    }
  },
  
  'chmod': {
    id: 'chmod',
    command: 'chmod',
    category: 'Linux',
    syntax: 'chmod <mode> <file>',
    formatHint: 'chmod <権限> <ファイル名>',
    description: 'ファイルの権限を変更します（例: 755, 644）',
    check(tokens, ctx) {
      if (tokens[0] !== 'chmod') {
        return error('コマンドが違います', 'command');
      }
      if (tokens.length < 3) {
        return error('権限とファイル名を指定してください', 'missing');
      }
      return success();
    }
  },
  
  'chown': {
    id: 'chown',
    command: 'chown',
    category: 'Linux',
    syntax: 'chown <user>:<group> <file>',
    formatHint: 'chown <ユーザー>:<グループ> <ファイル>',
    description: 'ファイルの所有者を変更します',
    check(tokens, ctx) {
      if (tokens[0] !== 'chown') {
        return error('コマンドが違います', 'command');
      }
      if (tokens.length < 3) {
        return error('所有者とファイル名を指定してください', 'missing');
      }
      return success();
    }
  },
  
  // ============================================
  // Linux - システム
  // ============================================
  
  'ps': {
    id: 'ps',
    command: 'ps',
    category: 'Linux',
    syntax: 'ps [-aux]',
    formatHint: 'ps [オプション]',
    description: '実行中のプロセス一覧を表示します。-aux: 全ユーザーの全プロセスを詳細表示',
    check(tokens, ctx) {
      if (tokens[0] !== 'ps') {
        return error('コマンドが違います', 'command');
      }
      return success();
    }
  },
  
  'top': {
    id: 'top',
    command: 'top',
    category: 'Linux',
    syntax: 'top',
    formatHint: 'top',
    description: 'リアルタイムでプロセスとシステムリソースを監視します',
    check(tokens, ctx) {
      if (tokens[0] !== 'top') {
        return error('コマンドが違います', 'command');
      }
      return success();
    }
  },
  
  'kill': {
    id: 'kill',
    command: 'kill',
    category: 'Linux',
    syntax: 'kill <pid>',
    formatHint: 'kill <プロセスID>',
    description: '指定したプロセスを終了します',
    check(tokens, ctx) {
      if (tokens[0] !== 'kill') {
        return error('コマンドが違います', 'command');
      }
      if (tokens.length < 2) {
        return error('プロセスIDを指定してください', 'missing');
      }
      return success();
    }
  },
  
  'df': {
    id: 'df',
    command: 'df',
    category: 'Linux',
    syntax: 'df [-h]',
    formatHint: 'df [-h]',
    description: 'ディスクの使用状況を表示します。-h: 人間が読みやすい単位で表示',
    check(tokens, ctx) {
      if (tokens[0] !== 'df') {
        return error('コマンドが違います', 'command');
      }
      return success();
    }
  },
  
  'free': {
    id: 'free',
    command: 'free',
    category: 'Linux',
    syntax: 'free',
    formatHint: 'free',
    description: 'メモリの使用状況を表示します',
    check(tokens, ctx) {
      if (tokens[0] !== 'free') {
        return error('コマンドが違います', 'command');
      }
      return success();
    }
  },
  
  // ============================================
  // Network
  // ============================================
  
  'ping': {
    id: 'ping',
    command: 'ping',
    category: 'Network',
    syntax: 'ping <host>',
    formatHint: 'ping <ホスト名/IPアドレス>',
    description: '指定したホストへの疎通確認を行います',
    check(tokens, ctx) {
      if (tokens[0] !== 'ping') {
        return error('コマンドが違います', 'command');
      }
      if (tokens.length < 2) {
        return error('ホスト名またはIPアドレスを指定してください', 'missing');
      }
      return success();
    }
  },
  
  'ssh': {
    id: 'ssh',
    command: 'ssh',
    category: 'Network',
    syntax: 'ssh <user>@<host>',
    formatHint: 'ssh <ユーザー>@<ホスト>',
    description: 'リモートサーバーにSSH接続します',
    check(tokens, ctx) {
      if (tokens[0] !== 'ssh') {
        return error('コマンドが違います', 'command');
      }
      if (tokens.length < 2) {
        return error('接続先を指定してください（例: user@host）', 'missing');
      }
      if (!tokens[1].includes('@')) {
        return error('ユーザー名@ホスト名 の形式で指定してください', 'argument');
      }
      return success();
    }
  },
  
  'scp': {
    id: 'scp',
    command: 'scp',
    category: 'Network',
    syntax: 'scp <src> <user>@<host>:<dest>',
    formatHint: 'scp <ファイル> <ユーザー>@<ホスト>:<パス>',
    description: 'リモートサーバーにファイルを転送します',
    check(tokens, ctx) {
      if (tokens[0] !== 'scp') {
        return error('コマンドが違います', 'command');
      }
      if (tokens.length < 3) {
        return error('転送元と転送先を指定してください', 'missing');
      }
      return success();
    }
  },
  
  'exit': {
    id: 'exit',
    command: 'exit',
    category: 'Network',
    syntax: 'exit',
    formatHint: 'exit',
    description: '現在のセッションを終了します',
    check(tokens, ctx) {
      if (tokens[0] !== 'exit') {
        return error('コマンドが違います', 'command');
      }
      return success();
    }
  },
  
  'curl': {
    id: 'curl',
    command: 'curl',
    category: 'Network',
    syntax: 'curl [-o <file>] <url>',
    formatHint: 'curl <URL>',
    description: 'URLからデータを取得します。-o: ファイルに保存',
    check(tokens, ctx) {
      if (tokens[0] !== 'curl') {
        return error('コマンドが違います', 'command');
      }
      const args = tokens.filter(t => !t.startsWith('-'));
      if (args.length < 2) {
        return error('URLを指定してください', 'missing');
      }
      return success();
    }
  },
  
  'wget': {
    id: 'wget',
    command: 'wget',
    category: 'Network',
    syntax: 'wget <url>',
    formatHint: 'wget <URL>',
    description: 'URLからファイルをダウンロードします',
    check(tokens, ctx) {
      if (tokens[0] !== 'wget') {
        return error('コマンドが違います', 'command');
      }
      if (tokens.length < 2) {
        return error('URLを指定してください', 'missing');
      }
      return success();
    }
  },
  
  'traceroute': {
    id: 'traceroute',
    command: 'traceroute',
    category: 'Network',
    syntax: 'traceroute <host>',
    formatHint: 'traceroute <ホスト名>',
    description: '宛先までのネットワーク経路を表示します',
    check(tokens, ctx) {
      if (tokens[0] !== 'traceroute') {
        return error('コマンドが違います', 'command');
      }
      if (tokens.length < 2) {
        return error('ホスト名を指定してください', 'missing');
      }
      return success();
    }
  },
  
  'nslookup': {
    id: 'nslookup',
    command: 'nslookup',
    category: 'Network',
    syntax: 'nslookup <host>',
    formatHint: 'nslookup <ホスト名>',
    description: 'ホスト名のDNS情報を調べます',
    check(tokens, ctx) {
      if (tokens[0] !== 'nslookup') {
        return error('コマンドが違います', 'command');
      }
      if (tokens.length < 2) {
        return error('ホスト名を指定してください', 'missing');
      }
      return success();
    }
  },
  
  // ============================================
  // Git
  // ============================================
  
  'git.status': {
    id: 'git.status',
    command: 'git',
    subcommand: 'status',
    category: 'Git',
    syntax: 'git status',
    formatHint: 'git status',
    description: 'ワーキングツリーの状態を表示します',
    check(tokens, ctx) {
      if (tokens[0] !== 'git') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'status') {
        return error('サブコマンドが違います。期待: status', 'subcommand');
      }
      return success();
    }
  },
  
  'git.add': {
    id: 'git.add',
    command: 'git',
    subcommand: 'add',
    category: 'Git',
    syntax: 'git add <file>',
    formatHint: 'git add <ファイル名>',
    description: 'ファイルをステージングエリアに追加します',
    check(tokens, ctx) {
      if (tokens[0] !== 'git') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'add') {
        return error('サブコマンドが違います。期待: add', 'subcommand');
      }
      if (tokens.length < 3) {
        return error('ファイル名を指定してください', 'missing');
      }
      return success();
    }
  },
  
  'git.commit': {
    id: 'git.commit',
    command: 'git',
    subcommand: 'commit',
    category: 'Git',
    syntax: 'git commit -m "<message>"',
    formatHint: 'git commit -m "<メッセージ>"',
    description: 'ステージされた変更をコミットします。-m オプションでメッセージを指定',
    check(tokens, ctx) {
      if (tokens[0] !== 'git') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'commit') {
        return error('サブコマンドが違います。期待: commit', 'subcommand');
      }
      if (!tokens.includes('-m')) {
        return error('-m オプションでメッセージを指定してください', 'option');
      }
      const mIndex = tokens.indexOf('-m');
      if (mIndex === tokens.length - 1 || !tokens[mIndex + 1]) {
        return error('コミットメッセージを指定してください', 'missing');
      }
      return success();
    }
  },
  
  'git.push': {
    id: 'git.push',
    command: 'git',
    subcommand: 'push',
    category: 'Git',
    syntax: 'git push',
    formatHint: 'git push',
    description: 'ローカルの変更をリモートリポジトリにプッシュします',
    check(tokens, ctx) {
      if (tokens[0] !== 'git') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'push') {
        return error('サブコマンドが違います。期待: push', 'subcommand');
      }
      return success();
    }
  },
  
  'git.pull': {
    id: 'git.pull',
    command: 'git',
    subcommand: 'pull',
    category: 'Git',
    syntax: 'git pull',
    formatHint: 'git pull',
    description: 'リモートリポジトリから変更を取得してマージします',
    check(tokens, ctx) {
      if (tokens[0] !== 'git') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'pull') {
        return error('サブコマンドが違います。期待: pull', 'subcommand');
      }
      return success();
    }
  },
  
  'git.log': {
    id: 'git.log',
    command: 'git',
    subcommand: 'log',
    category: 'Git',
    syntax: 'git log',
    formatHint: 'git log',
    description: 'コミット履歴を表示します',
    check(tokens, ctx) {
      if (tokens[0] !== 'git') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'log') {
        return error('サブコマンドが違います。期待: log', 'subcommand');
      }
      return success();
    }
  },
  
  'git.branch': {
    id: 'git.branch',
    command: 'git',
    subcommand: 'branch',
    category: 'Git',
    syntax: 'git branch',
    formatHint: 'git branch',
    description: 'ブランチ一覧を表示します',
    check(tokens, ctx) {
      if (tokens[0] !== 'git') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'branch') {
        return error('サブコマンドが違います。期待: branch', 'subcommand');
      }
      return success();
    }
  },
  
  'git.checkout': {
    id: 'git.checkout',
    command: 'git',
    subcommand: 'checkout',
    category: 'Git',
    syntax: 'git checkout [-b] <branch>',
    formatHint: 'git checkout [-b] <ブランチ名>',
    description: 'ブランチを切り替えます。-b: 新規作成して切り替え',
    check(tokens, ctx) {
      if (tokens[0] !== 'git') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'checkout') {
        return error('サブコマンドが違います。期待: checkout', 'subcommand');
      }
      const args = tokens.filter(t => !t.startsWith('-'));
      if (args.length < 3) {
        return error('ブランチ名を指定してください', 'missing');
      }
      return success();
    }
  },
  
  'git.switch': {
    id: 'git.switch',
    command: 'git',
    subcommand: 'switch',
    category: 'Git',
    syntax: 'git switch [-c] <branch>',
    formatHint: 'git switch [-c] <ブランチ名>',
    description: 'ブランチを切り替えます。-c: 新規作成して切り替え',
    check(tokens, ctx) {
      if (tokens[0] !== 'git') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'switch') {
        return error('サブコマンドが違います。期待: switch', 'subcommand');
      }
      const args = tokens.filter(t => !t.startsWith('-'));
      if (args.length < 3) {
        return error('ブランチ名を指定してください', 'missing');
      }
      return success();
    }
  },
  
  'git.merge': {
    id: 'git.merge',
    command: 'git',
    subcommand: 'merge',
    category: 'Git',
    syntax: 'git merge <branch>',
    formatHint: 'git merge <ブランチ名>',
    description: '指定したブランチを現在のブランチにマージします',
    check(tokens, ctx) {
      if (tokens[0] !== 'git') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'merge') {
        return error('サブコマンドが違います。期待: merge', 'subcommand');
      }
      if (tokens.length < 3) {
        return error('マージするブランチ名を指定してください', 'missing');
      }
      return success();
    }
  },
  
  'git.diff': {
    id: 'git.diff',
    command: 'git',
    subcommand: 'diff',
    category: 'Git',
    syntax: 'git diff [--staged]',
    formatHint: 'git diff [--staged]',
    description: '変更差分を表示します。--staged: ステージ済みの差分',
    check(tokens, ctx) {
      if (tokens[0] !== 'git') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'diff') {
        return error('サブコマンドが違います。期待: diff', 'subcommand');
      }
      return success();
    }
  },
  
  'git.stash': {
    id: 'git.stash',
    command: 'git',
    subcommand: 'stash',
    category: 'Git',
    syntax: 'git stash [list|pop]',
    formatHint: 'git stash [list|pop]',
    description: '変更を一時退避します。list: 一覧表示、pop: 復元',
    check(tokens, ctx) {
      if (tokens[0] !== 'git') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'stash') {
        return error('サブコマンドが違います。期待: stash', 'subcommand');
      }
      return success();
    }
  },
  
  // ============================================
  // Docker
  // ============================================
  
  'docker.ps': {
    id: 'docker.ps',
    command: 'docker',
    subcommand: 'ps',
    category: 'Docker',
    syntax: 'docker ps [-a]',
    formatHint: 'docker ps [-a]',
    description: 'コンテナ一覧を表示します。-a: 停止中のコンテナも表示',
    check(tokens, ctx) {
      if (tokens[0] !== 'docker') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'ps') {
        return error('サブコマンドが違います。期待: ps', 'subcommand');
      }
      return success();
    }
  },
  
  'docker.run': {
    id: 'docker.run',
    command: 'docker',
    subcommand: 'run',
    category: 'Docker',
    syntax: 'docker run [-d] [-it] <image>',
    formatHint: 'docker run [オプション] <イメージ名>',
    description: 'コンテナを起動します。-d: デタッチモード、-it: インタラクティブモード',
    check(tokens, ctx) {
      if (tokens[0] !== 'docker') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'run') {
        return error('サブコマンドが違います。期待: run', 'subcommand');
      }
      const args = tokens.filter(t => !t.startsWith('-'));
      if (args.length < 3) {
        return error('イメージ名を指定してください', 'missing');
      }
      return success();
    }
  },
  
  'docker.stop': {
    id: 'docker.stop',
    command: 'docker',
    subcommand: 'stop',
    category: 'Docker',
    syntax: 'docker stop <container>',
    formatHint: 'docker stop <コンテナ名>',
    description: 'コンテナを停止します',
    check(tokens, ctx) {
      if (tokens[0] !== 'docker') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'stop') {
        return error('サブコマンドが違います。期待: stop', 'subcommand');
      }
      if (tokens.length < 3) {
        return error('コンテナ名を指定してください', 'missing');
      }
      return success();
    }
  },
  
  'docker.rm': {
    id: 'docker.rm',
    command: 'docker',
    subcommand: 'rm',
    category: 'Docker',
    syntax: 'docker rm <container>',
    formatHint: 'docker rm <コンテナ名>',
    description: 'コンテナを削除します',
    check(tokens, ctx) {
      if (tokens[0] !== 'docker') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'rm') {
        return error('サブコマンドが違います。期待: rm', 'subcommand');
      }
      if (tokens.length < 3) {
        return error('コンテナ名を指定してください', 'missing');
      }
      return success();
    }
  },
  
  'docker.rmi': {
    id: 'docker.rmi',
    command: 'docker',
    subcommand: 'rmi',
    category: 'Docker',
    syntax: 'docker rmi <image>',
    formatHint: 'docker rmi <イメージ名>',
    description: 'イメージを削除します',
    check(tokens, ctx) {
      if (tokens[0] !== 'docker') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'rmi') {
        return error('サブコマンドが違います。期待: rmi', 'subcommand');
      }
      if (tokens.length < 3) {
        return error('イメージ名を指定してください', 'missing');
      }
      return success();
    }
  },
  
  'docker.images': {
    id: 'docker.images',
    command: 'docker',
    subcommand: 'images',
    category: 'Docker',
    syntax: 'docker images',
    formatHint: 'docker images',
    description: 'ローカルのイメージ一覧を表示します',
    check(tokens, ctx) {
      if (tokens[0] !== 'docker') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'images') {
        return error('サブコマンドが違います。期待: images', 'subcommand');
      }
      return success();
    }
  },
  
  'docker.pull': {
    id: 'docker.pull',
    command: 'docker',
    subcommand: 'pull',
    category: 'Docker',
    syntax: 'docker pull <image>',
    formatHint: 'docker pull <イメージ名>',
    description: 'Docker Hubからイメージをダウンロードします',
    check(tokens, ctx) {
      if (tokens[0] !== 'docker') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'pull') {
        return error('サブコマンドが違います。期待: pull', 'subcommand');
      }
      if (tokens.length < 3) {
        return error('イメージ名を指定してください', 'missing');
      }
      return success();
    }
  },
  
  'docker.logs': {
    id: 'docker.logs',
    command: 'docker',
    subcommand: 'logs',
    category: 'Docker',
    syntax: 'docker logs [-f] <container>',
    formatHint: 'docker logs [-f] <コンテナ名>',
    description: 'コンテナのログを表示します。-f: リアルタイム監視',
    check(tokens, ctx) {
      if (tokens[0] !== 'docker') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'logs') {
        return error('サブコマンドが違います。期待: logs', 'subcommand');
      }
      const args = tokens.filter(t => !t.startsWith('-'));
      if (args.length < 3) {
        return error('コンテナ名を指定してください', 'missing');
      }
      return success();
    }
  },
  
  'docker.exec': {
    id: 'docker.exec',
    command: 'docker',
    subcommand: 'exec',
    category: 'Docker',
    syntax: 'docker exec -it <container> <command>',
    formatHint: 'docker exec -it <コンテナ名> <コマンド>',
    description: 'コンテナ内でコマンドを実行します。-it: 対話モード',
    check(tokens, ctx) {
      if (tokens[0] !== 'docker') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'exec') {
        return error('サブコマンドが違います。期待: exec', 'subcommand');
      }
      const args = tokens.filter(t => !t.startsWith('-'));
      if (args.length < 4) {
        return error('コンテナ名と実行コマンドを指定してください', 'missing');
      }
      return success();
    }
  },
  
  'docker.build': {
    id: 'docker.build',
    command: 'docker',
    subcommand: 'build',
    category: 'Docker',
    syntax: 'docker build -t <name>:<tag> <path>',
    formatHint: 'docker build -t <イメージ名>:<タグ> <パス>',
    description: 'Dockerfileからイメージをビルドします',
    check(tokens, ctx) {
      if (tokens[0] !== 'docker') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'build') {
        return error('サブコマンドが違います。期待: build', 'subcommand');
      }
      if (!tokens.includes('-t')) {
        return error('-t オプションでイメージ名を指定してください', 'option');
      }
      return success();
    }
  },
  
  'docker.start': {
    id: 'docker.start',
    command: 'docker',
    subcommand: 'start',
    category: 'Docker',
    syntax: 'docker start <container>',
    formatHint: 'docker start <コンテナ名>',
    description: '停止中のコンテナを起動します',
    check(tokens, ctx) {
      if (tokens[0] !== 'docker') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'start') {
        return error('サブコマンドが違います。期待: start', 'subcommand');
      }
      if (tokens.length < 3) {
        return error('コンテナ名を指定してください', 'missing');
      }
      return success();
    }
  },
  
  'docker.restart': {
    id: 'docker.restart',
    command: 'docker',
    subcommand: 'restart',
    category: 'Docker',
    syntax: 'docker restart <container>',
    formatHint: 'docker restart <コンテナ名>',
    description: 'コンテナを再起動します',
    check(tokens, ctx) {
      if (tokens[0] !== 'docker') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'restart') {
        return error('サブコマンドが違います。期待: restart', 'subcommand');
      }
      if (tokens.length < 3) {
        return error('コンテナ名を指定してください', 'missing');
      }
      return success();
    }
  },
  
  'docker.compose.up': {
    id: 'docker.compose.up',
    command: 'docker',
    subcommand: 'compose',
    category: 'Docker',
    syntax: 'docker compose up [-d]',
    formatHint: 'docker compose up [-d]',
    description: 'Docker Composeで定義されたサービスを起動します。-d: バックグラウンド実行',
    check(tokens, ctx) {
      if (tokens[0] !== 'docker') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'compose') {
        return error('サブコマンドが違います。期待: compose', 'subcommand');
      }
      if (tokens[2] !== 'up') {
        return error('compose の後に up を指定してください', 'argument');
      }
      return success();
    }
  },
  
  'docker.compose.down': {
    id: 'docker.compose.down',
    command: 'docker',
    subcommand: 'compose',
    category: 'Docker',
    syntax: 'docker compose down [-v]',
    formatHint: 'docker compose down [-v]',
    description: 'Docker Composeで定義されたサービスを停止・削除します。-v: ボリュームも削除',
    check(tokens, ctx) {
      if (tokens[0] !== 'docker') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'compose') {
        return error('サブコマンドが違います。期待: compose', 'subcommand');
      }
      if (tokens[2] !== 'down') {
        return error('compose の後に down を指定してください', 'argument');
      }
      return success();
    }
  },
  
  'docker.compose.ps': {
    id: 'docker.compose.ps',
    command: 'docker',
    subcommand: 'compose',
    category: 'Docker',
    syntax: 'docker compose ps',
    formatHint: 'docker compose ps',
    description: 'Docker Composeのサービス状態を表示します',
    check(tokens, ctx) {
      if (tokens[0] !== 'docker') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'compose') {
        return error('サブコマンドが違います。期待: compose', 'subcommand');
      }
      if (tokens[2] !== 'ps') {
        return error('compose の後に ps を指定してください', 'argument');
      }
      return success();
    }
  },
  
  'docker.compose.logs': {
    id: 'docker.compose.logs',
    command: 'docker',
    subcommand: 'compose',
    category: 'Docker',
    syntax: 'docker compose logs [-f] [service]',
    formatHint: 'docker compose logs [-f] [サービス名]',
    description: 'Docker Composeのログを表示します。-f: リアルタイム監視',
    check(tokens, ctx) {
      if (tokens[0] !== 'docker') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'compose') {
        return error('サブコマンドが違います。期待: compose', 'subcommand');
      }
      if (tokens[2] !== 'logs') {
        return error('compose の後に logs を指定してください', 'argument');
      }
      return success();
    }
  },
  
  'docker.compose.exec': {
    id: 'docker.compose.exec',
    command: 'docker',
    subcommand: 'compose',
    category: 'Docker',
    syntax: 'docker compose exec <service> <command>',
    formatHint: 'docker compose exec <サービス名> <コマンド>',
    description: 'Docker Composeのサービス内でコマンドを実行します',
    check(tokens, ctx) {
      if (tokens[0] !== 'docker') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'compose') {
        return error('サブコマンドが違います。期待: compose', 'subcommand');
      }
      if (tokens[2] !== 'exec') {
        return error('compose の後に exec を指定してください', 'argument');
      }
      if (tokens.length < 5) {
        return error('サービス名とコマンドを指定してください', 'missing');
      }
      return success();
    }
  },
  
  'docker.compose.build': {
    id: 'docker.compose.build',
    command: 'docker',
    subcommand: 'compose',
    category: 'Docker',
    syntax: 'docker compose build [service]',
    formatHint: 'docker compose build [サービス名]',
    description: 'Docker Composeのサービスをビルドします',
    check(tokens, ctx) {
      if (tokens[0] !== 'docker') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'compose') {
        return error('サブコマンドが違います。期待: compose', 'subcommand');
      }
      if (tokens[2] !== 'build') {
        return error('compose の後に build を指定してください', 'argument');
      }
      return success();
    }
  },
  
  // ============================================
  // Python
  // ============================================
  
  'python.venv': {
    id: 'python.venv',
    command: 'python3',
    subcommand: '-m',
    category: 'Python',
    syntax: 'python3 -m venv <name>',
    formatHint: 'python3 -m venv <環境名>',
    description: 'Python仮想環境を作成します',
    check(tokens, ctx) {
      if (tokens[0] !== 'python3') {
        return error('コマンドが違います。python3 を使用してください', 'command');
      }
      if (tokens[1] !== '-m') {
        return error('-m オプションが必要です', 'option');
      }
      if (tokens[2] !== 'venv') {
        return error('venv モジュールを指定してください', 'argument');
      }
      if (tokens.length < 4) {
        return error('環境名を指定してください', 'missing');
      }
      return success();
    }
  },
  
  'source': {
    id: 'source',
    command: 'source',
    category: 'Python',
    syntax: 'source <venv>/bin/activate',
    formatHint: 'source <環境名>/bin/activate',
    description: '仮想環境を有効化します',
    check(tokens, ctx) {
      if (tokens[0] !== 'source') {
        return error('コマンドが違います', 'command');
      }
      if (tokens.length < 2) {
        return error('有効化するパスを指定してください', 'missing');
      }
      if (!tokens[1].includes('/bin/activate')) {
        return error('パスは <環境名>/bin/activate の形式で指定してください', 'argument');
      }
      return success();
    }
  },
  
  'pip.install': {
    id: 'pip.install',
    command: 'pip',
    subcommand: 'install',
    category: 'Python',
    syntax: 'pip install <package>',
    formatHint: 'pip install <パッケージ名>',
    description: 'Pythonパッケージをインストールします',
    check(tokens, ctx) {
      if (tokens[0] !== 'pip') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'install') {
        return error('サブコマンドが違います。期待: install', 'subcommand');
      }
      if (tokens.length < 3) {
        return error('パッケージ名を指定してください', 'missing');
      }
      return success();
    }
  },
  
  'pip.list': {
    id: 'pip.list',
    command: 'pip',
    subcommand: 'list',
    category: 'Python',
    syntax: 'pip list',
    formatHint: 'pip list',
    description: 'インストール済みパッケージ一覧を表示します',
    check(tokens, ctx) {
      if (tokens[0] !== 'pip') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'list') {
        return error('サブコマンドが違います。期待: list', 'subcommand');
      }
      return success();
    }
  },
  
  'pip.freeze': {
    id: 'pip.freeze',
    command: 'pip',
    subcommand: 'freeze',
    category: 'Python',
    syntax: 'pip freeze',
    formatHint: 'pip freeze',
    description: 'パッケージ一覧をrequirements.txt形式で出力します',
    check(tokens, ctx) {
      if (tokens[0] !== 'pip') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'freeze') {
        return error('サブコマンドが違います。期待: freeze', 'subcommand');
      }
      return success();
    }
  },
  
  'pip.install.requirements': {
    id: 'pip.install.requirements',
    command: 'pip',
    subcommand: 'install',
    category: 'Python',
    syntax: 'pip install -r requirements.txt',
    formatHint: 'pip install -r <ファイル名>',
    description: 'requirements.txtからパッケージを一括インストールします',
    check(tokens, ctx) {
      if (tokens[0] !== 'pip') {
        return error('コマンドが違います', 'command');
      }
      if (tokens[1] !== 'install') {
        return error('サブコマンドが違います。期待: install', 'subcommand');
      }
      if (!tokens.includes('-r')) {
        return error('-r オプションが必要です', 'option');
      }
      return success();
    }
  },
  
  'python.run': {
    id: 'python.run',
    command: 'python',
    category: 'Python',
    syntax: 'python <script.py>',
    formatHint: 'python <スクリプト名>',
    description: 'Pythonスクリプトを実行します',
    check(tokens, ctx) {
      if (tokens[0] !== 'python') {
        return error('コマンドが違います', 'command');
      }
      if (tokens.length < 2) {
        return error('スクリプトファイル名を指定してください', 'missing');
      }
      return success();
    }
  },
  
  'deactivate': {
    id: 'deactivate',
    command: 'deactivate',
    category: 'Python',
    syntax: 'deactivate',
    formatHint: 'deactivate',
    description: '仮想環境を無効化します',
    check(tokens, ctx) {
      if (tokens[0] !== 'deactivate') {
        return error('コマンドが違います', 'command');
      }
      return success();
    }
  },
};

/**
 * 期待コマンドとユーザー入力を比較して判定
 */
export function judgeCommand(
  userInput: string,
  expectation: string,
  ctx: JudgeContext
): JudgeResult {
  const userTokens = tokenize(userInput);
  const expectedTokens = tokenize(expectation);
  
  if (userTokens.length === 0) {
    return error('コマンドが入力されていません', 'missing');
  }
  
  return compareCommands(userTokens, expectedTokens, ctx);
}

/**
 * コマンドIDからコマンド定義を取得
 */
export function getCommandDef(commandId: string): CommandDef | undefined {
  return COMMAND_DEFS[commandId];
}

/**
 * カテゴリからコマンド定義一覧を取得
 */
export function getCommandsByCategory(category: string): CommandDef[] {
  return Object.values(COMMAND_DEFS).filter(def => def.category === category);
}
