import { useT } from '../../../i18n';
import type { Contact } from '../../../core/types';
import { BusinessAvatar } from '../../../components/ui/BusinessAvatar';
import { Button } from '../../../components/ui/Button';
import { useId } from 'react';
export function FlowFooter({
  contact,
  label,
  disabled,
  error,
  onNext,
}: {
  contact: Contact;
  label: string;
  disabled: boolean;
  error?: string;
  onNext: () => void;
}) {
  const t = useT();

  const errorId = useId();
  return (
    <footer>
      {error && (
        <p className="flow-error" role="alert" id={errorId}>
          {error}
        </p>
      )}
      <Button
        variant="primary"
        data-flow-next
        disabled={disabled}
        onClick={onNext}
        aria-describedby={error ? errorId : undefined}
      >
        {label}
      </Button>
      <small>
        <BusinessAvatar
          icon={contact.icon}
          iconBackground={contact.iconBackground}
          iconForeground={contact.iconForeground}
        />
        <span>
          {t('flow.managed', { v0: contact.name.trim() || t('common.contact') })}{' '}
          <span className="flow-learn-more">{t('flow.learnMore')}</span>
        </span>
      </small>
    </footer>
  );
}
