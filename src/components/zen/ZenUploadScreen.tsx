import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Upload, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import { compressImage } from '../../utils/imageCompressor';
import { useToast } from '../ui/Toast';

interface ZenUploadScreenProps {
  currentImage: string | null;
  onImageSelected: (base64: string) => void;
  onNext: () => void;
}

export const ZenUploadScreen: React.FC<ZenUploadScreenProps> = ({
  currentImage,
  onImageSelected,
  onNext,
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('文件格式不符', '请上传图片文件 (JPG, PNG, WebP 等)');
      return;
    }

    try {
      setIsCompressing(true);
      // 客户端 Canvas 自动缩放与压缩（长边 ≤ 1920，JPEG 质量 0.85）
      const result = await compressImage(file, { maxDimension: 1920, quality: 0.85 });
      onImageSelected(result.dataUrl);
    } catch (err) {
      console.warn('图片优化降级至原始读取:', err);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          onImageSelected(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div className="w-full max-w-md min-w-0 mx-auto flex flex-col items-center justify-center min-h-[380px] p-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
        className="hidden"
      />

      {isCompressing ? (
        /* Image Compressing / Optimizing State */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full aspect-[4/3] max-h-[40vh] min-h-[220px] bg-white border border-stone-300 p-8 flex flex-col items-center justify-center text-center shadow-sm"
        >
          <div className="w-12 h-12 rounded-full border border-stone-200 flex items-center justify-center text-stone-700 mb-3 bg-stone-50">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <p className="font-serif text-sm text-stone-900 tracking-wider">
            优化图像中...
          </p>
        </motion.div>
      ) : currentImage ? (
        /* Image Preview State */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full bg-white p-4 border border-stone-300 shadow-sm flex flex-col items-center gap-4"
        >
          <div className="w-full aspect-[4/3] max-h-[42vh] overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center p-1">
            <img
              src={currentImage}
              alt="Uploaded"
              className="w-full h-full object-contain select-none"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="w-full flex items-center justify-between gap-3 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[44px] px-4 py-2.5 border border-stone-300 hover:border-stone-500 active:bg-stone-50 text-stone-700 font-serif text-xs tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>重新选择</span>
            </button>

            <button
              id="btn-zen-upload-next"
              type="button"
              onClick={onNext}
              className="min-h-[44px] px-6 sm:px-8 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-100 font-serif text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm cursor-pointer"
            >
              <span>下一步 · 择格</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      ) : (
        /* Clean Single Upload Entrance */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full aspect-[4/3] max-h-[40vh] min-h-[220px] bg-white border-2 border-dashed ${
            isDragging ? 'border-stone-900 bg-stone-50' : 'border-stone-300 hover:border-stone-600'
          } transition-all cursor-pointer p-8 flex flex-col items-center justify-center text-center select-none shadow-xs group`}
        >
          <div className="w-14 h-14 rounded-full border border-stone-300 flex items-center justify-center text-stone-600 mb-4 group-hover:scale-105 transition-transform bg-stone-50">
            <Upload className="w-6 h-6" />
          </div>

          <p className="font-serif text-base sm:text-lg text-stone-900 tracking-wider mb-1 font-normal">
            点击或拖拽上传图片
          </p>
          <p className="font-serif text-xs text-stone-500 tracking-wider">
            支持 JPG、PNG、WebP 照片
          </p>
        </motion.div>
      )}
    </div>
  );
};
