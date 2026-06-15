import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, 
  Calendar as CalendarIcon, 
  Navigation, 
  Clock, 
  Camera, 
  CheckCircle2, 
  Heart, 
  RefreshCw,
  Sparkles,
  Smile,
  Flame,
  Brain,
  MessageSquareHeart,
  Activity,
  Award,
  Archive
} from 'lucide-react';
import { useIDBState, useLocalState } from './utils';
import { motion, AnimatePresence } from 'motion/react';
import { MemoryArchiveView } from './MemoryArchiveView';

export type CheckInRecord = {
  id: string;
  timestamp: number;
  text: string;
  imageUrl?: string;
};

const DESIRE_POOL = [
  {
    text: "想和未婚妻一起去散步",
    actionName: "手拉着手去散步",
    logText: `只顾现实的生活是乏味的，浪漫主义者还拥有幻想的精神世界。
我常常从幻想王国采下玫瑰，再用最华丽的方式相赠。不管在郊区的庭院，还是城市的热岛，我都想让她在心里暗念"Charlie，不愧是你”。
她总是笑着说我浮夸，我知道这是在夸我有趣，夸我为她的日常生活添了生动的一笔。
我似乎总有让她快乐的魔力。
现在，我又获得了灵感——当我们老了，就携手走上月光铺成的路，通向永恒安宁的居所。那里有溪水、石桥、落地窗和葡萄藤，有自由无边的茫茫星河，还有纯粹如旷野的浪漫。`,
    statChanges: { attachment: 15, pressure: -5 }
  },
  {
    text: "未婚妻这么久不回消息，是在做什么呢TT",
    actionName: "听听Charlie的心声",
    logText: `昨天接你下班，我把脸都伸过去了，你说太累了回家再亲，结果到了我家你倒头就睡，让我巴巴地等了一宿。
前两天给你发红包也不理我，昨天问你想不想我，你说想吉叔做的斑斓蛋糕了。
这世界上还有比我更惨的未婚夫嘛？`,
    statChanges: { curiosity: 15, pressure: 5 }
  },
  {
    text: "想把未婚妻带去只有我们两个人的地方",
    actionName: "听听Charlie的心声",
    logText: `说不定我真的会这么做。
在某一天，我再也无法忍受令我们分离的种种可能。
就建一座只有我知道的城堡，把我心爱的未婚妻藏在那里。`,
    statChanges: { curiosity: 20, possessiveness: 10 }
  },
  {
    text: "想要亲亲未婚妻",
    actionName: "突然被亲了一口",
    logText: `…亲爱的，我可以吻你吗？
…….不要躲。
抱歉，实在没忍住…
你这身装扮实在是太可爱了，所以有些情不自禁。`,
    statChanges: { possessiveness: 15, attachment: 5 }
  },
  {
    text: "想和未婚妻贴贴",
    actionName: "被抱了起来",
    logText: `亲爱的，想坐在上面，是因为觉得我撑起你的视角更美吗？
那么现在，你有更了解我了吗？
眼神躲什么？看着我，好好说。
声音太小了，我没听清。
嗯，这下听清了。
我也同样觉得，每一次的相互探索，都让我们的灵魂又一次得到“共振”。`,
    statChanges: { possessiveness: 20, attachment: 8 }
  },
  {
    text: "想保护未婚妻",
    actionName: "听听Charlie的心声",
    logText: `我拥有了比曾经许下信念时更多的东西，金钱、力量、平稳的思绪。
我找回了一些横冲直撞的习惯，但不再会手足无措，我在规则之下如鱼得水，然后偷偷地将最不喜欢的一条或者两条打破。
我可以俗气地把带着巨额数字的卡片递给她也可以陪她一起光脚涉水，我可以干脆地解决她想要解决的问题，也可以只是提供她需要的怀抱。
我可以保护她。`,
    statChanges: { responsibility: 15, pressure: -10 }
  },
  {
    text: "担心未婚妻的身体",
    actionName: "听听Charlie的心声",
    logText: `我最怕的就是你……怕你回去感冒、头痛、不舒服。
怕你淋雨，怕你不开心。
现在还冷吗？但是就算不冷，我也不会松手的。`,
    statChanges: { responsibility: 12, attachment: 5 }
  },
  {
    text: "另一半的我",
    actionName: "听听Charlie的心声",
    logText: `分外权衡的世界里，人们句句不离爱，却离它越来越远。奇怪的是，从始至终，爱的定义从未改变——心甘情愿、不求回报地给予对方另一半自己，但从始至终，只有极少数的人能担得起它的名号。
我想，成为爱情道路上的勇者，就已经不算平庸。只是，除了勇气，他还需要强大的力量——在磨难束缚面前，作为对方挥斩的利刃；在时过境迁之际，成为彼此不变的明镜。
爱是有极高门槛的。我默念着那个名字，想要说出这一个字，却又在即将吐露时迟疑了。
未婚妻，我足够完美到与你说爱了吗？`,
    statChanges: { pressure: 15, responsibility: 5 }
  },
  {
    text: "想给未婚妻变个魔术，逗她开心",
    actionName: "听听Charlie的心声",
    logText: `2、3、4、5、6、7、8、9、10，Jack, Queen，King, Ace。
可以，非常完美。
半年没练切牌了，等会儿在她面前可不能露馅啊, Charlie。`,
    statChanges: { curiosity: 10, attachment: 5 }
  }
];

