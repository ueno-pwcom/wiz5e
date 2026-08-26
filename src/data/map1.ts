import type { DungeonMap } from '../types/game';

const createEmptyGrid = (width: number, height: number): DungeonMap['grid'] => {
  const grid: DungeonMap['grid'] = [];

  for (let y = 0; y < height; y += 1) {
    const row = [];
    for (let x = 0; x < width; x += 1) {
      row.push({
        x,
        y,
        walls: {
          N: y === 0 ? 'wall' : 'none',
          E: x === width - 1 ? 'wall' : 'none',
          S: y === height - 1 ? 'wall' : 'none',
          W: x === 0 ? 'wall' : 'none'
        },
        event: null
      });
    }
    grid.push(row);
  }

  return grid;
};

const buildB1Grid = (): DungeonMap['grid'] => {
  const grid = createEmptyGrid(15, 15);
  grid[1][12].event = { type: 'stairs_down', target_map: 'dungeon_b2' };
  grid[3][3].event = { type: 'chest', chest_id: 'chest_b1_1' };
  grid[10][4].event = { type: 'door' };
  grid[14][7].event = { type: 'stairs_up' };
  return grid;
};

const buildB2Grid = (): DungeonMap['grid'] => {
  const grid = createEmptyGrid(15, 15);
  grid[1][12].event = { type: 'stairs_up', target_map: 'dungeon_b1' };
  grid[13][2].event = { type: 'stairs_down', target_map: 'dungeon_b3' };
  grid[7][7].event = { type: 'chest', chest_id: 'chest_b2_1' };
  grid[5][10].event = { type: 'trap' };
  return grid;
};

const buildB3Grid = (): DungeonMap['grid'] => {
  const grid = createEmptyGrid(15, 15);
  grid[13][2].event = { type: 'stairs_up', target_map: 'dungeon_b2' };
  grid[2][12].event = { type: 'boss' };
  grid[8][8].event = { type: 'chest', chest_id: 'chest_b3_1' };
  return grid;
};

export const map1Data: DungeonMap = {
  map_id: 'dungeon_b1',
  name: '地下迷宮 B1F',
  width: 15,
  height: 15,
  start_position: {
    x: 7,
    y: 14,
    facing: 'N'
  },
  encounter_table: {
    rate: 0.0,
    monsters: [
      { id: 'goblin', weight: 70 },
      { id: 'skeleton', weight: 30 }
    ]
  },
  grid: buildB1Grid()
};

export const map2Data: DungeonMap = {
  map_id: 'dungeon_b2',
  name: '地下迷宮 B2F',
  width: 15,
  height: 15,
  start_position: {
    x: 12,
    y: 1,
    facing: 'S'
  },
  encounter_table: {
    rate: 0.18,
    monsters: [
      { id: 'skeleton', weight: 60 },
      { id: 'zombie', weight: 40 }
    ]
  },
  grid: buildB2Grid()
};

export const map3Data: DungeonMap = {
  map_id: 'dungeon_b3',
  name: '地下迷宮 B3F',
  width: 15,
  height: 15,
  start_position: {
    x: 2,
    y: 13,
    facing: 'N'
  },
  encounter_table: {
    rate: 0.20,
    monsters: [
      { id: 'skeleton', weight: 40 },
      { id: 'wraith', weight: 60 }
    ]
  },
  grid: buildB3Grid()
};