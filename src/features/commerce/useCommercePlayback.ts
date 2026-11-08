import { useCallback, useEffect, useRef, useState } from 'react';
import { MAX_CART_QUANTITY, orderLines } from '../../core/commerce';
import type { CartItem, CommerceMessage, OrderLine } from '../../core/types';

type Offer = Extract<CommerceMessage, { kind: 'offer' }>;
type Shopping = {
  kind: 'shopping';
  messageId: string;
  offer: Offer;
  view: 'closed' | 'offer' | 'product' | 'cart';
  sku?: string;
  items: CartItem[];
  submit?: (lines: OrderLine[]) => void;
};
type Payment = {
  kind: 'payment';
  messageId: string;
  finish: () => void;
};

export function useCommercePlayback() {
  const [session, update] = useState<Shopping | Payment | null>(null);
  const current = useRef(session);
  const [copyNotice, setCopyNotice] = useState(0);
  useEffect(() => {
    if (!copyNotice) return;
    const timeout = setTimeout(() => setCopyNotice(0), 2000);
    return () => clearTimeout(timeout);
  }, [copyNotice]);
  const set = useCallback((value: typeof session) => {
    current.current = value;
    update(value);
  }, []);
  const reset = useCallback(() => {
    set(null);
    setCopyNotice(0);
  }, [set]);
  const startCart = (messageId: string, offer: Offer, submit?: Shopping['submit']) =>
    set({ kind: 'shopping', messageId, offer, view: 'closed', items: [], submit });
  const startPix = (messageId: string, finish: () => void) =>
    set({ kind: 'payment', messageId, finish });
  const openOffer = (id: string, offer: Offer, browse: boolean) => {
    const active = current.current;
    const first = offer.single ? offer.sections[0]?.products[0] : undefined;
    const destination = first
      ? { view: 'product' as const, sku: first.sku }
      : { view: 'offer' as const };
    if (active?.kind === 'shopping' && active.messageId === id) {
      set({ ...active, ...destination });
    } else if (!active && browse) {
      set({ kind: 'shopping', messageId: id, offer, ...destination, items: [] });
    }
  };
  const select = (sku: string) => {
    const active = current.current;
    if (active?.kind !== 'shopping' || active.view !== 'offer') return;
    set({ ...active, view: 'product', sku });
  };
  const quantity = (sku: string, value: number, view?: Shopping['view']) => {
    const active = current.current;
    if (
      active?.kind !== 'shopping' ||
      !active.submit ||
      !Number.isInteger(value) ||
      value < 0 ||
      value > MAX_CART_QUANTITY
    )
      return;
    const index = active.items.findIndex((item) => item.sku === sku);
    const items = [...active.items];
    if (value === 0) {
      if (index !== -1) items.splice(index, 1);
    } else if (index === -1) {
      items.push({ sku, quantity: value });
    } else {
      items[index] = { sku, quantity: value };
    }
    set({ ...active, items, view: view ?? active.view });
  };
  const add = () => {
    const active = current.current;
    if (active?.kind !== 'shopping' || !active.sku || !active.submit) return;
    const count = active.items.find(({ sku }) => sku === active.sku)?.quantity ?? 0;
    quantity(active.sku, count + 1, active.offer.single ? 'product' : 'offer');
  };
  const showCart = () => {
    const active = current.current;
    if (active?.kind === 'shopping' && active.submit) set({ ...active, view: 'cart' });
  };
  const back = () => {
    const active = current.current;
    if (active?.kind === 'shopping')
      set({ ...active, view: active.offer.single ? 'product' : 'offer' });
  };
  const close = () => {
    const active = current.current;
    if (active?.kind !== 'shopping') return;
    if (!active.submit) set(null);
    else set({ ...active, view: 'closed' });
  };
  const submit = () => {
    const active = current.current;
    if (active?.kind !== 'shopping' || active.view !== 'cart' || !active.items.length) return;
    const lines = orderLines(
      active.items,
      active.offer.sections.flatMap((group) => group.products),
    );
    if (!lines.length || !active.submit) return;
    set(null);
    active.submit(lines);
  };
  const copyPix = (id: string) => {
    setCopyNotice((notice) => notice + 1);
    const active = current.current;
    if (active?.kind === 'payment' && active.messageId === id) {
      set(null);
      active.finish();
    }
  };
  return {
    session,
    current,
    reset,
    startCart,
    startPix,
    openOffer,
    select,
    add,
    quantity,
    showCart,
    back,
    close,
    submit,
    pixCopied: copyNotice > 0,
    copyPix,
  };
}

export type CommercePlayback = ReturnType<typeof useCommercePlayback>;
