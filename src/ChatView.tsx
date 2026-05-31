import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Video, Settings, Smile, Hand, Plus, Image as ImageIcon, Send, X, PhoneCall, PhoneMissed, Phone, MicOff, Mic, CameraOff, MonitorPlay, Check, CheckCheck, MessageCircle, MoreHorizontal, Heart, Sparkles, Camera } from 'lucide-react';
import { useLocalState, useIDBState, compressImage } from './utils';
import { useCallStore } from './callStore';

type Message = {
  id: string;
  sender: 'me' | 'them';
  type: 'text' | 'nudge' | 'emoji' | 'call' | 'sticker' | 'check_in' | 'image' | 'voice';
  content: string;
  time: string;
  callState?: 'missed' | 'declined' | 'duration';
  callDuration?: number;
  replyTo?: string;
  checkInStatus?: 'pending' | 'completed' | 'rejected';
  audioUrl?: string;
  voiceDuration?: number;
  isIgnored?: boolean;
};

export const ChatView = ({ onClose, onOpenSettings, themeConfig }: any) => {
  const [messages, setMessages] = useIDBState<Message[]>('app_chatMessages', []);
  const [checkIns, setCheckIns] = useIDBState<any[]>('app_checkins', []);
  const [input, setInput] = useState('');
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioObjRef = useRef<HTMLAudioElement | null>(null);
  const recordingStartTimeRef = useRef<number>(0);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let options: MediaRecorderOptions | undefined = undefined;
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
         options = { mimeType: 'audio/mp4' };
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
         options = { mimeType: 'audio/webm' };
      }
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        let mimeType = mediaRecorder.mimeType || audioChunksRef.current[0]?.type || 'audio/webm';
        mimeType = mimeType.split(';')[0]; // Remove codecs to prevent data URL corruption
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
           const audioUrl = reader.result as string;
           stream.getTracks().forEach(track => track.stop());
           const actualDuration = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
           handleSendVoice(audioUrl, actualDuration);
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      recordingStartTimeRef.current = Date.now();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error(err);
      alert('无法访问麦克风');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const cancelRecording = () => {
     if (mediaRecorderRef.current && isRecording) {
        // override onstop so it doesn't send
        mediaRecorderRef.current.onstop = () => {
           mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        clearInterval(recordingTimerRef.current);
     }
  };

  const handleSendVoice = (audioUrl: string, duration: number) => {
    if (duration === 0) duration = 1;
    const ignored = readNoReply && Math.random() < 0.05;
    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'me',
      type: 'voice',
      content: '',
      audioUrl,
      voiceDuration: duration,
      time: getFormatTime(),
      isIgnored: ignored
    };
    setMessages(msgs => [...msgs, newMsg]);
    if (!ignored) {
      setIsTyping(true);
      setTimeout(() => {
        simulateReply();
      }, 1000);
    }
  };

  
  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [activeCheckInId, setActiveCheckInId] = useState('');
  const [checkInText, setCheckInText] = useState('');
  const [checkInImage, setCheckInImage] = useState('');
  const checkInImgInputRef = useRef<HTMLInputElement>(null);

  const [charId, setCharId] = useLocalState('app_mjNickname', '梦角');
  const [myNickname] = useLocalState('app_myNickname', '我');
  
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // States from appearance / settings
  const [chatBg] = useIDBState('app_chatBg', '');
  const [avatar1] = useIDBState('app_chatAvatar1', '');
  const [avatar2] = useIDBState('app_chatAvatar2', '');
  const [chatCss] = useIDBState('app_chatCss', '');
  const [chatFont] = useIDBState('app_chatFont', '');
  
  const [mockVideo] = useLocalState('app_chatMockVideoCall', true);
  const [chatBubbleStyle] = useLocalState<'glass'|'system'>('app_chatBubbleStyle', 'glass');
  const [cardGroups] = useLocalState<any[]>('app_cardGroups', []);
  const replyCards = cardGroups.flatMap(g => g.cards).map(content => ({ content }));
  const [receiptStyle] = useLocalState('app_chatReceiptStyle', 'graphic');
  const [readReceipt] = useLocalState('app_chatReadReceipt', true);
  const [readNoReply] = useLocalState('app_chatReadNoReply', false);
  const [emojis] = useLocalState<string[]>('app_emojis', ['😀', '😂', '🥰', '👍', '🙏']);
  const [stickers] = useIDBState<string[]>('app_stickers', []);

    // Video Call State
  const { videoCallState, setVideoCallState, isMinimized, setIsMinimized, callDuration } = useCallStore();

  const [showPlusMenu, setShowPlusMenu] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const stickerInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isSticker: boolean) => {
     if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
           if (e.target?.result) {
              const ignored = readNoReply && Math.random() < 0.05;
              const newMsg: Message = {
                id: Date.now().toString(),
                sender: 'me',
                type: isSticker ? 'sticker' : 'sticker', // For now use sticker type for any image
                content: e.target.result as string,
                time: getFormatTime(),
                isIgnored: ignored
              };
              setMessages(prev => [...prev, newMsg]);
              setShowPlusMenu(false);
              
              if (!ignored) {
                 simulateReply();
              }
           }
        };
        reader.readAsDataURL(file);
     }
  };

  const [mixEmoji] = useLocalState('app_chatMixEmoji', true);
  const [timestampStyle] = useLocalState<'short'|'long'>('app_chatTimestampStyle', 'short');
  
  const getFormatTime = () => {
    return timestampStyle === 'long' 
      ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  const primaryColor = themeConfig.textPrimary || '#a894a7';
  const [chatBubbleColor] = useLocalState('app_chatBubbleColor', '');
  const bubbleColor = chatBubbleColor || primaryColor;

  useEffect(() => {
    let timer: any;
    const scheduleNextCall = () => {
      const waitMins = 15 + Math.random() * 45;
      timer = setTimeout(() => {
         if (Math.random() < 0.25) { // 25% chance of an event every ~30 mins
           if (Math.random() < 0.5 && videoCallState === 'none') {
             // 50% chance for video call
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
                     time: getFormatTime()
                   }]);
                   return 'none';
                 }
                 return prev;
               });
             }, 30000);
           } else {
             // 50% chance for check-in
             setMessages(msgs => [...msgs, {
               id: Date.now().toString(),
               sender: 'them',
               type: 'check_in',
               content: `${charId} 想知道你在干什么`,
               checkInStatus: 'pending',
               time: getFormatTime()
             }]);
             const pushNotify = window.localStorage.getItem('app_chatPushNotify');
             if ((pushNotify ? JSON.parse(pushNotify) : true) && 'Notification' in window && window.Notification.permission === 'granted') {
               new window.Notification(charId, { body: `${charId} 想知道你在干什么` });
             }
           }
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
    if (showPlusMenu || Object.keys(themeConfig).length > 0) {} // Dummy to avoid empty effect
    return () => clearInterval(timer);
  }, [showPlusMenu, themeConfig]);

  const handleSend = (text: string = input, type: 'text'|'nudge'|'emoji' = 'text') => {
    if (!text.trim() && type === 'text') return;
    
    const ignored = readNoReply && Math.random() < 0.05;
    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'me',
      type,
      content: text,
      time: getFormatTime(),
      isIgnored: ignored
    };
    
    setMessages([...messages, newMsg]);
    setInput('');
    
    if (!ignored) {
      simulateReply();
    }
  };

  const [minWait] = useLocalState('app_chatMinWait', 10);
  const [maxWait] = useLocalState('app_chatMaxWait', 50);

  const declineCheckIn = (id: string) => {
     setMessages(msgs => msgs.map(m => m.id === id ? { ...m, checkInStatus: 'rejected' } : m));
  };

  const openCheckInModal = (id: string) => {
     setActiveCheckInId(id);
     setCheckInText('');
     setCheckInImage('');
     setCheckInModalVisible(true);
  };
  
  const submitCheckIn = () => {
     if (!checkInText && !checkInImage) return;

     setCheckIns(prev => [...prev, {
        id: Date.now().toString(),
        timestamp: Date.now(),
        text: checkInText,
        imageUrl: checkInImage
     }]);
     
     setMessages(msgs => msgs.map(m => m.id === activeCheckInId ? { ...m, checkInStatus: 'completed' } : m));
     
     if (checkInImage) {
        setMessages(msgs => [...msgs, {
          id: Date.now().toString(),
          sender: 'me',
          type: 'image',
          content: checkInImage,
          time: getFormatTime()
        }]);
     }
     
     if (checkInText) {
        setMessages(msgs => [...msgs, {
          id: (Date.now() + 1).toString(),
          sender: 'me',
          type: 'text',
          content: checkInText,
          time: getFormatTime()
        }]);
     }

     setCheckInModalVisible(false);
  };

  const simulateReply = () => {
    const delay = Math.random() * (maxWait - minWait) * 1000 + minWait * 1000;
    const typingDuration = Math.min(delay, Math.random() * 3000 + 2000);
    const waitBeforeTyping = delay - typingDuration;
    
    setTimeout(() => {
      setIsTyping(true);
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
          time: getFormatTime()
        });
      }

      if (Math.random() < 0.05) {
        newMsgs.push({
          id: (++baseId).toString(),
          sender: 'them',
          type: 'check_in',
          content: `${charId} 想知道你在干什么`,
          checkInStatus: 'pending',
          time: getFormatTime()
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
          time: getFormatTime()
        });

        if (sendEmojiSeparate) {
          newMsgs.push({
            id: (++baseId).toString(),
            sender: 'them',
            type: 'emoji',
            content: emojiContent,
            time: getFormatTime()
          });
        }

        if (Math.random() < 0.2 && stickers.length > 0) {
          const sticker = stickers[Math.floor(Math.random() * stickers.length)];
          newMsgs.push({
             id: (++baseId).toString(),
             sender: 'them',
             type: 'sticker',
             content: sticker,
             time: getFormatTime()
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
      }, typingDuration);
    }, waitBeforeTyping);
  };

  const handleNudge = () => {
    const defaultNudgePrefix = '拍了拍对方';
    const nudgeContent = window.localStorage.getItem('app_chatNudgeText') 
      ? JSON.parse(window.localStorage.getItem('app_chatNudgeText') as string)
      : defaultNudgePrefix;
    handleSend(nudgeContent, 'nudge');
  };

  const initiateCall = () => {
    setVideoCallState('calling');
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
          time: getFormatTime()
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
      time: getFormatTime()
    }]);
  };

  const acceptCall = () => {
    setVideoCallState('connected');
  };

  const declineCall = () => {
    setVideoCallState('none');
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'me',
      type: 'call',
      content: '已拒绝',
      callState: 'declined',
      time: getFormatTime()
    }]);
  };

  const customStyle = chatFont ? { fontFamily: 'CustomChatFont, sans-serif' } : {};

  const handleCheckInImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files[0]) {
        try {
           const dataUrl = await compressImage(e.target.files[0]);
           setCheckInImage(dataUrl);
        } catch (err) {
           console.error(err);
        }
     }
  };

  return (
    <div className="fixed inset-0 overflow-hidden z-50 transition-colors" style={{ ...customStyle, backgroundColor: themeConfig.bg }}>
      {chatBg && <img src={chatBg} alt="" className="absolute inset-0 object-cover pointer-events-none" style={{ width: '100%', height: '100%', zIndex: 0 }} /> }
      {chatFont && <style dangerouslySetInnerHTML={{ __html: `@font-face { font-family: 'CustomChatFont'; src: url('${chatFont}'); }` }} />}
      {chatCss && <style dangerouslySetInnerHTML={{ __html: chatCss }} />}
      
      {/* Header */}
      <div className="absolute top-[max(1rem,env(safe-area-inset-top))] left-4 right-4 flex items-start justify-between z-20">
        <button onClick={onClose} className="w-[42px] h-[42px] rounded-full flex items-center justify-center bg-white/20 backdrop-blur-xl border border-white/40 shadow-[0_2px_12px_rgba(0,0,0,0.06),inset_0_2px_4px_rgba(255,255,255,0.3)] active:scale-95 transition-transform" style={{ color: themeConfig.textPrimary || '#333' }}>
          <ChevronLeft size={22} strokeWidth={2.5} className="-ml-0.5" />
        </button>
        <div className="flex flex-col items-center">
           <div className="w-[52px] h-[52px] rounded-full bg-black/10 overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-white/30 z-10 -mb-3.5 relative">
               {avatar2 ? <img src={avatar2} alt="" className="w-full h-full object-cover" /> : null}
           </div>
           <div className="bg-white/20 backdrop-blur-xl border border-white/40 shadow-[0_4px_16px_rgba(0,0,0,0.06),inset_0_2px_4px_rgba(255,255,255,0.4)] px-6 pt-5 pb-2 rounded-[20px] text-center min-w-[120px]">
               <input 
                 value={charId}
                 onChange={e => setCharId(e.target.value)}
                 className="text-[15px] font-bold text-center bg-transparent outline-none m-0 p-0 leading-none"
                 style={{ width: `${Math.max(1, charId.length) * 1.05 + 0.5}em`, color: themeConfig.textPrimary || '#111' }}
               />
           </div>
        </div>
        <button onClick={() => onOpenSettings(themeConfig)} className="w-[42px] h-[42px] rounded-full flex items-center justify-center bg-white/20 backdrop-blur-xl border border-white/40 shadow-[0_2px_12px_rgba(0,0,0,0.06),inset_0_2px_4px_rgba(255,255,255,0.3)] active:scale-95 transition-transform" style={{ color: themeConfig.textPrimary || '#333' }}>
          <MoreHorizontal size={22} strokeWidth={2.5} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="absolute inset-0 overflow-y-auto px-4 pt-[calc(env(safe-area-inset-top)+80px)] pb-[calc(env(safe-area-inset-bottom)+85px)] flex flex-col scrollbar-hide z-10">
        {messages.map((msg, i) => {
          const isMe = msg.sender === 'me';
          const avatar = isMe ? (avatar1 || '') : (avatar2 || '');
          
          const nextMsg = messages[i + 1];
          const isGroupedNext = nextMsg && nextMsg.sender === msg.sender && nextMsg.time === msg.time && nextMsg.type !== 'call' && nextMsg.type !== 'nudge' && msg.type !== 'call' && msg.type !== 'nudge';
          const marginBottom = isGroupedNext ? 'mb-1' : 'mb-5';

          // isRead if there's any message from them after this, or if it was marked as ignored
          const isRead = messages.slice(i + 1).some(m => m.sender === 'them') || msg.isIgnored;

          if (msg.type === 'nudge') {
            return (
              <div key={msg.id} className={`w-full flex justify-center ${marginBottom}`}>
                <div className="px-3 py-1 rounded-full bg-black/[0.05] text-[12px] text-gray-500">
                  {isMe ? myNickname : charId}{msg.content}
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

          if (msg.type === 'check_in') {
             return (
               <div key={msg.id} className={`w-full flex justify-center ${marginBottom} px-4`}>
                 <div className="bg-white/15 backdrop-blur-3xl rounded-[24px] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_2px_4px_rgba(255,255,255,0.4)] w-full max-w-[320px] flex flex-col items-center border border-white/40 relative overflow-hidden">
                   <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)] border border-white/30 text-white">
                      <Camera size={22} />
                   </div>
                   <div className="text-[16px] text-white font-semibold mb-1 tracking-wide drop-shadow-sm">{msg.content}</div>
                   <div className="text-[12px] text-white/70 mb-4">{msg.time} · 互动查岗</div>
                   
                   {msg.checkInStatus === 'pending' ? (
                     <div className="flex space-x-3 w-full">
                        <button className="flex-1 py-2.5 rounded-[12px] bg-black/20 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.1)] flex items-center justify-center text-white/90 font-medium active:scale-95 transition-transform border border-white/20" onClick={() => declineCheckIn(msg.id)}>
                           忽略
                        </button>
                        <button className="flex-1 py-2.5 rounded-[12px] bg-white/30 backdrop-blur-md shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_2px_10px_rgba(0,0,0,0.1)] flex items-center justify-center text-white font-medium active:scale-95 transition-transform border border-white/40" onClick={() => openCheckInModal(msg.id)}>
                           查岗汇报
                        </button>
                     </div>
                   ) : msg.checkInStatus === 'rejected' ? (
                     <div className="w-full py-2.5 rounded-[12px] bg-black/10 backdrop-blur-md text-white/70 text-center text-[13px] font-medium border border-white/10">
                        已忽略
                     </div>
                   ) : (
                     <div className="w-full py-2.5 rounded-[12px] bg-white/20 backdrop-blur-md shadow-[inset_0_1px_3px_rgba(255,255,255,0.3)] text-white text-center text-[13px] font-medium border border-white/30">
                        {charId}收到了
                     </div>
                   )}
                 </div>
               </div>
             );
          }

          return (
            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${marginBottom}`}>
              {!isMe && (
                <div className="w-[38px] h-[38px] shrink-0 mr-2.5">
                  {!isGroupedNext && <div className="w-full h-full rounded-full bg-black/10 overflow-hidden shadow-sm border border-white/20">
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
                ) : msg.type === 'image' ? (
                  <div className="rounded-[18px] overflow-hidden shrink-0 border border-black/5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    <img src={msg.content} alt="image" className="max-w-[180px] max-h-[250px] object-cover" />
                  </div>
                ) : msg.type === 'voice' ? (
                  <div 
                    className={chatBubbleStyle === 'system' ? 
                      `flex items-center space-x-2 px-4 py-2.5 ${isMe ? 'rounded-[20px] rounded-tr-[4px]' : 'rounded-[20px] rounded-tl-[4px]'}` : 
                      `flex items-center space-x-2 px-4 py-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.06),inset_0_1px_3px_rgba(255,255,255,0.4)] backdrop-blur-3xl ${isMe ? 'border border-white/30' : 'border border-white/40'} ${isMe ? 'rounded-[20px] rounded-tr-[4px]' : 'rounded-[20px] rounded-tl-[4px]'}`
                    }
                    style={chatBubbleStyle === 'system' ? {
                      backgroundColor: isMe ? bubbleColor : '#E9E9EB',
                      color: isMe ? '#fff' : '#000',
                      minWidth: `${Math.min(200, 80 + (msg.voiceDuration || 1) * 5)}px`
                    } : {
                      backgroundColor: isMe ? `${bubbleColor}66` : 'rgba(255,255,255,0.15)',
                      color: '#fff',
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      minWidth: `${Math.min(200, 80 + (msg.voiceDuration || 1) * 5)}px`
                    }}
                    onClick={() => {
                       if (msg.audioUrl && playingVoiceId !== msg.id) {
                          if (audioObjRef.current) {
                             audioObjRef.current.pause();
                          }
                          let playUrl = msg.audioUrl;
                          if (playUrl.startsWith('data:audio/')) {
                             const match = playUrl.match(/^data:(audio\/[^;,]+)(?:;codecs=[^;,]+)?(;base64,.*)$/);
                             if (match) {
                                playUrl = 'data:' + match[1] + match[2];
                             }
                          }
                          const audio = new Audio(playUrl);
                          audioObjRef.current = audio;
                          setPlayingVoiceId(msg.id);

                          audio.onended = () => {
                             setPlayingVoiceId(null);
                             audioObjRef.current = null;
                          };
                          audio.onerror = () => {
                             setPlayingVoiceId(null);
                             audioObjRef.current = null;
                          };

                          audio.play().catch(e => {
                             console.error('Audio play failed:', e);
                             alert('播放失败：该音频已过期或格式不支持');
                             setPlayingVoiceId(null);
                             audioObjRef.current = null;
                          });
                       } else if (playingVoiceId === msg.id) {
                          if (audioObjRef.current) {
                             audioObjRef.current.pause();
                          }
                          setPlayingVoiceId(null);
                          audioObjRef.current = null;
                       }
                    }}
                  >
                    {isMe ? <span className="text-[14px]">{msg.voiceDuration}s</span> : <Mic size={18} />}
                    <div className="flex-1 flex justify-center space-x-1">
                      {Array.from({ length: Math.min(10, Math.max(3, (msg.voiceDuration || 1))) }).map((_, i) => (
                        <div key={i} className={`w-1 rounded-full ${playingVoiceId === msg.id ? 'animate-pulse' : ''} ${chatBubbleStyle === 'system' && !isMe ? 'bg-black/40' : 'bg-white/70'}`} style={{ height: `${Math.random() * 12 + 4}px`, animationDelay: `${i * 0.1}s` }}></div>
                      ))}
                    </div>
                    {isMe ? <Mic size={18} /> : <span className="text-[14px]">{msg.voiceDuration}s</span>}
                  </div>
                ) : msg.type === 'emoji' ? (
                  <div className="text-[48px] leading-none drop-shadow-sm">{msg.content}</div>
                ) : (
                  <div 
                    className={chatBubbleStyle === 'system' ? 
                      `chat-bubble px-4 py-2.5 text-[15px] leading-relaxed ${isMe ? 'rounded-[20px] rounded-tr-[4px]' : 'rounded-[20px] rounded-tl-[4px]'}` :
                      `chat-bubble px-4 py-2.5 text-[15px] leading-relaxed shadow-[0_4px_16px_rgba(0,0,0,0.06),inset_0_1px_3px_rgba(255,255,255,0.4)] backdrop-blur-3xl ${isMe ? 'border border-white/30' : 'border border-white/40'} ${isMe ? 'rounded-[20px] rounded-tr-[4px]' : 'rounded-[20px] rounded-tl-[4px]'}`
                    }
                    style={chatBubbleStyle === 'system' ? {
                      backgroundColor: isMe ? bubbleColor : '#E9E9EB',
                      color: isMe ? '#fff' : '#000'
                    } : {
                      backgroundColor: isMe ? `${bubbleColor}66` : 'rgba(255,255,255,0.15)',
                      color: '#fff',
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}
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
                           isRead ? <CheckCheck size={18} strokeWidth={2.5} style={{color: bubbleColor, marginLeft: '2px'}} /> : <Check size={16} strokeWidth={2} className="opacity-40" />
                         )}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {isMe && (
                <div className="w-[38px] h-[38px] shrink-0 ml-2.5">
                  {!isGroupedNext && <div className="w-full h-full rounded-full bg-black/10 overflow-hidden shadow-sm border border-white/20">
                    {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : null}
                  </div>}
                </div>
              )}
            </div>
          );
        })}
        {isTyping && (
           <div className="flex w-full justify-start">
             <div className="w-[38px] h-[38px] rounded-full bg-black/10 shrink-0 mr-2.5 overflow-hidden border border-white/20">
                {avatar2 ? <img src={avatar2} alt="" className="w-full h-full object-cover" /> : null}
              </div>
              <div className={chatBubbleStyle === 'system' ? 
                `chat-bubble px-4 py-3 rounded-[20px] rounded-tl-[4px] bg-[#E9E9EB] flex space-x-1.5 items-center` :
                `chat-bubble px-4 py-3 rounded-[20px] rounded-tl-[4px] bg-white/15 backdrop-blur-3xl border border-white/40 shadow-[0_4px_16px_rgba(0,0,0,0.06),inset_0_1px_3px_rgba(255,255,255,0.4)] flex space-x-1.5 items-center`
              }>
                <motion.div className={`w-1.5 h-1.5 rounded-full ${chatBubbleStyle === 'system' ? 'bg-black/40' : 'bg-white/80'}`} animate={{y: [0, -4, 0]}} transition={{repeat: Infinity, duration: 0.8}} />
                <motion.div className={`w-1.5 h-1.5 rounded-full ${chatBubbleStyle === 'system' ? 'bg-black/40' : 'bg-white/80'}`} animate={{y: [0, -4, 0]}} transition={{repeat: Infinity, duration: 0.8, delay: 0.2}} />
                <motion.div className={`w-1.5 h-1.5 rounded-full ${chatBubbleStyle === 'system' ? 'bg-black/40' : 'bg-white/80'}`} animate={{y: [0, -4, 0]}} transition={{repeat: Infinity, duration: 0.8, delay: 0.4}} />
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
            className="absolute bottom-[calc(4rem+env(safe-area-inset-bottom))] left-3 right-3 bg-white/70 backdrop-blur-xl rounded-[16px] py-4 flex justify-around px-2 items-center z-20 shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-white/50"
          >
             <button className="flex flex-col items-center gap-2 group w-[64px]" onClick={() => { initiateCall(); setShowPlusMenu(false); }}>
                <div className="w-[50px] h-[50px] rounded-[16px] flex items-center justify-center group-active:scale-95 transition-transform" style={{ backgroundColor: themeConfig.cardBg, color: primaryColor }}><Video size={24} strokeWidth={1.5} /></div>
                <span className="text-[11px] text-black/50">视频通话</span>
             </button>
             <div className="flex flex-col items-center gap-2 group cursor-pointer w-[64px]" onClick={() => imageInputRef.current?.click()}>
                <div className="w-[50px] h-[50px] rounded-[16px] flex items-center justify-center group-active:scale-95 transition-transform" style={{ backgroundColor: themeConfig.cardBg, color: primaryColor }}><ImageIcon size={24} strokeWidth={1.5} /></div>
                <span className="text-[11px] text-black/50">图片</span>
             </div>
             <div className="flex flex-col items-center gap-2 group cursor-pointer w-[64px]" onClick={() => stickerInputRef.current?.click()}>
                <div className="w-[50px] h-[50px] rounded-[16px] flex items-center justify-center group-active:scale-95 transition-transform" style={{ backgroundColor: themeConfig.cardBg, color: primaryColor }}><Smile size={24} strokeWidth={1.5} /></div>
                <span className="text-[11px] text-black/50">表情库</span>
             </div>
             <button className="flex flex-col items-center gap-2 group w-[64px]" onClick={() => { handleNudge(); setShowPlusMenu(false); }}>
                <div className="w-[50px] h-[50px] rounded-[16px] flex items-center justify-center group-active:scale-95 transition-transform" style={{ backgroundColor: themeConfig.cardBg, color: primaryColor }}><Heart size={24} strokeWidth={1.5} /></div>
                <span className="text-[11px] text-black/50">拍一拍</span>
             </button>
             
             
             <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, false)} />
             <input type="file" ref={stickerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, true)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="absolute bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-3 right-3 flex items-center space-x-2 z-30">
        <button 
          className={`w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0 border border-white/20 text-white shadow-[0_4px_12px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.3)] active:scale-95 transition-all ${showPlusMenu ? 'rotate-45' : ''}`}
          style={{ backgroundColor: bubbleColor }}
          onClick={() => setShowPlusMenu(!showPlusMenu)}
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
        <div className={`flex-1 h-[42px] rounded-full flex items-center px-4 bg-white/20 backdrop-blur-3xl border ${isRecording ? 'border-primary shadow-[0_0_20px_rgba(0,122,255,0.2)] bg-white/30' : 'border-white/40 shadow-[0_4px_16px_rgba(0,0,0,0.06),inset_0_2px_4px_rgba(255,255,255,0.3)]'} overflow-hidden relative transition-all duration-300`}>
          {isRecording ? (
            <div className="flex-1 flex items-center justify-between text-white font-medium text-[15px] animate-in fade-in">
               <div className="flex items-center space-x-2">
                 <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                 <span>正在录音 {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
               </div>
               <div className="flex items-center space-x-4">
                 <button onClick={cancelRecording} className="text-white/70 hover:text-white shrink-0 flex items-center text-[13px]"><X size={16} className="mr-0.5"/>取消</button>
                 <button onClick={stopRecording} className="text-white shrink-0 flex items-center text-[13px] active:scale-95 bg-[#007AFF] px-2 py-1 rounded-full shadow-sm"><Send size={14} className="mr-1"/>发送</button>
               </div>
            </div>
          ) : (
            <input 
              type="text"
              className="flex-1 bg-transparent border-none outline-none text-[15px] p-0 text-white placeholder-white/70"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="发送消息..."
              onFocus={() => setShowPlusMenu(false)}
            />
          )}

          {!isRecording && (
             <div className="flex items-center space-x-3 ml-2 pr-1">
                {!input.trim() ? (
                  <>
                    <button onClick={() => simulateReply()} className="active:scale-95 transition-transform" style={{ color: bubbleColor }}>
                       <Sparkles size={20} strokeWidth={2} />
                    </button>
                    <button 
                      onClick={() => isRecording ? stopRecording() : startRecording()}
                      className="active:scale-95 transition-transform"
                      style={{ color: bubbleColor }}
                    >
                       <Mic size={20} strokeWidth={2} />
                    </button>
                  </>
                ) : (
                  <button onClick={() => handleSend()} className="active:scale-95 transition-transform w-[28px] h-[28px] rounded-full flex items-center justify-center shadow-sm text-white" style={{ backgroundColor: bubbleColor }}>
                     <Send size={15} strokeWidth={2.5} className="-ml-0.5 mt-0.5" />
                  </button>
                )}
             </div>
          )}
        </div>
      </div>



      {/* Check In Modal Overlay */}
      <AnimatePresence>
        {checkInModalVisible && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-center p-4 pt-32"
          >
            <motion.div 
              initial={{ y: 50, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.95 }}
              className="bg-white/20 backdrop-blur-3xl border border-white/40 shadow-[0_16px_40px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.4)] rounded-[32px] p-6 w-full max-w-[360px] h-max relative overflow-hidden"
            >
              <button 
                onClick={() => setCheckInModalVisible(false)} 
                className="absolute right-5 top-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 border border-white/30 text-white active:scale-95 transition-transform z-10 shadow-[inset_0_1px_3px_rgba(255,255,255,0.4)]"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
              
              <div className="flex flex-col items-center mb-6 mt-2 relative z-10 text-white">
                 <div className="w-14 h-14 bg-white/20 border border-white/30 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)] rounded-full flex items-center justify-center text-white mb-3">
                    <Camera size={24} strokeWidth={2.5}/>
                 </div>
                 <h3 className="text-[19px] font-semibold tracking-wide drop-shadow-sm">{charId}正在查岗</h3>
                 <p className="text-[13px] text-white/80 mt-1 text-center">拍张照或者写点什么，让他知道你的状态吧</p>
              </div>
              
              <div className="space-y-4 relative z-10">
                {checkInImage ? (
                  <div className="relative w-full h-[220px] bg-black/10 rounded-[20px] border border-white/20 overflow-hidden shadow-inner">
                    <img src={checkInImage} alt="" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setCheckInImage('')}
                      className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-1.5 backdrop-blur-md active:scale-95 border border-white/20"
                    >
                      <X size={16} strokeWidth={2.5}/>
                    </button>
                  </div>
                ) : (
                   <button 
                     onClick={() => checkInImgInputRef.current?.click()}
                     className="w-full h-[140px] rounded-[20px] border border-white/30 bg-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] text-white/90 flex flex-col items-center justify-center space-y-2 active:bg-white/20 transition-colors"
                   >
                     <div className="w-10 h-10 rounded-full bg-white/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] flex items-center justify-center text-white mb-1 border border-white/20">
                        <Camera size={20} strokeWidth={2.5} />
                     </div>
                     <span className="text-[14px] font-medium drop-shadow-sm">拍摄或从相册选择</span>
                   </button>
                )}
                <input type="file" ref={checkInImgInputRef} className="hidden" accept="image/*" onChange={handleCheckInImageUpload} />

                <textarea
                  value={checkInText}
                  onChange={(e) => setCheckInText(e.target.value)}
                  placeholder="文字描述：正在做什么..."
                  className="w-full h-[110px] bg-white/10 border border-white/30 rounded-[20px] p-4 text-[15px] outline-none resize-none text-white placeholder-white/60 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] focus:bg-white/20 transition-colors"
                />

                <button 
                  onClick={submitCheckIn}
                  disabled={!checkInText && !checkInImage}
                  className="w-full py-4 rounded-[20px] font-medium text-[16px] text-white transition-all duration-300 mt-2 flex items-center justify-center space-x-2 border shadow-[0_4px_12px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.4)] disabled:opacity-50 disabled:shadow-none bg-white/20 border-white/40 active:scale-95"
                  style={{ backgroundColor: (checkInText.trim() || checkInImage) ? bubbleColor : 'rgba(255,255,255,0.2)' }}
                >
                  <Send size={18} />
                  <span>发送汇报</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
