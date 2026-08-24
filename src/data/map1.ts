import type { DungeonMap } from '../types/game';

// 5x5のサンプルマップ
// 各タイルの壁指定: N(北), E(東), S(南), W(西)
export const map1Data: DungeonMap = {
  map_id: 'dungeon_b1',
  name: '地下迷宮 1階',
  width: 5,
  height: 5,
  start_position: {
    x: 2,
    y: 4,
    facing: 'N'
  },
  encounter_table: {
    rate: 0.0, // 移動時15%の確率でエンカウント
    monsters: [
      { id: 'goblin', weight: 70 },
      { id: 'skeleton', weight: 30 }
    ]
  },
  grid: [
    // Y=0
    [
      { x: 0, y: 0, walls: { N: 'wall', E: 'none', S: 'none', W: 'wall' }, event: null },
      { x: 1, y: 0, walls: { N: 'wall', E: 'wall', S: 'none', W: 'none' }, event: null },
      { x: 2, y: 0, walls: { N: 'wall', E: 'none', S: 'wall', W: 'wall' }, event: { type: 'chest', chest_id: 'chest_1' } },
      { x: 3, y: 0, walls: { N: 'wall', E: 'none', S: 'none', W: 'none' }, event: null },
      { x: 4, y: 0, walls: { N: 'wall', E: 'wall', S: 'none', W: 'none' }, event: null }
    ],
    // Y=1
    [
      { x: 0, y: 1, walls: { N: 'none', E: 'wall', S: 'none', W: 'wall' }, event: null },
      { x: 1, y: 1, walls: { N: 'none', E: 'wall', S: 'door', W: 'wall' }, event: null },
      { x: 2, y: 1, walls: { N: 'wall', E: 'wall', S: 'none', W: 'wall' }, event: null },
      { x: 3, y: 1, walls: { N: 'none', E: 'none', S: 'none', W: 'wall' }, event: null },
      { x: 4, y: 1, walls: { N: 'none', E: 'wall', S: 'wall', W: 'none' }, event: null }
    ],
    // Y=2
    [
      { x: 0, y: 2, walls: { N: 'none', E: 'none', S: 'none', W: 'wall' }, event: null },
      { x: 1, y: 2, walls: { N: 'door', E: 'wall', S: 'none', W: 'none' }, event: null },
      { x: 2, y: 2, walls: { N: 'none', E: 'none', S: 'none', W: 'wall' }, event: null },
      { x: 3, y: 2, walls: { N: 'none', E: 'wall', S: 'none', W: 'none' }, event: null },
      { x: 4, y: 2, walls: { N: 'wall', E: 'wall', S: 'none', W: 'wall' }, event: null }
    ],
    // Y=3
    [
      { x: 0, y: 3, walls: { N: 'none', E: 'wall', S: 'wall', W: 'wall' }, event: null },
      { x: 1, y: 3, walls: { N: 'none', E: 'none', S: 'wall', W: 'wall' }, event: null },
      { x: 2, y: 3, walls: { N: 'none', E: 'none', S: 'none', W: 'none' }, event: null },
      { x: 3, y: 3, walls: { N: 'none', E: 'wall', S: 'wall', W: 'none' }, event: null },
      { x: 4, y: 3, walls: { N: 'none', E: 'wall', S: 'none', W: 'wall' }, event: null }
    ],
    // Y=4 (スタート位置 X:2, Y:4)
    [
      { x: 0, y: 4, walls: { N: 'wall', E: 'wall', S: 'wall', W: 'wall' }, event: null },
      { x: 1, y: 4, walls: { N: 'wall', E: 'wall', S: 'wall', W: 'wall' }, event: null },
      { x: 2, y: 4, walls: { N: 'none', E: 'wall', S: 'door', W: 'wall' }, event: { type: 'stairs_up' } },
      { x: 3, y: 4, walls: { N: 'wall', E: 'wall', S: 'wall', W: 'wall' }, event: null },
      { x: 4, y: 4, walls: { N: 'none', E: 'wall', S: 'wall', W: 'wall' }, event: null }
    ]
  ]
};