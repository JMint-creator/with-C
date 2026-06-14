import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Video, Settings, Smile, Hand, Plus, Image as ImageIcon, Send, X, PhoneCall, PhoneMissed, Phone, MicOff, Mic, CameraOff, MonitorPlay, Check, CheckCheck, MessageCircle, MoreHorizontal, Heart, Sparkles, Camera } from 'lucide-react';
import { useLocalState, useIDBState, compressImage } from './utils';
import { useCallStore, callStore } from './callStore';

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

export const ChatView = ({ 
  onClose, 
  onOpenSettings, 
  themeConfig,
  chatBg: propChatBg,
  chatAvatar1: propChatAvatar1,
  chatAvatar2: propChatAvatar2,
  chatCss: propChatCss,
  chatFont: propChatFont
}: any) => {
  const [messages, setMessages] = useIDBState<Message[]>('app_chatMessages', []);
  const [checkIns, setCheckIns] = useIDBState<any[]>('app_checkins', []);
  const [voiceCards] = useIDBState<Array<{ id: string, name: string, url: string, duration: number }>>('app_voiceCards', []);
  const [input, setInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [activeMenuMsgId, setActiveMenuMsgId] = useState<string | null>(null);
  
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
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      sender: "me",
      type: "voice",
      content: "",
      audioUrl,
      voiceDuration: duration,
      replyTo: replyingTo ? (replyingTo.type === "text" ? (replyingTo.content.length > 40 ? replyingTo.content.substring(0, 40) + '...' : replyingTo.content) : (replyingTo.type === "voice" ? "[语音]" : "[图片/表情]")) : undefined,
      time: getFormatTime(),
      isIgnored: ignored
    };
    setMessages(msgs => [...msgs, newMsg]);
    setReplyingTo(null);
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
  const [localChatBg] = useIDBState('app_chatBg', '');
  const [localAvatar1] = useIDBState('app_chatAvatar1', '');
  const [localAvatar2] = useIDBState('app_chatAvatar2', '');
  const [localChatCss] = useIDBState('app_chatCss', '');
  const [localChatFont] = useIDBState('app_chatFont', '');

  const chatBg = propChatBg !== undefined ? propChatBg : localChatBg;
  const avatar1 = propChatAvatar1 !== undefined ? propChatAvatar1 : localAvatar1;
  const avatar2 = propChatAvatar2 !== undefined ? propChatAvatar2 : localAvatar2;
  const chatCss = propChatCss !== undefined ? propChatCss : localChatCss;
  const chatFont = propChatFont !== undefined ? propChatFont : localChatFont;
  
  const [mockVideo] = useLocalState('app_chatMockVideoCall', true);
  const [chatBubbleStyle] = useLocalState<'glass'|'system'>('app_chatBubbleStyle', 'glass');
  const [cardGroups] = useLocalState<any[]>('app_cardGroups', []);
  const replyCards = cardGroups.flatMap(g => g.cards).filter(c => {
    if (!c || typeof c !== 'string') return false;
    const trimmed = c.trim();
    return !(trimmed.startsWith('data:image/') || /^https?:\/\/.*\.(png|jpg|jpeg|gif|webp|svg)/i.test(trimmed));
  }).map(content => ({ content }));
  const [receiptStyle] = useLocalState('app_chatReceiptStyle', 'graphic');
  const [readReceipt] = useLocalState('app_chatReadReceipt', true);
  const [readNoReply] = useLocalState('app_chatReadNoReply', false);
  const [emojis] = useLocalState<string[]>('app_emojis', ['😀', '😂', '🥰', '👍', '🙏']);
  const [stickers, setStickers] = useIDBState<string[]>('app_stickers', []);

    // Video Call State
  const { videoCallState, setVideoCallState, isMinimized, setIsMinimized, callDuration } = useCallStore();

  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showStickerPane, setShowStickerPane] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const stickerInputRef = useRef<HTMLInputElement>(null);
  const newStickerInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isSticker: boolean) => {
     if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
           if (e.target?.result) {
              const ignored = readNoReply && Math.random() < 0.05;
              const newMsg: Message = {
                id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
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

  const handleNewStickerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
           if (event.target?.result) {
              const url = event.target.result as string;
              setStickers([...stickers, url]);
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

  const triggerIncomingVideoCall = () => {
    if (callStore.state !== 'none') return;
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
            id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
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
  };

  useEffect(() => {
    let timer: any;
    const scheduleNextCall = () => {
      const waitMins = 15 + Math.random() * 45;
      timer = setTimeout(() => {
         if (Math.random() < 0.25) { // 25% chance of an event every ~30 mins
           if (Math.random() < 0.5 && videoCallState === 'none') {
             // 50% chance for video call
             triggerIncomingVideoCall();
           } else {
             // 50% chance for check-in
             setMessages(msgs => [...msgs, {
               id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
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
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      sender: 'me',
      type,
      content: text,
      replyTo: replyingTo ? (replyingTo.type === 'text' ? (replyingTo.content.length > 40 ? replyingTo.content.substring(0, 40) + '...' : replyingTo.content) : (replyingTo.type === 'voice' ? '[语音]' : '[图片/表情]')) : undefined,
      time: getFormatTime(),
      isIgnored: ignored
    };
    
    setMessages([...messages, newMsg]);
    setInput('');
    setReplyingTo(null);
    
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
        id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
        timestamp: Date.now(),
        text: checkInText,
        imageUrl: checkInImage
     }]);
     
     setMessages(msgs => msgs.map(m => m.id === activeCheckInId ? { ...m, checkInStatus: 'completed' } : m));
     
     if (checkInImage) {
        setMessages(msgs => [...msgs, {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
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
    
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const newMsgs: Message[] = [];
      let baseId = Date.now();

      if (Math.random() < 0.03) {
        const storedNudges = window.localStorage.getItem('app_nudges');
        const nudgesArr = storedNudges ? JSON.parse(storedNudges) : ['拍了拍你'];
        const randomNudge = nudgesArr.length > 0 ? nudgesArr[Math.floor(Math.random() * nudgesArr.length)] : '拍了拍你';
        newMsgs.push({
          id: (++baseId).toString(),
          sender: 'them',
          type: 'nudge',
          content: randomNudge,
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

      // Add small chance of real-time proactive video call on conversation response!
      if (Math.random() < 0.04 && mockVideo && videoCallState === 'none') {
        setTimeout(() => {
          triggerIncomingVideoCall();
        }, 1500);
      }

      const r = Math.random();
      let replyCount = 1;
      if (r > 0.95) replyCount = 3;
      else if (r > 0.75) replyCount = 2;
      
      for(let i=0; i<replyCount; i++) {
        const shouldSendVoice = Math.random() < 0.12 && (voiceCards || []).length > 0;

        if (shouldSendVoice) {
          const randomVoice = (voiceCards || [])[Math.floor(Math.random() * (voiceCards || []).length)];
          newMsgs.push({
            id: (++baseId).toString(),
            sender: 'them',
            type: 'voice',
            content: '',
            audioUrl: randomVoice.url,
            voiceDuration: randomVoice.duration,
            time: getFormatTime()
          });
        } else {
          let content = '嗯嗯';
          if (replyCards.length > 0) {
             const condRand = Math.random();
             if (condRand < 0.15 && replyCards.length >= 2) {
               const countToConcat = Math.min(Math.random() < 0.5 ? 2 : 3, replyCards.length);
               const shuffled = [...replyCards].sort(() => Math.random() - 0.5);
               content = shuffled.slice(0, countToConcat).map(c => c.content).join(' ');
             } else {
               content = replyCards[Math.floor(Math.random() * replyCards.length)].content;
             }
          }

          let replyToMsg: string | undefined = undefined;
          if (Math.random() < 0.3) {
             const myMsgs = messages.filter(m => m.sender === 'me');
             const recentMyMsgs = myMsgs.slice(-10);
             if (recentMyMsgs.length > 0) {
                const chosen = recentMyMsgs[Math.floor(Math.random() * recentMyMsgs.length)];
                if (chosen.type === 'text') {
                  replyToMsg = chosen.content.length > 40 ? chosen.content.substring(0, 40) + '...' : chosen.content;
                } else if (chosen.type === 'voice') {
                  replyToMsg = '[语音]';
                } else if (chosen.type === 'image') {
                  replyToMsg = '[图片]';
                } else if (chosen.type === 'sticker') {
                  replyToMsg = '[表情]';
                } else if (chosen.type === 'check_in') {
                  replyToMsg = '[汇报]';
                } else {
                  replyToMsg = '[消息]';
                }
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
        }

        // Find Dream Character's stickers from word card groups (must be valid image strings)
        const mjStickers: string[] = [];
        cardGroups.forEach(g => {
          if (g.cards && Array.isArray(g.cards)) {
            g.cards.forEach((c: string) => {
              if (c && typeof c === 'string') {
                const trimmed = c.trim();
                const isImg = trimmed.startsWith('data:image/') || /^https?:\/\/.*\.(png|jpg|jpeg|gif|webp|svg)/i.test(trimmed);
                if (isImg) {
                  if (!mjStickers.includes(trimmed)) {
                    mjStickers.push(trimmed);
                  }
                }
              }
            });
          }
        });

        const availableStickers = mjStickers.length > 0 ? mjStickers : stickers;

        if (Math.random() < 0.2 && availableStickers.length > 0) {
          const sticker = availableStickers[Math.floor(Math.random() * availableStickers.length)];
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
    }, delay);
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
          id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
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
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
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
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
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
    <div className="absolute inset-0 overflow-hidden z-50 transition-colors" style={{ ...customStyle }}>
      {chatFont && <style dangerouslySetInnerHTML={{ __html: `@font-face { font-family: 'CustomChatFont'; src: url('${chatFont}'); }` }} />}
      <style>{`
        .chat-bubble {
          background-color: var(--bubble-bg);
          color: var(--bubble-color);
          text-shadow: var(--bubble-text-shadow);
        }
      `}</style>
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
      <div 
        ref={scrollRef} 
        className="absolute inset-0 overflow-y-auto px-4 pt-[calc(env(safe-area-inset-top)+80px)] flex flex-col scrollbar-hide z-10" 
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 72px)' }}
        onClick={() => { if (activeMenuMsgId) setActiveMenuMsgId(null); }}
      >
        {messages.map((msg, i) => {
          const isMe = msg.sender === 'me';
          const avatar = isMe ? (avatar1 || '') : (avatar2 || '');
          
          const nextMsg = messages[i + 1];
          const isGroupedNext = nextMsg && nextMsg.sender === msg.sender && nextMsg.time === msg.time && nextMsg.type !== 'call' && nextMsg.type !== 'nudge' && msg.type !== 'call' && msg.type !== 'nudge';
          const marginBottom = isGroupedNext ? 'mb-2.5' : 'mb-6';

          // isRead if there's any message from them after this, or if it was marked as ignored
          const isRead = messages.slice(i + 1).some(m => m.sender === 'them') || msg.isIgnored;

          if (msg.type === 'nudge') {
            return (
              <div key={`${msg.id}-${i}`} className={`w-full flex justify-center ${marginBottom}`}>
                <div className="px-3 py-1 rounded-full bg-black/[0.05] text-[12px] text-gray-500">
                  {isMe ? myNickname : charId}{msg.content}
                </div>
              </div>
            );
          }

          if (msg.type === 'call') {
            return (
              <div key={`${msg.id}-${i}`} className={`w-full flex justify-center ${marginBottom}`}>
                <div className="px-4 py-2 rounded-2xl bg-black/[0.03] text-[13px] flex items-center space-x-2 text-gray-600">
                  {msg.callState === 'declined' || msg.callState === 'missed' ? <PhoneMissed size={14} className="text-red-400" /> : <PhoneCall size={14} />}
                  <span>{msg.content}</span>
                </div>
              </div>
            );
          }

          if (msg.type === 'check_in') {
             return (
               <div key={`${msg.id}-${i}`} className={`w-full flex justify-center ${marginBottom} px-4`}>
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
            <div key={`${msg.id}-${i}`} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${marginBottom}`}>
              {!isMe && (
                <div className="w-[38px] h-[38px] shrink-0 mr-2.5">
                  {!isGroupedNext && <div className="w-full h-full rounded-full bg-black/10 overflow-hidden shadow-sm border border-white/20">
                    {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : null}
                  </div>}
                </div>
              )}
              <div 
                onDoubleClick={() => setReplyingTo(msg)}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuMsgId(activeMenuMsgId === msg.id ? null : msg.id);
                }}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[70%] relative cursor-pointer`}
              >
                {activeMenuMsgId === msg.id && (
                  <div className={`absolute -top-10 z-[9999] bg-slate-900/95 backdrop-blur-md text-white text-[11px] rounded-[10px] px-2 py-1 shadow-lg flex items-center gap-1 animate-in fade-in zoom-in-95 duration-100 select-none border border-white/15 ${isMe ? 'right-0' : 'left-0'}`}>
                    {isMe && (
                      <>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setMessages(prev => prev.filter(m => m.id !== msg.id));
                            setActiveMenuMsgId(null);
                          }}
                          className="px-1.5 py-0.5 hover:text-red-300 font-semibold active:scale-95 transition-all shrink-0"
                        >
                          撤回
                        </button>
                        <div className="w-px h-3 bg-white/20 shrink-0" />
                      </>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setReplyingTo(msg);
                        setActiveMenuMsgId(null);
                      }}
                      className="px-1.5 py-0.5 hover:text-blue-300 font-semibold active:scale-95 transition-all shrink-0"
                    >
                      回复
                    </button>
                  </div>
                )}
                {msg.replyTo && (
                  <div 
                    className={`text-[11px] px-2.5 py-1.5 mb-1.5 max-w-full rounded-[14px] flex items-center gap-1 border backdrop-blur-sm transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)] ${
                      isMe 
                        ? "bg-black/8 text-black/75 border-black/5" 
                        : "bg-white/60 text-black/80 border-white/40"
                    }`}
                    style={{ 
                      borderLeft: `3px solid ${isMe ? bubbleColor : '#A1A1A1'}`,
                    }}
                  >
                    <span className="font-serif opacity-60 leading-none mr-0.5 mt-1">“</span>
                    <span className="truncate italic font-light">{msg.replyTo}</span>
                    <span className="font-serif opacity-60 leading-none ml-0.5 mt-1">”</span>
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
                      color: '#000000',
                      minWidth: `${Math.min(200, 80 + (msg.voiceDuration || 1) * 5)}px`
                    } : {
                      backgroundColor: isMe ? `${bubbleColor}66` : 'rgba(255,255,255,0.15)',
                      color: '#000000',
                      textShadow: 'none',
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
                        <div key={i} className={`w-1 rounded-full ${playingVoiceId === msg.id ? 'animate-pulse' : ''} bg-black/45`} style={{ height: `${Math.random() * 12 + 4}px`, animationDelay: `${i * 0.1}s` }}></div>
                      ))}
                    </div>
                    {isMe ? <Mic size={18} /> : <span className="text-[14px]">{msg.voiceDuration}s</span>}
                  </div>
                ) : msg.type === 'emoji' ? (
                  <div className="text-[48px] leading-none drop-shadow-sm">{msg.content}</div>
                ) : (
                  <div 
                    className={chatBubbleStyle === 'system' ? 
                      `chat-bubble px-4 py-2.5 text-[15px] leading-relaxed ${isMe ? 'rounded-[20px] rounded-tr-[4px] me' : 'rounded-[20px] rounded-tl-[4px] them'}` :
                      `chat-bubble px-4 py-2.5 text-[15px] leading-relaxed shadow-[0_4px_16px_rgba(0,0,0,0.06),inset_0_1px_3px_rgba(255,255,255,0.4)] backdrop-blur-3xl ${isMe ? 'border border-white/30 me' : 'border border-white/40 them'} ${isMe ? 'rounded-[20px] rounded-tr-[4px]' : 'rounded-[20px] rounded-tl-[4px]'}`
                    }
                    style={{
                      '--bubble-bg': chatBubbleStyle === 'system' 
                        ? (isMe ? bubbleColor : '#E9E9EB') 
                        : (isMe ? `${bubbleColor}66` : 'rgba(255,255,255,0.15)'),
                      '--bubble-color': '#000000',
                      '--bubble-text-shadow': 'none'
                    } as React.CSSProperties}
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
                <motion.div className="w-1.5 h-1.5 rounded-full bg-black/40" animate={{y: [0, -4, 0]}} transition={{repeat: Infinity, duration: 0.8}} />
                <motion.div className="w-1.5 h-1.5 rounded-full bg-black/40" animate={{y: [0, -4, 0]}} transition={{repeat: Infinity, duration: 0.8, delay: 0.2}} />
                <motion.div className="w-1.5 h-1.5 rounded-full bg-black/40" animate={{y: [0, -4, 0]}} transition={{repeat: Infinity, duration: 0.8, delay: 0.4}} />
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
            className="absolute left-3 right-3 bg-white/70 backdrop-blur-xl rounded-[16px] py-4 flex justify-around px-2 items-center z-20 shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-white/50"
            style={{ bottom: 'calc(env(safe-area-inset-bottom) + 60px)' }}
          >
             <button className="flex flex-col items-center gap-2 group w-[64px]" onClick={() => { initiateCall(); setShowPlusMenu(false); }}>
                <div className="w-[50px] h-[50px] rounded-[16px] flex items-center justify-center group-active:scale-95 transition-transform" style={{ backgroundColor: themeConfig.cardBg, color: primaryColor }}><Video size={24} strokeWidth={1.5} /></div>
                <span className="text-[11px] text-black/50">视频通话</span>
             </button>
             <div className="flex flex-col items-center gap-2 group cursor-pointer w-[64px]" onClick={() => { imageInputRef.current?.click(); setShowPlusMenu(false); }}>
                <div className="w-[50px] h-[50px] rounded-[16px] flex items-center justify-center group-active:scale-95 transition-transform" style={{ backgroundColor: themeConfig.cardBg, color: primaryColor }}><ImageIcon size={24} strokeWidth={1.5} /></div>
                <span className="text-[11px] text-black/50">图片</span>
             </div>
             <div className="flex flex-col items-center gap-2 group cursor-pointer w-[64px]" onClick={() => { setShowPlusMenu(false); setShowStickerPane(true); }}>
                <div className="w-[50px] h-[50px] rounded-[16px] flex items-center justify-center group-active:scale-95 transition-transform" style={{ backgroundColor: themeConfig.cardBg, color: primaryColor }}><Smile size={24} strokeWidth={1.5} /></div>
                <span className="text-[11px] text-black/50">表情库</span>
             </div>
             <button className="flex flex-col items-center gap-2 group w-[64px]" onClick={() => { handleNudge(); setShowPlusMenu(false); }}>
                <div className="w-[50px] h-[50px] rounded-[16px] flex items-center justify-center group-active:scale-95 transition-transform" style={{ backgroundColor: themeConfig.cardBg, color: primaryColor }}><Heart size={24} strokeWidth={1.5} /></div>
                <span className="text-[11px] text-black/50">拍一拍</span>
             </button>
             
             
             <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticker Pane */}
      <AnimatePresence>
        {showStickerPane && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute left-2 right-2 bg-white/80 backdrop-blur-3xl rounded-[20px] p-4 z-20 shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-white/60 h-[240px] flex flex-col"
            style={{ bottom: 'calc(env(safe-area-inset-bottom) + 60px)' }}
          >
             <div className="flex justify-between items-center mb-3">
               <span className="text-[13px] font-bold text-gray-700">表情包</span>
               <button onClick={() => setShowStickerPane(false)} className="bg-black/5 p-1 rounded-full"><X size={16} className="text-gray-500" /></button>
             </div>
             <div className="grid grid-cols-4 gap-3 overflow-y-auto pr-1 pb-2 scrollbar-hide flex-1 items-start content-start">
               {stickers.map((url, idx) => (
                 <div key={idx} onClick={() => {
                     const ignored = readNoReply && Math.random() < 0.05;
                     const newMsg: Message = {
                id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
                sender: "me",
                type: "sticker",
                content: url,
                replyTo: replyingTo ? (replyingTo.type === "text" ? (replyingTo.content.length > 40 ? replyingTo.content.substring(0, 40) + '...' : replyingTo.content) : (replyingTo.type === "voice" ? "[语音]" : "[图片/表情]")) : undefined,
                time: getFormatTime(),
                isIgnored: ignored
              };
              setMessages(prev => [...prev, newMsg]);
              setReplyingTo(null);
                     setShowStickerPane(false);
                     if(!ignored) simulateReply();
                 }} className="h-[76px] w-full bg-black/5 rounded-[12px] flex items-center justify-center cursor-pointer active:scale-95 transition-transform overflow-hidden">
                    <img src={url} alt="sticker" className="max-w-full max-h-full object-contain p-1" />
                 </div>
               ))}
               <div onClick={() => newStickerInputRef.current?.click()} className="h-[76px] w-full bg-gray-100 rounded-[12px] flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform border border-dashed border-gray-300">
                  <Plus size={24} className="text-gray-400 mb-1" />
               </div>
             </div>
             <input type="file" ref={newStickerInputRef} className="hidden" accept="image/*" onChange={handleNewStickerUpload} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div 
        className="absolute bottom-0 left-0 right-0 w-full z-30 flex flex-col pointer-events-none"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
      >
        {/* Reply Indicator banner */}
        <AnimatePresence>
          {replyingTo && (
            <motion.div 
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.98 }}
              className="mx-3 mb-2 px-4 py-2.5 bg-white/80 backdrop-blur-3xl rounded-[18px] border border-white/60 shadow-[0_8px_24px_rgba(0,0,0,0.12)] flex items-center justify-between gap-3 pointer-events-auto transition-all"
              style={{ borderLeft: `4px solid ${bubbleColor}` }}
            >
              <div className="flex flex-col min-w-0 pr-4">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: bubbleColor }} />
                  正在引用 {replyingTo.sender === 'me' ? '自己' : charId} 的话
                </span>
                <span className="text-[13px] text-gray-800 font-medium truncate mt-0.5">
                  {replyingTo.type === "text" ? replyingTo.content : (replyingTo.type === "voice" ? "[语音]" : "[图片/表情]")}
                </span>
              </div>
              <button 
                onClick={() => setReplyingTo(null)}
                className="w-6 h-6 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-gray-500 shrink-0 select-none active:scale-90 transition-all cursor-pointer"
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-3 pt-2 w-full flex items-center space-x-2 bg-transparent pointer-events-auto">
          <button 
            className={`w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0 border border-white/20 text-white shadow-[0_4px_12px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.3)] active:scale-95 transition-all ${showPlusMenu || showStickerPane ? 'rotate-45' : ''}`}
            style={{ backgroundColor: bubbleColor }}
            onClick={() => {
              if (showStickerPane) {
                 setShowStickerPane(false);
              } else {
                 setShowPlusMenu(!showPlusMenu);
              }
            }}
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
