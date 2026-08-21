// src/components/InventoryView.tsx
import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { itemList } from '../data/items';

interface InventoryViewProps {
  targetCharacterId: string;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ targetCharacterId }) => {
  const inventory = useGameStore((state) => state.inventory);
  const party = useGameStore((state) => state.party);
  const useItem = useGameStore((state) => state.useItem);
  const equipItem = useGameStore((state) => state.equipItem);
  const unequipItem = useGameStore((state) => state.unequipItem);

  const [selectedTargetId, setSelectedTargetId] = useState<string>(targetCharacterId);

  return (
    <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '16px', color: '#fff' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '1px solid #374151', paddingBottom: '8px' }}>
        🎒 所持品・装備（インベントリ）
      </h2>

      {/* 対象キャラクター選択 */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>使用・装備対象:</span>
        <select
          value={selectedTargetId}
          onChange={(e) => setSelectedTargetId(e.target.value)}
          style={{ backgroundColor: '#1f2937', color: '#fff', border: '1px solid #4b5563', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}
        >
          {party.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} (HP: {m.hp.current}/{m.hp.max})
            </option>
          ))}
        </select>
      </div>

      {/* アイテム一覧 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {inventory.length === 0 ? (
          <div style={{ color: '#6b7280', fontSize: '12px' }}>所持品はありません。</div>
        ) : (
          inventory.map(({ itemId, quantity }) => {
            const item = itemList[itemId];
            const targetChar = party.find((m) => m.id === selectedTargetId);
            const isEquippedWeapon = targetChar?.equipped_weapon_id === itemId;
            const isEquippedArmor = targetChar?.equipped_armor_id === itemId;
            const isEquipped = isEquippedWeapon || isEquippedArmor;

            if (!item) return null;

            return (
              <div key={itemId} style={{ backgroundColor: '#1f2937', border: isEquipped ? '1px solid #3b82f6' : '1px solid #374151', padding: '10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{item.name}</span>
                    <span style={{ color: '#f59e0b', fontSize: '11px' }}>x{quantity}</span>
                    {isEquipped && (
                      <span style={{ backgroundColor: '#1d4ed8', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>
                        装備中
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{item.description}</div>
                </div>

                <div>
                  {item.type === 'consumable' && (
                    <button onClick={() => useItem(itemId, selectedTargetId)} style={actionBtnStyle}>
                      使用する
                    </button>
                  )}

                  {(item.type === 'weapon' || item.type === 'armor') && (
                    isEquipped ? (
                      <button
                        onClick={() => unequipItem(selectedTargetId, item.type as 'weapon' | 'armor')}
                        style={{ ...actionBtnStyle, backgroundColor: '#dc2626' }}
                      >
                        外す
                      </button>
                    ) : (
                      <button
                        onClick={() => equipItem(selectedTargetId, itemId)}
                        style={{ ...actionBtnStyle, backgroundColor: '#2563eb' }}
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

const actionBtnStyle: React.CSSProperties = {
  backgroundColor: '#059669',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  padding: '6px 12px',
  fontSize: '11px',
  fontWeight: 'bold',
  cursor: 'pointer'
};