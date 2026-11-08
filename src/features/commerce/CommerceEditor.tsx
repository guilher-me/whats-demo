import { useState } from 'react';
import { ProductImage } from './CommerceCards';
import { useT } from '../../i18n';
import { Button } from '../../components/ui/Button';
import { FieldError, TextArea, TextField } from '../../components/ui/Field';
import { FormSection } from '../../components/ui/FormSection';
import { SelectField } from '../../components/ui/SelectField';
import {
  autoCart,
  MAX_CART_QUANTITY,
  MAX_CATALOG_PRODUCTS,
  MAX_PIX_CENTS,
  MAX_PRODUCT_CENTS,
  money,
  offerOf,
  offerSkus,
} from '../../core/commerce';
import type { CommerceStep, Product, Project } from '../../core/types';

export function CatalogEditor({
  project,
  onChange,
  error,
}: {
  project: Project;
  onChange: (catalog: Product[]) => void;
  error: string;
}) {
  const t = useT();
  const [skuError, setSkuError] = useState('');
  const catalog = project.catalog ?? [];
  const update = (index: number, change: Partial<Product>) =>
    onChange(catalog.map((product, at) => (at === index ? { ...product, ...change } : product)));
  return (
    <FormSection
      title={t('commerce.catalog')}
      summary={t('commerce.productCount', { v0: catalog.length })}
    >
      <p>{t('commerce.catalogHelp')}</p>
      {catalog.map((product, index) => {
        const used = project.steps.flatMap((step, at) => {
          const offer = offerOf(step);
          return offer && offerSkus(offer).includes(product.sku) ? [at + 1] : [];
        });
        return (
          <FormSection
            key={product.sku}
            title={product.name || product.sku}
            summary={product.priceCents ? money(product.priceCents) : undefined}
          >
            <div className="commerce-card-image">
              <ProductImage product={product} />
            </div>
            <TextField
              label="SKU"
              defaultValue={product.sku}
              maxLength={48}
              readOnly={!!used.length}
              onBlur={(event) => {
                const next = event.currentTarget.value.trim();
                if (next === product.sku || used.length) return;
                if (
                  !/^[A-Za-z0-9][A-Za-z0-9._-]{0,47}$/.test(next) ||
                  catalog.some(({ sku }) => sku === next)
                ) {
                  event.currentTarget.value = product.sku;
                  setSkuError(t('commerce.skuHelp'));
                  return;
                }
                setSkuError('');
                update(index, { sku: next });
              }}
            />
            <TextField
              label={t('commerce.productName')}
              value={product.name}
              maxLength={100}
              onChange={(event) => update(index, { name: event.currentTarget.value })}
            />
            <TextArea
              label={t('commerce.description')}
              value={product.description}
              maxLength={500}
              onChange={(event) => update(index, { description: event.currentTarget.value })}
            />
            <CentsField
              value={product.priceCents}
              max={MAX_PRODUCT_CENTS}
              onChange={(priceCents) => update(index, { priceCents })}
            />
            {used.length > 0 && <p>{t('commerce.productInUse', { v0: used.join(', ') })}</p>}
            <Button
              variant="ghost"
              disabled={!!used.length}
              onClick={() => onChange(catalog.filter((_, at) => at !== index))}
            >
              {t('commerce.removeProduct')}
            </Button>
          </FormSection>
        );
      })}
      <FieldError>{skuError || error}</FieldError>
      <Button
        disabled={catalog.length >= MAX_CATALOG_PRODUCTS}
        onClick={() => {
          let number = catalog.length + 1;
          while (catalog.some(({ sku }) => sku === 'SKU-' + number)) number++;
          onChange([
            ...catalog,
            {
              sku: 'SKU-' + number,
              name: t('commerce.newProduct', { v0: number }),
              description: '',
              priceCents: 100,
            },
          ]);
        }}
      >
        {t('commerce.addProduct')}
      </Button>
    </FormSection>
  );
}

function CentsField({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (cents: number) => void;
}) {
  const t = useT();
  return (
    <TextField
      type="number"
      label={t('commerce.cents')}
      hint={t('commerce.centsHelp')}
      value={value || ''}
      min={1}
      max={max}
      step={1}
      onChange={(event) => {
        const number = event.currentTarget.valueAsNumber;
        onChange(Number.isInteger(number) && number >= 1 && number <= max ? number : 0);
      }}
    />
  );
}

