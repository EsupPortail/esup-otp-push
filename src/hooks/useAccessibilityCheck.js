import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

export default function useAccessibilityCheck(url, timeout = 5000) {
  const [status, setStatus] = useState('unknown'); // 'unknown' | 'checking' | 'ok' | 'failed'
  const [attempt, setAttempt] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!url) {
      setStatus('unknown');
      return;
    }

    let cancelled = false;
    setStatus('checking');

    const controller = new AbortController();

    (async () => {
      try {
        // On essaie un GET car certains serveurs refusent HEAD
        const res = await axios.get(url, { timeout, signal: controller.signal });
        if (cancelled || !mounted.current) return;
        if (res && res.status >= 200 && res.status < 400) setStatus('ok');
        else setStatus('failed');
      } catch (e) {
        if (cancelled || !mounted.current) return;
        setStatus('failed');
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [url, attempt, timeout]);

  const retry = () => setAttempt((n) => n + 1);

  return { status, retry };
}
