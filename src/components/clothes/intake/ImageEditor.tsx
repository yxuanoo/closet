import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, RotateCcw, Download, FlipHorizontal, FlipVertical, ZoomIn, ZoomOut, MousePointer2, Maximize2, Pencil, Eraser, Zap } from 'lucide-react';
import { removeBackgroundAI } from './clothingPipeline';

interface ImageEditorProps {
  imageUrl: string;
  onClose: () => void;
  onSave: (editedImageUrl: string) => void;
}

interface EditorState {
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  scale: number;
  offsetX: number;
  offsetY: number;
  imageWidth: number;
  imageHeight: number;
}

type ToolType = 'select' | 'brush' | 'eraser';

export default function ImageEditor({ imageUrl, onClose, onSave }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [state, setState] = useState<EditorState>({
    rotation: 0,
    flipX: false,
    flipY: false,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    imageWidth: 0,
    imageHeight: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, scale: 1 });
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [brushSize, setBrushSize] = useState(10);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);

  const drawImage = useCallback(() => {
    if (!canvasRef.current || !image) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.translate(centerX + state.offsetX, centerY + state.offsetY);
    ctx.rotate((state.rotation * Math.PI) / 180);
    ctx.scale(state.flipX ? -state.scale : state.scale, state.flipY ? -state.scale : state.scale);

    const displayScale = Math.min(550 / image.width, 450 / image.height);
    const drawWidth = image.width * displayScale * state.scale;
    const drawHeight = image.height * displayScale * state.scale;

    ctx.drawImage(
      image,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );

    ctx.restore();
  }, [image, state]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      setState(prev => ({
        ...prev,
        imageWidth: img.width,
        imageHeight: img.height,
      }));
      setIsLoaded(true);
    };
    img.onerror = () => {
      setIsLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (isLoaded && image) {
      drawImage();
    }
  }, [isLoaded, image, drawImage]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !image) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (activeTool !== 'select') {
      setIsDrawing(true);
      drawOnMask(x, y);
      return;
    }

    const centerX = canvasRef.current.width / 2 + state.offsetX;
    const centerY = canvasRef.current.height / 2 + state.offsetY;
    
    const handleX = centerX + 60;
    const handleY = centerY + 60;
    const handleDistance = Math.sqrt((x - handleX) ** 2 + (y - handleY) ** 2);
    
    if (handleDistance < 15) {
      setIsResizing(true);
      setResizeStart({ x, y, scale: state.scale });
    } else {
      setIsDragging(true);
      setDragStart({ x: x - state.offsetX, y: y - state.offsetY });
    }
  }, [state, activeTool, image]);

  const drawOnMask = useCallback((x: number, y: number) => {
    if (!maskCanvasRef.current) return;
    const ctx = maskCanvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fillStyle = activeTool === 'eraser' ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 0, 0, 0.8)';
    ctx.fill();
  }, [brushSize, activeTool]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDrawing && activeTool !== 'select') {
      drawOnMask(x, y);
      return;
    }

    if (isDragging) {
      setState(prev => ({
        ...prev,
        offsetX: x - dragStart.x,
        offsetY: y - dragStart.y,
      }));
    } else if (isResizing) {
      const deltaX = x - resizeStart.x;
      const deltaY = y - resizeStart.y;
      const delta = (deltaX + deltaY) / 200;
      const newScale = Math.max(0.2, Math.min(5, resizeStart.scale + delta));
      setState(prev => ({
        ...prev,
        scale: newScale,
      }));
    }
  }, [isDragging, isResizing, dragStart, resizeStart, isDrawing, activeTool, drawOnMask]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setIsDrawing(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setIsDrawing(false);
  }, []);

  const handleRotate = () => {
    setState(prev => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
  };

  const handleFlip = (horizontal: boolean) => {
    setState(prev => ({
      ...prev,
      flipX: horizontal ? !prev.flipX : prev.flipX,
      flipY: !horizontal ? !prev.flipY : prev.flipY,
    }));
  };

  const handleZoom = (delta: number) => {
    setState(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(5, prev.scale + delta)),
    }));
  };

  const handleReset = () => {
    setState({
      rotation: 0,
      flipX: false,
      flipY: false,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      imageWidth: state.imageWidth,
      imageHeight: state.imageHeight,
    });

    if (maskCanvasRef.current) {
      const ctx = maskCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 600, 500);
      }
    }
  };

  const handleRemoveBackground = useCallback(async () => {
    if (!imageUrl) return;
    
    setIsRemovingBg(true);
    
    try {
      // 将当前图片转换为 img element
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });
      
      const resultUrl = await removeBackgroundAI(img);
      
      if (resultUrl) {
        // 使用 AI 抠图后的图片
        const newImage = new Image();
        newImage.crossOrigin = 'anonymous';
        newImage.onload = () => {
          setImage(newImage);
        };
        newImage.src = resultUrl;
      } else {
        alert('背景去除失败');
      }
    } catch (error) {
      console.error('[ImageEditor] AI 抠图失败:', error);
      alert('背景去除失败');
    } finally {
      setIsRemovingBg(false);
    }
  }, [imageUrl]);

  const handleSave = () => {
    if (!canvasRef.current || !image) return;
    
    const displayScale = Math.min(550 / image.width, 450 / image.height);
    const exportWidth = Math.round(image.width * displayScale * state.scale);
    const exportHeight = Math.round(image.height * displayScale * state.scale);
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportWidth;
    exportCanvas.height = exportHeight;
    const exportCtx = exportCanvas.getContext('2d');
    if (!exportCtx) return;

    exportCtx.save();
    exportCtx.translate(exportWidth / 2, exportHeight / 2);
    exportCtx.rotate((state.rotation * Math.PI) / 180);
    exportCtx.scale(state.flipX ? -1 : 1, state.flipY ? -1 : 1);

    exportCtx.globalCompositeOperation = 'source-over';
    exportCtx.drawImage(
      image,
      -exportWidth / 2,
      -exportHeight / 2,
      exportWidth,
      exportHeight
    );

    if (maskCanvasRef.current) {
      const maskCtx = maskCanvasRef.current.getContext('2d');
      if (maskCtx) {
        const maskData = maskCtx.getImageData(0, 0, 600, 500);
        const hasMask = maskData.data.some((val, i) => i % 4 === 3 && val > 0);
        
        if (hasMask) {
          const maskCanvas = document.createElement('canvas');
          maskCanvas.width = 600;
          maskCanvas.height = 500;
          const tempCtx = maskCanvas.getContext('2d');
          if (tempCtx) {
            tempCtx.putImageData(maskData, 0, 0);
            
            const maskImage = new Image();
            maskImage.src = maskCanvas.toDataURL();
            maskImage.onload = () => {
              exportCtx.globalCompositeOperation = 'destination-out';
              exportCtx.drawImage(maskImage, -exportWidth / 2, -exportHeight / 2, exportWidth, exportHeight);
              exportCtx.restore();
              
              const dataUrl = exportCanvas.toDataURL('image/png');
              onSave(dataUrl);
            };
            return;
          }
        }
      }
    }
    
    exportCtx.restore();
    const dataUrl = exportCanvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">图片编辑</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        ref={containerRef}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden overflow-y-auto"
        onClick={(e) => {
          if (e.target === containerRef.current) {
            e.stopPropagation();
          }
        }}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">图片编辑</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleRemoveBackground}
              disabled={isRemovingBg}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-md transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className={`w-4 h-4 ${isRemovingBg ? 'animate-pulse' : ''}`} />
              {isRemovingBg ? 'AI 抠图中...' : 'AI 自动抠图'}
            </button>
            <button
              onClick={() => setActiveTool('select')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTool === 'select'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <MousePointer2 className="w-4 h-4" />
              选择
            </button>
            <button
              onClick={() => setActiveTool('brush')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTool === 'brush'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Pencil className="w-4 h-4" />
              画笔（擦除）
            </button>
            <button
              onClick={() => setActiveTool('eraser')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTool === 'eraser'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Eraser className="w-4 h-4" />
              橡皮擦（恢复）
            </button>
            {(activeTool === 'brush' || activeTool === 'eraser') && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">画笔大小:</span>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-sm text-gray-500 w-8">{brushSize}</span>
              </div>
            )}
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-500">
              <MousePointer2 size={12} />
              拖拽移动
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-500">
              <Maximize2 size={12} />
              拖拽右下角调整大小
            </div>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <button
              onClick={() => handleFlip(true)}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <FlipHorizontal className="w-4 h-4" />
              水平翻转
            </button>
            <button
              onClick={() => handleFlip(false)}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <FlipVertical className="w-4 h-4" />
              垂直翻转
            </button>
            <button
              onClick={handleRotate}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              旋转90°
            </button>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <button
              onClick={() => handleZoom(0.25)}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
              放大
            </button>
            <button
              onClick={() => handleZoom(-0.25)}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
              缩小
            </button>
            <span className="ml-2 text-sm text-gray-500">缩放: {(state.scale * 100).toFixed(0)}%</span>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors ml-auto"
            >
              <RotateCcw className="w-4 h-4" />
              重置
            </button>
          </div>
        </div>

        <div className="p-4 flex justify-center bg-gray-100 relative">
          <canvas
            ref={canvasRef}
            width={600}
            height={500}
            className="rounded-lg shadow-md cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          />
          <canvas
            ref={maskCanvasRef}
            width={600}
            height={500}
            className="absolute rounded-lg pointer-events-none"
            style={{ mixBlendMode: 'multiply', opacity: 0.5 }}
          />
        </div>

        <div className="p-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#f472d0] to-purple-500 text-white rounded-xl hover:shadow-lg transition-all font-medium"
          >
            <Download className="w-4 h-4" />
            确认保存
          </button>
        </div>
      </div>
    </div>
  );
}