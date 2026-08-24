// src/components/ShopModal.tsx
import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { itemList } from '../data/items';

interface Props {
  onClose: () => void;
}

export const ShopModal: React.FC<Props> = ({ onClose }) => {
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const gold = useGameStore((state) => state.gold);
  const inventory = useGameStore((state) => state.inventory);
  const party = useGameStore((state) => state.party);
  const buyItem = useGameStore((state) => state.buyItem);
  const sellItem = useGameStore((state) => state.sellItem);

  // ショップで販売するアイテムのリスト (itemList のキー)
  const shopCatalog = Object.keys(itemList);

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#f59e0b' }}>🛒 武具・道具屋</h2>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fbbf24' }}>💰 {gold} G</div>
        </div>

        {/* タブ切り替え */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button
            onClick={() => setTab('buy')}
            style={{ ...tabButtonStyle, backgroundColor: tab === 'buy' ? '#2563eb' : '#374151' }}
          >
            購入する
          </button>
          <button
            onClick={() => setTab('sell')}
            style={{ ...tabButtonStyle, backgroundColor: tab === 'sell' ? '#2563eb' : '#374151' }}
          >
            売却する
          </button>
        </div>

        {/* 商品一覧 / 売却一覧 */}
        <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {tab === 'buy' ? (
            shopCatalog.map((id) => {
              const item = itemList[id];
              if (!item) return null;
              const price = item.value_gp || 10;
              const canAfford = gold >= price;

              return (
                <div key={id} style={itemRowStyle}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{item.name}</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>{item.description}</div>
                  </div>
                  <button
                    disabled={!canAfford}
                    onClick={() => buyItem(id, price)}
                    style={{
                      ...actionBtnStyle,
                      backgroundColor: canAfford ? '#10b981' : '#4b5563',
                      cursor: canAfford ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {price} G
                  </button>
                </div>
              );
            })
          ) : (
            inventory.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '12px', padding: '20px' }}>
                売却できるアイテムがありません
              </div>
            ) : (
              inventory.map((inv) => {
                const item = itemList[inv.itemId];
                if (!item) return null;
                const sellPrice = Math.floor((item.value_gp || 10) / 2); // 定価の半額で売却
                const isEquipable = item.type === 'weapon' || item.type === 'armor';
                const equippedOwners = party.reduce<string[]>((owners, m) => {
                  if (m.equipped_weapon_id === inv.itemId) owners.push(m.name);
                  if (m.equipped_armor_id === inv.itemId) owners.push(m.name);
                  if (m.equipped_shield_id === inv.itemId) owners.push(m.name);
                  return owners;
                }, []);

                if (isEquipable) {
                  return Array.from({ length: inv.quantity }, (_, index) => {
                    const ownerName = equippedOwners[index];
                    return (
                      <div key={`${inv.itemId}-${index}`} style={itemRowStyle}>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{item.name}</span>
                            {ownerName && (
                              <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>
                                {ownerName} 装備中
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '10px', color: '#9ca3af' }}>{item.description}</div>
                        </div>
                        <button
                          onClick={() => sellItem(inv.itemId, sellPrice)}
                          style={{ ...actionBtnStyle, backgroundColor: '#f59e0b' }}
                        >
                          +{sellPrice} G で売る
                        </button>
                      </div>
                    );
                  });
                }

                return (
                  <div key={inv.itemId} style={itemRowStyle}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                        {item.name} <span style={{ color: '#f59e0b' }}>x{inv.quantity}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#9ca3af' }}>{item.description}</div>
                    </div>
                    <button
                      onClick={() => sellItem(inv.itemId, sellPrice)}
                      style={{ ...actionBtnStyle, backgroundColor: '#f59e0b' }}
                    >
                      +{sellPrice} G で売る
                    </button>
                  </div>
                );
              })
            )
          )}
        </div>

        {/* 閉じるボタン */}
        <button onClick={onClose} style={closeButtonStyle}>閉じる</button>
      </div>
    </div>
  );
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100
};
const modalStyle: React.CSSProperties = {
  backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '16px', width: '360px', color: '#fff'
};
const tabButtonStyle: React.CSSProperties = {
  flex: 1, padding: '6px', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer'
};
const itemRowStyle: React.CSSProperties = {
  backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '6px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
};
const actionBtnStyle: React.CSSProperties = {
  border: 'none', borderRadius: '4px', padding: '6px 10px', color: '#fff', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap'
};
const closeButtonStyle: React.CSSProperties = {
  width: '100%', backgroundColor: '#374151', border: 'none', borderRadius: '6px', padding: '8px', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer'
};