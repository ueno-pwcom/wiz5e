import { create } from 'zustand';
import type { Character, Combatant, DamageType, Direction, DungeonMap, LogMessage, MonsterData, PositionRole, StatusEffect, WallType } from '../types/game';
import { map1Data, map2Data, map3Data } from '../data/map1';
import { itemList } from '../data/items';
import { monsterDropTables } from '../data/dropTables';
import { dungeonEvents } from '../data/dungeonEvents';
import type { DungeonEvent, EventOption } from '../data/dungeonEvents';
import { monstersData, spellsData } from '../utils/srdData';
import { classesData } from '../utils/srdData';
import { XP_TABLE, SPELL_SLOTS_TABLE } from '../data/levelTable';
import { getAbilityModifier, rollD20, rollD20WithAdvantage, rollD20WithDisadvantage, rollDiceString } from '../utils/dice';

/**
 * @brief 装備と敏捷値からキャラクターのアーマークラス（AC）を計算する。
 * @param character ACを計算するキャラクター。
 * @param armorId 装備中の鎧のアイテムID（省略可）。
 * @param shieldId 装備中の盾のアイテムID（省略可）。
 * @return 計算されたAC値。
 */
const calculateCharacterAc = (character: Character, armorId: string | null | undefined, shieldId: string | null | undefined): number => {
  const armor = armorId ? itemList[armorId] : null;
  const shield = shieldId ? itemList[shieldId] : null;
  const dexMod = Math.floor((character.stats.dex - 10) / 2);
  const baseAc = 10 + dexMod;
  let ac = armor && armor.ac_bonus ? armor.ac_bonus : baseAc;
  if (shield && shield.ac_bonus) {
    ac += shield.ac_bonus;
  }
  return ac;
};

const DAMAGE_TYPE_SOUND_MAP: Record<string, string> = {
  '殴打': new URL('../assets/sounds/殴打.mp3', import.meta.url).href,
  '斬撃': new URL('../assets/sounds/斬撃.mp3', import.meta.url).href,
  '刺突': new URL('../assets/sounds/刺突.mp3', import.meta.url).href,
  spell: new URL('../assets/sounds/呪文.mp3', import.meta.url).href,
  default: new URL('../assets/sounds/被ダメ.mp3', import.meta.url).href,
};

const BATTLE_BGM_URL = new URL('../assets/sounds/戦闘BGM.mp3', import.meta.url).href;
const DUNGEON_BGM_URL = new URL('../assets/sounds/ダンジョンBGM.mp3', import.meta.url).href;
const TOWN_BGM_URL = new URL('../assets/sounds/街BGM.mp3', import.meta.url).href;
const CAMP_BGM_URL = new URL('../assets/sounds/キャンプBGM.mp3', import.meta.url).href;
let battleBgmAudio: HTMLAudioElement | null = null;
let dungeonBgmAudio: HTMLAudioElement | null = null;
let townBgmAudio: HTMLAudioElement | null = null;
let campBgmAudio: HTMLAudioElement | null = null;
let pendingBgm: 'battle' | 'dungeon' | 'town' | 'camp' | null = null;
let bgmUnlockListenerAttached = false;
let soundEnabled = true;

const stopAllBgms = () => {
  stopBattleBgm();
  stopDungeonBgm();
  stopTownBgm();
  stopCampBgm();
};

const setSoundEnabledValue = (enabled: boolean) => {
  soundEnabled = enabled;
  if (!enabled) {
    stopAllBgms();
  }
};

const getBattleBgmAudio = (): HTMLAudioElement => {
  if (!battleBgmAudio) {
    battleBgmAudio = new Audio(BATTLE_BGM_URL);
    battleBgmAudio.loop = true;
  }
  return battleBgmAudio;
};

const getDungeonBgmAudio = (): HTMLAudioElement => {
  if (!dungeonBgmAudio) {
    dungeonBgmAudio = new Audio(DUNGEON_BGM_URL);
    dungeonBgmAudio.loop = true;
  }
  return dungeonBgmAudio;
};

const getTownBgmAudio = (): HTMLAudioElement => {
  if (!townBgmAudio) {
    townBgmAudio = new Audio(TOWN_BGM_URL);
    townBgmAudio.loop = true;
  }
  return townBgmAudio;
};

const getCampBgmAudio = (): HTMLAudioElement => {
  if (!campBgmAudio) {
    campBgmAudio = new Audio(CAMP_BGM_URL);
    campBgmAudio.loop = true;
  }
  return campBgmAudio;
};

const attachBgmUnlockListener = () => {
  if (bgmUnlockListenerAttached) return;
  bgmUnlockListenerAttached = true;
  const unlock = () => {
    if (pendingBgm) {
      switch (pendingBgm) {
        case 'battle':
          playBattleBgm();
          break;
        case 'dungeon':
          playDungeonBgm();
          break;
        case 'town':
          playTownBgm();
          break;
        case 'camp':
          playCampBgm();
          break;
      }
    }
    pendingBgm = null;
    bgmUnlockListenerAttached = false;
  };
  window.addEventListener('pointerdown', unlock, { once: true, passive: true });
};

const tryPlayBgm = (audio: HTMLAudioElement, scene: 'battle' | 'dungeon' | 'town' | 'camp') => {
  if (!soundEnabled) return;
  audio.currentTime = 0;
  void audio.play().catch(() => {
    pendingBgm = scene;
    attachBgmUnlockListener();
  });
};

const playBattleBgm = () => {
  stopDungeonBgm();
  stopTownBgm();
  stopCampBgm();
  const audio = getBattleBgmAudio();
  tryPlayBgm(audio, 'battle');
};

export const playDungeonBgm = () => {
  stopBattleBgm();
  stopTownBgm();
  stopCampBgm();
  const audio = getDungeonBgmAudio();
  tryPlayBgm(audio, 'dungeon');
};

export const playTownBgm = () => {
  stopBattleBgm();
  stopDungeonBgm();
  stopCampBgm();
  const audio = getTownBgmAudio();
  tryPlayBgm(audio, 'town');
};

export const playCampBgm = () => {
  stopBattleBgm();
  stopDungeonBgm();
  stopTownBgm();
  const audio = getCampBgmAudio();
  tryPlayBgm(audio, 'camp');
};

export const stopBattleBgm = () => {
  if (!battleBgmAudio) return;
  battleBgmAudio.pause();
  battleBgmAudio.currentTime = 0;
};

export const stopDungeonBgm = () => {
  if (!dungeonBgmAudio) return;
  dungeonBgmAudio.pause();
  dungeonBgmAudio.currentTime = 0;
};

export const stopTownBgm = () => {
  if (!townBgmAudio) return;
  townBgmAudio.pause();
  townBgmAudio.currentTime = 0;
};

export const stopCampBgm = () => {
  if (!campBgmAudio) return;
  campBgmAudio.pause();
  campBgmAudio.currentTime = 0;
};

const getSoundUrlForDamageType = (damageType?: DamageType | null): string => {
  if (!damageType) return DAMAGE_TYPE_SOUND_MAP.default;
  if (DAMAGE_TYPE_SOUND_MAP[damageType]) {
    return DAMAGE_TYPE_SOUND_MAP[damageType];
  }
  return DAMAGE_TYPE_SOUND_MAP.spell;
};

const playSoundForDamageType = (damageType?: DamageType | null) => {
  if (!soundEnabled) return;
  const soundUrl = getSoundUrlForDamageType(damageType);
  const audio = new Audio(soundUrl);
  void audio.play().catch(() => {
    // ブラウザの自動再生制限などを無視して静かに失敗させる
  });
};

const playMissSound = () => {
  if (!soundEnabled) return;
  const missUrl = new URL('../assets/sounds/空振り.mp3', import.meta.url).href;
  const audio = new Audio(missUrl);
  void audio.play().catch(() => {
    // 自動再生制限などで失敗しても無視
  });
};

const getDropTableForMonster = (monster: MonsterData) => {
  return monsterDropTables[monster.type ?? 'default'] ?? monsterDropTables.default;
};

const chooseWeightedDrop = (entries: { itemId: string; weight: number }[]): string | null => {
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight <= 0) return null;

  let target = Math.random() * totalWeight;
  for (const entry of entries) {
    if (target < entry.weight) {
      return entry.itemId;
    }
    target -= entry.weight;
  }

  return entries[entries.length - 1]?.itemId ?? null;
};

const determineMonsterDrops = (monsters: Combatant[]): string[] => {
  const droppedItems: string[] = [];

  monsters.forEach((enemy) => {
    const monster = enemy.ref as MonsterData;
    const table = getDropTableForMonster(monster);
    if (Math.random() <= table.dropChance) {
      const itemId = chooseWeightedDrop(table.entries);
      if (itemId) {
        droppedItems.push(itemId);
      }
    }
  });

  return droppedItems;
};

