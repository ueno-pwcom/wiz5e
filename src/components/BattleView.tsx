import React, { useEffect, useState } from 'react';
import './BattleView.css';
import { useGameStore } from '../store/useGameStore';
import { spellList } from '../data/spells';
import { itemList } from '../data/items';
import type { Character, SpellData, ItemData } from '../types/game';

export const BattleView: React.FC = () => {
  const combatants = useGameStore((state) => state.combatants);
  const currentTurnIndex = useGameStore((state) => state.currentTurnIndex);
  const battleRound = useGameStore((state) => state.battleRound);
  const executePlayerAttack = useGameStore((state) => state.executePlayerAttack);
  const executePlayerEvade = useGameStore((state) => state.executePlayerEvade);
  const executePlayerSpell = useGameStore((state) => state.executePlayerSpell);
  const useItem = useGameStore((state) => state.useItem);
  const inventory = useGameStore((state) => state.inventory);
  const party = useGameStore((state) => state.party);
  const battleShake = useGameStore((state) => state.battleShake);
  // const addLog = useGameStore((state) => state.addLog);
 
  const [selectedAction, setSelectedAction] = useState<'none' | 'attack' | 'spell' | 'item'>('none');
  const [selectedSpell, setSelectedSpell] = useState<SpellData | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const currentCombatant = combatants[currentTurnIndex];
  const attemptRun = useGameStore((state) => state.attemptRun);
  const nextTurn = useGameStore((state) => state.nextTurn);
  const isPlayerTurn = currentCombatant?.is_player ?? false;
  const playerChar = isPlayerTurn ? (currentCombatant.ref as Character) : null;
  const weapon = playerChar?.equipped_weapon_id ? itemList[playerChar.equipped_weapon_id] : null;
  const isCurrentWeaponRanged = weapon?.weapon_category === 'ranged';
  const cannotPerformMeleeAttack = isPlayerTurn && !isCurrentWeaponRanged && playerChar?.position === 'back';
  const enemyShakeTargetId = useGameStore((state) => state.enemyShakeTargetId);
  const [isEntering, setIsEntering] = useState(true);
  const [isBlinkingInitiative, setIsBlinkingInitiative] = useState(true);

  useEffect(() => {
    const enterTimer = window.setTimeout(() => setIsEntering(false), 400);
    const blinkTimer = window.setTimeout(() => setIsBlinkingInitiative(false), 2400);
    return () => {
      window.clearTimeout(enterTimer);
      window.clearTimeout(blinkTimer);
    };
  }, []);

  const enemies = combatants.filter((c) => !c.is_player && (c.hp.current > 0 || c.id === enemyShakeTargetId));
  const allies = party.filter((c) => c.hp.current > 0);

  const availableSpells = playerChar
    ? Object.values(spellList).filter((spell) => spell.classes.includes(playerChar.class_id))
    : [];
  const hasSpells = availableSpells.length > 0;
  const availableItems = inventory
    .map((inv) => itemList[inv.itemId])
    .filter((item): item is ItemData => Boolean(item) && item.type === 'consumable');
  const hasItems = availableItems.length > 0;
  const selectedItem = selectedItemId ? itemList[selectedItemId] : null;

  // 攻撃・呪文・道具の対象を選択した時の処理
  const handleSelectTarget = (targetId: string) => {
    if (selectedAction === 'attack') {
      executePlayerAttack(targetId);
      setSelectedAction('none');
    } else if (selectedAction === 'spell' && selectedSpell) {
      executePlayerSpell(selectedSpell.id, targetId);
      setSelectedAction('none');
      setSelectedSpell(null);
    } else if (selectedAction === 'item' && selectedItemId) {
      useItem(selectedItemId, targetId);
      setSelectedAction('none');
      setSelectedItemId(null);
      nextTurn();
    }
  };

  return (
    <div className={`battle-view ${battleShake ? 'battle-view-shake' : ''} ${isEntering ? 'battle-view-enter' : ''}`}>
      {/* イニシアチブバー */}
      <div className={`battle-view-initiative-bar ${isBlinkingInitiative ? 'battle-view-initiative-blink' : ''}`}>
        <div className="battle-view-initiative-header">
          <span className="battle-view-round-label">ラウンド {battleRound}</span>
          <span className="battle-view-initiative-label">行動順:</span>
        </div>
        <div className="battle-view-initiative-list">
          {combatants.map((c, idx) => (
            <div
              key={c.id}
              className={`battle-view-initiative-token ${c.is_player ? 'player' : 'enemy'} ${idx === currentTurnIndex ? 'current' : ''} ${c.hp.current <= 0 ? 'dead' : ''}`}
            >
              {c.is_player ? '🛡️' : '👾'} {c.name} ({c.initiative})
            </div>
          ))}
        </div>
      </div>

      <div className="battle-view-main">
        {/* 戦闘フィールド (敵・味方) */}
        <div className="battle-view-field">
          {/* 敵一覧 */}
          <div className="battle-view-enemies">
            {enemies.map((enemy) => {
              const isTargetable = isPlayerTurn && (
                selectedAction === 'attack' && !cannotPerformMeleeAttack || (selectedAction === 'spell' && selectedSpell?.damage_dice != null)
              );
              return (
                <div
                  key={enemy.id}
                  onClick={() => isTargetable && handleSelectTarget(enemy.id)}
                  className={`battle-view-enemy-card ${isTargetable ? 'targetable' : ''} ${enemyShakeTargetId === enemy.id ? 'enemy-shake' : ''}`}
                >
                    <div className="battle-view-enemy-icon">👾</div>
                  <div className="battle-view-enemy-name">{enemy.name}</div>
                  <div className="battle-view-enemy-hp-bar">
                    <div
                      className="battle-view-enemy-hp-bar-fill"
                      style={{ width: `${Math.max(0, Math.min(100, Math.floor((enemy.hp.current / enemy.hp.max) * 100)))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 味方（回復呪文／道具のターゲット選択用） */}
          {(selectedAction === 'spell' && selectedSpell?.heal_dice) || (selectedAction === 'item' && selectedItem?.heal_dice) ? (
            <div className="battle-view-heal-panel">
              <div className="battle-view-heal-text">
                回復対象の味方を選択してください:
              </div>
              <div className="battle-view-heal-buttons">
                {allies.map((ally) => (
                  <button
                    key={ally.id}
                    onClick={() => handleSelectTarget(ally.id)}
                    className="battle-view-heal-button"
                  >
                    {ally.name} (HP: {ally.hp.current}/{ally.hp.max})
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="battle-view-turn-info">
            現在のターン: <strong>{currentCombatant?.name}</strong>
          </div>
        </div>

        {/* 対象選択説明 */}
        {selectedAction === 'spell' && selectedSpell && (
          <div className="battle-view-target-hint">
            {selectedSpell.targets_random
              ? `${selectedSpell.targets_random} 体の敵をランダムに選択して即時発動します。`
              : '対象の敵または味方を選択してください。'}
          </div>
        )}
        {selectedAction === 'item' && selectedItem && (
          <div className="battle-view-target-hint">{selectedItem.heal_dice ? '回復対象の味方を選択してください。' : '対象を選択してください。'}</div>
        )}

        {/* コマンドパネル */}
        <div className="battle-view-panel">
          <div className="battle-view-panel-title">
            アクション
          </div>
          <div className="battle-view-panel-caption">
            {currentCombatant ? `${currentCombatant.name} のターンです。` : 'ターンを選択してください'}
          </div>

          <div className="battle-view-command-list">
            <button
              disabled={!isPlayerTurn || cannotPerformMeleeAttack}
              className={`battle-view-command-button attack ${selectedAction === 'attack' ? 'active' : ''} ${!isPlayerTurn || cannotPerformMeleeAttack ? 'disabled' : ''}`}
              onClick={() => {
                setSelectedAction(selectedAction === 'attack' ? 'none' : 'attack');
                setSelectedSpell(null);
              }}
              title={cannotPerformMeleeAttack ? '後衛は近接攻撃できません。' : undefined}
            >
              ⚔️ 攻撃{weapon ? ` (${weapon.name})` : ''}
            </button>

            {selectedAction === 'attack' && isPlayerTurn && playerChar && isCurrentWeaponRanged && playerChar.position === 'front' && (
              <div className="battle-view-target-hint">前衛の遠隔武器攻撃は不利判定になります。</div>
            )}

            <button
              disabled={!isPlayerTurn || !hasSpells}
              className={`battle-view-command-button spell ${selectedAction === 'spell' ? 'active' : ''} ${!isPlayerTurn || !hasSpells ? 'disabled' : ''}`}
              onClick={() => {
                if (!hasSpells) return;
                setSelectedAction(selectedAction === 'spell' ? 'none' : 'spell');
                setSelectedItemId(null);
              }}
              title={!hasSpells ? '使用可能な呪文がありません。' : undefined}
            >
              🪄 呪文
            </button>
            {hasItems && (
              <button
                disabled={!isPlayerTurn}
                className={`battle-view-command-button item ${selectedAction === 'item' ? 'active' : ''} ${!isPlayerTurn ? 'disabled' : ''}`}
                onClick={() => {
                  setSelectedAction(selectedAction === 'item' ? 'none' : 'item');
                  setSelectedSpell(null);
                }}
              >
                🎒 道具
              </button>
            )}

            {/* 呪文サブメニュー */}
            {selectedAction === 'spell' && isPlayerTurn && hasSpells && (
              <div className="battle-view-spell-menu">
                <div className="battle-view-spell-menu-title">使用する呪文を選択:</div>
                {availableSpells.map((spell) => {
                  const isCantrip = spell.level === 0;
                  const slots = isCantrip ? 1 : playerChar?.spell_slots?.[spell.level]?.current ?? 0;
                  const slotLabel = isCantrip ? '無制限' : `残:${slots}`;
                  const isSelected = selectedSpell?.id === spell.id;
                  return (
                    <button
                      key={spell.id}
                      disabled={!isCantrip && slots <= 0}
                      onClick={() => {
                    if (!isCantrip && slots <= 0) return;
                    if (spell.targets_random) {
                      executePlayerSpell(spell.id, '');
                      setSelectedAction('none');
                      setSelectedSpell(null);
                    } else {
                      setSelectedSpell(spell);
                    }
                  }}
                      className={`battle-view-spell-button ${isSelected ? 'selected' : ''} ${!isCantrip && slots <= 0 ? 'disabled' : ''}`}
                    >
                      {spell.name} (Lv.{spell.level}) [{slotLabel}]
                    </button>
                  );
                })}
              </div>
            )}
            {selectedAction === 'item' && isPlayerTurn && hasItems && (
              <div className="battle-view-spell-menu">
                <div className="battle-view-spell-menu-title">使用する道具を選択:</div>
                {availableItems.map((item) => {
                  const quantity = inventory.find((inv) => inv.itemId === item.id)?.quantity ?? 0;
                  const isSelected = selectedItemId === item.id;
                  return (
                    <button
                      key={item.id}
                      disabled={quantity <= 0}
                      onClick={() => setSelectedItemId(item.id)}
                      className={`battle-view-spell-button ${isSelected ? 'selected' : ''} ${quantity <= 0 ? 'disabled' : ''}`}
                    >
                      {item.name} x{quantity}
                    </button>
                  );
                })}
              </div>
            )}

            <button
              disabled={!isPlayerTurn}
              className={`battle-view-command-button ${!isPlayerTurn ? 'disabled' : ''}`}
              onClick={() => {
                setSelectedAction('none');
                setSelectedSpell(null);
                executePlayerEvade();
              }}
            >
              🌀 回避
            </button>

            {/* ★ 逃げるボタンの追加 */}
            <button
              disabled={!isPlayerTurn}
              className={`battle-view-command-button run ${isPlayerTurn ? 'active' : 'inactive'} ${!isPlayerTurn ? 'disabled' : ''}`}
              onClick={attemptRun}
            >
              🏃 逃げる
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