export function CommerceFields({
  value,
  project,
  index,
  error,
  onChange,
}: {
  value: CommerceStep;
  project: Project;
  index: number;
  error: string;
  onChange: (value: CommerceStep) => void;
}) {
  const t = useT();
  const catalog = project.catalog ?? [];
  const prior = project.steps.slice(0, index);
  const stepOption = ({ id, text }: Project['steps'][number]) => ({
    value: id,
    label:
      '#' +
      (prior.findIndex((step) => step.id === id) + 1) +
      ' · ' +
      (text.trim().slice(0, 70) || t('common.untitled')),
  });
  const productOptions = catalog.map(({ sku, name }) => ({
    value: sku,
    label: (name || t('common.untitled')) + ' · ' + sku,
  }));
  const selectOption = { value: '', label: t('commerce.select') };
  let fields;
  switch (value.kind) {
    case 'product':
      fields = (
        <SelectField
          label={t('commerce.product')}
          options={[selectOption, ...productOptions]}
          value={catalog.some(({ sku }) => sku === value.sku) ? value.sku : ''}
          onValueChange={(sku) => onChange({ ...value, sku })}
        />
      );
      break;
    case 'showcase': {
      const allSkus = offerSkus(value);
      const update = (at: number, section: (typeof value.sections)[number]) =>
        onChange({
          ...value,
          sections: value.sections.map((entry, index) => (index === at ? section : entry)),
        });
      fields = (
        <>
          {value.sections.map((section, at) => (
            <fieldset className="commerce-section" key={at}>
              <legend>{t('commerce.sectionNumber', { v0: at + 1 })}</legend>
              <TextField
                label={t('commerce.sectionName')}
                value={section.title}
                maxLength={100}
                onChange={(event) => update(at, { ...section, title: event.currentTarget.value })}
              />
              <div className="commerce-options">
                {productOptions.map(({ value: sku, label }) => {
                  const checked = section.skus.includes(sku);
                  return (
                    <label key={sku}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!checked && (allSkus.includes(sku) || allSkus.length >= 30)}
                        onChange={(event) =>
                          update(at, {
                            ...section,
                            skus: event.currentTarget.checked
                              ? [...section.skus, sku]
                              : section.skus.filter((entry) => entry !== sku),
                          })
                        }
                      />
                      {label}
                    </label>
                  );
                })}
                {section.skus
                  .filter((sku) => !catalog.some((product) => product.sku === sku))
                  .map((sku) => (
                    <label key={sku}>
                      <input
                        type="checkbox"
                        checked
                        onChange={() =>
                          update(at, {
                            ...section,
                            skus: section.skus.filter((entry) => entry !== sku),
                          })
                        }
                      />
                      {sku}
                    </label>
                  ))}
              </div>
              <Button
                variant="ghost"
                onClick={() =>
                  onChange({
                    ...value,
                    sections: value.sections.filter((_, index) => index !== at),
                  })
                }
              >
                {t('commerce.removeSection')}
              </Button>
            </fieldset>
          ))}
          <Button
            disabled={value.sections.length >= 10}
            onClick={() =>
              onChange({
                ...value,
                sections: [
                  ...value.sections,
                  {
                    title: t('commerce.sectionNumber', { v0: value.sections.length + 1 }),
                    skus: [],
                  },
                ],
              })
            }
          >
            {t('commerce.addSection')}
          </Button>
        </>
      );
      break;
    }
    case 'cart': {
      const offers = prior.filter((step) => !!offerOf(step));
      const offer = offerOf(offers.find(({ id }) => id === value.offerId));
      const skus = offer ? offerSkus(offer) : [];
      const items = offer ? autoCart(offer, value.autoItems) : [];
      fields = (
        <>
          <SelectField
            label={t('commerce.offerStep')}
            options={[selectOption, ...offers.map(stepOption)]}
            value={offer ? value.offerId : ''}
            onValueChange={(offerId) => onChange({ kind: 'cart', offerId })}
          />
          {offer && (
            <FormSection title={t('commerce.autoCart')} summary={t('commerce.autoCartHelp')}>
              {Array.from(new Set([...skus, ...items.map(({ sku }) => sku)])).map((sku) => (
                <TextField
                  key={sku}
                  type="number"
                  min={0}
                  max={MAX_CART_QUANTITY}
                  step={1}
                  label={catalog.find((product) => product.sku === sku)?.name || sku}
                  value={items.find((item) => item.sku === sku)?.quantity ?? 0}
                  onChange={(event) => {
                    const next = event.currentTarget.valueAsNumber || 0;
                    if (!Number.isInteger(next) || next < 0 || next > MAX_CART_QUANTITY) return;
                    const others = items.filter((item) => item.sku !== sku);
                    onChange({
                      ...value,
                      autoItems: next ? [...others, { sku, quantity: next }] : others,
                    });
                  }}
                />
              ))}
              <Button
                variant="ghost"
                disabled={!value.autoItems}
                onClick={() => onChange({ kind: 'cart', offerId: value.offerId })}
              >
                {t('commerce.resetCart')}
              </Button>
            </FormSection>
          )}
        </>
      );
      break;
    }
    case 'pix': {
      const amount = value.amount;
      const carts = prior.filter((step) => step.type === 'user' && step.commerce?.kind === 'cart');
      fields = (
        <>
          <SelectField
            label={t('commerce.pixAmount')}
            value={'cents' in amount ? 'fixed' : 'cart'}
            options={[
              { value: 'fixed', label: t('commerce.fixedAmount') },
              { value: 'cart', label: t('commerce.cartSubtotal') },
            ]}
            onValueChange={(type) =>
              onChange({
                kind: 'pix',
                amount: type === 'fixed' ? { cents: 0 } : { cartId: carts.at(-1)?.id ?? '' },
              })
            }
          />
          {'cents' in amount ? (
            <CentsField
              value={amount.cents}
              max={MAX_PIX_CENTS}
              onChange={(cents) => onChange({ kind: 'pix', amount: { cents } })}
            />
          ) : (
            <SelectField
              label={t('commerce.cartStep')}
              options={[selectOption, ...carts.map(stepOption)]}
              value={carts.some(({ id }) => id === amount.cartId) ? amount.cartId : ''}
              onValueChange={(cartId) => onChange({ kind: 'pix', amount: { cartId } })}
            />
          )}
          <p>{t('commerce.pixHelp')}</p>
        </>
      );
      break;
    }
  }
  return (
    <>
      {fields}
      <FieldError>{error}</FieldError>
    </>
  );
}
