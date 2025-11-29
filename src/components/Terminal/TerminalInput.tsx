/**
 * ターミナル入力コンポーネント
 */

import React, { useState, useRef, useEffect, KeyboardEvent, FormEvent } from 'react';
import styles from './Terminal.module.css';

interface TerminalInputProps {
  onSubmit: (input: string) => void;
  onProceed?: () => void;  // 空入力でEnter時に呼ぶ
  disabled?: boolean;
  prompt: string;
  waitingForNext?: boolean;  // 正解後、次へ進む待ち状態
}

export function TerminalInput({ onSubmit, onProceed, disabled = false, prompt, waitingForNext = false }: TerminalInputProps) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // フォーカスを維持
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // ターミナル領域クリックでフォーカス
  const handleContainerClick = () => {
    inputRef.current?.focus();
  };
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // 空入力でEnterの場合
    if (!input.trim()) {
      if (waitingForNext && onProceed) {
        onProceed();
      }
      return;
    }
    
    if (disabled) return;
    
    // 履歴に追加
    setHistory(prev => [...prev, input]);
    setHistoryIndex(-1);
    
    // 送信
    onSubmit(input.trim());
    setInput('');
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      
      const newIndex = historyIndex === -1 
        ? history.length - 1 
        : Math.max(0, historyIndex - 1);
      
      setHistoryIndex(newIndex);
      setInput(history[newIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      
      const newIndex = historyIndex + 1;
      
      if (newIndex >= history.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // タブ補完は将来的に実装可能
    }
  };
  
  return (
    <form 
      className={styles.inputForm} 
      onSubmit={handleSubmit}
      onClick={handleContainerClick}
    >
      <span className={styles.prompt}>{prompt}</span>
      {waitingForNext ? (
        <span className={styles.waitingHint}>← Enter を押して次へ</span>
      ) : (
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className={styles.input}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
        />
      )}
      {/* 非表示の入力フィールドでEnterを受け付ける */}
      {waitingForNext && (
        <input
          ref={inputRef}
          type="text"
          className={styles.hiddenInput}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onProceed) {
              e.preventDefault();
              onProceed();
            }
          }}
        />
      )}
    </form>
  );
}
