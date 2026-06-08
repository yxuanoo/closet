import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Image, Check, Sparkles, ArrowRight, RefreshCw, Clipboard, Loader2, Brain, AlertCircle, Edit3, Plus, Trash2, X } from 'lucide-react';
import { useSmartIntake } from '../../../hooks/useSmartIntake';
import type { ClothingInfo } from './aiService';
import { getRandomMessage } from './aiService';
import RecognitionCard from './RecognitionCard';
import CompleteCard from './CompleteCard';
import ImageEditor from './ImageEditor';
import ImageMatting from './ImageMatting';
interface ConfirmCardProps {
  imageUrl: string;
  processedImageUrl?: string;
  clothingInfo: ClothingInfo & { aiLabels?: Array<{ label: string; score: number; category: string }> };
  onInfoChange: (info: ClothingInfo) => void;
  onImageEdit?: (editedImageUrl: string) => void;
  onRemove?: () => void;
  onEditClick?: () => void;
  locations?: Array<{ id: string; name: string }>;
  onShowAddLocation?: () => void;
}

const ConfirmCard: React.FC<ConfirmCardProps> = ({ 
  imageUrl, 
  processedImageUrl, 
  clothingInfo, 
  onInfoChange,
  onImageEdit, 
  onRemove,
  onEditClick,
  locations = [],
  onShowAddLocation
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showMatting, setShowMatting] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const handleChange = (field: keyof ClothingInfo, value: string) => {
    onInfoChange({ ...clothingInfo, [field]: value });
  };

  const handleMattingComplete = (editedImageUrl: string) => {
    setShowMatting(false);
    onImageEdit?.(editedImageUrl);
  };

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
                value={clothingInfo.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder=""
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">{'类别'}</label>
                <select
                  value={clothingInfo.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  {['上装', '外套', '裤子', '裙子', '连衣裙', '鞋子', '帽子', '包袋', '配饰', '内衣', '套装'].map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">{'颜色'}</label>
                <select
                  value={clothingInfo.color}
                  onChange={(e) => handleChange('color', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  {['黑色', '白色', '灰色', '红色', '粉色', '橙色', '黄色', '绿色', '蓝色', '紫色', '棕色', '米色', '藏蓝', '深蓝', '浅蓝', '青色', '金色', '银色', '其他'].map((color) => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">{'季节'}</label>
                <select
                  value={clothingInfo.season}
                  onChange={(e) => handleChange('season', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  {['春秋', '夏季', '冬季', '四季'].map((season) => (
                    <option key={season} value={season}>{season}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">{'收纳位置'}</label>
                <select
                  value={clothingInfo.location}
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

type Step = 'upload' | 'loading-model' | 'recognizing' | 'confirm' | 'complete';

interface RecognizedClothing {
  id: string;
  originalFile: File;
  imageUrl: string;
  processedImageUrl?: string;
  clothingInfo: ClothingInfo;
}

interface ClothingIntakeProps {
  onSave: (clothing: Omit<ClothingInfo, 'location'> & { imageUrl: string; processedImageUrl?: string }) => void;
  onSaveMultiple: (clothes: Array<Omit<ClothingInfo, 'location'> & { imageUrl: string; processedImageUrl?: string }>) => void;
  onViewCloset: () => void;
  onClose?: () => void;
  locations?: Array<{ id: string; name: string }>;
  onShowAddLocation?: () => void;
}

const CATEGORY_TEMP: Record<string, string> = {
  '0-15': '冬季', '10-30': '春秋', '15-28': '春秋',
  '20-35': '夏季', '25-40': '夏季', '0-35': '四季',
  '15-25': '春秋',
};

function colorNameFromHex(hex: string): string {
  const map: Record<string, string> = {
    '#000000': '黑色', '#ffffff': '白色', '#808080': '灰色', '#ffc0cb': '粉色',
    '#ff6b6b': '红色', '#ffa500': '橙色', '#ffd700': '黄色', '#90ee90': '绿色',
    '#87ceeb': '蓝色', '#dda0dd': '紫色', '#d2691e': '棕色', '#f5deb3': '米色',
    '#191970': '藏蓝', '#00008b': '深蓝', '#add8e6': '浅蓝', '#00ffff': '青色',
    '#ffaa00': '金色', '#c0c0c0': '银色',
  };
  const key = hex.toLowerCase();
  return map[key] || (hex.length === 7 ? '自定义' : '其他');
}

const ClothingIntake: React.FC<ClothingIntakeProps> = ({ onSave, onSaveMultiple, onViewCloset, onClose, locations = [], onShowAddLocation }) => {
  const { analyzeImage, isAnalyzing, pipelineStatus } = useSmartIntake();
  const [step, setStep] = useState<Step>('upload');
  const [recognizedClothes, setRecognizedClothes] = useState<RecognizedClothing[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recognitionMessage, setRecognitionMessage] = useState('');
  const [modelError, setModelError] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pipelineStatus === 'loading-model') {
      setStep('loading-model');
      setRecognitionMessage('正在加载 AI 模型...');
    } else if (pipelineStatus === 'error') {
      setModelError(true);
      if (step === 'loading-model') setStep('upload');
    }
  }, [pipelineStatus]);

  const processFile = useCallback(async (file: File, index: number, total: number) => {
    const reader = new FileReader();
    return new Promise<RecognizedClothing>((resolve) => {
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string;
        setRecognitionMessage(`正在识别第 ${index + 1}/${total} 件衣物...`);
        
        try {
          const result = await analyzeImage(file);
          const tempKey = String(result.suggestedTemp[0]) + '-' + String(result.suggestedTemp[1]);
          const aiGeneratedName = result.labels && result.labels.length > 0 
            ? result.labels[0].label 
            : null;
          const clothingResult: ClothingInfo = {
            name: aiGeneratedName || '未知服装',
            category: result.category,
            color: colorNameFromHex(result.color),
            season: CATEGORY_TEMP[tempKey] || result.season || '四季',
            location: '衣柜中层',
            confidence: result.confidence,
            vibeMessage: result.vibeMessage,
            aiLabels: result.labels,
          };

          resolve({
            id: `${Date.now()}-${index}`,
            originalFile: file,
            imageUrl,
            processedImageUrl: result.processedImageUrl,
            clothingInfo: clothingResult,
          });
        } catch (error) {
          console.error('识别失败:', error);
          resolve({
            id: `${Date.now()}-${index}`,
            originalFile: file,
            imageUrl,
            clothingInfo: {
              name: '未知服装', category: '上装', color: '其他',
              season: '四季', location: '衣柜中层', confidence: 0.3,
            } as any,
          });
        }
      };
      reader.readAsDataURL(file);
    });
  }, [analyzeImage]);

  const handleFilesSelect = useCallback(async (files: FileList) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    setStep('recognizing');
    setRecognizedClothes([]);
    setCurrentIndex(0);

    const results: RecognizedClothing[] = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const result = await processFile(imageFiles[i], i, imageFiles.length);
      results.push(result);
      setRecognizedClothes([...results]);
      setCurrentIndex(i + 1);
      await new Promise(r => setTimeout(r, 200));
    }

    setTimeout(() => setStep('confirm'), 300);
  }, [processFile]);

  const handleDrop = useCallback((e: any) => {
    e.preventDefault();
    dropZoneRef.current?.classList.remove('ring-4', 'ring-pink-400');
    if (e.dataTransfer.files.length > 0) {
      handleFilesSelect(e.dataTransfer.files);
    }
  }, [handleFilesSelect]);

  const handleDragOver = useCallback((e: any) => {
    e.preventDefault();
    dropZoneRef.current?.classList.add('ring-4', 'ring-pink-400');
  }, []);

  const handleDragLeave = useCallback(() => {
    dropZoneRef.current?.classList.remove('ring-4', 'ring-pink-400');
  }, []);

  const handleClick = useCallback(() => fileInputRef.current?.click(), []);
  const handleFileChange = useCallback((e: any) => {
    if (e.target.files?.length > 0) {
      handleFilesSelect(e.target.files);
    }
  }, [handleFilesSelect]);

  const handleSave = useCallback(() => {
    if (recognizedClothes.length === 1) {
      const clothing = recognizedClothes[0];
      onSave({
        name: clothing.clothingInfo.name,
        category: clothing.clothingInfo.category,
        color: clothing.clothingInfo.color,
        season: clothing.clothingInfo.season,
        location: clothing.clothingInfo.location || '',
        imageUrl: clothing.imageUrl,
        processedImageUrl: clothing.processedImageUrl || undefined,
      });
    } else if (recognizedClothes.length > 1) {
      const clothesToSave = recognizedClothes.map(c => ({
        name: c.clothingInfo.name,
        category: c.clothingInfo.category,
        color: c.clothingInfo.color,
        season: c.clothingInfo.season,
        location: c.clothingInfo.location || '',
        imageUrl: c.imageUrl,
        processedImageUrl: c.processedImageUrl || undefined,
      }));
      onSaveMultiple(clothesToSave);
    }
  }, [recognizedClothes, onSave, onSaveMultiple]);

  const handleConfirm = useCallback((id: string, info: ClothingInfo) => {
    setRecognizedClothes(prev => {
      const updated = prev.map(c => 
        c.id === id ? { ...c, clothingInfo: info } : c
      );
      
      // 更新单个衣物，不直接跳转完成页面
      return updated;
    });
  }, []);

  const handleBatchConfirm = useCallback(() => {
    // 批量确认并保存所有衣物
    handleSave();
    setTimeout(() => setStep('complete'), 100);
  }, [handleSave]);

  const handleRetry = useCallback(() => {
    // 完全重置到上传界面
    setStep('upload');
    setRecognizedClothes([]);
    setCurrentIndex(0);
  }, []);

  const handleEditImage = useCallback((id: string) => {
    const clothing = recognizedClothes.find(c => c.id === id);
    if (clothing) {
      setEditingId(id);
      setShowEditor(true);
    }
  }, [recognizedClothes]);

  const handleSaveEditedImage = useCallback((editedImage: string) => {
    if (editingId) {
      setRecognizedClothes(prev => prev.map(c => 
        c.id === editingId ? { ...c, processedImageUrl: editedImage } : c
      ));
    }
    setShowEditor(false);
    setEditingId(null);
  }, [editingId]);

  const handleRemoveClothing = useCallback((id: string) => {
    setRecognizedClothes(prev => {
      const newList = prev.filter(c => c.id !== id);
      if (newList.length === 0) {
        setTimeout(() => {
          setStep('upload');
        }, 100);
      }
      return newList;
    });
  }, []);

  const handleContinue = useCallback(() => {
    setStep('upload');
    setRecognizedClothes([]);
    setCurrentIndex(0);
  }, []);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (step !== 'upload') return;
      const file = e.clipboardData?.items?.[0]?.getAsFile();
      if (file?.type.startsWith('image/')) {
        handleFilesSelect(new FileListItems([file]));
        e.preventDefault();
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [step, handleFilesSelect]);

  class FileListItems {
    private items: File[];
    constructor(items: File[]) {
      this.items = items;
    }
    get length() {
      return this.items.length;
    }
    item(index: number) {
      return this.items[index];
    }
    [Symbol.iterator]() {
      return this.items[Symbol.iterator]();
    }
  }

  const steps = [
    { id: 'upload' as const, label: '上传', done: step !== 'upload' },
    { id: 'recognizing' as const, label: '识别', done: step === 'confirm' || step === 'complete' },
    { id: 'confirm' as const, label: '确认', done: step === 'complete' },
    { id: 'complete' as const, label: '完成', done: step === 'complete' },
  ];

  if (step === 'loading-model') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl shadow-lg p-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-6 animate-pulse">
            <Brain size={36} className="text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">{'正在加载'} AI {'模型...'}</h3>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
          <p className="text-sm text-gray-500 mb-4">{'首次使用需要下载'} AI {'抠图模型（约'} 150MB{'），之后自动缓存'}</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <Loader2 size={16} className="animate-spin" />
            <span>{'正在加载'} RMBG-1.4 {'模型...'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-center mb-8">
        {steps.map((s, index) => (
          <div key={s.id} className="flex items-center">
            <div className={
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all duration-300 ' +
              (step === s.id ? 'bg-[#f472d0] text-white scale-110' : s.done ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400')
            }>
              {s.done ? <Check size={16} /> : index + 1}
            </div>
            <span className={'ml-2 text-sm font-medium ' + (step === s.id ? 'text-[#f472d0]' : s.done ? 'text-green-600' : 'text-gray-400')}>
              {s.label}
            </span>
            {index < steps.length - 1 && (
              <ArrowRight size={16} className={'mx-4 ' + (steps[index + 1].done ? 'text-green-400' : 'text-gray-200')} />
            )}
          </div>
        ))}
      </div>

      {modelError && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
          <AlertCircle size={20} className="text-yellow-600 mt-0.5 shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">AI 抠图模型加载失败</p>
            <p className="mt-1">背景去除效果可能较差。衣物分类识别不受影响。</p>
          </div>
        </div>
      )}

      {step === 'upload' && (
        <div
          ref={dropZoneRef}
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className="bg-white rounded-2xl shadow-lg p-12 text-center cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] border-2 border-dashed border-gray-200 hover:border-[#f472d0] group"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#f472d0] to-purple-400 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
            <Upload size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {'把衣服交给我帮你整理'} {'✨'}
          </h3>
          <p className="text-gray-500 mb-6">{'上传照片，'} AI {'自动识别衣物类别、颜色并去除背景'} <span className="text-pink-500">（支持批量上传）</span></p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-400 flex-wrap">
            <span className="flex items-center gap-1"><Image size={16} />{'点击上传'}</span>
            <span>{'或'}</span>
            <span className="flex items-center gap-1"><RefreshCw size={16} />{'拖拽文件'}</span>
            <span>{'或'}</span>
            <span className="flex items-center gap-1"><Clipboard size={16} />{'粘贴图片'}</span>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" multiple />
        </div>
      )}

      {step === 'recognizing' && (
        <RecognitionCard 
          imageUrl={currentIndex > 0 ? recognizedClothes[currentIndex - 1]?.imageUrl || '' : ''} 
          message={recognitionMessage} 
          progress={{ current: currentIndex, total: recognizedClothes.length + (isAnalyzing ? 1 : 0) }}
        />
      )}

      {step === 'confirm' && recognizedClothes.length > 0 && (
        <div className="space-y-6">
          <div className="space-y-6">
            {recognizedClothes.map((clothing, index) => (
              <div key={clothing.id} className="relative">
                {recognizedClothes.length > 1 && (
                  <div className="absolute -top-2 -left-2 z-10 flex items-center justify-center w-6 h-6 bg-[#f472d0] text-white text-xs font-bold rounded-full">
                    {index + 1}
                  </div>
                )}
                
                <ConfirmCard
                  imageUrl={clothing.processedImageUrl || clothing.imageUrl}
                  processedImageUrl={clothing.processedImageUrl}
                  clothingInfo={clothing.clothingInfo}
                  onInfoChange={(info) => setRecognizedClothes(prev => 
                    prev.map(c => c.id === clothing.id ? { ...c, clothingInfo: info } : c)
                  )}
                  onImageEdit={(url) => {
                    setRecognizedClothes(prev => prev.map(c => 
                      c.id === clothing.id ? { ...c, processedImageUrl: url } : c
                    ));
                  }}
                  onRemove={() => handleRemoveClothing(clothing.id)}
                  onEditClick={() => handleEditImage(clothing.id)}
                  locations={locations}
                  onShowAddLocation={onShowAddLocation}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleRetry}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              <X size={18} /> {'重新上传'}
            </button>
            <button
              onClick={handleBatchConfirm}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-[#f472d0] text-white rounded-xl hover:bg-[#e85bb4] transition-colors font-medium border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              <Check size={18} /> {'确认保存 (' + recognizedClothes.length + ')'}
            </button>
          </div>
        </div>
      )}

      {step === 'complete' && recognizedClothes.length > 0 && (
        <CompleteCard
          imageUrl={recognizedClothes[0].processedImageUrl || recognizedClothes[0].imageUrl}
          clothingInfo={recognizedClothes[0].clothingInfo}
          count={recognizedClothes.length}
          onViewCloset={onViewCloset}
          onContinue={handleContinue}
        />
      )}

      {showEditor && editingId && (
        <ImageEditor
          imageUrl={recognizedClothes.find(c => c.id === editingId)?.processedImageUrl || 
                   recognizedClothes.find(c => c.id === editingId)?.imageUrl || ''}
          onClose={() => {
            setShowEditor(false);
            setEditingId(null);
          }}
          onSave={handleSaveEditedImage}
        />
      )}
    </div>
  );
};

export default ClothingIntake;