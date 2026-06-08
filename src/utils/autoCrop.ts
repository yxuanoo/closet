export const autoCropImage = async (imageUrl: string, tolerance: number = 30): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(imageUrl);
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      
      const cornerColors = [
        { r: pixels[0], g: pixels[1], b: pixels[2] },
        { r: pixels[(canvas.width - 1) * 4], g: pixels[(canvas.width - 1) * 4 + 1], b: pixels[(canvas.width - 1) * 4 + 2] },
        { r: pixels[(canvas.height - 1) * canvas.width * 4], g: pixels[(canvas.height - 1) * canvas.width * 4 + 1], b: pixels[(canvas.height - 1) * canvas.width * 4 + 2] },
        { r: pixels[(canvas.height - 1) * canvas.width * 4 + (canvas.width - 1) * 4], g: pixels[(canvas.height - 1) * canvas.width * 4 + (canvas.width - 1) * 4 + 1], b: pixels[(canvas.height - 1) * canvas.width * 4 + (canvas.width - 1) * 4 + 2] },
      ];
      
      const avgColor = {
        r: Math.round(cornerColors.reduce((sum, c) => sum + c.r, 0) / cornerColors.length),
        g: Math.round(cornerColors.reduce((sum, c) => sum + c.g, 0) / cornerColors.length),
        b: Math.round(cornerColors.reduce((sum, c) => sum + c.b, 0) / cornerColors.length),
      };
      
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        
        const diff = Math.abs(r - avgColor.r) + Math.abs(g - avgColor.g) + Math.abs(b - avgColor.b);
        
        if (diff < tolerance * 3) {
          pixels[i + 3] = 0;
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => {
      resolve(imageUrl);
    };
    
    img.src = imageUrl;
  });
};

export const removeBackground = async (imageUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(imageUrl);
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      
      const edgeThreshold = 50;
      const edgePixels: Set<number> = new Set();
      
      for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
          const idx = (y * canvas.width + x) * 4;
          const r = pixels[idx];
          const g = pixels[idx + 1];
          const b = pixels[idx + 2];
          
          const idxTop = ((y - 1) * canvas.width + x) * 4;
          const idxBottom = ((y + 1) * canvas.width + x) * 4;
          const idxLeft = (y * canvas.width + x - 1) * 4;
          const idxRight = (y * canvas.width + x + 1) * 4;
          
          const diffTop = Math.abs(r - pixels[idxTop]) + Math.abs(g - pixels[idxTop + 1]) + Math.abs(b - pixels[idxTop + 2]);
          const diffBottom = Math.abs(r - pixels[idxBottom]) + Math.abs(g - pixels[idxBottom + 1]) + Math.abs(b - pixels[idxBottom + 2]);
          const diffLeft = Math.abs(r - pixels[idxLeft]) + Math.abs(g - pixels[idxLeft + 1]) + Math.abs(b - pixels[idxLeft + 2]);
          const diffRight = Math.abs(r - pixels[idxRight]) + Math.abs(g - pixels[idxRight + 1]) + Math.abs(b - pixels[idxRight + 2]);
          
          if (diffTop > edgeThreshold || diffBottom > edgeThreshold || diffLeft > edgeThreshold || diffRight > edgeThreshold) {
            edgePixels.add(idx);
          }
        }
      }
      
      const visited = new Set<number>();
      const queue: number[] = [];
      
      for (let x = 0; x < canvas.width; x++) {
        queue.push(x * 4);
        queue.push(((canvas.height - 1) * canvas.width + x) * 4);
      }
      for (let y = 0; y < canvas.height; y++) {
        queue.push(y * canvas.width * 4);
        queue.push((y * canvas.width + canvas.width - 1) * 4);
      }
      
      while (queue.length > 0) {
        const idx = queue.shift()!;
        if (visited.has(idx)) continue;
        
        const y = Math.floor(idx / 4 / canvas.width);
        const x = (idx / 4) % canvas.width;
        
        if (y < 0 || y >= canvas.height || x < 0 || x >= canvas.width) continue;
        
        visited.add(idx);
        
        if (edgePixels.has(idx)) continue;
        
        pixels[idx + 3] = 0;
        
        queue.push(((y - 1) * canvas.width + x) * 4);
        queue.push(((y + 1) * canvas.width + x) * 4);
        queue.push((y * canvas.width + x - 1) * 4);
        queue.push((y * canvas.width + x + 1) * 4);
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => {
      resolve(imageUrl);
    };
    
    img.src = imageUrl;
  });
};