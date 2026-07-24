import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Heart, 
  Calendar, 
  Clock, 
  Sparkles, 
  StickyNote, 
  User, 
  X,
  PlusCircle,
  HelpCircle,
  Info
} from 'lucide-react';

// Self-contained localStorage hook
function useLocalStorage<T>(key: string, initialValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
}

// Custom-drawn high-quality wool ball emoji image mapping
export const MOOD_IMAGES: Record<string, string> = {
  excited: 'https://aly3.tuchuangyun.top/autoupload/s2nONsYq5NowA8qpLYF2y9iO_OyvX7mIgxFBfDMDErs/20260724/OlUU/249X260/%E5%85%B4%E5%A5%8B.png',
  happy: 'https://aly3.tuchuangyun.top/autoupload/s2nONsYq5NowA8qpLYF2y9iO_OyvX7mIgxFBfDMDErs/20260724/2RZT/263X254/%E5%BC%80%E5%BF%83.png',
  romantic: 'https://aly3.tuchuangyun.top/autoupload/s2nONsYq5NowA8qpLYF2y9iO_OyvX7mIgxFBfDMDErs/20260724/k8lg/237X247/%E5%BF%83%E5%8A%A8.png',
  calm: 'https://aly3.tuchuangyun.top/autoupload/s2nONsYq5NowA8qpLYF2y9iO_OyvX7mIgxFBfDMDErs/20260724/ANjW/232X240/%E5%B9%B3%E9%9D%99.png',
  sad: 'https://aly3.tuchuangyun.top/autoupload/s2nONsYq5NowA8qpLYF2y9iO_OyvX7mIgxFBfDMDErs/20260724/G0vA/241X238/%E4%BC%A4%E5%BF%83.png',
  anxious: 'https://aly3.tuchuangyun.top/autoupload/s2nONsYq5NowA8qpLYF2y9iO_OyvX7mIgxFBfDMDErs/20260724/72op/242X232/%E7%84%A6%E8%99%91.png',
  angry: 'https://aly3.tuchuangyun.top/autoupload/s2nONsYq5NowA8qpLYF2y9iO_OyvX7mIgxFBfDMDErs/20260724/p2TO/229X231/%E7%94%9F%E6%B0%94.png'
};