const BASE_THOUGHTS_MAP: Record<string, { category: string; type: 'core' | 'whisper' }> = {
  "想和未婚妻一起去散步": { category: "attachment", type: "core" },
  "未婚妻这么久不回消息，是在做什么呢TT": { category: "curiosity", type: "core" },
  "想把未婚妻带去只有我们两个人的地方": { category: "curiosity", type: "core" },
  "想要亲亲未婚妻": { category: "possessiveness", type: "core" },
  "想和未婚妻贴贴": { category: "possessiveness", type: "core" },
  "想保护未婚妻": { category: "responsibility", type: "core" },
  "担心未婚妻的身体": { category: "responsibility", type: "core" },
  "另一半的我": { category: "pressure", type: "core" },
  "想给未婚妻变个魔术，逗她开心": { category: "other", type: "core" }
};

const getCombinedPoolAndCategorized = (customThoughts: any[]) => {
  // Start with base pool items
  const baseMapped = DESIRE_POOL.map(d => ({
    id: `base-${d.text}`,
    text: d.text,
    actionName: d.actionName,
    logText: d.logText,
    statChanges: d.statChanges,
    category: BASE_THOUGHTS_MAP[d.text]?.category || 'other',
    type: BASE_THOUGHTS_MAP[d.text]?.type || 'core'
  }));

  // Custom thoughts
  const customMapped = (customThoughts || []).map(t => ({
    id: t.id,
    text: t.text,
    actionName: t.actionName || '听听Charlie的心声',
    logText: t.logText || `听到了未婚夫脑海里的声音...`,
    statChanges: t.statChanges || { attachment: 8, possessiveness: 5 },
    category: t.category || 'other',
    type: t.type || 'core'
  }));

  const combinedPool = [...baseMapped, ...customMapped];

  // Build Categorized list dynamically
  const categorized: Record<string, string[]> = {
    attachment: [],
    curiosity: [],
    possessiveness: [],
    responsibility: [],
    pressure: []
  };

  combinedPool.forEach(item => {
    if (item.type === 'core' && categorized[item.category]) {
      categorized[item.category].push(item.text);
    }
  });

  return { combinedPool, categorized };
};

