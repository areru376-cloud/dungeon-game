import React from 'react';
import { BookOpen, Sparkles, ArrowRight, HelpCircle, UserCheck, Star, X, Hammer, Compass, Play } from 'lucide-react';

interface OnboardingTutorialProps {
  currentStep: number;
  activeTab: 'home' | 'staff' | 'blacksmith' | 'sortie';
  onNextStep: () => void;
  onPrevStep: () => void;
  onSetStep: (step: number) => void;
  onSkipTutorial: () => void;
  isOpen: boolean;
}

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  currentStep,
  activeTab,
  onNextStep,
  onPrevStep,
  onSetStep,
  onSkipTutorial,
  isOpen,
}) => {
  if (!isOpen) {
    return (
      <div className="bg-white border-2 border-slate-200 rounded-lg p-4 shadow-sm flex items-center justify-between text-[#1A365D]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#1A365D]/10 flex items-center justify-center text-[#1A365D] shrink-0">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black">初心者ガイド (ONBOARDING GUIDE)</h4>
            <p className="text-[10px] text-slate-500 leading-none mt-0.5">会社の基本ルールと派遣サイクルを再確認できます。</p>
          </div>
        </div>
        <button
          onClick={onSkipTutorial} // toggle on again
          className="text-xs font-black bg-[#1A365D] text-white border-b-2 border-slate-950 hover:bg-[#254d80] px-3 py-1.5 rounded active:translate-y-[1px] cursor-pointer"
        >
          🎓 ガイドを開く
        </button>
      </div>
    );
  }

  // Define steps configurations
  const steps = [
    {
      title: '社員の正規雇用と訓練 (人事配属)',
      desc: '正社員（戦士・シーフ・魔術師）を求人し、ゴールドを投資して能力を育成するステップです。',
      actionPrompt: '1. 画面最下部の「👥 人事」タブを選択してください。初期社員ハルト・エルマが入社済みです。',
      icon: <UserCheck className="w-5 h-5 text-amber-500 shrink-0" />,
      tabHighlight: 'staff' as const,
      color: 'border-amber-400 bg-amber-50/20',
      badge: '雇用と訓練'
    },
    {
      title: '社員の派遣オーダー (出撃指令)',
      desc: 'ダンジョンを選択し、適合する戦闘力（ATK）を持った待機社員を派遣します。戦闘力が不足すると全滅のリスクがあります。',
      actionPrompt: '2. 画面最下部の「⚔️ 出撃」タブを選択し、目的地と派遣する社員を選んで出撃させましょう。',
      icon: <Compass className="w-5 h-5 text-sky-600 shrink-0" />,
      tabHighlight: 'sortie' as const,
      color: 'border-sky-450 bg-sky-50/15',
      badge: 'ダンジョン派遣'
    },
    {
      title: 'ライブモニター確認と材料回収 (利益精算)',
      desc: '派遣された社員は、ホーム画面の「派遣モニター（Live Feed）」で実際に移動し、遭遇モンスターと交戦します！',
      actionPrompt: '3. 「🏢 ホーム」タブに戻り、最奥部に到達したら「報酬を受け取る」キーを押してゴールドや素材を引き取りましょう。',
      icon: <Star className="w-5 h-5 text-emerald-500 shrink-0" />,
      tabHighlight: 'home' as const,
      color: 'border-emerald-400 bg-emerald-50/20',
      badge: '利益回収'
    },
    {
      title: '職人工房での神武具製造 (最強への跳躍)',
      desc: '回収した「鉄鉱石」「魔力結晶」「竜の逆鱗」をゴールドと共に消費し、強烈なオプション付属の武具を新造・厳選します！',
      actionPrompt: '4. 「🔨 鍛冶屋」タブから最上の装備を新調し、さらに難化した「極限の奈落」の深層攻略を目指しましょう！',
      icon: <Hammer className="w-5 h-5 text-purple-500 shrink-0" />,
      tabHighlight: 'blacksmith' as const,
      color: 'border-purple-400 bg-purple-50/20',
      badge: '鍛冶屋製造'
    },
  ];

  const activeStepConfig = steps[currentStep];

  return (
    <div className={`border-2 rounded-xl p-4 md:p-5 text-[#1A365D] relative shadow-sm transition-all duration-300 bg-white ${activeStepConfig.color}`}>
      
      {/* Upper header */}
      <div className="flex justify-between items-start border-b border-[#1A365D]/10 pb-3 mb-3.5 gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#1A365D] animate-bounce shrink-0" style={{ animationDuration: '4s' }} />
          <div>
            <h3 className="text-xs md:text-sm font-black flex items-center gap-1.5 leading-none">
              <span>ギルド研修の手引き</span>
              <span className="text-[9px] bg-[#1A365D] text-white px-2 py-0.5 rounded-full font-mono font-black">
                STEP {currentStep + 1} / 4
              </span>
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-black font-mono tracking-wider">
              NEW PLAYER INDUCTION MANUAL
            </p>
          </div>
        </div>

        <button
          onClick={onSkipTutorial}
          className="p-1 text-slate-400 hover:text-[#1A365D] rounded hover:bg-slate-100 transition-colors cursor-pointer"
          title="チュートリアルを閉じる"
        >
          <X className="w-4 h-4 shrink-0" />
        </button>
      </div>

      {/* Guide Body */}
      <div className="flex flex-col md:flex-row items-start gap-4">
        {/* Step Visual Symbol Icon */}
        <div className="w-10 h-10 rounded-lg bg-white border-2 border-slate-200/80 flex items-center justify-center shrink-0 shadow-xs relative">
          {activeStepConfig.icon}
          <span className="absolute -bottom-1 -right-1 text-[8px] bg-[#1A365D] text-white px-1.5 py-0.2 rounded font-black font-mono leading-none">
            {activeStepConfig.badge}
          </span>
        </div>

        <div className="space-y-2 flex-1 min-w-0">
          <h4 className="font-extrabold text-xs md:text-sm text-slate-900 leading-tight">
            {activeStepConfig.title}
          </h4>
          <p className="text-[11px] leading-relaxed text-slate-600 block">
            {activeStepConfig.desc}
          </p>

          {/* Action indicator highlighting what to do right now */}
          <div className="bg-white/80 border border-amber-350/50 p-2.5 rounded-lg text-[11px] text-amber-900 leading-tight font-extrabold flex gap-1.5 items-start mt-2">
            <span className="text-amber-500 leading-none select-none">👉</span>
            <span className="flex-1">
              {activeStepConfig.actionPrompt}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Steps Progress Bar */}
      <div className="mt-4 pt-3.5 border-t border-[#1A365D]/10 flex flex-col sm:flex-row justify-between items-center gap-3">
        {/* Stepper bubbles */}
        <div className="flex gap-2 shrink-0">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => onSetStep(idx)}
              className={`w-5 h-5 rounded-full border text-[10px] font-mono font-black flex items-center justify-center transition-all ${
                idx === currentStep
                  ? 'bg-[#1A365D] text-white border-[#1A365D] scale-110 shadow-xs'
                  : idx < currentStep
                  ? 'bg-slate-200 text-slate-500 border-slate-300'
                  : 'bg-white text-slate-400 border-slate-200 hover:border-slate-350'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {/* Stepper Buttons (Prev / Next) */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onPrevStep}
            disabled={currentStep === 0}
            className={`flex-1 sm:flex-initial text-xs px-3 py-1.5 font-bold rounded border transition-colors ${
              currentStep === 0
                ? 'opacity-40 text-slate-450 border-slate-200 cursor-not-allowed'
                : 'bg-white text-[#1A365D] border-[#1A365D] hover:bg-slate-50'
            }`}
          >
            戻る
          </button>
          
          <button
            onClick={onNextStep}
            disabled={currentStep === steps.length - 1}
            className={`flex-1 sm:flex-initial text-xs px-4 py-1.5 font-black rounded border transition-colors flex items-center justify-center gap-1.5 ${
              currentStep === steps.length - 1
                ? 'opacity-40 bg-slate-100 text-slate-400 border-slate-250 cursor-not-allowed'
                : 'bg-[#1A365D] text-white border-slate-950 hover:bg-[#204370] cursor-pointer'
            }`}
          >
            次へ
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      </div>

    </div>
  );
};
