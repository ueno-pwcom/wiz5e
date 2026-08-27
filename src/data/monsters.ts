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
  },
  kobold: {
    id: 'kobold',
    name: 'コボルド',
    cr: 0.125,
    xp: 25,
    ac: 12,
    hp: {
      current: 5,
      max: 5,
      dice: '2d6-2'
    },
    stats: { str: 7, dex: 15, con: 9, int: 8, wis: 7, cha: 8 },
    actions: [
      {
        name: '短剣',
        to_hit: 4,
        damage_dice: '1d4+2',
        damage_type: '刺突'
      }
    ]
  },
  zombie: {
    id: 'zombie',
    name: 'ゾンビ',
    cr: 0.25,
    xp: 50,
    ac: 8,
    hp: {
      current: 22,
      max: 22,
      dice: '3d8+9'
    },
    stats: { str: 13, dex: 6, con: 16, int: 3, wis: 6, cha: 5 },
    actions: [
      {
        name: '打撃',
        to_hit: 3,
        damage_dice: '1d6+1',
        damage_type: '殴打'
      }
    ]
  },
  hobgoblin: {
    id: 'hobgoblin',
    name: 'ホブゴブリン',
    cr: 0.5,
    xp: 100,
    ac: 18,
    hp: {
      current: 11,
      max: 11,
      dice: '2d8+2'
    },
    stats: { str: 13, dex: 12, con: 12, int: 10, wis: 10, cha: 9 },
    actions: [
      {
        name: 'ロングソード',
        to_hit: 3,
        damage_dice: '1d8+1',
        damage_type: '斬撃'
      }
    ]
  }
};