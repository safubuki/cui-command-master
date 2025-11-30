/**
 * ターミナル出力表示コンポーネント
 */

import { useEffect, useRef } from 'react';
import { TerminalLine } from '../../types';
import styles from './Terminal.module.css';

interface TerminalOutputProps {
  lines: TerminalLine[];
  prompt: string;
}

export function TerminalOutput({ lines, prompt }: TerminalOutputProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // 新しい行が追加されたら自動スクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);
  
  const getLineClassName = (type: TerminalLine['type']): string => {
    switch (type) {
      case 'input':
        return styles.lineInput;
      case 'output':
        return styles.lineOutput;
      case 'success':
        return styles.lineSuccess;
      case 'error':
        return styles.lineError;
      case 'info':
        return styles.lineInfo;
      default:
        return '';
    }
  };
  
  // コマンド入力行は履歴に含まれているので、
  // 入力履歴とセットで表示
  const renderLines = () => {
    const result: JSX.Element[] = [];
    let commandIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // inputタイプはプロンプト付きで表示
      if (line.type === 'input') {
        // 各行に保存されたプロンプトを使用（なければ現在のプロンプト）
        const linePrompt = line.prompt || prompt;
        result.push(
          <div
            key={`${line.timestamp}-${i}`}
            className={`${styles.line} ${styles.lineInput}`}
          >
            <span className={styles.historyPrompt}>{linePrompt}</span>
            <span>{line.content}</span>
          </div>
        );
        commandIndex++;
      } else {
        result.push(
          <div
            key={`${line.timestamp}-${i}`}
            className={`${styles.line} ${getLineClassName(line.type)}`}
          >
            {line.content}
          </div>
        );
      }
    }
    
    return result;
  };
  
  return (
    <div className={styles.output}>
      {renderLines()}
      <div ref={bottomRef} />
    </div>
  );
}
