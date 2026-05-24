import React, { useState } from 'react';
import { Equipment, RarityType } from '../types';
import { CRAFT_RECIPES } from '../constants';
import { Hammer, Lock, Unlock, Trash2, Coins, Flame, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BlacksmithPanelProps {
  gold: number;
  ironOre: number;
  magicStone: number;
  dragonScale: number;
  inventory: Equipment[];
  onCraft: (recipeId: string, itemType: 'weapon' | 'armor') => Equipment | null;
  onDismantle: (itemId: string) => { goldReward: number; ironReward: number; magicReward: number; dragonReward: number } | null;
  officeGymLevel: number;
  forgeUpgradeLevel: number;
  dispatchCenterLevel: number;
  onUpgradeApply: (facility: 'gym' | 'forge' | 'dispatch', ironCost: number, magicCost: number, goldCost: number) => void;
  onTransmuteApply: (
    type: 'iron_to_gold' | 'magic_to_gold' | 'create_ticket' | 'create_scale',
    ironCost: number,
    magicCost: number,
    goldCost: number,
    goldYield: number,
    ticketYield: number,
    scaleYield: number
  ) => void;
}

export const BlacksmithPanel: React.FC<BlacksmithPanelProps> = ({
  gold,
  ironOre,
  magicStone,
  dragonScale,
  inventory,
  onCraft,
  onDismantle,
  officeGymLevel,
  forgeUpgradeLevel,
  dispatchCenterLevel,
  onUpgradeApply,
  onTransmuteApply,
}) => {
  const [leftTab, setLeftTab] = useState<'craft' | 'facility_alchemy'>('craft');
  const [selectedItemType, setSelectedItemType] = useState<'weapon' | 'armor'>('weapon');
  const [isCrafting, setIsCrafting] = useState<string | null>(null);
  const [newCraftedItem, setNewCraftedItem] = useState<Equipment | null>(null);
  const [confirmDismantleId, setConfirmDismantleId] = useState<string | null>(null);
  
  const [lockedItemIds, setLockedItemIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('dungeon_dispatch_locked_items');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleLock = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = { ...lockedItemIds, [itemId]: !lockedItemIds[itemId] };
    setLockedItemIds(updated);
    localStorage.setItem('dungeon_dispatch_locked_items', JSON.stringify(updated));
  };

  const handleCraft = (recipe: any) => {
    if (gold < recipe.goldCost) return;
    if (ironOre < recipe.ironCost) return;
    if (magicStone < recipe.magicCost) return;
    if (dragonScale < recipe.dragonCost) return;

    setIsCrafting(recipe.id);
    setNewCraftedItem(null);

    setTimeout(() => {
      const crafted = onCraft(recipe.id, selectedItemType);
      setIsCrafting(null);
      if (crafted) {
        setNewCraftedItem(crafted);
      }
    }, 1100);
  };

  const getDismantlePayout = (item: Equipment) => {
    switch (item.rarity) {
      case 'common': return { gold: 80, iron: 3, magic: 0, dragon: 0 };
      case 'rare': return { gold: 350, iron: 8, magic: 1, dragon: 0 };
      case 'epic': return { gold: 1800, iron: 20, magic: 6, dragon: 1 };
      case 'legendary': return { gold: 5000, iron: 45, magic: 15, dragon: 3 };
    }
  };

  const handleDismantle = (item: Equipment) => {
    if (item.equippedToCharacterId) return;
    if (lockedItemIds[item.id]) return;

    onDismantle(item.id);
  };

  const getRarityTextStyle = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-[#6E4F39] font-bold';
      case 'rare': return 'text-indigo-800 font-extrabold';
      case 'epic': return 'text-purple-800 font-extrabold';
      case 'legendary': return 'text-[#A33B20] font-black animate-pulse';
      default: return 'text-[#4A2E1B]';
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-2 border-[#4A2E1B] bg-[#FAF6EE]';
      case 'rare': return 'border-2 border-indigo-600 bg-indigo-50/70';
      case 'epic': return 'border-2 border-purple-600 bg-purple-50/70';
      case 'legendary': return 'border-[3px] border-amber-500 bg-amber-50/80 shadow-inner';
      default: return 'border-2 border-[#4A2E1B] bg-[#F5EFE6]';
    }
  };

  return (
    <div className="space-y-6 text-[#4A2E1B] font-dq select-none">
      
      {/* Header Panel */}
      <div className="bg-[#FAF6EE] border-[4px] border-[#4A2E1B] rounded-lg p-4 shadow-[4px_4px_0px_#2E1B10]">
        <h2 className="text-base font-black border-b border-dashed border-[#4A2E1B]/50 pb-2 mb-2 flex items-center gap-2 text-[#A33B20]">
          <span>⚒️</span> どぐやんの 鍛冶工房 [ BLACKSMITH ]
        </h2>
        <p className="text-xs text-[#5C4033] leading-relaxed">
          手に入れた素材とゴールドを消費し、新たな装備品を製造・厳選します。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Side: Crafting Engine */}
        <div className="lg:col-span-7 bg-[#FAF6EE] border-[4px] border-[#4A2E1B] rounded-lg p-4 md:p-5 space-y-4 shadow-[4px_4px_0px_#2E1B10]">
          
          {/* Main Left Controller Mode Tabs */}
          <div className="flex border-2 border-[#4A2E1B] rounded overflow-hidden text-xs bg-[#FAF6EE]">
            <button
              onClick={() => setLeftTab('craft')}
              className={`flex-1 py-1.5 font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                leftTab === 'craft'
                  ? 'bg-[#A33B20] text-white'
                  : 'bg-[#FAF6EE] text-[#4A2E1B] hover:bg-[#F5EFE6]'
              }`}
            >
              🔨 基本の武具製造
            </button>
            <button
              onClick={() => setLeftTab('facility_alchemy')}
              className={`flex-1 py-1.5 font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                leftTab === 'facility_alchemy'
                  ? 'bg-[#A33B20] text-white'
                  : 'bg-[#FAF6EE] text-[#4A2E1B] hover:bg-[#F5EFE6]'
              }`}
            >
              🧪 設備投資 & 魔核錬金釜
            </button>
          </div>

          {leftTab === 'craft' ? (
            <>
              {/* Item Category Select */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-[#4A2E1B]/30 gap-3">
                <h3 className="text-xs font-black text-[#A33B20] uppercase tracking-widest flex items-center gap-2">
                  <span className="text-[#A33B20]">▶</span> どのような 装備を 生産しますか？
                </h3>
                
                {/* DQ Style Toggle Tabs */}
                <div className="flex border-2 border-[#4A2E1B] rounded overflow-hidden text-xs bg-[#FAF6EE] w-full sm:w-auto">
                  <button
                    id="select-type-weapon"
                    onClick={() => setSelectedItemType('weapon')}
                    className={`flex-1 sm:flex-none px-4 py-1.5 font-bold transition-all cursor-pointer ${
                      selectedItemType === 'weapon'
                        ? 'bg-[#A33B20] text-white font-black'
                        : 'bg-[#FAF6EE] text-[#4A2E1B] hover:bg-[#F5EFE6]'
                    }`}
                  >
                    ⚔️ ぶき (武器)
                  </button>
                  <button
                    id="select-type-armor"
                    onClick={() => setSelectedItemType('armor')}
                    className={`flex-1 sm:flex-none px-4 py-1.5 font-bold transition-all cursor-pointer ${
                      selectedItemType === 'armor'
                        ? 'bg-[#A33B20] text-white font-black'
                        : 'bg-[#FAF6EE] text-[#4A2E1B] hover:bg-[#F5EFE6]'
                    }`}
                  >
                    🛡️ よろい (防具)
                  </button>
                </div>
              </div>

              {/* Recipes Selection List */}
              <div className="space-y-3.5">
                {CRAFT_RECIPES.map((recipe) => {
                  const hasGold = gold >= recipe.goldCost;
                  const hasIron = ironOre >= recipe.ironCost;
                  const hasMagic = magicStone >= recipe.magicCost;
                  const hasDragon = dragonScale >= recipe.dragonCost;
                  const canCraft = hasGold && hasIron && hasMagic && hasDragon && isCrafting === null;

                  return (
                    <div
                      key={recipe.id}
                      className="border-2 border-[#4A2E1B] rounded p-3.5 bg-[#F5EFE6] flex flex-col justify-between gap-3 hover:border-[#4A2E1B] transition-colors shadow-sm"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 font-black text-sm text-[#A33B20]">
                            <span>▶</span> {recipe.name} ({selectedItemType === 'weapon' ? '攻撃用' : '防御用'})
                          </div>
                          <p className="text-[11px] text-[#6E4F39] mt-0.5 leading-tight">{recipe.desc}</p>
                        </div>
                      </div>

                      {/* Materials cost block */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border border-[#4A2E1B]/30 bg-[#FAF6EE] p-2 rounded text-[11px] font-mono">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-[#8C7A65] font-bold">必要ゴールド</span>
                          <span className={`font-black flex items-center gap-0.5 ${hasGold ? 'text-[#A67C00]' : 'text-rose-600 font-extrabold animate-pulse'}`}>
                            🪙 {recipe.goldCost}G
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-[#8C7A65] font-bold">てつこうせき</span>
                          <span className={`font-black ${hasIron ? 'text-[#4A2E1B]' : 'text-rose-600 font-bold'}`}>
                            {recipe.ironCost} / {ironOre}個
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-[#8C7A65] font-bold">まほう結晶</span>
                          <span className={`font-black ${hasMagic ? 'text-[#4A2E1B]' : 'text-rose-600 font-bold'}`}>
                            {recipe.magicCost} / {magicStone}個
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-[#8C7A65] font-bold">りゅう逆鱗</span>
                          <span className={`font-black ${hasDragon ? 'text-[#4A2E1B]' : 'text-rose-600 font-bold'}`}>
                            {recipe.dragonCost} / {dragonScale}個
                          </span>
                        </div>
                      </div>

                      {/* Craft button */}
                      <div className="flex justify-end">
                        <button
                          id={`craft-btn-${recipe.id}`}
                          disabled={!canCraft}
                          onClick={() => handleCraft(recipe)}
                          className={`px-4 py-1.5 text-xs font-black rounded border-2 transition-all ${
                            canCraft
                              ? 'bg-[#A33B20] text-white border-amber-200 hover:bg-[#8F2D14] cursor-pointer active:translate-y-[1px]'
                              : 'bg-[#D3C4B3] text-[#8C7A65] border-[#A69580] cursor-not-allowed'
                          }`}
                        >
                          この装備を つくる 🔨
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="space-y-5">
              
              {/* SECTION 1: Permanent Upgrades */}
              <div>
                <h4 className="text-xs font-black text-[#A33B20] border-b border-[#4A2E1B]/20 pb-1.5 mb-2.5 flex items-center justify-between">
                  <span>🏢 会社施設・拠点先端開発 (消費：ゴールド＋鉄鉱石＋魔力結晶)</span>
                  <span className="text-[10px] text-[#8C7A65]">各施設 最大Lv.10</span>
                </h4>

                <div className="space-y-3">
                  
                  {/* Gym Level Up */}
                  {(() => {
                    const isMax = officeGymLevel >= 10;
                    const ironCost = (officeGymLevel + 1) * 180;
                    const magicCost = (officeGymLevel + 1) * 35;
                    const goldCost = (officeGymLevel + 1) * 3000;
                    const canUpgrade = !isMax && ironOre >= ironCost && magicStone >= magicCost && gold >= goldCost;

                    return (
                      <div className="border border-[#4A2E1B]/60 p-3 rounded bg-[#FAF6EE] flex flex-col justify-between gap-2 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-xs font-extrabold text-[#4A2E1B] flex items-center gap-2">
                              <span className="text-orange-600 font-black">🏢</span>
                              【鉄甲物理トレーニング室】 <span className="px-1.5 py-0.2 text-[9px] font-black bg-amber-200 border border-[#4A2E1B] rounded">Lv.{officeGymLevel}</span>
                            </div>
                            <p className="text-[10.5px] text-[#6E4F39] mt-1 leading-tight">
                              全従業員の筋力・防壁訓練を物理強化。社内従業員の全基礎ステータスが、永続的に <strong className="text-emerald-800 font-black">+{officeGymLevel * 3}%</strong> 加算されます。(次回: +3% 追加)
                            </p>
                          </div>
                        </div>

                        {!isMax ? (
                          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 pt-2 border-t border-[#4A2E1B]/15">
                            <div className="flex gap-2 text-[10px] font-mono text-[#5C4033] flex-wrap items-center">
                              <span className="font-bold">投資に必要:</span>
                              <span className={gold >= goldCost ? 'text-[#A67C00] font-black' : 'text-rose-600 font-bold'}>🪙 {goldCost}G</span>
                              <span className={ironOre >= ironCost ? 'text-[#4A2E1B] font-black' : 'text-rose-600 font-bold'}>🔩 てつこ {ironCost}個</span>
                              <span className={magicStone >= magicCost ? 'text-[#4A2E1B] font-black' : 'text-rose-600 font-bold'}>🔮 魔結晶 {magicCost}個</span>
                            </div>
                            <button
                              disabled={!canUpgrade}
                              onClick={() => onUpgradeApply('gym', ironCost, magicCost, goldCost)}
                              className={`px-3 py-1 text-[10.5px] font-black border rounded cursor-pointer ${
                                canUpgrade
                                  ? 'bg-[#A33B20] text-white border-amber-650 hover:bg-[#8F2D14] active:translate-y-[1px]'
                                  : 'bg-[#D3C4B3] text-[#8C7A65] border-[#A69580] cursor-not-allowed'
                              }`}
                            >
                              ジムを技術強化 🏢
                            </button>
                          </div>
                        ) : (
                          <div className="text-right text-[10.5px] font-bold text-amber-600">★ 最大レベル到達 (限界突破済)</div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Forge Upgrades */}
                  {(() => {
                    const isMax = forgeUpgradeLevel >= 10;
                    const ironCost = (forgeUpgradeLevel + 1) * 250;
                    const magicCost = (forgeUpgradeLevel + 1) * 45;
                    const goldCost = (forgeUpgradeLevel + 1) * 4500;
                    const canUpgrade = !isMax && ironOre >= ironCost && magicStone >= magicCost && gold >= goldCost;

                    return (
                      <div className="border border-[#4A2E1B]/60 p-3 rounded bg-[#FAF6EE] flex flex-col justify-between gap-2 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-xs font-extrabold text-[#4A2E1B] flex items-center gap-2">
                              <span className="text-[#A33B20] font-black">⚒️</span>
                              【魔導共鳴・鍛造高速炉】 <span className="px-1.5 py-0.2 text-[9px] font-black bg-purple-200 border border-[#4A2E1B] rounded">Lv.{forgeUpgradeLevel}</span>
                            </div>
                            <p className="text-[10.5px] text-[#6E4F39] mt-1 leading-tight">
                              高精確な魔導共鳴波を鍛冶炉に注入。全装備品の基本攻撃値・基本防御値が永続的に <strong className="text-purple-800 font-black">+{forgeUpgradeLevel * 3}%</strong> 加算されます。(次回: +3% 追加)
                            </p>
                          </div>
                        </div>

                        {!isMax ? (
                          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 pt-2 border-t border-[#4A2E1B]/15">
                            <div className="flex gap-2 text-[10px] font-mono text-[#5C4033] flex-wrap items-center">
                              <span className="font-bold">投資に必要:</span>
                              <span className={gold >= goldCost ? 'text-[#A67C00] font-black' : 'text-rose-600 font-bold'}>🪙 {goldCost}G</span>
                              <span className={ironOre >= ironCost ? 'text-[#4A2E1B] font-black' : 'text-rose-600 font-bold'}>🔩 てつこ {ironCost}個</span>
                              <span className={magicStone >= magicCost ? 'text-[#4A2E1B] font-black' : 'text-rose-600 font-bold'}>🔮 魔結晶 {magicCost}個</span>
                            </div>
                            <button
                              disabled={!canUpgrade}
                              onClick={() => onUpgradeApply('forge', ironCost, magicCost, goldCost)}
                              className={`px-3 py-1 text-[10.5px] font-black border rounded cursor-pointer ${
                                canUpgrade
                                  ? 'bg-[#A33B20] text-white border-amber-650 hover:bg-[#8F2D14] active:translate-y-[1px]'
                                  : 'bg-[#D3C4B3] text-[#8C7A65] border-[#A69580] cursor-not-allowed'
                              }`}
                            >
                              鍛冶炉を技術強化 ⚒️
                            </button>
                          </div>
                        ) : (
                          <div className="text-right text-[10.5px] font-bold text-amber-600">★ 最大レベル到達 (限界突破済)</div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Dispatch center */}
                  {(() => {
                    const isMax = dispatchCenterLevel >= 10;
                    const ironCost = (dispatchCenterLevel + 1) * 150;
                    const magicCost = (dispatchCenterLevel + 1) * 30;
                    const goldCost = (dispatchCenterLevel + 1) * 2500;
                    const canUpgrade = !isMax && ironOre >= ironCost && magicStone >= magicCost && gold >= goldCost;

                    return (
                      <div className="border border-[#4A2E1B]/60 p-3 rounded bg-[#FAF6EE] flex flex-col justify-between gap-2 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-xs font-extrabold text-[#4A2E1B] flex items-center gap-2">
                              <span className="text-indigo-600 font-black">🚀</span>
                              【魔気圧推進・作戦指揮所】 <span className="px-1.5 py-0.2 text-[9px] font-black bg-sky-200 border border-[#4A2E1B] rounded">Lv.{dispatchCenterLevel}</span>
                            </div>
                            <p className="text-[10.5px] text-[#6E4F39] mt-1 leading-tight">
                              無線＆魔力気圧推進エンジンの最適化。全ダンジョン作戦時の派遣帰還時間が、永続的に <strong className="text-indigo-800 font-black">-{dispatchCenterLevel * 2}%</strong> 短縮されます。(最大20%短縮)
                            </p>
                          </div>
                        </div>

                        {!isMax ? (
                          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 pt-2 border-t border-[#4A2E1B]/15">
                            <div className="flex gap-2 text-[10px] font-mono text-[#5C4033] flex-wrap items-center">
                              <span className="font-bold">投資に必要:</span>
                              <span className={gold >= goldCost ? 'text-[#A67C00] font-black' : 'text-rose-600 font-bold'}>🪙 {goldCost}G</span>
                              <span className={ironOre >= ironCost ? 'text-[#4A2E1B] font-black' : 'text-rose-600 font-bold'}>🔩 てつこ {ironCost}個</span>
                              <span className={magicStone >= magicCost ? 'text-[#4A2E1B] font-black' : 'text-rose-600 font-bold'}>🔮 魔結晶 {magicCost}個</span>
                            </div>
                            <button
                              disabled={!canUpgrade}
                              onClick={() => onUpgradeApply('dispatch', ironCost, magicCost, goldCost)}
                              className={`px-3 py-1 text-[10.5px] font-black border rounded cursor-pointer ${
                                canUpgrade
                                  ? 'bg-[#A33B20] text-white border-amber-650 hover:bg-[#8F2D14] active:translate-y-[1px]'
                                  : 'bg-[#D3C4B3] text-[#8C7A65] border-[#A69580] cursor-not-allowed'
                              }`}
                            >
                              管制塔を技術強化 🚀
                            </button>
                          </div>
                        ) : (
                          <div className="text-right text-[10.5px] font-bold text-amber-600">★ 最大レベル到達 (限界突破済)</div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* SECTION 2: Alchemy Transmutations */}
              <div>
                <h4 className="text-xs font-black text-indigo-700 border-b border-[#4A2E1B]/20 pb-1.5 mb-2.5 flex items-center gap-2">
                  <span>🧪 地下魔導錬金釜 (余りがちな基礎鉱石＆魔力結晶の物質還元・変換)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  
                  {/* Iron to Gold */}
                  {(() => {
                    const costIron = 100;
                    const yieldGold = 2500;
                    const canTrans = ironOre >= costIron;
                    return (
                      <div className="border border-dashed border-[#4A2E1B]/70 p-3 rounded bg-[#FAF6EE]/50 flex flex-col justify-between gap-2.5 shadow-sm">
                        <div>
                          <span className="text-[9px] px-1.5 py-0.2 font-extrabold bg-[#FAF6EE] border border-[#4A2E1B]/40 rounded text-amber-800">ゴールド錬成</span>
                          <h5 className="text-[11.5px] font-extrabold text-[#4A2E1B] mt-1 flex items-center gap-1">🔩 鉄鉱石のゴールド液化</h5>
                          <p className="text-[10px] text-[#6E4F39] mt-0.5">余った鉄鉱石100個を純粋な分子ゴールドへと分解還元し、資金に変換します。</p>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-[#4A2E1B]/10">
                          <span className="text-[10px] font-mono text-[#5C4033] font-bold">消費: 🔩 100個</span>
                          <button
                            disabled={!canTrans}
                            onClick={() => onTransmuteApply('iron_to_gold', costIron, 0, 0, yieldGold, 0, 0)}
                            className={`px-2 py-0.5 text-[10px] font-black border rounded-sm cursor-pointer ${
                              canTrans ? 'bg-amber-650 text-white border-yellow-400 hover:bg-amber-700 active:translate-y-[1px]' : 'bg-[#D3C4B3] text-[#8C7A65] border-[#A69580] cursor-not-allowed'
                            }`}
                          >
                            🪙 2500G を獲得
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Magic to Gold */}
                  {(() => {
                    const costMagic = 30;
                    const yieldGold = 4500;
                    const canTrans = magicStone >= costMagic;
                    return (
                      <div className="border border-dashed border-[#4A2E1B]/70 p-3 rounded bg-[#FAF6EE]/50 flex flex-col justify-between gap-2.5 shadow-sm">
                        <div>
                          <span className="text-[9px] px-1.5 py-0.2 font-extrabold bg-[#FAF6EE] border border-[#4A2E1B]/40 rounded text-amber-800">ゴールド錬成</span>
                          <h5 className="text-[11.5px] font-extrabold text-[#4A2E1B] mt-1 flex items-center gap-1">🔮 魔結晶のゴールド精製</h5>
                          <p className="text-[10px] text-[#6E4F39] mt-0.5">余った魔力結晶30個を純化高熱炉で融解させ、巨額の資金を生み出します。</p>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-[#4A2E1B]/10">
                          <span className="text-[10px] font-mono text-[#5C4033] font-bold">消費: 🔮 30個</span>
                          <button
                            disabled={!canTrans}
                            onClick={() => onTransmuteApply('magic_to_gold', 0, costMagic, 0, yieldGold, 0, 0)}
                            className={`px-2 py-0.5 text-[10px] font-black border rounded-sm cursor-pointer ${
                              canTrans ? 'bg-amber-650 text-white border-yellow-400 hover:bg-amber-700 active:translate-y-[1px]' : 'bg-[#D3C4B3] text-[#8C7A65] border-[#A69580] cursor-not-allowed'
                            }`}
                          >
                            🪙 4500G を獲得
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Create Ticket */}
                  {(() => {
                    const costIron = 200;
                    const costMagic = 100;
                    const costGold = 2000;
                    const canTrans = ironOre >= costIron && magicStone >= costMagic && gold >= costGold;
                    return (
                      <div className="border border-dashed border-[#4A2E1B]/70 p-3 rounded bg-[#FAF6EE]/50 flex flex-col justify-between gap-2.5 md:col-span-2 shadow-sm">
                        <div>
                          <span className="text-[9px] px-1.5 py-0.2 font-extrabold bg-[#E8EAF6] border border-[#4A2E1B]/40 rounded text-indigo-800">チケット錬成</span>
                          <h5 className="text-[11.5px] font-extrabold text-indigo-900 mt-1 flex items-center gap-1">🎫 超特選紹介状の生成技術</h5>
                          <p className="text-[10px] text-[#6E4F39] mt-0.5">
                            鉄鉱石200個、魔結晶100個、ゴールド2000Gを錬金圧縮。圧倒的な実力を持つ<strong>『エリート社員(レア度高)』が100%確定募集する最強のスカウト切符</strong>を1枚合成します！
                          </p>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-[#4A2E1B]/10 flex-wrap gap-2">
                          <span className="text-[10px] font-mono text-[#5C4033] font-bold">消費: 🔩 200個 ＆ 🔮 100個 ＆ 🪙 2000G</span>
                          <button
                            disabled={!canTrans}
                            onClick={() => onTransmuteApply('create_ticket', costIron, costMagic, costGold, 0, 1, 0)}
                            className={`px-3 py-1 text-[10.5px] font-black border rounded cursor-pointer ${
                              canTrans ? 'bg-indigo-700 text-white border-blue-400 hover:bg-indigo-800 active:translate-y-[1px]' : 'bg-[#D3C4B3] text-[#8C7A65] border-[#A69580] cursor-not-allowed'
                            }`}
                          >
                            🎫 切符を合成・創成！
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Create Scale */}
                  {(() => {
                    const costIron = 300;
                    const costMagic = 150;
                    const costGold = 4500;
                    const canTrans = ironOre >= costIron && magicStone >= costMagic && gold >= costGold;
                    return (
                      <div className="border border-dashed border-[#4A2E1B]/70 p-3 rounded bg-[#FAF6EE]/50 flex flex-col justify-between gap-2.5 md:col-span-2 shadow-sm">
                        <div>
                          <span className="text-[9px] px-1.5 py-0.2 font-extrabold bg-[#FFF3E0] border border-[#4A2E1B]/40 rounded text-orange-850">激レア素材調合</span>
                          <h5 className="text-[11.5px] font-extrabold text-[#A33B20] mt-1 flex items-center gap-1">🦖 【竜の逆鱗ウロコ ×2】の人工高圧調合</h5>
                          <p className="text-[10px] text-[#6E4F39] mt-0.5">
                            鉄鉱石300個、魔導結晶150個、4500Gを魔導最高耐圧釜で圧縮。最高峰レジェンダリー装備確約の超レア素材<strong>『竜の逆鱗』を2個</strong>人工的に凝縮・結晶化します。
                          </p>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-[#4A2E1B]/10 flex-wrap gap-2">
                          <span className="text-[10px] font-mono text-[#5C4033] font-bold">消費: 🔩 300個 ＆ 🔮 150個 ＆ 🪙 4500G</span>
                          <button
                            disabled={!canTrans}
                            onClick={() => onTransmuteApply('create_scale', costIron, costMagic, costGold, 0, 0, 2)}
                            className={`px-3 py-1 text-[10.5px] font-black border rounded cursor-pointer ${
                              canTrans ? 'bg-orange-700 text-white border-yellow-400 hover:bg-orange-850 active:translate-y-[1px]' : 'bg-[#D3C4B3] text-[#8C7A65] border-[#A69580] cursor-not-allowed'
                            }`}
                          >
                            🦖 竜の逆鱗ウロコ×2を調合！
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                </div>
              </div>

            </div>
          )}

          {/* Crafting result animation drawer */}
          <div className="mt-4 border-2 border-dashed border-[#4A2E1B]/60 bg-[#FAF6EE] rounded min-h-[150px] flex items-center justify-center p-3 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {isCrafting && (
                <motion.div
                  key="crafting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-2.5"
                >
                  <div className="w-10 h-10 rounded-full border-4 border-[#A33B20] border-t-transparent animate-spin mx-auto flex items-center justify-center">
                    <Flame className="w-4 h-4 text-orange-600 animate-pulse" />
                  </div>
                  <p className="text-xs font-black text-[#A33B20] animate-pulse tracking-widest">
                    カァン！ カァン！ ドゴォン！ 製造中！
                  </p>
                </motion.div>
              )}

              {!isCrafting && newCraftedItem === null && (
                <motion.div
                  key="empty-craft"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-[#5C4033] p-4"
                >
                  <Hammer className="w-6 h-6 text-[#8C7A65] mx-auto mb-1.5 animate-bounce" />
                  <p className="text-xs font-bold text-[#4A2E1B]">出来上がった装備がここに表示されます</p>
                  <p className="text-[10px] text-[#8C7A65] mt-0.5">装備種別を選び「この装備をつくる」を押してください</p>
                </motion.div>
              )}

              {!isCrafting && newCraftedItem !== null && (
                <motion.div
                  key="crafted-popup"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`w-full max-w-sm rounded border-2 p-3 ${getRarityBg(newCraftedItem.rarity)}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5">
                      <h4 className={`text-sm md:text-base font-black ${getRarityTextStyle(newCraftedItem.rarity)}`}>
                        {newCraftedItem.name}
                      </h4>
                    </div>
                    <span className="text-[9px] font-black text-[#A33B20] animate-pulse uppercase">SUCCESS!</span>
                  </div>

                  <div className="mt-2 text-xs font-bold text-[#4A2E1B]">
                    <span>
                      {selectedItemType === 'weapon' ? '⚔️ 攻撃補正' : '🛡️ 防御補正'}:{' '}
                      <strong className="text-[#A33B20] text-sm ml-1 font-mono">+{newCraftedItem.baseStat}</strong>
                    </span>
                  </div>

                  {newCraftedItem.substats.length > 0 && (
                    <div className="mt-2 text-[10px] space-y-1">
                      <div className="font-extrabold text-[#8C7A65]">[ 特殊付加オプション ]</div>
                      <div className="flex flex-wrap gap-1">
                        {newCraftedItem.substats.map((sub, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 font-extrabold text-[9px] rounded border border-[#4A2E1B]/40 bg-[#FAF6EE] text-[#A67C00]"
                          >
                            ★ {sub.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-2.5 bg-[#FAF6EE] border border-[#4A2E1B]/50 px-2.5 py-1 text-center rounded text-[10px] text-emerald-800 font-extrabold">
                    ▶ {newCraftedItem.name} を おおどうぐそうこ に入れました。
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: Warehousing and Scrap dismantling */}
        <div className="lg:col-span-5 bg-[#FAF6EE] border-[4px] border-[#4A2E1B] rounded-lg p-4 md:p-5 flex flex-col justify-between max-h-[82vh] shadow-[4px_4px_0px_#2E1B10]">
          
          <div>
            <h3 className="text-xs font-black text-[#A33B20] border-b pb-2 mb-2 border-[#4A2E1B]/30 flex items-center justify-between uppercase tracking-widest">
              <span>▶ おおどうぐそうこ (装備整理・分解)</span>
              <span className="text-[10px] border border-[#4A2E1B] px-2 py-0.2 rounded bg-[#FAF6EE]">残り {inventory.length}個</span>
            </h3>
            <p className="text-[11px] text-[#5C4033] mb-3 leading-relaxed">
              不要になった装備品を安全に分解し、おカネと基礎素材に還元します。(※待機中の装備のみ分解可能)
            </p>
          </div>

          <div className="space-y-2 overflow-y-auto pr-1 flex-1 max-h-[50vh] min-h-[220px]">
            {inventory.length === 0 ? (
              <div className="text-center py-16 text-[#8C7A65] text-xs font-bold bg-[#FAF6EE] rounded border border-[#4A2E1B]/30">
                <Trash2 className="w-6 h-6 mx-auto text-[#8C7A65]/50 mb-2" />
                そうこは 空っぽだ！
              </div>
            ) : (
              inventory.map((item) => {
                const isLocked = lockedItemIds[item.id] || false;
                const payout = getDismantlePayout(item);
                const isEquipped = item.equippedToCharacterId !== null;

                return (
                  <div
                    key={item.id}
                    className={`border p-2 rounded flex items-center justify-between gap-2.5 transition-all bg-[#FAF6EE] ${
                      isEquipped ? 'border-[#4A2E1B]/30 bg-[#FAF6EE]/50 opacity-75' : 'border-[#4A2E1B]/50 hover:border-[#4A2E1B]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className={`text-[10px] font-black ${getRarityTextStyle(item.rarity)}`}>
                          {item.name}
                        </span>
                      </div>

                      <div className="text-[10px] text-[#6E4F39] mt-0.5 flex gap-2">
                        <span>{item.type === 'weapon' ? '⚔️ATK' : '🛡️DEF'}: {item.baseStat}</span>
                        {isEquipped && <span className="text-emerald-800 text-[9px] font-black">● 社員装備中</span>}
                      </div>
                    </div>

                    {/* Controller Action icons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {confirmDismantleId === item.id ? (
                        <div className="flex items-center gap-1 bg-red-50 border border-red-500 rounded p-1 animate-pulse">
                          <span className="text-[8.5px] font-bold text-[#A33B20]">分解？</span>
                          <button
                            id={`confirm-scrap-yes-${item.id}`}
                            onClick={() => {
                              handleDismantle(item);
                              setConfirmDismantleId(null);
                            }}
                            className="px-1.5 py-0.5 text-[8.5px] bg-[#A33B20] text-white rounded font-extrabold cursor-pointer border border-[#4A2E1B]"
                          >
                            はい
                          </button>
                          <button
                            id={`confirm-scrap-no-${item.id}`}
                            onClick={() => setConfirmDismantleId(null)}
                            className="px-1.5 py-0.5 text-[8.5px] bg-stone-500 text-white rounded font-extrabold cursor-pointer border border-[#4A2E1B]"
                          >
                            いいえ
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Lock Button */}
                          <button
                            id={`lock-toggle-${item.id}`}
                            onClick={(e) => toggleLock(item.id, e)}
                            className={`p-1.5 rounded border transition-colors cursor-pointer ${
                              isLocked ? 'text-amber-600 bg-amber-50 border-amber-500/50' : 'text-[#8C7A65] border-transparent hover:border-[#4A2E1B]'
                            }`}
                            title={isLocked ? 'ロックをはずす' : 'ロックする（売却防止）'}
                          >
                            {isLocked ? <Lock className="w-3.5 h-3.5 shrink-0" /> : <Unlock className="w-3.5 h-3.5 shrink-0" />}
                          </button>

                          {/* Recycle scrap button */}
                          <button
                            id={`scrap-${item.id}`}
                            disabled={isEquipped || isLocked}
                            onClick={() => setConfirmDismantleId(item.id)}
                            className={`p-1.5 rounded transition-all ${
                              isEquipped || isLocked
                                ? 'text-[#8C7A65]/40 cursor-not-allowed bg-transparent border-transparent'
                                : 'text-[#A33B20] bg-[#FAF6EE] border border-[#4A2E1B]/30 hover:bg-[#A33B20] hover:text-white cursor-pointer'
                            }`}
                            title={`しきべつ分解: +${payout?.gold}G, +${payout?.iron}鉄`}
                          >
                            <Trash2 className="w-3.5 h-3.5 shrink-0" />
                          </button>
                        </>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>

          {/* Quick info block */}
          <div className="mt-4 bg-[#F5EFE6] border border-[#4A2E1B]/30 p-3 rounded text-[10px] text-[#5C4033] flex gap-2 leading-relaxed shrink-0 shadow-inner">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <p className="font-extrabold text-[11px] mb-0.5 text-[#A33B20]">ぶんかいのアドバイス：</p>
              高位な（エピックやレジェンダリー）装備を分解すると、竜の逆鱗や魔力結晶などの最高素材をおおく還元してもらえます。
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
