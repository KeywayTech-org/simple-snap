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
}

const STAGES_CONFIG: StepMeta[] = [
  { key: 'analyzing', step: 1, title: '图片解析中' },
  { key: 'synthesizing', step: 2, title: '灵感生成中' },
  { key: 'generating', step: 3, title: '图片重构中' },
  { key: 'transferring', step: 4, title: '图片传输中' },
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
    <div className="w-full max-w-xl min-w-0 mx-auto flex flex-1 flex-col justify-between py-1 sm:py-3 gap-1.5 sm:gap-4 px-2 sm:px-4 min-h-full">
      {/* Title */}
      <div className="text-center shrink-0 flex flex-col items-center">
        <span className="stamp-seal text-[9px] sm:text-[11px] px-1 py-0.5 mb-1 sm:mb-1.5 inline-block font-serif select-none">
          第三屏 · 赋印
        </span>
        <h2 className="text-lg sm:text-2xl md:text-3xl font-serif tracking-widest text-stone-900 font-normal leading-tight">
          {isProcessing ? (currentStage?.title || '淬炼生成中') : '海报成图'}
        </h2>
        {!isProcessing && (
          <p className="text-[11px] sm:text-sm font-serif text-stone-600 mt-0.5 tracking-widest leading-tight">
            留白成章 · 纸本呈画
          </p>
        )}
      </div>

      {/* Main Center Canvas */}
      <div className="flex-1 min-h-[140px] sm:min-h-0 min-w-0 flex flex-col items-center justify-center w-full my-auto py-1 sm:py-2">
        {isProcessing ? (
          /* Loading State: Multi-stage Real Progress Box */
          <div className="w-full max-w-[360px] sm:max-w-md max-h-full bg-white p-4 sm:p-6 border border-stone-300 shadow-2xs flex flex-col items-center relative min-h-0 select-none overflow-y-auto no-scrollbar">
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

                return (
                  <div
                    key={s.key}
                    className={`flex items-center justify-between p-2.5 rounded border transition-all text-xs gap-2 ${
                      isCurrent
                        ? 'bg-stone-100 border-stone-900 text-stone-950 font-bold shadow-2xs'
                        : isDone
                        ? 'bg-stone-50 border-stone-200 text-stone-700'
                        : 'bg-transparent border-dashed border-stone-200 text-stone-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-stone-900 animate-spin shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-stone-300 shrink-0" />
                      )}
                      <span className="tracking-wider whitespace-nowrap text-xs sm:text-sm">{s.title}</span>
                    </div>

                    <span className="text-[11px] font-mono shrink-0 text-stone-500">
                      {isDone ? '完成' : isCurrent ? '进行中' : '等待'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Ultra-clean Line Progress Bar */}
            <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden mb-2.5">
              <div
                className="bg-stone-900 h-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(6, progressPercent))}%` }}
              />
            </div>

            <div className="w-full flex justify-between items-center text-xs font-serif text-stone-700 tracking-wider">
              <span>{currentStage?.title || '正在生成'}</span>
              <span className="font-mono font-bold shrink-0">{Math.round(progressPercent)}%</span>
            </div>
          </div>
        ) : result ? (
          /* Finished State: Art Poster with Mounting Frame */
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[340px] sm:max-w-[400px] bg-white p-3 sm:p-4 border border-stone-300 shadow-sm flex flex-col items-center min-h-0 relative"
          >
            {/* Fine mounting border - Flexibly fills available space without overflowing */}
            <div className="w-full aspect-[3/4] max-h-[46vh] sm:max-h-[52vh] overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center p-1">
              <img
                src={result.outputImageUrl}
                alt={result.title}
                className="max-w-full max-h-full w-auto h-auto object-contain select-none shadow-2xs"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Poster Header / Seal */}
            <div className="w-full mt-2.5 pt-2 border-t border-stone-200 flex items-center justify-between gap-2.5 font-serif text-xs shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="font-bold text-stone-900 tracking-widest truncate min-w-0">
                  {result.title}
                </span>
                <span className="text-[10px] text-stone-500 font-mono truncate min-w-0 shrink-0">
                  {result.zineVolume}
                </span>
              </div>
              <span className="stamp-seal text-[9px] px-1 shrink-0 select-none">印毕</span>
            </div>
          </motion.div>
        ) : null}
      </div>

      {/* Bottom Actions */}
      <div className="border-t border-stone-200/80 pt-2.5 sm:pt-3.5 flex flex-col items-center gap-2 sm:gap-3 shrink-0 w-full">
        {!isProcessing && result && (
          <>
            <button
              id="btn-zen-download"
              type="button"
              onClick={handleDownload}
              className="w-full max-w-[340px] sm:w-auto min-h-[44px] px-8 sm:px-12 py-3 bg-stone-950 hover:bg-stone-800 text-stone-100 font-serif text-xs sm:text-sm tracking-widest shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shrink-0 whitespace-nowrap"
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

            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-serif text-stone-600">
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Smartphone className="w-3.5 h-3.5" />
                <span>手机亦可长按图片存储</span>
              </span>
              <span className="text-stone-300">·</span>
              <button
                type="button"
                onClick={onReset}
                className="text-stone-700 hover:text-stone-950 underline transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
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
