/**
 * タスクパネルコンポーネント - 問題文と結果を表示
 * ターミナルの外に配置し、タスクの内容と成否を表示
 */

import { useApp } from '../../context/AppContext';
import styles from './TaskPanel.module.css';

export function TaskPanel() {
  const { 
    state, 
    getCurrentTaskHint, 
    getCurrentFormatHint,
    isLastStep
  } = useApp();
  
  const taskHint = getCurrentTaskHint();
  const formatHint = getCurrentFormatHint();
  const { taskResult, currentMiniScenario, currentStepIndex } = state;
  
  // ミニシナリオのステップ情報
  const stepInfo = currentMiniScenario
    ? `Step ${currentStepIndex + 1} / ${currentMiniScenario.steps.length}`
    : null;
  
  // ミニシナリオ完了判定（最後のステップで正解した場合）
  const miniScenarioCompleted = isLastStep() && taskResult === 'success';
  
  // 「Enterで次へ」プロンプト
  const renderNextPrompt = () => {
    if (taskResult !== 'success') return null;
    
    return (
      <div className={styles.nextPrompt}>
        <kbd>Enter</kbd>
        <span>を押して次へ進む</span>
      </div>
    );
  };
  
  // 結果表示
  const renderResult = () => {
    if (miniScenarioCompleted) {
      return (
        <>
          <div className={`${styles.result} ${styles.success}`}>
            <span className={styles.resultIcon}>🎉</span>
            <span>ミニシナリオ完了！</span>
          </div>
          {renderNextPrompt()}
        </>
      );
    }
    
    if (taskResult === 'success') {
      return (
        <>
          <div className={`${styles.result} ${styles.success}`}>
            <span className={styles.resultIcon}>✅</span>
            <span>正解！</span>
          </div>
          {renderNextPrompt()}
        </>
      );
    }
    
    return null;
  };
  
  // タスクがない場合
  if (!taskHint && !miniScenarioCompleted) {
    return (
      <div className={styles.panel}>
        <div className={styles.empty}>
          <p>タスクを開始してください</p>
          <p className={styles.hint}>下のボタンからカテゴリを選択してスタートしてください</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>📝 お題</h2>
        {stepInfo && <span className={styles.stepInfo}>{stepInfo}</span>}
      </div>
      
      {!miniScenarioCompleted && (
        <>
          <div className={styles.task}>
            {taskHint}
          </div>
          
          <div className={styles.hintSection}>
            <span className={styles.hintLabel}>💡 ヒント:</span>
            <code className={styles.formatHint}>{formatHint}</code>
          </div>
        </>
      )}
      
      {renderResult()}
      
      {currentMiniScenario && (
        <div className={styles.scenarioInfo}>
          <span className={styles.scenarioTitle}>{currentMiniScenario.title}</span>
        </div>
      )}
    </div>
  );
}
