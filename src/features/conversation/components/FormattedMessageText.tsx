import type { ReactNode } from 'react';
import { parseMessageFormatting, type MessageSegment } from '../../../core/message-formatting';
const tags = { bold: 'strong', italic: 'em', strike: 's' } as const;
function render(segments: MessageSegment[]): ReactNode {
  return segments.map((segment, index) => {
    if (segment.type === 'text') return segment.text;
    const Tag = tags[segment.type];
    return <Tag key={index}>{render(segment.children)}</Tag>;
  });
}
export function FormattedMessageText({ text }: { text: string }) {
  return <>{render(parseMessageFormatting(text))}</>;
}
