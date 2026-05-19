import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Video, Settings, Smile, Hand, Plus, Image as ImageIcon, Send, X, PhoneCall, PhoneMissed, Phone, MicOff, CameraOff, MonitorPlay } from 'lucide-react';
import { useLocalState } from './utils';

type Message = {
  id: string;
  sender: 'me' | 'them';
  type: 'text' | 'nudge' | 'emoji' | 'call';
  content: string;
  time: string;
  callState?: 'missed' | 'declined' | 'duration';
  callDuration?: number;
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
  const [replyCards] = useLocalState<any[]>('app_replyCards', []);
  const [statuses] = useLocalState<any[]>('app_atmosphereStatuses', []);
  const [receiptStyle] = useLocalState('app_chatReceiptStyle', 'graphic');
  const [readReceipt] = useLocalState('app_chatReadReceipt', true);
  const [readNoReply] = useLocalState('app_chatReadNoReply', false);

  // Video Call State
  const [videoCallState, setVideoCallState] = useState<'none' | 'calling' | 'connected'>('none');
  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const [mixEmoji] = useLocalState('app_chatMixEmoji', true);
  const primaryColor = themeConfig.textPrimary || '#a894a7';

  // Current status
  const currentStatus = statuses.length > 0 ? statuses[Math.floor(Math.random() * statuses.length)].content : '在线';

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
      const replyCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 messages
      const newMsgs: Message[] = [];
      
      for(let i=0; i<replyCount; i++) {
        let content = '嗯嗯';
        if (replyCards.length > 0) {
           content = replyCards[Math.floor(Math.random() * replyCards.length)].content;
        }
        newMsgs.push({
          id: Date.now().toString() + i,
          sender: 'them',
          type: 'text',
          content,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
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
      if (Math.random() > 0.3) {
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

  const customStyle = chatFont ? { fontFamily: 'CustomChatFont, sans-serif' } : {};

  return (
    <div className="flex-1 w-full flex flex-col relative h-full overflow-hidden" style={{ ...customStyle, backgroundColor: chatBg ? 'transparent' : themeConfig.bg, backgroundImage: chatBg ? `url(${chatBg})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {chatFont && <style dangerouslySetInnerHTML={{ __html: `@font-face { font-family: 'CustomChatFont'; src: url('${chatFont}'); }` }} />}
      {chatCss && <style dangerouslySetInnerHTML={{ __html: chatCss }} />}
      
      {/* Header */}
      <div className="w-full flex items-center justify-between px-3 pb-3 pt-[env(safe-area-inset-top)] mt-4 z-10" style={{ backgroundColor: themeConfig.bg ? themeConfig.bg + 'ee' : '#ffffffcc', backdropFilter: 'blur(12px)' }}>
        <button onClick={onClose} className="w-[60px] flex items-center p-1" style={{ color: themeConfig.textSecondary }}>
          <ChevronLeft size={26} className="-ml-1" />
        </button>
        <div className="flex-1 flex flex-col items-center justify-center">
          <input 
            value={charId}
            onChange={e => setCharId(e.target.value)}
            className="text-[17px] font-semibold text-center bg-transparent outline-none m-0 p-0"
            style={{ color: themeConfig.textPrimary }}
          />
          <div className="text-[11px] mt-0.5" style={{ color: themeConfig.textSecondary }}>{currentStatus}</div>
        </div>
        <div className="w-[60px] flex items-center justify-end space-x-3 pr-1">
          {mockVideo && (
            <button onClick={initiateCall} style={{ color: themeConfig.textSecondary }}><Video size={20} /></button>
          )}
          <button onClick={onOpenSettings} style={{ color: themeConfig.textSecondary }}><Settings size={20} /></button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-hide pb-20">
        {messages.map((msg, i) => {
          const isMe = msg.sender === 'me';
          const avatar = isMe ? (avatar1 || '') : (avatar2 || '');
          
          if (msg.type === 'nudge') {
            return (
              <div key={msg.id} className="w-full flex justify-center my-4">
                <div className="px-3 py-1 rounded-full bg-black/[0.05] text-[12px] text-gray-500">
                  {isMe ? '我' : charId}{msg.content}
                </div>
              </div>
            );
          }

          if (msg.type === 'call') {
            return (
              <div key={msg.id} className="w-full flex justify-center my-4">
                <div className="px-4 py-2 rounded-2xl bg-black/[0.03] text-[13px] flex items-center space-x-2 text-gray-600">
                  {msg.callState === 'declined' || msg.callState === 'missed' ? <PhoneMissed size={14} className="text-red-400" /> : <PhoneCall size={14} />}
                  <span>{msg.content}</span>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
              {!isMe && (
                <div className="w-9 h-9 rounded-full bg-black/10 shrink-0 mr-3 overflow-hidden">
                  {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : null}
                </div>
              )}
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                <div 
                  className={`chat-bubble px-4 py-2.5 rounded-[18px] text-[15px] leading-relaxed shadow-sm ${isMe ? 'bg-black text-white rounded-tr-[4px]' : 'bg-white rounded-tl-[4px]'}`}
                  style={isMe ? {backgroundColor: primaryColor} : {}}
                >
                  {msg.content}
                </div>
                <div className="text-[10px] text-black/30 mt-1 flex items-center space-x-1">
                  <span>{msg.time}</span>
                  {isMe && readReceipt && (
                    <span className="text-black/20 ml-1">
                       {receiptStyle === 'text' ? '已读' : <span className="text-[9px]">✓✓</span>}
                    </span>
                  )}
                </div>
              </div>
              {isMe && (
                <div className="w-9 h-9 rounded-full bg-black/10 shrink-0 ml-3 overflow-hidden">
                  {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : null}
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

      {/* Input Area */}
      <div className="w-full bg-white/90 backdrop-blur-md border-t border-black/[0.04] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-end space-x-3">
        <button className="p-2 mb-1 text-black/40"><Plus size={24} /></button>
        <div className="flex-1 bg-black/[0.04] rounded-[20px] min-h-[40px] flex items-center px-3 py-1">
          <input 
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-[15px] p-2"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button className="p-1.5 text-black/40" onClick={() => mixEmoji ? setInput(input + '😊') : handleSend('😊', 'emoji')}><Smile size={20} /></button>
        </div>
        <button className="p-2 mb-1 text-black/40" onClick={handleNudge}><Hand size={24} /></button>
        {input.trim() && (
          <button className="p-2 mb-1 bg-black text-white rounded-full shadow-sm" style={{backgroundColor: primaryColor}} onClick={() => handleSend()}>
            <Send size={18} className="ml-0.5" />
          </button>
        )}
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
                  {videoCallState === 'calling' ? '正在等待接听...' : `${Math.floor(callDuration / 60).toString().padStart(2, '0')}:${(callDuration % 60).toString().padStart(2, '0')}`}
                </div>
              </div>

              {!isMinimized && (
                <div className="pb-16 px-10 flex items-center justify-center space-x-8">
                  <button className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white/80 active:bg-white/20"><MicOff size={24} /></button>
                  <button className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-[0_4px_20px_rgba(239,68,68,0.4)] active:bg-red-600" onClick={endCall}>
                    <Phone size={28} className="rotate-[135deg]" />
                  </button>
                  <button className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white/80 active:bg-white/20"><CameraOff size={24} /></button>
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
