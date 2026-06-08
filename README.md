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
