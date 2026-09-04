import React from 'react';
import { X, Sparkles, Wand2, Image as ImageIcon, Download, Layers } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm">
      <div
        className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              工作流与技术解析
            </h3>
            <p className="text-xs text-stone-400">
              AI P图 · 风格 Skill 工坊
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 text-xs text-stone-300 leading-relaxed">
          <div className="bg-stone-950/60 p-3.5 rounded-xl border border-stone-800">
            <h4 className="font-semibold text-stone-200 mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              什么是风格 Skill？
            </h4>
            <p className="text-stone-400">
              每个风格对应一套专为摄影再创作设计的艺术工坊提示词能力（skill），如「拾景纸刊」「诗性纸刊」。解读模型会深入分析输入照片的主体、空间布局、对比度与情绪基底，再按所选风格的规则将其注入独立艺术纸刊的独特视觉美学。
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <h4 className="font-semibold text-stone-200">标准创作流水线</h4>

            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-stone-950/40 border border-stone-850">
              <div className="w-6 h-6 rounded-md bg-stone-800 flex items-center justify-center text-amber-400 font-bold shrink-0 text-[11px]">
                1
              </div>
              <div>
                <p className="font-medium text-stone-200">用户上传照片</p>
                <p className="text-stone-400 text-[11px]">
                  支持本地选取、拍照或即时试玩内置人像、街景与静物样本。
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-stone-950/40 border border-stone-850">
              <div className="w-6 h-6 rounded-md bg-stone-800 flex items-center justify-center text-amber-400 font-bold shrink-0 text-[11px]">
                2
              </div>
              <div>
                <p className="font-medium text-stone-200">大模型读取与 Skill 提示词编排</p>
                <p className="text-stone-400 text-[11px]">
                  视觉大模型深度识别画面主体特征，调用所选风格的 skill 规则编撰专属的高精英语生成指令。
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-stone-950/40 border border-stone-850">
              <div className="w-6 h-6 rounded-md bg-stone-800 flex items-center justify-center text-amber-400 font-bold shrink-0 text-[11px]">
                3
              </div>
              <div>
                <p className="font-medium text-stone-200">gpt-image-2 渲染出图</p>
                <p className="text-stone-400 text-[11px]">
                  交由 gpt-image-2 高保真生成最终杂志风创意图片，并支持多画幅长宽比。
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-stone-950/40 border border-stone-850">
              <div className="w-6 h-6 rounded-md bg-stone-800 flex items-center justify-center text-amber-400 font-bold shrink-0 text-[11px]">
                4
              </div>
              <div>
                <p className="font-medium text-stone-200">一键保存至手机相册</p>
                <p className="text-stone-400 text-[11px]">
                  支持原生 Web Share 保存到 iOS / Android 系统相册，同时提供直接高清无损 PNG 下载与剪贴板复制。
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-colors"
          >
            了解并开始使用
          </button>
        </div>
      </div>
    </div>
  );
};
