import { Character, Equipment, RarityType, Substat, JobType } from './types';
import {
  FIRST_NAMES,
  LAST_NAMES,
  WEAPON_NAMES,
  ARMOR_NAMES,
  SUBSTAT_POOL,
} from './constants';

// Utility for generating unique IDs
export const generateId = () => Math.random().toString(36).substr(2, 9);

// Get random item from list
const sample = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Generate random number in range
const randomRange = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Generate equipment with random stats, names, and substats
export const generateEquipment = (
  forcedRarity?: RarityType,
  itemType?: 'weapon' | 'armor'
): Equipment => {
  const id = generateId();
  const type = itemType || (Math.random() > 0.5 ? 'weapon' : 'armor');

  // Determine rarity if not forced
  let rarity: RarityType = 'common';
  if (forcedRarity) {
    rarity = forcedRarity;
  } else {
    const roll = Math.random();
    if (roll < 0.05) rarity = 'legendary'; // 5%
    else if (roll < 0.20) rarity = 'epic'; // 15%
    else if (roll < 0.55) rarity = 'rare'; // 35%
    else rarity = 'common'; // 45%
  }

  // Base Stat Ranges according to rarity
  let baseStat = 10;
  if (type === 'weapon') {
    switch (rarity) {
      case 'common': baseStat = randomRange(10, 25); break;
      case 'rare': baseStat = randomRange(40, 85); break;
      case 'epic': baseStat = randomRange(130, 260); break;
      case 'legendary': baseStat = randomRange(450, 950); break;
    }
  } else {
    // Armor gives defensive/physical security rating
    switch (rarity) {
      case 'common': baseStat = randomRange(8, 20); break;
      case 'rare': baseStat = randomRange(30, 70); break;
      case 'epic': baseStat = randomRange(100, 220); break;
      case 'legendary': baseStat = randomRange(350, 800); break;
    }
  }

  // Pick names
  const namePool = type === 'weapon' ? WEAPON_NAMES[rarity] : ARMOR_NAMES[rarity];
  const name = sample(namePool);

  // Generate Substats
  // Slot counts based on rarity
  let slotCount = 0;
  switch (rarity) {
    case 'common': slotCount = Math.random() > 0.7 ? 1 : 0; break;
    case 'rare': slotCount = randomRange(1, 2); break;
    case 'epic': slotCount = randomRange(2, 3); break;
    case 'legendary': slotCount = randomRange(3, 4); break;
  }

  const substats: Substat[] = [];
  const usedTypes = new Set<string>();

  for (let i = 0; i < slotCount; i++) {
    // Select a random substat descriptor
    const pool = SUBSTAT_POOL.filter((sub) => !usedTypes.has(sub.effectType));
    if (pool.length === 0) break;

    const chosen = sample(pool);
    usedTypes.add(chosen.effectType);

    // Scale min/max values based on rarity
    let multiplier = 1.0;
    if (rarity === 'rare') multiplier = 1.4;
    else if (rarity === 'epic') multiplier = 2.0;
    else if (rarity === 'legendary') multiplier = 3.5;

    let value = randomRange(chosen.min, chosen.max) * multiplier;
    value = Math.round(value * 10) / 10; // 1 decimal place

    substats.push({
      effectType: chosen.effectType,
      value: value,
      label: `${chosen.label} +${value}%`,
    });
  }

  return {
    id,
    name,
    type,
    rarity,
    baseStat,
    substats,
    equippedToCharacterId: null,
  };
};

