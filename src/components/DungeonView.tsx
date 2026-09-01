import React, { useEffect, useRef } from 'react';
import './DungeonView.css';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';
import type { Direction, DungeonMap } from '../types/game';

export const DungeonView: React.FC = () => {
  const playerPosition = useGameStore((state) => state.playerPosition);
  const currentMap = useGameStore((state) => state.currentMap);
  const activeEvent = useGameStore((state) => state.activeEvent);
  const movePlayer = useGameStore((state) => state.movePlayer);
  const useStairs = useGameStore((state) => state.useStairs);
  const enterCamp = useGameStore((state) => state.enterCamp);
  const returnToTown = useGameStore((state) => state.returnToTown);
  const triggerEvent = useGameStore((state) => state.triggerEvent);
  const addLog = useGameStore((state) => state.addLog);

  const currentTile = currentMap.grid[playerPosition.y]?.[playerPosition.x];
  const sceneContainerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const wallGroupRef = useRef<THREE.Group | null>(null);
  const chestGroupRef = useRef<THREE.Group | null>(null);
  const stairsGroupRef = useRef<THREE.Group | null>(null);

  const tileSize = 1;
  const wallHeight = tileSize;
  const cameraHeight = wallHeight * 0.65;
  const wallThickness = 0.01;

  const directionVectors: Record<Direction, { dx: number; dz: number }> = {
    N: { dx: 0, dz: -1 },
    E: { dx: 1, dz: 0 },
    S: { dx: 0, dz: 1 },
    W: { dx: -1, dz: 0 }
  };

  const buildWalls = (map: DungeonMap) => {
    const group = new THREE.Group();
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 });
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x7d8691, roughness: 0.95, metalness: 0.1 });
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0xc2782c, roughness: 0.85, metalness: 0.2 });
    const lockedDoorMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4c20, roughness: 0.85, metalness: 0.2 });
    const secretWallMaterial = new THREE.MeshStandardMaterial({ color: 0x1b2230, roughness: 0.95, metalness: 0.05 });

    const getWallMaterial = (wall: string) => {
      switch (wall) {
        case 'door': return doorMaterial;
        case 'locked_door': return lockedDoorMaterial;
        case 'secret_door': return secretWallMaterial;
        default: return wallMaterial;
      }
    };

    const addWall = (x: number, z: number, rotationY: number, wallType: string) => {
      const geometry = new THREE.BoxGeometry(tileSize, wallHeight, wallThickness);
      const wall = new THREE.Mesh(geometry, wallMaterial);
      wall.position.set(x, wallHeight / 2, z);
      wall.rotation.y = rotationY;
      group.add(wall);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial);
      edges.position.copy(wall.position);
      edges.rotation.copy(wall.rotation);
      group.add(edges);

      if (wallType !== 'wall') {
        const doorWidth = tileSize * 0.6;
        const doorHeight = wallHeight * 0.85;
        const doorDepth = wallThickness + 0.02;
        const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth);
        const door = new THREE.Mesh(doorGeometry, getWallMaterial(wallType));
        door.position.set(x, doorHeight / 2, z);
        door.rotation.y = rotationY;
        group.add(door);
        const doorEdges = new THREE.LineSegments(new THREE.EdgesGeometry(doorGeometry), edgeMaterial);
        doorEdges.position.copy(door.position);
        doorEdges.rotation.copy(door.rotation);
        group.add(doorEdges);
      }
    };

    const getTile = (x: number, y: number) => map.grid[y]?.[x] ?? null;

    const cornerPositions = new Set<string>();

    map.grid.forEach((row) => {
      row.forEach((tile) => {
        const centerX = tile.x + tileSize / 2;
        const centerZ = tile.y + tileSize / 2;

        const placeWall = (side: 'N' | 'E' | 'S' | 'W') => {
          const wallType = tile.walls[side];
          if (wallType === 'none') return;
          const neighbor = getTile(
            tile.x + (side === 'E' ? 1 : side === 'W' ? -1 : 0),
            tile.y + (side === 'S' ? 1 : side === 'N' ? -1 : 0)
          );

          const shouldPlace = (() => {
            if (!neighbor) return true;
            switch (side) {
              case 'N': return tile.y > neighbor.y;
              case 'S': return tile.y < neighbor.y;
              case 'E': return tile.x < neighbor.x;
              case 'W': return tile.x > neighbor.x;
            }
          })();

          if (!shouldPlace) return;

          if (side === 'N') {
            addWall(centerX, tile.y, 0, wallType);
            cornerPositions.add(`${tile.x},${tile.y}`);
            cornerPositions.add(`${tile.x + 1},${tile.y}`);
          }
          if (side === 'S') {
            addWall(centerX, tile.y + tileSize, Math.PI, wallType);
            cornerPositions.add(`${tile.x},${tile.y + 1}`);
            cornerPositions.add(`${tile.x + 1},${tile.y + 1}`);
          }
          if (side === 'E') {
            addWall(tile.x + tileSize, centerZ, Math.PI / 2, wallType);
            cornerPositions.add(`${tile.x + 1},${tile.y}`);
            cornerPositions.add(`${tile.x + 1},${tile.y + 1}`);
          }
          if (side === 'W') {
            addWall(tile.x, centerZ, -Math.PI / 2, wallType);
            cornerPositions.add(`${tile.x},${tile.y}`);
            cornerPositions.add(`${tile.x},${tile.y + 1}`);
          }
        };

        placeWall('N');
        placeWall('S');
        placeWall('E');
        placeWall('W');
      });
    });

    const cornerMaterial = new THREE.LineBasicMaterial({ color: 0x99c3ff, transparent: true, opacity: 0.9 });
    cornerPositions.forEach((pos) => {
      const [x, z] = pos.split(',').map(Number);
      const cornerGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array([x, 0, z, x, wallHeight, z]);
      cornerGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const line = new THREE.Line(cornerGeometry, cornerMaterial);
      group.add(line);
    });

    return group;
  };

  const buildChests = (map: DungeonMap) => {
    const group = new THREE.Group();
    const chestBaseMaterial = new THREE.MeshStandardMaterial({ color: 0x8d5a2b, roughness: 0.6, metalness: 0.2 });
    const chestLidMaterial = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.5, metalness: 0.7 });
    const chestLockMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.75, metalness: 0.8 });

    map.grid.forEach((row) => {
      row.forEach((tile) => {
        if (tile.event?.type !== 'chest') return;

        const chest = new THREE.Group();
        const base = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.25, 0.35),
          chestBaseMaterial
        );
        base.position.y = 0.125;
        chest.add(base);

        const lid = new THREE.Mesh(
          new THREE.BoxGeometry(0.52, 0.12, 0.37),
          chestLidMaterial
        );
        lid.position.y = 0.25 + 0.06;
        lid.rotation.x = -Math.PI / 18;
        chest.add(lid);

        const lock = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.08, 0.02),
          chestLockMaterial
        );
        lock.position.set(0, 0.16, 0.19);
        chest.add(lock);

        chest.position.set(tile.x + 0.5, 0, tile.y + 0.5);
        group.add(chest);
      });
    });

    return group;
  };

  const buildStairs = (map: DungeonMap) => {
    const group = new THREE.Group();
    const staircaseMaterial = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0x906010, emissiveIntensity: 0.6 });

    map.grid.forEach((row) => {
      row.forEach((tile) => {
        if (tile.event?.type !== 'stairs_up' && tile.event?.type !== 'stairs_down') return;

        const stair = new THREE.Group();
        const base = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.1, 0.7),
          new THREE.MeshStandardMaterial({ color: 0x2b3560, roughness: 0.95, metalness: 0.1 })
        );
        base.position.y = 0.05;
        stair.add(base);

        const stepCount = 3;
        for (let i = 0; i < stepCount; i += 1) {
          const step = new THREE.Mesh(
            new THREE.BoxGeometry(0.64, 0.08, 0.18),
            staircaseMaterial
          );
          step.position.set(0, 0.1 + i * 0.08, -0.2 + i * 0.18);
          stair.add(step);
        }

        stair.position.set(tile.x + 0.5, 0, tile.y + 0.5);
        group.add(stair);
      });
    });

    return group;
  };

  const updateCamera = () => {
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    if (!camera || !renderer || !scene) return;

    const cameraX = playerPosition.x + tileSize / 2;
    const cameraZ = playerPosition.y + tileSize / 2;
    const forward = directionVectors[playerPosition.facing];
    const backwardOffset = 0.25;
    const lookDistance = 0.9;

    camera.position.set(
      cameraX - forward.dx * backwardOffset,
      cameraHeight,
      cameraZ - forward.dz * backwardOffset
    );

    camera.lookAt(
      cameraX + forward.dx * lookDistance,
      cameraHeight,
      cameraZ + forward.dz * lookDistance
    );
    renderer.render(scene, camera);
  };

  useEffect(() => {
    const container = sceneContainerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x08121f);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.boxSizing = 'border-box';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.75);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(currentMap.width, currentMap.height),
      new THREE.MeshStandardMaterial({ color: 0x202840, roughness: 0.95, metalness: 0.1, side: THREE.DoubleSide })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(currentMap.width / 2, 0, currentMap.height / 2);
    scene.add(floor);

    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(currentMap.width, currentMap.height),
      new THREE.MeshStandardMaterial({ color: 0x181f38, roughness: 0.95, metalness: 0.1, side: THREE.DoubleSide })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(currentMap.width / 2, wallHeight, currentMap.height / 2);
    scene.add(ceiling);

    const walls = buildWalls(currentMap);
    wallGroupRef.current = walls;
    scene.add(walls);

    const chests = buildChests(currentMap);
    chestGroupRef.current = chests;
    scene.add(chests);

    const stairsGroup = buildStairs(currentMap);
    stairsGroupRef.current = stairsGroup;
    scene.add(stairsGroup);

    updateCamera();

    const handleResize = () => {
      const widthResize = container.clientWidth;
      const heightResize = container.clientHeight;
      camera.aspect = widthResize / heightResize;
      camera.updateProjectionMatrix();
      renderer.setSize(widthResize, heightResize);
      updateCamera();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          const material = child.material;
          if (Array.isArray(material)) {
            material.forEach((m) => m.dispose());
          } else {
            material.dispose();
          }
        }
      });
    };
  }, [currentMap]);

  useEffect(() => {
    if (!sceneRef.current) return;
    if (wallGroupRef.current) {
      sceneRef.current.remove(wallGroupRef.current);
    }
    if (chestGroupRef.current) {
      sceneRef.current.remove(chestGroupRef.current);
    }
    if (stairsGroupRef.current) {
      sceneRef.current.remove(stairsGroupRef.current);
    }
    const walls = buildWalls(currentMap);
    wallGroupRef.current = walls;
    sceneRef.current.add(walls);

    const chests = buildChests(currentMap);
    chestGroupRef.current = chests;
    sceneRef.current.add(chests);

    const stairs = buildStairs(currentMap);
    stairsGroupRef.current = stairs;
    sceneRef.current.add(stairs);

    updateCamera();
  }, [currentMap, playerPosition]);

  useEffect(() => {
    if (!sceneRef.current) return;
    if (wallGroupRef.current) {
      sceneRef.current.remove(wallGroupRef.current);
    }
    if (chestGroupRef.current) {
      sceneRef.current.remove(chestGroupRef.current);
    }
    if (stairsGroupRef.current) {
      sceneRef.current.remove(stairsGroupRef.current);
    }
    const walls = buildWalls(currentMap);
    wallGroupRef.current = walls;
    sceneRef.current.add(walls);

    const chests = buildChests(currentMap);
    chestGroupRef.current = chests;
    sceneRef.current.add(chests);

    const stairs = buildStairs(currentMap);
    stairsGroupRef.current = stairs;
    sceneRef.current.add(stairs);

    updateCamera();
  }, [currentMap, playerPosition]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeEvent) return;
      if (e.key === 'ArrowUp' || e.key === 'w') movePlayer('forward');
      if (e.key === 'ArrowDown' || e.key === 's') movePlayer('backward');
      if (e.key === 'ArrowLeft' || e.key === 'a') movePlayer('turnLeft');
      if (e.key === 'ArrowRight' || e.key === 'd') movePlayer('turnRight');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer, activeEvent]);

  const getFacingMarkerStyle = (facing: Direction): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      width: 0,
      height: 0,
      borderLeft: '5px solid transparent',
      borderRight: '5px solid transparent',
      borderBottom: '10px solid #60a5fa',
      transform: 'rotate(0deg)',
    };

    switch (facing) {
      case 'N':
        return baseStyle;
      case 'E':
        return { ...baseStyle, transform: 'rotate(90deg)' };
      case 'S':
        return { ...baseStyle, transform: 'rotate(180deg)' };
      case 'W':
        return { ...baseStyle, transform: 'rotate(270deg)' };
      default:
        return baseStyle;
    }
  };

  const getFloorLabel = (map: DungeonMap) => {
    const match = map.map_id.match(/b\d+/i);
    if (match) return match[0].toUpperCase();
    const nameMatch = map.name.match(/B\d+/i);
    return nameMatch ? nameMatch[0].toUpperCase() : 'B1';
  };

  const getStairsMarker = (_type: 'stairs_up' | 'stairs_down'): React.ReactNode => {
    return (
      <div style={{ fontSize: '14px', lineHeight: 1 }}>
        🪜
      </div>
    );
  };

  const getWallBorder = (wall: string) => {
    if (wall === 'door') return '2px solid #f59e0b';
    if (wall === 'locked_door') return '2px solid #f97316';
    if (wall === 'wall') return '2px solid #9ca3af';
    return '1px solid #374151';
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 240px', gap: '8px', height: '100%' }}>
      <div style={{
        backgroundColor: '#000',
        border: '1px solid #374151',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        color: '#4b5563',
        position: 'relative',
        minHeight: '0',
        minWidth: 0
      }}>
        <div
          ref={sceneContainerRef}
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            minWidth: 0,
            border: '2px solid #fff',
            boxShadow: 'inset 0 0 20px #555',
            position: 'relative',
            overflow: 'hidden'
          }}
        />

        {(currentTile?.event?.type === 'stairs_up' && !currentTile.event.target_map) && (
          <div style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: '12px',
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            border: '1px solid #f59e0b',
            borderRadius: '6px',
            padding: '8px 12px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{ color: '#fbbf24', fontSize: '12px', fontWeight: 'bold' }}>
              🧗 地上へ続く階段がある
            </div>
            <button
              onClick={returnToTown}
              style={{
                backgroundColor: '#d97706',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🏰 街へ帰還する
            </button>
          </div>
        )}
        {(currentTile?.event?.type === 'stairs_up' && currentTile.event.target_map) && (
          <div style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: '12px',
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            border: '1px solid #f59e0b',
            borderRadius: '6px',
            padding: '8px 12px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{ color: '#fbbf24', fontSize: '12px', fontWeight: 'bold' }}>
              🪜 上の階へ続く階段がある
            </div>
            <button
              onClick={useStairs}
              style={{
                backgroundColor: '#fbbf24',
                color: '#111827',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              上の階へ移動する
            </button>
          </div>
        )}
        {currentTile?.event?.type === 'stairs_down' && (
          <div style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: '12px',
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            border: '1px solid #38bdf8',
            borderRadius: '6px',
            padding: '8px 12px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{ color: '#38bdf8', fontSize: '12px', fontWeight: 'bold' }}>
              🪜 下の階へ続く階段がある
            </div>
            <button
              onClick={useStairs}
              style={{
                backgroundColor: '#38bdf8',
                color: '#111827',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              下の階へ移動する
            </button>
          </div>
        )}
      </div>

      <div style={{ backgroundColor: '#111827', border: '1px solid #374151', padding: '12px', color: '#fff' }}>
        <div style={{ fontSize: '12px', marginBottom: '8px', color: '#9ca3af' }}>
          [{getFloorLabel(currentMap)}] [{playerPosition.facing}] 座標: X:{String(playerPosition.x).padStart(2, '0')} Y:{String(playerPosition.y).padStart(2, '0')}
        </div>

        {/* 動的グリッドミニマップ */}
        <div style={{
          width: '80%',
          aspectRatio: '1 / 1',
          maxWidth: '220px',
          backgroundColor: '#000',
          border: '1px solid #374151',
          margin: '0 auto 12px',
          padding: '4px',
          display: 'grid',
          gridTemplateColumns: `repeat(5, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(5, minmax(0, 1fr))`,
          gap: '2px'
        }}>
          {Array.from({ length: 5 }, (_, rowIndex) => {
            const y = playerPosition.y - 2 + rowIndex;
            return Array.from({ length: 5 }, (_, colIndex) => {
              const x = playerPosition.x - 2 + colIndex;
              const tile = currentMap.grid[y]?.[x] ?? null;
              const isPlayerHere = rowIndex === 2 && colIndex === 2;
              const cellBackground = isPlayerHere ? '#1e3a8a' : tile ? '#1f2937' : '#000';
              return (
                <div key={`${colIndex}-${rowIndex}`} style={{
                  backgroundColor: cellBackground,
                  borderTop: tile ? getWallBorder(tile.walls.N) : '1px solid #374151',
                  borderRight: tile ? getWallBorder(tile.walls.E) : '1px solid #374151',
                  borderBottom: tile ? getWallBorder(tile.walls.S) : '1px solid #374151',
                  borderLeft: tile ? getWallBorder(tile.walls.W) : '1px solid #374151',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative',
                  aspectRatio: '1 / 1'
                }}>
                  {isPlayerHere ? (
                    <div style={getFacingMarkerStyle(playerPosition.facing)} />
                  ) : tile ? (
                    tile.event?.type === 'stairs_up'
                      ? getStairsMarker('stairs_up')
                      : tile.event?.type === 'stairs_down'
                        ? getStairsMarker('stairs_down')
                        : tile.event
                          ? '?'
                          : null
                  ) : null}
                </div>
              );
            });
          }).flat()}
        </div>

        {/* コントロールボタン */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', marginBottom: '8px' }}>
          <div></div>
          <button style={btnStyle} onClick={() => !activeEvent && movePlayer('forward')} disabled={!!activeEvent}>▲</button>
          <div></div>
          <button style={btnStyle} onClick={() => !activeEvent && movePlayer('turnLeft')} disabled={!!activeEvent}>◄</button>
          <button style={btnStyle} onClick={() => !activeEvent && movePlayer('backward')} disabled={!!activeEvent}>▼</button>
          <button style={btnStyle} onClick={() => !activeEvent && movePlayer('turnRight')} disabled={!!activeEvent}>►</button>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            style={{ ...btnStyle, flex: 1 }}
            onClick={() => {
              if (!currentTile?.event) {
                addLog('特に何も見つからなかった。', 'system');
                return;
              }

              switch (currentTile.event.type) {
                case 'chest':
                  triggerEvent('locked_chest');
                  break;
                case 'door':
                  triggerEvent('heavy_door');
                  break;
                case 'trap':
                  triggerEvent('poison_dart_trap');
                  break;
                default:
                  addLog('この場所には何もなかった。', 'system');
              }
            }}
          >
            調べる
          </button>
          <button
            style={{ ...btnStyle, flex: 1 }}
            onClick={() => {
              enterCamp();
            }}
          >
            キャンプ
          </button>
        </div>
      </div>
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  backgroundColor: '#374151',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  padding: '4px 6px',
  cursor: 'pointer',
  fontSize: '11px'
};