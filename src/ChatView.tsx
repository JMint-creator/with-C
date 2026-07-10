import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Video, Settings, Smile, Hand, Plus, Image as ImageIcon, Send, X, PhoneCall, PhoneMissed, Phone, MicOff, Mic, CameraOff, MonitorPlay, Check, CheckCheck, MessageCircle, MoreHorizontal, Heart, Sparkles, Camera, Music, Disc, Film, Gift, Mail, MailOpen } from 'lucide-react';
import { useLocalState, useIDBState, compressImage } from './utils';
import { useCallStore, callStore } from './callStore';
import { MoviePlayer } from './components/MoviePlayer';

function mixColorWithWhite(hex: string, weight = 0.12): string {
  if (!hex || typeof hex !== 'string') return '#f9fafb';
  let color = hex.replace('#', '').trim();
  if (color.length === 3) {
    color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
  }
  if (color.length !== 6) return '#f9fafb';
  const r = parseInt(color.slice(0, 2), 16) || 0;
  const g = parseInt(color.slice(2, 4), 16) || 0;
  const b = parseInt(color.slice(4, 6), 16) || 0;

  const mixedR = Math.round(r * weight + 255 * (1 - weight));
  const mixedG = Math.round(g * weight + 255 * (1 - weight));
  const mixedB = Math.round(b * weight + 255 * (1 - weight));

  const toHex = (c: number) => {
    const s = Math.min(255, Math.max(0, c)).toString(16);
    return s.length === 1 ? '0' + s : s;
  };

  return `#${toHex(mixedR)}${toHex(mixedG)}${toHex(mixedB)}`;
}

function getMeCardColors(bg: string, defaultBubble: string) {
  const cleanBg = (bg || '').toUpperCase();
  
  // Hand-crafted Morandi palette with perfectly balanced, sweet, non-grey pastel backgrounds and borders
  if (cleanBg.includes('EBE7DF')) { // warm
    return {
      solidBg: '#F5EAE1',      // Cozy warm peach-cream (clearly colored, yet gentle and pastel)
      solidBorder: '#E2CDBC',  // Beautiful warm terracotta border
      accent: '#A38380'       // Morandi earthy rose accent
    };
  }
  if (cleanBg.includes('E3EBE6')) { // mint
    return {
      solidBg: '#E7EFEB',      // Soft creamy mint (refreshing but calm pastel, not grey)
      solidBorder: '#CDDAD1',  // Gentle sage-mint border
      accent: '#7C8B7A'       // Morandi sage green accent
    };
  }
  if (cleanBg.includes('EBE2E4')) { // sakura
    return {
      solidBg: '#F6EBED',      // Cozy warm sakura blush cream
      solidBorder: '#DFCCD0',  // Soft rose-dust border
      accent: '#A18488'       // Morandi rose accent
    };
  }
  if (cleanBg.includes('E0E7ED')) { // blue
    return {
      solidBg: '#E5ECF2',      // Beautiful soft misty-blue cream
      solidBorder: '#CCD7E2',  // Soft slate-blue border
      accent: '#748796'       // Morandi slate blue accent
    };
  }
  if (cleanBg.includes('E6E0ED')) { // purple
    return {
      solidBg: '#E9E5F0',      // Soft elegant plum lavender cream
      solidBorder: '#D0C6DA',  // Soft lavender-plum border
      accent: '#847590'       // Morandi lavender-plum accent
    };
  }
  if (cleanBg.includes('EDE0E0')) { // red
    return {
      solidBg: '#F5E7E7',      // Warm brick-clay blush cream
      solidBorder: '#DFCECE',  // Soft brick-rose dust border
      accent: '#947474'       // Morandi brick rose accent
    };
  }

  // Fallback for custom bubble color
  const b = (defaultBubble || '').toUpperCase();
  if (b && b !== '#333333' && b !== '#2C3A33' && b !== '#3B2A2D' && b !== '#2B3A4A' && b !== '#3A2B4A' && b !== '#4A2B2B' && b !== '#A894A7') {
    return {
      solidBg: mixColorWithWhite(defaultBubble, 0.22),
      solidBorder: mixColorWithWhite(defaultBubble, 0.42),
      accent: defaultBubble
    };
  }

  // General elegant Morandi rose fallback
  return {
    solidBg: '#F6EBED',
    solidBorder: '#DFCCD0',
    accent: '#A18488'
  };
}

