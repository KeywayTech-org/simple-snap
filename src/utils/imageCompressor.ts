/**
 * 客户端纯前端 Canvas 图片等比缩放与预压缩工具
 * 将数十兆手机原图压缩至长边 ≤ 1920px、JPEG 质量 0.85 的轻量高清图像 (约 200KB~400KB)
 * 彻底避免超大 Base64 上传导致跨国长连接超时或中断 (request aborted)
 */

export interface CompressOptions {
  maxDimension?: number; // 最大长边，默认 1920
  quality?: number; // JPEG 压缩质量 0-1，默认 0.85
}

export interface CompressResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

export async function compressImage(
  fileOrDataUrl: File | string,
  options: CompressOptions = {}
): Promise<CompressResult> {
  const { maxDimension = 1920, quality = 0.85 } = options;

  let originalSize = 0;
  let sourceUrl = '';
  let shouldRevoke = false;

  if (typeof fileOrDataUrl === 'string') {
    originalSize = Math.round((fileOrDataUrl.length * 3) / 4);
    sourceUrl = fileOrDataUrl;
  } else {
    originalSize = fileOrDataUrl.size;
    sourceUrl = URL.createObjectURL(fileOrDataUrl);
    shouldRevoke = true;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        if (shouldRevoke) {
          URL.revokeObjectURL(sourceUrl);
        }

        let { width, height } = img;

        // 如果尺寸超过 maxDimension，等比例缩小
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('无法创建 Canvas 2D 绘图上下文');
        }

        // 填充白色底色，防止透明 PNG 转 JPEG 后出现黑底
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // 绘制缩放后的图像
        ctx.drawImage(img, 0, 0, width, height);

        // 导出高质量 JPEG
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const compressedSize = Math.round((dataUrl.length * 3) / 4);

        resolve({
          dataUrl,
          originalSize,
          compressedSize,
          width,
          height,
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      if (shouldRevoke) {
        URL.revokeObjectURL(sourceUrl);
      }
      reject(new Error('图片加载失败，请检查文件格式是否有效'));
    };

    img.src = sourceUrl;
  });
}
