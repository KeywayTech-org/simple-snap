import React, { useState } from 'react';
import { BookOpen, Film, Sparkles, Camera, Layers, Wand2, ArrowLeft, Sliders, ChevronDown, ChevronUp } from 'lucide-react';
import { STYLE_PRESETS } from '../../data/presets';
import { StylePreset } from '../../types';
import { ShinyText } from '../reactbits/ShinyText';
import { SpotlightCard } from '../reactbits/SpotlightCard';

interface StepStyleProps {
  currentImage: string | null;
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  aspectRatio: string;
  onChangeAspectRatio: (ratio: string) => void;
  customNote: string;
  onChangeCustomNote: (note: string) => void;
  onPrevStep: () => void;
  onStartRemix: () => void;
}

const getPresetIcon = (iconName: string) => {
  switch (iconName) {
    case 'BookOpen':
      return <BookOpen className="w-4 h-4" />;
    case 'Film':
      return <Film className="w-4 h-4" />;
    case 'Camera':
      return <Camera className="w-4 h-4" />;
    case 'Layers':
      return <Layers className="w-4 h-4" />;
    default:
      return <Sparkles className="w-4 h-4" />;
  }
};

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 正方', desc: '杂志封面' },
  { id: '3:4', label: '3:4 竖幅', desc: '经典相纸' },
  { id: '4:3', label: '4:3 横幅', desc: '艺术画册' },
  { id: '9:16', label: '9:16 全屏', desc: '手机故事' },
  { id: '16:9', label: '16:9 电影', desc: '宽幕胶片' },
];

export const StepStyle: React.FC<StepStyleProps> = ({
  currentImage,
  selectedPresetId,
  onSelectPreset,
  aspectRatio,
  onChangeAspectRatio,
  customNote,
  onChangeCustomNote,
  onPrevStep,
  onStartRemix,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="w-full max-w-2xl mx-auto h-full flex flex-col justify-between py-1">
      {/* Header Info & Image Thumbnail */}
      <div className="flex items-center justify-between gap-3 mb-2 sm:mb-3 pb-2 border-b border-stone-850">
        <div>
          <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 mb-1">
            <Sparkles className="w-3 h-3" /> 步骤 02 · 艺术工坊设定
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            <ShinyText text="选择 scenes-gathered-zine-v1-3 风格" speed={3} />
          </h2>
          <p className="text-xs text-stone-400">
            大模型将依据选定艺术调性与原片构图，调度 gpt-image-2
          </p>
        </div>

        {currentImage && (
          <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-stone-750 shrink-0 shadow-md">
            <img
              src={currentImage}
              alt="原图微缩"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-0 inset-x-0 bg-stone-950/80 text-[8px] font-mono text-center text-stone-300">
              已选原片
            </span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col gap-3 justify-center overflow-y-auto no-scrollbar py-1">
        {/* Presets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {STYLE_PRESETS.map((preset: StylePreset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                id={`step-preset-${preset.id}`}
                type="button"
                onClick={() => onSelectPreset(preset.id)}
                className={`text-left p-2.5 sm:p-3 rounded-xl border transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 shadow-sm'
                    : 'border-stone-800 bg-stone-900/60 hover:bg-stone-850 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSelected
                          ? 'bg-amber-500 text-stone-950 font-bold'
                          : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      {getPresetIcon(preset.iconName)}
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-amber-300' : 'text-stone-200'
                      }`}
                    >
                      {preset.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono px-1.5 py-0.5 rounded bg-stone-800/80 border border-stone-750">
                    {preset.tag}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Aspect Ratio Row */}
        <div>
          <label className="text-[11px] font-mono text-stone-300 block mb-1.5 uppercase tracking-wider">
            画幅比例 (Aspect Ratio)
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {ASPECT_RATIOS.map((item) => {
              const isSelected = aspectRatio === item.id;
              return (
                <button
                  key={item.id}
                  id={`step-ratio-${item.id.replace(':', '-')}`}
                  type="button"
                  onClick={() => onChangeAspectRatio(item.id)}
                  className={`py-1.5 px-1 text-center rounded-xl border transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500 text-stone-950 font-semibold shadow-sm'
                      : 'border-stone-800 bg-stone-900/60 text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  <div className="text-xs font-bold">{item.id}</div>
                  <div
                    className={`text-[9px] ${
                      isSelected ? 'text-stone-950 font-medium' : 'text-stone-500'
                    }`}
                  >
                    {item.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Fine-tuning Note */}
        <div className="border-t border-stone-850 pt-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between text-xs text-stone-400 hover:text-stone-300 py-1"
          >
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              自定义艺术微调补充 (可选)
            </span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAdvanced && (
            <input
              type="text"
              value={customNote}
              onChange={(e) => onChangeCustomNote(e.target.value)}
              placeholder="例如：保留主角眼神、强化日落黄金余晖、增加纸本颗粒感..."
              className="mt-1.5 w-full bg-stone-950/80 border border-stone-750 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          )}
        </div>
      </div>

      {/* Bottom Step Actions */}
      <div className="pt-3 border-t border-stone-850 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrevStep}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-700 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回原片</span>
        </button>

        <button
          id="btn-trigger-remix"
          type="button"
          onClick={onStartRemix}
          className="flex-1 sm:flex-initial px-6 py-3 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all"
        >
          <Wand2 className="w-4 h-4" />
          <span>开始 AI 制作 · 渲染新杂志大片</span>
        </button>
      </div>
    </div>
  );
};
