import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ZenHeader } from './components/zen/ZenHeader';
import { ZenUploadScreen } from './components/zen/ZenUploadScreen';
import { ZenStyleScreen } from './components/zen/ZenStyleScreen';
import { ZenGenerateScreen } from './components/zen/ZenGenerateScreen';
import { RemixResult } from './types';
import { AlertCircle } from 'lucide-react';

export default function App() {
  // Exact 3 Screens: 1 = Upload, 2 = Select Style, 3 = Generate & Download
  const [currentScreen, setCurrentScreen] = useState<1 | 2 | 3>(1);
  const [direction, setDirection] = useState<number>(1);

  // States
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('scenes-gathered-zine-v1-3');

  // Generation state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentResult, setCurrentResult] = useState<RemixResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const goToScreen = (screen: 1 | 2 | 3) => {
    setDirection(screen > currentScreen ? 1 : -1);
    setCurrentScreen(screen);
  };

  const handleReset = () => {
    setCurrentImage(null);
    setCurrentResult(null);
    setIsProcessing(false);
    setProgressPercent(0);
    setErrorMessage(null);
    goToScreen(1);
  };

  // Screen 1 -> Screen 2
  const handleNextFromUpload = () => {
    if (!currentImage) {
      setErrorMessage('请先选取一张照片');
      return;
    }
    setErrorMessage(null);
    goToScreen(2);
  };

  // Screen 2 -> Screen 3 (Execute AI Generation)
  const handleStartGenerate = async () => {
    if (!currentImage) {
      goToScreen(1);
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);
    setProgressPercent(15);
    goToScreen(3);

    // Simulated graceful progress curve
    const interval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 8 + 3;
      });
    }, 400);

    try {
      const res = await fetch('/api/remix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: currentImage,
          stylePreset: selectedPresetId,
          aspectRatio: '3:4', // Classic poster editorial ratio
        }),
      });

      clearInterval(interval);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `请求异常 (${res.status})`);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || '生成失败');
      }

      setProgressPercent(100);

      const newResult: RemixResult = {
        id: `zine-${Date.now()}`,
        timestamp: Date.now(),
        originalImage: currentImage,
        title: data.title || '无题 · 艺术画报',
        zineVolume: data.zineVolume || 'VOL.01',
        summary: data.summary,
        analysis: data.analysis,
        tags: data.tags,
        prompt: data.prompt,
        outputImageUrl: data.outputImageUrl,
        provider: data.provider,
        modelName: data.modelName,
        durationSeconds: data.durationSeconds,
        stylePreset: selectedPresetId,
        aspectRatio: '3:4',
      };

      setCurrentResult(newResult);
    } catch (err: any) {
      console.error('Generate error:', err);
      clearInterval(interval);
      setErrorMessage(err?.message || '生成中遇到问题，请重试');
      goToScreen(2);
    } finally {
      setIsProcessing(false);
    }
  };

  // Screen transition animations - calm fade & slide
  const pageVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 30 : -30,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 30 : -30,
      opacity: 0,
      transition: {
        duration: 0.25,
      },
    }),
  };

  return (
    <div className="h-[100dvh] w-full max-w-full overflow-hidden canvas-paper text-stone-900 flex flex-col antialiased selection:bg-stone-900 selection:text-white relative font-serif">
      {/* Header */}
      <ZenHeader
        currentStep={currentScreen}
        onReset={handleReset}
        hasImage={!!currentImage}
      />

      {/* Error Notice */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            className="shrink-0 px-4 pt-3"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div className="max-w-md mx-auto bg-stone-100 border border-stone-300 text-stone-800 px-4 py-2 text-xs flex items-center justify-between gap-3 font-serif">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                <span className="min-w-0 break-words">{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-stone-500 hover:text-stone-800 text-[11px] underline shrink-0"
              >
                忽略
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Single-Screen Content Area (Exact 3 Screens) */}
      <main className="flex-1 min-h-0 relative px-2 sm:px-6 py-2 sm:py-4 flex flex-col items-center overflow-y-auto overflow-x-hidden no-scrollbar">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          {currentScreen === 1 && (
            <motion.div
              key="screen-1"
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full min-h-full flex flex-col justify-center my-auto"
            >
              <ZenUploadScreen
                currentImage={currentImage}
                onImageSelected={(img) => {
                  setCurrentImage(img);
                  setErrorMessage(null);
                }}
                onNext={handleNextFromUpload}
              />
            </motion.div>
          )}

          {currentScreen === 2 && (
            <motion.div
              key="screen-2"
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full min-h-full flex flex-col justify-center my-auto"
            >
              <ZenStyleScreen
                currentImage={currentImage}
                selectedPresetId={selectedPresetId}
                onSelectPreset={setSelectedPresetId}
                onPrev={() => goToScreen(1)}
                onStartRemix={handleStartGenerate}
              />
            </motion.div>
          )}

          {currentScreen === 3 && (
            <motion.div
              key="screen-3"
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full min-h-full flex flex-col justify-center my-auto"
            >
              <ZenGenerateScreen
                isProcessing={isProcessing}
                progressPercent={progressPercent}
                result={currentResult}
                onReset={handleReset}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
