import type { BusinessIcon } from '../../core/business-avatar';
import type { MessageStep, Project, Step } from '../../core/types';
import type { Locale } from '../../i18n';
import { demoCopy } from './demo-copy';

function message(id: string, text: string, delay: number): MessageStep {
  return { id, type: 'business', text, delay };
}

function opening(text: string): MessageStep {
  return { id: 'opening', type: 'user', text, delay: 0.5 };
}

function options(ids: string[], titles: string[]) {
  return ids.map((id, index) => ({ id, title: titles[index] }));
}

function demo(
  id: string,
  name: string,
  title: string,
  icon: BusinessIcon,
  iconBackground: string,
  steps: Step[],
  catalog?: Project['catalog'],
) {
  const project: Project = {
    version: 1,
    contact: { name, icon, iconBackground, iconForeground: '#FFFFFF', verified: false },
    steps,
    ...(catalog && { catalog }),
  };
  return { id, title, project };
}

export function demoProjects(locale: Locale) {
  const { retail, dental, repair, pet, banking } = demoCopy[locale];
  const catalog = retail.products.map(([name, description], index) => ({
    sku: ['DUNA', 'NUVEM', 'LUA'][index],
    name,
    description,
    priceCents: [4990, 7990, 12990][index],
  }));

  return [
    demo(
      'magazine-luzia',
      'Magazine Luzia',
      retail.title,
      'sofa',
      '#0086FF',
      [
        opening(retail.opening),
        {
          ...message('showcase', retail.offer, 1.8),
          commerce: {
            kind: 'showcase',
            sections: [{ title: retail.collection, skus: catalog.map(({ sku }) => sku) }],
          },
        },
        {
          id: 'cart',
          type: 'user',
          text: '',
          delay: 0.7,
          commerce: { kind: 'cart', offerId: 'showcase', autoItems: [{ sku: 'LUA', quantity: 1 }] },
        },
        message('received', retail.received, 2.4),
        {
          ...message('pix', retail.payment, 2.5),
          commerce: { kind: 'pix', amount: { cartId: 'cart' } },
        },
        message('thanks', retail.thanks, 2),
      ],
      catalog,
    ),
    demo('odontonext', 'OdontoNext', dental.title, 'tooth', '#003EA6', [
      opening(dental.opening),
      {
        id: 'booking',
        type: 'flow',
        text: dental.invitation,
        delay: 1.8,
        label: dental.open,
        answers: { name: 'Marina', service: 'cleaning', time: 'afternoon' },
        flow: {
          version: '7.3',
          routing_model: { DETAILS: ['SCHEDULE'], SCHEDULE: [] },
          screens: [
            {
              id: 'DETAILS',
              title: dental.first,
              layout: {
                type: 'SingleColumnLayout',
                children: [
                  { type: 'TextInput', name: 'name', label: dental.name, required: true },
                  {
                    type: 'RadioButtonsGroup',
                    name: 'service',
                    label: dental.service,
                    required: true,
                    'data-source': options(['cleaning', 'checkup', 'braces'], dental.services),
                  },
                  {
                    type: 'Footer',
                    label: dental.next,
                    'on-click-action': {
                      name: 'navigate',
                      next: { type: 'screen', name: 'SCHEDULE' },
                      payload: {},
                    },
                  },
                ],
              },
            },
            {
              id: 'SCHEDULE',
              title: dental.second,
              terminal: true,
              layout: {
                type: 'SingleColumnLayout',
                children: [
                  {
                    type: 'RadioButtonsGroup',
                    name: 'time',
                    label: dental.time,
                    required: true,
                    'data-source': options(['morning', 'afternoon', 'late'], dental.times),
                  },
                  {
                    type: 'Footer',
                    label: dental.submit,
                    'on-click-action': { name: 'complete', payload: {} },
                  },
                ],
              },
            },
          ],
        },
      },
      message('confirmed', dental.confirmed, 2.4),
    ]),
    demo('ireplace', 'iReplace', repair.title, 'smartphone', '#1C1C1E', [
      opening(repair.opening),
      {
        ...message('issue', repair.prompt, 1.6),
        interactive: {
          kind: 'list',
          button: repair.open,
          autoReplyId: 'screen',
          sections: [
            { title: repair.section, rows: options(['screen', 'battery', 'power'], repair.issues) },
          ],
        },
      },
      message('request', repair.request, 2.4),
      {
        id: 'photo',
        type: 'user',
        text: '',
        delay: 0.7,
        media: {
          kind: 'image',
          file: { name: repair.photo, extension: 'jpg' },
          caption: repair.caption,
        },
      },
      message('received', repair.received, 2.8),
      {
        ...message('location', '', 2),
        media: { kind: 'location', place: { name: repair.place, address: repair.address } },
      },
      message('closing', repair.closing, 2.2),
    ]),
    demo('catlove', 'CatLove', pet.title, 'paw', '#4E2096', [
      {
        ...message('delivery', pet.prompt, 2),
        interactive: {
          kind: 'buttons',
          context: 'template',
          autoReplyId: 'tomorrow',
          buttons: options(['today', 'tomorrow'], pet.windows),
        },
      },
      message('request', pet.request, 2.8),
      { id: 'voice', type: 'user', text: '', delay: 0.9, voiceDurationSeconds: 3 },
      message('received', pet.received, 3),
      message('confirmed', pet.confirmed, 3),
    ]),
    demo('nubolso', 'NuBolso', banking.title, 'finance', '#820AD1', [
      opening(banking.opening),
      {
        ...message('period', banking.prompt, 2.5),
        interactive: {
          kind: 'buttons',
          autoReplyId: 'month',
          buttons: options(['week', 'month'], banking.periods),
        },
      },
      message('confirmed', banking.confirmed, 3.2),
      {
        ...message('statement', '', 2.7),
        media: {
          kind: 'document',
          file: { name: banking.filename, extension: 'pdf', size: 86, unit: 'KB' },
        },
      },
      message('closing', banking.closing, 2.8),
    ]),
  ];
}
