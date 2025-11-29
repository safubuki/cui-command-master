/**
 * コマンド実行エンジン - VFSを操作してコマンドをシミュレート
 */

import { VFSState, CommandExecutionResult, DynamicContext, TerminalEnvironment } from '../types';
import { tokenize } from './tokenizer';
import * as vfs from './vfs';

/** コマンド実行コンテキスト */
interface ExecutionContext {
  vfs: VFSState;
  dynamic: DynamicContext;
  env: TerminalEnvironment;
}

/** コマンドハンドラの型 */
type CommandHandler = (args: string[], ctx: ExecutionContext) => CommandExecutionResult;

/**
 * lsコマンドの実行
 */
function executeLs(args: string[], ctx: ExecutionContext): CommandExecutionResult {
  const options = args.filter(a => a.startsWith('-'));
  const paths = args.filter(a => !a.startsWith('-'));
  const targetPath = paths[0] || ctx.vfs.currentPath;
  
  const showAll = options.some(o => o.includes('a'));
  const longFormat = options.some(o => o.includes('l'));
  
  const node = vfs.getNode(ctx.vfs, targetPath);
  if (!node) {
    return {
      output: [`ls: ${targetPath}: そのようなファイルやディレクトリはありません`],
      success: false,
    };
  }
  
  if (node.type === 'file') {
    return {
      output: [node.name],
      success: true,
    };
  }
  
  let items = vfs.ls(ctx.vfs, targetPath);
  
  // -a オプションがない場合、隠しファイルを除外
  if (!showAll) {
    items = items.filter(name => !name.startsWith('.'));
  }
  
  if (items.length === 0) {
    return { output: [], success: true };
  }
  
  if (longFormat) {
    // 詳細表示
    const lines = items.map(name => {
      const itemNode = vfs.getNode(ctx.vfs, `${targetPath}/${name}`);
      const isDir = itemNode?.type === 'directory';
      const perm = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
      const size = isDir ? '4096' : (itemNode?.content?.length || 0).toString().padStart(4);
      return `${perm}  1 ${ctx.env.username} ${ctx.env.username} ${size} Nov 29 10:00 ${name}`;
    });
    return { output: lines, success: true };
  }
  
  // 通常表示（横並び）
  return { output: [items.join('  ')], success: true };
}

/**
 * cdコマンドの実行
 */
function executeCd(args: string[], ctx: ExecutionContext): CommandExecutionResult {
  const target = args[0] || ctx.env.homeDir;
  
  // ~ をホームディレクトリに展開
  const expandedTarget = target.replace(/^~/, ctx.env.homeDir);
  
  const newVfs = vfs.cd(ctx.vfs, expandedTarget);
  
  if (newVfs.currentPath === ctx.vfs.currentPath && expandedTarget !== ctx.vfs.currentPath && expandedTarget !== '.') {
    return {
      output: [`cd: ${target}: そのようなファイルやディレクトリはありません`],
      success: false,
    };
  }
  
  return {
    output: [],
    success: true,
    newVfs,
  };
}

/**
 * pwdコマンドの実行
 */
function executePwd(args: string[], ctx: ExecutionContext): CommandExecutionResult {
  return {
    output: [ctx.vfs.currentPath],
    success: true,
  };
}

/**
 * mkdirコマンドの実行
 */
function executeMkdir(args: string[], ctx: ExecutionContext): CommandExecutionResult {
  if (args.length === 0) {
    return {
      output: ['mkdir: オペランドがありません'],
      success: false,
    };
  }
  
  const dirName = args.find(a => !a.startsWith('-')) || '';
  
  if (vfs.exists(ctx.vfs, dirName)) {
    return {
      output: [`mkdir: ${dirName}: ファイルが存在します`],
      success: false,
    };
  }
  
  const newVfs = vfs.mkdir(ctx.vfs, dirName);
  
  return {
    output: [],
    success: true,
    newVfs,
  };
}

/**
 * touchコマンドの実行
 */
function executeTouch(args: string[], ctx: ExecutionContext): CommandExecutionResult {
  if (args.length === 0) {
    return {
      output: ['touch: オペランドがありません'],
      success: false,
    };
  }
  
  const fileName = args[0];
  const newVfs = vfs.touch(ctx.vfs, fileName);
  
  return {
    output: [],
    success: true,
    newVfs,
  };
}

