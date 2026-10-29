import { useT } from '../../../i18n';
export function TypingIndicator() {
  const t = useT();

  return (
    <div className="typing" role="status" aria-label={t('phone.typingLabel')}>
      <i />
      <i />
      <i />
    </div>
  );
}
