import React, { useState } from 'react';
import { Ticket, Coins, Sparkles, Check } from 'lucide-react';
import { Character, JobType } from '../types';
import { JOB_INFO } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

interface GachaPanelProps {
  gold: number;
  tickets: number;
  onRollGacha: (useTicket: boolean) => { character: Character; cost: number } | null;
}

export const GachaPanel: React.FC<GachaPanelProps> = ({
  gold,
  tickets,
  onRollGacha,
}) => {
  const [isRolling, setIsRolling] = useState(false);
  const [rolledChar, setRolledChar] = useState<Character | null>(null);

  const GOLD_COST = 500;

  const handleRoll = (useTicket: boolean) => {
    if (useTicket && tickets < 1) return;
    if (!useTicket && gold < GOLD_COST) return;

    setIsRolling(true);
    setRolledChar(null);

    setTimeout(() => {
      const result = onRollGacha(useTicket);
      setIsRolling(false);
      if (result) {
        setRolledChar(result.character);
      }
    }, 900);
  };

  return (
    <div className="bg-[#FAF6EE] border-[4px] border-[#4A2E1B] rounded-lg p-4 md:p-5 shadow-[4px_4px_0px_#2E1B10] text-[#4A2E1B] font-dq select-none">
      
      {/* Title */}
      <div className="mb-4">
        <h2 className="text-base font-black border-b border-dashed border-[#4A2E1B]/50 pb-2 mb-2 flex items-center gap-2 text-[#A33B20]">
          <span>👥</span> ルイーダ風 なかま紹介所 [ RECRUIT TAVERN ]
        </h2>
        <p className="text-xs text-[#5C4033]">
          ゴールド、または貴重な「しょうかいじょう」を使い、会社を支える有能な戦力を集めます。
        </p>
      </div>

      {/* Grid of options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Normal Recruit Choice */}
        <div className="border-2 border-[#4A2E1B] rounded p-4 bg-[#F5EFE6] flex flex-col justify-between hover:border-[#4A2E1B] hover:bg-[#EFEBDF] transition-colors shadow-sm">
          <div>
            <span className="text-[10px] text-[#4A2E1B] border border-[#4A2E1B] px-2 py-0.5 rounded-full bg-[#FAF6EE] mb-2 inline-block font-bold">
              ゴールド雇用
            </span>
            <h3 className="text-sm font-black text-[#A33B20]">
              ▶ いっぱんの求人をだす
            </h3>
            <p className="text-[11px] text-[#5C4033] mt-1">
              標準的な紹介。ランダムな職業の冒険者を1人雇い入れます。
            </p>
          </div>
          
          <div className="mt-4 pt-3 border-t border-[#4A2E1B]/35 flex items-center justify-between text-xs">
            <span className="font-mono text-[#A67C00] font-black">
              🪙 500 G 必要
            </span>
            <button
              id="roll-gold-btn"
              onClick={() => handleRoll(false)}
              disabled={isRolling || gold < GOLD_COST}
              className={`px-4 py-1.5 text-xs font-black rounded border-2 transition-colors ${
                gold >= GOLD_COST && !isRolling
                  ? 'bg-[#A33B20] border-amber-200 text-white cursor-pointer hover:bg-[#8F2D14]'
                  : 'bg-[#D3C4B3] border-[#A69580] text-[#8C7A65] cursor-not-allowed'
              }`}
            >
              求人をだす
            </button>
          </div>
        </div>

        {/* Elite Ticket Recruit Choice */}
        <div className="border-2 border-[#4A2E1B] rounded p-4 bg-[#F5EFE6] flex flex-col justify-between hover:border-[#4A2E1B] hover:bg-[#EFEBDF] transition-colors shadow-sm">
          <div>
            <span className="text-[10px] text-white border border-[#4A2E1B] px-2 py-0.5 rounded-full bg-[#A33B20] mb-2 inline-block font-bold">
              しょうかいじょう雇用 (超特化)
            </span>
            <h3 className="text-sm font-black text-indigo-800">
              ▶ とくせん求人をだす
            </h3>
            <p className="text-[11px] text-[#5C4033] mt-1 leading-relaxed">
              紹介状を消費。<strong>圧倒的な能力を持つ「エリート社員」</strong>を確実に獲得します。初期Lv.20~25、各基礎ステータスがデフォルトの<strong>4.5倍</strong>でスタート！さらにエリート限定の<strong>常時1.5倍ステータス乗算、会心+20%、ゴールド効率+25%、時間短縮+15%</strong>が乗る最強仕様です。
            </p>
          </div>
          
          <div className="mt-4 pt-3 border-t border-[#4A2E1B]/35 flex items-center justify-between text-xs">
            <span className="font-mono text-indigo-700 font-black">
              🎫 しょうかいじょう 1枚
            </span>
            <button
              id="roll-ticket-btn"
              onClick={() => handleRoll(true)}
              disabled={isRolling || tickets < 1}
              className={`px-4 py-1.5 text-xs font-black rounded border-2 transition-colors ${
                tickets >= 1 && !isRolling
                  ? 'bg-[#C19A6B] border-[#4A2E1B] text-black cursor-pointer hover:bg-[#B0895B]'
                  : 'bg-[#D3C4B3] border-[#A69580] text-[#8C7A65] cursor-not-allowed'
              }`}
            >
              紹介状を使う
            </button>
          </div>
        </div>

      </div>

      {/* Animation slot / roll display */}
      <div className="mt-6 border-2 border-dashed border-[#4A2E1B]/60 rounded bg-[#FAF6EE] p-4 min-h-[140px] flex items-center justify-center relative overflow-hidden">
        <AnimatePresence mode="wait">
          {isRolling && (
            <motion.div
              key="rolling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-2.5"
            >
              <div className="w-8 h-8 border-4 border-[#A33B20] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-[#A33B20] animate-pulse tracking-widest font-black">
                なかまを よんでいます......
              </p>
            </motion.div>
          )}

          {!isRolling && rolledChar === null && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-[#5C4033] max-w-sm"
            >
              <Sparkles className="w-5 h-5 text-amber-600 mx-auto opacity-70 mb-1 animate-pulse" />
              <p className="text-xs font-black">「ルイージではない。ルイーダですぞ。」</p>
              <p className="text-[9px] text-[#8C7A65] mt-0.5">ギルドに登録されている優秀な冒険者を招集します。</p>
            </motion.div>
          )}

          {!isRolling && rolledChar !== null && (
            <motion.div
              key="result"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md bg-[#FDFBF7] border-[3px] border-[#4A2E1B] rounded p-4 relative overflow-hidden text-[#4A2E1B] shadow-md"
            >
              <div className="absolute -right-5 -top-5 w-12 h-12 bg-[#FAF6EE] border-2 border-[#4A2E1B] rounded-full flex items-center justify-center text-amber-650 text-xs font-black animate-bounce">
                ★
              </div>

              <div className="flex gap-3">
                
                {/* Job mark pixel art */}
                <div className="w-16 h-16 bg-[#ECD8B6] border-2 border-[#4A2E1B] rounded overflow-hidden flex flex-col items-center justify-center shrink-0 relative">
                  <img
                    src={
                      rolledChar.job === 'warrior'
                        ? '/src/assets/images/warrior_pixel_1779353477274.png'
                        : rolledChar.job === 'mage'
                        ? '/src/assets/images/mage_pixel_1779353496698.png'
                        : '/src/assets/images/thief_pixel_1779353510388.png'
                    }
                    alt={rolledChar.job}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-[#4A2E1B]/85 text-[#FAF6EE] text-[8px] text-center font-black leading-none py-0.5 uppercase">
                    {JOB_INFO[rolledChar.job].label}
                  </span>
                </div>

                {/* Character specifications reveal */}
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] border border-[#4A2E1B] px-1.5 py-0.2 rounded bg-[#C19A6B] text-black font-extrabold">
                      Lv.{rolledChar.level}
                    </span>
                    <h3 className="font-extrabold text-sm text-[#A33B20]">
                      {rolledChar.name}
                    </h3>
                  </div>

                  <p className="text-[10px] text-[#6E4F39] mt-1 italic font-bold">
                    「お任せください！わたしが必ずや、勝利を呼んでみせましょう。」
                  </p>

                  <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10px] border-t border-[#4A2E1B]/30 pt-2 font-mono">
                    <div>
                      <span className="text-[#8C7A65]">しゅうせんATK:</span>{' '}
                      <span className="text-[#2C1D11] font-bold">{rolledChar.baseAtk}</span>
                    </div>
                    <div>
                      <span className="text-[#8C7A65]">しごとボーナス:</span>{' '}
                      <span className="text-indigo-700 font-bold">{JOB_INFO[rolledChar.job].statBonus}</span>
                    </div>
                  </div>

                  {rolledChar.isElite && (
                    <div className="mt-2 text-[9.5px] text-[#A33B20] font-black bg-[#FFF3E0] border border-amber-600/30 p-1.5 rounded leading-tight">
                      ✨ エリート正社員ボーナス: <br/>ステータス 1.5倍 / 会心率+20% / ゴールド+25% / 派遣時間短縮+15%
                    </div>
                  )}
                </div>

              </div>

              {/* Accept feedback */}
              <div className="mt-3 bg-[#F5EFE6] border border-[#4A2E1B] px-2.5 py-1 text-center rounded text-[10px] text-emerald-800 font-extrabold font-dq">
                ▶ {rolledChar.name} が なかまに くわわった！
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