/**
 * rmコマンドの実行
 */
function executeRm(args: string[], ctx: ExecutionContext): CommandExecutionResult {
  const options = args.filter(a => a.startsWith('-'));
  const targets = args.filter(a => !a.startsWith('-'));
  
  if (targets.length === 0) {
    return {
      output: ['rm: オペランドがありません'],
      success: false,
    };
  }
  
  const recursive = options.some(o => o.includes('r') || o.includes('R'));
  const force = options.some(o => o.includes('f'));
  
  const target = targets[0];
  
  if (!vfs.exists(ctx.vfs, target)) {
    if (force) {
      return { output: [], success: true };
    }
    return {
      output: [`rm: ${target}: そのようなファイルやディレクトリはありません`],
      success: false,
    };
  }
  
  if (vfs.isDirectory(ctx.vfs, target) && !recursive) {
    return {
      output: [`rm: ${target}: ディレクトリです`],
      success: false,
    };
  }
  
  const newVfs = vfs.rm(ctx.vfs, target, recursive);
  
  return {
    output: [],
    success: true,
    newVfs,
  };
}

/**
 * cpコマンドの実行
 */
function executeCp(args: string[], ctx: ExecutionContext): CommandExecutionResult {
  const options = args.filter(a => a.startsWith('-'));
  const paths = args.filter(a => !a.startsWith('-'));
  
  if (paths.length < 2) {
    return {
      output: ['cp: コピー元とコピー先を指定してください'],
      success: false,
    };
  }
  
  const [src, dest] = paths;
  
  if (!vfs.exists(ctx.vfs, src)) {
    return {
      output: [`cp: ${src}: そのようなファイルやディレクトリはありません`],
      success: false,
    };
  }
  
  const recursive = options.some(o => o.includes('r') || o.includes('R'));
  
  if (vfs.isDirectory(ctx.vfs, src) && !recursive) {
    return {
      output: [`cp: -r を指定しないと ${src} をコピーできません`],
      success: false,
    };
  }
  
  const newVfs = vfs.cp(ctx.vfs, src, dest);
  
  return {
    output: [],
    success: true,
    newVfs,
  };
}

/**
 * mvコマンドの実行
 */
function executeMv(args: string[], ctx: ExecutionContext): CommandExecutionResult {
  const paths = args.filter(a => !a.startsWith('-'));
  
  if (paths.length < 2) {
    return {
      output: ['mv: 移動元と移動先を指定してください'],
      success: false,
    };
  }
  
  const [src, dest] = paths;
  
  if (!vfs.exists(ctx.vfs, src)) {
    return {
      output: [`mv: ${src}: そのようなファイルやディレクトリはありません`],
      success: false,
    };
  }
  
  const newVfs = vfs.mv(ctx.vfs, src, dest);
  
  return {
    output: [],
    success: true,
    newVfs,
  };
}

/**
 * catコマンドの実行
 */
function executeCat(args: string[], ctx: ExecutionContext): CommandExecutionResult {
  if (args.length === 0) {
    return {
      output: ['cat: ファイル名を指定してください'],
      success: false,
    };
  }
  
  const fileName = args[0];
  const node = vfs.getNode(ctx.vfs, fileName);
  
  if (!node) {
    return {
      output: [`cat: ${fileName}: そのようなファイルやディレクトリはありません`],
      success: false,
    };
  }
  
  if (node.type === 'directory') {
    return {
      output: [`cat: ${fileName}: ディレクトリです`],
      success: false,
    };
  }
  
  const content = node.content || '';
  return {
    output: content ? content.split('\n') : [],
    success: true,
  };
}

/**
 * psコマンドの実行（シミュレーション）
 */
function executePs(args: string[], ctx: ExecutionContext): CommandExecutionResult {
  const showAll = args.some(a => a.includes('a') || a.includes('aux'));
  
  const processes = [
    { pid: '1', cmd: '/sbin/init' },
    { pid: '125', cmd: '/usr/sbin/sshd' },
    { pid: '3421', cmd: 'bash' },
    { pid: ctx.dynamic.pid || '9999', cmd: 'python3 app.py' },
  ];
  
  if (showAll) {
    const lines = [
      'USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND',
      ...processes.map(p => 
        `${ctx.env.username.padEnd(10)} ${p.pid.padStart(5)}  0.0  0.1   4500  2100 pts/0    S+   10:00   0:00 ${p.cmd}`
      ),
    ];
    return { output: lines, success: true };
  }
  
  const lines = [
    '  PID TTY          TIME CMD',
    ...processes.slice(2).map(p => 
      `${p.pid.padStart(5)} pts/0    00:00:00 ${p.cmd}`
    ),
  ];
  return { output: lines, success: true };
}