// Generate random character
export const generateCharacter = (isElite: boolean = false): Character => {
  const id = generateId();
  const firstName = sample(FIRST_NAMES);
  const lastName = sample(LAST_NAMES);
  let name = `${firstName}${lastName}`;

  if (isElite) {
    const elitePrefixes = ['【エリート】', '【極】', '【プロ】', '【伝説】', '【精鋭】', '【超】', '【神】', '【神話ランク】'];
    name = `${sample(elitePrefixes)}${name}`;
  }

  // Job selection: warrior, thief, mage with equal weights
  const jobs: JobType[] = ['warrior', 'thief', 'mage'];
  const job = sample(jobs);

  // Initial stats
  let baseAtk = 10;
  let baseDef = 5;
  let baseHp = 70;

  if (job === 'warrior') {
    baseAtk = 15;
    baseDef = 8;
    baseHp = 120;
  } else if (job === 'thief') {
    baseAtk = 10;
    baseDef = 4;
    baseHp = 80;
  } else if (job === 'mage') {
    baseAtk = 11;
    baseDef = 3;
    baseHp = 60;
  }

  let finalLevel = 1;
  if (isElite) {
    // Elite characters start with incredibly high base values and enhanced level
    finalLevel = 20 + Math.floor(Math.random() * 6); // Starts at Lv.20-25
    baseAtk = Math.round(baseAtk * 4.5);
    baseDef = Math.round(baseDef * 4.5);
    baseHp = Math.round(baseHp * 4.5);
  }

  return {
    id,
    name,
    job,
    level: finalLevel,
    baseAtk,
    baseDef,
    baseHp,
    status: 'idle',
    isElite,
    dispatchState: null,
  };
};

// Calculate deep character stats (Base + Equips + Substats + Jobs + Achievements)
export interface ComputedCharacterStats {
  totalAtk: number;
  totalDef: number;
  totalHp: number;
  totalPower: number;
  critRate: number;
  goldBonusPct: number;
  timeReductionPct: number; // capped
  weaponName: string;
  armorName: string;
}

const getFacilityLevels = (): { gym: number; forge: number; dispatch: number } => {
  try {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('極限！無限ダンジョン派遣会社_game_state_ts') : null;
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        gym: parsed.officeGymLevel || 0,
        forge: parsed.forgeUpgradeLevel || 0,
        dispatch: parsed.dispatchCenterLevel || 0,
      };
    }
  } catch (e) {
    // ignore
  }
  return { gym: 0, forge: 0, dispatch: 0 };
};

