import React, { useState } from 'react';
import { Equipment, Character } from '../types';
import { computeCharacterStats } from '../gameEngine';
import { X, ShieldAlert, Award, AlertCircle } from 'lucide-react';

interface EquipmentSelectorProps {
  character: Character;
  inventory: Equipment[];
  type: 'weapon' | 'armor';
  companyWideAtkBuffPct: number;
  onEquip: (charId: string, equipmentId: string | null, type: 'weapon' | 'armor') => void;
  onClose: () => void;
}

export const EquipmentSelector: React.FC<EquipmentSelectorProps> = ({
  character,
  inventory,
  type,
  companyWideAtkBuffPct,
  onEquip,
  onClose,
}) => {
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Filter inventory for unequipped items of correct type OR items equipped to this character specifically
  const items = inventory.filter(
    (item) =>
      item.type === type &&
      (item.equippedToCharacterId === null || item.equippedToCharacterId === character.id)
  );

  // Get currently equipped item
  const currentEquipped = items.find((item) => item.equippedToCharacterId === character.id);

  // Calculate stats with current equipment
  const currentStats = computeCharacterStats(character, inventory, companyWideAtkBuffPct);

  // Sort candidate items by baseStat
  const sortedItems = [...items.filter((item) => item.id !== currentEquipped?.id)].sort((a, b) => {
    if (sortOrder === 'desc') {
      return b.baseStat - a.baseStat;
    } else {
      return a.baseStat - b.baseStat;
    }
  });

  // Helper to color rarities
  const getRarityStyles = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'border-slate-300 bg-slate-50 text-slate-800';
      case 'rare':
        return 'border-sky-300 bg-sky-50 text-sky-800';
      case 'epic':
        return 'border-purple-300 bg-purple-50 text-purple-800';
      case 'legendary':
        return 'border-amber-400 bg-amber-50 text-amber-900 border-b-4';
      default:
        return 'border-slate-300 bg-slate-50 text-slate-800';
    }
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">コモン</span>;
      case 'rare':
        return <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-sky-200 text-sky-700">レア</span>;
      case 'epic':
        return <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-purple-200 text-purple-700">エピック</span>;
      case 'legendary':
        return <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-amber-200 text-amber-800 animate-pulse border border-amber-400">レジェンダリー</span>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4 backdrop-blur-xs font-dq text-[#4A2E1B]">
      <div className="bg-[#FAF6EE] rounded border-[4px] border-[#4A2E1B] shadow-[8px_8px_0px_#2E1B10] w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="bg-[#4A2E1B] text-white px-4 py-3 flex items-center justify-between border-b-2 border-yellow-700 shadow">
          <div>
            <h2 className="text-[9px] uppercase font-bold tracking-widest text-[#C19A6B]">
              ギルド・そうび変更 [ EQUIP INVENTORY ]
            </h2>
            <p className="text-sm font-black text-amber-300">
              {character.name}の{type === 'weapon' ? '武器(🗡️)' : '防具(🛡️)'}選択
            </p>
          </div>
          <button
            id="close-eq-selector"
            onClick={onClose}
            className="text-[#FAF6EE] hover:text-amber-300 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Stat Panel */}
        <div className="bg-[#F5EFE6] border-b-2 border-[#4A2E1B]/30 p-4 shrink-0">
          <h3 className="text-xs font-black text-[#8C7A65] mb-2 uppercase tracking-wide">
            現在のステータス
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#FAF6EE] border-2 border-[#4A2E1B] p-2 rounded">
              <span className="text-[9px] font-black text-[#8C7A65] uppercase block leading-none">戦闘力(Atk)</span>
              <span className="text-base font-black text-[#A33B20] mt-0.5 block">{currentStats.totalAtk}</span>
            </div>
            <div className="bg-[#FAF6EE] border-2 border-[#4A2E1B] p-2 rounded">
              <span className="text-[9px] font-black text-[#8C7A65] uppercase block leading-none">耐久力(Def)</span>
              <span className="text-base font-black text-[#203D54] mt-0.5 block">{currentStats.totalDef}</span>
            </div>
          </div>
        </div>

        {/* Items Scroll Area */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12 text-[#6E4F39] space-y-2">
              <AlertCircle className="w-10 h-10 mx-auto text-[#6E4F39]/60" />
              <p className="text-sm font-black">現在そうび可能な{type === 'weapon' ? 'ブキ' : 'ヨロイ'}がありません。</p>
              <p className="text-xs">「かじや」で新しい装備を製造してください！</p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Unequip Action if equipped */}
              {currentEquipped && (
                <div className="border-2 border-[#A33B20] bg-rose-50 p-3 rounded flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-black text-[#A33B20] uppercase block">現在そうび中:</span>
                    <h4 className="font-extrabold text-[#4A2E1B] text-sm">{currentEquipped.name}</h4>
                  </div>
                  <button
                    id="unequip-btn"
                    onClick={() => {
                      onEquip(character.id, null, type);
                      onClose();
                    }}
                    className="px-3 py-1 text-xs font-bold bg-[#FAF6EE] border-2 border-[#A33B20] text-[#A33B20] hover:bg-rose-100 rounded transition-all"
                  >
                    装備をはずす
                  </button>
                </div>
              )}

              {/* Sorting & Order Control */}
              <div className="flex items-center justify-between border-b-2 border-[#4A2E1B]/25 pb-2.5 mt-2 mb-1 flex-wrap gap-2 text-xs">
                <span className="font-extrabold text-[#4A2E1B] flex items-center gap-1.5">
                  💼 そうび候補一覧 ({sortedItems.length}個)
                </span>
                
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#8C7A65] font-bold">並び替え (基本性能):</span>
                  <div className="flex border-2 border-[#4A2E1B] rounded overflow-hidden">
                    <button
                      type="button"
                      id="sort-desc-btn"
                      onClick={() => setSortOrder('desc')}
                      className={`px-2 py-1 text-[10px] font-black transition-all cursor-pointer ${
                        sortOrder === 'desc'
                          ? 'bg-[#A33B20] text-white'
                          : 'bg-[#FAF6EE] text-[#4A2E1B] hover:bg-[#F5EFE6]'
                      }`}
                    >
                      高い順 ▽ (降順)
                    </button>
                    <button
                      type="button"
                      id="sort-asc-btn"
                      onClick={() => setSortOrder('asc')}
                      className={`px-2 py-1 text-[10px] font-black transition-all border-l-2 border-[#4A2E1B] cursor-pointer ${
                        sortOrder === 'asc'
                          ? 'bg-[#A33B20] text-white'
                          : 'bg-[#FAF6EE] text-[#4A2E1B] hover:bg-[#F5EFE6]'
                      }`}
                    >
                      低い順 △ (昇順)
                    </button>
                  </div>
                </div>
              </div>

              {/* Items List */}
              {sortedItems.map((item) => {
                  // Pre-calc what this item does to total ATK / DEF if selected
                  const tempInventory = inventory.map((invItem) => {
                    if (
                      invItem.equippedToCharacterId === character.id &&
                      invItem.type === type
                    ) {
                      return { ...invItem, equippedToCharacterId: null };
                    }
                    if (invItem.id === item.id) {
                      return { ...invItem, equippedToCharacterId: character.id };
                    }
                    return invItem;
                  });

                  const simulatedStats = computeCharacterStats(
                    character,
                    tempInventory,
                    companyWideAtkBuffPct
                  );

                  const atkDiff = simulatedStats.totalAtk - currentStats.totalAtk;
                  const defDiff = simulatedStats.totalDef - currentStats.totalDef;

                  return (
                    <div
                      key={item.id}
                      className={`border-2 rounded p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-shadow ${getRarityStyles(
                        item.rarity
                      )}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {getRarityBadge(item.rarity)}
                          <h4 className="font-black text-[#4A2E1B] text-sm md:text-base">
                            {item.name}
                          </h4>
                        </div>
                        
                        {/* Core base stat */}
                        <div className="mt-1 flex items-center gap-3 text-xs font-bold text-[#6E4F39]">
                          <span>
                            {type === 'weapon' ? '基本攻撃力 Atk' : '基本防御力 Def'}:{' '}
                            <strong className="text-[#4A2E1B]">{item.baseStat}</strong>
                          </span>
                        </div>

                        {/* Substats */}
                        {item.substats.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {item.substats.map((sub, sIdx) => (
                              <span
                                key={sIdx}
                                className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#FAF6EE] border border-[#4A2E1B]/35 text-[#4A2E1B]"
                              >
                                {sub.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Stat Differences Badge & Equip actions */}
                      <div className="flex items-center gap-2 mt-2 md:mt-0 shrink-0">
                        <div className="flex flex-col text-right pr-2">
                          {/* Attack diff */}
                          {atkDiff !== 0 && (
                            <span
                              className={`text-[10px] font-black ${
                                atkDiff > 0 ? 'text-emerald-700' : 'text-[#A33B20]'
                              }`}
                            >
                              攻 {atkDiff > 0 ? `+${atkDiff}` : atkDiff}
                            </span>
                          )}
                          {/* Defense diff */}
                          {defDiff !== 0 && (
                            <span
                              className={`text-[10px] font-black ${
                                defDiff > 0 ? 'text-emerald-700' : 'text-blue-800'
                              }`}
                            >
                              守 {defDiff > 0 ? `+${defDiff}` : defDiff}
                            </span>
                          )}
                          {atkDiff === 0 && defDiff === 0 && (
                            <span className="text-[10px] text-[#8C7A65] font-bold">
                              ±0
                            </span>
                          )}
                        </div>

                        <button
                          id={`equip-btn-${item.id}`}
                          onClick={() => {
                            onEquip(character.id, item.id, type);
                            onClose();
                          }}
                          className="px-3.5 py-1.5 text-xs font-black bg-[#203D54] hover:bg-[#132533] text-white rounded border-b-2 border-black active:border-b-0 cursor-pointer transition-all"
                        >
                          そうび
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#F5EFE6] border-t-2 border-[#4A2E1B]/30 p-4 flex justify-end shrink-0">
          <button
            id="close-eq-selector-footer"
            onClick={onClose}
            className="px-4 py-1.5 border-2 border-[#4A2E1B] bg-[#FAF6EE] hover:bg-[#F5EFE6] font-black text-xs rounded text-[#4A2E1B] transition-all cursor-pointer"
          >
            もどる
          </button>
        </div>

      </div>
    </div>
  );
};
