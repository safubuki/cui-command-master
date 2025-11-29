/**
 * ヒントパネルコンポーネント
 * ミニシナリオのステップ進捗とヒントを表示
 */

import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { COMMAND_DEFS } from '../../data/commandDefs';
import styles from './Hint.module.css';

export function HintPanel() {
  const { 
    state, 
    getCurrentExpectation, 
    getCurrentTaskHint, 
    getCurrentFormatHint,
    getCurrentStep,
    isLastStep
  } = useApp();
  const [showExtraHint, setShowExtraHint] = useState(false);
  
  const expectation = getCurrentExpectation();
  const taskHint = getCurrentTaskHint();
  const formatHint = getCurrentFormatHint();
  const currentStep = getCurrentStep();
  const { taskResult, currentMiniScenario, currentStepIndex } = state;
  
  // 現在のコマンドに関する情報を取得
  const currentCommandId = currentStep?.commandId;
  const commandDef = currentCommandId ? COMMAND_DEFS[currentCommandId] : null;
  
  // コマンド部分のヒントを生成
  const getPartialHint = () => {
    if (!expectation) return '';
    const parts = expectation.split(' ');
    if (parts.length <= 1) return parts[0];
    return `${parts[0]} ${parts.slice(1).map((p: string) => p.startsWith('-') ? p : '___').join(' ')}`;
  };
  
  // ステップ情報
  const stepInfo = currentMiniScenario
    ? `Step ${currentStepIndex + 1} / ${currentMiniScenario.steps.length}`
    : null;
  
  // 難易度表示
  const getDifficultyStars = (difficulty: 1 | 2 | 3) => {
    return '★'.repeat(difficulty) + '☆'.repeat(3 - difficulty);
  };
  
  return (
    <div className={styles.panel}>
      {/* シナリオタイトルとステップ進捗 */}
      {currentMiniScenario && (
        <div className={styles.scenarioHeader}>
          <div className={styles.scenarioTitleRow}>
            <span className={styles.scenarioTitle}>{currentMiniScenario.title}</span>
            <span className={styles.difficulty}>
              {getDifficultyStars(currentMiniScenario.difficulty)}
            </span>
          </div>
          <div className={styles.stepProgress}>
            {currentMiniScenario.steps.map((_, idx) => (
              <div 
                key={idx}
                className={`${styles.stepDot} ${
                  idx < currentStepIndex ? styles.stepCompleted :
                  idx === currentStepIndex ? styles.stepCurrent : ''
                }`}
              />
            ))}
          </div>
          <span className={styles.stepInfo}>{stepInfo}</span>
        </div>
      )}
      
      {/* お題目セクション */}
      <div className={styles.taskSection}>
        <div className={styles.taskHeader}>
          <h3 className={styles.taskTitle}>📝 お題</h3>
        </div>
        
        {taskHint ? (
          <div className={styles.taskContent}>
            {taskHint}
          </div>
        ) : (
          <div className={styles.noTask}>
            タスクを開始してください
          </div>
        )}
        
        {/* 結果表示 */}
        {taskResult === 'success' && (
          <div className={styles.resultSuccess}>
            <span>✅</span> 正解！ 
            <span className={styles.proceedHint}>
              {isLastStep() ? 'Enterで次のシナリオへ' : 'Enterで次のステップへ'}
            </span>
          </div>
        )}
      </div>
      
      {/* ヒントセクション */}
      {taskHint && taskResult !== 'success' && (
        <div className={styles.hintSection}>
          <h4 className={styles.sectionTitle}>💡 ヒント</h4>
          
          {formatHint && (
            <div className={styles.formatHint}>
              <code>{formatHint}</code>
            </div>
          )}
          
          {commandDef && (
            <div className={styles.commandInfo}>
              <p className={styles.description}>{commandDef.description}</p>
              <div className={styles.syntaxRow}>
                <span className={styles.syntaxLabel}>構文</span>
                <code className={styles.syntax}>{commandDef.syntax}</code>
              </div>
            </div>
          )}
          
          {expectation && (
            <>
              <button 
                className={styles.hintButton}
                onClick={() => setShowExtraHint(!showExtraHint)}
              >
                {showExtraHint ? '🔒 ヒントを隠す' : '🔑 もっとヒントを見る'}
              </button>
              
              {showExtraHint && (
                <div className={styles.extraHint}>
                  <code>{getPartialHint()}</code>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
