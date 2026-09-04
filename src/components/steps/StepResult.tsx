import React, { useState } from 'react';
import {
  Download,
  Share2,
  Copy,
  Sparkles,
  RefreshCw,
  Sliders,
  Check,
  Smartphone,
  ArrowLeftRight,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { RemixResult } from '../../types';
import { getPresetDisplayName } from '../../data/presets';
import { ShinyText } from '../reactbits/ShinyText';
import { DecryptedText } from '../reactbits/DecryptedText';
import { SpotlightCard } from '../reactbits/SpotlightCard';

interface StepResultProps {
  result: RemixResult;
  originalImage: string | null;
  onResetToUpload: () => void;
  onRegenerateWithPrompt: (newPrompt: string) => Promise<void>;
  isRegenerating: boolean;
}

export const StepResult: React.FC<StepResultProps> = ({
  result,
  originalImage,
  onResetToUpload,
  onRegenerateWithPrompt,
  isRegenerating,
}) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(result.prompt);

  // Save to Album
  const handleSaveToAlbum = async () => {
    if (!result?.outputImageUrl) return;

    try {
      const response = await fetch(result.outputImageUrl);
      const blob = await response.blob();
      const filename = `zine_${result.zineVolume.replace(/\s+/g, '_')}_${Date.now()}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      // Mobile native Share sheet (iOS Safari & Android Chrome can save directly to Photos)
      if (
        navigator.canShare &&
        navigator.canShare({ files: [file] }) &&
        /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
      ) {
        await navigator.share({
          files: [file],
          title: result.title || 'AI P图 · 艺术作品',
          text: '保存至手机相册',
        });
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
        return;
      }

      // Desktop direct download
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      const a = document.createElement('a');
      a.href = result.outputImageUrl;
      a.download = `zine_${Date.now()}.png`;
      a.target = '_blank';
      a.click();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const res = await fetch(result.outputImageUrl);
        const blob = await res.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
    } catch {}

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(result.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTriggerRegenerate = async () => {
    if (!editedPrompt.trim()) return;
    await onRegenerateWithPrompt(editedPrompt.trim());
    setIsEditingPrompt(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto h-full flex flex-col justify-between py-1">
      {/* Top Bar with Title and Quick Switch */}
      <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-stone-850">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[11px] font-semibold border border-amber-500/30">
            {result.zineVolume}
          </span>
          <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-[200px] sm:max-w-md">
            <DecryptedText text={result.title} speed={25} />
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {originalImage && (
            <button
              type="button"
              onMouseDown={() => setShowOriginal(true)}
              onMouseUp={() => setShowOriginal(false)}
              onTouchStart={() => setShowOriginal(true)}
              onTouchEnd={() => setShowOriginal(false)}
              className="px-2.5 py-1 rounded-xl text-xs font-medium bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-700 flex items-center gap-1.5 transition-colors select-none"
              title="长按切换原图"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
              <span>按住看原图</span>
            </button>
          )}

          <button
            type="button"
            onClick={onResetToUpload}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-medium bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 flex items-center gap-1 transition-colors"
            title="制作新照片"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">新照片</span>
          </button>
        </div>
      </div>

      {/* Main Center Image Stage */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative my-auto p-1">
        <div className="relative max-h-full max-w-full rounded-2xl overflow-hidden bg-stone-950 border border-stone-800 shadow-2xl flex items-center justify-center">
          <img
            id="step-final-image"
            src={showOriginal && originalImage ? originalImage : result.outputImageUrl}
            alt={result.title}
            className="max-h-[46vh] sm:max-h-[52vh] w-auto max-w-full object-contain rounded-xl shadow-lg transition-opacity duration-150 select-none"
            referrerPolicy="no-referrer"
          />

          {/* Label indicator */}
          <div className="absolute bottom-3 left-3 bg-stone-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono text-stone-300 border border-stone-800 flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>
              {showOriginal
                ? '原始照片'
                : `${getPresetDisplayName(result.stylePreset)} · ${result.modelName || 'gpt-image-2'}`}
            </span>
          </div>

          {result.durationSeconds && (
            <div className="absolute bottom-3 right-3 bg-stone-950/80 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-mono text-stone-400 border border-stone-800 shadow-sm">
              耗时 {result.durationSeconds}s
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons & Prompt Toggle (Bottom Section) */}
      <div className="pt-2 flex flex-col gap-2">
        {/* Mobile long press hint */}
        <div className="sm:hidden text-center text-[10px] text-stone-400 flex items-center justify-center gap-1">
          <Smartphone className="w-3 h-3 text-amber-400" />
          <span>手机端也可直接长按图片选择「存储图像」</span>
        </div>

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          {/* Main Save to Album */}
          <button
            id="btn-step-save-album"
            type="button"
            onClick={handleSaveToAlbum}
            className="sm:col-span-2 py-3 px-4 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-stone-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>已保存到相册 / 已触发下载</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>保存到相册 / 高清下载</span>
              </>
            )}
          </button>

          {/* Copy Image / Text */}
          <button
            type="button"
            onClick={handleCopy}
            className="py-3 px-3 rounded-xl font-medium text-xs bg-stone-850 hover:bg-stone-800 text-stone-200 border border-stone-750 flex items-center justify-center gap-1.5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>已复制剪贴板</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-400" />
                <span>复制图片/提示词</span>
              </>
            )}
          </button>

          {/* Toggle Prompt Tuning */}
          <button
            type="button"
            onClick={() => {
              if (!isEditingPrompt) setEditedPrompt(result.prompt);
              setIsEditingPrompt(!isEditingPrompt);
            }}
            className="py-3 px-3 rounded-xl font-medium text-xs bg-stone-850 hover:bg-stone-800 text-amber-400 border border-stone-750 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isEditingPrompt ? '收起微调' : '微调重绘'}</span>
          </button>
        </div>

        {/* Prompt Editing Drawer */}
        {isEditingPrompt && (
          <div className="bg-stone-900 border border-stone-800 p-3 rounded-xl flex flex-col gap-2 animate-fade-in">
            <div className="flex items-center justify-between text-[11px] text-stone-400">
              <span>微调 gpt-image-2 提示词：</span>
              <span className="font-mono text-amber-400">{getPresetDisplayName(result.stylePreset)}</span>
            </div>
            <textarea
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              rows={2}
              className="w-full bg-stone-950 border border-stone-750 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 font-mono"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingPrompt(false)}
                className="px-3 py-1 text-xs text-stone-400 hover:text-stone-200"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleTriggerRegenerate}
                disabled={isRegenerating || !editedPrompt.trim()}
                className="px-3.5 py-1 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                {isRegenerating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                <span>重新生成</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
