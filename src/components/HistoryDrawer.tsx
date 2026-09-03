import React from 'react';
import { X, Download, Trash2, Camera } from 'lucide-react';
import { RemixResult } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: RemixResult[];
  onSelectResult: (result: RemixResult) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectResult,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md h-full bg-stone-900 border-l border-stone-800 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">历史作品集 ({history.length})</h3>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                id="btn-clear-history"
                type="button"
                onClick={onClearHistory}
                className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 hover:bg-stone-800 transition-colors"
                title="清空作品"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              id="btn-close-history"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-stone-500 py-12">
              <Camera className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs">暂无历史作品</p>
              <p className="text-[11px] text-stone-600 mt-1">
                上传照片并生成后，作品将保存在此处
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectResult(item);
                  onClose();
                }}
                className="group cursor-pointer rounded-xl bg-stone-950/60 border border-stone-800 hover:border-amber-500/50 p-2.5 flex items-center gap-3 transition-all"
              >
                <img
                  src={item.outputImageUrl}
                  alt={item.title}
                  className="w-16 h-16 rounded-lg object-cover bg-stone-900 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {item.zineVolume}
                    </span>
                    <h4 className="text-xs font-medium text-stone-200 truncate">
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-stone-400 truncate">
                    {item.summary}
                  </p>
                  <span className="text-[10px] text-stone-500 font-mono mt-1 block">
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })} · {item.modelName || 'gpt-image-2'}
                  </span>
                </div>
                <a
                  href={item.outputImageUrl}
                  download={`zine_${item.id}.png`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-amber-400 border border-stone-800 transition-colors"
                  title="下载图片"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
