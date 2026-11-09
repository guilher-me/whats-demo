export const demoCopy = {
  retail: {
    opening: 'Oi! Quero ver opções para minha casa.',
    collection: 'Para sua casa',
    offer: 'Abra a vitrine, escolha o que você gostou e envie seu carrinho.',
    products: [
      ['Vaso Duna', 'Vaso de cerâmica em tom areia.'],
      ['Almofada Nuvem', 'Almofada macia para o seu sofá.'],
      ['Luminária Lua', 'Luminária de cabeceira com luz quente.'],
    ],
    received:
      'Recebemos seu carrinho. Vamos preparar o Pix com o valor dos produtos que você escolheu.',
    payment: 'Aqui está o Pix simulado do seu pedido.',
    thanks: 'Valeu por experimentar nossa loja! Seu pedido de demonstração foi concluído.',
  },
  dental: {
    opening: 'Oi! Quero agendar uma consulta.',
    invitation: 'Diga o que você precisa e escolha um horário no formulário.',
    open: 'Agendar consulta',
    first: 'Sua consulta',
    name: 'Primeiro nome',
    service: 'Qual atendimento você procura?',
    services: ['Limpeza', 'Avaliação', 'Revisão do aparelho'],
    next: 'Escolher horário',
    second: 'Horários disponíveis',
    time: 'Qual horário funciona para você?',
    times: ['Amanhã às 9h', 'Amanhã às 14h', 'Amanhã às 16h'],
    submit: 'Confirmar agendamento',
    confirmed:
      'Tudo certo, *{{flow.booking.DETAILS.name}}*! Sua consulta foi agendada.\n\n*Atendimento* · {{flow.booking.DETAILS.service}}\n*Horário* · {{flow.booking.SCHEDULE.time ?? "Horário a confirmar"}}',
  },
  repair: {
    opening: 'Hi! I need to get my phone repaired.',
    prompt: 'Hi! Tell us what happened to your phone and we’ll help with the next step.',
    open: 'Choose an issue',
    section: 'Phone repair',
    issues: ['Cracked screen', 'Battery issue', 'Phone won’t turn on'],
    request:
      'You chose *{{choice.issue.title}}*. Use the paperclip to send a photo of your phone from the demo gallery.',
    photo: 'Phone photo',
    caption: 'Here’s a photo of my phone.',
    received: 'We got your photo. Bring your phone to the service desk so we can take a look.',
    place: 'iReplace service desk',
    address: '18 Example Lane · Demo Mall, level 1',
    closing: 'Tap the map card to see the service desk details.',
  },
  pet: {
    prompt: 'A ração da Mingau está a caminho. Quer mudar a janela de entrega?',
    windows: ['Hoje, das 14h às 18h', 'Amanhã, 8h–12h'],
    request:
      'Vamos reservar *{{choice.delivery.title}}*. Segure o microfone para deixar uma instrução de entrega.',
    received: 'Obrigada pelo áudio! Já atualizamos a entrega da Mingau.',
    confirmed: 'Nova janela de entrega · *{{choice.delivery.title}}*.',
  },
  banking: {
    opening: '¡Hola! Quiero pedir un estado de cuenta.',
    prompt: 'Elige el período que quieres consultar.',
    periods: ['Últimos 7 días', 'Últimos 30 días'],
    confirmed: 'Prepararemos tu estado de cuenta de ejemplo para *{{choice.period.title}}*.',
    filename: 'Estado de cuenta de ejemplo',
    closing: 'Tu estado de cuenta está listo. Toca el PDF para ver los detalles del archivo.',
  },
};
