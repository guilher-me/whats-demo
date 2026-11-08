import { useCallback, useRef, useState } from 'react';
import type { Attachment, AttachmentKind } from '../../../core/types';

interface Session {
  kind: AttachmentKind;
  configuredId: string;
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
      if (!selected || selected.kind === 'location' || current.current?.view !== 'items') return;
      if (selected.kind === 'image')
        update({ selected: current.current.selected?.id === id ? undefined : selected });
      else update({ selected, view: 'preview' });
    },
    reviewPhoto: () => {
      if (current.current?.view === 'items' && current.current.selected?.kind === 'image')
        update({ view: 'preview' });
    },
    caption: (caption: string) => update({ caption }),
    close: () => update({ view: 'closed', selected: undefined, caption: '' }),
    back: () => {
      const session = current.current;
      if (session?.view === 'preview' && session.kind === 'image') update({ view: 'items' });
      else
        update({
          view: session?.view === 'preview' ? 'items' : 'menu',
          selected: undefined,
          caption: '',
        });
    },
  };
}
