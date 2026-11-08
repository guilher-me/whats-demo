import { useT } from '../../i18n';
import { money, subtotal } from '../../core/commerce';
import type { CommerceMessage, Product } from '../../core/types';
import { AttachmentVisual } from '../conversation/components/AttachmentVisual';
import { ControlIcon } from '../../components/icons/ControlIcon';

export function ProductImage({ product }: { product: Product }) {
  return (
    <AttachmentVisual
      item={{ id: product.sku, kind: 'image', name: product.name, extension: 'jpg' }}
    />
  );
}

export function CommerceCard({ value }: { value: CommerceMessage }) {
  const t = useT();
  if (value.kind === 'offer') {
    const products = value.sections.flatMap((section) => section.products);
    const [first] = products;
    if (!first) return null;
    return (
      <div className="commerce-card">
        <div className="commerce-card-image">
          <ProductImage product={first} />
        </div>
        <strong>{value.single ? first.name : t('commerce.showcase')}</strong>
        <small>
          {value.single
            ? money(first.priceCents)
            : t('commerce.productCount', { v0: products.length })}
        </small>
      </div>
    );
  }
  if (value.kind === 'order') {
    return (
      <div className="commerce-card">
        <strong>{t('commerce.order')}</strong>
        <ul className="commerce-lines">
          {value.lines.map((line) => (
            <li key={line.sku}>
              <span>
                {line.quantity} × {line.name}
              </span>
              <span>{money(line.priceCents * line.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="commerce-total">
          <span>{t('commerce.cartSubtotal')}</span>
          <strong>{money(subtotal(value.lines))}</strong>
        </div>
      </div>
    );
  }
  return (
    <div className="commerce-card commerce-pix">
      <strong>{t('commerce.pix')}</strong>
      <small>{t('commerce.reference', { v0: value.reference })}</small>
      <div className="commerce-total">
        <strong>{money(value.cents)}</strong>
        <small>{t('commerce.pending')}</small>
      </div>
    </div>
  );
}

export function CommerceAction({
  value,
  count,
  enabled,
  onClick,
}: {
  value: CommerceMessage;
  count?: number;
  enabled: boolean;
  onClick?: () => void;
}) {
  const t = useT();
  if (value.kind === 'order') return null;
  const pix = value.kind === 'pix';
  const single = value.kind === 'offer' && value.single;
  return (
    <button
      type="button"
      className="message-action commerce-message-action"
      data-commerce-action
      disabled={!enabled}
      onClick={onClick}
    >
      <ControlIcon name={pix ? 'copy' : 'photo'} />
      {t(pix ? 'commerce.copyPix' : single ? 'commerce.viewProduct' : 'commerce.viewProducts')}
      {!!count && <span className="commerce-count">{count}</span>}
    </button>
  );
}
