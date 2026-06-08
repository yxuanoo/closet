export interface CanvaRemoveBackgroundResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export interface CanvaEditResponse {
  success: boolean;
  imageUrl?: string;
  designId?: string;
  error?: string;
}

const CANVA_API_KEY = import.meta.env.VITE_CANVA_API_KEY;
const CANVA_API_URL = import.meta.env.VITE_CANVA_API_URL || 'https://api.canva.com/v1';

export async function removeBackgroundCanva(imageBase64: string): Promise<CanvaRemoveBackgroundResponse> {
  if (!CANVA_API_KEY) {
    console.warn('[canvaService] Canva API key not configured, falling back to local AI');
    return { success: false, error: 'Canva API 未配置' };
  }

  try {
    const response = await fetch(`${CANVA_API_URL}/images/remove-background`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CANVA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return {
        success: false,
        error: errorData?.message || `HTTP ${response.status}`
      };
    }

    const data = await response.json();
    return {
      success: true,
      imageUrl: data.result?.image_url,
    };
  } catch (error) {
    console.error('[canvaService] Canva API 调用失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

export async function openCanvaEditor(imageBase64: string): Promise<CanvaEditResponse> {
  if (!CANVA_API_KEY) {
    return { success: false, error: 'Canva API 未配置' };
  }

  try {
    const response = await fetch(`${CANVA_API_URL}/designs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CANVA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'IMAGE',
        title: '衣物图片编辑',
        elements: [
          {
            type: 'image',
            image_url: imageBase64,
            x: 0,
            y: 0,
            width: 800,
            height: 800,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return {
        success: false,
        error: errorData?.message || `HTTP ${response.status}`
      };
    }

    const data = await response.json();
    return {
      success: true,
      designId: data.id,
      imageUrl: data.edit_url,
    };
  } catch (error) {
    console.error('[canvaService] Canva 创建设计失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

export async function exportCanvaDesign(designId: string): Promise<CanvaEditResponse> {
  if (!CANVA_API_KEY) {
    return { success: false, error: 'Canva API 未配置' };
  }

  try {
    const response = await fetch(`${CANVA_API_URL}/designs/${designId}/export`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CANVA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        format: 'PNG',
        quality: 'HIGH',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return {
        success: false,
        error: errorData?.message || `HTTP ${response.status}`
      };
    }

    const data = await response.json();
    return {
      success: true,
      imageUrl: data.export_url,
    };
  } catch (error) {
    console.error('[canvaService] Canva 导出设计失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

export function hasCanvaApiKey(): boolean {
  return !!CANVA_API_KEY && CANVA_API_KEY !== 'your-canva-api-key-here';
}