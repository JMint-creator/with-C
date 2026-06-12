import React, { useEffect, useRef } from "react";
import { useLocalState, useIDBState } from "./utils";

const SILENT_AUDIO_BASE64 = "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU5LjE2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIAD+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+AAAAAExhdmM1OS4xOAQzAAAAAAAAAAAAAP/zBACAAAAABgAAAAAAAADDLzXwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//OEBAQAAAAAHAIAAAAAAAADi75rIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//OEBAgAAAAAHAIAAAAAAAADih5nIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//OEBAwAAAAAHAIAAAAAAAADih5nIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export const KeepAlivePlayer: React.FC = () => {
  const [keepAlive] = useLocalState("app_chatKeepAlive", false);
  const [customAudio, setCustomAudio] = useIDBState("app_keepalive_audio", "");
  const audioRef = useRef<HTMLAudioElement>(null);
  const previousAudioRef = useRef<string>("");

  useEffect(() => {
    const handleAudioUpdate = (e: any) => {
      if (e.detail !== undefined) {
        setCustomAudio(e.detail);
      }
    };
    window.addEventListener("keepalive_audio_changed", handleAudioUpdate);
    return () => window.removeEventListener("keepalive_audio_changed", handleAudioUpdate);
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    
    const currentSrc = customAudio || SILENT_AUDIO_BASE64;
    const abortController = new AbortController();
    
    if (previousAudioRef.current !== currentSrc) {
       audioRef.current.src = currentSrc;
       audioRef.current.load();
       previousAudioRef.current = currentSrc;
    }

    if (keepAlive) {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: "后台运行中",
          artist: "保活服务",
          album: "状态"
        });
      }

      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
         playPromise.catch((e) => {
           console.log("KeepAlive autoplay prevented, waiting for user interaction:", e);
         });
      }
      
      // 引入 Web Locks API 维持后台活跃
      if (navigator.locks && navigator.locks.request) {
        navigator.locks.request("keep-alive-lock", { signal: abortController.signal }, () => {
          return new Promise((resolve) => {
            abortController.signal.addEventListener("abort", () => {
              resolve(undefined);
            });
          });
        }).catch(err => {
          console.warn("Web Locks API keep-alive failed:", err);
        });
      }
    } else {
      audioRef.current.pause();
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = null;
      }
      abortController.abort();
    }
    
    return () => {
       abortController.abort();
    };
  }, [keepAlive, customAudio]);

  useEffect(() => {
    const handleInteraction = () => {
      if (keepAlive && audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      }
    };

    window.addEventListener("click", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, [keepAlive]);

  // Notice we removed src={...} from <audio> because we set it manually to ensure .load() works predictably
  return <audio ref={audioRef} loop playsInline style={{ display: "none" }} />;
};
