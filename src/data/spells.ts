// src/data/spells.ts
import type { SpellData } from '../types/game';

export const spellList: Record<string, SpellData> = {
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