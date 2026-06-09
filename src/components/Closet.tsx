import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, Camera, Image as ImageIcon, ShoppingBag, Shirt, 
  CircleDot, Sparkles, X, Check, Star, Thermometer, 
  Save, Palette, User, ChevronRight, ChevronLeft, Plus,
  RotateCcw, Wand2, Layers, Package, Tag, ArrowLeft,
  Home, Heart, Calendar, LogIn, LogOut, Eye, EyeOff,
  AlertCircle, AlertTriangle, Brush, Eraser, Move, HelpCircle,
  PackageCheck, Edit2, MousePointerClick, Download, Settings, Trash2
} from 'lucide-react';
import VirtualAvatar3D from './VirtualAvatar3D';
import ClothingIntake from './clothes/intake/ClothingIntake';

import { smartRecognizeClothing } from '../utils/clothingRecognizer';
import { removeBackground } from '../utils/autoCrop';
import { supabaseAuth, supabaseData } from '../lib/supabase';

const getFallbackImage = (seed: string, size: number = 200): string => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color = colors[hash % colors.length];
  const initial = seed.charAt(0).toUpperCase();
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${size} ${size}'%3E%3Crect fill='${color}' width='${size}' height='${size}' rx='${size/2}'/%3E%3Ctext fill='white' font-family='Arial' font-size='${size/2.5}' font-weight='bold' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3E${initial}%3C/text%3E%3C/svg%3E`;
};

const adjectives = ['快乐的', '可爱的', '聪明的', '温柔的', '勇敢的', '活泼的', '安静的', '友善的', '神秘的', '阳光的'];
const nouns = ['小猫', '小狗', '小兔', '小熊', '小鹿', '小鸟', '海豚', '蝴蝶', '云朵', '星星', '月亮', '彩虹', '糖果', '蛋糕'];

