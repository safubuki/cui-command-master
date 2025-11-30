/**
 * アプリケーション全体のグローバル状態管理
 * ミニシナリオ統合Arcadeモード対応
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { 
  CommandCategory, 
  DynamicContext, 
  TerminalLine, 
  CommandStats,
  VFSState,
  TerminalEnvironment
} from '../types';
import { createInitialVFS, mkdir } from '../lib/vfs';
import { generateDynamicContext, hydrateTemplate } from '../lib/dynamicVars';
import { judgeCommand } from '../data/commandDefs';
import { MiniScenario, MiniScenarioStep, getRandomMiniScenario, MINI_SCENARIOS } from '../data/miniScenarios';
import { useLocalStorage, STORAGE_KEYS } from '../hooks/useLocalStorage';
import { updateStats } from '../lib/analytics';
import { executeCommand } from '../lib/commandExecutor';

/** ホスト名プール */
const HOSTNAME_POOL = [
  'ubuntu-server', 'dev-machine', 'web-server', 'db-server',
  'app-host', 'linux-box', 'workstation', 'localhost'
];

/** ユーザー名プール */
const USERNAME_POOL = [
  'user', 'admin', 'dev', 'ubuntu', 'guest', 'operator'
];

/** ランダム選択 */
function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * タイポ判定（入力がコマンドのタイポかどうか）
 * 編集距離が2以下の場合はタイポとみなす
 */
function isTypoOf(input: string, expected: string): boolean {
  if (input === expected) return true;
  if (Math.abs(input.length - expected.length) > 2) return false;
  
  // 簡易的なレーベンシュタイン距離の計算
  const len1 = input.length;
  const len2 = expected.length;
  const dp: number[][] = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));
  
  for (let i = 0; i <= len1; i++) dp[i][0] = i;
  for (let j = 0; j <= len2; j++) dp[0][j] = j;
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = input[i - 1] === expected[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // 削除
        dp[i][j - 1] + 1,      // 挿入
        dp[i - 1][j - 1] + cost // 置換
      );
    }
  }
  
  return dp[len1][len2] <= 2;
}

/** ターミナル環境を生成 */
function createTerminalEnvironment(): TerminalEnvironment {
  const username = randomFrom(USERNAME_POOL);
  return {
    hostname: randomFrom(HOSTNAME_POOL),
    username,
    homeDir: `/home/${username}`,
  };
}

/** タスク結果の状態 */
export type TaskResult = 'none' | 'success' | 'error';

/** アプリケーション状態 */
interface AppState {
  // ミニシナリオ関連
  currentMiniScenario: MiniScenario | null;
  currentStepIndex: number;
  
  // 基本状態
  vfs: VFSState;
  dynamic: DynamicContext;
  env: TerminalEnvironment;
  categoryFilter: CommandCategory | 'all';
  terminalHistory: TerminalLine[];
  
  // 統計・永続化
  commandStats: Record<string, CommandStats>;
  completedMiniScenarios: string[];  // 完了したミニシナリオのID
  
  // タスク判定関連
  taskResult: TaskResult;
  lastErrorMessage: string;
}

/** アクション定義 */
type AppAction =
  | { type: 'SET_CATEGORY_FILTER'; payload: CommandCategory | 'all' }
  | { type: 'NEW_MINI_SCENARIO' }
  | { type: 'ADVANCE_STEP' }
  | { type: 'EXECUTE_COMMAND'; payload: { input: string; output: string[]; newVfs?: VFSState; prompt: string } }
  | { type: 'SET_TASK_RESULT'; payload: { result: TaskResult; message?: string } }
  | { type: 'ADD_TERMINAL_LINE'; payload: TerminalLine }
  | { type: 'CLEAR_TERMINAL' }
  | { type: 'UPDATE_VFS'; payload: VFSState }
  | { type: 'RECORD_RESULT'; payload: { commandId: string; correct: boolean } }
  | { type: 'LOAD_PERSISTED_STATE'; payload: Partial<AppState> }
  | { type: 'RESET_STATS' };

