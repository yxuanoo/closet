function createTestImageData(width: number, height: number, r: number, g: number, b: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }
  return new ImageData(data, width, height);
}

function createGradientImageData(width: number, height: number, startColor: [number, number, number], endColor: [number, number, number]): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const t = y / height;
      data[idx] = Math.round(startColor[0] * (1 - t) + endColor[0] * t);
      data[idx + 1] = Math.round(startColor[1] * (1 - t) + endColor[1] * t);
      data[idx + 2] = Math.round(startColor[2] * (1 - t) + endColor[2] * t);
      data[idx + 3] = 255;
    }
  }
  return new ImageData(data, width, height);
}

function createEdgeImageData(width: number, height: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (x < width / 2) {
        data[idx] = 200;
        data[idx + 1] = 200;
        data[idx + 2] = 200;
      } else {
        data[idx] = 50;
        data[idx + 1] = 50;
        data[idx + 2] = 50;
      }
      data[idx + 3] = 255;
    }
  }
  return new ImageData(data, width, height);
}

function dataUrlFromImageData(imageData: ImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  }
  return '';
}

export async function runTests() {
  console.log('=== AI 识别逻辑测试 ===\n');

  console.log('1. 颜色识别测试');
  console.log('---');
  
  const redImageData = createTestImageData(100, 100, 255, 50, 50);
  const redDataUrl = dataUrlFromImageData(redImageData);
  const redFile = await fetch(redDataUrl).then(res => res.blob()).then(blob => new File([blob], 'red.png', { type: 'image/png' }));
  
  console.log('红色图片准备完成');

  const blueImageData = createTestImageData(100, 100, 50, 50, 255);
  const blueDataUrl = dataUrlFromImageData(blueImageData);
  const blueFile = await fetch(blueDataUrl).then(res => res.blob()).then(blob => new File([blob], 'blue.png', { type: 'image/png' }));
  
  console.log('蓝色图片准备完成');

  console.log('\n2. 类别识别测试（基于图像特征）');
  console.log('---');

  const dressImageData = createTestImageData(100, 200, 255, 180, 180);
  const dressDataUrl = dataUrlFromImageData(dressImageData);
  const dressFile = await fetch(dressDataUrl).then(res => res.blob()).then(blob => new File([blob], 'dress.png', { type: 'image/png' }));
  
  console.log('竖版图片 (100x200, 高宽比=2.0) -> 预期识别为连衣裙');

  const pantsImageData = createTestImageData(200, 100, 80, 80, 80);
  const pantsDataUrl = dataUrlFromImageData(pantsImageData);
  const pantsFile = await fetch(pantsDataUrl).then(res => res.blob()).then(blob => new File([blob], 'pants.png', { type: 'image/png' }));
  
  console.log('横版图片 (200x100, 高宽比=0.5) -> 预期识别为裤子');

  console.log('\n3. 测试说明');
  console.log('---');
  console.log('实际测试请通过上传真实衣物图片进行验证');
  console.log('当前基于图像特征的识别逻辑包括：');
  console.log('- 宽高比分析（竖版可能是连衣裙，横版可能是裤子）');
  console.log('- 明暗比例分析（深色可能是外套）');
  console.log('- 边缘密度分析（配饰边缘较少）');

  console.log('\n=== 测试完成 ===');
}
