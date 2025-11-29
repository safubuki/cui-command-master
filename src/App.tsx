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
  const { state, dispatch, skipScenario } = useApp();
  
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
      <button className="skip-btn" onClick={skipScenario}>
        ⏭ スキップ
      </button>
    </div>
  );
}

function AppContent() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">
          <span>$</span> CUI Typing Master
        </h1>
        <CategoryFilter />
      </header>
      
      <main className="main-layout">
        <section className="terminal-section">
          <Terminal />
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
