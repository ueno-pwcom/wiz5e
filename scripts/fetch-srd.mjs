// scripts/fetch-srd.mjs
import fs from 'fs/promises';
import path from 'path';

const BASE_URL = 'https://www.dnd5eapi.co/api';
const OUTPUT_DIR = './src/data';

// 1. 日本語マッピング辞書（主要要素の定義）
const translationMap = {
  // クラス名
  "Fighter": "ファイター",
  "Rogue": "ローグ",
  "Cleric": "クレリック",
  "Wizard": "ウィザード",

  // 呪文名
  "Burning Hands": "バーニング・ハンズ",
  "Magic Missile": "マジック・ミサイル",
  "Cure Wounds": "キュア・ウーンズ",
  "Bless": "ブレス",
  "Shield": "シールド",

  // モンスター名
  "Goblin": "ゴブリン",
  "Skeleton": "スケルトン",
  "Zombie": "ゾンビ",
  "Bugbear": "バグベア",

  // 武器名
  "Dagger": "ダガー",
  "Shortsword": "ショートソード",
  "Longsword": "ロングソード",
  "Shortbow": "ショートボウ",
  "Mace": "メイス",

  // 属性・ダメージ種別
  "slashing": "斬撃",
  "piercing": "刺突",
  "bludgeoning": "殴打",
  "fire": "火",
  "force": "力場",
  "poison": "毒",
  "radiant": "光輝"
};

// ヘルパー関数: テキスト翻訳
function t(key) {
  return translationMap[key] || key;
}

// 2. クラスデータの取得 & 整形
async function fetchClasses() {
  console.log('Fetching Classes...');
  const targetClasses = ['fighter', 'rogue', 'cleric', 'wizard'];
  const classesData = {};

  // 仕様書に基づくレベルアップ時固定HP増加量マップ
  const staticHpIncreaseMap = {
    fighter: 6,
    rogue: 5,
    cleric: 5,
    wizard: 4
  };

  for (const index of targetClasses) {
    const res = await fetch(`${BASE_URL}/classes/${index}`);
    const detail = await res.json();

    classesData[detail.index] = {
      id: detail.index,
      name: t(detail.name),
      hit_die: detail.hit_die,
      hp_static_increase: staticHpIncreaseMap[detail.index] || Math.floor(detail.hit_die / 2) + 1,
      proficiencies: detail.proficiencies.map(p => p.name),
      saving_throws: detail.saving_throws.map(s => s.name.toLowerCase()),
      spellcasting_ability: detail.spellcasting?.spellcasting_ability?.name?.toLowerCase() || null
    };
  }

  await fs.writeFile(
    path.join(OUTPUT_DIR, 'classes.json'),
    JSON.stringify(classesData, null, 2)
  );
  console.log('✔ classes.json 補完完了');
}

// 3. 呪文データの取得 & 整形（簡易化仕様）
async function fetchSpells() {
  console.log('Fetching Spells...');
  const targetSpells = ['burning-hands', 'magic-missile', 'cure-wounds', 'bless', 'shield'];
  const spellsData = {};

  for (const index of targetSpells) {
    const res = await fetch(`${BASE_URL}/spells/${index}`);
    const detail = await res.json();

    spellsData[detail.index] = {
      id: detail.index,
      name: t(detail.name),
      level: detail.level,
      school: detail.school.name.toLowerCase(),
      classes: detail.classes.map(c => c.index),
      damage_dice: detail.damage?.damage_at_slot_level?.['1'] || null,
      heal_dice: detail.heal_at_slot_level?.['1'] || null,
      damage_type: detail.damage?.damage_type?.name ? t(detail.damage.damage_type.name.toLowerCase()) : null,
      save_type: detail.dc?.dc_type?.name?.toLowerCase() || null,
      save_effect: detail.dc?.dc_success || null,
      requires_concentration: detail.concentration
    };
  }

  await fs.writeFile(
    path.join(OUTPUT_DIR, 'spells.json'),
    JSON.stringify(spellsData, null, 2)
  );
  console.log('✔ spells.json 補完完了');
}

// 4. モンスターデータの取得 & 整形
async function fetchMonsters() {
  console.log('Fetching Monsters...');
  const targetMonsters = ['goblin', 'skeleton', 'zombie', 'bugbear'];
  const monstersData = {};

  for (const index of targetMonsters) {
    const res = await fetch(`${BASE_URL}/monsters/${index}`);
    const detail = await res.json();

    // 攻撃アクションのみ抽出
    const actions = (detail.actions || []).map(act => ({
      name: act.name,
      to_hit: act.attack_bonus || 0,
      damage_dice: act.damage?.[0]?.damage_dice || "1d6",
      damage_type: act.damage?.[0]?.damage_type?.name ? t(act.damage[0].damage_type.name.toLowerCase()) : "打撃"
    }));

    monstersData[detail.index] = {
      id: detail.index,
      name: t(detail.name),
      cr: detail.challenge_rating,
      xp: detail.xp,
      ac: detail.armor_class[0]?.value || 10,
      hp: {
        current: detail.hit_points,
        max: detail.hit_points,
        dice: detail.hit_points_roll
      },
      stats: {
        str: detail.strength,
        dex: detail.dexterity,
        con: detail.constitution,
        int: detail.intelligence,
        wis: detail.wisdom,
        cha: detail.charisma
      },
      actions: actions
    };
  }

  await fs.writeFile(
    path.join(OUTPUT_DIR, 'monsters.json'),
    JSON.stringify(monstersData, null, 2)
  );
  console.log('✔ monsters.json 補完完了');
}

// 5. 装備（武器）データの取得 & 整形
async function fetchEquipment() {
  console.log('Fetching Equipment...');
  const targetEquipment = ['dagger', 'shortsword', 'longsword', 'shortbow', 'mace'];
  const equipmentData = {};

  for (const index of targetEquipment) {
    const res = await fetch(`${BASE_URL}/equipment/${index}`);
    const detail = await res.json();

    equipmentData[detail.index] = {
      id: detail.index,
      name: t(detail.name),
      cost_gp: detail.cost?.unit === 'gp' ? detail.cost.quantity : (detail.cost?.quantity || 0) / 10,
      damage_dice: detail.damage?.damage_dice || "1d4",
      damage_type: detail.damage?.damage_type?.name ? t(detail.damage.damage_type.name.toLowerCase()) : "打撃",
      properties: (detail.properties || []).map(p => p.index)
    };
  }

  await fs.writeFile(
    path.join(OUTPUT_DIR, 'equipment.json'),
    JSON.stringify(equipmentData, null, 2)
  );
  console.log('✔ equipment.json 補完完了');
}

// メイン実行関数
async function main() {
  try {
    // 出力先フォルダの作成
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // 全データの取得と保存処理を並列実行
    await Promise.all([
      fetchClasses(),
      fetchSpells(),
      fetchMonsters(),
      fetchEquipment()
    ]);

    console.log('\n✨ 全SRDデータの取得・整形・出力が正常に完了しました！');
  } catch (error) {
    console.error('❌ データ取得中にエラーが発生しました:', error);
    process.exit(1);
  }
}

main();