const applyDamageTypeModifiers = (damage: number, damageType: DamageType | null | undefined, target: Combatant) => {
  if (!damageType || target.is_player) {
    return { adjustedDamage: damage, modifierTag: '' };
  }

  const monster = target.ref as MonsterData;
  if (monster.damage_immunities?.includes(damageType)) {
    return { adjustedDamage: 0, modifierTag: ' 無効' };
  }

  if (monster.damage_vulnerabilities?.includes(damageType)) {
    return { adjustedDamage: damage * 2, modifierTag: ' 脆弱性' };
  }

  if (monster.damage_resistances?.includes(damageType)) {
    return { adjustedDamage: Math.floor(damage / 2), modifierTag: ' 抵抗' };
  }

  return { adjustedDamage: damage, modifierTag: '' };
};

type GameScene = 'town' | 'dungeon' | 'battle' | 'camp';

// 獲得報酬の型定義
export interface BattleReward {
  xp: number;
  gold: number;
  items: string[];
}

export interface EventResult {
  passed: boolean;
  roll: number;
  modifier: number;
  total: number;
  dc?: number;
  message: string;
}

interface GameState {
  scene: GameScene;
  gold: number;
  party: Character[];
  characterRoster: Character[];
  logs: LogMessage[];
  currentMap: DungeonMap;
  playerPosition: { x: number; y: number; facing: Direction };

  // 戦闘用状態
  combatants: Combatant[];
  currentTurnIndex: number;
  battleRound: number;
  skipPlayerTurnsUntilIndex: number | null;
  battleReward: BattleReward | null;
  showResultModal: boolean;
  inventory: { itemId: string; quantity: number }[];
  battleShake: boolean;
  enemyShakeTargetId: string | null;
  activeEvent: DungeonEvent | null;
  eventResult: EventResult | null;
  eventContext: { eventId: string; trapCleared?: boolean } | null;
  selectedActorId: string;
  resumeEvent: () => void;

  setScene: (scene: GameScene) => void;
  addLog: (text: string, type?: LogMessage['type']) => void;
  movePlayer: (action: 'forward' | 'backward' | 'turnLeft' | 'turnRight') => void;
  useStairs: () => void;

  // 戦闘用アクション
  startBattle: () => void;
  executePlayerAttack: (targetId: string) => void;
  executePlayerEvade: () => void;
  attemptRun: () => void;
  executePlayerSpell: (spellId: string, targetId: string) => void;
  processEnemyTurn: () => void;
  nextTurn: () => void;
  checkBattleStatus: () => boolean;
  checkLevelUp: (character: Character) => Character;
  claimBattleReward: () => void;
  useItem: (itemId: string, targetCharacterId: string) => void;
  equipItem: (characterId: string, itemId: string) => void;
  unequipItem: (characterId: string, slot: 'weapon' | 'armor' | 'shield') => void;
  restAtInn: (cost: number) => boolean;
  buyItem: (itemId: string, price: number) => boolean;
  sellItem: (itemId: string, price: number) => void;
  healCharacter: (characterId: string, cost: number) => boolean;
  reviveCharacter: (characterId: string, cost: number) => boolean;
  triggerEvent: (eventId: string) => void;
  setSelectedActor: (characterId: string) => void;
  resolveEventOption: (option: EventOption) => void;
  closeEventModal: () => void;
  enterCamp: () => void;
  addToParty: (characterId: string) => void;
  removeFromParty: (characterId: string) => void;
  renameCharacter: (characterId: string, newName: string) => void;
  createCharacter: (newChar: Character) => void;
  enterDungeon: () => void;

  shortRest: () => void;
  longRest: () => void;

  returnToTown: () => void;

  selectedCharacterId: string | null;
  setSelectedCharacterId: (id: string | null) => void;
  soundEnabled: boolean;
  toggleSoundEnabled: () => void;
}

// テスト用初期パーティデータ
const initialParty: Character[] = [
  { id: '1', name: 'ケール', class_id: 'fighter', level: 1, xp: 0, stats: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 }, hp: { current: 12, max: 12 }, hit_dice_remaining: 1, spell_slots: {}, ac: 16, position: 'front', is_alive: true, status_effects: [], equipped_weapon_id: 'longsword' },
  { id: '2', name: 'ナグール', class_id: 'fighter', level: 1, xp: 0, stats: { str: 15, dex: 12, con: 14, int: 10, wis: 12, cha: 8 }, hp: { current: 12, max: 12 }, hit_dice_remaining: 1, spell_slots: {}, ac: 16, position: 'front', is_alive: true, status_effects: [], equipped_weapon_id: 'longsword' },
  { id: '3', name: 'イヤス', class_id: 'cleric', level: 1, xp: 0, stats: { str: 14, dex: 8, con: 14, int: 10, wis: 16, cha: 12 }, hp: { current: 10, max: 10 }, hit_dice_remaining: 1, spell_slots: { 1: { current: 2, max: 2 } }, ac: 18, position: 'front', is_alive: true, status_effects: [], equipped_weapon_id: 'mace' },
  { id: '4', name: 'ドロン', class_id: 'rogue', level: 1, xp: 0, stats: { str: 10, dex: 16, con: 12, int: 14, wis: 10, cha: 12 }, hp: { current: 9, max: 9 }, hit_dice_remaining: 1, spell_slots: {}, ac: 14, position: 'back', is_alive: true, status_effects: [], equipped_weapon_id: 'shortbow' },
  { id: '5', name: 'マホー', class_id: 'wizard', level: 1, xp: 0, stats: { str: 8, dex: 14, con: 12, int: 16, wis: 12, cha: 10 }, hp: { current: 7, max: 7 }, hit_dice_remaining: 1, spell_slots: { 1: { current: 2, max: 2 } }, ac: 12, position: 'back', is_alive: true, status_effects: [], equipped_weapon_id: 'dagger' },
];

const initialPartyWithEquipmentAc = initialParty.map(getCharacterWithCalculatedAc);

/**
 * @brief 初期装備と装備中のアイテムに基づいてプレイヤーの初期インベントリを構築する。
 * @return アイテムIDと数量を含むインベントリエントリの配列。
 */
const getMapDataById = (mapId: string): DungeonMap | null => {
  switch (mapId) {
    case 'dungeon_b1': return map1Data;
    case 'dungeon_b2': return map2Data;
    case 'dungeon_b3': return map3Data;
    default: return null;
  }
};

const findStairsPosition = (map: DungeonMap, eventType: 'stairs_up' | 'stairs_down', targetMapId?: string) => {
  for (const row of map.grid) {
    for (const tile of row) {
      if (tile.event?.type !== eventType) continue;
      if (!targetMapId || tile.event.target_map === targetMapId) {
        return tile;
      }
    }
  }
  return null;
};

const getPartyPositionRole = (index: number): PositionRole => {
  return index < 3 ? 'front' : 'back';
};

const getProficiencyBonus = (level: number): number => {
  return Math.floor((level - 1) / 4) + 2;
};

const isActorProficientInSkill = (actor: Character, skillName: string): boolean => {
  const classData = classesData[actor.class_id];
  return classData?.proficiencies?.includes(skillName) ?? false;
};

function getCharacterWithCalculatedAc(character: Character): Character {
  return {
    ...character,
    ac: calculateCharacterAc(character, character.equipped_armor_id ?? null, character.equipped_shield_id ?? null)
  };
}

const buildInitialInventory = () => {
  const baseInventory = [
    { itemId: 'potion_of_healing', quantity: 3 }
  ];

  const equippedCounts = initialParty.reduce<Record<string, number>>((counts, member) => {
    [member.equipped_weapon_id, member.equipped_armor_id, member.equipped_shield_id].forEach((itemId) => {
      if (!itemId) return;
      counts[itemId] = (counts[itemId] ?? 0) + 1;
    });
    return counts;
  }, {});

  return Object.entries(equippedCounts).reduce((inventory, [itemId, quantity]) => {
    const existing = inventory.find((item) => item.itemId === itemId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      inventory.push({ itemId, quantity });
    }
    return inventory;
  }, baseInventory.map((item) => ({ ...item })));
};

