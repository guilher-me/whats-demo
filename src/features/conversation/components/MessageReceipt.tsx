import { useT } from '../../../i18n';
import { DeliveredIcon } from '../../../components/icons/WhatsAppIcons';
export function MessageReceipt({ status = 'delivered' }: { status?: 'delivered' | 'read' }) {
  const t = useT();

  return (
    <span
      className={`message-receipt ${status === 'read' ? 'message-receipt--read' : ''}`}
      role="img"
      aria-label={status === 'read' ? t('phone.read') : t('phone.delivered')}
    >
      <DeliveredIcon />
    </span>
  );
}
