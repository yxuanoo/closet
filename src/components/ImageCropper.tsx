import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, Eraser, Brush, ZoomIn, ZoomOut, Sparkles } from 'lucide-react';
import { removeBackground } from '../utils/autoCrop';

interface ImageCropperProps {
  imageUrl: string;
  onComplete: (croppedImage: string) => void;
  onCancel: () => void;
}

export default function ImageCropper({ imageUrl, onComplete, onCancel }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [brushSize, setBrushSize] = useState(20);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [isAutoCropping, setIsAutoCropping] = useState(false);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas) return;

    const ctx = canvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');
    if (!ctx || !maskCtx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      maskCanvas.width = img.width;
      maskCanvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      
      maskCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const getCanvasPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left - offset.x) * scaleX / scale,
      y: (e.clientY - rect.top - offset.y) * scaleY / scale,
    };
  }, [offset, scale]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;
    
    const pos = getCanvasPos(e);
    
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, brushSize, 0, Math.PI * 2);
    
    if (tool === 'brush') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    }
    
    ctx.fill();
  }, [isDrawing, tool, brushSize, getCanvasPos]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setLastPos(getCanvasPos(e));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setOffset(prev => ({
        x: prev.x + e.clientX - lastPos.x,
        y: prev.y + e.clientY - lastPos.y,
      }));
      setLastPos({ x: e.clientX, y: e.clientY });
    } else {
      draw(e);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.min(Math.max(prev * delta, 0.5), 3));
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(maskCanvas, 0, 0);

    ctx.globalCompositeOperation = 'source-over';
    
    const croppedImage = canvas.toDataURL('image/png');
    onComplete(croppedImage);
  };

  const handleReset = () => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;

    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
  };

  const handleAutoCrop = async () => {
    setIsAutoCropping(true);
    try {
      const croppedImage = await removeBackground(imageUrl);
      
      const canvas = canvasRef.current;
      const maskCanvas = maskCanvasRef.current;
      if (!canvas || !maskCanvas) {
        onComplete(croppedImage);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        onComplete(croppedImage);
        return;
      }

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const maskCtx = maskCanvas.getContext('2d');
        if (maskCtx) {
          maskCanvas.width = img.width;
          maskCanvas.height = img.height;
          maskCtx.fillStyle = 'rgba(0, 0, 0, 0)';
          maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
        }
      };
      img.src = croppedImage;
    } catch (error) {
      console.error('自动抠图失败:', error);
    }
    setIsAutoCropping(false);
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-4">
      <div className="flex items-center justify-between w-full max-w-4xl mb-4">
        <h2 className="text-white text-xl font-bold">自定义编辑</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/10 rounded-lg text-white"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ maxWidth: '80vw', maxHeight: '60vh' }}>
        <canvas
          ref={canvasRef}
          className="cursor-crosshair"
          style={{
            transform: `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`,
            transformOrigin: 'center center',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onContextMenu={(e) => {
            e.preventDefault();
            setIsDragging(true);
            setLastPos({ x: e.clientX, y: e.clientY });
          }}
        />
        
        <canvas
          ref={maskCanvasRef}
          className="absolute top-0 left-0 pointer-events-none"
          style={{ opacity: 0.8 }}
        />
      </div>

      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={handleAutoCrop}
          disabled={isAutoCropping}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 rounded-lg text-white font-medium transition-colors"
        >
          <Sparkles size={18} />
          {isAutoCropping ? '处理中...' : '✨ 自动抠图'}
        </button>

        <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2">
          <button
            onClick={() => setTool('brush')}
            className={`p-2 rounded-lg transition-colors ${tool === 'brush' ? 'bg-white/30' : 'hover:bg-white/10'}`}
            title="画笔（涂抹保留区域）"
          >
            <Brush size={20} className="text-white" />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-lg transition-colors ${tool === 'eraser' ? 'bg-white/30' : 'hover:bg-white/10'}`}
            title="橡皮擦（恢复遮罩）"
          >
            <Eraser size={20} className="text-white" />
          </button>
        </div>

        <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
          <span className="text-white text-sm">画笔大小</span>
          <input
            type="range"
            min="5"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-24 accent-purple-500"
          />
          <span className="text-white text-sm w-8">{brushSize}</span>
        </div>

        <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2">
          <button
            onClick={() => setScale(prev => Math.min(prev * 1.2, 3))}
            className="p-2 hover:bg-white/10 rounded-lg"
            title="放大"
          >
            <ZoomIn size={20} className="text-white" />
          </button>
          <span className="text-white text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale(prev => Math.max(prev / 1.2, 0.5))}
            className="p-2 hover:bg-white/10 rounded-lg"
            title="缩小"
          >
            <ZoomOut size={20} className="text-white" />
          </button>
        </div>

        <button
          onClick={handleReset}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
        >
          重置
        </button>

        <button
          onClick={handleApply}
          className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 rounded-lg text-white font-medium transition-opacity"
        >
          <Check size={20} />
          确认编辑
        </button>
      </div>

      <p className="text-white/60 text-sm mt-4">
        提示：鼠标左键涂抹保留区域，右键拖动移动图片，滚轮缩放
      </p>
    </div>
  );
}