import type { MonsterData } from '../types/game';

export const monsterList: Record<string, MonsterData> = {
  goblin: {
    id: 'goblin',
    name: 'ゴブリン',
    cr: 0.25,
    xp: 50,
    ac: 15,
    hp: {
      current: 7,
      max: 7,
      dice: '2d6'
    },
    stats: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
    actions: [
      {
        name: 'シミター',
        to_hit: 4,
        damage_dice: '1d6+2',
        damage_type: '斬撃'
      }
    ]
  },
  skeleton: {
    id: 'skeleton',
    name: 'スケルトン',
    cr: 0.25,
    xp: 50,
    ac: 13,
    hp: {
      current: 13,
      max: 13,
      dice: '2d8+4'
    },
    stats: { str: 10, dex: 14, con: 15, int: 6, wis: 8, cha: 5 },
    actions: [
      {
        name: 'ショートボウ',
        to_hit: 4,
        damage_dice: '1d6+2',
        damage_type: '刺突'
      }
    ]
  }
};