import { FlowsenseToken, FlowsenseTokenCategory } from '@/store/flowsense/types';

/**
 * Checks if a character is a separator, i.e. if it is a space or punctuation.
 */
export const isSeparator = (char: string): boolean => {
  return char.match(/^[\s,.;?!]$/) !== null;
};

/**
 * Parses a text string into recognizable tokens.
 */
export const parseTokens = (text: string): FlowsenseToken[] => {
  const tokens: FlowsenseToken[] = [];
  let numTokens = 0;
  for (let i = 0; i < text.length; i++) {
    if (isSeparator(text[i])) {
      tokens[numTokens++] = {
        index: i,
        text: text[i],
        chosenCategory: 0,
        categories: [{
          matchText: [],
          category: FlowsenseTokenCategory.NONE,
          value: [],
        }],
        manuallySet: false,
        isPhrase: false,
      };
      continue;
    }
    let j = i;
    let tokenText = '';
    while (j < text.length && !isSeparator(text[j])) {
      tokenText += text[j++];
    }
    tokens[numTokens] = {
      index: i,
      text: tokenText,
      chosenCategory: -1, // -1 means the category is to be decided
      categories: [{
        matchText: [],
        category: FlowsenseTokenCategory.NONE,
        displayText: '',
        annotation: '/(none)',
        value: [],
      }],
      manuallySet: false,
      isPhrase: false,
    };
    numTokens++;
    i = j - 1;
  }
  return tokens;
};

/**
 * Checks if pattern is a non trivial prefix of target.
 */
export const matchNonTrivialPrefix = (target: string, pattern: string): boolean => {
  target = target.toLowerCase();
  pattern = pattern.toLowerCase();
  return target.indexOf(pattern) === 0 && target !== pattern;
};

/**
 * Computes the edit distance between input phrase "target" and a known "pattern". Target can be word or multi-gram.
 * Addition/deletion/modification cost = 1.
 */
export const matchToken = (target: string, pattern: string, threshold?: number): boolean => {
  if (target == null) {
    return false;
  }
  target = target.toLowerCase();
  pattern = pattern.toLowerCase(); // case-insensitive matching
  threshold = threshold === undefined ? 0 : threshold;
  const n = target.length;
  const m = pattern.length;
  const dp: number[][] = [];
  for (let i = 0; i <= n; i++) {
    dp[i] = [];
    for (let j = 0; j <= m; j++) {
      dp[i][j] = Infinity;
    }
  }
  dp[0][0] = 0;
  for (let j = 1; j <= m; j++) {
    dp[0][j] = j;
  }
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const costi = isSeparator(target[i - 1]) ? 0 : 1;
      const costj = isSeparator(pattern[j - 1]) ? 0 : 1;
      dp[i][j] = Math.min(dp[i][j - 1] + costj, dp[i - 1][j] + costi);
      if (target[i - 1] === pattern[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i][j], dp[i - 1][j - 1] + 1);
      }
    }
  }
  return dp[n][m] <= threshold * pattern.length;
};
