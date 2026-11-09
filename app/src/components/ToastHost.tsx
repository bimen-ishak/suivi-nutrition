import { useEffect, useRef, useState } from 'react';
import { onToast } from '../utils/toast';
import { getLanguage, isRtl } from '../utils/messages';
import './ToastHost.css';

const DISPLAY_MS = 3800;

export function ToastHost() {
  const [text, setText] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const stop = onToast(next => {
      setText(next);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setText(null), DISPLAY_MS);
    });
    return () => {
      stop();
      window.clearTimeout(timer.current);
    };
  }, []);

  if (!text) return null;
  const rtl = isRtl(getLanguage());

  return (
    <div className="toast" role="status" aria-live="polite" dir={rtl ? 'rtl' : 'ltr'} onClick={() => setText(null)}>
      {text}
    </div>
  );
}
