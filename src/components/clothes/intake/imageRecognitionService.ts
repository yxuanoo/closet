export interface RecognitionResult {
  category: string;
  color: string;
  season: string;
  confidence: number;
  description: string;
  labels: Array<{ label: string; score: number; category: string }>;
}

export type RecognitionServiceType = 'openai' | 'gemini' | 'qwen' | 'local';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_BASE_URL = import.meta.env.VITE_OPENAI_API_BASE_URL || 'https://api.openai.com/v1';
const RECOGNITION_SERVICE = import.meta.env.VITE_IMAGE_RECOGNITION_SERVICE as RecognitionServiceType || 'local';

const CLOTHING_CATEGORIES = ['上装', '外套', '裤子', '裙子', '连衣裙', '鞋子', '帽子', '包袋', '配饰', '内衣', '套装'];
const COLORS = ['黑色', '白色', '灰色', '红色', '粉色', '橙色', '黄色', '绿色', '蓝色', '紫色', '棕色', '米色', '藏蓝', '深蓝', '浅蓝', '青色', '金色', '银色'];
const SEASONS = ['春秋', '夏季', '冬季', '四季'];

function parseSeason(text: string): string {
  const lowerText = text.toLowerCase();
  const seasonMap: Record<string, string> = {
    '夏': '夏季', '夏天': '夏季', '炎热': '夏季', '短袖': '夏季', '短裤': '夏季', '凉鞋': '夏季',
    '春': '春秋', '春秋': '春秋', '适中': '春秋', '长袖': '春秋',
    '秋': '春秋', '秋天': '春秋',
    '冬': '冬季', '冬天': '冬季', '寒冷': '冬季', '羽绒服': '冬季', '毛衣': '冬季', '大衣': '冬季',
    '四季': '四季', '全年': '四季', '通用': '四季',
  };
  
  for (const [keyword, season] of Object.entries(seasonMap)) {
    if (lowerText.includes(keyword)) {
      return season;
    }
  }
  
  for (const s of SEASONS) {
    if (text.includes(s)) {
      return s;
    }
  }
  
  return '四季';
}

function parseCategory(text: string): string {
  const lowerText = text.toLowerCase();
  const categoryMap: Record<string, string> = {
    '上衣': '上装', 'T恤': '上装', '衬衫': '上装', '卫衣': '上装', '毛衣': '上装', '背心': '上装',
    '外套': '外套', '夹克': '外套', '风衣': '外套', '大衣': '外套', '羽绒服': '外套', '西装': '外套',
    '裤子': '裤子', '牛仔裤': '裤子', '休闲裤': '裤子', '短裤': '裤子', '运动裤': '裤子',
    '裙子': '裙子', '短裙': '裙子',
    '连衣裙': '连衣裙', '长裙': '连衣裙',
    '鞋子': '鞋子', '运动鞋': '鞋子', '靴子': '鞋子', '皮鞋': '鞋子', '凉鞋': '鞋子',
    '帽子': '帽子', '棒球帽': '帽子', '毛线帽': '帽子',
    '包袋': '包袋', '背包': '包袋', '手提包': '包袋', '钱包': '包袋',
    '配饰': '配饰', '围巾': '配饰', '项链': '配饰', '耳环': '配饰', '手表': '配饰',
    '内衣': '内衣', '内裤': '内衣', '文胸': '内衣',
  };
  
  for (const [keyword, category] of Object.entries(categoryMap)) {
    if (lowerText.includes(keyword.toLowerCase())) {
      return category;
    }
  }
  
  for (const cat of CLOTHING_CATEGORIES) {
    if (text.includes(cat)) {
      return cat;
    }
  }
  
  return '上装';
}

function parseColor(text: string): string {
  const lowerText = text.toLowerCase();
  const colorMap: Record<string, string> = {
    '黑': '黑色', '白': '白色', '灰': '灰色', '红': '红色', '粉': '粉色',
    '橙': '橙色', '黄': '黄色', '绿': '绿色', '蓝': '蓝色', '紫': '紫色',
    '棕': '棕色', '米': '米色', '藏蓝': '藏蓝', '深蓝': '深蓝', '浅蓝': '浅蓝',
    '青': '青色', '金': '金色', '银': '银色',
  };
  
  for (const [keyword, color] of Object.entries(colorMap)) {
    if (lowerText.includes(keyword)) {
      return color;
    }
  }
  
  for (const color of COLORS) {
    if (text.includes(color)) {
      return color;
    }
  }
  
  return '其他';
}

function extractLabels(text: string): Array<{ label: string; score: number; category: string }> {
  const labels: Array<{ label: string; score: number; category: string }> = [];
  const lowerText = text.toLowerCase();
  
  const itemKeywords: Record<string, string> = {
    'T恤': '上装', '衬衫': '上装', '卫衣': '上装', '毛衣': '上装', '外套': '外套',
    '夹克': '外套', '风衣': '外套', '裤子': '裤子', '牛仔裤': '裤子', '裙子': '裙子',
    '连衣裙': '连衣裙', '鞋子': '鞋子', '运动鞋': '鞋子', '靴子': '鞋子', '帽子': '帽子',
    '背包': '包袋', '手提包': '包袋', '围巾': '配饰', '项链': '配饰', '手表': '配饰',
  };
  
  let score = 0.9;
  for (const [keyword, category] of Object.entries(itemKeywords)) {
    if (lowerText.includes(keyword.toLowerCase())) {
      labels.push({ label: keyword, score: Math.max(0.3, score), category });
      score -= 0.1;
    }
  }
  
  return labels.length > 0 ? labels : [{ label: '衣物', score: 0.7, category: '上装' }];
}

