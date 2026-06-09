# Closet - AI Smart Wardrobe Manager

> AI管理你的衣樃

An intelligent wardrobe management app with on-device AI.

## ✨ Features

- **AI Clothing Recognition** - Upload photos, AI auto-detects category and color
- **AI Background Removal** - Powered by transformers.js (on-device, no API key needed)
- **Smart Color Analysis** - K-Means clustering for dominant colors
- **Closet Management** - Organize by category, color, season, location
- **Outfit Builder** - Drag & drop to create outfit combos
- **Calendar Check-in** - Track daily outfits
- **3D Avatar** - Virtual clothing display

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Tech Stack

React 19 + TypeScript, Vite 6, Tailwind CSS 4, @huggingface/transformers, Supabase, Lucide Icons

## AI Pipeline

1. Upload image
2. ViT model classifies clothing type
3. K-Means extracts dominant colors
4. DETR panoptic segmentation removes background
5. Review & confirm results

## License
yxuanoohahahha

## Product documents
[closet产品结构图.pdf](https://github.com/user-attachments/files/28737059/closet.pdf)

[closet产品功能结构图.pdf](https://github.com/user-attachments/files/28737071/closet.pdf)

## Product initial prototype
<img width="2880" height="1361" alt="6182044fac8cfce0df8ce40759593d72" src="https://github.com/user-attachments/assets/e089a63e-ab8a-4adf-b79c-1843a67ac9e2" />
<img width="2880" height="1366" alt="739d4e4fccef3c97821a2827397a1870" src="https://github.com/user-attachments/assets/ab965fbf-3b60-4d27-8f21-060337fda0b9" />
<img width="2880" height="1365" alt="e4a49d162b3a77f178430f97d7820480" src="https://github.com/user-attachments/assets/896dca14-f649-42c3-8ff6-7ba693d8df9a" />