const generateRandomUsername = (): string => {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adjective}${noun}${num}`;
};

interface ClothingItem {
  id: string;
  name: string;
  category: 'top' | 'bottom' | 'dress' | 'outerwear' | 'accessory' | 'shoes' | 'hat' | 'bag' | 'underwear' | 'skirt' | 'suit';
  image: string;
  color: string;
  brand?: string;
  price?: string;
  tags: string[];
  suitableTemp?: string;
  location?: string;
  detailLocation?: string;
  season?: string;
  isFavorite?: boolean;
}

interface Outfit {
  id: string;
  name: string;
  items: string[];
  rating: number;
  suitableTemp: string;
  occasion?: string;
  createdAt: string;
  season?: string;
  scene?: string;
  style?: string;
  mainImage?: string;
}

const seasonOptions = ['春', '夏', '秋', '冬'];
const sceneOptions = ['职场', '约会', '校园', '运动', '派对', '休闲', '正式', '旅行', '日常'];
const styleOptions = ['甜美', '酷飒', '甜酷', '极简', '复古', '日系', '韩系', '法式', '街头', '随意'];

interface CanvasOutfitItem {
  id: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  width: number;
  height: number;
}

interface AvatarSettings {
  height: number;
  weight: number;
  bust: number;
  waist: number;
  hips: number;
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  faceShape: string;
}

interface Location {
  id: string;
  name: string;
  description: string;
  clothesCount: number;
  tags: string[];
}

interface CheckinEntry {
  date: string;
  outfitImage?: string;
  outfitId?: string;
  mood?: string;
  activities: string[];
  diary?: string;
}

const categoryIcons = {
  top: Shirt,
  bottom: CircleDot,
  dress: Package,
  outerwear: Layers,
  accessory: Tag,
  shoes: CircleDot,
  hat: PackageCheck,
  bag: ShoppingBag,
  underwear: Shirt,
  skirt: Package,
  suit: Layers,
};

const categoryNames = {
  top: '上装',
  bottom: '裤子',
  dress: '连衣裙',
  outerwear: '外套',
  accessory: '配饰',
  shoes: '鞋子',
  hat: '帽子',
  bag: '包袋',
  underwear: '内衣',
  skirt: '裙子',
  suit: '套装',
};

const skinTones = ['#FFE4C4', '#F5DEB3', '#DEB887', '#D2691E', '#CD853F', '#A0522D'];
const hairStyles = ['短发', '长发', '波浪卷', '直发', '丸子头', '马尾'];
const hairColors = ['#000000', '#8B4513', '#DAA520', '#FFD700', '#FF6B6B', '#9370DB'];
const faceShapes = ['圆形脸', '方形脸', '长形脸', '心形脸', '菱形脸', '椭圆形脸'];

const initialClothes: ClothingItem[] = [
  { id: '1', name: '白色T恤', category: 'top', image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=white%20casual%20t-shirt%20fashion%20product%20photo%20white%20background&image_size=square', color: '#FFFFFF', tags: ['休闲', '日常'], suitableTemp: '20-30°C' },
  { id: '2', name: '蓝色牛仔裤', category: 'bottom', image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=blue%20jeans%20fashion%20product%20photo%20white%20background&image_size=square', color: '#4169E1', tags: ['休闲', '百搭'], suitableTemp: '15-25°C' },
  { id: '3', name: '黑色连衣裙', category: 'dress', image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=black%20elegant%20dress%20fashion%20product%20photo%20white%20background&image_size=square', color: '#000000', tags: ['正式', '晚宴'], suitableTemp: '18-28°C' },
  { id: '4', name: '米色风衣', category: 'outerwear', image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=beige%20trench%20coat%20fashion%20product%20photo%20white%20background&image_size=square', color: '#F5F5DC', tags: ['通勤', '春秋'], suitableTemp: '10-20°C' },
  { id: '5', name: '白色运动鞋', category: 'shoes', image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=white%20sneakers%20fashion%20product%20photo%20white%20background&image_size=square', color: '#FFFFFF', tags: ['运动', '休闲'], suitableTemp: '15-30°C' },
  { id: '6', name: '黑色小西装', category: 'outerwear', image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=black%20blazer%20fashion%20product%20photo%20white%20background&image_size=square', color: '#000000', tags: ['职场', '正式'], suitableTemp: '15-25°C' },
  { id: '7', name: '条纹衬衫', category: 'top', image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=striped%20shirt%20fashion%20product%20photo%20white%20background&image_size=square', color: '#696969', tags: ['职场', '休闲'], suitableTemp: '18-28°C' },
  { id: '8', name: '黑色高跟鞋', category: 'shoes', image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=black%20high%20heels%20fashion%20product%20photo%20white%20background&image_size=square', color: '#000000', tags: ['正式', '晚宴'], suitableTemp: '20-30°C' },
];

interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  avatar: string;
  clothes: ClothingItem[];
  outfits: Outfit[];
  locations: Location[];
}



const initialOutfits: Outfit[] = [
  { id: '1', name: '日常休闲', items: ['1', '2', '5'], rating: 4, suitableTemp: '20-28°C', createdAt: '2024-01-15' },
  { id: '2', name: '职场穿搭', items: ['7', '2', '6'], rating: 5, suitableTemp: '18-25°C', createdAt: '2024-01-14' },
];

const AMAP_API_KEY = '792d2e6206887bd2de16b7aba390b0fa';

const cities = [
  '北京', '上海', '广州', '深圳', '杭州', '成都', '重庆', '武汉', '南京', '西安',
  '苏州', '天津', '郑州', '长沙', '青岛', '济南', '沈阳', '大连', '合肥', '福州',
  '厦门', '哈尔滨', '长春', '石家庄', '太原', '南宁', '昆明', '贵阳', '南昌', '无锡',
  '宁波', '佛山', '东莞', '珠海', '中山', '惠州', '温州', '绍兴', '嘉兴', '常州',
  '徐州', '南通', '烟台', '潍坊', '临沂', '泉州', '金华', '台州', '镇江', '扬州'
];

const Closet: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const [activeTab, setActiveTab] = useState<'home' | 'closet' | 'locations' | 'outfits' | 'checkin'>('home');
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [isOutfitBatchDeleteMode, setIsOutfitBatchDeleteMode] = useState(false);
  const [selectedOutfits, setSelectedOutfits] = useState<string[]>([]);
  const [showOutfitDeleteConfirmModal, setShowOutfitDeleteConfirmModal] = useState(false);
  const [showOutfitDetailModal, setShowOutfitDetailModal] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [isEditingOutfit, setIsEditingOutfit] = useState(false);
  const [editedOutfitName, setEditedOutfitName] = useState('');
  const [editedOutfitOccasion, setEditedOutfitOccasion] = useState('');
  const [editedOutfitTemp, setEditedOutfitTemp] = useState('');
  const [editedOutfitSeason, setEditedOutfitSeason] = useState('');
  const [editedOutfitStyle, setEditedOutfitStyle] = useState('');
  const ignoreNextCardTap = useRef(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedClothes, setSelectedClothes] = useState<string[]>([]);
  const [isBatchDeleteMode, setIsBatchDeleteMode] = useState(false);
  const [showClothingDeleteConfirmModal, setShowClothingDeleteConfirmModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSaveOutfitModal, setShowSaveOutfitModal] = useState(false);
  const [showOutfitCanvas, setShowOutfitCanvas] = useState(false);
  const [canvasItems, setCanvasItems] = useState<CanvasOutfitItem[]>([]);
  const [selectedCanvasItemId, setSelectedCanvasItemId] = useState<string | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingItemId, setResizingItemId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const [outfitCategory, setOutfitCategory] = useState<string | null>(null);
  const [outfitOccasion, setOutfitOccasion] = useState('');
  const [showOutfitInfoModal, setShowOutfitInfoModal] = useState(false);
  
  const [outfitSeason, setOutfitSeason] = useState('四季');
  const [outfitScene, setOutfitScene] = useState('');
  const [outfitStyle, setOutfitStyle] = useState('');
  
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedScenes, setSelectedScenes] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  
  const [showBlindBoxModal, setShowBlindBoxModal] = useState(false);
  const [isBlindBoxAnimating, setIsBlindBoxAnimating] = useState(false);
  const [blindBoxResult, setBlindBoxResult] = useState<ClothingItem | Outfit | null>(null);
  const [blindBoxType, setBlindBoxType] = useState<'clothing' | 'outfit'>('clothing');
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showClothingDetailModal, setShowClothingDetailModal] = useState(false);
  const [selectedClothing, setSelectedClothing] = useState<ClothingItem | null>(null);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [editedClothing, setEditedClothing] = useState<ClothingItem | null>(null);
  const [newOutfitName, setNewOutfitName] = useState('');
  const [selectedTemp, setSelectedTemp] = useState('20-28°C');
  const [outfitRating, setOutfitRating] = useState(0);
  const [editingOutfitId, setEditingOutfitId] = useState<string | null>(null);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [weather, setWeather] = useState<{ city: string; temperature: number; description: string; icon: string } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [searchCity, setSearchCity] = useState('');
  const [showCitySearch, setShowCitySearch] = useState(false);
  const citySuggestions = searchCity 
    ? cities.filter(city => city.includes(searchCity)).slice(0, 8)
    : [];
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [showStorageDetailModal, setShowStorageDetailModal] = useState(false);
  const [selectedStorage, setSelectedStorage] = useState<Location | null>(null);
  
  const [isAutoCropping, setIsAutoCropping] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [allTags, setAllTags] = useState<string[]>(['AI识别', '抠图', '已添加', '甜美少女', '休闲', '正式', '运动', '复古']);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deletingLocationId, setDeletingLocationId] = useState<string | null>(null);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationDesc, setNewLocationDesc] = useState('');
  const [newLocationTags, setNewLocationTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  
  const [uploadStep, setUploadStep] = useState<'upload' | 'crop' | 'recognize' | 'edit'>('upload');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [savedMaskState, setSavedMaskState] = useState<string | null>(null);
  const [recognizedItems, setRecognizedItems] = useState<ClothingItem[]>([]);
  const [editingClothing, setEditingClothing] = useState<ClothingItem | null>(null);
  const [editEntryFrom, setEditEntryFrom] = useState<'ai' | 'crop' | null>(null);
  const [showSmartIntake, setShowSmartIntake] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const outfitCanvasRef = useRef<HTMLDivElement>(null);
  const [cropTool, setCropTool] = useState<'brush' | 'eraser' | 'magic' | 'move'>('brush');
  const [cropBrushSize, setCropBrushSize] = useState(20);
  const [cropTolerance, setCropTolerance] = useState(30);
  const [cropIsDrawing, setCropIsDrawing] = useState(false);
  const [cropScale, setCropScale] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropIsDragging, setCropIsDragging] = useState(false);
  const [cropLastPos, setCropLastPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!draggingItemId || resizingItemId || !outfitCanvasRef.current) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const rect = outfitCanvasRef.current!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      setCanvasItems(prev => prev.map(item => {
        if (item.id === draggingItemId) {
          return {
            ...item,
            x: mouseX - dragOffset.x - 50 * item.scale,
            y: mouseY - dragOffset.y - 60 * item.scale,
          };
        }
        return item;
      }));
    };

    const handleGlobalMouseUp = () => {
      setDraggingItemId(null);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggingItemId, dragOffset, resizingItemId]);
  const [cropHistory, setCropHistory] = useState<string[]>([]);
  const [cropRedoStack, setCropRedoStack] = useState<string[]>([]);

  useEffect(() => {
    if (showUploadModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showUploadModal]);

  const resetUploadState = () => {
    setUploadStep('upload');
    setUploadedImage(null);
    setRecognizedItems([]);
    setEditingClothing(null);
  };
  const [avatar, setAvatar] = useState<AvatarSettings>({
    height: 0,
    weight: 0,
    bust: 0,
    waist: 0,
    hips: 0,
    skinTone: '#F5DEB3',
    hairStyle: '长发',
    hairColor: '#8B4513',
    faceShape: '椭圆形脸',
  });
  const [showDiaryCalendar, setShowDiaryCalendar] = useState(false);
  const [calendarPosition, setCalendarPosition] = useState({ x: 0, y: 0, showAbove: false });
  const [diaryEntries, setDiaryEntries] = useState<Record<string, string>>({});
  
  const [checkinEntries, setCheckinEntries] = useState<Record<string, CheckinEntry>>({});
  const [selectedCheckinDate, setSelectedCheckinDate] = useState<string | null>(new Date().toISOString().split('T')[0]);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinMood, setCheckinMood] = useState('');
  const [checkinActivity, setCheckinActivity] = useState('');
  const [checkinDiary, setCheckinDiary] = useState('');
    const [checkinOutfitImage, setCheckinOutfitImage] = useState<string | null>(null);
    const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());
  const [showOutfitSelector, setShowOutfitSelector] = useState(false);
  
  const [loginMode, setLoginMode] = useState<'guest-login' | 'guest-register' | 'forgot-password'>('guest-login');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);
  
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showBodyStatsEditor, setShowBodyStatsEditor] = useState(false);
  const [accountSettingsStep, setAccountSettingsStep] = useState<'profile' | 'password'>('profile');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  
  const [passwordResetStep, setPasswordResetStep] = useState<'verify' | 'password'>('verify');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeSuccess, setCodeSuccess] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(0);

  const requireLogin = (action?: () => void) => {
    if (!currentUser) {
      setShowLoginModal(true);
      return false;
    }
    if (action) {
      action();
    }
    return true;
  };

  const navItems = [
    { id: 'home' as const, label: '首页', icon: Home },
    { id: 'closet' as const, label: '我的衣物', icon: Shirt },
    { id: 'outfits' as const, label: '我的搭配', icon: Layers },
    { id: 'locations' as const, label: '我的收纳', icon: Package },
    { id: 'checkin' as const, label: '我的打卡', icon: Calendar },
  ];

  const handleUpload = (platform: string) => {
    alert(`正在从${platform}导入服饰...\n\n功能开发中，敬请期待！`);
    setShowUploadModal(false);
  };

  const handleAddLocation = async () => {
    if (!newLocationName.trim() || !currentUser) return;
    
    if (editingLocation) {
      const updatedLocation: Location = {
        ...editingLocation,
        name: newLocationName,
        description: newLocationDesc,
        tags: newLocationTags,
      };
      
      await supabaseData.updateLocation(editingLocation.id, {
        user_id: currentUser.id,
        name: updatedLocation.name,
        description: updatedLocation.description,
        tags: updatedLocation.tags,
      }, currentUser.id);
      
      setLocations(prev => prev.map(loc => loc.id === editingLocation.id ? updatedLocation : loc));
    } else {
      const newLocation: Location = {
        id: Date.now().toString(),
        name: newLocationName,
        description: newLocationDesc,
        clothesCount: 0,
        tags: newLocationTags,
      };
      
      await supabaseData.addLocation({
        user_id: currentUser.id,
        name: newLocation.name,
        description: newLocation.description,
        clothes_count: newLocation.clothesCount,
        tags: newLocation.tags,
      });
      
      setLocations(prev => [...prev, newLocation]);
    }
    
    setShowAddLocationModal(false);
    setNewLocationName('');
    setNewLocationDesc('');
    setNewLocationTags([]);
    setEditingLocation(null);
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setNewLocationName(location.name);
    setNewLocationDesc(location.description);
    setNewLocationTags([...location.tags]);
    setShowAddLocationModal(true);
  };

  const handleDeleteLocation = (locationId: string) => {
    setDeletingLocationId(locationId);
    setShowDeleteConfirmModal(true);
  };

  const confirmDelete = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('点击确认删除位置，ID:', deletingLocationId);
    
    try {
      if (deletingLocationId) {
        await supabaseData.deleteLocation(deletingLocationId);
        setLocations(prev => prev.filter(l => l.id !== deletingLocationId));
    }
      setShowDeleteConfirmModal(false);
      setDeletingLocationId(null);
      console.log('删除位置完成');
    } catch (error) {
      console.error('删除位置失败:', error);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirmModal(false);
    setDeletingLocationId(null);
  };

  const toggleLocationTag = (tag: string) => {
    setNewLocationTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const trimmedTag = customTagInput.trim();
    if (trimmedTag && !newLocationTags.includes(trimmedTag)) {
      setNewLocationTags(prev => [...prev, trimmedTag]);
      setCustomTagInput('');
    }
  };

  const removeCustomTag = (tag: string) => {
    setNewLocationTags(prev => prev.filter(t => t !== tag));
  };

  const addToCanvas = (itemId: string) => {
    const existing = canvasItems.find(item => item.id === itemId);
    if (existing) return;
    setCanvasItems(prev => [...prev, {
      id: itemId,
      x: 200 + Math.random() * 150,
      y: 150 + Math.random() * 100,
      width: 200,
      height: 240,
      scale: 1.2,
      rotation: 0,
    }]);
  };

  const removeFromCanvas = (itemId: string) => {
    setCanvasItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleCanvasMouseDown = (e: React.MouseEvent, itemId: string) => {
    if ((e.target as HTMLElement).closest('[data-resize-handle]')) return;
    const canvasEl = (e.target as HTMLElement).closest('[data-canvas]');
    if (!canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const item = canvasItems.find(i => i.id === itemId);
    if (!item) return;
    const itemCenterX = item.x + item.width / 2;
    const itemCenterY = item.y + item.height / 2;
    setDraggingItemId(itemId);
    setDragOffset({ x: mouseX - itemCenterX, y: mouseY - itemCenterY });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!draggingItemId) return;
    const canvasEl = (e.target as HTMLElement).closest('[data-canvas]');
    if (!canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setCanvasItems(prev => prev.map(item => {
      if (item.id === draggingItemId) {
        return {
          ...item,
          x: mouseX - dragOffset.x - 50 * item.scale,
          y: mouseY - dragOffset.y - 60 * item.scale,
        };
      }
      return item;
    }));
  };

  const handleCanvasMouseUp = () => {
    setDraggingItemId(null);
    setResizingItemId(null);
  };

  const handleResizeStart = (e: React.MouseEvent, itemId: string, direction: string) => {
    e.stopPropagation();
    setSelectedCanvasItemId(itemId);
    setResizeDirection(direction);
    const item = canvasItems.find(i => i.id === itemId);
    if (!item) return;
    setResizingItemId(itemId);
    setResizeStart({ x: e.clientX, y: e.clientY, width: item.width, height: item.height });
  };

  const handleRemoveFromCanvas = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    removeFromCanvas(itemId);
    setSelectedCanvasItemId(null);
  };

  // 键盘事件监听 - Delete键删除选中项
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showOutfitCanvas) return;
      
      // Delete键删除选中项
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedCanvasItemId) {
          e.preventDefault();
          removeFromCanvas(selectedCanvasItemId);
          setSelectedCanvasItemId(null);
        }
      }
      
      // Ctrl+Z 撤销（可选）
      // Escape 取消选中
      if (e.key === 'Escape') {
        setSelectedCanvasItemId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showOutfitCanvas, selectedCanvasItemId]);

  // 图层顺序管理
  const bringToFront = (itemId: string) => {
    setCanvasItems(prev => {
      const item = prev.find(i => i.id === itemId);
      if (!item) return prev;
      const others = prev.filter(i => i.id !== itemId);
      return [...others, item]; // 移到最后（最上层）
    });
  };

  const sendToBack = (itemId: string) => {
    setCanvasItems(prev => {
      const item = prev.find(i => i.id === itemId);
      if (!item) return prev;
      const others = prev.filter(i => i.id !== itemId);
      return [item, ...others]; // 移到最前（最下层）
    });
  };

  const bringForward = (itemId: string) => {
    setCanvasItems(prev => {
      const index = prev.findIndex(i => i.id === itemId);
      if (index === -1 || index === prev.length - 1) return prev;
      const newItems = [...prev];
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
      return newItems;
    });
  };

  const sendBackward = (itemId: string) => {
    setCanvasItems(prev => {
      const index = prev.findIndex(i => i.id === itemId);
      if (index === -1 || index === 0) return prev;
      const newItems = [...prev];
      [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
      return newItems;
    });
  };

  // 导出搭配JSON
  const exportOutfitJSON = () => {
    const outfitData = {
      items: canvasItems.map(item => {
        const cloth = clothes.find(c => c.id === item.id);
        return {
          id: item.id,
          name: cloth?.name || '',
          imageUrl: cloth?.image || '',
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
        };
      }),
      exportedAt: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(outfitData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `outfit_${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // 导入搭配JSON
  const importOutfitJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.items && Array.isArray(json.items)) {
          // 尝试匹配衣物
          const newItems: CanvasOutfitItem[] = [];
          for (const item of json.items) {
            // 先尝试通过ID匹配
            let cloth = clothes.find(c => c.id === item.id);
            // 如果ID不匹配，尝试通过名称匹配
            if (!cloth && item.name) {
              cloth = clothes.find(c => c.name === item.name);
            }
            // 如果还是不匹配，尝试通过图片URL匹配
            if (!cloth && item.imageUrl) {
              cloth = clothes.find(c => c.image === item.imageUrl);
            }
            
            if (cloth) {
              newItems.push({
                id: cloth.id,
                x: item.x || 100,
                y: item.y || 100,
                width: item.width || 150,
                height: item.height || 200,
              });
            }
          }
          
          if (newItems.length > 0) {
            setCanvasItems(newItems);
            alert(`成功加载 ${newItems.length} 件衣物`);
          } else {
            alert('未能匹配到任何衣物，请确保衣物已添加到衣橱');
          }
        }
      } catch (err) {
        alert('JSON文件格式错误');
        console.error(err);
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // 重置input
  };

  // 拖拽相关状态
  const [draggedClothId, setDraggedClothId] = useState<string | null>(null);

  // 处理从左侧拖拽衣物
  const handleClothDragStart = (e: React.DragEvent, clothId: string) => {
    setDraggedClothId(clothId);
    e.dataTransfer.setData('text/plain', clothId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // 处理拖拽到画布
  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const clothId = e.dataTransfer.getData('text/plain');
    if (!clothId) return;
    
    const rect = outfitCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left - 75; // 75是默认宽度的一半
    const y = e.clientY - rect.top - 100; // 100是默认高度的一半
    
    // 检查是否已在画布中
    const existing = canvasItems.find(item => item.id === clothId);
    if (existing) return;
    
    // 添加到画布
    setCanvasItems(prev => [...prev, {
      id: clothId,
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: 150,
      height: 200,
    }]);
    
    setDraggedClothId(null);
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleSaveOutfit = () => {
    if (canvasItems.length === 0) return;
    setShowOutfitCanvas(false);
    setShowOutfitInfoModal(true);
  };

  const getRandomItem = (pool: any[]): string | null => {
    const available = pool.filter(item => !excludedIds.includes(item.id));
    if (available.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex].id;
  };

  const openBlindBox = (type: 'clothing' | 'outfit') => {
    setBlindBoxType(type);
    setIsBlindBoxAnimating(false);
    setBlindBoxResult(null);
    setExcludedIds([]);
    setShowConfetti(false);
    setShowBlindBoxModal(true);
  };

  const drawBlindBox = async () => {
    setIsBlindBoxAnimating(true);
    setBlindBoxResult(null);
    setShowConfetti(false);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    let pool: any[] = [];
    
    if (blindBoxType === 'clothing') {
      pool = clothes.filter(item => {
        if (selectedCategory && item.category !== selectedCategory) return false;
        return true;
      });
    } else {
      pool = outfits.filter(outfit => {
        if (selectedSeasons.length > 0 && !selectedSeasons.includes(outfit.season || '四季')) return false;
        if (selectedScenes.length > 0 && !selectedScenes.includes(outfit.occasion || '')) return false;
        if (selectedStyles.length > 0 && !selectedStyles.includes(outfit.style || '')) return false;
        return true;
      });
    }
    
    const selectedId = getRandomItem(pool);
    
    if (!selectedId) {
      setIsBlindBoxAnimating(false);
      return;
    }
    
    setExcludedIds(prev => [...prev, selectedId]);
    
    if (blindBoxType === 'clothing') {
      const item = clothes.find(c => c.id === selectedId);
      if (item) {
        setBlindBoxResult(item);
      }
    } else {
      const outfit = outfits.find(o => o.id === selectedId);
      if (outfit) {
        setBlindBoxResult(outfit);
      }
    }
    
    setIsBlindBoxAnimating(false);
    setShowConfetti(true);
    
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const toggleFilterTag = (tag: string, type: 'season' | 'scene' | 'style') => {
    if (type === 'season') {
      setSelectedSeasons(prev => 
        prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
      );
    } else if (type === 'scene') {
      setSelectedScenes(prev => 
        prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
      );
    } else {
      setSelectedStyles(prev => 
        prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
      );
    }
  };

  const clearFilters = () => {
    setSelectedSeasons([]);
    setSelectedScenes([]);
    setSelectedStyles([]);
  };

  const filteredOutfits = outfits.filter(outfit => {
    if (selectedSeasons.length > 0 && !selectedSeasons.includes(outfit.season || '四季')) return false;
    if (selectedScenes.length > 0 && !selectedScenes.includes(outfit.occasion || '')) return false;
    if (selectedStyles.length > 0 && !selectedStyles.includes(outfit.style || '')) return false;
    return true;
  });

  const toggleFavorite = async (itemId: string) => {
    setClothes(prev => prev.map(item => {
      if (item.id === itemId) {
        const newFavorite = !item.isFavorite;
        if (currentUser) {
          supabaseData.updateClothing(itemId, { is_favorite: newFavorite }).catch(() => {
            console.warn('is_favorite 字段不存在，收藏状态仅保存在本地');
          });
        }
        return { ...item, isFavorite: newFavorite };
      }
      return item;
    }));
  };

  const handleAddClothing = async () => {
    if (!currentUser) return;
    
    const newItem: ClothingItem = {
      id: Date.now().toString(),
      name: '新服饰',
      category: 'top',
      image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=fashion%20clothing%20item%20minimalist%20style&image_size=square',
      color: '#CCCCCC',
      tags: ['新添加'],
      isFavorite: false,
    };
    
    await supabaseData.addClothing({
      user_id: currentUser.id,
      name: newItem.name,
      category: newItem.category,
      image: newItem.image,
      color: newItem.color,
      tags: newItem.tags,
      is_favorite: false,
    });
    
    setClothes([...clothes, newItem]);
    setShowUploadModal(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setUploadedImage(imageUrl);
        setOriginalImage(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const clearUploadedImage = () => {
    setUploadedImage(null);
  };

  const handleAutoCrop = async () => {
    if (!uploadedImage) return;
    
    setIsAutoCropping(true);
    try {
      const croppedImage = await removeBackground(uploadedImage);
      setUploadedImage(croppedImage);
    } catch (error) {
      console.error('自动抠图失败:', error);
    }
    setIsAutoCropping(false);
  };

  useEffect(() => {
    if (uploadStep === 'crop' && uploadedImage && canvasRef.current && maskCanvasRef.current) {
      const canvas = canvasRef.current;
      const maskCanvas = maskCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const maskCtx = maskCanvas.getContext('2d');
      
      if (!ctx || !maskCtx) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const containerMaxWidth = 500;
        const containerMaxHeight = 320;
        
        const scaleX = containerMaxWidth / img.width;
        const scaleY = containerMaxHeight / img.height;
        const scale = Math.min(scaleX, scaleY, 1);
        
        const newWidth = img.width * scale;
        const newHeight = img.height * scale;
        
        canvas.width = img.width;
        canvas.height = img.height;
        maskCanvas.width = img.width;
        maskCanvas.height = img.height;
        
        canvas.style.width = `${newWidth}px`;
        canvas.style.height = `${newHeight}px`;
        maskCanvas.style.width = `${newWidth}px`;
        maskCanvas.style.height = `${newHeight}px`;
        
        ctx.clearRect(0, 0, img.width, img.height);
        ctx.drawImage(img, 0, 0);
        
        maskCtx.clearRect(0, 0, img.width, img.height);
        
        if (savedMaskState) {
          const maskImg = new Image();
          maskImg.onload = () => {
            maskCtx.drawImage(maskImg, 0, 0);
            setCropOffset({ x: 0, y: 0 });
            setCropScale(1);
            setCropHistory([savedMaskState]);
            setCropRedoStack([]);
          };
          maskImg.src = savedMaskState;
        } else {
          maskCtx.fillStyle = 'rgba(0, 0, 0, 1)';
          maskCtx.fillRect(0, 0, img.width, img.height);
          setCropOffset({ x: 0, y: 0 });
          setCropScale(1);
          setCropHistory([maskCanvas.toDataURL()]);
          setCropRedoStack([]);
        }
      };
      img.src = uploadedImage;
    }
  }, [uploadStep, uploadedImage]);

  const saveToHistory = () => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    
    setCropHistory(prev => [...prev.slice(-20), maskCanvas.toDataURL()]);
    setCropRedoStack([]);
  };

  const handleCropUndo = () => {
    if (cropHistory.length <= 1) return;
    
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    
    const currentState = maskCanvas.toDataURL();
    const prevState = cropHistory[cropHistory.length - 2];
    
    setCropHistory(prev => prev.slice(0, -1));
    setCropRedoStack(prev => [currentState, ...prev]);
    
    const img = new Image();
    img.onload = () => {
      const maskCtx = maskCanvas.getContext('2d');
      if (maskCtx) {
        maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
        maskCtx.drawImage(img, 0, 0);
      }
    };
    img.src = prevState;
  };

  const handleCropRedo = () => {
    if (cropRedoStack.length === 0) return;
    
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    
    const currentState = maskCanvas.toDataURL();
    const nextState = cropRedoStack[0];
    
    setCropRedoStack(prev => prev.slice(1));
    setCropHistory(prev => [...prev, currentState]);
    
    const img = new Image();
    img.onload = () => {
      const maskCtx = maskCanvas.getContext('2d');
      if (maskCtx) {
        maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
        maskCtx.drawImage(img, 0, 0);
      }
    };
    img.src = nextState;
  };

  const handleCropReset = () => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    
    const maskCtx = maskCanvas.getContext('2d');
    if (maskCtx) {
      maskCtx.fillStyle = 'rgba(0, 0, 0, 1)';
      maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
      saveToHistory();
    }
  };

  const handleCropComplete = () => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas) {
      setUploadStep('edit');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');
    if (!ctx || !maskCtx) {
      setUploadStep('edit');
      return;
    }
    
    setSavedMaskState(maskCanvas.toDataURL());
    
    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const pixels = maskData.data;
    
    let minX = maskCanvas.width, minY = maskCanvas.height;
    let maxX = 0, maxY = 0;
    let hasNonMasked = false;
    
    for (let y = 0; y < maskCanvas.height; y++) {
      for (let x = 0; x < maskCanvas.width; x++) {
        const idx = (y * maskCanvas.width + x) * 4;
        if (pixels[idx + 3] === 0) {
          hasNonMasked = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    if (!hasNonMasked) {
      minX = 0;
      minY = 0;
      maxX = canvas.width - 1;
      maxY = canvas.height - 1;
    }
    
    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropWidth;
    tempCanvas.height = cropHeight;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) {
      setUploadStep('edit');
      return;
    }
    
    tempCtx.globalCompositeOperation = 'source-over';
    tempCtx.clearRect(0, 0, cropWidth, cropHeight);
    
    const imageData = ctx.getImageData(minX, minY, cropWidth, cropHeight);
    const maskCropData = maskCtx.getImageData(minX, minY, cropWidth, cropHeight);
    
    for (let i = 3; i < imageData.data.length; i += 4) {
      imageData.data[i] = maskCropData.data[i] === 0 ? 255 : 0;
    }
    
    tempCtx.putImageData(imageData, 0, 0);
    
    const croppedImage = tempCanvas.toDataURL('image/png');
    setUploadedImage(croppedImage);
    setRecognizedItems([{
      id: 'cropped-' + Date.now(),
      name: '新服饰',
      category: 'top',
      image: croppedImage,
      color: '#CCCCCC',
      tags: ['抠图'],
    }]);
    setUploadStep('edit');
  };

  const handleEditBackToCrop = () => {
    if (originalImage) {
      setUploadedImage(originalImage);
    }
    setUploadStep('crop');
  };

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const container = canvas.parentElement;
    if (!container) return { x: 0, y: 0 };
    
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    
    const transformedX = ((mouseX - centerX - cropOffset.x) / cropScale) + centerX;
    const transformedY = ((mouseY - centerY - cropOffset.y) / cropScale) + centerY;
    
    const canvasX = (transformedX / containerWidth) * canvas.width;
    const canvasY = (transformedY / containerHeight) * canvas.height;
    
    return { x: Math.max(0, Math.min(canvasX, canvas.width)), y: Math.max(0, Math.min(canvasY, canvas.height)) };
  };

  const handleCropMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setCropIsDrawing(true);
    setCropIsDragging(true);
    setCropLastPos({ x: e.clientX, y: e.clientY });
    
    const pos = getCanvasPos(e);
    
    if (cropTool !== 'move') {
      if (cropTool === 'magic') {
        handleMagicWand(pos.x, pos.y);
      }
    }
  };

  const handleCropMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (cropIsDragging && (cropTool === 'move' || !cropIsDrawing)) {
      setCropOffset(prev => ({
        x: prev.x + e.clientX - cropLastPos.x,
        y: prev.y + e.clientY - cropLastPos.y,
      }));
      setCropLastPos({ x: e.clientX, y: e.clientY });
      return;
    }
    
    if (!cropIsDrawing) return;
    
    if (cropTool === 'move') {
      return;
    }
    
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;

    const pos = getCanvasPos(e);

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, cropBrushSize, 0, Math.PI * 2);
    
    if (cropTool === 'brush') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fill();
    } else if (cropTool === 'eraser') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fill();
    }
  };

  const handleCropMouseUp = () => {
    if (cropIsDrawing && cropTool !== 'move') {
      saveToHistory();
    }
    setCropIsDrawing(false);
    setCropIsDragging(false);
  };

  const handleCropWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setCropScale(prev => Math.min(Math.max(prev * delta, 0.25), 4));
  };

  const handleMagicWand = (startX: number, startY: number) => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;
    
    const imageData = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const pixels = imageData.data;
    
    const startIdx = (Math.floor(startY) * maskCanvas.width + Math.floor(startX)) * 4;
    const targetR = pixels[startIdx];
    const targetG = pixels[startIdx + 1];
    const targetB = pixels[startIdx + 2];
    
    const visited = new Set<number>();
    const queue: { x: number; y: number }[] = [{ x: Math.floor(startX), y: Math.floor(startY) }];
    
    while (queue.length > 0) {
      const { x, y } = queue.shift()!;
      const idx = (y * maskCanvas.width + x) * 4;
      
      if (visited.has(idx)) continue;
      if (x < 0 || x >= maskCanvas.width || y < 0 || y >= maskCanvas.height) continue;
      
      visited.add(idx);
      
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      
      const diff = Math.abs(r - targetR) + Math.abs(g - targetG) + Math.abs(b - targetB);
      
      if (diff < cropTolerance * 3) {
        pixels[idx + 3] = 0;
        
        queue.push({ x: x + 1, y });
        queue.push({ x: x - 1, y });
        queue.push({ x, y: y + 1 });
        queue.push({ x, y: y - 1 });
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    saveToHistory();
  };

  const categoryMapping: { [key: string]: 'top' | 'bottom' | 'dress' | 'outerwear' | 'accessory' | 'shoes' } = {
    '上衣': 'top',
    'T恤': 'top',
    '衬衫': 'top',
    '毛衣': 'top',
    '卫衣': 'top',
    '裤子': 'bottom',
    '牛仔裤': 'bottom',
    '裙子': 'dress',
    '连衣裙': 'dress',
    '外套': 'outerwear',
    '大衣': 'outerwear',
    '夹克': 'outerwear',
    '围巾': 'accessory',
    '帽子': 'accessory',
    '包包': 'accessory',
    '鞋子': 'shoes',
    '运动鞋': 'shoes',
    '高跟鞋': 'shoes',
  };

  const colorMapping: { [key: string]: string } = {
    '白色': '#FFFFFF',
    '黑色': '#000000',
    '灰色': '#808080',
    '蓝色': '#0066CC',
    '红色': '#FF0000',
    '粉色': '#FF69B4',
    '黄色': '#FFD700',
    '绿色': '#00CC00',
    '紫色': '#9933FF',
    '棕色': '#8B4513',
  };

  const outfitCombinations = [
    { items: [
      { category: 'top', name: '白色T恤', color: '#FFFFFF' },
      { category: 'bottom', name: '蓝色牛仔裤', color: '#4169E1' },
      { category: 'shoes', name: '白色运动鞋', color: '#FFFFFF' },
    ]},
    { items: [
      { category: 'top', name: '米色衬衫', color: '#F5F5DC' },
      { category: 'bottom', name: '黑色长裤', color: '#000000' },
      { category: 'shoes', name: '黑色高跟鞋', color: '#000000' },
    ]},
    { items: [
      { category: 'dress', name: '白色连衣裙', color: '#FFFFFF' },
      { category: 'accessory', name: '白色帽子', color: '#FFFFFF' },
      { category: 'shoes', name: '米色凉鞋', color: '#F5F5DC' },
    ]},
    { items: [
      { category: 'top', name: '浅蓝色上衣', color: '#87CEEB' },
      { category: 'bottom', name: '白色短裤', color: '#FFFFFF' },
      { category: 'accessory', name: '遮阳帽', color: '#FFD700' },
      { category: 'shoes', name: '蓝色帆布鞋', color: '#4169E1' },
    ]},
    { items: [
      { category: 'top', name: '灰色衬衫', color: '#808080' },
      { category: 'bottom', name: '卡其色阔腿裤', color: '#C3B091' },
      { category: 'outerwear', name: '米色风衣', color: '#F5F5DC' },
      { category: 'shoes', name: '棕色皮鞋', color: '#8B4513' },
    ]},
    { items: [
      { category: 'top', name: '黑色上衣', color: '#000000' },
      { category: 'bottom', name: '黑色长裤', color: '#000000' },
      { category: 'accessory', name: '黑色包包', color: '#000000' },
      { category: 'shoes', name: '黑色高跟鞋', color: '#000000' },
    ]},
    { items: [
      { category: 'top', name: '粉色针织衫', color: '#FF69B4' },
      { category: 'bottom', name: '灰色休闲裤', color: '#808080' },
      { category: 'accessory', name: '红色围巾', color: '#FF6B6B' },
      { category: 'shoes', name: '白色运动鞋', color: '#FFFFFF' },
    ]},
    { items: [
      { category: 'dress', name: '碎花连衣裙', color: '#FFB6C1' },
      { category: 'outerwear', name: '浅蓝色外套', color: '#87CEEB' },
      { category: 'accessory', name: '渔夫帽', color: '#808080' },
    ]},
  ];

  const mockRecognizeClothing = (imageUrl: string): ClothingItem[] => {
    const hash = imageUrl.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const comboIndex = hash % outfitCombinations.length;
    const combo = outfitCombinations[comboIndex];
    
    return combo.items.map((item, index) => ({
      id: `recognized-${Date.now()}-${index}`,
      name: item.name,
      category: item.category as 'top' | 'bottom' | 'dress' | 'outerwear' | 'accessory' | 'shoes',
      image: imageUrl,
      color: item.color,
      tags: ['识别'],
      suitableTemp: '15-30°C',
    }));
  };

  const recognizeClothing = async () => {
    if (uploadedImage) {
      const items = await smartRecognizeClothing(uploadedImage);
      setRecognizedItems(items);
      setUploadStep('edit');
    }
  };

  const addClothingToCloset = async () => {
    if (!currentUser) return;
    
    const newItems: ClothingItem[] = [];
    
    for (const item of recognizedItems) {
      const newItem: ClothingItem = {
        ...item,
        id: Date.now().toString() + Math.random(),
        tags: [...item.tags, '已添加'],
      };
      
      await supabaseData.addClothing({
        user_id: currentUser.id,
        name: newItem.name,
        category: newItem.category,
        image: newItem.image,
        color: newItem.color,
        tags: newItem.tags,
        suitable_temp: newItem.suitableTemp,
        is_favorite: false,
      });
      
      newItems.push(newItem);
    }
    
    setClothes(prev => [...prev, ...newItems]);
    setShowUploadModal(false);
    setUploadStep('upload');
    setUploadedImage(null);
    setRecognizedItems([]);
  };

  const updateRecognizedItem = (index: number, updates: Partial<ClothingItem>) => {
    setRecognizedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, ...updates } : item
    ));
  };

  const removeRecognizedItem = (index: number) => {
    setRecognizedItems(prev => prev.filter((_, i) => i !== index));
  };

  const addNewClothing = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        const newItem: ClothingItem = {
          id: Date.now().toString(),
          name: file.name.replace(/\.[^/.]+$/, ''),
          category: 'top',
          image: imageUrl,
          color: '#CCCCCC',
          tags: ['上传'],
          suitableTemp: '15-30°C',
        };
        setClothes([...clothes, newItem]);
        setShowUploadModal(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleClothingSelection = (id: string) => {
    setSelectedClothes(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const saveOutfit = async () => {
    if (!currentUser) return;
    
    const mainImage = await generateOutfitMainImage();
    
    const outfitData = {
      name: newOutfitName || '新搭配',
      items: canvasItems.map(item => item.id),
      rating: outfitRating,
      suitableTemp: selectedTemp,
      occasion: outfitOccasion,
    };
    
    if (editingOutfitId) {
      await supabaseData.updateOutfit(editingOutfitId, {
        name: outfitData.name,
        item_ids: outfitData.items,
        rating: outfitData.rating,
        suitable_temp: outfitData.suitableTemp,
        occasion: outfitData.occasion,
      });
      
      setOutfits(prev => prev.map(outfit => 
        outfit.id === editingOutfitId 
          ? { ...outfit, ...outfitData }
          : outfit
      ));
    } else {
      const { data } = await supabaseData.addOutfit({
        user_id: currentUser.id,
        name: outfitData.name,
        item_ids: outfitData.items,
        rating: outfitData.rating,
        suitable_temp: outfitData.suitableTemp,
        occasion: outfitData.occasion,
      });
      
      if (data && data[0]) {
        const newOutfit: Outfit = {
          id: data[0].id,
          ...outfitData,
          createdAt: new Date().toISOString().split('T')[0],
        };
        setOutfits([newOutfit, ...outfits]);
      }
    }
    
    setShowOutfitInfoModal(false);
    setShowSaveOutfitModal(false);
    setCanvasItems([]);
    setNewOutfitName('');
    setOutfitOccasion('');
    setEditingOutfitId(null);
  };

  const generateOutfitMainImage = async (): Promise<string | undefined> => {
    if (canvasItems.length === 0) return undefined;
    
    const canvas = document.createElement('canvas');
    const width = 400;
    const height = 500;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return undefined;
    
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    
    const sortedItems = [...canvasItems].sort((a, b) => a.y - b.y);
    
    for (const item of sortedItems) {
      const cloth = clothes.find(c => c.id === item.id);
      if (!cloth) continue;
      
      try {
        const img = await loadImage(cloth.image);
        const scale = Math.min(width * 0.6 / img.width, height * 0.8 / img.height, 1);
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        const x = (width - drawWidth) / 2;
        const y = (height - drawHeight) / 2 + (sortedItems.indexOf(item) * 20);
        
        ctx.drawImage(img, x, y, drawWidth, drawHeight);
      } catch (e) {
        console.error('Failed to load image:', e);
      }
    }
    
    return canvas.toDataURL('image/png');
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const selectedItems = clothes.filter(item => selectedClothes.includes(item.id));

  const handleGuestLogin = async () => {
    setLoginError('');
    setLoginSuccess(false);
    
    if (!loginUsername.trim()) {
      setLoginError('请输入邮箱');
      return;
    }
    
    if (!loginPassword.trim()) {
      setLoginError('请输入密码');
      return;
    }
    
    const { data, error } = await supabaseAuth.signIn(loginUsername, loginPassword);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setLoginError('邮箱或密码错误，请检查后重试');
      } else if (error.message.includes('User not found')) {
        setLoginError('当前邮箱未注册，请先注册');
      } else {
        setLoginError(error.message || '登录失败');
      }
      return;
    }
    
    if (data.user) {
      setLoginSuccess(true);
      loadUserData(data.user.id);
      setTimeout(() => {
        setShowLoginModal(false);
        setLoginUsername('');
        setLoginPassword('');
        setLoginSuccess(false);
        setActiveTab('home');
        fetchWeather();
      }, 500);
    }
  };

  const handleGuestRegister = async () => {
    setLoginError('');
    
    if (!loginUsername.trim()) {
      setLoginError('请输入邮箱');
      return;
    }
    
    if (!loginUsername.includes('@')) {
      setLoginError('请输入有效的邮箱地址');
      return;
    }
    
    if (loginPassword.length < 6) {
      setLoginError('密码至少需要6个字符');
      return;
    }
    
    if (loginPassword !== registerPasswordConfirm) {
      setLoginError('两次输入的密码不一致');
      return;
    }
    
    const { data, error } = await supabaseAuth.signUp(loginUsername, loginPassword);
    
    if (error) {
      setLoginError(error.message || '注册失败');
      return;
    }
    
    if (data.user) {
      const randomUsername = generateRandomUsername();
      Promise.all([
        supabaseData.updateProfile(data.user.id, { username: randomUsername }),
        createDefaultLocations(data.user.id),
        loadUserData(data.user.id),
      ]);
      setTimeout(() => {
        setShowLoginModal(false);
        setLoginUsername('');
        setLoginPassword('');
        setRegisterPasswordConfirm('');
        setActiveTab('home');
        fetchWeather();
      }, 500);
    }
  };

  const handleSaveUsername = async () => {
    if (!editUsername.trim()) {
      alert('用户名不能为空');
      return;
    }
    
    const newUsername = editUsername.trim();
    
    if (currentUser) {
      try {
        await supabaseData.updateProfile(currentUser.id, { username: newUsername });
        const updatedUser = { ...currentUser, username: newUsername };
        setCurrentUser(updatedUser);
      } catch (error) {
        console.error('保存失败:', error);
      }
    }
    
    setEditingUsername(false);
    setEditUsername('');
  };

  const handleForgotPassword = async () => {
    setLoginError('');
    setResetSuccess(false);
    
    if (!loginUsername.trim()) {
      setLoginError('请输入邮箱');
      return;
    }
    
    if (!loginUsername.includes('@')) {
      setLoginError('请输入有效的邮箱地址');
      return;
    }
    
    const { error } = await supabaseAuth.resetPassword(loginUsername);
    
    if (error) {
      setLoginError(error.message || '发送失败，请稍后重试');
      return;
    }
    
    setResetSuccess(true);
  };

  const handleLogout = async () => {
    const { error } = await supabaseAuth.signOut();
    if (!error) {
      setCurrentUser(null);
      setClothes([]);
      setOutfits([]);
      setSelectedClothes([]);
      setLocations([]);
      setCheckinEntries([]);          // 清空打卡记录
      setSelectedCheckinDate(null);  // 清空选中的打卡日期
    }
  };

  const sendVerificationCode = async () => {
    if (isSendingCode || codeCountdown > 0) return;
    
    setIsSendingCode(true);
    setCodeError('');
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(currentUser?.email || '', {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        setCodeError(error.message || '发送验证码失败');
      } else {
        setCodeSuccess(true);
        setCodeCountdown(60);
        
        const timer = setInterval(() => {
          setCodeCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error) {
      setCodeError('发送验证码失败');
    } finally {
      setIsSendingCode(false);
    }
  };
  
  const verifyCode = async () => {
    setCodeError('');
    
    if (!verificationCode.trim()) {
      setCodeError('请输入验证码');
      return;
    }
    
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: currentUser?.email || '',
        token: verificationCode,
        type: 'recovery',
      });
      
      if (error) {
        setCodeError('验证码无效或已过期');
      } else {
        setPasswordResetStep('password');
      }
    } catch (error) {
      setCodeError('验证失败，请重试');
    }
  };
  
  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess(false);
    
    if (!newPassword.trim()) {
      setPasswordError('请输入新密码');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('密码至少需要6个字符');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('两次输入的密码不一致');
      return;
    }
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) {
      setPasswordError(error.message || '修改密码失败');
      return;
    }
    
    setPasswordSuccess(true);
    setNewPassword('');
    setConfirmPassword('');
    
    setTimeout(() => {
      setPasswordSuccess(false);
      setAccountSettingsStep('profile');
      setShowAccountSettings(false);
      setShowAccountModal(true);
    }, 1500);
  };

  const calculateBMI = (height: number, weight: number): number => {
    if (height === 0 || weight === 0) return 0;
    return weight / Math.pow(height / 100, 2);
  };

  const loadUserData = async (userId: string, email: string = '') => {
    console.log('loadUserData 开始，用户ID:', userId);
    const [clothesResult, outfitsResult, locationsResult, checkinsResult] = await Promise.all([
      supabaseData.getClothes(userId),
      supabaseData.getOutfits(userId),
      supabaseData.getLocations(userId),
      supabaseData.getCheckins(userId)
    ]);
    
    console.log('加载数据结果:', {
      clothes: clothesResult.data?.length || 0,
      outfits: outfitsResult.data?.length || 0,
      locations: locationsResult.data?.length || 0,
      checkins: checkinsResult.data?.length || 0
    });
    
    console.log('衣物数据:', clothesResult.data);
    
    const user: User = {
      id: userId,
      email: '',
      username: '',
      password: '',
      avatar: '',
      clothes: (clothesResult.data || []).map((c: any) => {
        const tags = c.tags || [];
        const seasonTags = ['春秋', '夏季', '冬季', '四季'];
        const season = tags.find(t => seasonTags.includes(t)) || undefined;
        return {
          id: c.id,
          name: c.name,
          category: c.category,
          image: c.image,
          color: c.color,
          tags: tags,
          suitableTemp: c.suitable_temp,
          season: season,
          location: c.location,
          detailLocation: c.detail_location,
          isFavorite: c.is_favorite,
        };
      }),
      outfits: (outfitsResult.data || []).map(o => ({
        id: o.id,
        name: o.name,
        items: o.item_ids || [],
        rating: o.rating || 0,
        suitableTemp: o.suitable_temp || '',
        occasion: o.occasion,
        createdAt: o.created_at ? new Date(o.created_at).toISOString().split('T')[0] : ''
      })),
      locations: (locationsResult.data || []).map(l => ({
        id: l.id,
        name: l.name,
        description: l.description || '',
        clothesCount: l.clothes_count || 0,
        tags: l.tags || []
      }))
    };
    
    const checkinsData: Record<string, CheckinEntry> = {};
    (checkinsResult.data || []).forEach(c => {
      checkinsData[c.date] = {
        date: c.date,
        outfitImage: c.outfit_image,
        outfitId: c.outfit_id,
        mood: c.mood,
        activities: c.activities || [],
        diary: c.diary
      };
    });
    console.log('Loaded checkins:', checkinsData);
    setCheckinEntries(checkinsData);
    
    const profileResult = await supabaseData.getProfile(userId);
    if (profileResult.data) {
      user.username = profileResult.data.username || '';
      user.avatar = profileResult.data.avatar || '';
      
      // 加载身材数据
      setAvatar({
        height: profileResult.data.height || 0,
        weight: profileResult.data.weight || 0,
        bust: profileResult.data.bust || 0,
        waist: profileResult.data.waist || 0,
        hips: profileResult.data.hips || 0,
        skinTone: '#F5DEB3',
        hairStyle: '长发',
        hairColor: '#8B4513',
        faceShape: '椭圆形脸',
      });
    }
    user.email = email;
    
    setCurrentUser(user);
    setClothes(user.clothes);
    setOutfits(user.outfits);
    setLocations(user.locations);
    
    console.log('数据加载完成，当前衣物数量:', user.clothes.length);
  };

  const createDefaultLocations = async (userId: string) => {
    const defaultLocations = [
      { name: '主卧衣柜', description: '卧室主衣柜，主要存放日常衣物', tags: ['上衣', '裤子', '外套'] },
      { name: '衣帽间', description: '独立衣帽间，存放季节衣物和配饰', tags: ['裙子', '配饰', '鞋子'] },
      { name: '玄关鞋柜', description: '入门玄关处，存放常穿鞋子', tags: ['鞋子'] },
      { name: '储物间', description: '阳台储物间，存放过季衣物', tags: ['过季', '被子'] },
    ];
    
    for (const loc of defaultLocations) {
      await supabaseData.addLocation({
        user_id: userId,
        name: loc.name,
        description: loc.description,
        clothes_count: 0,
        tags: loc.tags
      });
    }
  };


  useEffect(() => {
    fetchWeather();
    
    const checkAuth = async () => {
      const session = await supabaseAuth.getSession();
      console.log('Session:', session);
      if (session && session.user) {
        console.log('用户已登录，加载数据...');
        await loadUserData(session.user.id, session.user.email || '');
      } else {
        console.log('用户未登录或 session 不存在');
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (currentUser) {
      const updatedUser = { ...currentUser, clothes, outfits, locations };

    }
  }, [clothes, outfits, locations, currentUser]);

  useEffect(() => {
    if (uploadStep === 'recognize' && uploadedImage) {
      console.log('进入识别步骤，开始自动识别...');
      const timer = setTimeout(() => {
        recognizeClothing();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [uploadStep, uploadedImage]);

  const fetchWeather = async (cityName?: string) => {
    setWeatherLoading(true);
    
    try {
      // 清理城市名称的辅助函数 - 确保类型安全
      const cleanCityName = (name: any) => {
        if (typeof name !== 'string') {
          console.warn('城市名称不是字符串类型:', name);
          return '北京';
        }
        return name.replace(/市$/, '').replace(/省$/, '').trim();
      };
      
      let city: string;
      
      if (cityName) {
        // 用户直接指定了城市
        city = cleanCityName(cityName);
        console.log('使用用户指定城市:', city);
      } else {
        // 尝试自动定位
        let position: GeolocationPosition | null = null;
        
        // 首先检查权限状态
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
          console.log('位置权限状态:', permissionStatus.state);
          
          // 如果权限被拒绝，直接使用IP定位
          if (permissionStatus.state === 'denied') {
            console.log('位置权限已被拒绝，使用IP定位');
          } else if (permissionStatus.state === 'granted') {
            console.log('位置权限已授予，尝试GPS定位');
            try {
              position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                  resolve,
                  (error) => {
                    console.log('GPS定位失败:', error.message, '错误码:', error.code);
                    reject(error);
                  },
                  { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
                );
              });
            } catch (error) {
              console.log('GPS定位超时或失败，切换到IP定位:', (error as Error).message);
            }
          } else {
            console.log('位置权限状态为prompt，尝试请求定位');
            try {
              position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                  resolve,
                  (error) => {
                    console.log('GPS定位失败:', error.message, '错误码:', error.code);
                    reject(error);
                  },
                  { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
                );
              });
            } catch (error) {
              console.log('GPS定位失败，切换到IP定位:', (error as Error).message);
            }
          }
        } catch (error) {
          console.log('权限检查失败，使用IP定位:', (error as Error).message);
        }
        
        let rawCity: any = '';
        
        if (position) {
          const { latitude, longitude } = position.coords;
          console.log(`GPS定位成功: ${latitude}, ${longitude}`);
          
          try {
            const geoResponse = await fetch(
              `https://restapi.amap.com/v3/geocode/regeo?location=${longitude},${latitude}&key=${AMAP_API_KEY}`
            );
            const geoData = await geoResponse.json();
            console.log('逆地理编码结果:', geoData);
            
            // 详细检查地址组件结构
            const addressComponent = geoData.regeocode?.addressComponent;
            console.log('地址组件:', addressComponent);
            
            if (addressComponent) {
              // 尝试多种可能的字段名和格式
              const possibleCities = [
                addressComponent.city,
                addressComponent.province,
                addressComponent.district,
                addressComponent.streetNumber?.street,
              ].filter(val => val && typeof val === 'string' && val.trim());
              
              rawCity = possibleCities[0] || '';
              console.log('从地址组件提取的城市:', rawCity);
            } else {
              rawCity = '';
            }
          } catch (geoError) {
            console.log('逆地理编码失败，使用IP定位:', (geoError as Error).message);
            rawCity = '';
          }
        }
        
        // 如果GPS定位失败或逆地理编码失败，使用IP定位
        if (!rawCity) {
          console.log('使用IP定位');
          try {
            const ipResponse = await fetch(
              `https://restapi.amap.com/v3/ip?key=${AMAP_API_KEY}`
            );
            const ipData = await ipResponse.json();
            console.log('IP定位数据:', ipData);
            rawCity = ipData.city || ipData.province || '';
          } catch (ipError) {
            console.log('IP定位失败，使用默认城市北京:', (ipError as Error).message);
            rawCity = '';
          }
        }
        
        // 清理城市名称
        city = cleanCityName(rawCity || '北京');
        console.log('解析到城市:', city, '原始值:', rawCity);
      }
      
      console.log('请求天气的城市:', city);
      
      const response = await fetch(
        `https://restapi.amap.com/v3/weather/weatherInfo?city=${encodeURIComponent(city)}&key=${AMAP_API_KEY}&extensions=base`
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('天气数据:', data);
        
        if (data.status === '1' && data.lives && data.lives.length > 0) {
          const weatherData = data.lives[0];
          setWeather({
            city: weatherData.city,
            temperature: parseInt(weatherData.temperature),
            description: weatherData.weather,
            icon: getWeatherCode(weatherData.weather),
          });
        } else {
          console.warn('[天气API] 返回数据格式异常，使用默认天气:', data);
          setWeather({
            city: city || '北京',
            temperature: 22,
            description: '晴朗',
            icon: 'sunny',
          });
        }
      } else {
        const errorData = await response.json().catch(() => null);
        console.warn('[天气API] 请求失败，使用默认天气:', errorData);
        setWeather({
          city: city || '北京',
          temperature: 22,
          description: '晴朗',
          icon: 'sunny',
        });
      }
    } catch (error: any) {
      console.warn('[天气API] 获取天气失败，使用默认天气:', error.message || error);
      setWeather({
        city: '北京',
        temperature: 22,
        description: '晴朗',
        icon: 'sunny',
      });
    } finally {
      setWeatherLoading(false);
    }
  };
  
  const getWeatherCode = (weather: string): string => {
    if (weather.includes('晴')) return 'sunny';
    if (weather.includes('多云')) return 'cloudy';
    if (weather.includes('阴')) return 'overcast';
    if (weather.includes('雨')) return 'rainy';
    if (weather.includes('雪')) return 'snowy';
    if (weather.includes('雷')) return 'thunder';
    if (weather.includes('雾')) return 'foggy';
    return 'sunny';
  };

  const getWeatherIcon = (icon: string) => {
    const iconMap: Record<string, string> = {
      'sunny': '☀️',
      'cloudy': '⛅',
      'overcast': '☁️',
      'rainy': '🌧️',
      'snowy': '❄️',
      'thunder': '⛈️',
      'foggy': '🌫️',
      '01d': '☀️',
      '01n': '🌙',
      '02d': '⛅',
      '02n': '☁️',
      '03d': '☁️',
      '03n': '☁️',
      '04d': '☁️',
      '04n': '☁️',
      '09d': '🌧️',
      '09n': '🌧️',
      '10d': '🌦️',
      '10n': '🌧️',
      '11d': '⛈️',
      '11n': '⛈️',
      '13d': '❄️',
      '13n': '❄️',
      '50d': '🌫️',
      '50n': '🌫️',
    };
    return iconMap[icon] || '🌤️';
  };

  const generateCalendarDays = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Array<{ day: number; month: number; isToday: boolean; isFuture: boolean } | null> = [];
    
    const startPadding = firstDay.getDay();
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const isToday = day === today.getDate();
      const isFuture = isToday ? false : day > today.getDate();
      days.push({ day, month: month + 1, isToday, isFuture });
    }
    
    return days;
  };

  const generateCheckinCalendarDays = () => {
    const today = new Date();
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Array<{ day: number; month: number; year: number; isToday: boolean; isFuture: boolean } | null> = [];
    
    const startPadding = firstDay.getDay();
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const isToday = day === today.getDate() && 
                     month === today.getMonth() && 
                     year === today.getFullYear();
      const thisDate = new Date(year, month, day);
      const isFuture = thisDate > today;
      days.push({ day, month: month + 1, year, isToday, isFuture });
    }
    
    return days;
  };

  const handleCheckinDayClick = (dateStr: string) => {
    const entry = checkinEntries[dateStr];
    setSelectedCheckinDate(dateStr);
    setCheckinMood(entry?.mood || '');
    setCheckinActivity('');
    setCheckinDiary(entry?.diary || '');
    setCheckinOutfitImage(entry?.outfitImage || null);
  };

  const handleDeleteCheckin = async (dateStr: string) => {
    if (!currentUser) return;
    
    if (confirm('确定要删除当日的打卡记录吗？')) {
      setCheckinEntries(prev => {
        const newEntries = { ...prev };
        delete newEntries[dateStr];
        return newEntries;
      });
      
      await supabaseData.deleteCheckin(dateStr, currentUser.id);
    }
  };

  const saveCheckinEntry = async () => {
    if (!selectedCheckinDate || !currentUser) return;
    
    console.log('saveCheckinEntry - starting');
    
    const existingEntry = checkinEntries[selectedCheckinDate] || { 
      date: selectedCheckinDate, 
      activities: [] 
    };
    
    const updatedEntry: CheckinEntry = {
      ...existingEntry,
      mood: checkinMood || existingEntry.mood,
      diary: checkinDiary || existingEntry.diary,
      outfitImage: checkinOutfitImage || existingEntry.outfitImage,
      outfitId: selectedOutfit?.id || existingEntry.outfitId,
      activities: existingEntry.activities,
    };
    
    if (checkinActivity.trim() && !updatedEntry.activities.includes(checkinActivity.trim())) {
      updatedEntry.activities = [...updatedEntry.activities, checkinActivity.trim()];
    }
    
    setCheckinEntries(prev => ({
      ...prev,
      [selectedCheckinDate]: updatedEntry
    }));
    
    const checkinData = {
      user_id: currentUser.id,
      date: selectedCheckinDate,
      outfit_image: updatedEntry.outfitImage,
      outfit_id: updatedEntry.outfitId,
      mood: updatedEntry.mood,
      activities: updatedEntry.activities,
      diary: updatedEntry.diary
    };
    
    console.log('saveCheckinEntry - saving to supabase:', checkinData);
    
    const { data, error } = await supabaseData.addCheckin(checkinData);
    
    if (error) {
      console.error('saveCheckinEntry - error saving checkin:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error
      });
      alert(`保存打卡记录失败：${error.message}`);
      return;
    }
    
    console.log('saveCheckinEntry - saved successfully');
    
    setShowCheckinModal(false);
    setSelectedCheckinDate(selectedCheckinDate);
    setCheckinMood('');
    setCheckinActivity('');
    setCheckinDiary('');
    setCheckinOutfitImage(null);
    setSelectedOutfit(null);
  };

  const removeActivity = (activity: string) => {
    if (!selectedCheckinDate) return;
    
    const entry = checkinEntries[selectedCheckinDate];
    if (entry) {
      entry.activities = entry.activities.filter(a => a !== activity);
      setCheckinEntries(prev => ({
        ...prev,
        [selectedCheckinDate]: entry
      }));
    }
  };

  const getMoodEmoji = (mood: string): string => {
    const moodMap: Record<string, string> = {
      '开心': '😄',
      '平静': '😌',
      '疲惫': '😩',
      '烦躁': '😤',
      '兴奋': '🤩',
      '难过': '😢',
      '期待': '🌟',
      '满足': '🥰',
    };
    return moodMap[mood] || '😊';
  };

  const getMonthlyCheckinCount = (type: 'outfit' | 'mood' | 'activity') => {
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();
    
    return Object.entries(checkinEntries).filter(([date, entry]) => {
      const d = new Date(date);
      if (d.getMonth() !== month || d.getFullYear() !== year) return false;
      
      if (type === 'outfit') return !!entry.outfitImage || !!entry.outfitId;
      if (type === 'mood') return !!entry.mood;
      if (type === 'activity') return entry.activities.length > 0;
      return false;
    }).length;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${month}月${day}日 ${weekdays[date.getDay()]}`;
  };

  const handleDiaryDayClick = (dateStr: string) => {
    alert(`点击了日期：${dateStr}\n功能开发中：上传今日搭配打卡`);
    setShowDiaryCalendar(false);
  };

  return (
    <div className="min-h-screen bg-canvas">
      <div className="pt-[120px] px-8 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <div className="text-center flex-1">
                <h1 className="text-5xl md:text-6xl font-display font-bold bg-gradient-to-r from-rose-400 via-pink-400 to-violet-500 bg-clip-text text-transparent mb-4 drop-shadow-sm">
                  今天穿什么？
                </h1>
                <p className="text-gray-600 text-lg">你的专属电子衣橱，快速进行穿搭并找到你想要的那个它！妈妈再也不用担心我为今天穿什么发愁啦~</p>
              </div>
              <div className="flex items-center gap-4">
                {currentUser ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full"
                  >
                    <img 
                      src={currentUser.avatar || getFallbackImage(currentUser.id, 100)} 
                      alt={currentUser.username}
                      className="w-10 h-10 rounded-full object-cover border-2 border-pink-300 cursor-pointer hover:border-pink-500 transition-colors"
                      onClick={() => setShowAccountModal(true)}
                    />
                    <div>
                      <p className="font-medium text-gray-800">{currentUser.username}</p>
                      <p className="text-xs text-gray-500">已登录</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-gray-500 hover:text-pink-500 transition-colors"
                      title="退出登录"
                    >
                      <LogOut size={20} />
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setShowLoginModal(true)}
                    className="flex items-center gap-2 py-2 text-sm bg-[#f472d0] border-black border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-[-2px] hover:translate-y-0 transition-all px-6 rounded-xl font-bold text-white"
                  >
                    <User size={20} />
                    <span>登录</span>
                  </motion.button>
                )}
              </div>
            </motion.div>
          </div>
          <div className="flex">
            <aside 
              className={`h-fit border-r border-gray-200/30 p-4 transition-all duration-300 ${
                sidebarExpanded ? 'w-48' : 'w-16'
              }`}
              onMouseEnter={() => setSidebarExpanded(true)}
              onMouseLeave={() => setSidebarExpanded(false)}
            >
              <nav className="space-y-1">
                {navItems.map(item => (
                  <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-center py-3 text-sm rounded-xl transition-all font-medium ${
                    sidebarExpanded 
                      ? 'w-full gap-3 px-4' 
                      : 'w-12 aspect-square'
                  } ${
                    activeTab === item.id 
                      ? 'bg-[#f472d0] border-black border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white' 
                      : 'text-gray-600'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarExpanded && <span className="font-medium whitespace-nowrap">{item.label}</span>}
                </button>
                ))}
              </nav>
              
              <div className="mt-6 pt-4 border-t border-gray-200/30">
                <button
                  onClick={() => setSidebarExpanded(!sidebarExpanded)}
                  className="w-full flex items-center justify-center py-2 text-gray-500 hover:text-gray-700 transition-colors"
                  title={sidebarExpanded ? '收起导航栏' : '展开导航栏'}
                >
                  <ChevronRight 
                    className={`w-5 h-5 transition-transform duration-300 ${sidebarExpanded ? 'rotate-180' : ''}`} 
                  />
                </button>
              </div>
            </aside>

            <main className="flex-1 p-8">
              <AnimatePresence mode="wait">
              {activeTab === 'home' && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">欢迎回来</h2>
                    <p className="text-gray-500 mt-1">今天想穿什么呢？</p>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: '衣物总数', value: clothes.length, icon: Shirt, color: 'bg-purple-50 text-purple-600' },
                      { label: '搭配方案', value: outfits.length, icon: Sparkles, color: 'bg-pink-50 text-pink-600' },
                      { label: '喜爱单品', value: clothes.filter(item => item.isFavorite).length, icon: Heart, color: 'bg-red-50 text-red-600' },
                    ].map(stat => (
                      <motion.div
                        key={stat.label}
                        whileHover={{ y: -5 }}
                        className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <stat.icon className={`w-10 h-10 ${stat.color} rounded-xl p-2 mb-4`} />
                        <div className="text-3xl font-bold text-gray-800">{stat.value}</div>
                        <div className="text-sm text-gray-500">{stat.label}</div>
                      </motion.div>
                    ))}
                    
                    <motion.div
                      whileHover={{ y: -5 }}
                      className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl p-2 mb-4 flex items-center justify-center text-2xl">
                        {weatherLoading ? '⏳' : (weather ? getWeatherIcon(weather.icon) : '🌤️')}
                      </div>
                      <div className="text-3xl font-bold text-gray-800">
                        {weatherLoading ? '--' : (weather ? `${weather.temperature}°C` : '--')}
                      </div>
                      <div className="text-sm text-gray-500 mb-1">
                        {weatherLoading ? '加载中...' : (weather ? `${weather.city} ${weather.description}` : '点击刷新')}
                      </div>
                      <div className="text-xs text-gray-400 mb-3">
                        {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
                      </div>
                      {showCitySearch ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={searchCity}
                            onChange={(e) => setSearchCity(e.target.value)}
                            placeholder="输入城市名"
                            className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && searchCity.trim()) {
                                fetchWeather(searchCity.trim());
                                setShowCitySearch(false);
                                setSearchCity('');
                              }
                            }}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                fetchWeather();
                                setShowCitySearch(false);
                                setSearchCity('');
                              }}
                              className="flex-1 py-1.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                              title="获取当前位置"
                            >
                              <span>📍</span>
                              <span>当前位置</span>
                            </button>
                            <button
                              onClick={() => {
                                setShowCitySearch(false);
                                setSearchCity('');
                              }}
                              className="flex-1 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowCitySearch(true)}
                          className="w-full py-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <span>📍</span>
                          <span>切换城市</span>
                        </button>
                      )}
                      {showCitySearch && searchCity && citySuggestions.length > 0 && (
                        <div className="mt-2 border border-gray-200 rounded-lg bg-white max-h-24 overflow-y-auto">
                          {citySuggestions.map((city) => (
                            <button
                              key={city}
                              onClick={() => {
                                fetchWeather(city);
                                setShowCitySearch(false);
                                setSearchCity('');
                              }}
                              className="w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 text-left transition-colors"
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">快速开始</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { title: '添加新衣物', desc: '智能识别，一键入柜', icon: Upload, action: () => requireLogin(() => setShowSmartIntake(true)) },
                        { title: '开始搭配', desc: '组合你的穿搭', icon: Plus, action: () => setActiveTab('outfits') },
                        { title: '收纳管理', desc: '管理存放位置', icon: Package, action: () => setActiveTab('locations') },
                      ].map(item => (
                        <motion.button
                          key={item.title}
                          whileHover={{ y: -3 }}
                          onClick={item.action}
                          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm hover:shadow-md transition-all text-left group"
                        >
                          <item.icon className="w-12 h-12 text-purple-500 bg-purple-50 rounded-xl p-3 mb-4 group-hover:bg-purple-100 transition-colors" />
                          <div className="font-semibold text-gray-800">{item.title}</div>
                          <div className="text-sm text-gray-500">{item.desc}</div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">最近搭配</h3>
                      {outfits.length > 3 && (
                        <button onClick={() => setActiveTab('outfits')} className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                          查看全部 <ChevronRight size={16} />
                        </button>
                      )}
                    </div>
                    {outfits.length > 0 ? (
                      <div className="grid grid-cols-3 gap-4">
                        {outfits.slice(0, 3).map(outfit => {
                          const outfitItems = outfit.items.map(id => clothes.find(c => c.id === id)).filter(Boolean);
                          return (
                            <motion.div
                              key={outfit.id}
                              whileHover={{ y: -3 }}
                              onTap={() => {
                                if (ignoreNextCardTap.current) {
                                  ignoreNextCardTap.current = false;
                                  return;
                                }
                                setSelectedOutfit(outfit);
                                setShowOutfitDetailModal(true);
                              }}
                              className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                      key={star}
                                      type="button"
                                      onMouseDown={() => { ignoreNextCardTap.current = true; }}
                                      onClick={async () => {
                                        setOutfits(prev => prev.map(o => 
                                          o.id === outfit.id ? { ...o, rating: star } : o
                                        ));
                                        await supabaseData.updateOutfit(outfit.id, { rating: star });
                                      }}
                                      className="p-0.5 hover:scale-110 transition-transform"
                                    >
                                      <Star 
                                        className={`w-4 h-4 ${star <= outfit.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-gray-400'}`}
                                      />
                                    </button>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-2 mb-3">
                                {outfit.items.slice(0, 6).map(itemId => {
                                  const item = clothes.find(c => c.id === itemId);
                                  return item ? (
                                    <div key={itemId} className="w-14 h-16 rounded-xl overflow-hidden border-2 border-gray-100 flex-shrink-0">
                                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = getFallbackImage(item.id, 200); }} />
                                    </div>
                                  ) : null;
                                })}
                                {outfit.items.length > 6 && (
                                  <div className="w-14 h-16 rounded-xl border-2 border-gray-100 flex-shrink-0 flex items-center justify-center bg-gray-50">
                                    <span className="text-xs text-gray-500">+{outfit.items.length - 6}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Thermometer className="w-4 h-4" />
                                {outfit.suitableTemp}
                              </div>
                              
                              <div className="flex flex-wrap gap-1 mt-1">
                                {outfit.season && (
                                  <span className="px-2 py-0.5 text-xs bg-pink-100 text-pink-600 rounded-full">
                                    {outfit.season}
                                  </span>
                                )}
                                {outfit.occasion && (
                                  <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                                    {outfit.occasion}
                                  </span>
                                )}
                                {outfit.style && (
                                  <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-600 rounded-full">
                                    {outfit.style}
                                  </span>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-white/60 rounded-2xl">
                        <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">这里什么也没有~</p>
                        <p className="text-sm text-gray-400 mt-1">快来搭配吧</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'closet' && (
                <motion.div
                  key="closet"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setSelectedCategory(null);
                          setShowFavoritesOnly(false);
                        }}
                        className={`px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 ${
                          !selectedCategory && !showFavoritesOnly
                            ? 'bg-[#f472d0] border-black border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white rounded-xl' 
                            : 'bg-white/60 hover:bg-white/80 text-gray-600 rounded-full'
                        }`}
                      >
                        全部
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCategory(null);
                          setShowFavoritesOnly(true);
                        }}
                        className={`px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 ${
                          showFavoritesOnly
                            ? 'bg-[#f472d0] border-black border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white rounded-xl' 
                            : 'bg-white/60 hover:bg-white/80 text-gray-600 rounded-full'
                        }`}
                      >
                        <Heart className="w-4 h-4" />
                        收藏夹
                      </button>
                      {Object.entries(categoryNames).map(([key, name]) => {
                        const Icon = categoryIcons[key as keyof typeof categoryIcons];
                        return (
                          <button
                            key={key}
                            onClick={() => {
                              setSelectedCategory(key);
                              setShowFavoritesOnly(false);
                            }}
                            className={`px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 ${
                              selectedCategory === key && !showFavoritesOnly
                                ? 'bg-[#f472d0] border-black border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white rounded-xl' 
                                : 'bg-white/60 hover:bg-white/80 text-gray-600 rounded-full'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            {name}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      {!isBatchDeleteMode ? (
                        <button
                          onClick={() => setIsBatchDeleteMode(true)}
                          className="flex items-center gap-2 px-4 py-2 text-sm bg-red-500 border-black border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-[-2px] hover:translate-y-0 transition-all rounded-xl font-bold text-white"
                        >
                          <X className="w-4 h-4" />
                          批量删除
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (selectedClothes.length === clothes.length) {
                                setSelectedClothes([]);
                              } else {
                                setSelectedClothes(clothes.map(item => item.id));
                              }
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-500 border-black border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-[-2px] hover:translate-y-0 transition-all rounded-xl font-bold text-white"
                          >
                            <Check className="w-4 h-4" />
                            {selectedClothes.length === clothes.length ? '取消全选' : '全选'}
                          </button>
                          <button
                            onClick={() => setShowClothingDeleteConfirmModal(true)}
                            disabled={selectedClothes.length === 0}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 border-black border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-[-2px] hover:translate-y-0 transition-all rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Check className="w-4 h-4" />
                            确认删除 ({selectedClothes.length})
                          </button>
                          <button
                            onClick={() => {
                              setIsBatchDeleteMode(false);
                              setSelectedClothes([]);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-400 border-black border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-[-2px] hover:translate-y-0 transition-all rounded-xl font-bold text-white"
                          >
                            <X className="w-4 h-4" />
                            取消
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => requireLogin(() => setShowSmartIntake(true))}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-[#f472d0] border-black border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-[-2px] hover:translate-y-0 transition-all rounded-xl font-bold text-white"
                      >
                        <Plus className="w-4 h-4" />
                        添加服饰
                      </button>
                    </div>
                  </div>

                  {selectedCategory || showFavoritesOnly ? (
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
                      {clothes
                        .filter(item => {
                          if (showFavoritesOnly && !item.isFavorite) return false;
                          if (selectedCategory && item.category !== selectedCategory) return false;
                          return true;
                        })
                        .map(item => {
                          const Icon = categoryIcons[item.category];
                          return (
                            <motion.div
                              key={item.id}
                              onClick={() => {
                                if (isBatchDeleteMode) {
                                  toggleClothingSelection(item.id);
                                } else {
                                  setSelectedClothing(item);
                                  setShowClothingDetailModal(true);
                                }
                              }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`relative bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group ${
                                selectedClothes.includes(item.id) ? 'ring-2 ring-purple-500' : ''
                              }`}
                            >
                              {isBatchDeleteMode && (
                                <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all ${
                                  selectedClothes.includes(item.id) 
                                    ? 'bg-purple-500' 
                                    : 'bg-white/80 border-2 border-gray-300'
                                }`}>
                                  {selectedClothes.includes(item.id) && <Check className="w-4 h-4 text-white" />}
                                </div>
                              )}
                              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                <img 
                                  src={item.image} 
                                  alt={item.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-white text-xs font-medium truncate flex-1 mr-2">{item.name}</span>
                                    <div className="flex items-center gap-1">
                                      <Icon className="w-4 h-4 text-white/80 flex-shrink-0" />
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleFavorite(item.id);
                                        }}
                                        className="p-1 bg-black/40 hover:bg-black/60 rounded-full transition-all"
                                      >
                                        <Heart 
                                          className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-pink-500 text-pink-500' : 'text-white/70'}`} 
                                        />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(categoryNames).map(([key, name]) => {
                        const categoryClothes = clothes.filter(item => item.category === key);
                        if (categoryClothes.length === 0) return null;
                        const Icon = categoryIcons[key as keyof typeof categoryIcons];
                        return (
                          <div key={key} className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Icon className="w-5 h-5 text-purple-500" />
                              <h3 className="font-semibold text-gray-800">{name}</h3>
                              <span className="text-sm text-gray-400">({categoryClothes.length})</span>
                            </div>
                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
                              {categoryClothes.map(item => (
                                <motion.div
                                  key={item.id}
                                  onClick={() => {
                                    if (isBatchDeleteMode) {
                                      toggleClothingSelection(item.id);
                                    } else {
                                      setSelectedClothing(item);
                                      setShowClothingDetailModal(true);
                                    }
                                  }}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className={`relative bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group ${
                                    selectedClothes.includes(item.id) ? 'ring-2 ring-purple-500' : ''
                                  }`}
                                >
                                  {isBatchDeleteMode && (
                                    <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all ${
                                      selectedClothes.includes(item.id) 
                                        ? 'bg-purple-500' 
                                        : 'bg-white/80 border-2 border-gray-300'
                                    }`}>
                                      {selectedClothes.includes(item.id) && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                  )}
                                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                    <img 
                                      src={item.image} 
                                      alt={item.name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-white text-xs font-medium truncate flex-1 mr-2">{item.name}</span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFavorite(item.id);
                                          }}
                                          className="p-1 bg-black/40 hover:bg-black/60 rounded-full transition-all"
                                        >
                                          <Heart 
                                            className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-pink-500 text-pink-500' : 'text-white/70'}`} 
                                          />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {clothes.length === 0 && (
                        <div className="text-center py-16">
                          <Shirt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">还没有添加任何服饰</p>
                          <p className="text-sm text-gray-400">点击上方按钮添加你的第一件衣物吧！</p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'locations' && (
                <motion.div
                  key="locations"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">存放与收纳管理</h2>
                    <button
                      onClick={() => setShowAddLocationModal(true)}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-[#f472d0] border-black border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-[-2px] hover:translate-y-0 transition-all rounded-xl font-bold text-white"
                    >
                      <Plus className="w-4 h-4" />
                      添加收纳
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {locations.map(location => (
                      <motion.div
                        key={location.id}
                        whileHover={{ y: -3 }}
                        className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-100 cursor-pointer"
                        onClick={() => {
                          setSelectedStorage(location);
                          setShowStorageDetailModal(true);
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                              <Package className="w-6 h-6 text-purple-500" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800">{location.name}</h3>
                              <p className="text-sm text-gray-500">{clothes.filter(item => item.location === location.name).length} 件服饰</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditLocation(location);
                              }}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Tag className="w-4 h-4 text-gray-500" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLocation(location.id);
                              }}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">{location.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {location.tags.map(tag => (
                            <span 
                              key={tag}
                              className="px-3 py-1 text-xs bg-purple-50 text-purple-600 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'outfits' && (
                <motion.div
                  key="outfits"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">我的搭配</h2>
                    <div className="flex items-center gap-3">
                      {!isOutfitBatchDeleteMode ? (
                        <button
                          onClick={() => setIsOutfitBatchDeleteMode(true)}
                          className="flex items-center gap-2 px-4 py-2 text-sm bg-red-500 border-black border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-[-2px] hover:translate-y-0 transition-all rounded-xl font-bold text-white"
                        >
                          <X className="w-4 h-4" />
                          批量删除
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (selectedOutfits.length === outfits.length) {
                                setSelectedOutfits([]);
                              } else {
                                setSelectedOutfits(outfits.map(item => item.id));
                              }
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-500 border-black border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-[-2px] hover:translate-y-0 transition-all rounded-xl font-bold text-white"
                          >
                            <Check className="w-4 h-4" />
                            {selectedOutfits.length === outfits.length ? '取消全选' : '全选'}
                          </button>
                          <button
                            onClick={() => setShowOutfitDeleteConfirmModal(true)}
                            disabled={selectedOutfits.length === 0}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 border-black border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-[-2px] hover:translate-y-0 transition-all rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Check className="w-4 h-4" />
                            确认删除 ({selectedOutfits.length})
                          </button>
                          <button
                            onClick={() => {
                              setIsOutfitBatchDeleteMode(false);
                              setSelectedOutfits([]);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-400 border-black border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-[-2px] hover:translate-y-0 transition-all rounded-xl font-bold text-white"
                          >
                            <X className="w-4 h-4" />
                            取消
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          requireLogin(() => {
                            setCanvasItems([]);
                            setOutfitCategory(null);
                            setOutfitOccasion('');
                            setNewOutfitName('');
                            setSelectedTemp('20-28°C');
                            setOutfitRating(0);
                            setEditingOutfitId(null);
                            setShowOutfitCanvas(true);
                          });
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-[#f472d0] border-black border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-[-2px] hover:translate-y-0 transition-all rounded-xl font-bold text-white"
                      >
                        <Plus className="w-4 h-4" />
                        新搭配
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showFilterDrawer && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden"
                      >
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-800">筛选搭配</h3>
                            <button
                              onClick={clearFilters}
                              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                            >
                              <RotateCcw className="w-4 h-4" />
                              清除筛选
                            </button>
                          </div>

                          <div className="grid md:grid-cols-3 gap-6">
                            <div>
                              <h4 className="text-sm font-medium text-pink-600 mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                                季节
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {seasonOptions.map(season => (
                                  <button
                                    key={season}
                                    onClick={() => toggleFilterTag(season, 'season')}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                      selectedSeasons.includes(season)
                                        ? 'bg-pink-500 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                  >
                                    {season}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-purple-600 mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                场景
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {sceneOptions.map(scene => (
                                  <button
                                    key={scene}
                                    onClick={() => toggleFilterTag(scene, 'scene')}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                      selectedScenes.includes(scene)
                                        ? 'bg-purple-500 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                  >
                                    {scene}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-violet-600 mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
                                风格
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {styleOptions.map(style => (
                                  <button
                                    key={style}
                                    onClick={() => toggleFilterTag(style, 'style')}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                      selectedStyles.includes(style)
                                        ? 'bg-violet-500 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                  >
                                    {style}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {(selectedSeasons.length > 0 || selectedScenes.length > 0 || selectedStyles.length > 0) && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <p className="text-sm text-gray-500">
                                已选择 {(selectedSeasons.length + selectedScenes.length + selectedStyles.length)} 个筛选条件
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setShowFilterDrawer(!showFilterDrawer)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                        showFilterDrawer
                          ? 'bg-[#f472d0] text-white'
                          : 'bg-white/80 hover:bg-white text-gray-600 shadow-sm'
                      }`}
                    >
                      <Tag className="w-4 h-4" />
                      {showFilterDrawer ? '收起筛选' : '筛选搭配'}
                      {(selectedSeasons.length > 0 || selectedScenes.length > 0 || selectedStyles.length > 0) && (
                        <span className="bg-white/30 px-2 py-0.5 rounded-full text-xs font-medium">
                          {(selectedSeasons.length + selectedScenes.length + selectedStyles.length)}
                        </span>
                      )}
                    </button>
                    <p className="text-sm text-gray-500">
                      共 {filteredOutfits.length} 个搭配
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOutfits.map(outfit => (
                      <motion.div
                        key={outfit.id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => {
                          if (ignoreNextCardTap.current) {
                            ignoreNextCardTap.current = false;
                            return;
                          }
                          if (isOutfitBatchDeleteMode) {
                            setSelectedOutfits(prev =>
                              prev.includes(outfit.id) ? prev.filter(id => id !== outfit.id) : [...prev, outfit.id]
                            );
                          } else {
                            setSelectedOutfit(outfit);
                            setEditedOutfitName(outfit.name);
                            setEditedOutfitOccasion(outfit.occasion || '');
                            setEditedOutfitTemp(outfit.suitableTemp);
                            setIsEditingOutfit(false);
                            setShowOutfitDetailModal(true);
                          }
                        }}
                        className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                          isOutfitBatchDeleteMode && selectedOutfits.includes(outfit.id)
                            ? 'ring-4 ring-red-400'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          {isOutfitBatchDeleteMode && (
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedOutfits.includes(outfit.id) ? 'bg-red-500 border-red-500' : 'border-gray-300'
                            }`}>
                              {selectedOutfits.includes(outfit.id) && <Check className="w-3 h-3 text-white" />}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                key={star}
                                type="button"
                                onMouseDown={() => { ignoreNextCardTap.current = true; }}
                                onClick={async () => {
                                  setOutfits(prev => prev.map(o => 
                                    o.id === outfit.id ? { ...o, rating: star } : o
                                  ));
                                  await supabaseData.updateOutfit(outfit.id, { rating: star }, currentUser?.id);
                                }}
                                className="p-0.5 hover:scale-110 transition-transform"
                              >
                                <Star 
                                  className={`w-4 h-4 ${star <= outfit.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-gray-400'}`}
                                />
                              </button>
                            ))}
                          </div>
                          <p className="text-sm text-gray-400">{outfit.createdAt}</p>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {outfit.items.slice(0, 6).map(itemId => {
                            const item = clothes.find(c => c.id === itemId);
                            return item ? (
                              <div key={itemId} className="w-16 h-20 rounded-xl overflow-hidden border-2 border-gray-100 flex-shrink-0">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                            ) : null;
                          })}
                          {outfit.items.length > 6 && (
                            <div className="w-16 h-20 rounded-xl border-2 border-gray-100 flex-shrink-0 flex items-center justify-center bg-gray-50">
                              <span className="text-sm text-gray-500">+{outfit.items.length - 6}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Thermometer className="w-4 h-4" />
                          {outfit.suitableTemp}
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          {outfit.season && (
                            <span className="px-2 py-1 text-xs bg-pink-100 text-pink-600 rounded-full">
                              {outfit.season}
                            </span>
                          )}
                          {outfit.occasion && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
                              {outfit.occasion}
                            </span>
                          )}
                          {outfit.style && (
                            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-600 rounded-full">
                              {outfit.style}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {outfits.length === 0 && (
                    <div className="text-center py-16">
                      <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">还没有搭配记录</p>
                      <p className="text-sm text-gray-400">快去衣橱选择衣服创建搭配吧！</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'checkin' && (
                <motion.div
                  key="checkin"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">我的打卡</h2>
                    <p className="text-sm text-gray-500">记录每一天的穿搭与心情 ✨</p>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="lg:w-2/5 space-y-6">
                      <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                          <button
                            onClick={() => {
                              const prevMonth = new Date(currentCalendarMonth);
                              prevMonth.setMonth(prevMonth.getMonth() - 1);
                              setCurrentCalendarMonth(prevMonth);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <ChevronLeft className="w-6 h-6" />
                          </button>
                          <h3 className="text-lg font-bold text-gray-800">
                            {currentCalendarMonth.getFullYear()}年{currentCalendarMonth.getMonth() + 1}月
                          </h3>
                          <button
                            onClick={() => {
                              const nextMonth = new Date(currentCalendarMonth);
                              nextMonth.setMonth(nextMonth.getMonth() + 1);
                              setCurrentCalendarMonth(nextMonth);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <ChevronRight className="w-6 h-6" />
                          </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                            <div key={day} className="text-xs text-center text-gray-400 py-2 font-medium">
                              {day}
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                          {generateCheckinCalendarDays().map((day, index) => {
                            if (!day) {
                              return <div key={index} className="h-14" />;
                            }
                            const dateStr = `${day.year}-${day.month.toString().padStart(2, '0')}-${day.day.toString().padStart(2, '0')}`;
                            const entry = checkinEntries[dateStr];
                            const isToday = day.isToday;
                            const isFuture = day.isFuture;
                            const isSelected = selectedCheckinDate === dateStr;
                            
                            return (
                              <button
                                key={index}
                                disabled={isFuture}
                                onClick={() => !isFuture && handleCheckinDayClick(dateStr)}
                                className={`h-14 rounded-xl flex flex-col items-center justify-center text-sm transition-all relative ${
                                  isSelected 
                                    ? 'bg-pink-500 text-white font-medium' 
                                    : isToday 
                                      ? 'bg-gray-100 text-gray-500 font-medium' 
                                      : entry 
                                        ? 'bg-pink-100 text-pink-600 font-medium' 
                                        : isFuture 
                                          ? 'text-gray-200 cursor-not-allowed' 
                                          : 'hover:bg-gray-100 text-gray-600'
                                }`}
                              >
                                <span>{day.day}</span>
                                {entry && (
                                  <span className="absolute bottom-1 text-xs flex gap-0.5">
                                    {(entry.outfitImage || entry.outfitId) && '👗'}
                                    {entry.mood && '😊'}
                                    {entry.activities.length > 0 && '📝'}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const today = new Date().toISOString().split('T')[0];
                          setSelectedCheckinDate(today);
                          setCheckinMood('');
                          setCheckinActivity('');
                          setCheckinDiary('');
                          setCheckinOutfitImage(null);
                          setShowCheckinModal(true);
                        }}
                        className="w-full py-4 bg-gradient-to-r from-pink-400 to-purple-500 text-white rounded-2xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        今日打卡
                      </button>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                              <span className="text-xl">👗</span>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">本月穿搭</p>
                              <p className="text-lg font-bold text-gray-800">
                                {getMonthlyCheckinCount('outfit')}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                              <span className="text-xl">😊</span>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">本月心情</p>
                              <p className="text-lg font-bold text-gray-800">
                                {getMonthlyCheckinCount('mood')}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                              <span className="text-xl">📝</span>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">本月活动</p>
                              <p className="text-lg font-bold text-gray-800">
                                {getMonthlyCheckinCount('activity')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:w-3/5 space-y-4">
                      {selectedCheckinDate ? (
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800">
                              {formatDate(selectedCheckinDate)} 打卡详情
                            </h3>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  const entry = checkinEntries[selectedCheckinDate];
                                  setCheckinMood(entry?.mood || '');
                                  setCheckinDiary(entry?.diary || '');
                                  setCheckinOutfitImage(entry?.outfitImage || null);
                                  const outfit = entry?.outfitId ? outfits.find(o => o.id === entry.outfitId) : null;
                                  setSelectedOutfit(outfit || null);
                                  setShowCheckinModal(true);
                                }}
                                className="px-3 py-1 text-sm bg-pink-100 text-pink-600 rounded-full hover:bg-pink-200 transition-colors flex items-center gap-1"
                              >
                                <Edit2 className="w-4 h-4" />
                                编辑
                              </button>
                              <button
                                onClick={() => handleDeleteCheckin(selectedCheckinDate)}
                                className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors flex items-center gap-1"
                              >
                                <Trash2 className="w-4 h-4" />
                                删除
                              </button>
                            </div>
                          </div>
                          {checkinEntries[selectedCheckinDate] ? (
                            <div className="space-y-4">
                              {(checkinEntries[selectedCheckinDate]!.outfitImage || checkinEntries[selectedCheckinDate]!.outfitId) && (
                                <div>
                                  <p className="text-sm text-gray-500 mb-2">今日穿搭</p>
                                  {checkinEntries[selectedCheckinDate]!.outfitImage ? (
                                    <img 
                                      src={checkinEntries[selectedCheckinDate]!.outfitImage} 
                                      alt="今日穿搭"
                                      className="w-full h-32 object-contain bg-gray-50 rounded-xl"
                                    />
                                  ) : (
                                    <div className="grid grid-cols-4 gap-2 max-h-[120px] overflow-y-auto">
                                      {(() => {
                                        const outfit = outfits.find(o => o.id === checkinEntries[selectedCheckinDate]!.outfitId);
                                        if (!outfit || !outfit.items) return null;
                                        return outfit.items.map((itemId) => {
                                          const clothingItem = clothes.find(c => c.id === itemId);
                                          return clothingItem ? (
                                            <img 
                                              key={itemId}
                                              src={clothingItem.image}
                                              alt={clothingItem.name}
                                              className="w-full aspect-square object-cover rounded-lg"
                                            />
                                          ) : null;
                                        });
                                      })()}
                                    </div>
                                  )}
                                </div>
                              )}
                              {checkinEntries[selectedCheckinDate]!.mood && (
                                <div>
                                  <p className="text-sm text-gray-500 mb-2">今日心情</p>
                                  <span className="text-2xl">{getMoodEmoji(checkinEntries[selectedCheckinDate]!.mood)}</span>
                                  <span className="ml-2 text-gray-600">{checkinEntries[selectedCheckinDate]!.mood}</span>
                                </div>
                              )}
                              {checkinEntries[selectedCheckinDate]!.activities.length > 0 && (
                                <div>
                                  <p className="text-sm text-gray-500 mb-2">今日活动</p>
                                  <div className="flex flex-wrap gap-2">
                                    {checkinEntries[selectedCheckinDate]!.activities.map((act, idx) => (
                                      <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                                        {act}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {checkinEntries[selectedCheckinDate]!.diary && (
                                <div>
                                  <p className="text-sm text-gray-500 mb-2">今日日记</p>
                                  <p className="text-gray-600">{checkinEntries[selectedCheckinDate]!.diary}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-12 text-gray-400">
                              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                              <p>该日期暂无打卡记录</p>
                              <button
                                onClick={() => setShowCheckinModal(true)}
                                className="mt-4 px-4 py-2 bg-pink-100 text-pink-600 rounded-full text-sm hover:bg-pink-200 transition-colors"
                              >
                                去打卡
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">选择一个日期查看详情</p>
                          <p className="text-sm text-gray-400 mt-1">或点击下方按钮开始今日打卡</p>
                        </div>
                      )}

                      <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">本月打卡记录</h3>
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          {Object.entries(checkinEntries)
                            .filter(([date]) => {
                              const d = new Date(date);
                              return d.getMonth() === currentCalendarMonth.getMonth() && 
                                     d.getFullYear() === currentCalendarMonth.getFullYear();
                            })
                            .sort((a, b) => b[0].localeCompare(a[0]))
                            .map(([date, entry]) => (
                              <div 
                                key={date} 
                                onClick={() => setSelectedCheckinDate(date)}
                                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                                  selectedCheckinDate === date ? 'bg-pink-50' : 'hover:bg-gray-50'
                                }`}
                              >
                                <span className="font-medium text-gray-800">{formatDate(date)}</span>
                                <div className="flex gap-2">
                                  {entry.outfitImage && <span className="text-lg">👗</span>}
                                  {entry.mood && <span className="text-lg">{getMoodEmoji(entry.mood)}</span>}
                                  {entry.activities.length > 0 && <span className="text-lg">📝</span>}
                                </div>
                              </div>
                            ))}
                          {Object.entries(checkinEntries).filter(([date]) => {
                            const d = new Date(date);
                            return d.getMonth() === currentCalendarMonth.getMonth() && 
                                   d.getFullYear() === currentCalendarMonth.getFullYear();
                          }).length === 0 && (
                            <p className="text-center text-gray-400 py-4">本月暂无打卡记录</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
        </main>
      </div>

      {(activeTab === 'closet' || activeTab === 'outfits') && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(244, 114, 208, 0.4)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (activeTab === 'closet') {
              openBlindBox('clothing');
            } else if (activeTab === 'outfits') {
              openBlindBox('outfit');
            }
          }}
          className="fixed bottom-8 right-8 z-50 flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white shadow-lg transition-all bg-gradient-to-r from-[#f472d0] to-purple-500 cursor-pointer"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <PackageCheck className="w-5 h-5" />
          </motion.div>
          <span>随机盲盒 ✨</span>
        </motion.button>
      )}

      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4"
            onWheel={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">添加服饰</h3>
                <button onClick={() => { resetUploadState(); setShowUploadModal(false); }} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 mb-6">
                  {uploadStep === 'crop' ? (
                    ['upload', 'crop', 'edit'].map((step, index) => (
                      <div key={step} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          uploadStep === step 
                            ? 'bg-purple-500 text-white' 
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          {index + 1}
                        </div>
                        <span className={`text-sm ${
                          uploadStep === step ? 'text-purple-600 font-medium' : 'text-gray-400'
                        } ml-2`}>
                          {step === 'upload' && '上传图片'}
                          {step === 'crop' && '编辑图片'}
                          {step === 'edit' && '编辑信息'}
                        </span>
                        {index < 2 && <div className="w-8 h-0.5 bg-gray-200 mx-2"></div>}
                      </div>
                    ))
                  ) : (
                    ['upload', 'recognize', 'edit'].map((step, index) => (
                      <div key={step} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          uploadStep === step 
                            ? 'bg-purple-500 text-white' 
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          {index + 1}
                        </div>
                        <span className={`text-sm ${
                          uploadStep === step ? 'text-purple-600 font-medium' : 'text-gray-400'
                        } ml-2`}>
                          {step === 'upload' && '上传图片'}
                          {step === 'recognize' && '识别服饰'}
                          {step === 'edit' && '编辑信息'}
                        </span>
                        {index < 2 && <div className="w-8 h-0.5 bg-gray-200 mx-2"></div>}
                      </div>
                    ))
                  )}
                </div>

                {uploadStep === 'upload' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">上传服饰图片：</p>
                    
                    {uploadedImage ? (
                      <div className="space-y-3">
                        <div className="relative w-full border-2 border-purple-400 rounded-xl overflow-hidden">
                          <img 
                            src={uploadedImage} 
                            alt="已上传的图片" 
                            className="w-full max-h-80 object-contain bg-gray-100"
                          />
                          <button
                            onClick={clearUploadedImage}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => { setUploadStep('crop'); setEditEntryFrom('crop'); }}
                            className="flex-1 py-2 text-sm bg-white border-black border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-[-2px] hover:translate-y-0 transition-all rounded-xl font-bold text-gray-800"
                          >
                            🎨 自定义编辑
                          </button>
                          <button
                            onClick={() => { setUploadStep('recognize'); setEditEntryFrom('ai'); }}
                            className="flex-1 py-2 text-sm bg-[#f472d0] border-black border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-[-2px] hover:translate-y-0 transition-all rounded-xl font-bold text-white"
                          >
                            🤖 AI识别
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 min-h-[128px]"
                        contentEditable={true}
                        onPaste={(e) => {
                          e.preventDefault();
                          const items = e.clipboardData?.items;
                          if (items) {
                            for (const item of items) {
                              if (item.type.startsWith('image/')) {
                                const file = item.getAsFile();
                                if (file) {
                                  handleFileUpload({ target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>);
                                }
                              }
                            }
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const files = e.dataTransfer?.files;
                          if (files && files.length > 0) {
                            handleFileUpload({ target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>);
                          }
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                        }}
                        onClick={(e) => {
                          e.currentTarget.focus();
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.focus();
                        }}
                        suppressContentEditableWarning={true}
                      >
                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                          <Upload className="w-12 h-12 text-gray-400 mb-3" />
                          <span className="text-sm text-gray-600">点击上传或拖拽图片到此处</span>
                          <span className="text-xs text-gray-400 mt-2">或复制图片后粘贴到此处</span>
                          <span className="text-xs text-gray-400">支持 JPG、PNG、GIF 格式</span>
                        </label>
                      </div>
                    )}

                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ImageIcon className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-700">快捷提示</span>
                      </div>
                      <ul className="text-xs text-blue-600 space-y-1">
                        <li>• 可以从网页或相册复制图片后粘贴</li>
                        <li>• 支持拖拽图片文件到上传区域</li>
                        <li>• 也可以点击选择本地图片文件</li>
                      </ul>
                    </div>
                  </div>
                )}

                {uploadStep === 'crop' && uploadedImage && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">自定义编辑：</p>
                      <div className="group relative">
                        <button className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                          <HelpCircle size={16} className="text-gray-500" />
                        </button>
                        <div className="absolute top-full right-0 mt-2 w-56 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-30 shadow-lg">
                          <p className="font-medium mb-2">💡 使用提示</p>
                          <ul className="space-y-1 text-gray-300">
                            <li>• 画笔：涂抹要保留的区域</li>
                            <li>• 橡皮擦：恢复被擦除的区域</li>
                            <li>• 魔棒：点击选择相似颜色区域</li>
                            <li>• 滚轮：缩放图片查看细节</li>
                            <li>• 移动工具：拖动图片</li>
                          </ul>
                          <div className="absolute -top-2 right-4 w-4 h-4 bg-gray-900 rotate-45"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative w-full border-2 border-purple-400 rounded-xl overflow-hidden bg-gray-100" style={{ maxHeight: '320px' }}>
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 rounded-lg px-2 py-1 text-white text-xs z-20">
                        <span>{Math.round(cropScale * 100)}%</span>
                      </div>
                      <div 
                        className="relative w-full h-full flex items-center justify-center overflow-hidden" 
                        style={{ maxHeight: '320px' }}
                        onWheel={(e) => { 
                          e.preventDefault(); 
                          e.stopPropagation();
                          const delta = e.deltaY > 0 ? 0.9 : 1.1;
                          setCropScale(prev => Math.min(Math.max(prev * delta, 0.25), 4));
                        }}
                      >
                        <div className="relative" style={{ transform: `scale(${cropScale}) translate(${cropOffset.x}px, ${cropOffset.y}px)`, transformOrigin: 'center center' }}>
                          <canvas
                            ref={canvasRef}
                            className="block"
                            onMouseDown={handleCropMouseDown}
                            onMouseMove={handleCropMouseMove}
                            onMouseUp={handleCropMouseUp}
                            onMouseLeave={handleCropMouseUp}
                            onWheel={handleCropWheel}
                          />
                          <canvas
                            ref={maskCanvasRef}
                            className="absolute top-0 left-0 pointer-events-none"
                            style={{ opacity: 0.8 }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={handleAutoCrop}
                        disabled={isAutoCropping}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 rounded-lg text-white font-medium transition-colors"
                      >
                        <Sparkles size={18} />
                        {isAutoCropping ? '处理中...' : '✨ 自动抠图'}
                      </button>
                      
                      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => setCropTool('brush')}
                          className={`p-2.5 rounded-lg transition-colors ${cropTool === 'brush' ? 'bg-purple-500 text-white' : 'hover:bg-gray-200 text-gray-700'}`}
                          title="画笔 - 涂抹保留区域"
                        >
                          <Brush size={20} />
                        </button>
                        <button
                          onClick={() => setCropTool('eraser')}
                          className={`p-2.5 rounded-lg transition-colors ${cropTool === 'eraser' ? 'bg-purple-500 text-white' : 'hover:bg-gray-200 text-gray-700'}`}
                          title="橡皮擦 - 恢复遮罩"
                        >
                          <Eraser size={20} />
                        </button>
                        <button
                          onClick={() => setCropTool('magic')}
                          className={`p-2.5 rounded-lg transition-colors ${cropTool === 'magic' ? 'bg-purple-500 text-white' : 'hover:bg-gray-200 text-gray-700'}`}
                          title="魔棒 - 自动选择相似区域"
                        >
                          <Wand2 size={20} />
                        </button>
                        <button
                          onClick={() => setCropTool('move')}
                          className={`p-2.5 rounded-lg transition-colors ${cropTool === 'move' ? 'bg-purple-500 text-white' : 'hover:bg-gray-200 text-gray-700'}`}
                          title="移动 - 拖动图片"
                        >
                          <Move size={20} />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                        <span className="text-sm text-gray-600">画笔大小</span>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={cropBrushSize}
                          onChange={(e) => setCropBrushSize(Number(e.target.value))}
                          className="w-32 accent-purple-500"
                        />
                        <span className="text-sm text-gray-600 w-8 font-medium">{cropBrushSize}px</span>
                      </div>
                      
                      <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                        <span className="text-sm text-gray-600">容差</span>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={cropTolerance}
                          onChange={(e) => setCropTolerance(Number(e.target.value))}
                          className="w-24 accent-purple-500"
                        />
                        <span className="text-sm text-gray-600 w-8">{cropTolerance}</span>
                      </div>
                      
                      <button
                        onClick={handleCropUndo}
                        disabled={cropHistory.length <= 1}
                        className="px-3 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg text-gray-700 transition-colors"
                        title="撤销"
                      >
                        ↩️
                      </button>
                      
                      <button
                        onClick={handleCropRedo}
                        disabled={cropRedoStack.length === 0}
                        className="px-3 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg text-gray-700 transition-colors"
                        title="重做"
                      >
                        ↪️
                      </button>
                      
                      <button
                        onClick={handleCropReset}
                        className="px-3 py-2 bg-orange-100 hover:bg-orange-200 rounded-lg text-orange-700 transition-colors"
                        title="重置"
                      >
                        🔄
                      </button>
                      
                      <button
                        onClick={() => {
                          if (originalImage) {
                            setUploadedImage(originalImage);
                          }
                          setSavedMaskState(null);
                          setUploadStep('upload');
                        }}
                        className="px-4 py-2 text-sm bg-white border-black border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-[-2px] hover:translate-y-0 transition-all rounded-xl font-bold text-gray-800"
                      >
                        返回
                      </button>
                      
                      <button
                        onClick={handleCropComplete}
                        className="px-6 py-2 text-sm bg-[#f472d0] border-black border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-[-2px] hover:translate-y-0 transition-all rounded-xl font-bold text-white"
                      >
                        完成编辑
                      </button>
                    </div>
                    
                    </div>
                )}

                {uploadStep === 'recognize' && (
                  <div className="space-y-4">
                    {uploadedImage && (
                      <div className="rounded-xl overflow-hidden mb-4 border-2 border-purple-400">
                        <img src={uploadedImage} alt="上传的图片" className="w-full max-h-48 object-contain bg-gray-100" />
                      </div>
                    )}
                    
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="w-16 h-16 border-4 border-purple-300 border-t-purple-500 rounded-full animate-spin mb-4"></div>
                      <p className="text-gray-600">AI正在识别图片中的服饰...</p>
                    </div>
                  </div>
                )}

                {uploadStep === 'edit' && (
                  <div className="space-y-4">
                    {uploadedImage && (
                      <div className="rounded-xl overflow-hidden mb-4 border-2 border-purple-400">
                        <img src={uploadedImage} alt="上传的图片" className="w-full max-h-48 object-contain bg-gray-100" />
                      </div>
                    )}

                    <p className="text-sm text-gray-500">识别到 {recognizedItems.length} 件服饰：</p>

                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {recognizedItems.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gray-50 rounded-xl p-4"
                        >
                          <div className="flex items-start gap-3">
                            <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => updateRecognizedItem(index, { name: e.target.value })}
                                  className="flex-1 px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <button
                                  onClick={() => removeRecognizedItem(index)}
                                  className="p-1 hover:bg-red-100 rounded-lg transition-colors ml-2"
                                >
                                  <X className="w-4 h-4 text-red-500" />
                                </button>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-xs text-gray-500">类别</label>
                                  <select
                                    value={item.category}
                                    onChange={(e) => updateRecognizedItem(index, { category: e.target.value as ClothingItem['category'] })}
                                    className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  >
                                    <option value="top">上衣</option>
                                    <option value="bottom">裤子</option>
                                    <option value="dress">连衣裙</option>
                                    <option value="outerwear">外套</option>
                                    <option value="accessory">配饰</option>
                                    <option value="shoes">鞋子</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500">存放位置</label>
                                  <select
                                    value={item.location || ''}
                                    onChange={(e) => updateRecognizedItem(index, { location: e.target.value || undefined })}
                                    className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  >
                                    <option value="">请选择</option>
                                    {locations.map(loc => (
                                      <option key={loc.id} value={loc.name}>{loc.name}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className="mt-2">
                                <label className="text-xs text-gray-500">颜色</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={item.color}
                                    onChange={(e) => updateRecognizedItem(index, { color: e.target.value })}
                                    className="w-8 h-8 rounded-lg cursor-pointer border border-gray-200"
                                  />
                                  <span className="text-xs text-gray-600">{item.color}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          if (editEntryFrom === 'crop') {
                            handleEditBackToCrop();
                          } else {
                            setUploadStep('upload');
                          }
                        }}
                        className="flex-1 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200"
                      >
                        返回
                      </button>
                      <button
                        onClick={addClothingToCloset}
                        disabled={recognizedItems.length === 0}
                        className="flex-1 py-2 text-sm bg-[#f472d0] border-black border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-[-2px] hover:translate-y-0 transition-all rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:hover:translate-y-0"
                      >
                        确认添加
                      </button>
                    </div>
                  </div>
                )}
            </motion.div>
          </motion.div>
        )}

        {showOutfitDetailModal && selectedOutfit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4"
            onClick={() => setShowOutfitDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">
                  {isEditingOutfit ? '编辑搭配信息' : selectedOutfit.name}
                </h3>
                <button onClick={() => setShowOutfitDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                {!isEditingOutfit ? (
                  <div className="space-y-4">
                    <div className="flex gap-3 flex-wrap">
                      {selectedOutfit.items.map(itemId => {
                        const item = clothes.find(c => c.id === itemId);
                        return item ? (
                          <motion.div
                            key={itemId}
                            className="w-20 h-24 rounded-xl overflow-hidden border-2 border-gray-100 cursor-pointer group"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSelectedClothing(item);
                              setShowClothingDetailModal(true);
                            }}
                          >
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </motion.div>
                        ) : null;
                      })}
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-gray-500">搭配名称</span>
                        <span className="font-medium text-gray-800">{selectedOutfit.name}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-gray-500">适宜温度</span>
                        <span className="font-medium text-gray-800">{selectedOutfit.suitableTemp}</span>
                      </div>
                      {selectedOutfit.occasion && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-gray-500">适宜场合</span>
                          <span className="font-medium text-gray-800">{selectedOutfit.occasion}</span>
                        </div>
                      )}
                      {selectedOutfit.season && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-gray-500">季节</span>
                          <span className="font-medium text-gray-800">{selectedOutfit.season}</span>
                        </div>
                      )}
                      {selectedOutfit.style && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-gray-500">风格</span>
                          <span className="font-medium text-gray-800">{selectedOutfit.style}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between py-2">
                        <span className="text-gray-500">创建日期</span>
                        <span className="font-medium text-gray-800">{selectedOutfit.createdAt}</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => {
                          setEditedOutfitSeason(selectedOutfit.season || '');
                          setEditedOutfitStyle(selectedOutfit.style || '');
                          setIsEditingOutfit(true);
                        }}
                        className="flex-1 py-3 bg-[#f472d0] text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
                      >
                        编辑信息
                      </button>
                      <button
                        onClick={() => {
                          setShowOutfitDetailModal(false);
                          setCanvasItems(selectedOutfit.items.map(id => ({
                            id,
                            x: 100,
                            y: 100,
                            scale: 1,
                            rotation: 0,
                            width: 150,
                            height: 200,
                          })));
                          setNewOutfitName(selectedOutfit.name);
                          setSelectedTemp(selectedOutfit.suitableTemp || '20-28°C');
                          setOutfitRating(selectedOutfit.rating || 0);
                          setEditingOutfitId(selectedOutfit.id);
                          setShowOutfitCanvas(true);
                        }}
                        className="flex-1 py-3 bg-purple-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
                      >
                        编辑穿搭
                      </button>
                      <button
                        onClick={() => {
                          setOutfits(prev => prev.filter(item => item.id !== selectedOutfit.id));
                          setShowOutfitDetailModal(false);
                        }}
                        className="px-6 py-3 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200 transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">搭配名称</label>
                      <input
                        type="text"
                        value={editedOutfitName}
                        onChange={(e) => setEditedOutfitName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">适宜温度</label>
                      <select
                        value={editedOutfitTemp}
                        onChange={(e) => setEditedOutfitTemp(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="0-10°C">0-10°C</option>
                        <option value="10-18°C">10-18°C</option>
                        <option value="18-25°C">18-25°C</option>
                        <option value="20-28°C">20-28°C</option>
                        <option value="25-35°C">25-35°C</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">适宜场合</label>
                      <div className="flex flex-wrap gap-2">
                        {sceneOptions.map(scene => (
                          <button
                            key={scene}
                            onClick={() => setEditedOutfitOccasion(editedOutfitOccasion === scene ? '' : scene)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              editedOutfitOccasion === scene
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {scene}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">季节</label>
                      <div className="flex flex-wrap gap-2">
                        {seasonOptions.map(season => (
                          <button
                            key={season}
                            onClick={() => setEditedOutfitSeason(editedOutfitSeason === season ? '' : season)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              editedOutfitSeason === season
                                ? 'bg-pink-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {season}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">风格</label>
                      <div className="flex flex-wrap gap-2">
                        {styleOptions.map(style => (
                          <button
                            key={style}
                            onClick={() => setEditedOutfitStyle(editedOutfitStyle === style ? '' : style)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              editedOutfitStyle === style
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setIsEditingOutfit(false)}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => {
                          setOutfits(prev => prev.map(o =>
                            o.id === selectedOutfit.id
                              ? { ...o, name: editedOutfitName, suitableTemp: editedOutfitTemp, occasion: editedOutfitOccasion, season: editedOutfitSeason, style: editedOutfitStyle }
                              : o
                          ));
                          setIsEditingOutfit(false);
                        }}
                        className="flex-1 py-3 bg-[#f472d0] text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
                      >
                        保存
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {showAddLocationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[400] p-4"
            onClick={() => setShowAddLocationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">{editingLocation ? '编辑位置' : '添加存放位置'}</h3>
                <button onClick={() => setShowAddLocationModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">位置名称</label>
                  <input
                    type="text"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    placeholder="例如：主卧衣柜"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">位置描述</label>
                  <textarea
                    value={newLocationDesc}
                    onChange={(e) => setNewLocationDesc(e.target.value)}
                    placeholder="描述这个位置的用途..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
                  <div className="flex flex-wrap gap-2">
                    {['上衣', '裤子', '裙子', '外套', '鞋子', '配饰', '过季', '日常'].map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleLocationTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                          newLocationTags.includes(tag)
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                    {newLocationTags.filter(tag => !['上衣', '裤子', '裙子', '外套', '鞋子', '配饰', '过季', '日常'].includes(tag)).map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 rounded-full text-sm bg-purple-500 text-white flex items-center gap-1"
                      >
                        {tag}
                        <button
                          onClick={() => removeCustomTag(tag)}
                          className="hover:text-gray-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customTagInput}
                        onChange={(e) => setCustomTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
                        placeholder="自定义标签..."
                        className="px-3 py-1.5 rounded-full text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 w-24"
                      />
                      <button
                        onClick={addCustomTag}
                        disabled={!customTagInput.trim()}
                        className="px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddLocation}
                disabled={!newLocationName.trim()}
                className="w-full mt-6 py-2.5 bg-[#f472d0] text-white rounded-xl font-medium hover:bg-[#e85bb4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingLocation ? '保存修改' : '添加收纳'}
              </button>
            </motion.div>
          </motion.div>
        )}

        {showOutfitCanvas && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4"
            onClick={() => setShowOutfitCanvas(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/95 backdrop-blur-sm rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">搭配画布</h3>
                <button onClick={() => setShowOutfitCanvas(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex flex-1 overflow-hidden">
                <div className="w-64 border-r border-gray-100 p-4 overflow-y-auto">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">选择衣物</h4>
                  <div className="space-y-3">
                    {Object.entries(categoryNames).map(([key, name]) => {
                      const Icon = categoryIcons[key as keyof typeof categoryIcons];
                      const categoryClothes = clothes.filter(item => item.category === key);
                      if (categoryClothes.length === 0) return null;
                      return (
                        <div key={key}>
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-4 h-4 text-purple-500" />
                            <span className="text-xs font-medium text-gray-600">{name}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {categoryClothes.map(cloth => {
                              const isInCanvas = canvasItems.some(ci => ci.id === cloth.id);
                              return (
                                <button
                                  key={cloth.id}
                                  onClick={() => !isInCanvas && addToCanvas(cloth.id)}
                                  disabled={isInCanvas}
                                  draggable={!isInCanvas}
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData('text/plain', cloth.id);
                                    e.dataTransfer.effectAllowed = 'copy';
                                  }}
                                  className={`w-14 h-18 rounded-lg overflow-hidden border-2 transition-all ${
                                    isInCanvas 
                                      ? 'border-purple-300 opacity-50 cursor-not-allowed' 
                                      : 'border-gray-200 hover:border-purple-400 cursor-pointer hover:scale-105'
                                  }`}
                                >
                                  <img src={cloth.image} alt={cloth.name} className="w-full h-full object-cover" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {canvasItems.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">已选衣物 ({canvasItems.length})</h4>
                      <div className="space-y-2">
                        {canvasItems.map(item => {
                          const cloth = clothes.find(c => c.id === item.id);
                          if (!cloth) return null;
                          return (
                            <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                              <img src={cloth.image} alt={cloth.name} className="w-10 h-10 rounded object-cover" />
                              <span className="text-sm text-gray-700 flex-1 truncate">{cloth.name}</span>
                              <button
                                onClick={() => removeFromCanvas(item.id)}
                                className="p-1 hover:bg-red-100 rounded text-red-500"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 p-4">
                  <div
                    ref={outfitCanvasRef}
                    data-canvas
                    className="w-full h-full bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 relative overflow-hidden"
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    onClick={() => setSelectedCanvasItemId(null)}
                    onDrop={handleCanvasDrop}
                    onDragOver={handleCanvasDragOver}
                  >
                    {canvasItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 pointer-events-none">
                        <Layers className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg">从左侧拖拽或点击衣物添加到画布</p>
                        <p className="text-sm">选中后可拖动调整位置，拖拽角落调整大小</p>
                      </div>
                    ) : (
                      canvasItems.map(item => {
                        const cloth = clothes.find(c => c.id === item.id);
                        if (!cloth) return null;
                        return (
                          <div
                            key={item.id}
                            className="absolute select-none group"
                            style={{
                              left: item.x,
                              top: item.y,
                              width: item.width,
                              height: item.height,
                              zIndex: draggingItemId === item.id || resizingItemId === item.id ? 50 : 1,
                            }}
                          >
                            <div
                              className={`w-full h-full relative rounded-lg overflow-hidden transition-colors ${
                                selectedCanvasItemId === item.id ? 'border-2 border-red-500' : 'border-2 border-transparent'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if ((e.target as HTMLElement).closest('[data-resize-handle]')) return;
                                setSelectedCanvasItemId(item.id);
                              }}
                              onMouseDown={(e) => {
                                if ((e.target as HTMLElement).closest('[data-resize-handle]')) return;
                                handleCanvasMouseDown(e, item.id);
                              }}
                            >
                              <img 
                                src={cloth.image} 
                                alt={cloth.name} 
                                className="w-full h-full object-contain" 
                                style={{ pointerEvents: 'none' }}
                              />
                            </div>

                            <div
                              data-resize-handle
                              className={`absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full cursor-se-resize transition-opacity ${
                                selectedCanvasItemId === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              }`}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setSelectedCanvasItemId(item.id);
                                setResizingItemId(item.id);
                                const startWidth = item.width;
                                const startHeight = item.height;
                                const startX = e.clientX;
                                const startY = e.clientY;
                                const centerX = item.x + startWidth / 2;
                                const centerY = item.y + startHeight / 2;
                                const handleMouseMove = (ev: MouseEvent) => {
                                  const dx = (ev.clientX - startX) * 0.7;
                                  const dy = (ev.clientY - startY) * 0.7;
                                  const minSize = 20;
                                  const newWidth = Math.max(minSize, startWidth + dx);
                                  const newHeight = Math.max(minSize, startHeight + dy);
                                  setCanvasItems(prev => prev.map(ci => {
                                    if (ci.id === item.id) {
                                      return {
                                        ...ci,
                                        x: centerX - newWidth / 2,
                                        y: centerY - newHeight / 2,
                                        width: newWidth,
                                        height: newHeight,
                                      };
                                    }
                                    return ci;
                                  }));
                                };
                                const handleMouseUp = () => {
                                  setResizingItemId(null);
                                  document.removeEventListener('mousemove', handleMouseMove);
                                  document.removeEventListener('mouseup', handleMouseUp);
                                };
                                document.addEventListener('mousemove', handleMouseMove);
                                document.addEventListener('mouseup', handleMouseUp);
                              }}
                            />
                            <div
                              data-resize-handle
                              className={`absolute -bottom-1 -left-1 w-4 h-4 bg-red-500 rounded-full cursor-sw-resize transition-opacity ${
                                selectedCanvasItemId === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              }`}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setSelectedCanvasItemId(item.id);
                                setResizingItemId(item.id);
                                const startWidth = item.width;
                                const startHeight = item.height;
                                const startX = e.clientX;
                                const startY = e.clientY;
                                const centerX = item.x + startWidth / 2;
                                const centerY = item.y + startHeight / 2;
                                const handleMouseMove = (ev: MouseEvent) => {
                                  const dx = (startX - ev.clientX) * 0.7;
                                  const dy = (ev.clientY - startY) * 0.7;
                                  const minSize = 20;
                                  const newWidth = Math.max(minSize, startWidth + dx);
                                  const newHeight = Math.max(minSize, startHeight + dy);
                                  setCanvasItems(prev => prev.map(ci => {
                                    if (ci.id === item.id) {
                                      return {
                                        ...ci,
                                        x: centerX - newWidth / 2,
                                        y: centerY - newHeight / 2,
                                        width: newWidth,
                                        height: newHeight,
                                      };
                                    }
                                    return ci;
                                  }));
                                };
                                const handleMouseUp = () => {
                                  setResizingItemId(null);
                                  document.removeEventListener('mousemove', handleMouseMove);
                                  document.removeEventListener('mouseup', handleMouseUp);
                                };
                                document.addEventListener('mousemove', handleMouseMove);
                                document.addEventListener('mouseup', handleMouseUp);
                              }}
                            />
                            <div
                              data-resize-handle
                              className={`absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full cursor-ne-resize transition-opacity ${
                                selectedCanvasItemId === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              }`}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setSelectedCanvasItemId(item.id);
                                setResizingItemId(item.id);
                                const startWidth = item.width;
                                const startHeight = item.height;
                                const startX = e.clientX;
                                const startY = e.clientY;
                                const centerX = item.x + startWidth / 2;
                                const centerY = item.y + startHeight / 2;
                                const handleMouseMove = (ev: MouseEvent) => {
                                  const dx = (ev.clientX - startX) * 0.7;
                                  const dy = (startY - ev.clientY) * 0.7;
                                  const minSize = 20;
                                  const newWidth = Math.max(minSize, startWidth + dx);
                                  const newHeight = Math.max(minSize, startHeight + dy);
                                  setCanvasItems(prev => prev.map(ci => {
                                    if (ci.id === item.id) {
                                      return {
                                        ...ci,
                                        x: centerX - newWidth / 2,
                                        y: centerY - newHeight / 2,
                                        width: newWidth,
                                        height: newHeight,
                                      };
                                    }
                                    return ci;
                                  }));
                                };
                                const handleMouseUp = () => {
                                  setResizingItemId(null);
                                  document.removeEventListener('mousemove', handleMouseMove);
                                  document.removeEventListener('mouseup', handleMouseUp);
                                };
                                document.addEventListener('mousemove', handleMouseMove);
                                document.addEventListener('mouseup', handleMouseUp);
                              }}
                            />
                            <div
                              data-resize-handle
                              className={`absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full cursor-nw-resize transition-opacity ${
                                selectedCanvasItemId === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              }`}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setSelectedCanvasItemId(item.id);
                                setResizingItemId(item.id);
                                const startWidth = item.width;
                                const startHeight = item.height;
                                const startX = e.clientX;
                                const startY = e.clientY;
                                const centerX = item.x + startWidth / 2;
                                const centerY = item.y + startHeight / 2;
                                const handleMouseMove = (ev: MouseEvent) => {
                                  const dx = (startX - ev.clientX) * 0.7;
                                  const dy = (startY - ev.clientY) * 0.7;
                                  const minSize = 20;
                                  const newWidth = Math.max(minSize, startWidth + dx);
                                  const newHeight = Math.max(minSize, startHeight + dy);
                                  setCanvasItems(prev => prev.map(ci => {
                                    if (ci.id === item.id) {
                                      return {
                                        ...ci,
                                        x: centerX - newWidth / 2,
                                        y: centerY - newHeight / 2,
                                        width: newWidth,
                                        height: newHeight,
                                      };
                                    }
                                    return ci;
                                  }));
                                };
                                const handleMouseUp = () => {
                                  setResizingItemId(null);
                                  document.removeEventListener('mousemove', handleMouseMove);
                                  document.removeEventListener('mouseup', handleMouseUp);
                                };
                                document.addEventListener('mousemove', handleMouseMove);
                                document.addEventListener('mouseup', handleMouseUp);
                              }}
                            />

                            {selectedCanvasItemId === item.id && (
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    sendToBack(item.id);
                                  }}
                                  title="置于底层"
                                  className="w-7 h-7 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-gray-600 shadow-md"
                                >
                                  ⤓
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    sendBackward(item.id);
                                  }}
                                  title="下移一层"
                                  className="w-7 h-7 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs hover:bg-gray-500 shadow-md"
                                >
                                  ↓
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    bringForward(item.id);
                                  }}
                                  title="上移一层"
                                  className="w-7 h-7 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs hover:bg-gray-500 shadow-md"
                                >
                                  ↑
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    bringToFront(item.id);
                                  }}
                                  title="置于顶层"
                                  className="w-7 h-7 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-gray-600 shadow-md"
                                >
                                  ⤒
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedClothing(cloth);
                                    setShowClothingDetailModal(true);
                                    setIsEditingDetail(true);
                                    setEditedClothing({ ...cloth });
                                  }}
                                  title="编辑"
                                  className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-blue-600 shadow-md"
                                >
                                  ✏
                                </button>
                                <button
                                  onClick={(e) => handleRemoveFromCanvas(e, item.id)}
                                  title="删除 (Delete)"
                                  className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600 shadow-md"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                            <div
                              data-resize-handle
                              className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 h-4 bg-red-500 rounded-full cursor-s-resize transition-opacity ${
                                selectedCanvasItemId === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              }`}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setSelectedCanvasItemId(item.id);
                                setResizingItemId(item.id);
                                const startHeight = item.height;
                                const startY = e.clientY;
                                const centerX = item.x + item.width / 2;
                                const centerY = item.y + item.height / 2;
                                const handleMouseMove = (ev: MouseEvent) => {
                                  const dy = (ev.clientY - startY) * 0.7;
                                  const minSize = 20;
                                  const newHeight = Math.max(minSize, startHeight + dy);
                                  setCanvasItems(prev => prev.map(ci => {
                                    if (ci.id === item.id) {
                                      return {
                                        ...ci,
                                        x: centerX - ci.width / 2,
                                        y: centerY - newHeight / 2,
                                        height: newHeight,
                                      };
                                    }
                                    return ci;
                                  }));
                                };
                                const handleMouseUp = () => {
                                  setResizingItemId(null);
                                  document.removeEventListener('mousemove', handleMouseMove);
                                  document.removeEventListener('mouseup', handleMouseUp);
                                };
                                document.addEventListener('mousemove', handleMouseMove);
                                document.addEventListener('mouseup', handleMouseUp);
                              }}
                            />
                            <div
                              data-resize-handle
                              className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full cursor-n-resize transition-opacity ${
                                selectedCanvasItemId === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              }`}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setSelectedCanvasItemId(item.id);
                                setResizingItemId(item.id);
                                const startHeight = item.height;
                                const startY = e.clientY;
                                const centerX = item.x + item.width / 2;
                                const centerY = item.y + item.height / 2;
                                const handleMouseMove = (ev: MouseEvent) => {
                                  const dy = (startY - ev.clientY) * 0.7;
                                  const minSize = 20;
                                  const newHeight = Math.max(minSize, startHeight + dy);
                                  setCanvasItems(prev => prev.map(ci => {
                                    if (ci.id === item.id) {
                                      return {
                                        ...ci,
                                        x: centerX - ci.width / 2,
                                        y: centerY - newHeight / 2,
                                        height: newHeight,
                                      };
                                    }
                                    return ci;
                                  }));
                                };
                                const handleMouseUp = () => {
                                  setResizingItemId(null);
                                  document.removeEventListener('mousemove', handleMouseMove);
                                  document.removeEventListener('mouseup', handleMouseUp);
                                };
                                document.addEventListener('mousemove', handleMouseMove);
                                document.addEventListener('mouseup', handleMouseUp);
                              }}
                            />
                            <div
                              data-resize-handle
                              className={`absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full cursor-e-resize transition-opacity ${
                                selectedCanvasItemId === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              }`}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setSelectedCanvasItemId(item.id);
                                setResizingItemId(item.id);
                                const startWidth = item.width;
                                const startX = e.clientX;
                                const centerX = item.x + item.width / 2;
                                const centerY = item.y + item.height / 2;
                                const handleMouseMove = (ev: MouseEvent) => {
                                  const dx = (ev.clientX - startX) * 0.7;
                                  const minSize = 20;
                                  const newWidth = Math.max(minSize, startWidth + dx);
                                  setCanvasItems(prev => prev.map(ci => {
                                    if (ci.id === item.id) {
                                      return {
                                        ...ci,
                                        x: centerX - newWidth / 2,
                                        y: centerY - ci.height / 2,
                                        width: newWidth,
                                      };
                                    }
                                    return ci;
                                  }));
                                };
                                const handleMouseUp = () => {
                                  setResizingItemId(null);
                                  document.removeEventListener('mousemove', handleMouseMove);
                                  document.removeEventListener('mouseup', handleMouseUp);
                                };
                                document.addEventListener('mousemove', handleMouseMove);
                                document.addEventListener('mouseup', handleMouseUp);
                              }}
                            />
                            <div
                              data-resize-handle
                              className={`absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full cursor-w-resize transition-opacity ${
                                selectedCanvasItemId === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              }`}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setSelectedCanvasItemId(item.id);
                                setResizingItemId(item.id);
                                const startWidth = item.width;
                                const startX = e.clientX;
                                const centerX = item.x + item.width / 2;
                                const centerY = item.y + item.height / 2;
                                const handleMouseMove = (ev: MouseEvent) => {
                                  const dx = (startX - ev.clientX) * 0.7;
                                  const minSize = 20;
                                  const newWidth = Math.max(minSize, startWidth + dx);
                                  setCanvasItems(prev => prev.map(ci => {
                                    if (ci.id === item.id) {
                                      return {
                                        ...ci,
                                        x: centerX - newWidth / 2,
                                        y: centerY - ci.height / 2,
                                        width: newWidth,
                                      };
                                    }
                                    return ci;
                                  }));
                                };
                                const handleMouseUp = () => {
                                  setResizingItemId(null);
                                  document.removeEventListener('mousemove', handleMouseMove);
                                  document.removeEventListener('mouseup', handleMouseUp);
                                };
                                document.addEventListener('mousemove', handleMouseMove);
                                document.addEventListener('mouseup', handleMouseUp);
                              }}
                            />
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="w-72 border-l border-gray-100 p-4 overflow-y-auto">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">衣物详情</h4>
                  {canvasItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                      <MousePointerClick className="w-12 h-12 mb-3 opacity-50" />
                      <p className="text-sm text-center">点击画布上的衣物查看详情</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {canvasItems.map((item, index) => {
                        const cloth = clothes.find(c => c.id === item.id);
                        if (!cloth) return null;
                        const isSelected = selectedCanvasItemId === item.id;
                        return (
                          <div 
                            key={item.id}
                            className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                              isSelected 
                                ? 'border-red-500 bg-red-50' 
                                : 'border-gray-100 bg-white hover:border-gray-200'
                            }`}
                            onClick={() => setSelectedCanvasItemId(item.id)}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-medium text-gray-500">
                                {index + 1}.
                              </span>
                              <span className="text-sm font-medium text-gray-800 truncate flex-1">
                                {cloth.name}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFromCanvas(item.id);
                                  if (selectedCanvasItemId === item.id) {
                                    setSelectedCanvasItemId(null);
                                  }
                                }}
                                className="p-1 hover:bg-red-100 rounded text-red-500"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="w-full aspect-video rounded-lg overflow-hidden bg-gray-100 mb-2">
                              <img src={cloth.image} alt={cloth.name} className="w-full h-full object-contain" />
                            </div>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-500">类别</span>
                                <span className="text-gray-700">{categoryNames[cloth.category]}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">季节</span>
                                <span className="text-gray-700">{cloth.season || '未设置'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">位置</span>
                                <span className="text-gray-700">{cloth.location || '未设置'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-gray-500">已选择 {canvasItems.length} 件衣物</p>
                  <div className="flex gap-2">
                    <label className="px-3 py-1 text-sm bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      导入JSON
                      <input 
                        type="file" 
                        accept=".json"
                        onChange={importOutfitJSON}
                        className="hidden" 
                      />
                    </label>
                    {canvasItems.length > 0 && (
                      <>
                        <button
                          onClick={exportOutfitJSON}
                          className="px-3 py-1 text-sm bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          导出JSON
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('确定要清空画布吗？')) {
                              setCanvasItems([]);
                              setSelectedCanvasItemId(null);
                            }
                          }}
                          className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          清空画布
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowOutfitCanvas(false)}
                    className="px-6 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveOutfit}
                    disabled={canvasItems.length === 0}
                    className="px-6 py-2 bg-[#f472d0] text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    保持搭配
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showOutfitInfoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4"
            onClick={() => setShowOutfitInfoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">搭配信息</h3>
                <button onClick={() => setShowOutfitInfoModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">搭配名称</label>
                  <input
                    type="text"
                    value={newOutfitName}
                    onChange={(e) => setNewOutfitName(e.target.value)}
                    placeholder="输入搭配名称..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">适宜温度</label>
                  <select
                    value={selectedTemp}
                    onChange={(e) => setSelectedTemp(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="0-10°C">0-10°C</option>
                    <option value="10-18°C">10-18°C</option>
                    <option value="18-25°C">18-25°C</option>
                    <option value="20-28°C">20-28°C</option>
                    <option value="25-35°C">25-35°C</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">季节</label>
                  <select
                    value={outfitSeason}
                    onChange={(e) => setOutfitSeason(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-[#f472d0]"
                  >
                    {seasonOptions.map(season => (
                      <option key={season} value={season}>{season}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">场景</label>
                  <select
                    value={outfitScene}
                    onChange={(e) => setOutfitScene(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-[#f472d0]"
                  >
                    <option value="">请选择场景</option>
                    {sceneOptions.map(scene => (
                      <option key={scene} value={scene}>{scene}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">风格</label>
                  <select
                    value={outfitStyle}
                    onChange={(e) => setOutfitStyle(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-[#f472d0]"
                  >
                    <option value="">请选择风格</option>
                    {styleOptions.map(style => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={saveOutfit}
                  disabled={!newOutfitName.trim()}
                  className="w-full py-3 bg-gradient-to-r from-[#f472d0] to-purple-400 text-white font-bold rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
                >
                  保存搭配 ✨
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showDeleteConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4"
            onClick={cancelDelete}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">确认删除</h3>
                <p className="text-gray-500 text-sm mb-6">确定要删除这个存放位置吗？此操作无法撤销。</p>
                <div className="flex gap-3">
                  <button
                    onClick={cancelDelete}
                    className="flex-1 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200"
                  >
                    取消
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-2 rounded-lg font-medium transition-colors bg-red-500 text-white hover:bg-red-600 cursor-pointer"
                  >
                    删除
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showLoginModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4"
            onClick={() => setShowLoginModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">
                  {loginMode === 'guest-login' && '登录账户'}
                  {loginMode === 'guest-register' && '注册账户'}
                  {loginMode === 'forgot-password' && '忘记密码'}
                </h3>
                <button onClick={() => setShowLoginModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loginMode !== 'forgot-password' && (
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => { setLoginMode('guest-login'); setLoginError(''); }}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${loginMode === 'guest-login' ? 'bg-[#f472d0] text-white hover:bg-[#e85bb4]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    登录
                  </button>
                  <button
                    onClick={() => { setLoginMode('guest-register'); setLoginError(''); }}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${loginMode === 'guest-register' ? 'bg-[#f472d0] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    注册
                  </button>
                </div>
              )}

              {loginMode === 'guest-login' && (
                <div className="space-y-4">
                  {loginError && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-sm text-center"
                    >
                      {loginError}
                    </motion.p>
                  )}
                  {loginSuccess && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-green-500 text-sm text-center"
                    >
                      登录成功！正在跳转...
                    </motion.p>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                    <input
                      type="email"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="请输入邮箱"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="请输入密码"
                        className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleGuestLogin}
                    disabled={loginSuccess}
                    className={`w-full py-2 text-sm border-black border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-[-2px] hover:translate-y-0 transition-all rounded-xl font-bold text-white ${loginSuccess ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#f472d0] hover:bg-[#e85bb4]'}`}
                  >
                    {loginSuccess ? '登录中...' : '登录'}
                  </button>

                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => { setLoginMode('forgot-password'); setLoginError(''); setResetSuccess(false); }}
                      className="text-xs text-pink-500 hover:text-pink-600"
                    >
                      忘记密码？
                    </button>
                    <p className="text-xs text-gray-400">
                      还没有账号？点击上方"注册"按钮创建新账号
                    </p>
                  </div>
                </div>
              )}

              {loginMode === 'forgot-password' && (
                <div className="space-y-4">
                  {loginError && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-sm text-center"
                    >
                      {loginError}
                    </motion.p>
                  )}
                  {resetSuccess && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-green-500 text-sm text-center"
                    >
                      重置链接已发送到您的邮箱，请查收
                    </motion.p>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                    <input
                      type="email"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="请输入注册时使用的邮箱"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <button
                    onClick={handleForgotPassword}
                    className="w-full py-2 text-sm bg-[#f472d0] border-black border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:bg-[#e85bb4] translate-y-[-2px] hover:translate-y-0 transition-all rounded-xl font-bold text-white"
                  >
                    发送重置链接
                  </button>

                  <button
                    onClick={() => { setLoginMode('guest-login'); setLoginError(''); }}
                    className="w-full text-xs text-gray-500 hover:text-gray-700"
                  >
                    返回登录
                  </button>
                </div>
              )}

              {loginMode === 'guest-register' && (
                <div className="space-y-4">
                  {loginError && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-sm text-center"
                    >
                      {loginError}
                    </motion.p>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                    <input
                      type="email"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="请输入邮箱"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="请输入密码"
                        className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
                    <div className="relative">
                      <input
                        type={showPasswordConfirm ? 'text' : 'password'}
                        value={registerPasswordConfirm}
                        onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                        placeholder="请再次输入密码"
                        className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleGuestRegister}
                    className="w-full py-2 text-sm bg-[#f472d0] border-black border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:bg-[#e85bb4] translate-y-[-2px] hover:translate-y-0 transition-all rounded-xl font-bold text-white"
                  >
                    注册
                  </button>

                  <p className="text-xs text-gray-400 text-center">
                    密码至少6字符（需包含数字和英文）
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {showAvatarPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[400] p-4"
            onClick={() => setShowAvatarPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative"
            >
              <img 
                src={currentUser?.avatar || getFallbackImage(currentUser?.id || '', 400)} 
                alt={currentUser?.username}
                className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
              />
              <button 
                onClick={() => setShowAvatarPreview(false)}
                className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </motion.div>
          </motion.div>
        )}

        {showAccountModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4"
            onClick={() => setShowAccountModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">账号详情</h3>
                <button onClick={() => setShowAccountModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {currentUser && (
                <div className="space-y-4">
                  <div 
                    className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setShowAccountModal(false);
                      setShowAccountSettings(true);
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <img 
                        src={currentUser.avatar || getFallbackImage(currentUser.id, 150)} 
                        alt={currentUser.username}
                        className="w-16 h-16 rounded-full object-cover border-2 border-pink-200 shadow-md"
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 text-lg">{currentUser.username || '未设置昵称'}</h4>
                        <p className="text-sm text-gray-500">点击进入账号设置</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">服饰数量</span>
                      <span className="font-medium text-gray-800">{currentUser.clothes.length} 件</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">搭配数量</span>
                      <span className="font-medium text-gray-800">{filteredOutfits.length} 套</span>
                    </div>
                  </div>

                  <div 
                    className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setShowAccountModal(false);
                      setShowBodyStatsEditor(true);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <User className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">身材数据</p>
                          <p className="text-xs text-gray-500">身高{avatar.height}cm / 体重{avatar.weight}kg / BMI {calculateBMI(avatar.height, avatar.weight).toFixed(1)}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  <div 
                    className="bg-gradient-to-r from-pink-50 to-violet-50 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow relative"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const calendarHeight = 200;
                      const spaceBelow = window.innerHeight - rect.bottom;
                      const spaceAbove = rect.top;
                      const showAbove = spaceBelow < calendarHeight && spaceAbove > spaceBelow;
                      setCalendarPosition({ x: rect.left, y: rect.bottom + 8, showAbove });
                      setShowDiaryCalendar(true);
                    }}
                    onMouseLeave={() => setShowDiaryCalendar(false)}
                    onClick={() => {
                      setShowAccountModal(false);
                      setActiveTab('checkin');
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <Calendar className="w-5 h-5 text-pink-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">穿搭日记</p>
                          <p className="text-xs text-gray-500">点击跳转打卡页面</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>

                    {showDiaryCalendar && (
                      <motion.div
                        initial={{ opacity: 0, y: calendarPosition.showAbove ? 10 : -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: calendarPosition.showAbove ? 10 : -10 }}
                        className={`absolute left-0 bg-white rounded-xl shadow-lg p-4 z-50 w-72 ${calendarPosition.showAbove ? 'bottom-full mb-2' : 'top-full mt-2'}`}
                        style={{ left: '0' }}
                        onMouseEnter={() => setShowDiaryCalendar(true)}
                        onMouseLeave={() => setShowDiaryCalendar(false)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const prevMonth = new Date(currentCalendarMonth);
                              prevMonth.setMonth(prevMonth.getMonth() - 1);
                              setCurrentCalendarMonth(prevMonth);
                            }}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <h4 className="text-sm font-bold text-gray-800">
                            {currentCalendarMonth.getFullYear()}年{currentCalendarMonth.getMonth() + 1}月
                          </h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextMonth = new Date(currentCalendarMonth);
                              nextMonth.setMonth(nextMonth.getMonth() + 1);
                              setCurrentCalendarMonth(nextMonth);
                            }}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-7 gap-0.5 mb-1">
                          {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                            <div key={day} className="text-xs text-center text-gray-400 py-1">
                              {day}
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 gap-0.5">
                          {generateCheckinCalendarDays().map((day, index) => {
                            if (!day) {
                              return <div key={index} className="h-7" />;
                            }
                            const dateStr = `${day.year}-${day.month.toString().padStart(2, '0')}-${day.day.toString().padStart(2, '0')}`;
                            const entry = checkinEntries[dateStr];
                            const isToday = day.isToday;
                            
                            return (
                              <button
                                key={index}
                                onClick={() => {
                                  setShowDiaryCalendar(false);
                                  setShowAccountModal(false);
                                  setActiveTab('checkin');
                                  setSelectedCheckinDate(dateStr);
                                }}
                                className={`h-7 rounded-lg flex items-center justify-center text-xs transition-all ${
                                  isToday 
                                    ? 'bg-pink-500 text-white font-medium' 
                                    : entry 
                                      ? 'bg-pink-100 text-pink-600 font-medium hover:bg-pink-200' 
                                      : 'text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                {day.day}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => {
                        setShowAccountModal(false);
                        setShowAccountSettings(true);
                      }}
                      className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      账号设置
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      退出登录
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {showAccountSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4"
            onClick={() => setShowAccountSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">{accountSettingsStep === 'profile' ? '账号设置' : '修改密码'}</h3>
                {accountSettingsStep === 'password' ? (
                  <button 
                    onClick={() => {
                      setAccountSettingsStep('profile');
                      setPasswordError('');
                      setPasswordSuccess(false);
                    }} 
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                ) : (
                  <button onClick={() => setShowAccountSettings(false)} className="p-2 hover:bg-gray-100 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {accountSettingsStep === 'profile' && currentUser && (
                <div className="space-y-6">
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <img 
                        src={currentUser.avatar || getFallbackImage(currentUser.id, 150)} 
                        alt={currentUser.username}
                        className="w-24 h-24 rounded-full object-cover border-4 border-pink-200 shadow-lg"
                      />
                      <label className="absolute -bottom-1 -right-1 w-10 h-10 bg-[#f472d0] rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-[#e85bb4] transition-colors z-10">
                        <Plus className="w-5 h-5 text-white" />
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && currentUser) {
                              const reader = new FileReader();
                              reader.onload = async (event) => {
                                const newAvatar = event.target?.result as string;
                                await supabaseData.updateProfile(currentUser.id, { avatar: newAvatar });
                                const updatedUser = { ...currentUser, avatar: newAvatar };
                                setCurrentUser(updatedUser);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">点击更换头像</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">昵称</label>
                      {editingUsername ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editUsername}
                            onChange={(e) => setEditUsername(e.target.value)}
                            className="flex-1 px-4 py-2 border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="输入昵称"
                            autoFocus
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingUsername(false);
                                setEditUsername('');
                              }}
                              className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleSaveUsername}
                              className="px-3 py-2 bg-[#f472d0] text-white rounded-lg hover:bg-[#e85bb4]"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                          <span className="text-gray-800">{currentUser.username || '未设置昵称'}</span>
                          <button
                            onClick={() => {
                              setEditUsername(currentUser.username);
                              setEditingUsername(true);
                            }}
                            className="text-pink-500 hover:text-pink-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-2">账号邮箱</label>
                      <div className="bg-gray-50 rounded-lg px-4 py-3">
                        <span className="text-gray-800">{currentUser.email || currentUser.id}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setAccountSettingsStep('password')}
                      className="w-full py-3 bg-[#f472d0] text-white rounded-xl font-medium hover:bg-[#e85bb4] transition-colors"
                    >
                      修改密码
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setShowAccountSettings(false);
                      setShowAccountModal(true);
                    }}
                    className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                  >
                    返回
                  </button>
                </div>
              )}

              {accountSettingsStep === 'password' && (
                <div className="space-y-4">
                  {passwordResetStep === 'verify' ? (
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">验证邮箱</label>
                      <div className="space-y-3">
                        <div className="bg-gray-50 rounded-lg px-4 py-3">
                          <span className="text-gray-800">{currentUser.email || currentUser.id}</span>
                        </div>
                        <p className="text-xs text-gray-500">我们将向您的邮箱发送验证码</p>
                        <div className="relative">
                          <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            className="w-full px-4 py-2 border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="请输入验证码"
                          />
                        </div>
                        {codeError && (
                          <p className="text-xs text-red-500">{codeError}</p>
                        )}
                        {codeSuccess && (
                          <p className="text-xs text-green-500">验证码已发送，请查收邮箱</p>
                        )}
                        <button
                          onClick={sendVerificationCode}
                          disabled={isSendingCode || codeCountdown > 0}
                          className="w-full py-3 bg-[#f472d0] text-white rounded-xl font-medium hover:bg-[#e85bb4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {codeCountdown > 0 ? `${codeCountdown}秒后重新发送` : isSendingCode ? '发送中...' : '发送验证码'}
                        </button>
                        <button
                          onClick={verifyCode}
                          className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                        >
                          验证
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">修改密码</label>
                      <div className="space-y-3">
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-2 border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                            placeholder="输入新密码"
                          />
                          <button
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2 border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                            placeholder="确认新密码"
                          />
                          <button
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {passwordError && (
                          <p className="text-xs text-red-500">{passwordError}</p>
                        )}
                        {passwordSuccess && (
                          <p className="text-xs text-green-500">密码修改成功！</p>
                        )}
                        <button
                          onClick={handleChangePassword}
                          className="w-full py-3 bg-[#f472d0] text-white rounded-xl font-medium hover:bg-[#e85bb4] transition-colors"
                        >
                          保存密码
                        </button>
                        <button
                          onClick={() => {
                            setPasswordResetStep('verify');
                            setVerificationCode('');
                            setCodeError('');
                            setCodeSuccess(false);
                          }}
                          className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                        >
                          返回验证
                        </button>
                      </div>
                    </div>
                  )}

                  {passwordResetStep === 'verify' && (
                    <button
                      onClick={() => {
                        setAccountSettingsStep('profile');
                        setShowAccountSettings(false);
                        setShowAccountModal(true);
                      }}
                      className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                    >
                      返回
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {showBodyStatsEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4"
            onClick={() => setShowBodyStatsEditor(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">身材数据</h3>
                <button onClick={() => setShowBodyStatsEditor(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-2xl font-bold text-blue-600">{avatar.height}</p>
                    <p className="text-xs text-gray-500">身高 (cm)</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-2xl font-bold text-green-600">{avatar.weight}</p>
                    <p className="text-xs text-gray-500">体重 (kg)</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4">
                    <p className="text-2xl font-bold text-purple-600">{calculateBMI(avatar.height, avatar.weight).toFixed(1)}</p>
                    <p className="text-xs text-gray-500">BMI</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">胸围 (cm)</label>
                    <input
                      type="number"
                      value={avatar.bust}
                      onChange={(e) => setAvatar(prev => ({ ...prev, bust: Number(e.target.value) }))}
                      className="w-full px-4 py-2 border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">腰围 (cm)</label>
                    <input
                      type="number"
                      value={avatar.waist}
                      onChange={(e) => setAvatar(prev => ({ ...prev, waist: Number(e.target.value) }))}
                      className="w-full px-4 py-2 border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">臀围 (cm)</label>
                    <input
                      type="number"
                      value={avatar.hips}
                      onChange={(e) => setAvatar(prev => ({ ...prev, hips: Number(e.target.value) }))}
                      className="w-full px-4 py-2 border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">身高 (cm)</label>
                    <input
                      type="number"
                      value={avatar.height}
                      onChange={(e) => setAvatar(prev => ({ ...prev, height: Number(e.target.value) }))}
                      className="w-full px-4 py-2 border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">体重 (kg)</label>
                    <input
                      type="number"
                      value={avatar.weight}
                      onChange={(e) => setAvatar(prev => ({ ...prev, weight: Number(e.target.value) }))}
                      className="w-full px-4 py-2 border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={async () => {
                      const resetAvatar = {
                        height: 0,
                        weight: 0,
                        bust: 0,
                        waist: 0,
                        hips: 0,
                        skinTone: '#F5DEB3',
                        hairStyle: '长发',
                        hairColor: '#8B4513',
                        faceShape: '椭圆形脸',
                      };
                      setAvatar(resetAvatar);
                      
                      if (currentUser) {
                        try {
                          await supabaseData.updateProfile(currentUser.id, {
                            height: 0,
                            weight: 0,
                            bust: 0,
                            waist: 0,
                            hips: 0,
                          });
                        } catch (error) {
                          console.error('重置失败:', error);
                        }
                      }
                    }}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                  >
                    重置
                  </button>
                  <button
                    onClick={async () => {
                      if (currentUser) {
                        try {
                          console.log('保存身材数据 - 用户ID:', currentUser.id);
                          console.log('保存身材数据 - 数据:', {
                            height: avatar.height,
                            weight: avatar.weight,
                            bust: avatar.bust,
                            waist: avatar.waist,
                            hips: avatar.hips,
                          });
                          const result = await supabaseData.updateProfile(currentUser.id, {
                            height: avatar.height,
                            weight: avatar.weight,
                            bust: avatar.bust,
                            waist: avatar.waist,
                            hips: avatar.hips,
                          });
                          console.log('保存身材数据 - 结果:', result);
                          if (result.error) {
                            console.error('保存失败 - 错误:', result.error);
                            alert('保存失败: ' + result.error.message);
                          } else {
                            console.log('保存成功');
                            setShowBodyStatsEditor(false);
                            setShowAccountModal(true);
                          }
                        } catch (error) {
                          console.error('保存失败 - 异常:', error);
                          alert('保存失败，请重试');
                        }
                      }
                    }}
                    className="flex-1 py-3 bg-[#f472d0] text-white rounded-xl font-medium hover:bg-[#e85bb4] transition-colors"
                  >
                    保存
                  </button>
                </div>

                <button
                  onClick={() => {
                    setShowBodyStatsEditor(false);
                    setShowAccountModal(true);
                  }}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors mt-2"
                >
                  返回
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>

      

      <AnimatePresence>
        {showClothingDeleteConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">确认删除</h3>
                <p className="text-gray-500 mb-6">确定要删除选中的 {selectedClothes.length} 件服饰吗？此操作无法撤销。</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowClothingDeleteConfirmModal(false)}
                    className="flex-1 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200"
                  >
                    取消
                  </button>
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('点击确认删除，选中的衣物:', selectedClothes);
                      
                      try {
                        for (const itemId of selectedClothes) {
                          console.log('正在删除:', itemId);
                          await supabaseData.deleteClothing(itemId);
                        }
                        
                        setClothes(prev => prev.filter(item => !selectedClothes.includes(item.id)));
                        setSelectedClothes([]);
                        setIsBatchDeleteMode(false);
                        setShowClothingDeleteConfirmModal(false);
                        console.log('删除完成');
                      } catch (error) {
                        console.error('删除失败:', error);
                      }
                    }}
                    className="flex-1 py-2 rounded-lg font-medium transition-colors bg-red-500 text-white hover:bg-red-600 cursor-pointer"
                  >
                    确认
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showOutfitDeleteConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">确认删除</h3>
                <p className="text-gray-500 mb-6">确定要删除选中的 {selectedOutfits.length} 个搭配吗？此操作无法撤销。</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowOutfitDeleteConfirmModal(false)}
                    className="flex-1 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200"
                  >
                    取消
                  </button>
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('点击确认删除搭配，选中的搭配:', selectedOutfits);
                      
                      try {
                        for (const outfitId of selectedOutfits) {
                          console.log('正在删除搭配:', outfitId);
                          await supabaseData.deleteOutfit(outfitId);
                        }
                        
                        setOutfits(prev => prev.filter(item => !selectedOutfits.includes(item.id)));
                        setSelectedOutfits([]);
                        setIsOutfitBatchDeleteMode(false);
                        setShowOutfitDeleteConfirmModal(false);
                        console.log('删除搭配完成');
                      } catch (error) {
                        console.error('删除搭配失败:', error);
                      }
                    }}
                    className="flex-1 py-2 rounded-lg font-medium transition-colors bg-red-500 text-white hover:bg-red-600 cursor-pointer"
                  >
                    确认
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        
        {showClothingDetailModal && selectedClothing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4"
            onClick={() => {
              setShowClothingDetailModal(false);
              setIsEditingDetail(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl overflow-hidden w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="relative">
                <img 
                  src={selectedClothing.image} 
                  alt={selectedClothing.name}
                  className="w-full h-64 object-contain bg-gray-100"
                />
                <button
                  onClick={() => {
                    setShowClothingDetailModal(false);
                    setIsEditingDetail(false);
                  }}
                  className="absolute top-4 right-4 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                {!isEditingDetail ? (
                  <>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">{selectedClothing.name}</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-500 flex items-center gap-2">
                          <Shirt className="w-4 h-4" />
                          类别
                        </span>
                        <span className="font-medium text-gray-800">{categoryNames[selectedClothing.category]}</span>
                      </div>
                      
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-500 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          季节
                        </span>
                        <span className="font-medium text-gray-800">{selectedClothing.season || '未设置'}</span>
                      </div>
                      
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-500 flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          收纳位置
                        </span>
                        <span className="font-medium text-gray-800">{selectedClothing.location || '未设置'}</span>
                      </div>
                      
                      {selectedClothing.detailLocation && (
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500 flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            详细收纳位置
                          </span>
                          <span className="font-medium text-gray-800">{selectedClothing.detailLocation}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between py-2">
                        <span className="text-gray-500 flex items-center gap-2">
                          <Thermometer className="w-4 h-4" />
                          适宜温度
                        </span>
                        <span className="font-medium text-gray-800">{selectedClothing.suitableTemp || '未设置'}</span>
                      </div>
                    </div>
                    
                    {selectedClothing.tags && selectedClothing.tags.length > 0 && (
                      <div className="mt-4">
                        <p className="text-gray-500 text-sm mb-2">标签</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedClothing.tags.map((tag, index) => (
                            <span 
                              key={index} 
                              className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {(() => {
                      const relatedOutfits = outfits.filter(outfit => outfit.items.includes(selectedClothing.id));
                      if (relatedOutfits.length > 0) {
                        return (
                          <div className="mt-6">
                            <p className="text-gray-500 text-sm mb-3">关联穿搭 ({relatedOutfits.length})</p>
                            <div className="space-y-3">
                              {relatedOutfits.map(outfit => (
                                <div 
                                  key={outfit.id} 
                                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                                  onClick={() => {
                                    setSelectedOutfit(outfit);
                                    setEditedOutfitName(outfit.name);
                                    setEditedOutfitOccasion(outfit.occasion || '');
                                    setEditedOutfitTemp(outfit.suitableTemp);
                                    setIsEditingOutfit(false);
                                    setShowOutfitDetailModal(true);
                                  }}
                                >
                                  <div className="flex -space-x-2">
                                    {outfit.items.slice(0, 3).map((itemId, idx) => {
                                      const item = clothes.find(c => c.id === itemId);
                                      return item ? (
                                        <div 
                                          key={idx} 
                                          className="w-10 h-12 rounded-lg overflow-hidden border-2 border-white"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedClothing(item);
                                            setIsEditingDetail(false);
                                            setShowClothingDetailModal(true);
                                          }}
                                        >
                                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                      ) : null;
                                    })}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-800 text-sm truncate">{outfit.name}</p>
                                    {outfit.occasion && (
                                      <p className="text-xs text-gray-500 truncate">{outfit.occasion}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <Star key={star} className={`w-3 h-3 ${star <= outfit.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    
                    <button
                      onClick={() => {
                        setEditedClothing({ ...selectedClothing });
                        setIsEditingDetail(true);
                      }}
                      className="w-full mt-4 py-3 bg-[#f472d0] text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
                    >
                      编辑
                    </button>
                  </>
                ) : (
                  editedClothing && (
                    <>
                      <h3 className="text-xl font-bold text-gray-800 mb-4">编辑衣物信息</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-gray-600 mb-2">名称</label>
                          <input
                            type="text"
                            value={editedClothing.name}
                            onChange={(e) => setEditedClothing(prev => prev ? { ...prev, name: e.target.value } : null)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-600 mb-2">类别</label>
                          <select
                            value={editedClothing.category}
                            onChange={(e) => setEditedClothing(prev => prev ? { ...prev, category: e.target.value as ClothingItem['category'] } : null)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                          >
                            {Object.entries(categoryNames).map(([key, value]) => (
                              <option key={key} value={key}>{value}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-600 mb-2">季节</label>
                          <select
                            value={editedClothing.season || ''}
                            onChange={(e) => setEditedClothing(prev => prev ? { ...prev, season: e.target.value || undefined } : null)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                          >
                            <option value="">未设置</option>
                            <option value="春秋">春秋</option>
                            <option value="夏季">夏季</option>
                            <option value="冬季">冬季</option>
                            <option value="四季">四季</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-600 mb-2">收纳位置</label>
                          <select
                            value={editedClothing.location || ''}
                            onChange={(e) => setEditedClothing(prev => prev ? { ...prev, location: e.target.value || undefined } : null)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                          >
                            <option value="">未设置</option>
                            {locations.map(loc => (
                              <option key={loc.id} value={loc.name}>{loc.name}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-600 mb-2">详细收纳位置</label>
                          <input
                            type="text"
                            value={editedClothing.detailLocation || ''}
                            onChange={(e) => setEditedClothing(prev => prev ? { ...prev, detailLocation: e.target.value || undefined } : null)}
                            placeholder="例如：主卧衣柜-左侧上层"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-600 mb-2">适宜温度</label>
                          <select
                            value={editedClothing.suitableTemp || ''}
                            onChange={(e) => setEditedClothing(prev => prev ? { ...prev, suitableTemp: e.target.value || undefined } : null)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                          >
                            <option value="">未设置</option>
                            <option value="0-10°C">0-10°C</option>
                            <option value="10-15°C">10-15°C</option>
                            <option value="15-20°C">15-20°C</option>
                            <option value="20-25°C">20-25°C</option>
                            <option value="25-30°C">25-30°C</option>
                            <option value="30°C以上">30°C以上</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-600 mb-2">标签</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {editedClothing.tags && editedClothing.tags.map((tag, index) => (
                              <span 
                                key={index} 
                                className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-sm flex items-center gap-1"
                              >
                                {tag}
                                <button
                                  onClick={() => setEditedClothing(prev => prev ? { 
                                    ...prev, 
                                    tags: prev.tags?.filter((_, i) => i !== index) 
                                  } : null)}
                                  className="hover:text-purple-800"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="输入新标签"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.target.value.trim()) {
                                  e.preventDefault();
                                  const newTag = e.target.value.trim();
                                  setEditedClothing(prev => prev ? { 
                                    ...prev, 
                                    tags: [...(prev.tags || []), newTag] 
                                  } : null);
                                  setAllTags(prev => prev.includes(newTag) ? prev : [...prev, newTag]);
                                  e.target.value = '';
                                }
                              }}
                              className="tag-input flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                            />
                            <button
                              onClick={() => {
                                const input = document.querySelector('.tag-input') as HTMLInputElement;
                                if (input && input.value.trim()) {
                                  const newTag = input.value.trim();
                                  setEditedClothing(prev => prev ? { 
                                    ...prev, 
                                    tags: [...(prev.tags || []), newTag] 
                                  } : null);
                                  setAllTags(prev => prev.includes(newTag) ? prev : [...prev, newTag]);
                                  input.value = '';
                                }
                              }}
                              className="px-4 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                            >
                              添加
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {allTags.filter(tag => 
                              !editedClothing.tags?.includes(tag)
                            ).map(tag => (
                              <button
                                key={tag}
                                onClick={() => setEditedClothing(prev => prev ? { 
                                  ...prev, 
                                  tags: [...(prev.tags || []), tag] 
                                } : null)}
                                className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 transition-colors"
                              >
                                + {tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={() => {
                            setIsEditingDetail(false);
                            setEditedClothing(null);
                          }}
                          className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => {
                            if (editedClothing) {
                              setClothes(prev => prev.map(item => 
                                item.id === editedClothing.id ? editedClothing : item
                              ));
                              setSelectedClothing(editedClothing);
                              setIsEditingDetail(false);
                              setEditedClothing(null);
                            }
                          }}
                          className="flex-1 py-3 bg-[#f472d0] text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
                        >
                          保存
                        </button>
                      </div>
                    </>
                  )
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showStorageDetailModal && selectedStorage && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4"
            onClick={() => setShowStorageDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowStorageDetailModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-xl font-bold text-gray-800">{selectedStorage.name}</h3>
                </div>
              </div>
              <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
                {(() => {
                  const clothesInStorage = clothes.filter(item => item.location === selectedStorage.name);
                  return clothesInStorage.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <Package className="w-16 h-16 mb-4 opacity-50" />
                      <p>暂无衣物</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {clothesInStorage.map(cloth => (
                        <div
                          key={cloth.id}
                          className="bg-gray-50 rounded-xl p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => {
                            setSelectedClothing(cloth);
                            setShowStorageDetailModal(false);
                            setShowClothingDetailModal(true);
                          }}
                        >
                          <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-gray-200">
                            <img src={cloth.image} alt={cloth.name} className="w-full h-full object-cover" />
                          </div>
                          <p className="text-sm font-medium text-gray-800 truncate">{cloth.name}</p>
                          <p className="text-xs text-gray-500">{categoryNames[cloth.category]}</p>
                          {cloth.detailLocation && (
                            <p className="text-xs text-purple-500 mt-1 truncate">{cloth.detailLocation}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
      
      {showSmartIntake && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">智能入柜助手</h3>
                <button onClick={() => {
                  // 如果添加位置弹窗已打开，先关闭它
                  if (showAddLocationModal) {
                    setShowAddLocationModal(false);
                  } else {
                    setShowSmartIntake(false);
                  }
                }} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                <ClothingIntake
                  onSave={async (clothing: { name: string; category: string; color: string; season: string; location: string; imageUrl: string; processedImageUrl?: string; confidence?: number }) => {
                    const finalImageUrl = clothing.processedImageUrl || clothing.imageUrl;
                    const locationValue = clothing.location || '衣柜中层';
                    
                    const newClothing: ClothingItem = {
                      id: Date.now().toString(),
                      name: clothing.name,
                      category: getCategoryKey(clothing.category),
                      image: finalImageUrl,
                      color: clothing.color,
                      tags: [clothing.category, clothing.color, clothing.season],
                      season: clothing.season,
                      suitableTemp: undefined,
                      location: locationValue,
                    };
                    
                    if (currentUser) {
                      console.log('正在保存衣物到数据库:', newClothing);
                      try {
                        // 不传 id，让数据库自动生成 UUID
                        const clothingToSave = {
                          user_id: currentUser.id,
                          name: newClothing.name,
                          category: newClothing.category,
                          image: newClothing.image,
                          color: newClothing.color,
                          tags: newClothing.tags,
                          suitable_temp: newClothing.suitableTemp,
                          location: newClothing.location,
                          is_favorite: false,
                        };
                        const result = await supabaseData.addClothing(clothingToSave);
                        if (result.error) {
                          console.error('保存衣物失败:', result.error);
                        } else {
                          console.log('衣物保存成功:', result.data);
                          // 如果返回了数据库生成的 id，使用它
                          if (result.data && result.data[0] && result.data[0].id) {
                            newClothing.id = result.data[0].id;
                          }
                        }
                      } catch (error) {
                        console.error('保存衣物异常:', error);
                      }
                    } else {
                      console.warn('用户未登录，衣物仅保存在本地');
                    }
                    
                    setClothes([...clothes, newClothing]);
                  }}
                  onSaveMultiple={async (clothesList: Array<{ name: string; category: string; color: string; season: string; location: string; imageUrl: string; processedImageUrl?: string; confidence?: number }>) => {
                    const newClothes: ClothingItem[] = clothesList.map((clothing, index) => {
                      const finalImageUrl = clothing.processedImageUrl || clothing.imageUrl;
                      const locationValue = clothing.location || '衣柜中层';
                      
                      return {
                        id: `${Date.now()}-${index}`,
                        name: clothing.name,
                        category: getCategoryKey(clothing.category),
                        image: finalImageUrl,
                        color: clothing.color,
                        tags: [clothing.category, clothing.color, clothing.season],
                        season: clothing.season,
                        suitableTemp: undefined,
                        location: locationValue,
                      };
                    });
                    
                    if (currentUser) {
                      console.log('正在批量保存衣物到数据库:', newClothes.length, '件');
                      for (let i = 0; i < newClothes.length; i++) {
                        const item = newClothes[i];
                        try {
                          // 不传 id，让数据库自动生成 UUID
                          const clothingToSave = {
                            user_id: currentUser.id,
                            name: item.name,
                            category: item.category,
                            image: item.image,
                            color: item.color,
                            tags: item.tags,
                            suitable_temp: item.suitableTemp,
                            location: item.location,
                            is_favorite: false,
                          };
                          const result = await supabaseData.addClothing(clothingToSave);
                          if (result.error) {
                            console.error('保存衣物失败:', item.name, result.error);
                          } else {
                            console.log('衣物保存成功:', item.name, result.data);
                            // 如果返回了数据库生成的 id，使用它
                            if (result.data && result.data[0] && result.data[0].id) {
                              newClothes[i].id = result.data[0].id;
                            }
                          }
                        } catch (error) {
                          console.error('保存衣物异常:', item.name, error);
                        }
                      }
                      console.log('批量保存完成');
                    } else {
                      console.warn('用户未登录，衣物仅保存在本地');
                    }
                    
                    setClothes([...clothes, ...newClothes]);
                  }}
                  onViewCloset={() => {
                    setShowSmartIntake(false);
                    setSelectedCategory(null);
                    setShowFavoritesOnly(false);
                  }}
                  locations={locations}
                  onShowAddLocation={() => setShowAddLocationModal(true)}
                />
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}

      {showCheckinModal && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[400] p-4"
            onClick={() => setShowCheckinModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-pink-400 to-purple-500 px-6 py-4">
                <h3 className="text-lg font-bold text-white text-center">穿搭打卡</h3>
              </div>
              
              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-80px)]">
                <div className="text-center">
                  <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center justify-center gap-2">
                    <span className="text-xl">📅</span>
                    打卡日期
                  </h4>
                  <input
                    type="date"
                    value={selectedCheckinDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSelectedCheckinDate(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-400"
                  />
                </div>

                <div className="text-center">
                  <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center justify-center gap-2">
                    <span className="text-xl">👗</span>
                    穿搭打卡
                  </h4>
                  <div className="flex gap-3">
                    <div className="flex-1 border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
                      {checkinOutfitImage ? (
                        <div className="relative">
                          <img 
                            src={checkinOutfitImage} 
                            alt="穿搭照片"
                            className="w-full h-24 object-contain mx-auto"
                          />
                          <button
                            onClick={() => setCheckinOutfitImage(null)}
                            className="absolute top-2 right-2 w-6 h-6 bg-gray-500 text-white rounded-full flex items-center justify-center text-xs"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  setCheckinOutfitImage(event.target?.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <div className="flex flex-col items-center gap-2 py-3">
                            <Upload className="w-8 h-8 text-gray-400" />
                            <span className="text-sm text-gray-500">上传穿搭照片</span>
                          </div>
                        </label>
                      )}
                    </div>
                    
                    <div className="flex-1 border-2 border-dashed border-pink-200 rounded-xl p-4 text-center">
                      {selectedOutfit ? (
                        <div className="relative h-full">
                          <button
                            onClick={() => {
                              setSelectedOutfit(null);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 bg-gray-500 text-white rounded-full flex items-center justify-center text-xs z-10"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[180px] mt-6">
                            {selectedOutfit.items?.map((itemId) => {
                              const clothingItem = clothes.find(c => c.id === itemId);
                              return clothingItem ? (
                                <img 
                                  key={itemId}
                                  src={clothingItem.image}
                                  alt={clothingItem.name}
                                  className="w-full aspect-[4/5] object-cover rounded-lg"
                                />
                              ) : null;
                            })}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setShowCheckinModal(false);
                            setShowOutfitSelector(true);
                          }}
                          className="flex flex-col items-center gap-2 py-3 text-pink-500 hover:text-pink-600 transition-colors w-full h-full"
                        >
                          <Layers className="w-8 h-8" />
                          <span className="text-sm">从搭配中选择</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center justify-center gap-2">
                    <span className="text-xl">😊</span>
                    今日心情
                  </h4>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {[
                      { mood: '开心', emoji: '😄' },
                      { mood: '平静', emoji: '😌' },
                      { mood: '疲惫', emoji: '😩' },
                      { mood: '烦躁', emoji: '😤' },
                      { mood: '兴奋', emoji: '🤩' },
                      { mood: '难过', emoji: '😢' },
                      { mood: '期待', emoji: '🌟' },
                      { mood: '满足', emoji: '🥰' },
                    ].map(({ mood, emoji }) => (
                      <button
                        key={mood}
                        onClick={() => setCheckinMood(checkinMood === mood ? '' : mood)}
                        className={`px-3 py-2 rounded-full text-sm transition-all flex items-center gap-1 ${
                          checkinMood === mood
                            ? 'bg-pink-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <span>{emoji}</span>
                        <span>{mood}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center justify-center gap-2">
                    <span className="text-xl">📝</span>
                    今日活动
                  </h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={checkinActivity}
                      onChange={(e) => setCheckinActivity(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && checkinActivity.trim()) {
                          e.preventDefault();
                          const entry = checkinEntries[selectedCheckinDate!];
                          if (entry && !entry.activities.includes(checkinActivity.trim())) {
                            entry.activities = [...entry.activities, checkinActivity.trim()];
                            setCheckinEntries(prev => ({
                              ...prev,
                              [selectedCheckinDate!]: entry
                            }));
                            setCheckinActivity('');
                          } else if (!entry) {
                            setCheckinEntries(prev => ({
                              ...prev,
                              [selectedCheckinDate!]: { 
                                date: selectedCheckinDate!, 
                                activities: [checkinActivity.trim()] 
                              }
                            }));
                            setCheckinActivity('');
                          }
                        }
                      }}
                      placeholder="记录今天做了什么..."
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-400"
                    />
                  </div>
                  {checkinEntries[selectedCheckinDate!]?.activities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {checkinEntries[selectedCheckinDate!].activities.map((act, idx) => (
                        <span 
                          key={idx} 
                          className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm flex items-center gap-1"
                        >
                          {act}
                          <button onClick={() => removeActivity(act)} className="hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center justify-center gap-2">
                    <span className="text-xl">📖</span>
                    今日日记
                  </h4>
                  <textarea
                    value={checkinDiary}
                    onChange={(e) => setCheckinDiary(e.target.value)}
                    placeholder="写下今天的心情和想法..."
                    rows={3}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-400 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowCheckinModal(false);
                      setSelectedCheckinDate(null);
                      setCheckinMood('');
                      setCheckinActivity('');
                      setCheckinDiary('');
                      setCheckinOutfitImage(null);
                      setSelectedOutfit(null);
                    }}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={saveCheckinEntry}
                    className="flex-1 py-3 bg-gradient-to-r from-pink-400 to-purple-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                  >
                    保存打卡
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}

      {showOutfitSelector && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[400] p-4"
            onClick={() => {
              setShowOutfitSelector(false);
              setShowCheckinModal(true);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-pink-400 to-purple-500 px-6 py-4">
                <h3 className="text-lg font-bold text-white text-center">选择搭配</h3>
              </div>
              
              <div className="p-6 overflow-x-auto">
                {outfits.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>暂无搭配，请先创建搭配</p>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    {outfits.map((outfit) => (
                      <div
                        key={outfit.id}
                        onClick={() => {
                          setSelectedOutfit(outfit);
                          setCheckinOutfitImage(null);
                          setShowOutfitSelector(false);
                          setShowCheckinModal(true);
                        }}
                        className="border-2 border-gray-200 rounded-xl p-3 cursor-pointer hover:border-pink-400 transition-colors min-w-[160px] max-h-[280px] flex flex-col"
                      >
                        <div className="grid grid-cols-2 gap-2 mb-2 overflow-y-auto max-h-[220px]">
                          {outfit.items?.map((itemId) => {
                            const clothingItem = clothes.find(c => c.id === itemId);
                            return clothingItem ? (
                              <img 
                                key={itemId}
                                src={clothingItem.image}
                                alt={clothingItem.name}
                                className="w-full aspect-[4/5] object-cover rounded-lg"
                              />
                            ) : null;
                          })}
                        </div>
                        <p className="text-sm text-gray-600 text-center truncate mt-auto">
                          {outfit.name || '未命名搭配'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="px-6 pb-6">
                <button
                  onClick={() => {
                    setShowOutfitSelector(false);
                    setShowCheckinModal(true);
                  }}
                  className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  返回
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}

      {showBlindBoxModal && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[400] p-4"
            onClick={() => setShowBlindBoxModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-purple-100/95 via-pink-100/95 to-violet-100/95 backdrop-blur-md rounded-3xl w-full max-w-lg p-8 border-2 border-purple-200 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {showConfetti && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                  {Array.from({ length: 50 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ 
                        y: -20, 
                        x: Math.random() * 400 - 200,
                        opacity: 1,
                        scale: Math.random() * 0.5 + 0.5
                      }}
                      animate={{ 
                        y: 400,
                        x: Math.random() * 200 - 100,
                        opacity: 0,
                        rotate: Math.random() * 720 - 360
                      }}
                      transition={{ 
                        duration: 2 + Math.random() * 2,
                        ease: "easeOut"
                      }}
                      className="absolute"
                    >
                      <span className="text-2xl">
                        {['✨', '🌟', '💫', '🌸', '💖', '🎀', '🎁', '🎉'][Math.floor(Math.random() * 8)]}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-800">🎁 穿搭盲盒</h3>
                <button onClick={() => setShowBlindBoxModal(false)} className="p-2 hover:bg-white/50 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {blindBoxType === 'outfit' && (selectedSeasons.length > 0 || selectedScenes.length > 0 || selectedStyles.length > 0) && (
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="text-sm text-gray-500">当前筛选：</span>
                  {selectedSeasons.map(s => (
                    <span key={s} className="px-3 py-1 bg-pink-200 text-pink-700 rounded-full text-sm">
                      {s}
                    </span>
                  ))}
                  {selectedScenes.map(s => (
                    <span key={s} className="px-3 py-1 bg-purple-200 text-purple-700 rounded-full text-sm">
                      {s}
                    </span>
                  ))}
                  {selectedStyles.map(s => (
                    <span key={s} className="px-3 py-1 bg-violet-200 text-violet-700 rounded-full text-sm">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {blindBoxType === 'clothing' && selectedCategory && (
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="text-sm text-gray-500">当前分类：</span>
                  <span className="px-3 py-1 bg-pink-200 text-pink-700 rounded-full text-sm">
                    {categoryNames[selectedCategory]}
                  </span>
                </div>
              )}

              {!isBlindBoxAnimating && !blindBoxResult && (
                <div className="text-center py-8">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-32 h-32 mx-auto mb-6 relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl shadow-lg transform rotate-6"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-[#f472d0] to-purple-600 rounded-2xl shadow-xl flex items-center justify-center">
                      <PackageCheck className="w-16 h-16 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  </motion.div>
                  <p className="text-gray-600 mb-2">准备好了吗？</p>
                  <p className="text-gray-400 text-sm mb-6">点击下方按钮开始抽取今日穿搭灵感</p>
                  <button
                    onClick={drawBlindBox}
                    className="px-8 py-3 bg-gradient-to-r from-[#f472d0] to-purple-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                  >
                    开始抽取 ✨
                  </button>
                </div>
              )}

              {isBlindBoxAnimating && (
                <div className="text-center py-8">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1, 1.1, 1],
                      rotate: [-10, 10, -10, 10, -10, 10, 0],
                      y: [0, -10, 0, -10, 0]
                    }}
                    transition={{ 
                      duration: 0.15,
                      repeat: 8,
                      ease: "linear"
                    }}
                    className="w-32 h-32 mx-auto mb-6 relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl shadow-lg transform rotate-6"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-[#f472d0] to-purple-600 rounded-2xl shadow-xl flex items-center justify-center">
                      <PackageCheck className="w-16 h-16 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  </motion.div>
                  <motion.p 
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="text-gray-600"
                  >
                    正在抽取中...
                  </motion.p>
                </div>
              )}

              {blindBoxResult && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-4"
                >
                  <motion.div
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="mb-4"
                  >
                    <p className="text-sm text-pink-500 font-medium">今日推荐</p>
                    <h4 className="text-xl font-bold text-gray-800 mt-1">{blindBoxResult.name}</h4>
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", bounce: 0.3 }}
                    className="w-48 h-56 mx-auto mb-6 rounded-2xl border-4 border-white shadow-xl p-3 bg-gray-50 overflow-hidden"
                  >
                    {blindBoxResult instanceof Object && 'items' in blindBoxResult && Array.isArray(blindBoxResult.items) ? (
                      <div className="grid grid-cols-2 gap-2 h-full overflow-y-auto scrollbar-hide">
                        {blindBoxResult.items.map((itemId: string) => {
                          const clothingItem = clothes.find(c => c.id === itemId);
                          return clothingItem ? (
                            <img 
                              key={itemId}
                              src={clothingItem.image} 
                              alt={clothingItem.name}
                              className="w-full aspect-[4/5] object-cover rounded-lg"
                            />
                          ) : null;
                        })}
                      </div>
                    ) : blindBoxResult instanceof Object && 'image' in blindBoxResult ? (
                      <img 
                        src={blindBoxResult.image} 
                        alt={blindBoxResult.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span>暂无图片</span>
                      </div>
                    )}
                  </motion.div>

                  {blindBoxResult instanceof Object && 'rating' in blindBoxResult && (
                    <div className="flex items-center justify-center gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star 
                          key={star}
                          className={`w-5 h-5 ${star <= blindBoxResult.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  )}

                  {blindBoxResult instanceof Object && 'suitableTemp' in blindBoxResult && (
                    <div className="flex items-center justify-center gap-2 mb-6 text-gray-500">
                      <Thermometer className="w-4 h-4" />
                      <span className="text-sm">{blindBoxResult.suitableTemp}</span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        // 根据盲盒结果类型设置打卡界面的对应字段
                        if (blindBoxResult && 'items' in blindBoxResult && Array.isArray(blindBoxResult.items)) {
                          // 是搭配（Outfit），填入"从搭配中选择"位置
                          setSelectedOutfit(blindBoxResult as Outfit);
                          setCheckinOutfitImage(null);
                        } else if (blindBoxResult && 'image' in blindBoxResult) {
                          // 是单品（ClothingItem），填入"上传穿搭照片"位置
                          setCheckinOutfitImage((blindBoxResult as ClothingItem).image);
                          setSelectedOutfit(null);
                        }
                        
                        setShowBlindBoxModal(false);
                        setBlindBoxResult(null);
                        setShowConfetti(false);
                        setShowCheckinModal(true);
                      }}
                      className="flex-1 py-3 bg-gradient-to-r from-[#f472d0] to-purple-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
                    >
                      就这个
                    </button>
                    <button
                      onClick={drawBlindBox}
                      className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      不满意，再抽一次
                    </button>
                  </div>
                </motion.div>
              )}

              {!isBlindBoxAnimating && !blindBoxResult && (
                ((blindBoxType === 'clothing' && clothes.length === 0) ||
                 (blindBoxType === 'outfit' && filteredOutfits.length === 0)) && (
                  <div className="text-center py-8">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <PackageCheck className="w-12 h-12 text-gray-300" />
                    </div>
                    <p className="text-gray-500 mb-2">这个池子是空的</p>
                    <p className="text-gray-400 text-sm">快去添加衣物或搭配吧～</p>
                    <button
                      onClick={() => {
                        setShowBlindBoxModal(false);
                        if (blindBoxType === 'clothing') {
                          setActiveTab('closet');
                        } else {
                          setActiveTab('outfits');
                        }
                      }}
                      className="mt-6 px-6 py-2 bg-[#f472d0] text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
                    >
                      去添加
                    </button>
                  </div>
                )
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
      
    </div>
  );
};

const getCategoryKey = (category: string): ClothingItem['category'] => {
  const categoryMap: Record<string, ClothingItem['category']> = {
    '上衣': 'top',
    '外套': 'outerwear',
    '裤子': 'bottom',
    '裙子': 'skirt',
    '连衣裙': 'dress',
    '鞋子': 'shoes',
    '帽子': 'hat',
    '包包': 'bag',
    '包袋': 'bag',
    '配饰': 'accessory',
    '内衣': 'underwear',
    '套装': 'suit',
  };
  return categoryMap[category] || 'top';
};

export default Closet;
