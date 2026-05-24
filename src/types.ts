export type JobType = 'warrior' | 'thief' | 'mage';

export type RarityType = 'common' | 'rare' | 'epic' | 'legendary';

export interface Substat {
  effectType: 'atk_pct' | 'gold_pct' | 'time_dec' | 'crit_rate';
  value: number; // e.g. 10 for 10%
  label: string;
}

export interface Equipment {
  id: string;
  name: string;
  type: 'weapon' | 'armor';
  rarity: RarityType;
  baseStat: number; // ATK for weapon, HP/DEF for armor
  substats: Substat[];
  equippedToCharacterId: string | null; // null if in inventory
}

export interface Character {
  id: string;
  name: string;
  job: JobType;
  level: number;
  baseAtk: number;
  baseDef: number;
  baseHp: number;
  status: 'idle' | 'dispatched';
  isElite?: boolean;
  dispatchState: {
    dungeonId: string;
    startTime: number; // timestamp in ms
    duration: number; // total duration in ms (affected by character's time reduction stats)
    returnTime: number; // timestamp in ms when they return
    recommendedAtk: number;
    partyAtk: number; // Atk at timing of dispatch
    autoLoop?: boolean;
  } | null;
}

export interface Dungeon {
  id: string;
  name: string;
  recommendAtk: number;
  durationSec: number; // Base duration in seconds
  goldReward: number;
  ironReward: number; // steel/iron Ore
  gemReward: number; // magical gemstone
  dragonReward: number; // dragon scales
  isInfinite: boolean; // "極限の奈落" which scales dynamically
  description: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  targetType: 'gold_total' | 'legendary_count' | 'level_total' | 'dispatch_count' | 'deepest_floor';
  targetCount: number;
  unlocked: boolean;
  buffValue: number; // e.g., 2 means +2% permanent ATK
}

export interface GameState {
  gold: number;
  totalGoldEarned: number;
  tickets: number;
  autoSalesLevel: number; // CEO sales power
  ironOre: number;
  magicStone: number;
  dragonScale: number;
  characters: Character[];
  inventory: Equipment[];
  unlockedDungeonIds: string[];
  deepestAbyssFloor: number; // Infinite dungeon progress
  dispatchCount: number;
  achievements: Achievement[];
  officeGymLevel?: number;
  forgeUpgradeLevel?: number;
  dispatchCenterLevel?: number;
  logs: {
    id: string;
    timestamp: string; // "14:23:45"
    text: string;
    type: 'info' | 'success' | 'warn' | 'reward';
  }[];
}
