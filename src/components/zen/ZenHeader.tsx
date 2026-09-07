import React from 'react';

interface ZenHeaderProps {
  currentStep: number;
  onReset: () => void;
  hasImage: boolean;
}

export const ZenHeader: React.FC<ZenHeaderProps> = ({ currentStep, onReset }) => {
  const stepNames = ['壹 · 呈图', '贰 · 择格', '叁 · 赋印'];

  return (
    <header className="w-full shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2.5 sm:py-4 px-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:px-8 md:px-12 flex items-center justify-between border-b border-stone-200/70 bg-[#f7f5f0]/90 backdrop-blur-xs z-20 gap-3">
      {/* Brand logo in Chinese Calligraphic Serif */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
        <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded border border-stone-800 text-stone-900 font-serif font-bold text-xs sm:text-sm bg-stone-100/50 shadow-2xs shrink-0 select-none">
          撕
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-serif text-xs sm:text-base md:text-lg font-bold tracking-wider sm:tracking-widest text-stone-900 whitespace-nowrap truncate">
              撕片 · SimpleSnap
            </span>
            <span className="stamp-seal text-[8px] sm:text-[10px] px-1 py-0.5 leading-none font-serif shrink-0 select-none">
              雅集
            </span>
          </div>
          <span className="font-serif text-[10px] text-stone-500 tracking-wider whitespace-nowrap hidden sm:inline">
            一撕一换 · 热门风格快易
          </span>
        </div>
      </div>

      {/* Subtle Step Marks - Responsive and non-colliding */}
      <div className="flex items-center gap-2 sm:gap-4 md:gap-6 font-serif text-xs text-stone-600 shrink-0">
        {/* Mobile step display */}
        <div className="flex sm:hidden items-center gap-1.5 text-xs text-stone-800">
          <span className="px-2 py-0.5 bg-stone-200/80 rounded text-[11px] font-bold text-stone-900 select-none">
            {stepNames[currentStep - 1] || `第 ${currentStep} 步`}
          </span>
        </div>

        {/* Desktop step display */}
        <div className="hidden sm:flex items-center gap-3 md:gap-5">
          <span className={currentStep === 1 ? 'text-stone-950 font-bold border-b border-stone-950 pb-0.5 whitespace-nowrap' : 'whitespace-nowrap'}>
            壹 · 呈图
          </span>
          <span className="text-stone-300 select-none">/</span>
          <span className={currentStep === 2 ? 'text-stone-950 font-bold border-b border-stone-950 pb-0.5 whitespace-nowrap' : 'whitespace-nowrap'}>
            贰 · 择格
          </span>
          <span className="text-stone-300 select-none">/</span>
          <span className={currentStep === 3 ? 'text-stone-950 font-bold border-b border-stone-950 pb-0.5 whitespace-nowrap' : 'whitespace-nowrap'}>
            叁 · 赋印
          </span>
        </div>

        {currentStep > 1 && (
          <button
            type="button"
            onClick={onReset}
            className="min-h-[28px] px-2.5 py-1 text-[11px] text-stone-700 hover:text-stone-950 active:bg-stone-200/60 border border-stone-300 hover:border-stone-500 rounded transition-colors shrink-0 whitespace-nowrap cursor-pointer"
          >
            重置
          </button>
        )}
      </div>
    </header>
  );
};
