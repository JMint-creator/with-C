import { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  Mail, 
  CalendarDays, 
  BookHeart, 
  Gift, 
  Film, 
  CheckSquare, 
  MapPin, 
  Palette, 
  Settings, 
  Database, 
  Library, 
  Cat,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  Image as ImageIcon,
  Type,
  Droplet
} from 'lucide-react';
import { motion } from 'motion/react';

const apps = [
  { name: '聊天', icon: MessageCircle },
  { name: '信箱', icon: Mail },
  { name: '心情手帐', icon: CalendarDays },
  { name: '日记本', icon: BookHeart },
  { name: '心愿清单', icon: Gift },
  { name: '观影阅读', icon: Film },
  { name: 'Todo', icon: CheckSquare },
  { name: '打卡', icon: MapPin },
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
        <span className="text-[16px] text-[#333]">{label}</span>
        <div className="flex items-center gap-2">
          {onChange ? (
            <input 
              type="text" 
              value={value} 
              onChange={(e) => onChange(e.target.value)} 
              className="text-[15px] text-[#888] text-right bg-transparent outline-none max-w-[150px]"
              placeholder="输入..."
            />
          ) : (
             <span className="text-[15px] text-[#888] truncate max-w-[120px]">{value}</span>
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

export default function App() {
  const [view, setView] = useState<'home' | 'appearance' | 'data'>('home');

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
  const [chatAvatar1, setChatAvatar1] = useLocalState('app_chatAvatar1', '');
  const [chatAvatar2, setChatAvatar2] = useLocalState('app_chatAvatar2', '');
  const [chatCss, setChatCss] = useLocalState('app_chatCss', '');
  const [chatFont, setChatFont] = useLocalState('app_chatFont', '');

  // Refs
  const wallpaperInputRef = useRef<HTMLInputElement>(null);
  const profileBgInputRef = useRef<HTMLInputElement>(null);
  const avatar1InputRef = useRef<HTMLInputElement>(null);
  const avatar2InputRef = useRef<HTMLInputElement>(null);
  const chatAvatar1InputRef = useRef<HTMLInputElement>(null);
  const chatAvatar2InputRef = useRef<HTMLInputElement>(null);
  const cssInputRef = useRef<HTMLInputElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);

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
        alert(alertMsg);
      };
      reader.readAsText(e.target.files[0]);
    }
    e.target.value = '';
  }

  const currentThemeConfig = colorThemes[theme];

  const clearData = () => {
    if (window.confirm('确定要清除所有本地数据并恢复默认设置吗？操作不可逆！')) {
        window.localStorage.clear();
        window.location.reload();
    }
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

  if (view === 'data') {
    return (
      <div className="fixed inset-0 bg-[#F2F2F7] z-50 flex flex-col font-sans overflow-x-hidden overflow-y-auto w-full">
        {chatFont && <style dangerouslySetInnerHTML={{ __html: `@font-face { font-family: 'CustomChatFont'; src: url('${chatFont}'); } * { font-family: 'CustomChatFont', sans-serif !important; }`}} />}
        <div 
          className="w-full flex items-center justify-between px-3 pb-3 bg-[#F2F2F7] sticky top-0 z-10 border-b border-[#c6c6c8]/50 shadow-sm"
          style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
        >
          <button onClick={() => setView('home')} className="text-[#007AFF] text-[17px] flex items-center active:opacity-50 transition-opacity">
            <ChevronLeft size={24} className="-ml-1.5" />返回
          </button>
          <span className="text-[17px] font-semibold text-black">数据管理</span>
          <div className="w-[60px]"></div>
        </div>
        <div className="w-full max-w-md mx-auto px-4 pb-12 pt-6">
           <div className="mb-8">
              <div className="text-[13px] text-[#6d6d72] ml-4 mb-2 uppercase tracking-wide">本地数据</div>
              <div className="bg-white rounded-[10px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                 <SettingItem icon={Database} label="清除所有本地数据" value="" onClick={clearData} hideBorder={true} />
              </div>
              <p className="text-[12px] text-[#8e8e93] mt-3 ml-4 leading-relaxed">
                * 操作不可逆，将清除壁纸、头像、文本等所有设置。
              </p>
           </div>
        </div>
      </div>
    );
  }

  if (view === 'appearance') {
    return (
      <div className="fixed inset-0 bg-[#F2F2F7] z-50 flex flex-col font-sans overflow-x-hidden overflow-y-auto w-full">
        {chatFont && <style dangerouslySetInnerHTML={{ __html: `@font-face { font-family: 'CustomChatFont'; src: url('${chatFont}'); } * { font-family: 'CustomChatFont', sans-serif !important; }`}} />}
        {/* Header */}
        <div 
          className="w-full flex items-center justify-between px-3 pb-3 bg-[#F2F2F7] sticky top-0 z-10 border-b border-[#c6c6c8]/50 shadow-sm"
          style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
        >
          <button onClick={() => setView('home')} className="text-[#007AFF] text-[17px] flex items-center active:opacity-50 transition-opacity">
            <ChevronLeft size={24} className="-ml-1.5" />返回
          </button>
          <span className="text-[17px] font-semibold text-black">外观设置</span>
          <div className="w-[60px]"></div>
        </div>

        <div className="w-full max-w-md mx-auto px-4 pb-12 pt-6">
           {/* 1. 界面美化 */}
           <div className="mb-8">
              <div className="text-[13px] text-[#6d6d72] ml-4 mb-2 uppercase tracking-wide">界面美化</div>
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
              <div className="text-[13px] text-[#6d6d72] ml-4 mb-2 uppercase tracking-wide">主题配色</div>
              <div className="bg-white rounded-[10px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                 <SettingItem icon={Palette} label="暖冬麦色" value={theme === 'warm' ? '当前' : ''} onClick={() => setTheme('warm')} />
                 <SettingItem icon={Palette} label="薄荷微风" value={theme === 'mint' ? '当前' : ''} onClick={() => setTheme('mint')} />
                 <SettingItem icon={Palette} label="春日落樱" value={theme === 'sakura' ? '当前' : ''} onClick={() => setTheme('sakura')} />
                 <SettingItem icon={Palette} label="宁静海蓝" value={theme === 'blue' ? '当前' : ''} onClick={() => setTheme('blue')} />
                 <SettingItem icon={Palette} label="梦幻香芋" value={theme === 'purple' ? '当前' : ''} onClick={() => setTheme('purple')} hideBorder={true}/>
              </div>
           </div>

           {/* 3. 聊天设置 */}
           <div className="mb-8">
              <div className="text-[13px] text-[#6d6d72] ml-4 mb-2 uppercase tracking-wide">聊天设置</div>
              <div className="bg-white rounded-[10px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                 <SettingItem icon={Users} label="我方聊天头像" value={chatAvatar1 ? '已上传' : '未设置'} onClick={() => chatAvatar1InputRef.current?.click()} />
                 <SettingItem icon={Users} label="对方聊天头像" value={chatAvatar2 ? '已上传' : '未设置'} onClick={() => chatAvatar2InputRef.current?.click()} />
                 <SettingItem icon={Droplet} label="聊天气泡 CSS" value={chatCss ? '已上传' : '未设置'} onClick={() => cssInputRef.current?.click()} />
                 <SettingItem icon={Type} label="聊天字体 TTF" value={chatFont ? '已上传' : '未设置'} onClick={() => fontInputRef.current?.click()} hideBorder={true}/>
              </div>
           </div>
        </div>

        {/* Hidden inputs */}
        <input type="file" ref={wallpaperInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setWallpaper)} />
        <input type="file" ref={profileBgInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setProfileBg)} />
        <input type="file" ref={avatar1InputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setAvatar1)} />
        <input type="file" ref={avatar2InputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setAvatar2)} />
        
        <input type="file" ref={chatAvatar1InputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setChatAvatar1)} />
        <input type="file" ref={chatAvatar2InputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setChatAvatar2)} />
        
        <input type="file" ref={cssInputRef} className="hidden" accept=".css" onChange={(e) => handleTextChange(e, setChatCss, 'CSS已加载 (在主页面和聊天中生效)')} />
        <input type="file" ref={fontInputRef} className="hidden" accept=".ttf,.otf,.woff,.woff2" onChange={(e) => handleFileChange(e, setChatFont)} />
      </div>
    )
  }

  return (
    <div 
      className="flex-1 w-full text-[#333] font-sans flex flex-col items-center overflow-x-hidden selection:bg-[#DCD6CE]/50 transition-colors duration-500 relative"
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
        className="w-full max-w-[420px] mx-auto flex flex-col justify-between flex-1 gap-4 px-4 shrink-0"
        style={{
          paddingBottom: 'max(2rem, calc(1.5rem + env(safe-area-inset-bottom)))',
          paddingTop: 'max(1.5rem, calc(0.5rem + env(safe-area-inset-top)))'
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
              <span className="text-[15px] font-light" style={{color: currentThemeConfig.textSecondary}}>&</span>
              <h1 className="text-[19px] font-semibold tracking-wide">{name2}</h1>
            </div>
            <p className="text-[13px] leading-[1.6] text-center whitespace-pre-line" style={{color: currentThemeConfig.textSecondary}}>{motto}</p>
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
            <div className="text-[10px] mb-2" style={{color: currentThemeConfig.textSecondary}}>播放中</div>
            <div className="font-medium text-[13px] mb-0.5 truncate text-[#333]">Clair de Lune</div>
            <div className="text-[10px] mb-3 truncate" style={{color: currentThemeConfig.textSecondary}}>Debussy</div>
            
            <div className="w-full h-[3px] bg-black/5 rounded-full mb-4 relative mt-auto">
              <div className="absolute left-0 top-0 h-full w-[40%] rounded-full" style={{backgroundColor: currentThemeConfig.textSecondary}}></div>
            </div>
            
            <div className="flex justify-between items-center px-1">
              <button className="w-7 h-7 rounded-full bg-black/[0.03] flex items-center justify-center transition-colors hover:bg-black/[0.06] active:scale-95" style={{color: currentThemeConfig.textSecondary}}>
              </button>
              <button className="w-8 h-8 rounded-full bg-black/[0.04] flex items-center justify-center transition-colors hover:bg-black/[0.07] active:scale-95" style={{color: currentThemeConfig.textSecondary}}>
              </button>
              <button className="w-7 h-7 rounded-full bg-black/[0.03] flex items-center justify-center transition-colors hover:bg-black/[0.06] active:scale-95" style={{color: currentThemeConfig.textSecondary}}>
              </button>
            </div>
          </motion.div>

          {/* Anniversary Widget */}
          <motion.div 
            className="backdrop-blur-xl border border-white/60 rounded-[24px] p-4 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.06)] flex flex-col justify-between transition-colors duration-500"
            style={{ backgroundColor: currentThemeConfig.cardBg }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="text-[10px]" style={{color: currentThemeConfig.textSecondary}}>在一起</div>
            <div className="flex items-baseline gap-1.5 my-1">
              <span className="text-[38px] leading-[1.1] font-light tracking-tight" style={{color: currentThemeConfig.numColor}}>231</span>
            </div>
            <span className="text-[10px] mb-auto" style={{color: currentThemeConfig.textSecondary}}>天</span>
            
            <div className="text-[9px] mt-3" style={{color: currentThemeConfig.textSecondary}}>2024 · 10 · 28</div>
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
            <div key={app.name} className="flex flex-col items-center gap-1.5 cursor-pointer group">
              <div 
                className="w-[66px] h-[66px] rounded-[22px] bg-white/50 backdrop-blur-lg border border-white/60 shadow-[0_4px_20px_-6px_rgba(0,0,0,0.06)] flex items-center justify-center group-hover:bg-white/60 transition-all group-active:scale-95"
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
          className="backdrop-blur-xl border border-white/60 rounded-[32px] p-3.5 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.06)] grid grid-cols-4 shrink-0 items-center justify-items-center transition-colors duration-500 mb-3"
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
                if (tool.name === '数据管理') setView('data');
              }}
            >
              <div 
                className="w-[52px] h-[52px] rounded-[18px] bg-white/50 backdrop-blur-md border border-white/80 shadow-[0_4px_12px_-6px_rgba(0,0,0,0.04)] flex items-center justify-center group-hover:bg-white/65 transition-all group-active:scale-95"
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
  );
}
