import { describe, expect, it } from 'vitest';
import { createShareURL, loadSharedProject, sharedRoute } from '../src/core/codec';
import { commercePreview } from '../src/core/commerce';
import { normalizeProject } from '../src/core/project';
import type { MessageStep, Project } from '../src/core/types';

function journey() {
  return {
    version: 1,
    contact: { name: 'Demo store', verified: false },
    catalog: [
      { sku: 'TV', name: 'Smart TV', description: '', priceCents: 249900 },
      { sku: 'HDMI', name: 'HDMI cable', description: '', priceCents: 3990 },
    ],
    steps: [
      {
        id: 'offer',
        type: 'business',
        text: 'Electronics',
        delay: 0,
        commerce: {
          kind: 'showcase',
          sections: [{ title: 'For your home', skus: ['TV', 'HDMI'] }],
        },
      },
      {
        id: 'cart',
        type: 'user',
        text: '',
        delay: 0,
        commerce: { kind: 'cart', offerId: 'offer', autoItems: [{ sku: 'HDMI', quantity: 2 }] },
      },
      {
        id: 'pix',
        type: 'business',
        text: '',
        delay: 0,
        commerce: { kind: 'pix', amount: { cartId: 'cart' } },
      },
    ],
  } satisfies Project;
}

describe('simulated commerce projects', () => {
  it('round-trips a project through a shared link and previews the configured subtotal', async () => {
    const project = journey();
    const url = await createShareURL(project, 'editor', 'https://example.test/', 'en', 'preview');
    const route = sharedRoute(new URL(url).hash);
    expect(route).toMatchObject({ mode: 'editor', previewOnly: true });
    expect(await loadSharedProject(route!)).toEqual(project);
    expect(commercePreview(project, 2)).toEqual({ kind: 'pix', reference: '003', cents: 7980 });
  });

  it('selects one unit of the first product by default and supports a standalone fixed Pix', () => {
    const project = journey();
    const cart: MessageStep = {
      id: 'cart',
      type: 'user',
      delay: 0,
      text: '',
      commerce: { kind: 'cart', offerId: 'offer' },
    };
    const offer: MessageStep = {
      id: 'offer',
      type: 'business',
      delay: 0,
      text: '',
      commerce: { kind: 'product', sku: 'TV' },
    };
    const pix = project.steps[2];
    expect(commercePreview({ ...project, steps: [offer, cart, pix] }, 2)).toMatchObject({
      kind: 'pix',
      cents: 249900,
    });
    const fixed: MessageStep = { ...pix, commerce: { kind: 'pix', amount: { cents: 12345 } } };
    const standalone = normalizeProject({ ...project, catalog: undefined, steps: [fixed] });
    expect(commercePreview(standalone, 0)).toMatchObject({ kind: 'pix', cents: 12345 });
  });

  it('preserves incomplete drafts and rejects invalid references when loading or sharing', async () => {
    const project = journey();
    project.steps[1].commerce.offerId = 'unavailable';
    expect(normalizeProject(project, { allowDrafts: true })).toEqual(project);
    expect(() => normalizeProject(project)).toThrow('steps[1].commerce');
    await expect(createShareURL(project)).rejects.toThrow('steps[1].commerce');

    const reversed = journey();
    reversed.steps.reverse();
    expect(() => normalizeProject(reversed)).toThrow('steps[0].commerce');
  });

  it('rejects duplicate SKUs, unsafe amounts, invalid quantities and supplied payment details', () => {
    const duplicate = journey();
    duplicate.catalog.push({ ...duplicate.catalog[0] });
    expect(() => normalizeProject(duplicate)).toThrow('catalog[2].sku');
    const price = journey();
    price.catalog[0].priceCents = Number.MAX_SAFE_INTEGER;
    expect(() => normalizeProject(price)).toThrow('catalog[0]');
    const quantity = journey();
    quantity.steps[1].commerce.autoItems![0].quantity = 0;
    expect(() => normalizeProject(quantity)).toThrow('steps[1].commerce');
    const pix = journey();
    Object.assign(pix.steps[2].commerce, { code: '000201' });
    expect(() => normalizeProject(pix)).toThrow('steps[2].commerce');
  });
});
