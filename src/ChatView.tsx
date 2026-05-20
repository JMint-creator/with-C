import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Video, Settings, Smile, Hand, Plus, Image as ImageIcon, Send, X, PhoneCall, PhoneMissed, Phone, MicOff, CameraOff, MonitorPlay, Check, CheckCheck, MessageCircle, MoreHorizontal, Heart, Sparkles } from 'lucide-react';
import { useLocalState } from './utils';

type Message = {
  id: string;
  sender: 'me' | 'them';
  type: 'text' | 'nudge' | 'emoji' | 'call' | 'sticker';
  content: string;
  time: string;
  callState?: 'missed' | 'declined' | 'duration';
  callDuration?: number;
  replyTo?: string;
};

export const ChatView = ({ onClose, onOpenSettings, themeConfig }: any) => {
  const [messages, setMessages] = useLocalState<Message[]>('app_chatMessages', []);
  const [input, setInput] = useState('');
  
  const [charId, setCharId] = useLocalState('app_charId', '梦角');
  
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // States from appearance / settings
  const [chatBg] = useLocalState('app_chatBg', '');
  const [avatar1] = useLocalState('app_chatAvatar1', '');
  const [avatar2] = useLocalState('app_chatAvatar2', '');
  const [chatCss] = useLocalState('app_chatCss', '');
  const [chatFont] = useLocalState('app_chatFont', '');
  
  const [mockVideo] = useLocalState('app_chatMockVideoCall', true);
  const [cardGroups] = useLocalState<any[]>('app_cardGroups', []);
  const replyCards = cardGroups.flatMap(g => g.cards).map(content => ({ content }));
  const [statuses] = useLocalState<any[]>('app_atmosphereStatuses', []);
  const [receiptStyle] = useLocalState('app_chatReceiptStyle', 'graphic');
  const [readReceipt] = useLocalState('app_chatReadReceipt', true);
  const [readNoReply] = useLocalState('app_chatReadNoReply', false);
  const [emojis] = useLocalState<string[]>('app_emojis', ['😀', '😂', '🥰', '👍', '🙏']);
  const [stickers] = useLocalState<string[]>('app_stickers', []);

    // Video Call State
  const [videoCallState, setVideoCallState] = useState<'none' | 'calling' | 'connected' | 'incoming'>('none');
  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showPlusMenu, setShowPlusMenu] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const stickerInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isSticker: boolean) => {
     if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
           if (e.target?.result) {
              const newMsg: Message = {
                id: Date.now().toString(),
                sender: 'me',
                type: isSticker ? 'sticker' : 'sticker', // For now use sticker type for any image
                content: e.target.result as string,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              };
              setMessages(prev => [...prev, newMsg]);
              setShowPlusMenu(false);
              
              if (!readNoReply) {
                 simulateReply();
              }
           }
        };
        reader.readAsDataURL(file);
     }
  };

  const [mixEmoji] = useLocalState('app_chatMixEmoji', true);
  const primaryColor = themeConfig.textPrimary || '#a894a7';
  const [chatBubbleColor] = useLocalState('app_chatBubbleColor', '');
  const bubbleColor = chatBubbleColor || primaryColor;

  const [dynamicStatus, setDynamicStatus] = useState('在线');

  useEffect(() => {
    if (statuses.length === 0) return;
    setDynamicStatus(statuses[Math.floor(Math.random() * statuses.length)].content);
    let timer: any;
    const scheduleNextStatus = () => {
      const waitHours = 1 + Math.random() * 7;
      timer = setTimeout(() => {
         setDynamicStatus(statuses[Math.floor(Math.random() * statuses.length)].content);
         scheduleNextStatus();
      }, Math.floor(waitHours * 3600 * 1000));
    };
    scheduleNextStatus();
    return () => clearTimeout(timer);
  }, [statuses]);

  useEffect(() => {
    let timer: any;
    const scheduleNextCall = () => {
      const waitMins = 15 + Math.random() * 45;
      timer = setTimeout(() => {
         if (Math.random() < 0.25 && videoCallState === 'none') {
           setVideoCallState('incoming');
           const pushNotify = window.localStorage.getItem('app_chatPushNotify');
           if ((pushNotify ? JSON.parse(pushNotify) : true) && 'Notification' in window && window.Notification.permission === 'granted') {
             new window.Notification(charId, { body: '收到新来电' });
           }
           // Auto missed call after 30 seconds if not answered
           setTimeout(() => {
             setVideoCallState(prev => {
               if (prev === 'incoming') {
                 setMessages(msgs => [...msgs, {
                   id: Date.now().toString(),
                   sender: 'them',
                   type: 'call',
                   content: '未接来电',
                   callState: 'missed',
                   time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                 }]);
                 return 'none';
               }
               return prev;
             });
           }, 30000);
         }
         scheduleNextCall();
      }, Math.floor(waitMins * 60 * 1000));
    };
    scheduleNextCall();
    return () => clearTimeout(timer);
  }, [videoCallState, charId, setMessages]);

  const [proactive] = useLocalState('app_chatProactive', false);
  const [proactiveInterval] = useLocalState('app_chatProactiveInterval', 20);

  useEffect(() => {
    let timer: any;
    if (proactive && proactiveInterval > 0) {
      timer = setInterval(() => {
        simulateReply(); // triggers typing and 1-3 messages
      }, proactiveInterval * 60 * 1000);
    }
    return () => clearInterval(timer);
  }, [proactive, proactiveInterval]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    let timer: any;
    if (videoCallState === 'connected') {
      timer = setInterval(() => setCallDuration(p => p + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [videoCallState]);

  const handleSend = (text: string = input, type: 'text'|'nudge'|'emoji' = 'text') => {
    if (!text.trim() && type === 'text') return;
    
    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'me',
      type,
      content: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, newMsg]);
    setInput('');
    
    if (readNoReply) {
      // do nothing if read no reply is true
    } else {
      simulateReply();
    }
  };

  const [minWait] = useLocalState('app_chatMinWait', 10);
  const [maxWait] = useLocalState('app_chatMaxWait', 50);

  const simulateReply = () => {
    setIsTyping(true);
    const delay = Math.random() * (maxWait - minWait) * 1000 + minWait * 1000;
    
    setTimeout(() => {
      setIsTyping(false);
      const newMsgs: Message[] = [];
      let baseId = Date.now();

      if (Math.random() < 0.03) {
        newMsgs.push({
          id: (++baseId).toString(),
          sender: 'them',
          type: 'nudge',
          content: '拍了拍你',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }

      const r = Math.random();
      let replyCount = 1;
      if (r > 0.95) replyCount = 3;
      else if (r > 0.75) replyCount = 2;
      
      for(let i=0; i<replyCount; i++) {
        let content = '嗯嗯';
        if (replyCards.length > 0) {
           content = replyCards[Math.floor(Math.random() * replyCards.length)].content;
        }

        let replyToMsg: string | undefined = undefined;
        if (Math.random() < 0.3) {
           const myMsgs = messages.filter(m => m.sender === 'me');
           const recentMyMsgs = myMsgs.slice(-10);
           if (recentMyMsgs.length > 0) {
             replyToMsg = recentMyMsgs[Math.floor(Math.random() * recentMyMsgs.length)].content;
           }
        }
        
        let emojiContent = '';
        let sendEmojiSeparate = false;
        if (Math.random() < 0.2 && emojis.length > 0) {
          const emoji = emojis[Math.floor(Math.random() * emojis.length)];
          if (mixEmoji) {
             if (Math.random() < 0.5) content = emoji + content;
             else content = content + emoji;
          } else {
             emojiContent = emoji;
             sendEmojiSeparate = true;
          }
        }

        newMsgs.push({
          id: (++baseId).toString(),
          sender: 'them',
          type: 'text',
          content,
          replyTo: replyToMsg,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

        if (sendEmojiSeparate) {
          newMsgs.push({
            id: (++baseId).toString(),
            sender: 'them',
            type: 'emoji',
            content: emojiContent,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }

        if (Math.random() < 0.2 && stickers.length > 0) {
          const sticker = stickers[Math.floor(Math.random() * stickers.length)];
          newMsgs.push({
             id: (++baseId).toString(),
             sender: 'them',
             type: 'sticker',
             content: sticker,
             time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }
      }

      setMessages(prev => [...prev, ...newMsgs]);
      
      const pushNotify = window.localStorage.getItem('app_chatPushNotify');
      const isPushEnabled = pushNotify ? JSON.parse(pushNotify) : true;
      if (isPushEnabled && 'Notification' in window && window.Notification.permission === 'granted') {
        new window.Notification(charId, { 
          body: newMsgs[0].content,
          icon: avatar2 || undefined 
        });
      }
    }, delay);
  };

  const handleNudge = () => handleSend('拍了拍对方', 'nudge');

  const initiateCall = () => {
    setVideoCallState('calling');
    setCallDuration(0);
    setTimeout(() => {
      if (Math.random() > 0.35) {
        setVideoCallState('connected');
      } else {
        setVideoCallState('none');
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'them',
          type: 'call',
          content: '未接通',
          callState: 'declined',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    }, 3000);
  };

  const endCall = () => {
    setVideoCallState('none');
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'me',
      type: 'call',
      content: `通话时长 ${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, '0')}`,
      callState: 'duration',
      callDuration,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  const acceptCall = () => {
    setVideoCallState('connected');
    setCallDuration(0);
  };

  const declineCall = () => {
    setVideoCallState('none');
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'me',
      type: 'call',
      content: '已拒绝',
      callState: 'declined',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  const customStyle = chatFont ? { fontFamily: 'CustomChatFont, sans-serif' } : {};

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden z-50 bg-white" style={{ ...customStyle, backgroundColor: themeConfig.bg }}>
      {chatBg && <img src={chatBg} alt="" className="absolute inset-0 w-full h-full object-cover z-0" />}
      {chatFont && <style dangerouslySetInnerHTML={{ __html: `@font-face { font-family: 'CustomChatFont'; src: url('${chatFont}'); }` }} />}
      {chatCss && <style dangerouslySetInnerHTML={{ __html: chatCss }} />}
      
      {/* Header */}
      <div className="absolute top-[max(0.5rem,env(safe-area-inset-top))] left-3 right-3 rounded-[12px] flex items-center justify-between px-3 py-2 z-20 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-white/50" style={{ backgroundColor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)' }}>
        <button onClick={onClose} className="w-[70px] flex items-center p-1 text-black/60 active:opacity-50 transition-opacity">
          <ChevronLeft size={26} className="-ml-1" />
        </button>
        <div className="flex-1 flex items-center justify-center space-x-3 h-[38px]">
          {avatar2 && (
            <div className="w-[38px] h-[38px] rounded-full overflow-hidden shadow-sm border border-black/5 shrink-0 bg-white">
              <img src={avatar2} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex flex-col items-start justify-between h-[38px] py-[2px]">
            <input 
              value={charId}
              onChange={e => setCharId(e.target.value)}
              className="text-[15px] font-medium text-left bg-transparent outline-none m-0 p-0 text-black max-w-[120px] leading-none"
            />
            <div className="text-[11px] leading-none text-black/40">{dynamicStatus}</div>
          </div>
        </div>
        <div className="w-[70px] flex items-center justify-end pr-1">
          <button onClick={onOpenSettings} className="text-black/60 active:opacity-50 transition-opacity p-1.5"><MoreHorizontal size={24} /></button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="absolute inset-0 overflow-y-auto px-4 pt-[calc(env(safe-area-inset-top)+80px)] pb-[calc(env(safe-area-inset-bottom)+120px)] flex flex-col scrollbar-hide z-0">
        {messages.map((msg, i) => {
          const isMe = msg.sender === 'me';
          const avatar = isMe ? (avatar1 || '') : (avatar2 || '');
          
          const nextMsg = messages[i + 1];
          const isGroupedNext = nextMsg && nextMsg.sender === msg.sender && nextMsg.time === msg.time && nextMsg.type !== 'call' && nextMsg.type !== 'nudge' && msg.type !== 'call' && msg.type !== 'nudge';
          const marginBottom = isGroupedNext ? 'mb-1' : 'mb-5';

          // isRead if there's any message from them after this, or if it's the last message and readNoReply is true, or if simulating reply
          const isRead = messages.slice(i + 1).some(m => m.sender === 'them') || (readNoReply && !isTyping);

          if (msg.type === 'nudge') {
            return (
              <div key={msg.id} className={`w-full flex justify-center ${marginBottom}`}>
                <div className="px-3 py-1 rounded-full bg-black/[0.05] text-[12px] text-gray-500">
                  {isMe ? '我' : charId}{msg.content}
                </div>
              </div>
            );
          }

          if (msg.type === 'call') {
            return (
              <div key={msg.id} className={`w-full flex justify-center ${marginBottom}`}>
                <div className="px-4 py-2 rounded-2xl bg-black/[0.03] text-[13px] flex items-center space-x-2 text-gray-600">
                  {msg.callState === 'declined' || msg.callState === 'missed' ? <PhoneMissed size={14} className="text-red-400" /> : <PhoneCall size={14} />}
                  <span>{msg.content}</span>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${marginBottom}`}>
              {!isMe && (
                <div className="w-9 h-9 shrink-0 mr-3">
                  {!isGroupedNext && <div className="w-full h-full rounded-full bg-black/10 overflow-hidden shadow-sm">
                    {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : null}
                  </div>}
                </div>
              )}
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                {msg.replyTo && (
                  <div className={`text-[12px] px-3 py-1.5 mb-1 rounded-[12px] opacity-70 truncate max-w-full ${isMe ? 'bg-black/10 text-black' : 'bg-white/50 text-black/60'} border border-black/5`}>
                    回复: {msg.replyTo}
                  </div>
                )}
                {msg.type === 'sticker' ? (
                  <div className="rounded-[18px] overflow-hidden bg-transparent shrink-0">
                    <img src={msg.content} alt="sticker" className="max-w-[120px] max-h-[120px] object-contain" />
                  </div>
                ) : msg.type === 'emoji' ? (
                  <div className="text-[48px] leading-none drop-shadow-sm">{msg.content}</div>
                ) : (
                  <div 
                    className={`chat-bubble px-4 py-2.5 text-[15px] leading-relaxed shadow-[0_2px_10px_rgba(0,0,0,0.02)] ${isMe ? 'rounded-2xl rounded-tr-[4px]' : 'rounded-2xl rounded-tl-[4px]'}`}
                    style={isMe ? {backgroundColor: bubbleColor, color: '#fff'} : {backgroundColor: '#fff', color: '#111'}}
                  >
                    {msg.content}
                  </div>
                )}
                
                {!isGroupedNext && (
                  <div className={`text-[10px] mt-1 flex items-center space-x-1 ${isMe ? 'text-black/30' : 'text-black/20'}`}>
                    <span>{msg.time}</span>
                    {isMe && readReceipt && (
                      <span className="ml-1 flex items-center">
                         {receiptStyle === 'text' ? (
                           <span style={{color: isRead ? bubbleColor : 'inherit'}} className={isRead ? 'font-medium' : ''}>{isRead ? '已读' : '送达'}</span>
                         ) : (
                           isRead ? <CheckCheck size={16} strokeWidth={2} style={{color: bubbleColor}} /> : <Check size={16} strokeWidth={2} className="opacity-40" />
                         )}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {isMe && (
                <div className="w-9 h-9 shrink-0 ml-3">
                  {!isGroupedNext && <div className="w-full h-full rounded-full bg-black/10 overflow-hidden shadow-sm">
                    {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : null}
                  </div>}
                </div>
              )}
            </div>
          );
        })}
        {isTyping && (
           <div className="flex w-full justify-start">
             <div className="w-9 h-9 rounded-full bg-black/10 shrink-0 mr-3 overflow-hidden">
                {avatar2 ? <img src={avatar2} alt="" className="w-full h-full object-cover" /> : null}
              </div>
              <div className="chat-bubble px-4 py-3 rounded-[18px] bg-white rounded-tl-[4px] shadow-sm flex space-x-1 items-center">
                <motion.div className="w-1.5 h-1.5 bg-gray-400 rounded-full" animate={{y: [0, -4, 0]}} transition={{repeat: Infinity, duration: 0.8}} />
                <motion.div className="w-1.5 h-1.5 bg-gray-400 rounded-full" animate={{y: [0, -4, 0]}} transition={{repeat: Infinity, duration: 0.8, delay: 0.2}} />
                <motion.div className="w-1.5 h-1.5 bg-gray-400 rounded-full" animate={{y: [0, -4, 0]}} transition={{repeat: Infinity, duration: 0.8, delay: 0.4}} />
              </div>
           </div>
        )}
      </div>

      {/* Plus Menu Overlay */}
      <AnimatePresence>
        {showPlusMenu && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-[calc(4rem+env(safe-area-inset-bottom))] left-3 right-3 bg-white/70 backdrop-blur-xl rounded-[16px] py-4 flex justify-center space-x-4 items-center z-20 shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-white/50"
          >
             <button className="flex flex-col items-center gap-2 group w-[60px]" onClick={() => { initiateCall(); setShowPlusMenu(false); }}>
                <div className="w-[45px] h-[45px] rounded-[14px] flex items-center justify-center group-active:scale-95 transition-transform" style={{ backgroundColor: themeConfig.cardBg, color: primaryColor }}><Video size={24} strokeWidth={1.5} /></div>
                <span className="text-[11px] text-black/50">视频通话</span>
             </button>
             <div className="flex flex-col items-center gap-2 group cursor-pointer w-[60px]" onClick={() => imageInputRef.current?.click()}>
                <div className="w-[45px] h-[45px] rounded-[14px] flex items-center justify-center group-active:scale-95 transition-transform" style={{ backgroundColor: themeConfig.cardBg, color: primaryColor }}><ImageIcon size={24} strokeWidth={1.5} /></div>
                <span className="text-[11px] text-black/50">图片</span>
             </div>
             <div className="flex flex-col items-center gap-2 group cursor-pointer w-[60px]" onClick={() => stickerInputRef.current?.click()}>
                <div className="w-[45px] h-[45px] rounded-[14px] flex items-center justify-center group-active:scale-95 transition-transform" style={{ backgroundColor: themeConfig.cardBg, color: primaryColor }}><Smile size={24} strokeWidth={1.5} /></div>
                <span className="text-[11px] text-black/50">表情库</span>
             </div>
             <button className="flex flex-col items-center gap-2 group w-[60px]" onClick={() => { handleNudge(); setShowPlusMenu(false); }}>
                <div className="w-[45px] h-[45px] rounded-[14px] flex items-center justify-center group-active:scale-95 transition-transform" style={{ backgroundColor: themeConfig.cardBg, color: primaryColor }}><Heart size={24} strokeWidth={1.5} /></div>
                <span className="text-[11px] text-black/50">拍一拍</span>
             </button>
             
             <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, false)} />
             <input type="file" ref={stickerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, true)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="absolute bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-3 right-3 rounded-[16px] bg-white/70 backdrop-blur-xl border border-white/80 p-2 flex flex-col z-30 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        <div className="flex items-center space-x-1.5">
          <button className={`w-9 h-9 flex items-center justify-center shrink-0 ${showPlusMenu ? 'rotate-45' : ''} transition-all active:scale-95`} style={{ color: primaryColor }} onClick={() => setShowPlusMenu(!showPlusMenu)}>
            <Plus size={24} strokeWidth={2} />
          </button>
          <div className="flex-1 min-h-[32px] rounded-[16px] flex items-center px-3 py-1 transition-colors border border-black/[0.03]" style={{ backgroundColor: themeConfig.cardBg }}>
            <input 
              type="text"
              className="flex-1 bg-transparent border-none outline-none text-[15px] p-0.5 text-black placeholder-black/30"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="发送消息..."
              onFocus={() => setShowPlusMenu(false)}
            />
          </div>
          {input.trim() ? (
            <button className="w-9 h-9 flex items-center justify-center shrink-0 text-white rounded-full shadow-md active:scale-95 transition-transform" style={{backgroundColor: primaryColor}} onClick={() => handleSend()}>
              <Send size={16} className="ml-0.5" />
            </button>
          ) : (
            <button className="w-9 h-9 flex items-center justify-center shrink-0 active:scale-95 transition-transform" style={{ color: primaryColor }} onClick={() => simulateReply()}>
               <Sparkles size={24} strokeWidth={1.25} />
            </button>
          )}
        </div>
      </div>

      {/* Video Call Overlay */}
      <AnimatePresence>
        {videoCallState !== 'none' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 100 }}
            animate={isMinimized ? { top: 60, right: 20, width: 100, height: 160, borderRadius: 16, bottom: 'auto', left: 'auto' } : { top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', borderRadius: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 100 }}
            className={`fixed z-50 overflow-hidden shadow-2xl ${isMinimized ? 'bg-black/90 cursor-pointer' : 'bg-[#1a1a1c]'}`}
            onClick={() => isMinimized && setIsMinimized(false)}
          >
            {/* Background Blur */}
            {!isMinimized && avatar2 && (
              <img src={avatar2} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-xl" />
            )}
            
            <div className="absolute inset-0 flex flex-col">
              {!isMinimized && (
                <div className="flex items-center justify-between p-6 pt-12">
                  <button onClick={() => setIsMinimized(true)} className="text-white/70 p-2"><ChevronLeft size={28} className="-ml-2 rotate-[-90deg]"/></button>
                  <button className="text-white/70 p-2"><Plus size={24} /></button>
                </div>
              )}

              <div className={`flex-1 flex flex-col items-center ${isMinimized ? 'justify-center p-2' : 'justify-start pt-16'}`}>
                {/* Avatar */}
                <div className={`${isMinimized ? 'w-12 h-12' : 'w-24 h-24'} rounded-full bg-white/10 overflow-hidden mb-4 shadow-lg border-2 border-white/10`}>
                  {avatar2 ? <img src={avatar2} alt="" className="w-full h-full object-cover" /> : null}
                </div>
                
                {!isMinimized && <div className="text-[28px] font-medium text-white mb-2">{charId}</div>}
                
                <div className={`${isMinimized ? 'text-[10px]' : 'text-[15px]'} text-white/50 tracking-widest`}>
                  {videoCallState === 'calling' ? '正在等待接听...' : videoCallState === 'incoming' ? '邀请你视频通话...' : `${Math.floor(callDuration / 60).toString().padStart(2, '0')}:${(callDuration % 60).toString().padStart(2, '0')}`}
                </div>
              </div>

              {!isMinimized && (
                <div className="pb-16 px-10 flex items-center justify-center space-x-8">
                  {videoCallState === 'incoming' ? (
                     <>
                        <button className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-[0_4px_20px_rgba(239,68,68,0.4)] active:bg-red-600" onClick={declineCall}>
                          <Phone size={28} className="rotate-[135deg]" />
                        </button>
                        <button className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white shadow-[0_4px_20px_rgba(34,197,94,0.4)] active:bg-green-600" onClick={acceptCall}>
                          <Phone size={28} />
                        </button>
                     </>
                  ) : (
                     <>
                       <button className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white/80 active:bg-white/20"><MicOff size={24} /></button>
                       <button className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-[0_4px_20px_rgba(239,68,68,0.4)] active:bg-red-600" onClick={endCall}>
                         <Phone size={28} className="rotate-[135deg]" />
                       </button>
                       <button className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white/80 active:bg-white/20"><CameraOff size={24} /></button>
                     </>
                  )}
                </div>
              )}
            </div>
            
            {/* Self Video PIP */}
            {!isMinimized && videoCallState === 'connected' && (
              <div className="absolute top-20 right-6 w-24 h-36 bg-black/40 rounded-xl border border-white/20 overflow-hidden">
                 {avatar1 ? <img src={avatar1} alt="" className="w-full h-full object-cover opacity-80" /> : <div className="w-full h-full flex items-center justify-center text-white/30"><MonitorPlay size={24}/></div>}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
