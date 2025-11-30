/**
 * 動的変数生成 - ランダムな値でプレースホルダーを置換
 */

import { DynamicContext, DynamicKey, GeneratedDynamicKey } from '../types';

/** ランダム値候補プール（生成対象のキーのみ） */
const POOLS: Record<GeneratedDynamicKey, string[]> = {
  filename: ['report.txt', 'data.csv', 'config.json', 'app.log', 'notes.md', 'output.txt', 'backup.dat', 'settings.yaml'],
  dir: ['logs', 'backup', 'temp', 'cache', 'archive', 'downloads', 'uploads', 'data'],
  src_file: ['document.pdf', 'image.png', 'script.sh', 'readme.txt', 'main.py', 'config.yml', 'data.json'],
  dest_dir: ['backup/', 'archive/', 'storage/', 'output/', 'export/', 'temp/'],
  ip: ['192.168.1.100', '10.0.0.50', '172.16.0.10', '192.168.0.1', '10.10.10.1', '192.168.100.5'],
  container: ['nginx-web', 'mysql-db', 'redis-cache', 'app-server', 'api-gateway', 'worker-01'],
  image: ['nginx:latest', 'mysql:8', 'redis:alpine', 'node:20', 'python:3.11', 'ubuntu:22.04'],
  user: ['admin', 'devuser', 'deploy', 'operator', 'webmaster', 'sysadmin'],
  port: ['8080', '3000', '5000', '9000', '4000', '8000'],
  branch: ['feature/login', 'fix/bug-123', 'develop', 'hotfix/security', 'feature/api', 'refactor/core'],
  commit_msg: ['Fix typo', 'Add feature', 'Update config', 'Refactor code', 'Fix bug', 'Add tests'],
  venv_name: ['myenv', 'venv', 'devenv', 'testenv', 'pyenv', 'env'],
  package: ['requests', 'numpy', 'flask', 'pandas', 'django', 'pytest'],
  pid: ['1234', '5678', '9012', '3456', '7890', '2345'],
  service: ['web', 'db', 'api', 'redis', 'nginx', 'app'],
  tag: ['v1.0', 'v2.0', 'latest', 'stable', 'dev', 'production'],
  permission: ['755', '644', '700', '600', '777', '750'],
  domain: ['example.com', 'api.local', 'test.dev', 'myapp.io', 'staging.net', 'dev.internal'],
  script: ['main.py', 'app.py', 'server.py', 'run.py', 'manage.py', 'test.py'],
};

/**
 * 配列からランダムに1つ選択
 */
function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * 指定されたキーの動的変数を生成
 */
export function generateDynamicContext(keys: GeneratedDynamicKey[]): DynamicContext {
  const ctx: DynamicContext = {};
  const usedValues: Set<string> = new Set();
  
  for (const key of keys) {
    const pool = POOLS[key];
    // 同じ値を使わないようにする
    let value: string;
    let attempts = 0;
    do {
      value = pickRandom(pool);
      attempts++;
    } while (usedValues.has(value) && attempts < 10);
    
    ctx[key] = value;
    usedValues.add(value);
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
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = ctx[key as DynamicKey];
    return value !== undefined ? value : match;
  });
}

/**
 * 期待コマンドのプレースホルダーを置換
 */
export function hydrateExpectation(expectation: string, ctx: DynamicContext): string {
  return hydrateTemplate(expectation, ctx);
}

/**
 * すべての動的変数キーを取得
 */
export function getAllDynamicKeys(): GeneratedDynamicKey[] {
  return Object.keys(POOLS) as GeneratedDynamicKey[];
}

/**
 * 特定のキーのプール値を取得
 */
export function getPoolValues(key: GeneratedDynamicKey): string[] {
  return [...POOLS[key]];
}
