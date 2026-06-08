import React, { useState, useRef, useEffect } from 'react';

interface AvatarParams {
  height: number;
  weight: number;
  bust: number;
  waist: number;
  hips: number;
  skinTone: string;
  hairColor: string;
  hairStyle: string;
  faceShape: string;
}

interface VirtualAvatar3DProps {
  avatar: AvatarParams;
}

const VirtualAvatar3D: React.FC<VirtualAvatar3DProps> = ({ avatar }) => {
  const [rotation, setRotation] = useState({ x: -15, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;
      setRotation(prev => ({
        x: Math.max(-30, Math.min(30, prev.x - deltaY * 0.3)),
        y: prev.y + deltaX * 0.3
      }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const scaleFactor = avatar.height / 165;
  const bodyScale = 1 + (avatar.weight - 55) * 0.008;

  const getFaceWidth = () => {
    switch (avatar.faceShape) {
      case '圆形脸': return 1.1;
      case '方形脸': return 1.05;
      case '长形脸': return 0.9;
      case '心形脸': return 1.05;
      case '菱形脸': return 1.0;
      default: return 1.0;
    }
  };

  const getFaceHeight = () => {
    switch (avatar.faceShape) {
      case '圆形脸': return 0.95;
      case '方形脸': return 1.0;
      case '长形脸': return 1.15;
      case '心形脸': return 1.05;
      case '菱形脸': return 1.05;
      default: return 1.0;
    }
  };

  const getHairStyle = () => {
    switch (avatar.hairStyle) {
      case '短发': return { height: 6, width: 55, yOffset: 0 };
      case '长发': return { height: 28, width: 58, yOffset: -8 };
      case '波浪卷': return { height: 22, width: 60, yOffset: -5 };
      case '直发': return { height: 25, width: 56, yOffset: -6 };
      case '丸子头': return { height: 18, width: 52, yOffset: -3 };
      case '马尾': return { height: 30, width: 54, yOffset: -10 };
      default: return { height: 28, width: 58, yOffset: -8 };
    }
  };

  const hairStyle = getHairStyle();

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div
        className="relative w-64 h-80 cursor-grab active:cursor-grabbing"
        style={{ perspective: '1200px' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        <div
          className="absolute inset-0"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          <div
            className="absolute left-1/2 top-6 rounded-full"
            style={{
              width: `${50 * scaleFactor * getFaceWidth()}px`,
              height: `${55 * scaleFactor * getFaceHeight()}px`,
              left: '50%',
              top: `${12 * scaleFactor}px`,
              transform: 'translate(-50%, -50%) translateZ(55px)',
              backgroundColor: avatar.skinTone,
              boxShadow: '0 10px 35px rgba(0,0,0,0.18)'
            }}
          >
            <div
              className="absolute"
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: `radial-gradient(circle at 30% 30%, ${avatar.skinTone} 0%, ${avatar.skinTone} 40%, ${adjustColor(avatar.skinTone, -20)} 100%)`
              }}
            />

            <div
              className="absolute rounded-full bg-gray-800"
              style={{
                width: `${9 * scaleFactor}px`,
                height: `${10 * scaleFactor}px`,
                top: `${14 * scaleFactor}px`,
                left: `${10 * scaleFactor}px`,
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)'
              }}
            >
              <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-white/80" />
            </div>
            <div
              className="absolute rounded-full bg-gray-800"
              style={{
                width: `${9 * scaleFactor}px`,
                height: `${10 * scaleFactor}px`,
                top: `${14 * scaleFactor}px`,
                right: `${10 * scaleFactor}px`,
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)'
              }}
            >
              <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-white/80" />
            </div>

            <div
              className="absolute"
              style={{
                width: `${8 * scaleFactor}px`,
                height: `${4 * scaleFactor}px`,
                top: `${8 * scaleFactor}px`,
                left: `${12 * scaleFactor}px`,
                borderTop: `2px solid ${adjustColor(avatar.skinTone, -40)}`,
                borderRadius: '50%',
                transform: 'rotate(-15deg)'
              }}
            />
            <div
              className="absolute"
              style={{
                width: `${8 * scaleFactor}px`,
                height: `${4 * scaleFactor}px`,
                top: `${8 * scaleFactor}px`,
                right: `${12 * scaleFactor}px`,
                borderTop: `2px solid ${adjustColor(avatar.skinTone, -40)}`,
                borderRadius: '50%',
                transform: 'rotate(15deg)'
              }}
            />

            <div
              className="absolute rounded-full"
              style={{
                width: `${6 * scaleFactor}px`,
                height: `${5 * scaleFactor}px`,
                top: `${28 * scaleFactor}px`,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: adjustColor(avatar.skinTone, -30)
              }}
            />

            <div
              className="absolute"
              style={{
                width: `${14 * scaleFactor}px`,
                height: `${8 * scaleFactor}px`,
                top: `${36 * scaleFactor}px`,
                left: '50%',
                transform: 'translateX(-50%)',
                borderRadius: '0 0 50% 50%',
                backgroundColor: '#FFB6C1',
                boxShadow: 'inset 0 -2px 4px rgba(255,100,100,0.5)'
              }}
            />

            <div
              className="absolute rounded-full"
              style={{
                width: `${16 * scaleFactor}px`,
                height: `${8 * scaleFactor}px`,
                top: `${12 * scaleFactor}px`,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(255,200,200,0.5)',
                borderRadius: '50%'
              }}
            />
          </div>

          <div
            className="absolute left-1/2"
            style={{
              width: `${hairStyle.width * scaleFactor}px`,
              height: `${hairStyle.height * scaleFactor}px`,
              top: `${hairStyle.yOffset * scaleFactor}px`,
              left: '50%',
              transform: 'translate(-50%, 0) translateZ(60px)',
              backgroundColor: avatar.hairColor,
              borderRadius: avatar.hairStyle === '短发' ? '50% 50% 40% 40%' : '50% 50% 30% 30%'
            }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `linear-gradient(180deg, ${adjustColor(avatar.hairColor, 20)} 0%, ${avatar.hairColor} 50%, ${adjustColor(avatar.hairColor, -20)} 100%)`
              }}
            />
            {avatar.hairStyle === '波浪卷' && (
              <div className="absolute inset-2">
                <div className="absolute top-2 left-4 w-8 h-6 rounded-full bg-black/10" />
                <div className="absolute top-4 right-4 w-6 h-8 rounded-full bg-black/10" />
              </div>
            )}
            {avatar.hairStyle === '马尾' && (
              <div
                className="absolute"
                style={{
                  width: `${20 * scaleFactor}px`,
                  height: `${35 * scaleFactor}px`,
                  top: `${25 * scaleFactor}px`,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: avatar.hairColor,
                  borderRadius: '20%',
                  background: `linear-gradient(180deg, ${avatar.hairColor} 0%, ${adjustColor(avatar.hairColor, -15)} 100%)`
                }}
              />
            )}
          </div>

          <div
            className="absolute left-1/2 rounded-t-3xl"
            style={{
              width: `${45 * scaleFactor * bodyScale}px`,
              height: `${70 * scaleFactor}px`,
              top: `${60 * scaleFactor}px`,
              left: '50%',
              transform: 'translate(-50%, 0) translateZ(35px)',
              backgroundColor: avatar.skinTone,
              boxShadow: '0 10px 30px rgba(0,0,0,0.12)'
            }}
          >
            <div
              className="absolute inset-0 rounded-t-3xl"
              style={{
                background: `radial-gradient(ellipse at 50% 0%, ${adjustColor(avatar.skinTone, 10)} 0%, ${avatar.skinTone} 50%)`
              }}
            />
          </div>

          <div
            className="absolute left-1/2 rounded-lg"
            style={{
              width: `${35 * scaleFactor * bodyScale}px`,
              height: `${55 * scaleFactor}px`,
              top: `${125 * scaleFactor}px`,
              left: '50%',
              transform: 'translate(-50%, 0) translateZ(28px)',
              backgroundColor: avatar.skinTone,
              boxShadow: '0 6px 20px rgba(0,0,0,0.08)'
            }}
          />

          <div
            className="absolute left-1/2 rounded-b-2xl"
            style={{
              width: `${48 * scaleFactor * bodyScale}px`,
              height: `${50 * scaleFactor}px`,
              top: `${175 * scaleFactor}px`,
              left: '50%',
              transform: 'translate(-50%, 0) translateZ(22px)',
              backgroundColor: avatar.skinTone,
              boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
            }}
          />

          <div
            className="absolute rounded-lg"
            style={{
              width: `${16 * scaleFactor}px`,
              height: `${60 * scaleFactor}px`,
              top: `${60 * scaleFactor}px`,
              left: `${-28 * scaleFactor}px`,
              transform: `skewY(10deg) translateZ(-18px)`,
              backgroundColor: avatar.skinTone,
              boxShadow: '4px 4px 18px rgba(0,0,0,0.08)'
            }}
          />
          <div
            className="absolute rounded-lg"
            style={{
              width: `${16 * scaleFactor}px`,
              height: `${60 * scaleFactor}px`,
              top: `${60 * scaleFactor}px`,
              right: `${-28 * scaleFactor}px`,
              transform: `skewY(-10deg) translateZ(-18px)`,
              backgroundColor: avatar.skinTone,
              boxShadow: '-4px 4px 18px rgba(0,0,0,0.08)'
            }}
          />

          <div
            className="absolute rounded-lg"
            style={{
              width: `${14 * scaleFactor}px`,
              height: `${70 * scaleFactor}px`,
              top: `${218 * scaleFactor}px`,
              left: `${-18 * scaleFactor}px`,
              transform: `skewX(-6deg) translateZ(-22px)`,
              backgroundColor: '#4169E1',
              boxShadow: '4px 6px 18px rgba(0,0,0,0.12)'
            }}
          />
          <div
            className="absolute rounded-lg"
            style={{
              width: `${14 * scaleFactor}px`,
              height: `${70 * scaleFactor}px`,
              top: `${218 * scaleFactor}px`,
              right: `${-18 * scaleFactor}px`,
              transform: `skewX(6deg) translateZ(-22px)`,
              backgroundColor: '#4169E1',
              boxShadow: '-4px 6px 18px rgba(0,0,0,0.12)'
            }}
          />

          <div
            className="absolute"
            style={{
              width: `${55 * scaleFactor}px`,
              height: `${40 * scaleFactor}px`,
              top: `${195 * scaleFactor}px`,
              left: '50%',
              transform: 'translate(-50%, 0) translateZ(18px)',
              backgroundColor: '#FF6B9D',
              borderRadius: '20px 20px 0 0',
              boxShadow: '0 -3px 15px rgba(255,107,157,0.3)'
            }}
          >
            <div className="absolute inset-x-2 top-2 h-1 bg-white/30 rounded-full" />
            <div className="absolute inset-x-4 top-6 h-2 bg-white/20 rounded-full" />
          </div>

          <div
            className="absolute rounded-xl"
            style={{
              width: `${55 * scaleFactor}px`,
              height: `${18 * scaleFactor}px`,
              bottom: '-12px',
              left: '50%',
              transform: 'translate(-50%, 0) translateZ(-30px)',
              backgroundColor: 'rgba(0,0,0,0.12)',
              filter: 'blur(10px)'
            }}
          />
        </div>
      </div>
    </div>
  );
};

function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

export default VirtualAvatar3D;