// Custom-drawn high-quality, desaturated Morandi vector mood icons (with cute wool ball image priority!)
export const MoodSVG = ({ type, className = "w-12 h-12" }: { type: string; className?: string }) => {
  const imageUrl = MOOD_IMAGES[type];
  if (imageUrl) {
    return (
      <img 
        src={imageUrl} 
        alt={type} 
        className={`${className} object-contain`} 
        referrerPolicy="no-referrer"
      />
    );
  }

  switch (type) {
    case 'excited':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="45" fill="#EAE0BC" opacity="0.3" />
          <circle cx="50" cy="50" r="38" fill="#F9F3DC" />
          <path d="M 32 46 L 40 50 L 32 54" stroke="#8B7D4E" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M 68 46 L 60 50 L 68 54" stroke="#8B7D4E" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M 38 64 Q 50 80 62 64 Z" fill="#D29A8A" stroke="#8B7D4E" strokeWidth="3" />
          <path d="M 22 25 L 26 21 L 22 17 L 18 21 Z" fill="#D3C392" />
          <path d="M 78 28 L 81 25 L 78 22 L 75 25 Z" fill="#D3C392" />
        </svg>
      );
    case 'happy':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="45" fill="#E6D3C2" opacity="0.3" />
          <circle cx="50" cy="50" r="38" fill="#F6EADF" />
          <circle cx="28" cy="62" r="7" fill="#E2BBA9" opacity="0.5" />
          <circle cx="72" cy="62" r="7" fill="#E2BBA9" opacity="0.5" />
          <path d="M 28 48 Q 36 38 44 48" stroke="#9C7C5D" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d="M 56 48 Q 64 38 72 48" stroke="#9C7C5D" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d="M 42 62 Q 50 71 58 62" stroke="#9C7C5D" strokeWidth="4" strokeLinecap="round" fill="none" />
        </svg>
      );
    case 'romantic':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="45" fill="#E5D3D3" opacity="0.3" />
          <circle cx="50" cy="50" r="38" fill="#F5EBEB" />
          <path d="M 78 26 C 75 21, 69 21, 69 26 C 69 31, 78 37, 78 37 C 78 37, 87 31, 87 26 C 87 21, 81 21, 78 26 Z" fill="#CE9B9B" />
          <circle cx="28" cy="62" r="7" fill="#E6B4B4" opacity="0.5" />
          <circle cx="72" cy="62" r="7" fill="#E6B4B4" opacity="0.5" />
          <path d="M 28 50 Q 36 42 44 50" stroke="#9B6B6B" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d="M 56 50 Q 64 42 72 50" stroke="#9B6B6B" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d="M 44 64 Q 50 70 56 64 Z" fill="#D29A9A" stroke="#9B6B6B" strokeWidth="3" />
        </svg>
      );
    case 'calm':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="45" fill="#D5E0D4" opacity="0.3" />
          <circle cx="50" cy="50" r="38" fill="#EBF1EA" />
          <line x1="28" y1="48" x2="42" y2="48" stroke="#647B62" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="58" y1="48" x2="72" y2="48" stroke="#647B62" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M 44 62 Q 50 66 56 62" stroke="#647B62" strokeWidth="4" strokeLinecap="round" fill="none" />
        </svg>
      );
    case 'sad':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="45" fill="#CCD9E6" opacity="0.3" />
          <circle cx="50" cy="50" r="38" fill="#E6ECF2" />
          <path d="M 29 58 C 29 61, 26 64, 26 64 C 26 64, 23 61, 23 58 C 23 55, 29 51, 29 58 Z" fill="#8EA1B4" />
          <path d="M 32 50 Q 38 45 44 52" stroke="#596F85" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d="M 56 52 Q 62 45 68 50" stroke="#596F85" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d="M 42 70 Q 50 60 58 70" stroke="#596F85" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        </svg>
      );
    case 'anxious':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="45" fill="#D4D1E3" opacity="0.3" />
          <circle cx="50" cy="50" r="38" fill="#EAE8F0" />
          <circle cx="34" cy="46" r="4.5" fill="#686384" />
          <circle cx="66" cy="46" r="4.5" fill="#686384" />
          <path d="M 76 40 Q 80 47 76 51" stroke="#A29EBE" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 38 64 Q 44 59 50 64 T 62 64" stroke="#686384" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d="M 40 18 Q 45 13 50 18 T 60 18" stroke="#A29EBE" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'angry':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="45" fill="#E0C6C6" opacity="0.3" />
          <circle cx="50" cy="50" r="38" fill="#F2E6E6" />
          <line x1="26" y1="38" x2="40" y2="44" stroke="#8F5353" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="74" y1="38" x2="60" y2="44" stroke="#8F5353" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="33" cy="50" r="4.5" fill="#8F5353" />
          <circle cx="67" cy="50" r="4.5" fill="#8F5353" />
          <path d="M 38 68 Q 50 56 62 68" stroke="#8F5353" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d="M 76 22 L 84 30 M 84 22 L 76 30" stroke="#C59393" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
};

interface MoodTypeConfig {
  label: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
}