type Message = {
  id: string;
  sender: 'me' | 'them';
  type: 'text' | 'nudge' | 'emoji' | 'call' | 'sticker' | 'check_in' | 'image' | 'voice' | 'invite' | 'check_in_feedback' | 'decide' | 'red_envelope';
  content: string;
  time: string;
  imageUrl?: string;
  callState?: 'missed' | 'declined' | 'duration';
  callDuration?: number;
  replyTo?: string;
  checkInStatus?: 'pending' | 'completed' | 'rejected';
  audioUrl?: string;
  voiceDuration?: number;
  isIgnored?: boolean;
  inviteType?: 'music' | 'movie';
  inviteStatus?: 'pending' | 'accepted' | 'declined' | 'busy';
  songName?: string;
  movieName?: string;
  decideType?: 'tarot' | 'custom';
  decideQuestion?: string;
  decideTarotCount?: number;
  decideOptions?: string[];
  decideResult?: string;
  redEnvelopeAmount?: number;
  redEnvelopeStatus?: 'unopened' | 'opened';
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

  const [isWatchingMovie, setIsWatchingMovie] = useState(false);
  const [movieUrl, setMovieUrl] = useState<string>('');
  const [movieFileName, setMovieFileName] = useState<string>('');
  const movieInputRef = useRef<HTMLInputElement>(null);

  const handleMovieUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setMovieUrl(url);
      setMovieFileName(file.name);
      setIsWatchingMovie(true);
    }
    e.target.value = '';
  };

  const imageInputRef = useRef<HTMLInputElement>(null);
  const stickerInputRef = useRef<HTMLInputElement>(null);
  const newStickerInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isSticker: boolean) => {
     if (e.target.files && e.target.files[0]) {
        try {
           const file = e.target.files[0];
           const dataUrl = await compressImage(file, 800, 800, 0.6);
           const ignored = readNoReply && Math.random() < 0.05;
           const newMsg: Message = {
             id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
             sender: 'me',
             type: isSticker ? 'sticker' : 'image',
             content: dataUrl,
             time: getFormatTime(),
             isIgnored: ignored
           };
           setMessages(prev => [...prev, newMsg]);
           setShowPlusMenu(false);
           
           if (!ignored) {
              simulateReply();
           }
        } catch (err) {
           console.error('Failed to upload and compress image:', err);
        } finally {
           e.target.value = '';
        }
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
        e.target.value = '';
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
  const { solidBg: rootSolidMeBg, solidBorder: rootSolidMeBorder, accent: rootAccentColor } = getMeCardColors(themeConfig?.bg, bubbleColor);

  const [inviteModal, setInviteModal] = useState<{ show: boolean; type: 'music' | 'movie'; direction: 'me' | 'them' }>({ show: false, type: 'music', direction: 'me' });
  const [inviteInputVal, setInviteInputVal] = useState('');

  // Red Envelope states & database syncing
  const [virtualRecords, setVirtualRecords] = useIDBState<any[]>('app_virtual_accounting_records', []);
  const [showSendEnvelope, setShowSendEnvelope] = useState(false);
  const [sendEnvelopeAmount, setSendEnvelopeAmount] = useState('');
  const [sendEnvelopeNote, setSendEnvelopeNote] = useState('');
  const [openEnvelopeOverlay, setOpenEnvelopeOverlay] = useState<{
    show: boolean;
    messageId: string | null;
    sender: 'me' | 'them' | null;
    amount: number;
    note: string;
    status: 'unopened' | 'opened';
    isOpening: boolean;
  }>({
    show: false,
    messageId: null,
    sender: null,
    amount: 0,
    note: '',
    status: 'unopened',
    isOpening: false
  });

  // Fiancé Red Envelope Generator (Romantic & Random with customized copywriting)
  const generateFianceRedEnvelope = () => {
    // Check for Birthday (10.19) and Anniversary (4.11)
    const today = new Date();
    const month = today.getMonth() + 1; // 1-indexed (1-12)
    const date = today.getDate();

    if (month === 10 && date === 19) {
      // Birthday custom high-end envelope
      const birthdayAmounts = [10190.00, 101910.19, 52013.14, 100000.00];
      const amount = birthdayAmounts[Math.floor(Math.random() * birthdayAmounts.length)];
      return {
        amount,
        note: '未婚妻生日快乐'
      };
    }

    if (month === 4 && date === 11) {
      // Anniversary custom high-end envelope
      const anniversaryAmounts = [41104.11, 52013.14, 131400.00];
      const amount = anniversaryAmounts[Math.floor(Math.random() * anniversaryAmounts.length)];
      return {
        amount,
        note: '广阔的世界中，我们是最特别的那对小鸟'
      };
    }

    let amount = 0;
    
    // 50% probability of random amount, 50% probability of preset romantic/lucky amounts
    if (Math.random() < 0.5) {
      // Random amount
      if (Math.random() < 0.6) {
        // 60% probability of close-to-life random small change (10.00 to 999.99)
        amount = parseFloat((Math.random() * (999.99 - 10.00) + 10.00).toFixed(2));
      } else {
        // 40% probability of random medium to high-end gift money (1000.00 to 9999.99)
        amount = parseFloat((Math.random() * (9999.99 - 1000.00) + 1000.00).toFixed(2));
      }
    } else {
      // Preset amounts
      const smallPresets = [5.20, 6.66, 8.88, 9.99, 13.14, 18.88, 28.88, 52.00, 66.66, 88.88, 99.99, 131.40, 288.88, 520.00, 666.66, 888.88, 999.99];
      // 财阀 (Chaebol/wealthy fiance) high-end luxury romantic preset amounts
      const largePresets = [1000.00, 1314.00, 2000.00, 5000.00, 5200.00, 8888.00, 9999.00, 13140.00, 52013.14, 88888.88, 100000.00, 520131.40];
      
      if (Math.random() < 0.6) {
        // 60% chance of small preset
        amount = smallPresets[Math.floor(Math.random() * smallPresets.length)];
      } else {
        // 40% chance of large preset
        amount = largePresets[Math.floor(Math.random() * largePresets.length)];
      }
    }

    // Copywriting determination:
    // "梦角发红包大概率没有文案！小部分情况下有文案"
    // Let's set 80% probability of no custom copy (uses default '恭喜发财，大吉大利')
    // 20% probability of having the special customized copy based on amount size
    let note = '恭喜发财，大吉大利';
    
    if (Math.random() < 0.2) {
      if (amount < 1000) {
        // Small amount (<1000) custom copy pool
        const smallNotes = [
          '给亲爱的买奶茶',
          '给未婚妻买咖啡',
          '给老婆买花',
          '给未婚妻点好吃的'
        ];
        note = smallNotes[Math.floor(Math.random() * smallNotes.length)];
      } else {
        // Large amount (>=1000) custom copy pool
        const largeNotes = [
          '只是想哄未婚妻开心',
          '未婚夫的钱都给你花',
          '可以兑换未婚妻的一个亲亲嘛',
          '未婚夫给你报销'
        ];
        note = largeNotes[Math.floor(Math.random() * largeNotes.length)];
      }
    }

    return {
      amount,
      note
    };
  };

  // User Sends Red Envelope Function
  const handleSendEnvelope = (amountVal: number, noteVal: string) => {
    if (!amountVal || amountVal <= 0) return;
    
    const title = noteVal.trim() || '恭喜发财，大吉大利';
    const formattedTime = getFormatTime();
    const msgId = Date.now().toString() + Math.random().toString(36).substring(2, 5);

    const newMsg: Message = {
      id: msgId,
      sender: 'me',
      type: 'red_envelope',
      content: title,
      time: formattedTime,
      redEnvelopeAmount: amountVal,
      redEnvelopeStatus: 'unopened'
    };

    setMessages(prev => [...prev, newMsg]);

    // Create expense record for user immediately
    const newRecord = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      type: 'expense' as const,
      amount: amountVal,
      category: 'gift',
      note: title,
      timestamp: Date.now()
    };
    setVirtualRecords(prev => [newRecord, ...prev]);

    setShowSendEnvelope(false);
    setSendEnvelopeAmount('');
    setSendEnvelopeNote('');

    // Simulation of fiancé opening the envelope
    setIsTyping(true);
    setTimeout(() => {
      // Mark as opened
      setMessages(currentMsgs => {
        return currentMsgs.map(m => {
          if (m.id === msgId) {
            return { ...m, redEnvelopeStatus: 'opened' as const };
          }
          return m;
        });
      });
      setIsTyping(false);
    }, 1500);
  };

  // User Opens a Red Envelope from Fiancé
  const handleOpenEnvelopeFromFiance = (msgId: string, amt: number, nt: string) => {
    // 1. Mark message as opened
    setMessages(currentMsgs => {
      return currentMsgs.map(m => {
        if (m.id === msgId) {
          return { ...m, redEnvelopeStatus: 'opened' as const };
        }
        return m;
      });
    });

    // 2. Add income transaction record for user
    const newRecord = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      type: 'income' as const,
      amount: amt,
      category: 'gift',
      note: nt,
      timestamp: Date.now()
    };
    setVirtualRecords(prev => [newRecord, ...prev]);
  };

  const [decideModal, setDecideModal] = useState<{
    show: boolean;
    tab: 'tarot' | 'custom';
    question: string;
    tarotCount: number;
    options: string[];
  }>({
    show: false,
    tab: 'tarot',
    question: '',
    tarotCount: 1,
    options: ['', '']
  });

  const sendDecideRequest = () => {
    const { tab, question, tarotCount, options } = decideModal;
    
    if (!question.trim()) {
      alert('请先输入我想问的问题');
      return;
    }
    
    const validOpts = options.filter(o => o.trim() !== '');
    if (tab === 'custom' && validOpts.length < 2) {
      alert('自定义决策至少需要输入两个选项');
      return;
    }

    const meMsg: Message = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      sender: 'me',
      type: 'decide',
      content: `[帮我决定] 问：${question.trim()}`,
      time: getFormatTime(),
      decideType: tab,
      decideQuestion: question.trim(),
      decideTarotCount: tab === 'tarot' ? tarotCount : undefined,
      decideOptions: tab === 'custom' ? validOpts : undefined,
    };

    setMessages(prev => [...prev, meMsg]);
    setDecideModal(prev => ({ ...prev, show: false, question: '', options: ['', ''], tarotCount: 1 }));

    setTimeout(() => {
      setIsTyping(true);
      
      setTimeout(() => {
        setIsTyping(false);
        
        let result = '';
        if (tab === 'tarot') {
          const numbers: number[] = [];
          const used = new Set<number>();
          while (numbers.length < tarotCount) {
            const num = Math.floor(Math.random() * 78) + 1;
            if (!used.has(num)) {
              used.add(num);
              numbers.push(num);
            }
          }
          result = numbers.join(', ');
        } else {
          result = validOpts[Math.floor(Math.random() * validOpts.length)];
        }

        const replyMsg: Message = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
          sender: 'them',
          type: 'decide',
          content: `决策结果是：${result}`,
          time: getFormatTime(),
          decideType: tab,
          decideQuestion: question.trim(),
          decideResult: result,
          decideTarotCount: tab === 'tarot' ? tarotCount : undefined,
          decideOptions: tab === 'custom' ? validOpts : undefined,
        };

        setMessages(prev => [...prev, replyMsg]);
      }, 1500);
    }, 600);
  };

  const handleDeclineInvite = (id: string) => {
    setMessages(msgs => msgs.map(m => m.id === id ? { ...m, inviteStatus: 'declined' } : m));
  };

  const handleAcceptInvite = (id: string, type: 'music' | 'movie' | undefined) => {
    setMessages(msgs => msgs.map(m => m.id === id ? { ...m, inviteStatus: 'accepted' } : m));
    setTimeout(() => {
      handleStartAction(type);
    }, 800);
  };

  const handleStartAction = (type: 'music' | 'movie' | undefined) => {
    if (type === 'music') {
      window.dispatchEvent(new CustomEvent('app_mj_music_session_start'));
      window.dispatchEvent(new CustomEvent('app_change_view', { detail: 'music_manager' }));
    } else if (type === 'movie') {
      movieInputRef.current?.click();
    }
  };

  const sendInvite = (type: 'music' | 'movie', songName?: string, movieName?: string) => {
    const ignored = readNoReply && Math.random() < 0.05;
    const newMsg: Message = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      sender: 'me',
      type: 'invite',
      content: type === 'music' ? '发起了一起听歌' : '发起了一起观影',
      time: getFormatTime(),
      inviteType: type,
      inviteStatus: 'pending',
      songName,
      movieName,
      isIgnored: ignored
    };
    
    setMessages(prev => [...prev, newMsg]);
    
    if (!ignored) {
      setTimeout(() => {
        const isBusy = Math.random() < 0.10;
        setMessages(msgs => msgs.map(m => m.id === newMsg.id ? { ...m, inviteStatus: isBusy ? 'busy' : 'accepted' } : m));
        if (!isBusy && type === 'music') {
          window.dispatchEvent(new CustomEvent('app_mj_music_session_start'));
        }
      }, 2000);
    }
  };

  const mjSendInvite = (type: 'music' | 'movie', songName?: string, movieName?: string) => {
    const newMsg: Message = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      sender: 'them',
      type: 'invite',
      content: type === 'music' ? '发起了一起听歌' : '发起了一起观影',
      time: getFormatTime(),
      inviteType: type,
      inviteStatus: 'pending',
      songName: songName || (type === 'music' ? '想和未婚妻一起听歌' : undefined),
      movieName: movieName || (type === 'movie' ? '想和未婚妻一起看电影' : undefined)
    };
    
    setMessages(prev => [...prev, newMsg]);
  };

  const triggerCheckInSimulation = () => {
    setMessages(prev => [...prev, {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      sender: 'them',
      type: 'check_in',
      content: `${charId} 想知道你在干什么`,
      checkInStatus: 'pending',
      time: getFormatTime()
    }]);
  };

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
        if (Math.random() < 0.25) { // 25% chance of an event every ~15-60 mins
          const eventRand = Math.random();
          if (eventRand < 0.3) {
            // 30% chance for video call
            if (videoCallState === 'none') {
              triggerIncomingVideoCall();
            }
          } else if (eventRand < 0.6) {
            // 30% chance for check-in
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
          } else if (eventRand < 0.7) {
            // 10% chance for music invitation
            setMessages(msgs => [...msgs, {
              id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
              sender: 'them',
              type: 'invite',
              content: '发起了一起听歌',
              time: getFormatTime(),
              inviteType: 'music',
              inviteStatus: 'pending',
              songName: '想和未婚妻一起听歌'
            }]);
            const pushNotify = window.localStorage.getItem('app_chatPushNotify');
            if ((pushNotify ? JSON.parse(pushNotify) : true) && 'Notification' in window && window.Notification.permission === 'granted') {
              new window.Notification(charId, { body: `${charId} 邀请你一起听歌` });
            }
          } else if (eventRand < 0.8) {
            // 10% chance for movie invitation
            setMessages(msgs => [...msgs, {
              id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
              sender: 'them',
              type: 'invite',
              content: '发起了一起观影',
              time: getFormatTime(),
              inviteType: 'movie',
              inviteStatus: 'pending',
              movieName: '想和未婚妻一起看电影'
            }]);
            const pushNotify = window.localStorage.getItem('app_chatPushNotify');
            if ((pushNotify ? JSON.parse(pushNotify) : true) && 'Notification' in window && window.Notification.permission === 'granted') {
              new window.Notification(charId, { body: `${charId} 邀请你一起看电影` });
            }
          } else {
            // 20% chance for spontaneous red envelope from fiancé! (Fiancé sending frequency)
            const envData = generateFianceRedEnvelope();
            setMessages(msgs => [...msgs, {
              id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
              sender: 'them',
              type: 'red_envelope',
              content: envData.note,
              time: getFormatTime(),
              redEnvelopeAmount: envData.amount,
              redEnvelopeStatus: 'unopened'
            }]);
            const pushNotify = window.localStorage.getItem('app_chatPushNotify');
            if ((pushNotify ? JSON.parse(pushNotify) : true) && 'Notification' in window && window.Notification.permission === 'granted') {
              new window.Notification(charId, { body: `${charId} 给你发了一个爱意红包🧧` });
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

  // Movie Watch Together Proactive Replies Loop
  useEffect(() => {
    if (!isWatchingMovie) return;

    let timeoutId: any;

    const scheduleNextMovieComment = () => {
      // Calculate random delay based on user settings
      const delay = Math.random() * (maxWait - minWait) * 1000 + minWait * 1000;
      
      timeoutId = setTimeout(() => {
        // Send a card!
        if (replyCards.length > 0) {
          const randomCard = replyCards[Math.floor(Math.random() * replyCards.length)].content;
          
          setMessages(prev => [...prev, {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
            sender: 'them',
            type: 'text',
            content: randomCard,
            time: getFormatTime()
          }]);

          // Trigger push notification if allowed
          const pushNotify = window.localStorage.getItem('app_chatPushNotify');
          const isPushEnabled = pushNotify ? JSON.parse(pushNotify) : true;
          if (isPushEnabled && 'Notification' in window && window.Notification.permission === 'granted') {
            new window.Notification(charId, { 
              body: randomCard,
              icon: avatar2 || undefined 
            });
          }
        }
        
        // Schedule next comment
        scheduleNextMovieComment();
      }, delay);
    };

    // Schedule the first comment after initial delay
    scheduleNextMovieComment();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isWatchingMovie, replyCards, minWait, maxWait, charId, avatar2]);

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
     
     setMessages(msgs => [...msgs, {
       id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
       sender: 'me',
       type: 'check_in_feedback',
       content: checkInText,
       imageUrl: checkInImage || undefined,
       time: getFormatTime()
     }]);

     setCheckInModalVisible(false);
  };

  const simulateReply = () => {
    const delay = Math.random() * (maxWait - minWait) * 1000 + minWait * 1000;
    
    setIsTyping(true);
    setTimeout(() => {
      const newMsgs: Message[] = [];
      let baseId = Date.now();

      if (isWatchingMovie) {
        let content = '陪你一块看';
        if (replyCards.length > 0) {
          content = replyCards[Math.floor(Math.random() * replyCards.length)].content;
        }
        newMsgs.push({
          id: (++baseId).toString(),
          sender: 'them',
          type: 'text',
          content,
          time: getFormatTime()
        });
      } else {
        // 4% conversational chance of getting a pocket money red envelope as a response! (Conversational frequency)
        if (Math.random() < 0.04) {
          const envData = generateFianceRedEnvelope();
          newMsgs.push({
            id: (++baseId).toString(),
            sender: 'them',
            type: 'red_envelope',
            content: envData.note,
            time: getFormatTime(),
            redEnvelopeAmount: envData.amount,
            redEnvelopeStatus: 'unopened'
          });
        } else {
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
      }

      if (newMsgs.length === 0) {
        setIsTyping(false);
        return;
      }

      // Send messages sequentially with simple typing indicator intervals
      let currentIndex = 0;

      const sendNextMessage = () => {
        if (currentIndex >= newMsgs.length) {
          setIsTyping(false);
          return;
        }

        // Show typing indicator
        setIsTyping(true);

        // Simple fixed typing delay (e.g. 1.8 seconds)
        const typingDuration = 1800;

        setTimeout(() => {
          setIsTyping(false);
          const currentMsg = newMsgs[currentIndex];
          
          setMessages(prev => [...prev, currentMsg]);

          // System push notification for this message (or just the first one)
          if (currentIndex === 0) {
            const pushNotify = window.localStorage.getItem('app_chatPushNotify');
            const isPushEnabled = pushNotify ? JSON.parse(pushNotify) : true;
            if (isPushEnabled && 'Notification' in window && window.Notification.permission === 'granted') {
              new window.Notification(charId, { 
                body: currentMsg.content || (currentMsg.type === 'voice' ? '[语音]' : '[图片/表情]'),
                icon: avatar2 || undefined 
              });
            }
          }

          currentIndex++;
          
          if (currentIndex < newMsgs.length) {
            // Wait for a brief realistic gap before typing the next one
            setTimeout(() => {
              sendNextMessage();
            }, 800);
          }
        }, typingDuration);
      };

      sendNextMessage();
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
           const dataUrl = await compressImage(e.target.files[0], 800, 800, 0.6);
           setCheckInImage(dataUrl);
        } catch (err) {
           console.error(err);
        } finally {
           e.target.value = '';
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
      {!isWatchingMovie ? (
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
          <div className="flex items-center gap-2">
            <button onClick={() => onOpenSettings(themeConfig)} className="w-[42px] h-[42px] rounded-full flex items-center justify-center bg-white/20 backdrop-blur-xl border border-white/40 shadow-[0_2px_12px_rgba(0,0,0,0.06),inset_0_2px_4px_rgba(255,255,255,0.3)] active:scale-95 transition-transform" style={{ color: themeConfig.textPrimary || '#333' }}>
              <MoreHorizontal size={22} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      ) : (
        <div 
          className="absolute top-0 left-0 right-0 bg-zinc-950 z-30 shadow-2xl flex flex-col overflow-hidden pb-1 border-b border-white/10"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="px-4 py-3 flex items-center justify-between text-white/90 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800">
            <div className="flex items-center gap-2 overflow-hidden mr-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-bold text-zinc-100 truncate max-w-[180px]">{movieFileName || '精彩视频'}</span>
                <span className="text-[10px] text-zinc-400">正在与 {charId} 一起观影</span>
              </div>
            </div>
            <button 
              onClick={() => {
                setIsWatchingMovie(false);
                if (movieUrl) {
                  URL.revokeObjectURL(movieUrl);
                  setMovieUrl('');
                }
              }} 
              className="px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white active:scale-95 transition-all text-[11px] font-semibold flex items-center gap-1 shadow-md z-40"
              style={{ minHeight: '36px', minWidth: '80px' }}
            >
              <X size={13} strokeWidth={2.5} />
              <span>退出观影</span>
            </button>
          </div>
          <MoviePlayer movieUrl={movieUrl} />
        </div>
      )}

      {/* Messages */}
      <div 
        ref={scrollRef} 
        className={`absolute inset-0 overflow-y-auto px-4 ${isWatchingMovie ? 'pt-[calc(env(safe-area-inset-top)+315px)]' : 'pt-[calc(env(safe-area-inset-top)+80px)]'} flex flex-col scrollbar-hide z-10`} 
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 72px)' }}
        onClick={() => { if (activeMenuMsgId) setActiveMenuMsgId(null); }}
      >
        {messages.map((msg, i) => {
          const isMe = msg.sender === 'me';
          const avatar = isMe ? (avatar1 || '') : (avatar2 || '');
          
          const nextMsg = messages[i + 1];
          const prevMsg = i > 0 ? messages[i - 1] : null;
          const isGroupedNext = nextMsg && nextMsg.sender === msg.sender && nextMsg.time === msg.time && nextMsg.type !== 'call' && nextMsg.type !== 'nudge' && msg.type !== 'call' && msg.type !== 'nudge';
          const isGroupedPrev = prevMsg && prevMsg.sender === msg.sender && prevMsg.time === msg.time && prevMsg.type !== 'call' && prevMsg.type !== 'nudge' && msg.type !== 'call' && msg.type !== 'nudge';
          const marginBottom = isGroupedNext ? 'mb-2.5' : 'mb-6';

          // isRead if there's any message from them after this, or if it was marked as ignored
          const isRead = messages.slice(i + 1).some(m => m.sender === 'them') || msg.isIgnored;

          // Compute solid soft colors for "me" cards (opaque pastel background & matching border)
          const { solidBg: solidMeBg, solidBorder: solidMeBorder, accent: accentColor } = getMeCardColors(themeConfig?.bg, bubbleColor);

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





          return (
            <div key={`${msg.id}-${i}`} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${marginBottom}`}>
              {!isMe && (
                <div className="w-[38px] h-[38px] shrink-0 mr-2.5">
                  {!isGroupedPrev && <div className="w-full h-full rounded-full bg-black/10 overflow-hidden shadow-sm border border-white/20">
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
                ) : msg.type === 'invite' ? (
                  <div 
                    className={`p-5 pb-4 rounded-[22px] w-[275px] sm:w-[315px] shadow-[0_12px_32px_rgba(0,0,0,0.04)] border relative overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-[0_16px_36px_rgba(0,0,0,0.06)] ${
                      isMe ? 'rounded-tr-[4px]' : 'rounded-tl-[4px]'
                    } ${
                      isMe 
                        ? 'text-gray-800' 
                        : 'text-gray-800 bg-white border-black/[0.06]'
                    }`}
                    style={{
                      backgroundColor: isMe ? solidMeBg : '#ffffff',
                      borderColor: isMe ? solidMeBorder : 'rgba(0,0,0,0.06)',
                      backgroundImage: isMe 
                        ? `radial-gradient(circle, ${accentColor}1e 1.2px, transparent 1.2px)` 
                        : `radial-gradient(circle, ${accentColor}0a 1.2px, transparent 1.2px)`,
                      backgroundSize: '12px 12px'
                    }}
                  >
                    {/* Watermark Big Background SVG Icon */}
                    {msg.inviteType === 'music' ? (
                      <Disc size={110} strokeWidth={1} className="absolute -right-5 -bottom-5 opacity-[0.08] pointer-events-none select-none rotate-12 transition-transform duration-[1500ms] ease-out group-hover:rotate-[60deg]" style={{ color: accentColor }} />
                    ) : (
                      <Film size={110} strokeWidth={1} className="absolute -right-5 -bottom-5 opacity-[0.08] pointer-events-none select-none -rotate-12 transition-transform duration-[1500ms] ease-out group-hover:rotate-[-45deg]" style={{ color: accentColor }} />
                    )}

                    {/* Tagline Header */}
                    <div className="text-[9px] font-extrabold tracking-[0.2em] uppercase select-none mb-2.5 flex items-center gap-1.5" style={{ color: accentColor }}>
                      {msg.inviteType === 'music' ? (
                        <>
                          <Music size={11} strokeWidth={2.5} />
                          <span>MUSIC SESSION</span>
                        </>
                      ) : (
                        <>
                          <Film size={11} strokeWidth={2.5} />
                          <span>CINEMA SESSION</span>
                        </>
                      )}
                    </div>

                    {/* Title & Description Text */}
                    <div className="flex flex-col min-w-0 flex-1 pr-6 mb-5 relative z-10">
                      <h4 className="text-[16px] font-extrabold text-gray-800 leading-snug tracking-tight">
                        {isMe ? (
                          msg.inviteType === 'music' ? (msg.songName || '一起听歌') : (msg.movieName || '一起观影')
                        ) : (
                          msg.inviteType === 'music' ? '一起听歌' : '一起观影'
                        )}
                      </h4>
                      <p className="text-[12px] text-gray-500/90 leading-relaxed mt-2 select-none">
                        {isMe ? (
                          msg.inviteType === 'music' 
                            ? '想和未婚夫一起听歌，未婚夫不会拒绝我这个小小的心愿吧' 
                            : '想和未婚夫一起看电影，未婚夫不会拒绝我这个小小的心愿吧'
                        ) : (
                          msg.inviteType === 'music' 
                            ? '未婚妻辛苦啦，和未婚夫一起听歌放松一下吧' 
                            : '未婚妻辛苦啦，和未婚夫一起看电影放松一下吧'
                        )}
                      </p>
                    </div>

                    {/* Actions / Status */}
                    <div className="w-full mt-auto relative z-10">
                      {msg.inviteStatus === 'pending' ? (
                        isMe ? (
                          <div className="w-full py-2 rounded-[12px] text-center text-[11.5px] font-bold border bg-white/70 shadow-sm"
                               style={{ borderColor: solidMeBorder, color: accentColor }}>
                            等待回应中...
                          </div>
                        ) : (
                          <div className="flex space-x-2 w-full">
                            <button 
                              className="flex-1 py-2 rounded-[12px] bg-black/[0.04] hover:bg-black/[0.08] active:scale-95 text-gray-700 text-[11.5px] font-bold transition-all border border-black/[0.05]"
                              onClick={(e) => { e.stopPropagation(); handleDeclineInvite(msg.id); }}
                            >
                              委婉拒绝
                            </button>
                            <button 
                              className="flex-1 py-2 rounded-[12px] text-white text-[11.5px] font-bold active:scale-95 shadow-sm transition-all hover:brightness-95"
                              style={{ backgroundColor: accentColor }}
                              onClick={(e) => { e.stopPropagation(); handleAcceptInvite(msg.id, msg.inviteType); }}
                            >
                              欣然接受
                            </button>
                          </div>
                        )
                      ) : msg.inviteStatus === 'accepted' ? (
                        msg.inviteType === 'movie' ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleStartAction(msg.inviteType); }}
                            className="w-full py-2.5 rounded-[12px] text-center text-[11.5px] font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:brightness-95"
                            style={{ backgroundColor: accentColor }}
                          >
                            <Film size={13} />
                            点击进入放映厅
                          </button>
                        ) : (
                          <div className="w-full py-2 rounded-[12px] text-center text-[11.5px] font-bold flex items-center justify-center gap-1.5 bg-black/[0.03] text-gray-500 border border-black/[0.04]">
                            <Check size={13} strokeWidth={2.5} /> 专属音频已开启
                          </div>
                        )
                      ) : msg.inviteStatus === 'busy' ? (
                        <div className="w-full py-2.5 px-3 rounded-[12px] text-center text-[11.5px] font-bold border flex items-center justify-center gap-1.5"
                             style={{ 
                               backgroundColor: isMe ? `${accentColor}12` : 'rgba(0,0,0,0.02)', 
                               borderColor: isMe ? `${accentColor}2c` : 'rgba(0,0,0,0.04)',
                               color: accentColor
                             }}>
                          老婆等我一下下，忙完马上来陪你！
                        </div>
                      ) : (
                        <div className="w-full py-2 rounded-[12px] text-center text-[11.5px] font-medium bg-black/[0.02] text-gray-400 border border-black/[0.03]">
                          已谢绝或已结束
                        </div>
                      )}
                    </div>
                  </div>
                ) : msg.type === 'check_in' ? (
                  <div 
                    className={`p-5 pb-4 rounded-[22px] w-[275px] sm:w-[315px] shadow-[0_12px_32px_rgba(0,0,0,0.04)] border relative overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-[0_16px_36px_rgba(0,0,0,0.06)] ${
                      isMe ? 'rounded-tr-[4px]' : 'rounded-tl-[4px]'
                    } ${
                      isMe 
                        ? 'text-gray-800' 
                        : 'text-gray-800 bg-white border-black/[0.06]'
                    }`}
                    style={{
                      backgroundColor: isMe ? solidMeBg : '#ffffff',
                      borderColor: isMe ? solidMeBorder : 'rgba(0,0,0,0.06)',
                      backgroundImage: isMe 
                        ? `radial-gradient(circle, ${accentColor}1e 1.2px, transparent 1.2px)` 
                        : `radial-gradient(circle, ${accentColor}0a 1.2px, transparent 1.2px)`,
                      backgroundSize: '12px 12px'
                    }}
                  >
                    {/* Watermark Big Background SVG Icon */}
                    <Camera size={110} strokeWidth={1} className="absolute -right-5 -bottom-5 opacity-[0.08] pointer-events-none select-none rotate-12 transition-transform duration-[1500ms] ease-out group-hover:rotate-[35deg]" style={{ color: accentColor }} />

                    {/* Tagline Header */}
                    <div className="text-[9px] font-extrabold tracking-[0.2em] uppercase select-none mb-2.5 flex items-center gap-1.5" style={{ color: accentColor }}>
                      <Camera size={11} strokeWidth={2.5} />
                      <span>STATUS REQUEST</span>
                    </div>

                    {/* Title & Description Text */}
                    <div className="flex flex-col min-w-0 flex-1 pr-6 mb-5 relative z-10">
                      <h4 className="text-[16px] font-extrabold text-gray-800 leading-snug tracking-tight">
                        {isMe ? '互动查岗' : `${charId} 正在查岗`}
                      </h4>
                      <p className="text-[12px] text-gray-500/90 leading-relaxed mt-2 select-none">
                        {isMe 
                          ? '已发出查岗指令，等待未婚妻的即刻状态回报' 
                          : '拍张照片或者写点什么，让未婚夫知道你现在的状态吧'
                        }
                      </p>
                    </div>

                    {/* Actions / Status */}
                    <div className="w-full mt-auto relative z-10">
                      {msg.checkInStatus === 'pending' ? (
                        isMe ? (
                          <div className="w-full py-2 rounded-[12px] text-center text-[11.5px] font-bold border bg-white/70 shadow-sm"
                               style={{ borderColor: solidMeBorder, color: accentColor }}>
                            等待回报中...
                          </div>
                        ) : (
                          <div className="flex space-x-2 w-full">
                            <button 
                              className="flex-1 py-2 rounded-[12px] bg-black/[0.04] hover:bg-black/[0.08] active:scale-95 text-gray-700 text-[11.5px] font-bold transition-all border border-black/[0.05]"
                              onClick={(e) => { e.stopPropagation(); declineCheckIn(msg.id); }}
                            >
                              忽略
                            </button>
                            <button 
                              className="flex-1 py-2 rounded-[12px] text-white text-[11.5px] font-bold active:scale-95 shadow-sm transition-all hover:brightness-95"
                              style={{ backgroundColor: accentColor }}
                              onClick={(e) => { e.stopPropagation(); openCheckInModal(msg.id); }}
                            >
                              查岗汇报
                            </button>
                          </div>
                        )
                      ) : msg.checkInStatus === 'rejected' ? (
                        <div className="w-full py-2 rounded-[12px] text-center text-[11.5px] font-medium bg-black/[0.02] text-gray-400 border border-black/[0.03]">
                          已忽略
                        </div>
                      ) : (
                        <div className="w-full py-2 rounded-[12px] text-center text-[11.5px] font-bold flex items-center justify-center gap-1.5 bg-black/[0.03] text-gray-500 border border-black/[0.04]">
                          <Check size={13} strokeWidth={2.5} /> 已收到汇报
                        </div>
                      )}
                    </div>
                  </div>
                ) : msg.type === 'check_in_feedback' ? (
                  <div 
                    className={`rounded-[22px] w-[275px] sm:w-[315px] shadow-[0_12px_32px_rgba(0,0,0,0.04)] border relative overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-[0_16px_36px_rgba(0,0,0,0.06)] ${
                      isMe ? 'rounded-tr-[4px]' : 'rounded-tl-[4px]'
                    } ${
                      isMe 
                        ? 'text-gray-800' 
                        : 'text-gray-800 bg-white border-black/[0.06]'
                    }`}
                    style={{
                      backgroundColor: isMe ? solidMeBg : '#ffffff',
                      borderColor: isMe ? solidMeBorder : 'rgba(0,0,0,0.06)',
                      backgroundImage: isMe 
                        ? `radial-gradient(circle, ${accentColor}1e 1.2px, transparent 1.2px)` 
                        : `radial-gradient(circle, ${accentColor}0a 1.2px, transparent 1.2px)`,
                      backgroundSize: '12px 12px'
                    }}
                  >
                    {/* Watermark Big Background SVG Icon */}
                    <Camera size={110} strokeWidth={1} className="absolute -right-5 -bottom-5 opacity-[0.08] pointer-events-none select-none rotate-12 transition-transform duration-[1500ms] ease-out group-hover:rotate-[35deg]" style={{ color: accentColor }} />

                    {/* Tagline Header */}
                    <div className="text-[9px] font-extrabold tracking-[0.2em] uppercase select-none mb-3 p-5 pb-0 flex items-center gap-1.5" style={{ color: accentColor }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
                      <span>{isMe ? 'MY STATUS RESPONSE' : 'STATUS RESPONSE'}</span>
                    </div>

                    {/* Feedback Image Inset */}
                    {msg.imageUrl && (
                      <div className="px-5 mb-3 relative z-10">
                        <div className="w-full aspect-[4/3] bg-gray-100/30 overflow-hidden rounded-[14px] border border-black/[0.04] relative">
                          <img 
                            src={msg.imageUrl} 
                            alt="Check In Feedback" 
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                    )}

                    {/* Feedback Info Box */}
                    <div className="p-5 pt-1 pb-4 flex flex-col relative z-10">
                      <span className="text-[14px] font-semibold leading-relaxed whitespace-pre-wrap text-gray-800">
                        {msg.content || '我来汇报啦~'}
                      </span>
                    </div>
                  </div>
                ) : msg.type === 'decide' ? (
                  <div 
                    className={`p-5 pb-4 rounded-[22px] w-[275px] sm:w-[315px] shadow-[0_12px_32px_rgba(0,0,0,0.04)] border relative overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-[0_16px_36px_rgba(0,0,0,0.06)] ${
                      isMe ? 'rounded-tr-[4px]' : 'rounded-tl-[4px]'
                    } ${
                      isMe 
                        ? 'text-gray-800' 
                        : 'text-gray-800 bg-white border-black/[0.06]'
                    }`}
                    style={{
                      backgroundColor: isMe ? solidMeBg : '#ffffff',
                      borderColor: isMe ? solidMeBorder : 'rgba(0,0,0,0.06)',
                      backgroundImage: isMe 
                        ? `radial-gradient(circle, ${accentColor}1e 1.2px, transparent 1.2px)` 
                        : `radial-gradient(circle, ${accentColor}0a 1.2px, transparent 1.2px)`,
                      backgroundSize: '12px 12px'
                    }}
                  >
                    {/* Watermark Big Background SVG Icon */}
                    <Sparkles size={110} strokeWidth={1} className="absolute -right-5 -bottom-5 opacity-[0.08] pointer-events-none select-none rotate-12 transition-transform duration-[1500ms] ease-out group-hover:rotate-[35deg]" style={{ color: accentColor }} />

                    {/* Tagline Header */}
                    <div className="text-[9px] font-extrabold tracking-[0.2em] uppercase select-none mb-2.5 flex items-center gap-1.5" style={{ color: accentColor }}>
                      <Sparkles size={11} strokeWidth={2.5} />
                      <span>{msg.decideType === 'tarot' ? 'TAROT DECISION' : 'CUSTOM DECISION'}</span>
                    </div>

                    {isMe ? (
                      /* 我发出的：大标题是求助问题，副标题根据类型展示，底部有小横条等待 */
                      <>
                        <div className="flex flex-col min-w-0 flex-1 pr-6 mb-5 relative z-10">
                          <h4 className="text-[16px] font-extrabold text-gray-800 leading-snug tracking-tight">
                            {msg.decideQuestion}
                          </h4>
                          <p className="text-[12px] text-gray-500/90 leading-relaxed mt-2 select-none">
                            {msg.decideType === 'tarot' 
                              ? '我有问题想问，未婚夫的回答用塔罗牌告诉我吧' 
                              : '选择困难了，未婚夫帮我决定吧'}
                          </p>
                        </div>
                        <div className="w-full mt-auto relative z-10">
                          <div className="w-full py-2 rounded-[12px] text-center text-[11.5px] font-bold border bg-white/70 shadow-sm"
                               style={{ borderColor: solidMeBorder, color: accentColor }}>
                            {msg.decideType === 'tarot' ? '等待未婚夫抽牌' : '等待未婚夫答复'}
                          </div>
                        </div>
                      </>
                    ) : (
                      /* 梦角的回复：大标题是未婚夫的最终选择，下面一行是抽取的答案，为灰色，不带小横条 */
                      <div className="flex flex-col min-w-0 flex-1 pr-6 relative z-10">
                        <h4 className="text-[16px] font-extrabold text-gray-800 leading-snug tracking-tight">
                          未婚夫的最终选择
                        </h4>
                        <p className="text-[15px] font-semibold text-gray-400 leading-relaxed mt-2 select-none">
                          {msg.decideResult}
                        </p>
                      </div>
                    )}
                  </div>
                ) : msg.type === 'red_envelope' ? (
                  <div 
                    onClick={() => {
                      setOpenEnvelopeOverlay({
                        show: true,
                        messageId: msg.id,
                        sender: msg.sender,
                        amount: msg.redEnvelopeAmount || 0,
                        note: msg.content,
                        status: msg.redEnvelopeStatus || 'unopened',
                        isOpening: false
                      });
                    }}
                    className={`cursor-pointer w-[230px] rounded-[16px] overflow-hidden shadow-sm active:scale-95 transition-all relative select-none ${
                      isMe ? 'rounded-tr-[4px]' : 'rounded-tl-[4px]'
                    }`}
                    style={{
                      background: msg.redEnvelopeStatus === 'opened' 
                        ? 'linear-gradient(135deg, #E28C86 0%, #D05F56 100%)' 
                        : 'linear-gradient(135deg, #DE5347 0%, #C03F35 100%)'
                    }}
                  >
                    <div className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#FFE8BC]/10 flex items-center justify-center shrink-0 border border-[#FFE8BC]/25">
                        {msg.redEnvelopeStatus === 'opened' ? (
                          <MailOpen size={20} className="text-[#FFE8BC]/60" strokeWidth={1.5} />
                        ) : (
                          <Mail size={20} className="text-[#FFE8BC]" strokeWidth={1.5} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14.5px] font-bold text-[#FFE8BC] truncate leading-tight tracking-wide">
                          {msg.content}
                        </div>
                        <div className="text-[11px] text-[#FFE8BC]/75 mt-1 flex items-center gap-1">
                          {msg.redEnvelopeStatus === 'opened' ? '已拆开' : '待拆开'}
                        </div>
                      </div>
                    </div>
                    <div className="bg-black/[0.04] px-4 py-1.5 flex items-center text-[9px] text-[#FFE8BC]/50 border-t border-white/5 font-sans tracking-wide">
                      <span>{isMe ? `给${charId}的红包` : `${charId}给我的红包`}</span>
                    </div>
                  </div>
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
                  {!isGroupedPrev && <div className="w-full h-full rounded-full bg-black/10 overflow-hidden shadow-sm border border-white/20">
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
            className="absolute left-3 right-3 bg-white/80 backdrop-blur-xl rounded-[24px] py-4 grid grid-cols-4 gap-y-4 gap-x-2 px-3 items-center justify-items-center z-20 shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-white/50"
            style={{ bottom: 'calc(env(safe-area-inset-bottom) + 60px)' }}
          >
             <button className="flex flex-col items-center gap-2 group w-[64px]" onClick={() => { initiateCall(); setShowPlusMenu(false); }}>
                <div className="w-[50px] h-[50px] rounded-[16px] flex items-center justify-center group-active:scale-95 transition-transform" style={{ backgroundColor: themeConfig.cardBg, color: primaryColor }}><Video size={24} strokeWidth={1.5} /></div>
                <span className="text-[11px] text-black/50">视频</span>
             </button>
             
             <div className="flex flex-col items-center gap-2 group cursor-pointer w-[64px]" onClick={() => { imageInputRef.current?.click(); setShowPlusMenu(false); }}>
                <div className="w-[50px] h-[50px] rounded-[16px] flex items-center justify-center group-active:scale-95 transition-transform" style={{ backgroundColor: themeConfig.cardBg, color: primaryColor }}><ImageIcon size={24} strokeWidth={1.5} /></div>
                <span className="text-[11px] text-black/50">照片</span>
             </div>
             
             <div className="flex flex-col items-center gap-2 group cursor-pointer w-[64px]" onClick={() => { setShowPlusMenu(false); setShowStickerPane(true); }}>
                <div className="w-[50px] h-[50px] rounded-[16px] flex items-center justify-center group-active:scale-95 transition-transform" style={{ backgroundColor: themeConfig.cardBg, color: primaryColor }}><Smile size={24} strokeWidth={1.5} /></div>
                <span className="text-[11px] text-black/50">表情库</span>
             </div>
             
             <button className="flex flex-col items-center gap-2 group w-[64px]" onClick={() => { handleNudge(); setShowPlusMenu(false); }}>
                <div className="w-[50px] h-[50px] rounded-[16px] flex items-center justify-center group-active:scale-95 transition-transform" style={{ backgroundColor: themeConfig.cardBg, color: primaryColor }}><Heart size={24} strokeWidth={1.5} /></div>
                <span className="text-[11px] text-black/50">拍一拍</span>
             </button>

             <button className="flex flex-col items-center gap-2 group w-[64px]" onClick={() => { setInviteModal({ show: true, type: 'movie', direction: 'me' }); setShowPlusMenu(false); }}>
                <div className="w-[50px] h-[50px] rounded-[16px] flex items-center justify-center group-active:scale-95 transition-transform" style={{ backgroundColor: themeConfig.cardBg, color: primaryColor }}><MonitorPlay size={24} strokeWidth={1.5} /></div>
                <span className="text-[11px] text-black/50">一起观影</span>
             </button>

             <button className="flex flex-col items-center gap-2 group w-[64px]" onClick={() => { setInviteModal({ show: true, type: 'music', direction: 'me' }); setShowPlusMenu(false); }}>
                <div className="w-[50px] h-[50px] rounded-[16px] flex items-center justify-center group-active:scale-95 transition-transform" style={{ backgroundColor: themeConfig.cardBg, color: primaryColor }}><Music size={24} strokeWidth={1.5} /></div>
                <span className="text-[11px] text-black/50">一起听歌</span>
             </button>

             <button className="flex flex-col items-center gap-2 group w-[64px]" onClick={() => { setDecideModal(prev => ({ ...prev, show: true })); setShowPlusMenu(false); }}>
                <div className="w-[50px] h-[50px] rounded-[16px] flex items-center justify-center group-active:scale-95 transition-transform" style={{ backgroundColor: themeConfig.cardBg, color: primaryColor }}><Sparkles size={24} strokeWidth={1.5} /></div>
                <span className="text-[11px] text-black/50">帮我决定</span>
             </button>

             <button className="flex flex-col items-center gap-2 group w-[64px]" onClick={() => { setShowSendEnvelope(true); setShowPlusMenu(false); }}>
                <div className="w-[50px] h-[50px] rounded-[16px] flex items-center justify-center group-active:scale-95 transition-transform" style={{ backgroundColor: themeConfig.cardBg, color: primaryColor }}><Mail size={24} strokeWidth={1.5} /></div>
                <span className="text-[11px] text-black/50">发红包</span>
             </button>


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
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 30, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.95 }}
              className="shadow-[0_24px_60px_rgba(0,0,0,0.18)] rounded-[32px] p-6 w-full max-w-[360px] h-max relative overflow-hidden border transition-colors duration-300"
              style={{ backgroundColor: rootSolidMeBg, borderColor: rootSolidMeBorder }}
            >
              <button 
                onClick={() => setCheckInModalVisible(false)} 
                className="absolute right-5 top-5 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 text-gray-500 active:scale-95 transition-transform z-10 border border-black/5"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
              
              <div className="flex flex-col items-center mb-6 mt-2 relative z-10">
                 <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3 shadow-[0_4px_12px_rgba(0,0,0,0.03)] border transition-colors duration-300"
                      style={{ backgroundColor: '#ffffff', borderColor: rootSolidMeBorder, color: rootAccentColor }}>
                    <Camera size={24} strokeWidth={2.5}/>
                 </div>
                 <h3 className="text-[18px] font-bold tracking-wide text-gray-800">{charId}正在查岗</h3>
                 <p className="text-[12.5px] text-gray-500 mt-1.5 text-center px-1">拍张照或者写点什么，让他知道你的状态吧</p>
              </div>
              
              <div className="space-y-4 relative z-10">
                {checkInImage ? (
                  <div className="relative w-full h-[220px] bg-black/5 rounded-[20px] border overflow-hidden shadow-inner transition-colors duration-300" style={{ borderColor: rootSolidMeBorder }}>
                    <img src={checkInImage} alt="" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setCheckInImage('')}
                      className="absolute top-3 right-3 bg-black/60 hover:bg-black/85 text-white rounded-full p-1.5 backdrop-blur-sm active:scale-95"
                    >
                      <X size={16} strokeWidth={2.5}/>
                    </button>
                  </div>
                ) : (
                   <button 
                     onClick={() => checkInImgInputRef.current?.click()}
                     className="w-full h-[140px] rounded-[20px] border border-dashed bg-white/80 text-gray-600 flex flex-col items-center justify-center space-y-2 hover:bg-white active:scale-[0.99] transition-all"
                     style={{ borderColor: rootSolidMeBorder }}
                   >
                     <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-1 border transition-colors duration-300" style={{ borderColor: rootSolidMeBorder, color: rootAccentColor }}>
                        <Camera size={19} strokeWidth={2.5} />
                     </div>
                     <span className="text-[13.5px] font-medium text-gray-500">拍摄或从相册选择</span>
                   </button>
                )}

                <textarea
                  value={checkInText}
                  onChange={(e) => setCheckInText(e.target.value)}
                  placeholder="文字描述：正在做什么..."
                  className="w-full h-[110px] bg-white/80 border rounded-[20px] p-4 text-[14px] outline-none resize-none text-gray-800 placeholder-gray-400/80 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)] focus:bg-white focus:shadow-md transition-all"
                  style={{ borderColor: rootSolidMeBorder }}
                />

                <button 
                  onClick={submitCheckIn}
                  disabled={!checkInText && !checkInImage}
                  className="w-full py-4 rounded-[20px] font-bold text-[15px] text-white shadow-md active:scale-95 transition-all duration-300 mt-2 flex items-center justify-center space-x-2 disabled:opacity-40 disabled:scale-100 disabled:shadow-none"
                  style={{ 
                    backgroundColor: (checkInText.trim() || checkInImage) ? rootAccentColor : '#d1d5db',
                    color: '#ffffff'
                  }}
                >
                  <Send size={16} strokeWidth={2.5} />
                  <span>发送汇报</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Invitation Modal */}
      <AnimatePresence>
        {inviteModal.show && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white/95 backdrop-blur-md rounded-[24px] p-5 w-full max-w-sm border border-white/50 shadow-2xl flex flex-col"
            >
              <h3 className="text-[16px] font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                {inviteModal.type === 'music' ? <Music size={18} className="text-pink-500" /> : <MonitorPlay size={18} className="text-blue-500" />}
                {`发起 ${inviteModal.type === 'music' ? '一起听歌' : '一起观影'}`}
              </h3>
              <p className="text-[12px] text-gray-500 mb-4">
                {`向 ${charId} 发送一份温馨的约会邀请，写下你想 ${inviteModal.type === 'music' ? '听的歌名' : '看的片名'} 吧！`}
              </p>
              
              <input 
                type="text"
                placeholder={inviteModal.type === 'music' ? "例如: 遇见 / 晴天 (选填)" : "例如: 泰坦尼克号 / 爱乐之城 (选填)"}
                value={inviteInputVal}
                onChange={(e) => setInviteInputVal(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[14px] text-[14px] text-gray-800 outline-none focus:border-purple-300 transition-colors mb-4"
                autoFocus
              />
              
              <div className="flex space-x-3">
                <button 
                  onClick={() => {
                    setInviteModal({ show: false, type: 'music', direction: 'me' });
                    setInviteInputVal('');
                  }} 
                  className="flex-1 py-2.5 rounded-[12px] bg-gray-100 active:bg-gray-200 text-gray-600 font-medium text-[13px] transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={() => {
                    const text = inviteInputVal.trim();
                    sendInvite(inviteModal.type, text || undefined, text || undefined);
                    setInviteModal({ show: false, type: 'music', direction: 'me' });
                    setInviteInputVal('');
                  }} 
                  className="flex-1 py-2.5 rounded-[12px] bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold text-[13px] shadow-md hover:from-purple-600 hover:to-indigo-700 active:scale-98 transition-all"
                >
                  确定
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Help Me Decide Modal */}
      <AnimatePresence>
        {decideModal.show && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white/95 backdrop-blur-md rounded-[28px] p-5 w-full max-w-sm border border-white/50 shadow-2xl flex flex-col max-h-[85vh] overflow-y-auto"
            >
              <h3 className="text-[17px] font-bold text-gray-800 mb-1 flex items-center gap-1.5">
                <Sparkles size={18} className="text-amber-500" />
                帮我决定
              </h3>
              <p className="text-[11.5px] text-gray-400 mb-4">
                有纠结的事？让你的未婚夫来帮你做出决定吧
              </p>

              {/* Tabs */}
              <div className="flex bg-gray-100/80 rounded-[12px] p-1 mb-4 border border-black/[0.02]">
                <button 
                  className={`flex-1 py-1.5 rounded-[9px] text-[13px] font-bold transition-all ${decideModal.tab === 'tarot' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400'}`} 
                  onClick={() => setDecideModal(prev => ({ ...prev, tab: 'tarot' }))}
                >
                  🔮 塔罗牌 (数字)
                </button>
                <button 
                  className={`flex-1 py-1.5 rounded-[9px] text-[13px] font-bold transition-all ${decideModal.tab === 'custom' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400'}`} 
                  onClick={() => setDecideModal(prev => ({ ...prev, tab: 'custom' }))}
                >
                  🎯 自定义选项
                </button>
              </div>

              {/* Question Textarea */}
              <div className="mb-4">
                <label className="text-[11.5px] font-bold text-gray-500 block mb-1.5">我想问的问题</label>
                <textarea 
                  className="w-full bg-gray-50 border border-gray-100 rounded-[14px] p-3 text-[13.5px] text-gray-800 outline-none focus:border-amber-200 focus:bg-white resize-none h-[72px] placeholder-gray-400/70"
                  placeholder="例如：今晚吃什么？/ 明天的面试该穿哪套衣服？"
                  value={decideModal.question}
                  onChange={e => setDecideModal(prev => ({ ...prev, question: e.target.value }))}
                />
              </div>

              {/* Tarot Specific Fields */}
              {decideModal.tab === 'tarot' && (
                <div className="mb-5 bg-gray-50/50 p-3 rounded-[16px] border border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-[12px] font-bold text-gray-600 block">抽取数量</span>
                    <span className="text-[10px] text-gray-400">随机抽取 1-6 个神秘塔罗指引数</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <button 
                      onClick={() => setDecideModal(prev => ({ ...prev, tarotCount: Math.max(1, prev.tarotCount - 1) }))}
                      className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center active:scale-90 shadow-sm text-gray-600 transition-transform"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-[14px] font-bold text-gray-800 w-4 text-center">{decideModal.tarotCount}</span>
                    <button 
                      onClick={() => setDecideModal(prev => ({ ...prev, tarotCount: Math.min(6, prev.tarotCount + 1) }))}
                      className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center active:scale-90 shadow-sm text-gray-600 transition-transform"
                    >
                      <ChevronLeft size={16} className="rotate-180" />
                    </button>
                  </div>
                </div>
              )}

              {/* Custom Options Fields */}
              {decideModal.tab === 'custom' && (
                <div className="mb-5 space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[12px] font-bold text-gray-600">自定义候选项 (2-6个)</span>
                    {decideModal.options.length < 6 && (
                      <button 
                        onClick={() => setDecideModal(prev => ({ ...prev, options: [...prev.options, ''] }))}
                        className="text-[11px] text-amber-600 font-bold hover:underline"
                      >
                        + 添加选项
                      </button>
                    )}
                  </div>
                  {decideModal.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input 
                        type="text"
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-[10px] text-[13px] text-gray-800 outline-none focus:border-amber-200 focus:bg-white"
                        placeholder={`选项 ${idx + 1}`}
                        value={opt}
                        onChange={e => {
                          const newOpts = [...decideModal.options];
                          newOpts[idx] = e.target.value;
                          setDecideModal(prev => ({ ...prev, options: newOpts }));
                        }}
                      />
                      {decideModal.options.length > 2 && (
                        <button 
                          onClick={() => {
                            const newOpts = decideModal.options.filter((_, oIdx) => oIdx !== idx);
                            setDecideModal(prev => ({ ...prev, options: newOpts }));
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex space-x-3 mt-auto pt-2">
                <button 
                  onClick={() => {
                    setDecideModal(prev => ({ ...prev, show: false }));
                  }} 
                  className="flex-1 py-3 rounded-[14px] bg-gray-100 active:bg-gray-200 text-gray-500 font-semibold text-[13px] transition-all"
                >
                  取消
                </button>
                <button 
                  onClick={sendDecideRequest} 
                  className="flex-1 py-3 rounded-[14px] bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-[13px] shadow-md shadow-orange-500/10 active:scale-98 hover:from-amber-600 hover:to-orange-600 transition-all"
                >
                  求助未婚夫
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Send Red Envelope Modal */}
      <AnimatePresence>
        {showSendEnvelope && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/55 backdrop-blur-sm"
              onClick={() => setShowSendEnvelope(false)}
            />
            <motion.div 
              initial={{ scale: 0.92, y: 15, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.92, y: 15, opacity: 0 }}
              className="bg-[#F8F9FA] rounded-[24px] w-full max-w-[340px] p-6 shadow-2xl relative z-10 flex flex-col font-sans overflow-hidden border border-white"
            >
              {/* Fancy Red packet top ribbon design */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-[#C03F35]" />
              
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-[16px] font-extrabold text-gray-800 flex items-center gap-1.5">
                  <span className="text-[20px]">🧧</span> 包爱意红包
                </h3>
                <button onClick={() => setShowSendEnvelope(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-bold text-gray-500 mb-1.5">红包金额 (元)</label>
                  <div className="relative flex items-center border border-gray-200/80 rounded-xl bg-white focus-within:border-[#C03F35] transition-all px-3">
                    <span className="text-[15px] font-bold text-gray-400 mr-1.5">￥</span>
                    <input 
                      type="number"
                      className="w-full py-3 text-[16px] font-bold text-gray-800 outline-none placeholder:text-gray-300"
                      placeholder="0.00"
                      value={sendEnvelopeAmount}
                      onChange={e => setSendEnvelopeAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-gray-500 mb-1.5">留言备注 (不写也超甜)</label>
                  <input 
                    type="text"
                    className="w-full px-3 py-3 border border-gray-200/80 rounded-xl bg-white text-[13.5px] text-gray-800 outline-none focus:border-[#C03F35] transition-all placeholder:text-gray-300"
                    placeholder="例如：给未婚夫的小零花钱"
                    value={sendEnvelopeNote}
                    onChange={e => setSendEnvelopeNote(e.target.value)}
                    maxLength={25}
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <button 
                  disabled={!sendEnvelopeAmount || Number(sendEnvelopeAmount) <= 0}
                  onClick={() => handleSendEnvelope(Number(sendEnvelopeAmount), sendEnvelopeNote)}
                  className="w-full py-3.5 rounded-xl bg-[#C03F35] disabled:bg-gray-300 disabled:shadow-none hover:bg-[#A32F26] text-white font-bold text-[14px] shadow-lg shadow-red-500/10 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                >
                  塞钱进红包 🧧
                </button>
                <span className="text-[10px] text-center text-gray-400 mt-1 block">
                  发红包会消耗专属钱包的对应金额，未婚夫会自动收取并回复
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Open Red Envelope Immersive Overlay */}
      <AnimatePresence>
        {openEnvelopeOverlay.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setOpenEnvelopeOverlay(prev => ({ ...prev, show: false }))}
            />
            
            {/* 3D-Like Red Envelope Body */}
            <motion.div 
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 180 }}
              className={`w-full max-w-[325px] aspect-[3/4.55] shadow-2xl relative z-10 flex flex-col overflow-hidden rounded-[28px] border transition-colors duration-300 font-sans ${
                openEnvelopeOverlay.status === 'opened' 
                  ? 'bg-white border-gray-100 text-gray-800' 
                  : 'bg-[#C03F35] border-red-400/20 text-white'
              }`}
            >
              {openEnvelopeOverlay.status === 'unopened' ? (
                <>
                  {/* Elegant Golden Header Arc Design (Unopened state, taller) */}
                  <div className="absolute top-0 left-0 right-0 h-[58%] bg-gradient-to-b from-[#E35749] via-[#D14639] to-[#C03F35] rounded-b-[40%] shadow-md flex flex-col items-center pt-8 px-6 text-center border-b-[3px] border-[#FFE29C]/50 relative overflow-hidden">
                    {/* Elegant gold foil pattern inside header */}
                    <div className="absolute inset-0 pointer-events-none opacity-20">
                      <Heart size={16} className="text-[#FFE8BC] absolute top-3 left-4 rotate-12" />
                      <Sparkles size={20} className="text-[#FFE8BC] absolute top-12 right-8" />
                      <Heart size={14} className="text-[#FFE8BC] absolute bottom-3 left-10 -rotate-12" />
                      <Sparkles size={14} className="text-[#FFE8BC] absolute top-4 right-16 rotate-45" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none">
                      <div className="w-56 h-56 rounded-full border border-dashed border-[#FFE8BC]" />
                      <div className="w-48 h-48 rounded-full border border-double border-[#FFE8BC] absolute" />
                    </div>

                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-full bg-white/10 overflow-hidden border-2 border-[#FFE8BC]/30 shadow-md mb-3 flex items-center justify-center relative z-10">
                      {openEnvelopeOverlay.sender === 'me' ? (
                        avatar1 ? <img src={avatar1} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/20" />
                      ) : (
                        avatar2 ? <img src={avatar2} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/20" />
                      )}
                    </div>

                    {/* Sender Nickname */}
                    <div className="text-[#FFE8BC] text-[15.5px] font-bold relative z-10">
                      {openEnvelopeOverlay.sender === 'me' ? myNickname : charId}
                    </div>
                    {/* Subtitle */}
                    <div className="text-white/70 text-[11px] mt-1 select-none relative z-10">
                      {openEnvelopeOverlay.sender === 'me' ? '包给未婚夫的爱意' : '给你发了一个专属红包'}
                    </div>

                    {/* Greeting note */}
                    <div className="text-[17px] font-bold text-[#FFE8BC] mt-5 whitespace-normal line-clamp-2 max-w-full px-2 italic tracking-wide relative z-10 drop-shadow-sm">
                      “ {openEnvelopeOverlay.note || '恭喜发财，大吉大利'} ”
                    </div>
                  </div>

                  {/* Central Interactive Rotating Golden Button */}
                  <div className="absolute inset-x-0 bottom-12 flex flex-col items-center justify-center z-20">
                    <div className="flex flex-col items-center">
                       <motion.button
                         animate={openEnvelopeOverlay.isOpening ? { rotate: 360 } : {}}
                         transition={openEnvelopeOverlay.isOpening ? { repeat: Infinity, duration: 0.7, ease: "linear" } : {}}
                         onClick={() => {
                           if (openEnvelopeOverlay.isOpening) return;
                           setOpenEnvelopeOverlay(prev => ({ ...prev, isOpening: true }));
                           setTimeout(() => {
                             handleOpenEnvelopeFromFiance(
                               openEnvelopeOverlay.messageId!,
                               openEnvelopeOverlay.amount,
                               openEnvelopeOverlay.note
                             );
                             setOpenEnvelopeOverlay(prev => ({
                               ...prev,
                               isOpening: false,
                               status: 'opened'
                             }));
                           }, 1000);
                         }}
                         className="w-20 h-20 rounded-full bg-[#FFE29C] hover:bg-[#FFD575] active:scale-95 transition-transform flex items-center justify-center text-[#C03F35] font-extrabold text-[28px] shadow-[0_6px_20px_rgba(0,0,0,0.25)] border-4 border-[#C03F35]"
                       >
                         開
                       </motion.button>
                       <span className="text-[#FFE8BC]/60 text-[11px] mt-3 tracking-widest select-none font-medium">点击拆开红包</span>
                    </div>
                  </div>

                  {/* Elegant golden curve footer line */}
                  <div className="absolute bottom-0 inset-x-0 h-4 bg-[#A32F26]" />
                </>
              ) : (
                <>
                  {/* Elegant Golden Header Arc Design (Opened state, shorter) */}
                  <div className="absolute top-0 left-0 right-0 h-[34%] bg-gradient-to-b from-[#E35749] via-[#D14639] to-[#C03F35] rounded-b-[40%] shadow-md flex flex-col items-center border-b-[3px] border-[#FFE29C]/50 relative overflow-hidden">
                    {/* Elegant gold foil pattern inside header */}
                    <div className="absolute inset-0 pointer-events-none opacity-20">
                      <Heart size={16} className="text-[#FFE8BC] absolute top-3 left-4 rotate-12" />
                      <Sparkles size={20} className="text-[#FFE8BC] absolute top-12 right-8" />
                      <Heart size={14} className="text-[#FFE8BC] absolute bottom-3 left-10 -rotate-12" />
                      <Sparkles size={14} className="text-[#FFE8BC] absolute top-4 right-16 rotate-45" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none">
                      <div className="w-56 h-56 rounded-full border border-dashed border-[#FFE8BC]" />
                      <div className="w-48 h-48 rounded-full border border-double border-[#FFE8BC] absolute" />
                    </div>
                  </div>

                  {/* Opened content below the arc (with white background) */}
                  <div className="absolute top-[34%] inset-x-0 bottom-0 bg-white flex flex-col items-center pt-8 px-6 text-center text-gray-800">
                    {/* Small avatar & Sender Name in one line */}
                    <div className="flex items-center justify-center gap-1.5 mt-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-100 shadow-sm shrink-0">
                        {openEnvelopeOverlay.sender === 'me' ? (
                          avatar1 ? <img src={avatar1} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />
                        ) : (
                          avatar2 ? <img src={avatar2} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />
                        )}
                      </div>
                      <span className="text-[13.5px] font-bold text-gray-800 tracking-wide">
                        {openEnvelopeOverlay.sender === 'me' ? myNickname : charId}发出的红包
                      </span>
                    </div>

                    {/* Greeting Note */}
                    <div className="text-[12px] text-gray-400 mt-2.5 tracking-wide font-medium">
                      {openEnvelopeOverlay.note || '恭喜发财，大吉大利'}
                    </div>

                    {/* Cash Amount */}
                    <div className="mt-8 text-center flex items-baseline justify-center text-[#CD9B4A] font-extrabold tracking-tight">
                      <span className="text-[44px] leading-none font-black">{openEnvelopeOverlay.amount.toFixed(2)}</span>
                      <span className="text-[14px] ml-1.5 font-semibold text-gray-500">元</span>
                    </div>

                    {/* Status/Receipt Link */}
                    <div className="mt-6 flex justify-center">
                      <span className="text-[11.5px] text-[#CD9B4A] font-bold tracking-wider hover:underline flex items-center gap-0.5 cursor-pointer">
                        已存入零钱，可直接消费 <ChevronRight size={11} className="stroke-[3]" />
                      </span>
                    </div>
                  </div>
                </>
              )}
            </motion.div>

            {/* Elegant Golden Circular Close Button below the card */}
            <motion.button 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.15 }}
              onClick={() => setOpenEnvelopeOverlay(prev => ({ ...prev, show: false }))}
              className="absolute bottom-6 w-11 h-11 rounded-full border border-[#FFE8BC]/50 hover:border-[#FFE8BC]/80 bg-black/25 backdrop-blur-sm flex items-center justify-center text-[#FFE8BC] active:scale-90 transition-transform shadow-lg z-20"
            >
              <X size={22} strokeWidth={1.5} />
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden file inputs kept mounted to prevent unmounting during dialog active states */}
      <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, false)} />
      <input type="file" ref={newStickerInputRef} className="hidden" accept="image/*" onChange={handleNewStickerUpload} />
      <input type="file" ref={checkInImgInputRef} className="hidden" accept="image/*" onChange={handleCheckInImageUpload} />
      <input type="file" ref={movieInputRef} className="hidden" accept="video/*" onChange={handleMovieUpload} />
    </div>
  );
}
