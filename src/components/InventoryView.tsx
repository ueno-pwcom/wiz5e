// src/components/InventoryView.tsx
import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { itemList } from '../data/items';
import './InventoryView.css';

interface InventoryViewProps {
  selectedTargetId: string;
  onChangeTargetId: (id: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ selectedTargetId: initialTargetId, onChangeTargetId }) => {
  const inventory = useGameStore((state) => state.inventory);
  const party = useGameStore((state) => state.party);
  const useItem = useGameStore((state) => state.useItem);
  const equipItem = useGameStore((state) => state.equipItem);
  const unequipItem = useGameStore((state) => state.unequipItem);

  const [selectedTargetId, setSelectedTargetId] = useState<string>(initialTargetId);

  useEffect(() => {
    setSelectedTargetId(initialTargetId);
  }, [initialTargetId]);

  useEffect(() => {
    onChangeTargetId(selectedTargetId);
  }, [selectedTargetId, onChangeTargetId]);

  return (
    <div className="inventory-view">
      <h2 className="inventory-view-title">
        🎒 所持品・装備（インベントリ）
      </h2>

      {/* 対象キャラクター選択 */}
      <div className="inventory-view-target-row">
        <span className="inventory-view-target-label">使用・装備対象:</span>
        <select
          value={selectedTargetId}
          onChange={(e) => setSelectedTargetId(e.target.value)}
          className="inventory-view-select"
        >
          {party.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} (HP: {m.hp.current}/{m.hp.max})
            </option>
          ))}
        </select>
      </div>

      {/* アイテム一覧 */}
      <div className="inventory-view-list">
        {inventory.length === 0 ? (
          <div className="inventory-view-empty">所持品はありません。</div>
        ) : (
          inventory.map(({ itemId, quantity }) => {
            const item = itemList[itemId];
            const targetChar = party.find((m) => m.id === selectedTargetId);
            if (!item) return null;

            const otherEquippedCount = party.reduce((count, m) => {
              if (m.id === selectedTargetId) return count;
              if (m.equipped_weapon_id === itemId) return count + 1;
              if (m.equipped_armor_id === itemId) return count + 1;
              if (m.equipped_shield_id === itemId) return count + 1;
              return count;
            }, 0);

            const availableQuantity = item.type === 'weapon' || item.type === 'armor'
              ? Math.max(0, quantity - otherEquippedCount)
              : quantity;

            if (availableQuantity <= 0) return null;

            const isEquippedWeapon = targetChar?.equipped_weapon_id === itemId;
            const isEquippedArmor = targetChar?.equipped_armor_id === itemId;
            const isEquippedShield = targetChar?.equipped_shield_id === itemId;
            const isEquipped = isEquippedWeapon || isEquippedArmor || isEquippedShield;
            const itemSlot: 'weapon' | 'armor' | 'shield' = item.type === 'weapon' ? 'weapon' : item.slot === 'shield' ? 'shield' : 'armor';

            return (
              <div key={itemId} className={`inventory-view-item-card ${isEquipped ? 'equipped' : ''}`}>
                <div className="inventory-view-item-info">
                  <div className="inventory-view-item-name">
                    <span>{item.name}</span>
                    <span className="inventory-view-item-quantity">x{availableQuantity}</span>
                    {isEquipped && (
                      <span className="inventory-view-item-equipped-label">
                        装備中
                      </span>
                    )}
                  </div>
                  <div className="inventory-view-item-desc">{item.description}</div>
                </div>

                <div>
                  {item.type === 'consumable' && (
                    <button onClick={() => useItem(itemId, selectedTargetId)} className="inventory-view-button">
                      使用する
                    </button>
                  )}

                  {(item.type === 'weapon' || item.type === 'armor') && (
                    isEquipped ? (
                      <button
                        onClick={() => unequipItem(selectedTargetId, itemSlot)}
                        className="inventory-view-button unequip"
                      >
                        外す
                      </button>
                    ) : (
                      <button
                        onClick={() => equipItem(selectedTargetId, itemId)}
                        className="inventory-view-button equip"
                      >
                        装備する
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

