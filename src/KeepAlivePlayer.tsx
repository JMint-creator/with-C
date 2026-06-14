import React, { useEffect, useRef } from "react";
import { useLocalState, useIDBState } from "./utils";

const SILENT_AUDIO_BASE64 = "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU5LjE2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIAD+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+AAAAAExhdmM1OS4xOAQzAAAAAAAAAAAAAP/zBACAAAAABgAAAAAAAADDLzXwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//OEBAQAAAAAHAIAAAAAAAADi75rIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//OEBAgAAAAAHAIAAAAAAAADih5nIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//OEBAwAAAAAHAIAAAAAAAADih5nIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export const KeepAlivePlayer: React.FC = () => {
  const [keepAlive] = useLocalState("app_chatKeepAlive", false);
  const [customAudio, setCustomAudio] = useIDBState("app_keepalive_audio", "");
  const [keepaliveIcon] = useIDBState<string>("app_keepalive_icon", "");
  const [chatAvatar2] = useIDBState<string>("app_chatAvatar2", "");
  const [avatar2] = useIDBState<string>("app_avatar2", "");
  const [mjNickname] = useLocalState<string>("app_mjNickname", "梦角");
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
    const handleIconUpdate = (e: any) => {
      // Force trigger state sync if dispatched
    };
    window.addEventListener("keepalive_icon_changed", handleIconUpdate);
    return () => window.removeEventListener("keepalive_icon_changed", handleIconUpdate);
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
        const iconSrc = keepaliveIcon || chatAvatar2 || avatar2;
        const artwork = iconSrc ? [{ src: iconSrc, sizes: "96x96", type: "image/png" }] : [];
        navigator.mediaSession.metadata = new MediaMetadata({
          title: "后台运行中",
          artist: mjNickname || "保活服务",
          album: "状态",
          artwork
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
  }, [keepAlive, customAudio, keepaliveIcon, chatAvatar2, avatar2, mjNickname]);

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