/**
 * dfコマンドの実行（シミュレーション）
 */
function executeDf(args: string[], ctx: ExecutionContext): CommandExecutionResult {
  const humanReadable = args.some(a => a.includes('h'));
  
  if (humanReadable) {
    return {
      output: [
        'Filesystem      Size  Used Avail Use% Mounted on',
        '/dev/sda1        50G   32G   16G  67% /',
        '/dev/sda2       100G   45G   50G  48% /home',
        'tmpfs           2.0G     0  2.0G   0% /tmp',
      ],
      success: true,
    };
  }
  
  return {
    output: [
      'Filesystem     1K-blocks     Used Available Use% Mounted on',
      '/dev/sda1       52428800 33554432  16777216  67% /',
      '/dev/sda2      104857600 47185920  52428800  48% /home',
      'tmpfs            2097152        0   2097152   0% /tmp',
    ],
    success: true,
  };
}

/**
 * freeコマンドの実行（シミュレーション）
 */
function executeFree(args: string[], ctx: ExecutionContext): CommandExecutionResult {
  return {
    output: [
      '              total        used        free      shared  buff/cache   available',
      'Mem:        8048572     2156840     3891732       12456     2000000     5632568',
      'Swap:       2097148           0     2097148',
    ],
    success: true,
  };
}

/**
 * killコマンドの実行（シミュレーション）
 */
function executeKill(args: string[], ctx: ExecutionContext): CommandExecutionResult {
  const pids = args.filter(a => !a.startsWith('-'));
  
  if (pids.length === 0) {
    return {
      output: ['kill: プロセスIDを指定してください'],
      success: false,
    };
  }
  
  return {
    output: [],
    success: true,
  };
}

/**
 * gitコマンドの実行（シミュレーション）
 */
