import { useT } from '../../i18n';
import { useEffect, useState } from 'react';
import { ControlIcon } from '../../components/icons/ControlIcon';

/** Keep hosted instructions crawlable and the single-file edition self-contained. */
export function AgentGuideLink() {
  const t = useT();
  const [href, setHref] = useState('./llms.txt');
  useEffect(() => {
    if (window.location.protocol !== 'file:') return;
    const instructions = document.getElementById('llms-txt')?.textContent;
    if (!instructions) return;
    const url = URL.createObjectURL(new Blob([instructions], { type: 'text/plain;charset=utf-8' }));
    setHref(url);
    return () => URL.revokeObjectURL(url);
  }, []);
  return (
    <a
      className="privacy-link agent-guide-link"
      href={href}
      target="_blank"
      rel="help noopener"
      type="text/plain"
      aria-label={t('automation.guideLink')}
    >
      llms.txt
      <ControlIcon name="external" width="12" height="12" />
    </a>
  );
}
