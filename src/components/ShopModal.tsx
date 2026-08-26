// src/components/ShopModal.tsx
import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { itemList } from '../data/items';
import './ShopModal.css';

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
    <div className="shop-modal-overlay">
      <div className="shop-modal">
        {/* ヘッダー */}
        <div className="shop-modal-header">
          <h2 className="shop-modal-title">🛒 武具・道具屋</h2>
          <div className="shop-modal-gold">💰 {gold} G</div>
        </div>

        {/* タブ切り替え */}
        <div className="shop-modal-tabs">
          <button
            onClick={() => setTab('buy')}
            className={`shop-modal-tab-button ${tab === 'buy' ? 'active' : ''}`}
          >
            購入する
          </button>
          <button
            onClick={() => setTab('sell')}
            className={`shop-modal-tab-button ${tab === 'sell' ? 'active' : ''}`}
          >
            売却する
          </button>
        </div>

        {/* 商品一覧 / 売却一覧 */}
        <div className="shop-modal-content">
          {tab === 'buy' ? (
            shopCatalog.map((id) => {
              const item = itemList[id];
              if (!item) return null;
              const price = item.value_gp || 10;
              const canAfford = gold >= price;

              return (
                <div key={id} className="shop-modal-item-row">
                  <div className="shop-modal-item-info">
                    <div className="shop-modal-item-name">{item.name}</div>
                    <div className="shop-modal-item-desc">{item.description}</div>
                  </div>
                  <button
                    disabled={!canAfford}
                    onClick={() => buyItem(id, price)}
                    className={`shop-modal-button ${canAfford ? 'can-afford' : 'disabled'}`}
                  >
                    {price} G
                  </button>
                </div>
              );
            })
          ) : (
            inventory.length === 0 ? (
              <div className="shop-modal-empty">
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
                      <div key={`${inv.itemId}-${index}`} className="shop-modal-item-row">
                        <div className="shop-modal-item-info">
                          <div className="shop-modal-item-name shop-modal-item-name-with-status">
                            <span>{item.name}</span>
                            {ownerName && (
                              <span className="shop-modal-item-equipped">
                                {ownerName} 装備中
                              </span>
                            )}
                          </div>
                          <div className="shop-modal-item-desc">{item.description}</div>
                        </div>
                        <button
                          onClick={() => sellItem(inv.itemId, sellPrice)}
                          className="shop-modal-button sell"
                        >
                          +{sellPrice} G で売る
                        </button>
                      </div>
                    );
                  });
                }

                return (
                  <div key={inv.itemId} className="shop-modal-item-row">
                    <div className="shop-modal-item-info">
                      <div className="shop-modal-item-name">
                        {item.name} <span className="shop-modal-item-quantity">x{inv.quantity}</span>
                      </div>
                      <div className="shop-modal-item-desc">{item.description}</div>
                    </div>
                    <button
                      onClick={() => sellItem(inv.itemId, sellPrice)}
                      className="shop-modal-button sell"
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
        <button onClick={onClose} className="shop-modal-close-button">閉じる</button>
      </div>
    </div>
  );
};
