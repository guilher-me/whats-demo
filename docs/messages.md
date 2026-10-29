# Mensagens da empresa

## Formatos implementados

| Formato            | Editor                                               | Prévia                              |
| ------------------ | ---------------------------------------------------- | ----------------------------------- |
| Texto              | Texto da mensagem                                    | Balão comum                         |
| Botões de resposta | Até 3 títulos, cabeçalho e rodapé opcionais          | Botões abaixo do texto              |
| Lista              | Seções, títulos e descrições; até 10 opções no total | Convite que abre a lista no celular |
| Flow               | Definição JSON e respostas automáticas               | Formulário com navegação            |

Uma mensagem interativa espera uma resposta antes de liberar a próxima etapa. Essa seleção gera um balão do cliente. No modo automático, a opção configurada é utilizada; quando não há configuração, é escolhida a primeira opção. O roteiro é linear, sem ramificações por resposta.

O simulador usa cabeçalho de texto e rodapé de até 60 caracteres e corpo de até 1024 caracteres nas mensagens interativas. Vídeo, áudio, documentos, catálogo, carrosséis e botões de URL ficam para futuras contribuições.

## Composição e responsabilidades

| Componente / módulo                        | Responsabilidade                                                |
| ------------------------------------------ | --------------------------------------------------------------- |
| `MessageFrame`                             | Balão, horário e slots de conteúdo e ações                      |
| `MessageBubble`                            | Composição do conteúdo com os metadados da mensagem             |
| `MessageAction`                            | Aparência e comportamento nativo de uma ação                    |
| `ReplyButtons`                             | Conjunto de respostas rápidas                                   |
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
