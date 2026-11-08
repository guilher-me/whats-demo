import { useEffect, useState } from 'react';

const minuteMs = 60_000;

export function formatPhoneTime(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function usePhoneTime() {
  const [, setMinute] = useState(() => Math.floor(Date.now() / minuteMs));
  useEffect(() => {
    let timer: number;
    const sync = () => {
      const now = Date.now();
      setMinute(Math.floor(now / minuteMs));
      window.clearTimeout(timer);
      timer = window.setTimeout(sync, minuteMs - (now % minuteMs));
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => {
      document.removeEventListener('visibilitychange', sync);
      window.clearTimeout(timer);
    };
  }, []);
  return formatPhoneTime();
}