/** 初期状態 */
const initialState: AppState = {
  currentMiniScenario: null,
  currentStepIndex: 0,
  vfs: createInitialVFS(),
  dynamic: {},
  env: createTerminalEnvironment(),
  categoryFilter: 'all',
  terminalHistory: [],
  commandStats: {},
  completedMiniScenarios: [],
  taskResult: 'none',
  lastErrorMessage: '',
};

/** ターミナルの初期表示を生成 */
function createInitialTerminalHistory(prompt: string): TerminalLine[] {
  // 初期状態でプロンプト行を表示（入力待ち状態を示す）
  return [
    {
      type: 'input',
      content: '',  // 空のコマンド（プロンプトのみ表示）
      timestamp: Date.now(),
      prompt,       // その時点のプロンプトを保存
    },
  ];
}

/** 新しいミニシナリオを開始 */
function createNewMiniScenario(state: AppState): Partial<AppState> {
  const scenario = getRandomMiniScenario(state.categoryFilter);
  if (!scenario) {
    return {};
  }
  
  const dynamic = generateDynamicContext(scenario.requiredVars);
  const env = createTerminalEnvironment();
  
  // VFSを初期化（ホームディレクトリを動的に作成）
  let newVfs = createInitialVFS();
  
  // ユーザーのホームディレクトリを作成
  newVfs = mkdir(newVfs, env.homeDir);
  
  if (scenario.setupVfs) {
    newVfs = scenario.setupVfs(newVfs, dynamic, env.homeDir);
  } else {
    newVfs.currentPath = env.homeDir;
  }
  
  // dynamicに_homeDirを追加
  dynamic._homeDir = env.homeDir;
  
  // プロンプト文字列を生成
  const currentDir = newVfs.currentPath === env.homeDir 
    ? '~' 
    : newVfs.currentPath.split('/').pop() || '/';
  const prompt = `${env.username}@${env.hostname}:${currentDir}$`;
  
  // 初期表示を生成
  const initialHistory = createInitialTerminalHistory(prompt);
  
  return {
    currentMiniScenario: scenario,
    currentStepIndex: 0,
    dynamic,
    env,
    vfs: newVfs,
    terminalHistory: initialHistory,
    taskResult: 'none',
    lastErrorMessage: '',
  };
}

/** Reducer */
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CATEGORY_FILTER': {
      // カテゴリが変更された場合、新しいシナリオを開始
      const newState = { ...state, categoryFilter: action.payload };
      return { ...newState, ...createNewMiniScenario(newState) };
    }
    
    case 'NEW_MINI_SCENARIO':
      return { ...state, ...createNewMiniScenario(state) };
    
    case 'ADVANCE_STEP': {
      if (!state.currentMiniScenario) return state;
      
      const nextIndex = state.currentStepIndex + 1;
      
      if (nextIndex >= state.currentMiniScenario.steps.length) {
        // シナリオ完了 → 次のシナリオを開始
        const newCompleted = state.completedMiniScenarios.includes(state.currentMiniScenario.id)
          ? state.completedMiniScenarios
          : [...state.completedMiniScenarios, state.currentMiniScenario.id];
        
        // 新しいシナリオを開始
        const newScenarioState = createNewMiniScenario({ ...state, completedMiniScenarios: newCompleted });
        
        return {
          ...state,
          ...newScenarioState,
          completedMiniScenarios: newCompleted,
        };
      }
      
      return {
        ...state,
        currentStepIndex: nextIndex,
        taskResult: 'none',
        lastErrorMessage: '',
      };
    }
    
    case 'EXECUTE_COMMAND': {
      const { input, output, newVfs, prompt } = action.payload;
      const newLines: TerminalLine[] = [];
      
      // 入力コマンドを追加（その時点のプロンプトも保存）
      newLines.push({
        type: 'input',
        content: input,
        timestamp: Date.now(),
        prompt,
      });
      
      // 出力を追加
      for (const line of output) {
        newLines.push({
          type: 'output',
          content: line,
          timestamp: Date.now(),
        });
      }
      
      return {
        ...state,
        vfs: newVfs || state.vfs,
        terminalHistory: [...state.terminalHistory, ...newLines],
      };
    }
    
    case 'SET_TASK_RESULT':
      return {
        ...state,
        taskResult: action.payload.result,
        lastErrorMessage: action.payload.message || '',
      };
    
    case 'ADD_TERMINAL_LINE':
      return {
        ...state,
        terminalHistory: [...state.terminalHistory, action.payload],
      };
    
    case 'CLEAR_TERMINAL':
      return { ...state, terminalHistory: [] };
    
    case 'UPDATE_VFS':
      return { ...state, vfs: action.payload };
    
    case 'RECORD_RESULT':
      return {
        ...state,
        commandStats: updateStats(
          state.commandStats,
          action.payload.commandId,
          action.payload.correct
        ),
      };
    
    case 'LOAD_PERSISTED_STATE':
      return { ...state, ...action.payload };
    
    case 'RESET_STATS':
      return { ...state, commandStats: {}, completedMiniScenarios: [] };
    
    default:
      return state;
  }
}

