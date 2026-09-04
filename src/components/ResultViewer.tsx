import React, { useState } from 'react';
import {
  Download,
  Share2,
  Copy,
  Eye,
  Sparkles,
  RefreshCw,
  Sliders,
  Check,
  Smartphone,
  CheckCircle2,
  Loader2,
  ArrowLeftRight,
} from 'lucide-react';
import { RemixResult } from '../types';
import { getPresetDisplayName } from '../data/presets';

interface ResultViewerProps {
  result: RemixResult | null;
  isLoading: boolean;
  originalImage: string | null;
  currentStep: number; // 1: vision reading, 2: prompt synth, 3: image gen
  onRegenerateWithPrompt: (newPrompt: string) => Promise<void>;
  isRegenerating: boolean;
}

export const ResultViewer: React.FC<ResultViewerProps> = ({
  result,
  isLoading,
  originalImage,
  currentStep,
  onRegenerateWithPrompt,
  isRegenerating,
}) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const [compareMode, setCompareMode] = useState<'toggle' | 'split'>('toggle');
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState('');

  // Handle Save to Album (Mobile Photo Library & Desktop Download)
  const handleSaveToAlbum = async () => {
    if (!result?.outputImageUrl) return;

    try {
      // 1. Convert base64 / URL to Blob
      const response = await fetch(result.outputImageUrl);
      const blob = await response.blob();
      const filename = `zine_remix_${Date.now()}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      // 2. Try native mobile share sheet (iOS/Android "Save to Photos")
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

      // 3. Direct browser download for desktop / fallback
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
    } catch (err) {
      console.warn('Share/Download fallback:', err);
      // Last-resort fallback
      const a = document.createElement('a');
      a.href = result.outputImageUrl;
      a.download = `zine_remix_${Date.now()}.png`;
      a.target = '_blank';
      a.click();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  // Copy Image or Prompt to Clipboard
  const handleCopy = async () => {
    if (!result) return;
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
    } catch {
      // Fallback copy text prompt
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(result.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle re-generation with refined prompt
  const handleTriggerRegenerate = async () => {
    if (!editedPrompt.trim()) return;
    await onRegenerateWithPrompt(editedPrompt.trim());
    setIsEditingPrompt(false);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Loading State with Progress Steps */}
      {isLoading && (
        <div className="w-full rounded-2xl bg-stone-900/90 border border-stone-800 p-6 sm:p-10 flex flex-col items-center justify-center text-center shadow-xl">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin flex items-center justify-center"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
          </div>

          <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
            AI 正在进行杂志风 P 图制作
          </h3>
          <p className="text-xs text-stone-400 max-w-sm mb-6">
            融合原图构图与所选风格的艺术语言，交由 gpt-image-2 渲染
          </p>

          {/* Workflow Steps Indicator */}
          <div className="w-full max-w-md flex flex-col gap-2.5 text-left text-xs bg-stone-950/70 p-4 rounded-xl border border-stone-800/80">
            <div
              className={`flex items-center gap-3 transition-colors ${
                currentStep >= 1 ? 'text-amber-300' : 'text-stone-500'
              }`}
            >
              {currentStep > 1 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
              )}
              <span>1. 大模型视觉感知：提取原图主体、构图与光影关系</span>
            </div>

            <div
              className={`flex items-center gap-3 transition-colors ${
                currentStep >= 2
                  ? 'text-amber-300'
                  : currentStep === 2
                  ? 'text-amber-400'
                  : 'text-stone-500'
              }`}
            >
              {currentStep > 2 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : currentStep === 2 ? (
                <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-stone-700 shrink-0"></div>
              )}
              <span>2. 调度所选风格 Skill：编排新海报提示词</span>
            </div>

            <div
              className={`flex items-center gap-3 transition-colors ${
                currentStep >= 3 ? 'text-amber-300' : 'text-stone-500'
              }`}
            >
              {currentStep === 3 ? (
                <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-stone-700 shrink-0"></div>
              )}
              <span>3. gpt-image-2 深度出图：渲染 35mm 质感大片</span>
            </div>
          </div>
        </div>
      )}

      {/* Generated Result Display */}
      {!isLoading && result && (
        <div className="flex flex-col gap-4">
          {/* Main Visual Stage */}
          <div className="relative w-full rounded-2xl overflow-hidden bg-stone-950 border border-stone-800 shadow-2xl flex flex-col">
            {/* Top Bar with Zine Info & View Controls */}
            <div className="px-4 py-3 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[11px] font-semibold border border-amber-500/30">
                  {result.zineVolume || 'Vol. 13'}
                </span>
                <span className="text-xs sm:text-sm font-medium text-stone-200 truncate max-w-[180px] sm:max-w-xs">
                  {result.title}
                </span>
              </div>

              {/* Compare Original Button */}
              {originalImage && (
                <div className="flex items-center gap-1.5">
                  <button
                    id="btn-compare-toggle"
                    type="button"
                    onMouseDown={() => setShowOriginal(true)}
                    onMouseUp={() => setShowOriginal(false)}
                    onTouchStart={() => setShowOriginal(true)}
                    onTouchEnd={() => setShowOriginal(false)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 flex items-center gap-1.5 transition-colors select-none"
                    title="按住查看原图"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-stone-400" />
                    <span>按住看原图</span>
                  </button>
                </div>
              )}
            </div>

            {/* Image Canvas */}
            <div className="relative w-full min-h-[340px] sm:min-h-[460px] bg-stone-950 flex items-center justify-center p-2 sm:p-4">
              <img
                id="generated-remix-image"
                src={showOriginal && originalImage ? originalImage : result.outputImageUrl}
                alt={result.title}
                className="max-h-[580px] w-auto max-w-full object-contain rounded-lg shadow-lg transition-opacity duration-150 select-none"
                referrerPolicy="no-referrer"
              />

              {/* Indicator overlay */}
              <div className="absolute bottom-4 left-4 bg-stone-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-mono text-stone-300 border border-stone-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>
                  {showOriginal
                    ? '原始照片'
                    : `${getPresetDisplayName(result.stylePreset)} (${result.modelName || 'gpt-image-2'})`}
                </span>
              </div>

              {/* Duration badge */}
              {result.durationSeconds && (
                <div className="absolute bottom-4 right-4 bg-stone-950/80 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-mono text-stone-400 border border-stone-800">
                  耗时 {result.durationSeconds}s
                </div>
              )}
            </div>

            {/* Mobile save hint banner */}
            <div className="sm:hidden px-3 py-1.5 bg-stone-900/60 border-t border-stone-850 flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>提示：在手机端也可直接长按图片选择「存储图像」</span>
            </div>
          </div>

          {/* Primary Action Buttons: Save to Album & Share */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Main Save to Album Button */}
            <button
              id="btn-save-to-album"
              type="button"
              onClick={handleSaveToAlbum}
              className="sm:col-span-2 py-3 px-4 rounded-xl font-semibold text-sm bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-stone-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>已保存到相册 / 已触发下载</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>保存到相册 / 下载高清大图</span>
                </>
              )}
            </button>

            {/* Copy / Share Button */}
            <button
              id="btn-copy-image"
              type="button"
              onClick={handleCopy}
              className="py-3 px-4 rounded-xl font-medium text-xs sm:text-sm bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 flex items-center justify-center gap-2 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>已复制到剪贴板</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-stone-400" />
                  <span>复制图片 / 提示词</span>
                </>
              )}
            </button>
          </div>

          {/* Style Creative Analysis Card */}
          <div className="bg-stone-900/70 border border-stone-800/90 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-stone-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs sm:text-sm font-semibold text-stone-200">
                  {getPresetDisplayName(result.stylePreset)} 艺术解析
                </h4>
              </div>
              <span className="text-[11px] text-stone-400 font-mono">
                {result.provider}
              </span>
            </div>

            {/* Summary */}
            <p className="text-xs text-stone-300 leading-relaxed">
              {result.summary}
            </p>

            {/* Visual Analysis Grid */}
            {result.analysis && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-stone-950/60 p-3 rounded-xl border border-stone-850">
                <div>
                  <span className="text-[10px] text-stone-500 uppercase block mb-0.5">主体要素</span>
                  <span className="text-stone-300 text-xs line-clamp-1">{result.analysis.subject || '自然人像/街景'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 uppercase block mb-0.5">光影氛围</span>
                  <span className="text-stone-300 text-xs line-clamp-1">{result.analysis.lighting || '胶片柔光'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 uppercase block mb-0.5">情绪调性</span>
                  <span className="text-stone-300 text-xs line-clamp-1">{result.analysis.mood || '纪实诗意'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 uppercase block mb-0.5">艺术色系</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    {Array.isArray(result.analysis.palette) &&
                      result.analysis.palette.slice(0, 3).map((color, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.2 rounded text-[10px] bg-stone-800 text-stone-300 font-mono border border-stone-700"
                        >
                          {color}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Style tags */}
            {result.tags && result.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {result.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700/60"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Collapsible Prompt Inspector & Refinement */}
            <div className="border-t border-stone-800/80 pt-3 mt-1 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-stone-400">
                  生成提示词 (Prompt sent to {result.modelName || 'gpt-image-2'})
                </span>
                <button
                  type="button"
                  id="btn-edit-prompt-toggle"
                  onClick={() => {
                    if (!isEditingPrompt) {
                      setEditedPrompt(result.prompt);
                    }
                    setIsEditingPrompt(!isEditingPrompt);
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{isEditingPrompt ? '取消微调' : '微调提示词重绘'}</span>
                </button>
              </div>

              {isEditingPrompt ? (
                <div className="flex flex-col gap-2 bg-stone-950 p-3 rounded-xl border border-stone-800">
                  <textarea
                    id="textarea-edit-prompt"
                    value={editedPrompt}
                    onChange={(e) => setEditedPrompt(e.target.value)}
                    rows={4}
                    className="w-full bg-stone-900 border border-stone-750 rounded-lg p-2.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500 font-mono leading-relaxed"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingPrompt(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-stone-400 hover:text-stone-200"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      id="btn-confirm-regenerate"
                      onClick={handleTriggerRegenerate}
                      disabled={isRegenerating || !editedPrompt.trim()}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {isRegenerating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      <span>重新渲染出图</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs font-mono text-stone-400 bg-stone-950/70 p-3 rounded-xl border border-stone-850 leading-relaxed break-words">
                  {result.prompt}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty Placeholder if no result and not loading */}
      {!isLoading && !result && (
        <div className="w-full rounded-2xl border border-stone-800/80 bg-stone-900/40 p-8 sm:p-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-stone-850 border border-stone-750 flex items-center justify-center text-stone-500 mb-3">
            <Eye className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-medium text-stone-300 mb-1">
            等待开始制作
          </h4>
          <p className="text-xs text-stone-500 max-w-xs">
            在左侧上传照片并选择艺术风格预设，点击「开始 AI P图」即可生成
          </p>
        </div>
      )}
    </div>
  );
};
