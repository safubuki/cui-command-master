/**
 * 統計処理 - コマンドの正答率計算、苦手コマンド抽出
 */

import { CommandStats } from '../types';

/**
 * 正答率が閾値以下のコマンドを抽出
 * @param stats コマンド統計
 * @param threshold 閾値（デフォルト: 0.6 = 60%）
 * @param minAttempts 最低試行回数（デフォルト: 3）
 */
export function getWeakCommands(
  stats: Record<string, CommandStats>,
  threshold: number = 0.6,
  minAttempts: number = 3
): string[] {
  return Object.entries(stats)
    .filter(([_, { correct, total }]) => {
      if (total < minAttempts) return false;
      return correct / total < threshold;
    })
    .map(([id]) => id);
}

/**
 * コマンドの正答率を計算
 */
export function getAccuracyRate(stats: CommandStats): number {
  if (stats.total === 0) return 0;
  return stats.correct / stats.total;
}

/**
 * 全体の正答率を計算
 */
export function getOverallAccuracy(stats: Record<string, CommandStats>): number {
  let totalCorrect = 0;
  let totalAttempts = 0;
  
  for (const stat of Object.values(stats)) {
    totalCorrect += stat.correct;
    totalAttempts += stat.total;
  }
  
  if (totalAttempts === 0) return 0;
  return totalCorrect / totalAttempts;
}

/**
 * カテゴリ別の統計を計算
 */
export function getCategoryStats(
  stats: Record<string, CommandStats>,
  commandCategories: Record<string, string>
): Record<string, { correct: number; total: number; accuracy: number }> {
  const categoryStats: Record<string, { correct: number; total: number }> = {};
  
  for (const [commandId, stat] of Object.entries(stats)) {
    const category = commandCategories[commandId] || 'Other';
    
    if (!categoryStats[category]) {
      categoryStats[category] = { correct: 0, total: 0 };
    }
    
    categoryStats[category].correct += stat.correct;
    categoryStats[category].total += stat.total;
  }
  
  return Object.fromEntries(
    Object.entries(categoryStats).map(([category, { correct, total }]) => [
      category,
      {
        correct,
        total,
        accuracy: total > 0 ? correct / total : 0,
      },
    ])
  );
}

/**
 * 統計を更新
 */
export function updateStats(
  stats: Record<string, CommandStats>,
  commandId: string,
  isCorrect: boolean
): Record<string, CommandStats> {
  const current = stats[commandId] || { correct: 0, total: 0 };
  
  return {
    ...stats,
    [commandId]: {
      correct: current.correct + (isCorrect ? 1 : 0),
      total: current.total + 1,
    },
  };
}

/**
 * 統計をリセット
 */
export function resetStats(): Record<string, CommandStats> {
  return {};
}
