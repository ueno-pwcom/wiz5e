import { create } from 'zustand';
import type { Character, Combatant, Direction, DungeonMap, LogMessage, MonsterData, WallType } from '../types/game';
import { map1Data } from '../data/map1';
import { spellList } from '../data/spells';
import { monsterList } from '../data/monsters';
import { itemList } from '../data/items';
import { dungeonEvents } from '../data/dungeonEvents';
import type { DungeonEvent, EventOption } from '../data/dungeonEvents';
import { XP_TABLE, SPELL_SLOTS_TABLE } from '../data/levelTable';
import { getAbilityModifier, rollD20, rollDiceString } from '../utils/dice';

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
  logs: LogMessage[];
  currentMap: DungeonMap;
  playerPosition: { x: number; y: number; facing: Direction };

  // 戦闘用状態
  combatants: Combatant[];
  currentTurnIndex: number;
  skipPlayerTurnsUntilIndex: number | null;
  battleReward: BattleReward | null;
  showResultModal: boolean;
  inventory: { itemId: string; quantity: number }[];
  activeEvent: DungeonEvent | null;
  eventResult: EventResult | null;
  selectedActorId: string;

  setScene: (scene: GameScene) => void;
  addLog: (text: string, type?: LogMessage['type']) => void;
  movePlayer: (action: 'forward' | 'backward' | 'turnLeft' | 'turnRight') => void;

  // 戦闘用アクション
  startBattle: () => void;
  executePlayerAttack: (targetId: string) => void;
  executePlayerDefend: () => void;
  attemptRun: () => void;
  executePlayerSpell: (spellId: string, targetId: string) => void;
  processEnemyTurn: () => void;
  nextTurn: () => void;
  checkBattleStatus: () => boolean;
  checkLevelUp: (character: Character) => Character;
  claimBattleReward: () => void;
  useItem: (itemId: string, targetCharacterId: string) => void;
  equipItem: (characterId: string, itemId: string) => void;
  unequipItem: (characterId: string, slot: 'weapon' | 'armor') => void;
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

  shortRest: () => void;
  longRest: () => void;

  returnToTown: () => void;

  selectedCharacterId: string | null;
  setSelectedCharacterId: (id: string | null) => void;
}

// テスト用初期パーティデータ
const initialParty: Character[] = [
  { id: '1', name: 'ナグロー', class_id: 'fighter', level: 1, xp: 0, stats: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 }, hp: { current: 12, max: 12 }, hit_dice_remaining: 1, spell_slots: {}, ac: 16, position: 'front', is_alive: true, status_effects: [], equipped_weapon_id: 'longsword' },
  { id: '2', name: 'アリア', class_id: 'fighter', level: 1, xp: 0, stats: { str: 15, dex: 12, con: 14, int: 10, wis: 12, cha: 8 }, hp: { current: 12, max: 12 }, hit_dice_remaining: 1, spell_slots: {}, ac: 16, position: 'front', is_alive: true, status_effects: [], equipped_weapon_id: 'longsword' },
  { id: '3', name: 'フラン', class_id: 'cleric', level: 1, xp: 0, stats: { str: 14, dex: 8, con: 14, int: 10, wis: 16, cha: 12 }, hp: { current: 10, max: 10 }, hit_dice_remaining: 1, spell_slots: { 1: { current: 2, max: 2 } }, ac: 18, position: 'front', is_alive: true, status_effects: [], equipped_weapon_id: 'mace' },
  { id: '4', name: 'ロンド', class_id: 'rogue', level: 1, xp: 0, stats: { str: 10, dex: 16, con: 12, int: 14, wis: 10, cha: 12 }, hp: { current: 9, max: 9 }, hit_dice_remaining: 1, spell_slots: {}, ac: 14, position: 'back', is_alive: true, status_effects: [], equipped_weapon_id: 'shortsword' },
  { id: '5', name: 'シオン', class_id: 'wizard', level: 1, xp: 0, stats: { str: 8, dex: 14, con: 12, int: 16, wis: 12, cha: 10 }, hp: { current: 7, max: 7 }, hit_dice_remaining: 1, spell_slots: { 1: { current: 2, max: 2 } }, ac: 12, position: 'back', is_alive: true, status_effects: [], equipped_weapon_id: 'dagger' },
];

