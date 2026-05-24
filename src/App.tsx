import React, { useState, useEffect } from 'react';
import { GameState, Character, Equipment, Dungeon } from './types';
import { CompanyHeader } from './components/CompanyHeader';
import { CharacterList } from './components/CharacterList';
import { GachaPanel } from './components/GachaPanel';
import { BlacksmithPanel } from './components/BlacksmithPanel';
import { DungeonPanel } from './components/DungeonPanel';
import { EquipmentSelector } from './components/EquipmentSelector';
import { LootClaimModal } from './components/LootClaimModal';
import { BattleMonitor } from './components/BattleMonitor';
import { OnboardingTutorial } from './components/OnboardingTutorial';
import { INITIAL_GOLD, INITIAL_TICKETS, INITIAL_ACHIEVEMENTS, INITIAL_DUNGEONS, CRAFT_RECIPES } from './constants';
import { generateCharacter, generateEquipment, computeCharacterStats, calculateDispatchRewards, getLevelUpCost } from './gameEngine';
import { Briefcase, FileSpreadsheet, Sparkles, Trophy, Trash2, HelpCircle, ShieldQuestion, ArrowRight, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Default starting characters
const DEFAULT_CHARACTERS: Character[] = [
  {
    id: 'char_starter_1',
    name: 'ハルト・スターク',
    job: 'warrior',
    level: 1,
    baseAtk: 15,
    baseDef: 8,
    baseHp: 120,
    status: 'idle',
    dispatchState: null,
  },
  {
    id: 'char_starter_2',
    name: 'エルマ・アドラー',
    job: 'mage',
    level: 1,
    baseAtk: 11,
    baseDef: 3,
    baseHp: 60,
    status: 'idle',
    dispatchState: null,
  }
];

// Default starting equipments
const DEFAULT_INVENTORY: Equipment[] = [
  {
    id: 'eq_starter_1',
    name: 'ブロンズソード',
    type: 'weapon',
    rarity: 'common',
    baseStat: 14,
    substats: [{ effectType: 'atk_pct', value: 3, label: '攻撃力% +3%' }],
    equippedToCharacterId: 'char_starter_1', // Equipped to Haruto
  },
  {
    id: 'eq_starter_2',
    name: '冒険者の服',
    type: 'armor',
    rarity: 'common',
    baseStat: 10,
    substats: [{ effectType: 'gold_pct', value: 5, label: 'ゴールド獲得% +5%' }],
    equippedToCharacterId: 'char_starter_1', // Equipped to Haruto
  },
  {
    id: 'eq_starter_3',
    name: '木刀',
    type: 'weapon',
    rarity: 'common',
    baseStat: 8,
    substats: [],
    equippedToCharacterId: null,
  },
  {
    id: 'eq_starter_4',
    name: 'ボロい服',
    type: 'armor',
    rarity: 'common',
    baseStat: 6,
    substats: [],
    equippedToCharacterId: null,
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'staff' | 'blacksmith' | 'sortie'>('home');

  // Core Game State loading / saving
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem('極限！無限ダンジョン派遣会社_game_state_ts');
      if (saved) {
        const parsed = JSON.parse(saved);
        
        // Return parsed state if formatted correct
        if (parsed.characters && parsed.inventory) {
          // Clean up any duplicate React keys that might have been saved in localStorage
          if (Array.isArray(parsed.logs)) {
            const seenIds = new Set<string>();
            parsed.logs = parsed.logs.map((log: any, idx: number) => {
              if (!log.id || seenIds.has(log.id)) {
                const uniqId = `${log.id || 'log'}_dedup_${idx}_${Math.random().toString(36).substr(2, 5)}`;
                seenIds.add(uniqId);
                return { ...log, id: uniqId };
              }
              seenIds.add(log.id);
              return log;
            });
          }
          // Inject default upgrades if undefined in existing saves
          parsed.officeGymLevel = parsed.officeGymLevel ?? 0;
          parsed.forgeUpgradeLevel = parsed.forgeUpgradeLevel ?? 0;
          parsed.dispatchCenterLevel = parsed.dispatchCenterLevel ?? 0;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load localStorage state, starting fresh', e);
    }

    // Default Starting State
    const stamp = new Date().toLocaleTimeString();
    return {
      gold: INITIAL_GOLD,
      totalGoldEarned: INITIAL_GOLD,
      tickets: INITIAL_TICKETS,
      autoSalesLevel: 1,
      ironOre: 15,
      magicStone: 2,
      dragonScale: 0,
      characters: DEFAULT_CHARACTERS,
      inventory: DEFAULT_INVENTORY,
      unlockedDungeonIds: ['dungeon_1'],
      deepestAbyssFloor: 1,
      dispatchCount: 0,
      achievements: INITIAL_ACHIEVEMENTS,
      officeGymLevel: 0,
      forgeUpgradeLevel: 0,
      dispatchCenterLevel: 0,
      logs: [
        {
          id: 'log_init',
          timestamp: stamp,
          text: '『極限！無限ダンジョン派遣会社』設立！本日から営業を開始します。最初の所属冒険者2名「ハルト(戦士)」と「エルマ(魔術師)」がオフィスに従属中。',
          type: 'info',
        }
      ],
    };
  });

  // Onboarding Tutorial States
  const [tutorialStep, setTutorialStep] = useState<number>(0);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('極限！無限ダンジョン派遣会社_tutorial_enabled_v2');
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  // Target Equipment Selector States
  const [eqSelectorConfig, setEqSelectorConfig] = useState<{
    characterId: string;
    type: 'weapon' | 'armor';
  } | null>(null);

  // Loot Claim Display States
  const [activeLoot, setActiveLoot] = useState<{
    charName: string;
    dungeonName: string;
    goldEarned: number;
    ironCount: number;
    magicCount: number;
    dragonCount: number;
    ticketFound: boolean;
    foundItem: Equipment | null;
    success?: boolean;
  } | null>(null);

  // Tick timers for active dispatches and Sales Income
  useEffect(() => {
    const mainTimer = setInterval(() => {
      setGameState((prev) => {
        // Compute Sales power auto income (increases client-side bank gold)
        const incomePerSec = prev.autoSalesLevel * 3;
        
        let nextGold = prev.gold + incomePerSec;
        let nextTotalEarned = prev.totalGoldEarned + incomePerSec;
        let nextIron = prev.ironOre;
        let nextMagic = prev.magicStone;
        let nextDragon = prev.dragonScale;
        let nextTickets = prev.tickets;
        let finalInventory = [...prev.inventory];
        let nextAbyssRecord = prev.deepestAbyssFloor;
        let nextDispatchCount = prev.dispatchCount;
        let outcomeLogs: any[] = [];

        // 1. Compute total company wide permanent combat multiplier for stats calculation
        const companyWideAtkBuffPct = prev.achievements
          .filter((ach) => ach.unlocked)
          .reduce((sum, ach) => sum + ach.buffValue, 0);

        // 2. Map characters, checking if they have finished their dispatch and have autoLoop or autoAbyss enabled
        const updatedCharacters = prev.characters.map((char) => {
          if (
            char.status === 'dispatched' &&
            char.dispatchState &&
            Date.now() >= char.dispatchState.returnTime &&
            (char.dispatchState.autoLoop || char.dispatchState.autoAbyss)
          ) {
            // Recalculate stats at dispatch complete
            const activeStats = computeCharacterStats(char, finalInventory, companyWideAtkBuffPct);
            
            let selectedDungeonObj: any = INITIAL_DUNGEONS.find((d) => d.id === char.dispatchState?.dungeonId);
            if (!selectedDungeonObj && char.dispatchState?.dungeonId.startsWith('dungeon_infinite')) {
              selectedDungeonObj = {
                id: char.dispatchState.dungeonId,
                name: '極限の奈落',
                isInfinite: true,
                ironReward: 5,
                gemReward: 1,
                dragonReward: 0,
                goldReward: 400,
              };
            }

            if (selectedDungeonObj) {
              const results = calculateDispatchRewards(
                char,
                activeStats,
                selectedDungeonObj,
                nextAbyssRecord
              );

              // Accrue rewards
              nextGold += results.goldEarned;
              nextTotalEarned += results.goldEarned;
              nextIron += results.ironCount;
              nextMagic += results.magicCount;
              nextDragon += results.dragonCount;
              if (results.ticketFound) {
                nextTickets += 1;
              }

              if (results.foundItem) {
                finalInventory.push(results.foundItem);
              }

              if (selectedDungeonObj.isInfinite && char.dispatchState && results.success) {
                const completedFloor = Math.max(1, Math.round((char.dispatchState.recommendedAtk - 4000) / 8000));
                if (completedFloor >= nextAbyssRecord) {
                  nextAbyssRecord = completedFloor + 1;
                }
              }

              nextDispatchCount += 1;

              // Compose autoLoop / autoAbyss operational log records
              const nowStamp = new Date().toLocaleTimeString();
              
              let rewardsSummary = `🪙+${results.goldEarned}G`;
              if (results.ironCount > 0) rewardsSummary += `、🪨鉄鉱石+${results.ironCount}`;
              if (results.magicCount > 0) rewardsSummary += `、🔮魔導石+${results.magicCount}`;
              if (results.dragonCount > 0) rewardsSummary += `、🐉竜の鱗+${results.dragonCount}`;

              if (results.success) {
                outcomeLogs.push({
                  id: `log_auto_result_${char.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                  timestamp: nowStamp,
                  text: char.dispatchState.autoAbyss 
                    ? `🧗 【奈落自動制覇】「${char.name}」が「極限の奈落」の階層を見事にクリア！ (報酬: ${rewardsSummary})`
                    : `🔄 【自動周回報酬】「${char.name}」が「${selectedDungeonObj.name}」より無事帰還！ (報酬: ${rewardsSummary})`,
                  type: 'success',
                });
              } else {
                outcomeLogs.push({
                  id: `log_auto_result_${char.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                  timestamp: nowStamp,
                  text: char.dispatchState.autoAbyss 
                    ? `💀 【奈落自動全滅】「${char.name}」が「極限の奈落」の階層で全滅・敗北しました。(回収した部分報酬: ${rewardsSummary})`
                    : `💀 【自動周回全滅】「${char.name}」が「${selectedDungeonObj.name}」で全滅・敗北しました。(回収した部分報酬: ${rewardsSummary})`,
                  type: 'warn',
                });
              }

              if (results.foundItem) {
                outcomeLogs.push({
                  id: `log_auto_loot_${char.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                  timestamp: nowStamp,
                  text: `🎁 【自動攻略武具】「${char.name}」が「${results.foundItem.name} (${results.foundItem.rarity})」を発見しました！`,
                  type: 'reward',
                });
              }

              if (results.ticketFound) {
                outcomeLogs.push({
                  id: `log_auto_ticket_${char.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                  timestamp: nowStamp,
                  text: `🎫 【自動攻略幸運】「${char.name}」が人材紹介状を1枚発見しました！`,
                  type: 'reward',
                });
              }

              // Re-dispatch logic based on active mode
              if (char.dispatchState.autoAbyss) {
                const completedFloor = Math.max(1, Math.round((char.dispatchState.recommendedAtk - 4000) / 8000));
                
                if (results.success) {
                  // Climb to next floor!
                  const nextFloor = completedFloor + 1;
                  const nextRecommendAtk = 4000 + nextFloor * 8000;
                  const nextDurationSec = 10 + Math.round(nextFloor * 1.5);
                  const reductionMultiplier = 1 - activeStats.timeReductionPct / 100;
                  const nextDurationMs = Math.max(2, Math.round(nextDurationSec * reductionMultiplier)) * 1000;
                  const refreshedNow = Date.now();
                  const refreshedReturnTime = refreshedNow + nextDurationMs;

                  outcomeLogs.push({
                    id: `log_abyss_advance_${char.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    timestamp: nowStamp,
                    text: `🧗 【奈落自動進撃】「${char.name}」が 第 ${completedFloor} 階層を突破！ 自動進撃により次の「第 ${nextFloor} 階層」（推奨戦力: ${nextRecommendAtk}）に向けて連続出撃しました！(完了まで: ${Math.round(nextDurationMs / 1000)}秒)`,
                    type: 'info',
                  });

                  return {
                    ...char,
                    status: 'dispatched' as const,
                    dispatchState: {
                      ...char.dispatchState,
                      startTime: refreshedNow,
                      duration: nextDurationMs,
                      returnTime: refreshedReturnTime,
                      recommendedAtk: nextRecommendAtk,
                    },
                  };
                } else {
                  // Defeated on auto climb: bring back to guild as idle and stop autoAbyss climb
                  outcomeLogs.push({
                    id: `log_abyss_fail_${char.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    timestamp: nowStamp,
                    text: `💀 【奈落進撃ストップ】「${char.name}」が 第 ${completedFloor} 階層で全滅したためオート攻略を自動停止し、オフィスに帰還しました。`,
                    type: 'warn',
                  });

                  return {
                    ...char,
                    status: 'idle' as const,
                    dispatchState: null,
                  };
                }
              } else {
                // Regular Auto Loop behavior: Re-issue dispatch instantly with identical specifications
                const refreshedNow = Date.now();
                const refreshedReturnTime = refreshedNow + char.dispatchState.duration;

                outcomeLogs.push({
                  id: `log_auto_relaunch_${char.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                  timestamp: nowStamp,
                  text: `🚀 【自動周回出撃】「${char.name}」は連続周回指示に基づき「${selectedDungeonObj.name}」へ再出撃しました。(帰還時刻: ${new Date(refreshedReturnTime).toLocaleTimeString()})`,
                  type: 'info',
                });

                return {
                  ...char,
                  status: 'dispatched' as const,
                  dispatchState: {
                    ...char.dispatchState,
                    startTime: refreshedNow,
                    returnTime: refreshedReturnTime,
                  },
                };
              }
            }
          }
          return char;
        });

        // 3. Check and unlock accomplishments dynamically on real-time ticking
        const updatedAchievements = prev.achievements.map((ach) => {
          if (ach.unlocked) return ach;

          // Milestone check
          let matches = false;
          if (ach.targetType === 'gold_total' && nextTotalEarned >= ach.targetCount) {
            matches = true;
          } else if (ach.targetType === 'legendary_count') {
            const legCount = finalInventory.filter((eq) => eq.rarity === 'legendary').length;
            if (legCount >= ach.targetCount) matches = true;
          } else if (ach.targetType === 'level_total') {
            const lvlSum = updatedCharacters.reduce((sum, c) => sum + c.level, 0);
            if (lvlSum >= ach.targetCount) matches = true;
          } else if (ach.targetType === 'dispatch_count' && nextDispatchCount >= ach.targetCount) {
            matches = true;
          } else if (ach.targetType === 'deepest_floor' && nextAbyssRecord >= ach.targetCount) {
            matches = true;
          }

          if (matches) {
            // Append log notifying the grand unlock
            outcomeLogs.unshift({
              id: `log_ach_unlock_${ach.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              timestamp: new Date().toLocaleTimeString(),
              text: `👑 社内功績達成！ 【${ach.title}】が解放されました！全社員の戦闘力が永続的に +${ach.buffValue}% 向上します。`,
              type: 'reward',
            });
            return { ...ach, unlocked: true };
          }
          return ach;
        });

        // Save into local storage
        const nextState = {
          ...prev,
          gold: nextGold,
          totalGoldEarned: nextTotalEarned,
          ironOre: nextIron,
          magicStone: nextMagic,
          dragonScale: nextDragon,
          tickets: nextTickets,
          characters: updatedCharacters,
          inventory: finalInventory,
          deepestAbyssFloor: nextAbyssRecord,
          dispatchCount: nextDispatchCount,
          achievements: updatedAchievements,
          logs: [...outcomeLogs, ...prev.logs],
        };

        try {
          localStorage.setItem('極限！無限ダンジョン派遣会社_game_state_ts', JSON.stringify(nextState));
        } catch {}

        return nextState;
      });
    }, 1000);

    return () => clearInterval(mainTimer);
  }, []);

  // Onboarding Tutorial Auto-Advancer Effect based on active tabs
  useEffect(() => {
    if (!showTutorial) return;

    if (tutorialStep === 0 && activeTab === 'staff') {
      setTutorialStep(1);
    } else if (tutorialStep === 1 && activeTab === 'sortie') {
      setTutorialStep(2);
    }
  }, [activeTab, tutorialStep, showTutorial]);

  // Compute total company wide permanent combat multiplier
  const companyWideAtkBuffPct = gameState.achievements
    .filter((ach) => ach.unlocked)
    .reduce((sum, ach) => sum + ach.buffValue, 0);

  // Upgrade Sales Level action (Gold automatic income)
  const handleUpgradeSales = () => {
    const upgradeCost = gameState.autoSalesLevel * 300 + 400;
    if (gameState.gold < upgradeCost) return;

    setGameState((prev) => {
      const nextLevel = prev.autoSalesLevel + 1;
      const nextGold = prev.gold - upgradeCost;
      const stamp = new Date().toLocaleTimeString();

      const newLogs = [
        {
          id: `log_sales_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          timestamp: stamp,
          text: `📈 社長の経営営業力が強化され、Lv.${nextLevel} に上がりました！自動資金調達能力が +${nextLevel * 3}G/秒 に増強されます。`,
          type: 'success',
        },
        ...prev.logs,
      ];

      return {
        ...prev,
        gold: nextGold,
        autoSalesLevel: nextLevel,
        logs: newLogs,
      };
    });
  };

  // Recruit Gacha Action
  const handleRollGacha = (useTicket: boolean): { character: Character; cost: number } | null => {
    const cost = useTicket ? 1 : 500;
    if (useTicket && gameState.tickets < 1) return null;
    if (!useTicket && gameState.gold < 500) return null;

    const newChar = generateCharacter(useTicket);
    const stamp = new Date().toLocaleTimeString();

    setGameState((prev) => {
      const updatedGold = useTicket ? prev.gold : prev.gold - 500;
      const updatedTickets = useTicket ? prev.tickets - 1 : prev.tickets;
      const updatedChars = [...prev.characters, newChar];

      // Formulate visual log entry
      const jobCaption = newChar.job === 'warrior' ? '戦士' : newChar.job === 'thief' ? 'シーフ' : '魔術師';
      const recruitSource = useTicket 
        ? '🎫【超特選紹介状】より最高峰の能力を兼ね備えたエリート社員' 
        : '🤝【一般中途採用】より新進気鋭の冒険者';
      const newLogs = [
        {
          id: `log_rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          timestamp: stamp,
          text: `🤝 社員採用: ${recruitSource}「${newChar.name} (${jobCaption})」が応募し、即戦力（Lv.${newChar.level}）として当社に配属されました！`,
          type: 'success' as const,
        },
        ...prev.logs,
      ];

      return {
        ...prev,
        gold: updatedGold,
        tickets: updatedTickets,
        characters: updatedChars,
        logs: newLogs,
      };
    });

    return { character: newChar, cost };
  };

  // Level Up Staff Action (Training)
  const handleLevelUpCharacter = (charId: string, levelsToRaise: number = 1) => {
    const character = gameState.characters.find((c) => c.id === charId);
    if (!character || character.status !== 'idle') return;

    let totalCost = 0;
    let tempLevel = character.level;
    for (let i = 0; i < levelsToRaise; i++) {
      totalCost += getLevelUpCost(tempLevel);
      tempLevel += 1;
    }

    if (gameState.gold < totalCost) return;

    setGameState((prev) => {
      const updatedChars = prev.characters.map((char) => {
        if (char.id === charId) {
          return {
            ...char,
            level: char.level + levelsToRaise,
          };
        }
        return char;
      });

      const stamp = new Date().toLocaleTimeString();
      const nextGold = prev.gold - totalCost;

      const newLogs = [
        {
          id: `log_lvl_${charId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          timestamp: stamp,
          text: `💪 従業員訓練: 「${character.name}」がスキル訓練課程を修了し、レベルが ${character.level + levelsToRaise} に向上しました（+${levelsToRaise}Lv、消費:${totalCost}G）！攻撃力・防御力が向上します。`,
          type: 'success' as const,
        },
        ...prev.logs,
      ];

      return {
        ...prev,
        gold: nextGold,
        characters: updatedChars,
        logs: newLogs,
      };
    });
  };

  // Dismiss Employee Action (Dismiss check)
  const handleDismissCharacter = (charId: string) => {
    const character = gameState.characters.find((c) => c.id === charId);
    if (!character || character.status !== 'idle') return;

    setGameState((prev) => {
      // Strip items out of equipped inventory so items are not deleted with the fired character!
      const updatedInventory = prev.inventory.map((item) => {
        if (item.equippedToCharacterId === charId) {
          return { ...item, equippedToCharacterId: null };
        }
        return item;
      });

      const updatedChars = prev.characters.filter((char) => char.id !== charId);
      const stamp = new Date().toLocaleTimeString();

      const newLogs = [
        {
          id: `log_dismiss_${charId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          timestamp: stamp,
          text: `💼 人員削減: 従業員「${character.name}」との雇用契約を解除し、円満に会社を卒業（自己都合退職）しました。`,
          type: 'warn',
        },
        ...prev.logs,
      ];

      return {
        ...prev,
        gold: prev.gold + 300,
        characters: updatedChars,
        inventory: updatedInventory,
        logs: newLogs,
      };
    });
  };

  // Equipment Equip/Swap action
  const handleEquipItem = (charId: string, equipmentId: string | null, type: 'weapon' | 'armor') => {
    setGameState((prev) => {
      // 1. Strip pre-existing gear from this custom character
      let nextInventory = prev.inventory.map((item) => {
        if (item.equippedToCharacterId === charId && item.type === type) {
          return { ...item, equippedToCharacterId: null };
        }
        return item;
      });

      // 2. Equip new item (if any choice is made)
      if (equipmentId) {
        // Also strip chosen item from whoever owned it previously so double equip conflicts don't occur
        nextInventory = nextInventory.map((item) => {
          if (item.id === equipmentId) {
            return { ...item, equippedToCharacterId: charId };
          }
          return item;
        });
      }

      const targetChar = prev.characters.find((c) => c.id === charId);
      const chosenItem = prev.inventory.find((i) => i.id === equipmentId);
      const stamp = new Date().toLocaleTimeString();

      const newLogs = [
        {
          id: `log_equip_${charId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          timestamp: stamp,
          text: `⚙️ 装備調整: ${targetChar?.name} が新たな防具・兵装として「${
            chosenItem ? chosenItem.name : '素手・普段着'
          }」を配備しました。`,
          type: 'info',
        },
        ...prev.logs,
      ];

      return {
        ...prev,
        inventory: nextInventory,
        logs: newLogs,
      };
    });
  };

  // Blacksmith craft weapon/armor
  const handleCraftItem = (recipeId: string, itemType: 'weapon' | 'armor'): Equipment | null => {
    const recipe = CRAFT_RECIPES.find((r) => r.id === recipeId);

    if (!recipe) return null;

    // Generate new item
    const newItem = generateEquipment(recipe.rarity, itemType);
    const stamp = new Date().toLocaleTimeString();

    setGameState((prev) => {
      const nextGold = prev.gold - recipe.goldCost;
      const nextIron = prev.ironOre - recipe.ironCost;
      const nextMagic = prev.magicStone - recipe.magicCost;
      const nextDragon = prev.dragonScale - recipe.dragonCost;

      const updatedInventory = [...prev.inventory, newItem];

      const newLogs = [
        {
          id: `log_craft_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          timestamp: stamp,
          text: `🔨 鍛冶製造: 職人工房にて新たな武具「${newItem.name}」の鍛造に成功しました！（レア度:${newItem.rarity}）`,
          type: 'reward',
        },
        ...prev.logs,
      ];

      return {
        ...prev,
        gold: nextGold,
        ironOre: nextIron,
        magicStone: nextMagic,
        dragonScale: nextDragon,
        inventory: updatedInventory,
        logs: newLogs,
      };
    });

    return newItem;
  };

  // Bulk Dismantle Equipment Action
  const handleBulkDismantleIds = (itemIds: string[]) => {
    setGameState((prev) => {
      const itemsToDismantle = prev.inventory.filter(
        (i) => itemIds.includes(i.id) && !i.equippedToCharacterId
      );
      if (itemsToDismantle.length === 0) return prev;

      let totalGold = 0;
      let totalIron = 0;
      let totalMagic = 0;
      let totalDragon = 0;

      itemsToDismantle.forEach((item) => {
        switch (item.rarity) {
          case 'common':
            totalGold += 80;
            totalIron += 3;
            break;
          case 'rare':
            totalGold += 350;
            totalIron += 8;
            totalMagic += 1;
            break;
          case 'epic':
            totalGold += 1800;
            totalIron += 20;
            totalMagic += 6;
            totalDragon += 1;
            break;
          case 'legendary':
            totalGold += 5000;
            totalIron += 45;
            totalMagic += 15;
            totalDragon += 3;
            break;
        }
      });

      const updatedInventory = prev.inventory.filter(
        (item) => !itemIds.includes(item.id)
      );

      const stamp = new Date().toLocaleTimeString();
      const newLogs = [
        {
          id: `log_bulk_dis_${Date.now()}`,
          timestamp: stamp,
          text: `♻️ 一括武具分解: 被選択武具をおおどうぐそうこより ${itemsToDismantle.length}個 一括解体しました。 （獲得: +${totalGold}G、+${totalIron}鉄、+${totalMagic}結晶、+${totalDragon}逆鱗）`,
          type: 'info' as const,
        },
        ...prev.logs,
      ];

      return {
        ...prev,
        gold: prev.gold + totalGold,
        ironOre: prev.ironOre + totalIron,
        magicStone: prev.magicStone + totalMagic,
        dragonScale: prev.dragonScale + totalDragon,
        inventory: updatedInventory,
        logs: newLogs,
      };
    });
  };

  // Dismantle Equipment Action
  const handleDismantleItem = (itemId: string) => {
    const item = gameState.inventory.find((i) => i.id === itemId);
    if (!item || item.equippedToCharacterId) return null;

    // determine rewards
    let goldReward = 0;
    let ironReward = 0;
    let magicReward = 0;
    let dragonReward = 0;

    switch (item.rarity) {
      case 'common':
        goldReward = 80;
        ironReward = 3;
        break;
      case 'rare':
        goldReward = 350;
        ironReward = 8;
        magicReward = 1;
        break;
      case 'epic':
        goldReward = 1800;
        ironReward = 20;
        magicReward = 6;
        dragonReward = 1;
        break;
      case 'legendary':
        goldReward = 5000;
        ironReward = 45;
        magicReward = 15;
        dragonReward = 3;
        break;
    }

    const stamp = new Date().toLocaleTimeString();

    setGameState((prev) => {
      const updatedInventory = prev.inventory.filter((i) => i.id !== itemId);
      const nextGold = prev.gold + goldReward;
      const nextIron = prev.ironOre + ironReward;
      const nextMagic = prev.magicStone + magicReward;
      const nextDragon = prev.dragonScale + dragonReward;

      const newLogs = [
        {
          id: `log_dis_${itemId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          timestamp: stamp,
          text: `♻️ 武具分解: 不要品「${item.name}」を分解し、解体資材（+${goldReward}G、+${ironReward}鉄、+${magicReward}結晶、+${dragonReward}逆鱗）を回収しました。`,
          type: 'info',
        },
        ...prev.logs,
      ];

      return {
        ...prev,
        gold: nextGold,
        ironOre: nextIron,
        magicStone: nextMagic,
        dragonScale: nextDragon,
        inventory: updatedInventory,
        logs: newLogs,
      };
    });

    return { goldReward, ironReward, magicReward, dragonReward };
  };

  // Apply facility upgrade using Iron Ore and Magic Crystals
  const handleApplyUpgrade = (facility: 'gym' | 'forge' | 'dispatch', ironCost: number, magicCost: number, goldCost: number) => {
    setGameState((prev) => {
      if (prev.ironOre < ironCost || prev.magicStone < magicCost || prev.gold < goldCost) {
        return prev;
      }

      let nextGym = prev.officeGymLevel || 0;
      let nextForge = prev.forgeUpgradeLevel || 0;
      let nextDispatch = prev.dispatchCenterLevel || 0;

      if (facility === 'gym') nextGym += 1;
      else if (facility === 'forge') nextForge += 1;
      else if (facility === 'dispatch') nextDispatch += 1;

      const stamp = new Date().toLocaleTimeString();
      const facilityName = facility === 'gym' ? '【鉄甲物理トレーニング室】' : facility === 'forge' ? '【魔導共鳴・鍛造高速炉】' : '【魔気圧推進・作戦指揮所】';
      const newLogs = [
        {
          id: `log_upg_${Date.now()}`,
          timestamp: stamp,
          text: `🏢 設備投資完了: ${facilityName} の設備技術を強化しました！ (現在：Lv.${facility === 'gym' ? nextGym : facility === 'forge' ? nextForge : nextDispatch})`,
          type: 'success' as const,
        },
        ...prev.logs,
      ];

      return {
        ...prev,
        gold: prev.gold - goldCost,
        ironOre: prev.ironOre - ironCost,
        magicStone: prev.magicStone - magicCost,
        officeGymLevel: nextGym,
        forgeUpgradeLevel: nextForge,
        dispatchCenterLevel: nextDispatch,
        logs: newLogs,
      };
    });
  };

  // Convert/Transmute materials inside the alchemy engine
  const handleApplyTransmute = (
    type: 'iron_to_gold' | 'magic_to_gold' | 'create_ticket' | 'create_scale',
    ironCost: number,
    magicCost: number,
    goldCost: number,
    goldYield: number,
    ticketYield: number,
    scaleYield: number
  ) => {
    setGameState((prev) => {
      if (prev.ironOre < ironCost || prev.magicStone < magicCost || prev.gold < goldCost) {
        return prev;
      }

      const stamp = new Date().toLocaleTimeString();
      const typeLabel =
        type === 'iron_to_gold' ? 'てっこうせきの金解融解' :
        type === 'magic_to_gold' ? 'まほう結晶の金解融解' :
        type === 'create_ticket' ? '極限物質創生(紹介状)' : '竜の逆鱗魔核収束';

      const rewardsText = [
        goldYield > 0 ? `🪙 +${goldYield}G` : '',
        ticketYield > 0 ? `🎫 +${ticketYield}枚` : '',
        scaleYield > 0 ? `🦖 +${scaleYield}個` : ''
      ].filter(Boolean).join(', ');

      const newLogs = [
        {
          id: `log_trans_${Date.now()}`,
          timestamp: stamp,
          text: `🧪 錬金釜発動: 「${typeLabel}」により、余剰素材を還元しました！ (獲得: ${rewardsText})`,
          type: 'reward' as const,
        },
        ...prev.logs,
      ];

      return {
        ...prev,
        gold: prev.gold - goldCost + goldYield,
        ironOre: prev.ironOre - ironCost,
        magicStone: prev.magicStone - magicCost,
        tickets: prev.tickets + ticketYield,
        dragonScale: prev.dragonScale + scaleYield,
        logs: newLogs,
      };
    });
  };

  // Dispatch employee to Dungeon Stage
  const handleLaunchDispatch = (
    charId: string,
    dungeonId: string,
    recommendedAtk: number,
    durationMs: number,
    autoLoop: boolean = false,
    autoAbyss: boolean = false
  ) => {
    const now = Date.now();
    const returnTime = now + durationMs;

    setGameState((prev) => {
      const updatedChars = prev.characters.map((char) => {
        if (char.id === charId) {
          return {
            ...char,
            status: 'dispatched' as const,
            dispatchState: {
              dungeonId,
              startTime: now,
              duration: durationMs,
              returnTime,
              recommendedAtk,
              partyAtk: 0, // setup
              autoLoop,
              autoAbyss,
            },
          };
        }
        return char;
      });

      const targetChar = prev.characters.find((c) => c.id === charId);
      const targetDungeon = INITIAL_DUNGEONS.find((d) => d.id === dungeonId) || { name: '極限の奈落' };

      const stamp = new Date().toLocaleTimeString();
      const newLogs = [
        {
          id: `log_disp_${charId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          timestamp: stamp,
          text: `🚀 部隊出撃: 「${targetChar?.name}」がダンジョン「${targetDungeon.name}」に向けて出撃しました！（帰還予定時刻: ${new Date(
            returnTime
          ).toLocaleTimeString()}）`,
          type: 'info',
        },
        ...prev.logs,
      ];

      return {
        ...prev,
        characters: updatedChars,
        logs: newLogs,
      };
    });

    // Auto-navigate to home screen to reveal the live BattleMonitor and progress tutorial
    if (showTutorial && tutorialStep === 2) {
      setTutorialStep(3);
    }
    setActiveTab('home');
  };

  // Toggle autoLoop state on active dispatch or idle character
  const handleToggleAutoLoop = (charId: string) => {
    setGameState((prev) => {
      let logPayload: any = null;
      const updatedChars = prev.characters.map((char) => {
        if (char.id === charId) {
          if (char.dispatchState) {
            const nextVal = !char.dispatchState.autoLoop;
            
            // Log the change
            logPayload = {
              id: `log_autoloop_toggle_${charId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              timestamp: new Date().toLocaleTimeString(),
              text: `🔄 設定更新: 「${char.name}」の自動周回モードを「${nextVal ? '有効 (ON)' : '無効 (OFF)'}」に切り替えました。`,
              type: 'info',
            };

            return {
              ...char,
              dispatchState: {
                ...char.dispatchState,
                autoLoop: nextVal,
                autoAbyss: nextVal ? false : char.dispatchState.autoAbyss, // Mutually exclusive
              },
            };
          }
        }
        return char;
      });

      return {
        ...prev,
        characters: updatedChars,
        logs: logPayload ? [logPayload, ...prev.logs] : prev.logs,
      };
    });
  };

  // Toggle autoAbyss state on active dispatch or idle character
  const handleToggleAutoAbyss = (charId: string) => {
    setGameState((prev) => {
      let logPayload: any = null;
      const updatedChars = prev.characters.map((char) => {
        if (char.id === charId) {
          if (char.dispatchState) {
            const nextVal = !char.dispatchState.autoAbyss;
            
            // Log the change
            logPayload = {
              id: `log_autoabyss_toggle_${charId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              timestamp: new Date().toLocaleTimeString(),
              text: `🧗 設定更新: 「${char.name}」の極限の奈落自動進撃モードを「${nextVal ? '有効 (ON)' : '無効 (OFF)'}」に切り替えました。`,
              type: 'info',
            };

            return {
              ...char,
              dispatchState: {
                ...char.dispatchState,
                autoAbyss: nextVal,
                autoLoop: nextVal ? false : char.dispatchState.autoLoop, // Mutually exclusive
              },
            };
          }
        }
        return char;
      });

      return {
        ...prev,
        characters: updatedChars,
        logs: logPayload ? [logPayload, ...prev.logs] : prev.logs,
      };
    });
  };

  // Claim dispatch output rewards (Dopamine Trigger!)
  const handleClaimDispatchRewards = (charId: string) => {
    const character = gameState.characters.find((c) => c.id === charId);
    if (!character || character.status !== 'dispatched' || !character.dispatchState) return;

    // Pre-calculated properties
    const activeStats = computeCharacterStats(character, gameState.inventory, companyWideAtkBuffPct);
    
    // Choose correct dungeon description (Static vs Abyss)
    let selectedDungeonObj: any = INITIAL_DUNGEONS.find((d) => d.id === character.dispatchState?.dungeonId);
    if (!selectedDungeonObj && character.dispatchState?.dungeonId.startsWith('dungeon_infinite')) {
      // is infinite dungeon abyss
      selectedDungeonObj = {
        name: '極限の奈落',
        isInfinite: true,
        ironReward: 5,
        gemReward: 1,
        dragonReward: 0,
        goldReward: 400,
      };
    }

    if (!selectedDungeonObj) return;

    const results = calculateDispatchRewards(
      character,
      activeStats,
      selectedDungeonObj,
      gameState.deepestAbyssFloor
    );

    // Apply outcomes to state
    setGameState((prev) => {
      // Remove character from dispatch status
      const updatedChars = prev.characters.map((char) => {
        if (char.id === charId) {
          return {
            ...char,
            status: 'idle' as const,
            dispatchState: null,
          };
        }
        return char;
      });

      // Update gold & materials
      const nextGold = prev.gold + results.goldEarned;
      const nextTotalEarned = prev.totalGoldEarned + results.goldEarned;
      const nextIron = prev.ironOre + results.ironCount;
      const nextMagic = prev.magicStone + results.magicCount;
      const nextDragon = prev.dragonScale + results.dragonCount;
      const nextTickets = results.ticketFound ? prev.tickets + 1 : prev.tickets;

      // Update equipment inventory if item found
      const finalInventory = results.foundItem ? [...prev.inventory, results.foundItem] : prev.inventory;

      // If Infinite Dungeon, check if Abyss floor surpassed limit records AND they successfully cleared the level
      let nextAbyssRecord = prev.deepestAbyssFloor;
      if (selectedDungeonObj.isInfinite && character.dispatchState && results.success) {
        // Derive floor from recommendedAtk inside dispatchState: floor * 8000 + 4000
        const completedFloor = Math.max(1, Math.round((character.dispatchState.recommendedAtk - 4000) / 8000));
        if (completedFloor >= nextAbyssRecord) {
          nextAbyssRecord = completedFloor + 1; // Unlocks next floor!
        }
      }

      // Generate visual log element
      const stamp = new Date().toLocaleTimeString();
      const outcomeLogs: {
        id: string;
        timestamp: string;
        text: string;
        type: 'info' | 'success' | 'warn' | 'reward';
      }[] = [
        {
          id: `log_result_${charId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          timestamp: stamp,
          text: results.logText,
          type: results.success ? 'success' : 'warn',
        },
      ];

      // If item was found, print detailed reward log card
      if (results.foundItem) {
        outcomeLogs.push({
          id: `log_loot_found_${charId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          timestamp: stamp,
          text: `🎁 【アイテム発掘】${character.name} が戦域より武具「${results.foundItem.name} (${results.foundItem.rarity})」を発見しました！`,
          type: 'reward' as const,
        });
      }

      if (results.ticketFound) {
        outcomeLogs.push({
          id: `log_ticket_found_${charId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          timestamp: stamp,
          text: `🎫 【レア発見】紹介紹介状が1枚見つかりました！人材紹介会社から次の社員の特別推薦を獲得できます。`,
          type: 'reward' as const,
         });
      }

      return {
        ...prev,
        gold: nextGold,
        totalGoldEarned: nextTotalEarned,
        tickets: nextTickets,
        ironOre: nextIron,
        magicStone: nextMagic,
        dragonScale: nextDragon,
        characters: updatedChars,
        inventory: finalInventory,
        deepestAbyssFloor: nextAbyssRecord,
        dispatchCount: prev.dispatchCount + 1,
        logs: [...outcomeLogs, ...prev.logs],
      };
    });

    // Mount LootClaimModal immediately for player excitement!
    setActiveLoot({
      charName: character.name,
      dungeonName: selectedDungeonObj.name,
      goldEarned: results.goldEarned,
      ironCount: results.ironCount,
      magicCount: results.magicCount,
      dragonCount: results.dragonCount,
      ticketFound: results.ticketFound,
      foundItem: results.foundItem,
      success: results.success,
    });
  };

  // Helper calculation for Dispatch Progress bars
  const getDispatchProgression = (char: Character) => {
    if (!char.dispatchState) return { percent: 0, secondsLeft: 0, finished: false };
    const now = Date.now();
    const total = char.dispatchState.duration;
    const remaining = char.dispatchState.returnTime - now;

    if (remaining <= 0) {
      return { percent: 100, secondsLeft: 0, finished: true };
    }

    const elapsed = total - remaining;
    const percent = Math.min(100, Math.round((elapsed / total) * 100));
    const secondsLeft = Math.ceil(remaining / 1000);

    return { percent, secondsLeft, finished: false };
  };

  // Clean / wipe operational logs
  const handleClearLogs = () => {
    setGameState((prev) => ({
      ...prev,
      logs: [
        {
          id: `log_clear_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          timestamp: new Date().toLocaleTimeString(),
          text: '業務日誌の履歴をアーカイブ消去しました。オフィスデスクをクリーンに整理完了。',
          type: 'info',
        }
      ]
    }));
  };

  // Simple state calculation of active dispatched units
  const activeDispatchesCount = gameState.characters.filter((c) => c.status === 'dispatched').length;
  const maxDispatchesCount = gameState.characters.length;

  return (
    <div className="min-h-screen bg-[#ECD8B6] pb-32 text-[#4A2E1B] flex flex-col font-dq select-none antialiased">
      
      {/* Top Header widgets panel */}
      <CompanyHeader
        gold={gameState.gold}
        autoSalesLevel={gameState.autoSalesLevel}
        tickets={gameState.tickets}
        ironOre={gameState.ironOre}
        magicStone={gameState.magicStone}
        dragonScale={gameState.dragonScale}
        activeDispatchesCount={activeDispatchesCount}
        maxDispatchesCount={maxDispatchesCount}
        onUpgradeSales={handleUpgradeSales}
        salesUpgradeCost={gameState.autoSalesLevel * 300 + 400}
      />

      {/* Main Container screen based on active bottom sheet tab */}
      <main className="max-w-7xl mx-auto px-4 py-4 w-full flex-1 space-y-6">
        
        {/* Interactive Onboarding Tutorial Advisor */}
        <OnboardingTutorial
          currentStep={tutorialStep}
          activeTab={activeTab}
          onNextStep={() => setTutorialStep((prev) => Math.min(3, prev + 1))}
          onPrevStep={() => setTutorialStep((prev) => Math.max(0, prev - 1))}
          onSetStep={(step) => setTutorialStep(step)}
          onSkipTutorial={() => {
            const nextShow = !showTutorial;
            setShowTutorial(nextShow);
            try {
              localStorage.setItem('極限！無限ダンジョン派遣会社_tutorial_enabled_v2', String(nextShow));
            } catch {}
          }}
          isOpen={showTutorial}
        />
        
        {/* TAB 1: 【Home / Office Workspace】 */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            
            {/* DQ Style Graphic Title Banner */}
            <div className="relative overflow-hidden rounded-lg border-[4px] border-[#4A2E1B] shadow-[4px_4px_0px_#2E1B10]">
              <img
                src="/assets/images/dq_title_banner_1779353462114.png"
                alt="無限ダンジョン派遣ギルド"
                className="w-full h-32 md:h-48 object-cover object-bottom filter brightness-95"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 text-white">
                <p className="text-[10px] uppercase font-black tracking-widest text-[#C19A6B] font-mono leading-none">
                  ⚔️ Retro 2D Dragon Quest Style ⚔️
                </p>
                <h3 className="text-xs md:text-sm font-black mt-1.5 leading-tight tracking-wider text-amber-305">
                  極限！無限ダンジョン派遣ギルドへようこそ！腕利きのなかまを集め、武器を鍛え、奈落の最深部を攻略しよう！
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Monitors List column */}
              <div className="lg:col-span-7 bg-[#FAF6EE] border-[3px] border-[#4A2E1B] rounded-lg p-5 space-y-4 shadow-[4px_4px_0px_#2E1B10]">
                <div className="border-b-2 border-[#4A2E1B] pb-2 mb-4">
                  <h2 className="text-sm font-black text-[#A33B20] flex items-center gap-2">
                    <span>📡</span> 派遣ライブモニター [ LIVE GATE ]
                  </h2>
                </div>

                {activeDispatchesCount === 0 ? (
                  <div className="py-12 border-2 border-dashed border-[#4A2E1B]/40 rounded text-center text-[#6E4F39] text-xs font-bold bg-[#F5EFE6]/50">
                    現在、作戦行動に出撃している社員はいません。
                    <p className="text-[10px] text-slate-500 mt-1 font-semibold">「しゅつげき」タブから、待機中の社員をダンジョンへ送り出そう！</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {gameState.characters
                      .filter((c) => c.status === 'dispatched')
                      .map((char) => {
                        const prog = getDispatchProgression(char);
                        const dungeonName = INITIAL_DUNGEONS.find(
                          (d) => d.id === char.dispatchState?.dungeonId
                        )?.name || `極限の奈落 (${char.dispatchState ? Math.round((char.dispatchState.recommendedAtk - 4000) / 8000) : 1}層)`;

                        return (
                          <div
                            key={char.id}
                            className={`border-2 rounded p-4 transition-all ${
                              prog.finished
                                ? 'bg-emerald-50/50 border-[#2E7D32]/80 shadow-md'
                                : 'bg-[#FAF6EE] border-[#4A2E1B]/75'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2.5 flex-wrap gap-2">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded border border-[#4A2E1B] bg-[#F5EFE6] text-[#4A2E1B]">
                                    Lv.{char.level} • {char.job === 'warrior' ? '戦士' : char.job === 'thief' ? 'シーフ' : '魔術師'}
                                  </span>
                                  
                                  {/* Dynamic Auto Loop Toggle Pill */}
                                  <button
                                    id={`toggle-autoloop-pill-${char.id}`}
                                    type="button"
                                    onClick={() => handleToggleAutoLoop(char.id)}
                                    className={`text-[9.5px] font-black px-2 py-0.5 rounded border-2 transition-all cursor-pointer flex items-center gap-1 select-none ${
                                      char.dispatchState?.autoLoop
                                        ? 'bg-emerald-700 text-white border-emerald-950 shadow-[1px_1px_0px_#1B5E20]'
                                        : 'bg-[#F5EFE6] text-[#6E4F39] border-[#4A2E1B]/35 hover:border-[#4A2E1B]/80'
                                    }`}
                                  >
                                    🔄 周回: {char.dispatchState?.autoLoop ? '有効 (ON)' : '手動 (OFF)'}
                                  </button>

                                  {/* Dynamic Auto Abyss Toggle Pill */}
                                  {char.dispatchState?.dungeonId.startsWith('dungeon_infinite') && (
                                    <button
                                      id={`toggle-autoabyss-pill-${char.id}`}
                                      type="button"
                                      onClick={() => handleToggleAutoAbyss(char.id)}
                                      className={`text-[9.5px] font-black px-2 py-0.5 rounded border-2 transition-all cursor-pointer flex items-center gap-1 select-none ${
                                        char.dispatchState?.autoAbyss
                                          ? 'bg-amber-600 text-white border-amber-955 shadow-[1px_1px_0px_#78350F]'
                                          : 'bg-[#FAF3E0] text-amber-900 border-[#4A2E1B]/35 hover:border-[#4A2E1B]/80'
                                      }`}
                                    >
                                      🧗 自動攻略: {char.dispatchState?.autoAbyss ? '有効 (ON)' : '無効 (OFF)'}
                                    </button>
                                  )}
                                </div>
                                <h3 className="font-extrabold text-base text-[#4A2E1B] mt-1.5 bg-[#FAF6EE] border-2 border-[#4A2E1B] rounded px-2.5 py-0.5 max-w-fit shadow-[2px_2px_0px_#4A2E1B]">
                                  {char.name}
                                </h3>
                              </div>

                              <div className="text-right">
                                <span className="text-[10px] font-black text-[#8C7A65] block uppercase tracking-wider">
                                  目的地
                                </span>
                                <span className="font-black text-sm text-[#A33B20]">
                                  📍 {dungeonName}
                                </span>
                              </div>
                            </div>

                            {/* Battle Simulation Live Feed Arena */}
                            <div className="mb-3.5">
                              <BattleMonitor
                                char={char}
                                inventory={gameState.inventory}
                                companyWideAtkBuffPct={companyWideAtkBuffPct}
                                percent={prog.percent}
                                secondsLeft={prog.secondsLeft}
                              />
                            </div>

                            {/* Progression Actions */}
                            {prog.finished && (
                              <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-3 border-t border-dashed border-[#2E7D32]/5 w-full mt-2">
                                <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded">
                                  🎉 探検帰還確認！ 報酬調達が完了しました！
                                </span>
                                <button
                                  id={`claim-btn-${char.id}`}
                                  onClick={() => {
                                    handleClaimDispatchRewards(char.id);
                                  }}
                                  className={`w-full md:w-auto px-5 py-2 text-xs font-black bg-[#2E7D32] border-[#1B5E20] hover:bg-[#1B5E20] text-white rounded shadow-sm border-b-4 active:translate-y-[2px] active:border-b-0 cursor-pointer transition-all ${
                                    showTutorial && tutorialStep === 3 ? 'ring-4 ring-amber-400 animate-pulse' : ''
                                  }`}
                                >
                                  報酬を受け取る 🎁
                                </button>
                              </div>
                            )}

                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Achievements Column */}
              <div className="lg:col-span-5 bg-[#FAF6EE] border-[3px] border-[#4A2E1B] rounded-lg p-5 space-y-4 shadow-[4px_4px_0px_#2E1B10]">
                <div className="border-b-2 border-[#4A2E1B] pb-2 mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-black text-[#A33B20] flex items-center gap-1.5">
                    <span>🏆</span> 社内功績実績 [ REVERENCE ]
                  </h2>
                  <span className="text-[10px] font-black bg-amber-100 text-[#4A2E1B] border border-amber-350 px-2 py-0.5 rounded-full font-mono">
                    BUFF: +{companyWideAtkBuffPct}%
                  </span>
                </div>

                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {gameState.achievements.map((ach) => (
                    <div
                      key={ach.id}
                      className={`border-2 p-3 rounded flex items-center gap-3 transition-colors ${
                        ach.unlocked
                          ? 'border-amber-400 bg-amber-50/40 shadow-sm'
                          : 'border-[#4A2E1B]/35 bg-[#FAF6EE]/30 opacity-60'
                      }`}
                    >
                      <span className={`text-xl shrink-0 ${ach.unlocked ? 'grayscale-0' : 'grayscale'}`}>
                        {ach.unlocked ? '🏆' : '🔒'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h4 className={`text-xs font-extrabold truncate ${ach.unlocked ? 'text-[#A33B20] font-black' : 'text-[#8C7A65]'}`}>
                          {ach.title}
                        </h4>
                        <p className="text-[10px] text-[#6E4F39] leading-tight mt-0.5">
                          {ach.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Bottom Row Log Diaries */}
            <div className="bg-[#FAF6EE] border-[3px] border-[#4A2E1B] rounded-lg p-5 shadow-[4px_4px_0px_#2E1B10]">
              <div className="flex justify-between items-center border-b-2 border-[#4A2E1B] pb-2 mb-4">
                <h2 className="text-sm font-black text-[#A33B20] flex items-center gap-2">
                  <span>📝</span> ギルド業務日誌 [ LOG DIARY ]
                </h2>
                <button
                  id="clear-logs-btn"
                  onClick={handleClearLogs}
                  className="text-[10px] bg-[#FAF6EE] text-[#4A2E1B] border-2 border-[#4A2E1B]/85 hover:bg-[#F5EFE6] px-3 py-1 rounded font-bold transition-all cursor-pointer"
                >
                  <Trash2 className="w-3 h-3 inline mr-1" />
                  ログを消去
                </button>
              </div>

              <div className="space-y-2 font-mono text-xs max-h-[220px] overflow-y-auto bg-[#311E11] text-[#FAF6EE]/90 border-2 border-[#4A2E1B] p-4 rounded-lg leading-relaxed shadow-inner">
                {gameState.logs.map((log) => {
                  let badgeColor = 'text-[#FAF6EE]/80';
                  if (log.type === 'success') badgeColor = 'text-[#9CCC65] font-extrabold';
                  if (log.type === 'warn') badgeColor = 'text-[#FF8A80] font-semibold';
                  if (log.type === 'reward') badgeColor = 'text-[#FFE082] font-bold';

                  return (
                    <div key={log.id} className="flex gap-2.5 items-start hover:bg-[#FAF6EE]/10 p-1 rounded transition-all">
                      <span className="text-[#FAF6EE]/50 font-bold shrink-0 text-[10px]">
                        {log.timestamp}
                      </span>
                      <span id={`log-item-${log.id}`} className={`flex-1 ${badgeColor}`}>
                        {log.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: 【編成・人事 (Employees Gacha & Level up)】 */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            <GachaPanel
              gold={gameState.gold}
              tickets={gameState.tickets}
              onRollGacha={handleRollGacha}
            />
            
            <CharacterList
              characters={gameState.characters}
              inventory={gameState.inventory}
              gold={gameState.gold}
              companyWideAtkBuffPct={companyWideAtkBuffPct}
              onLevelUp={handleLevelUpCharacter}
              onDismiss={handleDismissCharacter}
              onOpenEquipSelector={(char, type) => {
                setEqSelectorConfig({ characterId: char.id, type });
              }}
            />
          </div>
        )}

        {/* TAB 3: 【鍛冶屋 (Forge crafting & scrap gear)】 */}
        {activeTab === 'blacksmith' && (
          <BlacksmithPanel
            gold={gameState.gold}
            ironOre={gameState.ironOre}
            magicStone={gameState.magicStone}
            dragonScale={gameState.dragonScale}
            inventory={gameState.inventory}
            onCraft={handleCraftItem}
            onDismantle={handleDismantleItem}
            onBulkDismantleIds={handleBulkDismantleIds}
            officeGymLevel={gameState.officeGymLevel || 0}
            forgeUpgradeLevel={gameState.forgeUpgradeLevel || 0}
            dispatchCenterLevel={gameState.dispatchCenterLevel || 0}
            onUpgradeApply={handleApplyUpgrade}
            onTransmuteApply={handleApplyTransmute}
          />
        )}

        {/* TAB 4: 【出撃ダンジョン (Dungeons map select)】 */}
        {activeTab === 'sortie' && (
          <DungeonPanel
            characters={gameState.characters}
            inventory={gameState.inventory}
            deepestAbyssFloor={gameState.deepestAbyssFloor}
            companyWideAtkBuffPct={companyWideAtkBuffPct}
            onDispatch={handleLaunchDispatch}
            tutorialStep={tutorialStep}
            showTutorial={showTutorial}
          />
        )}

      </main>

      {/* Floating popup gear selector modal */}
      {eqSelectorConfig && (
        <EquipmentSelector
          character={gameState.characters.find((c) => c.id === eqSelectorConfig.characterId)!}
          inventory={gameState.inventory}
          type={eqSelectorConfig.type}
          companyWideAtkBuffPct={companyWideAtkBuffPct}
          onEquip={(charId, eqId, type) => handleEquipItem(charId, eqId, type)}
          onClose={() => setEqSelectorConfig(null)}
        />
      )}

      {/* Dopamine Claim Rewards pop modal overlay */}
      {activeLoot && (
        <LootClaimModal
          charName={activeLoot.charName}
          dungeonName={activeLoot.dungeonName}
          goldEarned={activeLoot.goldEarned}
          ironCount={activeLoot.ironCount}
          magicCount={activeLoot.magicCount}
          dragonCount={activeLoot.dragonCount}
          ticketFound={activeLoot.ticketFound}
          foundItem={activeLoot.foundItem}
          success={activeLoot.success}
          onClear={() => setActiveLoot(null)}
        />
      )}

      {/* Persistent Bottom Smartphone-inspired Navigation Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF6EE] border-[4px] border-[#4A2E1B] shadow-[0px_4px_16px_rgba(0,0,0,0.5)] px-4 py-2.5 max-w-2xl mx-auto font-dq">
        <div className="grid grid-[#4A2E1B] grid-cols-4 gap-2 text-center select-none">
          
          <button
            id="tab-btn-home"
            onClick={() => setActiveTab('home')}
            className={`py-1.5 rounded-lg border-2 transition-all cursor-pointer ${
              activeTab === 'home'
                ? 'bg-[#4A2E1B] text-white border-[#4A2E1B] font-black shadow-inner scale-[1.03]'
                : 'bg-[#FAF6EE] text-[#4A2E1B] border-transparent hover:border-[#4A2E1B]/40 hover:bg-[#F5EFE6]'
            } ${showTutorial && tutorialStep === 3 ? 'ring-2 ring-yellow-405 animate-pulse' : ''}`}
          >
            <span className="text-[8px] uppercase tracking-tighter block opacity-60 font-mono">My Office</span>
            <span className="font-extrabold flex items-center justify-center gap-1 text-xs sm:text-sm">👑 ホーム</span>
          </button>

          <button
            id="tab-btn-staff"
            onClick={() => setActiveTab('staff')}
            className={`py-1.5 rounded-lg border-2 transition-all cursor-pointer ${
              activeTab === 'staff'
                ? 'bg-[#4A2E1B] text-white border-[#4A2E1B] font-black shadow-inner scale-[1.03]'
                : 'bg-[#FAF6EE] text-[#4A2E1B] border-transparent hover:border-[#4A2E1B]/40 hover:bg-[#F5EFE6]'
            } ${showTutorial && tutorialStep === 0 ? 'ring-2 ring-yellow-405 animate-pulse' : ''}`}
          >
            <span className="text-[8px] uppercase tracking-tighter block opacity-60 font-mono">Companions</span>
            <span className="font-extrabold flex items-center justify-center gap-1 text-xs sm:text-sm">👥 なかま</span>
          </button>

          <button
            id="tab-btn-blacksmith"
            onClick={() => setActiveTab('blacksmith')}
            className={`py-1.5 rounded-lg border-2 transition-all cursor-pointer ${
              activeTab === 'blacksmith'
                ? 'bg-[#4A2E1B] text-white border-[#4A2E1B] font-black shadow-inner scale-[1.03]'
                : 'bg-[#FAF6EE] text-[#4A2E1B] border-transparent hover:border-[#4A2E1B]/40 hover:bg-[#F5EFE6]'
            }`}
          >
            <span className="text-[8px] uppercase tracking-tighter block opacity-60 font-mono">Smithy</span>
            <span className="font-extrabold flex items-center justify-center gap-1 text-xs sm:text-sm">🔨 かじや</span>
          </button>

          <button
            id="tab-btn-sortie"
            onClick={() => setActiveTab('sortie')}
            className={`py-1.5 rounded-lg border-2 transition-all cursor-pointer ${
              activeTab === 'sortie'
                ? 'bg-[#4A2E1B] text-white border-[#4A2E1B] font-black shadow-inner scale-[1.03]'
                : 'bg-[#FAF6EE] text-[#4A2E1B] border-transparent hover:border-[#4A2E1B]/40 hover:bg-[#F5EFE6]'
            } ${showTutorial && (tutorialStep === 1 || tutorialStep === 2) ? 'ring-2 ring-yellow-405 animate-pulse' : ''}`}
          >
            <span className="text-[8px] uppercase tracking-tighter block opacity-60 font-mono">Expedition</span>
            <span className="font-extrabold flex items-center justify-center gap-1 text-xs sm:text-sm">⚔️ しゅつげき</span>
          </button>

        </div>
      </footer>

    </div>
  );
}
