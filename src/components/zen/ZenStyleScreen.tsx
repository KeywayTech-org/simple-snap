import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ChevronLeft, ChevronRight, Wand2 } from 'lucide-react';
import { STYLE_PRESETS } from '../../data/presets';
import { StylePreset } from '../../types';

interface ZenStyleScreenProps {
  currentImage: string | null;
  selectedPresetId: string;
  onSelectPreset: (id: string) => void;
  onPrev: () => void;
  onStartRemix: () => void;
}

export const ZenStyleScreen: React.FC<ZenStyleScreenProps> = ({
  currentImage,
  selectedPresetId,
  onSelectPreset,
  onPrev,
  onStartRemix,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (dir: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: dir === 'left' ? -280 : 280,
        behavior: 'smooth',
      });
    }
  };

  const chineseNumerals = ['壹', '贰', '叁', '肆', '伍'];

  return (
    <div className="w-full max-w-4xl min-w-0 mx-auto flex flex-1 min-h-0 flex-col justify-between py-2 sm:py-4 gap-3 sm:gap-5 px-2 sm:px-4">
      {/* Title with Chinese Serif */}
      <div className="text-center shrink-0">
        <span className="stamp-seal text-[10px] sm:text-[11px] px-1 py-0.5 mb-2 inline-block font-serif select-none">
          第二屏 · 择格
        </span>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-serif tracking-widest text-stone-900 font-normal">
          选择风格
        </h2>
        <p className="text-xs sm:text-sm font-serif text-stone-600 mt-1 tracking-widest">
          横向滑动浏览 · 依选定风格赋型
        </p>
      </div>

      {/* Horizontal Cards Carousel Section */}
      <div className="flex-1 min-h-0 min-w-0 flex flex-col justify-center w-full relative">
        {/* Navigation scroll arrows (visible on larger screens, safely positioned inside container) */}
        <button
          type="button"
          onClick={() => handleScroll('left')}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 border border-stone-300 items-center justify-center text-stone-700 hover:text-stone-950 shadow-sm transition-transform hover:scale-105 shrink-0"
          aria-label="Previous style"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => handleScroll('right')}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 border border-stone-300 items-center justify-center text-stone-700 hover:text-stone-950 shadow-sm transition-transform hover:scale-105 shrink-0"
          aria-label="Next style"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Horizontal Scrolling Card Track */}
        <div
          ref={scrollContainerRef}
          className="flex items-stretch justify-start md:justify-center gap-3.5 sm:gap-5 overflow-x-auto no-scrollbar px-6 sm:px-8 py-3 scroll-smooth w-full min-w-0"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {STYLE_PRESETS.map((preset: StylePreset, index: number) => {
            const isSelected = selectedPresetId === preset.id;
            const numeral = chineseNumerals[index] || `${index + 1}`;

            return (
              <motion.div
                key={preset.id}
                id={`card-style-${preset.id}`}
                className="w-[270px] sm:w-64 md:w-72 shrink-0"
                style={{ scrollSnapAlign: 'center' }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + index * 0.06, duration: 0.45, ease: 'easeOut' }}
              >
                <div
                  onClick={() => {
                    if (navigator.vibrate) {
                      try {
                        navigator.vibrate(12);
                      } catch {
                        // ignore
                      }
                    }
                    onSelectPreset(preset.id);
                  }}
                  className={`h-full w-full cursor-pointer transition-all duration-300 select-none flex flex-col justify-between p-4 sm:p-6 bg-white relative border ${
                    isSelected
                      ? 'border-stone-950 shadow-md ring-1 ring-stone-950 -translate-y-0.5'
                      : 'border-stone-300 hover:border-stone-500 shadow-2xs'
                  }`}
                >
                {/* Traditional Chinese Corner Accents on Selected */}
                {isSelected && (
                  <>
                    <div className="absolute top-1.5 left-1.5 w-2 h-2 border-t border-l border-stone-900" />
                    <div className="absolute top-1.5 right-1.5 w-2 h-2 border-t border-r border-stone-900" />
                    <div className="absolute bottom-1.5 left-1.5 w-2 h-2 border-b border-l border-stone-900" />
                    <div className="absolute bottom-1.5 right-1.5 w-2 h-2 border-b border-r border-stone-900" />
                  </>
                )}

                {/* Top Number & Tag */}
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-stone-200 pb-2">
                    <span className="font-serif text-sm text-stone-600 tracking-widest font-bold">
                      {numeral}
                    </span>
                    <span
                      className={`text-[9px] sm:text-[10px] font-serif tracking-wider px-1.5 py-0.5 ${
                        isSelected
                          ? 'stamp-seal font-semibold'
                          : 'text-stone-600 border border-stone-300'
                      }`}
                    >
                      {preset.tag}
                    </span>
                  </div>

                  {/* Title & Calligraphy Feeling */}
                  <h3 className="font-serif text-lg sm:text-xl md:text-2xl tracking-widest text-stone-950 mb-2 font-normal">
                    {preset.name}
                  </h3>

                  <p className="font-serif text-xs text-stone-600 leading-relaxed tracking-wider mb-4 min-h-[2.8rem]">
                    {preset.description}
                  </p>
                </div>

                {/* Bottom Status / Selection Marker */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-serif">
                  <span className="text-stone-600 text-xs tracking-wider whitespace-nowrap">
                    {isSelected ? '已选定此格' : '点击择定'}
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-stone-950 bg-stone-950 text-white'
                        : 'border-stone-400'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Subtle mobile swipe hint */}
        <div className="md:hidden text-center mt-2">
          <span className="text-[11px] font-serif text-stone-500 tracking-wider">
            ← 左右滑动浏览风格 · 点击选定 →
          </span>
        </div>
      </div>

      {/* Bottom Step Actions */}
      <div className="border-t border-stone-200/80 pt-3.5 pb-1 flex items-center justify-between gap-3 shrink-0 w-full">
        <button
          type="button"
          onClick={onPrev}
          className="min-h-[44px] px-4 sm:px-5 py-2.5 border border-stone-300 hover:border-stone-400 active:bg-stone-100 text-stone-700 font-serif text-xs tracking-widest transition-colors flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>返回呈图</span>
        </button>

        <button
          id="btn-zen-start-generate"
          type="button"
          onClick={onStartRemix}
          className="min-h-[44px] px-6 sm:px-10 py-2.5 sm:py-3 bg-stone-950 text-stone-100 hover:bg-stone-800 font-serif text-xs sm:text-sm tracking-widest shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 shrink-0 whitespace-nowrap cursor-pointer"
        >
          <Wand2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>生成照片</span>
        </button>
      </div>
    </div>
  );
};
