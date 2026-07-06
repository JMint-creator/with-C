import React, { useRef, useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface MoviePlayerProps {
  movieUrl: string;
}

export const MoviePlayer = React.memo(function MoviePlayer({ movieUrl }: MoviePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStalled, setIsStalled] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Buffer state tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleStalled = () => {
      console.warn('MoviePlayer: Video stalled, buffering...');
      setIsStalled(true);
    };

    const handleWaiting = () => {
      setIsStalled(true);
    };

    const handlePlaying = () => {
      setIsStalled(false);
    };

    const handleCanPlay = () => {
      setIsStalled(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    video.addEventListener('stalled', handleStalled);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('stalled', handleStalled);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  const handleReload = () => {
    const video = videoRef.current;
    if (!video) return;
    const prevTime = video.currentTime;
    const wasPaused = video.paused;
    
    console.log(`MoviePlayer: Reloading video stream at time: ${prevTime}`);
    
    // Force reload source stream to recover from stalled WebKit state
    video.load();
    
    // On load start, seek back to where we were
    const onLoadedMetadata = () => {
      video.currentTime = prevTime;
      if (!wasPaused) {
        video.play().catch(err => console.error('MoviePlayer: Auto-resume failed:', err));
      }
      setIsStalled(false);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
    
    video.addEventListener('loadedmetadata', onLoadedMetadata);
  };

  return (
    <div className="relative w-full aspect-video max-h-[250px] bg-black flex flex-col items-center justify-center overflow-hidden">
      <video 
        ref={videoRef}
        src={movieUrl} 
        controls 
        autoPlay
        playsInline
        preload="auto"
        className="w-full h-full object-contain max-h-[250px]"
      />
      
      {/* Loading overlay */}
      {isStalled && (
        <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-2 pointer-events-none z-10">
          <div className="w-8 h-8 border-4 border-t-transparent border-red-500 rounded-full animate-spin" />
          <span className="text-white/90 text-[12px] font-semibold tracking-wide">正在极速缓冲中...</span>
        </div>
      )}
      
      {/* Dynamic recovery mechanism helper overlay */}
      <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
        <button
          onClick={handleReload}
          className="bg-black/60 hover:bg-black/85 text-white/80 hover:text-white px-1.5 py-0.5 rounded-lg text-[9.5px] font-semibold flex items-center gap-0.5 border border-white/5 transition-all active:scale-95 shadow-md backdrop-blur-sm opacity-80 hover:opacity-100"
          title="如果视频卡住，点击此处重新加载当前进度"
        >
          <RefreshCw size={9} className={`text-red-400/90 ${isStalled ? 'animate-spin' : ''}`} />
          <span>卡顿刷新</span>
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => prevProps.movieUrl === nextProps.movieUrl);
