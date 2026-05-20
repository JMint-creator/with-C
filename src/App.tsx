import { useState, useRef, useEffect } from 'react';
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
  ListMusic
} from 'lucide-react';
import { motion } from 'motion/react';
import { ChatView } from './ChatView';
import { ChatSettingsView } from './ChatSettingsView';

const apps = [
  { name: '聊天', icon: MessageCircle },
  { name: '信箱', icon: Mail },
  { name: '查岗', icon: Radar },
  { name: '日记本', icon: BookHeart },
  { name: '心愿清单', icon: Gift },
  { name: '观影阅读', icon: Film },
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

const SettingItem = ({ icon: Icon, label, value, onClick, onChange, isTextarea = false, hideBorder = false }: any) => {
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
          {onChange ? (
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

function useLocalState<T>(key: string, initialValue: T): [T, (val: T) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setState(value);
      window.localStorage.setItem(key, JSON.stringify(value));
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
    <div className="flex-1 min-h-screen w-full flex flex-col font-sans overflow-x-hidden relative" style={{ backgroundColor: themeConfig.bg }}>
      {/* Header */}
      <div className="w-full flex items-center justify-between px-4 pb-3 sticky top-0 z-10 pt-[env(safe-area-inset-top)] mt-4" style={{ backgroundColor: themeConfig.bg ? themeConfig.bg + 'cc' : '#fcfbf9cc', backdropFilter: 'blur(12px)' }}>
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

export default function App() {
  const [view, setView] = useState<'home' | 'appearance' | 'data' | 'library' | 'decide' | 'chat' | 'chat_settings' | 'music_manager'>('home');

  // Library States
  const [libTab, setLibTab] = useState<'reply' | 'atmosphere'>('reply');
  const [replySubTab, setReplySubTab] = useState<'cards' | 'emoji' | 'stickers'>('cards');
  const [atmosSubTab, setAtmosSubTab] = useState<'nudge' | 'status'>('nudge');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [importModalData, setImportModalData] = useState<{name: string, data: any} | null>(null);
  const [confirmModal, setConfirmModal] = useState<{title: string, msg: string, onConfirm: () => void} | null>(null);
  const [toastMsg, setToastMsg] = useState<string>('');

  const showToast = (msg: string) => {
      setToastMsg(msg);
      setTimeout(() => setToastMsg(''), 2000);
  };

  const [cardGroups, setCardGroups] = useLocalState<any[]>('app_cardGroups', [{ id: '1', name: '默认分组', cards: ['你好呀！', '在干嘛呢？'] }]);
  const [emojis, setEmojis] = useLocalState<string[]>('app_emojis', ['😀', '😂', '🥰', '👍', '🙏']);
  const [stickers, setStickers] = useLocalState<string[]>('app_stickers', []);
  const [nudges, setNudges] = useLocalState<string[]>('app_nudges', ['拍了拍我的 脑袋', '拍了拍我的 肩膀']);
  const [statuses, setStatuses] = useLocalState<string[]>('app_statuses', ['在线', '忙碌', '离开']);

  // UI States
  const [wallpaper, setWallpaper] = useLocalState('app_wallpaper', '');
  const [profileBg, setProfileBg] = useLocalState('app_profileBg', '');
  const [avatar1, setAvatar1] = useLocalState('app_avatar1', '');
  const [avatar2, setAvatar2] = useLocalState('app_avatar2', '');
  const [name1, setName1] = useLocalState('app_name1', 'Yuli');
  const [name2, setName2] = useLocalState('app_name2', 'Milk');
  const [motto, setMotto] = useLocalState('app_motto', '沉睡中缠绵 · 清醒又幻灭');

  // Theme
  const [theme, setTheme] = useLocalState<'warm' | 'mint' | 'sakura' | 'blue' | 'purple'>('app_theme', 'warm');

  // Chat Settings
  const [chatBg, setChatBg] = useLocalState('app_chatBg', '');
  const [chatAvatar1, setChatAvatar1] = useLocalState('app_chatAvatar1', '');
  const [chatAvatar2, setChatAvatar2] = useLocalState('app_chatAvatar2', '');
  const [chatCss, setChatCss] = useLocalState('app_chatCss', '');
  const [chatFont, setChatFont] = useLocalState('app_chatFont', '');
  const [chatKeepAlive] = useLocalState('app_chatKeepAlive', false);

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
  const [musicList, setMusicList] = useLocalState<Array<{ id: string, name: string, artist: string, url: string }>>('app_musicList', []);
  const [currentMusicIndex, setCurrentMusicIndex] = useLocalState<number>('app_currentMusicIndex', 0);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  const nextMusicRef = useRef(() => {});
  nextMusicRef.current = () => {
    if (musicList.length === 0) {
      setIsMusicPlaying(false);
      return;
    }
    setCurrentMusicIndex(prev => (prev + 1) % musicList.length);
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
    if (musicList.length > 0 && musicList[currentMusicIndex]) {
      const currentUrl = musicList[currentMusicIndex].url;
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
  }, [musicList, currentMusicIndex, isMusicPlaying]);

  const toggleMusicPlay = () => {
    if (musicList.length === 0) return;
    setIsMusicPlaying(!isMusicPlaying);
  };
  const prevMusic = () => {
    if (musicList.length === 0) return;
    setCurrentMusicIndex(prev => (prev - 1 + musicList.length) % musicList.length);
    setIsMusicPlaying(true);
  };
  const nextMusic = () => {
    if (musicList.length === 0) return;
    setCurrentMusicIndex(prev => (prev + 1) % musicList.length);
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
  const chatAvatar1InputRef = useRef<HTMLInputElement>(null);
  const chatAvatar2InputRef = useRef<HTMLInputElement>(null);
  const cssInputRef = useRef<HTMLInputElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);
  const stickerInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setter(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
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
    const bgColor = view === 'home' ? currentThemeConfig.bg : '#F2F2F7';
    document.documentElement.style.backgroundColor = bgColor;
    document.body.style.backgroundColor = bgColor;
    return () => {
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
    };
  }, [currentThemeConfig.bg, view]);

  const [showAddMusicModal, setShowAddMusicModal] = useState(false);
  const [addMusicName, setAddMusicName] = useState('');
  const [addMusicArtist, setAddMusicArtist] = useState('');
  const [addMusicUrl, setAddMusicUrl] = useState('');

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
                                id: Date.now().toString(),
                                name: addMusicName,
                                artist: addMusicArtist,
                                url: addMusicUrl
                            }]);
                            setAddMusicName('');
                            setAddMusicArtist('');
                            setAddMusicUrl('');
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
    return (
      <div className="flex-1 w-full bg-[#F2F2F7] flex flex-col overflow-x-hidden relative text-[12px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
        
        <div 
          className="w-full flex items-center justify-between px-3 pb-3 bg-[#F2F2F7] sticky top-0 z-10 border-b border-[#c6c6c8]/50 shadow-sm"
          style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
        >
          <button onClick={() => setView('home')} className="text-[#007AFF] text-[15px] flex items-center active:opacity-50 transition-opacity">
            <ChevronLeft size={24} className="-ml-1.5" />返回
          </button>
          <span className="text-[15px] font-semibold text-black">数据管理</span>
          <div className="w-[60px]"></div>
        </div>
        <div className="w-full max-w-md mx-auto px-4 pb-12 pt-6">
           <div className="mb-8">
              <div className="text-[11px] text-[#6d6d72] ml-4 mb-2 uppercase tracking-wide">本地数据</div>
              <div className="bg-white rounded-[10px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                 <SettingItem icon={Database} label="清除所有本地数据" value="" onClick={clearData} hideBorder={true} />
              </div>
              <p className="text-[11px] text-[#8e8e93] mt-3 ml-4 leading-relaxed">
                * 操作不可逆，将清除壁纸、头像、文本等所有设置。
              </p>
           </div>
        </div>
        {renderOverlays()}
      </div>
    );
  }

  if (view === 'library') {
    return (
      <div className="flex-1 w-full bg-[#F2F2F7] flex flex-col overflow-x-hidden relative text-[11px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
        
        
        {/* Header */}
        <div 
          className="w-full flex items-center justify-between px-3 pb-3 bg-[#F2F2F7] sticky top-0 z-10 border-b border-[#c6c6c8]/50 shadow-sm"
          style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
        >
          <button onClick={() => setView('home')} className="text-[#007AFF] text-[14px] flex items-center active:opacity-50 transition-opacity w-[60px]">
            <ChevronLeft size={24} className="-ml-1.5" />返回
          </button>
          
          <div className="flex bg-[#e3e3e8] rounded-[9px] p-[2px]">
             <button 
               className={`px-4 py-1 rounded-[7px] text-[11px] font-medium transition-all ${libTab === 'reply' ? 'bg-white shadow-sm text-black' : 'text-[#8e8e93]'}`} 
               onClick={() => setLibTab('reply')}
             >回复库</button>
             <button 
               className={`px-4 py-1 rounded-[7px] text-[11px] font-medium transition-all ${libTab === 'atmosphere' ? 'bg-white shadow-sm text-black' : 'text-[#8e8e93]'}`} 
               onClick={() => setLibTab('atmosphere')}
             >氛围感</button>
          </div>
          <div className="w-[60px]"></div>
        </div>

        <div className="flex-1 overflow-y-auto pb-12 w-full max-w-md mx-auto mt-2">
          {libTab === 'reply' && (
             <div>
               <div className="flex space-x-1 px-4 mt-2 font-medium text-[12px] border-b border-[#c6c6c8]/30">
                   <button className={`px-3 py-2 ${replySubTab === 'cards' ? 'border-b-2 border-[#007AFF] text-[#007AFF]' : 'text-[#8e8e93]'}`} onClick={() => setReplySubTab('cards')}>主字卡</button>
                   <button className={`px-3 py-2 ${replySubTab === 'emoji' ? 'border-b-2 border-[#007AFF] text-[#007AFF]' : 'text-[#8e8e93]'}`} onClick={() => setReplySubTab('emoji')}>Emoji</button>
                   <button className={`px-3 py-2 ${replySubTab === 'stickers' ? 'border-b-2 border-[#007AFF] text-[#007AFF]' : 'text-[#8e8e93]'}`} onClick={() => setReplySubTab('stickers')}>表情库</button>
               </div>

               {replySubTab === 'cards' && (
                  <>
                    {!activeGroupId ? (
                        <div className="mt-4 px-4 space-y-4 pb-8">
                            <div className="flex justify-between items-center bg-white p-3 rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer active:bg-gray-50 transition-colors" onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = '.js,.json,text/plain';
                                input.onchange = (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                        const content = event.target?.result;
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
                                <span className="text-[12px] font-medium text-[#333]">批量导入 (来自 .js/.json 文件)</span>
                                <Download size={20} className="text-[#007AFF]" />
                            </div>
                            
                            <div className="space-y-3">
                                {cardGroups.map((group, groupIdx) => (
                                    <div key={group.id} className="bg-white rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] p-3 flex justify-between items-center cursor-pointer active:bg-gray-50 transition-colors" onClick={() => setActiveGroupId(group.id)}>
                                        <div className="flex-1">
                                            <div className="font-semibold text-[#000] text-[12px]">{group.name}</div>
                                            <div className="text-[#8e8e93] text-[12px] mt-0.5">{group.cards.length} 张字卡</div>
                                        </div>
                                        <button onClick={(e) => {
                                            e.stopPropagation();
                                            setConfirmModal({
                                                title: '删除分组',
                                                msg: '确定删除该分组吗？',
                                                onConfirm: () => {
                                                    const newGroups = [...cardGroups];
                                                    newGroups.splice(groupIdx, 1);
                                                    setCardGroups(newGroups);
                                                    if (activeGroupId === group.id) setActiveGroupId(null);
                                                }
                                            });
                                        }} className="text-[#c6c6c8] p-2 hover:text-[#FF3B30] active:text-[#FF3B30]"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => {
                                const newId = Date.now().toString();
                                setCardGroups([...cardGroups, { id: newId, name: '新分组', cards: [] }]);
                                setActiveGroupId(newId);
                            }} className="w-full py-3 bg-white text-[#007AFF] font-medium rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex items-center justify-center gap-2 active:bg-gray-50 transition-colors">
                                <Plus size={18}/> 新建分组
                            </button>
                        </div>
                    ) : (
                        <div className="mt-2 px-4 pb-8">
                            <div className="flex items-center gap-2 mb-4 bg-white p-2 rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
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

                            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                                {(cardGroups.find(g => g.id === activeGroupId)?.cards || []).map((card, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                                        <textarea 
                                            className="text-[11px] bg-transparent outline-none flex-1 text-[#333] resize-none" 
                                            rows={card.length > 20 ? 2 : 1}
                                            value={card} 
                                            onChange={(e) => {
                                                const newGroups = [...cardGroups];
                                                const gIdx = newGroups.findIndex(g => g.id === activeGroupId);
                                                if (gIdx > -1) {
                                                    newGroups[gIdx].cards[idx] = e.target.value;
                                                    setCardGroups(newGroups);
                                                }
                                            }} 
                                        />
                                        <button onClick={() => {
                                            const newGroups = [...cardGroups];
                                            const gIdx = newGroups.findIndex(g => g.id === activeGroupId);
                                            if (gIdx > -1) {
                                                newGroups[gIdx].cards.splice(idx, 1);
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
                            }} className="w-full mt-4 py-2.5 text-[11px] font-medium text-[#007AFF] flex justify-center items-center gap-1 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] active:bg-gray-50 transition-colors rounded-[10px]">
                                <Plus size={16}/> 添加一条字卡
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
                          Array.from(files).forEach(file => {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                  newStickers.push(event.target?.result as string);
                                  setStickers([...newStickers]);
                              };
                              reader.readAsDataURL(file);
                          });
                          e.target.value = ''; // reset
                      }} />
                 </div>
               )}
             </div>
          )}

          {libTab === 'atmosphere' && (
             <div>
               <div className="flex space-x-1 px-4 mt-2 font-medium text-[12px] border-b border-[#c6c6c8]/30">
                   <button className={`px-3 py-2 ${atmosSubTab === 'nudge' ? 'border-b-2 border-[#007AFF] text-[#007AFF]' : 'text-[#8e8e93]'}`} onClick={() => setAtmosSubTab('nudge')}>拍一拍</button>
                   <button className={`px-3 py-2 ${atmosSubTab === 'status' ? 'border-b-2 border-[#007AFF] text-[#007AFF]' : 'text-[#8e8e93]'}`} onClick={() => setAtmosSubTab('status')}>对方状态</button>
               </div>

               {atmosSubTab === 'nudge' && (
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

               {atmosSubTab === 'status' && (
                 <div className="mt-4 px-4 space-y-2 pb-8">
                     <div className="bg-white rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
                       {statuses.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 border-b border-[#E5E5EA] last:border-b-0">
                               <input 
                                 className="bg-transparent outline-none flex-1 text-[13px] text-[#333]" 
                                 value={item} 
                                 onChange={(e) => {
                                    const newStatuses = [...statuses];
                                    newStatuses[idx] = e.target.value;
                                    setStatuses(newStatuses);
                                 }} 
                               />
                               <button onClick={() => {
                                   const newStatuses = [...statuses];
                                   newStatuses.splice(idx, 1);
                                   setStatuses(newStatuses);
                               }} className="text-[#c6c6c8] p-1 active:opacity-50"><X size={18}/></button>
                          </div>
                       ))}
                     </div>
                     <button onClick={() => setStatuses([...statuses, '新状态'])} className="w-full py-3 bg-white text-[#007AFF] font-medium rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex items-center justify-center gap-2 mt-4 active:bg-gray-50 transition-colors"><Plus size={18}/> 添加状态</button>
                 </div>
               )}
             </div>
          )}
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
                               newGroups.push({ id: Date.now().toString(), name: importModalData.name, cards: cardsToAdd });
                           } else if (importModalData.data && typeof importModalData.data === 'object') {
                               const newG = Object.keys(importModalData.data).map((k, i) => ({
                                   id: Date.now().toString() + i,
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
                       {cardGroups.map((group) => (
                           <div key={group.id} className="p-3 border-b border-[#e5e5ea] last:border-b-0 flex justify-between items-center cursor-pointer active:bg-gray-50" onClick={() => {
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
      <div className="flex-1 w-full bg-[#F2F2F7] flex flex-col overflow-x-hidden relative text-[14px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
        <div 
          className="w-full flex items-center justify-between px-3 pb-3 bg-[#F2F2F7] sticky top-0 z-10 border-b border-[#c6c6c8]/50 shadow-sm"
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
          <div className="bg-white rounded-[10px] overflow-hidden">
            {musicList.length === 0 ? (
              <div className="p-8 text-center text-[#8e8e93] text-[13px]">
                暂无音乐，点击右上角添加
              </div>
            ) : (
              musicList.map((music, idx) => (
                <div key={music.id} className={`flex items-center justify-between p-3 ${idx !== musicList.length - 1 ? 'border-b border-[#c6c6c8]/30' : ''}`}>
                   <div className="flex flex-col flex-1 overflow-hidden pr-4">
                      <span className="font-medium text-black truncate">{music.name}</span>
                      <span className="text-[12px] text-[#8e8e93] truncate">{music.artist}</span>
                   </div>
                   <button onClick={() => {
                       const newList = [...musicList];
                       newList.splice(idx, 1);
                       setMusicList(newList);
                       if (currentMusicIndex >= newList.length && newList.length > 0) {
                           setCurrentMusicIndex(0);
                       } else if (newList.length === 0) {
                           setIsMusicPlaying(false);
                           setCurrentMusicIndex(0);
                       }
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
      <div className="flex-1 w-full bg-[#F2F2F7] flex flex-col overflow-x-hidden relative text-[11px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
        
        {/* Header */}
        <div 
          className="w-full flex items-center justify-between px-3 pb-3 bg-[#F2F2F7] sticky top-0 z-10 border-b border-[#c6c6c8]/50 shadow-sm"
          style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
        >
          <button onClick={() => setView('home')} className="text-[#007AFF] text-[14px] flex items-center active:opacity-50 transition-opacity">
            <ChevronLeft size={24} className="-ml-1.5" />返回
          </button>
          <span className="text-[14px] font-semibold text-black">外观设置</span>
          <div className="w-[60px]"></div>
        </div>

        <div className="w-full max-w-md mx-auto px-4 pb-12 pt-6">
           {/* 1. 界面美化 */}
           <div className="mb-8">
              <div className="text-[12px] text-[#6d6d72] ml-4 mb-2 uppercase tracking-wide">界面美化</div>
              <div className="bg-white rounded-[10px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                 <SettingItem icon={ImageIcon} label="上传主壁纸" value={wallpaper ? '已上传 (重新上传)' : '未设置'} onClick={() => wallpaperInputRef.current?.click()} />
                 <SettingItem icon={ImageIcon} label="上传顶部卡片图" value={profileBg ? '已上传' : '未设置'} onClick={() => profileBgInputRef.current?.click()} />
                 <SettingItem icon={User} label="顶部头像 1" value={avatar1 ? '已上传' : '未设置'} onClick={() => avatar1InputRef.current?.click()} />
                 <SettingItem icon={User} label="顶部头像 2" value={avatar2 ? '已上传' : '未设置'} onClick={() => avatar2InputRef.current?.click()} />
                 <SettingItem icon={Type} label="顶部昵称 1" value={name1} onChange={setName1} />
                 <SettingItem icon={Type} label="顶部昵称 2" value={name2} onChange={setName2} />
                 <SettingItem icon={MessageCircle} label="顶部宣言" value={motto} onChange={setMotto} isTextarea={true} hideBorder={true}/>
              </div>
           </div>

           {/* 2. 主题配色 */}
           <div className="mb-8">
              <div className="text-[12px] text-[#6d6d72] ml-4 mb-2 uppercase tracking-wide">主题配色</div>
              <div className="bg-white rounded-[10px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                 <SettingItem icon={Palette} label="暖冬麦色" value={theme === 'warm' ? '当前' : ''} onClick={() => setTheme('warm')} />
                 <SettingItem icon={Palette} label="薄荷微风" value={theme === 'mint' ? '当前' : ''} onClick={() => setTheme('mint')} />
                 <SettingItem icon={Palette} label="春日落樱" value={theme === 'sakura' ? '当前' : ''} onClick={() => setTheme('sakura')} />
                 <SettingItem icon={Palette} label="宁静海蓝" value={theme === 'blue' ? '当前' : ''} onClick={() => setTheme('blue')} />
                 <SettingItem icon={Palette} label="梦幻香芋" value={theme === 'purple' ? '当前' : ''} onClick={() => setTheme('purple')} />
                 <SettingItem icon={Palette} label="枫叶绯红" value={theme === 'red' ? '当前' : ''} onClick={() => setTheme('red')} hideBorder={true}/>
              </div>
           </div>

           {/* 3. 聊天设置 */}
           <div className="mb-8">
              <div className="text-[12px] text-[#6d6d72] ml-4 mb-2 uppercase tracking-wide">聊天设置</div>
              <div className="bg-white rounded-[10px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                 <SettingItem icon={ImageIcon} label="聊天背景" value={chatBg ? '已上传' : '未设置'} onClick={() => chatBgInputRef.current?.click()} />
                 <SettingItem icon={Users} label="我方聊天头像" value={chatAvatar1 ? '已上传' : '未设置'} onClick={() => chatAvatar1InputRef.current?.click()} />
                 <SettingItem icon={Users} label="对方聊天头像" value={chatAvatar2 ? '已上传' : '未设置'} onClick={() => chatAvatar2InputRef.current?.click()} />
                 <SettingItem icon={Droplet} label="聊天气泡 CSS" value={chatCss ? '已上传' : '未设置'} onClick={() => cssInputRef.current?.click()} />
                 <SettingItem icon={Type} label="聊天字体 TTF" value={chatFont ? '已上传' : '未设置'} onClick={() => fontInputRef.current?.click()} hideBorder={true}/>
              </div>
           </div>
        </div>

        {/* Hidden inputs */}
        <input type="file" ref={chatBgInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setChatBg)} />
        <input type="file" ref={wallpaperInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setWallpaper)} />
        <input type="file" ref={profileBgInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setProfileBg)} />
        <input type="file" ref={avatar1InputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setAvatar1)} />
        <input type="file" ref={avatar2InputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setAvatar2)} />
        
        <input type="file" ref={chatAvatar1InputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setChatAvatar1)} />
        <input type="file" ref={chatAvatar2InputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setChatAvatar2)} />
        
        <input type="file" ref={cssInputRef} className="hidden" accept=".css" onChange={(e) => handleTextChange(e, setChatCss, 'CSS已加载 (在主页面和聊天中生效)')} />
        <input type="file" ref={fontInputRef} className="hidden" accept=".ttf,.otf,.woff,.woff2" onChange={(e) => handleFileChange(e, setChatFont)} />
        {renderOverlays()}
      </div>
    )
  }

  if (view === 'chat') {
    return <ChatView onClose={() => setView('home')} onOpenSettings={() => setView('chat_settings')} themeConfig={currentThemeConfig} />;
  }

  if (view === 'chat_settings') {
    return <ChatSettingsView onClose={() => setView('home')} themeConfig={currentThemeConfig} />;
  }

  return (
    <div 
      className="flex-1 w-full text-[#333] font-sans flex flex-col items-center overflow-x-hidden selection:bg-[#DCD6CE]/50 transition-colors duration-500 relative min-h-[100dvh]"
      style={{
        backgroundColor: currentThemeConfig.bg,
        backgroundImage: wallpaper ? `url(${wallpaper})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        color: currentThemeConfig.textPrimary
      }}
    >
      <div 
         className="fixed inset-0 w-full h-full -z-10"
         style={{ backgroundColor: currentThemeConfig.bg }}
      />
      {chatCss && <style dangerouslySetInnerHTML={{ __html: chatCss }} />}
      {chatFont && <style dangerouslySetInnerHTML={{ __html: `@font-face { font-family: 'CustomChatFont'; src: url('${chatFont}'); } * { font-family: 'CustomChatFont', sans-serif !important; }`}} />}

      <div 
        className="w-full max-w-[420px] mx-auto flex flex-col justify-between flex-1 gap-2.5 px-4 shrink-0"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingTop: 'calc(0.5rem + env(safe-area-inset-top))'
        }}
      >
        
        {/* Profile Card */}
        <motion.div 
          className="border border-white/60 rounded-[32px] flex flex-col items-center shadow-[0_8px_32px_-12px_rgba(0,0,0,0.06)] shrink-0 transition-colors duration-500 overflow-hidden w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header Image */}
          <div 
            className="w-full h-[140px] bg-cover bg-center shrink-0 relative"
            style={{ 
              backgroundImage: profileBg ? `url(${profileBg})` : 'none',
              backgroundColor: currentThemeConfig.cardBg
            }}
          />
          
          {/* Bottom Frosted Container */}
          <div 
            className="w-full relative pt-[48px] pb-6 px-4 flex flex-col items-center backdrop-blur-xl"
            style={{ backgroundColor: currentThemeConfig.cardBg }}
          >
            {/* Avatars */}
            <div className="absolute -top-[36px] flex justify-center items-center w-full">
              <div className="relative flex items-center justify-center">
                <div 
                  className="w-[72px] h-[72px] rounded-full border-[3px] overflow-hidden flex items-center justify-center shadow-sm transition-transform hover:scale-105 cursor-pointer z-10 -mr-4"
                  style={{ borderColor: currentThemeConfig.bg, backgroundColor: currentThemeConfig.bg, color: currentThemeConfig.textSecondary }}
                  onClick={() => avatar1InputRef.current?.click()}
                >
                  {avatar1 ? <img src={avatar1} className="w-full h-full object-cover" /> : <Cat size={30} strokeWidth={1.5} />}
                </div>
                <div 
                  className="w-[72px] h-[72px] rounded-full border-[3px] overflow-hidden flex items-center justify-center shadow-sm transition-transform hover:scale-105 cursor-pointer z-0"
                  style={{ borderColor: currentThemeConfig.bg, backgroundColor: currentThemeConfig.bg, color: currentThemeConfig.textSecondary }}
                  onClick={() => avatar2InputRef.current?.click()}
                >
                  {avatar2 ? <img src={avatar2} className="w-full h-full object-cover" /> : <Cat size={30} strokeWidth={1.5} />}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-[19px] font-semibold tracking-wide">{name1}</h1>
              <span className="text-[14px] font-light" style={{color: currentThemeConfig.textSecondary}}>&</span>
              <h1 className="text-[19px] font-semibold tracking-wide">{name2}</h1>
            </div>
            <p className="text-[12px] leading-[1.6] text-center whitespace-pre-line" style={{color: currentThemeConfig.textSecondary}}>{motto}</p>
          </div>
        </motion.div>

        {/* Widgets Row */}
        <div className="grid grid-cols-2 gap-3 shrink-0">
          {/* Music Widget */}
          <motion.div 
            className="backdrop-blur-xl border border-white/60 rounded-[24px] p-4 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.06)] flex flex-col transition-colors duration-500"
            style={{ backgroundColor: currentThemeConfig.cardBg }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex justify-between items-center mb-2">
               <div className="text-[10px]" style={{color: currentThemeConfig.textSecondary}}>
                 {musicList.length > 0 ? (isMusicPlaying ? '播放中' : '已暂停') : '未添加音乐'}
               </div>
               <button onClick={() => setView('music_manager')} className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all">
                  <ListMusic size={12} style={{color: currentThemeConfig.textSecondary}} />
               </button>
            </div>
            <div className="font-medium text-[12px] mb-0.5 truncate text-[#333]">
              {musicList.length > 0 ? musicList[currentMusicIndex].name : '无音乐'}
            </div>
            <div className="text-[10px] mb-3 truncate" style={{color: currentThemeConfig.textSecondary}}>
              {musicList.length > 0 ? musicList[currentMusicIndex].artist : 'No Artist'}
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
            className="backdrop-blur-xl border border-white/60 rounded-[24px] py-5 px-4 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.06)] flex flex-col justify-between items-center transition-colors duration-500 relative overflow-hidden"
            style={{ backgroundColor: currentThemeConfig.cardBg }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="text-[12px] tracking-widest flex items-center justify-center font-medium" style={{color: currentThemeConfig.textSecondary}}>
              <span>在一起已经</span>
            </div>
            
            <div className="text-[46px] leading-[1] italic font-normal tracking-tight my-2" style={{color: currentThemeConfig.textPrimary, fontFamily: '"Playfair Display", "Georgia", "Times New Roman", serif'}}>
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
          className="grid grid-cols-4 gap-y-2.5 gap-x-3 pt-1 pb-1 shrink-0 px-1"
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
              }}
            >
              <div 
                className="w-[66px] h-[66px] rounded-[22px] bg-white/40 backdrop-blur-md border border-white/40 shadow-[0_4px_20px_-6px_rgba(0,0,0,0.06)] flex items-center justify-center group-hover:bg-white/50 transition-all group-active:scale-95"
                style={{ color: currentThemeConfig.textSecondary }}
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
