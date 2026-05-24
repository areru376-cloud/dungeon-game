import React, { useState, useEffect } from 'react';
import { Character, Equipment } from '../types';
import { computeCharacterStats } from '../gameEngine';
import { Sword, Shield, Clock, HelpCircle } from 'lucide-react';

interface BattleMonitorProps {
  char: Character;
  inventory: Equipment[];
  companyWideAtkBuffPct: number;
  percent: number;
  secondsLeft: number;
}

export const BattleMonitor: React.FC<BattleMonitorProps> = ({
  char,
  inventory,
  companyWideAtkBuffPct,
  percent,
  secondsLeft,
}) => {
  const stats = computeCharacterStats(char, inventory, companyWideAtkBuffPct);
  const dungeonId = char.dispatchState?.dungeonId || 'dungeon_1';

  // Combat status ticks to render floating combat numbers and dialogue text
  const [combatPhase, setCombatPhase] = useState<number>(0);
  const [floatingText, setFloatingText] = useState<{ id: number; text: string; isCrit: boolean; styleType: 'damage' | 'spell' | 'dodge' }[]>([]);

  // Periodically generate cute fantasy battle logs & floating text
  useEffect(() => {
    if (percent >= 100) return;

    const interval = setInterval(() => {
      setCombatPhase((prev) => (prev + 1) % 4);

      // Random text based on Job
      const isCrit = Math.random() * 100 < stats.critRate;
      let logStr = '';
      let style: 'damage' | 'spell' | 'dodge' = 'damage';

      const skillPool = {
        warrior: ['スラッシュ斬！', 'パワースイング！', 'シールドバリア！', '会心一撃！'],
        mage: ['ライトニング魔術！', 'ファイアボール！', 'ブリザード凍結！', '時空魔法！'],
        thief: ['忍びの三連撃！', 'シャドウステップ！', '強奪アタック！', 'クリティカルダガー！']
      };

      const jobSkills = skillPool[char.job] || skillPool.warrior;
      const move = jobSkills[Math.floor(Math.random() * jobSkills.length)];

      if (Math.random() > 0.4) {
        const damageVal = Math.round(stats.totalAtk * (isCrit ? 2.2 : 1.0) * (0.9 + Math.random() * 0.2));
        logStr = `💥 ${move} ${damageVal}pt ダメージ!`;
        style = isCrit ? 'spell' : 'damage';
      } else {
        logStr = '🛡️ モンスターの攻撃を回避！';
        style = 'dodge';
      }

      setFloatingText((prev) => [
        ...prev.slice(-3), // keep only last 3 to avoid clutter
        {
          id: Date.now() + Math.random(),
          text: logStr,
          isCrit,
          styleType: style,
        }
      ]);
    }, 1800);

    return () => clearInterval(interval);
  }, [percent, char.job, stats.totalAtk, stats.critRate]);

  // Determine Dungeon Environmental theme
  const getDungeonTheme = () => {
    if (dungeonId === 'dungeon_1') {
      return {
        bg: 'bg-gradient-to-b from-[#E2F0D9] via-[#C5E1A5] to-[#FAF6EE]',
        arenaBorder: 'border-emerald-600/50',
        ground: '🌳 苔シダ生い茂る洞窟床面',
        monster: { emoji: '🟢', name: 'もちもちスライム', hp: 90, maxHp: 90 },
        accentColor: 'text-emerald-700',
        particles: '🟢 ✨ 🐾 🍄'
      };
    } else if (dungeonId === 'dungeon_2') {
      return {
        bg: 'bg-gradient-to-b from-[#D2E5F9] via-[#ADC9E5] to-[#FAF6EE]',
        arenaBorder: 'border-sky-500/50',
        ground: '🐺 牙剥く魔犬の月光森道',
        monster: { emoji: '🐺', name: 'シャドウ・ワイルドルフ', hp: 250, maxHp: 250 },
        accentColor: 'text-indigo-700',
        particles: '🍃 ✨ 🌙 🕸️'
      };
    } else if (dungeonId === 'dungeon_3') {
      return {
        bg: 'bg-gradient-to-b from-[#FADBD8] via-[#F1948A] to-[#FAF6EE]',
        arenaBorder: 'border-rose-600/50',
        ground: '🔥 溶岩流沸き立つワイバーン岩床',
        monster: { emoji: '🐉', name: '古代覇王レッドドラゴン', hp: 980, maxHp: 980 },
        accentColor: 'text-amber-700',
        particles: '🔥 ✨ ☄️ 🦴'
      };
    } else {
      // Infinite dungeon
      const derivedAtk = char.dispatchState?.recommendedAtk || 1500;
      const derivedEnemyPower = Math.max(10, derivedAtk - 5);
      const derivedMaxHp = Math.max(4500, Math.round(derivedEnemyPower * 3.75));
      return {
        bg: 'bg-gradient-to-b from-[#EBDEF0] via-[#D7BDE2] to-[#FAF6EE]',
        arenaBorder: 'border-purple-600/60',
        ground: '😈 呪詛と怨念渦巻く無限牢獄',
        monster: { emoji: '💀', name: '奈落の支配者：アビス・リッチ', hp: derivedMaxHp, maxHp: derivedMaxHp },
        accentColor: 'text-purple-700',
        particles: '👿 ✨ 💀 ✝️'
      };
    }
  };

  const theme = getDungeonTheme();

  // Character custom icon color based on job
  const getJobEmoji = () => {
    switch (char.job) {
      case 'warrior': return '⚔️';
      case 'mage': return '🔮';
      case 'thief': return '💎';
    }
  };

  // Distance calculations
  const charLeftPosition = Math.min(85, Math.max(10, percent));

  // Dynamic HP representation
  const maxHp = stats.totalHp;
  const targetRecAtk = char.dispatchState?.recommendedAtk || 15;
  const isWeak = stats.totalPower < targetRecAtk;
  
  const enemyPower = Math.max(10, targetRecAtk - 5);
  const enemyMaxHp = theme.monster.maxHp || Math.max(100, Math.round(enemyPower * 0.8));
  const enemyCurrentHp = Math.round(enemyMaxHp * (Math.max(0, 100 - percent) / 100));
  
  // HP starts at maxHp, and declines based on percent progress and whether they are weak or strong
  let hpPercent = 100;
  if (percent < 100) {
    if (isWeak) {
      // If weak, HP decreases rapidly by progress
      hpPercent = Math.max(10, Math.round(100 - percent * 0.85));
    } else {
      // If strong, takes minimal damage
      hpPercent = Math.max(75, Math.round(100 - percent * 0.22));
    }
  } else {
    hpPercent = isWeak ? 25 : 85;
  }
  const currentHpDisplay = Math.round(maxHp * (hpPercent / 100));

  // Pixel Art Backgrounds (specifically using retro black-backdrops or thematic bit art)
  const renderPixelArtBackground = () => {
    if (dungeonId === 'dungeon_1') {
      // Beginners Cave: Detailed Mossy Rock Ruins & Caves
      return (
        <div className="absolute inset-0 bg-[#07090e] overflow-hidden pointer-events-none select-none z-0">
          {/* Layered Mossy bricks backdrop */}
          <div className="absolute inset-0 opacity-15 grid grid-cols-8 gap-1.5 p-1">
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} className="h-4 bg-emerald-900 border-b border-r border-[#07090e] rounded-sm"></div>
            ))}
          </div>

          {/* Detailed Stalactites on Ceiling */}
          <div className="absolute top-0 inset-x-0 h-6 flex justify-around items-start">
            <div className="w-6 h-4 bg-emerald-950 border-b-2 border-emerald-900" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)' }}></div>
            <div className="w-4 h-5 bg-stone-900 border-b border-stone-800" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)' }}></div>
            <div className="w-8 h-3 bg-emerald-900" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 30% 100%)' }}></div>
            <div className="w-5 h-6 bg-emerald-950 border-b-2 border-emerald-900" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 70% 100%)' }}></div>
            <div className="w-7 h-4 bg-stone-850" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)' }}></div>
          </div>

          {/* Triple-layer Hanging Detailed Dungeon Vines */}
          <div className="absolute top-0 left-8 w-2 h-16 flex flex-col items-center">
            <div className="w-1.5 h-6 bg-emerald-800 rounded-sm"></div>
            <div className="w-1 h-6 bg-emerald-700/80"></div>
            <div className="w-0.5 h-4 bg-emerald-600/65"></div>
          </div>
          <div className="absolute top-0 left-28 w-2 h-10 flex flex-col items-center">
            <div className="w-1 h-5 bg-emerald-700"></div>
            <div className="w-0.5 h-5 bg-emerald-600/70"></div>
          </div>
          <div className="absolute top-0 right-16 w-3 h-20 flex flex-col items-center">
            <div className="w-2 h-8 bg-emerald-900"></div>
            <div className="w-1.5 h-8 bg-emerald-800/90"></div>
            <div className="w-1 h-4 bg-emerald-700/60"></div>
          </div>

          {/* Glowing Crystal Formations on Walls */}
          <div className="absolute bottom-5 left-4 w-3.5 h-3.5 bg-cyan-600 border border-cyan-400 rotate-45 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.5)]"></div>
          <div className="absolute bottom-8 left-6 w-2 h-2 bg-emerald-500 border border-emerald-300 rotate-12 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.4)]"></div>
          <div className="absolute bottom-6 right-1/4 w-3 h-3 bg-cyan-500 border border-cyan-300 rotate-12 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.4)]"></div>

          {/* Layered Cavern ground platform */}
          <div className="absolute bottom-0 inset-x-0 h-4 bg-[#1b120c] border-t-2 border-[#3d2719]"></div>
          <div className="absolute bottom-4 inset-x-0 h-1 bg-[#2e1d13] opacity-50"></div>
          {/* Detailed Grass Clumps on Floor */}
          <div className="absolute bottom-4 left-1/3 w-3 h-1 bg-emerald-700 rounded-t"></div>
          <div className="absolute bottom-4 left-12 w-4 h-1.5 bg-emerald-800 rounded-t"></div>
          <div className="absolute bottom-4 right-12 w-5 h-1 bg-emerald-700 rounded-t"></div>
        </div>
      );
    } else if (dungeonId === 'dungeon_2') {
      // Wolf Forest: Starry Moonlit Midnight Forest Path
      return (
        <div className="absolute inset-0 bg-[#040612] overflow-hidden pointer-events-none select-none z-0">
          {/* Twinkling Stars Grid */}
          <div className="absolute top-3 left-6 w-1 h-1 bg-white opacity-85 animate-ping"></div>
          <div className="absolute top-8 left-20 w-0.5 h-0.5 bg-indigo-100 opacity-60"></div>
          <div className="absolute top-4 left-1/2 w-1 h-1 bg-amber-100 opacity-90 animate-pulse"></div>
          <div className="absolute top-10 right-32 w-1 h-1 bg-white opacity-70"></div>
          <div className="absolute top-3 right-20 w-0.5 h-0.5 bg-white opacity-95"></div>

          {/* Gorgeous Giant Retro Moon with crater layers */}
          <div className="absolute top-1.5 right-10 w-10 h-10 bg-amber-100/90 rounded-full shadow-[0_0_20px_rgba(253,230,138,0.35)] flex items-center justify-center">
            {/* Moon craters */}
            <div className="absolute top-2 left-2 w-2 h-1.5 bg-amber-200/70 rounded"></div>
            <div className="absolute bottom-3 right-2 w-3 h-2 bg-amber-200/70 rounded-full"></div>
            <div className="absolute top-4 right-3 w-1.5 h-1 bg-amber-200/50 rounded-full"></div>
          </div>

          {/* Starry Clouds passing moon */}
          <div className="absolute top-4 right-6 w-16 h-3 bg-indigo-950/40 rounded-full blur-xs"></div>
          <div className="absolute top-6 left-12 w-24 h-4 bg-indigo-950/30 rounded-full blur-xs"></div>

          {/* Parallax Forest Canopy Tree Blocks (Distant Back-Row) */}
          <div className="absolute bottom-4 inset-x-0 h-14 flex justify-between items-end opacity-20">
            <div className="w-10 h-12 bg-indigo-950" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
            <div className="w-14 h-10 bg-indigo-900" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
            <div className="w-8 h-12 bg-indigo-950" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
          </div>

          {/* Parallax Forest Canopy Tree Blocks (Close Front-Row) */}
          <div className="absolute bottom-4 inset-x-0 h-10 flex justify-around items-end opacity-45">
            <div className="w-8 h-8 bg-slate-900 flex flex-col justify-end" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}>
              <div className="w-1.5 h-2 bg-[#2a1d13] mx-auto"></div>
            </div>
            <div className="w-6 h-7 bg-indigo-950 flex flex-col justify-end" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
            <div className="w-10 h-9 bg-slate-900 flex flex-col justify-end animate-pulse" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}>
              <div className="w-2 h-1.5 bg-[#2a1d13] mx-auto"></div>
            </div>
          </div>

          {/* Forest Fireflies Floating (Pulsing Amber circles) */}
          <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping shadow-[0_0_4px_#facc15]"></div>
          <div className="absolute bottom-8 right-24 w-1 h-1 bg-amber-300 rounded-full animate-pulse shadow-[0_0_3px_#fbbf24]"></div>
          <div className="absolute bottom-5 right-10 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_4px_#facc15]"></div>

          {/* Forest walkway border */}
          <div className="absolute bottom-0 inset-x-0 h-4 bg-[#0e141a] border-t-2 border-[#1c2834]"></div>
        </div>
      );
    } else if (dungeonId === 'dungeon_3') {
      // Dragon Nest: Detailed Crackling Lava Cavern & Crags
      return (
        <div className="absolute inset-0 bg-[#160404] overflow-hidden pointer-events-none select-none z-0">
          {/* Volcanic walls crags */}
          <div className="absolute top-0 inset-y-0 left-0 w-8 bg-[#0c0202] border-r-2 border-[#2b0c0c] flex flex-col justify-between p-1 opacity-60">
            <div className="w-4 h-3 bg-[#1d0a0a] border border-red-950"></div>
            <div className="w-5 h-2 bg-[#1d0a0a]"></div>
            <div className="w-3 h-4 bg-[#1d0a0a]"></div>
          </div>
          <div className="absolute top-0 inset-y-0 right-0 w-8 bg-[#0c0202] border-l-2 border-[#2b0c0c] flex flex-col justify-between p-1 opacity-60">
            <div className="w-5 h-3 bg-[#1d0a0a]"></div>
            <div className="w-4 h-4 bg-[#140606]"></div>
            <div className="w-6 h-2 bg-[#1d0a0a]"></div>
          </div>

          {/* Active Flowing Lava Cascade Cascade (Vertical animated streams) */}
          <div className="absolute inset-y-0 left-20 w-3 bg-gradient-to-b from-red-800 via-orange-600 to-amber-500 animate-pulse opacity-70"></div>
          <div className="absolute inset-y-0 right-32 w-1.5 bg-gradient-to-b from-red-900 via-orange-700 to-red-500 opacity-55"></div>

          {/* Volcano background atmospheric glow */}
          <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-red-600/35 to-transparent"></div>

          {/* Magma bubbling pits at the bottom floor */}
          <div className="absolute bottom-4 inset-x-0 h-4 bg-[#ff3c00]/30 border-t border-[#ff6a00]/40 flex items-center justify-around">
            <div className="w-2.5 h-1 bg-[#ff7300] rounded-sm animate-ping"></div>
            <div className="w-1.5 h-1 bg-[#ffa200] rounded-full animate-bounce"></div>
            <div className="w-3 h-0.5 bg-[#ff3c00] rounded-sm animate-pulse"></div>
            <div className="w-2 h-1 bg-[#ff7300] rounded-sm animate-ping"></div>
          </div>

          {/* Rising Sparks and Embers floating upwards */}
          <span className="absolute bottom-5 left-16 w-1 h-1 bg-red-500 animate-ping"></span>
          <span className="absolute bottom-7 left-36 w-0.5 h-1 bg-orange-400 rotate-12 animate-pulse"></span>
          <span className="absolute bottom-8 right-24 w-1 h-1 bg-amber-400 animate-bounce"></span>
          <span className="absolute bottom-6 right-16 w-1 w-1.5 bg-red-400 animate-ping"></span>

          {/* Floor Rock shelf */}
          <div className="absolute bottom-0 inset-x-0 h-4 bg-[#230909] border-t-2 border-[#421414]"></div>
        </div>
      );
    } else {
      // Infinite Dungeon: Ancient Gothic Crypt Ruins of the Abyss
      return (
        <div className="absolute inset-0 bg-[#06030c] overflow-hidden pointer-events-none select-none z-0">
          {/* Gothic Pillars/Arches in background */}
          <div className="absolute inset-y-0 left-12 w-4 bg-[#140d1f] border-x border-[#2d1f42] opacity-40"></div>
          <div className="absolute inset-y-0 right-16 w-4 bg-[#140d1f] border-x border-[#2d1f42] opacity-40"></div>

          {/* Hanging Dungeon Chains of Captivity */}
          <div className="absolute top-0 left-6 h-14 flex flex-col items-center opacity-70">
            <div className="w-1.5 h-3 bg-stone-700/95 border-b border-stone-800"></div>
            <div className="w-1 h-3 bg-stone-600 border-b border-stone-850"></div>
            <div className="w-1.5 h-3 bg-stone-700 border-b border-stone-800"></div>
            <div className="w-1 h-2 bg-stone-800"></div>
          </div>
          <div className="absolute top-0 right-28 h-18 flex flex-col items-center opacity-55">
            <div className="w-1 h-4 bg-stone-700 border-b border-stone-800"></div>
            <div className="w-1.5 h-4 bg-stone-800 border-b border-stone-900"></div>
            <div className="w-1 h-4 bg-stone-700"></div>
          </div>

          {/* Purple Void Portals / Swirling Rift Circles */}
          <div className="absolute top-4 left-1/3 w-12 h-12 bg-none border-2 border-dashed border-purple-500/25 rounded-full animate-spin"></div>
          <div className="absolute top-6 left-[35%] w-8 h-8 bg-purple-950/20 rounded-full animate-pulse shadow-[0_0_12px_rgba(168,85,247,0.25)] border border-purple-500/20"></div>

          {/* Spooky Eerie Particles (Floating purple embers) */}
          <div className="absolute bottom-6 left-1/4 w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce shadow-[0_0_4px_#a855f7]"></div>
          <div className="absolute bottom-8 right-20 w-1 h-1 bg-fuchsia-500 rounded-full animate-pulse shadow-[0_0_3px_#d946ef]"></div>
          <div className="absolute bottom-5 right-10 w-2 h-2 bg-indigo-700/40 rounded-sm animate-ping"></div>

          {/* Abyssal Crypt Brick Ground */}
          <div className="absolute bottom-0 inset-x-0 h-4 bg-[#0a0512] border-t-2 border-[#3b1756]"></div>
        </div>
      );
    }
  };

  const targetRecPower = targetRecAtk;

  return (
    <div className="bg-[#FAF6EE] text-[#4A2E1B] rounded overflow-hidden border-2 border-[#4A2E1B] shadow-sm">
      
      {/* Actual Combat Stage Sandbox Animation Screen */}
      <div className="relative h-32 md:h-36 bg-neutral-950 overflow-hidden select-none flex flex-col justify-between">
        
        {/* Render Pixel Art Backdrop inside Stage */}
        {renderPixelArtBackground()}

        {/* Pixel scanlines overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90.5deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none z-10 opacity-75"></div>

        {/* Display Floating Floating Damage Numbers */}
        <div className="absolute inset-x-4 top-2 pointer-events-none select-none h-14 z-20 overflow-hidden flex flex-col gap-1 items-center justify-start opacity-95">
          {percent < 100 ? (
            floatingText.map((t) => (
              <span
                key={t.id}
                className={`text-[10px] md:text-xs font-black tracking-wider px-2 py-0.5 rounded inline-block bg-[#FAF6EE]/95 border-2 border-[#4A2E1B] shadow-sm animate-bounce ${
                  t.styleType === 'spell'
                    ? 'text-amber-805'
                    : t.styleType === 'dodge'
                    ? 'text-indigo-805'
                    : 'text-[#A33B20]'
                }`}
              >
                {t.text}
              </span>
            ))
          ) : (
            <span className="text-[10px] md:text-xs font-black text-amber-900 bg-[#FAF6EE]/95 px-3 py-1.5 rounded border-2 border-[#4A2E1B] animate-pulse mt-1 select-none flex items-center gap-1.5 shadow-sm">
              👑 ダンジョン最奥部に到達！宝箱確保！
            </span>
          )}
        </div>

        {/* Interactive Side-to-Side Battle Representation */}
        <div className="flex-1 relative w-full h-full flex items-end pb-2">
          
          {/* 1. Playable Character Sprite Container */}
          <div
            className="absolute transition-all duration-1000 ease-linear flex flex-col items-center z-10"
            style={{ left: `${charLeftPosition}%`, transform: 'translateX(-50%)' }}
          >
            {/* Health / Name Tag above character */}
            <div className="bg-[#FAF6EE]/90 px-1.5 py-0.5 rounded border border-[#4A2E1B]/35 text-[8px] whitespace-nowrap mb-1 text-center font-mono">
              <span className="font-extrabold text-[#4A2E1B]">{char.name}</span>
              <div className="text-[7px] text-[#A33B20] font-bold">HP: {currentHpDisplay}/{maxHp}</div>
              <div className="w-10 h-1 bg-stone-300 rounded-full mt-0.5 overflow-hidden">
                <div 
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${hpPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Micro bouncing avatar based on combat tick */}
            <div className={`text-2xl select-none flex flex-col items-center justify-center relative ${
              percent < 100 && combatPhase % 2 === 1 ? '-translate-y-2.5 scale-105' : 'translate-y-0 scale-100'
            } transition-all duration-300`}>
              <span>{getJobEmoji()}</span>
              {/* Ground Shadow */}
              <div className="w-4 h-0.5 bg-[#4A2E1B]/15 rounded-full blur-xs mt-0.5"></div>

              {/* Attacking Sword particle overlay */}
              {percent < 100 && combatPhase === 1 && (
                <span className="absolute -right-2 top-0 text-xs text-amber-600 animate-ping">⚡</span>
              )}
            </div>
          </div>

          {/* 2. Dungeon Boss / Monster Enemy (Fixed on right side) */}
          <div className="absolute right-6 flex flex-col items-center">
            {/* Show Boss only if exploring or state active */}
            {percent < 100 ? (
              <>
                {/* Boss Healthbar */}
                <div className="bg-[#FAF6EE]/95 px-1.5 py-0.5 rounded border border-[#4A2E1B]/35 text-[8px] whitespace-nowrap mb-1 text-center font-mono flex flex-col items-center shadow-xs">
                  <span className="font-extrabold text-[#A33B20] truncate max-w-[95px] block">
                    {theme.monster.name}
                  </span>
                  <span className="text-[7.5px] text-rose-800 font-bold flex items-center justify-center gap-0.5 leading-none mt-0.5">
                    ✊ 敵戦力: {enemyPower}
                  </span>
                  <div className="text-[7px] text-[#A33B20] font-bold mt-0.5">HP: {enemyCurrentHp}/{enemyMaxHp}</div>
                  <div className="w-14 h-1 bg-stone-300 rounded-full mt-0.5 overflow-hidden mx-auto">
                    <div
                      className="h-full bg-rose-600 transition-all duration-300"
                      style={{ width: `${Math.max(0, 100 - percent)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Animated Monster Emoji */}
                <div className={`text-2xl select-none flex flex-col items-center ${
                  percent < 100 && combatPhase % 2 === 0 ? 'scale-110 translate-x-1' : 'scale-100 translate-x-0'
                } transition-all duration-300 relative`}>
                  <span>{theme.monster.emoji}</span>
                  <div className="w-4 h-0.5 bg-[#4A2E1B]/15 rounded-full blur-xs mt-0.5"></div>

                  {/* Damaged spark particle overlay */}
                  {percent < 100 && combatPhase === 1 && (
                    <span className="absolute -left-2 -top-1 text-[#A33B20] animate-ping font-mono text-xs">💥</span>
                  )}
                </div>
              </>
            ) : (
              // 3. Loot Chest (Reached!)
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-black bg-emerald-50 text-emerald-800 border border-emerald-500/35 px-1 py-0.2 rounded mb-0.5 animate-pulse uppercase">
                  UNLOCKED
                </span>
                <div className="text-3xl animate-bounce select-none" style={{ animationDuration: '1s' }}>
                  🎁
                </div>
                <div className="w-5 h-0.5 bg-amber-500/20 rounded-full blur-xs mt-0.5"></div>
              </div>
            )}
          </div>

        </div>

        {/* Real-time battle telemetry dashboard */}
        <div className="bg-[#FAF6EE]/90 px-2 py-1.5 flex items-center justify-between text-[8px] md:text-[9px] font-mono text-[#4A2E1B]/95 z-10 border-t border-[#4A2E1B]/20 flex-wrap gap-y-1">
          <span className="text-emerald-800 font-extrabold flex items-center gap-0.5 shrink-0">
            ✊ 社員: {stats.totalPower}
          </span>
          <span className="text-red-700 font-extrabold flex items-center gap-0.5 shrink-0">
            ❤️ HP: {currentHpDisplay}/{maxHp}
          </span>
          <span className="text-[#8C7A65] font-extrabold flex items-center gap-0.5 shrink-0">
            🎯 推奨: {targetRecPower}
          </span>
          <span className="text-rose-800 font-extrabold flex items-center gap-0.5 shrink-0">
            ✊ 敵: {enemyPower}
          </span>
          <span className="flex items-center gap-0.5 text-[#4A2E1B] shrink-0 font-bold">
            <Clock className="w-2.5 h-2.5 text-indigo-850" />
            時間: {secondsLeft}s
          </span>
          <span className="text-amber-800 font-black animate-pulse shrink-0">
            進行: {percent}%
          </span>
        </div>

      </div>

      {/* Progress Bar inside bottom chassis */}
      <div className="relative w-full h-2 bg-[#F5EFE6] border-t border-[#4A2E1B]/15">
        <div
          className={`h-full bg-gradient-to-r from-amber-600 via-indigo-600 to-emerald-600 transition-all duration-1000`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>

    </div>
  );
};
