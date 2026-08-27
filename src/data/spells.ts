import type { SpellData } from '../types/game';

export const spellList: Record<string, SpellData> = {
  // --- 初級呪文（Cantrip / level: 0） ---
  fire_bolt: {
    id: 'fire_bolt',
    name: 'ファイア・ボルト',
    level: 0,
    school: 'Evocation',
    classes: ['wizard'],
    damage_dice: '1d10',
    heal_dice: null,
    damage_type: '火',
    save_type: null, // 攻撃ロール（AC対抗）で判定
    save_effect: null,
    requires_concentration: false
  },
  ray_of_frost: {
    id: 'ray_of_frost',
    name: 'レイ・オヴ・フロスト',
    level: 0,
    school: 'Evocation',
    classes: ['wizard'],
    damage_dice: '1d8',
    heal_dice: null,
    damage_type: '冷気',
    save_type: null,
    save_effect: null,
    requires_concentration: false
  },
  sacred_flame: {
    id: 'sacred_flame',
    name: 'セイクレッド・フレイム',
    level: 0,
    school: 'Evocation',
    classes: ['cleric'],
    damage_dice: '1d8',
    heal_dice: null,
    damage_type: '光輝',
    save_type: 'dex', // 敏捷力セーヴィング・スロー
    save_effect: 'none', // 成功時はダメージなし
    requires_concentration: false
  },

  // --- 1レベル呪文 ---
  magic_missile: {
    id: 'magic_missile',
    name: 'マジック・ミサイル',
    level: 1,
    school: 'Evocation',
    classes: ['wizard'],
    damage_dice: '3d4+3',
    heal_dice: null,
    damage_type: '力場',
    save_type: null,
    save_effect: null,
    auto_hit: true,
    requires_concentration: false
  },
  burning_hands: {
    id: 'burning_hands',
    name: 'バーニング・ハンズ',
    level: 1,
    school: 'Evocation',
    classes: ['wizard'],
    damage_dice: '3d6',
    heal_dice: null,
    damage_type: '火',
    save_type: 'dex',
    save_effect: 'half',
    targets_random: 3,
    requires_concentration: false
  },
  cure_wounds: {
    id: 'cure_wounds',
    name: 'キュア・ウーンズ',
    level: 1,
    school: 'Evocation',
    classes: ['cleric'],
    damage_dice: null,
    heal_dice: '1d8+3',
    damage_type: null,
    save_type: null,
    save_effect: null,
    requires_concentration: false
  }
};