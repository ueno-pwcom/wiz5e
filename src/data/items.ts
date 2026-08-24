// src/data/items.ts

export type ItemType = 'consumable' | 'weapon' | 'armor';

export interface ItemData {
  id: string;
  name: string;
  type: ItemType;
  slot?: 'weapon' | 'armor' | 'shield';
  description: string;
  value_gp: number;
  // 消費アイテム用
  heal_dice?: string;
  // 武器用
  damage_dice?: string;
  // 防具用
  ac_bonus?: number;
}

export const itemList: Record<string, ItemData> = {
  // ==========================================
  // 消費アイテム (consumable)
  // ==========================================
  potion_of_healing: {
    id: 'potion_of_healing',
    name: 'ポーション・オヴ・ヒーリング',
    type: 'consumable',
    description: '赤い液体が入った瓶。飲むと 2d4+2 のHPを回復する。',
    value_gp: 50,
    heal_dice: '2d4+2',
  },
  potion_of_greater_healing: {
    id: 'potion_of_greater_healing',
    name: 'ポーション・オヴ・グレーター・ヒーリング',
    type: 'consumable',
    description: '上質な回復薬。飲むと 4d4+4 のHPを回復する。',
    value_gp: 150,
    heal_dice: '4d4+4',
  },
  antitoxin: {
    id: 'antitoxin',
    name: '気つけ薬（毒消し薬）',
    type: 'consumable',
    description: '体内の中和を促す薬。気休め程度の怪我も癒す（1d4回復）。',
    value_gp: 50,
    heal_dice: '1d4',
  },

  // ==========================================
  // 武器 (weapon)
  // ==========================================
  dagger: {
    id: 'dagger',
    name: 'ダガー',
    type: 'weapon',
    description: '小ぶりで扱いやすい短剣。巧妙さや投擲に優れる。',
    value_gp: 2,
    damage_dice: '1d4',
  },
  shortsword: {
    id: 'shortsword',
    name: 'ショートソード',
    type: 'weapon',
    description: '素早い刺突に向いた軽快な片手剣。',
    value_gp: 10,
    damage_dice: '1d6',
  },
  longsword: {
    id: 'longsword',
    name: 'ロングソード',
    type: 'weapon',
    description: '汎用性の高い標準的な片手/両手用剣。',
    value_gp: 15,
    damage_dice: '1d8',
  },
  greatsword: {
    id: 'greatsword',
    name: 'グレートソード',
    type: 'weapon',
    description: '両手で振り回す大型の大剣。非常に高い威力を誇る。',
    value_gp: 50,
    damage_dice: '2d6',
  },
  battleaxe: {
    id: 'battleaxe',
    name: 'バトルアックス',
    type: 'weapon',
    description: '重厚な刃を持つ戦斧。ドワーフなどに好まれる。',
    value_gp: 10,
    damage_dice: '1d8',
  },
  mace: {
    id: 'mace',
    name: 'メイス',
    type: 'weapon',
    description: '金属製の頭部を持つ打撃武器。クレリックの標準装備。',
    value_gp: 5,
    damage_dice: '1d6',
  },
  shortbow: {
    id: 'shortbow',
    name: 'ショートボウ',
    type: 'weapon',
    description: '小型で扱いやすい弓。遠距離攻撃が可能。',
    value_gp: 25,
    damage_dice: '1d6',
  },
  longbow: {
    id: 'longbow',
    name: 'ロングボウ',
    type: 'weapon',
    description: '強力な射程と貫通力を備えた大型の長弓。',
    value_gp: 50,
    damage_dice: '1d8',
  },

  // ==========================================
  // 防具 (armor)
  // ==========================================
  leather_armor: {
    id: 'leather_armor',
    name: 'レザー・アーマー',
    type: 'armor',
    slot: 'armor',
    description: '煮固めた革で作られた軽装鎧（ベースAC 11）。',
    value_gp: 10,
    ac_bonus: 11,
  },
  studded_leather: {
    id: 'studded_leather',
    name: 'スタデッド・レザー',
    type: 'armor',
    slot: 'armor',
    description: '鋲を打って補強した高品質な革鎧（ベースAC 12）。',
    value_gp: 45,
    ac_bonus: 12,
  },
  scale_mail: {
    id: 'scale_mail',
    name: 'スケイル・メイル',
    type: 'armor',
    slot: 'armor',
    description: '金属のうろこを重ね合わせた中装鎧（ベースAC 14）。',
    value_gp: 50,
    ac_bonus: 14,
  },
  chain_mail: {
    id: 'chain_mail',
    name: 'チェイン・メイル',
    type: 'armor',
    slot: 'armor',
    description: '金属環を編み込んだ重装鎧（AC 16）。',
    value_gp: 75,
    ac_bonus: 16,
  },
  plate_armor: {
    id: 'plate_armor',
    name: 'プレート・アーマー',
    type: 'armor',
    slot: 'armor',
    description: '全身を包み込む最高峰の金属板甲冑（AC 18）。',
    value_gp: 1500,
    ac_bonus: 18,
  },
  shield: {
    id: 'shield',
    name: 'シールド（盾）',
    type: 'armor',
    slot: 'shield',
    description: '手に保持して攻撃を防ぐ木製または金属製の盾（AC +2）。',
    value_gp: 10,
    ac_bonus: 2,
  },
};