export const computeCharacterStats = (
  character: Character,
  inventory: Equipment[],
  companyWideAtkBuffPct: number
): ComputedCharacterStats => {
  const { gym: gymLevel, forge: forgeLevel, dispatch: dispatchLevel } = getFacilityLevels();

  // 1. Fetch equipped items
  const weapon = inventory.find(
    (item) => item.equippedToCharacterId === character.id && item.type === 'weapon'
  );
  const armor = inventory.find(
    (item) => item.equippedToCharacterId === character.id && item.type === 'armor'
  );

  // 2. Base Character Level Stats
  // Scale bases linearly with level
  const lvlMultiplier = 1 + (character.level - 1) * 0.15; // +15% per level
  const gymMultiplier = 1 + (gymLevel * 0.03); // +3% character stats globally per level of training gym
  const currentBaseAtk = character.baseAtk * lvlMultiplier * gymMultiplier;
  const currentBaseDef = character.baseDef * lvlMultiplier * gymMultiplier;
  const currentBaseHp = (character.baseHp || 70) * lvlMultiplier * gymMultiplier;

  // 3. Flat additions from gears
  const forgeMultiplier = 1 + (forgeLevel * 0.03); // +3% flat stat effect per forge level
  const flatWeaponAtk = weapon ? Math.round(weapon.baseStat * forgeMultiplier) : 0;
  const flatArmorDef = armor ? Math.round(armor.baseStat * forgeMultiplier) : 0;
  const flatArmorHp = armor ? Math.round(armor.baseStat * 4 * forgeMultiplier) : 0;

  // 4. Gather Substats from both equipment
  let itemAtkPct = 0;
  let itemGoldPct = 0;
  let itemTimeDec = 0;
  let itemCritRate = 0;

  const activeGears = [weapon, armor].filter(Boolean) as Equipment[];
  activeGears.forEach((gear) => {
    gear.substats.forEach((sub) => {
      switch (sub.effectType) {
        case 'atk_pct':
          itemAtkPct += sub.value;
          break;
        case 'gold_pct':
          itemGoldPct += sub.value;
          break;
        case 'time_dec':
          itemTimeDec += sub.value;
          break;
        case 'crit_rate':
          itemCritRate += sub.value;
          break;
      }
    });
  });

  // 5. Job intrinsic bonuses
  let jobAtkMultiplier = 1.0;
  let jobTimeMultiplier = 1.0;

  if (character.job === 'warrior') {
    jobAtkMultiplier = 1.5; // +50% total ATK bonus
  } else if (character.job === 'mage') {
    jobTimeMultiplier = 1.25; // Dispatch time reduces easily (handled in time reduction calculation)
  }

  // 6. Compute composite stats
  // Attack formula: (Base Level ATK + Equipped Weapon ATK) * Job ATK multiplier * Item ATK multiplier * Achievement Multiplier
  const basePlusGearsAtk = currentBaseAtk + flatWeaponAtk;
  const achievementMultiplier = 1 + companyWideAtkBuffPct / 100;
  const itemAtkMultiplier = 1 + itemAtkPct / 100;

  // Elite employee multiplier (1.5x stats)
  const eliteMultiplier = character.isElite ? 1.5 : 1.0;

  const totalAtk = Math.round(
    basePlusGearsAtk * jobAtkMultiplier * itemAtkMultiplier * achievementMultiplier * eliteMultiplier
  );

  // Defense formula
  const totalDef = Math.round((currentBaseDef + flatArmorDef) * eliteMultiplier);

  // HP formula
  const totalHp = Math.round((currentBaseHp + flatArmorHp) * eliteMultiplier);

  // Combat Power / Strength Rating (戦力) formula: HP + ATK * 4 + DEF * 6
  const totalPower = Math.round(totalHp + totalAtk * 4 + totalDef * 6);

  // Crit rate: Base is 5% + item bonuses, 25% if Elite
  const baseCrit = character.isElite ? 25 : 5;
  const maxCrit = character.isElite ? 95 : 85;
  const critRate = Math.min(baseCrit + itemCritRate, maxCrit);

  // Gold bonus: Item bonus
  let goldBonusPct = itemGoldPct;
  if (character.job === 'thief') {
    // Thief doesn't generate raw gold but boosts material drops by 50%!
    // Let's also give thief a minor extra gold boost of 15% to make them awesome as money-harvesters as well
    goldBonusPct += 15;
  }
  if (character.isElite) {
    goldBonusPct += 25; // Elite bonus to company budget efficiency
  }

  // Time reduction
  // Base Mage gives 25% reduction. Item gives itemTimeDec.
  let timeReductionPct = itemTimeDec;
  if (character.job === 'mage') {
    timeReductionPct += 25;
  }
  if (character.isElite) {
    timeReductionPct += 15; // Elite movement/travel speed is faster
  }
  timeReductionPct += dispatchLevel * 2; // +2% speed per dispatch hq upgrade
  timeReductionPct = Math.min(timeReductionPct, character.isElite ? 90 : 85); // Upgraded cap to prevent instant returns

  return {
    totalAtk,
    totalDef,
    totalHp,
    totalPower,
    critRate,
    goldBonusPct,
    timeReductionPct,
    weaponName: weapon ? weapon.name : '素手',
    armorName: armor ? armor.name : '普段着',
  };
};

// Calculate dispatch rewards
export interface DispatchRewardResult {
  success: boolean;
  goldEarned: number;
  ironCount: number;
  magicCount: number;
  dragonCount: number;
  ticketFound: boolean;
  itemFound: boolean;
  foundItem: Equipment | null;
  logText: string;
  isWiped: boolean;
}

