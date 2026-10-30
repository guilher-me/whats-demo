# Mensagens da empresa

## Formatos implementados

| Formato | Editor                                                                  | Prévia                              |
| ------- | ----------------------------------------------------------------------- | ----------------------------------- |
| Texto   | Texto da mensagem                                                       | Balão comum                         |
| Botões  | Respostas rápidas, URL, telefone, copiar código e chamada pelo WhatsApp | Botões e ações dentro do celular    |
| Lista   | Seções, títulos e descrições; até 10 opções no total                    | Convite que abre a lista no celular |
| Flow    | Definição JSON e respostas automáticas                                  | Formulário com navegação            |

Respostas rápidas e listas aguardam uma escolha e geram um balão do cliente. Botões de ação abrem uma demonstração dentro do celular, sem abrir sites, iniciar chamadas ou alterar a área de transferência. Continuar confirma uma ação; mensagens que também contêm respostas rápidas continuam aguardando uma resposta rápida. No automático, a escolha configurada é usada; por padrão, a primeira resposta rápida tem prioridade sobre ações. O roteiro é linear, sem ramificações por resposta.

O simulador usa cabeçalho de texto e rodapé de até 60 caracteres e corpo de até 1024 caracteres nas mensagens interativas. Vídeo, áudio, documentos, catálogo e carrosséis ficam para futuras contribuições.

## Composição e responsabilidades

| Componente / módulo                        | Responsabilidade                                                |
| ------------------------------------------ | --------------------------------------------------------------- |
| `MessageFrame`                             | Balão, horário e slots de conteúdo e ações                      |
| `MessageBubble`                            | Composição do conteúdo com os metadados da mensagem             |
| `MessageAction`                            | Aparência e comportamento nativo de uma ação                    |
| `ReplyButtons`                             | Botões tipados e abertura de ações/mais opções                  |
| `ListInvitation`                           | Botão que abre a lista                                          |
| `PhoneSheet`                               | Sobreposição dentro do celular, foco e teclado com Radix UI     |
| `ListPicker`                               | Seções, opções e confirmação da lista                           |
| `BusinessMessageActions`                   | Seleção do renderizador de ações por formato                    |
| `BusinessMessageEditor`                    | Formato, texto e metadados opcionais                            |
| `MessageOptionEditor`                      | Campo de título e descrição reutilizado em botões e listas      |
| `ReplyButtonsEditor` / `ListMessageEditor` | Configuração específica de cada formato                         |
| `useMessageInteraction`                    | Espera, seleção e cancelamento de uma resposta                  |
| `animateMessage`                           | Cursor automático sobre os mesmos callbacks da interação manual |
| `core/interactive.ts`                      | Valores iniciais, opções e validação sem React                  |

## Adicionar um formato

1. Adicione uma variante à união `BusinessInteractive`, em `core/types.ts`, com campos próprios. Preserve `interactive` como opcional: sua ausência representa o texto simples dos projetos antigos.
2. Defina valores iniciais e validação em `core/interactive.ts`. Dados vindos do link também passam pela validação; não dependa apenas dos limites dos campos HTML.
3. Crie um editor específico e componha-o em `BusinessMessageEditor`.
4. Crie a prévia utilizando os slots de `MessageFrame` e a ação básica `MessageAction`. Conecte o renderizador em `BusinessMessageActions`.
5. Se houver resposta, reutilize a espera de `useMessageInteraction` e acrescente a interação em `animateMessage`.
6. Teste limites, persistência no link, interação manual, modo automático e cancelamento.

Nenhum novo formato deve quebrar a leitura de projetos sem o campo opcional. As fixtures antigas continuam congeladas e cobertas por testes.

## Referências oficiais

Consulta realizada em 29/10/2026. As páginas atuais da Meta retornaram HTTP 429 nesta consulta; os campos básicos também foram conferidos no site oficial do SDK da Meta, que está arquivado. As referências são a base dos formatos implementados, sem pretensão de reproduzir toda a Cloud API.

