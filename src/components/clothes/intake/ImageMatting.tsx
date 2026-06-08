import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Check, Undo, Brush, Eraser, Sparkles } from 'lucide-react';

interface ImageMattingProps {
  imageUrl: string;
  processedImageUrl?: string;
  onComplete: (processedImageUrl: string) => void;
  onClose: () => void;
}

type ToolType = 'restore' | 'erase';

interface HistoryState {
  imageData: ImageData;
}

export const ImageMatting: React.FC<ImageMattingProps> = ({
  imageUrl,
  processedImageUrl,
  onComplete,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<ToolType>('erase');
  const [brushSize, setBrushSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ imageData });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;

    const prevState = history[historyIndex - 1];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.putImageData(prevState.imageData, 0, 0);
    setHistoryIndex(historyIndex - 1);
  }, [history, historyIndex]);

  const canUndo = historyIndex > 0;

  const getScaledPoint = useCallback((e: MouseEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const drawLine = useCallback((ctx: CanvasRenderingContext2D, from: { x: number; y: number }, to: { x: number; y: number }, isErase: boolean) => {
    const originalCanvas = originalCanvasRef.current;
    if (!originalCanvas) return;

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = isErase ? 'rgba(0, 0, 0, 1)' : 'transparent';
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isErase) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    } else {
      ctx.save();
      ctx.stroke();
      ctx.clip();
      ctx.drawImage(
        originalCanvas,
        0, 0,
        originalCanvas.width,
        originalCanvas.height,
        0, 0,
        canvasRef.current?.width || originalCanvas.width,
        canvasRef.current?.height || originalCanvas.height
      );
      ctx.restore();
    }
  }, [brushSize]);

  const drawAtPosition = useCallback((e: MouseEvent, isFirstPoint: boolean = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPoint = getScaledPoint(e);
    if (!currentPoint) return;

    if (isFirstPoint) {
      lastPointRef.current = currentPoint;

      if (tool === 'erase') {
        ctx.beginPath();
        ctx.arc(currentPoint.x, currentPoint.y, brushSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.save();
        ctx.beginPath();
        ctx.arc(currentPoint.x, currentPoint.y, brushSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(
          originalCanvasRef.current!,
          0, 0,
          originalCanvasRef.current!.width,
          originalCanvasRef.current!.height,
          0, 0,
          canvas.width,
          canvas.height
        );
        ctx.restore();
      }
    } else {
      const lastPoint = lastPointRef.current;
      if (!lastPoint) return;

      drawLine(ctx, lastPoint, currentPoint, tool === 'erase');
      lastPointRef.current = currentPoint;
    }
  }, [tool, brushSize, getScaledPoint, drawLine]);

  const handleCanvasMouseDown = useCallback((e: MouseEvent) => {
    if (!imageLoaded) return;
    isDrawingRef.current = true;
    saveToHistory();
    lastPointRef.current = null;
    drawAtPosition(e, true);
  }, [imageLoaded, saveToHistory, drawAtPosition]);

  const handleCanvasMouseMove = useCallback((e: MouseEvent) => {
    if (!isDrawingRef.current || !imageLoaded) return;
    drawAtPosition(e, false);
  }, [imageLoaded, drawAtPosition]);

  const handleCanvasMouseUp = useCallback(() => {
    isDrawingRef.current = false;
    setIsDrawing(false);
    lastPointRef.current = null;
  }, []);

  const handleCanvasMouseLeave = useCallback(() => {
    isDrawingRef.current = false;
    setIsDrawing(false);
    lastPointRef.current = null;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const loadImage = () => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = processedImageUrl || imageUrl;

      img.onload = () => {
        const maxSize = 512;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }

        const canvas = document.createElement('canvas');
        const originalCanvas = document.createElement('canvas');

        canvas.width = width;
        canvas.height = height;
        originalCanvas.width = width;
        originalCanvas.height = height;

        const ctx = canvas.getContext('2d');
        const originalCtx = originalCanvas.getContext('2d');

        if (ctx && originalCtx) {
          ctx.drawImage(img, 0, 0, width, height);
          originalCtx.drawImage(img, 0, 0, width, height);

          const imageData = ctx.getImageData(0, 0, width, height);
          setHistory([{ imageData }]);
          setHistoryIndex(0);
          setCanvasSize({ width, height });

          canvas.addEventListener('mousedown', handleCanvasMouseDown);
          canvas.addEventListener('mousemove', handleCanvasMouseMove);
          canvas.addEventListener('mouseup', handleCanvasMouseUp);
          canvas.addEventListener('mouseleave', handleCanvasMouseLeave);

          canvas.style.width = '100%';
          canvas.style.height = '100%';
          canvas.style.cursor = 'crosshair';

          container.innerHTML = '';
          container.appendChild(canvas);

          canvasRef.current = canvas;
          originalCanvasRef.current = originalCanvas;
          setImageLoaded(true);
        } else {
          console.error('Failed to get canvas context');
          setImageLoaded(true);
        }
      };

      img.onerror = () => {
        console.error('Failed to load image');
        setImageLoaded(true);
      };
    };

    loadImage();

    return () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.removeEventListener('mousedown', handleCanvasMouseDown);
        canvas.removeEventListener('mousemove', handleCanvasMouseMove);
        canvas.removeEventListener('mouseup', handleCanvasMouseUp);
        canvas.removeEventListener('mouseleave', handleCanvasMouseLeave);
      }
    };
  }, [imageUrl, processedImageUrl, handleCanvasMouseDown, handleCanvasMouseMove, handleCanvasMouseUp, handleCanvasMouseLeave]);

  const handleComplete = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    onComplete(dataUrl);
  }, [onComplete]);

  const drawCheckerboard = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const size = 20;
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#ffffff';
    for (let x = 0; x < width; x += size) {
      for (let y = 0; y < height; y += size) {
        if ((x + y) % (size * 2) === 0) {
          ctx.fillRect(x, y, size, size);
        }
      }
    }
  }, []);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !canvasRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawCheckerboard(ctx, canvas.width, canvas.height);

    const sourceCanvas = canvasRef.current;
    if (sourceCanvas.width > 0 && sourceCanvas.height > 0) {
      ctx.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height);
    }
  }, [imageLoaded, isDrawing, drawCheckerboard]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border-2 border-black">
        <div className="bg-gradient-to-r from-[#f472d0] to-purple-400 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="text-white" size={24} />
            <h3 className="text-xl font-bold text-white">手动修剪 ✨</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="text-white" size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex gap-6">
            <div className="flex-1 flex flex-col items-center">
              <div
                ref={containerRef}
                className="w-full max-w-lg aspect-square rounded-2xl overflow-hidden cursor-crosshair shadow-lg border-2 border-gray-200"
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, #e0e0e0 25%, transparent 25%),
                    linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #e0e0e0 75%),
                    linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)
                  `,
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                }}
              />
            </div>

            <div className="w-64 flex flex-col gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-600 mb-2">预览效果</p>
                <canvas
                  ref={previewCanvasRef}
                  width={150}
                  height={150}
                  className="w-full aspect-square rounded-xl border-2 border-gray-200"
                />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setTool('restore')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all border-2 ${
                      tool === 'restore'
                        ? 'bg-[#f472d0] text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#f472d0]'
                    }`}
                  >
                    <Brush size={18} />
                    <span>画笔</span>
                  </button>
                  <button
                    onClick={() => setTool('erase')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all border-2 ${
                      tool === 'erase'
                        ? 'bg-[#f472d0] text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#f472d0]'
                    }`}
                  >
                    <Eraser size={18} />
                    <span>橡皮</span>
                  </button>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">画笔大小</span>
                    <span className="text-sm text-gray-500">{brushSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#f472d0]"
                  />
                </div>

                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all border-2 ${
                    canUndo
                      ? 'bg-white text-gray-600 border-gray-200 hover:border-[#f472d0]'
                      : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  }`}
                >
                  <Undo size={18} />
                  <span>撤销</span>
                </button>
              </div>

              <div className="mt-auto flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  <X size={18} />
                  取消
                </button>
                <button
                  onClick={handleComplete}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-[#f472d0] text-white rounded-xl hover:bg-[#e85bb4] transition-colors font-medium border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                >
                  <Check size={18} />
                  完成修剪
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageMatting;
