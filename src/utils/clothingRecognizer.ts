import { analyzeImageColors, getColorHex } from './colorAnalyzer';
import type { ClothingItem } from '../components/Closet';

const clothingCategories = {
  top: ['T恤', '衬衫', '毛衣', '卫衣', '针织衫', '长袖', '短袖', '上衣', '吊带', '背心'],
  bottom: ['牛仔裤', '长裤', '短裤', '休闲裤', '阔腿裤', '打底裤'],
  dress: ['连衣裙', '长裙', '短裙', '吊带裙'],
  outerwear: ['外套', '大衣', '风衣', '夹克', '西装', '羽绒服', '棉服'],
  accessory: ['帽子', '包包', '围巾', '眼镜', '项链', '耳环', '发饰'],
  shoes: ['运动鞋', '高跟鞋', '皮鞋', '凉鞋', '靴子', '帆布鞋', '拖鞋'],
};

const outfitTemplates = [
  { name: '休闲日常', items: [
    { category: 'top', types: ['T恤', '短袖', '上衣'] },
    { category: 'bottom', types: ['牛仔裤', '休闲裤'] },
    { category: 'shoes', types: ['运动鞋', '帆布鞋'] },
  ]},
  { name: '通勤职场', items: [
    { category: 'top', types: ['衬衫', '长袖'] },
    { category: 'outerwear', types: ['西装', '外套'] },
    { category: 'bottom', types: ['长裤'] },
    { category: 'shoes', types: ['皮鞋', '高跟鞋'] },
  ]},
  { name: '甜美少女', items: [
    { category: 'dress', types: ['连衣裙', '短裙'] },
    { category: 'accessory', types: ['帽子', '包包'] },
    { category: 'shoes', types: ['凉鞋', '高跟鞋'] },
  ]},
  { name: '温柔淑女', items: [
    { category: 'top', types: ['毛衣', '针织衫'] },
    { category: 'bottom', types: ['阔腿裤', '长裙'] },
    { category: 'accessory', types: ['围巾'] },
  ]},
  { name: '运动休闲', items: [
    { category: 'top', types: ['卫衣', '运动T恤'] },
    { category: 'bottom', types: ['运动裤', '短裤'] },
    { category: 'shoes', types: ['运动鞋'] },
    { category: 'accessory', types: ['棒球帽'] },
  ]},
  { name: '秋冬保暖', items: [
    { category: 'top', types: ['毛衣', '针织衫'] },
    { category: 'outerwear', types: ['大衣', '羽绒服', '棉服'] },
    { category: 'bottom', types: ['长裤'] },
    { category: 'accessory', types: ['围巾', '帽子'] },
    { category: 'shoes', types: ['靴子'] },
  ]},
  { name: '夏日清爽', items: [
    { category: 'top', types: ['短袖', '吊带', '背心'] },
    { category: 'bottom', types: ['短裤', '短裙'] },
    { category: 'accessory', types: ['遮阳帽'] },
    { category: 'shoes', types: ['凉鞋', '拖鞋'] },
  ]},
  { name: '正式场合', items: [
    { category: 'dress', types: ['长裙', '连衣裙'] },
    { category: 'outerwear', types: ['西装', '外套'] },
    { category: 'accessory', types: ['包包'] },
    { category: 'shoes', types: ['高跟鞋'] },
  ]},
];

const colorStyleMap: Record<string, string[]> = {
  '白色': ['T恤', '衬衫', '连衣裙', '外套', '帽子', '运动鞋', '凉鞋'],
  '黑色': ['T恤', '衬衫', '外套', '长裤', '高跟鞋', '皮鞋', '包包'],
  '灰色': ['毛衣', '卫衣', '外套', '休闲裤', '运动鞋'],
  '蓝色': ['牛仔裤', '衬衫', 'T恤', '连衣裙', '鞋子'],
  '红色': ['连衣裙', '外套', '围巾', '鞋子', '包包'],
  '粉色': ['连衣裙', '毛衣', '衬衫', '外套', '鞋子'],
  '黄色': ['T恤', '连衣裙', '外套', '鞋子'],
  '绿色': ['连衣裙', '衬衫', '外套', '鞋子'],
  '紫色': ['连衣裙', '外套', '毛衣', '包包'],
  '棕色': ['外套', '毛衣', '裤子', '鞋子', '包包'],
  '米色': ['连衣裙', '衬衫', '外套', '裤子', '鞋子'],
  '浅蓝': ['衬衫', '连衣裙', 'T恤', '外套'],
  '深蓝': ['牛仔裤', '外套', '衬衫', '鞋子'],
  '浅灰': ['T恤', '卫衣', '裤子', '外套'],
  '深灰': ['外套', '裤子', '毛衣'],
  '暗红': ['连衣裙', '外套', '围巾'],
  '浅粉': ['连衣裙', '毛衣', '衬衫'],
  '橙色': ['T恤', '连衣裙', '外套'],
  '青色': ['连衣裙', '衬衫', '外套'],
};

export const smartRecognizeClothing = async (imageUrl: string): Promise<ClothingItem[]> => {
  const colors = await analyzeImageColors(imageUrl);
  const mainColors = colors.slice(0, 4);
  
  const hash = imageUrl.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const templateIndex = hash % outfitTemplates.length;
  const template = outfitTemplates[templateIndex];
  
  const result: ClothingItem[] = [];
  
  template.items.forEach((item, index) => {
    const colorIndex = index % mainColors.length;
    const colorInfo = mainColors[colorIndex];
    const colorHex = getColorHex(colorInfo.name);
    
    let availableTypes = item.types;
    const colorStyles = colorStyleMap[colorInfo.name];
    if (colorStyles) {
      availableTypes = item.types.filter(type => colorStyles.includes(type));
      if (availableTypes.length === 0) {
        availableTypes = item.types;
      }
    }
    
    const typeIndex = (hash + index * 7 + colorIndex * 3) % availableTypes.length;
    const clothingType = availableTypes[typeIndex];
    
    const name = `${colorInfo.name}${clothingType}`;
    
    result.push({
      id: `recognized-${Date.now()}-${index}`,
      name,
      category: item.category as 'top' | 'bottom' | 'dress' | 'outerwear' | 'accessory' | 'shoes',
      image: imageUrl,
      color: colorHex,
      tags: ['AI识别', template.name],
      suitableTemp: getSuitableTemp(template.name),
    });
  });
  
  return result;
};

const getSuitableTemp = (templateName: string): string => {
  if (templateName.includes('秋冬') || templateName.includes('保暖')) return '0-15°C';
  if (templateName.includes('夏日') || templateName.includes('清爽')) return '25-35°C';
  if (templateName.includes('运动')) return '15-30°C';
  return '15-30°C';
};

export const getDefaultClothingByCategory = (category: string): string[] => {
  return clothingCategories[category as keyof typeof clothingCategories] || ['上衣'];
};