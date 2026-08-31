export interface DropTableEntry {
  itemId: string;
  weight: number;
}

export interface MonsterDropTable {
  dropChance: number;
  entries: DropTableEntry[];
}

export const monsterDropTables: Record<string, MonsterDropTable> = {
  humanoid: {
    dropChance: 0.8,
    entries: [
      { itemId: 'potion_of_healing', weight: 40 },
      { itemId: 'dagger', weight: 15 },
      { itemId: 'shortsword', weight: 12 },
      { itemId: 'scimitar', weight: 8 },
      { itemId: 'mace', weight: 8 },
      { itemId: 'shortbow', weight: 7 },
      { itemId: 'leather_armor', weight: 5 },
      { itemId: 'shield', weight: 3 },
      { itemId: 'potion_of_greater_healing', weight: 2 }
    ]
  },
  undead: {
    dropChance: 0.6,
    entries: [
      { itemId: 'potion_of_healing', weight: 45 },
      { itemId: 'mace', weight: 15 },
      { itemId: 'shortbow', weight: 10 },
      { itemId: 'dagger', weight: 10 },
      { itemId: 'shield', weight: 8 },
      { itemId: 'leather_armor', weight: 7 },
      { itemId: 'potion_of_greater_healing', weight: 5 }
    ]
  },
  beast: {
    dropChance: 0.5,
    entries: [
      { itemId: 'potion_of_healing', weight: 40 },
      { itemId: 'dagger', weight: 15 },
      { itemId: 'shortbow', weight: 10 },
      { itemId: 'mace', weight: 10 },
      { itemId: 'shortsword', weight: 8 },
      { itemId: 'leather_armor', weight: 7 },
      { itemId: 'potion_of_greater_healing', weight: 5 }
    ]
  },
  default: {
    dropChance: 0.4,
    entries: [
      { itemId: 'potion_of_healing', weight: 50 },
      { itemId: 'dagger', weight: 15 },
      { itemId: 'shortsword', weight: 10 },
      { itemId: 'shield', weight: 10 },
      { itemId: 'leather_armor', weight: 8 },
      { itemId: 'potion_of_greater_healing', weight: 7 }
    ]
  }
};
