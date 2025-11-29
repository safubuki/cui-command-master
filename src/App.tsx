/**
 * メインアプリケーションコンポーネント
 * ミニシナリオ統合Arcadeモード
 */

import { AppProvider, useApp, CATEGORIES } from './context/AppContext';
import { Terminal } from './components/Terminal/Terminal';
import { HintPanel } from './components/Hint/HintPanel';
import { ScoreBoard } from './components/Score/ScoreBoard';
import { CommandCategory } from './types';
import './styles/globals.css';

function CategoryFilter() {
  const { state, dispatch } = useApp();
  
  return (
    <div className="category-filter">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          className={`category-btn ${state.categoryFilter === cat ? 'active' : ''}`}
          onClick={() => dispatch({ type: 'SET_CATEGORY_FILTER', payload: cat as CommandCategory | 'all' })}
        >
          {cat === 'all' ? 'すべて' : cat}
        </button>
      ))}
    </div>
  );
}

function SkipButton() {
  const { skipScenario } = useApp();
  
  return (
    <button className="skip-btn-bottom" onClick={skipScenario}>
      ⏭ スキップ
    </button>
  );
}

function AppContent() {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="title-section">
          <h1 className="app-title">
            <span>$</span> CUI Command Master
          </h1>
          <p className="app-catchcopy">指が覚える、本物のコマンド力。</p>
          <p className="app-subtitle">Linux / Git / Docker / Python / Network — 実務で使うコマンドをタイピングで体得</p>
        </div>
        <CategoryFilter />
      </header>
      
      <main className="main-layout">
        <section className="terminal-section">
          <Terminal />
          <SkipButton />
        </section>
        
        <aside className="sidebar">
          <HintPanel />
          <ScoreBoard />
        </aside>
      </main>
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
