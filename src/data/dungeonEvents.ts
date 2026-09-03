// src/data/dungeonEvents.ts
import type { AbilityType, TrapKind } from '../types/game';

export const trapKindCatalog: Record<
  TrapKind,
  { label: string; description: string; damageDice?: string }
> = {
  poison_dart: {
    label: '毒矢の落とし穴',
    description: '壁の隙間から毒矢が射出される細工だ。',
    damageDice: '2d4'
  },
  swinging_blade: {
    label: '振り下ろしブレード',
    description: '天井から刃が一瞬だけ振り下ろされる。',
    damageDice: '2d6'
  },
  spike_trap: {
    label: '棘の床',
    description: '床の石が吐き出す棘が足元を襲う。',
    damageDice: '1d8'
  },
  fire_burst: {
    label: '火炎噴出',
    description: '石の裂け目から炎が吹き出す。',
    damageDice: '3d4'
  },
  falling_rocks: {
    label: '落石',
    description: '天井の亀裂が崩れ、石が落ちる。',
    damageDice: '2d6'
  },
  sleep_gas: {
    label: '睡眠ガス',
    description: '暗い隅に仕掛けられたガスが広がる。',
    damageDice: '1d6'
  }
};

export const trapKindOrder: TrapKind[] = [
  'poison_dart',
  'swinging_blade',
  'spike_trap',
  'fire_burst',
  'falling_rocks',
  'sleep_gas'
];

export interface EventOption {
  id: string;
  label: string;
  check?: {
    ability: AbilityType; // 例: 'dex' (手先の早業), 'wis' (知覚), 'str' (運動)
    dc: number;           // 難易度目標値 (例: 12)
    label: string;        // 表示用ラベル
    skill?: string;       // 習熟判定を適用するスキル名
  };
  successText: string;
  failureText: string;
  // 成功時報酬・処理
  reward?: {
    gold?: number;
    items?: string[];
  };
  // 失敗時ペナルティ
  penalty?: {
    damageDice?: string; // 例: '1d10' (罠のダメージ)
  };
  // 実行に必要な習熟
  requiredProficiency?: string;
}

export interface DungeonEvent {
  id: string;
  type: 'chest' | 'door' | 'trap' | 'message';
  title: string;
  description: string;
  icon: string;
  options: EventOption[];
}

export const dungeonEvents: Record<string, DungeonEvent> = {
  locked_chest: {
    id: 'locked_chest',
    type: 'chest',
    title: '装飾された宝箱',
    description: '通路の隅に頑丈な鉄の錠前が施された木箱が置かれている。罠が仕掛けられているかもしれない...',
    icon: '📦',
    options: [
      {
        id: 'check_trap',
        label: '罠を警戒して慎重に調べる（知覚）',
        check: { ability: 'wis', dc: 11, label: '【判断力/知覚】DC 11', skill: 'Perception' },
        successText: '箱の隙間に仕掛けられた針の罠を見抜き、解除して安全に開錠できるようにした。',
        failureText: '罠に気づかず箱を触ってしまい、毒針が刺さってしまった！',
        penalty: { damageDice: '1d6' }
      },
      {
        id: 'pick_lock',
        label: '鍵を開ける（手先の早業）',
        check: { ability: 'dex', dc: 13, label: '【器用さ/手先の早業】DC 13', skill: 'Sleight of Hand' },
        successText: 'カチリと音がして鍵が開いた！中に残されていた宝を手に入れた。',
        failureText: 'ピックが引っかかり、鍵を開けることができなかった。手元が滑り、小さな切り傷を負ってしまった。',
        penalty: { damageDice: '1d4' },
        requiredProficiency: "Thieves' Tools",
        reward: { gold: 40, items: ['potion_of_healing'] }
      },
      {
        id: 'ignore',
        label: '立ち去る',
        successText: '宝箱には手を触れず、先を急ぐことにした。',
        failureText: ''
      }
    ]
  },
  heavy_door: {
    id: 'heavy_door',
    type: 'door',
    title: '頑丈な石の扉',
    description: '重厚な石の扉が立ちふさがっている。取っ手はなく、力ずくで押し開けるか、隠された仕掛けを探す必要がある。',
    icon: '🚪',
    options: [
      {
        id: 'force_open',
        label: '力ずくで押し開ける（運動）',
        check: { ability: 'str', dc: 14, label: '【筋力/運動】DC 14' },
        successText: '全身の力を込めると、ズズズ...と大きな音を立てて石扉が開いた！',
        failureText: 'びくともせず、腕を痛めてしまった。',
        penalty: { damageDice: '1d4' }
      },
      {
        id: 'find_switch',
        label: '壁の隠しスイッチを探す（捜査）',
        check: { ability: 'int', dc: 12, label: '【知力/捜査】DC 12', skill: 'Investigation' },
        successText: '壁の不自然な窪みを発見して押すと、石扉が滑らかにスライドして開いた！',
        failureText: '仕掛けらしきものは見つからなかった。'
      },
      {
        id: 'ignore',
        label: '立ち去る',
        successText: '大きな扉に用はないと判断し、その場を離れることにした。',
        failureText: ''
      }
    ]
  },
  poison_dart_trap: {
    id: 'poison_dart_trap',
    type: 'trap',
    title: '仕掛けられた圧力板',
    description: '床の石畳の一部が微かに沈んでいる！罠を起動させてしまったようだ！',
    icon: '⚠️',
    options: [
      {
        id: 'dodge',
        label: 'とっさに身を躱す（敏捷力セーヴ）',
        check: { ability: 'dex', dc: 12, label: '【敏捷力セーブ】DC 12' },
        successText: '飛んできた毒矢を間一髪で回避した！',
        failureText: '回避が間に合わず、毒矢が肩に突き刺さった！',
        penalty: { damageDice: '2d4' }
      }
    ]
  }
};