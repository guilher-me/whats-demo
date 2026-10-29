type Marker = '*' | '_' | '~';
type Format = 'bold' | 'italic' | 'strike';
export type MessageSegment =
  { type: 'text'; text: string } | { type: Format; children: MessageSegment[] };
const formats: Record<Marker, Format> = { '*': 'bold', _: 'italic', '~': 'strike' };
const isMarker = (value: string): value is Marker =>
  value === '*' || value === '_' || value === '~';
const word = (value: string) => /[\p{L}\p{N}]/u.test(value);
const content = (value: string) => !!value && !/\s/u.test(value);

/** WhatsApp message emphasis only: no HTML, links, Markdown blocks or code execution. */
export function parseMessageFormatting(text: string): MessageSegment[] {
  const closing: Record<Marker, number[]> = { '*': [], _: [], '~': [] };
  for (let i = 0; i < text.length; i++) {
    const marker = text[i];
    if (
      isMarker(marker) &&
      text[i - 1] !== marker &&
      text[i + 1] !== marker &&
      content(text[i - 1]) &&
      !word(text[i + 1] ?? '')
    )
      closing[marker].push(i);
  }
  const nextClosing = (marker: Marker, start: number) => {
    const positions = closing[marker];
    let low = 0,
      high = positions.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (positions[middle] <= start) low = middle + 1;
      else high = middle;
    }
    return positions[low];
  };
  const parse = (start: number, end: number, active: Set<Marker>): MessageSegment[] => {
    const result: MessageSegment[] = [];
    let plain = start,
      index = start;
    while (index < end) {
      const marker = text[index];
      if (
        isMarker(marker) &&
        !active.has(marker) &&
        text[index - 1] !== marker &&
        text[index + 1] !== marker &&
        !word(text[index - 1] ?? '') &&
        content(text[index + 1])
      ) {
        const close = nextClosing(marker, index + 1);
        if (close !== undefined && close < end) {
          if (plain < index) result.push({ type: 'text', text: text.slice(plain, index) });
          result.push({
            type: formats[marker],
            children: parse(index + 1, close, new Set([...active, marker])),
          });
          index = close + 1;
          plain = index;
          continue;
        }
      }
      index++;
    }
    if (plain < end) result.push({ type: 'text', text: text.slice(plain, end) });
    return result;
  };
  return parse(0, text.length, new Set());
}
