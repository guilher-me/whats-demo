import { useCallback, useRef, useState } from 'react';
import type { Attachment, AttachmentKind } from '../../../core/types';

interface Session {
  kind: AttachmentKind;
  items: Attachment[];
  view: 'closed' | 'menu' | 'items' | 'preview';
  selected?: Attachment;
  caption: string;
}

export function useAttachmentPlayback() {
  const current = useRef<Session | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const set = useCallback((next: Session | null) => {
    current.current = next;
    setSession(next);
  }, []);
  const update = (change: Partial<Session>) => {
    if (current.current) set({ ...current.current, ...change });
  };

  return {
    current,
    session,
    set,
    open: () => update({ view: 'menu' }),
    showItems: () => update({ view: 'items' }),
    select: (id: string) => {
      const selected = current.current?.items.find((item) => item.id === id);
      if (selected) update({ selected, view: 'preview', caption: '' });
    },
    caption: (caption: string) => update({ caption }),
    close: () => update({ view: 'closed', selected: undefined, caption: '' }),
    back: () =>
      update({
        view: current.current?.view === 'preview' ? 'items' : 'menu',
        selected: undefined,
        caption: '',
      }),
  };
}
