import React, { useMemo, useState } from 'react';
import type { MapJsonDefinition, MapJsonEvent } from '../utils/mapLoader';
import dungeonB1 from '../data/maps/dungeon_b1.json';
import dungeonB2 from '../data/maps/dungeon_b2.json';
import dungeonB3 from '../data/maps/dungeon_b3.json';
import './MapEditorModal.css';

const MAP_CATALOG: MapJsonDefinition[] = [
  dungeonB1 as MapJsonDefinition,
  dungeonB2 as MapJsonDefinition,
  dungeonB3 as MapJsonDefinition,
];

type WallSide = 'N' | 'E' | 'S' | 'W';
type WallKind = 'none' | 'wall' | 'door' | 'locked_door' | 'secret_door';

const wallSideOrder: WallSide[] = ['N', 'E', 'S', 'W'];
const wallKindOptions: WallKind[] = ['none', 'wall', 'door', 'locked_door', 'secret_door'];
const wallKindLabels: Record<WallKind, string> = {
  none: 'なし',
  wall: '通常壁',
  door: '扉',
  locked_door: '鍵扉',
  secret_door: '秘密扉',
};

const eventOptions = ['none', 'stairs_up', 'stairs_down', 'chest', 'trap', 'door', 'encounter', 'message'] as const;

const eventLabels: Record<string, string> = {
  none: 'なし',
  stairs_up: '階段(上)',
  stairs_down: '階段(下)',
  chest: '宝箱',
  trap: '罠',
  door: '扉',
  encounter: '固定遭遇',
  message: 'メッセージ',
  boss: 'ボス',
};

const createTileWalls = (map: MapJsonDefinition, x: number, y: number) => {
  const walls: Record<WallSide, string> = {
    N: y === 0 ? 'wall' : 'none',
    E: x === map.width - 1 ? 'wall' : 'none',
    S: y === map.height - 1 ? 'wall' : 'none',
    W: x === 0 ? 'wall' : 'none',
  };

  for (const segment of map.layout?.horizontal ?? []) {
    const kind = segment.kind ?? 'wall';
    if (segment.y === y && x >= segment.x1 && x <= segment.x2 && !(segment.skip ?? []).includes(x)) {
      walls.N = kind;
    }
    if (segment.y === y + 1 && x >= segment.x1 && x <= segment.x2 && !(segment.skip ?? []).includes(x)) {
      walls.S = kind;
    }
  }

  for (const segment of map.layout?.vertical ?? []) {
    const kind = segment.kind ?? 'wall';
    if (segment.x === x && y >= segment.y1 && y <= segment.y2 && !(segment.skip ?? []).includes(y)) {
      walls.W = kind;
    }
    if (segment.x === x + 1 && y >= segment.y1 && y <= segment.y2 && !(segment.skip ?? []).includes(y)) {
      walls.E = kind;
    }
  }

  return walls;
};

const createWallGrid = (map: MapJsonDefinition) => {
  const grid: Record<WallSide, string>[][] = Array.from({ length: map.height }, () =>
    Array.from({ length: map.width }, () => ({ N: 'none', E: 'none', S: 'none', W: 'none' }))
  );

  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      const tileWalls = createTileWalls(map, x, y);
      grid[y][x] = tileWalls;
    }
  }

  return grid;
};

const rebuildLayoutFromWallGrid = (map: MapJsonDefinition, wallGrid: Record<WallSide, string>[][]) => {
  const horizontal: NonNullable<MapJsonDefinition['layout']>['horizontal'] = [];
  const vertical: NonNullable<MapJsonDefinition['layout']>['vertical'] = [];

  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      const tile = wallGrid[y]?.[x];
      if (!tile) continue;

      if (tile.N !== 'none') {
        horizontal.push({ y, x1: x, x2: x, kind: tile.N as 'wall' | 'door' | 'locked_door' | 'secret_door' });
      }
      if (tile.W !== 'none') {
        vertical.push({ x, y1: y, y2: y, kind: tile.W as 'wall' | 'door' | 'locked_door' | 'secret_door' });
      }
      if (tile.E !== 'none') {
        vertical.push({ x: x + 1, y1: y, y2: y, kind: tile.E as 'wall' | 'door' | 'locked_door' | 'secret_door' });
      }
      if (tile.S !== 'none') {
        horizontal.push({ y: y + 1, x1: x, x2: x, kind: tile.S as 'wall' | 'door' | 'locked_door' | 'secret_door' });
      }
    }
  }

  return { horizontal, vertical };
};

