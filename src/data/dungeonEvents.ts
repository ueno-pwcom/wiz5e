// src/data/dungeonEvents.ts
import type { AbilityType } from '../types/game';

export interface EventOption {
  id: string;
  label: string;
  check?: {
    ability: AbilityType; // 例: 'dex' (手先の早業), 'wis' (知覚), 'str' (運動)
    dc: number;           // 難易度目標値 (例: 12)
    label: string;        // 表示用ラベル
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
}

export interface DungeonEvent {
  id: string;
  type: 'chest' | 'door' | 'trap';
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
        id: 'pick_lock',
        label: '鍵を開ける（手先の早業）',
        check: { ability: 'dex', dc: 13, label: '【器用さ/手先の早業】DC 13' },
        successText: 'カチリと音がして鍵が開いた！中に残されていた宝を手に入れた。',
        failureText: 'ピックが引っかかり、鍵を開けることができなかった。',
        reward: { gold: 40, items: ['potion_of_healing'] }
      },
      {
        id: 'check_trap',
        label: '罠を警戒して慎重に開ける（知覚）',
        check: { ability: 'wis', dc: 11, label: '【判断力/知覚】DC 11' },
        successText: '箱の隙間に仕掛けられた針の罠を見抜き、安全に取り除いて中身を回収した！',
        failureText: '罠に気づかず箱を開けてしまい、毒針が刺さってしまった！',
        reward: { gold: 25 },
        penalty: { damageDice: '1d6' }
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
        check: { ability: 'int', dc: 12, label: '【知力/捜査】DC 12' },
        successText: '壁の不自然な窪みを発見して押すと、石扉が滑らかにスライドして開いた！',
        failureText: '仕掛けらしきものは見つからなかった。'
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