/** Context */
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  
  // ヘルパー関数
  submitCommand: (input: string) => void;
  proceedToNext: () => void;
  skipScenario: () => void;
  getCurrentStep: () => MiniScenarioStep | null;
  getCurrentExpectation: () => string;
  getCurrentFormatHint: () => string;
  getCurrentTaskHint: () => string;
  getPrompt: () => string;
  isLastStep: () => boolean;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

/** Provider */
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // 永続化
  const [savedStats, setSavedStats] = useLocalStorage<Record<string, CommandStats>>(
    STORAGE_KEYS.COMMAND_STATS,
    {}
  );
  const [savedScenarios, setSavedScenarios] = useLocalStorage<string[]>(
    STORAGE_KEYS.COMPLETED_SCENARIOS,
    []
  );
  
  // 起動時に永続化データを読み込み、最初のシナリオを開始
  useEffect(() => {
    dispatch({
      type: 'LOAD_PERSISTED_STATE',
      payload: {
        commandStats: savedStats,
        completedMiniScenarios: savedScenarios,
      },
    });
    // 最初のシナリオを開始
    dispatch({ type: 'NEW_MINI_SCENARIO' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // 状態変更時に永続化
  useEffect(() => {
    setSavedStats(state.commandStats);
  }, [state.commandStats, setSavedStats]);
  
  useEffect(() => {
    setSavedScenarios(state.completedMiniScenarios);
  }, [state.completedMiniScenarios, setSavedScenarios]);
  
  // 現在のステップを取得
  const getCurrentStep = (): MiniScenarioStep | null => {
    if (!state.currentMiniScenario) return null;
    return state.currentMiniScenario.steps[state.currentStepIndex] || null;
  };
  
  // 現在の期待コマンドを取得
  const getCurrentExpectation = (): string => {
    const step = getCurrentStep();
    if (!step) return '';
    return hydrateTemplate(step.expectation, state.dynamic);
  };
  
  // 現在のフォーマットヒントを取得
  const getCurrentFormatHint = (): string => {
    const step = getCurrentStep();
    return step?.formatHint || '';
  };
  
  // 現在のタスクヒントを取得
  const getCurrentTaskHint = (): string => {
    const step = getCurrentStep();
    if (!step) return '';
    return hydrateTemplate(step.taskTemplate, state.dynamic);
  };
  
  // プロンプト文字列を取得
  const getPrompt = (): string => {
    const { username, hostname } = state.env;
    const currentDir = state.vfs.currentPath === state.env.homeDir 
      ? '~' 
      : state.vfs.currentPath.split('/').pop() || '/';
    
    // Python仮想環境がアクティブな場合はプレフィックスを追加
    const venvName = state.vfs.virtualEnv?.activePythonVenv;
    const venvPrefix = venvName ? `(${venvName}) ` : '';
    
    return `${venvPrefix}${username}@${hostname}:${currentDir}$`;
  };
  
  // 最後のステップかどうか
  const isLastStep = (): boolean => {
    if (!state.currentMiniScenario) return false;
    return state.currentStepIndex >= state.currentMiniScenario.steps.length - 1;
  };
  
  // コマンド送信
  const submitCommand = (input: string) => {
    if (!input.trim()) return;
    
    // すでに正解している場合はコマンドを受け付けない（Enterで次へ進むのを待つ）
    if (state.taskResult === 'success') {
      return;
    }
    
    // コマンドを実行
    const result = executeCommand(input.trim(), {
      vfs: state.vfs,
      dynamic: state.dynamic,
      env: state.env,
    });
    
    // 現在のプロンプトを取得（コマンド実行前の状態）
    const currentPrompt = getPrompt();
    
    // 出力をターミナルに追加
    dispatch({
      type: 'EXECUTE_COMMAND',
      payload: {
        input: input.trim(),
        output: result.output,
        newVfs: result.newVfs,
        prompt: currentPrompt,
      },
    });
    
    // 現在のVFS状態（コマンド実行後）
    const currentVfs = result.newVfs || state.vfs;
    
    // 期待コマンドとの比較判定
    const expectation = getCurrentExpectation();
    const judgeResult = judgeCommand(input.trim(), expectation, {
      vfs: currentVfs,
      dynamic: state.dynamic,
      env: state.env,
    });
    
    // 結果を設定
    if (judgeResult.ok) {
      dispatch({ type: 'SET_TASK_RESULT', payload: { result: 'success' } });
      
      // 統計を記録
      const step = getCurrentStep();
      if (step?.commandId) {
        dispatch({
          type: 'RECORD_RESULT',
          payload: { commandId: step.commandId, correct: true },
        });
      }
    } else {
      // お題に関連するコマンドかどうかをチェック
      // 期待コマンドの最初のトークン（コマンド名）を取得
      const expectedCmd = expectation.split(/\s+/)[0];
      const inputCmd = input.trim().split(/\s+/)[0];
      
      // 同じコマンドを実行しようとした場合はエラーを表示
      // （別のコマンドは自由に実行できる）
      if (inputCmd === expectedCmd || isTypoOf(inputCmd, expectedCmd)) {
        dispatch({ 
          type: 'SET_TASK_RESULT', 
          payload: { 
            result: 'error', 
            message: judgeResult.messages[0] || '入力が間違っています' 
          } 
        });
      }
    }
  };
  
  // 次のステップに進む（Enterキーで呼び出される）
  const proceedToNext = () => {
    dispatch({ type: 'ADVANCE_STEP' });
  };
  
  // シナリオをスキップ
  const skipScenario = () => {
    dispatch({ type: 'NEW_MINI_SCENARIO' });
  };
  
  const value: AppContextValue = {
    state,
    dispatch,
    submitCommand,
    proceedToNext,
    skipScenario,
    getCurrentStep,
    getCurrentExpectation,
    getCurrentFormatHint,
    getCurrentTaskHint,
    getPrompt,
    isLastStep,
  };
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

/** Contextを使用するフック */
export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

/** カテゴリ一覧 */
export const CATEGORIES: (CommandCategory | 'all')[] = [
  'all',
  'Linux',
  'Network',
  'Python',
  'Git',
  'Docker',
];

/** ミニシナリオ一覧を取得 */
export function getMiniScenarioList() {
  return MINI_SCENARIOS.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    category: s.category,
    stepCount: s.steps.length,
    difficulty: s.difficulty,
  }));
}
