import type { DungeonMap, MapTile, TileEvent, WallType } from '../types/game';

export type HorizontalWallTemplate = {
  y: number;
  x1: number;
  x2: number;
  kind?: WallType;
  skip?: number[];
};

export type VerticalWallTemplate = {
  x: number;
  y1: number;
  y2: number;
  kind?: WallType;
  skip?: number[];
};

export type MapJsonWall =
  | ({ type: 'horizontal' } & HorizontalWallTemplate)
  | ({ type: 'vertical' } & VerticalWallTemplate);

export type MapJsonLayout = {
  horizontal?: HorizontalWallTemplate[];
  vertical?: VerticalWallTemplate[];
};

export type MapJsonEvent = {
  x: number;
  y: number;
  type: TileEvent['type'];
  target_map?: string;
  chest_id?: string;
  encounter_id?: string;
};

export interface MapJsonDefinition {
  map_id: string;
  name: string;
  width: number;
  height: number;
  start_position: {
    x: number;
    y: number;
    facing: string;
  };
  encounter_table: {
    rate: number;
    monsters: { id: string; weight: number }[];
  };
  layout?: MapJsonLayout;
  walls?: MapJsonWall[];
  events?: MapJsonEvent[];
}

export interface MapJsonFile {
  maps: MapJsonDefinition[];
}

const normalizeFacing = (value: string): DungeonMap['start_position']['facing'] => {
  if (value === 'N' || value === 'E' || value === 'S' || value === 'W') {
    return value;
  }
  throw new Error(`invalid facing value: ${String(value)}`);
};

const isValidWallType = (value: unknown): value is WallType =>
  value === 'none' || value === 'wall' || value === 'door' || value === 'locked_door' || value === 'secret_door';

const createEmptyGrid = (width: number, height: number): DungeonMap['grid'] => {
  const grid: DungeonMap['grid'] = [];

  for (let y = 0; y < height; y += 1) {
    const row: MapTile[] = [];
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

const applyWallToTile = (grid: DungeonMap['grid'], x: number, y: number, side: 'N' | 'E' | 'S' | 'W', kind: WallType) => {
  const tile = grid[y]?.[x];
  if (!tile) {
    throw new Error(`wall coordinate out of bounds: (${x}, ${y})`);
  }

  tile.walls[side] = kind;

  const dx = side === 'E' ? 1 : side === 'W' ? -1 : 0;
  const dy = side === 'S' ? 1 : side === 'N' ? -1 : 0;
  const opposite = side === 'N' ? 'S' : side === 'S' ? 'N' : side === 'E' ? 'W' : 'E';
  const neighbor = grid[y + dy]?.[x + dx];
  if (neighbor) {
    neighbor.walls[opposite] = kind;
  }
};

const normalizeWallSegments = (definition: MapJsonDefinition): MapJsonWall[] => {
  const layoutWalls: MapJsonWall[] = [
    ...((definition.layout?.horizontal ?? []).map((wall) => ({
      type: 'horizontal' as const,
      y: wall.y,
      x1: wall.x1,
      x2: wall.x2,
      kind: wall.kind ?? 'wall',
      skip: wall.skip ?? []
    }))),
    ...((definition.layout?.vertical ?? []).map((wall) => ({
      type: 'vertical' as const,
      x: wall.x,
      y1: wall.y1,
      y2: wall.y2,
      kind: wall.kind ?? 'wall',
      skip: wall.skip ?? []
    })))
  ];

  return [...layoutWalls, ...(definition.walls ?? [])];
};

const applyWallSegment = (grid: DungeonMap['grid'], wall: MapJsonWall) => {
  const kind = wall.kind ?? 'wall';
  if (!isValidWallType(kind)) {
    throw new Error(`invalid wall kind: ${String(kind)}`);
  }

  if (wall.type === 'horizontal') {
    for (let x = wall.x1; x <= wall.x2; x += 1) {
      if (wall.skip?.includes(x)) continue;
      applyWallToTile(grid, x, wall.y, 'N', kind);
    }
    return;
  }

  for (let y = wall.y1; y <= wall.y2; y += 1) {
    if (wall.skip?.includes(y)) continue;
    applyWallToTile(grid, wall.x, y, 'W', kind);
  }
};

const applyEvent = (grid: DungeonMap['grid'], event: MapJsonEvent) => {
  if (event.x < 0 || event.y < 0) {
    throw new Error(`event coordinate out of bounds: (${event.x}, ${event.y})`);
  }

  const tile = grid[event.y]?.[event.x];
  if (!tile) {
    throw new Error(`event coordinate out of bounds: (${event.x}, ${event.y})`);
  }

  const payload: TileEvent = {
    type: event.type,
  };

  if (event.target_map) payload.target_map = event.target_map;
  if (event.chest_id) payload.chest_id = event.chest_id;
  if (event.encounter_id) payload.encounter_id = event.encounter_id;

  tile.event = payload;
};

const validateDefinition = (definition: MapJsonDefinition) => {
  if (definition.width <= 0 || definition.height <= 0) {
    throw new Error(`map ${definition.map_id} has invalid size`);
  }

  const facing = definition.start_position.facing;
  if (!['N', 'E', 'S', 'W'].includes(facing)) {
    throw new Error(`map ${definition.map_id} has invalid facing: ${String(facing)}`);
  }

  const { x, y } = definition.start_position;
  if (x < 0 || x >= definition.width || y < 0 || y >= definition.height) {
    throw new Error(`map ${definition.map_id} start_position is out of bounds`);
  }
};

export const loadMapFromJson = (definition: MapJsonDefinition): DungeonMap => {
  validateDefinition(definition);

  const grid = createEmptyGrid(definition.width, definition.height);
  for (const wall of normalizeWallSegments(definition)) {
    applyWallSegment(grid, wall);
  }
  for (const event of definition.events ?? []) {
    applyEvent(grid, event);
  }

  return {
    map_id: definition.map_id,
    name: definition.name,
    width: definition.width,
    height: definition.height,
    start_position: {
      x: definition.start_position.x,
      y: definition.start_position.y,
      facing: normalizeFacing(definition.start_position.facing)
    },
    grid,
    encounter_table: definition.encounter_table
  };
};

export const loadMapsFromJson = (json: MapJsonFile): DungeonMap[] => {
  return json.maps.map((definition) => loadMapFromJson(definition as MapJsonDefinition));
};
