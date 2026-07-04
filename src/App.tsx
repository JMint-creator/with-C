import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  Mail, 
  CalendarDays, 
  BookHeart, 
  Gift, 
  Film, 
  CheckSquare, 
  Dices, 
  Palette, 
  Settings, 
  Database, 
  Library, 
  Cat,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  Heart,
  Image as ImageIcon,
  Type,
  Droplet,
  Download,
  Plus,
  Trash2,
  X,
  Radar,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music,
  ListMusic,
  Aperture,
  Search,
  Wallet
} from 'lucide-react';
import { motion } from 'motion/react';
import { ChatView } from './ChatView';
import { MomentsView } from './MomentsView';
import { WishlistView } from './WishlistView';
import { ChatSettingsView } from './ChatSettingsView';
import { CheckInsView } from './CheckInsView';
import { DataView } from './DataView';
import { AccountingView } from './AccountingView';
import { TodoView } from './TodoView';
import { MailboxView } from './MailboxView';
import { compressImage, useIDBState } from './utils';
import { VideoCallOverlay } from './VideoCallOverlay';
import { TodoScheduler } from './TodoScheduler';

const apps = [
  { name: '聊天', icon: MessageCircle },
  { name: '信箱', icon: Mail },
  { name: '查岗', icon: Radar },
  { name: '朋友圈', icon: Aperture },
  { name: '书影音记录', icon: BookHeart },
  { name: '记账', icon: Wallet },
  { name: 'Todo', icon: CheckSquare },
  { name: '帮我决定', icon: Dices },
];

const tools = [
  { name: '外观设置', icon: Palette },
  { name: '字卡库', icon: Library },
  { name: '聊天设置', icon: Settings },
  { name: '数据管理', icon: Database },
];

const colorThemes = {
  warm: { 
    bg: '#EBE7DF', 
    cardBg: 'rgba(248, 246, 242, 0.55)', 
    textPrimary: '#333333', 
    textSecondary: '#84817A',
    numColor: '#2B2B2B'
  },
  mint: { 
    bg: '#E3EBE6', 
    cardBg: 'rgba(242, 248, 244, 0.55)', 
    textPrimary: '#2C3A33', 
    textSecondary: '#7A8C82',
    numColor: '#1F2E26'
  },
  sakura: { 
    bg: '#EBE2E4', 
    cardBg: 'rgba(249, 243, 245, 0.55)', 
    textPrimary: '#3B2A2D', 
    textSecondary: '#8A7B7E',
    numColor: '#2D1B1E'
  },
  blue: {
    bg: '#E0E7ED',
    cardBg: 'rgba(240, 244, 248, 0.55)',
    textPrimary: '#2B3A4A',
    textSecondary: '#7A8A9A',
    numColor: '#1A2A3A'
  },
  purple: {
    bg: '#E6E0ED',
    cardBg: 'rgba(245, 240, 248, 0.55)',
    textPrimary: '#3A2B4A',
    textSecondary: '#8A7A9A',
    numColor: '#2A1A3A'
  },
  red: {
    bg: '#EDE0E0',
    cardBg: 'rgba(248, 240, 240, 0.55)',
    textPrimary: '#4A2B2B',
    textSecondary: '#9A7A7A',
    numColor: '#3A1A1A'
  }
};

const SettingItem = ({ icon: Icon, label, value, onClick, onChange, isTextarea = false, isColor = false, hideBorder = false }: any) => {
  return (
    <div 
      className={`flex items-center bg-white transition-colors pl-4 ${!onChange ? 'active:bg-gray-50 cursor-pointer' : ''}`}
      onClick={!onChange ? onClick : undefined}
    >
      <div className="w-[36px] h-[36px] rounded-[12px] bg-black/[0.04] border border-black/5 flex items-center justify-center shrink-0 mr-3 text-[#AC9F94]">
        <Icon size={20} strokeWidth={1.5}/>
      </div>
      <div className={`flex-1 flex items-center justify-between py-3.5 pr-4 ${!hideBorder ? 'border-b border-[#E5E5EA]' : ''}`}>
        <span className="text-[14px] text-[#333]">{label}</span>
        <div className="flex items-center gap-2">
          {isColor ? (
            <input 
              type="color" 
              value={value || '#a894a7'} 
              onChange={(e) => onChange(e.target.value)} 
              className="w-8 h-8 rounded shrink-0 cursor-pointer p-0 border-0 bg-transparent"
            />
          ) : onChange && isTextarea ? (
            <textarea 
              value={value} 
              onChange={(e) => onChange(e.target.value)} 
              className="text-[13px] text-[#888] text-right bg-transparent outline-none max-w-[150px] resize-none h-10 py-1"
              placeholder="输入..."
            />
          ) : onChange ? (
            <input 
              type="text" 
              value={value} 
              onChange={(e) => onChange(e.target.value)} 
              className="text-[13px] text-[#888] text-right bg-transparent outline-none max-w-[150px]"
              placeholder="输入..."
            />
          ) : (
             <span className="text-[13px] text-[#888] truncate max-w-[120px]">{value}</span>
          )}
          {!onChange && <ChevronRight size={18} className="text-[#C7C7CC]" />}
        </div>
      </div>
    </div>
  )
}

function useLocalState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    try {
      setState((prevState) => {
        const nextValue = value instanceof Function ? value(prevState) : value;
        window.localStorage.setItem(key, JSON.stringify(nextValue));
        return nextValue;
      });
    } catch (error) {}
  };

  return [state, setValue];
}

const DecideView = ({ onClose, themeConfig, onStartDecide, isDeciding }: { onClose: () => void, themeConfig: any, onStartDecide: (delay: number, result: string[], tab: string) => void, isDeciding: boolean }) => {
  const [tab, setTab] = useState<'tarot' | 'yesno' | 'custom'>('tarot');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [delay, setDelay] = useState(0);
  const [tarotCount, setTarotCount] = useState(1);

  const thumbColor = themeConfig.textPrimary || '#333';

  const handleStart = () => {
    if (!question.trim()) {
      alert('请先输入我想问的问题');
      return;
    }
    if (tab === 'custom' && options.filter(o => o.trim() !== '').length < 2) {
      alert('请至少输入两个选项');
      return;
    }

    let generated: string[] = [];
    if (tab === 'tarot') {
      const nums = [];
      const used = new Set();
      while (nums.length < tarotCount) {
        const num = Math.floor(Math.random() * 78) + 1;
        if (!used.has(num)) {
          used.add(num);
          nums.push(num.toString());
        }
      }
      generated = nums;
    } else if (tab === 'yesno') {
      generated = [Math.random() > 0.5 ? '是' : '否'];
    } else if (tab === 'custom') {
      const validOptions = options.filter(o => o.trim() !== '');
      if (validOptions.length === 0) {
         generated = ['无有效选项'];
      } else {
         generated = [validOptions[Math.floor(Math.random() * validOptions.length)]];
      }
    }
    
    onStartDecide(delay, generated, tab);
  };

  return (
    <div className="absolute inset-0 flex flex-col font-sans overflow-x-hidden overflow-y-auto" style={{ backgroundColor: themeConfig.bg || '#F2F2F7' }}>
      {/* Header */}
      <div className="w-full flex items-center justify-between px-4 pb-3 sticky top-0 z-10 pt-[max(1rem,env(safe-area-inset-top))]" style={{ backgroundColor: themeConfig.bg || '#F2F2F7', backdropFilter: 'blur(12px)' }}>
          <button onClick={onClose} className="text-[#8e8e93] text-[15px] flex items-center active:opacity-50 transition-opacity w-[60px]">
            <ChevronLeft size={22} className="-ml-1.5" />返回
          </button>
          <span className="text-[17px] font-semibold tracking-wide" style={{ color: themeConfig.textPrimary }}>帮我决定</span>
          <div className="w-[60px]"></div>
      </div>

      <div className="w-full max-w-sm mx-auto px-5 pt-4 pb-20 flex-1 flex flex-col items-center">
         {/* Tabs */}
         <div className="flex bg-[#e3e3e8] rounded-[10px] p-1 mb-8 w-full border border-black/[0.02]">
            <button className={`flex-1 py-1.5 rounded-[8px] text-[14px] font-medium transition-all ${tab === 'tarot' ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] text-black' : 'text-[#8e8e93]'}`} onClick={() => setTab('tarot')}>塔罗牌</button>
            <button className={`flex-1 py-1.5 rounded-[8px] text-[14px] font-medium transition-all ${tab === 'yesno' ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] text-black' : 'text-[#8e8e93]'}`} onClick={() => setTab('yesno')}>是/否</button>
            <button className={`flex-1 py-1.5 rounded-[8px] text-[14px] font-medium transition-all ${tab === 'custom' ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] text-black' : 'text-[#8e8e93]'}`} onClick={() => setTab('custom')}>自定义</button>
         </div>

         <div className="w-full bg-white rounded-[20px] p-5 shadow-sm border border-black/[0.04]">
             <div className="text-[14px] font-medium mb-2" style={{ color: themeConfig.textSecondary }}>我想问</div>
             <textarea 
                className="w-full bg-[#f9f9f9] rounded-[12px] p-3 text-[15px] outline-none resize-none mb-5 h-[80px]"
                placeholder="让我帮你做决定吧"
                value={question}
                onChange={e => setQuestion(e.target.value)}
             />

             {tab === 'tarot' && (
                 <div className="mb-5 space-y-3">
                     <div className="flex items-center justify-between">
                         <div className="text-[14px] font-medium" style={{ color: themeConfig.textSecondary }}>抽取数量 (1-6张)</div>
                         <div className="flex items-center space-x-3">
                             <button 
                               onClick={() => setTarotCount(Math.max(1, tarotCount - 1))}
                               className="w-8 h-8 rounded-full bg-[#f2f2f7] flex items-center justify-center active:bg-[#e5e5ea] transition-colors"
                               style={{ color: thumbColor }}
                             >
                               <ChevronLeft size={16} />
                             </button>
                             <span className="text-[15px] font-medium w-4 text-center" style={{ color: thumbColor }}>{tarotCount}</span>
                             <button 
                               onClick={() => setTarotCount(Math.min(6, tarotCount + 1))}
                               className="w-8 h-8 rounded-full bg-[#f2f2f7] flex items-center justify-center active:bg-[#e5e5ea] transition-colors"
                               style={{ color: thumbColor }}
                             >
                                 <ChevronLeft size={16} className="rotate-180" />
                             </button>
                         </div>
                     </div>
                 </div>
             )}

             {tab === 'custom' && (
                 <div className="mb-5 space-y-3">
                     <div className="text-[14px] font-medium" style={{ color: themeConfig.textSecondary }}>选项 (2-6个)</div>
                     {options.map((opt, idx) => (
                         <div key={idx} className="flex space-x-2">
                             <input 
                               className="flex-1 bg-[#f9f9f9] rounded-[10px] px-3 py-2 text-[14px] outline-none"
                               placeholder={`选项 ${idx + 1}`}
                               value={opt}
                               onChange={e => {
                                   const newOpts = [...options];
                                   newOpts[idx] = e.target.value;
                                   setOptions(newOpts);
                               }}
                             />
                             {options.length > 2 && (
                                 <button onClick={() => {
                                     const newOpts = [...options];
                                     newOpts.splice(idx, 1);
                                     setOptions(newOpts);
                                 }} className="p-2 active:opacity-50" style={{ color: themeConfig.textSecondary }}><X size={18}/></button>
                             )}
                         </div>
                     ))}
                     {options.length < 6 && (
                         <button onClick={() => setOptions([...options, ''])} className="text-[#007AFF] text-[13px] font-medium flex items-center justify-center w-full py-2 bg-[#f2f2f7]/50 rounded-[10px]">
                            <Plus size={16} className="mr-1"/>添加选项
                         </button>
                     )}
                 </div>
             )}

             <div className="text-[14px] font-medium mb-3" style={{ color: themeConfig.textSecondary }}>给未婚夫的思考时间</div>
             <div className="flex items-center justify-between mb-6 bg-[#fcfcfd] border border-gray-100 p-2.5 rounded-[12px] shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
                 <span className="text-[14px] font-medium pl-1 shrink-0" style={{ color: themeConfig.textPrimary }}>间隔</span>
                 <input 
                    type="range" 
                    min="0" 
                    max="60" 
                    step="1" 
                    value={delay} 
                    onChange={e => setDelay(parseInt(e.target.value))} 
                    className="flex-1 mx-4 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                       background: `linear-gradient(to right, ${thumbColor} 0%, ${thumbColor} ${(delay / 60) * 100}%, #e5e7eb ${(delay / 60) * 100}%, #e5e7eb 100%)`
                    }}
                 />
                 <style dangerouslySetInnerHTML={{__html: `
                    input[type=range]::-webkit-slider-thumb {
                      -webkit-appearance: none;
                      appearance: none;
                      width: 18px;
                      height: 18px;
                      border-radius: 50%;
                      background: ${thumbColor};
                      cursor: pointer;
                      border: 2px solid white;
                      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                    }
                    input[type=range]::-moz-range-thumb {
                      width: 18px;
                      height: 18px;
                      border-radius: 50%;
                      background: ${thumbColor};
                      cursor: pointer;
                      border: 2px solid white;
                      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                    }
                 `}} />
                 <span className="text-[14px] font-medium min-w-[55px] text-right pr-1 shrink-0" style={{ color: thumbColor }}>
                    {delay === 0 ? '立刻' : `${delay}分钟`}
                 </span>
             </div>

             <button 
                 onClick={handleStart}
                 disabled={isDeciding}
                 className={`w-full py-3.5 rounded-[14px] text-white font-medium text-[15px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-transform active:scale-95`}
                 style={{ backgroundColor: isDeciding ? themeConfig.textSecondary : themeConfig.textPrimary, opacity: isDeciding ? 0.7 : 1 }}
             >
                 {isDeciding ? '正在决定中...' : '帮我决定'}
             </button>
         </div>
      </div>
    </div>
  );
};

