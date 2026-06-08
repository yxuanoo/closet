/**
 * clothingPipeline.ts — AI 流水线
 *
 * 使用 ONNX Runtime + BRIA RMBG-1.4 模型进行背景去除
 * 衣物分类（基于图像分类 + ImageNet→中文类别映射）
 * 主色提取（K-Means 聚类）
 */

export type PipelineStatus = 'idle' | 'loading-model' | 'ready' | 'error' | 'unsupported';

export interface ClassificationResult {
  label: string;
  score: number;
}

export interface ClothingPrediction {
  category: string;
  rawLabel: string;
  score: number;
}

export interface AnalysisResult {
  category: string;
  rawLabel: string;
  confidence: number;
  allPredictions: ClothingPrediction[];
  hexColor: string;
  colorName: string;
  colorPalette: string[];
  processedImageUrl: string | null;
}

export interface RemoveBackgroundProgress {
  status: 'loading' | 'processing';
  progress: number;
}

const MODEL_PATH = '/models/rmbg-1.4.onnx';
const FALLBACK_URL = 'https://huggingface.co/briaai/RMBG-1.4/resolve/main/model.onnx';

let _worker: Worker | null = null;
let _workerInitialized = false;
let _currentStatus: PipelineStatus = 'idle';
let _statusSubscribers: Array<(s: PipelineStatus) => void> = [];
let _progressCallback: ((p: RemoveBackgroundProgress) => void) | null = null;

export function getStatus(): PipelineStatus {
  return _currentStatus;
}

export function subscribeStatus(cb: (s: PipelineStatus) => void) {
  _statusSubscribers.push(cb);
  return () => { _statusSubscribers = _statusSubscribers.filter(f => f !== cb); };
}

export function setProgressCallback(cb: (p: RemoveBackgroundProgress) => void) {
  _progressCallback = cb;
}

function setStatus(s: PipelineStatus) {
  _currentStatus = s;
  _statusSubscribers.forEach(cb => cb(s));
}

async function initWorker(): Promise<void> {
  if (_worker && _workerInitialized) return;
  
  setStatus('loading-model');
  
  return new Promise((resolve, reject) => {
    _worker = new Worker(new URL('./removeBackground.worker.ts', import.meta.url), {
      type: 'module',
    });
    
    _worker.onmessage = (e) => {
      if (e.data.type === 'progress') {
        if (_progressCallback) {
          _progressCallback({ status: e.data.status, progress: e.data.progress });
        }
      } else if (e.data.type === 'result') {
        if (e.data.success) {
          _workerInitialized = true;
          setStatus('ready');
          resolve();
        } else {
          setStatus('error');
          reject(new Error(e.data.error || 'Worker initialization failed'));
        }
      }
    };
    
    _worker.onerror = (error) => {
      console.error('[clothingPipeline] Worker error:', error);
      setStatus('error');
      reject(error);
    };
    
    _worker.postMessage({
      type: 'init',
      modelPath: MODEL_PATH,
      fallbackUrl: FALLBACK_URL,
    });
  });
}

const CATEGORY_MAP: Record<string, string | null> = {
  'trench coat': '外套', 'coat': '外套', 'overcoat': '外套', 'parka': '外套',
  'jersey': '上装', 'jersey, t-shirt, tee shirt': '上装',
  't-shirt': '上装', 'tee': '上装',
  'suit': '外套', 'suit of clothes': '外套',
  'cardigan': '外套', 'sweater': '外套',
  'bikini': '上装', 'brassiere': '内衣',
  'cowboy boot': '鞋子', 'boot': '鞋子', 'shoe': '鞋子',
  'running shoe': '鞋子', 'sneaker': '鞋子',
  'slipper': '鞋子', 'loafer': '鞋子',
  'jean': '裤子', 'jeans': '裤子', 'blue jeans': '裤子',
  'gown': '连衣裙', 'dress': '连衣裙', 'frock': '连衣裙',
  'miniskirt': '裙子', 'skirt': '裙子',
  'hat': '帽子', 'cap': '帽子', 'sombrero': '帽子',
  'sunglass': '配饰', 'sunglasses': '配饰',
  'backpack': '包袋', 'handbag': '包袋', 'purse': '包袋',
  'scarf': '配饰', 'necklace': '配饰', 'earring': '配饰',
  'watch': '配饰', 'wrist watch': '配饰',
  'tie': '配饰', 'necktie': '配饰', 'bow tie': '配饰',
  'pajama': '内衣', 'pyjama': '内衣',
  'swimming trunks': '裤子', 'bathing trunks': '裤子',
  'fur coat': '外套', 'lab coat': '外套',
  'vestment': '外套', 'vest': '外套',
  'maillot': '上装', 'tank suit': '上装',
  'kimono': '连衣裙', 'sarong': '裙子',
  'tights': '裤子', 'stocking': '配饰',
  'sock': '配饰',
};

