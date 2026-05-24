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
          冒険するダンジョンを選び、戦力に見合った社員を派遣してゴールドとクラフト素材を獲得します。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left window: Dungeons list */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-3.5 bg-[#FAF6EE] border-[3px] border-[#4A2E1B] rounded-lg p-4 shadow-sm">
          <span className="text-xs font-black text-[#A33B20] uppercase tracking-widest block">
            1. 行き先（ダンジョン）をえらぶ
          </span>

          <div className="space-y-3">
            {dungeons.map((d) => {
              const isSelected = selectedDungeonId === d.id;
              const isTutorialHighlight = showTutorial && tutorialStep === 2 && d.id === 'dungeon_1' && !isSelected;
              return (
                <div
                  key={d.id}
                  id={`select-dungeon-${d.id}`}
                  onClick={() => {
                    setSelectedDungeonId(d.id);
                    setAutoLoop(false);
                  }}
                  className={`border-2 rounded p-3 text-left cursor-pointer transition-all relative overflow-hidden bg-[#FAF6EE] ${
                    isSelected
                      ? 'border-[#4A2E1B] bg-[#FAF6EE] shadow-[3px_3px_0px_#4A2E1B] scale-[1.01]'
                      : isTutorialHighlight
                      ? 'border-amber-500 bg-amber-50 ring-4 ring-amber-300 animate-pulse'
                      : 'border-[#4A2E1B]/20 hover:border-[#4A2E1B]/60'
                  }`}
                >
                  <div className="flex justify-between items-center text-sm">
                    <h3 className="font-extrabold flex items-center gap-1.5">
                      <span className={isSelected ? 'text-[#A33B20]' : 'text-[#8C7A65]'}>
                        {isSelected ? '▶' : '▷'}
                      </span>
                      <span className={isSelected ? 'text-[#A33B20]' : 'text-[#4A2E1B]'}>
                        {d.isInfinite ? `極限の奈落 (${abyssFloor}F)` : d.name}
                      </span>
                    </h3>
                    
                    {d.isInfinite && (
                      <span className="text-[9px] font-black border border-[#A33B20]/40 text-[#A33B20] px-1.5 py-0.2 rounded bg-[#FAF6EE]">
                        INF
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-[#6E4F39] mt-1 leading-tight">{d.description}</p>

                  <div className="mt-2 text-[11px] text-[#6E4F39] flex justify-between font-mono bg-[#F5EFE6] rounded p-1.5 border border-[#4A2E1B]/20">
                    <span>推奨戦力: <strong className="text-amber-800">{d.recommendAtk}</strong></span>
                    <span>時間: <strong className="text-indigo-800">{d.durationSec}s</strong></span>
                  </div>

                  {/* 獲得可能報酬表示 */}
                  <div className="mt-2 p-1.5 rounded bg-[#FAF6EE] border border-dashed border-[#4A2E1B]/40">
                    <div className="text-[9px] font-extrabold text-[#A33B20] mb-1 flex items-center justify-between">
                      <span>💎 獲得可能報酬 (標準値)</span>
                      {d.dragonReward > 0 && <span className="text-[8px] bg-red-100 px-1 border border-red-300 text-red-700 font-bold rounded">激レア竜素材あり!</span>}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-2 gap-y-1 text-[10px] font-mono font-bold text-[#5C4033]">
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
                </div>
              );
            })}
          </div>

          {/* Stepper if Infinite Dungeon option is active */}
          {selectedDungeonId === 'dungeon_infinite' && (
            <div className="bg-[#F5EFE6] border border-[#4A2E1B]/30 p-3 rounded space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#A33B20] font-black">▶ 奈落の階層(Lv)をえらぶ</span>
                <span className="text-[10px] text-[#6F4E37]">最高: {deepestAbyssFloor}F</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="abyss-floor-dec"
                  onClick={() => setAbyssFloor((prev) => Math.max(1, prev - 1))}
                  className="w-10 h-8 border-2 border-[#4A2E1B] bg-[#FAF6EE] text-[#4A2E1B] rounded font-bold hover:bg-[#F5EFE6] flex items-center justify-center active:translate-y-[1px] cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 shrink-0" />
                </button>

                <div className="flex-1 text-center bg-[#FAF6EE] border-2 border-[#4A2E1B] rounded py-1 font-bold text-[#A33B20] text-xs">
                  第 {abyssFloor} 階層
                </div>

                <button
                  id="abyss-floor-inc"
                  onClick={() => setAbyssFloor((prev) => Math.min(deepestAbyssFloor + 1, prev + 1))}
                  className="w-10 h-8 border-2 border-[#4A2E1B] bg-[#FAF6EE] text-[#4A2E1B] rounded font-bold hover:bg-[#F5EFE6] flex items-center justify-center active:translate-y-[1px] cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
              <p className="text-[9px] text-[#8C7A65] leading-tight">
                ※階層がふかいほど敵戦力はあがりますが、名工、神話級（レジェンダリー）装備のドロップ率は激増します！
              </p>
            </div>
          )}
        </div>

        {/* Right window: Character Party Select */}
        <div className="lg:col-span-12 xl:col-span-12 xxl:col-span-7 bg-[#FAF6EE] border-[3px] border-[#4A2E1B] rounded-lg p-4 md:p-5 flex flex-col justify-between shadow-sm lg:w-full">
          
          <div className="space-y-4">
            <span className="text-xs font-black text-[#A33B20] uppercase tracking-widest block">
              2. 派遣するメンバーをえらぶ
            </span>

            {idleCharacters.length === 0 ? (
              <div className="border border-dashed border-[#4A2E1B]/45 py-12 rounded text-center text-[#6E4F39] text-xs space-y-1 bg-[#F5EFE6]">
                <Skull className="w-6 h-6 text-[#A33B20]/60 mx-auto animate-bounce" />
                <p>現在、オフィスに待機中の社員がおりません。</p>
                <p className="text-[10px] text-[#8C7A65]">だれかの派遣が完了するか、まちはあい所で新規求人をしてください。</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                {idleCharacters.map((char) => {
                  const isSelected = selectedCharId === char.id;
                  const stats = computeCharacterStats(char, inventory, companyWideAtkBuffPct);
                  const meetsReq = stats.totalPower >= currentDungeon.recommendAtk;
                  const isTutorialHighlight = showTutorial && tutorialStep === 2 && !selectedCharId && char.job === 'warrior';

                  return (
                    <div
                      key={char.id}
                      id={`select-char-${char.id}`}
                      onClick={() => setSelectedCharId(char.id)}
                      className={`border p-2.5 rounded cursor-pointer transition-all flex items-center justify-between gap-2 text-left bg-[#FAF6EE] ${
                        isSelected
                          ? 'border-[#4A2E1B] bg-[#F5EFE6] shadow-[2px_2px_0px_#4A2E1B] scale-[1.01]'
                          : isTutorialHighlight
                          ? 'border-amber-400 bg-amber-50 ring-4 ring-amber-350 animate-pulse'
                          : 'border-[#4A2E1B]/20 hover:border-[#4A2E1B]/55'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[8px] border border-[#4A2E1B]/35 px-1 leading-none rounded bg-[#F5EFE6] py-0.5 whitespace-nowrap text-[#6E4F39] font-bold">
                            {JOB_INFO[char.job].label}
                          </span>
                          <h4 className="font-extrabold text-xs truncate text-[#4A2E1B]">{char.name}</h4>
                        </div>
                        <div className="text-[10px] font-mono mt-1">
                          社員戦力: <strong className={meetsReq ? 'text-emerald-700 font-extrabold' : 'text-[#A33B20] font-extrabold'}>
                            {stats.totalPower}
                          </strong>
                        </div>
                      </div>

                      <div className="shrink-0 font-bold text-xs">
                        {meetsReq ? (
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-600/30 px-1 py-0.5 rounded leading-none text-[9px] uppercase">SAFE</span>
                        ) : (
                          <span className="text-[#A33B20] bg-[#FAF6EE] border border-[#A33B20]/40 px-1 py-0.5 rounded leading-none text-[9px] uppercase animate-pulse">RISK</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Simulated Strategy Report Panel */}
            {chosenChar && chosenCharStats && (
              <div className="bg-[#F5EFE6] border-2 border-[#4A2E1B] rounded p-3.5 space-y-2.5 text-xs text-[#4A2E1B]">
                <span className="text-[10px] text-[#8C7A65] font-bold block">[ 派遣前しゅつげき予測 ]</span>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  
                  {/* Combat Power rating */}
                  <div className="bg-[#FAF6EE] border border-[#4A2E1B]/25 p-2 rounded flex flex-col justify-between">
                    <span className="text-[8px] text-[#8C7A65]">社員戦力 / 推奨</span>
                    <span className={`font-bold mt-1 ${chosenCharStats.totalPower >= currentDungeon.recommendAtk ? 'text-emerald-700' : 'text-[#A33B20]'}`}>
                      ✊ {chosenCharStats.totalPower} <span className="text-[8px] text-[#8C7A65]">/ {currentDungeon.recommendAtk}</span>
                    </span>
                  </div>

                  {/* Simulated duration */}
                  <div className="bg-[#FAF6EE] border border-[#4A2E1B]/25 p-2 rounded flex flex-col justify-between">
                    <span className="text-[8px] text-[#8C7A65]">とうたつ予定時間</span>
                    <span className="font-bold text-indigo-750 flex items-center gap-0.5 mt-1">
                      <Clock className="w-3 h-3 text-indigo-750" />
                      {getSimulatedDuration(currentDungeon.durationSec, chosenCharStats)}s
                    </span>
                  </div>

                </div>

                {/* Simulated Rewards considering bonuses */}
                <div className="bg-[#FAF6EE] border border-[#4A2E1B]/25 p-2.5 rounded text-[11px] space-y-2">
                  <div className="flex justify-between items-center border-b border-[#4A2E1B]/15 pb-1 flex-wrap gap-1">
                    <span className="text-[9px] text-[#A33B20] font-extrabold flex items-center gap-1">🎁 【限定補正】この社員の派遣予想獲得</span>
                    <div className="flex gap-1 flex-wrap">
                      {chosenChar.job === 'thief' && (
                        <span className="text-[8px] bg-amber-100 text-amber-800 border border-amber-300 font-bold px-1.5 py-0.2 rounded-sm">
                          シーフ特典(素材1.5倍)
                        </span>
                      )}
                      {chosenCharStats.goldBonusPct > 0 && (
                        <span className="text-[8px] bg-yellow-100 text-yellow-800 border border-yellow-300 font-bold px-1.5 py-0.2 rounded-sm">
                          ゴールド+{chosenCharStats.goldBonusPct}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1 md:gap-2 text-center font-mono font-black">
                    <div className="flex flex-col items-center bg-[#F5EFE6] p-1 rounded border border-[#4A2E1B]/10">
                      <span className="text-[8px] text-[#8C7A65]">ゴールド</span>
                      <span className="text-amber-700 mt-0.5 whitespace-nowrap">🪙 {Math.round(currentDungeon.goldReward * (1 + chosenCharStats.goldBonusPct / 100))}</span>
                    </div>
                    <div className="flex flex-col items-center bg-[#F5EFE6] p-1 rounded border border-[#4A2E1B]/10">
                      <span className="text-[8px] text-[#8C7A65]">てつこうせき</span>
                      <span className="text-[#4A2E1B] mt-0.5 whitespace-nowrap">🔩 {Math.round(currentDungeon.ironReward * (chosenChar.job === 'thief' ? 1.5 : 1.0))}</span>
                    </div>
                    <div className="flex flex-col items-center bg-[#F5EFE6] p-1 rounded border border-[#4A2E1B]/10">
                      <span className="text-[8px] text-[#8C7A65]">まほう結晶</span>
                      <span className="text-[#4A2E1B] mt-0.5 whitespace-nowrap">🔮 {Math.round(currentDungeon.gemReward * (chosenChar.job === 'thief' ? 1.5 : 1.0))}</span>
                    </div>
                    <div className="flex flex-col items-center bg-[#F5EFE6] p-1 rounded border border-[#4A2E1B]/10">
                      <span className="text-[8px] text-[#8C7A65]">りゅう逆鱗</span>
                      <span className="text-red-700 mt-0.5 whitespace-nowrap">🦖 {Math.round(currentDungeon.dragonReward * (chosenChar.job === 'thief' ? 1.5 : 1.0))}</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Warning/Safe dialog bubble */}
                {chosenCharStats.totalPower >= currentDungeon.recommendAtk ? (
                  <div className="bg-emerald-50 border border-emerald-400/50 p-2.5 rounded text-[11px] text-emerald-800">
                    <span className="font-bold text-emerald-900 block mb-0.5">▶ 作戦名：勝率100% カンペキ安全派遣</span>
                    全滅・失敗リスクはありません。HPが0になる心配がなく、ゴールドと各種戦利品バッグをMAX安全に獲得し、確実に生還できます。
                  </div>
                ) : (
                  <div className="bg-rose-50 border border-red-500/50 p-2.5 rounded text-[11px] text-[#A33B20]">
                    <span className="font-bold text-red-900 block mb-0.5">▶ 警告：HP 0 による作戦失敗のペナルティ危険あり</span>
                    戦力が推奨値を満たしていません！ダンジョン攻略中に敵の猛攻を受けて<strong>HPが0になり作戦失敗（全滅）</strong>するおそれがあります。獲得報酬は10%〜30%に激減します。鍛冶屋で武器や防具を強化し、戦力を高めましょう。
                  </div>
                )}

                {/* Auto Loop Toggle Option */}
                <div className="mt-4 p-3 bg-[#FAF6EE] border-2 border-[#4A2E1B]/55 rounded-lg flex items-center justify-between gap-3 shadow-[2px_2px_0px_rgba(74,46,27,0.15)] flex-wrap">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-lg">🔄</span>
                    <div className="flex-1 min-w-[150px]">
                      <span className="text-xs font-black block text-[#A33B20]">自動周回モード [ AUTO REPEAT ]</span>
                      <span className="text-[10px] text-[#8C7A65] block leading-tight">任務完了時に自動で報酬を回収し、直ちに同じダンジョンへ再派遣されます。</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    id="auto-loop-toggle"
                    onClick={() => setAutoLoop(prev => !prev)}
                    className={`px-3 py-1.5 rounded font-black text-xs border-2 transition-all cursor-pointer select-none ${
                      autoLoop
                        ? 'bg-[#2E7D32] text-white border-[#1B5E20] shadow-[2px_2px_0px_#1B5E20]'
                        : 'bg-[#F5EFE6] text-[#4A2E1B] border-[#4A2E1B]/40 hover:bg-stone-100 shadow-[2px_2px_0px_rgba(74,46,27,0.15)]'
                    }`}
                  >
                    {autoLoop ? '有効 (ON) 🔄' : '無効 (OFF)'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action confirm dispatch button */}
          <div className="mt-6 pt-4 border-t border-[#4A2E1B]/25 flex justify-end">
            <button
              id="dispatch-confirm-btn"
              disabled={!selectedCharId}
              onClick={handleStartDispatch}
              className={`px-5 py-2 text-xs font-black rounded border-2 transition-all flex items-center gap-1.5 ${
                selectedCharId
                  ? showTutorial && tutorialStep === 2
                    ? 'bg-amber-400 text-black border-amber-200 cursor-pointer ring-4 ring-amber-400 animate-bounce'
                    : 'bg-[#A33B20] text-white border-amber-300 hover:bg-[#862D14] cursor-pointer active:translate-y-[1px]'
                  : 'bg-stone-200 text-stone-400 border-stone-300 cursor-not-allowed font-medium'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              しゅつげき を開始する ⚔️
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