const globalAudio = new Audio();

const BackgroundLayer = ({ bg, image, show }: { bg: string, image: string, show: boolean }) => {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: bg,
      backgroundImage: image !== 'none' ? image : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      zIndex: -1,
      pointerEvents: 'none',
    }} />
  );
};

export default function App() {
  const [view, setView] = useState<'home' | 'appearance' | 'data' | 'library' | 'decide' | 'chat' | 'chat_settings' | 'music_manager' | 'moments' | 'wishlist' | 'check_in' | 'accounting' | 'todo' | 'mailbox'>('home');
  const [appearanceTab, setAppearanceTab] = useState<'global' | 'chat' | 'component' | 'wallpaper'>('global');

  // Library States
  const [librarySearchQuery, setLibrarySearchQuery] = useState('');
  const [replySubTab, setReplySubTab] = useState<'cards' | 'emoji' | 'stickers' | 'nudge' | 'audio'>('cards');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [importModalData, setImportModalData] = useState<{name: string, data: any} | null>(null);
  const [confirmModal, setConfirmModal] = useState<{title: string, msg: string, onConfirm: () => void} | null>(null);
  const [toastMsg, setToastMsg] = useState<string>('');

  const showToast = (msg: string) => {
      setToastMsg(msg);
      setTimeout(() => setToastMsg(''), 2000);
  };

  const [cardGroups, setCardGroups] = useLocalState<any[]>('app_cardGroups', [
    { id: '1', name: '默认分组', cards: ['你好呀！', '在干嘛呢？'] },
    { id: '2', name: '记账回复', cards: ['记得合理分配生活开销哦~', '钱花在刀刃上！今天有什么收获？', '记账是个好习惯，继续保持！'] }
  ]);
  const [emojis, setEmojis] = useLocalState<string[]>('app_emojis', ['😀', '😂', '🥰', '👍', '🙏']);
  const [stickers, setStickers] = useIDBState<string[]>('app_stickers', []);
  const [voiceCards, setVoiceCards] = useIDBState<Array<{ id: string, name: string, url: string, duration: number }>>('app_voiceCards', []);
  const [nudges, setNudges] = useLocalState<string[]>('app_nudges', ['拍了拍我的 脑袋', '拍了拍我的 肩膀']);

  useEffect(() => {
    // Ensure "记账回复" and "Todo回复" groups exist
    setCardGroups(prev => {
      let next = [...prev];
      if (!next.find(g => g.name === '记账回复' || g.name === '记账')) {
        next.push({ id: 'sys_accounting', name: '记账回复', cards: ['记得合理分配生活开销哦~', '钱花在刀刃上！今天有什么收获？', '记账是个好习惯，继续保持！'] });
      }
      if (!next.find(g => g.name === 'Todo回复' || g.name === 'Todo添加' || g.name === 'Todo完成' || g.name === 'Todo逾期')) {
        next.push({ id: 'sys_todo', name: 'Todo回复', cards: ['小本本记好了！', '不错哦，继续保持~', '既然写下了就要做到哦！', '辛苦啦，奖励一个抱抱！'] });
      }
      return next;
    });
  }, []);

  // UI States
  const [wallpaper, setWallpaper] = useIDBState('app_wallpaper', '');
  const [profileBg, setProfileBg] = useIDBState('app_profileBg', '');
  const [avatar1, setAvatar1] = useIDBState('app_avatar1', '');
  const [avatar2, setAvatar2] = useIDBState('app_avatar2', '');
  const [name1, setName1] = useLocalState('app_name1', 'Yuli');
  const [name2, setName2] = useLocalState('app_name2', 'Milk');
  const [motto, setMotto] = useLocalState('app_motto', '沉睡中缠绵 · 清醒又幻灭');
  const [subtitle, setSubtitle] = useLocalState('app_subtitle', 'LOCAL DAILY ACTIVE');

  // Theme
  const [theme, setTheme] = useLocalState<'warm' | 'mint' | 'sakura' | 'blue' | 'purple'>('app_theme', 'warm');

  // Chat Settings
  const [chatBg, setChatBg] = useIDBState('app_chatBg', '');
  const [chatAvatar1, setChatAvatar1] = useIDBState('app_chatAvatar1', '');
  const [chatAvatar2, setChatAvatar2] = useIDBState('app_chatAvatar2', '');
  
  // Social Settings
  const [myNickname, setMyNickname] = useLocalState('app_myNickname', '我');
  const [mjNickname, setMjNickname] = useLocalState('app_mjNickname', '梦角');
  const [keepaliveIcon, setKeepaliveIcon] = useIDBState('app_keepalive_icon', '');
  const [momentsBg, setMomentsBg] = useIDBState('app_moments_bg', '');
  const [wishlistBg, setWishlistBg] = useIDBState('app_wishlist_bg', '');
  const [checkinsBg, setCheckinsBg] = useIDBState('app_checkins_bg', '');
  const [appOpacity, setAppOpacity] = useLocalState('app_home_icon_opacity', 40);
  const [wishlistCardOpacity, setWishlistCardOpacity] = useLocalState('app_wishlist_card_opacity', 85);
  const [momentsStyle, setMomentsStyle] = useLocalState<'wechat' | 'weibo'>('app_moments_style', 'wechat');
  const [chatCss, setChatCss] = useIDBState('app_chatCss', '');
  const [chatFont, setChatFont] = useIDBState('app_chatFont', '');
  const [chatKeepAlive] = useLocalState('app_chatKeepAlive', false);
  const [chatBubbleColor, setChatBubbleColor] = useLocalState('app_chatBubbleColor', '');
  const [chatBubbleStyle, setChatBubbleStyle] = useLocalState<'glass'|'system'>('app_chatBubbleStyle', 'glass');

  // Anniversary Settings
  const [anniversaryDate, setAnniversaryDate] = useLocalState('app_anniversaryDate', '2024-10-28');

  const getDaysTogether = () => {
    const start = new Date(anniversaryDate);
    start.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffTime = now.getTime() - start.getTime();
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  };

  const getFormattedDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${days[date.getDay()]}`;
  };

  // Music Player State
  const [musicList, setMusicList] = useLocalState<Array<{ id: string, name: string, artist: string, url: string, category?: string }>>('app_musicList', []);
  const [activePlaylist, setActivePlaylist] = useLocalState<string>('app_activePlaylist', '全部');
  const [currentMusicIndex, setCurrentMusicIndex] = useLocalState<number>('app_currentMusicIndex', 0);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  const playQueue = React.useMemo(() => {
     return activePlaylist === '全部' ? musicList : musicList.filter(m => (m.category || '默认') === activePlaylist);
  }, [musicList, activePlaylist]);

  const nextMusicRef = useRef(() => {});
  nextMusicRef.current = () => {
    if (playQueue.length === 0) {
      setIsMusicPlaying(false);
      return;
    }
    setCurrentMusicIndex((currentMusicIndex + 1) % playQueue.length);
  };

  useEffect(() => {
    const updateProgress = () => {
      if (globalAudio.duration) {
        setAudioProgress(globalAudio.currentTime / globalAudio.duration);
      } else {
        setAudioProgress(0);
      }
    };
    const onEnded = () => {
      nextMusicRef.current();
    };
    const onError = () => {
      if (globalAudio.src && globalAudio.src !== window.location.href) {
         showToast("音频加载失败，格式不支持或链接失效");
         setIsMusicPlaying(false);
      }
    };
    
    globalAudio.addEventListener('timeupdate', updateProgress);
    globalAudio.addEventListener('ended', onEnded);
    globalAudio.addEventListener('error', onError);
    
    return () => {
      globalAudio.removeEventListener('timeupdate', updateProgress);
      globalAudio.removeEventListener('ended', onEnded);
      globalAudio.removeEventListener('error', onError);
    };
  }, []);

  const lastPlayedUrlRef = useRef('');

  useEffect(() => {
    const safeIndex = currentMusicIndex >= playQueue.length ? 0 : currentMusicIndex;
    if (playQueue.length > 0 && playQueue[safeIndex]) {
      const currentUrl = playQueue[safeIndex].url;
      if (lastPlayedUrlRef.current !== currentUrl) {
         globalAudio.src = currentUrl;
         globalAudio.load();
         lastPlayedUrlRef.current = currentUrl;
      }
      if (isMusicPlaying) {
         const playPromise = globalAudio.play();
         if (playPromise !== undefined) {
             playPromise.catch(e => {
                 if (e.name !== 'AbortError') {
                     showToast("无法播放该音频，请检查链接是否有效");
                     setIsMusicPlaying(false);
                 }
             });
         }
      } else {
         globalAudio.pause();
      }
    } else {
      globalAudio.pause();
      if (isMusicPlaying) {
          setIsMusicPlaying(false);
      }
      lastPlayedUrlRef.current = '';
    }
  }, [playQueue, currentMusicIndex, isMusicPlaying]);

  const toggleMusicPlay = () => {
    if (playQueue.length === 0) return;
    setIsMusicPlaying(!isMusicPlaying);
  };
  const prevMusic = () => {
    if (playQueue.length === 0) return;
    setCurrentMusicIndex((currentMusicIndex - 1 + playQueue.length) % playQueue.length);
    setIsMusicPlaying(true);
  };
  const nextMusic = () => {
    if (playQueue.length === 0) return;
    setCurrentMusicIndex((currentMusicIndex + 1) % playQueue.length);
    setIsMusicPlaying(true);
  };

  // Global Decide State
  const [globalDecideCountdown, setGlobalDecideCountdown] = useState(0);
  const [globalDecideIsDrawing, setGlobalDecideIsDrawing] = useState(false);
  const [globalDecideResult, setGlobalDecideResult] = useState<{tab: string, result: string[]} | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (globalDecideIsDrawing && globalDecideCountdown > 0) {
      timer = setTimeout(() => {
        setGlobalDecideCountdown(prev => prev - 1);
      }, 1000);
    } else if (globalDecideIsDrawing && globalDecideCountdown === 0) {
      setGlobalDecideIsDrawing(false);
    }
    return () => clearTimeout(timer);
  }, [globalDecideIsDrawing, globalDecideCountdown]);

  // Refs
  const chatBgInputRef = useRef<HTMLInputElement>(null);
  const wallpaperInputRef = useRef<HTMLInputElement>(null);
  const profileBgInputRef = useRef<HTMLInputElement>(null);
  const avatar1InputRef = useRef<HTMLInputElement>(null);
  const avatar2InputRef = useRef<HTMLInputElement>(null);
  const momentsBgInputRef = useRef<HTMLInputElement>(null);
  const wishlistBgInputRef = useRef<HTMLInputElement>(null);
  const checkinsBgInputRef = useRef<HTMLInputElement>(null);
  const chatAvatar1InputRef = useRef<HTMLInputElement>(null);
  const chatAvatar2InputRef = useRef<HTMLInputElement>(null);
  const cssInputRef = useRef<HTMLInputElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);
  const stickerInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const cardGroupImageInputRef = useRef<HTMLInputElement>(null);
  const keepaliveIconInputRef = useRef<HTMLInputElement>(null);

  const handleCardGroupImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !activeGroupId) return;
    
    const newGroups = [...cardGroups];
    const gIdx = newGroups.findIndex(g => g.id === activeGroupId);
    if (gIdx === -1) return;

    showToast('正在处理图片...');
    let processedCount = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        try {
          const dataUrl = await compressImage(file);
          newGroups[gIdx].cards.push(dataUrl);
          processedCount++;
        } catch (err) {
          console.error(err);
        }
      }
    }
    
    if (processedCount > 0) {
      setCardGroups(newGroups);
      showToast(`成功导入 ${processedCount} 张图片/表情包字卡！`);
    } else {
      showToast('未选择有效的图片文件');
    }
    e.target.value = ''; // reset
  };

  const handleKeepaliveIconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
          try {
              const dataUrl = await compressImage(file);
              setKeepaliveIcon(dataUrl);
              window.dispatchEvent(new CustomEvent('keepalive_icon_changed', { detail: dataUrl }));
              showToast('锁屏与灵动岛小图标已设置');
          } catch (err) {
              console.error(err);
          }
      }
    }
    e.target.value = ''; // reset
  };

  const handleKeepaliveIconClick = () => {
    if (keepaliveIcon) {
      setConfirmModal({
        title: "管理锁屏图标",
        msg: "是否清除已上传的锁屏/灵动岛封面图，恢复默认使用梦角头像作为封面？",
        onConfirm: () => {
          setKeepaliveIcon('');
          window.dispatchEvent(new CustomEvent('keepalive_icon_changed', { detail: '' }));
          showToast('已恢复为默认梦角头像');
        }
      });
    } else {
      keepaliveIconInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
          try {
              const dataUrl = await compressImage(file);
              setter(dataUrl);
          } catch (err) {
              console.error(err);
          }
      } else {
          // Fallback for non-images (like TTF fonts which are handled below but just in case)
          const reader = new FileReader();
          reader.onload = (event) => {
            setter(event.target?.result as string);
          };
          reader.readAsDataURL(file as Blob);
      }
    }
    e.target.value = ''; // reset
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void, alertMsg: string) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setter(event.target?.result as string);
        showToast(alertMsg);
      };
      reader.readAsText(e.target.files[0]);
    }
    e.target.value = '';
  }

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const file = files[0];
    if (!file) return;

    showToast('正在处理音频...');
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const audio = new Audio();
      audio.src = dataUrl;
      audio.onloadedmetadata = () => {
        const duration = Math.round(audio.duration) || 1;
        setVoiceCards(prev => {
          const newVoiceCards = [...(prev || []), {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
            name: file.name.substring(0, file.name.lastIndexOf('.')) || file.name,
            url: dataUrl,
            duration: duration
          }];
          return newVoiceCards;
        });
        showToast('语音导入成功！');
      };
      audio.onerror = () => {
        setVoiceCards(prev => {
          const newVoiceCards = [...(prev || []), {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
            name: file.name.substring(0, file.name.lastIndexOf('.')) || file.name,
            url: dataUrl,
            duration: 3
          }];
          return newVoiceCards;
        });
        showToast('语音导入成功 (默认3秒)');
      };
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset
  }

  const currentThemeConfig = colorThemes[theme];

  const clearData = () => {
    setConfirmModal({
        title: '清除数据',
        msg: '确定要清除所有本地数据并恢复默认设置吗？操作不可逆！',
        onConfirm: () => {
            window.localStorage.clear();
            window.location.reload();
        }
    });
  };

  useEffect(() => {
    let bgColor = currentThemeConfig.bg || '#F2F2F7';
    let bgImage = 'none';
    
    if (view === 'home' && wallpaper) {
      bgImage = `url(${wallpaper})`;
    } else if (view === 'chat' && chatBg) {
      bgImage = `url(${chatBg})`;
    } else if (view === 'wishlist' && wishlistBg) {
      bgImage = `url(${wishlistBg})`;
    } else if (view === 'check_in' && checkinsBg) {
      bgImage = `url(${checkinsBg})`;
    } else if (view === 'moments' && momentsBg) {
      bgImage = `url(${momentsBg})`;
    } else if (view === 'moments') {
      bgColor = momentsStyle === 'weibo' ? '#f2f2f2' : '#ffffff';
    }
    
    // For iOS settings style pages, use the iOS grey background. For other pages use theme color
    if (['appearance', 'library', 'data', 'chat_settings', 'music_manager', 'decide'].includes(view)) {
       bgColor = '#F2F2F7';
       bgImage = 'none';
    }

    // Apply directly to body and html elements to match current screen color and prevent gaps
    document.body.style.backgroundColor = bgColor;
    document.body.style.backgroundImage = bgImage !== 'none' ? bgImage : 'none';
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';

    document.documentElement.style.backgroundColor = bgColor;
    document.documentElement.style.backgroundImage = bgImage !== 'none' ? bgImage : 'none';
    document.documentElement.style.backgroundSize = 'cover';
    document.documentElement.style.backgroundPosition = 'center';
    document.documentElement.style.backgroundRepeat = 'no-repeat';
    document.documentElement.style.backgroundAttachment = 'fixed';

    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', bgColor);
  }, [
    currentThemeConfig.bg, 
    view, 
    wallpaper, 
    chatBg, 
    wishlistBg, 
    checkinsBg, 
    momentsBg, 
    momentsStyle
  ]);

  const [showAddMusicModal, setShowAddMusicModal] = useState(false);
  const [addMusicName, setAddMusicName] = useState('');
  const [addMusicArtist, setAddMusicArtist] = useState('');
  const [addMusicUrl, setAddMusicUrl] = useState('');
  const [addMusicCategory, setAddMusicCategory] = useState('');

  const allCategories = React.useMemo(() => {
      const cats = musicList.map(m => m.category || '默认');
      return Array.from(new Set(cats));
  }, [musicList]);

  const renderOverlays = () => (
    <>
        {showAddMusicModal && (
            <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center px-4 transition-opacity">
                <div className="bg-[#F2F2F7] rounded-[14px] w-full max-w-[270px] overflow-hidden flex flex-col pt-5">
                    <span className="font-semibold text-[15px] text-black mb-4 text-center">添加音乐</span>
                    <div className="px-4 flex flex-col gap-3 mb-5">
                       <input 
                         type="text" 
                         placeholder="歌曲名称" 
                         value={addMusicName}
                         onChange={e => setAddMusicName(e.target.value)}
                         className="w-full bg-white rounded-lg px-3 py-2 text-[13px] border border-black/5 focus:outline-none focus:border-black/20"
                       />
                       <input 
                         type="text" 
                         placeholder="歌手/备注" 
                         value={addMusicArtist}
                         onChange={e => setAddMusicArtist(e.target.value)}
                         className="w-full bg-white rounded-lg px-3 py-2 text-[13px] border border-black/5 focus:outline-none focus:border-black/20"
                       />
                       <textarea 
                         placeholder="直链音频链接 (必须是以 .mp3 等结尾的原始文件链接)" 
                         value={addMusicUrl}
                         onChange={e => setAddMusicUrl(e.target.value)}
                         className="w-full bg-white rounded-lg px-3 py-2 text-[13px] border border-black/5 h-[60px] resize-none focus:outline-none focus:border-black/20"
                       />
                       <input 
                         type="text" 
                         placeholder="歌单分类 (选填)" 
                         list="music-categories"
                         value={addMusicCategory}
                         onChange={e => setAddMusicCategory(e.target.value)}
                         className="w-full bg-white rounded-lg px-3 py-2 text-[13px] border border-black/5 focus:outline-none focus:border-black/20"
                       />
                       <datalist id="music-categories">
                          {allCategories.map(cat => <option key={cat} value={cat} />)}
                       </datalist>
                       <span className="text-[10px] text-black/50 px-1 -mt-1 leading-tight">注意：必须是能够直接播放的原始音频链接。如果是普通网页或网盘分享链接将无法播放。</span>
                    </div>
                    <div className="flex w-full border-t border-[#3c3c43]/20">
                        <button className="flex-1 py-3 text-[15px] text-[#007AFF] border-r border-[#3c3c43]/20 active:bg-black/5" onClick={() => setShowAddMusicModal(false)}>取消</button>
                        <button className="flex-1 py-3 text-[15px] text-[#007AFF] font-semibold active:bg-black/5" onClick={() => {
                            if (!addMusicName || !addMusicUrl) {
                                showToast('请输入完整信息');
                                return;
                            }
                            setMusicList([...musicList, {
                                id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
                                name: addMusicName,
                                artist: addMusicArtist,
                                url: addMusicUrl,
                                category: addMusicCategory || '默认'
                            }]);
                            setAddMusicName('');
                            setAddMusicArtist('');
                            setAddMusicUrl('');
                            setAddMusicCategory('');
                            setShowAddMusicModal(false);
                            showToast('添加成功');
                        }}>添加</button>
                    </div>
                </div>
            </div>
        )}
        {confirmModal && (
            <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center px-4 transition-opacity">
                <div className="bg-[#F2F2F7] rounded-[14px] w-full max-w-[270px] overflow-hidden flex flex-col pt-5 items-center">
                    <span className="font-semibold text-[15px] text-black mb-1 text-center">{confirmModal.title}</span>
                    <span className="text-[11px] text-black/70 mb-5 px-4 text-center leading-tight">{confirmModal.msg}</span>
                    <div className="flex w-full border-t border-[#3c3c43]/20">
                        <button className="flex-1 py-3 text-[15px] text-[#007AFF] border-r border-[#3c3c43]/20 active:bg-black/5" onClick={() => setConfirmModal(null)}>取消</button>
                        <button className="flex-1 py-3 text-[15px] text-[#FF3B30] font-semibold active:bg-black/5" onClick={() => {
                            confirmModal.onConfirm();
                            setConfirmModal(null);
                        }}>确定</button>
                    </div>
                </div>
            </div>
        )}
        {toastMsg && (
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[70] bg-black/70 text-white px-5 py-3 rounded-xl text-[13px] font-medium shadow-lg backdrop-blur-md">
                {toastMsg}
            </div>
        )}

        {/* Global Decide Countdown Overlay */}
        {globalDecideIsDrawing && globalDecideCountdown > 0 && (
            <motion.div 
               initial={{ opacity: 0, y: -50, x: '-50%' }}
               animate={{ opacity: 1, y: 0, x: '-50%' }}
               className="fixed top-[env(safe-area-inset-top,20px)] mt-4 left-1/2 z-[80] bg-white rounded-[20px] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.15)] flex items-center px-4 py-2 border border-black/[0.04]"
            >
               <div className="w-8 h-8 rounded-full border border-gray-100 overflow-hidden mr-3 shrink-0">
                  {chatAvatar2 ? <img src={chatAvatar2} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[#f2f2f7]" />}
               </div>
               <div className="flex flex-col pr-2">
                  <span className="text-[12px] text-[#8e8e93] font-medium leading-tight">未婚夫思考中...</span>
                  <span className="text-[15px] font-mono font-medium text-black leading-tight">
                      {Math.floor(globalDecideCountdown / 60).toString().padStart(2, '0')}:{(globalDecideCountdown % 60).toString().padStart(2, '0')}
                  </span>
               </div>
            </motion.div>
        )}

        {/* Global Decide Result Overlay */}
        {!globalDecideIsDrawing && globalDecideResult !== null && (
            <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-6 transition-colors duration-500 bg-black/40 backdrop-blur-sm">
                {globalDecideResult.tab === 'tarot' ? (
                    <motion.div 
                       initial={{ opacity: 0, scale: 0.9, y: 20 }}
                       animate={{ opacity: 1, scale: 1, y: 0 }}
                       transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                       className="flex flex-col items-center justify-center w-full relative"
                    >
                       <div className="flex flex-wrap justify-center gap-6 w-full mb-12">
                           {globalDecideResult.result.map((r, i) => (
                               <motion.div 
                                  key={i}
                                  initial={{ opacity: 0, scale: 0.5, y: 30 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  transition={{ delay: i * 0.1, type: 'spring' }}
                                  className="font-light"
                                  style={{ fontSize: '80px', color: currentThemeConfig.numColor || currentThemeConfig.textPrimary }}
                               >
                                  {r}
                               </motion.div>
                           ))}
                       </div>
                       <button 
                          onClick={() => setGlobalDecideResult(null)}
                          className="px-8 py-3 rounded-full text-[14px] font-medium active:opacity-70 transition-opacity shadow-sm"
                          style={{ backgroundColor: currentThemeConfig.textPrimary, color: currentThemeConfig.bg || '#fff' }}
                       >
                          确认
                       </button>
                    </motion.div>
                 ) : (
                     <motion.div 
                        initial={{ opacity: 0, y: 50, scale: 0.8, rotateX: -20 }}
                        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                        className="w-full max-w-[280px] bg-white rounded-[24px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center p-8 border border-black/[0.04] relative overflow-hidden"
                     >
                         <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-pink-200 via-purple-200 to-indigo-200"></div>
                         
                         <div className="text-[14px] text-[#8e8e93] mb-6 font-medium">未婚夫的答案是</div>
                         
                         <div className={`flex flex-wrap justify-center gap-3 w-full mb-8`}>
                             {globalDecideResult.result.map((r, i) => (
                                 <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ delay: i * 0.1, type: 'spring' }}
                                    className={`flex items-center justify-center font-medium text-black text-[32px]`}
                                 >
                                    {r}
                                 </motion.div>
                             ))}
                         </div>
                         
                         <button 
                            onClick={() => setGlobalDecideResult(null)}
                            className="px-6 py-2 bg-[#f2f2f7] text-[#8e8e93] rounded-full text-[13px] font-medium active:bg-[#e5e5ea]"
                         >
                            确认
                         </button>
                     </motion.div>
                 )}
            </div>
        )}
    </>
  );

  const renderContent = () => {
    if (view === 'decide') {
    return <DecideView 
      onClose={() => setView('home')} 
      themeConfig={currentThemeConfig} 
      isDeciding={globalDecideIsDrawing}
      onStartDecide={(delay, result, tab) => {
        setView('home');
        setGlobalDecideResult({ tab, result });
        if (delay === 0) {
           setGlobalDecideIsDrawing(false);
           setGlobalDecideCountdown(0);
        } else {
           setGlobalDecideCountdown(delay * 60);
           setGlobalDecideIsDrawing(true);
        }
      }}
    />;
  }

  if (view === 'data') {
    return <><DataView onClose={() => setView('home')} showToast={showToast} />{renderOverlays()}</>;
  }

  if (view === 'library') {
    return (
      <div className="absolute inset-0 bg-[#FAFAFA] flex flex-col overflow-x-hidden overflow-y-auto text-[13px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>

        
        
        {/* Header */}
        <div 
          className="w-full flex items-center justify-between px-4 pb-3 bg-[#FAFAFA]/80 sticky top-0 z-30 border-b border-[#E5E5EA] backdrop-blur-md"
          style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
        >
          <button onClick={() => setView('home')} className="text-[#333] flex items-center active:opacity-50 transition-opacity w-[60px]">
            <ChevronLeft size={24} className="-ml-1.5" />
          </button>
          
          <span className="text-[16px] font-semibold tracking-tight text-[#111]">字卡库</span>
          <div className="w-[60px]"></div>
        </div>

        {/* Categories Tabs */}
        <div className="w-full bg-[#FAFAFA]/90 sticky top-[53px] z-20 border-b border-[#F2F2F7] backdrop-blur-md">
          <div className="w-full max-w-2xl mx-auto flex px-4 space-x-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pt-2 pb-0">
             {[
               { id: 'cards', name: '主字卡' },
               { id: 'emoji', name: 'Emoji' },
               { id: 'stickers', name: '表情库' },
               { id: 'nudge', name: '拍一拍' },
               { id: 'audio', name: '语音' }
             ].map((tab, idx) => (
                <button 
                  key={`${tab.id}-${idx}`}
                  onClick={() => setReplySubTab(tab.id as any)}
                  className={`pb-3 text-[13.5px] font-semibold transition-colors relative whitespace-nowrap ${replySubTab === tab.id ? 'text-black' : 'text-[#8e8e93]'}`}
                >
                  {tab.name}
                  {replySubTab === tab.id && (
                    <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] rounded-t-full bg-black/80" />
                  )}
                </button>
             ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-12 w-full max-w-2xl mx-auto px-4 mt-4">
             <div>
               <div className="hidden">
                   <button className={`px-3 py-2 shrink-0 ${replySubTab === 'cards' ? 'border-b-2 border-[#007AFF] text-[#007AFF]' : 'text-[#8e8e93]'}`} onClick={() => setReplySubTab('cards')}>主字卡</button>
                   <button className={`px-3 py-2 shrink-0 ${replySubTab === 'emoji' ? 'border-b-2 border-[#007AFF] text-[#007AFF]' : 'text-[#8e8e93]'}`} onClick={() => setReplySubTab('emoji')}>Emoji</button>
                   <button className={`px-3 py-2 shrink-0 ${replySubTab === 'stickers' ? 'border-b-2 border-[#007AFF] text-[#007AFF]' : 'text-[#8e8e93]'}`} onClick={() => setReplySubTab('stickers')}>表情库</button>
                   <button className={`px-3 py-2 shrink-0 ${replySubTab === 'nudge' ? 'border-b-2 border-[#007AFF] text-[#007AFF]' : 'text-[#8e8e93]'}`} onClick={() => setReplySubTab('nudge')}>拍一拍</button>
                   <button className={`px-3 py-2 shrink-0 ${replySubTab === 'audio' ? 'border-b-2 border-[#007AFF] text-[#007AFF]' : 'text-[#8e8e93]'}`} onClick={() => setReplySubTab('audio')}>语音</button>
               </div>

               {replySubTab === 'cards' && (
                  <>
                    <div className="px-4 mt-3">
                      <div className="bg-[#e3e3e8] rounded-[10px] flex items-center px-3 py-1.5 border border-transparent focus-within:bg-white focus-within:border-[#c6c6c8]">
                        <Search size={16} className="text-[#8e8e93] mr-2" />
                        <input
                          type="text"
                          placeholder="搜索字卡..."
                          className="bg-transparent outline-none flex-1 text-[13px] text-[#333]"
                          value={librarySearchQuery}
                          onChange={(e) => setLibrarySearchQuery(e.target.value)}
                        />
                        {librarySearchQuery && (
                          <button onClick={() => setLibrarySearchQuery('')} className="text-[#8e8e93]">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    {!activeGroupId ? (
                        librarySearchQuery ? (
                            <div className="mt-4 px-4 space-y-2 pb-8">
                                {cardGroups.flatMap((g, gIdx) => g.cards.map((card, cIdx) => ({ group: g, gIdx, card, cIdx })))
                                    .filter(({ card }) => card.toLowerCase().includes(librarySearchQuery.toLowerCase()))
                                    .map(({ group, gIdx, card, cIdx }) => (
                                        <div key={`${gIdx}-${cIdx}`} className="flex justify-between items-center bg-white p-2.5 rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                                            <div className="flex flex-col flex-1 pb-1">
                                                <div className="text-[10px] text-gray-400 mb-1">{group.name}</div>
                                                {(card.startsWith('data:image/') || /^https?:\/\/.*\.(png|jpg|jpeg|gif|webp|svg)/i.test(card)) && (
                                                    <div className="flex items-center gap-2 flex-1 min-w-0 mb-1">
                                                        <div className="w-12 h-12 rounded-[6px] overflow-hidden bg-gray-50 border border-gray-100 shrink-0 flex items-center justify-center">
                                                            <img src={card} alt="" className="w-full h-full object-contain" />
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 font-mono truncate flex-1">图片/表情包/字卡</span>
                                                    </div>
                                                )}
                                                <textarea 
                                                    className={`text-[11px] bg-transparent outline-none flex-1 text-[#333] resize-none ${(card.startsWith('data:image/') || /^https?:\/\/.*\.(png|jpg|jpeg|gif|webp|svg)/i.test(card)) ? 'hidden' : ''}`} 
                                                    rows={card.length > 20 ? 2 : 1}
                                                    value={card} 
                                                    onChange={(e) => {
                                                        const newGroups = [...cardGroups];
                                                        newGroups[gIdx].cards[cIdx] = e.target.value;
                                                        setCardGroups(newGroups);
                                                    }} 
                                                />
                                            </div>
                                            <button onClick={() => {
                                                const newGroups = [...cardGroups];
                                                newGroups[gIdx].cards.splice(cIdx, 1);
                                                setCardGroups(newGroups);
                                            }} className="text-[#c6c6c8] active:text-[#FF3B30] ml-2 p-1 shrink-0"><X size={16}/></button>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                        <div className="mt-5 space-y-5 pb-8 font-sans">
                            <div className="flex justify-between items-center bg-white p-4.5 rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7] cursor-pointer active:bg-gray-50 transition-colors" onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = '.js,.json,text/plain';
                                input.onchange = (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                        const content = event.target?.result as string;
                                        try {
                                            let data = null;
                                            try {
                                                data = JSON.parse(content);
                                            } catch {
                                                try {
                                                    data = new Function('return ' + content)();
                                                } catch {
                                                    const match = content.match(/=([\s\S]*);?/);
                                                    if (match) data = new Function('return ' + match[1])();
                                                }
                                            }
                                            if (data) {
                                                setImportModalData({ name: file.name.replace(/\.[^/.]+$/, ""), data });
                                            }
                                        } catch (err) {
                                            showToast('解析失败');
                                        }
                                    };
                                    reader.readAsText(file);
                                };
                                input.click();
                            }}>
                                <span className="text-[13.5px] font-semibold text-black">批量导入 (来自 .js/.json 文件)</span>
                                <Download size={18} className="text-black/85" />
                            </div>
                            
                            <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7] divide-y divide-[#F2F2F7] overflow-hidden">
                                {cardGroups.filter(g => !librarySearchQuery || g.name.toLowerCase().includes(librarySearchQuery.toLowerCase()) || g.cards.some((c: string) => c.toLowerCase().includes(librarySearchQuery.toLowerCase()))).map((group, groupIdx) => (
                                    <div key={`${group.id}-${groupIdx}`} className="p-4 flex justify-between items-center cursor-pointer active:bg-[#FAFAFA] transition-colors" onClick={() => setActiveGroupId(group.id)}>
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="font-semibold text-black text-[13.5px] truncate">{group.name}</div>
                                            <div className="text-[#8e8e93] text-[12px] mt-0.5">{group.cards.length} 张字卡</div>
                                        </div>
                                        <button onClick={(e) => {
                                            e.stopPropagation();
                                            setConfirmModal({
                                                title: '删除分组',
                                                msg: '确定删除该分组吗？',
                                                onConfirm: () => {
                                                    const newGroups = [...cardGroups];
                                                    const targetIdx = newGroups.findIndex(g => g.id === group.id);
                                                    if (targetIdx > -1) {
                                                      newGroups.splice(targetIdx, 1);
                                                      setCardGroups(newGroups);
                                                    }
                                                    if (activeGroupId === group.id) setActiveGroupId(null);
                                                }
                                            });
                                        }} className="text-[#c6c6c8] p-2 hover:text-[#FF3B30] active:text-[#FF3B30]"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => {
                                const newId = Date.now().toString() + Math.random().toString(36).substring(2, 5);
                                setCardGroups([...cardGroups, { id: newId, name: '新分组', cards: [] }]);
                                setActiveGroupId(newId);
                            }} className="w-full py-4 bg-white text-black font-semibold rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7] flex items-center justify-center gap-2 active:bg-gray-50 transition-all">
                                <Plus size={18}/> 新建分组
                            </button>
                        </div>
                        )
                    ) : (
                        <div className="mt-2 pb-8">
                            <div className="flex items-center gap-2.5 mb-4 bg-white p-3.5 rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7]">
                                <button onClick={() => setActiveGroupId(null)} className="p-1 active:opacity-50 text-[#007AFF]"><ChevronLeft size={20}/></button>
                                <input 
                                    className="font-semibold text-[#000] bg-transparent outline-none border-none text-[12px] flex-1" 
                                    value={cardGroups.find(g => g.id === activeGroupId)?.name || ''} 
                                    onChange={(e) => {
                                        const newGroups = [...cardGroups];
                                        const gIdx = newGroups.findIndex(g => g.id === activeGroupId);
                                        if (gIdx > -1) {
                                            newGroups[gIdx].name = e.target.value;
                                            setCardGroups(newGroups);
                                        }
                                    }} 
                                    placeholder="分组名称"
                                />
                            </div>

                            <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7] divide-y divide-[#F2F2F7] overflow-hidden max-h-[60vh] overflow-y-auto">
                                {(cardGroups.find(g => g.id === activeGroupId)?.cards || [])
                                    .map((card, originalIdx) => ({ card, originalIdx }))
                                    .filter(({ card }) => !librarySearchQuery || card.toLowerCase().includes(librarySearchQuery.toLowerCase()))
                                    .map(({ card, originalIdx }) => (
                                    <div key={originalIdx} className="flex justify-between items-center p-3.5 bg-white">
                                        {(card.startsWith('data:image/') || /^https?:\/\/.*\.(png|jpg|jpeg|gif|webp|svg)/i.test(card)) && (
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <div className="w-12 h-12 rounded-[6px] overflow-hidden bg-gray-50 border border-gray-100 shrink-0 flex items-center justify-center">
                                                    <img src={card} alt="" className="w-full h-full object-contain" />
                                                </div>
                                                <span className="text-[10px] text-gray-400 font-mono truncate flex-1">图片/表情包/字卡</span>
                                            </div>
                                        )}
                                        <textarea 
                                            className={`text-[11px] bg-transparent outline-none flex-1 text-[#333] resize-none ${(card.startsWith('data:image/') || /^https?:\/\/.*\.(png|jpg|jpeg|gif|webp|svg)/i.test(card)) ? 'hidden' : ''}`} 
                                            rows={card.length > 20 ? 2 : 1}
                                            value={card} 
                                            onChange={(e) => {
                                                const newGroups = [...cardGroups];
                                                const gIdx = newGroups.findIndex(g => g.id === activeGroupId);
                                                if (gIdx > -1) {
                                                    newGroups[gIdx].cards[originalIdx] = e.target.value;
                                                    setCardGroups(newGroups);
                                                }
                                            }} 
                                        />
                                        <button onClick={() => {
                                            const newGroups = [...cardGroups];
                                            const gIdx = newGroups.findIndex(g => g.id === activeGroupId);
                                            if (gIdx > -1) {
                                                newGroups[gIdx].cards.splice(originalIdx, 1);
                                                setCardGroups(newGroups);
                                            }
                                        }} className="text-[#c6c6c8] active:text-[#FF3B30] ml-2 p-1 shrink-0"><X size={16}/></button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => {
                                const newGroups = [...cardGroups];
                                const gIdx = newGroups.findIndex(g => g.id === activeGroupId);
                                if (gIdx > -1) {
                                    newGroups[gIdx].cards.push('');
                                    setCardGroups(newGroups);
                                }
                            }} className="w-full mt-4 py-3.5 text-[13px] font-semibold text-[#007AFF] flex justify-center items-center gap-1.5 bg-white border border-[#F2F2F7] shadow-[0_2px_12px_rgba(0,0,0,0.03)] active:bg-gray-50 transition-all rounded-[20px]">
                                <Plus size={16}/> 添加文字字卡
                            </button>
                        </div>
                    )}
                  </>
                )}

               {replySubTab === 'emoji' && (
                 <div className="mt-4 px-4 space-y-2 pb-8">
                     <div className="bg-white rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
                       {emojis.map((item, idx) => (
                           <div key={idx} className="flex justify-between items-center p-3 border-b border-[#E5E5EA] last:border-b-0">
                                <input 
                                  className="bg-transparent outline-none flex-1 text-[13px] text-[#333]" 
                                  value={item} 
                                  onChange={(e) => {
                                     const newEmojis = [...emojis];
                                     newEmojis[idx] = e.target.value;
                                     setEmojis(newEmojis);
                                  }} 
                                />
                                <button onClick={() => {
                                    const newEmojis = [...emojis];
                                    newEmojis.splice(idx, 1);
                                    setEmojis(newEmojis);
                                }} className="text-[#c6c6c8] p-1 active:opacity-50"><X size={18}/></button>
                           </div>
                       ))}
                     </div>
                     <button onClick={() => setEmojis([...emojis, '😀'])} className="w-full py-3 bg-white text-[#007AFF] font-medium rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex items-center justify-center gap-2 mt-4 active:bg-gray-50 transition-colors"><Plus size={18}/> 添加 Emoji</button>
                 </div>
               )}

               {replySubTab === 'stickers' && (
                 <div className="mt-4 px-4 pb-8">
                      <div className="grid grid-cols-3 gap-3">
                          {stickers.map((url, idx) => (
                              <div key={idx} className="relative aspect-square bg-[#E5E5EA] rounded-[10px] overflow-hidden flex items-center justify-center group">
                                  <img src={url} className="w-full h-full object-cover" />
                                  <button onClick={() => {
                                      const newStickers = [...stickers];
                                      newStickers.splice(idx, 1);
                                      setStickers(newStickers);
                                  }} className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded-full p-1 active:opacity-50"><X size={14}/></button>
                              </div>
                          ))}
                          <div onClick={() => stickerInputRef.current?.click()} className="aspect-square bg-white rounded-[10px] flex items-center justify-center cursor-pointer border border-dashed border-[#c6c6c8] shadow-[0_1px_2px_rgba(0,0,0,0.05)] active:bg-gray-50 transition-colors">
                               <Plus size={32} className="text-[#c6c6c8]"/>
                          </div>
                      </div>
                      <input type="file" ref={stickerInputRef} className="hidden" accept="image/*" multiple onChange={(e) => {
                          const files = e.target.files;
                          if (!files) return;
                          const newStickers = [...stickers];
                          Array.from(files).forEach((file: any) => {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                  newStickers.push(event.target?.result as string);
                                  setStickers([...newStickers]);
                              };
                              reader.readAsDataURL(file as Blob);
                          });
                          e.target.value = ''; // reset
                      }} />
                 </div>
               )}
                {replySubTab === 'audio' && (
                  <div className="mt-4 px-4 pb-8 space-y-3">
                       <div className="bg-white rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
                        {(voiceCards || []).length === 0 ? (
                            <div className="text-gray-400 text-center py-8 text-[12px] leading-relaxed">
                              还没有语音字卡，点击下方按钮上传音频文件<br/>
                              (支持 .mp3 / .wav / .m4a 格式)
                            </div>
                        ) : (
                            (voiceCards || []).map((voice, idx) => (
                                <div key={voice.id} className="flex justify-between items-center p-3 border-b border-[#E5E5EA] last:border-b-0">
                                     <div className="flex flex-col flex-1 min-w-0 pr-2">
                                         <div className="text-[13px] text-[#333] font-medium truncate">{voice.name}</div>
                                         <div className="text-[10px] text-gray-400 mt-0.5">时长: {voice.duration}s</div>
                                     </div>
                                     <div className="flex items-center space-x-2 shrink-0">
                                         <button 
                                             onClick={() => {
                                                 const audio = new Audio(voice.url);
                                                 audio.play().catch(e => console.error(e));
                                             }} 
                                             className="text-[#007AFF] text-[12px] px-2.5 py-1 bg-[#007AFF]/10 active:opacity-50 rounded-full font-medium"
                                         >
                                             试听
                                         </button>
                                         <button 
                                             onClick={() => {
                                                 const newVoiceCards = [...voiceCards];
                                                 newVoiceCards.splice(idx, 1);
                                                 setVoiceCards(newVoiceCards);
                                             }} 
                                             className="text-[#8e8e93] hover:text-red-500 p-1 active:opacity-50"
                                         >
                                             <X size={18}/>
                                         </button>
                                     </div>
                                </div>
                            ))
                        )}
                       </div>
                       <button 
                         onClick={() => audioInputRef.current?.click()} 
                         className="w-full py-3 bg-white text-[#007AFF] font-medium rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex items-center justify-center gap-2 mt-4 active:bg-gray-50 transition-colors"
                       >
                         <Plus size={18}/> 上传语音字卡
                       </button>
                       <input 
                         type="file" 
                         ref={audioInputRef} 
                         className="hidden" 
                         accept="audio/*" 
                         onChange={handleAudioUpload} 
                       />
                  </div>
                )}

               {replySubTab === 'nudge' && (
                 <div className="mt-4 px-4 space-y-2 pb-8">
                     <div className="bg-white rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
                       {nudges.map((item, idx) => (
                           <div key={idx} className="flex justify-between items-center p-3 border-b border-[#E5E5EA] last:border-b-0">
                                <input 
                                  className="bg-transparent outline-none flex-1 text-[13px] text-[#333]" 
                                  value={item} 
                                  onChange={(e) => {
                                     const newNudges = [...nudges];
                                     newNudges[idx] = e.target.value;
                                     setNudges(newNudges);
                                  }} 
                                />
                                <button onClick={() => {
                                    const newNudges = [...nudges];
                                    newNudges.splice(idx, 1);
                                    setNudges(newNudges);
                                }} className="text-[#c6c6c8] p-1 active:opacity-50"><X size={18}/></button>
                           </div>
                       ))}
                     </div>
                     <button onClick={() => setNudges([...nudges, '拍了拍我的...'])} className="w-full py-3 bg-white text-[#007AFF] font-medium rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex items-center justify-center gap-2 mt-4 active:bg-gray-50 transition-colors"><Plus size={18}/> 添加拍一拍</button>
                 </div>
               )}
             </div>
        </div>

        {importModalData && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
                <div className="bg-white rounded-[14px] w-full max-w-sm overflow-hidden flex flex-col">
                   <div className="p-4 border-b border-[#e5e5ea] font-medium text-center text-[13px] text-black">
                       选择导入位置
                   </div>
                   <div className="max-h-[300px] overflow-y-auto">
                       <div className="p-3 border-b border-[#e5e5ea] flex justify-between items-center cursor-pointer active:bg-gray-50" onClick={() => {
                           let newGroups = [...cardGroups];
                           let cardsToAdd: string[] = [];
                           if (Array.isArray(importModalData.data)) {
                               cardsToAdd = importModalData.data.filter(d => typeof d === 'string');
                               newGroups.push({ id: Date.now().toString() + Math.random().toString(36).substring(2, 5), name: importModalData.name, cards: cardsToAdd });
                           } else if (importModalData.data && typeof importModalData.data === 'object') {
                               const newG = Object.keys(importModalData.data).map((k, i) => ({
                                   id: Date.now().toString() + Math.random().toString(36).substring(2, 5) + i,
                                   name: k,
                                   cards: Array.isArray(importModalData.data[k]) ? importModalData.data[k] : []
                               }));
                               newGroups.push(...newG);
                           }
                           setCardGroups(newGroups);
                           setActiveGroupId(null);
                           setImportModalData(null);
                           showToast('导入成功！');
                       }}>
                           <span className="text-[#007AFF] text-[12px] font-medium">新建分组</span>
                       </div>
                       {cardGroups.map((group, groupIdx) => (
                           <div key={`${group.id}-${groupIdx}`} className="p-3 border-b border-[#e5e5ea] last:border-b-0 flex justify-between items-center cursor-pointer active:bg-gray-50" onClick={() => {
                               let newGroups = [...cardGroups];
                               const targetIdx = newGroups.findIndex(g => g.id === group.id);
                               if (targetIdx > -1) {
                                   let cardsToAdd: string[] = [];
                                   if (Array.isArray(importModalData.data)) {
                                       cardsToAdd = importModalData.data.filter(d => typeof d === 'string');
                                   } else if (importModalData.data && typeof importModalData.data === 'object') {
                                       Object.keys(importModalData.data).forEach(k => {
                                           if (Array.isArray(importModalData.data[k])) {
                                               cardsToAdd.push(...importModalData.data[k]);
                                           }
                                       });
                                   }
                                   newGroups[targetIdx].cards = [...newGroups[targetIdx].cards, ...cardsToAdd];
                                   setCardGroups(newGroups);
                                   setActiveGroupId(group.id);
                                   setImportModalData(null);
                                   showToast('导入成功！');
                               }
                           }}>
                               <span className="text-[12px] text-[#333]">导入到: {group.name}</span>
                           </div>
                       ))}
                   </div>
                   <button className="p-3 text-[#FF3B30] font-medium text-[12px] border-t border-[#e5e5ea] active:bg-gray-50" onClick={() => setImportModalData(null)}>取消</button>
                </div>
            </div>
        )}

        {renderOverlays()}
      </div>
    );
  }

  if (view === 'music_manager') {
    return (
      <div className="absolute inset-0 flex flex-col overflow-x-hidden overflow-y-auto text-[14px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', backgroundColor: '#F2F2F7' }}>
        <div 
          className="w-full flex items-center justify-between px-3 pb-3 bg-white/30 sticky top-0 z-10 border-b border-[#c6c6c8]/20 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
          style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
        >
          <button onClick={() => setView('home')} className="text-[#007AFF] text-[15px] flex items-center active:opacity-50 transition-opacity">
            <ChevronLeft size={24} className="-ml-1.5" />返回
          </button>
          <span className="text-[15px] font-semibold text-black">音乐管理</span>
          <button onClick={() => setShowAddMusicModal(true)} className="text-[#007AFF] text-[15px] active:opacity-50 transition-opacity pr-2">
            添加
          </button>
        </div>

        <div className="px-4 py-4 max-w-2xl mx-auto w-full">
          <div className="mb-6">
             <div className="text-[12px] text-[#6d6d72] ml-4 mb-2 uppercase tracking-wide">当前播放歌单</div>
             <div className="bg-white rounded-[10px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)] px-3 relative">
                <select 
                    value={activePlaylist}
                    onChange={(e) => {
                        setActivePlaylist(e.target.value);
                        setCurrentMusicIndex(0);
                    }}
                    className="w-full py-3 bg-transparent text-[15px] focus:outline-none appearance-none font-medium"
                >
                    <option value="全部">全部歌曲 ({musicList.length})</option>
                    {allCategories.map(cat => (
                        <option key={cat} value={cat}>{cat} ({musicList.filter(m => (m.category || '默认') === cat).length})</option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronLeft size={16} className="-rotate-90" />
                </div>
             </div>
          </div>

          <div className="text-[12px] text-[#6d6d72] ml-4 mb-2 uppercase tracking-wide">歌曲列表</div>
          <div className="bg-white rounded-[10px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            {playQueue.length === 0 ? (
              <div className="p-8 text-center text-[#8e8e93] text-[13px]">
                暂无音乐，点击右上角添加
              </div>
            ) : (
              playQueue.map((music, idx) => (
                <div key={`${music.id}-${idx}`} className={`flex items-center justify-between p-3 ${idx !== playQueue.length - 1 ? 'border-b border-[#c6c6c8]/30' : ''}`}>
                   <div className="flex flex-col flex-1 overflow-hidden pr-4">
                      <span className="font-medium text-black truncate">{music.name}</span>
                      <span className="text-[12px] text-[#8e8e93] truncate">
                          {music.artist} 
                          {activePlaylist === '全部' && <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 ml-2 rounded-sm text-[10px]">类别: {music.category || '默认'}</span>}
                      </span>
                   </div>
                   <button onClick={() => {
                       const newList = musicList.filter(m => m.id !== music.id);
                       setMusicList(newList);
                   }} className="p-2 text-red-500 rounded-lg active:bg-red-50 transition-colors">
                       <Trash2 size={18} />
                   </button>
                </div>
              ))
            )}
          </div>
        </div>
        {renderOverlays()}
      </div>
    );
  }

  if (view === 'appearance') {
    return (
      <div className="absolute inset-0 bg-[#FAFAFA] flex flex-col overflow-x-hidden overflow-y-auto text-[13px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
        
        {/* Header */}
        <div 
          className="w-full flex items-center justify-between px-4 pb-3 bg-[#FAFAFA]/80 sticky top-0 z-30 border-b border-[#E5E5EA] backdrop-blur-md"
          style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
        >
          <button onClick={() => setView('home')} className="text-[#333] flex items-center active:opacity-50 transition-opacity w-[60px]">
            <ChevronLeft size={24} className="-ml-1.5" />
          </button>
          <span className="text-[16px] font-semibold tracking-tight text-[#111]">外观设置</span>
          <div className="w-[60px]"></div>
        </div>

        {/* Categories Tabs */}
        <div 
          className="w-full bg-[#FAFAFA]/90 sticky top-[53px] z-20 border-b border-[#F2F2F7] backdrop-blur-md"
        >
          <div className="w-full max-w-2xl mx-auto flex px-4 space-x-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pt-2 pb-0">
             {[
               { id: 'global', name: '全局设置' },
               { id: 'chat', name: '聊天设置' },
               { id: 'component', name: '组件与其它美化' },
               { id: 'wallpaper', name: '壁纸上传' }
             ].map((tab, idx) => (
                <button 
                  key={`${tab.id}-${idx}`}
                  onClick={() => setAppearanceTab(tab.id as any)}
                  className={`pb-3 text-[13.5px] font-semibold transition-colors relative whitespace-nowrap ${appearanceTab === tab.id ? 'text-black' : 'text-[#8e8e93]'}`}
                >
                  {tab.name}
                  {appearanceTab === tab.id && (
                    <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] rounded-t-full" style={{ backgroundColor: currentThemeConfig.textPrimary }} />
                  )}
                </button>
             ))}
          </div>
        </div>

        <div className="w-full max-w-2xl mx-auto px-4 pb-20 pt-6 space-y-8">
           {appearanceTab === 'global' && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div>
                   <div className="text-[12px] font-medium text-[#8E8E93] mb-3 px-1 tracking-wide uppercase">基本信息</div>
                   <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7]">
                      <SettingItem icon={Type} label="我方全局昵称" value={myNickname} onChange={setMyNickname} />
                      <SettingItem icon={Type} label="梦角全局昵称" value={mjNickname} onChange={setMjNickname} hideBorder={true} />
                   </div>
                </div>
                <div>
                   <div className="text-[12px] font-medium text-[#8E8E93] mb-3 px-1 tracking-wide uppercase">主题配色</div>
                   <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7]">
                      <SettingItem icon={Palette} label="暖冬麦色" value={theme === 'warm' ? '当前' : ''} onClick={() => setTheme('warm')} />
                      <SettingItem icon={Palette} label="薄荷微风" value={theme === 'mint' ? '当前' : ''} onClick={() => setTheme('mint')} />
                      <SettingItem icon={Palette} label="春日落樱" value={theme === 'sakura' ? '当前' : ''} onClick={() => setTheme('sakura')} />
                      <SettingItem icon={Palette} label="宁静海蓝" value={theme === 'blue' ? '当前' : ''} onClick={() => setTheme('blue')} />
                      <SettingItem icon={Palette} label="梦幻香芋" value={theme === 'purple' ? '当前' : ''} onClick={() => setTheme('purple')} />
                      <SettingItem icon={Palette} label="枫叶绯红" value={(theme as string) === 'red' ? '当前' : ''} onClick={() => setTheme('red' as any)} hideBorder={true}/>
                   </div>
                </div>
             </motion.div>
           )}

           {appearanceTab === 'chat' && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div>
                   <div className="text-[12px] font-medium text-[#8E8E93] mb-3 px-1 tracking-wide uppercase">气泡样式</div>
                   <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7] divide-y divide-[#F2F2F7]">
                      <div className="px-5 py-4.5 flex items-center justify-between">
                         <span className="text-[15px] font-medium text-[#333] flex items-center"><MessageCircle size={18} className="mr-3 text-[#555]" /> 气泡样式</span>
                         <div className="flex bg-[#E5E5EA]/60 p-0.5 rounded-[8px]">
                            <button 
                               className={`px-4 py-1 text-[12px] font-semibold rounded-[6px] transition-all ${chatBubbleStyle === 'glass' ? 'bg-white shadow-sm text-black' : 'text-[#8e8e93]'}`}
                               onClick={() => setChatBubbleStyle('glass')}
                            >液态玻璃</button>
                            <button 
                               className={`px-4 py-1 text-[12px] font-semibold rounded-[6px] transition-all ${chatBubbleStyle === 'system' ? 'bg-white shadow-sm text-black' : 'text-[#8e8e93]'}`}
                               onClick={() => setChatBubbleStyle('system')}
                            >系统气泡</button>
                         </div>
                      </div>
                      <div className="px-1.5 py-1 bg-white">
                         <SettingItem icon={Palette} label="我方气泡及已读颜色" value={chatBubbleColor} onChange={setChatBubbleColor} isColor={true} hideBorder={true} />
                      </div>
                   </div>
                </div>
                <div>
                   <div className="text-[12px] font-medium text-[#8E8E93] mb-3 px-1 tracking-wide uppercase">聊天资源</div>
                   <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7]">
                      <SettingItem icon={ImageIcon} label="聊天壁纸" value={chatBg ? '已上传' : '未设置'} onClick={() => chatBgInputRef.current?.click()} />
                      <SettingItem icon={Users} label="我方聊天头像" value={chatAvatar1 ? '已上传' : '未设置'} onClick={() => chatAvatar1InputRef.current?.click()} />
                      <SettingItem icon={Users} label="对方聊天头像" value={chatAvatar2 ? '已上传' : '未设置'} onClick={() => chatAvatar2InputRef.current?.click()} hideBorder={true} />
                   </div>
                </div>
             </motion.div>
           )}

           {appearanceTab === 'component' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                 <div>
                    <div className="text-[12px] font-medium text-[#8E8E93] mb-3 px-1 tracking-wide uppercase">主页顶部卡片</div>
                    <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7]">
                       <SettingItem icon={ImageIcon} label="顶部卡片图" value={profileBg ? '已上传' : '未设置'} onClick={() => profileBgInputRef.current?.click()} />
                       <SettingItem icon={User} label="顶部头像 1" value={avatar1 ? '已上传' : '未设置'} onClick={() => avatar1InputRef.current?.click()} />
                       <SettingItem icon={User} label="顶部头像 2" value={avatar2 ? '已上传' : '未设置'} onClick={() => avatar2InputRef.current?.click()} />
                       <SettingItem icon={Type} label="顶部昵称 1" value={name1} onChange={setName1} />
                       <SettingItem icon={Type} label="顶部昵称 2" value={name2} onChange={setName2} />
                       <SettingItem icon={MessageCircle} label="顶部宣言" value={motto} onChange={setMotto} isTextarea={true} />
                       <SettingItem icon={Type} label="底部小字" value={subtitle} onChange={setSubtitle} hideBorder={true} />
                    </div>
                 </div>

                 <div>
                    <div className="text-[12px] font-medium text-[#8E8E93] mb-3 px-1 tracking-wide uppercase">保活与锁屏/灵动岛设置</div>
                    <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7]">
                       <SettingItem 
                           icon={ImageIcon} 
                           label="锁屏/灵动岛封面小图标" 
                           value={keepaliveIcon ? '已自定' : '未设置 (默认使用梦角头像)'} 
                           onClick={handleKeepaliveIconClick} 
                           hideBorder={true}
                       />
                    </div>
                 </div>

                 <div>
                    <div className="text-[12px] font-medium text-[#8E8E93] mb-3 px-1 tracking-wide uppercase">界面切换</div>
                    <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7] px-5 py-4.5 flex items-center justify-between">
                       <span className="text-[15px] font-medium text-[#333]">朋友圈样式</span>
                       <div className="flex bg-[#E5E5EA]/60 p-0.5 rounded-[8px]">
                          <button 
                             className={`px-4 py-1 text-[12px] font-semibold rounded-[6px] transition-all ${momentsStyle === 'wechat' ? 'bg-white shadow-sm text-black' : 'text-[#8e8e93]'}`}
                             onClick={() => setMomentsStyle('wechat')}
                          >微信</button>
                          <button 
                             className={`px-4 py-1 text-[12px] font-semibold rounded-[6px] transition-all ${momentsStyle === 'weibo' ? 'bg-white shadow-sm text-black' : 'text-[#8e8e93]'}`}
                             onClick={() => setMomentsStyle('weibo')}
                          >微博</button>
                       </div>
                    </div>
                 </div>

                 <div>
                    <div className="text-[12px] font-medium text-[#8E8E93] mb-3 px-1 tracking-wide uppercase">透明度调节</div>
                    <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7] p-5 space-y-6">
                        <div>
                            <div className="flex justify-between text-[14px] text-[#333] mb-3">
                                <span className="font-semibold">主页图标背景</span>
                                <span className="font-mono font-bold text-[14px]" style={{ color: currentThemeConfig.textPrimary }}>{appOpacity}%</span>
                            </div>
                            <input 
                                type="range" min="0" max="100" value={appOpacity} onChange={e => setAppOpacity(parseInt(e.target.value))} 
                                className="w-full h-1.5 bg-[#e5e5ea] rounded-lg appearance-none cursor-pointer" 
                                style={{
                                    background: `linear-gradient(to right, ${currentThemeConfig.textPrimary} 0%, ${currentThemeConfig.textPrimary} ${appOpacity}%, #e5e5ea ${appOpacity}%, #e5e5ea 100%)`
                                }}
                            />
                        </div>
                        <div>
                            <div className="flex justify-between text-[14px] text-[#333] mb-3">
                                <span className="font-semibold">书影音卡片背景</span>
                                <span className="font-mono font-bold text-[14px]" style={{ color: currentThemeConfig.textPrimary }}>{wishlistCardOpacity}%</span>
                            </div>
                            <input 
                                type="range" min="0" max="100" value={wishlistCardOpacity} onChange={e => setWishlistCardOpacity(parseInt(e.target.value))} 
                                className="w-full h-1.5 bg-[#e5e5ea] rounded-lg appearance-none cursor-pointer"
                                style={{
                                    background: `linear-gradient(to right, ${currentThemeConfig.textPrimary} 0%, ${currentThemeConfig.textPrimary} ${wishlistCardOpacity}%, #e5e5ea ${wishlistCardOpacity}%, #e5e5ea 100%)`
                                }}
                            />
                        </div>
                    </div>
                 </div>

                 <div>
                    <div className="text-[12px] font-medium text-[#8E8E93] mb-3 px-1 tracking-wide uppercase">进阶设置 (高阶玩家专用)</div>
                    <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7]">
                       <SettingItem icon={Droplet} label="聊天气泡 CSS" value={chatCss ? '已上传' : '未设置'} onClick={() => cssInputRef.current?.click()} />
                       <SettingItem icon={Type} label="聊天字体 TTF" value={chatFont ? '已上传' : '未设置'} onClick={() => fontInputRef.current?.click()} hideBorder={true}/>
                    </div>
                 </div>
              </motion.div>
            )}

            {appearanceTab === 'wallpaper' && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div>
                   <div className="text-[12px] font-medium text-[#8E8E93] mb-3 px-1 tracking-wide uppercase">各界面壁纸</div>
                   <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7]">
                      <SettingItem icon={ImageIcon} label="主界面壁纸" value={wallpaper ? '已上传' : '未设置'} onClick={() => wallpaperInputRef.current?.click()} />
                      <SettingItem icon={ImageIcon} label="朋友圈背景图" value={momentsBg ? '已上传' : '未设置'} onClick={() => momentsBgInputRef.current?.click()} />
                      <SettingItem icon={ImageIcon} label="查岗背景图" value={checkinsBg ? '已上传' : '未设置'} onClick={() => checkinsBgInputRef.current?.click()} />
                      <SettingItem icon={ImageIcon} label="书影音背景图" value={wishlistBg ? '已上传' : '未设置'} onClick={() => wishlistBgInputRef.current?.click()} hideBorder={true}/>
                   </div>
                </div>
             </motion.div>
           )}

           {false && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div>
                   <div className="text-[12px] font-medium text-[#8E8E93] mb-3 px-1 tracking-wide uppercase">界面切换</div>
                   <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7] px-5 py-4.5 flex items-center justify-between">
                      <span className="text-[15px] font-medium text-[#333]">朋友圈样式</span>
                      <div className="flex bg-[#E5E5EA]/60 p-0.5 rounded-[8px]">
                         <button 
                            className={`px-4 py-1 text-[12px] font-semibold rounded-[6px] transition-all ${momentsStyle === 'wechat' ? 'bg-white shadow-sm text-black' : 'text-[#8e8e93]'}`}
                            onClick={() => setMomentsStyle('wechat')}
                         >微信</button>
                         <button 
                            className={`px-4 py-1 text-[12px] font-semibold rounded-[6px] transition-all ${momentsStyle === 'weibo' ? 'bg-white shadow-sm text-black' : 'text-[#8e8e93]'}`}
                            onClick={() => setMomentsStyle('weibo')}
                         >微博</button>
                      </div>
                   </div>
                </div>

                <div>
                   <div className="text-[12px] font-medium text-[#8E8E93] mb-3 px-1 tracking-wide uppercase">透明度调节</div>
                   <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7] p-5 space-y-6">
                       <div>
                           <div className="flex justify-between text-[14px] text-[#333] mb-3">
                               <span className="font-semibold">主页图标背景</span>
                               <span className="font-mono font-bold text-[14px]" style={{ color: currentThemeConfig.textPrimary }}>{appOpacity}%</span>
                           </div>
                           <input 
                               type="range" min="0" max="100" value={appOpacity} onChange={e => setAppOpacity(parseInt(e.target.value))} 
                               className="w-full h-1.5 bg-[#e5e5ea] rounded-lg appearance-none cursor-pointer" 
                               style={{
                                   background: `linear-gradient(to right, ${currentThemeConfig.textPrimary} 0%, ${currentThemeConfig.textPrimary} ${appOpacity}%, #e5e5ea ${appOpacity}%, #e5e5ea 100%)`
                               }}
                           />
                       </div>
                       <div>
                           <div className="flex justify-between text-[14px] text-[#333] mb-3">
                               <span className="font-semibold">书影音卡片背景</span>
                               <span className="font-mono font-bold text-[14px]" style={{ color: currentThemeConfig.textPrimary }}>{wishlistCardOpacity}%</span>
                           </div>
                           <input 
                               type="range" min="0" max="100" value={wishlistCardOpacity} onChange={e => setWishlistCardOpacity(parseInt(e.target.value))} 
                               className="w-full h-1.5 bg-[#e5e5ea] rounded-lg appearance-none cursor-pointer"
                               style={{
                                   background: `linear-gradient(to right, ${currentThemeConfig.textPrimary} 0%, ${currentThemeConfig.textPrimary} ${wishlistCardOpacity}%, #e5e5ea ${wishlistCardOpacity}%, #e5e5ea 100%)`
                               }}
                           />
                       </div>
                   </div>
                </div>

                <div>
                   <div className="text-[12px] font-medium text-[#8E8E93] mb-3 px-1 tracking-wide uppercase">保活与锁屏/灵动岛设置</div>
                   <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7]">
                      <SettingItem 
                          icon={ImageIcon} 
                          label="锁屏/灵动岛封面小图标" 
                          value={keepaliveIcon ? '已自定' : '未设置 (默认使用梦角头像)'} 
                          onClick={handleKeepaliveIconClick} 
                          hideBorder={true}
                      />
                   </div>
                </div>

                <div>
                   <div className="text-[12px] font-medium text-[#8E8E93] mb-3 px-1 tracking-wide uppercase">进阶设置 (高阶玩家专用)</div>
                   <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7]">
                      <SettingItem icon={Droplet} label="聊天气泡 CSS" value={chatCss ? '已上传' : '未设置'} onClick={() => cssInputRef.current?.click()} />
                      <SettingItem icon={Type} label="聊天字体 TTF" value={chatFont ? '已上传' : '未设置'} onClick={() => fontInputRef.current?.click()} hideBorder={true}/>
                   </div>
                </div>
             </motion.div>
           )}
        </div>

        {/* Hidden inputs */}
        <input type="file" ref={chatBgInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setChatBg)} />
        <input type="file" ref={wallpaperInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setWallpaper)} />
        <input type="file" ref={profileBgInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setProfileBg)} />
        <input type="file" ref={avatar1InputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setAvatar1)} />
        <input type="file" ref={avatar2InputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setAvatar2)} />
        <input type="file" ref={momentsBgInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setMomentsBg)} />
        <input type="file" ref={wishlistBgInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setWishlistBg)} />
        <input type="file" ref={checkinsBgInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setCheckinsBg)} />
        <input type="file" ref={keepaliveIconInputRef} className="hidden" accept="image/*" onChange={handleKeepaliveIconChange} />
        
        <input type="file" ref={chatAvatar1InputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setChatAvatar1)} />
        <input type="file" ref={chatAvatar2InputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setChatAvatar2)} />
        
        <input type="file" ref={cssInputRef} className="hidden" accept=".css" onChange={(e) => handleTextChange(e, setChatCss, 'CSS已加载 (在主页面和聊天中生效)')} />
        <input type="file" ref={fontInputRef} className="hidden" accept=".ttf,.otf,.woff,.woff2" onChange={(e) => handleFileChange(e, setChatFont)} />
        {renderOverlays()}
      </div>
    );
  }



  if (view === 'chat_settings') {
    return <><ChatSettingsView onClose={() => setView('home')} themeConfig={currentThemeConfig} /><VideoCallOverlay /></>;
  }

  if (view === 'moments') {
    return <><MomentsView onClose={() => setView('home')} themeConfig={currentThemeConfig} cardGroups={cardGroups} avatar1={chatAvatar1 || avatar1} avatar2={chatAvatar2 || avatar2} name1={myNickname} name2={mjNickname} bgImage={momentsBg} viewStyle={momentsStyle} /><VideoCallOverlay /></>;
  }

  if (view === 'wishlist') {
    return <><WishlistView onClose={() => setView('home')} themeConfig={currentThemeConfig} cardGroups={cardGroups} myNickname={myNickname} mjNickname={mjNickname} wishlistCardOpacity={wishlistCardOpacity} /><VideoCallOverlay /></>;
  }

  if (view === 'check_in') {
    return <><CheckInsView onClose={() => setView('home')} themeConfig={currentThemeConfig} checkinsBg={checkinsBg} /><VideoCallOverlay /></>;
  }

  if (view === 'accounting') {
    return <><AccountingView onClose={() => setView('home')} themeConfig={currentThemeConfig} name1={myNickname} name2={mjNickname} avatar2={chatAvatar2 || avatar2} cardGroups={cardGroups} /><VideoCallOverlay /></>;
  }

  if (view === 'todo') {
    return <><TodoView onClose={() => setView('home')} themeConfig={currentThemeConfig} avatar2={chatAvatar2 || avatar2} name2={mjNickname} cardGroups={cardGroups} /><VideoCallOverlay /></>;
  }

  if (view === 'mailbox') {
    return <><MailboxView onClose={() => setView('home')} themeConfig={currentThemeConfig} cardGroups={cardGroups} /><VideoCallOverlay /></>;
  }

    if (view === 'home') {
      return (
        <div 
          className="absolute inset-0 text-[#333] font-sans flex flex-col items-center overflow-x-hidden overflow-y-auto selection:bg-[#DCD6CE]/50 transition-colors duration-500"
          style={{
            color: currentThemeConfig.textPrimary
          }}
        >
          <VideoCallOverlay />
          {chatCss && <style dangerouslySetInnerHTML={{ __html: chatCss }} />}
          {chatFont && <style dangerouslySetInnerHTML={{ __html: `@font-face { font-family: 'CustomChatFont'; src: url('${chatFont}'); } * { font-family: 'CustomChatFont', sans-serif !important; }`}} />}

          <div 
            className="w-full max-w-[420px] mx-auto flex flex-col justify-start flex-1 gap-3 px-4 shrink-0 relative"
            style={{
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
              paddingTop: 'max(12px, env(safe-area-inset-top))'
            }}
          >
        
        {/* Profile Card */}
        <motion.div 
          className="border border-white/60 rounded-[32px] flex flex-col shadow-sm shrink-0 transition-colors duration-500 overflow-hidden w-full mt-2 relative"
          style={{ backgroundColor: currentThemeConfig.cardBg || '#ffffff' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Top Image Part */}
          <div 
            className="absolute top-0 left-0 w-full h-[60%] bg-cover bg-center shrink-0"
            style={{ 
              backgroundImage: profileBg ? `url(${profileBg})` : 'none',
              backgroundColor: currentThemeConfig.bg || '#EFEFEF'
            }}
          />
          
          <div className="w-full h-[130px] shrink-0 pointer-events-none" />

          {/* Bottom Frosted Container */}
          <div 
            className="w-full relative z-10 pt-[42px] pb-6 px-4 flex flex-col items-center backdrop-blur-xl rounded-t-[32px] border-t border-white/40 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
            style={{ 
               backgroundColor: currentThemeConfig.cardBg ? `${currentThemeConfig.cardBg}E6` : 'rgba(255,255,255,0.85)'
            }}
          >
            {/* Avatars */}
            <div className="absolute -top-[36px] flex justify-center items-center w-full">
              <div className="relative flex items-center justify-center">
                <div 
                  className="w-[66px] h-[66px] rounded-full border-[3px] border-white overflow-hidden flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-transform hover:scale-105 cursor-pointer z-10 -mr-2 sm:-mr-4 bg-white"
                  style={{ color: currentThemeConfig.textSecondary }}
                  onClick={() => avatar1InputRef.current?.click()}
                >
                  {avatar1 ? <img src={avatar1} className="w-full h-full object-cover" /> : <Cat size={24} strokeWidth={1.5} />}
                </div>
                <div 
                  className="w-[66px] h-[66px] rounded-full border-[3px] border-white overflow-hidden flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-transform hover:scale-105 cursor-pointer z-0 bg-white"
                  style={{ color: currentThemeConfig.textSecondary }}
                  onClick={() => avatar2InputRef.current?.click()}
                >
                   {avatar2 ? <img src={avatar2} className="w-full h-full object-cover" /> : <Cat size={24} strokeWidth={1.5} />}
                </div>
              </div>
            </div>
            
            {/* Names */}
            <div className="flex items-center justify-center gap-[6px] mb-2 mt-1">
              <h1 className="text-[17px] sm:text-[18px] font-bold tracking-tight text-[#111] leading-none whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">{name1}</h1>
              <span className="text-[13px] text-[#555] opacity-80 shrink-0">&</span>
              <h1 className="text-[17px] sm:text-[18px] font-bold tracking-tight text-[#111] leading-none whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">{name2}</h1>
            </div>
            
            {/* Dark text block */}
            <p className="text-[13px] font-medium leading-relaxed text-center whitespace-pre-line px-2 max-w-[95%] mx-auto text-[#333] tracking-widest mb-3 mt-1 opacity-90">
               {motto}
            </p>
            
            {/* Light text block */}
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#888] font-semibold opacity-70">
               {subtitle}
            </p>
          </div>
        </motion.div>

        {/* Grouped Bottom Elements */}
        <div className="flex flex-col w-full shrink-0 gap-3">
          {/* Widgets Row */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
          {/* Music Widget */}
          <motion.div 
            className="backdrop-blur-xl border border-white/60 rounded-[24px] p-4 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.06)] flex flex-col transition-colors duration-500 relative -mt-[1px]"
            style={{ backgroundColor: currentThemeConfig.cardBg }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex justify-between items-center mb-2">
               <div className="text-[10px] flex items-center gap-1" style={{color: currentThemeConfig.textSecondary}}>
                 {playQueue.length > 0 ? (isMusicPlaying ? '播放中' : '已暂停') : '未添加音乐'}
                 {activePlaylist !== '全部' && <span className="bg-black/5 px-1.5 py-0.5 rounded-sm">{activePlaylist}</span>}
               </div>
               <button onClick={() => setView('music_manager')} className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all">
                  <ListMusic size={12} style={{color: currentThemeConfig.textSecondary}} />
               </button>
            </div>
            <div className="font-medium text-[12px] mb-0.5 truncate text-[#333]" style={{color: currentThemeConfig.textPrimary}}>
              {playQueue.length > 0 ? playQueue[currentMusicIndex >= playQueue.length ? 0 : currentMusicIndex].name : '无音乐'}
            </div>
            <div className="text-[10px] mb-3 truncate" style={{color: currentThemeConfig.textSecondary}}>
              {playQueue.length > 0 ? playQueue[currentMusicIndex >= playQueue.length ? 0 : currentMusicIndex].artist : 'No Artist'}
            </div>
            
            <div className="w-full h-[3px] bg-black/5 rounded-full mb-4 relative mt-auto overflow-hidden">
              <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-300" style={{backgroundColor: currentThemeConfig.textSecondary, width: `${audioProgress * 100}%`}}></div>
            </div>
            
            <div className="flex justify-between items-center px-1">
              <button onClick={prevMusic} className="w-7 h-7 rounded-full bg-black/[0.03] flex items-center justify-center transition-colors hover:bg-black/[0.06] active:scale-95" style={{color: currentThemeConfig.textSecondary}}>
                 <SkipBack size={12} fill="currentColor" />
              </button>
              <button onClick={toggleMusicPlay} className="w-8 h-8 rounded-full bg-black/[0.04] flex items-center justify-center transition-colors hover:bg-black/[0.07] active:scale-95" style={{color: currentThemeConfig.textSecondary}}>
                 {isMusicPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
              </button>
              <button onClick={nextMusic} className="w-7 h-7 rounded-full bg-black/[0.03] flex items-center justify-center transition-colors hover:bg-black/[0.06] active:scale-95" style={{color: currentThemeConfig.textSecondary}}>
                 <SkipForward size={12} fill="currentColor" />
              </button>
            </div>
          </motion.div>

          {/* Anniversary Widget */}
          <motion.div 
            className="backdrop-blur-xl border border-white/60 rounded-[24px] py-5 px-4 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.06)] flex flex-col justify-between items-center transition-colors duration-500 relative overflow-hidden -mt-[1px]"
            style={{ backgroundColor: currentThemeConfig.cardBg }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="text-[12px] tracking-widest flex items-center justify-center font-medium" style={{color: currentThemeConfig.textSecondary}}>
              <span>在一起已经</span>
            </div>
            
            <div className="text-[46px] leading-[1] italic font-normal tracking-tight mb-2 mt-0" style={{color: currentThemeConfig.textPrimary, fontFamily: '"Playfair Display", "Georgia", "Times New Roman", serif'}}>
              {getDaysTogether()}
            </div>
            
            <div className="relative w-full flex justify-center">
              <input 
                type="date" 
                value={anniversaryDate}
                onChange={(e) => setAnniversaryDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div 
                className="text-[11px] font-medium tracking-wider" 
                style={{color: currentThemeConfig.textSecondary, fontFamily: 'system-ui, -apple-system, sans-serif'}}
              >
                {getFormattedDate(anniversaryDate)}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Apps Grid */}
        <motion.div 
          className="grid grid-cols-4 gap-y-3 gap-x-3 pt-1 pb-1 shrink-0 px-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {apps.map((app, idx) => (
            <div 
              key={app.name} 
              className="flex flex-col items-center gap-1.5 cursor-pointer group opacity-80 hover:opacity-100 transition-opacity"
              onClick={() => {
                if (app.name === '帮我决定') setView('decide');
                if (app.name === '聊天') setView('chat');
                if (app.name === '朋友圈') setView('moments');
                if (app.name === '书影音记录') setView('wishlist');
                if (app.name === '查岗') setView('check_in');
                if (app.name === '记账') setView('accounting');
                if (app.name === 'Todo') setView('todo');
                if (app.name === '信箱') setView('mailbox');
              }}
            >
              <div 
                className="w-[66px] h-[66px] rounded-[22px] backdrop-blur-md shadow-[0_4px_20px_-6px_rgba(0,0,0,0.06)] flex items-center justify-center transition-all group-active:scale-95"
                style={{ 
                   color: currentThemeConfig.textSecondary,
                   backgroundColor: `rgba(255, 255, 255, ${appOpacity / 100})`,
                   border: `1px solid rgba(255, 255, 255, ${appOpacity / 100})`
                }}
              >
                <app.icon size={28} strokeWidth={1.5} />
              </div>
              <span className="text-[12px] font-medium" style={{ color: currentThemeConfig.textSecondary }}>{app.name}</span>
            </div>
          ))}
        </motion.div>

        {/* Bottom Tools Pill */}
        <motion.div 
          className="backdrop-blur-xl border border-white/60 rounded-[40px] p-2.5 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.06)] grid grid-cols-4 shrink-0 items-center justify-items-center transition-colors duration-500 mb-0"
          style={{ backgroundColor: currentThemeConfig.cardBg }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          {tools.map(tool => (
            <div 
              key={tool.name} 
              className="flex flex-col items-center justify-center gap-1.5 cursor-pointer group"
              onClick={() => {
                if (tool.name === '外观设置') setView('appearance');
                if (tool.name === '字卡库') setView('library');
                if (tool.name === '数据管理') setView('data');
                if (tool.name === '聊天设置') setView('chat_settings');
              }}
            >
              <div 
                className="w-[48px] h-[48px] rounded-[16px] bg-white/50 backdrop-blur-md border border-white/80 shadow-[0_4px_12px_-6px_rgba(0,0,0,0.04)] flex items-center justify-center group-hover:bg-white/65 transition-all group-active:scale-95"
                style={{ color: currentThemeConfig.textSecondary }}
              >
                <tool.icon size={22} strokeWidth={1.25} />
              </div>
              <span className="text-[11px] leading-none mt-0.5 font-medium" style={{ color: currentThemeConfig.textSecondary }}>{tool.name}</span>
            </div>
          ))}
        </motion.div>
        
        </div>

      </div>
      {renderOverlays()}
      {chatKeepAlive && (
        <audio 
          src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA" 
          autoPlay 
          loop 
          muted={false} /* This is an empty silent sample, playing it will keep iOS context active */
          playsInline />
      )}
    </div>
      );
    }
    return null;
  }; // end renderContent

  let currentBgImage = 'none';
  let currentBgColor = currentThemeConfig.bg || '#F2F2F7';

  if (view === 'home' && wallpaper) {
    currentBgImage = `url(${wallpaper})`;
  } else if (view === 'chat') {
    currentBgImage = chatBg ? `url(${chatBg})` : (wallpaper ? `url(${wallpaper})` : 'none');
  } else if (view === 'wishlist') {
    currentBgImage = wishlistBg ? `url(${wishlistBg})` : (wallpaper ? `url(${wallpaper})` : 'none');
  } else if (view === 'check_in') {
    currentBgImage = checkinsBg ? `url(${checkinsBg})` : (wallpaper ? `url(${wallpaper})` : 'none');
  } else if (view === 'todo') {
    currentBgImage = wallpaper ? `url(${wallpaper})` : 'none';
  } else if (view === 'mailbox') {
    currentBgImage = wallpaper ? `url(${wallpaper})` : 'none';
  } else if (view === 'moments') {
    currentBgColor = momentsStyle === 'weibo' ? '#f2f2f2' : '#ffffff';
    currentBgImage = 'none';
  } else if (['appearance', 'library', 'data', 'chat_settings', 'music_manager', 'decide'].includes(view)) {
    currentBgColor = '#F2F2F7';
    currentBgImage = 'none';
  }

  const showBackgroundLayer = true;


  return (
    <>
      <TodoScheduler />
      <BackgroundLayer
        bg={currentBgColor}
        image={currentBgImage}
        show={showBackgroundLayer}
      />
      
      <div style={{ position: "absolute", inset: 0, zIndex: view === "chat" ? 40 : -10, opacity: view === "chat" ? 1 : 0, pointerEvents: view === "chat" ? "auto" : "none", visibility: view === "chat" ? "visible" : "hidden" }}>
        <ChatView 
          onClose={() => setView("home")} 
          onOpenSettings={() => setView("chat_settings")} 
          themeConfig={currentThemeConfig} 
          chatAvatar1={chatAvatar1}
          chatAvatar2={chatAvatar2}
          chatBg={chatBg}
          chatCss={chatCss}
          chatFont={chatFont}
        />
      </div>
      {view === "chat" && <VideoCallOverlay />}
      {view !== "chat" && renderContent()}
    </>
  );
}