function executeGit(args: string[], ctx: ExecutionContext): CommandExecutionResult {
  if (args.length === 0) {
    return {
      output: ['usage: git [--version] [--help] <command> [<args>]'],
      success: false,
    };
  }
  
  const subcommand = args[0];
  const virtualEnv = ctx.vfs.virtualEnv;
  
  switch (subcommand) {
    case 'status':
      return {
        output: [
          `On branch ${virtualEnv?.currentBranch || 'main'}`,
          'Your branch is up to date with \'origin/main\'.',
          '',
          'Changes not staged for commit:',
          `  modified:   ${ctx.dynamic.filename || 'app.js'}`,
          '',
          'no changes added to commit',
        ],
        success: true,
      };
    
    case 'add':
      return { output: [], success: true };
    
    case 'commit':
      const mIndex = args.indexOf('-m');
      const msg = mIndex >= 0 ? args[mIndex + 1] : 'update';
      return {
        output: [
          `[${virtualEnv?.currentBranch || 'main'} abc1234] ${msg}`,
          ' 1 file changed, 10 insertions(+), 2 deletions(-)',
        ],
        success: true,
      };
    
    case 'push':
      return {
        output: [
          'Enumerating objects: 5, done.',
          'Counting objects: 100% (5/5), done.',
          'Writing objects: 100% (3/3), 320 bytes | 320.00 KiB/s, done.',
          'To github.com:user/repo.git',
          `   abc1234..def5678  ${virtualEnv?.currentBranch || 'main'} -> ${virtualEnv?.currentBranch || 'main'}`,
        ],
        success: true,
      };
    
    case 'pull':
      return {
        output: [
          'Already up to date.',
        ],
        success: true,
      };
    
    case 'log':
      return {
        output: [
          `commit abc1234567890 (HEAD -> ${virtualEnv?.currentBranch || 'main'}, origin/main)`,
          `Author: ${ctx.env.username} <${ctx.env.username}@example.com>`,
          'Date:   Fri Nov 29 10:00:00 2024 +0900',
          '',
          '    Initial commit',
        ],
        success: true,
      };
    
    case 'branch':
      const branches = virtualEnv?.branches || ['main'];
      const currentBranch = virtualEnv?.currentBranch || 'main';
      return {
        output: branches.map(b => b === currentBranch ? `* ${b}` : `  ${b}`),
        success: true,
      };
    
    case 'checkout':
      const checkoutArgs = args.slice(1);
      const createBranch = checkoutArgs.includes('-b');
      const branchName = createBranch 
        ? checkoutArgs.find(a => a !== '-b') 
        : checkoutArgs[0];
      
      if (!branchName) {
        return {
          output: ['error: ブランチ名を指定してください'],
          success: false,
        };
      }
      
      const newVfsForCheckout = { ...ctx.vfs };
      if (newVfsForCheckout.virtualEnv) {
        const existingBranches = newVfsForCheckout.virtualEnv.branches;
        
        if (createBranch) {
          if (existingBranches.includes(branchName)) {
            return {
              output: [`fatal: ブランチ '${branchName}' は既に存在します`],
              success: false,
            };
          }
          newVfsForCheckout.virtualEnv = {
            ...newVfsForCheckout.virtualEnv,
            branches: [...existingBranches, branchName],
            currentBranch: branchName,
          };
        } else {
          if (!existingBranches.includes(branchName)) {
            return {
              output: [`error: pathspec '${branchName}' did not match any file(s) known to git`],
              success: false,
            };
          }
          newVfsForCheckout.virtualEnv = {
            ...newVfsForCheckout.virtualEnv,
            currentBranch: branchName,
          };
        }
      }
      
      return {
        output: createBranch 
          ? [`Switched to a new branch '${branchName}'`]
          : [`Switched to branch '${branchName}'`],
        success: true,
        newVfs: newVfsForCheckout,
      };
    
    case 'diff':
      return {
        output: [
          `diff --git a/${ctx.dynamic.filename || 'app.js'} b/${ctx.dynamic.filename || 'app.js'}`,
          'index abc1234..def5678 100644',
          `--- a/${ctx.dynamic.filename || 'app.js'}`,
          `+++ b/${ctx.dynamic.filename || 'app.js'}`,
          '@@ -1,5 +1,7 @@',
          ' function main() {',
          '-  console.log("old");',
          '+  console.log("new");',
          '+  // added comment',
          ' }',
        ],
        success: true,
      };
    
    case 'stash':
      const stashSubcmd = args[1];
      const newVfsForStash = { ...ctx.vfs };
      
      if (!stashSubcmd || stashSubcmd === 'push') {
        // stash push
        if (newVfsForStash.virtualEnv) {
          newVfsForStash.virtualEnv = {
            ...newVfsForStash.virtualEnv,
            stashStack: newVfsForStash.virtualEnv.stashStack + 1,
          };
        }
        return {
          output: ['Saved working directory and index state WIP on main: abc1234 Initial commit'],
          success: true,
          newVfs: newVfsForStash,
        };
      }
      
      if (stashSubcmd === 'list') {
        const stashCount = virtualEnv?.stashStack || 0;
        if (stashCount === 0) {
          return { output: [], success: true };
        }
        return {
          output: Array.from({ length: stashCount }, (_, i) => 
            `stash@{${i}}: WIP on main: abc1234 Initial commit`
          ),
          success: true,
        };
      }
      
      if (stashSubcmd === 'pop') {
        const stashCount = virtualEnv?.stashStack || 0;
        if (stashCount === 0) {
          return {
            output: ['error: No stash entries found.'],
            success: false,
          };
        }
        if (newVfsForStash.virtualEnv) {
          newVfsForStash.virtualEnv = {
            ...newVfsForStash.virtualEnv,
            stashStack: newVfsForStash.virtualEnv.stashStack - 1,
          };
        }
        return {
          output: [
            `On branch ${virtualEnv?.currentBranch || 'main'}`,
            'Changes not staged for commit:',
            `  modified:   ${ctx.dynamic.filename || 'app.js'}`,
            '',
            'Dropped refs/stash@{0}',
          ],
          success: true,
          newVfs: newVfsForStash,
        };
      }
      
      return { output: [], success: true };
    
    default:
      return {
        output: [`git: '${subcommand}' は git コマンドではありません`],
        success: false,
      };
  }
}

/**
 * dockerコマンドの実行（シミュレーション）
 */
