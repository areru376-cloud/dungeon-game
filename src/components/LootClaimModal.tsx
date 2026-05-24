import React from 'react';
import { Equipment } from '../types';
import { Coins, Ticket, Sparkles, Hammer, X, Award, Flame, Star } from 'lucide-react';
import { motion } from 'motion/react';

interface LootClaimModalProps {
  charName: string;
  dungeonName: string;
  goldEarned: number;
  ironCount: number;
  magicCount: number;
  dragonCount: number;
  ticketFound: boolean;
  foundItem: Equipment | null;
  onClear: () => void;
  success?: boolean;
}

export const LootClaimModal: React.FC<LootClaimModalProps> = ({
  charName,
  dungeonName,
  goldEarned,
  ironCount,
  magicCount,
  dragonCount,
  ticketFound,
  foundItem,
  onClear,
  success = true,
}) => {
  // Helper for background glowing according to item rarity
  const getGearRarityStyles = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'border-[#4A2E1B]/30 bg-[#FAF6EE] text-[#4A2E1B] shadow-xs';
      case 'rare':
        return 'border-indigo-400 bg-indigo-50/70 text-indigo-950 shadow-sm';
      case 'epic':
        return 'border-purple-400 bg-purple-50/70 text-purple-950 shadow-md';
      case 'legendary':
        return 'border-amber-500 bg-amber-50 text-amber-950 shadow-xl ring-2 ring-amber-300/40 border-b-8 animate-pulse';
      default:
        return 'border-[#4A2E1B]/30 bg-[#FAF6EE] text-[#4A2E1B]';
    }
  };

  const RarityText = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'コモン';
      case 'rare': return 'レア';
      case 'epic': return 'エピック';
      case 'legendary': return '🌟レジェンダリー🌟';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2E1B10]/70 flex items-center justify-center p-4 backdrop-blur-xs font-dq select-none text-[#4A2E1B]">
      <motion.div
         initial={{ scale: 0.9, opacity: 0, y: 15 }}
         animate={{ scale: 1, opacity: 1, y: 0 }}
         transition={{ type: 'spring', duration: 0.5 }}
         className="bg-[#FAF6EE] rounded-lg border-[4px] border-[#4A2E1B] shadow-[6px_6px_0px_#2E1B10] w-full max-w-md overflow-hidden"
       >
         
         {/* Header Block */}
         <div className={`p-5 text-center relative border-b-[4px] border-[#4A2E1B] ${success ? 'bg-[#A33B20] text-white' : 'bg-[#5C4033] text-[#FAF6EE]'}`}>
           {success ? (
             <Sparkles className="w-8 h-8 text-amber-300 mx-auto mb-1 animate-spin" style={{ animationDuration: '8s' }} />
           ) : (
             <Flame className="w-8 h-8 text-red-400 mx-auto mb-1 animate-pulse" />
           )}
           <h2 className={`text-xs font-bold uppercase tracking-wider ${success ? 'text-amber-200' : 'text-red-300'}`}>
             {success ? '探検報告報酬 クレーム [ COMPLETED LOOT ]' : '全滅・作戦未クリア報告 [ EMERGENCY RETURN ]'}
           </h2>
           <p className="text-base font-black truncate max-w-xs mx-auto mt-1">
             {success ? `${charName} がオフィスに帰還しました！` : `${charName} が全滅・敗退して帰還しました！`}
           </p>
           <p className={`text-[10px] font-mono mt-1 ${success ? 'text-amber-100' : 'text-stone-300'}`}>
             派遣先: {dungeonName}
           </p>
         </div>

        {/* Content Spoils */}
        <div className="p-5 space-y-4">
          <h3 className="text-xs font-black text-[#8C7A65] uppercase tracking-wider text-center">
            獲得した純資産・素材
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {/* Gold Spoils */}
            <div className="bg-[#F5EFE6] border-2 border-[#4A2E1B] p-3 rounded flex items-center gap-2.5 shadow-[2px_2px_0px_#4A2E1B]">
              <Coins className="w-5 h-5 text-amber-600 shrink-0 animate-bounce" />
              <div>
                <span className="text-[9px] text-[#6E4F39] font-bold block uppercase">会社ゴールド</span>
                <span className="font-extrabold text-[#A67C00] text-sm font-mono">+{goldEarned.toLocaleString()}G</span>
              </div>
            </div>

            {/* Ticket Spoils if found */}
            {ticketFound ? (
              <div className="bg-emerald-50 border-2 border-emerald-600 p-3 rounded flex items-center gap-2.5 animate-bounce shadow-[2px_2px_0px_#1B5E20]">
                <Ticket className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-[9px] text-emerald-800 font-bold block uppercase">紹介状</span>
                  <span className="font-black text-emerald-900 text-sm font-mono">+1 枚</span>
                </div>
              </div>
            ) : (
              <div className="bg-[#F5EFE6] border border-[#4A2E1B]/30 p-3 rounded flex items-center gap-2.5 opacity-60">
                <Ticket className="w-5 h-5 text-[#8C7A65] shrink-0" />
                <div>
                  <span className="text-[9px] text-[#8C7A65] font-bold block uppercase">紹介状</span>
                  <span className="font-bold text-xs">なし</span>
                </div>
              </div>
            )}
          </div>

          {/* Craft materials list if any found */}
          <div className="bg-[#F5EFE6] rounded-lg p-3.5 border-2 border-[#4A2E1B]/40">
            <span className="text-[9px] text-[#6E4F39] font-black uppercase tracking-wider block mb-2 text-center">獲得資材スロット</span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#FAF6EE] p-1.5 rounded border border-[#4A2E1B]/25">
                <span className="text-[9px] text-[#6E4F39] block">鉄鉱石</span>
                <span className={`text-xs font-mono font-black ${ironCount > 0 ? 'text-[#4A2E1B]' : 'text-stone-400'}`}>
                  {ironCount > 0 ? `+${ironCount}` : '0'}個
                </span>
              </div>
              <div className="bg-[#FAF6EE] p-1.5 rounded border border-[#4A2E1B]/25">
                <span className="text-[9px] text-indigo-700 block text-indigo-700">結晶</span>
                <span className={`text-xs font-mono font-black ${magicCount > 0 ? 'text-indigo-805' : 'text-stone-400'}`}>
                  {magicCount > 0 ? `+${magicCount}` : '0'}個
                </span>
              </div>
              <div className="bg-[#FAF6EE] p-1.5 rounded border border-[#4A2E1B]/25">
                <span className="text-[9px] text-rose-700 block">逆鱗</span>
                <span className={`text-xs font-mono font-black ${dragonCount > 0 ? 'text-rose-800' : 'text-stone-400'}`}>
                  {dragonCount > 0 ? `+${dragonCount}` : '0'}個
                </span>
              </div>
            </div>
          </div>

          {/* Equipment spoils card representation */}
          {foundItem !== null ? (
            <div className="space-y-1.5">
              <span className="text-[9px] text-amber-700 font-black uppercase tracking-wider block text-center animate-pulse">
                ✨ 激レア装備品の発掘に成功！ ✨
              </span>
              <div className={`border-2 rounded-lg p-3.5 ${getGearRarityStyles(foundItem.rarity)}`}>
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-sm md:text-base tracking-tight text-[#4A2E1B]">
                    {foundItem.type === 'weapon' ? '⚔️' : '🛡️'} {foundItem.name}
                  </h4>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#FAF6EE] border border-[#4A2E1B]/35 text-[#4A2E1B]">
                    {RarityText(foundItem.rarity)}
                  </span>
                </div>

                <div className="text-xs text-[#6E4F39] font-bold mt-1.5">
                  {foundItem.type === 'weapon' ? '攻撃適合度' : '耐衝撃力'}:{' '}
                  <span className="text-[#4A2E1B] font-extrabold font-mono">{foundItem.baseStat}</span>
                </div>

                {foundItem.substats.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {foundItem.substats.map((sub, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] px-1.5 py-0.5 bg-[#FAF6EE] border border-[#4A2E1B]/30 text-[#4A2E1B] font-black rounded"
                      >
                        {sub.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 border-2 border-dashed border-[#4A2E1B]/30 rounded text-xs text-[#8C7A65] bg-[#F5EFE6]/50">
              装備品は発見されませんでした
            </div>
          )}
        </div>

        {/* Claim Confirm Footer button */}
        <div className="bg-[#F5EFE6] px-5 py-4 flex justify-center border-t border-[#4A2E1B]/35">
          <button
            id="loot-claim-confirm-btn"
            onClick={onClear}
            className="w-full py-2.5 font-black text-xs bg-[#A33B20] border-2 border-[#5C2316] hover:bg-[#862D14] text-white rounded shadow-md border-b-4 active:border-b-0 active:translate-y-[2px] transition-all cursor-pointer"
          >
            {success ? '金庫・倉庫へ保管する (領収)' : '敗走帰還認可・残骸物資を受け取る'}
          </button>
        </div>

      </motion.div>
    </div>
  );
};
