import React, { useEffect, useState } from 'react';
import { Check, Sparkles, ArrowRight, Shirt } from 'lucide-react';
import type { ClothingInfo } from './aiService';

interface CompleteCardProps {
  imageUrl: string;
  clothingInfo: ClothingInfo;
  onViewCloset: () => void;
  onContinue: () => void;
  onSave: () => void;
}

const CompleteCard: React.FC<CompleteCardProps> = ({
  imageUrl,
  clothingInfo,
  onViewCloset,
  onContinue,
  onSave,
}) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-[#f472d0] to-purple-400 px-6 py-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 animate-bounce">
          <Check size={32} className="text-[#f472d0]" />
        </div>
        <h3 className="text-xl font-bold text-white flex items-center justify-center gap-2">
          已经帮你放进衣橱啦 ✨
        </h3>
      </div>

      <div className={`p-6 transition-all duration-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-xl overflow-hidden shadow-md bg-gray-100 flex-shrink-0">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="已保存的衣物"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                图片加载失败
              </div>
            )}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-800 text-lg">{clothingInfo.name}</h4>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="px-2 py-0.5 text-xs bg-pink-100 text-pink-600 rounded-full">
                {clothingInfo.category}
              </span>
              <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-600 rounded-full">
                {clothingInfo.color}
              </span>
              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                {clothingInfo.season}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Sparkles size={20} className="text-[#f472d0]" />
            </div>
            <div>
              <p className="text-sm text-gray-600">下次穿搭时会优先推荐这件衣服哦～</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onContinue}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-white text-[#f472d0] rounded-xl hover:bg-pink-50 transition-colors font-medium border-2 border-[#f472d0]"
          >
            <Shirt size={18} />
            继续上传
          </button>
          <button
            onClick={onViewCloset}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-[#f472d0] text-white rounded-xl hover:bg-[#e85bb4] transition-colors font-medium border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            去看看衣橱
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompleteCard;