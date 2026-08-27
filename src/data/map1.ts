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

  const setWall = (x: number, y: number, side: 'N' | 'E' | 'S' | 'W') => {
    const tile = grid[y]?.[x];
    if (!tile) return;
    tile.walls[side] = 'wall';
    const nx = x + (side === 'E' ? 1 : side === 'W' ? -1 : 0);
    const ny = y + (side === 'S' ? 1 : side === 'N' ? -1 : 0);
    const opposite = side === 'N' ? 'S' : side === 'S' ? 'N' : side === 'E' ? 'W' : 'E';
    const neighbor = grid[ny]?.[nx];
    if (neighbor) {
      neighbor.walls[opposite] = 'wall';
    }
  };

  const horizontalWall = (y: number, x1: number, x2: number, skip: number[] = []) => {
    for (let x = x1; x <= x2; x += 1) {
      if (!skip.includes(x)) setWall(x, y, 'N');
    }
  };

  const verticalWall = (x: number, y1: number, y2: number, skip: number[] = []) => {
    for (let y = y1; y <= y2; y += 1) {
      if (!skip.includes(y)) setWall(x, y, 'W');
    }
  };

  horizontalWall(10, 1, 13, [7]);
  horizontalWall(6, 1, 13, [5, 7, 11]);
  horizontalWall(2, 2, 12, [3, 9]);
  verticalWall(5, 2, 12, [4, 8]);
  verticalWall(9, 3, 13, [6, 10]);
  verticalWall(12, 1, 9, [2]);

  grid[1][12].event = { type: 'stairs_down', target_map: 'dungeon_b2' };
  grid[3][3].event = { type: 'chest', chest_id: 'chest_b1_1' };
  grid[10][4].event = { type: 'door' };
  grid[14][7].event = { type: 'stairs_up' };
  return grid;
};

const buildB2Grid = (): DungeonMap['grid'] => {
  const grid = createEmptyGrid(15, 15);

  const setWall = (x: number, y: number, side: 'N' | 'E' | 'S' | 'W') => {
    const tile = grid[y]?.[x];
    if (!tile) return;
    tile.walls[side] = 'wall';
    const nx = x + (side === 'E' ? 1 : side === 'W' ? -1 : 0);
    const ny = y + (side === 'S' ? 1 : side === 'N' ? -1 : 0);
    const opposite = side === 'N' ? 'S' : side === 'S' ? 'N' : side === 'E' ? 'W' : 'E';
    const neighbor = grid[ny]?.[nx];
    if (neighbor) {
      neighbor.walls[opposite] = 'wall';
    }
  };

  const horizontalWall = (y: number, x1: number, x2: number, skip: number[] = []) => {
    for (let x = x1; x <= x2; x += 1) {
      if (!skip.includes(x)) setWall(x, y, 'N');
    }
  };

  const verticalWall = (x: number, y1: number, y2: number, skip: number[] = []) => {
    for (let y = y1; y <= y2; y += 1) {
      if (!skip.includes(y)) setWall(x, y, 'W');
    }
  };

  horizontalWall(4, 3, 11, [7]);
  horizontalWall(8, 2, 10, [5, 9]);
  horizontalWall(11, 2, 8, [4]);
  verticalWall(5, 1, 10, [3, 8]);
  verticalWall(9, 4, 13, [7, 11]);
  verticalWall(3, 6, 13, [9]);

  grid[1][12].event = { type: 'stairs_up', target_map: 'dungeon_b1' };
  grid[13][2].event = { type: 'stairs_down', target_map: 'dungeon_b3' };
  grid[7][7].event = { type: 'chest', chest_id: 'chest_b2_1' };
  grid[5][10].event = { type: 'trap' };
  return grid;
};

const buildB3Grid = (): DungeonMap['grid'] => {
  const grid = createEmptyGrid(15, 15);

  const setWall = (x: number, y: number, side: 'N' | 'E' | 'S' | 'W') => {
    const tile = grid[y]?.[x];
    if (!tile) return;
    tile.walls[side] = 'wall';
    const nx = x + (side === 'E' ? 1 : side === 'W' ? -1 : 0);
    const ny = y + (side === 'S' ? 1 : side === 'N' ? -1 : 0);
    const opposite = side === 'N' ? 'S' : side === 'S' ? 'N' : side === 'E' ? 'W' : 'E';
    const neighbor = grid[ny]?.[nx];
    if (neighbor) {
      neighbor.walls[opposite] = 'wall';
    }
  };

  const horizontalWall = (y: number, x1: number, x2: number, skip: number[] = []) => {
    for (let x = x1; x <= x2; x += 1) {
      if (!skip.includes(x)) setWall(x, y, 'N');
    }
  };

  const verticalWall = (x: number, y1: number, y2: number, skip: number[] = []) => {
    for (let y = y1; y <= y2; y += 1) {
      if (!skip.includes(y)) setWall(x, y, 'W');
    }
  };

  horizontalWall(3, 1, 7, [4]);
  horizontalWall(7, 7, 13, [10]);
  horizontalWall(9, 2, 6, [4]);
  verticalWall(2, 3, 11, [6, 9]);
  verticalWall(7, 1, 12, [3, 7, 10]);
  verticalWall(11, 4, 12, [6]);

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
    rate: 0.15,
    monsters: [
      { id: 'zombie', weight: 10 },
      { id: 'kobold', weight: 50 },
      { id: 'skeleton', weight: 40 }
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
      { id: 'hobgoblin', weight: 30 },
      { id: 'goblin', weight: 40 },
      { id: 'zombie', weight: 30 }
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
      { id: 'zombie', weight: 20 },
      { id: 'bugbear', weight: 30 },
      { id: 'ogre', weight: 30 }
    ]
  },
  grid: buildB3Grid()
};