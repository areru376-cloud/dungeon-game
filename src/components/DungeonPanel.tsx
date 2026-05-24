import React, { useState } from 'react';
import { Dungeon, Character, Equipment } from '../types';
import { INITIAL_DUNGEONS, JOB_INFO } from '../constants';
import { computeCharacterStats } from '../gameEngine';
import { Play, ShieldAlert, CheckCircle, Skull, Compass, Clock, Coins, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

interface DungeonPanelProps {
  characters: Character[];
  inventory: Equipment[];
  deepestAbyssFloor: number;
  companyWideAtkBuffPct: number;
  onDispatch: (charId: string, dungeonId: string, recommendedAtk: number, durationMs: number, autoLoop?: boolean) => void;
  tutorialStep?: number;
  showTutorial?: boolean;
}

export const DungeonPanel: React.FC<DungeonPanelProps> = ({
  characters,
  inventory,
  deepestAbyssFloor,
  companyWideAtkBuffPct,
  onDispatch,
  tutorialStep,
  showTutorial,
}) => {
  const [selectedDungeonId, setSelectedDungeonId] = useState<string>('dungeon_1');
  const [selectedCharId, setSelectedCharId] = useState<string>('');
  const [abyssFloor, setAbyssFloor] = useState<number>(1);
  const [autoLoop, setAutoLoop] = useState<boolean>(false);

  // 奈落の階層を選んだときは、デフォルトでその時挑戦できる1番高い階を表示する
  React.useEffect(() => {
    if (selectedDungeonId === 'dungeon_infinite') {
      setAbyssFloor(deepestAbyssFloor);
    }
  }, [selectedDungeonId, deepestAbyssFloor]);

  const abyssDungeon: Dungeon = {
    id: 'dungeon_infinite',
    name: `極限の奈落 (${abyssFloor}層)`,
    recommendAtk: 4000 + abyssFloor * 8000,
    durationSec: 10 + Math.round(abyssFloor * 1.5),
    goldReward: Math.round(400 * Math.pow(1.35, abyssFloor)),
    ironReward: 5 + Math.round(abyssFloor * 1.5),
    gemReward: abyssFloor >= 3 ? Math.round(2 + abyssFloor * 0.7) : 0,
    dragonReward: abyssFloor >= 8 ? Math.round(1 + abyssFloor * 0.15) : 0,
    isInfinite: true,
    description: `最深層を目指し、高レア素材(竜の逆鱗など)をおおく発掘する。(自己記録: ${deepestAbyssFloor}層)`,
  };

  const dungeons = [...INITIAL_DUNGEONS, abyssDungeon];
  const currentDungeon = dungeons.find((d) => d.id === selectedDungeonId) || dungeons[0];
  const idleCharacters = characters.filter((char) => char.status === 'idle');
  const chosenChar = characters.find((c) => c.id === selectedCharId);
  const chosenCharStats = chosenChar ? computeCharacterStats(chosenChar, inventory, companyWideAtkBuffPct) : null;

  const getSimulatedDuration = (baseSec: number, charStats: any) => {
    if (!charStats) return baseSec;
    const reductionMultiplier = 1 - charStats.timeReductionPct / 100;
    return Math.max(2, Math.round(baseSec * reductionMultiplier));
  };

  const handleStartDispatch = () => {
    if (!selectedCharId || !currentDungeon) return;
    const recAtk = currentDungeon.recommendAtk;
    const activeStats = computeCharacterStats(chosenChar!, inventory, companyWideAtkBuffPct);
    const durationSec = getSimulatedDuration(currentDungeon.durationSec, activeStats);
    onDispatch(selectedCharId, currentDungeon.id, recAtk, durationSec * 1000, autoLoop);
    setSelectedCharId('');
    setAutoLoop(false);
  };

  return (
    <div className="space-y-6 text-[#4A2E1B] font-dq select-none">
      
      {/* Title Panel */}
      <div className="bg-[#FAF6EE] border-[3px] border-[#4A2E1B] rounded-lg p-4 shadow-md">
        <h2 className="text-base font-black border-b border-dashed border-[#4A2E1B]/30 pb-2 mb-2 flex items-center gap-2 text-[#A33B20]">
          <Compass className="w-5 h-5 text-[#A33B20] shrink-0 animate-spin" style={{ animationDuration: '10s' }} />
          しゅつげき しれいじょ [ EXPEDITION GATEWAY ]
        </h2>
        <p className="text-xs text-[#6E4F39]">
          冒険するダンジョンを選び、その真下に展開される社員リストから派遣要員を決定してゴールドとクラフト素材を獲得します。
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
        
        {/* Left window: Dungeons list */}
        <div className="space-y-3.5 bg-[#FAF6EE] border-[3px] border-[#4A2E1B] rounded-lg p-4 md:p-5 shadow-[4px_4px_0px_#2E1B10]">
          <span className="text-xs font-black text-[#A33B20] uppercase tracking-widest block border-b pb-1.5 mb-2.5 border-[#4A2E1B]/15">
            ⚔️ いきたいダンジョンをタッチして選ぶ
          </span>

          <div className="space-y-4">
            {dungeons.map((d) => {
              const isSelected = selectedDungeonId === d.id;
              const isTutorialHighlight = showTutorial && tutorialStep === 2 && d.id === 'dungeon_1' && !isSelected;
              return (
                <div
                  key={d.id}
                  id={`select-dungeon-${d.id}`}
                  onClick={() => {
                    setSelectedDungeonId(d.id);
                    setSelectedCharId('');
                    setAutoLoop(false);
                  }}
                  className={`border-[2.5px] rounded-lg p-3.5 text-left cursor-pointer transition-all relative overflow-hidden bg-[#FAF6EE] ${
                    isSelected
                      ? 'border-[#4A2E1B] bg-[#FFFBF3] shadow-[4px_4px_0px_#4A2E1B] scale-[1.01]'
                      : isTutorialHighlight
                      ? 'border-amber-500 bg-amber-50 ring-4 ring-amber-300 animate-pulse'
                      : 'border-[#4A2E1B]/20 hover:border-[#4A2E1B]/60'
                  }`}
                >
                  <div className="flex justify-between items-center text-sm md:text-base mb-1">
                    <h3 className="font-extrabold flex items-center gap-1.5">
                      <span className={isSelected ? 'text-[#A33B20]' : 'text-[#8C7A65]'}>
                        {isSelected ? '▶' : '▷'}
                      </span>
                      <span className={isSelected ? 'text-[#A33B20] font-black' : 'text-[#4A2E1B]'}>
                        {d.isInfinite ? `極限の奈落 (${abyssFloor}F)` : d.name}
                      </span>
                    </h3>
                    
                    {d.isInfinite && (
                      <span className="text-[10px] font-black border-2 border-[#A33B20]/40 text-[#A33B20] px-2 py-0.5 rounded bg-[#FAF6EE] select-none">
                        INFINITY
                      </span>
                    )}
                  </div>

                  <p className="text-[11.5px] text-[#6E4F39] mt-1.5 leading-relaxed">{d.description}</p>

                  <div className="mt-2.5 text-[11px] text-[#6E4F39] flex justify-between font-mono bg-[#F5EFE6] rounded p-2 border border-[#4A2E1B]/20">
                    <span>推奨戦力: <strong className="text-amber-800 text-xs">{d.recommendAtk}</strong></span>
                    <span>基礎到達時間: <strong className="text-indigo-800 text-xs">{d.durationSec}s</strong></span>
                  </div>

                  {/* 獲得可能報酬表示 */}
                  <div className="mt-2.5 p-2 rounded bg-[#FAF6EE] border border-dashed border-[#4A2E1B]/40">
                    <div className="text-[9.5px] font-extrabold text-[#A33B20] mb-1.5 flex items-center justify-between">
                      <span>💎 基本ゴールド・物資還元（目安）</span>
                      {d.dragonReward > 0 && <span className="text-[8.5px] bg-red-100 px-1.5 py-0.2 border border-red-300 text-red-700 font-bold rounded">激レア【竜の逆鱗】ドロップ可能!</span>}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-2 gap-y-1 text-[10.5px] font-mono font-bold text-[#5C4033]">
                      <div className="flex items-center gap-1">
                        <span>🪙</span>
                        <span>{d.goldReward}G</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>🔩</span>
                        <span>{d.ironReward}個</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>🔮</span>
                        <span>{d.gemReward || 0}個</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>🦖</span>
                        <span>{d.dragonReward || 0}個</span>
                      </div>
                    </div>
                  </div>

                  {/* If selected, show character selection and launch buttons DIRECTLY 아래 (underneath) */}
                  {isSelected && (
                    <div
                      onClick={(e) => e.stopPropagation()} // Prevent closing/re-triggering selected status
                      className="mt-4 pt-4 border-t-2 border-dashed border-[#4A2E1B]/35 space-y-4 cursor-default"
                    >
                      {/* Abyss level selector (shown only for Infinite Dungeon) */}
                      {d.isInfinite && (
                        <div className="bg-[#F5EFE6] border border-[#4A2E1B]/40 p-3 rounded space-y-2 shadow-inner">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-[#A33B20] font-black">▶ 奈落の階層(Lv)をえらぶ</span>
                            <span className="text-[10px] text-[#6F4E37]">最高記録: {deepestAbyssFloor}F</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              id="abyss-floor-dec"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAbyssFloor((prev) => Math.max(1, prev - 1));
                                setSelectedCharId('');
                              }}
                              className="w-10 h-8 border-2 border-[#4A2E1B] bg-[#FAF6EE] text-[#4A2E1B] rounded font-bold hover:bg-[#F5EFE6] flex items-center justify-center active:translate-y-[1px] cursor-pointer"
                            >
                              <ChevronLeft className="w-4 h-4 shrink-0" />
                            </button>

                            <div className="flex-1 text-center bg-[#FAF6EE] border-2 border-[#4A2E1B] rounded py-1 font-bold text-[#A33B20] text-xs font-mono">
                              第 {abyssFloor} 階層
                            </div>

                            <button
                              type="button"
                              id="abyss-floor-inc"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAbyssFloor((prev) => Math.min(deepestAbyssFloor + 1, prev + 1));
                                setSelectedCharId('');
                              }}
                              className="w-10 h-8 border-2 border-[#4A2E1B] bg-[#FAF6EE] text-[#4A2E1B] rounded font-bold hover:bg-[#F5EFE6] flex items-center justify-center active:translate-y-[1px] cursor-pointer"
                            >
                              <ChevronRight className="w-4 h-4 shrink-0" />
                            </button>
                          </div>
                          <p className="text-[9.5px] text-[#8C7A65] leading-snug">
                            ※階層がふかいほど敵戦力は劇的に高まり、派遣難易度が増大しますが、高品質なクラフトレア素材の出現率やドロップ数が大きくふえ、自己ベストを塗り替えられます！
                          </p>
                        </div>
                      )}

                      {/* Character dispatch choices header */}
                      <div className="space-y-2">
                        <span className="text-xs font-black text-[#6E4F39] uppercase tracking-widest block flex items-center justify-between">
                          <span>👤 派遣するメンバーをえらぶ (待機中社員リスト)</span>
                          <span className="text-[10px] text-[#8C7A65]">待機人数: {idleCharacters.length}人</span>
                        </span>

                        {idleCharacters.length === 0 ? (
                          <div className="border border-dashed border-[#4A2E1B]/45 py-8 rounded text-center text-[#6E4F39] text-xs space-y-1 bg-[#F5EFE6]">
                            <Skull className="w-5 h-5 text-[#A33B20]/60 mx-auto animate-bounce mb-1" />
                            <p className="font-bold">現在、オフィスに待機中の社員がおりません。</p>
                            <p className="text-[9.5px] text-[#8C7A65]">他ダンジョンの派遣完了を待つか、新しく従業員を雇用してください。</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                            {idleCharacters.map((char) => {
                              const isCharSelected = selectedCharId === char.id;
                              const stats = computeCharacterStats(char, inventory, companyWideAtkBuffPct);
                              const meetsReq = stats.totalPower >= currentDungeon.recommendAtk;
                              const isCharTutorial = showTutorial && tutorialStep === 2 && !selectedCharId && char.job === 'warrior';

                              return (
                                <div
                                  key={char.id}
                                  id={`select-char-${char.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCharId(char.id);
                                  }}
                                  className={`border p-2.5 rounded cursor-pointer transition-all flex items-center justify-between gap-2 text-left bg-[#FAF6EE] ${
                                    isCharSelected
                                      ? 'border-[#4A2E1B] bg-[#FAF3E0] ring-2 ring-[#4A2E1B] shadow-[2px_2px_0px_#4A2E1B] scale-[1.01]'
                                      : isCharTutorial
                                      ? 'border-amber-400 bg-amber-50 ring-4 ring-amber-350 animate-pulse'
                                      : 'border-[#4A2E1B]/20 hover:border-[#4A2E1B]/55'
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[8px] border border-[#4A2E1B]/35 px-1 leading-none rounded bg-[#FAF6EE] py-0.5 whitespace-nowrap text-[#6E4F39] font-bold">
                                        {JOB_INFO[char.job].label}
                                      </span>
                                      <span className="font-extrabold text-[9px] bg-red-50 text-[#A33B20] border border-red-200 px-1 py-0.2 rounded font-mono">Lv.{char.level}</span>
                                      <h4 className="font-extrabold text-xs truncate text-[#4A2E1B]">{char.name}</h4>
                                    </div>
                                    <div className="text-[10px] font-mono mt-1">
                                      社員戦力: <strong className={meetsReq ? 'text-emerald-700 font-extrabold' : 'text-[#A33B20] font-extrabold'}>
                                        {stats.totalPower}
                                      </strong>
                                    </div>
                                  </div>

                                  <div className="shrink-0 font-bold text-xs font-mono">
                                    {meetsReq ? (
                                      <span className="text-emerald-800 bg-emerald-50 border border-emerald-400/30 px-1 py-0.5 rounded leading-none text-[8.5px] uppercase">SAFE</span>
                                    ) : (
                                      <span className="text-[#A33B20] bg-[#FAF6EE] border border-[#A33B20]/40 px-1 py-0.5 rounded leading-none text-[8.5px] uppercase animate-pulse">RISK</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Strategic report */}
                      {chosenChar && chosenCharStats && (
                        <div className="bg-[#F5EFE6] border border-[#4A2E1B]/30 rounded p-3.5 space-y-2.5 text-xs text-[#4A2E1B] shadow-inner">
                          <span className="text-[9.5px] text-[#8C7A65] font-extrabold block uppercase tracking-wider">[ 派遣しゅつげき予測レポート ]</span>

                          <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono">
                            <div className="bg-[#FAF6EE] border border-[#4A2E1B]/25 p-2 rounded flex flex-col justify-between">
                              <span className="text-[8px] text-[#8C7A65]">社員の戦闘値 / 推奨</span>
                              <span className={`font-bold mt-1 ${chosenCharStats.totalPower >= currentDungeon.recommendAtk ? 'text-emerald-700' : 'text-[#A33B20]'}`}>
                                ✊ {chosenCharStats.totalPower} <span className="text-[8px] text-[#8C7A65]">/ {currentDungeon.recommendAtk}</span>
                              </span>
                            </div>

                            <div className="bg-[#FAF6EE] border border-[#4A2E1B]/25 p-2 rounded flex flex-col justify-between">
                              <span className="text-[8px] text-[#8C7A65]">完了時間 (従業員の能力補正済)</span>
                              <span className="font-bold text-indigo-750 flex items-center gap-0.5 mt-1">
                                <Clock className="w-3 h-3 text-indigo-750 shrink-0" />
                                {getSimulatedDuration(currentDungeon.durationSec, chosenCharStats)}秒
                              </span>
                            </div>
                          </div>

                          {/* Rewards simulation */}
                          <div className="bg-[#FAF6EE] border border-[#4A2E1B]/25 p-2.5 rounded text-[10.5px] space-y-2">
                            <div className="flex justify-between items-center border-b border-[#4A2E1B]/15 pb-1 flex-wrap gap-1">
                              <span className="text-[9px] text-[#A33B20] font-extrabold">🎁 社員特性（獲得予定シミュレート値）</span>
                              <div className="flex gap-1 flex-wrap">
                                {chosenChar.job === 'thief' && (
                                  <span className="text-[8.5px] bg-amber-100 text-amber-800 border border-amber-300 font-bold px-1.5 py-0.2 rounded-sm">
                                    シーフボーナス(素材1.5倍)
                                  </span>
                                )}
                                {chosenCharStats.goldBonusPct > 0 && (
                                  <span className="text-[8.5px] bg-yellow-101 text-yellow-800 border border-yellow-300 font-bold px-1.5 py-0.2 rounded-sm">
                                    おカネ+{chosenCharStats.goldBonusPct}%
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-4 gap-1 md:gap-2 text-center font-mono font-black">
                              <div className="bg-[#F5EFE6] p-1.5 rounded border border-[#4A2E1B]/10">
                                <span className="text-[8px] text-[#8C7A65] block">ゴールド</span>
                                <span className="text-amber-700 whitespace-nowrap">🪙 {Math.round(currentDungeon.goldReward * (1 + chosenCharStats.goldBonusPct / 100))}</span>
                              </div>
                              <div className="bg-[#F5EFE6] p-1.5 rounded border border-[#4A2E1B]/10">
                                <span className="text-[8px] text-[#8C7A65] block">てつこう</span>
                                <span className="text-[#4A2E1B] whitespace-nowrap">🔩 {Math.round(currentDungeon.ironReward * (chosenChar.job === 'thief' ? 1.5 : 1.0))}</span>
                              </div>
                              <div className="bg-[#F5EFE6] p-1.5 rounded border border-[#4A2E1B]/10">
                                <span className="text-[8px] text-[#8C7A65] block">魔結晶</span>
                                <span className="text-[#4F5B73] whitespace-nowrap">🔮 {Math.round(currentDungeon.gemReward * (chosenChar.job === 'thief' ? 1.5 : 1.0))}</span>
                              </div>
                              <div className="bg-[#F5EFE6] p-1.5 rounded border border-[#4A2E1B]/10">
                                <span className="text-[8px] text-[#8C7A65] block">りゅう鱗</span>
                                <span className="text-red-700 whitespace-nowrap">🦖 {Math.round(currentDungeon.dragonReward * (chosenChar.job === 'thief' ? 1.5 : 1.0))}</span>
                              </div>
                            </div>
                          </div>

                          {/* Safety check feedback */}
                          {chosenCharStats.totalPower >= currentDungeon.recommendAtk ? (
                            <div className="bg-emerald-50 border border-emerald-400/50 p-2.5 rounded text-[11px] text-emerald-800-bold">
                              勝率100%：戦力が推奨値を満たしています！失敗確率はゼロです。
                            </div>
                          ) : (
                            <div className="bg-rose-50 border border-rose-450 text-[#A33B20] p-2.5 rounded text-[11.5px] font-bold animate-pulse leading-snug">
                              ⚠️ 警告：派遣対象の戦闘力が推奨に満たないため、派遣攻略中にHP全滅（作戦失敗）し、回収報酬が最大90%削減される恐れがあります！
                            </div>
                          )}

                          {/* Loop selection */}
                          <div className="p-3 bg-white/70 border border-[#4A2E1B]/30 rounded-lg flex items-center justify-between gap-3 shadow-sm flex-wrap">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-base select-none">🔄</span>
                              <div className="flex-1 min-w-[150px]">
                                <span className="text-[11px] font-black block text-[#A33B20]">自動周回をONにする [ AUTO REPEAT ]</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              id="auto-loop-toggle"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAutoLoop(prev => !prev);
                              }}
                              className={`px-3 py-1 text-[11px] font-black rounded border-2 transition-all cursor-pointer ${
                                autoLoop
                                  ? 'bg-[#2E7D32] text-white border-[#1B5E20]'
                                  : 'bg-[#FAF6EE] text-[#4A2E1B] border-[#4A2E1B]/40 hover:bg-stone-50'
                              }`}
                            >
                              {autoLoop ? '自動周回：有効 🔄' : '無効'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Confirm dispatch button inline within dungeon card */}
                      <div className="pt-3 border-t border-[#4A2E1B]/15 flex justify-end">
                        <button
                          type="button"
                          id="dispatch-confirm-btn"
                          disabled={!selectedCharId}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartDispatch();
                          }}
                          className={`px-5 py-2 text-xs font-black rounded border-2 transition-all flex items-center gap-1.5 ${
                            selectedCharId
                              ? showTutorial && tutorialStep === 2
                                ? 'bg-amber-400 text-black border-amber-200 cursor-pointer ring-4 ring-amber-400 animate-bounce'
                                : 'bg-[#A33B20] text-white border-amber-300 hover:bg-[#862D14] cursor-pointer active:translate-y-[1px]'
                              : 'bg-stone-200 text-stone-400 border-stone-300 cursor-not-allowed'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5" />
                          このダンジョンへ しゅつげきさせる ⚔️
                        </button>
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
};
