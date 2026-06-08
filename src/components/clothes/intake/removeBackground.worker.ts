import * as ort from 'onnxruntime-web';

interface ProcessMessage {
  type: 'process';
  imageData: ImageData;
  originalWidth: number;
  originalHeight: number;
}

interface InitMessage {
  type: 'init';
  modelPath: string;
  fallbackUrl: string;
}

interface ProgressMessage {
  type: 'progress';
  status: 'loading' | 'processing';
  progress: number;
}

interface ResultMessage {
  type: 'result';
  success: boolean;
  data?: Uint8ClampedArray;
  width?: number;
  height?: number;
  error?: string;
}

let session: ort.InferenceSession | null = null;
const MODEL_INPUT_SIZE_LARGE = 1024;
const MODEL_INPUT_SIZE_SMALL = 512;

async function loadModel(modelPath: string, fallbackUrl: string): Promise<ArrayBuffer> {
  for (const url of [modelPath, fallbackUrl]) {
    try {
      console.log(`[removeBackground.worker] Trying to load model from: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        console.warn(`[removeBackground.worker] Model fetch failed: ${url}, status: ${response.status}`);
        continue;
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.warn(`[removeBackground.worker] Model URL returned HTML (likely 404): ${url}`);
        continue;
      }
      
      const buffer = await response.arrayBuffer();
      console.log(`[removeBackground.worker] Successfully loaded model: ${buffer.byteLength} bytes`);
      return buffer;
    } catch (error) {
      console.warn(`[removeBackground.worker] Model fetch error: ${url}`, error);
    }
  }
  throw new Error('无法加载 RMBG-1.4 模型文件');
}

async function initSession(modelPath: string, fallbackUrl: string): Promise<void> {
  if (session) return;
  
  console.log('[removeBackground.worker] 正在初始化 RMBG-1.4 ONNX Runtime 会话');
  
  const modelData = await loadModel(modelPath, fallbackUrl);
  
  try {
    const options: ort.InferenceSession.SessionOptions = {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
      logSeverityLevel: 0,
    };
    
    session = await ort.InferenceSession.create(modelData, options);
    console.log('[removeBackground.worker] RMBG-1.4 ONNX Runtime 会话创建成功');
  } catch (error) {
    console.error('[removeBackground.worker] RMBG-1.4 ONNX Runtime 会话创建失败:', error);
    throw error;
  }
}

function preprocess(imageData: ImageData, inputSize: number): Float32Array {
  const tempCanvas = new OffscreenCanvas(imageData.width, imageData.height);
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.putImageData(imageData, 0, 0);
  
  const canvas = new OffscreenCanvas(inputSize, inputSize);
  const ctx = canvas.getContext('2d')!;
  
  ctx.drawImage(tempCanvas, 0, 0, inputSize, inputSize);
  
  const resizedData = ctx.getImageData(0, 0, inputSize, inputSize);
  const data = resizedData.data;
  
  const floatData = new Float32Array(3 * inputSize * inputSize);
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255.0;
    const g = data[i + 1] / 255.0;
    const b = data[i + 2] / 255.0;
    
    const idx = (i / 4);
    floatData[idx] = r;
    floatData[idx + inputSize * inputSize] = g;
    floatData[idx + 2 * inputSize * inputSize] = b;
  }
  
  return floatData;
}

async function processImage(imageData: ImageData, originalWidth: number, originalHeight: number): Promise<ImageData> {
  if (!session) {
    throw new Error('Session not initialized');
  }
  
  postMessage({ type: 'progress', status: 'processing', progress: 0 });
  
  let inputSize = MODEL_INPUT_SIZE_LARGE;
  
  try {
    const memoryLimit = navigator?.hardwareConcurrency ? 512 : 256;
    const imageMemory = (imageData.width * imageData.height * 4 * 4) / 1024 / 1024;
    
    if (imageMemory > memoryLimit) {
      console.warn('[removeBackground.worker] 图像内存超过限制，使用小尺寸输入');
      inputSize = MODEL_INPUT_SIZE_SMALL;
    }
  } catch (e) {
    inputSize = MODEL_INPUT_SIZE_LARGE;
  }
  
  const inputTensor = preprocess(imageData, inputSize);
  
  postMessage({ type: 'progress', status: 'processing', progress: 20 });
  
  const feeds: Record<string, ort.Tensor> = {
    'input': new ort.Tensor('float32', inputTensor, [1, 3, inputSize, inputSize]),
  };
  
  postMessage({ type: 'progress', status: 'processing', progress: 30 });
  
  const results = await session.run(feeds);
  
  postMessage({ type: 'progress', status: 'processing', progress: 70 });
  
  const outputTensor = results['output'] as ort.Tensor;
  const maskData = outputTensor.data as Float32Array;
  
  let processedMaskData = maskData;
  if (outputTensor.dims.length === 4 && outputTensor.dims[0] === 1 && outputTensor.dims[1] === 1) {
    processedMaskData = maskData.slice(0, inputSize * inputSize);
  }
  
  const maskCanvas = new OffscreenCanvas(inputSize, inputSize);
  const maskCtx = maskCanvas.getContext('2d')!;
  const maskImageData = maskCtx.createImageData(inputSize, inputSize);
  
  for (let i = 0; i < processedMaskData.length; i++) {
    const value = Math.round(processedMaskData[i] * 255);
    const idx = i * 4;
    maskImageData.data[idx] = value;
    maskImageData.data[idx + 1] = value;
    maskImageData.data[idx + 2] = value;
    maskImageData.data[idx + 3] = value;
  }
  
  maskCtx.putImageData(maskImageData, 0, 0);
  
  const outputCanvas = new OffscreenCanvas(originalWidth, originalHeight);
  const outputCtx = outputCanvas.getContext('2d')!;
  
  outputCtx.drawImage(maskCanvas, 0, 0, originalWidth, originalHeight);
  const resizedMask = outputCtx.getImageData(0, 0, originalWidth, originalHeight);
  
  const finalImageData = new ImageData(originalWidth, originalHeight);
  
  for (let i = 0; i < imageData.data.length; i += 4) {
    finalImageData.data[i] = imageData.data[i];
    finalImageData.data[i + 1] = imageData.data[i + 1];
    finalImageData.data[i + 2] = imageData.data[i + 2];
    finalImageData.data[i + 3] = resizedMask.data[i + 3];
  }
  
  postMessage({ type: 'progress', status: 'processing', progress: 100 });
  
  return finalImageData;
}

self.onmessage = async (e: MessageEvent<InitMessage | ProcessMessage>) => {
  try {
    if (e.data.type === 'init') {
      await initSession(e.data.modelPath, e.data.fallbackUrl);
      postMessage({ type: 'result', success: true });
    } else if (e.data.type === 'process') {
      const result = await processImage(e.data.imageData, e.data.originalWidth, e.data.originalHeight);
      postMessage({
        type: 'result',
        success: true,
        data: result.data,
        width: result.width,
        height: result.height,
      });
    }
  } catch (error) {
    console.error('[removeBackground.worker] Error:', error);
    postMessage({
      type: 'result',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};