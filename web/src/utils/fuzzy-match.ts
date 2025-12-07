// 模糊匹配函数：检查 pattern 中的字符是否按顺序出现在 text 中
export function fuzzyMatch(text: string, pattern: string): boolean {
  if (!pattern) return true;
  const lowerText = text.toLowerCase();
  const lowerPattern = pattern.toLowerCase();

  let patternIdx = 0;
  for (let i = 0; i < lowerText.length && patternIdx < lowerPattern.length; i++) {
    if (lowerText[i] === lowerPattern[patternIdx]) {
      patternIdx++;
    }
  }
  return patternIdx === lowerPattern.length;
}

// 获取模糊匹配的字符索引
export function getFuzzyMatchIndices(text: string, pattern: string): number[] {
  if (!pattern) return [];
  const indices: number[] = [];
  const lowerText = text.toLowerCase();
  const lowerPattern = pattern.toLowerCase();

  let patternIdx = 0;
  for (let i = 0; i < lowerText.length && patternIdx < lowerPattern.length; i++) {
    if (lowerText[i] === lowerPattern[patternIdx]) {
      indices.push(i);
      patternIdx++;
    }
  }
  return patternIdx === lowerPattern.length ? indices : [];
}
