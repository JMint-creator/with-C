import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Video, Settings, Smile, PhoneCall, PhoneMissed, Phone, MicOff, CameraOff, MonitorPlay, Check, CheckCheck, MessageCircle, Heart, Sparkles, Camera } from 'lucide-react';
import { useCallStore } from './callStore';
import { useIDBState, useLocalState } from './utils';
import { ImageIcon } from 'lucide-react';

export const VideoCallOverlay = () => {
  const { videoCallState, isMinimized, callDuration, setVideoCallState, setIsMinimized } = useCallStore();
  const [messages, setMessages] = useIDBState<any[]>('app_chatMessages', []);
  const [avatar1] = useIDBState('app_chatAvatar1', '');
  const [avatar2] = useIDBState('app_chatAvatar2', '');
  
  const [charId] = useLocalState('app_charId', '查理苏');

  const endCall = () => {
    setVideoCallState('none');
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'me',
      type: 'call',
      content: `通话时长 ${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, '0')}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  const isDragging = useRef(false);

  return (
    <AnimatePresence>
        {videoCallState === 'incoming' && !isMinimized && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#5c5a61]/90 backdrop-blur-2xl rounded-[32px] w-full max-w-[280px] p-8 flex flex-col items-center shadow-2xl border border-white/10"
            >
              <div className="w-[120px] h-[120px] mb-6 relative flex items-center justify-center">
                 <div className="absolute inset-0 rounded-full border border-white/10 scale-[1.15]"></div>
                 <div className="absolute inset-0 rounded-full border border-white/10 scale-[1.3]"></div>
                 {avatar2 ? <img src={avatar2} alt="" className="w-20 h-20 rounded-full object-cover z-10 shadow-lg" /> : <div className="w-20 h-20 rounded-full bg-white/20 z-10"></div>}
              </div>
              
              <div className="text-white text-2xl font-serif mb-2 tracking-wide font-medium">{charId.replace(/"/g, '')}</div>
              <div className="flex items-center space-x-2 text-white/60 text-sm mb-12">
                 <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
                 <span>邀请您进行视频通话</span>
              </div>
              
              <div className="flex w-full justify-between px-2">
                 <div className="flex flex-col items-center gap-2">
                    <button className="w-[56px] h-[56px] rounded-full bg-red-500 flex items-center justify-center text-white shadow-[0_4px_20px_rgba(239,68,68,0.4)] active:bg-red-600 transition-colors" onClick={declineCall}>
                      <Phone size={24} className="rotate-[135deg]" fill="currentColor" strokeWidth={0}/>
                    </button>
                    <span className="text-white/60 text-xs tracking-wider">拒绝</span>
                 </div>
                 <div className="flex flex-col items-center gap-2">
                    <button className="w-[56px] h-[56px] rounded-full bg-green-500 flex items-center justify-center text-white shadow-[0_4px_20px_rgba(34,197,94,0.4)] active:bg-green-600 transition-colors" onClick={acceptCall}>
                      <Phone size={24} fill="currentColor" strokeWidth={0}/>
                    </button>
                    <span className="text-white/60 text-xs tracking-wider">接听</span>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {(videoCallState === 'calling' || videoCallState === 'connected') && !isMinimized && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          >
             <div className="bg-[#191924] w-full max-w-[340px] h-[65vh] max-h-[600px] rounded-[32px] flex flex-col shadow-2xl border border-white/5 relative overflow-hidden">
                <div className="flex items-center justify-between p-4 px-5">
                   <div className="flex items-center space-x-2 bg-black/40 px-3 py-1.5 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-white/90 text-xs tracking-wider">{videoCallState === 'calling' ? '连接中' : '通话中'}</span>
                   </div>
                   <div className="flex items-center">
                      <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 active:bg-white/20 border border-white/10" onClick={() => setIsMinimized(true)}>
                         <div className="w-3 h-[2px] bg-current rounded-full"></div>
                      </button>
                   </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center pb-20">
                    <div className="w-[140px] h-[140px] mb-8 relative flex items-center justify-center">
                       <div className="absolute inset-0 rounded-full border border-white/10 scale-[1.1]"></div>
                       <div className="absolute inset-0 rounded-full border border-white/10 scale-[1.3]"></div>
                       {avatar2 ? <img src={avatar2} alt="" className="w-[100px] h-[100px] rounded-full object-cover z-10 shadow-lg" /> : <div className="w-[100px] h-[100px] rounded-full bg-white/10 z-10"></div>}
                    </div>
                    
                    <div className="text-white text-2xl font-serif tracking-wide mb-2">{charId.replace(/"/g, '')}</div>
                    
                    <div className="text-white/40 text-sm flex items-center space-x-1.5">
                       <Video size={14} />
                       <span>{videoCallState === 'calling' ? '正在连接' : (
                          `${Math.floor(callDuration / 60).toString().padStart(2, '0')}:${(callDuration % 60).toString().padStart(2, '0')}`
                       )}</span>
                    </div>

                    {videoCallState === 'calling' && (
                       <div className="flex space-x-1 mt-3">
                         <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" style={{animationDelay: '0ms'}}></div>
                         <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" style={{animationDelay: '150ms'}}></div>
                         <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" style={{animationDelay: '300ms'}}></div>
                       </div>
                    )}
                </div>

                <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center">
                   <button className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-white shadow-[0_4px_20px_rgba(239,68,68,0.4)] active:bg-red-600 transition-colors" onClick={endCall}>
                      <Phone size={26} className="rotate-[135deg]" fill="currentColor" strokeWidth={0}/>
                   </button>
                </div>
             </div>
          </motion.div>
        )}

        {(videoCallState === 'calling' || videoCallState === 'connected') && isMinimized && (
           <motion.div
             drag
             dragMomentum={false}
             onDragStart={() => {
               isDragging.current = true;
             }}
             onDragEnd={(e, info) => {
               setTimeout(() => {
                 isDragging.current = false;
               }, 150);
             }}
             initial={{ opacity: 0, y: -20, scale: 0.9 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, scale: 0.9 }}
             className="fixed top-20 right-4 z-50 cursor-pointer shadow-2xl rounded-[100px]"
           >
             <div 
                className="bg-[#191924]/95 backdrop-blur-3xl border border-white/10 pr-2 pl-1 py-1 flex items-center w-[160px] relative rounded-[100px]"
                onClick={() => {
                  if (!isDragging.current) {
                    setIsMinimized(false);
                  }
                }}
             >
               {avatar2 ? <img src={avatar2} alt="" className="w-[42px] h-[42px] rounded-full object-cover shrink-0 relative z-10 shadow-sm pointer-events-none" /> : <div className="w-[42px] h-[42px] rounded-full bg-white/10 shrink-0 pointer-events-none"></div>}
               <div className="flex flex-col justify-center ml-2 flex-1 overflow-hidden pointer-events-none">
                 <span className="text-white text-[13px] font-medium leading-tight truncate">{charId.replace(/"/g, '')}</span>
                 <span className="text-white/50 text-[11px] leading-tight flex items-center gap-1 mt-0.5">
                    {videoCallState === 'calling' ? (
                      <span className="truncate">连接中...</span>
                    ) : (
                       `${Math.floor(callDuration / 60).toString().padStart(2, '0')}:${(callDuration % 60).toString().padStart(2, '0')}`
                    )}
                 </span>
               </div>
               
               <div className="absolute top-2.5 right-2 w-2 h-2 rounded-full bg-green-500 animate-pulse border border-black/50 pointer-events-none"></div>
               
               <button className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white active:bg-red-600 shadow-sm transition-colors shrink-0 ml-1 z-10" onClick={(e) => { e.stopPropagation(); endCall(); }}>
                  <Phone size={14} className="rotate-[135deg]" fill="currentColor" strokeWidth={0}/>
               </button>
             </div>
           </motion.div>
        )}
      </AnimatePresence>
  );
};
