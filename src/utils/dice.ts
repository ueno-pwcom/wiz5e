// src/utils/dice.ts

// d20のロール結果
export interface D20Result {
  total: number;
  natural: number; // ダイスの出目そのもの (1〜20)
  modifier: number;
  isCritical: boolean; // ナチュラル20
  isFumble: boolean;   // ナチュラル1
}

// d20 + 修正値をロール
export const rollD20 = (modifier: number = 0): D20Result => {
  const natural = Math.floor(Math.random() * 20) + 1;
  return {
    total: natural + modifier,
    natural,
    modifier,
    isCritical: natural === 20,
    isFumble: natural === 1,
  };
};

export const rollD20WithDisadvantage = (modifier: number = 0): D20Result => {
  const first = rollD20(modifier);
  const second = rollD20(modifier);
  const result = first.natural <= second.natural ? first : second;
  return result;
};

export const rollD20WithAdvantage = (modifier: number = 0): D20Result => {
  const first = rollD20(modifier);
  const second = rollD20(modifier);
  const result = first.natural >= second.natural ? first : second;
  return result;
};

// 能力値から修正値を計算 ( 例: 14 -> +2, 8 -> -1 )
export const getAbilityModifier = (score: number): number => {
  return Math.floor((score - 10) / 2);
};

// ダイス文字列 (例: "1d6+2", "2d8", "1d8+MOD") を解釈してダメージを計算
export const rollDiceString = (diceStr: string, isCritical: boolean = false, modifier: number = 0): number => {
  const normalizedDiceStr = diceStr.replace(/\s+/g, '').toLowerCase();
  // 例: "1d6+2" -> ["1", "6", "+", "2"]
  // 例: "1d8+mod" -> ["1", "8", "+", "mod"]
  const match = normalizedDiceStr.match(/^(\d+)d(\d+)(?:([+-])((?:\d+)|mod))?$/);
  if (!match) return 0;

  const count = parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  const sign = match[3] ?? '+';
  const bonusToken = match[4] ?? '0';
  const bonusValue = bonusToken === 'mod' ? modifier : parseInt(bonusToken, 10);
  const bonus = sign === '-' ? -bonusValue : bonusValue;

  // クリティカルヒット時はダイスの個数を2倍にする (D&D 5eルール)
  const totalDiceCount = isCritical ? count * 2 : count;

  let total = 0;
  for (let i = 0; i < totalDiceCount; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }

  return total + bonus;
};