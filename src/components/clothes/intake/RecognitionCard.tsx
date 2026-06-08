import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface RecognitionCardProps {
  imageUrl: string;
  message: string;
}

const RecognitionCard: React.FC<RecognitionCardProps> = ({ imageUrl, message }) => {
  const [showImage, setShowImage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowImage(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-[#f472d0] to-purple-400 px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles size={24} className="text-white animate-pulse" />
          <h3 className="text-xl font-bold text-white">正在帮你识别这件衣服 ✨</h3>
        </div>
        <p className="text-white/80 text-sm animate-pulse">{message}</p>
      </div>
      
      <div className="p-6">
        <div className="flex justify-center">
          <div className={`relative rounded-xl overflow-hidden shadow-md transition-all duration-500 ${showImage ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="待识别的衣物"
                className="w-48 h-48 object-contain bg-gray-100"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-gray-400 text-sm bg-gray-100">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin" />
                  <span>正在处理...</span>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        </div>
        
        <div className="mt-6 flex justify-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#f472d0] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-[#f472d0] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-[#f472d0] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecognitionCard;