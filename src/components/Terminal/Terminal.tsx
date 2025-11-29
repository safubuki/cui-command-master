/**
 * ターミナルUIコンポーネント
 * 本物のターミナルのように動作し、問題文や正解表示はターミナル外で行う
 */

import React from 'react';
import { TerminalOutput } from './TerminalOutput';
import { TerminalInput } from './TerminalInput';
import { useApp } from '../../context/AppContext';
import styles from './Terminal.module.css';

export function Terminal() {
  const { state, submitCommand, proceedToNext, getPrompt } = useApp();
  
  const prompt = getPrompt();
  const isWaitingForNext = state.taskResult === 'success';
  
  return (
    <div className={styles.terminal}>
      <div className={styles.header}>
        <span className={styles.dot} style={{ backgroundColor: '#ff5f56' }} />
        <span className={styles.dot} style={{ backgroundColor: '#ffbd2e' }} />
        <span className={styles.dot} style={{ backgroundColor: '#27c93f' }} />
        <span className={styles.title}>
          {state.env.username}@{state.env.hostname}: {state.vfs.currentPath}
        </span>
      </div>
      <div className={styles.body}>
        <TerminalOutput lines={state.terminalHistory} prompt={prompt} />
        <TerminalInput 
          onSubmit={submitCommand} 
          onProceed={proceedToNext}
          disabled={false} 
          prompt={prompt}
          waitingForNext={isWaitingForNext}
        />
      </div>
    </div>
  );
}
