import React, { useState } from 'react';
import { Character, Equipment } from '../types';
import { computeCharacterStats } from '../gameEngine';
import { JOB_INFO } from '../constants';
import { User, Shield, Sword, Sparkles, LogOut } from 'lucide-react';

interface CharacterListProps {
  characters: Character[];
  inventory: Equipment[];
  gold: number;
  companyWideAtkBuffPct: number;
  onLevelUp: (charId: string) => void;
  onDismiss: (charId: string) => void;
  onOpenEquipSelector: (character: Character, type: 'weapon' | 'armor') => void;
}

export const CharacterList: React.FC<CharacterListProps> = ({
  characters,
  inventory,
  gold,
  companyWideAtkBuffPct,
  onLevelUp,
  onDismiss,
  onOpenEquipSelector,
}) => {
  const [confirmDismissId, setConfirmDismissId] = useState<string | null>(null);

  return (
    <div className="space-y-4 text-[#4A2E1B] font-dq">
      <div className="flex justify-between items-center border-b-2 border-[#4A2E1B] pb-2 mb-3">
        <div>
          <h2 className="text-sm font-black text-[#A33B20]">従業員名簿 (GUILD ACTIVE PERSONNEL ROSTER)</h2>
          <p className="text-xs text-[#6E4F39]">
            所属している従業員の訓練・育成、および提供武器・支給防具の配備を行います。
          </p>
        </div>
        <span className="text-[10px] bg-[#FAF6EE] text-[#4A2E1B] px-3 py-1 rounded font-black border-2 border-[#4A2E1B]">
          正社員 {characters.length}名
        </span>
      </div>

      {characters.length === 0 ? (
        <div className="bg-[#FAF6EE] border-[3px] border-[#4A2E1B] rounded-lg p-12 text-center text-[#6E4F39] shadow-[4px_4px_0px_#2E1B10]">
          <User className="w-12 h-12 mx-auto text-[#6E4F39] mb-3" />
          <p className="font-bold text-sm">社員がいません。</p>
          <p className="text-xs mt-1">「なかま」タブから、最初の冒険者を雇用してください！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {characters.map((char) => {
            // Compute current stats taking equipments, passive, jobs into account
            const stats = computeCharacterStats(char, inventory, companyWideAtkBuffPct);
            const levelUpCost = char.level * 160 + 120;
            const canLevelUp = gold >= levelUpCost && char.status === 'idle';

            return (
              <div
                key={char.id}
                className="bg-[#FAF6EE] border-[3px] border-[#4A2E1B] rounded-lg p-4 flex flex-col justify-between hover:border-[#2E1B10] transition-all shadow-[4px_4px_0px_#2E1B10] relative text-[#4A2E1B]"
              >
                {/* Status Overlay Badge */}
                <div className="absolute right-3 top-3 flex items-center gap-1.5 select-none">
                  <span
                    className={`text-[9px] uppercase font-black px-2 py-0.5 rounded border-2 ${
                      char.status === 'dispatched'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    }`}
                  >
                    ● {char.status === 'dispatched' ? '派遣中' : '待機'}
                  </span>
                </div>

                {/* Profile row */}
                <div>
                  <div className="flex items-start gap-3">
                    {/* Job Visual Avatar Pixel Art */}
                    <div className="w-14 h-14 rounded border-2 border-[#4A2E1B] bg-[#ECD8B6] overflow-hidden relative shrink-0 shadow">
                      <img
                        src={
                          char.job === 'warrior'
                            ? '/src/assets/images/warrior_pixel_1779353477274.png'
                            : char.job === 'mage'
                            ? '/src/assets/images/mage_pixel_1779353496698.png'
                            : '/src/assets/images/thief_pixel_1779353510388.png'
                        }
                        alt={char.job}
                        className="w-full h-full object-cover scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-[#4A2E1B]/85 text-[#FAF6EE] text-[8px] text-center font-black leading-none py-0.5 uppercase">
                        {JOB_INFO[char.job].label}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] border border-[#4A2E1B] bg-[#F5EFE6] px-2 py-0.5 rounded font-black text-[#A33B20]">
                          Lv.{char.level}
                        </span>
                        <h3 className="font-extrabold text-[#4A2E1B] text-sm md:text-base leading-tight">
                          {char.name}
                        </h3>
                      </div>
                      <p className="text-[10px] text-[#6E4F39] mt-1 max-w-[180px] md:max-w-xs leading-tight">
                        {JOB_INFO[char.job].desc}
                      </p>
                    </div>
                  </div>

                  {/* Core Combined Stats Block */}
                  <div className="mt-4 grid grid-cols-3 gap-2 bg-[#F5EFE6] border-2 border-[#4A2E1B] p-2.5 rounded text-center select-none">
                    <div>
                      <span className="text-[9px] text-[#8C7A65] font-extrabold uppercase block">攻撃力 Atk</span>
                      <span className="text-xs font-black text-[#A33B20] flex items-center justify-center gap-0.5">
                        <Sword className="w-3 h-3 shrink-0" />
                        {stats.totalAtk}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#8C7A65] font-extrabold uppercase block">守備力 Def</span>
                      <span className="text-xs font-black text-[#203D54] flex items-center justify-center gap-0.5">
                        <Shield className="w-3 h-3 shrink-0" />
                        {stats.totalDef}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#8C7A65] font-extrabold uppercase block font-mono">会心 / 派遣短縮</span>
                      <span className="text-[10px] font-black text-amber-700 block">
                        {stats.critRate}% / -{stats.timeReductionPct}%
                      </span>
                    </div>
                  </div>

                  {/* Equipment Slots */}
                  <div className="mt-4 space-y-2">
                    <span className="text-[10px] text-[#8C7A65] font-extrabold uppercase tracking-wider block">配備装備 (GUILD HANDOUT GEAR)</span>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Weapon slot */}
                      <button
                        id={`equip-weapon-${char.id}`}
                        disabled={char.status === 'dispatched'}
                        onClick={() => onOpenEquipSelector(char, 'weapon')}
                        className={`text-left p-2 border-2 rounded transition-colors text-xs flex items-center justify-between gap-1.5 ${
                          char.status === 'dispatched'
                            ? 'bg-[#F5EFE6] text-gray-400 cursor-not-allowed border-[#4A2E1B]/30'
                            : 'bg-[#FAF6EE] hover:bg-[#F5EFE6] border-[#4A2E1B] cursor-pointer'
                        }`}
                      >
                        <div className="truncate pr-1">
                          <span className="text-[8px] text-[#8C7A65] font-extrabold block leading-none">支給武器</span>
                          <span className="font-extrabold text-[#4A2E1B] text-[11px] truncate block mt-0.5">
                            🗡️ {stats.weaponName}
                          </span>
                        </div>
                        {char.status !== 'dispatched' && <span className="text-[#A33B20] text-[9px] font-black shrink-0 border border-[#A33B20]/30 px-1 rounded bg-[#FAF6EE] shadow-sm">換装</span>}
                      </button>

                      {/* Armor slot */}
                      <button
                        id={`equip-armor-${char.id}`}
                        disabled={char.status === 'dispatched'}
                        onClick={() => onOpenEquipSelector(char, 'armor')}
                        className={`text-left p-2 border-2 rounded transition-colors text-xs flex items-center justify-between gap-1.5 ${
                          char.status === 'dispatched'
                            ? 'bg-[#F5EFE6] text-gray-400 cursor-not-allowed border-[#4A2E1B]/30'
                            : 'bg-[#FAF6EE] hover:bg-[#F5EFE6] border-[#4A2E1B] cursor-pointer'
                        }`}
                      >
                        <div className="truncate pr-1">
                          <span className="text-[8px] text-[#8C7A65] font-extrabold block leading-none">支給防具</span>
                          <span className="font-extrabold text-[#4A2E1B] text-[11px] truncate block mt-0.5">
                            🛡️ {stats.armorName}
                          </span>
                        </div>
                        {char.status !== 'dispatched' && <span className="text-[#A33B20] text-[9px] font-black shrink-0 border border-[#A33B20]/30 px-1 rounded bg-[#FAF6EE] shadow-sm">換装</span>}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Level Up & Dismiss Footer */}
                <div className="mt-5 pt-3 border-t border-[#4A2E1B]/20 flex items-center justify-between gap-2 shrink-0">
                  {/* Dismiss option with inline secure confirmation */}
                  {confirmDismissId === char.id ? (
                    <div className="flex items-center gap-1.5 p-1 bg-red-100 border border-[#A33B20] rounded animate-pulse">
                      <span className="text-[8.5px] font-black text-[#A33B20] leading-none">解雇？ (逆戻G+300)</span>
                      <button
                        id={`confirm-dismiss-yes-${char.id}`}
                        onClick={() => {
                          onDismiss(char.id);
                          setConfirmDismissId(null);
                        }}
                        className="px-1.5 py-0.5 text-[8.5px] bg-[#A33B20] text-white rounded font-extrabold cursor-pointer border border-[#4A2E1B]"
                      >
                        はい
                      </button>
                      <button
                        id={`confirm-dismiss-no-${char.id}`}
                        onClick={() => setConfirmDismissId(null)}
                        className="px-1.5 py-0.5 text-[8.5px] bg-stone-500 text-white rounded font-extrabold cursor-pointer border border-[#4A2E1B]"
                      >
                        いいえ
                      </button>
                    </div>
                  ) : (
                    <button
                      id={`dismiss-btn-${char.id}`}
                      disabled={char.status === 'dispatched'}
                      onClick={() => setConfirmDismissId(char.id)}
                      className={`p-1.5 rounded border-2 border-[#4A2E1B]/30 transition-all flex items-center justify-center ${
                        char.status === 'dispatched'
                          ? 'text-gray-405 cursor-not-allowed opacity-40'
                          : 'text-[#A33B20] bg-red-50 hover:bg-red-100 cursor-pointer'
                      }`}
                      title="この冒険者をギルド引退させ、退職給与300Gを手配します。"
                    >
                      <LogOut className="w-3.5 h-3.5 shrink-0 animate-pulse text-[#A33B20]" />
                      <span className="text-[9px] font-black ml-1 leading-none">おわかれ</span>
                    </button>
                  )}

                  {/* Level up option */}
                  <button
                    id={`levelup-btn-${char.id}`}
                    onClick={() => onLevelUp(char.id)}
                    disabled={!canLevelUp}
                    className={`px-3 py-1.5 rounded text-[11px] font-black shadow-sm border-b-4 active:translate-y-[2px] active:border-b-0 transition-all flex items-center gap-1 ${
                      canLevelUp
                        ? 'bg-[#203D54] border-[#132533] text-white hover:bg-[#132533] cursor-pointer'
                        : 'bg-stone-200 border-stone-300 text-stone-400 cursor-not-allowed'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    訓練強化
                    <span className="font-mono text-[9px] ml-1 bg-black/10 px-1.5 py-0.5 rounded select-none">
                      {levelUpCost}G
                    </span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
