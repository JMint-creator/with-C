import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { get, set } from 'idb-keyval';

export function useIDBState<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(initialValue);
  const isLoadedRef = useRef(false);
  const hasModifiedRef = useRef(false);

  useEffect(() => {
    const handleCustomChange = (e: CustomEvent) => {
      if (e.detail?.key === key) {
        setState(e.detail.newValue);
      }
    };
    window.addEventListener("idbStateChanged", handleCustomChange as EventListener);

    get(key).then((val) => {
      if (hasModifiedRef.current) return;
      if (val !== undefined) {
        setState(val);
      } else {
        try {
            const localVal = window.localStorage.getItem(key);
            if (localVal) {
                const parsed = JSON.parse(localVal);
                setState(parsed);
                set(key, parsed);
            }
        } catch(e) {}
      }
      isLoadedRef.current = true;
    });

    return () => {
      window.removeEventListener("idbStateChanged", handleCustomChange as EventListener);
    };
  }, [key]);

  const setValue = (value: SetStateAction<T>) => {
    hasModifiedRef.current = true;
    isLoadedRef.current = true;
    setState(prev => {
      try {
        const valueToStore = value instanceof Function ? (value as any)(prev) : value;
        setTimeout(() => {
          set(key, valueToStore).catch(console.error);
          window.dispatchEvent(new CustomEvent("idbStateChanged", { detail: { key, newValue: valueToStore } }));
        }, 0);
        return valueToStore;
      } catch (error) {
        console.error(error);
        return prev;
      }
    });
  };

  return [state, setValue as Dispatch<SetStateAction<T>>];
}

export function compressImage(file: File, maxWidth = 2500, maxHeight = 2500, quality = 0.9): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } else {
          resolve(event.target?.result as string); // Fallback
        }
      };
      img.onerror = (e) => reject(e);
    };
    reader.onerror = (e) => reject(e);
  });
}

export function useLocalState<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        try {
          setState(e.newValue ? JSON.parse(e.newValue) : initialValue);
        } catch (err) {}
      }
    };
    const handleCustomChange = (e: CustomEvent) => {
      if (e.detail?.key === key) {
        setState(e.detail.newValue);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("localStateChanged", handleCustomChange as EventListener);
    return () => {
       window.removeEventListener("storage", handleStorageChange);
       window.removeEventListener("localStateChanged", handleCustomChange as EventListener);
    };
  }, [key, initialValue]);

  const setValue = (value: SetStateAction<T>) => {
    try {
      const valueToStore = value instanceof Function ? (value as any)(state) : value;
      setState(valueToStore);
      setTimeout(() => {
        try {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          window.dispatchEvent(new CustomEvent("localStateChanged", { detail: { key, newValue: valueToStore } }));
        } catch (err) {
          console.error(err);
        }
      }, 0);
    } catch (error) {
      console.error(error);
    }
  };

  return [state, setValue as Dispatch<SetStateAction<T>>];
}
