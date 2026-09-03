import React from 'react';
import { Check, Upload, Palette, Wand2, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface StepIndicatorProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
  maxReachedStep: number;
  isProcessing: boolean;
}

const STEPS = [
  { step: 1, title: '选照片', sub: 'Upload', icon: Upload },
  { step: 2, title: '定风格', sub: 'Zine Skill', icon: Palette },
  { step: 3, title: 'AI 制作', sub: 'gpt-image-2', icon: Wand2 },
  { step: 4, title: '存大片', sub: 'Save Album', icon: ImageIcon },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  onSelectStep,
  maxReachedStep,
  isProcessing,
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto px-2">
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 p-1 bg-stone-900/80 rounded-2xl border border-stone-800 backdrop-blur-md">
        {STEPS.map((item) => {
          const isActive = currentStep === item.step;
          const isCompleted = item.step < currentStep || (item.step === 3 && currentStep === 4);
          const isClickable = !isProcessing && item.step <= maxReachedStep;
          const Icon = item.icon;

          return (
            <button
              key={item.step}
              id={`step-nav-${item.step}`}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onSelectStep(item.step)}
              className={`relative py-1.5 px-2 rounded-xl transition-all flex flex-col items-center justify-center text-center ${
                !isClickable ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-stone-800/60'
              }`}
            >
              {/* Active animated background pill */}
              {isActive && (
                <motion.div
                  layoutId="activeStepIndicator"
                  className="absolute inset-0 rounded-xl bg-amber-500/15 border border-amber-500/40 shadow-sm"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}

              <div className="relative z-10 flex items-center gap-1.5 mb-0.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-colors ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-stone-800 text-stone-400 border border-stone-700'
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : <Icon className="w-2.5 h-2.5" />}
                </div>
                <span
                  className={`text-xs font-medium hidden xs:inline transition-colors ${
                    isActive ? 'text-amber-300 font-semibold' : isCompleted ? 'text-stone-300' : 'text-stone-500'
                  }`}
                >
                  {item.title}
                </span>
              </div>

              <span
                className={`relative z-10 text-[10px] font-mono tracking-tighter truncate max-w-full ${
                  isActive ? 'text-amber-400/90' : 'text-stone-500'
                }`}
              >
                {item.sub}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
