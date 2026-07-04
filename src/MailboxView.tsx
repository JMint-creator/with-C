import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  PenSquare, 
  Send, 
  MailOpen, 
  Mail, 
  Clock, 
  Trash2, 
  Sparkles, 
  ArrowUpRight, 
  CheckCircle2, 
  Inbox,
  Bookmark,
  FileText,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MailLetter {
  id: string;
  sentAt: number;
  content: string;
  replyExpectedAt: number;
  replyContent: string | null;
  speed: 'express' | 'standard' | 'slow';
  category: 'daily' | 'long_letter' | 'questionnaire';
  questions?: string[];
  questionOptions?: string[][];
}

interface MailboxViewProps {
  onClose: () => void;
  themeConfig: any;
  cardGroups: { id: string, name: string, cards: string[] }[];
  myNickname?: string;
  mjNickname?: string;
  myHandle?: string;
  mjHandle?: string;
  avatar1?: string;
  avatar2?: string;
}

// Module-level reply generator function to avoid recreation on render
const generateReply = (letter: MailLetter, allAvailableCards: string[]) => {
  if (allAvailableCards.length === 0) {
    return '因为字卡库为空，梦角暂时无法抽取字卡。请先去添加字卡吧。';
  }

  const drawCard = () => allAvailableCards[Math.floor(Math.random() * allAvailableCards.length)];

  // 1. 梦向问卷 (questionnaire)
  if (letter.category === 'questionnaire') {
    const qs = letter.questions || [];
    const qOpts = letter.questionOptions || [];
    if (qs.length === 0) {
      return '梦向问卷中未包含任何有效问题。';
    }
    return qs.map((q, idx) => {
      const opts = (qOpts[idx] || []).filter(o => o.trim().length > 0);
      let answer = '';
      if (opts.length > 0) {
        // Companion chooses one option
        const chosenIdx = Math.floor(Math.random() * opts.length);
        const chosenOpt = opts[chosenIdx];
        const letterPrefix = String.fromCharCode(65 + chosenIdx); // A, B, C, D...
        answer = `${letterPrefix}. ${chosenOpt}`;
      } else {
        // Fallback: draw random cards
        const cardCount = Math.floor(Math.random() * 2) + 1; // 1 or 2 cards
        const cards = [];
        for (let i = 0; i < cardCount; i++) {
          cards.push(drawCard());
        }
        answer = cards.join(' ');
      }
      return `Q${idx + 1}：${q}\nA${idx + 1}：${answer}`;
    }).join('\n\n');
  }

  // 2. 日常碎碎念 (daily)
  if (letter.category === 'daily') {
    // Differentiate card counts and punctuation by speed
    let cardCount = 4;
    let punctuationOptions = ['，', '。', ' '];
    
    if (letter.speed === 'express') {
      // Short, swift reaction
      cardCount = Math.floor(Math.random() * 2) + 2; // 2 to 3 cards
      punctuationOptions = ['，', ' '];
    } else if (letter.speed === 'slow') {
      // Richer, longer daily feedback
      cardCount = Math.floor(Math.random() * 3) + 7; // 7 to 9 cards
      punctuationOptions = ['，', '。', '、', ' '];
    } else {
      // Standard
      cardCount = Math.floor(Math.random() * 3) + 4; // 4 to 6 cards
    }

    const parts = [];
    for (let i = 0; i < cardCount; i++) {
      parts.push(drawCard());
      if (i < cardCount - 1) {
        parts.push(punctuationOptions[Math.floor(Math.random() * punctuationOptions.length)]);
      } else {
        parts.push('。');
      }
    }
    return parts.join('');
  }

  // 3. 慢递长信 (long_letter)
  // Differentiate card counts and paragraph layouts by speed
  let cardCount = 12;
  const midPunctuations = ['，', '。', '……', '；', '，', '。'];
  
  if (letter.speed === 'express') {
    cardCount = Math.floor(Math.random() * 3) + 5; // 5 to 7 cards
  } else if (letter.speed === 'slow') {
    cardCount = Math.floor(Math.random() * 7) + 18; // 18 to 24 cards
  } else {
    cardCount = Math.floor(Math.random() * 5) + 10; // 10 to 14 cards
  }

  let result = '';
  // For slow delivery, let's create multiple paragraphs
  const paragraphPoints: number[] = [];
  if (letter.speed === 'slow') {
    paragraphPoints.push(Math.floor(cardCount / 3));
    paragraphPoints.push(Math.floor((cardCount * 2) / 3));
  } else {
    paragraphPoints.push(Math.floor(cardCount / 2));
  }

  for (let i = 0; i < cardCount; i++) {
    result += drawCard();
    if (i < cardCount - 1) {
      result += midPunctuations[Math.floor(Math.random() * midPunctuations.length)];
      if (paragraphPoints.includes(i)) {
        result += '\n\n'; // paragraph split
      }
    } else {
      result += '。';
    }
  }
  return result;
};

