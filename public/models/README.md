# AI 模型文件

## 背景去除模型（BRIA RMBG-1.4）

### 模型下载

1. 访问 Hugging Face Hub: https://huggingface.co/briaai/RMBG-1.4
2. 下载 `model.onnx` 文件
3. 重命名为 `rmbg-1.4.onnx`
4. 放置在此目录下

### 模型说明

- **模型名称**: BRIA RMBG-1.4
- **输入尺寸**: 1024x1024 (会自动根据内存情况降级到 512x512)
- **输入格式**: 1x3xHxW, 像素值归一化到 [0, 1]
- **输出格式**: 1x1xHxW, 值域 [0, 1]，直接作为 alpha 通道 (1=前景, 0=背景)
- **模型大小**: 约 150MB

### 自动降级机制

当检测到设备内存不足时，会自动降级到 512x512 输入尺寸，以保证在低配置设备上也能正常运行。

### 本地部署

将模型文件放在 `public/models/rmbg-1.4.onnx` 即可。如果文件不存在，系统会自动从远程 URL 加载。

### 配置

在 `src/components/clothes/intake/clothingPipeline.ts` 中可以修改：
- `MODEL_PATH`: 本地模型路径
- `FALLBACK_URL`: 远程 fallback URL