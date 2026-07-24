import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Disc, SkipBack, SkipForward, Play, Pause, X } from 'lucide-react';
import { parseLrc, ParsedLyric } from './utils';

export const GlobalMusicWidget = ({
  playQueue,
  currentMusicIndex,
  isMusicPlaying,
  toggleMusicPlay,
  prevMusic,
  nextMusic,
  audioCurrentTime,
  audioProgress,
  showMusicWidget
}: any) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  
  useEffect(() => {
    if (isMusicPlaying) {
      setHasShown(true);
    }
  }, [isMusicPlaying]);

  const currentMusic = playQueue.length > 0 ? playQueue[currentMusicIndex % playQueue.length] : null;

  const parsedLyrics = useMemo(() => {
    if (currentMusic?.lrc) {
      return parseLrc(currentMusic.lrc);
    }
    return [];
  }, [currentMusic?.lrc]);

  const activeLyricIndex = useMemo(() => {
    if (parsedLyrics.length === 0) return -1;
    for (let i = parsedLyrics.length - 1; i >= 0; i--) {
      if (audioCurrentTime >= parsedLyrics[i].time) {
        return i;
      }
    }
    return -1;
  }, [audioCurrentTime, parsedLyrics]);

  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded && lyricsContainerRef.current && activeLyricIndex !== -1) {
      const innerContainer = lyricsContainerRef.current.children[0];
      if (innerContainer) {
        const el = innerContainer.children[activeLyricIndex] as HTMLElement;
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [activeLyricIndex, isExpanded]);

  if (!currentMusic || !showMusicWidget || (!isMusicPlaying && !hasShown)) return null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      style={{ position: 'fixed', zIndex: 100, bottom: 80, right: 20 }}
      className="flex flex-col items-end"
    >
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-white/80 backdrop-blur-3xl rounded-[24px] shadow-[0_16px_40px_rgba(0,0,0,0.12)] p-4 w-[240px] border border-white/60 flex flex-col pointer-events-auto relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-black/5 blur-[40px] rounded-full pointer-events-none"></div>

            <div className="flex items-center gap-3 mb-3 relative z-10">
                <motion.div 
                  animate={{ rotate: isMusicPlaying ? 360 : 0 }} 
                  transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                  className="w-[36px] h-[36px] rounded-full flex-shrink-0 relative shadow-sm overflow-hidden border border-[#0a0a0a] flex items-center justify-center bg-gradient-to-br from-[#2a2a2a] to-[#111111]"
                >
                   <div className="absolute inset-0 rounded-full mix-blend-screen opacity-30" style={{background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.8) 30deg, transparent 60deg, transparent 180deg, rgba(255,255,255,0.8) 210deg, transparent 240deg)'}}></div>
                   <div className="absolute inset-[3px] rounded-full border border-black/40"></div>
                   <div className="absolute inset-[6px] rounded-full border border-[#2a2a2a]"></div>
                   <div className="w-[10px] h-[10px] rounded-full z-10 bg-[#e0e0e0] border border-black/20 flex items-center justify-center overflow-hidden relative">
                     <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b6b] to-[#4ecdc4]"></div>
                     <div className="w-[2px] h-[2px] bg-[#111] rounded-full relative z-10"></div>
                   </div>
                </motion.div>
                
                <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="text-[14px] font-bold text-black/90 truncate tracking-tight">{currentMusic.name}</span>
                    <span className="text-[11px] font-medium text-black/50 truncate mt-0.5">{currentMusic.artist || 'Unknown Artist'}</span>
                </div>
                
                <button onClick={() => setIsExpanded(false)} className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center text-black/40 hover:text-black/70 hover:bg-black/10 transition-colors self-start flex-shrink-0">
                    <X size={12} strokeWidth={2.5} />
                </button>
            </div>

            {/* Lyrics Area */}
            <div 
              className="h-[60px] w-full overflow-y-auto my-1 rounded-xl relative no-scrollbar mask-image-vertical"
              ref={lyricsContainerRef}
            >
              {parsedLyrics.length > 0 ? (
                <div className="py-[20px] flex flex-col gap-1.5">
                  {parsedLyrics.map((lyric, idx) => (
                    <div 
                      key={idx} 
                      className={`text-center text-[12px] transition-all duration-300 ${idx === activeLyricIndex ? 'text-black/90 font-bold scale-[1.02]' : 'text-black/40 font-medium'}`}
                    >
                      {lyric.text}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[11px] font-medium text-black/30 tracking-wide">
                  当前暂无歌词
                </div>
              )}
            </div>

            <div className="w-full h-[3px] bg-black/5 rounded-full mt-3 mb-4 relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full rounded-full bg-black/80 transition-all duration-300" style={{width: `${audioProgress * 100}%`}}></div>
            </div>

            <div className="flex justify-center items-center gap-5 relative z-10 px-2">
              <button onClick={prevMusic} className="text-black/60 hover:text-black/90 transition-colors active:scale-95"><SkipBack size={20} fill="currentColor" /></button>
              <button onClick={toggleMusicPlay} className="w-10 h-10 rounded-full bg-black/90 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
                {isMusicPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
              </button>
              <button onClick={nextMusic} className="text-black/60 hover:text-black/90 transition-colors active:scale-95"><SkipForward size={20} fill="currentColor" /></button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="cd"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExpanded(true)}
            className="w-[56px] h-[56px] rounded-full cursor-pointer pointer-events-auto relative shadow-[0_4px_16px_rgba(0,0,0,0.3)] overflow-hidden"
          >
            <motion.div 
              animate={{ rotate: isMusicPlaying ? 360 : 0 }} 
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }} 
              className="w-full h-full rounded-full relative flex items-center justify-center overflow-hidden border border-[#0a0a0a]"
              style={{ 
                background: 'radial-gradient(circle, #2a2a2a 0%, #111111 100%)',
                boxShadow: 'inset 0 0 0 1px #3a3a3a, inset 0 0 0 2px #111, inset 0 0 0 4px #252525'
              }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 rounded-full mix-blend-screen opacity-40" 
                   style={{
                     background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.8) 30deg, transparent 60deg, transparent 180deg, rgba(255,255,255,0.8) 210deg, transparent 240deg)'
                   }}>
              </div>

              {/* Grooves lines */}
              <div className="absolute inset-[8px] rounded-full border border-black/40"></div>
              <div className="absolute inset-[13px] rounded-full border border-[#2a2a2a]"></div>
              <div className="absolute inset-[18px] rounded-full border border-black/30"></div>
              
              {/* Center label */}
              <div className="w-[20px] h-[20px] rounded-full z-10 flex items-center justify-center relative overflow-hidden bg-[#e0e0e0]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b6b] to-[#4ecdc4]"></div>
                <div className="w-[5px] h-[5px] bg-[#111] rounded-full relative z-10 shadow-inner border border-black/20"></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
