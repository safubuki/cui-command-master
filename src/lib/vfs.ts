/**
 * 仮想ファイルシステム (VFS) 実装
 */

import { VFSNode, VFSState } from '../types';

/**
 * 仮想環境の初期状態を作成
 */
export function createInitialVirtualEnv(): import('../types').VirtualEnvState {
  return {
    installedPackages: [],       // 最初はパッケージなし
    runningContainers: [],       // 最初はコンテナなし
    pulledImages: [],            // 最初はイメージなし
    currentBranch: 'main',
    branches: ['main'],
    stashStack: 0,
  };
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
        var: {
          type: 'directory',
          name: 'var',
          children: {
            log: {
              type: 'directory',
              name: 'log',
              children: {},
            },
          },
        },
      },
    },
    currentPath: '/home/user',
    virtualEnv: createInitialVirtualEnv(),
  };
}

/**
 * パスを正規化（相対パスを絶対パスに変換）
 */
export function normalizePath(vfs: VFSState, path: string): string {
  if (path.startsWith('/')) {
    return path;
  }
  
  if (path === '.') {
    return vfs.currentPath;
  }
  
  if (path === '..') {
    const parts = vfs.currentPath.split('/').filter(Boolean);
    parts.pop();
    return '/' + parts.join('/') || '/';
  }
  
  // 相対パス
  return vfs.currentPath === '/' 
    ? `/${path}` 
    : `${vfs.currentPath}/${path}`;
}

/**
 * パスからノードを取得
 */
export function getNode(vfs: VFSState, path: string): VFSNode | null {
  const normalizedPath = normalizePath(vfs, path);
  
  if (normalizedPath === '/') {
    return vfs.root;
  }
  
  const parts = normalizedPath.split('/').filter(Boolean);
  let current: VFSNode = vfs.root;
  
  for (const part of parts) {
    if (current.type !== 'directory' || !current.children) {
      return null;
    }
    const child = current.children[part];
    if (!child) {
      return null;
    }
    current = child;
  }
  
  return current;
}

/**
 * パスが存在するか確認
 */
export function exists(vfs: VFSState, path: string): boolean {
  return getNode(vfs, path) !== null;
}

/**
 * パスがディレクトリか確認
 */
export function isDirectory(vfs: VFSState, path: string): boolean {
  const node = getNode(vfs, path);
  return node?.type === 'directory';
}

/**
 * パスがファイルか確認
 */
export function isFile(vfs: VFSState, path: string): boolean {
  const node = getNode(vfs, path);
  return node?.type === 'file';
}

/**
 * 親ディレクトリのノードを取得
 */
function getParentNode(vfs: VFSState, path: string): VFSNode | null {
  const normalizedPath = normalizePath(vfs, path);
  const parts = normalizedPath.split('/').filter(Boolean);
  parts.pop();
  
  if (parts.length === 0) {
    return vfs.root;
  }
  
  return getNode(vfs, '/' + parts.join('/'));
}

/**
 * パスの最後の部分（ファイル名/ディレクトリ名）を取得
 */
