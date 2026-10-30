import { useT } from '../../../i18n';
import { buttonLabel, buttonType, safeButtonUrl } from '../../../core/message-buttons';
import type { MessageButton } from '../../../core/types';
import { PhoneSheet } from '../../../components/ui/PhoneSheet';
import { Button } from '../../../components/ui/Button';
import { MessageButtonIcon } from '../../../components/icons/MessageButtonIcon';

/** Actions stay inside the recorded phone. No network requests, clipboard writes or calls. */
export function ButtonActionSheet({
  button,
  container,
  onClose,
  onConfirm,
}: {
  button: MessageButton;
  container: HTMLElement | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useT();
  const type = buttonType(button);
  const detail =
    type === 'url'
      ? safeButtonUrl(button.url ?? '')
      : type === 'phone_number'
        ? button.phoneNumber
        : type === 'copy_code'
          ? button.code
          : t('buttons.callBusiness');
  return (
    <PhoneSheet
      container={container}
      title={t(`buttons.${type}`)}
      description={t('buttons.simulation')}
      onClose={onClose}
      closeLabel={t('common.closeDialog')}
    >
      <div className="button-action-preview">
        <MessageButtonIcon type={type} />
        <strong>{buttonLabel(button)}</strong>
        <p>{detail ?? t('buttons.urlError')}</p>
        <small>{t('buttons.simulation')}</small>
      </div>
      <footer>
        <Button data-confirm-button-action onClick={onConfirm}>
          {t('buttons.continue')}
        </Button>
      </footer>
    </PhoneSheet>
  );
}
