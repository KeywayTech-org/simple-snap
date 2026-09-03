import React, { useState } from 'react';
import { Sparkles, BookOpen, Film, Camera, Layers, Sliders, Wand2, ChevronDown, ChevronUp } from 'lucide-react';
import { STYLE_PRESETS } from '../data/presets';
import { StylePreset } from '../types';

interface StyleSelectorProps {
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  aspectRatio: string;
  onChangeAspectRatio: (ratio: string) => void;
  customNote: string;
  onChangeCustomNote: (note: string) => void;
  onSubmitRemix: () => void;
  isProcessing: boolean;
  hasImage: boolean;
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
  { id: '1:1', label: '1:1 正方', desc: '杂志方图' },
  { id: '3:4', label: '3:4 竖幅', desc: '相纸画报' },
  { id: '4:3', label: '4:3 横幅', desc: '经典画册' },
  { id: '9:16', label: '9:16 全屏', desc: '手机故事' },
  { id: '16:9', label: '16:9 宽画幅', desc: '电影胶片' },
];

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  selectedPresetId,
  onSelectPreset,
  aspectRatio,
  onChangeAspectRatio,
  customNote,
  onChangeCustomNote,
  onSubmitRemix,
  isProcessing,
  hasImage,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="w-full flex flex-col gap-4 bg-stone-900/60 border border-stone-800/80 rounded-2xl p-4 sm:p-5">
      {/* Skill Banner */}
      <div className="flex items-center justify-between border-b border-stone-800/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span className="text-xs font-semibold text-stone-200 uppercase tracking-wide">
            scenes-gathered-zine-v1-3 风格预设
          </span>
        </div>
        <span className="text-[11px] text-amber-400/90 font-mono bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
          gpt-image-2 驱动
        </span>
      </div>

      {/* Preset Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {STYLE_PRESETS.map((preset: StylePreset) => {
          const isSelected = selectedPresetId === preset.id;
          return (
            <button
              key={preset.id}
              id={`preset-${preset.id}`}
              type="button"
              onClick={() => onSelectPreset(preset.id)}
              className={`text-left p-3 rounded-xl border transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'border-amber-500 bg-amber-500/10 shadow-sm'
                  : 'border-stone-800 bg-stone-900/50 hover:bg-stone-850 hover:border-stone-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
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
                    className={`text-xs sm:text-sm font-medium ${
                      isSelected ? 'text-amber-300 font-semibold' : 'text-stone-200'
                    }`}
                  >
                    {preset.name}
                  </span>
                </div>
                <span className="text-[10px] text-stone-400 font-mono px-1.5 py-0.5 rounded bg-stone-800/60 border border-stone-750">
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

      {/* Aspect Ratio Selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-stone-300">
          生成画幅比例
        </label>
        <div className="grid grid-cols-5 gap-1.5">
          {ASPECT_RATIOS.map((item) => {
            const isSelected = aspectRatio === item.id;
            return (
              <button
                key={item.id}
                id={`ratio-${item.id.replace(':', '-')}`}
                type="button"
                onClick={() => onChangeAspectRatio(item.id)}
                className={`py-2 px-1 text-center rounded-xl border transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500 text-stone-950 font-semibold shadow-sm'
                    : 'border-stone-800 bg-stone-900/50 text-stone-300 hover:bg-stone-800'
                }`}
              >
                <div className="text-xs font-medium">{item.id}</div>
                <div
                  className={`text-[9px] ${
                    isSelected ? 'text-stone-900 font-medium' : 'text-stone-500'
                  }`}
                >
                  {item.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Custom Instruction Accordion */}
      <div className="border-t border-stone-800/80 pt-2">
        <button
          id="btn-toggle-advanced"
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-xs text-stone-400 hover:text-stone-300 py-1"
        >
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            自定义艺术微调补充 (可选)
          </span>
          {showAdvanced ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {showAdvanced && (
          <div className="mt-2">
            <input
              id="custom-note-input"
              type="text"
              value={customNote}
              onChange={(e) => onChangeCustomNote(e.target.value)}
              placeholder="例如：强化日落暖金高光、增加胶片划痕与纸张肌理、微风感..."
              className="w-full bg-stone-950/80 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Main Submit Remix Action */}
      <button
        id="btn-start-remix"
        type="button"
        onClick={onSubmitRemix}
        disabled={!hasImage || isProcessing}
        className={`w-full py-3.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
          !hasImage
            ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700/40'
            : isProcessing
            ? 'bg-amber-600/80 text-amber-100 cursor-wait'
            : 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold active:scale-[0.99] shadow-amber-500/20'
        }`}
      >
        <Wand2 className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
        <span>
          {isProcessing ? '大模型与 gpt-image-2 制作中...' : '开始 AI P图 · 生成新杂志风'}
        </span>
      </button>
    </div>
  );
};
