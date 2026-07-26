export interface PreparedImage {
  data: string;
  mimeType: 'image/jpeg';
  width: number;
  height: number;
  originalBytes: number;
  processedBytes: number;
}

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('照片無法讀取，請改用 JPG、PNG 或 HEIC 轉出的照片'));
    };
    image.src = url;
  });

const dataUrlToBase64 = (dataUrl: string): string => {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) throw new Error('照片轉換失敗，請重新選擇');
  return dataUrl.slice(commaIndex + 1);
};

export const prepareImageForAnalysis = async (
  file: File,
  maxEdge = 2048
): Promise<PreparedImage> => {
  let source: CanvasImageSource;
  let sourceWidth: number;
  let sourceHeight: number;
  let bitmap: ImageBitmap | null = null;

  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    source = bitmap;
    sourceWidth = bitmap.width;
    sourceHeight = bitmap.height;
  } catch {
    const image = await loadImage(file);
    source = image;
    sourceWidth = image.naturalWidth;
    sourceHeight = image.naturalHeight;
  }

  const scale = Math.min(1, maxEdge / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('瀏覽器無法處理照片，請重新開啟 App');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, 0, 0, width, height);
  bitmap?.close();

  const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
  const data = dataUrlToBase64(dataUrl);
  return {
    data,
    mimeType: 'image/jpeg',
    width,
    height,
    originalBytes: file.size,
    processedBytes: Math.ceil(data.length * 0.75)
  };
};