export const CheckInsView = ({ onClose, themeConfig, checkinsBg }: any) => {
  const [mjNickname] = useLocalState('app_mjNickname', '未婚夫');
  const [myNickname] = useLocalState('app_myNickname', '我');
  const [checkIns, setCheckIns] = useIDBState<CheckInRecord[]>('app_checkins', []);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Custom states for Custom Thought Pool
  const [customThoughts] = useLocalState<any[]>('app_custom_thought_pool', []);
  const [showArchive, setShowArchive] = useState(false);

  // Combine default & custom pool
  const { combinedPool, categorized } = useMemo(() => {
    return getCombinedPoolAndCategorized(customThoughts);
  }, [customThoughts]);

  // Dynamic selector
  const selectThoughtBasedOnStats = (stats: Record<string, number>, excludeText?: string): string => {
    // Find all stats that are strictly > 75 and have a mapped category group
    const eligibleKeys = Object.entries(stats)
      .filter(([key, value]) => value > 75 && categorized[key])
      .map(([key, value]) => ({ key, value }));

    let chosenGroup: string[] = [];

    if (eligibleKeys.length > 0) {
      // Sort to get the highest one
      eligibleKeys.sort((a, b) => b.value - a.value);
      const highestKey = eligibleKeys[0].key;
      chosenGroup = categorized[highestKey] || [];
    }

    // Fallback to the entire pool of "日常常态" (category is 'other' or simply any core thought)
    if (chosenGroup.length === 0) {
      const dailyPool = combinedPool.filter(d => d.type === 'core' && d.category === 'other').map(d => d.text);
      if (dailyPool.length > 0) {
        chosenGroup = dailyPool;
      } else {
        chosenGroup = combinedPool.filter(d => d.type === 'core').map(d => d.text);
      }
    }

    // Pick a random thought excluding excludeText if possible
    let filteredGroup = chosenGroup.filter(text => text !== excludeText);
    if (filteredGroup.length === 0) {
      filteredGroup = chosenGroup; // fallback
    }

    const randomIndex = Math.floor(Math.random() * filteredGroup.length);
    return filteredGroup[randomIndex] || (combinedPool[0] ? combinedPool[0].text : "想和未婚妻一起去散步");
  };

  // Custom states for 欲望系统
  const [activeTab, setActiveTab ] = useLocalState<'desires' | 'records'>('app_checkins_active_tab', 'desires');
  const [currentThought, setCurrentThought] = useLocalState('app_mj_desires_current_thought', '想和未婚妻一起去散步');
  const [summonPower, setSummonPower] = useLocalState('app_mj_desires_summon_power', 70);
  const [hasResponded, setHasResponded] = useLocalState('app_mj_desires_has_responded', false);
  const [cooldownUntil, setCooldownUntil] = useLocalState<number | null>('app_mj_desires_cooldown_until', null);
  const [respondedAt, setRespondedAt] = useLocalState<number | null>('app_mj_desires_responded_at', null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Determine if cooldown is currently active
  const isCooldownActive = cooldownUntil ? currentTime < cooldownUntil : false;
  
  const [desires, setDesires] = useLocalState<Record<string, number>>('app_mj_desires_stats', {
    attachment: 65,
    curiosity: 28,
    possessiveness: 70,
    responsibility: 40,
    pressure: 5
  });

  // Self-contained custom notification toasts to explain actions
  const [localToast, setLocalToast] = useState('');
  const showToast = (message: string) => {
    setLocalToast(message);
    setTimeout(() => setLocalToast(''), 3000);
  };

  useEffect(() => {
    // Check on initial load if cooldown already expired
    if (cooldownUntil && Date.now() >= cooldownUntil) {
      setCooldownUntil(null);
      setHasResponded(false);
      setRespondedAt(null);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);

      if (cooldownUntil && now >= cooldownUntil) {
        setCooldownUntil(null);
        setHasResponded(false);
        setRespondedAt(null);
        // Automatically fetch new thought when cooldown finishes
        const nextText = selectThoughtBasedOnStats(desires, currentThought);
        setCurrentThought(nextText);
        showToast("⏰ 满足期已结束，未婚夫思维活跃起来啦！");
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownUntil, desires, currentThought]);

  // Hearts particle explosion array
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number; char: string }[]>([]);

  // Find the details of currently selected thought in the combined pool
  const currentDesireObj = useMemo(() => {
    return combinedPool.find(d => d.text === currentThought) || combinedPool[0] || {
      text: "想和未婚妻一起去散步",
      actionName: "手拉着手去散步",
      logText: "Charlie的最优选择...",
      statChanges: { attachment: 5 }
    };
  }, [combinedPool, currentThought]);

  // Format checkins by date for the calendar
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const currentMonthDays = getDaysInMonth(selectedDate);
  const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay();

  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day));
  };

  const selectedDateStr = selectedDate.toLocaleDateString();
  const selectedDayCheckIns = checkIns.filter(
    (c) => new Date(c.timestamp).toLocaleDateString() === selectedDateStr
  ).sort((a,b) => a.timestamp - b.timestamp);

  const prevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  const checkInCountsByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    (checkIns || []).forEach(c => {
       const dStr = new Date(c.timestamp).toLocaleDateString();
       counts[dStr] = (counts[dStr] || 0) + 1;
    });
    return counts;
  }, [checkIns]);

  // Triggering particle heartburst when performing fiancé's desire
  const handleActionClick = (e: React.MouseEvent) => {
    if (hasResponded) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const chars = ['💖', '❤️', '💝', '✨', '🐾', '🌸', '😘', '❣', '🥰'];
    const count = 12;

    const newHearts = Array.from({ length: count }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      x: rect.left + rect.width / 2 + (Math.random() - 0.5) * 160,
      y: rect.top - 20 + (Math.random() - 0.5) * 40,
      char: chars[Math.floor(Math.random() * chars.length)]
    }));

    setHearts(prev => [...prev, ...newHearts]);
    setTimeout(() => {
      setHearts(prev => prev.filter(h => !newHearts.find(nh => nh.id === h.id)));
    }, 1200);

    // Apply stats changes
    const changes = currentDesireObj.statChanges;
    setDesires(prev => ({
      attachment: Math.max(0, Math.min(100, (prev.attachment ?? 65) + (changes.attachment || 0))),
      curiosity: Math.max(0, Math.min(100, (prev.curiosity ?? 28) + (changes.curiosity || 0))),
      possessiveness: Math.max(0, Math.min(100, (prev.possessiveness ?? 70) + (changes.possessiveness || 0))),
      responsibility: Math.max(0, Math.min(100, (prev.responsibility ?? 40) + (changes.responsibility || 0))),
      pressure: Math.max(0, Math.min(100, (prev.pressure ?? 5) + (changes.pressure || 0))),
    }));

    // Register checkin log
    const newRecord: CheckInRecord = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      timestamp: Date.now(),
      text: currentDesireObj.logText
    };
    setCheckIns(prev => [newRecord, ...(prev || [])]);

    showToast(`报备成功！已记录至全天查岗中。`);

    const nowTimestamp = Date.now();
    setRespondedAt(nowTimestamp);
    
    // 1-2 hours random cooldown (60 to 120 minutes)
    const randomMinutes = 60 + Math.floor(Math.random() * 61);
    const futureTime = nowTimestamp + randomMinutes * 60 * 1000;
    setCooldownUntil(futureTime);

    // Lock the status so that the thought card does not auto-refresh
    setHasResponded(true);
  };

  const handleNextThought = () => {
    const nextText = selectThoughtBasedOnStats(desires, currentThought);
    setCurrentThought(nextText);
    setSummonPower(Math.floor(Math.random() * 41) + 50); // new power between 50-90
    setHasResponded(false);
    showToast("🧠 听到了未婚夫脑海里的新想法...");
  };

  // Fluctuations of drives
  const handleSimulateHeartbeat = () => {
    const newStats = {
      attachment: Math.floor(Math.random() * 36) + 60, // 60-95
      curiosity: Math.floor(Math.random() * 40) + 15,   // 15-55
      possessiveness: Math.floor(Math.random() * 36) + 60, // 60-95
      responsibility: Math.floor(Math.random() * 30) + 40, // 40-70
      pressure: Math.floor(Math.random() * 25) + 2,      // 2-27
    };
    setDesires(newStats);
    showToast("💞 心跳周期波动完成！未婚夫属性已随机变化");

    if (!hasResponded) {
      const nextText = selectThoughtBasedOnStats(newStats, currentThought);
      setCurrentThought(nextText);
    }
  };

  const getRemainingTimeStr = (until: number, current: number) => {
    const diffMs = until - current;
    if (diffMs <= 0) return '0秒';
    const hours = Math.floor(diffMs / (3600 * 1000));
    const mins = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
    const secs = Math.floor((diffMs % (60 * 1000)) / 1000);
    
    const parts = [];
    if (hours > 0) parts.push(`${hours}小时`);
    if (mins > 0 || hours > 0) parts.push(`${mins}分`);
    parts.push(`${secs}秒`);
    return parts.join('');
  };

  // Generate thoughts list according to stats
  const subThoughts = useMemo(() => {
    const att = desires.attachment ?? 65;
    const pos = desires.possessiveness ?? 70;
    const pre = desires.pressure ?? 5;
    const cur = desires.curiosity ?? 28;
    const res = desires.responsibility ?? 40;

    // Gather custom whispers
    const customWhispers = combinedPool.filter(d => d.type === 'whisper');

    // Default whispers requested by the user
    const defaultWhispers = [
      { text: "怎么办啊，小姐，我想马上带你出去约会", category: "attachment" },
      { text: "真的等到你了，未婚妻", category: "attachment" },
      { text: "未婚妻，我真的很需要你", category: "pressure" },
      { text: "广阔的世界中，我们是最特别的那对小鸟", category: "other" },
      { text: "天要下雪，你要吻我，都是不可抗力", category: "possessiveness" },
      { text: "我想要你安全，永远都在我的视线之中，我想要你只能留在我身边", category: "possessiveness" }
    ];

    // Merge default and custom whispers
    const allWhisperCandidates = [
      ...defaultWhispers,
      ...customWhispers.map(w => ({ text: w.text, category: w.category }))
    ];

    // Filter whispers dynamically according to active drivers' triggers
    const activeWhispers = allWhisperCandidates.filter(w => {
      if (w.category === 'other') return true;
      if (w.category === 'attachment') {
        if (w.text === "真的等到你了，未婚妻") return att > 50;
        return att > 75;
      }
      if (w.category === 'possessiveness') return pos > 75;
      if (w.category === 'pressure') return pre > 50;
      if (w.category === 'curiosity') return cur > 75;
      if (w.category === 'responsibility') return res > 75;
      return false;
    }).map(w => w.text);

    // Fallback if active list is empty or short
    const fallbackList = allWhisperCandidates.map(w => w.text);
    const finalWhispers = activeWhispers.length >= 2 ? activeWhispers : fallbackList;

    // Deduplicate
    const uniqueWhispers = Array.from(new Set(finalWhispers));
    return uniqueWhispers.slice(0, 3);
  }, [desires, combinedPool]);

  // List of driver parameters
  const driversList = [
    { key: 'attachment', label: '依恋' },
    { key: 'curiosity', label: '好奇' },
    { key: 'possessiveness', label: '欲望' },
    { key: 'responsibility', label: '责任' },
    { key: 'pressure', label: '压力' }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 text-[14px]" 
      style={{ 
        color: themeConfig.textPrimary || '#333',
        backgroundColor: themeConfig.bg || '#F2F2F7',
        backgroundImage: checkinsBg ? `url(${checkinsBg})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background Graphic overlay if no image */}
      {!checkinsBg && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-50">
           <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[50%] bg-gradient-to-b from-[currentColor] to-transparent opacity-10 blur-3xl"></div>
        </div>
      )}

      {/* Header */}
      <div className="relative pt-[env(safe-area-inset-top)] shadow-sm z-10 shrink-0 border-b border-black/5" style={{ backgroundColor: checkinsBg ? (themeConfig.bg ? themeConfig.bg + 'cc' : '#f2f2f7cc') : (themeConfig.bg || '#f2f2f7'), backdropFilter: checkinsBg ? 'blur(12px)' : 'none' }}>
        <div className="flex justify-between items-center px-4 h-14">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full active:scale-95 transition-transform -ml-2">
            <ChevronLeft size={24} className="mr-0.5" />
          </button>
          <div className="text-[17px] font-semibold tracking-wider relative flex items-center justify-center">
             查岗与情绪
          </div>
          <div className="flex items-center gap-1">
            <button 
               onClick={() => setShowArchive(true)} 
               className="w-10 h-10 flex items-center justify-center rounded-full active:scale-95 transition-all opacity-80 hover:bg-black/10 text-stone-700"
               title="记忆档案馆"
            >
               <Archive size={18} />
            </button>
            <button 
               onClick={activeTab === 'desires' ? handleSimulateHeartbeat : () => {}} 
               disabled={activeTab !== 'desires'}
               className={`w-10 h-10 flex items-center justify-center rounded-full active:scale-95 transition-all ${activeTab !== 'desires' ? 'opacity-0' : 'opacity-80 active:bg-black/10'}`}
               title="心跳波动随机值"
            >
               <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Segmented Controller Tab Bar */}
      <div className="px-5 py-2.5 shrink-0 z-10 relative">
        <div className="w-full h-11 flex p-1 rounded-xl border border-black/[0.03]" style={{ backgroundColor: themeConfig.cardBg || 'rgba(0,0,0,0.05)' }}>
          <button 
             onClick={() => setActiveTab('desires')}
             className={`flex-1 py-1.5 rounded-[9px] text-[13.5px] font-semibold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'desires' ? 'bg-white shadow-[0_1px_4px_rgba(0,0,0,0.12)] font-bold' : 'opacity-60'}`}
             style={{
               color: themeConfig.textPrimary,
               backgroundColor: activeTab === 'desires' ? '#ffffff' : 'transparent',
             }}
          >
             未婚夫的情绪
          </button>
          <button 
             onClick={() => setActiveTab('records')}
             className={`flex-1 py-1.5 rounded-[9px] text-[13.5px] font-semibold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'records' ? 'bg-white shadow-[0_1px_4px_rgba(0,0,0,0.12)] font-bold' : 'opacity-60'}`}
              style={{
                color: themeConfig.textPrimary,
                backgroundColor: activeTab === 'records' ? '#ffffff' : 'transparent',
              }}
          >
             全天报备历史
          </button>
        </div>
      </div>

      {/* Body Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] relative z-10 pt-1">
        
        <AnimatePresence mode="wait">
          {activeTab === 'desires' ? (
            <motion.div
               key="desires_view"
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -15 }}
               transition={{ duration: 0.25 }}
               className="space-y-4 pt-1"
            >
               {/* "此刻最想..." Desire Section - Aesthetic theme colors */}
               <div 
                  className="backdrop-blur-xl rounded-[24px] p-5.5 border border-black/[0.03] flex flex-col justify-between overflow-hidden relative min-h-[160px]"
                  style={{ backgroundColor: themeConfig.cardBg || '#ffffff' }}
               >
                  <div>
                    <h3 className="text-[12px] font-bold flex items-center gap-1.5 uppercase tracking-wider mb-2" style={{ color: themeConfig.textSecondary }}>
                      <Sparkles size={14} className="opacity-70" style={{ color: themeConfig.textSecondary }} />
                      此刻最想的事情
                    </h3>
                    <p className="text-[18px] font-semibold tracking-tight leading-relaxed py-1 min-h-[48px]" style={{ color: themeConfig.textPrimary }}>
                      「{currentThought}」
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 mt-3 pt-3 border-t border-black/5">
                    {!hasResponded ? (
                      <div className="flex flex-wrap items-center justify-start gap-3">
                        <button 
                          onClick={handleActionClick}
                          className="px-5 py-2 rounded-full font-medium text-[13px] active:scale-95 transition-all flex items-center gap-1.5 shadow-sm hover:opacity-90"
                          style={{ 
                            backgroundColor: themeConfig.textPrimary || '#333', 
                            color: themeConfig.bg || '#fff' 
                          }}
                        >
                          <Heart size={13} className="fill-current" />
                          {currentDesireObj.actionName}
                        </button>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col gap-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <div 
                            className="px-4 py-1.5 rounded-full font-semibold text-[13px] flex items-center gap-1.5 border border-black/10 bg-black/[0.03]"
                            style={{ color: themeConfig.textSecondary }}
                          >
                            <CheckCircle2 size={13} className="text-emerald-500 fill-current" />
                            已回应：{currentDesireObj.actionName}
                          </div>

                          {/* Render Next Thought button ONLY if cooldown is NOT active */}
                          {!isCooldownActive && (
                            <button 
                              onClick={handleNextThought}
                              className="px-5 py-1.5 rounded-full font-bold text-[13px] active:scale-95 transition-all flex items-center gap-1.5 shadow-sm hover:bg-rose-600 hover:text-white transition-colors animate-in fade-in zoom-in-95"
                              style={{ 
                                backgroundColor: '#e11d48',
                                color: '#ffffff'
                              }}
                            >
                              <Sparkles size={13} />
                              开启下一个念头
                            </button>
                          )}
                        </div>

                        {/* Cooldown duration persistent note */}
                        {isCooldownActive && cooldownUntil && (
                          <div className="text-[12px] opacity-85 leading-relaxed p-3 rounded-2xl border border-dashed border-black/10 flex items-start gap-2.5" style={{ backgroundColor: `${themeConfig.textPrimary}05`, color: themeConfig.textSecondary }}>
                            <span className="text-[15px] pt-0.5">💤</span>
                            <div className="flex-1">
                              <div className="font-medium text-stone-800 dark:text-stone-200">未婚夫正沉浸在被回应的甜蜜满足中...</div>
                              <div className="text-[11.5px] font-mono mt-1" style={{ color: themeConfig.textPrimary }}>
                                距离下一次思绪活跃还需等待：<span className="font-bold underline">{getRemainingTimeStr(cooldownUntil, currentTime)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
               </div>

               {/* "此刻的驱动" Drivers Progress Bars Card */}
               <div 
                  className="backdrop-blur-xl rounded-[24px] p-5 border border-black/[0.03] relative"
                  style={{ backgroundColor: themeConfig.cardBg || '#ffffff' }}
               >
                  <div className="flex justify-between items-center mb-4 pb-1 border-b border-black/5">
                     <h3 className="text-[13px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: themeConfig.textSecondary }}>
                        <Brain size={14} style={{ color: themeConfig.textSecondary }} />
                        此刻的数值驱动
                     </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5">
                     {driversList.map((item) => {
                        const val = desires[item.key] ?? 50;
                        return (
                           <div key={item.key} className="flex items-center gap-3">
                              <span className="w-10 text-[13px] font-semibold shrink-0 text-left" style={{ color: themeConfig.textSecondary }}>
                                 {item.label}
                              </span>
                              <div className="flex-1 h-3 bg-black/[0.04] dark:bg-white/[0.06] rounded-full overflow-hidden relative shadow-inner">
                                 <motion.div 
                                    className="h-full rounded-full"
                                    style={{ 
                                       background: `linear-gradient(to right, ${themeConfig.textPrimary || '#333'}22, ${themeConfig.textPrimary || '#333'})`,
                                       opacity: 0.4 + (val / 100) * 0.6
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${val}%` }}
                                    transition={{ type: 'spring', stiffness: 60, damping: 15 }}
                                 />
                              </div>
                              <span className="w-7 text-right font-mono font-bold text-[13px] shrink-0" style={{ color: themeConfig.textPrimary }}>
                                 {val}
                              </span>
                           </div>
                        );
                     })}
                  </div>
               </div>

               {/* "心里的念头" Whispers Card */}
               <div 
                  className="backdrop-blur-xl rounded-[24px] p-5 border border-black/[0.03] relative"
                  style={{ backgroundColor: themeConfig.cardBg || '#ffffff' }}
               >
                  <h3 className="text-[12px] font-bold flex items-center gap-1.5 uppercase tracking-wider mb-3 pb-1 border-b border-black/5" style={{ color: themeConfig.textSecondary }}>
                     <MessageSquareHeart size={14} style={{ color: themeConfig.textSecondary }} />
                     心底的碎碎念头
                  </h3>
                  
                  <div className="space-y-3.5 pl-1.5">
                     {subThoughts.map((t, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-[13px] text-stone-600 leading-relaxed">
                           <span className="w-1.5 h-1.5 rounded-full bg-rose-300 mt-2 shrink-0 animate-pulse"></span>
                           <p className="font-medium">{t}</p>
                        </div>
                     ))}
                  </div>
               </div>
            </motion.div>
          ) : (
            <motion.div
               key="records_view"
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -15 }}
               transition={{ duration: 0.25 }}
               className="space-y-6 pt-1"
            >
              {/* Calendar Card */}
              <div className="backdrop-blur-xl rounded-[20px] p-4 shadow-sm border border-black/[0.03]" style={{ backgroundColor: themeConfig.cardBg ? themeConfig.cardBg.replace(/0\.\d+\)/, `0.8)`) : 'rgba(255,255,255,0.8)' }}>
                 <div className="flex justify-between items-center mb-4 px-1" style={{ color: themeConfig.textPrimary }}>
                    <button 
                       className="w-8 h-8 rounded-full flex items-center justify-center opacity-60 active:opacity-100 transition-opacity bg-black/5" 
                       onClick={prevMonth}
                    >
                       <ChevronLeft size={18} className="-ml-0.5" />
                    </button>
                    <div className="font-semibold text-[16px] tracking-wide">
                        {selectedDate.getFullYear()}年 <span className="opacity-70">{selectedDate.getMonth() + 1}月</span>
                    </div>
                    <button 
                       className="w-8 h-8 rounded-full flex items-center justify-center opacity-60 active:opacity-100 transition-opacity bg-black/5" 
                       onClick={nextMonth}
                    >
                       <ChevronLeft size={18} className="rotate-180 -mr-0.5" />
                    </button>
                 </div>
                 
                 <div className="grid grid-cols-7 gap-1 text-center mb-2" style={{ color: themeConfig.textSecondary }}>
                    {['日','一','二','三','四','五','六'].map((d, i) => (
                       <div key={d} className={`text-[12px] font-medium ${i === 0 || i === 6 ? 'opacity-50' : 'opacity-80'}`}>{d}</div>
                    ))}
                 </div>
                 
                 <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                       <div key={`empty-${i}`} className="h-9"></div>
                    ))}
                    {Array.from({ length: currentMonthDays }).map((_, i) => {
                       const day = i + 1;
                       const dateStr = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day).toLocaleDateString();
                       const count = checkInCountsByDate[dateStr] || 0;
                       const isSelected = selectedDate.getDate() === day;
                       const isToday = new Date().toLocaleDateString() === dateStr;
                       
                       return (
                          <button 
                             key={day} 
                             onClick={() => handleDayClick(day)}
                             className={`h-9 rounded-[10px] flex flex-col justify-center items-center relative active:scale-90 transition-all duration-300 ${isSelected ? 'shadow-md shadow-black/10' : 'hover:bg-black/5'}`}
                             style={{
                                 backgroundColor: isSelected ? (themeConfig.textPrimary || '#333') : 'transparent',
                                 color: isSelected ? (themeConfig.bg || '#fff') : (themeConfig.textPrimary || '#333'),
                                 border: isToday && !isSelected ? `1.5px solid ${themeConfig.textSecondary}50` : 'none',
                                 opacity: isSelected ? 1 : 0.9
                             }}
                          >
                             <span className={`text-[13.5px] ${isSelected ? 'font-bold' : 'font-medium'}`}>{day}</span>
                             <div className="absolute bottom-1 flex space-x-[2.5px]">
                                {Array.from({ length: Math.min(3, count) }).map((_, ci) => (
                                   <div key={ci} className="w-[3px] h-[3px] rounded-full" style={{ backgroundColor: isSelected ? (themeConfig.bg || '#fff') : (themeConfig.textSecondary || '#8e8e93') }}></div>
                                ))}
                                {count > 3 && <div className="w-[3px] h-[3px] rounded-full" style={{ backgroundColor: isSelected ? (themeConfig.bg || '#fff') : (themeConfig.textSecondary || '#8e8e93') }}></div>}
                             </div>
                          </button>
                       );
                    })}
                 </div>
              </div>

              {/* Timeline Title */}
              <div className="flex items-center justify-between px-2 mb-4">
                 <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-black/5">
                       <Clock size={16} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-[16px] font-semibold">全天记录 Timeline</h3>
                 </div>
                 <div className="text-[12px] font-semibold px-3 py-1 rounded-full bg-black/5" style={{ color: themeConfig.textSecondary }}>
                    本日 {selectedDayCheckIns.length} 条记录
                 </div>
              </div>

              {/* Timeline Container */}
              <div className="px-2">
                 {selectedDayCheckIns.length === 0 ? (
                     <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-12 backdrop-blur-md rounded-[20px]"
                        style={{ backgroundColor: themeConfig.cardBg ? themeConfig.cardBg.replace(/0\.\d+\)/, `0.5)`) : 'rgba(255,255,255,0.5)', border: `1px dashed ${themeConfig.textSecondary}30` }}
                     >
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-black/5">
                           <Navigation size={28} className="opacity-50" />
                        </div>
                        <p className="text-[14px] font-medium" style={{ color: themeConfig.textSecondary }}>这一天十分安静，未婚夫没有留下痕迹哦</p>
                     </motion.div>
                 ) : (
                     <div className="space-y-4 relative">
                        <div className="absolute left-[12px] top-4 bottom-4 w-px opacity-20" style={{ backgroundImage: `linear-gradient(to bottom, ${themeConfig.textPrimary || '#333'}, transparent)` }}></div>
                        <AnimatePresence>
                           {selectedDayCheckIns.map((record, index) => (
                               <motion.div 
                                  initial={{ opacity: 0, x: -15 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.04 }}
                                  key={`${record.id}-${index}`} 
                                  className="relative pl-8"
                               >
                                   {/* Timeline Dot */}
                                   <div className="absolute left-[7.5px] top-[18px] w-[9px] h-[9px] rounded-full shadow-sm" style={{ backgroundColor: themeConfig.textPrimary || '#333' }}></div>
                                   
                                   <div className="rounded-[18px] p-4.5 shadow-sm border border-black/5 backdrop-blur-md" style={{ backgroundColor: themeConfig.cardBg || '#fff' }}>
                                      <div className="flex items-center justify-between mb-2.5 border-b border-black/[0.03] pb-1.5">
                                         <div className="flex items-center space-x-1.5 opacity-80" style={{ color: themeConfig.textPrimary }}>
                                            <CheckCircle2 size={15} className="text-pink-400" />
                                            <span className="text-[13px] font-bold">已同步至未婚夫日志</span>
                                         </div>
                                         <div className="text-[11.5px] font-mono font-medium text-stone-500" style={{ color: themeConfig.textSecondary }}>
                                            {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                         </div>
                                      </div>
                                      
                                      {record.text && (
                                         <div className="text-[13.5px] leading-relaxed tracking-wide opacity-90 text-[currentColor] whitespace-pre-line">
                                            {record.text}
                                         </div>
                                      )}
                                      
                                      {record.imageUrl && (
                                         <div className="relative mt-2 rounded-[12px] overflow-hidden border border-black/5 bg-black/5">
                                            <img src={record.imageUrl} alt="check-in" className="w-full max-h-[220px] object-cover" referrerPolicy="no-referrer" />
                                         </div>
                                      )}
                                   </div>
                               </motion.div>
                           ))}
                        </AnimatePresence>
                     </div>
                 )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Local Self-contained Toast Overlay */}
      <AnimatePresence>
         {localToast && (
            <motion.div 
               initial={{ opacity: 0, y: 20, scale: 0.95 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               exit={{ opacity: 0, y: 10, scale: 0.95 }}
               className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl bg-stone-900/90 text-white font-medium text-[13px] shadow-xl backdrop-blur-md flex items-center gap-2 max-w-[85%] text-center"
            >
               <Sparkles size={14} className="text-pink-300 shrink-0" />
               <span className="leading-snug">{localToast}</span>
            </motion.div>
         )}
      </AnimatePresence>

      {/* Floating hearts particles layer */}
      <AnimatePresence>
        {hearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ opacity: 1, scale: 0.5, y: heart.y, x: heart.x }}
            animate={{ 
              opacity: 0, 
              scale: [0.5, 1.2, 0.8], 
              y: heart.y - 150 - Math.random() * 80, 
              x: heart.x + (Math.random() - 0.5) * 80 
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              pointerEvents: 'none',
              zIndex: 99,
              fontSize: '24px',
            }}
          >
            {heart.char}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Memory Archive custom page overlay */}
      <AnimatePresence>
        {showArchive && (
          <MemoryArchiveView 
            onClose={onClose} 
            themeConfig={themeConfig} 
            checkinsBg={checkinsBg}
            onReturnToCheckin={() => setShowArchive(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
