export interface ColorInfo {
  hex: string;
  name: string;
  rgb: [number, number, number];
  percentage: number;
}

const colorNames: Record<string, string> = {
  '#FFFFFF': '白色',
  '#000000': '黑色',
  '#808080': '灰色',
  '#0066CC': '蓝色',
  '#FF0000': '红色',
  '#FF69B4': '粉色',
  '#FFD700': '黄色',
  '#00CC00': '绿色',
  '#9933FF': '紫色',
  '#8B4513': '棕色',
  '#F5F5DC': '米色',
  '#87CEEB': '浅蓝',
  '#003366': '深蓝',
  '#D3D3D3': '浅灰',
  '#333333': '深灰',
  '#8B0000': '暗红',
  '#FFB6C1': '浅粉',
  '#FFA500': '橙色',
  '#00CED1': '青色',
};

const colorRanges: { name: string; ranges: [number, number, number][] }[] = [
  { name: '白色', ranges: [[240, 255], [240, 255], [240, 255]] },
  { name: '黑色', ranges: [[0, 30], [0, 30], [0, 30]] },
  { name: '灰色', ranges: [[100, 180], [100, 180], [100, 180]] },
  { name: '蓝色', ranges: [[0, 100], [50, 180], [100, 255]] },
  { name: '红色', ranges: [[150, 255], [0, 100], [0, 100]] },
  { name: '粉色', ranges: [[200, 255], [150, 200], [180, 230]] },
  { name: '黄色', ranges: [[200, 255], [180, 255], [0, 100]] },
  { name: '绿色', ranges: [[0, 100], [100, 200], [0, 100]] },
  { name: '紫色', ranges: [[100, 200], [50, 120], [150, 255]] },
  { name: '棕色', ranges: [[100, 180], [60, 120], [20, 80]] },
  { name: '米色', ranges: [[230, 255], [220, 245], [180, 220]] },
  { name: '橙色', ranges: [[200, 255], [100, 160], [0, 80]] },
];

export const analyzeImageColors = async (imageUrl: string): Promise<ColorInfo[]> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve([{ hex: '#F5F5DC', name: '米色', rgb: [245, 245, 220], percentage: 100 }]);
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      
      const colorCounts: Record<string, number> = {};
      const sampleStep = Math.max(1, Math.floor(pixels.length / (4 * 1000)));
      
      for (let i = 0; i < pixels.length; i += 4 * sampleStep) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        
        if (a < 128) continue;
        
        const hex = rgbToHex(r, g, b);
        const colorName = getColorName(r, g, b);
        
        const key = `${hex}-${colorName}`;
        colorCounts[key] = (colorCounts[key] || 0) + 1;
      }
      
      const total = Object.values(colorCounts).reduce((a, b) => a + b, 0);
      const sorted = Object.entries(colorCounts)
        .map(([key, count]) => {
          const [hex, name] = key.split('-');
          const rgb = hexToRgb(hex);
          return {
            hex,
            name,
            rgb: rgb || [255, 255, 255],
            percentage: (count / total) * 100,
          };
        })
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 5);
      
      resolve(sorted);
    };
    
    img.onerror = () => {
      resolve([{ hex: '#F5F5DC', name: '米色', rgb: [245, 245, 220], percentage: 100 }]);
    };
    
    img.src = imageUrl;
  });
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

const hexToRgb = (hex: string): [number, number, number] | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ] : null;
};

const getColorName = (r: number, g: number, b: number): string => {
  for (const color of colorRanges) {
    const [rRange, gRange, bRange] = color.ranges;
    if (
      r >= rRange[0] && r <= rRange[1] &&
      g >= gRange[0] && g <= gRange[1] &&
      b >= bRange[0] && b <= bRange[1]
    ) {
      return color.name;
    }
  }
  
  const grayDiff = Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
  if (grayDiff < 30) {
    if (r > 200) return '白色';
    if (r < 50) return '黑色';
    return '灰色';
  }
  
  const maxVal = Math.max(r, g, b);
  if (maxVal < 80) return '黑色';
  if (maxVal > 230) return '白色';
  
  const rRatio = r / (r + g + b + 1);
  const gRatio = g / (r + g + b + 1);
  
  if (rRatio > 0.4 && gRatio < 0.3) return '红色';
  if (rRatio > 0.35 && gRatio > 0.25 && gRatio < 0.4) return '橙色';
  if (rRatio > 0.3 && gRatio > 0.2 && b > 100) return '粉色';
  if (gRatio > 0.4 && rRatio < 0.3) return '绿色';
  if (b > g && b > r) return '蓝色';
  if (b > 100 && r > g) return '紫色';
  if (r > 100 && g > 60 && b < 100) return '棕色';
  
  return '米色';
};

export const getColorHex = (name: string): string => {
  const found = Object.entries(colorNames).find(([, colorName]) => colorName === name);
  return found ? found[0] : '#F5F5DC';
};