export const calculateDispatchRewards = (
  character: Character,
  stats: ComputedCharacterStats,
  dungeon: any,
  deepestAbyssFloor: number
): DispatchRewardResult => {
  // Determine if dispatch is under recommended Power (戦力)
  const partyPower = stats.totalPower;
  // If dungeon is the Infinite Abyss, we scale the recommended Power dynamically based on current selected floor!
  // Note: the current selected floor was saved inside dispatchState.recommendedAtk representing recommended Power
  const targetRecPower = character.dispatchState ? character.dispatchState.recommendedAtk : dungeon.recommendAtk;

  // Simulate turn-based battle
  const maxHp = stats.totalHp;
  let currentHp = maxHp;

  const monsterPower = Math.max(10, targetRecPower - 5);
  const monsterAtk = Math.max(10, Math.round(monsterPower * 0.22));
  const monsterHp = Math.max(40, Math.round(monsterPower * 0.8));
  let currentMonsterHp = monsterHp;

  let turns = 0;
  let success = true;

  while (currentHp > 0 && currentMonsterHp > 0 && turns < 30) {
    turns++;
    // Player attacks monster
    const isCrit = Math.random() * 100 < stats.critRate;
    const playerDmg = Math.max(5, Math.round((stats.totalAtk * (isCrit ? 1.8 : 1.0) - Math.floor(monsterPower * 0.03)) * (0.9 + Math.random() * 0.2)));
    currentMonsterHp -= playerDmg;

    if (currentMonsterHp <= 0) {
      break;
    }

    // Monster attacks player
    const rawMonsterDmg = Math.max(5, monsterAtk - stats.totalDef);
    const monsterDmg = Math.round(rawMonsterDmg * (0.85 + Math.random() * 0.3));
    currentHp -= monsterDmg;
  }

  // HP hitting 0 means failure!
  if (currentHp <= 0) {
    currentHp = 0;
    success = false;
  }

  // Guarantees success if their power meets or exceeds the recommendation (avoids glass-cannon self-wipeouts)
  if (partyPower >= targetRecPower) {
    success = true;
    const powerSurplus = partyPower / Math.max(1, targetRecPower);
    if (powerSurplus >= 1.5) {
      // Overwhelmingly strong: HP remains very high (at least 85%)
      currentHp = Math.max(currentHp, Math.round(maxHp * 0.85));
    } else if (powerSurplus >= 1.2) {
      // Significantly stronger: HP remains at least 55%
      currentHp = Math.max(currentHp, Math.round(maxHp * 0.55));
    } else {
      // Adequately strong: HP remains at least 35% to prevent the close call / struggling penalty
      currentHp = Math.max(currentHp, Math.round(maxHp * 0.35));
    }
  }

  // Multiplier from thief
  const isThief = character.job === 'thief';
  const materialBonusMultiplier = isThief ? 1.5 : 1.0;

  let rewardFactor = 1.0;
  let logText = '';
  const isWiped = !success; // HP hit 0 behaves as dungeon failure!

  if (!success) {
    // If defeated / failed
    const powerRatio = partyPower / targetRecPower;
    if (powerRatio < 0.65) {
      rewardFactor = 0.1; // 10% rewards
      logText = `【警告・全滅】${character.name}は推奨戦力（${targetRecPower}）に対して自身の戦力（${partyPower}）が低すぎたため、ダンジョンの激しい攻撃でHPが0になり敗走しました！探索は「未クリア（全滅）」に終わり、報酬は10%に激減しました。`;
    } else {
      rewardFactor = 0.3; // 30% rewards
      logText = `【警告・全滅】${character.name}は戦力不足（推奨：${targetRecPower}、現在：${partyPower}）により、猛攻を受けHPが0になりました。這い上がりながら敗退し、探索は「未クリア」となりました（報酬は30%に減少）。`;
    }
  } else {
    // Check if they had a close call (e.g. survived but with < 30% HP)
    const hpRatio = currentHp / maxHp;
    if (hpRatio < 0.3) {
      rewardFactor = 0.75;
      logText = `【帰還・苦戦】${character.name}は死闘の末、残りHP極小（HP: ${currentHp}/${maxHp}）の状態で「${dungeon.name}」の探索に辛うじて成功しました！苦戦を強いられたため、獲得報酬は75%に減少しました。`;
    } else {
      logText = `【帰還】${character.name}が「${dungeon.name}」の探検を完璧に攻略して、無事にオフィスへ帰還しました！（残りHP: ${currentHp}/${maxHp}）`;
    }
  }

  // Calculate base gold reward
  let baseGold = dungeon.goldReward;
  if (dungeon.isInfinite && character.dispatchState) {
    // If infinite abyss, scales gold aggressively using floor
    // e.g. base = 500 * (1.3^floor)
    const currentFloor = Math.max(1, Math.round(targetRecPower / 1200)); // derived floor representation
    baseGold = Math.round(400 * Math.pow(1.35, currentFloor));
  }

  // Apply gear gold multiplier
  const goldBonus = 1 + stats.goldBonusPct / 100;
  const finalGold = Math.round(baseGold * rewardFactor * goldBonus);

  // Calculate materials
  let baseIron = dungeon.ironReward;
  let baseMagic = dungeon.gemReward;
  let baseDragon = dungeon.dragonReward;

  if (dungeon.isInfinite && character.dispatchState) {
    const currentFloor = Math.max(1, Math.round(targetRecPower / 1200));
    baseIron = Math.round(5 + currentFloor * 1.5);
    baseMagic = currentFloor >= 3 ? Math.round(2 + currentFloor * 0.7) : 0;
    baseDragon = currentFloor >= 8 ? Math.round(1 + currentFloor * 0.15) : 0;
  }

  const ironCount = Math.round(baseIron * rewardFactor * materialBonusMultiplier);
  const magicCount = Math.round(baseMagic * rewardFactor * materialBonusMultiplier);
  const dragonCount = Math.round(baseDragon * rewardFactor * materialBonusMultiplier);

  // Ticket introduction letter chance: base 5% + extra 5% for thief
  const ticketChance = isThief ? 0.15 : 0.06;
  const ticketFound = Math.random() < (ticketChance * rewardFactor);

  // Equipment selection probability:
  // Base chance is 45% (except if failed/wiped, down to 10%)
  const equipmentChance = success ? 0.45 : 0.10;
  const itemFound = Math.random() < equipmentChance;

  let foundItem: Equipment | null = null;
  if (itemFound) {
    // Determine rarity based on dungeon level or Abyss floor!
    // Deep Abyss floors guarantee better rarity rolls!
    let forcedRarity: RarityType | undefined;
    if (dungeon.isInfinite && character.dispatchState) {
      const currentFloor = Math.max(1, Math.round(targetRecPower / 1200));
      if (currentFloor >= 20) {
        // High floors, mostly Epic/Legendary
        const roll = Math.random();
        forcedRarity = roll < 0.25 ? 'legendary' : 'epic';
      } else if (currentFloor >= 10) {
        const roll = Math.random();
        forcedRarity = roll < 0.10 ? 'legendary' : roll < 0.6 ? 'epic' : 'rare';
      } else if (currentFloor >= 4) {
        const roll = Math.random();
        forcedRarity = roll < 0.03 ? 'legendary' : roll < 0.25 ? 'epic' : 'rare';
      }
    } else if (dungeon.id === 'dungeon_3') {
      // Dragon nest gives high chance of Epic/Rare
      const roll = Math.random();
      forcedRarity = roll < 0.05 ? 'legendary' : roll < 0.4 ? 'epic' : 'rare';
    } else if (dungeon.id === 'dungeon_2') {
      const roll = Math.random();
      forcedRarity = roll < 0.1 ? 'epic' : 'rare';
    }

    foundItem = generateEquipment(forcedRarity);
  }

  return {
    success,
    goldEarned: finalGold,
    ironCount,
    magicCount,
    dragonCount,
    ticketFound,
    itemFound,
    foundItem,
    logText,
    isWiped,
  };
};
