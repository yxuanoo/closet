import { useState, useCallback, useEffect } from 'react';
import { 
  fullAnalysis, 
  resizeImage, 
  getStatus, 
  subscribeStatus, 
  removeBackgroundAI,
  type PipelineStatus 
} from '../components/clothes/intake/clothingPipeline';
import { 
  recognizeClothing, 
  hasRemoteRecognitionService,
  getRecognitionServiceType,
  type RecognitionResult 
} from '../components/clothes/intake/imageRecognitionService';

export function useSmartIntake() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>(getStatus());

  useEffect(() => {
    const unsub = subscribeStatus(setPipelineStatus);
    return unsub;
  }, []);

  const analyzeImageWithRemote = useCallback(async (file: File): Promise<RecognitionResult & { processedImageUrl: string | null }> => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = reject;
      image.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = Math.min(image.width, 800);
    canvas.height = Math.min(image.height, 800);
    canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/png');

    const [recognition, processedUrl] = await Promise.all([
      recognizeClothing(base64),
      removeBackgroundAI(image),
    ]);

    URL.revokeObjectURL(url);
    return { ...recognition, processedImageUrl: processedUrl };
  }, []);

  const analyzeImageWithLocal = useCallback(async (file: File): Promise<{
    color: string;
    category: string;
    rawLabel: string;
    suggestedTemp: [number, number];
    vibeMessage?: string;
    confidence: number;
    labels: Array<{ label: string; score: number; category: string }>;
    processedImageUrl: string | null;
  }> => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = reject;
      image.src = url;
    });

    const result = await fullAnalysis(image);

    const tempMap: Record<string, [number, number]> = {
      '上装': [15, 28], '外套': [0, 15], '裤子': [10, 30],
      '裙子': [20, 35], '连衣裙': [20, 35], '鞋子': [10, 30],
      '帽子': [0, 35], '包袋': [0, 35], '配饰': [0, 35], '内衣': [15, 28], '套装': [10, 30],
    };
    const suggestedTemp = tempMap[result.category] ?? [15, 28];

    const month = new Date().getMonth() + 1;
    let vibeMessage: string | undefined;
    if (month >= 6 && month <= 8 && ['外套', '毛衣', '大衣', '羽绒服', '长靴'].some(c => result.category.includes(c))) {
      vibeMessage = '这件现在穿可能有点热哦??';
    } else if ((month <= 2 || month >= 12) && ['连衣裙', '短裙', '短裤', '凉鞋', '拖鞋'].some(c => result.category.includes(c))) {
      vibeMessage = '这件现在穿可能有点冷哦??';
    }

    URL.revokeObjectURL(url);
    return {
      color: result.hexColor,
      category: result.category,
      rawLabel: result.rawLabel,
      suggestedTemp,
      vibeMessage,
      confidence: result.confidence,
      labels: result.allPredictions.map(p => ({
        label: p.rawLabel,
        score: p.score,
        category: p.category,
      })),
      processedImageUrl: result.processedImageUrl,
    };
  }, []);

  const analyzeImage = useCallback(async (file: File): Promise<{
    color: string;
    category: string;
    rawLabel: string;
    suggestedTemp: [number, number];
    vibeMessage?: string;
    confidence: number;
    labels: Array<{ label: string; score: number; category: string }>;
    processedImageUrl: string | null;
  }> => {
    setIsAnalyzing(true);

    try {
      const useRemote = hasRemoteRecognitionService();
      console.log(`[useSmartIntake] 使用 ${useRemote ? getRecognitionServiceType() : 'local'} 服务进行识别`);

      if (useRemote) {
        try {
          const result = await analyzeImageWithRemote(file);
          
          const tempMap: Record<string, [number, number]> = {
            '上装': [15, 28], '外套': [0, 15], '裤子': [10, 30],
            '裙子': [20, 35], '连衣裙': [20, 35], '鞋子': [10, 30],
            '帽子': [0, 35], '包袋': [0, 35], '配饰': [0, 35], '内衣': [15, 28], '套装': [10, 30],
          };
          const suggestedTemp = tempMap[result.category] ?? [15, 28];

          const month = new Date().getMonth() + 1;
          let vibeMessage: string | undefined;
          if (month >= 6 && month <= 8 && ['外套', '毛衣', '大衣', '羽绒服', '长靴'].some(c => result.category.includes(c))) {
            vibeMessage = '这件现在穿可能有点热哦??';
          } else if ((month <= 2 || month >= 12) && ['连衣裙', '短裙', '短裤', '凉鞋', '拖鞋'].some(c => result.category.includes(c))) {
            vibeMessage = '这件现在穿可能有点冷哦??';
          }

          const colorMap: Record<string, string> = {
            '黑色': '#000000', '白色': '#ffffff', '灰色': '#808080', '红色': '#ff6b6b',
            '粉色': '#ffc0cb', '橙色': '#ffa500', '黄色': '#ffd700', '绿色': '#90ee90',
            '蓝色': '#87ceeb', '紫色': '#dda0dd', '棕色': '#d2691e', '米色': '#f5deb3',
            '藏蓝': '#191970', '深蓝': '#00008b', '浅蓝': '#add8e6', '青色': '#00ffff',
            '金色': '#ffaa00', '银色': '#c0c0c0', '其他': '#808080',
          };

          const tempToCategoryMap: Record<string, string> = {
            '夏季': '夏季', '春秋': '春秋', '冬季': '冬季', '四季': '四季',
          };
          
          return {
            color: colorMap[result.color] || '#808080',
            category: result.category,
            rawLabel: result.description,
            suggestedTemp,
            temperature: tempToCategoryMap[result.temperature] || '春秋',
            vibeMessage,
            confidence: result.confidence,
            labels: result.labels,
            processedImageUrl: result.processedImageUrl,
          };
        } catch (remoteError) {
          console.warn('[useSmartIntake] 远程服务调用失败，回退到本地模型:', remoteError);
        }
      }

      return analyzeImageWithLocal(file);
    } catch (error) {
      console.error('[useSmartIntake] AI分析失败:', error);
      return {
        color: '#808080', category: '上装', rawLabel: '',
        suggestedTemp: [15, 28], confidence: 0.2, labels: [],
        processedImageUrl: null,
      };
    } finally {
      setIsAnalyzing(false);
    }
  }, [analyzeImageWithRemote, analyzeImageWithLocal]);

  return { analyzeImage, isAnalyzing, pipelineStatus };
}