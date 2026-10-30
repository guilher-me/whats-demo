import { useCallback, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { deferred } from '../../../core/async';
import { isReplyButton } from '../../../core/message-buttons';
import { messageOptions } from '../../../core/interactive';
import type { BusinessInteractive, ListMessage, MessageOption } from '../../../core/types';
interface Pending {
  id: string;
  message: BusinessInteractive;
  finish: () => void;
  signal: AbortSignal;
}

/** One explicit reply per scripted message; typing into the composer cannot consume it. */
export function useMessageInteraction(
  onReply: (messageId: string, option: MessageOption, isResponse: boolean) => void,
) {
  const pending = useRef<Pending | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [list, setList] = useState<{ id: string; message: ListMessage } | null>(null);
  const [selection, setSelection] = useState('');
  const selectionRef = useRef('');
  const reset = useCallback(() => {
    pending.current = null;
    setPendingId(null);
    setList(null);
    setSelection('');
    selectionRef.current = '';
  }, []);
  const wait = (id: string, message: BusinessInteractive, signal: AbortSignal) => {
    const response = deferred(signal);
    pending.current = { id, message, finish: response.finish, signal };
    flushSync(() => setPendingId(id));
    return response.promise;
  };
  const reply = (id: string, optionId: string) => {
    const current = pending.current;
    if (!current || current.id !== id || current.signal.aborted) return;
    const option = messageOptions(current.message).find((o) => o.id === optionId);
    if (!option) return;
    onReply(id, option, current.message.kind === 'list' || isReplyButton(option));
    if (
      current.message.kind === 'buttons' &&
      !isReplyButton(option) &&
      current.message.buttons.some(isReplyButton)
    )
      return;
    pending.current = null;
    setPendingId(null);
    setList(null);
    setSelection('');
    selectionRef.current = '';
    current.finish();
  };
  const open = (id: string) => {
    const current = pending.current;
    if (current?.id !== id || current.message.kind !== 'list' || current.signal.aborted) return;
    const message = current.message;
    selectionRef.current = '';
    flushSync(() => {
      setSelection('');
      setList({ id, message });
    });
  };
  const select = (id: string) => {
    selectionRef.current = id;
    setSelection(id);
  };
  const confirm = () => {
    const current = pending.current;
    if (current?.message.kind === 'list') reply(current.id, selectionRef.current);
  };
  return {
    pendingId,
    list,
    selection,
    wait,
    reply,
    open,
    select,
    confirm,
    close: () => setList(null),
    reset,
  };
}
