// src/data/items.ts

export type ItemType = 'consumable' | 'weapon' | 'armor';

export interface ItemData {
  id: string;
  name: string;
  type: ItemType;
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
  potion_of_healing: {
    id: 'potion_of_healing',
    name: 'ポーション・オヴ・ヒーリング',
    type: 'consumable',
    description: '飲むと 2d4+2 のHPを回復する。',
    value_gp: 50,
    heal_dice: '2d4+2'
  },
  longsword: {
    id: 'longsword',
    name: 'ロングソード',
    type: 'weapon',
    description: '汎用性の高い片手/両手用剣。',
    value_gp: 15,
    damage_dice: '1d8'
  },
  chain_mail: {
    id: 'chain_mail',
    name: 'チェイン・メイル',
    type: 'armor',
    description: '金属環を編み込んだ重装鎧（AC 16）。',
    value_gp: 75,
    ac_bonus: 16
  }
};