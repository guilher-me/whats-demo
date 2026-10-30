import { useT } from '../../i18n';

/** Keep hosted instructions crawlable and the single-file edition self-contained. */
export function AgentGuideLink() {
  const t = useT();
  const offline = window.location.protocol === 'file:';
  const instructions = document.getElementById('llms-txt')?.textContent ?? '';
  return (
    <a
      className="privacy-link"
      href={
        offline ? `data:text/plain;charset=utf-8,${encodeURIComponent(instructions)}` : './llm.txt'
      }
      download={offline ? 'llm.txt' : undefined}
      target={offline ? undefined : '_blank'}
      rel="help noopener"
      type="text/plain"
      aria-label={t('automation.guideLink')}
    >
      llm.txt
    </a>
  );
}
