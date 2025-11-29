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
import { createInitialVFS, ls } from '../lib/vfs';
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
  | { type: 'EXECUTE_COMMAND'; payload: { input: string; output: string[]; newVfs?: VFSState } }
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
function createInitialTerminalHistory(vfs: VFSState, env: TerminalEnvironment): TerminalLine[] {
  const now = Date.now();
  const files = ls(vfs, '.');
  const lines: TerminalLine[] = [];
  
  // 常にlsコマンドを実行して現在の状態を表示
  lines.push({
    type: 'input',
    content: 'ls',
    timestamp: now,
  });
  
  if (files.length > 0) {
    lines.push({
      type: 'output',
      content: files.join('  '),
      timestamp: now + 1,
    });
  } else {
    // ファイルがない場合は空行（lsの正常動作）
    lines.push({
      type: 'output',
      content: '',
      timestamp: now + 1,
    });
  }
  
  return lines;
}

/** 新しいミニシナリオを開始 */
function createNewMiniScenario(state: AppState): Partial<AppState> {
  const scenario = getRandomMiniScenario(state.categoryFilter);
  if (!scenario) {
    return {};
  }
  
  const dynamic = generateDynamicContext(scenario.requiredVars);
  const env = createTerminalEnvironment();
  
  // VFSを初期化
  let newVfs = createInitialVFS();
  if (scenario.setupVfs) {
    newVfs = scenario.setupVfs(newVfs, dynamic, env.homeDir);
  } else {
    newVfs.currentPath = env.homeDir;
  }
  
  // dynamicに_homeDirを追加
  dynamic._homeDir = env.homeDir;
  
  // 初期表示を生成
  const initialHistory = createInitialTerminalHistory(newVfs, env);
  
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
    case 'SET_CATEGORY_FILTER':
      return { ...state, categoryFilter: action.payload };
    
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
      const { input, output, newVfs } = action.payload;
      const newLines: TerminalLine[] = [];
      
      // 入力コマンドを追加
      newLines.push({
        type: 'input',
        content: input,
        timestamp: Date.now(),
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
    return `${username}@${hostname}:${currentDir}$`;
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
    
    // 出力をターミナルに追加
    dispatch({
      type: 'EXECUTE_COMMAND',
      payload: {
        input: input.trim(),
        output: result.output,
        newVfs: result.newVfs,
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
  'Git',
  'Docker',
  'Python',
  'Network',
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
