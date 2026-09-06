import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Upload, ArrowRight, RefreshCw } from 'lucide-react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件 (JPG, PNG, WebP 等)');
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

  return (
    <div className="w-full max-w-md min-w-0 mx-auto flex flex-col items-center justify-center min-h-[380px] p-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
        className="hidden"
      />

      {currentImage ? (
        /* Image Preview State */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full bg-white p-4 border border-stone-300 shadow-sm flex flex-col items-center gap-4"
        >
          <div className="w-full aspect-[4/3] max-h-[45vh] overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center">
            <img
              src={currentImage}
              alt="Uploaded"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="w-full flex items-center justify-between gap-3 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 border border-stone-300 hover:border-stone-500 text-stone-700 font-serif text-xs tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>重新选择</span>
            </button>

            <button
              id="btn-zen-upload-next"
              type="button"
              onClick={onNext}
              className="px-6 py-2 bg-stone-900 hover:bg-stone-800 text-stone-100 font-serif text-xs sm:text-sm tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>下一步</span>
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