function executeDocker(args: string[], ctx: ExecutionContext): CommandExecutionResult {
  if (args.length === 0) {
    return {
      output: ['Usage: docker [OPTIONS] COMMAND'],
      success: false,
    };
  }
  
  const subcommand = args[0];
  const virtualEnv = ctx.vfs.virtualEnv;
  
  switch (subcommand) {
    case 'ps':
      const showAll = args.includes('-a');
      const runningContainers = virtualEnv?.runningContainers || [];
      
      if (runningContainers.length === 0 && !showAll) {
        return {
          output: [
            'CONTAINER ID   IMAGE            COMMAND                  CREATED        STATUS          NAMES',
          ],
          success: true,
        };
      }
      
      const lines = [
        'CONTAINER ID   IMAGE            COMMAND                  CREATED        STATUS                     NAMES',
        ...runningContainers.map(name => 
          `abc123def456   nginx:latest     "docker-entrypoint.s…"   2 hours ago    Up 2 hours                 ${name}`
        ),
      ];
      
      return {
        output: lines,
        success: true,
      };
    
    case 'images':
      const pulledImages = virtualEnv?.pulledImages || [];
      const imageLines = [
        'REPOSITORY   TAG       IMAGE ID       CREATED        SIZE',
        ...pulledImages.map(img => {
          const [repo, tag] = img.includes(':') ? img.split(':') : [img, 'latest'];
          return `${repo.padEnd(12)} ${tag.padEnd(9)} sha256:abc1   2 weeks ago    150MB`;
        }),
      ];
      return {
        output: imageLines,
        success: true,
      };
    
    case 'pull':
      const imageToPull = args[1] || 'nginx:latest';
      const newVfsForPull = { ...ctx.vfs };
      if (newVfsForPull.virtualEnv && !newVfsForPull.virtualEnv.pulledImages.includes(imageToPull)) {
        newVfsForPull.virtualEnv = {
          ...newVfsForPull.virtualEnv,
          pulledImages: [...newVfsForPull.virtualEnv.pulledImages, imageToPull],
        };
      }
      return {
        output: [
          `Using default tag: latest`,
          `Pulling from library/${imageToPull.split(':')[0]}`,
          `Digest: sha256:abc123...`,
          `Status: Downloaded newer image for ${imageToPull}`,
        ],
        success: true,
        newVfs: newVfsForPull,
      };
    
    case 'run':
      const imageToRun = args.find(a => !a.startsWith('-')) || 'nginx:latest';
      const containerName = ctx.dynamic.container || `container-${Date.now()}`;
      const newVfsForRun = { ...ctx.vfs };
      if (newVfsForRun.virtualEnv) {
        newVfsForRun.virtualEnv = {
          ...newVfsForRun.virtualEnv,
          runningContainers: [...newVfsForRun.virtualEnv.runningContainers, containerName],
          pulledImages: newVfsForRun.virtualEnv.pulledImages.includes(imageToRun)
            ? newVfsForRun.virtualEnv.pulledImages
            : [...newVfsForRun.virtualEnv.pulledImages, imageToRun],
        };
      }
      return {
        output: ['abc123def456789...'],
        success: true,
        newVfs: newVfsForRun,
      };
    
    case 'stop':
      const containerToStop = args[1] || '';
      const newVfsForStop = { ...ctx.vfs };
      if (newVfsForStop.virtualEnv) {
        newVfsForStop.virtualEnv = {
          ...newVfsForStop.virtualEnv,
          runningContainers: newVfsForStop.virtualEnv.runningContainers.filter(c => c !== containerToStop),
        };
      }
      return {
        output: [containerToStop],
        success: true,
        newVfs: newVfsForStop,
      };
    
    case 'rm':
      const containerToRm = args[1] || '';
      return {
        output: [containerToRm],
        success: true,
      };
    
    case 'rmi':
      const imageToRm = args[1] || '';
      const newVfsForRmi = { ...ctx.vfs };
      if (newVfsForRmi.virtualEnv) {
        newVfsForRmi.virtualEnv = {
          ...newVfsForRmi.virtualEnv,
          pulledImages: newVfsForRmi.virtualEnv.pulledImages.filter(i => i !== imageToRm),
        };
      }
      return {
        output: [`Untagged: ${imageToRm}`, 'Deleted: sha256:abc123...'],
        success: true,
        newVfs: newVfsForRmi,
      };
    
    case 'logs':
      const containerForLogs = args[1] || '';
      return {
        output: [
          `[${containerForLogs}] Starting application...`,
          `[${containerForLogs}] Listening on port 80`,
          `[${containerForLogs}] Ready to accept connections`,
        ],
        success: true,
      };
    
    case 'exec':
      return {
        output: [],
        success: true,
      };
    
    case 'compose':
      const composeCmd = args[1];
      if (composeCmd === 'up') {
        return {
          output: [
            '[+] Running 2/2',
            ' ✔ Network app_default    Created',
            ' ✔ Container app-web-1    Started',
          ],
          success: true,
        };
      }
      if (composeCmd === 'down') {
        return {
          output: [
            '[+] Running 2/2',
            ' ✔ Container app-web-1    Removed',
            ' ✔ Network app_default    Removed',
          ],
          success: true,
        };
      }
      return { output: [], success: true };
    
    default:
      return {
        output: [`docker: '${subcommand}' is not a docker command`],
        success: false,
      };
  }
}

