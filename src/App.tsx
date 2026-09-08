import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ZenHeader } from './components/zen/ZenHeader';
import { ZenUploadScreen } from './components/zen/ZenUploadScreen';
import { ZenStyleScreen } from './components/zen/ZenStyleScreen';
import { ZenGenerateScreen } from './components/zen/ZenGenerateScreen';
import { ToastProvider, useToast } from './components/ui/Toast';
import { RemixResult, RemixStageInfo } from './types';
import { STYLE_PRESETS } from './data/presets';
import { clientLogger } from './utils/clientLogger';
import { compressImage } from './utils/imageCompressor';
import { AlertCircle } from 'lucide-react';

function AppContent() {
  const toast = useToast();

  // Exact 3 Screens: 1 = Upload, 2 = Select Style, 3 = Generate & Download
  const [currentScreen, setCurrentScreen] = useState<1 | 2 | 3>(1);
  const [direction, setDirection] = useState<number>(1);

  // States
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('scenes-gathered-zine-v1-3');

  // Generation state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentStage, setCurrentStage] = useState<RemixStageInfo | null>(null);
  const [currentResult, setCurrentResult] = useState<RemixResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentTraceId, setCurrentTraceId] = useState<string | undefined>();

  // 进度条平滑缓动计时器引用
  const progressAnimationRef = useRef<number | null>(null);

  const goToScreen = (screen: 1 | 2 | 3) => {
    setDirection(screen > currentScreen ? 1 : -1);
    setCurrentScreen(screen);
  };

  const handleReset = () => {
    clientLogger.info('UserAction', '用户重置操作流程');
    setCurrentImage(null);
    setCurrentResult(null);
    setIsProcessing(false);
    setProgressPercent(0);
    setCurrentStage(null);
    setErrorMessage(null);
    goToScreen(1);
  };

  // Screen 1 -> Screen 2
  const handleNextFromUpload = () => {
    if (!currentImage) {
      setErrorMessage('请先选取一张照片');
      toast.error('请先选取照片', '点击虚线区域或拖拽图片即可');
      return;
    }
    setErrorMessage(null);
    clientLogger.info('Navigation', '照片已选定，进入风格选择');
    goToScreen(2);
  };

  // 风格切换处理
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = STYLE_PRESETS.find((p) => p.id === presetId);
    clientLogger.info('UserAction', `选定风格预设: ${preset?.name || presetId}`);
  };

  // 真实阶段流式生成执行
  const handleStartGenerate = async () => {
    if (!currentImage) {
      goToScreen(1);
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);
    setProgressPercent(8);
    const initialTraceId = `tr-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
    setCurrentTraceId(initialTraceId);
    setCurrentStage({
      stage: 'analyzing',
      step: 1,
      totalSteps: 4,
      title: '图片解析中',
      detail: '正在建立连接并上传照片特征...',
      progress: 8,
      traceId: initialTraceId,
    });

    clientLogger.info('Remix', '开始全流程海报淬炼', { preset: selectedPresetId, traceId: initialTraceId });
    goToScreen(3);

    // 辅助：平滑逼近目标百分比（在收到后端真实阶段更新前，在当前阶段区间内微缓动）
    let targetProgress = 15;
    if (progressAnimationRef.current) clearInterval(progressAnimationRef.current);
    progressAnimationRef.current = window.setInterval(() => {
      setProgressPercent((prev) => {
        if (prev < targetProgress) {
          return prev + Math.max(0.4, (targetProgress - prev) * 0.15);
        }
        return prev;
      });
    }, 150);

    try {
      let uploadImage = currentImage;
      if (uploadImage && uploadImage.length > 2_000_000) {
        clientLogger.info('Compression', '检测到较大数据体，执行二次兜底压缩', {
          rawLength: uploadImage.length,
        });
        try {
          const compressed = await compressImage(uploadImage, { maxDimension: 1920, quality: 0.85 });
          uploadImage = compressed.dataUrl;
        } catch (e) {
          clientLogger.warn('Compression', '二次压缩失败，继续使用当前图', e);
        }
      }

      clientLogger.info('Network', '尝试发起 SSE 流式请求 /api/remix-stream', {
        payloadKb: Math.round((uploadImage?.length || 0) / 1024),
      });
      const response = await fetch('/api/remix-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          image: uploadImage,
          stylePreset: selectedPresetId,
          aspectRatio: '3:4',
          traceId: initialTraceId,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`流式接口响应异常 (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let receivedResult: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          const trimmed = block.trim();
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.replace(/^data:\s*/, '');
          try {
            const ev = JSON.parse(jsonStr);
            if (ev.type === 'stage') {
              clientLogger.info('StreamStage', `[${ev.step}/4] ${ev.title}: ${ev.detail}`, { progress: ev.progress });
              setCurrentStage(ev);
              targetProgress = ev.progress || targetProgress;
            } else if (ev.type === 'complete') {
              receivedResult = ev.result;
              targetProgress = 100;
              setProgressPercent(100);
            } else if (ev.type === 'error') {
              throw new Error(ev.error || '后端流式处理报错');
            }
          } catch (e: any) {
            if (e?.message && e.message.includes('报错')) throw e;
          }
        }
      }

      if (!receivedResult) {
        throw new Error('未收到完整的成图结果数据');
      }

      if (progressAnimationRef.current) clearInterval(progressAnimationRef.current);
      setProgressPercent(100);

      const newResult: RemixResult = {
        id: `zine-${Date.now()}`,
        timestamp: Date.now(),
        originalImage: currentImage,
        title: receivedResult.title || '无题 · 艺术画报',
        zineVolume: receivedResult.zineVolume || 'VOL.01',
        summary: receivedResult.summary,
        analysis: receivedResult.analysis,
        tags: receivedResult.tags,
        prompt: receivedResult.prompt,
        outputImageUrl: receivedResult.outputImageUrl,
        provider: receivedResult.provider,
        modelName: receivedResult.modelName,
        durationSeconds: receivedResult.durationSeconds,
        stylePreset: selectedPresetId,
        aspectRatio: '3:4',
        traceId: initialTraceId,
      };

      setCurrentResult(newResult);
      clientLogger.info('Success', '海报生成全部完成', { title: newResult.title, duration: newResult.durationSeconds });
    } catch (err: any) {
      clientLogger.error('RemixFailed', `生成流程异常: ${err?.message}`, err);
      if (progressAnimationRef.current) clearInterval(progressAnimationRef.current);

      const errorMsg = err?.message || '生成中遇到问题，请稍后重试';
      setErrorMessage(errorMsg);
      toast.error('海报生成受阻', errorMsg);
      goToScreen(2);
    } finally {
      if (progressAnimationRef.current) clearInterval(progressAnimationRef.current);
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
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-stone-400 hover:text-stone-700 text-[11px] cursor-pointer"
                >
                  忽略
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Single-Screen Content Area (Exact 3 Screens) */}
      <main className="flex-1 min-h-0 min-w-0 w-full relative px-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:px-6 pt-2 sm:pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6 flex flex-col items-center overflow-y-auto overflow-x-hidden no-scrollbar">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          {currentScreen === 1 && (
            <motion.div
              key="screen-1"
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full min-w-0 flex-1 min-h-0 flex flex-col justify-center"
            >
              <ZenUploadScreen
                currentImage={currentImage}
                onImageSelected={(img) => {
                  setCurrentImage(img);
                  setErrorMessage(null);
                  clientLogger.info('UserAction', '用户成功载入照片');
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
              className="w-full min-w-0 flex-1 min-h-0 flex flex-col justify-center"
            >
              <ZenStyleScreen
                currentImage={currentImage}
                selectedPresetId={selectedPresetId}
                onSelectPreset={handleSelectPreset}
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
              className="w-full min-w-0 flex-1 min-h-0 flex flex-col"
            >
              <ZenGenerateScreen
                isProcessing={isProcessing}
                currentStage={currentStage}
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

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
