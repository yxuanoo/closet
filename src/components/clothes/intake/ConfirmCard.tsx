import React, { useState } from 'react';
import { Check, X, Brain, Sparkles, Edit3 } from 'lucide-react';
import type { ClothingInfo } from './aiService';
import ImageMatting from './ImageMatting';

interface ConfirmCardProps {
  imageUrl: string;
  processedImageUrl?: string;
  clothingInfo: ClothingInfo & { aiLabels?: Array<{ label: string; score: number; category: string }> };
  onImageEdit?: (editedImageUrl: string) => void;
  onRemove?: () => void;
  onEditClick?: () => void;
  locations?: Array<{ id: string; name: string }>;
  onShowAddLocation?: () => void;
}

const CATEGORIES = ['上装', '外套', '裤子', '裙子', '连衣裙', '鞋子', '帽子', '包袋', '配饰', '内衣', '套装'];
const COLORS = ['黑色', '白色', '灰色', '红色', '粉色', '橙色', '黄色', '绿色', '蓝色', '紫色', '棕色', '米色', '藏蓝', '深蓝', '浅蓝', '青色', '金色', '银色', '其他'];
const SEASONS = ['春秋', '夏季', '冬季', '四季'];

const ConfirmCard: React.FC<ConfirmCardProps> = ({ 
  imageUrl, 
  processedImageUrl, 
  clothingInfo, 
  onImageEdit, 
  onRemove,
  onEditClick,
  locations = [],
  onShowAddLocation
}) => {
  const [editedInfo, setEditedInfo] = useState(clothingInfo);
  const [showDetails, setShowDetails] = useState(false);
  const [showMatting, setShowMatting] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const handleChange = (field: keyof ClothingInfo, value: string) => {
    setEditedInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleMattingComplete = (editedImageUrl: string) => {
    setShowMatting(false);
    onImageEdit?.(editedImageUrl);
  };

  const getEditedInfo = () => editedInfo;

  const pct = Math.round(clothingInfo.confidence * 100);
  const level = pct >= 70 ? '高' : pct >= 40 ? '中' : '低';
  const barColor = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  const lvlBg = pct >= 70 ? 'bg-green-600/60' : pct >= 40 ? 'bg-yellow-600/60' : 'bg-red-600/60';

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-[#f472d0] to-purple-400 px-6 py-6 text-center">
        <h3 className="text-xl font-bold text-white">{'识别完成，看看对不对？'}</h3>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="text-white/80 text-sm">{'识别置信度：'}</span>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-white/30 rounded-full overflow-hidden">
              <div className={'h-full rounded-full transition-all duration-1000 ' + barColor} style={{ width: pct + '%' }} />
            </div>
            <span className="text-white text-sm font-bold">{pct}%</span>
            <span className={'text-xs px-1.5 py-0.5 rounded-full text-white ' + lvlBg}>{level}</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex gap-6">
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="relative w-36 h-36 rounded-xl overflow-hidden shadow-md bg-gray-100">
              {(processedImageUrl || imageUrl) && (
                <img
                  src={processedImageUrl || imageUrl}
                  alt=""
                  className="w-full h-full object-contain"
                />
              )}
              {!processedImageUrl && !imageUrl && (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  图片加载失败
                </div>
              )}
              {processedImageUrl && processedImageUrl !== imageUrl && (
                <button
                  onClick={() => setShowMatting(true)}
                  className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs text-purple-600 hover:bg-white transition-colors shadow-md"
                >
                  <Edit3 size={12} /> 编辑
                </button>
              )}
              {onRemove && (
                <button
                  onClick={() => setShowRemoveConfirm(true)}
                  className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 bg-red-500/90 backdrop-blur-sm rounded-full text-xs text-white hover:bg-red-600 transition-colors shadow-md"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            {onEditClick && (
              <button
                onClick={onEditClick}
                className="mt-2 flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit3 size={14} /> 编辑图片
              </button>
            )}
            {processedImageUrl && processedImageUrl !== imageUrl && (
              <span className="mt-2 flex items-center gap-1 text-xs text-purple-500">
                <Sparkles size={12} /> AI {'抠图'}
              </span>
            )}
          </div>

          <div className="flex-1 space-y-4">
            {(clothingInfo as any).aiLabels && (clothingInfo as any).aiLabels.length > 0 && (
              <>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-purple-700">
                    <Brain size={16} />
                    AI {'识别详情'}
                  </span>
                  <span className="text-purple-400">{showDetails ? '▲' : '▼'}</span>
                </button>

                {showDetails && (
                  <div className="px-3 py-2 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-2">AI {'认为这件衣物是：'}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {((clothingInfo as any).aiLabels as Array<{ label: string; score: number }>).slice(0, 5).map((l, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white border border-purple-200 text-purple-700"
                        >
                          {l.label} <span className="text-purple-400">{(l.score * 100).toFixed(0)}%</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">{'名称'}</label>
              <input
                type="text"
                value={editedInfo.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder=""
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">{'类别'}</label>
                <select
                  value={editedInfo.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">{'颜色'}</label>
                <select
                  value={editedInfo.color}
                  onChange={(e) => handleChange('color', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  {COLORS.map((color) => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">{'季节'}</label>
                <select
                  value={editedInfo.season}
                  onChange={(e) => handleChange('season', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  {SEASONS.map((season) => (
                    <option key={season} value={season}>{season}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">{'收纳位置'}</label>
                <select
                  value={editedInfo.location}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '__add_location__') {
                      onShowAddLocation?.();
                    } else {
                      handleChange('location', value === '__none__' ? '' : value);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="">无</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.name}>{loc.name}</option>
                  ))}
                  <option value="__add_location__">+ 创建收纳</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showMatting && (
        <ImageMatting
          imageUrl={imageUrl}
          processedImageUrl={processedImageUrl}
          onComplete={handleMattingComplete}
          onClose={() => setShowMatting(false)}
        />
      )}

      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[500] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-2">确认移除</h3>
            <p className="text-gray-600 mb-4">确定要移除这件衣物吗？此操作无法撤销。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRemoveConfirm(false)}
                className="flex-1 py-2 px-4 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={() => {
                  onRemove?.();
                  setShowRemoveConfirm(false);
                }}
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
              >
                确认移除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfirmCard;
