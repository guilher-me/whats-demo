import { currentLocale, t } from '../i18n';
import type {
  CartItem,
  CommerceMessage,
  OfferStep,
  OrderLine,
  Product,
  Project,
  Step,
} from './types';

export const MAX_CART_QUANTITY = 99;
export const MAX_PRODUCT_CENTS = 999_999_999;
export const MAX_PIX_CENTS = 30 * MAX_CART_QUANTITY * MAX_PRODUCT_CENTS;
export const MAX_CATALOG_PRODUCTS = 200;

export const money = (cents: number) =>
  new Intl.NumberFormat(currentLocale(), { style: 'currency', currency: 'BRL' }).format(
    cents / 100,
  );

export const subtotal = (lines: OrderLine[]) =>
  lines.reduce((total, line) => total + line.priceCents * line.quantity, 0);

export const offerOf = (step?: Step): OfferStep | undefined => {
  if (step?.type !== 'business') return;
  const value = step.commerce;
  return value?.kind === 'product' || value?.kind === 'showcase' ? value : undefined;
};

export const offerSkus = (offer: OfferStep) =>
  offer.kind === 'product' ? [offer.sku] : offer.sections.flatMap((section) => section.skus);

export function offerMessage(
  offer: OfferStep,
  catalog: Product[],
): Extract<CommerceMessage, { kind: 'offer' }> {
  const sections = offer.kind === 'product' ? [{ title: '', skus: [offer.sku] }] : offer.sections;
  const products = new Map(catalog.map((product) => [product.sku, product]));
  return {
    kind: 'offer',
    single: offer.kind === 'product',
    sections: sections.map(({ title, skus }) => ({
      title,
      products: skus.flatMap((sku) => {
        const product = products.get(sku);
        return product ? [product] : [];
      }),
    })),
  };
}

export function autoCart(offer: OfferStep, items?: CartItem[]): CartItem[] {
  const [first] = offerSkus(offer);
  return items ?? (first ? [{ sku: first, quantity: 1 }] : []);
}

export function orderLines(items: CartItem[], products: Product[]): OrderLine[] {
  return items.flatMap(({ sku, quantity }) => {
    const product = products.find((entry) => entry.sku === sku);
    return product ? [{ ...product, quantity }] : [];
  });
}

export function commercePreview(project: Project, index: number): CommerceMessage | undefined {
  const step = project.steps[index];
  if (!step || step.type === 'flow' || !step.commerce) return;
  const value = step.commerce;
  const catalog = project.catalog ?? [];
  if (value.kind === 'product' || value.kind === 'showcase') return offerMessage(value, catalog);
  if (value.kind === 'cart') {
    const offer = offerOf(project.steps.slice(0, index).find(({ id }) => id === value.offerId));
    return {
      kind: 'order',
      lines: offer ? orderLines(autoCart(offer, value.autoItems), catalog) : [],
    };
  }
  const amount = value.amount;
  if ('cents' in amount) return pixMessage(index, amount.cents);
  const cartIndex = project.steps.findIndex(({ id }) => id === amount.cartId);
  const cart = project.steps[cartIndex];
  const order =
    cartIndex < index && cart?.type === 'user' && cart.commerce?.kind === 'cart'
      ? commercePreview(project, cartIndex)
      : undefined;
  return pixMessage(index, order?.kind === 'order' ? subtotal(order.lines) : 0);
}

export const pixMessage = (
  index: number,
  cents: number,
): Extract<CommerceMessage, { kind: 'pix' }> => ({
  kind: 'pix',
  cents,
  reference: String(index + 1).padStart(3, '0'),
});

const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const integer = (value: unknown, max: number) =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= max;
const string = (value: unknown, max: number) => typeof value === 'string' && value.length <= max;
const exact = (value: Record<string, unknown>, keys: string[]) =>
  Object.keys(value).every((key) => keys.includes(key));

export function catalogError(catalog: unknown, allowDrafts: boolean): string {
  if (catalog === undefined) return '';
  if (!Array.isArray(catalog) || catalog.length > MAX_CATALOG_PRODUCTS)
    return 'catalog · ' + t('commerce.invalidProduct');
  const skus = new Set<string>();
  for (const [index, product] of catalog.entries()) {
    const path = 'catalog[' + index + ']';
    if (
      !object(product) ||
      !exact(product, ['sku', 'name', 'description', 'priceCents']) ||
      typeof product.sku !== 'string' ||
      !/^[A-Za-z0-9][A-Za-z0-9._-]{0,47}$/.test(product.sku) ||
      !string(product.name, 100) ||
      !string(product.description, 500) ||
      !(
        integer(product.priceCents, MAX_PRODUCT_CENTS) ||
        (allowDrafts && product.priceCents === 0)
      ) ||
      (!allowDrafts && !(product.name as string).trim())
    )
      return path + ' · ' + t('commerce.invalidProduct');
    if (skus.has(product.sku)) return path + '.sku · ' + t('commerce.duplicateSku');
    skus.add(product.sku);
  }
  return '';
}