// 7 Custom-built desaturated Morandi mood configurations
const MOOD_CONFIGS: Record<string, MoodTypeConfig> = {
  excited: {
    label: '兴奋',
    bgColor: '#F9F3DC',
    borderColor: '#EAE0BC',
    textColor: '#8B7D4E',
    accentColor: '#CBB47B',
    fontFamily: ''
  },
  happy: {
    label: '开心',
    bgColor: '#F6EADF',
    borderColor: '#E6D3C2',
    textColor: '#9C7C5D',
    accentColor: '#CEAE91',
    fontFamily: ''
  },
  romantic: {
    label: '心动',
    bgColor: '#F5EBEB',
    borderColor: '#E5D3D3',
    textColor: '#9B6B6B',
    accentColor: '#D0B2B2',
    fontFamily: ''
  },
  calm: {
    label: '平静',
    bgColor: '#EBF1EA',
    borderColor: '#D5E0D4',
    textColor: '#647B62',
    accentColor: '#9BB299',
    fontFamily: ''
  },
  sad: {
    label: '伤心',
    bgColor: '#E6ECF2',
    borderColor: '#CCD9E6',
    textColor: '#596F85',
    accentColor: '#96A9BD',
    fontFamily: ''
  },
  anxious: {
    label: '焦虑',
    bgColor: '#EAE8F0',
    borderColor: '#D4D1E3',
    textColor: '#686384',
    accentColor: '#A29EBE',
    fontFamily: ''
  },
  angry: {
    label: '生气',
    bgColor: '#F2E6E6',
    borderColor: '#E0C6C6',
    textColor: '#8F5353',
    accentColor: '#C59393',
    fontFamily: ''
  }
};

const MOOD_GROUPS = {
  positive: ['excited', 'happy', 'romantic'],
  neutral: ['calm'],
  negative: ['sad', 'anxious', 'angry']
} as const;

function getMoodGroup(moodType: string): 'positive' | 'neutral' | 'negative' {
  if (MOOD_GROUPS.positive.includes(moodType as any)) return 'positive';
  if (MOOD_GROUPS.neutral.includes(moodType as any)) return 'neutral';
  return 'negative';
}

const CATEGORIES_BY_GROUP: Record<
  'positive' | 'neutral' | 'negative',
  Record<string, { label: string; reasons: string[] }>
> = {
  positive: {
    work: {
      label: '工作学业',
      reasons: ['有成果了', '发工资了', '放假了']
    },
    social: {
      label: '人际交往',
      reasons: ['交到新朋友了', '和朋友聚餐了', '帮了别人的忙']
    },
    health: {
      label: '身体健康',
      reasons: ['体检结果都很正常', '今天运动了', '最近心情很好']
    },
    life: {
      label: '日常生活',
      reasons: ['天气很好']
    },
    entertainment: {
      label: '休闲娱乐',
      reasons: ['游戏没保底', '喝到了好喝的奶茶', '吃了美食', '看了喜欢的书/电影', '去旅游了']
    },
    love: {
      label: '与你有关',
      reasons: ['梦到你了', '感觉到被爱', '新衣服很好看', '抽到了你的新卡', '和你去约会了', '收到了你的礼物']
    }
  },
  neutral: {
    work: {
      label: '工作学业',
      reasons: ['按时下班', '在努力工作中']
    },
    social: {
      label: '人际交往',
      reasons: ['日常社交中']
    },
    health: {
      label: '身体健康',
      reasons: ['马上去体检', '坚持锻炼中']
    },
    life: {
      label: '日常生活',
      reasons: ['没有特别的事情发生']
    },
    entertainment: {
      label: '休闲娱乐',
      reasons: ['躺平中', '宅家中']
    },
    love: {
      label: '与你有关',
      reasons: ['每天都在想你']
    }
  },
  negative: {
    work: {
      label: '工作学业',
      reasons: ['工作好累', '怎么还不发工资', '工作好多', '被批评了']
    },
    social: {
      label: '人际交往',
      reasons: ['不喜欢同事', '和人起争执', '感到被冷落', '社交能量耗尽']
    },
    health: {
      label: '身体健康',
      reasons: ['来月经了好痛', '失眠', '头痛', '关节痛', '感冒发烧了']
    },
    life: {
      label: '日常生活',
      reasons: ['下大雨淋湿了', '堵车了']
    },
    entertainment: {
      label: '休闲娱乐',
      reasons: ['又保底了', '被鸽子了', '新电影好难看']
    },
    love: {
      label: '与你有关',
      reasons: ['抽卡歪了', '不想你和别人聊天', '为什么不多陪陪我']
    }
  }
};

