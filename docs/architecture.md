# Arquitetura

## Fronteiras

`app/App.tsx` conecta editor, compartilhamento e reprodução. O estado do editor representa o projeto, e a reprodução mantém uma sessão separada.

`core/types.ts` descreve o contrato persistido. `core/project.ts` normaliza dados e cria etapas. `core/engine.ts` resolve referências e condições, valida projetos e campos e lista componentes visíveis. Essas funções podem ser reutilizadas sem React.

`features/flows/model.ts` cria e avança sessões sem depender da interface. `useFlowSession` conecta o modelo ao React. `FlowSheet`, `FlowField`, `OptionGroup` e `FlowFooter` compõem a tela. Os seletores permanecem à direita das opções.

`usePlayback` executa mensagens e Flows na ordem do projeto. Cada execução tem um `AbortController`: parar ou reiniciar cancela atrasos, digitação e esperas pendentes. A sessão usa uma referência atualizada para que o preenchimento automático leia os valores recentes. A abertura e a navegação confirmam a renderização antes de o cursor procurar o próximo controle.

`useCursor` cuida da posição do cursor e da animação. Valores são alterados pelos mesmos callbacks usados na interação manual. A busca no DOM fica restrita ao celular e usa atributos `data-*` dos controles.

`features/conversation` reúne os componentes visuais da conversa; `features/editor` reúne a configuração e o salvamento local. Campos JSON mantêm um rascunho textual independente: uma edição inválida não substitui a definição válida, e bloqueia reprodução e compartilhamento até a correção.

## Componentes reutilizáveis

`Button`, `IconButton`, `TextField`, `TextArea`, `Checkbox` e `Dialog` oferecem contratos pequenos por props. O diálogo usa Radix UI para foco, teclado e semântica. Os ícones ficam centralizados em `components/icons`.

Estilos globais e tokens ficam em `styles/base.css` e `styles/tokens.css`. Editor, conversa e Flows têm folhas próprias. Prefira classes e amplie os tokens quando houver uma variação compartilhada.

## Persistência e evolução

O editor usa a chave `whatsapp-fake-flows-v1` do localStorage. O projeto permanece com `version: 1`; a migração da interface para React não muda esse contrato.

O codec de `core/codec.ts` preserva `#project=v1z...` (JSON UTF-8 comprimido com deflate e base64url) e `#project=v1j...` (JSON UTF-8 e base64url). Compressão usa a API nativa do navegador; a alternativa sem compressão mantém o compartilhamento disponível. Há limites de tamanho e validação antes de carregar dados.

As fixtures em `tests/fixtures` foram criadas com o formato anterior à migração. Não as regenere a cada alteração: elas demonstram que links salvos continuam legíveis.

Para futuras mudanças:

1. Campos opcionais novos devem ter um valor padrão na normalização.
2. Mantenha o significado dos campos antigos; não reutilize nomes para outro comportamento.
3. Se o contrato mudar de forma incompatível, crie a versão seguinte e uma função de migração pura. Preserve os decodificadores antigos, migre após decodificar e valide o resultado.
4. Teste fixtures de cada versão até o modelo atual. Versões futuras desconhecidas devem gerar um erro compreensível.

A URL também depende de um endereço de hospedagem estável. Preservar o codec não torna um link local acessível em outro computador.

## Salvamento local e compartilhamento

`useProject` expõe um estado de persistência explícito: `example`, `recovered`, `saving`, `saved`, `failed` ou `shared`. O exemplo inicial não é anunciado como salvo; `recovered` requer um projeto local válido, e `saved` só é confirmado após `localStorage.setItem` concluir. Um link carregado é identificado separadamente e só passa a rascunho local após uma edição. Falhas mantêm as alterações em memória.

`SaveIndicator`, junto de Sequência, apresenta esse estado com ajuda por hover ou foco e fechamento por Escape. Uma falha também produz um alerta no rodapé fixo do editor, mesmo quando o usuário está no fim da lista. O cabeçalho contém a ação independente Copiar link da experiência, que cria um retrato compartilhável da jornada. Os textos usam os três catálogos de tradução; o formato dos projetos e links permanece igual.

## Build portátil

`scripts/build.cjs` usa esbuild para agrupar React, código, CSS e imagem padrão. O resultado substitui os pontos de inserção de `index.html` e inclui as licenças em `dist/whatsapp-fake-flows.html`. Não há dependências carregadas por CDN. O arquivo pode ser aberto diretamente e continua sendo a entrega para usuários não técnicos.

Os testes cobrem motor, compatibilidade dos links, reprodução manual/automática, cancelamento e estrutura do build. O CI executa tipos, formatação, testes e build.

## Mensagens interativas

`MessageFrame` compõe corpo, metadados e ações sem conhecer o tipo de interação. `BusinessMessageActions` conecta os renderizadores; os editores ficam separados por formato. `useMessageInteraction` mantém a espera de resposta independente do motor dos Flows, cancela ao parar e impede respostas duplicadas. `animateMessage` usa os mesmos callbacks da interação manual.

A extensão é um campo opcional `interactive` em mensagens da empresa; não altera a versão 1 nem o significado dos campos antigos. Links antigos sem esse campo continuam sendo mensagens de texto. Veja [o guia de extensão](messages.md).