export function MailboxView({ 
  onClose, 
  themeConfig, 
  cardGroups,
  myNickname = '我',
  mjNickname = '梦角',
  myHandle = 'me',
  mjHandle = 'mengjiao',
  avatar1,
  avatar2
}: MailboxViewProps) {
  const [letters, setLetters] = useState<MailLetter[]>(() => {
    try {
      const saved = window.localStorage.getItem('app_mailbox_letters');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Map old structures to the new three categories
        return parsed.map((l: any) => {
          let category = l.category;
          if (category === 'mood' || category === 'wish' || category === 'secret') {
            category = 'long_letter';
          }
          return {
            ...l,
            speed: l.speed || 'standard',
            category: category || 'daily'
          };
        });
      }
      return [];
    } catch {
      return [];
    }
  });

  const [showCompose, setShowCompose] = useState(false);
  const [content, setContent] = useState('');
  const [selectedSpeed, setSelectedSpeed] = useState<'express' | 'standard' | 'slow'>('standard');
  const [selectedCategory, setSelectedCategory] = useState<'daily' | 'long_letter' | 'questionnaire'>('daily');
  const [viewingLetter, setViewingLetter] = useState<MailLetter | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'replied'>('all');

  // Default romantic questionnaires to inspire the user
  const [questionnaireQuestions, setQuestionnaireQuestions] = useState<string[]>(() => [
    '今天见面你想穿什么风格的衣服？',
    '如果送你一个手工礼物，你最想要什么？',
    '今晚我们去哪里散步更好？'
  ]);

  const [questionnaireOptions, setQuestionnaireOptions] = useState<string[][]>(() => [
    ['温柔学院风', '慵懒休闲风', '优雅正装', '神秘酷黑风'],
    ['针织围巾', '陶艺杯子', '手绘相框', '定制香薰'],
    ['静谧的湖边公园', '霓虹闪烁的闹市街区', '可以看星星的山顶', '温馨的学校操场']
  ]);

  const [tempOptionInputs, setTempOptionInputs] = useState<{[key: number]: string}>({});

  // Auto-replies check
  useEffect(() => {
    let changed = false;
    const now = Date.now();
    const allAvailableCards = cardGroups.flatMap(g => g.cards).filter(c => c.trim().length > 0);

    const updated = letters.map((letter) => {
      if (!letter.replyContent && now >= letter.replyExpectedAt) {
        changed = true;
        const replyText = generateReply(letter, allAvailableCards);
        return { ...letter, replyContent: replyText };
      }
      return letter;
    });

    if (changed) {
      setLetters(updated);
    }
  }, [letters, cardGroups]);

  useEffect(() => {
    window.localStorage.setItem('app_mailbox_letters', JSON.stringify(letters));
  }, [letters]);

  const handleSend = () => {
    let finalContent = '';
    let qs: string[] | undefined = undefined;

    if (selectedCategory === 'questionnaire') {
      const activeQs = questionnaireQuestions.filter(q => q.trim().length > 0);
      if (activeQs.length === 0) return;
      finalContent = activeQs.map((q, idx) => `Q${idx + 1}：${q}`).join('\n');
      qs = activeQs;
    } else {
      if (!content.trim()) return;
      finalContent = content.trim();
    }
    
    // Delivery hours
    let hours = 8;
    if (selectedSpeed === 'express') {
      hours = 1 + Math.random() * 1;
    } else if (selectedSpeed === 'slow') {
      hours = 18 + Math.random() * 6;
    } else {
      hours = 6 + Math.random() * 4;
    }

    const expectedAt = Date.now() + hours * 60 * 60 * 1000;
    
    const newLetter: MailLetter = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      sentAt: Date.now(),
      content: finalContent,
      replyExpectedAt: expectedAt,
      replyContent: null,
      speed: selectedSpeed,
      category: selectedCategory,
      questions: qs,
      questionOptions: selectedCategory === 'questionnaire' ? questionnaireOptions : undefined
    };

    setLetters([newLetter, ...letters]);
    setContent('');
    setQuestionnaireQuestions([
      '今天见面你想穿什么风格的衣服？',
      '如果送你一个手工礼物，你最想要什么？',
      '今晚我们去哪里散步更好？'
    ]);
    setQuestionnaireOptions([
      ['温柔学院风', '慵懒休闲风', '优雅正装', '神秘酷黑风'],
      ['针织围巾', '陶艺杯子', '手绘相框', '定制香薰'],
      ['静谧的湖边公园', '霓虹闪烁的闹市街区', '可以看星星的山顶', '温馨的学校操场']
    ]);
    setTempOptionInputs({});
    setSelectedSpeed('standard');
    setSelectedCategory('daily');
    setShowCompose(false);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const getExpectedTimeLabel = (ts: number) => {
    const d = new Date(ts);
    let prefix = '';
    
    const dDate = new Date(ts);
    dDate.setHours(0,0,0,0);
    const nowDate = new Date();
    nowDate.setHours(0,0,0,0);
    
    const diffDays = Math.round((dDate.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
       prefix = '今天';
    } else if (diffDays === 1) {
       prefix = '明天';
    } else {
       prefix = `${d.getMonth() + 1}月${d.getDate()}日`;
    }
    return `${prefix} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
     e.stopPropagation();
     setLetters(letters.filter(l => l.id !== id));
     if (viewingLetter?.id === id) {
       setViewingLetter(null);
     }
  };

  const filteredLetters = letters.filter(l => {
    if (activeTab === 'pending') return !l.replyContent;
    if (activeTab === 'replied') return !!l.replyContent;
    return true;
  });

  const getCategoryLabel = (cat: string) => {
    switch(cat) {
      case 'daily': return '日常碎碎念';
      case 'long_letter': return '慢递长信';
      case 'questionnaire': return '梦向问卷';
      default: return '信件';
    }
  };

  const getSpeedLabel = (sp: string) => {
    switch(sp) {
      case 'express': return '特快送达';
      case 'slow': return '慢递送达';
      default: return '标准送达';
    }
  };

  return (
    <div 
      className="absolute inset-0 flex flex-col overflow-hidden text-[14px]" 
      style={{ 
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif', 
        backgroundColor: themeConfig.bg || '#F8F9FA' 
      }}
    >
      {/* Top Header */}
      <div 
        className="w-full flex flex-col px-4 pb-4 sticky top-0 z-20 border-b backdrop-blur-xl transition-all"
        style={{ 
          paddingTop: 'calc(0.75rem + env(safe-area-inset-top))',
          backgroundColor: themeConfig.bg ? `${themeConfig.bg}EE` : '#FFFFFFEE',
          borderColor: themeConfig.textSecondary ? `${themeConfig.textSecondary}15` : 'rgba(0,0,0,0.06)'
        }}
      >
        <div className="flex items-center justify-between h-12">
          <button onClick={onClose} className="p-2 -ml-2 active:opacity-60 transition-opacity rounded-full bg-black/5 dark:bg-white/5">
            <ChevronLeft size={20} style={{ color: themeConfig.textPrimary }} />
          </button>
          
          <div className="font-semibold text-[16px] tracking-tight" style={{ color: themeConfig.textPrimary }}>
            <span>信箱</span>
          </div>

          <button 
            onClick={() => setShowCompose(true)} 
            className="p-2 -mr-2 active:scale-95 transition-transform rounded-full"
            style={{ 
              backgroundColor: themeConfig.numColor || '#007AFF',
              color: '#FFFFFF'
            }}
          >
            <PenSquare size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-xl mt-3.5 w-full">
          {[
            { id: 'all', label: '全部' },
            { id: 'pending', label: '投递中' },
            { id: 'replied', label: '已回信' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="flex-1 py-1.5 text-[12.5px] font-semibold rounded-lg transition-all"
              style={{
                backgroundColor: activeTab === tab.id ? (themeConfig.cardBg || '#FFFFFF') : 'transparent',
                color: activeTab === tab.id ? themeConfig.textPrimary : themeConfig.textSecondary,
                boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.04)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-safe">
        {filteredLetters.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-20 text-center">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-sm"
              style={{ 
                backgroundColor: themeConfig.numColor ? `${themeConfig.numColor}10` : 'rgba(0,122,255,0.06)',
                border: `1px solid ${themeConfig.numColor || '#007AFF'}15`
              }}
            >
              <MailOpen size={28} style={{ color: themeConfig.numColor || '#007AFF' }} />
            </div>
            <h3 className="font-semibold text-[16px] tracking-tight mb-1" style={{ color: themeConfig.textPrimary }}>
              写封信给 {mjNickname} 吧
            </h3>
            <p className="text-[13px] max-w-[260px] leading-relaxed" style={{ color: themeConfig.textSecondary }}>
              把当下的日常、长信或是专属问卷寄出，{mjNickname} 会从字卡库中挑选字卡回复你。
            </p>
            <button 
              onClick={() => setShowCompose(true)} 
              className="mt-6 px-6 py-2.5 rounded-full text-[13.5px] font-semibold shadow-sm hover:opacity-95 active:scale-95 transition-all text-white"
              style={{ backgroundColor: themeConfig.numColor || '#007AFF' }}
            >
              寄出一封新信
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredLetters.map((letter) => {
                const isReplied = !!letter.replyContent;
                return (
                  <motion.div
                    key={letter.id}
                    layoutId={`letter-card-${letter.id}`}
                    onClick={() => setViewingLetter(letter)}
                    className="p-5 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden active:scale-[0.99] shadow-sm backdrop-blur-md"
                    style={{
                      backgroundColor: themeConfig.cardBg || 'rgba(255, 255, 255, 0.95)',
                      borderColor: themeConfig.textSecondary ? `${themeConfig.textSecondary}10` : 'rgba(0,0,0,0.05)'
                    }}
                  >
                    {/* Header: User Profile styled after reference screenshot */}
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center gap-3">
                        {avatar1 ? (
                          <img src={avatar1} className="w-10 h-10 rounded-full object-cover border border-black/5" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold text-[14px]">
                            {myNickname[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-[13.5px]" style={{ color: themeConfig.textPrimary }}>{myNickname}</div>
                          <div className="text-[11px] font-mono opacity-50" style={{ color: themeConfig.textSecondary }}>@{myHandle}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => handleDelete(letter.id, e)}
                          className="p-1.5 rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 active:opacity-60 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Preview Content */}
                    <p className="text-[13.5px] leading-relaxed line-clamp-3 mb-3.5 font-medium whitespace-pre-wrap" style={{ color: themeConfig.textPrimary }}>
                      {letter.content.replace(/^📋 梦向问卷：\n/, '').replace(/^梦向问卷：\n/, '')}
                    </p>

                    {/* Lower Reference-inspired Interaction Bar */}
                    <div 
                      className="flex items-center justify-between pt-3 border-t text-[11px] font-medium"
                      style={{ borderColor: themeConfig.textSecondary ? `${themeConfig.textSecondary}10` : 'rgba(0,0,0,0.05)' }}
                    >
                      <div className="flex items-center gap-1.5 opacity-55" style={{ color: themeConfig.textSecondary }}>
                        <span>#1 Following</span>
                        <span>•</span>
                        <span>{getCategoryLabel(letter.category)}</span>
                        <span>•</span>
                        <span>{getSpeedLabel(letter.speed)}</span>
                      </div>

                      <div className="flex items-center gap-1" style={{ color: isReplied ? (themeConfig.numColor || '#007AFF') : themeConfig.textSecondary }}>
                        <Clock size={11} className="opacity-75" />
                        <span>{isReplied ? '已回信' : '投递中'}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      <AnimatePresence>
        {showCompose && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="absolute inset-0 z-40 flex flex-col"
            style={{ backgroundColor: themeConfig.bg || '#F8F9FA' }}
          >
            {/* Modal Header */}
            <div 
              className="w-full flex items-center justify-between px-4 pb-3 border-b backdrop-blur-xl z-10"
              style={{ 
                paddingTop: 'calc(0.75rem + env(safe-area-inset-top))', 
                backgroundColor: themeConfig.bg ? `${themeConfig.bg}EE` : '#FFFFFFEE',
                borderColor: themeConfig.textSecondary ? `${themeConfig.textSecondary}12` : 'rgba(0,0,0,0.05)'
              }}
            >
              <button 
                onClick={() => setShowCompose(false)} 
                className="text-[14.5px] font-semibold px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ color: themeConfig.textSecondary }}
              >
                取消
              </button>
              
              <h2 className="text-[16px] font-semibold tracking-tight" style={{ color: themeConfig.textPrimary }}>
                撰写信件
              </h2>

              <button 
                onClick={handleSend} 
                disabled={selectedCategory === 'questionnaire' ? !questionnaireQuestions.some(q => q.trim().length > 0) : !content.trim()} 
                className="text-[14.5px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 transition-all disabled:opacity-40 disabled:scale-100 active:scale-95 text-white" 
                style={{ 
                  backgroundColor: (selectedCategory === 'questionnaire' ? questionnaireQuestions.some(q => q.trim().length > 0) : content.trim()) ? (themeConfig.numColor || '#007AFF') : 'transparent',
                  color: (selectedCategory === 'questionnaire' ? questionnaireQuestions.some(q => q.trim().length > 0) : content.trim()) ? '#FFFFFF' : (themeConfig.textSecondary || '#8E8E93')
                }}
              >
                <Send size={14} />
                <span>寄出</span>
              </button>
            </div>

            {/* Form Scroll Content */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 max-w-[620px] mx-auto w-full pb-safe">
              
              {/* Category Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold tracking-wider uppercase px-1 opacity-70" style={{ color: themeConfig.textSecondary }}>
                  信件类型
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'daily', label: '日常碎碎念', desc: '分享琐碎的温暖瞬间，简单日常的互动' },
                    { id: 'long_letter', label: '慢递长信', desc: '见字如面，写下满纸的深切思念与悄悄话' },
                    { id: 'questionnaire', label: '梦向问卷', desc: '由你编写问题列表，梦角从字卡库中抽字卡回答' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id as any)}
                      className="p-3.5 rounded-xl border text-left transition-all active:scale-[0.98] flex flex-col justify-center"
                      style={{
                        backgroundColor: selectedCategory === cat.id ? `${themeConfig.numColor || '#007AFF'}08` : (themeConfig.cardBg || '#FFFFFF'),
                        borderColor: selectedCategory === cat.id ? (themeConfig.numColor || '#007AFF') : 'rgba(0,0,0,0.06)'
                      }}
                    >
                      <div className="font-semibold text-[13px]" style={{ color: selectedCategory === cat.id ? (themeConfig.numColor || '#007AFF') : themeConfig.textPrimary }}>
                        {cat.label}
                      </div>
                      <div className="text-[11px] opacity-60 mt-0.5" style={{ color: themeConfig.textSecondary }}>
                        {cat.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Speed Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold tracking-wider uppercase px-1 opacity-70" style={{ color: themeConfig.textSecondary }}>
                  时空投递速度
                </label>
                <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-xl gap-1">
                  {[
                    { id: 'express', label: '特快投递', desc: '1-2小时' },
                    { id: 'standard', label: '标准慢递', desc: '6-10小时' },
                    { id: 'slow', label: '深空漂流', desc: '18-24小时' }
                  ].map(sp => (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() => setSelectedSpeed(sp.id as any)}
                      className="flex-1 py-2 px-1.5 rounded-lg flex flex-col items-center transition-all"
                      style={{
                        backgroundColor: selectedSpeed === sp.id ? (themeConfig.cardBg || '#FFFFFF') : 'transparent',
                        boxShadow: selectedSpeed === sp.id ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
                      }}
                    >
                      <span className="text-[12.5px] font-semibold" style={{ color: selectedSpeed === sp.id ? themeConfig.textPrimary : themeConfig.textSecondary }}>
                        {sp.label}
                      </span>
                      <span className="text-[10px] opacity-50 font-mono mt-0.5" style={{ color: themeConfig.textSecondary }}>
                        {sp.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Questionnaire Input list OR Textarea */}
              {selectedCategory === 'questionnaire' ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[11px] font-bold tracking-wider uppercase opacity-70" style={{ color: themeConfig.textSecondary }}>
                      问卷问题列表 (最多6题)
                    </label>
                    <span className="text-[11px] opacity-50 font-mono">已添加 {questionnaireQuestions.length}/6 题</span>
                  </div>
                  
                  <div className="space-y-3">
                    {questionnaireQuestions.map((q, idx) => (
                      <div 
                        key={idx} 
                        className="p-3.5 rounded-2xl border transition-all space-y-3"
                        style={{ 
                          backgroundColor: themeConfig.cardBg || '#FFFFFF', 
                          borderColor: 'rgba(0,0,0,0.06)' 
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-mono font-bold text-gray-400 shrink-0">Q{idx + 1}</span>
                          <input
                            type="text"
                            value={q}
                            onChange={(e) => {
                              const newQs = [...questionnaireQuestions];
                              newQs[idx] = e.target.value;
                              setQuestionnaireQuestions(newQs);
                            }}
                            placeholder={`请输入你想问的问题 ${idx + 1}`}
                            className="flex-1 bg-transparent border-none outline-none text-[13.5px] font-semibold"
                            style={{ color: themeConfig.textPrimary }}
                          />
                          {questionnaireQuestions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newQs = questionnaireQuestions.filter((_, i) => i !== idx);
                                const newOpts = questionnaireOptions.filter((_, i) => i !== idx);
                                setQuestionnaireQuestions(newQs);
                                setQuestionnaireOptions(newOpts);
                              }}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 active:opacity-60 transition-colors rounded-full shrink-0"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>

                        {/* Options Section */}
                        <div className="pl-6 space-y-2 border-t border-black/5 dark:border-white/5 pt-2.5">
                          <div className="flex justify-between items-center text-[10.5px] font-bold text-gray-400 dark:text-zinc-500 tracking-wider uppercase">
                            <span>选项供梦角选择 (选填，不填则抽字卡回答)</span>
                            <span>{ (questionnaireOptions[idx] || []).length } 个选项</span>
                          </div>

                          <div className="space-y-1.5 min-h-[20px]">
                            {(questionnaireOptions[idx] || []).map((opt, optIdx) => {
                              const letterPrefix = String.fromCharCode(65 + optIdx);
                              return (
                                <div 
                                  key={optIdx} 
                                  className="flex items-center justify-between px-3 py-1.5 rounded-xl border transition-all text-[12px]"
                                  style={{
                                    backgroundColor: `${themeConfig.numColor || '#007AFF'}04`,
                                    borderColor: `${themeConfig.numColor || '#007AFF'}10`,
                                    color: themeConfig.textPrimary
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <span 
                                      className="font-mono font-bold px-1.5 py-0.5 rounded text-[10px] min-w-[20px] text-center shrink-0"
                                      style={{
                                        backgroundColor: `${themeConfig.numColor || '#007AFF'}12`,
                                        color: themeConfig.numColor || '#007AFF'
                                      }}
                                    >
                                      {letterPrefix}
                                    </span>
                                    <span className="font-semibold">{opt}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newOpts = [...questionnaireOptions];
                                      newOpts[idx] = (newOpts[idx] || []).filter((_, i) => i !== optIdx);
                                      setQuestionnaireOptions(newOpts);
                                    }}
                                    className="text-gray-400 hover:text-red-500 font-bold px-1.5 py-0.5 rounded transition-all text-[13px] shrink-0"
                                  >
                                    ×
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={tempOptionInputs[idx] || ''}
                              placeholder="输入选项，按回车或点击右侧 + 键添加"
                              onChange={(e) => {
                                setTempOptionInputs({
                                  ...tempOptionInputs,
                                  [idx]: e.target.value
                                });
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const val = (tempOptionInputs[idx] || '').trim();
                                  if (val) {
                                    const newOpts = [...questionnaireOptions];
                                    newOpts[idx] = [...(newOpts[idx] || []), val];
                                    setQuestionnaireOptions(newOpts);
                                    setTempOptionInputs({
                                      ...tempOptionInputs,
                                      [idx]: ''
                                    });
                                  }
                                }
                              }}
                              className="flex-1 bg-transparent border-b border-black/10 dark:border-white/10 py-1 outline-none text-[12px]"
                              style={{ color: themeConfig.textPrimary }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const val = (tempOptionInputs[idx] || '').trim();
                                if (val) {
                                  const newOpts = [...questionnaireOptions];
                                  newOpts[idx] = [...(newOpts[idx] || []), val];
                                  setQuestionnaireOptions(newOpts);
                                  setTempOptionInputs({
                                    ...tempOptionInputs,
                                    [idx]: ''
                                  });
                                }
                              }}
                              className="text-[14px] font-bold px-2 py-0.5 rounded transition-all hover:bg-black/5"
                              style={{ color: themeConfig.numColor || '#007AFF' }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {questionnaireQuestions.length < 6 && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuestionnaireQuestions([...questionnaireQuestions, '']);
                        setQuestionnaireOptions([...questionnaireOptions, []]);
                      }}
                      className="w-full py-2.5 border border-dashed rounded-xl text-[13px] font-semibold text-center flex items-center justify-center gap-1.5 transition-all hover:bg-black/5"
                      style={{ 
                        color: themeConfig.numColor || '#007AFF', 
                        borderColor: `${themeConfig.numColor || '#007AFF'}40` 
                      }}
                    >
                      <span>+ 添加新问题</span>
                    </button>
                  )}
                </div>
              ) : (
                /* Editor Sheet */
                <div 
                  className="rounded-2xl border shadow-sm p-4 flex flex-col min-h-[320px]"
                  style={{ 
                    backgroundColor: themeConfig.cardBg || '#FFFFFF',
                    borderColor: 'rgba(0,0,0,0.06)'
                  }}
                >
                  <textarea
                    className="flex-1 w-full bg-transparent outline-none text-[15px] resize-none leading-relaxed placeholder:opacity-50"
                    style={{ color: themeConfig.textPrimary }}
                    placeholder={
                      selectedCategory === 'daily'
                        ? `分享你今天的琐碎瞬间或当下心情。点击寄出，${mjNickname}收到后就会从字卡库中挑选字卡回复你...`
                        : `写下一封长长的信。把最深的心里话托付在字里行间，寄给 ${mjNickname}，静候字卡回信...`
                    }
                    autoFocus
                    value={content}
                    onChange={e => setContent(e.target.value)}
                  />
                  
                  <div 
                    className="flex justify-between items-center mt-4 pt-3 border-t text-[11.5px]"
                    style={{ borderColor: 'rgba(0,0,0,0.05)', color: themeConfig.textSecondary }}
                  >
                    <div className="flex items-center gap-1 font-mono">
                      <FileText size={12} />
                      <span>已输入 {content.trim().length} 字</span>
                    </div>
                    
                    <div className="flex items-center gap-1 font-medium opacity-80">
                      <Sparkles size={12} />
                      <span>寄送给 {mjNickname}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Letter Reading Detail View */}
      <AnimatePresence>
        {viewingLetter && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="absolute inset-0 z-50 flex flex-col"
            style={{ backgroundColor: themeConfig.bg || '#F8F9FA' }}
          >
            {/* Header */}
            <div 
              className="w-full flex items-center justify-between px-4 pb-3 border-b backdrop-blur-xl z-10"
              style={{ 
                paddingTop: 'calc(0.75rem + env(safe-area-inset-top))', 
                backgroundColor: themeConfig.bg ? `${themeConfig.bg}EE` : '#FFFFFFEE',
                borderColor: themeConfig.textSecondary ? `${themeConfig.textSecondary}12` : 'rgba(0,0,0,0.05)'
              }}
            >
              <button 
                onClick={() => setViewingLetter(null)} 
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all" 
                style={{ color: themeConfig.numColor || '#007AFF' }}
              >
                <ChevronLeft size={20} className="stroke-[2.5]" />
                <span className="text-[14.5px] font-semibold">返回</span>
              </button>
              
              <h2 className="text-[16px] font-semibold tracking-tight" style={{ color: themeConfig.textPrimary }}>
                信件详情
              </h2>
              
              <div className="w-[60px]" />
            </div>

            {/* Letter Cards Grid */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 max-w-[620px] mx-auto w-full pb-safe">
              
              {/* My Sent Letter */}
              <div 
                className="p-6 rounded-2xl border shadow-sm relative overflow-hidden"
                style={{
                  backgroundColor: themeConfig.cardBg || '#FFFFFF',
                  borderColor: 'rgba(0,0,0,0.06)'
                }}
              >
                {/* User profile header inside detail view */}
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    {avatar1 ? (
                      <img src={avatar1} className="w-10 h-10 rounded-full object-cover border border-black/5" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold text-[14px]">
                        {myNickname[0]}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-[13.5px]" style={{ color: themeConfig.textPrimary }}>{myNickname}</div>
                      <div className="text-[11px] font-mono opacity-50" style={{ color: themeConfig.textSecondary }}>@{myHandle}</div>
                    </div>
                  </div>
                  <div className="text-[11.5px] font-mono opacity-60" style={{ color: themeConfig.textSecondary }}>
                    {formatTime(viewingLetter.sentAt)}
                  </div>
                </div>

                {viewingLetter.category === 'questionnaire' && viewingLetter.questions ? (
                  <div className="space-y-4">
                    {viewingLetter.questions.map((q, idx) => {
                      const opts = viewingLetter.questionOptions?.[idx] || [];
                      return (
                        <div key={idx} className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 space-y-2">
                          <div className="flex gap-2.5 text-[13.5px] items-start">
                            <span className="font-mono font-bold text-gray-400 mt-0.5 shrink-0">Q{idx + 1}</span>
                            <p className="font-semibold" style={{ color: themeConfig.textPrimary }}>{q}</p>
                          </div>
                          {opts.length > 0 && (
                            <div className="pl-7 pt-1 space-y-1.5">
                              {opts.map((opt, optIdx) => {
                                const letterPrefix = String.fromCharCode(65 + optIdx);
                                return (
                                  <div 
                                    key={optIdx} 
                                    className="text-[13px] font-medium flex items-center gap-2"
                                    style={{ color: themeConfig.textSecondary }}
                                  >
                                    <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 text-[10.5px] min-w-[20px] text-center shrink-0 opacity-80">
                                      {letterPrefix}
                                    </span>
                                    <span>{opt}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[14.5px] leading-relaxed break-words whitespace-pre-wrap font-medium" style={{ color: themeConfig.textPrimary }}>
                    {viewingLetter.content}
                  </p>
                )}

                <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-black/5 dark:border-white/5 text-[11px] font-medium opacity-65" style={{ color: themeConfig.textSecondary }}>
                  <div className="flex items-center gap-1.5">
                    <span>#1 Following</span>
                    <span>•</span>
                    <span>{getCategoryLabel(viewingLetter.category)}</span>
                    <span>•</span>
                    <span>{getSpeedLabel(viewingLetter.speed)}</span>
                  </div>
                  <div className="flex items-center gap-1" style={{ color: viewingLetter.replyContent ? (themeConfig.numColor || '#007AFF') : themeConfig.textSecondary }}>
                    <Clock size={11} className="opacity-75" />
                    <span>{viewingLetter.replyContent ? '已回信' : '投递中'}</span>
                  </div>
                </div>
              </div>

              {/* Reply Section */}
              <div className="space-y-3">
                <div className="px-2 text-[11.5px] font-bold tracking-wider uppercase opacity-60" style={{ color: themeConfig.textSecondary }}>
                  回信状况
                </div>

                {!viewingLetter.replyContent ? (
                  <div 
                    className="p-5 rounded-2xl border shadow-sm flex items-center gap-4 backdrop-blur-md"
                    style={{
                      backgroundColor: themeConfig.cardBg ? `${themeConfig.cardBg}B0` : 'rgba(255,255,255,0.7)',
                      borderColor: `${themeConfig.numColor || '#007AFF'}15`
                    }}
                  >
                    <div 
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" 
                      style={{ 
                        backgroundColor: `${themeConfig.numColor || '#007AFF'}08`,
                        border: `1px solid ${themeConfig.numColor || '#007AFF'}10`
                      }}
                    >
                      <Clock size={20} style={{ color: themeConfig.numColor || '#007AFF' }} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[13.5px] mb-0.5" style={{ color: themeConfig.numColor || '#007AFF' }}>正在写回信中...</h4>
                      <p className="text-[12px]" style={{ color: themeConfig.textSecondary }}>
                        预计将在 <span className="font-semibold" style={{ color: themeConfig.textPrimary }}>{getExpectedTimeLabel(viewingLetter.replyExpectedAt)}</span> 送达，请耐心等候。
                      </p>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="p-6 rounded-2xl border shadow-sm relative overflow-hidden"
                    style={{
                      backgroundColor: themeConfig.cardBg || '#FFFFFF',
                      borderColor: `${themeConfig.numColor || '#007AFF'}12`
                    }}
                  >
                    {/* Companion Profile Header inside reply card */}
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-black/5 dark:border-white/5">
                      <div className="flex items-center gap-3">
                        {avatar2 ? (
                          <img src={avatar2} className="w-10 h-10 rounded-full object-cover border border-black/5" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold text-[14px]">
                            {mjNickname[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-[13.5px]" style={{ color: themeConfig.textPrimary }}>{mjNickname}</div>
                          <div className="text-[11px] font-mono opacity-50" style={{ color: themeConfig.textSecondary }}>@{mjHandle}</div>
                        </div>
                      </div>
                      <div className="text-[11.5px] font-mono opacity-60" style={{ color: themeConfig.textSecondary }}>
                        {formatTime(viewingLetter.replyExpectedAt)}
                      </div>
                    </div>

                    {viewingLetter.category === 'questionnaire' ? (
                      <div className="space-y-4">
                        {viewingLetter.replyContent.split('\n\n').map((pair, idx) => {
                          const lines = pair.split('\n');
                          const question = lines[0] || '';
                          const answer = lines[1] || '';
                          return (
                            <div 
                              key={idx} 
                              className="p-4 rounded-2xl border space-y-2.5"
                              style={{
                                backgroundColor: `${themeConfig.numColor || '#007AFF'}08`,
                                borderColor: `${themeConfig.numColor || '#007AFF'}15`
                              }}
                            >
                              <div className="flex gap-2 text-[13px] font-semibold" style={{ color: themeConfig.textSecondary }}>
                                <span className="font-mono text-gray-400">Q{idx + 1}：</span>
                                <span>{question.replace(/^Q\d+：/, '')}</span>
                              </div>
                              <div className="flex gap-2 text-[14px] font-bold" style={{ color: themeConfig.numColor || '#007AFF' }}>
                                <span>A{idx + 1}：</span>
                                <span>{answer.replace(/^A\d+：/, '')}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p 
                        className="text-[15px] leading-relaxed break-words whitespace-pre-wrap font-semibold tracking-wide"
                        style={{ color: themeConfig.textPrimary }}
                      >
                        {viewingLetter.replyContent}
                      </p>
                    )}

                    {/* Lower Reference-inspired Interaction Bar */}
                    <div 
                      className="flex items-center justify-between pt-3.5 border-t text-[11px] font-medium mt-5"
                      style={{ borderColor: themeConfig.textSecondary ? `${themeConfig.textSecondary}10` : 'rgba(0,0,0,0.05)' }}
                    >
                      <div className="flex items-center gap-1.5 opacity-55" style={{ color: themeConfig.textSecondary }}>
                        <span>#2 Following</span>
                        <span>•</span>
                        <span>信件回信</span>
                      </div>
                      <div className="flex items-center gap-1" style={{ color: themeConfig.numColor || '#007AFF' }}>
                        <CheckCircle2 size={11} className="opacity-75" />
                        <span>已回信</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
