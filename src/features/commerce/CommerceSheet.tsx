import { useEffect, useRef } from 'react';
import { Button } from '../../components/ui/Button';
import { PhoneSheet } from '../../components/ui/PhoneSheet';
import { MAX_CART_QUANTITY, money, orderLines, subtotal } from '../../core/commerce';
import { useT } from '../../i18n';
import { ProductImage } from './CommerceCards';
import type { CommercePlayback } from './useCommercePlayback';

export function CommerceSheet({
  controls,
  container,
  locked,
  returnFocus,
}: {
  controls: CommercePlayback;
  container: HTMLElement | null;
  locked: boolean;
  returnFocus?: (messageId: string) => void;
}) {
  const t = useT();
  const active = controls.session;
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!locked && active?.view !== 'closed') body.current?.focus();
  }, [active?.view, locked]);
  if (!active || active.view === 'closed') return null;
  const close = () => {
    if (!locked) controls.close();
  };
  const focus = () => returnFocus?.(active.messageId);
  if (active.kind === 'payment') {
    return (
      <PhoneSheet
        container={container}
        title={t('commerce.pix')}
        description={t('commerce.pixHelp')}
        onClose={close}
        onReturnFocus={focus}
        backdrop="dimmed"
        closeLabel={t('common.closeDialog')}
        className="commerce-sheet"
      >
        <div className="commerce-sheet-body" ref={body} tabIndex={-1}>
          <strong role="status">{t('commerce.copySimulated')}</strong>
          <code>{'PIX-DEMO-' + active.pix.reference}</code>
          <p>{t('commerce.pixHelp')}</p>
        </div>
        <footer>
          <Button
            variant="primary"
            data-commerce-continue
            disabled={locked}
            onClick={controls.continueDemo}
          >
            {t('buttons.continue')}
          </Button>
        </footer>
      </PhoneSheet>
    );
  }

  const products = active.offer.sections.flatMap((section) => section.products);
  const product = products.find(({ sku }) => sku === active.sku);
  const lines = orderLines(active.items, products);
  const count = lines.reduce((total, line) => total + line.quantity, 0);
  const isProduct = active.view === 'product' && product;
  const isCart = active.view === 'cart';
  const title = isProduct ? product.name : t(isCart ? 'commerce.cartTitle' : 'commerce.showcase');
  return (
    <PhoneSheet
      container={container}
      title={title}
      description={t('commerce.browseHelp')}
      className="commerce-sheet"
      backdrop="dimmed"
      onClose={close}
      onReturnFocus={focus}
      closeLabel={t('common.closeDialog')}
    >
      <div className="commerce-sheet-body" ref={body} tabIndex={-1}>
        {((isProduct && !active.offer.single) || isCart) && (
          <Button variant="ghost" data-commerce-back disabled={locked} onClick={controls.back}>
            {t(active.offer.single ? 'commerce.viewProduct' : 'commerce.backToOffer')}
          </Button>
        )}
        {isProduct ? (
          <div className="commerce-product">
            <div className="commerce-detail-image">
              <ProductImage product={product} />
            </div>
            <strong>{money(product.priceCents)}</strong>
            <p>{product.description}</p>
          </div>
        ) : isCart ? (
          <>
            {!lines.length && <p>{t('commerce.emptyCart')}</p>}
            <ul className="commerce-lines">
              {lines.map((line) => (
                <li key={line.sku} className="commerce-cart-line">
                  <label>
                    {line.name}
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={MAX_CART_QUANTITY}
                      step={1}
                      aria-label={t('commerce.quantity', { v0: line.name })}
                      data-commerce-quantity={line.sku}
                      disabled={locked}
                      value={line.quantity}
                      onChange={(event) =>
                        controls.quantity(line.sku, event.currentTarget.valueAsNumber)
                      }
                    />
                  </label>
                  <span>{money(line.priceCents * line.quantity)}</span>
                  <Button
                    variant="ghost"
                    disabled={locked}
                    onClick={() => controls.quantity(line.sku, 0)}
                    aria-label={t('commerce.removeLine', { v0: line.name })}
                  >
                    ×
                  </Button>
                </li>
              ))}
            </ul>
            <div className="commerce-total">
              <span>{t('commerce.cartSubtotal')}</span>
              <strong>{money(subtotal(lines))}</strong>
            </div>
          </>
        ) : (
          active.offer.sections.map((section, index) => (
            <section key={index}>
              {section.title && <h4>{section.title}</h4>}
              {section.products.map((item) => (
                <button
                  type="button"
                  className="commerce-product-row"
                  key={item.sku}
                  data-commerce-product={item.sku}
                  disabled={locked}
                  onClick={() => controls.select(item.sku)}
                >
                  <span className="commerce-thumb">
                    <ProductImage product={item} />
                  </span>
                  <span>
                    <strong>{item.name}</strong>
                    <small>{money(item.priceCents)}</small>
                  </span>
                </button>
              ))}
            </section>
          ))
        )}
      </div>
      {active.submit && (
        <footer>
          {isProduct && (
            <Button
              variant="primary"
              data-commerce-add
              disabled={
                locked ||
                (lines.find(({ sku }) => sku === product.sku)?.quantity ?? 0) >= MAX_CART_QUANTITY
              }
              onClick={controls.add}
            >
              {t('commerce.addToCart')}
            </Button>
          )}
          {isCart ? (
            <Button
              variant="primary"
              data-commerce-send
              disabled={locked || !count}
              onClick={controls.submit}
            >
              {t('commerce.cart')}
            </Button>
          ) : (
            <Button data-commerce-review disabled={locked || !count} onClick={controls.showCart}>
              {t('commerce.viewCart', { v0: count })}
            </Button>
          )}
        </footer>
      )}
    </PhoneSheet>
  );
}
