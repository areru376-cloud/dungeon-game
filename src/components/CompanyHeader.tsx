import React from 'react';
import { Coins, Ticket, Hammer, Briefcase, ChevronUp } from 'lucide-react';

interface CompanyHeaderProps {
  gold: number;
  autoSalesLevel: number;
  tickets: number;
  ironOre: number;
  magicStone: number;
  dragonScale: number;
  activeDispatchesCount: number;
  maxDispatchesCount: number;
  onUpgradeSales: () => void;
  salesUpgradeCost: number;
}

export const CompanyHeader: React.FC<CompanyHeaderProps> = ({
  gold,
  autoSalesLevel,
  tickets,
  ironOre,
  magicStone,
  dragonScale,
  activeDispatchesCount,
  maxDispatchesCount,
  onUpgradeSales,
  salesUpgradeCost,
}) => {
  const autoIncome = autoSalesLevel * 3;

  return (
    <div className="bg-[#FAF6EE] border-[4px] border-[#4A2E1B] rounded-lg p-4 md:p-5 shadow-[4px_4px_0px_#2E1B10] mb-6 text-[#4A2E1B] font-dq select-none">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Top bar with Company Title and Core Status Indicators */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          
          {/* DQ Logo Banner */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#ECD8B6] border-2 border-[#4A2E1B] rounded flex items-center justify-center overflow-hidden shrink-0 select-none shadow-[inset_0_0_4px_rgba(0,0,0,0.3)]">
              <img
                src="/src/assets/images/warrior_pixel_1779353477274.png"
                alt="Mascot"
                className="w-full h-full object-cover scale-110"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-black tracking-wider text-[#A33B20]">
                極限！無限ダンジョン派遣ギルド
              </h1>
              <p className="text-[10px] text-[#6E4F39] mt-0.5 tracking-widest font-mono">
                [ GUILD COMMAND STATION • LEVEL.8-BIT ]
              </p>
            </div>
          </div>

          {/* Quick HUD Metrics */}
          <div className="grid grid-cols-3 md:flex items-center gap-2 sm:gap-3 w-full md:w-auto">
            
            {/* Gold HUD */}
            <div className="bg-[#F5EFE6] border-2 border-[#4A2E1B] rounded px-2 md:px-4 py-1.5 text-right flex flex-col justify-between shadow-[2px_2px_0px_#4A2E1B]">
              <span className="text-[10px] text-[#6E4F39] block font-black tracking-wider">
                所持ゴールド
              </span>
              <span className="text-xs md:text-sm font-black text-[#A67C00] font-mono mt-0.5 flex items-center justify-end gap-1">
                🪙 {gold.toLocaleString()}G
              </span>
            </div>

            {/* Tickets HUD */}
            <div className="bg-[#F5EFE6] border-2 border-[#4A2E1B] rounded px-2 md:px-4 py-1.5 text-right flex flex-col justify-between shadow-[2px_2px_0px_#4A2E1B]">
              <span className="text-[10px] text-[#6E4F39] block font-black tracking-wider">
                しょうかいじょう
              </span>
              <span className="text-xs md:text-sm font-black text-indigo-700 font-mono mt-0.5 flex items-center justify-end gap-1">
                🎫 {tickets.toLocaleString()}枚
              </span>
            </div>

            {/* Efficiency HUD */}
            <div className="bg-[#F5EFE6] border-2 border-[#4A2E1B] rounded px-2 md:px-4 py-1 flex flex-col justify-between shadow-[2px_2px_0px_#4A2E1B]">
              <div className="flex justify-between items-center gap-1.5">
                <span className="text-[9px] text-[#6E4F39] block tracking-wider font-sans font-bold">
                  じどう営業
                </span>
                <button
                  id="upgrade-sales-btn"
                  onClick={onUpgradeSales}
                  disabled={gold < salesUpgradeCost}
                  className={`text-[8px] md:text-[9px] px-2 py-0.5 font-black border-2 rounded cursor-pointer select-none transition-colors ${
                    gold >= salesUpgradeCost
                      ? 'bg-[#A33B20] text-white border-[#5C2316] hover:bg-[#8F2D14]'
                      : 'bg-[#D3C4B3] text-[#8C7A65] border-[#A69580] cursor-not-allowed'
                  }`}
                  title={`社長の営業レベルアップ (費用: ${salesUpgradeCost}G)`}
                >
                  UP
                </button>
              </div>
              <span className="text-[10px] md:text-xs font-black text-emerald-800 font-mono tracking-wide mt-0.5 whitespace-nowrap block">
                +{autoIncome}/秒 <span className="text-[8px] text-[#6E4F39]">Lv.{autoSalesLevel}</span>
              </span>
            </div>

          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-[#4A2E1B]/30 w-full"></div>

        {/* Inventory Stockpile of Loot and Dispatch headcount */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          
          {/* Loot list */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="text-[#6E4F39] font-black text-[10px] tracking-widest uppercase mb-0.5">
              [ おおどうぐそうこの素材 ]
            </span>
            <div className="flex items-center gap-1.5 bg-[#FAF6EE] border border-[#4A2E1B] px-2.5 py-1 rounded shadow-inner">
              <span className="w-2.5 h-2.5 bg-neutral-600 rounded-full animate-pulse border border-[#4A2E1B]"></span>
              <span className="text-[#4A2E1B] text-[10px] font-bold">てつこうせき:</span>
              <span className="font-extrabold text-[#A33B20] font-mono text-xs">{ironOre}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#FAF6EE] border border-[#4A2E1B] px-2.5 py-1 rounded shadow-inner">
              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse border border-white"></span>
              <span className="text-[#4A2E1B] text-[10px] font-bold">まほうけっしょう:</span>
              <span className="font-extrabold text-indigo-700 font-mono text-xs">{magicStone}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#FAF6EE] border border-[#4A2E1B] px-2.5 py-1 rounded shadow-inner">
              <span className="w-2.5 h-2.5 bg-red-650 rounded-full animate-pulse border border-yellow-350"></span>
              <span className="text-[#4A2E1B] text-[10px] font-bold">りゅうのぎゃくりん:</span>
              <span className="font-extrabold text-rose-800 font-mono text-xs">{dragonScale}</span>
            </div>
          </div>

          {/* Current running activity count as full-screen command party */}
          <div className="flex items-center gap-1.5 text-[#4A2E1B] bg-[#F5EFE6] border-2 border-dashed border-[#4A2E1B]/60 rounded px-3 py-1 font-mono tracking-wider text-[11px]">
            <Briefcase className="w-3.5 h-3.5 text-[#A33B20] shrink-0" />
            <span>
              はけんちゅう: <strong className="text-[#A33B20] font-black">{activeDispatchesCount}</strong> / {maxDispatchesCount}名
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
