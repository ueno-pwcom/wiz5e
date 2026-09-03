import type { StatusEffect } from '../types/game';

const STATUS_EFFECT_TRANSLATIONS: Record<StatusEffect, string> = {
  poisoned: '毒状態',
  paralyzed: '麻痺',
  unconscious: '気絶',
  dead: '死亡',
  bless: '祝福',
  concentrating: '精神集中',
};

export const translateStatusEffects = (statusEffects: StatusEffect[]): string => {
  if (!statusEffects || statusEffects.length === 0) {
    return '正常';
  }
  return statusEffects.map((effect) => STATUS_EFFECT_TRANSLATIONS[effect] ?? effect).join('、');
};
