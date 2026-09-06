import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Download, Check, RotateCcw, Smartphone, CheckCircle2, Loader2, Circle } from 'lucide-react';
import { RemixResult, RemixStageInfo, RemixStageType } from '../../types';

interface ZenGenerateScreenProps {
  isProcessing: boolean;
  currentStage: RemixStageInfo | null;
  progressPercent: number;
  result: RemixResult | null;
  onReset: () => void;
}

interface StepMeta {
  key: RemixStageType;
  step: number;
  title: string;
  desc: string;
}

const STAGES_CONFIG: StepMeta[] = [
  { key: 'analyzing', step: 1, title: '图片解析中', desc: '原图构图与主体光影析理' },
  { key: 'synthesizing', step: 2, title: '灵感生成中', desc: '艺术风格编排与提示词推演' },
  { key: 'generating', step: 3, title: '图片重构中', desc: '神经画笔纸本撕边与重绘' },
  { key: 'transferring', step: 4, title: '图片传输中', desc: '产物解码校验与数据呈画' },
];

export const ZenGenerateScreen: React.FC<ZenGenerateScreenProps> = ({
  isProcessing,
  currentStage,
  progressPercent,
  result,
  onReset,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownload = async () => {
    if (!result?.outputImageUrl) return;

    try {
      const response = await fetch(result.outputImageUrl);
      const blob = await response.blob();
      const filename = `simple-snap_${Date.now()}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      // Mobile native share (saves directly to Photos on iOS & Android)
      if (
        navigator.canShare &&
        navigator.canShare({ files: [file] }) &&
        /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
      ) {
        await navigator.share({
          files: [file],
          title: result.title || '撕片 SimpleSnap',
          text: '保存至相册',
        });
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
        return;
      }

      // Web direct download
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch {
      // Fallback
      const a = document.createElement('a');
      a.href = result.outputImageUrl;
      a.download = `simple-snap_${Date.now()}.png`;
      a.target = '_blank';
      a.click();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }
  };

  const currentStepNumber = currentStage?.step || 1;

  return (
    <div className="w-full max-w-xl min-w-0 mx-auto flex flex-1 min-h-0 flex-col justify-between py-2 sm:py-4 gap-3 sm:gap-5 px-2 sm:px-4">
      {/* Title */}
      <div className="text-center shrink-0">
        <span className="stamp-seal text-[10px] sm:text-[11px] px-1 py-0.5 mb-2 inline-block font-serif select-none">
          第三屏 · 赋印
        </span>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-serif tracking-widest text-stone-900 font-normal">
          {isProcessing ? '淬炼生成中' : '海报成图'}
        </h2>
        <p className="text-xs sm:text-sm font-serif text-stone-600 mt-1 tracking-widest">
          {isProcessing
            ? (currentStage?.detail || '正按真实阶段流式制作艺术画报...')
            : '留白成章 · 纸本呈画'}
        </p>
      </div>

      {/* Main Center Canvas */}
      <div className="flex-1 min-h-0 min-w-0 flex flex-col items-center justify-center w-full">
        {isProcessing ? (
          /* Loading State: Multi-stage Real Progress Box */
          <div className="w-full max-w-xs sm:max-w-sm md:max-w-md bg-white p-5 sm:p-6 border border-stone-300 shadow-2xs flex flex-col items-center relative shrink-0 select-none">
            {/* Corner marks */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-stone-400" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-stone-400" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-stone-400" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-stone-400" />

            {/* Header Stage Tag */}
            <div className="w-full flex items-center justify-between border-b border-stone-200 pb-2 mb-3">
              <span className="stamp-seal text-[10px] px-1.5 py-0.5 font-serif">
                {currentStage?.title || '墨韵淬炼'}
              </span>
              <span className="text-[11px] font-mono text-stone-600">
                阶段 {currentStepNumber} / 4
              </span>
            </div>

            {/* 4 Real Stages Flow List */}
            <div className="w-full space-y-2 mb-4 font-serif">
              {STAGES_CONFIG.map((s) => {
                const isDone = currentStepNumber > s.step;
                const isCurrent = currentStepNumber === s.step;
                const isPending = currentStepNumber < s.step;

                return (
                  <div
                    key={s.key}
                    className={`flex items-center justify-between p-2 rounded-xs border transition-all text-xs ${
                      isCurrent
                        ? 'bg-stone-100 border-stone-900 text-stone-950 font-bold shadow-2xs'
                        : isDone
                        ? 'bg-stone-50 border-stone-200 text-stone-700'
                        : 'bg-transparent border-dashed border-stone-200 text-stone-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="w-3.5 h-3.5 text-stone-900 animate-spin shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                      )}
                      <span className="tracking-wider whitespace-nowrap">{s.title}</span>
                    </div>

                    <span className="text-[10px] text-stone-500 font-sans tracking-tight truncate pl-2">
                      {isCurrent ? currentStage?.detail || s.desc : s.desc}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Ultra-clean Line Progress Bar */}
            <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden mb-2">
              <div
                className="bg-stone-900 h-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(6, progressPercent))}%` }}
              />
            </div>

            <div className="w-full flex justify-between text-[10px] sm:text-[11px] font-serif text-stone-600 tracking-wider">
              <span className="truncate">{currentStage?.detail || '正协同多模态服务流式处理中'}</span>
              <span className="font-mono font-bold shrink-0 pl-2">{Math.round(progressPercent)}%</span>
            </div>
          </div>
        ) : result ? (
          /* Finished State: Art Poster with Mounting Frame */
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xs sm:max-w-sm md:max-w-md bg-white p-3 sm:p-4 border border-stone-300 shadow-sm flex flex-col items-center relative shrink-0"
          >
            {/* Fine mounting border */}
            <div className="w-full max-h-[38vh] sm:max-h-[44vh] overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center">
              <img
                src={result.outputImageUrl}
                alt={result.title}
                className="w-full h-auto max-h-[38vh] sm:max-h-[44vh] object-contain select-none shadow-2xs"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Poster Header / Seal */}
            <div className="w-full mt-2.5 pt-2 border-t border-stone-200 flex items-center justify-between gap-2 font-serif text-xs">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="font-bold text-stone-900 tracking-widest truncate min-w-0 whitespace-nowrap">
                  {result.title}
                </span>
                <span className="text-[10px] text-stone-500 font-mono truncate min-w-0 whitespace-nowrap">
                  {result.zineVolume}
                </span>
              </div>
              <span className="stamp-seal text-[9px] px-0.5 shrink-0 select-none">印毕</span>
            </div>
          </motion.div>
        ) : null}
      </div>

      {/* Bottom Actions */}
      <div className="border-t border-stone-200/80 pt-3 flex flex-col items-center gap-2.5 shrink-0 w-full">
        {!isProcessing && result && (
          <>
            <button
              id="btn-zen-download"
              type="button"
              onClick={handleDownload}
              className="w-full sm:w-auto px-8 sm:px-12 py-2.5 sm:py-3.5 bg-stone-950 hover:bg-stone-800 text-stone-100 font-serif text-xs sm:text-sm tracking-widest shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shrink-0 whitespace-nowrap"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                  <span>已保存海报</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>下载海报 / 保存至相册</span>
                </>
              )}
            </button>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[11px] sm:text-xs font-serif text-stone-600">
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Smartphone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>手机亦可长按图片存储</span>
              </span>
              <span className="text-stone-300">·</span>
              <button
                type="button"
                onClick={onReset}
                className="text-stone-700 hover:text-stone-950 underline transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>再作一幅</span>
              </button>
            </div>
          </>
        )}

        {isProcessing && (
          <div className="flex items-center gap-3 text-[11px] sm:text-xs font-serif text-stone-500">
            <span>正在生成，请静候片刻...</span>
          </div>
        )}
      </div>
    </div>
  );
};
