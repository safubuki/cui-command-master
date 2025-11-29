/**
 * スコアボードコンポーネント
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { getOverallAccuracy, getWeakCommands } from '../../lib/analytics';
import styles from './Score.module.css';

export function ScoreBoard() {
  const { state, dispatch } = useApp();
  
  const accuracy = getOverallAccuracy(state.commandStats);
  const weakCommands = getWeakCommands(state.commandStats);
  const totalAttempts = Object.values(state.commandStats).reduce(
    (sum, stat) => sum + stat.total,
    0
  );
  const totalCorrect = Object.values(state.commandStats).reduce(
    (sum, stat) => sum + stat.correct,
    0
  );
  
  const handleResetStats = () => {
    if (window.confirm('統計データをリセットしますか？')) {
      dispatch({ type: 'RESET_STATS' });
    }
  };
  
  return (
    <div className={styles.scoreBoard}>
      <h3 className={styles.title}>📊 統計</h3>
      
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>正答率</span>
          <span className={styles.statValue}>
            {totalAttempts > 0 ? `${Math.round(accuracy * 100)}%` : '-'}
          </span>
        </div>
        
        <div className={styles.statItem}>
          <span className={styles.statLabel}>回答数</span>
          <span className={styles.statValue}>{totalAttempts}</span>
        </div>
        
        <div className={styles.statItem}>
          <span className={styles.statLabel}>正解数</span>
          <span className={styles.statValue}>{totalCorrect}</span>
        </div>
        
        <div className={styles.statItem}>
          <span className={styles.statLabel}>完了シナリオ</span>
          <span className={styles.statValue}>{state.completedMiniScenarios.length}</span>
        </div>
      </div>
      
      {weakCommands.length > 0 && (
        <div className={styles.weakSection}>
          <h4 className={styles.subtitle}>⚠️ 苦手コマンド</h4>
          <ul className={styles.weakList}>
            {weakCommands.slice(0, 5).map(cmd => (
              <li key={cmd} className={styles.weakItem}>
                <code>{cmd}</code>
                <span className={styles.weakStat}>
                  {state.commandStats[cmd].correct}/{state.commandStats[cmd].total}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <button className={styles.resetBtn} onClick={handleResetStats}>
        🗑️ 統計をリセット
      </button>
    </div>
  );
}