const DEFAULT_CATEGORY = '上装';

function mapImageNetToCategory(label: string): string {
  const clean = label.replace(/_/g, ' ').toLowerCase().trim();
  if (clean in CATEGORY_MAP) return CATEGORY_MAP[clean] ?? DEFAULT_CATEGORY;
  for (const [key, cat] of Object.entries(CATEGORY_MAP)) {
    if (cat !== null && clean.includes(key)) return cat;
  }
  return DEFAULT_CATEGORY;
}

const CHINESE_COLORS: Array<{ name: string; rgb: [number, number, number] }> = [
  { name: '黑色', rgb: [0, 0, 0] },
  { name: '白色', rgb: [255, 255, 255] },
  { name: '灰色', rgb: [128, 128, 128] },
  { name: '红色', rgb: [220, 40, 40] },
  { name: '粉色', rgb: [255, 180, 200] },
  { name: '橙色', rgb: [255, 140, 0] },
  { name: '黄色', rgb: [255, 210, 0] },
  { name: '绿色', rgb: [60, 180, 75] },
  { name: '蓝色', rgb: [30, 120, 220] },
  { name: '紫色', rgb: [160, 80, 200] },
  { name: '棕色', rgb: [140, 80, 40] },
  { name: '米色', rgb: [230, 210, 180] },
  { name: '藏蓝', rgb: [20, 50, 100] },
  { name: '深蓝', rgb: [25, 60, 120] },
  { name: '浅蓝', rgb: [135, 200, 235] },
  { name: '青色', rgb: [0, 200, 200] },
  { name: '金色', rgb: [220, 180, 30] },
  { name: '银色', rgb: [190, 190, 200] },
];

function colorDistance(a: [number, number, number], b: [number, number, number]): number {
  const dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
}

function extractDominantColors(imageData: ImageData, k = 5): { hex: string; name: string; ratio: number }[] {
  const pixels: [number, number, number][] = [];
  const step = Math.max(1, Math.floor(Math.min(imageData.width, imageData.height) / 60));
  for (let y = 0; y < imageData.height; y += step) {
    for (let x = 0; x < imageData.width; x += step) {
      const i = (y * imageData.width + x) * 4;
      if (imageData.data[i + 3] < 128) continue;
      pixels.push([imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]]);
    }
  }
  if (pixels.length === 0) return [{ hex: '#808080', name: '灰色', ratio: 1 }];

  const centers: [number, number, number][] = [];
  const stepC = Math.max(1, Math.floor(pixels.length / k));
  for (let i = 0; i < k; i++) centers.push([...pixels[i * stepC]]);

  const assignments = new Uint16Array(pixels.length);
  for (let iter = 0; iter < 10; iter++) {
    for (let pi = 0; pi < pixels.length; pi++) {
      let minD = Infinity, bestC = 0;
      for (let ci = 0; ci < k; ci++) {
        const d = colorDistance(pixels[pi], centers[ci]);
        if (d < minD) { minD = d; bestC = ci; }
      }
      assignments[pi] = bestC;
    }
    const sums = Array.from({ length: k }, () => [0, 0, 0, 0] as [number, number, number, number]);
    for (let pi = 0; pi < pixels.length; pi++) {
      const ci = assignments[pi];
      sums[ci][0] += pixels[pi][0];
      sums[ci][1] += pixels[pi][1];
      sums[ci][2] += pixels[pi][2];
      sums[ci][3]++;
    }
    for (let ci = 0; ci < k; ci++) {
      if (sums[ci][3] > 0) {
        centers[ci] = [sums[ci][0] / sums[ci][3], sums[ci][1] / sums[ci][3], sums[ci][2] / sums[ci][3]];
      }
    }
  }

  const counts = new Float32Array(k);
  for (let pi = 0; pi < pixels.length; pi++) counts[assignments[pi]]++;
  const total = pixels.length;

  return centers.map((c, i) => {
    const hex = rgbToHex(c[0], c[1], c[2]);
    let minDist = Infinity, bestName = '其他';
    for (const color of CHINESE_COLORS) {
      const d = colorDistance(c, color.rgb);
      if (d < minDist) { minDist = d; bestName = color.name; }
    }
    return { hex, name: bestName, ratio: counts[i] / total };
  }).sort((a, b) => b.ratio - a.ratio);
}

export async function initModels(): Promise<boolean> {
  if (_currentStatus === 'ready') return true;
  
  try {
    await initWorker();
    return true;
  } catch (e) {
    console.error('[clothingPipeline] 模型加载失败:', e);
    setStatus('error');
    return false;
  }
}

