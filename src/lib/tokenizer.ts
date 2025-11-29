/**
 * トークナイザ - コマンド文字列をトークン配列に分解する
 */

/**
 * コマンド文字列をトークン配列に分解する
 * 
 * @example
 * tokenize('git commit -m "fix bug"')
 * // => ['git', 'commit', '-m', 'fix bug']
 * 
 * @param input ユーザー入力文字列
 * @returns トークン配列
 */
export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';
  
  for (const char of input.trim()) {
    if ((char === '"' || char === "'") && !inQuote) {
      inQuote = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuote) {
      inQuote = false;
      quoteChar = '';
    } else if (char === ' ' && !inQuote) {
      if (current) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }
  
  if (current) {
    tokens.push(current);
  }
  
  return tokens;
}

/**
 * トークン配列を文字列に結合する
 * スペースを含むトークンはクォートで囲む
 */
export function detokenize(tokens: string[]): string {
  return tokens.map(token => {
    if (token.includes(' ')) {
      return `"${token}"`;
    }
    return token;
  }).join(' ');
}
