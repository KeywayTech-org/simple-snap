import React from 'react';
import { Camera, Sparkles, History, HelpCircle } from 'lucide-react';
import { ShinyText } from './reactbits/ShinyText';

interface NavbarProps {
  historyCount: number;
  onOpenHistory: () => void;
  onOpenHelp: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  historyCount,
  onOpenHistory,
  onOpenHelp,
}) => {
  return (
    <header className="shrink-0 z-30 bg-stone-900/80 backdrop-blur-md border-b border-stone-800/80 text-stone-100">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-13 sm:h-14 flex items-center justify-between">
        {/* Brand identity with ShinyText */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-stone-800 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                <ShinyText text="AI P图" speed={4} />
                <span className="text-stone-400 font-light text-xs sm:text-sm">| Zine Studio</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25 font-mono">
                <Sparkles className="w-2.5 h-2.5" /> scenes-gathered-zine-v1-3
              </span>
            </div>
            <p className="text-[10px] text-stone-400 leading-none hidden xs:block">
              视觉感知提取 · gpt-image-2 渲染
            </p>
          </div>
        </div>

        {/* Right action triggers */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            id="btn-nav-history"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium text-stone-300 hover:text-white bg-stone-850 hover:bg-stone-800 border border-stone-750 transition-colors shadow-xs"
            title="历史记录"
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xs:inline">作品集</span>
            {historyCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-stone-950 font-bold text-[10px] flex items-center justify-center">
                {historyCount}
              </span>
            )}
          </button>

          <button
            id="btn-nav-help"
            onClick={onOpenHelp}
            className="p-1.5 sm:p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 border border-stone-800 hover:border-stone-700 transition-colors"
            title="工作流说明"
            aria-label="工作流说明"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