interface MoodNote {
  id: string;
  sender: 'me' | 'them';
  moodType: string;
  category: string;
  reason: string;
  customText?: string;
  content: string;
  time: string;
  customFont?: string;
  customStyle?: string;
}

const AVAILABLE_FONTS = [
  { name: '系统默认', value: '' }
];

const PAPER_STYLES = [
  { name: '经典素色', value: 'solid' },
  { name: '复古网格', value: 'grid' },
  { name: '文艺缝线', value: 'dashed' }
];

const INITIAL_NOTES: MoodNote[] = [];

export const MoodNotesView = ({ 
  onClose, 
  themeConfig,
  myNickname = '我',
  mjNickname = '未婚夫'
}: { 
  onClose: () => void;
  themeConfig: any;
  myNickname?: string;
  mjNickname?: string;
}) => {
  const [notes, setNotes] = useLocalStorage<MoodNote[]>('app_mood_notes', INITIAL_NOTES);
  const [isAdding, setIsAdding] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Adding form states
  const [selectedMood, setSelectedMood] = useState<string>('happy');
  const [selectedCategory, setSelectedCategory] = useState<string>('life');
  const [selectedReason, setSelectedReason] = useState<string>('吃到美食');
  const [customText, setCustomText] = useState<string>('');
  const [selectedFont, setSelectedFont] = useState<string>('');
  const [selectedPaperStyle, setSelectedPaperStyle] = useState<string>('solid');

  // Auto-clear toast helper
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Fiancé automatic generate helper
  const triggerThemNote = (quiet = false) => {
    const moodKeys = Object.keys(MOOD_CONFIGS);
    const randomMoodKey = moodKeys[Math.floor(Math.random() * moodKeys.length)];
    
    const moodGroup = getMoodGroup(randomMoodKey);
    const groupCategories = CATEGORIES_BY_GROUP[moodGroup];
    const catKeys = Object.keys(groupCategories);
    const randomCatKey = catKeys[Math.floor(Math.random() * catKeys.length)];
    
    const catData = groupCategories[randomCatKey];
    let reasonsList = [...catData.reasons];
    
    // Filter out female-specific stuff from fiancé options:
    reasonsList = reasonsList.filter(r => r !== '来月经了好痛');
    
    const randomReason = reasonsList[Math.floor(Math.random() * reasonsList.length)] || '日常顺利';
    
    const now = new Date();
    const timeStr = `${now.getMonth() + 1}月${now.getDate()}日 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const moodLabel = MOOD_CONFIGS[randomMoodKey].label;
    const catLabel = catData.label;

    // Pick random style for fiancé's note so they have different styles!
    const randomPaperObj = PAPER_STYLES[Math.floor(Math.random() * PAPER_STYLES.length)];

    const newNote: MoodNote = {
      id: 'note-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      sender: 'them',
      moodType: randomMoodKey,
      category: randomCatKey,
      reason: randomReason,
      customText: undefined,
      content: `今天感觉【${moodLabel}】。因为在【${catLabel}】上：【${randomReason}】。`,
      time: timeStr,
      customFont: '', // Use system default
      customStyle: randomPaperObj.value
    };

    setNotes(prev => [newNote, ...prev]);
    if (!quiet) {
      showToast(`【${mjNickname}】悄悄在便签墙上贴了一张新便签哦～`);
    }
  };

  // Check if fiancé has posted today; if not, do a quiet daily auto-post on mount
  useEffect(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const lastPostDate = window.localStorage.getItem('app_last_them_post_date');
    
    if (lastPostDate !== todayStr) {
      const timer = setTimeout(() => {
        triggerThemNote(true); // Quietly prepend daily note
        window.localStorage.setItem('app_last_them_post_date', todayStr);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Sync selectedReason when selectedCategory changes
  const handleCategorySelect = (catKey: string) => {
    setSelectedCategory(catKey);
    const group = getMoodGroup(selectedMood);
    const reasons = CATEGORIES_BY_GROUP[group][catKey]?.reasons || [];
    if (reasons.length > 0) {
      setSelectedReason(reasons[0]);
    }
  };

  // Sync selectedReason when selectedMood changes
  const handleMoodSelect = (moodKey: string) => {
    setSelectedMood(moodKey);
    const group = getMoodGroup(moodKey);
    const catData = CATEGORIES_BY_GROUP[group][selectedCategory] || CATEGORIES_BY_GROUP[group]['life'];
    if (catData && catData.reasons.length > 0) {
      // Default reasons for category in this new mood group
      setSelectedReason(catData.reasons[0]);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Bypassing native confirm as it gets blocked in sandbox iframe
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    showToast('便签已拆下');
  };

  const handleSaveNote = () => {
    const now = new Date();
    const timeStr = `${now.getMonth() + 1}月${now.getDate()}日 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const moodLabel = MOOD_CONFIGS[selectedMood].label;
    const group = getMoodGroup(selectedMood);
    const catLabel = CATEGORIES_BY_GROUP[group][selectedCategory]?.label || '';

    const newNote: MoodNote = {
      id: 'note-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      sender: 'me',
      moodType: selectedMood,
      category: selectedCategory,
      reason: selectedReason,
      customText: customText.trim() || undefined,
      content: `今天感觉【${moodLabel}】。因为在【${catLabel}】上：【${selectedReason}】。`,
      time: timeStr,
      customFont: selectedFont || undefined,
      customStyle: selectedPaperStyle
    };

    setNotes(prev => [newNote, ...prev]);
    setIsAdding(false);
    
    // Clear form
    setCustomText('');
    
    showToast('便签已成功贴上啦！');

    // 25% chance that fiancé also actively posts a note after the user posts (with a sweet real-time toast)
    if (Math.random() < 0.25) {
      setTimeout(() => {
        triggerThemNote(false);
      }, 1500);
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col font-sans overflow-hidden bg-[#FAF6F0]" style={{ backgroundColor: themeConfig.bg || '#FAF6F0' }}>
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-16 left-4 right-4 z-50 py-3 px-4 bg-white/95 backdrop-blur-md rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-black/[0.03] text-center"
          >
            <span className="text-[12.5px] font-bold text-gray-700 flex items-center justify-center gap-1.5">
              <Sparkles size={14} className="text-pink-400 fill-pink-400/20" />
              {toastMessage}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div 
        className="w-full flex items-center justify-between px-4 pb-3 sticky top-0 z-10 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-md"
        style={{ backgroundColor: `${themeConfig.bg || '#FAF6F0'}e6` }}
      >
        <button onClick={onClose} className="text-[#8e8e93] text-[15px] flex items-center active:opacity-50 transition-opacity w-[60px]">
          <ChevronLeft size={22} className="-ml-1.5" />返回
        </button>
        <span className="text-[17px] font-semibold tracking-wide text-gray-800" style={{ fontFamily: '"Kaiti", "STKaiti", "华文楷体", "楷体", "Cursive", sans-serif' }}>便签墙</span>
        <div className="w-[60px]"></div>
      </div>

      {/* Scrollable Note Wall */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 flex flex-col items-center">
        
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-white/40 rounded-[24px] border border-black/[0.03] shadow-sm w-full max-w-md my-auto">
            <StickyNote size={44} className="text-gray-300 mb-3" />
            <p className="text-[14px] text-gray-500 font-bold" style={{ fontFamily: '"Kaiti", "STKaiti", "华文楷体", "楷体", sans-serif' }}>空空如也的便签墙</p>
            <p className="text-[11px] text-gray-400 mt-1">点击右下角的钢笔，快去贴上你的第一张心情便签吧～</p>
          </div>
        ) : (
          /* Grid of Sticky Notes */
          <div className="w-full max-w-2xl grid grid-cols-2 gap-x-4 gap-y-7 px-1 pb-4">
            {notes.map((note, idx) => {
              const mConf = MOOD_CONFIGS[note.moodType] || MOOD_CONFIGS.happy;
              
              // Organic slight staggered tilt angles based on note ID
              const angleVal = (parseInt(note.id.slice(-2)) % 4 - 2) * 1.5 || -1;

              return (
                <div 
                  key={note.id}
                  className={`rounded-[6px] p-4 pt-6 pb-4 relative flex flex-col justify-between min-h-[125px] shadow-[1px_4px_10px_rgba(0,0,0,0.03)] group transition-transform ${
                    note.customStyle === 'outline' ? 'border-2 border-dashed' : 'border border-black/[0.03]'
                  }`}
                  style={{ 
                    backgroundColor: mConf.bgColor,
                    borderColor: note.customStyle === 'outline' ? mConf.textColor : mConf.borderColor,
                    transform: `rotate(${angleVal}deg)`,
                    boxShadow: '1px 3px 8px rgba(0, 0, 0, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                  }}
                >
                  {/* Styled Translucent Adhesive Tape */}
                  <div 
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-10 h-3.5 bg-white/25 border-l border-r border-white/10 backdrop-blur-[1px] shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
                    style={{
                      transform: `rotate(${angleVal * -0.6}deg) translate(-50%, 0)`,
                    }}
                  />

                  {/* Faint Grid/Notebook details background */}
                  {note.customStyle === 'grid' && (
                    <div 
                      className="absolute inset-0 pointer-events-none opacity-[0.05]"
                      style={{ 
                        backgroundImage: `linear-gradient(${mConf.textColor} 0.5px, transparent 0.5px), linear-gradient(90deg, ${mConf.textColor} 0.5px, transparent 0.5px)`,
                        backgroundSize: '10px 10px' 
                      }}
                    />
                  )}

                  {note.customStyle === 'lines' && (
                    <div 
                      className="absolute inset-0 pointer-events-none opacity-[0.08]"
                      style={{ 
                        backgroundImage: `linear-gradient(transparent 19px, ${mConf.textColor} 1px)`,
                        backgroundSize: '100% 20px' 
                      }}
                    />
                  )}

                  {note.customStyle === 'dashed' && (
                    <div 
                      className="absolute inset-1 pointer-events-none rounded border border-dashed opacity-25"
                      style={{ borderColor: mConf.textColor }}
                    />
                  )}

                  {note.customStyle !== 'grid' && note.customStyle !== 'lines' && (
                    /* Default subtle dot pattern for aesthetic texture */
                    <div 
                      className="absolute inset-0 pointer-events-none opacity-[0.04]"
                      style={{ 
                        backgroundImage: `radial-gradient(${mConf.textColor} 1px, transparent 1px)`,
                        backgroundSize: '12px 12px' 
                      }}
                    />
                  )}

                  {/* Delete button: Accessible trash can, always visible with soft circular hover backdrop */}
                  <button 
                    onClick={(e) => handleDelete(note.id, e)}
                    className="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-500 hover:bg-black/[0.04] active:bg-black/[0.08] rounded-full active:scale-90 transition-all z-20"
                    title="拆下便签"
                  >
                    <Trash2 size={13} />
                  </button>

                  {/* Content: Centered Expression SVG and "因为{细分原因}" */}
                  <div className="flex-1 flex flex-col justify-start items-center text-center relative z-10 overflow-y-auto mb-1.5 pr-0.5 mt-0.5">
                    {/* Centered Expression */}
                    <div className="mb-2 flex justify-center">
                      <MoodSVG type={note.moodType} className="w-8 h-8" />
                    </div>

                    {/* Next line: 因为{选择的细分原因} (Only if there is no customText, else show customText directly) */}
                    {!note.customText ? (
                      <p 
                        className="text-[12px] font-bold leading-normal break-all"
                        style={{ 
                          color: mConf.textColor,
                          fontFamily: note.customFont || mConf.fontFamily,
                          textShadow: '0 0.5px 0 rgba(255,255,255,0.4)'
                        }}
                      >
                        因为{note.reason}
                      </p>
                    ) : (
                      <p 
                        className="text-[12px] italic leading-relaxed break-all w-full text-center px-1 font-medium"
                        style={{ 
                          color: mConf.textColor,
                          fontFamily: note.customFont || mConf.fontFamily,
                          opacity: 0.95
                        }}
                      >
                        “ {note.customText} ”
                      </p>
                    )}
                  </div>

                  {/* Footer: Signature & Time */}
                  <div className="flex items-center justify-between border-t border-black/[0.02] pt-1.5 mt-1 relative z-10">
                    <span 
                      className="text-[9px] font-bold"
                      style={{ 
                        color: mConf.textColor,
                        fontFamily: note.customFont || mConf.fontFamily
                      }}
                    >
                      {note.sender === 'me' ? myNickname : mjNickname}
                    </span>
                    <span className="text-[8px] text-gray-400/70 font-medium">
                      {note.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating handwriting pen Button */}
      <button 
        onClick={() => {
          setSelectedMood('happy');
          setSelectedCategory('life');
          setSelectedReason('吃到美食');
          setCustomText('');
          setSelectedFont('');
          setSelectedPaperStyle('solid');
          setIsAdding(true);
        }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-white active:scale-95 text-[#647B62] border border-black/[0.03] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-full flex items-center justify-center cursor-pointer transition-all z-40"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>

      {/* Slide-up Adding Sheet Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-xs">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="bg-white rounded-t-[28px] p-6 w-full max-w-md border border-white/50 shadow-2xl flex flex-col max-h-[82vh] overflow-y-auto"
            >
              {/* Grab bar */}
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 block" />

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[16px] font-bold text-gray-800 flex items-center gap-1.5" style={{ fontFamily: '"Kaiti", "STKaiti", "华文楷体", "楷体", sans-serif' }}>
                  贴上心情便签
                </h3>
                <button 
                  onClick={() => setIsAdding(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* 1. Select Mood Dimension (Desaturated Morandi SVGs, No Emojis!) */}
              <div className="mb-4">
                <label className="text-[11px] font-bold text-gray-400 block mb-2">选择今日心情</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(MOOD_CONFIGS).map(([key, config]) => {
                    const isSelected = selectedMood === key;
                    return (
                      <button
                        key={key}
                        onClick={() => handleMoodSelect(key)}
                        className={`py-2 rounded-[12px] border transition-all flex flex-col items-center justify-center gap-1 ${
                          isSelected 
                            ? 'scale-102 shadow-xs border-indigo-300 font-extrabold' 
                            : 'border-black/[0.03] bg-gray-50/50 opacity-80 hover:opacity-100'
                        }`}
                        style={{ 
                          backgroundColor: isSelected ? config.bgColor : undefined,
                          borderColor: isSelected ? config.borderColor : undefined,
                          color: config.textColor
                        }}
                      >
                        <MoodSVG type={key} className="w-8 h-8" />
                        <span className="text-[10px]">{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Select Why Category */}
              <div className="mb-4">
                <label className="text-[11px] font-bold text-gray-400 block mb-2">为什么是这样的心情呢</label>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(CATEGORIES_BY_GROUP[getMoodGroup(selectedMood)]).map(([key, item]) => {
                    const isSelected = selectedCategory === key;
                    const mConf = MOOD_CONFIGS[selectedMood];
                    return (
                      <button
                        key={key}
                        onClick={() => handleCategorySelect(key)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                          isSelected 
                            ? 'shadow-xs border-black/[0.08]' 
                            : 'bg-gray-50 border-black/[0.02] text-gray-500 hover:text-gray-800'
                        }`}
                        style={{
                          backgroundColor: isSelected ? mConf.bgColor : undefined,
                          borderColor: isSelected ? mConf.borderColor : undefined,
                          color: isSelected ? mConf.textColor : undefined
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Sub-reasons list (Only show if there is no customText entered!) */}
              {customText.trim() === '' ? (
                <div className="mb-4">
                  <label className="text-[11px] font-bold text-gray-400 block mb-2">再具体讲讲呢</label>
                  <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {(CATEGORIES_BY_GROUP[getMoodGroup(selectedMood)][selectedCategory] || CATEGORIES_BY_GROUP[getMoodGroup(selectedMood)]['life'])?.reasons.map((reason) => {
                      const isSelected = selectedReason === reason;
                      const mConf = MOOD_CONFIGS[selectedMood];
                      return (
                        <button
                          key={reason}
                          onClick={() => setSelectedReason(reason)}
                          className={`px-3 py-1.5 rounded-full text-[11px] transition-all border ${
                            isSelected 
                              ? 'font-bold shadow-xs border-black/[0.08]' 
                              : 'bg-gray-50/50 border-black/[0.02] text-gray-500 hover:bg-gray-100'
                          }`}
                          style={{
                            backgroundColor: isSelected ? mConf.bgColor : undefined,
                            borderColor: isSelected ? mConf.borderColor : undefined,
                            color: isSelected ? mConf.textColor : undefined
                          }}
                        >
                          {reason}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mb-4 bg-gray-50 rounded-xl p-3 border border-black/[0.01]">
                  <p className="text-[11px] font-medium text-gray-400">💡 已填写补充心情，将隐藏第三行细分选项，直接展示碎碎念内容～</p>
                </div>
              )}

              {/* 4. Custom Font & Sticky Paper Style Selectors */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[11.5px] font-bold text-gray-400 block mb-1.5">选择字体</label>
                  <select
                    value={selectedFont}
                    onChange={(e) => setSelectedFont(e.target.value)}
                    className="w-full bg-gray-50 border border-black/[0.03] rounded-xl px-2.5 py-2 text-[12px] text-gray-700 outline-none focus:border-black/[0.1] focus:bg-white cursor-pointer"
                    style={{ fontFamily: selectedFont || '"Kaiti", "STKaiti", cursive' }}
                  >
                    {AVAILABLE_FONTS.map((f) => (
                      <option key={f.value} value={f.value} style={{ fontFamily: f.value || 'inherit' }}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11.5px] font-bold text-gray-400 block mb-1.5">选择样式</label>
                  <select
                    value={selectedPaperStyle}
                    onChange={(e) => setSelectedPaperStyle(e.target.value)}
                    className="w-full bg-gray-50 border border-black/[0.03] rounded-xl px-2.5 py-2 text-[12px] text-gray-700 outline-none focus:border-black/[0.1] focus:bg-white cursor-pointer"
                  >
                    {PAPER_STYLES.map((ps) => (
                      <option key={ps.value} value={ps.value}>
                        {ps.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 5. Optional Custom Sweet details */}
              <div className="mb-5">
                <label className="text-[11.5px] font-bold text-gray-400 block mb-1.5">补充心情（选填）</label>
                <textarea 
                  className="w-full bg-gray-50 border border-black/[0.03] rounded-xl p-3 text-[12.5px] text-gray-800 outline-none focus:border-black/[0.1] focus:bg-white resize-none h-[72px] leading-relaxed placeholder-gray-400"
                  placeholder="写下其他的碎碎念、细节或甜蜜的想法吧..."
                  value={customText}
                  onChange={e => setCustomText(e.target.value)}
                  style={{
                    fontFamily: selectedFont || '"Kaiti", "STKaiti", "华文楷体", "楷体", "Cursive", sans-serif'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-2">
                <button 
                  onClick={() => setIsAdding(false)} 
                  className="flex-1 py-3 rounded-xl bg-gray-100 active:bg-gray-200 text-gray-500 font-semibold text-[12px] transition-all"
                >
                  取消
                </button>
                <button 
                  onClick={handleSaveNote} 
                  className="flex-1 py-3 rounded-xl text-white font-extrabold text-[12px] shadow-sm transition-all flex items-center justify-center gap-1"
                  style={{
                    backgroundColor: MOOD_CONFIGS[selectedMood].textColor,
                    boxShadow: `0 4px 14px ${MOOD_CONFIGS[selectedMood].accentColor}50`
                  }}
                >
                  贴上便签
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
