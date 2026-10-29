import { DeliveredIcon } from '../../../components/icons/WhatsAppIcons';
export function MessageReceipt({ status = 'delivered' }: { status?: 'delivered' | 'read' }) {
  return (
    <span
      className={`message-receipt ${status === 'read' ? 'message-receipt--read' : ''}`}
      role="img"
      aria-label={status === 'read' ? 'Mensagem visualizada' : 'Mensagem entregue'}
    >
      <DeliveredIcon />
    </span>
  );
}