/**
 * pipコマンドの実行（シミュレーション）
 */
function executePip(args: string[], ctx: ExecutionContext): CommandExecutionResult {
  if (args.length === 0) {
    return {
      output: ['Usage: pip <command> [options]'],
      success: false,
    };
  }
  
  const subcommand = args[0];
  const virtualEnv = ctx.vfs.virtualEnv;
  
  switch (subcommand) {
    case 'install':
      const pkg = args[1] || 'package';
      // パッケージをインストール済みリストに追加
      const newVfs = { ...ctx.vfs };
      if (newVfs.virtualEnv && !newVfs.virtualEnv.installedPackages.includes(pkg)) {
        newVfs.virtualEnv = {
          ...newVfs.virtualEnv,
          installedPackages: [...newVfs.virtualEnv.installedPackages, pkg],
        };
      }
      return {
        output: [
          `Collecting ${pkg}`,
          `  Downloading ${pkg}-1.0.0-py3-none-any.whl (50 kB)`,
          `Installing collected packages: ${pkg}`,
          `Successfully installed ${pkg}-1.0.0`,
        ],
        success: true,
        newVfs,
      };
    
    case 'list':
      // 基本パッケージ + インストール済みパッケージを表示
      const basePackages = [
        { name: 'pip', version: '23.0.1' },
        { name: 'setuptools', version: '65.5.1' },
      ];
      const installedPkgs = virtualEnv?.installedPackages || [];
      const allPackages = [
        ...basePackages,
        ...installedPkgs.map(p => ({ name: p, version: '1.0.0' })),
      ];
      
      return {
        output: [
          'Package    Version',
          '---------- -------',
          ...allPackages.map(p => `${p.name.padEnd(10)} ${p.version}`),
        ],
        success: true,
      };
    
    case 'freeze':
      const freezePackages = virtualEnv?.installedPackages || [];
      return {
        output: freezePackages.map(p => `${p}==1.0.0`),
        success: true,
      };
    
    default:
      return {
        output: [`pip: unknown command '${subcommand}'`],
        success: false,
      };
  }
}

/**
 * python3コマンドの実行（シミュレーション）
 */
function executePython3(args: string[], ctx: ExecutionContext): CommandExecutionResult {
  if (args.length === 0) {
    return {
      output: ['Python 3.11.0'],
      success: true,
    };
  }
  
  if (args[0] === '-m' && args[1] === 'venv') {
    const venvName = args[2] || 'venv';
    // 仮想環境ディレクトリを作成
    let newVfs = vfs.mkdir(ctx.vfs, venvName);
    newVfs = vfs.mkdir(newVfs, `${venvName}/bin`);
    newVfs = vfs.touch(newVfs, `${venvName}/bin/activate`);
    newVfs = vfs.mkdir(newVfs, `${venvName}/lib`);
    
    return {
      output: [],
      success: true,
      newVfs,
    };
  }
  
  return {
    output: [],
    success: true,
  };
}

/**
 * sourceコマンドの実行（シミュレーション）
 */
function executeSource(args: string[], ctx: ExecutionContext): CommandExecutionResult {
  if (args.length === 0) {
    return {
      output: ['source: ファイル名を指定してください'],
      success: false,
    };
  }
  
  const activatePath = args[0];
  
  if (!vfs.exists(ctx.vfs, activatePath)) {
    return {
      output: [`source: ${activatePath}: そのようなファイルやディレクトリはありません`],
      success: false,
    };
  }
  
  return {
    output: [],
    success: true,
  };
}