function getBasename(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

/**
 * ディレクトリを作成（再帰的に親ディレクトリも作成）
 */
export function mkdir(vfs: VFSState, dirName: string): VFSState {
  const normalizedPath = normalizePath(vfs, dirName);
  const parts = normalizedPath.split('/').filter(Boolean);
  
  let current: VFSNode = vfs.root;
  
  // パスの各部分を辿りながらディレクトリを作成
  for (const part of parts) {
    if (current.type !== 'directory' || !current.children) {
      return vfs;
    }
    
    if (!current.children[part]) {
      current.children[part] = {
        type: 'directory',
        name: part,
        children: {},
      };
    }
    
    current = current.children[part];
  }
  
  return { ...vfs };
}

/**
 * ファイルを作成（touch）- 親ディレクトリも自動作成
 */
export function touch(vfs: VFSState, fileName: string): VFSState {
  const normalizedPath = normalizePath(vfs, fileName);
  const parts = normalizedPath.split('/').filter(Boolean);
  const basename = parts.pop();
  
  if (!basename) return vfs;
  
  // 親ディレクトリを作成
  const parentPath = '/' + parts.join('/');
  let newVfs = mkdir(vfs, parentPath);
  
  const parent = getNode(newVfs, parentPath);
  if (!parent || parent.type !== 'directory' || !parent.children) {
    return newVfs;
  }
  
  // 既に存在する場合は何もしない
  if (parent.children[basename]) {
    return newVfs;
  }
  
  parent.children[basename] = {
    type: 'file',
    name: basename,
    content: '',
  };
  
  return { ...newVfs };
}

/**
 * ファイル/ディレクトリを削除
 */
export function rm(vfs: VFSState, target: string, recursive: boolean): VFSState {
  const normalizedPath = normalizePath(vfs, target);
  const parent = getParentNode(vfs, normalizedPath);
  const basename = getBasename(normalizedPath);
  
  if (!parent || parent.type !== 'directory' || !parent.children) {
    return vfs;
  }
  
  const node = parent.children[basename];
  if (!node) {
    return vfs;
  }
  
  // ディレクトリの場合は -r オプションが必要
  if (node.type === 'directory' && !recursive) {
    return vfs;
  }
  
  delete parent.children[basename];
  
  return { ...vfs };
}

/**
 * ファイルをコピー
 */
export function cp(vfs: VFSState, src: string, dest: string): VFSState {
  const srcNode = getNode(vfs, src);
  if (!srcNode) {
    return vfs;
  }
  
  const normalizedDest = normalizePath(vfs, dest);
  let destParent: VFSNode | null;
  let destName: string;
  
  // 宛先がディレクトリの場合、その中にコピー
  const destNode = getNode(vfs, dest);
  if (destNode?.type === 'directory') {
    destParent = destNode;
    destName = srcNode.name;
  } else {
    destParent = getParentNode(vfs, normalizedDest);
    destName = getBasename(normalizedDest);
  }
  
  if (!destParent || destParent.type !== 'directory' || !destParent.children) {
    return vfs;
  }
  
  // ディープコピー
  destParent.children[destName] = JSON.parse(JSON.stringify(srcNode));
  destParent.children[destName].name = destName;
  
  return { ...vfs };
}

/**
 * ファイル/ディレクトリを移動
 */
export function mv(vfs: VFSState, src: string, dest: string): VFSState {
  const newVfs = cp(vfs, src, dest);
  return rm(newVfs, src, true);
}

/**
 * カレントディレクトリを変更
 */
export function cd(vfs: VFSState, path: string): VFSState {
  const normalizedPath = normalizePath(vfs, path);
  const node = getNode(vfs, normalizedPath);
  
  if (!node || node.type !== 'directory') {
    return vfs;
  }
  
  return {
    ...vfs,
    currentPath: normalizedPath,
  };
}

/**
 * ディレクトリの内容をリスト
 */
export function ls(vfs: VFSState, path?: string): string[] {
  const targetPath = path || vfs.currentPath;
  const node = getNode(vfs, targetPath);
  
  if (!node || node.type !== 'directory' || !node.children) {
    return [];
  }
  
  return Object.keys(node.children).sort();
}

/**
 * VFSにファイルを追加（親ディレクトリも自動作成）
 */
export function addFile(vfs: VFSState, path: string, content: string = ''): VFSState {
  const normalizedPath = normalizePath(vfs, path);
  const parts = normalizedPath.split('/').filter(Boolean);
  const basename = parts.pop();
  
  if (!basename) return vfs;
  
  // 親ディレクトリを作成
  const parentPath = '/' + parts.join('/');
  let newVfs = mkdir(vfs, parentPath);
  
  const parent = getNode(newVfs, parentPath);
  if (!parent || parent.type !== 'directory' || !parent.children) {
    return newVfs;
  }
  
  parent.children[basename] = {
    type: 'file',
    name: basename,
    content,
  };
  
  return { ...newVfs };
}

/**
 * VFSにディレクトリを追加（テスト用）
 */
export function addDirectory(vfs: VFSState, path: string): VFSState {
  return mkdir(vfs, path);
}
