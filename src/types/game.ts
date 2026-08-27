// ==========================================
// 1. 基本パラメータ・能力値関連 (SRD 5.1)
// ==========================================

export type AbilityType = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
export type AbilityScoreName = AbilityType;

export interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export type DamageType =
  | '斬撃'
  | '刺突'
  | '殴打'
  | '火'
  | '力場'
  | '毒'
  | '光輝'
  | string;

export type StatusEffect = 'poisoned' | 'paralyzed' | 'unconscious' | 'dead';

export type GameScene = 'town' | 'dungeon' | 'battle' | 'camp';

// ==========================================
// 2. アイテム・装備関連
// ==========================================

export type ItemType = 'consumable' | 'weapon' | 'armor';

export interface ItemData {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  value_gp: number;
  heal_dice?: string;
  damage_dice?: string;
  damage_type?: DamageType;
  ac_bonus?: number;
}

export interface EquipmentData {
  id: string;
  name: string;
  cost_gp: number;
  damage_dice: string;
  damage_type: DamageType;
  properties: string[];
}

// ==========================================
// 3. マップ・探索関連
// ==========================================

export type Direction = 'N' | 'E' | 'S' | 'W';

export type WallType = 'none' | 'wall' | 'door' | 'locked_door' | 'secret_door';

export interface WallData {
  N: WallType;
  E: WallType;
  S: WallType;
  W: WallType;
}

export type EventType =
  | 'stairs_up'
  | 'stairs_down'
  | 'chest'
  | 'boss'
  | 'trap'
  | 'door'
  | 'encounter'
  | 'none';

export interface TileEvent {
  type: EventType;
  target_map?: string;
  chest_id?: string;
  encounter_id?: string;
}

export interface MapTile {
  x: number;
  y: number;
  walls: WallData;
  event: TileEvent | null;
}

export interface DungeonMap {
  map_id: string;
  name: string;
  width: number;
  height: number;
  start_position: {
    x: number;
    y: number;
    facing: Direction;
  };
  grid: MapTile[][];
  encounter_table: {
    rate: number;
    monsters: { id: string; weight: number }[];
  };
}

// ==========================================
// 4. SRD データ（JSONファイル構造型）
// ==========================================

export interface ClassData {
  id: string;
  name: string;
  hit_die: number;
  hp_static_increase: number;
  proficiencies: string[];
  saving_throws: AbilityScoreName[];
  spellcasting_ability: AbilityScoreName | null;
  level_features?: Record<number, string[]>;
}

export interface SpellData {
  id: string;
  name: string;
  level: number;
  school: string;
  classes: string[];
  damage_dice: string | null;
  heal_dice: string | null;
  damage_type: DamageType | null;
  save_type: AbilityScoreName | null;
  save_effect: 'half' | 'none' | null;
  auto_hit?: boolean;
  targets_all_enemies?: boolean;
  targets_random?: number;
  requires_concentration: boolean;
}

export interface MonsterAction {
  name: string;
  to_hit: number;
  damage_dice: string;
  damage_type: DamageType;
}

export interface MonsterData {
  id: string;
  name: string;
  type?: string;
  cr: number;
  xp: number;
  ac: number;
  hp: {
    current: number;
    max: number;
    dice: string;
  };
  stats: AbilityScores;
  damage_vulnerabilities?: DamageType[];
  damage_resistances?: DamageType[];
  damage_immunities?: DamageType[];
  condition_immunities?: string[];
  actions: MonsterAction[];
  status_effects: StatusEffect[];
}

// ==========================================
// 5. アプリケーション状態（キャラクター・戦闘）
// ==========================================

export type PositionRole = 'front' | 'back';
export type CharacterClassName = 'fighter' | 'wizard' | 'cleric' | 'rogue' | string;

export interface Character {
  id: string;
  name: string;
  class_id: CharacterClassName;
  level: number;
  xp: number;
  stats: AbilityScores;
  hp: {
    current: number;
    max: number;
  };
  hit_dice_remaining: number;
  spell_slots?: Record<number, { current: number; max: number }>;
  ac: number;
  position: PositionRole;
  is_alive: boolean;
  status_effects: StatusEffect[];
  equipped_weapon_id: string | null;
  equipped_armor_id?: string | null;
  equipped_shield_id?: string | null;
}

export interface Combatant {
  id: string;
  name: string;
  is_player: boolean;
  initiative: number;
  ac: number;
  hp: {
    current: number;
    max: number;
  };
  position: PositionRole;
  ref: Character | MonsterData;
  is_evading: boolean;
}

export interface LogMessage {
  id: string;
  text: string;
  type: 'info' | 'player_action' | 'enemy_action' | 'heal' | 'critical' | 'system';
}