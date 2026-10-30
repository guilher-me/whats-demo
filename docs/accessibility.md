# Acessibilidade e controles

Os controles de reprodução ficam em um grupo de dois botões na lateral direita do celular. Em repouso: **Iniciar manual** e **Reproduzir automaticamente**. Durante uma execução: **Parar reprodução** e **Reiniciar prévia**. O modo de gravação oculta os controles.

- Botões são elementos nativos, com nomes acessíveis via `aria-label` e relação `aria-controls` com o celular. Tab e Shift+Tab navegam entre eles; Enter e Espaço ativam as ações.
- Tooltips aparecem por hover ou foco, usam `role="tooltip"` e `aria-describedby` e fecham com Esc sem tirar o foco do botão. O componente reutilizável é `TooltipIconButton`.
- O celular é uma região nomeada. O histórico usa `role="log"`, atualização educada e mensagens como artigos nomeados por direção. A prévia de edição não anuncia cada tecla digitada como uma nova mensagem.
- Cada etapa tem nome, identificador `data-step-id` e `aria-current` quando está em edição. As ações da etapa e a criação de componentes têm grupos nomeados.
- Campos usam labels vinculados, e os erros de JSON são associados por `aria-describedby` e `aria-invalid`. Campos obrigatórios do Flow são identificados; grupos usam fieldset e legend.
- A troca de foto usa um botão acessível por teclado; imagens têm texto alternativo. Ícones decorativos são ocultados da árvore de acessibilidade.
- O envio de mensagem usa um formulário nativo com nome acessível. Diálogos compartilhados usam Radix UI para foco e teclado.

Para ferramentas de IA, prefira a API versionada descrita em [automation.md](automation.md). Quando somente a interface estiver disponível, use roles e nomes acessíveis dentro de regiões e etapas, evitando seletores baseados em posição ou ícones visuais.

## Verificação

`tests/accessibility.test.tsx` cobre os dois controles, os tooltips por mouse e teclado e auditorias axe-core do editor, do formulário de Flow e da lista. Os testes existentes também verificam a reprodução manual e automática.

O jsdom não calcula contraste real, geometria ou fontes: contraste e medição de canvas não são avaliados nesses testes. Eles não substituem conferência visual, navegação real por teclado ou testes com leitor de tela, nem representam uma certificação WCAG.
