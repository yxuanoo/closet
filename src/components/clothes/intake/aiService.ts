/**
 * aiService.ts
 * 保留类型定义和辅助函数，实际 AI 识别逻辑迁移到 clothingPipeline.ts
 */

export interface ClothingInfo {
  name: string;
  category: string;
  color: string;
  season: string;
  location: string;
  confidence: number;
  vibeMessage?: string;
}

export const recognitionMessages = [
  'AI 正在识别衣物类别...',
  '看看它属于哪一类～',
  '正在整理衣柜档案...',
  '马上就好 ??',
  '帮你分析这件衣服的特征...',
  '识别中，请稍等一下哦～',
  '这件衣服真好看！',
  '正在分析颜色和材质...',
  'AI 模型正在工作中...',
  '快完成了，再等一下 ?',
];

export function getRandomMessage(): string {
  return recognitionMessages[Math.floor(Math.random() * recognitionMessages.length)];
}

