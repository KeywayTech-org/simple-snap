import React from 'react';
import { Sparkles, CheckCircle2, Loader2, Camera } from 'lucide-react';
import { SpotlightCard } from '../reactbits/SpotlightCard';
import { DecryptedText } from '../reactbits/DecryptedText';
import { ShinyText } from '../reactbits/ShinyText';

interface StepProcessingProps {
  currentStepStage: number; // 1, 2, 3
  currentImage: string | null;
  selectedPresetName: string;
}

export const StepProcessing: React.FC<StepProcessingProps> = ({
  currentStepStage,
  currentImage,
  selectedPresetName,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto h-full flex flex-col items-center justify-center py-2">
      <SpotlightCard
        spotlightColor="rgba(245, 158, 11, 0.18)"
        className="w-full border-stone-800 p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-2xl"
      >
        {/* Radar Scanner & Pulse Avatar */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />

          <div className="absolute inset-0 flex items-center justify-center">
            {currentImage ? (
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-amber-400/50 shadow-inner relative">
                <img
                  src={currentImage}
                  alt="Processing preview"
                  className="w-full h-full object-cover opacity-80"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-amber-500/10 mix-blend-color-dodge animate-pulse" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-stone-800 flex items-center justify-center text-amber-400">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 mb-2">
          步骤 03 · AI 深度工坊制作中
        </span>

        <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
          <ShinyText text="正在重构所选风格艺术大片" speed={3} />
        </h3>

        <div className="text-xs text-stone-400 max-w-sm mb-6 font-mono">
          风格工坊：
          <DecryptedText
            text={selectedPresetName || '经典独立杂志 (Classic Indie Zine)'}
            speed={30}
            className="text-amber-300 font-semibold ml-1"
          />
        </div>

        {/* 3 Pipeline Stages Card */}
        <div className="w-full flex flex-col gap-2.5 text-left text-xs bg-stone-950/70 p-4 rounded-xl border border-stone-850">
          {/* Stage 1 */}
          <div
            className={`flex items-center gap-3 transition-colors ${
              currentStepStage >= 1 ? 'text-stone-200' : 'text-stone-500'
            }`}
          >
            {currentStepStage > 1 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
            )}
            <div className="flex-1">
              <span className="font-semibold text-amber-300/90">
                1. 大模型视觉感知：
              </span>
              <span className="text-stone-300 ml-1">
                提取照片主体姿态、自然光照与原画构图
              </span>
            </div>
          </div>

          {/* Stage 2 */}
          <div
            className={`flex items-center gap-3 transition-colors ${
              currentStepStage >= 2 ? 'text-stone-200' : 'text-stone-500'
            }`}
          >
            {currentStepStage > 2 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : currentStepStage === 2 ? (
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-stone-700 shrink-0" />
            )}
            <div className="flex-1">
              <span className="font-semibold text-amber-300/90">
                2. 风格 Skill 编排：
              </span>
              <span className="text-stone-300 ml-1">
                生成专属的高精英语海报提示词
              </span>
            </div>
          </div>

          {/* Stage 3 */}
          <div
            className={`flex items-center gap-3 transition-colors ${
              currentStepStage >= 3 ? 'text-stone-200' : 'text-stone-500'
            }`}
          >
            {currentStepStage === 3 ? (
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-stone-700 shrink-0" />
            )}
            <div className="flex-1">
              <span className="font-semibold text-amber-300/90">
                3. gpt-image-2 深度出图：
              </span>
              <span className="text-stone-300 ml-1">
                高精渲染新杂志风创意摄影大片
              </span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-stone-500 mt-4 flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-amber-500/80" />
          <span>通常仅需 5 ~ 12 秒，请稍候片刻...</span>
        </p>
      </SpotlightCard>
    </div>
  );
};
