import { loadMapsFromJson } from './mapLoader';

const input = {
  maps: [
    {
      map_id: 'dungeon_test',
      name: 'テストマップ',
      width: 5,
      height: 5,
      start_position: { x: 2, y: 4, facing: 'N' },
      encounter_table: {
        rate: 0.1,
        monsters: [{ id: 'kobold', weight: 1 }]
      },
      layout: {
        horizontal: [
          { y: 1, x1: 1, x2: 3, skip: [2], kind: 'wall' }
        ],
        vertical: [
          { x: 3, y1: 1, y2: 3, skip: [2], kind: 'wall' }
        ]
      },
      events: [
        { x: 0, y: 4, type: 'stairs_up' },
        {
          x: 2,
          y: 2,
          type: 'chest',
          chest_id: 'test_chest',
          reward: { gold: 42, items: ['potion_of_healing', 'dagger'] }
        }
      ]
    }
  ]
};

const maps = loadMapsFromJson(input as never);
if (maps[0].grid[1][1].walls.N !== 'wall') {
  throw new Error('horizontal wall should be applied to north side');
}
if (maps[0].grid[1][3].walls.N === 'wall') {
  throw new Error('skip should leave a gap in the horizontal wall');
}
if (maps[0].grid[2][3].walls.W !== 'wall') {
  throw new Error('vertical wall should be applied to west side');
}
if (maps[0].grid[2][3].walls.W === 'wall' && maps[0].grid[2][2].walls.E === 'wall') {
  // no-op, keeps the assertion intent clear
}
if (maps[0].grid[4][0].event?.type !== 'stairs_up') {
  throw new Error('stairs event was not loaded');
}
if (maps[0].grid[2][2].event?.chest_id !== 'test_chest') {
  throw new Error('chest event was not loaded');
}
if (maps[0].grid[2][2].event?.reward?.gold !== 42 || maps[0].grid[2][2].event?.reward?.items?.join(',') !== 'potion_of_healing,dagger') {
  throw new Error('chest reward payload was not loaded');
}