/**
 * pingコマンドの実行（シミュレーション）
 */
function executePing(args: string[], ctx: ExecutionContext): CommandExecutionResult {
  if (args.length === 0) {
    return {
      output: ['ping: ホストを指定してください'],
      success: false,
    };
  }
  
  const host = args[0];
  
  return {
    output: [
      `PING ${host} (${host}): 56 data bytes`,
      `64 bytes from ${host}: icmp_seq=0 ttl=64 time=0.5 ms`,
      `64 bytes from ${host}: icmp_seq=1 ttl=64 time=0.4 ms`,
      `64 bytes from ${host}: icmp_seq=2 ttl=64 time=0.4 ms`,
      '',
      `--- ${host} ping statistics ---`,
      '3 packets transmitted, 3 packets received, 0.0% packet loss',
    ],
    success: true,
  };
}

/**
 * sshコマンドの実行（シミュレーション）
 */
function executeSsh(args: string[], ctx: ExecutionContext): CommandExecutionResult {
  if (args.length === 0) {
    return {
      output: ['usage: ssh user@hostname'],
      success: false,
    };
  }
  
  const target = args[0];
  
  return {
    output: [
      `Connecting to ${target}...`,
      'Connection established.',
    ],
    success: true,
  };
}

/**
 * scpコマンドの実行（シミュレーション）
 */
function executeScp(args: string[], ctx: ExecutionContext): CommandExecutionResult {
  const paths = args.filter(a => !a.startsWith('-'));
  
  if (paths.length < 2) {
    return {
      output: ['scp: 転送元と転送先を指定してください'],
      success: false,
    };
  }
  
  const [src, dest] = paths;
  
  return {
    output: [
      `${src}                                     100%  512     1.0KB/s   00:00`,
    ],
    success: true,
  };
}

/**
 * exitコマンドの実行
 */
function executeExit(args: string[], ctx: ExecutionContext): CommandExecutionResult {
  return {
    output: ['logout'],
    success: true,
  };
}

/**
 * topコマンドの実行（シミュレーション）
 */
function executeTop(args: string[], ctx: ExecutionContext): CommandExecutionResult {
  return {
    output: [
      `top - 10:00:00 up 1 day,  2:30,  1 user,  load average: 0.15, 0.10, 0.05`,
      'Tasks: 120 total,   1 running, 119 sleeping,   0 stopped,   0 zombie',
      '%Cpu(s):  2.0 us,  1.0 sy,  0.0 ni, 96.5 id,  0.5 wa,  0.0 hi,  0.0 si,  0.0 st',
      'MiB Mem :   7860.9 total,   3800.5 free,   2100.4 used,   1960.0 buff/cache',
      'MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   5500.5 avail Mem',
      '',
      '  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND',
      `    1 root      20   0  168000  11200   8400 S   0.0   0.1   0:01.00 systemd`,
    ],
    success: true,
  };
}

/** コマンドハンドラマップ */
const COMMAND_HANDLERS: Record<string, CommandHandler> = {
  ls: executeLs,
  cd: executeCd,
  pwd: executePwd,
  mkdir: executeMkdir,
  touch: executeTouch,
  rm: executeRm,
  cp: executeCp,
  mv: executeMv,
  cat: executeCat,
  ps: executePs,
  top: executeTop,
  df: executeDf,
  free: executeFree,
  kill: executeKill,
  git: executeGit,
  docker: executeDocker,
  pip: executePip,
  python3: executePython3,
  source: executeSource,
  ping: executePing,
  ssh: executeSsh,
  scp: executeScp,
  exit: executeExit,
};

/**
 * コマンドを実行
 */
export function executeCommand(
  input: string,
  ctx: ExecutionContext
): CommandExecutionResult {
  const tokens = tokenize(input);
  
  if (tokens.length === 0) {
    return {
      output: [],
      success: true,
    };
  }
  
  const command = tokens[0];
  const args = tokens.slice(1);
  
  const handler = COMMAND_HANDLERS[command];
  
  if (!handler) {
    return {
      output: [`${command}: コマンドが見つかりません`],
      success: false,
    };
  }
  
  return handler(args, ctx);
}

/**
 * 対応しているコマンドかどうかを確認
 */
export function isKnownCommand(command: string): boolean {
  return command in COMMAND_HANDLERS;
}
