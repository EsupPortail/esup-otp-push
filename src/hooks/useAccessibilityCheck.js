import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

export default function useAccessibilityCheck(url, timeout = 5000) {
  const [status, setStatus] = useState('unknown');
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
        await axios.get(url, {
          timeout,
          signal: controller.signal,
          validateStatus: () => true,
        });
        if (cancelled || !mounted.current) return;
        setStatus('ok');
      } catch (e) {
        if (cancelled || !mounted.current) return;
        if (axios.isCancel(e)) return;

        setStatus('ok');
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