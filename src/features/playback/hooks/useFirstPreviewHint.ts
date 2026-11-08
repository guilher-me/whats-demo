import { useEffect, useState } from 'react';

const KEY = 'whatsdemo-preview-play-hint-seen';
let seenInMemory = false;

function markFirstVisit() {
  try {
    if (localStorage.getItem(KEY)) return false;
    localStorage.setItem(KEY, '1');
    return true;
  } catch {
    if (seenInMemory) return false;
    seenInMemory = true;
    return true;
  }
}

export function useFirstPreviewHint(enabled: boolean) {
  const [visible, setVisible] = useState(false);
  const dismiss = () => setVisible(false);

  useEffect(() => {
    if (!enabled) setVisible(false);
    else if (markFirstVisit()) setVisible(true);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !visible) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
    };
    window.addEventListener('click', dismiss, true);
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('click', dismiss, true);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [enabled, visible]);

  return { visible: enabled && visible, dismiss };
}