export function commerceStepError(project: Project, index: number, allowDrafts = false): string {
  const step = project.steps[index];
  const value: unknown = (step as Step & { commerce?: unknown }).commerce;
  if (value === undefined) return '';
  const invalid = t('commerce.invalidStep');
  if (
    !object(value) ||
    step.type === 'flow' ||
    step.media !== undefined ||
    step.interactive !== undefined ||
    step.voiceDurationSeconds !== undefined
  )
    return invalid;
  if (step.type === 'user' ? value.kind !== 'cart' : value.kind === 'cart') return invalid;

  const prior = (id: unknown) =>
    project.steps.slice(0, index).find((candidate) => candidate.id === id);
  const validSkus = (skus: unknown[]) =>
    skus.every((sku) => typeof sku === 'string' && sku.length <= 48) &&
    (allowDrafts ||
      (skus.length > 0 &&
        new Set(skus).size === skus.length &&
        skus.every((sku) => project.catalog?.some((product) => product.sku === sku))));

  switch (value.kind) {
    case 'product':
      if (!exact(value, ['kind', 'sku']) || !validSkus([value.sku]))
        return t('commerce.invalidOffer');
      break;
    case 'showcase':
      if (
        !exact(value, ['kind', 'sections']) ||
        !Array.isArray(value.sections) ||
        value.sections.length > 10 ||
        (!allowDrafts && !value.sections.length) ||
        !value.sections.every(
          (section) =>
            object(section) &&
            exact(section, ['title', 'skus']) &&
            string(section.title, 100) &&
            (allowDrafts || (section.title as string).trim()) &&
            Array.isArray(section.skus) &&
            validSkus(section.skus),
        )
      )
        return t('commerce.invalidOffer');
      {
        const skus = (value.sections as { skus: string[] }[]).flatMap((section) => section.skus);
        if (skus.length > 30 || !validSkus(skus)) return t('commerce.invalidOffer');
      }
      break;
    case 'cart': {
      if (!exact(value, ['kind', 'offerId', 'autoItems']) || typeof value.offerId !== 'string')
        return invalid;
      const offer = offerOf(prior(value.offerId));
      if (!allowDrafts && !offer) return t('commerce.invalidCart');
      const items = value.autoItems;
      if (items === undefined) break;
      if (!Array.isArray(items) || items.length > 30 || (!allowDrafts && !items.length))
        return t('commerce.invalidCart');
      const seen = new Set<string>();
      const skus = offer ? offerSkus(offer) : [];
      for (const item of items) {
        if (
          !object(item) ||
          !exact(item, ['sku', 'quantity']) ||
          typeof item.sku !== 'string' ||
          !integer(item.quantity, MAX_CART_QUANTITY) ||
          seen.has(item.sku) ||
          (!allowDrafts && !skus.includes(item.sku))
        )
          return t('commerce.invalidCart');
        seen.add(item.sku);
      }
      break;
    }
    case 'pix': {
      if (!exact(value, ['kind', 'amount']) || !object(value.amount)) return invalid;
      const amount = value.amount;
      if ('cents' in amount) {
        if (
          !exact(amount, ['cents']) ||
          !(integer(amount.cents, MAX_PIX_CENTS) || (allowDrafts && amount.cents === 0))
        )
          return t('commerce.invalidAmount');
      } else {
        if (!exact(amount, ['cartId']) || typeof amount.cartId !== 'string') return invalid;
        const cart = prior(amount.cartId);
        if (!allowDrafts && (cart?.type !== 'user' || cart.commerce?.kind !== 'cart'))
          return t('commerce.invalidAmount');
      }
      break;
    }
    default:
      return invalid;
  }
  return '';
}

export function validateCommerce(project: Project, allowDrafts: boolean) {
  const error = catalogError(project.catalog, allowDrafts);
  if (error) throw new Error(error);
  // Commerce references require IDs that resolve to exactly one step.
  if (project.steps.some((step) => step.type !== 'flow' && step.commerce)) {
    const ids = project.steps.map((step) => step.id);
    if (ids.some((id) => typeof id !== 'string' || !id) || new Set(ids).size !== ids.length)
      throw new Error(t('sharing.stepIds'));
  }
  for (const index of project.steps.keys()) {
    const error = commerceStepError(project, index, allowDrafts);
    if (error) throw new Error('steps[' + index + '].commerce · ' + error);
  }
}
