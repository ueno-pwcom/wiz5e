// scripts/fetch-srd.mjs
import fs from 'fs/promises';
import path from 'path';

const BASE_URL = 'https://www.dnd5eapi.co/api';
const OUTPUT_DIR = './src/data';

// 1. 日本語マッピング辞書（主要要素の定義）
const translationMap = {
  // クラス名
  "fighter": "ファイター",
  "rogue": "ローグ",
  "cleric": "クレリック",
  "wizard": "ウィザード",

  // 呪文名
  "Burning Hands": "バーニング・ハンズ",
  "Magic Missile": "マジック・ミサイル",
  "Fire Bolt": "ファイア・ボルト",
  "Sacred Flame": "セイクリッド・フレイム",
  "Cure Wounds": "キュア・ウーンズ",
  "Bless": "ブレス",
  "Shield": "シールド",
  "Sleep": "スリープ",
  "Guiding Bolt": "ガイディング・ボルト",
  "Shatter": "シャター",
  "Scorching Ray": "スコーチング・レイ",
  "Aid": "エイド",
  "Lesser Restoration": "レッサー・レストレーション",
  "Fireball": "ファイアボール",
  "Lightning Bolt": "ライトニング・ボルト",
  "Mass Healing Word": "マス・ヒーリング・ワード",
  "Revivify": "リヴィファイ",

  // モンスター名
  "Goblin": "ゴブリン",
  "Skeleton": "スケルトン",
  "Zombie": "ゾンビ",
  "Bugbear": "バグベア",
  "Orc": "オーク",
  "Kobold": "コボルド",
  "Gnoll": "ノール",
  "Hobgoblin": "ホブゴブリン",
  "Troll": "トロール",
  "Ogre": "オーガ",

  // 武器名 / 行動名
  "Dagger": "ダガー",
  "Shortsword": "ショートソード",
  "Longsword": "ロングソード",
  "Shortbow": "ショートボウ",
  "Longbow": "ロングボウ",
  "Mace": "メイス",
  "Scimitar": "シミター",
  "Morningstar": "モーニングスター",
  "Javelin": "ジャベリン",
  "Greataxe": "グレートアックス",
  "Slam": "打撃",
  "Bite": "噛みつき",
  "Spear": "槍",
  "Claw": "爪",
  "Greatclub": "グレートクラブ",
  "Multiattack": "マルチアタック",
  "Sling": "スリング",

  // 属性・ダメージ種別
  "slashing": "斬撃",
  "piercing": "刺突",
  "bludgeoning": "殴打",
  "fire": "火",
  "force": "力場",
  "poison": "毒",
  "radiant": "光輝",
  "cold": "冷気",
  "lightning": "電撃",
};

// ヘルパー関数: テキスト翻訳
function t(key) {
  return translationMap[key] || key;
}

// 追加フィールド定義
const CUSTOM_SPELL_FIELDS = {
  'magic-missile': {
    auto_hit: true
  }
};

// ヘルパー関数: 既存JSONを読み込み、存在しなければ空オブジェクトを返す
async function readExistingData(filename) {
  try {
    const filePath = path.join(OUTPUT_DIR, filename);
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return {};
  }
}

