import React, { useState, useEffect } from 'react';
import { ChevronLeft, PenSquare, Send, MailOpen, Mail, Clock, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MailLetter {
  id: string;
  sentAt: number;
  content: string;
  replyExpectedAt: number;
  replyContent: string | null;
}

interface MailboxViewProps {
  onClose: () => void;
  themeConfig: any;
  cardGroups: { id: string, name: string, cards: string[] }[];
}

const PUNCTUATIONS = ['，', '。', '......', '！', '？', '，', '。', ' ']; 

export function MailboxView({ onClose, themeConfig, cardGroups }: MailboxViewProps) {
  const [letters, setLetters] = useState<MailLetter[]>(() => {
    try {
      const saved = window.localStorage.getItem('app_mailbox_letters');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showCompose, setShowCompose] = useState(false);
  const [content, setContent] = useState('');
  const [viewingLetter, setViewingLetter] = useState<MailLetter | null>(null);

  // Check for newly replied letters
  useEffect(() => {
    let changed = false;
    const now = Date.now();
    const allAvailableCards = cardGroups.flatMap(g => g.cards).filter(c => c.trim().length > 0);

    const updated = letters.map((letter, i) => {
      if (!letter.replyContent && now >= letter.replyExpectedAt) {
        changed = true;
        
        let text = '（静静地陪伴着你...）';
        if (allAvailableCards.length > 0) {
           const count = Math.floor(Math.random() * 5) + 8; // 8 to 12
           const parts = [];
           for (let i = 0; i < count; i++) {
               parts.push(allAvailableCards[Math.floor(Math.random() * allAvailableCards.length)]);
               if (i < count - 1) {
                  parts.push(PUNCTUATIONS[Math.floor(Math.random() * PUNCTUATIONS.length)]);
               }
           }
           text = parts.join('');
        }

        return { ...letter, replyContent: text };
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
    if (!content.trim()) return;
    
    // 8 to 12 hours from now
    const delayHours = 8 + Math.random() * 4;
    const expectedAt = Date.now() + delayHours * 60 * 60 * 1000;
    
    const newLetter: MailLetter = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      sentAt: Date.now(),
      content: content.trim(),
      replyExpectedAt: expectedAt,
      replyContent: null
    };

    setLetters([newLetter, ...letters]);
    setContent('');
    setShowCompose(false);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const getExpectedTimeLabel = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
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

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden text-[14px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', backgroundColor: themeConfig.bg || '#F2F2F7' }}>
      {/* Header */}
      <div 
        className="w-full flex items-center justify-between px-3 pb-3 bg-white/30 sticky top-0 z-20 border-b border-[#c6c6c8]/20 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
        style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
      >
        <button onClick={onClose} className="p-2 -ml-2 active:opacity-50 transition-opacity">
          <ChevronLeft size={24} style={{color: themeConfig.textPrimary}} />
        </button>
        <h1 className="text-[17px] font-medium" style={{color: themeConfig.textPrimary}}>时空信箱</h1>
        <button onClick={() => setShowCompose(true)} className="p-2 -mr-2 active:opacity-50 transition-opacity">
          <PenSquare size={20} style={{color: themeConfig.textPrimary}} />
        </button>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 space-y-4">
        {letters.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center font-medium pb-20">
             <div className="w-[88px] h-[88px] bg-white rounded-full shadow-[0_2px_16px_rgba(0,0,0,0.04)] justify-center flex items-center mb-6">
               <MailOpen size={36} className="opacity-80 mt-1 ml-1" style={{ color: themeConfig.numColor || '#007AFF' }} />
             </div>
             <p className="text-[16px] text-[#333]">写一封信吧，将心事寄出</p>
             <p className="text-[13px] text-[#8E8E93] mt-2 font-normal">大约 8-12 小时后会有回信哦</p>
             <button onClick={() => setShowCompose(true)} className="mt-8 px-8 py-3 text-white rounded-full text-[15px] font-semibold shadow-[0_4px_12px_rgba(0,0,0,0.15)] active:scale-95 transition-transform" style={{ backgroundColor: themeConfig.numColor || '#007AFF' }}>
                开始写信
             </button>
           </div>
        ) : (
           <AnimatePresence>
             {letters.map((letter, i) => {
               const hasReply = !!letter.replyContent;
               return (
                 <motion.div 
                   key={`${letter.id}-${i}`} 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   className="bg-white rounded-[20px] p-5 flex flex-col shadow-[0_2px_12px_rgba(0,0,0,0.03)] active:bg-gray-50 transition-colors cursor-pointer group relative overflow-hidden"
                   onClick={() => setViewingLetter(letter)}
                 >
                   <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center gap-2">
                       {hasReply ? (
                         <div className="flex items-center gap-1.5">
                           <div className="w-6 h-6 rounded-full bg-[#34C759]/10 flex items-center justify-center">
                             <MailOpen size={12} className="text-[#34C759]"/>
                           </div>
                           <span className="text-[#34C759] text-[13px] font-semibold">已回信</span>
                         </div>
                       ) : (
                         <div className="flex items-center gap-1.5">
                           <div className="w-6 h-6 rounded-full flex items-center justify-center opacity-80" style={{ backgroundColor: themeConfig.numColor ? `${themeConfig.numColor}1A` : 'rgba(0,122,255,0.1)' }}>
                             <Mail size={12} style={{ color: themeConfig.numColor || '#007AFF' }}/>
                           </div>
                           <span className="text-[13px] font-semibold" style={{ color: themeConfig.numColor || '#007AFF' }}>投递中</span>
                         </div>
                       )}
                     </div>
                     <div className="flex items-center gap-3">
                       <span className="text-[13px] font-medium text-[#8E8E93]">{formatTime(letter.sentAt)}</span>
                       <button onClick={(e) => handleDelete(letter.id, e)} className="text-[#FF3B30] opacity-0 group-hover:opacity-100 sm:opacity-50 transition-opacity p-1 -mr-2">
                         <Trash2 size={16} />
                       </button>
                     </div>
                   </div>
                   <p className="text-[15px] text-[#333] line-clamp-2 leading-relaxed break-words">
                     {letter.content}
                   </p>
                   {!hasReply && (
                     <div className="mt-4 pt-3 border-t border-[#F2F2F7] flex items-center gap-1.5 text-[12px] text-[#8E8E93]">
                       <Clock size={12} />
                       <span>预计回信: {getExpectedTimeLabel(letter.replyExpectedAt)}</span>
                     </div>
                   )}
                 </motion.div>
               )
             })}
           </AnimatePresence>
        )}
      </div>

      {/* Compose View */}
      <AnimatePresence>
        {showCompose && (
           <motion.div
             initial={{ opacity: 0, y: '100%' }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: '100%' }}
             transition={{ type: "spring", damping: 25, stiffness: 300 }}
             className="absolute inset-0 z-40 flex flex-col"
             style={{ backgroundColor: themeConfig.bg || '#F2F2F7' }}
           >
             <div 
               className="w-full flex items-center justify-between px-3 pb-3 sticky top-0 border-b border-[#c6c6c8]/20"
               style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))', backgroundColor: themeConfig.bg || '#F2F2F7' }}
             >
                <button onClick={() => setShowCompose(false)} className="text-[15px] px-2 text-[#8E8E93] active:opacity-50 transition-opacity">取消</button>
                <h2 className="text-[16px] font-semibold text-[#111]">写信</h2>
                <button onClick={handleSend} disabled={!content.trim()} className="text-[15px] px-2 font-semibold disabled:text-[#8E8E93]/50 disabled:opacity-50 flex items-center gap-1 active:opacity-50 transition-opacity" style={{ color: themeConfig.numColor || '#007AFF' }}>
                   <Send size={16} /> 寄出
                </button>
             </div>
             
             <div className="flex-1 px-4 pt-4 pb-24 overflow-y-auto w-full max-w-[600px] mx-auto">
               <div className="bg-white rounded-[24px] shadow-[0_2px_16px_rgba(0,0,0,0.04)] min-h-[400px] flex flex-col overflow-hidden relative">
                 <textarea
                   className="flex-1 w-full min-h-[300px] bg-transparent p-6 outline-none text-[16px] text-[#333] resize-none leading-relaxed placeholder:text-[#C7C7CC]"
                   placeholder="将当下的烦恼、喜悦或平淡，都写进这封信里吧..."
                   autoFocus
                   value={content}
                   onChange={e => setContent(e.target.value)}
                 />
                 <div className="bg-[#FAFAFA] p-4 flex items-center gap-2 border-t border-[#F2F2F7] text-[#8E8E93] text-[13px]">
                   <Clock size={16} />
                   <span>预计 8-12 小时后收到回音</span>
                 </div>
               </div>
             </div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* Detail View */}
      <AnimatePresence>
        {viewingLetter && (
           <motion.div
             initial={{ opacity: 0, x: '100%' }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: '100%' }}
             transition={{ type: "spring", damping: 25, stiffness: 300 }}
             className="absolute inset-0 z-50 flex flex-col"
             style={{ backgroundColor: themeConfig.bg || '#F2F2F7' }}
           >
             <div 
               className="w-full flex items-center justify-between px-3 pb-3 bg-white/30 sticky top-0 border-b border-[#c6c6c8]/20 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.02)] z-10"
               style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
             >
                <button onClick={() => setViewingLetter(null)} className="p-2 -ml-2 active:opacity-50 transition-opacity flex items-center" style={{ color: themeConfig.numColor || '#007AFF' }}>
                  <ChevronLeft size={24} />
                  <span className="-ml-1 text-[15px]">返回</span>
                </button>
                <h2 className="text-[16px] font-semibold text-[#111]">信件详情</h2>
                <div className="w-[60px]" />
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-[600px] mx-auto w-full">
                {/* My Letter */}
                <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] relative">
                   <div className="absolute top-0 left-6 w-[32px] h-[4px] rounded-b-md" style={{ backgroundColor: themeConfig.numColor ? `${themeConfig.numColor}33` : 'rgba(0,122,255,0.2)' }}></div>
                   <div className="flex items-center justify-between mb-4 mt-2">
                       <div className="text-[13px] text-[#8E8E93] font-medium flex items-center gap-1.5">
                           <PenSquare size={14} /> 我的去信
                       </div>
                       <div className="text-[13px] text-[#8E8E93]">{formatTime(viewingLetter.sentAt)}</div>
                   </div>
                   <div className="text-[16px] text-[#333] leading-relaxed break-words whitespace-pre-wrap">
                      {viewingLetter.content}
                   </div>
                </div>

                {/* Reply Section */}
                <div className="relative pt-2 pb-8">
                   <div className="absolute top-0 bottom-8 left-[38px] w-[2px] -z-10" style={{ backgroundColor: themeConfig.numColor ? `${themeConfig.numColor}1A` : 'rgba(0,122,255,0.1)' }} />
                   
                   {!viewingLetter.replyContent ? (
                      <div className="ml-[14px] bg-white/60 backdrop-blur-md rounded-[24px] p-5 shadow-sm border border-white flex gap-4 items-center">
                         <div className="w-[48px] h-[48px] rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: themeConfig.numColor ? `${themeConfig.numColor}1A` : 'rgba(0,122,255,0.1)' }}>
                             <Mail size={20} style={{ color: themeConfig.numColor || '#007AFF' }}/>
                         </div>
                         <div>
                             <div className="font-semibold text-[15px] mb-1" style={{ color: themeConfig.numColor || '#007AFF' }}>回信正在路上...</div>
                             <div className="text-[13px] text-[#8E8E93]">
                               预计 <span className="font-semibold text-[#333]">{getExpectedTimeLabel(viewingLetter.replyExpectedAt)}</span> 左右送达
                             </div>
                         </div>
                      </div>
                   ) : (
                      <div className="ml-[14px] bg-white rounded-[24px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[#34C759]/10 relative">
                         <div className="absolute top-0 left-6 w-[32px] h-[4px] bg-[#34C759]/20 rounded-b-md"></div>
                         
                         <div className="flex items-center justify-between mb-5 mt-2">
                             <div className="text-[13px] text-[#34C759] font-semibold flex items-center gap-1.5">
                                 <MailOpen size={14} /> 星空回信
                             </div>
                             <div className="text-[13px] text-[#8E8E93]">
                               {formatTime(viewingLetter.replyExpectedAt)}
                             </div>
                         </div>

                         <div className="text-[16px] text-[#111] leading-relaxed break-words whitespace-pre-wrap font-medium" style={{ fontFamily: '"Playfair Display", serif' }}>
                            {viewingLetter.replyContent}
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