export const useGameStore = create<GameState>((set, get) => ({
  scene: 'town',
  gold: 100,
  party: initialPartyWithEquipmentAc,
  characterRoster: [...initialPartyWithEquipmentAc],
  logs: [
    { id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, text: '街に到着した。', type: 'system' }
  ],
  currentMap: map1Data,
  playerPosition: map1Data.start_position,
  combatants: [],
  currentTurnIndex: 0,
  battleRound: 1,
  skipPlayerTurnsUntilIndex: null,
  battleReward: null,
  showResultModal: false,
  inventory: buildInitialInventory(),
  battleShake: false,
  enemyShakeTargetId: null,
  activeEvent: null,
  eventResult: null,
  eventContext: null,
  selectedActorId: '',
  soundEnabled: true,

  /**
   * @brief 現在のゲームシーンを変更する。
   * @param scene 遷移先のシーン名。
   */
  setScene: (scene) => {
    stopAllBgms();

    set({ scene });

    if (!soundEnabled) return;

    if (scene === 'dungeon') {
      playDungeonBgm();
    } else if (scene === 'town') {
      playTownBgm();
    } else if (scene === 'camp') {
      playCampBgm();
    } else if (scene === 'battle') {
      playBattleBgm();
    }
  },

  toggleSoundEnabled: () => {
    const nextValue = !get().soundEnabled;
    setSoundEnabledValue(nextValue);
    set({ soundEnabled: nextValue });

    if (!nextValue) return;

    const scene = get().scene;
    if (scene === 'dungeon') {
      playDungeonBgm();
    } else if (scene === 'town') {
      playTownBgm();
    } else if (scene === 'camp') {
      playCampBgm();
    } else if (scene === 'battle') {
      playBattleBgm();
    }
  },

  /**
   * @brief ゲームのログに新しいメッセージを追加する。
   * @param text ログ本文。
   * @param type ログ種別。
   */
  addLog: (text, type = 'info') =>
    set((state) => ({
      logs: [
        ...state.logs,
        { id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, text, type }
      ]
    })),

  /**
   * @brief 新しい戦闘を開始し、イニシアチブ順を決定する。
   */
  // 1. 戦闘開始＆イニシアチブ決定
  startBattle: () => {
    const { currentMap, party, addLog } = get();
    const table = currentMap.encounter_table;
    if (!table || table.monsters.length === 0) return;

    // 出現モンスター選択
    const totalWeight = table.monsters.reduce((acc, cur) => acc + cur.weight, 0);
    let randomVal = Math.random() * totalWeight;
    let selectedMonsterId = table.monsters[0].id;

    for (const monster of table.monsters) {
      if (randomVal < monster.weight) {
        selectedMonsterId = monster.id;
        break;
      }
      randomVal -= monster.weight;
    }

    const maxEnemies = currentMap.map_id === 'dungeon_b1'
      ? 2
      : currentMap.map_id === 'dungeon_b2'
        ? 3
        : 4;
    const enemyCount = Math.floor(Math.random() * maxEnemies) + 1;
    const baseMonster = monstersData[selectedMonsterId];
    if (!baseMonster) return;

    // 参加ユニット（Combatant）の生成とイニシアチブ（d20 + DEX修正値）の算出
    const newCombatants: Combatant[] = [];

    // 生存しているプレイヤーキャラクターを追加
    party.forEach((p, index) => {
      if (!p.is_alive) return;
      const dexMod = getAbilityModifier(p.stats.dex);
      const initRoll = rollD20(dexMod);
      newCombatants.push({
        id: p.id,
        name: p.name,
        is_player: true,
        initiative: initRoll.total,
        ac: p.ac,
        hp: { ...p.hp },
        position: getPartyPositionRole(index),
        ref: p,
        is_evading: false
      });
    });

    // モンスターを追加
    for (let i = 0; i < enemyCount; i++) {
      const monsterInstance: MonsterData = {
        ...baseMonster,
        id: `${baseMonster.id}_${Date.now()}_${i}`,
        name: `${baseMonster.name} ${String.fromCharCode(65 + i)}`,
        hp: { ...baseMonster.hp },
        status_effects: []
      };

      const dexMod = getAbilityModifier(monsterInstance.stats.dex);
      const initRoll = rollD20(dexMod);

      newCombatants.push({
        id: monsterInstance.id,
        name: monsterInstance.name,
        is_player: false,
        initiative: initRoll.total,
        ac: monsterInstance.ac,
        hp: monsterInstance.hp,
        position: 'front',
        ref: monsterInstance,
        is_evading: false
      });
    }

    // イニシアチブが高い順にソート
    newCombatants.sort((a, b) => b.initiative - a.initiative);

    stopDungeonBgm();
    set({
      scene: 'battle',
      combatants: newCombatants,
      currentTurnIndex: 0,
      battleRound: 1
    });

    playBattleBgm();
    addLog(`モンスターが現れた！ (${newCombatants.filter(c => !c.is_player).map(c => c.name).join(', ')})`, 'info');

    // 最初のターンが敵の場合は自動で敵の行動を実行
    if (!newCombatants[0].is_player) {
      setTimeout(() => get().processEnemyTurn(), 1000);
    }
  },

  /**
   * @brief 現在のプレイヤーの攻撃を対象に実行する。
   * @param targetId 攻撃対象のコンバタントID。
   */
  // 2. プレイヤーの攻撃実行
  executePlayerAttack: (targetId: string) => {
    const { combatants, currentTurnIndex, addLog, nextTurn } = get();
    const attacker = combatants[currentTurnIndex];
    const target = combatants.find(c => c.id === targetId);

    if (!attacker || !target || !attacker.is_player) return;

    attacker.is_evading = false;

    const playerChar = attacker.ref as Character;
    const weapon = playerChar.equipped_weapon_id ? itemList[playerChar.equipped_weapon_id] : null;
    const strMod = getAbilityModifier(playerChar.stats.str);
    const dexMod = getAbilityModifier(playerChar.stats.dex);
    const isRanged = weapon?.weapon_category === 'ranged';
    const isFinesse = weapon?.weapon_property === 'finesse';
    const attackAbilityMod = isFinesse ? Math.max(strMod, dexMod) : isRanged ? dexMod : strMod;
    const attackBonus = attackAbilityMod + 2;

    const isBacklineMelee = playerChar.position === 'back' && !isRanged;
    if (isBacklineMelee) {
      addLog(`${attacker.name} は後衛のため近接攻撃ができない。`, 'system');
      return;
    }

    const targetStatusEffects = target.ref.status_effects ?? [];
    const targetIsUnconscious = targetStatusEffects.includes('unconscious');
    const attackRoll = targetIsUnconscious
      ? rollD20WithAdvantage(attackBonus)
      : isRanged && playerChar.position === 'front'
        ? rollD20WithDisadvantage(attackBonus)
        : rollD20(attackBonus);

    addLog(
      `${attacker.name} の攻撃！ (出目: ${attackRoll.natural} + ${attackBonus} = ${attackRoll.total})`,
      'player_action'
    );

    let isHit = false;
    let isCriticalHit = attackRoll.isCritical;

    if (attackRoll.isFumble) {
      addLog('ファンブル！ 攻撃は大きく外れた。', 'system');
      playMissSound();
      isHit = false;
    } else if (targetIsUnconscious && attackRoll.total >= target.ac) {
      isHit = true;
      isCriticalHit = true;
    } else if (attackRoll.total >= target.ac) {
      isHit = true;
    } else {
      addLog(`ミス！ ${target.name} の AC ${target.ac} に届かなかった。`, 'system');
      playMissSound();
    }

    if (isHit) {
      if (isCriticalHit) {
        addLog('クリティカルヒット！', 'critical');
      }
      const weaponDice = weapon?.damage_dice || '1d8';
      const diceDamage = rollDiceString(weaponDice, isCriticalHit);
      const damageAbilityMod = isRanged ? dexMod : isFinesse ? Math.max(strMod, dexMod) : strMod;
      const rawDamage = diceDamage + damageAbilityMod;
      const damageType = weapon?.damage_type ?? '殴打';
      const { adjustedDamage, modifierTag } = applyDamageTypeModifiers(rawDamage, damageType, target);
      target.hp.current = Math.max(0, target.hp.current - adjustedDamage);

      const modifierLabel = damageAbilityMod >= 0 ? `+ ${damageAbilityMod}` : `${damageAbilityMod}`;
      const diceExpression = isCriticalHit ? weaponDice.replace(/^(\d+)d(\d+)/, (_, count, sides) => `${Number(count) * 2}d${sides}`) : weaponDice;
      addLog(
        `${target.name} に ${adjustedDamage} のダメージ！${modifierTag} （${diceExpression} ${modifierLabel} = ${diceDamage} ${modifierLabel}）`, 
        isCriticalHit ? 'critical' : 'player_action'
      );
      playSoundForDamageType(damageType);
      set({ combatants: [...combatants], enemyShakeTargetId: target.id });
      setTimeout(() => set({ enemyShakeTargetId: null }), 300);

      if (target.hp.current === 0) {
        addLog(`${target.name} を倒した！`, 'info');
      }
    }

    if (!get().checkBattleStatus()) {
      nextTurn();
    }
  },

  /**
   * @brief 現在のターンでプレイヤーの防御行動を実行する。
   */
  executePlayerEvade: () => {
    const { combatants, currentTurnIndex, addLog, nextTurn } = get();
    const attacker = combatants[currentTurnIndex];

    if (!attacker || !attacker.is_player) return;

    attacker.is_evading = true;
    addLog(`${attacker.name} は回避姿勢を取った。`, 'player_action');

    // ターンを進行
    nextTurn();
  },

  /**
   * @brief 現在の戦闘から逃走を試みる。
   * @return 逃走に成功した場合は true、それ以外は false。
   */
  attemptRun: () => {
    const { combatants, currentTurnIndex, addLog } = get();
    const attacker = combatants[currentTurnIndex];

    if (!attacker || !attacker.is_player) return;

    attacker.is_evading = false;

    const aliveEnemies = combatants.filter((c) => !c.is_player && c.hp.current > 0);
    if (aliveEnemies.length === 0) return;

    const playerChar = attacker.ref as Character;
    const dexMod = getAbilityModifier(playerChar.stats.dex);
    const escapeRoll = rollD20(dexMod + 5);

    const enemyThreat = aliveEnemies.reduce((sum, enemy) => {
      const enemyData = enemy.ref as MonsterData;
      return sum + (enemyData.stats.dex ?? 10);
    }, 0) / aliveEnemies.length;

    if (escapeRoll.total >= enemyThreat) {
      addLog(`${attacker.name} は敵の包囲を抜け出して逃げ切った！`, 'info');
      set({ scene: 'dungeon', combatants: [], currentTurnIndex: 0, battleReward: null, showResultModal: false, skipPlayerTurnsUntilIndex: null });
      return;
    }

    addLog(`${attacker.name} は逃走に失敗し、味方全体が体勢を崩した！`, 'system');

    let nextEnemyIndex = -1;
    const count = combatants.length;

    for (let i = 1; i < count; i++) {
      const checkIdx = (currentTurnIndex + i) % count;
      const target = combatants[checkIdx];
      if (!target.is_player && target.hp.current > 0) {
        nextEnemyIndex = checkIdx;
        break;
      }
    }

    const failedPlayerIndex = currentTurnIndex;
    if (nextEnemyIndex !== -1) {
      set({ currentTurnIndex: nextEnemyIndex, skipPlayerTurnsUntilIndex: failedPlayerIndex });
    } else {
      set({ skipPlayerTurnsUntilIndex: failedPlayerIndex });
    }

    setTimeout(() => get().processEnemyTurn(), 1000);
  },

  /**
   * @brief プレイヤーの呪文を使用して対象に効果を適用する。
   * @param spellId 使用する呪文のID。
   * @param targetId 呪文の対象となるコンバタントID。
   */
  executePlayerSpell: (spellId: string, targetId: string) => {
    const { combatants, currentTurnIndex, party, addLog, nextTurn, checkBattleStatus } = get();
    const attacker = combatants[currentTurnIndex];
    if (!attacker || !attacker.is_player) return;

    attacker.is_evading = false;

    const playerChar = attacker.ref as Character;
    const spell = spellsData[spellId];

    if (!spell) {
      addLog('指定された呪文が存在しません。', 'system');
      return;
    }

    const spellLevel = spell.level;
    const currentSpellSlots = playerChar.spell_slots ?? {};
    let updatedSpellSlots = currentSpellSlots;

    // --- 1. 呪文スロットの確認と消費（初級呪文 level 0 は消費なし） ---
    if (spellLevel > 0) {
      const currentSlots = currentSpellSlots[spellLevel]?.current ?? 0;

      if (currentSlots <= 0) {
        addLog(`レベル ${spellLevel} の呪文スロットが不足しています！`, 'system');
        return;
      }

      // イミュータブルにスロットを更新
      updatedSpellSlots = {
        ...currentSpellSlots,
        [spellLevel]: {
          ...currentSpellSlots[spellLevel],
          current: currentSlots - 1,
        },
      };
    }

    // 攻撃・回復の計算用変数
    const spellLogEntries: { message: string; type: LogMessage['type'] }[] = [];
    const multiTargetDetails: string[] = [];
    let multiTargetLogType: LogMessage['type'] = 'system';
    const isMultiTargetSpell = Boolean(spell.targets_all_enemies || spell.targets_random);
    const isSleepSpell = spell.id === 'sleep';
    const spellMessagePrefix = `${attacker.name} は ${spell.name} を唱えた！ `;
    const sharedDamage = isMultiTargetSpell && spell.damage_dice ? rollDiceString(spell.damage_dice) : null;
    const aliveEnemyIds = combatants.filter((c) => !c.is_player && c.hp.current > 0).map((c) => c.id);
    const affectedTargetIds = isSleepSpell
      ? aliveEnemyIds
      : spell.targets_all_enemies
        ? aliveEnemyIds
        : spell.targets_random
          ? aliveEnemyIds.sort(() => Math.random() - 0.5).slice(0, spell.targets_random)
          : [targetId];
    const sleepBudget = isSleepSpell && spell.damage_dice ? rollDiceString(spell.damage_dice) : 0;
    const sleepTargetIds = isSleepSpell
      ? (() => {
          let remaining = sleepBudget;
          return combatants
            .filter((c) => !c.is_player && c.hp.current > 0)
            .filter((c) => {
              const monsterRef = c.ref as MonsterData;
              const isUndead = monsterRef.type?.toLowerCase() === 'undead';
              const isCharmedImmune = monsterRef.condition_immunities?.includes('charmed');
              return !isUndead && !isCharmedImmune;
            })
            .sort((a, b) => a.hp.current - b.hp.current)
            .reduce<string[]>((ids, enemy) => {
              if (remaining >= enemy.hp.current) {
                remaining -= enemy.hp.current;
                return [...ids, enemy.id];
              }
              return ids;
            }, []);
        })()
      : [];

    if (affectedTargetIds.length === 0) {
      addLog('敵がいないため呪文を唱えられない。', 'system');
      return;
    }

    // --- 2. 戦闘参加者（combatants）の不変更新 ---
    const updatedCombatants = combatants.map((c) => {
      // 自身（呪文使用者）のスロット更新
      if (c.id === attacker.id) {
        c = {
          ...c,
          ref: {
            ...playerChar,
            spell_slots: updatedSpellSlots,
          },
        };
      }

      // 対象への効果適用
      if (affectedTargetIds.includes(c.id)) {
        if (isSleepSpell && !c.is_player) {
          if (sleepTargetIds.includes(c.id)) {
            const monsterRef = c.ref as MonsterData;
            const updatedStatusEffects: StatusEffect[] = monsterRef.status_effects.includes('unconscious')
              ? monsterRef.status_effects
              : [...monsterRef.status_effects, 'unconscious'];

            spellLogEntries.push({
              message: `${c.name} は眠った！`,
              type: 'system'
            });

            return {
              ...c,
              ref: {
                ...monsterRef,
                status_effects: updatedStatusEffects,
              },
            } as Combatant;
          }
          return c;
        }

        // 回復呪文の場合
        if (spell.heal_dice && c.is_player) {
          const healAmount = rollDiceString(spell.heal_dice);
          const newHp = Math.min(c.hp.max, c.hp.current + healAmount);

          spellLogEntries.push({
            message: `${attacker.name} は ${spell.name} を唱えた！ ${c.name} のHPが ${healAmount} 回復！`,
            type: 'heal'
          });

          return {
            ...c,
            hp: { ...c.hp, current: newHp },
          };
        }

        // 攻撃呪文の場合
        if (spell.damage_dice && !c.is_player) {
          const spellcastingAbility = classesData[playerChar.class_id]?.spellcasting_ability ?? 'int';
          const spellAttackMod = getAbilityModifier(playerChar.stats[spellcastingAbility]) + getProficiencyBonus(playerChar.level);
          let damage = 0;
          let hitOrAffected = true;
          let detailText = '';
          let spellAttackCritical = false;

          if (spell.save_type === null) {
            if (spell.auto_hit) {
              damage = sharedDamage ?? rollDiceString(spell.damage_dice);
              detailText = ' 自動命中';
            } else {
              const attackRoll = rollD20(spellAttackMod);
              const attackBonusText = `${spellAttackMod >= 0 ? '+ ' : ''}${spellAttackMod}`;
              if (attackRoll.isCritical) {
                spellAttackCritical = true;
                damage = sharedDamage ?? rollDiceString(spell.damage_dice, true);
                detailText = ` 攻撃ロール ${attackRoll.natural} ${attackBonusText} = ${attackRoll.total}（クリティカル）`;
              } else if (attackRoll.isFumble) {
                hitOrAffected = false;
                detailText = ` 攻撃ロール ${attackRoll.natural} ${attackBonusText} = ${attackRoll.total}（ファンブル）`;
              } else if (attackRoll.total >= c.ac) {
                damage = sharedDamage ?? rollDiceString(spell.damage_dice);
                detailText = ` 攻撃ロール ${attackRoll.natural} ${attackBonusText} = ${attackRoll.total} vs AC ${c.ac}`;
              } else {
                hitOrAffected = false;
                detailText = ` 攻撃ロール ${attackRoll.natural} ${attackBonusText} = ${attackRoll.total} vs AC ${c.ac}`;
              }
            }
          } else {
            const spellSaveDc = 8 + getProficiencyBonus(playerChar.level) + getAbilityModifier(playerChar.stats[spellcastingAbility]);
            const targetStats = (c.ref as Character | MonsterData).stats;
            const saveMod = getAbilityModifier(targetStats[spell.save_type]);
            const saveRoll = rollD20(saveMod);
            const saveTotal = saveRoll.total;
            const saveSuccess = saveTotal >= spellSaveDc;
            detailText = saveSuccess ? ' セーヴ成功' : ' セーヴ失敗';

            if (saveSuccess) {
              if (spell.save_effect === 'none') {
                hitOrAffected = false;
              } else if (spell.save_effect === 'half') {
                damage = sharedDamage !== null ? Math.floor(sharedDamage / 2) : Math.floor(rollDiceString(spell.damage_dice) / 2);
              } else {
                damage = sharedDamage ?? rollDiceString(spell.damage_dice);
              }
            } else {
              damage = sharedDamage ?? rollDiceString(spell.damage_dice);
            }
          }

          if (!hitOrAffected) {
            spellLogEntries.push({
              message: `${attacker.name} は ${spell.name} を唱えたが、効果がなかった。${detailText}`,
              type: 'system'
            });
            return c;
          }

          const damageType = spell.damage_type ?? null;
          const { adjustedDamage, modifierTag } = applyDamageTypeModifiers(damage, damageType, c);
          const newHp = Math.max(0, c.hp.current - adjustedDamage);
          const entryMessage = `${c.name} に ${adjustedDamage} の${spell.damage_type || ''}ダメージ！${modifierTag}${detailText}`;
          const entryType = spell.auto_hit ? 'player_action' : spellAttackCritical ? 'critical' : 'player_action';
          if (isMultiTargetSpell) {
            multiTargetDetails.push(entryMessage);
            if (entryType === 'critical') {
              multiTargetLogType = 'critical';
            } else if (multiTargetLogType !== 'critical') {
              multiTargetLogType = entryType;
            }
          } else {
            spellLogEntries.push({
              message: `${spellMessagePrefix}${entryMessage}`,
              type: entryType
            });
          }

          playSoundForDamageType(spell.damage_type ?? 'spell');
          setTimeout(() => set({ enemyShakeTargetId: c.id }), 0);
          setTimeout(() => set({ enemyShakeTargetId: null }), 300);

          return {
            ...c,
            hp: { ...c.hp, current: newHp },
          };
        }
      }

      return c;
    });

    if (spellLogEntries.length === 0 && multiTargetDetails.length === 0) {
      if (isSleepSpell && sleepTargetIds.length === 0) {
        spellLogEntries.push({
          message: `${spellMessagePrefix}しかし、効果を及ぼせる敵はいなかった。`,
          type: 'system'
        });
      } else {
        return;
      }
    }

    if (isMultiTargetSpell) {
      const multiTargetMessage = `${spellMessagePrefix}\n${multiTargetDetails.join('\n')}`;
      addLog(multiTargetMessage.trim(), multiTargetLogType);
    }

    spellLogEntries.forEach((entry) => {
      addLog(entry.message, entry.type);
    });

    if (!isSleepSpell) {
      if (spell.targets_all_enemies || spell.targets_random) {
        updatedCombatants
          .filter((c) => !c.is_player && c.hp.current === 0)
          .forEach((targetCombatant) => {
            addLog(`${targetCombatant.name} を倒した！`, 'info');
          });
      } else {
        const targetCombatant = updatedCombatants.find((c) => c.id === targetId);
        if (targetCombatant && targetCombatant.hp.current === 0 && spell.damage_dice) {
          addLog(`${targetCombatant.name} を倒した！`, 'info');
        }
      }
    }

    // --- 3. パーティデータの不変同期 ---
    const updatedParty = party.map((p) => {
      const matched = updatedCombatants.find((c) => c.id === p.id);
      if (matched) {
        return {
          ...p,
          hp: { ...p.hp, current: matched.hp.current },
          spell_slots: (matched.ref as Character).spell_slots,
        };
      }
      return p;
    });

    // --- 4. ステートの更新とターン進行 ---
    set({ combatants: updatedCombatants, party: updatedParty });

    if (!checkBattleStatus()) {
      nextTurn();
    }
  },

  /**
   * @brief 敵のターンとして攻撃行動を処理する。
   */
  // 3. 敵の行動ロジック
  processEnemyTurn: () => {
    const { combatants, currentTurnIndex, addLog, nextTurn } = get();
    const attacker = combatants[currentTurnIndex];
    const attackerStatusEffects = attacker?.ref?.status_effects ?? [];

    if (!attacker || attacker.is_player || attacker.hp.current <= 0 || attackerStatusEffects.includes('unconscious')) {
      if (attacker && attackerStatusEffects.includes('unconscious')) {
        addLog(`${attacker.name} は気絶していて行動できない。`, 'system');
      }
      nextTurn();
      return;
    }

    const alivePlayers = combatants.filter(c => c.is_player && c.hp.current > 0);
    if (alivePlayers.length === 0) return;

    const enemyData = attacker.ref as MonsterData;
    const action = enemyData.actions[0] || { name: '攻撃', to_hit: 2, damage_dice: '1d6', damage_type: '殴打' };
    const enemyWeapon = Object.values(itemList).find(
      (item) => item.type === 'weapon' && item.name === action.name
    );
    const canTargetBackline = enemyWeapon?.weapon_category === 'ranged';
    const eligiblePlayers = alivePlayers.filter((player) =>
      canTargetBackline ? true : player.position === 'front'
    );
    const targetCandidates = eligiblePlayers.length > 0 ? eligiblePlayers : alivePlayers;
    const target = targetCandidates[Math.floor(Math.random() * targetCandidates.length)];

    addLog(`${attacker.name} の ${action.name}！`, 'enemy_action');
    playSoundForDamageType(action.damage_type ?? '殴打');

    const attackRoll = target.is_evading ? rollD20WithDisadvantage(action.to_hit) : rollD20(action.to_hit);

    let isHit = false;
    if (attackRoll.isCritical) {
      addLog('痛恨の一撃！ (クリティカル)', 'critical');
      isHit = true;
    } else if (attackRoll.isFumble) {
      addLog('攻撃は空を切った。', 'system');
      playMissSound();
      isHit = false;
    } else if (attackRoll.total >= target.ac) {
      isHit = true;
    } else {
      addLog(`${target.name} は攻撃をかわした。`, 'system');
      playMissSound();
    }

    if (isHit) {
      const damage = rollDiceString(action.damage_dice, attackRoll.isCritical);
      target.hp.current = Math.max(0, target.hp.current - damage);

      const partyMember = get().party.find(p => p.id === target.id);
      if (partyMember) {
        partyMember.hp.current = target.hp.current;
        if (partyMember.hp.current === 0) {
          partyMember.is_alive = false;
        }
      }

      playSoundForDamageType(action.damage_type ?? '殴打');
      addLog(`${target.name} は ${damage} のダメージを受けた！`, attackRoll.isCritical ? 'critical' : 'enemy_action');
      set({ battleShake: true });
      setTimeout(() => set({ battleShake: false }), 150);
    }

    set({ combatants: [...combatants], party: [...get().party] });

    if (!get().checkBattleStatus()) {
      nextTurn();
    }
  },

  /**
   * @brief 次のターンを進行する。
   */
  // ターン進行
  nextTurn: () => {
    const { combatants, currentTurnIndex, skipPlayerTurnsUntilIndex, addLog } = get();

    const count = combatants.length;
    let nextIndex = (currentTurnIndex + 1) % count;

    const isSkippable = (combatant: Combatant) => {
      const statusEffects = combatant.ref.status_effects ?? [];
      return combatant.hp.current <= 0 || statusEffects.includes('unconscious');
    };

    while (isSkippable(combatants[nextIndex])) {
      nextIndex = (nextIndex + 1) % count;
    }

    if (skipPlayerTurnsUntilIndex !== null) {
      while (
        combatants[nextIndex].is_player &&
        nextIndex !== skipPlayerTurnsUntilIndex
      ) {
        addLog(`${combatants[nextIndex].name} は体勢を崩して行動できない。`, 'system');
        nextIndex = (nextIndex + 1) % count;
        while (isSkippable(combatants[nextIndex])) {
          nextIndex = (nextIndex + 1) % count;
        }
      }

      if (nextIndex === skipPlayerTurnsUntilIndex) {
        set({ skipPlayerTurnsUntilIndex: null });
      }
    }

    const roundIncrement = nextIndex <= currentTurnIndex && combatants.filter((c) => c.hp.current > 0).length > 1;
    set({
      currentTurnIndex: nextIndex,
      battleRound: roundIncrement ? get().battleRound + 1 : get().battleRound
    });

    const nextCombatant = combatants[nextIndex];
    if (!nextCombatant.is_player) {
      setTimeout(() => get().processEnemyTurn(), 1000);
    }
  },

  /**
   * @brief 戦闘の勝敗を判定する。
   * @return 戦闘が終了した場合は true、それ以外は false。
   */
  // 勝敗チェック
  checkBattleStatus: () => {
    const { combatants, addLog } = get();

    const aliveEnemies = combatants.filter(c => !c.is_player && c.hp.current > 0);
    const alivePlayers = combatants.filter(c => c.is_player && c.hp.current > 0);

    if (aliveEnemies.length === 0) {
      const totalEnemies = combatants.filter((c) => !c.is_player);
      const totalXp = totalEnemies.length * 50;
      const totalGold = totalEnemies.length * 15;
      const dropItems = determineMonsterDrops(totalEnemies);

      addLog('戦闘に勝利した！', 'info');
      set({
        battleReward: {
          xp: totalXp,
          gold: totalGold,
          items: dropItems
        }
      });
      setTimeout(() => {
        set({ showResultModal: true });
      }, 300);
      return true;
    }

    if (alivePlayers.length === 0) {
      addLog('パーティは全滅した...', 'critical');
      setTimeout(() => {
        set({ showResultModal: true });
      }, 300);
      return true;
    }

    return false;
  },

  /**
   * @brief キャラクターの経験値を確認し、レベルアップがあれば処理する。
   * @param character レベルアップをチェックするキャラクター。
   * @return 更新されたキャラクター。
   */
  // ★ キャラクターのレベルアップチェック & ステータス更新
  checkLevelUp: (character: Character) => {
    const currentLevel = character.level;
    const currentXp = character.xp || 0;
    const nextLevelXp = XP_TABLE[currentLevel + 1];

    if (nextLevelXp && currentXp >= nextLevelXp) {
      const newLevel = currentLevel + 1;
      const conMod = getAbilityModifier(character.stats.con);
      const hdValue = character.class_id === 'wizard' ? 4 : character.class_id === 'fighter' ? 6 : 5;
      const hpIncrease = Math.max(1, hdValue + conMod);
      const newMaxHp = character.hp.max + hpIncrease;

      const classSpellSlots = SPELL_SLOTS_TABLE[character.class_id]?.[newLevel];
      let updatedSpellSlots = character.spell_slots;

      if (classSpellSlots) {
        updatedSpellSlots = {};
        Object.entries(classSpellSlots).forEach(([lvlStr, maxCount]) => {
          const lvl = Number(lvlStr);
          updatedSpellSlots![lvl] = {
            current: maxCount,
            max: maxCount
          };
        });
      }

      get().addLog(`🎉 ${character.name} は Level ${newLevel} にレベルアップした！ (最大HP +${hpIncrease})`, 'heal');

      return {
        ...character,
        level: newLevel,
        hp: { current: newMaxHp, max: newMaxHp },
        hit_dice_remaining: newLevel,
        spell_slots: updatedSpellSlots
      };
    }

    return character;
  },

  /**
   * @brief 戦闘報酬を獲得し、パーティに分配する。
   */
  claimBattleReward: () => {
    const { party, battleReward, checkLevelUp, setScene, inventory } = get();
    if (!battleReward) return;

    const aliveMembers = party.filter((m) => m.is_alive);
    const xpPerMember = Math.floor(battleReward.xp / (aliveMembers.length || 1));

    const updatedParty = party.map((member) => {
      if (!member.is_alive) return member;

      const updatedXpMember = {
        ...member,
        xp: (member.xp || 0) + xpPerMember
      };

      return checkLevelUp(updatedXpMember);
    });

    const updatedInventory = [...inventory];
    battleReward.items.forEach((itemId) => {
      const existingIndex = updatedInventory.findIndex((i) => i.itemId === itemId);
      if (existingIndex >= 0) {
        updatedInventory[existingIndex] = {
          ...updatedInventory[existingIndex],
          quantity: updatedInventory[existingIndex].quantity + 1
        };
      } else {
        updatedInventory.push({ itemId, quantity: 1 });
      }
    });

    set({
      party: updatedParty,
      battleReward: null,
      showResultModal: false,
      gold: (get().gold || 0) + battleReward.gold,
      inventory: updatedInventory
    });

    setScene('dungeon');
  },

  /**
   * @brief 指定したイベントを発生させる。
   * @param eventId 発生させるイベントのID。
   */
  // イベントの発生
  triggerEvent: (eventId: string) => {
    const event = dungeonEvents[eventId];
    const { party } = get();
    if (!event) return;

    const previousContext = get().eventContext;
    const isSameChestEvent = previousContext?.eventId === eventId && event.type === 'chest';

    set({
      activeEvent: event,
      eventResult: null,
      eventContext: isSameChestEvent
        ? previousContext
        : event.type === 'chest'
          ? { eventId, trapCleared: false }
          : null,
      selectedActorId: party[0]?.id || ''
    });
  },

  /**
   * @brief イベント処理中のアクターを選択する。
   * @param characterId 選択するキャラクターのID。
   */
  setSelectedActor: (characterId: string) => {
    set({ selectedActorId: characterId });
  },

  /**
   * @brief イベントの選択肢を処理し、技能判定と報酬・ペナルティを適用する。
   * @param option 選択したイベントオプション。
   */
  // イベント選択肢の実行と技能判定
  resolveEventOption: (option: EventOption) => {
    const { party, selectedActorId, inventory, addLog, activeEvent, currentMap, playerPosition, eventContext } = get();
    const actor = party.find((m) => m.id === selectedActorId) || party[0];

    if (!actor) return;

    if (option.requiredProficiency && !isActorProficientInSkill(actor, option.requiredProficiency)) {
      set({
        eventResult: {
          passed: false,
          roll: 0,
          modifier: 0,
          total: 0,
          dc: 0,
          message: `${actor.name} は ${option.requiredProficiency} に習熟していないため、この行動を行えない。`
        }
      });
      return;
    }

    if (option.check) {
      const d20Result = rollD20(0);
      const d20 = d20Result.total;
      const abilityMod = getAbilityModifier(actor.stats[option.check.ability]);
      const proficiencyMod = option.check.skill && isActorProficientInSkill(actor, option.check.skill)
        ? getProficiencyBonus(actor.level)
        : 0;
      const mod = abilityMod + proficiencyMod;
      const effectiveDc = option.id === 'pick_lock' && eventContext?.trapCleared
        ? Math.max(1, option.check.dc - 2)
        : option.check.dc;
      const total = d20 + mod;
      const passed = total >= effectiveDc;

      let resultMsg = passed ? option.successText : option.failureText;
      let chestRewardMessages: string[] = [];
      let updatedInventory = [...inventory];
      let updatedGold = get().gold || 0;

      if (passed && option.reward) {
        let rewardLogText = '';

        // 1. ゴールドの加算処理
        if (option.reward.gold) {
          updatedGold += option.reward.gold;
          rewardLogText += `💰 ${option.reward.gold} G `;
          chestRewardMessages.push(`${option.reward.gold} G`);
        }

        // 2. アイテムのインベントリ追加処理

        if (option.reward.items && option.reward.items.length > 0) {
          option.reward.items.forEach((itemId) => {
            const existingIndex = updatedInventory.findIndex((i) => i.itemId === itemId);

            if (existingIndex >= 0) {
              updatedInventory[existingIndex] = {
                ...updatedInventory[existingIndex],
                quantity: updatedInventory[existingIndex].quantity + 1
              };
            } else {
              updatedInventory.push({
                itemId: itemId,
                quantity: 1
              });
            }
          });

          const itemNames = option.reward.items
            .map((itemId) => itemList[itemId]?.name ?? itemId)
            .join('、');
          rewardLogText += `📦 ${itemNames} `;

          if (activeEvent?.type === 'chest') {
            chestRewardMessages.push(itemNames);
          }
        }

        if (rewardLogText) {
          resultMsg += ` (${rewardLogText.trim()})`;
        }
      }

      if (!passed && option.penalty?.damageDice) {
        const dmg = rollDiceString(option.penalty.damageDice);
        actor.hp.current = Math.max(0, actor.hp.current - dmg);
        resultMsg += ` (${actor.name} は ${dmg} ダメージを受けた！)`;
      }

      // 罠を調べていない状態で開錠すると、罠ダメージが追加される
      if (option.id === 'pick_lock' && activeEvent?.options.some((opt) => opt.id === 'check_trap') && !eventContext?.trapCleared) {
        const trapDice = activeEvent.options.find((opt) => opt.id === 'check_trap')?.penalty?.damageDice ?? '1d6';
        const trapDmg = rollDiceString(trapDice);
        actor.hp.current = Math.max(0, actor.hp.current - trapDmg);
        resultMsg += ` (${actor.name} は罠のトリガーによりさらに ${trapDmg} ダメージを受けた！)`;
      }

      const nextState: Partial<GameState> = {
        eventResult: {
          passed,
          roll: d20,
          modifier: mod,
          total,
          dc: option.check.dc,
          message: resultMsg
        },
        party: [...party],
        inventory: updatedInventory,
        gold: updatedGold,
        eventContext: eventContext
      };

      const currentTile = currentMap.grid[playerPosition.y]?.[playerPosition.x];
      const shouldRemoveChest =
        activeEvent?.type === 'chest' &&
        currentTile?.event?.type === 'chest' &&
        option.id === 'pick_lock' &&
        passed;

      if (shouldRemoveChest) {
        const updatedGrid = currentMap.grid.map((row, rowIndex) =>
          row.map((tile, colIndex) => {
            if (rowIndex === playerPosition.y && colIndex === playerPosition.x) {
              return { ...tile, event: null };
            }
            return tile;
          })
        );
        nextState.currentMap = { ...currentMap, grid: updatedGrid };
      }

      addLog(`[イベント] ${actor.name} の ${option.check.label} 判定: ${total} (出目 ${d20} + 修正値 ${mod}) -> ${passed ? '成功' : '失敗'}`, passed ? 'info' : 'system');

      if (activeEvent?.type === 'chest' && chestRewardMessages.length > 0) {
        addLog(`📦 ${chestRewardMessages.join('、')} を入手した！`, 'info');
      }

      if (option.id === 'check_trap' && passed) {
        nextState.eventContext = eventContext
          ? { ...eventContext, trapCleared: true }
          : activeEvent?.type === 'chest'
            ? { eventId: activeEvent.id, trapCleared: true }
            : null;
      }

      set(nextState as any);
    } else {
      set({
        eventResult: {
          passed: true,
          roll: 0,
          modifier: 0,
          total: 0,
          message: option.successText
        }
      });
    }
  },

  /**
   * @brief イベントモーダルを閉じる。
   */
  closeEventModal: () => {
    set({ activeEvent: null, eventResult: null });
  },
  resumeEvent: () => {
    set({ eventResult: null });
  },

  /**
   * @param itemId 使用するアイテムのID。
   * @param targetCharacterId 使用対象のキャラクターID。
   */
  // ★ 消費アイテム（ポーション等）の使用
  useItem: (itemId: string, targetCharacterId: string) => {
    const { inventory, party, combatants, currentTurnIndex, addLog } = get();
    const item = itemList[itemId];
    const target = party.find((m) => m.id === targetCharacterId);
    const actor = combatants[currentTurnIndex];

    if (!item || !target || !target.is_alive) return;

    const invItem = inventory.find((i) => i.itemId === itemId);
    if (!invItem || invItem.quantity <= 0) return;

    if (item.type === 'consumable' && item.heal_dice) {
      const healAmount = rollDiceString(item.heal_dice);
      const newHp = Math.min(target.hp.max, target.hp.current + healAmount);

      const updatedParty = party.map((m) =>
        m.id === targetCharacterId ? { ...m, hp: { ...m.hp, current: newHp } } : m
      );

      const updatedCombatants = combatants.map((c) =>
        c.id === targetCharacterId ? { ...c, hp: { ...c.hp, current: newHp } } : c
      );

      const updatedInventory = inventory
        .map((i) => (i.itemId === itemId ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0);

      const actorName = actor?.is_player ? actor.name : '誰か';
      const logMessage = actorName === target.name
        ? `${actorName} は ${item.name} を使用し、HPが ${healAmount} 回復した！`
        : `${actorName} が ${target.name} に ${item.name} を使用した。HPが ${healAmount} 点回復した！`;

      addLog(logMessage, 'heal');

      set({ party: updatedParty, combatants: updatedCombatants, inventory: updatedInventory });
    }
  },

  /**
   * @brief キャラクターに武器または防具を装備させる。
   * @param characterId 装備変更対象のキャラクターID。
   * @param itemId 装備するアイテムのID。
   */
  // ★ 武器・防具の装備変更
  equipItem: (characterId: string, itemId: string) => {
    const { party, addLog } = get();
    const item = itemList[itemId];
    if (!item) return;

    const updatedParty = party.map((m) => {
      if (m.id !== characterId) return m;

      if (item.type === 'weapon') {
        addLog(`${m.name} は ${item.name} を装備した。`, 'info');
        return { ...m, equipped_weapon_id: itemId };
      }

      if (item.type === 'armor' && item.slot === 'shield') {
        addLog(`${m.name} は ${item.name} を装備した。`, 'info');
        return {
          ...m,
          equipped_shield_id: itemId,
          ac: calculateCharacterAc(m, m.equipped_armor_id ?? null, itemId)
        };
      }

      if (item.type === 'armor' && item.ac_bonus) {
        addLog(`${m.name} は ${item.name} を装備し、ACが ${item.ac_bonus} になった。`, 'info');
        return {
          ...m,
          equipped_armor_id: itemId,
          ac: calculateCharacterAc(m, itemId, m.equipped_shield_id ?? null)
        };
      }

      return m;
    });

    set({ party: updatedParty });
  },

  /**
   * @brief キャラクターの装備を外す。
   * @param characterId 装備解除対象のキャラクターID。
   * @param slot 外すスロット。
   */
  unequipItem: (characterId: string, slot: 'weapon' | 'armor' | 'shield') => {
    const { party, addLog } = get();

    const updatedParty = party.map((m) => {
      if (m.id !== characterId) return m;

      if (slot === 'weapon') {
        addLog(`${m.name} は武器を外した。`, 'info');
        return { ...m, equipped_weapon_id: null };
      }

      if (slot === 'armor') {
        addLog(`${m.name} は防具を外した。`, 'info');
        return {
          ...m,
          equipped_armor_id: null,
          ac: calculateCharacterAc(m, null, m.equipped_shield_id ?? null)
        };
      }

      addLog(`${m.name} は盾を外した。`, 'info');
      return {
        ...m,
        equipped_shield_id: null,
        ac: calculateCharacterAc(m, m.equipped_armor_id ?? null, null)
      };
    });

    set({ party: updatedParty });
  },

  /**
   * @brief 宿屋で全員のHPを回復する。
   * @param cost 宿泊に必要なゴールド。
   * @return 宿泊に成功した場合は true、それ以外は false。
   */
  // 🏨 宿屋（大休憩）：全員のHPを最大まで回復
  restAtInn: (cost: number) => {
    const { gold, party, addLog } = get();
    if (gold < cost) {
      addLog('ゴールドが不足しているため、宿屋に泊まれません。', 'info');
      return false;
    }

    const restoredParty = party.map((m) => {
      const restoredSlots: Record<number, { current: number; max: number }> = {};
      const memberSpellSlots = m.spell_slots;
      if (memberSpellSlots) {
        Object.keys(memberSpellSlots).forEach((levelStr) => {
          const level = Number(levelStr);
          const slot = memberSpellSlots[level];
          if (slot) {
            restoredSlots[level] = {
              current: slot.max,
              max: slot.max
            };
          }
        });
      }

      return {
        ...m,
        hp: { ...m.hp, current: m.hp.max },
        is_alive: true,
        hit_dice_remaining: m.level,
        spell_slots: restoredSlots
      };
    });

    set({
      gold: gold - cost,
      party: restoredParty
    });

    addLog(`宿屋で大休憩をとり、パーティー全員のHP・ヒットダイス・呪文スロットが全回復した！ (-${cost} G)`, 'heal');
    return true;
  },

  /**
   * @brief アイテムを購入してインベントリに追加する。
   * @param itemId 購入するアイテムのID。
   * @param price 購入価格。
   * @return 購入に成功した場合は true、それ以外は false。
   */
  // 🛒 アイテム購入
  buyItem: (itemId: string, price: number) => {
    const { gold, inventory, addLog } = get();
    if (gold < price) {
      addLog('ゴールドが不足しています。', 'info');
      return false;
    }

    const currentInventory = [...inventory];
    const existingIndex = currentInventory.findIndex((i) => i.itemId === itemId);

    if (existingIndex >= 0) {
      currentInventory[existingIndex] = {
        ...currentInventory[existingIndex],
        quantity: currentInventory[existingIndex].quantity + 1
      };
    } else {
      currentInventory.push({ itemId, quantity: 1 });
    }

    set({
      gold: gold - price,
      inventory: currentInventory
    });

    addLog(`アイテムを購入した (-${price} G)`, 'info');
    return true;
  },

  /**
   * @brief アイテムを売却してゴールドを増やす。
   * @param itemId 売却するアイテムのID。
   * @param price 売却価格。
   */
  // 💰 アイテム売却
  sellItem: (itemId: string, price: number) => {
    const { gold, inventory, addLog } = get();
    const existingIndex = inventory.findIndex((i) => i.itemId === itemId);

    if (existingIndex < 0) return;

    const currentInventory = [...inventory];
    if (currentInventory[existingIndex].quantity > 1) {
      currentInventory[existingIndex] = {
        ...currentInventory[existingIndex],
        quantity: currentInventory[existingIndex].quantity - 1
      };
    } else {
      currentInventory.splice(existingIndex, 1);
    }

    set({
      gold: gold + price,
      inventory: currentInventory
    });

    addLog(`アイテムを売却した (+${price} G)`, 'info');
  },

  /**
   * @brief 神殿で単体キャラクターのHPを回復する。
   * @param characterId 回復対象のキャラクターID。
   * @param cost 回復に必要なゴールド。
   * @return 回復に成功した場合は true、それ以外は false。
   */
  // ⛪ 単体手当て・回復
  healCharacter: (characterId: string, cost: number) => {
    const { gold, party, addLog } = get();
    if (gold < cost) return false;

    const updatedParty = party.map((m) => {
      if (m.id !== characterId) return m;
      return {
        ...m,
        hp: { ...m.hp, current: m.hp.max }
      };
    });

    const target = party.find((m) => m.id === characterId);
    set({ gold: gold - cost, party: updatedParty });
    addLog(`神殿で ${target?.name} の傷を治療した！ (-${cost} G)`, 'heal');
    return true;
  },

  /**
   * @brief 神殿でキャラクターを蘇生する。
   * @param characterId 蘇生対象のキャラクターID。
   * @param cost 蘇生に必要なゴールド。
   * @return 蘇生に成功した場合は true、それ以外は false。
   */
  // ⛪ 蘇生処理（HP 1 で復活）
  reviveCharacter: (characterId: string, cost: number) => {
    const { gold, party, addLog } = get();
    if (gold < cost) return false;

    const updatedParty = party.map((m) => {
      if (m.id !== characterId) return m;
      return {
        ...m,
        is_alive: true,
        hp: { ...m.hp, current: Math.floor(m.hp.max * 0.5) }
      };
    });

    const target = party.find((m) => m.id === characterId);
    set({ gold: gold - cost, party: updatedParty });
    addLog(`奇跡の祈りにより ${target?.name} が蘇生した！ (-${cost} G)`, 'heal');
    return true;
  },

  /**
   * @brief キャンプへ移動し、戦闘状態を解除する。
   */
  enterCamp: () => {
    const { addLog } = get();
    set({ scene: 'camp', combatants: [], currentTurnIndex: 0 });
    addLog('キャンプ地に移動した。', 'info');
  },

  /**
   * @brief プレイヤーを移動または向きを変更する。
   * @param action 移動方向または回転アクション。
   */
  movePlayer: (action) => {
    const { playerPosition, currentMap, addLog, startBattle, triggerEvent } = get();
    const directions: Direction[] = ['N', 'E', 'S', 'W'];
    let { x, y, facing } = playerPosition;

    if (action === 'turnLeft') {
      const idx = (directions.indexOf(facing) + 3) % 4;
      set({ playerPosition: { x, y, facing: directions[idx] } });
      return;
    }
    if (action === 'turnRight') {
      const idx = (directions.indexOf(facing) + 1) % 4;
      set({ playerPosition: { x, y, facing: directions[idx] } });
      return;
    }

    const checkDirection: Direction = action === 'forward'
      ? facing
      : directions[(directions.indexOf(facing) + 2) % 4];

    const currentTile = currentMap.grid[y]?.[x];
    if (!currentTile) return;

    const wallStatus: WallType = currentTile.walls[checkDirection];

    if (wallStatus === 'wall' || wallStatus === 'locked_door') {
      addLog('壁にぶつかった！', 'system');
      return;
    }

    let nextX = x;
    let nextY = y;
    if (checkDirection === 'N') nextY -= 1;
    if (checkDirection === 'S') nextY += 1;
    if (checkDirection === 'E') nextX += 1;
    if (checkDirection === 'W') nextX -= 1;

    if (nextX < 0 || nextX >= currentMap.width || nextY < 0 || nextY >= currentMap.height) {
      addLog('これ以上先へは進めない。', 'system');
      return;
    }

    if (wallStatus === 'door') {
      addLog('扉を開けて進んだ。', 'info');
    } else {
      addLog(`${action === 'forward' ? '前進' : '後退'}した。`, 'info');
    }

    set({ playerPosition: { x: nextX, y: nextY, facing } });

    const nextTile = currentMap.grid[nextY][nextX];
    if (nextTile.event) {
      if (nextTile.event.type === 'chest') {
        triggerEvent('locked_chest');
        return;
      }
      if (nextTile.event.type === 'door') {
        triggerEvent('heavy_door');
        return;
      }
      if (nextTile.event.type === 'trap') {
        triggerEvent('poison_dart_trap');
        return;
      }
    }

    if (Math.random() < currentMap.encounter_table.rate) {
      startBattle();
    }
  },

  /**
   * @brief 小休憩を行い、ヒットダイスを消費してHPを回復する。
   */
  // ★ 小休憩 (Short Rest): ヒット・ダイスを1つ消費してHP回復
  shortRest: () => {
    const { party, addLog } = get();
    let restedAny = false;

    const updatedParty = party.map((member) => {
      if (!member.is_alive || member.hp.current >= member.hp.max) return member;

      if (member.hit_dice_remaining > 0) {
        restedAny = true;
        const conMod = Math.floor((member.stats.con - 10) / 2);
        const healAmount = Math.max(1, Math.floor(Math.random() * 8) + 1 + conMod);
        const newHp = Math.min(member.hp.max, member.hp.current + healAmount);

        addLog(`${member.name} は小休憩をとり、HPが ${healAmount} 回復した。`, 'heal');

        return {
          ...member,
          hp: { ...member.hp, current: newHp },
          hit_dice_remaining: member.hit_dice_remaining - 1
        };
      }
      return member;
    });

    if (!restedAny) {
      addLog('小休憩をとれるメンバー（ヒット・ダイス残あり＆HP減）がいません。', 'system');
      return;
    }

    set({ party: updatedParty });
  },

  /**
   * @brief 大休憩を行い、パーティ全員のHP・ヒットダイス・呪文スロットを全回復する。
   */
  // ★ 大休憩 (Long Rest): 全HP回復・ヒットダイス全回復・呪文スロット全回復
  longRest: () => {
    const { party, addLog } = get();

    const updatedParty = party.map((member) => {
      if (!member.is_alive) return member;

      const restoredSlots: Record<number, { current: number; max: number }> = {};
      const memberSpellSlots = member.spell_slots;
      if (memberSpellSlots) {
        Object.keys(memberSpellSlots).forEach((levelStr) => {
          const level = Number(levelStr);
          const slot = memberSpellSlots[level];
          if (slot) {
            restoredSlots[level] = {
              current: slot.max,
              max: slot.max
            };
          }
        });
      }

      return {
        ...member,
        hp: { ...member.hp, current: member.hp.max },
        hit_dice_remaining: member.level,
        spell_slots: restoredSlots
      };
    });

    set({ party: updatedParty });
    addLog('パーティは大休憩をとり、HP・ヒットダイス・呪文スロットが全回復した！', 'heal');
  },

  // 🏰 地上（街）へ帰還する
  /**
   * @brief 地下迷宮へ移動し、ダンジョン開始状態に戻す。
   */
  enterDungeon: () => {
    const { currentMap, addLog } = get();
    set({
      scene: 'dungeon',
      playerPosition: currentMap.start_position,
      combatants: [],
      currentTurnIndex: 0,
      skipPlayerTurnsUntilIndex: null,
      battleReward: null,
      showResultModal: false,
    });
    addLog('🏰 街から地下迷宮のスタート地点へ入った。', 'info');
  },

  /**
   * @brief 街へ帰還し、シーンを town に変更する。
   */
  returnToTown: () => {
    const { addLog } = get();
    addLog('🏰 階段を上り、無事に地上（街）へ帰還した。', 'info');

    set({
      scene: 'town',
      combatants: [],
      currentTurnIndex: 0,
      battleReward: null,
      showResultModal: false,
    });
  },

  useStairs: () => {
    const { currentMap, playerPosition, addLog, returnToTown } = get();
    const { x, y, facing } = playerPosition;
    const currentTile = currentMap.grid[y]?.[x];
    if (!currentTile?.event) return;

    if (currentTile.event.type === 'stairs_up' && !currentTile.event.target_map) {
      returnToTown();
      return;
    }

    const isDown = currentTile.event.type === 'stairs_down';
    const targetMapId = currentTile.event.target_map;

    if (!targetMapId) {
      addLog('階段の先が見つからない。', 'system');
      return;
    }

    const targetMap = getMapDataById(targetMapId);
    if (!targetMap) {
      addLog('階段の先が見つからない。', 'system');
      return;
    }

    const oppositeType = isDown ? 'stairs_up' : 'stairs_down';
    const targetTile = findStairsPosition(targetMap, oppositeType, currentMap.map_id);
    const destination = targetTile ?? targetMap.start_position;
    set({ currentMap: targetMap, playerPosition: { x: destination.x, y: destination.y, facing } });
    addLog(`階段で ${targetMap.name} へ移動した。`, 'info');
  },

  /**
   * @brief キャラクターをパーティに追加する。
   * @param characterId 追加するキャラクターのID。
   */
  addToParty: (characterId: string) => {
    set((state) => {
      const char = state.characterRoster.find((c) => c.id === characterId);
      if (!char || state.party.some((p) => p.id === characterId) || state.party.length >= 5) {
        return {};
      }
      return { party: [...state.party, char] };
    });
  },

  /**
   * @brief キャラクターをパーティから削除する。
   * @param characterId 削除するキャラクターのID。
   */
  removeFromParty: (characterId: string) => {
    set((state) => ({
      party: state.party.filter((c) => c.id !== characterId),
    }));
  },

  /**
   * @brief 新しいキャラクターをキャラクターロスターに追加する。
   * @param newChar 追加するキャラクター情報。
   */
  renameCharacter: (characterId: string, newName: string) => {
    if (!newName.trim()) return;
    set((state) => ({
      party: state.party.map((member) =>
        member.id === characterId ? { ...member, name: newName.trim() } : member
      ),
      characterRoster: state.characterRoster.map((member) =>
        member.id === characterId ? { ...member, name: newName.trim() } : member
      )
    }));
  },

  createCharacter: (newChar: Character) => {
    set((state) => {
      const nextRoster = [...state.characterRoster, newChar];
      const nextParty = state.party.length < 5 ? [...state.party, newChar] : state.party;
      return { characterRoster: nextRoster, party: nextParty };
    });
  },

  selectedCharacterId: null,
  /**
   * @brief 選択中のキャラクターIDを設定する。
   * @param id 設定するキャラクターID。
   */
  setSelectedCharacterId: (id) => set({ selectedCharacterId: id }),
}));
