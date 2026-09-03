import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Camera, RefreshCw, X, ArrowRight, Sparkles } from 'lucide-react';
import { SpotlightCard } from '../reactbits/SpotlightCard';
import { TiltedCard } from '../reactbits/TiltedCard';
import { ShinyText } from '../reactbits/ShinyText';
import { SAMPLE_IMAGES } from '../../data/presets';
import { SampleImage } from '../../types';

interface StepUploadProps {
  currentImage: string | null;
  onImageSelected: (base64Data: string) => void;
  onClearImage: () => void;
  onNextStep: () => void;
}

export const StepUpload: React.FC<StepUploadProps> = ({
  currentImage,
  onImageSelected,
  onClearImage,
  onNextStep,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isConvertingSample, setIsConvertingSample] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请上传有效的图片格式 (JPG, PNG, WebP 等)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        onImageSelected(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleSelectSample = async (sample: SampleImage) => {
    try {
      setIsConvertingSample(true);
      const res = await fetch(sample.url, { mode: 'cors' });
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onImageSelected(reader.result);
        }
        setIsConvertingSample(false);
      };
      reader.readAsDataURL(blob);
    } catch {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 800;
        canvas.height = img.naturalHeight || 600;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          onImageSelected(canvas.toDataURL('image/jpeg', 0.85));
        }
        setIsConvertingSample(false);
      };
      img.onerror = () => {
        alert('无法加载示例图，请从本地选取');
        setIsConvertingSample(false);
      };
      img.src = sample.url;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto h-full flex flex-col justify-between py-1">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="step-file-input"
      />

      {/* Header Info */}
      <div className="text-center mb-2 sm:mb-3">
        <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 mb-1">
          <Sparkles className="w-3 h-3" /> 步骤 01 · 上传原片
        </span>
        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
          <ShinyText text="选择需要 AI P图 的照片" speed={3} />
        </h2>
        <p className="text-xs text-stone-400 max-w-sm mx-auto mt-0.5">
          支持拍摄日常、人像、街景或静物，交给 scenes-gathered-zine-v1-3 艺术再造
        </p>
      </div>

      {/* Main Center Area */}
      <div className="flex-1 min-h-0 flex items-center justify-center my-auto">
        {currentImage ? (
          /* Image Ready Preview with TiltedCard */
          <div className="w-full max-w-md">
            <TiltedCard maxAngle={6} scaleOnHover={1.01}>
              <div className="relative rounded-2xl overflow-hidden bg-stone-900 border border-stone-800 shadow-2xl aspect-[4/3] sm:aspect-[16/10] flex items-center justify-center">
                <img
                  src={currentImage}
                  alt="原图预览"
                  className="w-full h-full object-contain bg-stone-950/70"
                  referrerPolicy="no-referrer"
                />

                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-stone-950/80 hover:bg-stone-900 text-stone-200 border border-stone-700/80 backdrop-blur-md flex items-center gap-1.5 shadow-md transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    <span>更换</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClearImage}
                    className="p-1.5 rounded-xl bg-stone-950/80 hover:bg-red-500/20 text-stone-400 hover:text-red-400 border border-stone-700/80 backdrop-blur-md shadow-md transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="absolute bottom-3 left-3 bg-stone-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-mono text-stone-300 border border-stone-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>照片准备完毕</span>
                </div>
              </div>
            </TiltedCard>
          </div>
        ) : (
          /* Dropzone with SpotlightCard */
          <div className="w-full max-w-md">
            <SpotlightCard
              spotlightColor="rgba(245, 158, 11, 0.12)"
              className="border-dashed border-stone-750 hover:border-amber-500/60 transition-colors"
            >
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer text-center ${
                  isDragging ? 'bg-amber-500/5' : ''
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-stone-800/90 border border-stone-700/80 flex items-center justify-center text-amber-400 mb-3 shadow-inner group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-7 h-7" />
                </div>

                <h3 className="text-stone-200 font-semibold text-sm sm:text-base mb-1">
                  拖拽照片至此处，或点击浏览相册
                </h3>
                <p className="text-stone-400 text-xs mb-4">
                  支持 JPG, PNG, WebP 等常见格式
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>选择照片</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 transition-colors flex items-center gap-1.5"
                  >
                    <Camera className="w-4 h-4 text-stone-400" />
                    <span>手机拍照</span>
                  </button>
                </div>
              </div>
            </SpotlightCard>
          </div>
        )}
      </div>

      {/* Quick sample chips (bottom section) */}
      <div className="mt-2 pt-2 border-t border-stone-850">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] sm:text-[11px] font-mono text-stone-400 uppercase tracking-wider">
            或者直接体验精选样片
          </span>
          {isConvertingSample && (
            <span className="text-[11px] text-amber-400 animate-pulse">正在载入...</span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {SAMPLE_IMAGES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => handleSelectSample(sample)}
              disabled={isConvertingSample}
              className="group relative rounded-xl overflow-hidden aspect-[4/3] border border-stone-800 hover:border-amber-500/60 transition-all text-left"
            >
              <img
                src={sample.url}
                alt={sample.label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-transparent flex flex-col justify-end p-1.5">
                <span className="text-[10px] font-medium text-white truncate drop-shadow-sm">
                  {sample.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Step Action */}
      <div className="pt-3 flex justify-end">
        <button
          id="btn-upload-next"
          type="button"
          disabled={!currentImage}
          onClick={onNextStep}
          className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
            currentImage
              ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20 active:scale-[0.99]'
              : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-750'
          }`}
        >
          <span>下一步：定制艺术杂志风格</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
