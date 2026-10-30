import { useEffect, useState } from 'react';
import { FALLBACK_AVATAR, trustedAvatar } from '../../core/avatarAssets';
import { sanitizeAvatar } from '../../core/images/sanitize';

/** Shared by editor and phone: untrusted bytes stay out of img.src until rewritten. */
export function SafeAvatar({ value, alt }: { value: string; alt: string }) {
  const [resolved, setResolved] = useState<{ input: string; source: string }>();
  useEffect(() => {
    if (trustedAvatar(value)) return;
    let current = true;
    void sanitizeAvatar(value).then(
      (source) => {
        if (current) setResolved({ input: value, source });
      },
      () => {
        if (current) setResolved({ input: value, source: FALLBACK_AVATAR });
      },
    );
    return () => {
      current = false;
    };
  }, [value]);
  const source =
    resolved?.input === value ? resolved.source : trustedAvatar(value) || FALLBACK_AVATAR;
  return (
    <img
      src={source}
      alt={alt}
      onError={() => setResolved({ input: value, source: FALLBACK_AVATAR })}
    />
  );
}
