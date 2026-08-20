// src/utils/srdData.ts の記述例
import classesJson from '../data/classes.json';
import spellsJson from '../data/spells.json';
import monstersJson from '../data/monsters.json';
import equipmentJson from '../data/equipment.json';

import type { ClassData, SpellData, MonsterData, EquipmentData } from '../types/game';

export const classesData = classesJson as Record<string, ClassData>;
export const spellsData = spellsJson as Record<string, SpellData>;
export const monstersData = monstersJson as Record<string, MonsterData>;
export const equipmentData = equipmentJson as Record<string, EquipmentData>;
