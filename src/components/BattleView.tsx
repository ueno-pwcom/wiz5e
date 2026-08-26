import React, { useState } from 'react';
import './BattleView.css';
import { useGameStore } from '../store/useGameStore';
import { spellList } from '../data/spells';
import { itemList } from '../data/items';
import type { Character, SpellData, ItemData } from '../types/game';

export const BattleView: React.FC = () => {
  const combatants = useGameStore((state) => state.combatants);
  const currentTurnIndex = useGameStore((state) => state.currentTurnIndex);
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

  const enemies = combatants.filter((c) => !c.is_player && c.hp.current > 0);
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
    <div className={`battle-view ${battleShake ? 'battle-view-shake' : ''}`}>
      {/* イニシアチブバー */}
      <div className="battle-view-initiative-bar">
        <span className="battle-view-initiative-label">行動順:</span>
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
                selectedAction === 'attack' || (selectedAction === 'spell' && selectedSpell?.damage_dice != null)
              );
              return (
                <div
                  key={enemy.id}
                  onClick={() => isTargetable && handleSelectTarget(enemy.id)}
                  className={`battle-view-enemy-card ${isTargetable ? 'targetable' : ''}`}
                >
                  <div className="battle-view-enemy-icon">👾</div>
                  <div className="battle-view-enemy-name">{enemy.name}</div>
                  <div className="battle-view-enemy-hp">HP: {enemy.hp.current} / {enemy.hp.max}</div>
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
          <div className="battle-view-target-hint">対象の敵または味方を選択してください。</div>
        )}
        {selectedAction === 'item' && selectedItem && (
          <div className="battle-view-target-hint">{selectedItem.heal_dice ? '回復対象の味方を選択してください。' : '対象を選択してください。'}</div>
        )}

        {/* コマンドパネル */}
        <div className="battle-view-panel">
          <div className="battle-view-panel-title">
            戦闘コマンド
          </div>

          <div className="battle-view-command-list">
            <button
              disabled={!isPlayerTurn}
              className={`battle-view-command-button attack ${selectedAction === 'attack' ? 'active' : ''} ${!isPlayerTurn ? 'disabled' : ''}`}
              onClick={() => {
                setSelectedAction(selectedAction === 'attack' ? 'none' : 'attack');
                setSelectedSpell(null);
              }}
            >
              ⚔️ 攻撃
            </button>

            {hasSpells && (
              <button
                disabled={!isPlayerTurn}
                className={`battle-view-command-button spell ${selectedAction === 'spell' ? 'active' : ''} ${!isPlayerTurn ? 'disabled' : ''}`}
                onClick={() => {
                  setSelectedAction(selectedAction === 'spell' ? 'none' : 'spell');
                  setSelectedItemId(null);
                }}
              >
                🪄 呪文
              </button>
            )}
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
                      onClick={() => setSelectedSpell(spell)}
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