// 新規データに既存データの追加フィールドを付与
function mergeWithExistingData(newData, existingData) {
  const result = { ...newData };
  Object.entries(existingData).forEach(([key, value]) => {
    if (!(key in result)) {
      result[key] = value;
    }
  });
  return result;
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

  const existingClassesData = await readExistingData('classes.json');

  for (const index of targetClasses) {
    const res = await fetch(`${BASE_URL}/classes/${index}`);
    const detail = await res.json();

    const levelFeatures = {};
    for (let level = 1; level <= 5; level += 1) {
      const levelRes = await fetch(`${BASE_URL}/classes/${index}/levels/${level}`);
      const levelDetail = await levelRes.json();
      levelFeatures[level] = (levelDetail.features || []).map((feature) => t(feature.name));
    }

    const baseClassData = {
      id: detail.index,
      name: t(detail.name),
      hit_die: detail.hit_die,
      hp_static_increase: staticHpIncreaseMap[detail.index] || Math.floor(detail.hit_die / 2) + 1,
      proficiencies: detail.proficiencies.map(p => p.name),
      saving_throws: detail.saving_throws.map(s => s.name.toLowerCase()),
      spellcasting_ability: detail.spellcasting?.spellcasting_ability?.name?.toLowerCase() || null,
      level_features: levelFeatures
    };

    classesData[detail.index] = mergeWithExistingData(baseClassData, existingClassesData[detail.index] || {});
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
  const targetSpells = [
    'fire-bolt',
    'sacred-flame',
    'burning-hands',
    'magic-missile',
    'sleep',
    'cure-wounds',
    'bless',
    'guiding-bolt',
    'shatter',
    'scorching-ray',
    'aid',
    'lesser-restoration',
    'fireball',
    'lightning-bolt',
    'mass-healing-word',
    'revivify'
  ];
  const spellsData = {};

  const existingSpellsData = await readExistingData('spells.json');

  for (const index of targetSpells) {
    const res = await fetch(`${BASE_URL}/spells/${index}`);
    const detail = await res.json();

    const spellSlotKey = String(detail.level > 0 ? detail.level : 1);
    const damageDice = detail.damage?.damage_at_slot_level?.[spellSlotKey]
      || detail.damage?.damage_at_slot_level?.['1']
      || (detail.level === 0 ? Object.values(detail.damage?.damage_at_character_level || {})[0] : null)
      || null;

    const baseSpellData = {
      id: detail.index,
      name: t(detail.name),
      level: detail.level,
      school: detail.school.name.toLowerCase(),
      classes: detail.classes.map(c => c.index),
      damage_dice: damageDice,
      heal_dice: detail.heal_at_slot_level?.['1'] || null,
      damage_type: detail.damage?.damage_type?.name ? t(detail.damage.damage_type.name.toLowerCase()) : null,
      save_type: detail.dc?.dc_type?.name?.toLowerCase() || null,
      save_effect: detail.dc?.dc_success || null,
      targets_all_enemies: ['burning-hands', 'shatter', 'fireball', 'lightning-bolt'].includes(detail.index),
      requires_concentration: detail.concentration
    };

    spellsData[detail.index] = mergeWithExistingData(baseSpellData, existingSpellsData[detail.index] || {});
    spellsData[detail.index] = mergeWithExistingData(spellsData[detail.index], CUSTOM_SPELL_FIELDS[detail.index] || {});
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
  const targetMonsters = ['goblin', 'skeleton', 'zombie', 'bugbear', 'orc', 'kobold', 'gnoll', 'hobgoblin', 'troll', 'ogre'];
  const monstersData = {};

  const existingMonstersData = await readExistingData('monsters.json');

  for (const index of targetMonsters) {
    const res = await fetch(`${BASE_URL}/monsters/${index}`);
    const detail = await res.json();

    // 攻撃アクションのみ抽出
    const actions = (detail.actions || []).map(act => ({
      name: t(act.name),
      to_hit: act.attack_bonus || 0,
      damage_dice: act.damage?.[0]?.damage_dice || "1d6",
      damage_type: act.damage?.[0]?.damage_type?.name ? t(act.damage[0].damage_type.name.toLowerCase()) : "打撃"
    }));

    const damageVulnerabilities = (detail.damage_vulnerabilities || [])
      .map((v) => {
        if (typeof v === 'string') return t(v.toLowerCase());
        return v?.name ? t(v.name.toLowerCase()) : null;
      })
      .filter(Boolean);
    const damageResistances = (detail.damage_resistances || [])
      .map((r) => {
        if (typeof r === 'string') return t(r.toLowerCase());
        return r?.name ? t(r.name.toLowerCase()) : null;
      })
      .filter(Boolean);
    const damageImmunities = (detail.damage_immunities || [])
      .map((i) => {
        if (typeof i === 'string') return t(i.toLowerCase());
        return i?.name ? t(i.name.toLowerCase()) : null;
      })
      .filter(Boolean);

    const monsterType = typeof detail.type === 'string'
      ? detail.type.toLowerCase()
      : detail.type?.name?.toLowerCase() || null;

    const baseMonsterData = {
      id: detail.index,
      name: t(detail.name),
      type: monsterType,
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
      damage_vulnerabilities: damageVulnerabilities,
      damage_resistances: damageResistances,
      damage_immunities: damageImmunities,
      condition_immunities: (detail.condition_immunities || []).map(i => i.name.toLowerCase()),
      actions: actions
    };

    monstersData[detail.index] = mergeWithExistingData(baseMonsterData, existingMonstersData[detail.index] || {});
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

  const existingEquipmentData = await readExistingData('equipment.json');

  for (const index of targetEquipment) {
    const res = await fetch(`${BASE_URL}/equipment/${index}`);
    const detail = await res.json();

    const baseEquipmentData = {
      id: detail.index,
      name: t(detail.name),
      cost_gp: detail.cost?.unit === 'gp' ? detail.cost.quantity : (detail.cost?.quantity || 0) / 10,
      damage_dice: detail.damage?.damage_dice || "1d4",
      damage_type: detail.damage?.damage_type?.name ? t(detail.damage.damage_type.name.toLowerCase()) : "打撃",
      properties: (detail.properties || []).map(p => p.index)
    };

    equipmentData[detail.index] = mergeWithExistingData(baseEquipmentData, existingEquipmentData[detail.index] || {});
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