export const useGameStore = create<GameState>((set, get) => ({
  scene: 'dungeon',
  gold: 100,
  party: initialParty,
  logs: [
    { id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, text: '地下迷宮 1階に入った。', type: 'system' }
  ],
  currentMap: map1Data,
  playerPosition: map1Data.start_position,
  combatants: [],
  currentTurnIndex: 0,
  skipPlayerTurnsUntilIndex: null,
  battleReward: null,
  showResultModal: false,
  inventory: [
    { itemId: 'potion_of_healing', quantity: 3 },
    { itemId: 'longsword', quantity: 1 }
  ],
  activeEvent: null,
  eventResult: null,
  selectedActorId: '',

  setScene: (scene) => set({ scene }),

  addLog: (text, type = 'info') =>
    set((state) => ({
      logs: [
        ...state.logs,
        { id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, text, type }
      ]
    })),

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

    const enemyCount = Math.floor(Math.random() * 2) + 1; // 1〜2体
    const baseMonster = monsterList[selectedMonsterId];
    if (!baseMonster) return;

    // 参加ユニット（Combatant）の生成とイニシアチブ（d20 + DEX修正値）の算出
    const newCombatants: Combatant[] = [];

    // 生存しているプレイヤーキャラクターを追加
    party.filter(p => p.is_alive).forEach(p => {
      const dexMod = getAbilityModifier(p.stats.dex);
      const initRoll = rollD20(dexMod);
      newCombatants.push({
        id: p.id,
        name: p.name,
        is_player: true,
        initiative: initRoll.total,
        ac: p.ac,
        hp: { ...p.hp },
        position: p.position,
        ref: p
      });
    });

    // モンスターを追加
    for (let i = 0; i < enemyCount; i++) {
      const monsterInstance: MonsterData = {
        ...baseMonster,
        id: `${baseMonster.id}_${Date.now()}_${i}`,
        name: `${baseMonster.name} ${String.fromCharCode(65 + i)}`,
        hp: { ...baseMonster.hp }
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
        ref: monsterInstance
      });
    }

    // イニシアチブが高い順にソート
    newCombatants.sort((a, b) => b.initiative - a.initiative);

    set({
      scene: 'battle',
      combatants: newCombatants,
      currentTurnIndex: 0
    });

    addLog(`モンスターが現れた！ (${newCombatants.filter(c => !c.is_player).map(c => c.name).join(', ')})`, 'critical');

    // 最初のターンが敵の場合は自動で敵の行動を実行
    if (!newCombatants[0].is_player) {
      setTimeout(() => get().processEnemyTurn(), 1000);
    }
  },

  // 2. プレイヤーの攻撃実行
  executePlayerAttack: (targetId: string) => {
    const { combatants, currentTurnIndex, addLog, nextTurn } = get();
    const attacker = combatants[currentTurnIndex];
    const target = combatants.find(c => c.id === targetId);

    if (!attacker || !target || !attacker.is_player) return;

    const playerChar = attacker.ref as Character;
    const strMod = getAbilityModifier(playerChar.stats.str);
    const attackBonus = strMod + 2;

    const attackRoll = rollD20(attackBonus);
    addLog(`${attacker.name} の攻撃！ (出目: ${attackRoll.natural} + ${attackBonus} = ${attackRoll.total})`, 'player_action');

    let isHit = false;
    if (attackRoll.isCritical) {
      addLog('クリティカルヒット！', 'critical');
      isHit = true;
    } else if (attackRoll.isFumble) {
      addLog('ファンブル！ 攻撃は大きく外れた。', 'system');
      isHit = false;
    } else if (attackRoll.total >= target.ac) {
      isHit = true;
    } else {
      addLog(`ミス！ ${target.name} の AC ${target.ac} に届かなかった。`, 'system');
    }

    if (isHit) {
      const weaponDice = '1d8+2';
      const damage = rollDiceString(weaponDice, attackRoll.isCritical);
      target.hp.current = Math.max(0, target.hp.current - damage);

      addLog(`${target.name} に ${damage} のダメージ！`, 'critical');

      if (target.hp.current === 0) {
        addLog(`${target.name} を倒した！`, 'info');
      }
    }

    if (!get().checkBattleStatus()) {
      nextTurn();
    }
  },

  executePlayerDefend: () => {
    const { combatants, currentTurnIndex, addLog, nextTurn } = get();
    const attacker = combatants[currentTurnIndex];

    if (!attacker || !attacker.is_player) return;

    addLog(`${attacker.name} は身構えた（防御）。`, 'player_action');

    // ターンを進行
    nextTurn();
  },

  attemptRun: () => {
    const { combatants, currentTurnIndex, addLog } = get();
    const attacker = combatants[currentTurnIndex];

    if (!attacker || !attacker.is_player) return;

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

  executePlayerSpell: (spellId: string, targetId: string) => {
    const { combatants, currentTurnIndex, party, addLog, nextTurn, checkBattleStatus } = get();
    const attacker = combatants[currentTurnIndex];
    if (!attacker || !attacker.is_player) return;

    const playerChar = attacker.ref as Character;
    const spell = spellList[spellId];

    if (!spell) {
      addLog('指定された呪文が存在しません。', 'system');
      return;
    }

    // 呪文スロットの確認と消費
    const spellLevel = spell.level;
    const currentSlots = playerChar.spell_slots?.[spellLevel]?.current ?? 0;

    if (currentSlots <= 0) {
      addLog(`レベル ${spellLevel} の呪文スロットが不足しています！`, 'system');
      return;
    }

    // 呪文スロットを1消費
    const updatedSpellSlots = {
      ...playerChar.spell_slots,
      [spellLevel]: {
        ...playerChar.spell_slots[spellLevel],
        current: currentSlots - 1
      }
    };

    playerChar.spell_slots = updatedSpellSlots;

    // 回復呪文の場合
    if (spell.heal_dice) {
      const target = combatants.find((c) => c.id === targetId && c.is_player);
      if (!target) return;

      const healAmount = rollDiceString(spell.heal_dice);
      target.hp.current = Math.min(target.hp.max, target.hp.current + healAmount);

      // パーティデータへの同期
      const partyMember = party.find((p) => p.id === target.id);
      if (partyMember) {
        partyMember.hp.current = target.hp.current;
      }

      addLog(`${attacker.name} は ${spell.name} を唱えた！ ${target.name} のHPが ${healAmount} 回復！`, 'heal');
    }
    // 攻撃呪文の場合（マジック・ミサイル等：必中）
    else if (spell.damage_dice) {
      const target = combatants.find((c) => c.id === targetId && !c.is_player);
      if (!target) return;

      const damage = rollDiceString(spell.damage_dice);
      target.hp.current = Math.max(0, target.hp.current - damage);

      addLog(`${attacker.name} は ${spell.name} を唱えた！ ${target.name} に ${damage} の${spell.damage_type || ''}ダメージ！`, 'critical');

      if (target.hp.current === 0) {
        addLog(`${target.name} を倒した！`, 'info');
      }
    }

    set({ combatants: [...combatants], party: [...party] });

    if (!checkBattleStatus()) {
      nextTurn();
    }
  },

  // 3. 敵の行動ロジック
  processEnemyTurn: () => {
    const { combatants, currentTurnIndex, addLog, nextTurn } = get();
    const attacker = combatants[currentTurnIndex];

    if (!attacker || attacker.is_player || attacker.hp.current <= 0) {
      nextTurn();
      return;
    }

    const alivePlayers = combatants.filter(c => c.is_player && c.hp.current > 0);
    if (alivePlayers.length === 0) return;

    const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
    const enemyData = attacker.ref as MonsterData;
    const action = enemyData.actions[0] || { name: '攻撃', to_hit: 2, damage_dice: '1d6' };

    addLog(`${attacker.name} の ${action.name}！`, 'enemy_action');

    const attackRoll = rollD20(action.to_hit);

    let isHit = false;
    if (attackRoll.isCritical) {
      addLog('痛恨の一撃！ (クリティカル)', 'critical');
      isHit = true;
    } else if (attackRoll.isFumble) {
      addLog('攻撃は空を切った。', 'system');
      isHit = false;
    } else if (attackRoll.total >= target.ac) {
      isHit = true;
    } else {
      addLog(`${target.name} は攻撃をかわした。`, 'system');
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

      addLog(`${target.name} は ${damage} のダメージを受けた！`, 'critical');

      if (target.hp.current === 0) {
        addLog(`${target.name} は倒れた！`, 'critical');
      }
    }

    set({ combatants: [...combatants], party: [...get().party] });

    if (!get().checkBattleStatus()) {
      nextTurn();
    }
  },

  // ターン進行
  nextTurn: () => {
    const { combatants, currentTurnIndex, skipPlayerTurnsUntilIndex, addLog } = get();

    const count = combatants.length;
    let nextIndex = (currentTurnIndex + 1) % count;

    while (combatants[nextIndex].hp.current <= 0) {
      nextIndex = (nextIndex + 1) % count;
    }

    if (skipPlayerTurnsUntilIndex !== null) {
      while (
        combatants[nextIndex].is_player &&
        nextIndex !== skipPlayerTurnsUntilIndex
      ) {
        addLog(`${combatants[nextIndex].name} は体勢を崩して行動できない。`, 'system');
        nextIndex = (nextIndex + 1) % count;
        while (combatants[nextIndex].hp.current <= 0) {
          nextIndex = (nextIndex + 1) % count;
        }
      }

      if (nextIndex === skipPlayerTurnsUntilIndex) {
        set({ skipPlayerTurnsUntilIndex: null });
      }
    }

    set({ currentTurnIndex: nextIndex });

    const nextCombatant = combatants[nextIndex];
    if (!nextCombatant.is_player) {
      setTimeout(() => get().processEnemyTurn(), 1000);
    }
  },

  // 勝敗チェック
  checkBattleStatus: () => {
    const { combatants, addLog } = get();

    const aliveEnemies = combatants.filter(c => !c.is_player && c.hp.current > 0);
    const alivePlayers = combatants.filter(c => c.is_player && c.hp.current > 0);

    if (aliveEnemies.length === 0) {
      const totalEnemies = combatants.filter((c) => !c.is_player);
      const totalXp = totalEnemies.length * 50;
      const totalGold = totalEnemies.length * 15;

      addLog('戦闘に勝利した！', 'info');
      set({
        battleReward: {
          xp: totalXp,
          gold: totalGold,
          items: ['ポーション']
        },
        showResultModal: true
      });
      return true;
    }

    if (alivePlayers.length === 0) {
      addLog('パーティは全滅した...', 'critical');
      return true;
    }

    return false;
  },

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

  claimBattleReward: () => {
    const { party, battleReward, checkLevelUp, setScene } = get();
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

    set({
      party: updatedParty,
      battleReward: null,
      showResultModal: false,
      gold: (get().gold || 0) + battleReward.gold
    });

    setScene('dungeon');
  },

  // イベントの発生
  triggerEvent: (eventId: string) => {
    const event = dungeonEvents[eventId];
    const { party } = get();
    if (!event) return;

    set({
      activeEvent: event,
      eventResult: null,
      selectedActorId: party[0]?.id || ''
    });
  },

  setSelectedActor: (characterId: string) => {
    set({ selectedActorId: characterId });
  },

  // イベント選択肢の実行と技能判定
  resolveEventOption: (option: EventOption) => {
    const { party, selectedActorId, inventory, addLog } = get();
    const actor = party.find((m) => m.id === selectedActorId) || party[0];

    if (!actor) return;

    if (option.check) {
      const d20Result = rollD20(0);
      const d20 = d20Result.total;
      const mod = getAbilityModifier(actor.stats[option.check.ability]);
      const total = d20 + mod;
      const passed = total >= option.check.dc;

      let resultMsg = passed ? option.successText : option.failureText;

      if (passed && option.reward) {
        let rewardLogText = '';

        // 1. ゴールドの加算処理
        if (option.reward.gold) {
          const currentGold = get().gold || 0;
          set({ gold: currentGold + option.reward.gold });
          rewardLogText += `💰 ${option.reward.gold} G `;
        }

        // 2. アイテムのインベントリ追加処理
        if (option.reward.items && option.reward.items.length > 0) {
          const currentInventory = [...get().inventory];

          option.reward.items.forEach((itemId) => {
            const existingIndex = currentInventory.findIndex((i) => i.itemId === itemId);

            if (existingIndex >= 0) {
              currentInventory[existingIndex] = {
                ...currentInventory[existingIndex],
                quantity: currentInventory[existingIndex].quantity + 1
              };
            } else {
              currentInventory.push({
                itemId: itemId,
                quantity: 1
              });
            }
          });

          set({ inventory: currentInventory });
          rewardLogText += `📦 アイテム獲得! `;
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

      addLog(`[イベント] ${actor.name} の ${option.check.label} 判定: ${total} (出目 ${d20} + 修正値 ${mod}) -> ${passed ? '成功' : '失敗'}`, passed ? 'heal' : 'critical');

      set({
        eventResult: {
          passed,
          roll: d20,
          modifier: mod,
          total,
          dc: option.check.dc,
          message: resultMsg
        },
        party: [...party],
        inventory: [...inventory]
      });
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

  closeEventModal: () => {
    set({ activeEvent: null, eventResult: null });
  },

  // ★ 消費アイテム（ポーション等）の使用
  useItem: (itemId: string, targetCharacterId: string) => {
    const { inventory, party, addLog } = get();
    const item = itemList[itemId];
    const target = party.find((m) => m.id === targetCharacterId);

    if (!item || !target || !target.is_alive) return;

    const invItem = inventory.find((i) => i.itemId === itemId);
    if (!invItem || invItem.quantity <= 0) return;

    if (item.type === 'consumable' && item.heal_dice) {
      const healAmount = rollDiceString(item.heal_dice);
      const newHp = Math.min(target.hp.max, target.hp.current + healAmount);

      const updatedParty = party.map((m) =>
        m.id === targetCharacterId ? { ...m, hp: { ...m.hp, current: newHp } } : m
      );

      const updatedInventory = inventory
        .map((i) => (i.itemId === itemId ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0);

      addLog(`${target.name} は ${item.name} を使用し、HPが ${healAmount} 回復した！`, 'heal');

      set({ party: updatedParty, inventory: updatedInventory });
    }
  },

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
      if (item.type === 'armor' && item.ac_bonus) {
        addLog(`${m.name} は ${item.name} を装備し、ACが ${item.ac_bonus} になった。`, 'info');
        return { ...m, equipped_armor_id: itemId, ac: item.ac_bonus };
      }
      return m;
    });

    set({ party: updatedParty });
  },

  unequipItem: (characterId: string, slot: 'weapon' | 'armor') => {
    const { party, addLog } = get();

    const updatedParty = party.map((m) => {
      if (m.id !== characterId) return m;

      if (slot === 'weapon') {
        addLog(`${m.name} は武器を外した。`, 'info');
        return { ...m, equipped_weapon_id: null };
      }

      const dexMod = Math.floor((m.stats.dex - 10) / 2);
      const baseAc = 10 + dexMod;
      addLog(`${m.name} は防具を外し、ACが ${baseAc} になった。`, 'info');
      return { ...m, equipped_armor_id: null, ac: baseAc };
    });

    set({ party: updatedParty });
  },

  // 🏨 宿屋（大休憩）：全員のHPを最大まで回復
  restAtInn: (cost: number) => {
    const { gold, party, addLog } = get();
    if (gold < cost) {
      addLog('ゴールドが不足しているため、宿屋に泊まれません。', 'info');
      return false;
    }

    const restoredParty = party.map((m) => ({
      ...m,
      hp: { ...m.hp, current: m.hp.max },
      is_alive: true
    }));

    set({
      gold: gold - cost,
      party: restoredParty
    });

    addLog(`宿屋で大休憩をとり、パーティー全員のHPが全回復した！ (-${cost} G)`, 'heal');
    return true;
  },

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

  enterCamp: () => {
    const { addLog } = get();
    set({ scene: 'camp', combatants: [], currentTurnIndex: 0 });
    addLog('キャンプ地に移動した。', 'info');
  },

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
      } else if (nextTile.event.type === 'door') {
        triggerEvent('heavy_door');
        return;
      } else if (nextTile.event.type === 'stairs_up') {
        addLog('地上へ続く階段がある。', 'info');
        return;
      }
    }

    if (Math.random() < currentMap.encounter_table.rate) {
      startBattle();
    }
  },

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

  // ★ 大休憩 (Long Rest): 全HP回復・ヒットダイス全回復・呪文スロット全回復
  longRest: () => {
    const { party, addLog } = get();

    const updatedParty = party.map((member) => {
      if (!member.is_alive) return member;

      const restoredSlots: Record<number, { current: number; max: number }> = {};
      if (member.spell_slots) {
        Object.keys(member.spell_slots).forEach((levelStr) => {
          const level = Number(levelStr);
          restoredSlots[level] = {
            current: member.spell_slots[level].max,
            max: member.spell_slots[level].max
          };
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

  selectedCharacterId: null,
  setSelectedCharacterId: (id) => set({ selectedCharacterId: id }),
}));