- [Mensagens com botões de resposta — Meta](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/interactive-reply-buttons-messages)
- [Mensagens de lista — Meta](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/interactive-list-messages)
- [Ações e limites de botões — SDK oficial](https://whatsapp.github.io/WhatsApp-Nodejs-SDK/api-reference/types/ActionObject/)
- [Títulos e identificadores dos botões — SDK oficial](https://whatsapp.github.io/WhatsApp-Nodejs-SDK/api-reference/types/ButtonObject/)
- [Títulos e descrições das opções — SDK oficial](https://whatsapp.github.io/WhatsApp-Nodejs-SDK/api-reference/types/RowObject/)

## Ordem das opções no editor

Arraste a alça de seis pontos no canto superior direito de um botão ou item de lista para trocar sua posição. As opções de lista são reordenadas dentro da própria seção. Também é possível focar a alça e pressionar Espaço, usar as setas e pressionar Espaço novamente para confirmar; Escape cancela.

`SortableOptions` concentra os sensores, anúncios acessíveis e ordenação com dnd-kit. `MessageOptionEditor` recebe a alça por composição. A alteração preserva identificadores, descrições e a resposta automática escolhida; somente a ordem do array muda. Prévia, reprodução e links compartilhados usam essa mesma ordem, sem mudança no formato dos links.

## Formatação do corpo da mensagem

`FormattedMessageText` renderiza `*negrito*`, `_itálico_` e `~tachado~` usando elementos semânticos `strong`, `em` e `s`. A interpretação fica em `core/message-formatting.ts`, sem React, e permite combinações como `*_texto_*`. O componente é reutilizado pelo balão de cliente, empresa e convite de Flow, tanto na simulação quanto na prévia de edição. A gravação captura o resultado já renderizado.

O texto persistido não é convertido para HTML e não requer nova versão de projeto ou link. A renderização não usa innerHTML: tags digitadas são texto. Pares incompletos, marcadores encostados em espaços e nomes como `nome_do_campo` ficam literais. Quebras de linha são preservadas.

Esta implementação cobre esses três estilos de mensagem; não é um interpretador Markdown genérico. Cabeçalhos, rótulos de botões, opções de lista e o JSON interno do Flow continuam usando suas regras próprias.

[Referência oficial de formatação do WhatsApp](https://faq.whatsapp.com/539178204879377/)

Os indicadores de entrega usam o mesmo SVG de dois sinais: cinza para entregue, azul para visualizada. Na simulação, as mensagens do cliente passam a visualizadas quando a empresa responde. O estado é temporário, exposto em receipt no histórico, e não altera o formato do projeto salvo.

## Button types and contexts

The editor separates **Interactive message** from **Template message**. A template here is a visual simulation, not a submission for Meta approval. Existing v1 links without a context or button type continue to mean interactive quick replies. Typed fields are optional additions to the same schema.

| Type          | Interactive message      | Template message           | Label / payload limits                             |
| ------------- | ------------------------ | -------------------------- | -------------------------------------------------- |
| Quick reply   | 1–3, not mixed with CTAs | Up to 10 in total          | 20 / 25 characters; ID up to 256                   |
| Website URL   | One URL CTA, not mixed   | Up to 2                    | 20 / 25 characters; resolved URL up to 2000        |
| Phone number  | Not offered              | Up to 1                    | Label 25; international number up to 20 characters |
| Copy code     | Not offered              | Up to 1                    | Fixed localized label; code up to 20 characters    |
| WhatsApp call | One call CTA, not mixed  | Supported within the total | Label 20; optional TTL below                       |

Templates have **up to 10 buttons across all types**. Quick replies must form one contiguous group, before or after all other types. Quick–Quick–URL–Phone and URL–Phone–Quick are valid; Quick–URL–Quick and URL–Quick–URL are invalid. The editor preserves invalid intermediate drafts after sorting or changing context and shows an error; playback stays disabled until corrected. It never silently removes buttons to make a new context fit.

For more than three buttons, the phone shows the first two plus **See all options**. The sheet exposes the full set. Manual and automatic playback both support overflow, as do message previews and recordings. Meta says 4+ buttons or mixed quick replies with another type are not displayed by WhatsApp desktop clients; this app intentionally previews a phone.

WhatsApp-call TTL defaults to 10080 minutes. Interactive messages accept 1–43200 minutes; template creation accepts 1440–43200. Meta also allows a send-time template override of 1–43200, which this visual editor does not expose. The official pages do not state an additional template per-type count for voice calls; the simulator enforces the documented total rather than inventing a limit.

The URL field accepts a fully resolved HTTP/HTTPS URL. Credentials, control characters, unsafe schemes and unresolved placeholders are rejected for playback. The 2000-character cap is documented for template URLs and also used as an application bound for interactive URLs. Meta templates additionally support one variable at the URL's end, with a required example and percent-encoded parameter values; enter the final resolved URL in WhatsDemo. Dynamic template rendering is not implemented.

### Specialized buttons

These require their own message families and are not interchangeable with generic replies or CTAs:

- **Flow:** supported by the existing Flow step and JSON editor, not a generic URL action. It opens the configured screens and uses the existing completion/answers behavior.
- **OTP:** authentication templates support copy-code, one-tap and zero-tap experiences. The ordinary promotional Copy code button is not an authentication/OTP implementation. Authentication-specific app signatures and restrictions are outside this simulator.
- **Single-product / catalog buttons:** non-customizable buttons tied to catalog products. Multi-product buttons can show up to 30 products in up to 10 sections. These require catalog/product message components and are not implemented here.
- **Carousel and limited-time-offer templates:** separate template structures with their own restrictions; generic template mode does not claim to validate those families.

### Extending this implementation

Typed definitions live in `core/types.ts`. `core/message-buttons.ts` owns context rules, safe URL parsing, labels and default automatic selection; `core/interactive.ts` validates untrusted shapes and list rules. `MessageButtonFields` adds editor fields through the reusable `MessageOptionEditor` slot. `ReplyButtons`, `MessageButtonIcon` and `ButtonActionSheet` render the same typed actions in all preview modes. `useMessageInteraction` distinguishes replies from actions; `animateMessage` clicks those same accessible components. Keep new types bounded and validated on shared-link imports, including incomplete drafts.

Official references reviewed October 30, 2026:

- [Interactive reply buttons](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/interactive-reply-buttons-messages/)
- [Interactive URL CTA messages](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/interactive-cta-url-messages/)
- [Template components: counts, combinations, labels and specialized buttons](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/components/)
- [WhatsApp call buttons and TTL](https://developers.facebook.com/documentation/business-messaging/whatsapp/calling/call-button-messages-deep-links/)