export async function recognizeClothingOpenAI(imageBase64: string): Promise<RecognitionResult> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API 密钥未配置');
  }

  try {
    const response = await fetch(`${OPENAI_API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '请识别这张图片中的衣物。请按照以下格式回答，只返回JSON，不要有其他文字：{"category":"衣物类别","color":"颜色","description":"描述"}。衣物类别只能是：上装、外套、裤子、裙子、连衣裙、鞋子、帽子、包袋、配饰、内衣、套装。颜色只能是：黑色、白色、灰色、红色、粉色、橙色、黄色、绿色、蓝色、紫色、棕色、米色、藏蓝、深蓝、浅蓝、青色、金色、银色、其他。'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64,
                },
              },
            ],
          },
        ],
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    try {
      const parsed = JSON.parse(content);
      const labels = extractLabels(parsed.description || parsed.category || '');
      
      return {
        category: parsed.category || '上装',
        color: parsed.color || '其他',
        season: parsed.season || '四季',
        confidence: 0.85,
        description: parsed.description || '',
        labels,
      };
    } catch {
      const category = parseCategory(content);
      const color = parseColor(content);
      const season = parseSeason(content);
      const labels = extractLabels(content);
      
      return {
        category,
        color,
        season,
        confidence: 0.75,
        description: content,
        labels,
      };
    }
  } catch (error) {
    console.error('[imageRecognitionService] OpenAI API 调用失败:', error);
    throw error;
  }
}

export async function recognizeClothingGemini(imageBase64: string): Promise<RecognitionResult> {
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API 密钥未配置');
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: '请识别这张图片中的衣物。请按照以下格式回答，只返回JSON，不要有其他文字：{"category":"衣物类别","color":"颜色","description":"描述"}。衣物类别只能是：上装、外套、裤子、裙子、连衣裙、鞋子、帽子、包袋、配饰、内衣、套装。颜色只能是：黑色、白色、灰色、红色、粉色、橙色、黄色、绿色、蓝色、紫色、棕色、米色、藏蓝、深蓝、浅蓝、青色、金色、银色、其他。'
              },
              {
                inline_data: {
                  mime_type: 'image/png',
                  data: imageBase64.split(',')[1],
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates[0]?.content?.parts[0]?.text;
    
    try {
      const parsed = JSON.parse(content);
      const labels = extractLabels(parsed.description || parsed.category || '');
      
      return {
        category: parsed.category || '上装',
        color: parsed.color || '其他',
        season: parsed.season || '四季',
        confidence: 0.85,
        description: parsed.description || '',
        labels,
      };
    } catch {
      const category = parseCategory(content);
      const color = parseColor(content);
      const season = parseSeason(content);
      const labels = extractLabels(content);
      
      return {
        category,
        color,
        season,
        confidence: 0.75,
        description: content,
        labels,
      };
    }
  } catch (error) {
    console.error('[imageRecognitionService] Gemini API 调用失败:', error);
    throw error;
  }
}

export async function recognizeClothingQwen(imageBase64: string): Promise<RecognitionResult> {
  const QWEN_API_KEY = import.meta.env.VITE_QWEN_API_KEY;
  if (!QWEN_API_KEY) {
    throw new Error('通义千问 API 密钥未配置');
  }

  // 开发环境使用代理，生产环境直接调用
  const isDev = import.meta.env.DEV;
  const QWEN_BASE_URL = isDev 
    ? '/dashscope/compatible-mode/v1'
    : (import.meta.env.VITE_QWEN_API_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1');

  try {
    const response = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QWEN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-vl-plus',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '请识别这张图片中的衣物，按照以下格式回答，只返回JSON，不要有其他文字：{"category":"衣物类别","color":"颜色","temperature":"适宜温度","description":"描述"}。衣物类别只能是：上装、外套、裤子、裙子、连衣裙、鞋子、帽子、包袋、配饰、内衣、套装。颜色只能是：黑色、白色、灰色、红色、粉色、橙色、黄色、绿色、蓝色、紫色、棕色、米色、藏蓝、深蓝、浅蓝、青色、金色、银色、其他。适宜温度只能是：夏季、春秋、冬季、四季。'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64,
                },
              },
            ],
          },
        ],
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    try {
      const parsed = JSON.parse(content);
      const labels = extractLabels(parsed.description || parsed.category || '');
      
      return {
        category: parsed.category || '上装',
        color: parsed.color || '其他',
        season: parsed.season || '四季',
        confidence: 0.85,
        description: parsed.description || '',
        labels,
      };
    } catch {
      const category = parseCategory(content);
      const color = parseColor(content);
      const season = parseSeason(content);
      const labels = extractLabels(content);
      
      return {
        category,
        color,
        season,
        confidence: 0.75,
        description: content,
        labels,
      };
    }
  } catch (error) {
    console.error('[imageRecognitionService] 通义千问 API 调用失败:', error);
    throw error;
  }
}

export async function recognizeClothing(imageBase64: string): Promise<RecognitionResult> {
  switch (RECOGNITION_SERVICE) {
    case 'openai':
      return recognizeClothingOpenAI(imageBase64);
    case 'gemini':
      return recognizeClothingGemini(imageBase64);
    case 'qwen':
      return recognizeClothingQwen(imageBase64);
    case 'local':
    default:
      throw new Error('本地模型加载失败，请配置远程 API');
  }
}

export function hasRemoteRecognitionService(): boolean {
  return RECOGNITION_SERVICE !== 'local';
}

export function getRecognitionServiceType(): RecognitionServiceType {
  return RECOGNITION_SERVICE;
}