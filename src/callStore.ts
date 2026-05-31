import { useState, useEffect } from 'react';

type CallState = 'none' | 'calling' | 'connected' | 'incoming';

class CallStore {
  state: CallState = 'none';
  isMinimized: boolean = false;
  duration: number = 0;
  listeners: Set<() => void> = new Set();
  timer: any = null;

  setState(newState: CallState) {
    this.state = newState;
    if (newState === 'connected') {
      this.duration = 0;
      if (!this.timer) {
        this.timer = setInterval(() => {
          this.duration++;
          this.notify();
        }, 1000);
      }
    } else {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }
    this.notify();
  }

  setMinimized(min: boolean) {
    this.isMinimized = min;
    this.notify();
  }

  notify() {
    this.listeners.forEach(l => l());
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const callStore = new CallStore();

export function useCallStore() {
  const [stamp, setStamp] = useState(0);
  useEffect(() => {
    return callStore.subscribe(() => setStamp(Date.now() + Math.random()));
  }, []);
  
  return {
    videoCallState: callStore.state,
    isMinimized: callStore.isMinimized,
    callDuration: callStore.duration,
  setVideoCallState: (s: CallState | ((prev: CallState) => CallState)) => {
      const newState = typeof s === 'function' ? s(callStore.state) : s;
      callStore.setState(newState);
  },
    setIsMinimized: (m: boolean) => callStore.setMinimized(m)
  };
}
