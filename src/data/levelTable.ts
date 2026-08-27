// src/data/levelTable.ts

// D&D 5e 累計必要XPテーブル
export const XP_TABLE: Record<number, number> = {
  1: 0,
  2: 300,
  3: 900,
  4: 2700,
  5: 6500,
};

// クラス別のレベル毎呪文スロット定義 (Lv1〜Lv5簡易版)
export const SPELL_SLOTS_TABLE: Record<string, Record<number, Record<number, number>>> = {
  wizard: {
    1: { 1: 2 },
    2: { 1: 3 },
    3: { 1: 4, 2: 2 },
    4: { 1: 4, 2: 3 },
    5: { 1: 4, 2: 3, 3: 2 },
  },
  cleric: {
    1: { 1: 2 },
    2: { 1: 3 },
    3: { 1: 4, 2: 2 },
    4: { 1: 4, 2: 3 },
    5: { 1: 4, 2: 3, 3: 2 },
  },
};