const normalizeMapEvent = (event: MapJsonEvent | null | undefined) => {
  if (!event) return 'none';
  return event.type === 'boss' ? 'encounter' : event.type;
};

const buildTileEvent = (map: MapJsonDefinition, x: number, y: number): MapJsonEvent | null => {
  return map.events?.find((event) => event.x === x && event.y === y) ?? null;
};

export const MapEditorModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [maps, setMaps] = useState<MapJsonDefinition[]>(MAP_CATALOG);
  const [selectedMapId, setSelectedMapId] = useState<string>(MAP_CATALOG[0]?.map_id ?? '');
  const [selectedCell, setSelectedCell] = useState({ x: 0, y: 0 });

  const selectedMap = useMemo(
    () => maps.find((map) => map.map_id === selectedMapId) ?? maps[0],
    [maps, selectedMapId]
  );

  const updateSelectedMap = (updater: (map: MapJsonDefinition) => MapJsonDefinition) => {
    setMaps((currentMaps) =>
      currentMaps.map((map) => (map.map_id === selectedMapId ? updater(map) : map))
    );
  };

  const setSelectedMapById = (mapId: string) => {
    setSelectedMapId(mapId);
    const targetMap = maps.find((map) => map.map_id === mapId);
    if (targetMap) {
      setSelectedCell({ x: targetMap.start_position.x, y: targetMap.start_position.y });
    }
  };

  const updateTileWall = (side: WallSide, kind: WallKind) => {
    if (!selectedMap) return;

    const wallGrid = createWallGrid(selectedMap);
    const tile = wallGrid[selectedCell.y]?.[selectedCell.x];
    if (!tile) return;

    const opposite: WallSide = side === 'N' ? 'S' : side === 'S' ? 'N' : side === 'E' ? 'W' : 'E';
    const neighborX = selectedCell.x + (side === 'E' ? 1 : side === 'W' ? -1 : 0);
    const neighborY = selectedCell.y + (side === 'S' ? 1 : side === 'N' ? -1 : 0);

    tile[side] = kind;
    if (neighborY >= 0 && neighborY < selectedMap.height && neighborX >= 0 && neighborX < selectedMap.width) {
      wallGrid[neighborY][neighborX][opposite] = kind;
    }

    const nextMap: MapJsonDefinition = {
      ...selectedMap,
      layout: rebuildLayoutFromWallGrid(selectedMap, wallGrid),
    };

    updateSelectedMap(() => nextMap);
  };

  const updateEventForCell = (
    eventType: MapJsonEvent['type'] | 'none',
    extra?: { message?: string; encounterId?: string }
  ) => {
    if (!selectedMap) return;

    const nextEvents = [...(selectedMap.events ?? [])].filter(
      (event) => !(event.x === selectedCell.x && event.y === selectedCell.y)
    );

    if (eventType !== 'none') {
      const nextEvent: MapJsonEvent = {
        x: selectedCell.x,
        y: selectedCell.y,
        type: eventType,
      };

      if (eventType === 'message' && extra?.message) {
        nextEvent.message = extra.message;
      }
      if (eventType === 'encounter' && extra?.encounterId) {
        nextEvent.encounter_id = extra.encounterId;
      }

      nextEvents.push(nextEvent);
    }

    updateSelectedMap((map) => ({
      ...map,
      events: nextEvents,
      start_position: {
        ...map.start_position,
        x: selectedCell.x,
        y: selectedCell.y,
      },
    }));
  };

  const updateStartPosition = (nextX: number, nextY: number, nextFacing: MapJsonDefinition['start_position']['facing']) => {
    updateSelectedMap((map) => ({
      ...map,
      start_position: {
        x: nextX,
        y: nextY,
        facing: nextFacing,
      },
    }));
  };

  const exportCurrentMap = () => {
    if (!selectedMap) return;

    const jsonText = JSON.stringify(selectedMap, null, 2);
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${selectedMap.map_id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const currentEvent = buildTileEvent(selectedMap, selectedCell.x, selectedCell.y);
  const selectedTileWalls = createTileWalls(selectedMap, selectedCell.x, selectedCell.y);
  const currentMessageText = currentEvent?.type === 'message' ? currentEvent.message ?? '' : '';
  const currentEncounterId = currentEvent?.type === 'encounter' ? currentEvent.encounter_id ?? '' : '';

  return (
    <div className="map-editor-overlay" onClick={onClose}>
      <div className="map-editor-modal" onClick={(event) => event.stopPropagation()}>
        <div className="map-editor-header">
          <div>
            <h2>🗺️ マップエディタ</h2>
            <p>開発用: JSON を編集して出力します</p>
          </div>
          <button className="close-button" onClick={onClose}>閉じる</button>
        </div>

        <div className="map-editor-controls">
          <label>
            フロア
            <select value={selectedMapId} onChange={(event) => setSelectedMapById(event.target.value)}>
              {maps.map((map) => (
                <option key={map.map_id} value={map.map_id}>
                  {map.name}
                </option>
              ))}
            </select>
          </label>

          <button className="primary-button" onClick={exportCurrentMap}>JSONを出力</button>
        </div>

        <div className="map-editor-layout">
          <div className="map-grid-panel">
            <div className="map-grid" style={{ gridTemplateColumns: `repeat(${selectedMap.width}, 18px)` }}>
              {Array.from({ length: selectedMap.height * selectedMap.width }, (_, index) => {
                const x = index % selectedMap.width;
                const y = Math.floor(index / selectedMap.width);
                const isSelected = selectedCell.x === x && selectedCell.y === y;
                const tileEvent = buildTileEvent(selectedMap, x, y);
                const tileWalls = createTileWalls(selectedMap, x, y);
                const wallCount = wallSideOrder.filter((side) => tileWalls[side] !== 'none').length;

                return (
                  <button
                    key={`${x}-${y}`}
                    className={`map-tile ${isSelected ? 'selected' : ''} ${tileEvent ? 'has-event' : ''}`}
                    title={`${x}, ${y} / 壁: ${wallCount}`}
                    onClick={() => setSelectedCell({ x, y })}
                    type="button"
                  >
                    <span className="wall-preview" aria-hidden="true">
                      {wallSideOrder.map((side) => {
                        const wallKind = tileWalls[side] ?? 'none';
                        return (
                          <span
                            key={`${x}-${y}-${side}`}
                            className={`wall-line wall-${side.toLowerCase()} wall-kind-${wallKind} ${wallKind !== 'none' ? 'visible' : ''}`}
                          />
                        );
                      })}
                    </span>
                    <span>{tileEvent ? '●' : ''}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="map-editor-sidepanel">
            <div className="panel-block">
              <h3>選択中のタイル</h3>
              <div className="position-row">
                <span>x</span>
                <input
                  type="number"
                  min={0}
                  max={selectedMap.width - 1}
                  value={selectedCell.x}
                  onChange={(event) => setSelectedCell((current) => ({ ...current, x: Math.min(Math.max(Number(event.target.value), 0), selectedMap.width - 1) }))}
                />
                <span>y</span>
                <input
                  type="number"
                  min={0}
                  max={selectedMap.height - 1}
                  value={selectedCell.y}
                  onChange={(event) => setSelectedCell((current) => ({ ...current, y: Math.min(Math.max(Number(event.target.value), 0), selectedMap.height - 1) }))}
                />
              </div>
            </div>

            <div className="panel-block">
              <h3>開始位置</h3>
              <div className="field-row">
                <label>x<input type="number" value={selectedMap.start_position.x} onChange={(event) => updateStartPosition(Number(event.target.value), selectedMap.start_position.y, selectedMap.start_position.facing)} /></label>
                <label>y<input type="number" value={selectedMap.start_position.y} onChange={(event) => updateStartPosition(selectedMap.start_position.x, Number(event.target.value), selectedMap.start_position.facing)} /></label>
              </div>
              <label>
                facing
                <select value={selectedMap.start_position.facing} onChange={(event) => updateStartPosition(selectedMap.start_position.x, selectedMap.start_position.y, event.target.value as MapJsonDefinition['start_position']['facing'])}>
                  <option value="N">N</option>
                  <option value="E">E</option>
                  <option value="S">S</option>
                  <option value="W">W</option>
                </select>
              </label>
            </div>

            <div className="panel-block">
              <h3>壁種別</h3>
              <div className="wall-direction-editor">
                <div className="wall-side-slot north">
                  <span>N</span>
                  <select
                    value={selectedTileWalls.N ?? 'none'}
                    onChange={(event) => updateTileWall('N', event.target.value as WallKind)}
                  >
                    {wallKindOptions.map((kind) => (
                      <option key={kind} value={kind}>{wallKindLabels[kind]}</option>
                    ))}
                  </select>
                </div>
                <div className="wall-side-slot west">
                  <span>W</span>
                  <select
                    value={selectedTileWalls.W ?? 'none'}
                    onChange={(event) => updateTileWall('W', event.target.value as WallKind)}
                  >
                    {wallKindOptions.map((kind) => (
                      <option key={kind} value={kind}>{wallKindLabels[kind]}</option>
                    ))}
                  </select>
                </div>
                <div className="wall-center-marker">◎</div>
                <div className="wall-side-slot east">
                  <span>E</span>
                  <select
                    value={selectedTileWalls.E ?? 'none'}
                    onChange={(event) => updateTileWall('E', event.target.value as WallKind)}
                  >
                    {wallKindOptions.map((kind) => (
                      <option key={kind} value={kind}>{wallKindLabels[kind]}</option>
                    ))}
                  </select>
                </div>
                <div className="wall-side-slot south">
                  <span>S</span>
                  <select
                    value={selectedTileWalls.S ?? 'none'}
                    onChange={(event) => updateTileWall('S', event.target.value as WallKind)}
                  >
                    {wallKindOptions.map((kind) => (
                      <option key={kind} value={kind}>{wallKindLabels[kind]}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="panel-block">
              <h3>イベント配置</h3>
              <select
                value={normalizeMapEvent(currentEvent)}
                onChange={(event) => updateEventForCell(event.target.value as MapJsonEvent['type'] | 'none', {
                  message: currentMessageText,
                  encounterId: currentEncounterId,
                })}
              >
                {eventOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'none' ? 'なし' : eventLabels[option] ?? option}
                  </option>
                ))}
              </select>

              {currentEvent?.type === 'message' && (
                <textarea
                  value={currentMessageText}
                  onChange={(event) => updateEventForCell('message', { message: event.target.value, encounterId: currentEncounterId })}
                  placeholder="表示したいメッセージを入力"
                  rows={3}
                  style={{ marginTop: '8px', width: '100%' }}
                />
              )}

              {currentEvent?.type === 'encounter' && (
                <div style={{ marginTop: '8px' }}>
                  <label>
                    encounter_id
                    <input
                      type="text"
                      value={currentEncounterId}
                      onChange={(event) => updateEventForCell('encounter', { message: currentMessageText, encounterId: event.target.value })}
                      placeholder="kobold"
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="panel-block json-panel">
              <h3>JSON</h3>
              <textarea
                value={JSON.stringify(selectedMap, null, 2)}
                onChange={(event) => {
                  try {
                    const parsed = JSON.parse(event.target.value) as MapJsonDefinition;
                    updateSelectedMap(() => parsed);
                  } catch {
                    // JSON の途中編集中は無視する
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