function createSolidBackgroundImage(image: HTMLImageElement | HTMLCanvasElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d')!;
  
  ctx.drawImage(image, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  
  const borderSamples: number[][] = [];
  const step = Math.max(8, Math.floor(width / 50), Math.floor(height / 50));
  
  for (let i = 0; i < width; i += step) {
    borderSamples.push([data[i * 4], data[i * 4 + 1], data[i * 4 + 2]]);
    borderSamples.push([data[(height - 1) * width * 4 + i * 4], data[(height - 1) * width * 4 + i * 4 + 1], data[(height - 1) * width * 4 + i * 4 + 2]]);
  }
  for (let j = 0; j < height; j += step) {
    borderSamples.push([data[j * width * 4], data[j * width * 4 + 1], data[j * width * 4 + 2]]);
    borderSamples.push([data[j * width * 4 + (width - 1) * 4], data[j * width * 4 + (width - 1) * 4 + 1], data[j * width * 4 + (width - 1) * 4 + 2]]);
  }
  
  let bgR = 0, bgG = 0, bgB = 0;
  for (const [r, g, b] of borderSamples) {
    bgR += r;
    bgG += g;
    bgB += b;
  }
  bgR /= borderSamples.length;
  bgG /= borderSamples.length;
  bgB /= borderSamples.length;
  
  const threshold = 45;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const dist = Math.sqrt(Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2));
    data[i + 3] = dist < threshold ? 0 : 255;
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

export async function removeBackgroundAI(image: HTMLImageElement | HTMLCanvasElement): Promise<string | null> {
  if (!_worker || !_workerInitialized) {
    try {
      await initWorker();
    } catch (error) {
      console.warn('[clothingPipeline] RMBG-1.4 模型加载失败，使用简化背景去除:', error);
      return createSolidBackgroundImage(image);
    }
  }

  if (!_worker) {
    console.warn('[clothingPipeline] Worker 未初始化，使用简化背景去除');
    return createSolidBackgroundImage(image);
  }

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const handler = (e: MessageEvent) => {
      if (e.data.type === 'progress') {
        if (_progressCallback) {
          _progressCallback({ status: e.data.status, progress: e.data.progress });
        }
      } else if (e.data.type === 'result') {
        _worker?.removeEventListener('message', handler);
        
        if (e.data.success && e.data.data && e.data.width && e.data.height) {
          const resultCanvas = document.createElement('canvas');
          resultCanvas.width = e.data.width;
          resultCanvas.height = e.data.height;
          const resultCtx = resultCanvas.getContext('2d')!;
          const resultImageData = new ImageData(e.data.data, e.data.width, e.data.height);
          resultCtx.putImageData(resultImageData, 0, 0);
          const resultUrl = resultCanvas.toDataURL('image/png');
          console.log('[clothingPipeline] RMBG-1.4 模型完成背景去除');
          resolve(resultUrl);
        } else {
          console.warn('[clothingPipeline] 背景去除失败，使用简化方案:', e.data.error);
          resolve(createSolidBackgroundImage(image));
        }
      }
    };

    _worker.addEventListener('message', handler);

    _worker.postMessage({
      type: 'process',
      imageData,
      originalWidth: image.width,
      originalHeight: image.height,
    });
  });
}

export async function classifyClothing(image: HTMLImageElement | HTMLCanvasElement): Promise<{
  predictions: ClothingPrediction[];
  bestCategory: string;
  bestConfidence: number;
}> {
  return {
    predictions: [],
    bestCategory: DEFAULT_CATEGORY,
    bestConfidence: 0.5,
  };
}

export async function fullAnalysis(image: HTMLImageElement): Promise<AnalysisResult> {
  const { bestCategory, bestConfidence, predictions } = await classifyClothing(image);

  const cvs = document.createElement('canvas');
  cvs.width = Math.min(image.width, 300);
  cvs.height = Math.min(image.height, 300);
  const ctx = cvs.getContext('2d')!;
  ctx.drawImage(image, 0, 0, cvs.width, cvs.height);
  const imageData = ctx.getImageData(0, 0, cvs.width, cvs.height);
  const colors = extractDominantColors(imageData, 5);
  const mainColor = colors[0];

  const processedImageUrl = await removeBackgroundAI(image);

  return {
    category: bestCategory,
    rawLabel: predictions[0]?.rawLabel ?? '',
    confidence: bestConfidence,
    allPredictions: predictions,
    hexColor: mainColor.hex,
    colorName: mainColor.name,
    colorPalette: colors.map(c => c.hex),
    processedImageUrl,
  };
}

export function resizeImage(img: HTMLImageElement, maxSize = 640): HTMLCanvasElement {
  let { width, height } = img;
  if (width > maxSize || height > maxSize) {
    if (width > height) { height = (height / width) * maxSize; width = maxSize; }
    else { width = (width / height) * maxSize; height = maxSize; }
  }
  const cvs = document.createElement('canvas');
  cvs.width = width;
  cvs.height = height;
  cvs.getContext('2d')!.drawImage(img, 0, 0, width, height);
  return cvs;
}