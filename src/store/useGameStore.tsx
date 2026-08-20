import { create } from 'zustand';
import type { Character, Direction, DungeonMap, LogMessage, MonsterData, WallType } from '../types/game';
import { map1Data } from '../data/map1';

type GameScene = 'town' | 'dungeon' | 'battle';

interface GameState {
  scene: GameScene;
  gold: number;
  party: Character[];
  logs: LogMessage[];
  currentMap: DungeonMap;
  playerPosition: { x: number; y: number; facing: Direction };
  activeEnemies: MonsterData[];

  setScene: (scene: GameScene) => void;
  addLog: (text: string, type?: LogMessage['type']) => void;
  movePlayer: (action: 'forward' | 'backward' | 'turnLeft' | 'turnRight') => void;
  damageCharacter: (characterId: string, amount: number) => void;
  healCharacter: (characterId: string, amount: number) => void;
  restParty: () => void;
}


// テスト用初期パーティデータ
const initialParty: Character[] = [
  { id: '1', name: 'バルド', class_id: 'fighter', level: 1, xp: 0, stats: { str: 15, dex: 12, con: 14, int: 10, wis: 12, cha: 8 }, hp: { current: 12, max: 12 }, hit_dice_remaining: 1, spell_slots: {}, ac: 16, position: 'front', is_alive: true, status_effects: [], equipped_weapon_id: 'longsword' },
  { id: '2', name: 'ロンド', class_id: 'rogue', level: 1, xp: 0, stats: { str: 10, dex: 16, con: 12, int: 14, wis: 10, cha: 12 }, hp: { current: 9, max: 9 }, hit_dice_remaining: 1, spell_slots: {}, ac: 14, position: 'front', is_alive: true, status_effects: [], equipped_weapon_id: 'shortsword' },
  { id: '3', name: 'アリア', class_id: 'cleric', level: 1, xp: 0, stats: { str: 14, dex: 8, con: 14, int: 10, wis: 16, cha: 12 }, hp: { current: 10, max: 10 }, hit_dice_remaining: 1, spell_slots: { 1: { current: 2, max: 2 } }, ac: 18, position: 'front', is_alive: true, status_effects: [], equipped_weapon_id: 'mace' },
  { id: '4', name: 'シオン', class_id: 'wizard', level: 1, xp: 0, stats: { str: 8, dex: 14, con: 12, int: 16, wis: 12, cha: 10 }, hp: { current: 7, max: 7 }, hit_dice_remaining: 1, spell_slots: { 1: { current: 2, max: 2 } }, ac: 12, position: 'back', is_alive: true, status_effects: [], equipped_weapon_id: 'dagger' },
  { id: '5', name: 'エリア', class_id: 'wizard', level: 1, xp: 0, stats: { str: 8, dex: 14, con: 12, int: 16, wis: 12, cha: 10 }, hp: { current: 7, max: 7 }, hit_dice_remaining: 1, spell_slots: { 1: { current: 2, max: 2 } }, ac: 12, position: 'back', is_alive: true, status_effects: [], equipped_weapon_id: 'dagger' }
];

export const useGameStore = create<GameState>((set, get) => ({
  scene: 'dungeon',
  gold: 150,
  party: initialParty,
  logs: [
    { id: '1', text: '地下迷宮 1階に入った。', type: 'system' }
  ],
  currentMap: map1Data,
  playerPosition: map1Data.start_position,
  activeEnemies: [],

  setScene: (scene) => set({ scene }),

  // useGameStore.ts の addLog 部分を修正
  addLog: (text, type = 'info') =>
    set((state) => ({
      logs: [
        ...state.logs,
        { id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, text, type }
      ]
    })),

  // 壁判定を含む移動処理
  movePlayer: (action) => {
    const { playerPosition, currentMap, addLog } = get();
    const directions: Direction[] = ['N', 'E', 'S', 'W'];
    let { x, y, facing } = playerPosition;

    // 方向転換
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

    // 移動方向の決定（前進 / 後退）
    const checkDirection: Direction = action === 'forward'
      ? facing
      : directions[(directions.indexOf(facing) + 2) % 4];

    // 現在地のタイル情報を取得
    const currentTile = currentMap.grid[y]?.[x];
    if (!currentTile) return;

    // 前方/後方の壁判定
    const wallStatus: WallType = currentTile.walls[checkDirection];

    if (wallStatus === 'wall' || wallStatus === 'locked_door') {
      addLog('壁にぶつかった！', 'system');
      return;
    }

    // 次の移動先座標の計算
    let nextX = x;
    let nextY = y;
    if (checkDirection === 'N') nextY -= 1;
    if (checkDirection === 'S') nextY += 1;
    if (checkDirection === 'E') nextX += 1;
    if (checkDirection === 'W') nextX -= 1;

    // マップ範囲外チェック
    if (nextX < 0 || nextX >= currentMap.width || nextY < 0 || nextY >= currentMap.height) {
      addLog('これ以上先へは進めない。', 'system');
      return;
    }

    // 移動成功
    if (wallStatus === 'door') {
      addLog('扉を開けて進んだ。', 'info');
    } else {
      addLog(`${action === 'forward' ? '前進' : '後退'}した。`, 'info');
    }

    set({ playerPosition: { x: nextX, y: nextY, facing } });

    // イベントチェック
    const nextTile = currentMap.grid[nextY][nextX];
    if (nextTile.event) {
      if (nextTile.event.type === 'chest') {
        addLog('宝箱を発見した！', 'critical');
      } else if (nextTile.event.type === 'stairs_up') {
        addLog('地上へ続く階段がある。', 'info');
      }
    }
  },

  damageCharacter: (characterId, amount) =>
    set((state) => ({
      party: state.party.map((character) => {
        if (character.id !== characterId || !character.is_alive) return character;

        const currentHp = Math.max(0, character.hp.current - Math.max(0, amount));
        return {
          ...character,
          hp: { ...character.hp, current: currentHp },
          is_alive: currentHp > 0
        };
      })
    })),

  healCharacter: (characterId, amount) =>
    set((state) => ({
      party: state.party.map((character) => {
        if (character.id !== characterId || !character.is_alive) return character;

        return {
          ...character,
          hp: {
            ...character.hp,
            current: Math.min(
              character.hp.max,
              character.hp.current + Math.max(0, amount)
            )
          }
        };
      })
    })),

  restParty: () =>
    set((state) => ({
      party: state.party.map((character) => ({
        ...character,
        hp: { ...character.hp, current: character.hp.max },
        is_alive: true
      }))
    }))
}));