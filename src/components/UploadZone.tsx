import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, RefreshCw, X, Camera } from 'lucide-react';
import { SAMPLE_IMAGES } from '../data/presets';
import { SampleImage } from '../types';

interface UploadZoneProps {
  currentImage: string | null;
  onImageSelected: (base64Data: string) => void;
  onClearImage: () => void;
  isLoading: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  currentImage,
  onImageSelected,
  onClearImage,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isConvertingSample, setIsConvertingSample] = useState(false);

  // Convert File to base64 Data URL
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请上传有效的图片文件 (JPG, PNG, WebP 等)');
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
    if (file) {
      processFile(file);
    }
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
    if (file) {
      processFile(file);
    }
  };

  // Convert external sample image URL to base64 data URL
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
    } catch (err) {
      console.error('Failed to load sample image:', err);
      // Fallback: draw to hidden canvas
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
        alert('无法加载示例图片，请从本地上传');
        setIsConvertingSample(false);
      };
      img.src = sample.url;
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="file-upload-input"
      />

      {currentImage ? (
        /* Image Preview Box */
        <div className="relative group w-full rounded-2xl overflow-hidden bg-stone-900 border border-stone-800 shadow-lg aspect-square sm:aspect-[4/3] flex items-center justify-center">
          <img
            src={currentImage}
            alt="待处理原图"
            className="w-full h-full object-contain bg-stone-950/60"
            referrerPolicy="no-referrer"
          />

          {/* Floating actions */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              id="btn-replace-photo"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-900/80 hover:bg-stone-900 text-stone-200 border border-stone-700/80 backdrop-blur-md shadow-md flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>更换照片</span>
            </button>

            <button
              id="btn-remove-photo"
              onClick={onClearImage}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-stone-900/80 hover:bg-red-500/20 text-stone-300 hover:text-red-400 border border-stone-700/80 backdrop-blur-md shadow-md transition-all"
              title="清除原图"
              aria-label="清除原图"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="absolute bottom-3 left-3 bg-stone-950/75 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-mono text-stone-300 border border-stone-800 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>原片已就绪</span>
          </div>
        </div>
      ) : (
        /* Dropzone Box */
        <div
          id="dropzone-area"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full rounded-2xl border-2 border-dashed p-6 sm:p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 text-center ${
            isDragging
              ? 'border-amber-500 bg-amber-500/5 scale-[0.99]'
              : 'border-stone-800 hover:border-stone-750 bg-stone-900/40 hover:bg-stone-900/70'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-stone-800/80 border border-stone-700 flex items-center justify-center text-amber-400 mb-4 shadow-sm group-hover:scale-105 transition-transform">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h3 className="text-stone-200 font-medium text-base mb-1">
            上传需要 P 图的照片
          </h3>
          <p className="text-stone-400 text-xs sm:text-sm max-w-sm mb-4">
            支持拖拽照片到此处，或点击浏览相册 / 拍摄照片
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-choose-file"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors flex items-center gap-2 shadow-sm font-semibold"
            >
              <ImageIcon className="w-4 h-4" />
              <span>选择照片</span>
            </button>

            <button
              type="button"
              id="btn-take-photo"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-700 transition-colors flex items-center gap-1.5"
            >
              <Camera className="w-4 h-4 text-stone-400" />
              <span>拍照 / 相册</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick demo presets to test immediately */}
      {!currentImage && (
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-stone-400 tracking-wider uppercase">
              或者快速试玩示例照片
            </span>
            {isConvertingSample && (
              <span className="text-[11px] text-amber-400 animate-pulse">正在加载示例...</span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SAMPLE_IMAGES.map((sample) => (
              <button
                key={sample.id}
                id={`btn-sample-${sample.id}`}
                onClick={() => handleSelectSample(sample)}
                disabled={isConvertingSample || isLoading}
                className="group relative rounded-xl overflow-hidden aspect-[4/3] border border-stone-800 hover:border-amber-500/60 transition-all text-left"
              >
                <img
                  src={sample.url}
                  alt={sample.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-transparent flex flex-col justify-end p-2">
                  <span className="text-[11px] font-medium text-white truncate drop-shadow-sm">
                    {sample.label}
                  </span>
                  <span className="text-[9px] text-stone-400">{sample.category}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
