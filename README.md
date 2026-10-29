# WhatsApp Fake Flows

Editor de conversas e WhatsApp Flows para demonstrações, protótipos e gravações. Monte a sequência à esquerda e experimente a conversa no celular à direita, manualmente ou com preenchimento automático e cursor animado.

- Mensagens do usuário, mensagens da empresa e convites para Flows.
- Textos, atrasos, indicador de digitação, nome, foto e selo configuráveis.
- Flows em JSON, navegação entre telas e respostas automáticas.
- Links que carregam a experiência no fragmento da URL, sem banco de dados.
- Build portátil em um único HTML, com JavaScript, CSS e imagem padrão incorporados.

Simulação independente: não envia mensagens nem publica Flows na Meta. O interpretador implementa um subconjunto dos componentes de Flows; componentes não suportados exibem um erro na prévia.

## Desenvolvimento

Requer Node.js 22.12+, 24 ou 26+ e npm.

```sh
npm ci
npm run dev
```

Abra o endereço exibido no terminal, normalmente `http://127.0.0.1:5173`. O servidor recompila ao salvar os arquivos; atualize a página para carregar as mudanças.

## Entregar para pessoas não técnicas

```sh
npm run build
```

Distribua `dist/whatsapp-fake-flows.html`. A pessoa abre o arquivo no navegador sem instalar Node.js e sem servidor. Recursos principais funcionam offline; fotos externas configuradas pelo usuário continuam dependendo da rede. Prefira enviar a foto pelo próprio editor para incorporá-la.

O botão **Copiar link** inclui o projeto na URL. Em uma instalação hospedada, qualquer pessoa com acesso ao endereço pode abrir a experiência. Um link `file://` depende de o HTML estar disponível no mesmo caminho; para compartilhar entre computadores, envie o HTML ou hospede o build em um endereço estável. O conteúdo dos links pode ser lido por quem os recebe; use dados fictícios nas demonstrações.

## Comandos

| Comando                | Função                                    |
| ---------------------- | ----------------------------------------- |
| `npm run dev`          | Servidor local e recompilação             |
| `npm run build`        | Tipos e geração do HTML único             |
| `npm test`             | Testes do motor, links, interface e build |
| `npm run typecheck`    | Verificação de tipos                      |
| `npm run format`       | Formatação com Prettier                   |
| `npm run format:check` | Verificação de formatação                 |

## Organização

Interface em React e TypeScript, diálogos com Radix UI e build com esbuild. O motor e o formato dos projetos não dependem de React.

```text
src/
  app/                 composição da aplicação
  components/
    ui/                botões, campos, checkbox e diálogo
    icons/             SVGs compartilhados
  core/                tipos, validação, expressões, codec e exemplo
  features/
    editor/            perfil e sequência
    conversation/      celular, mensagens e campo de envio
    flows/             sessões, campos e navegação
    playback/          reprodução e cursor automático
    sharing/           geração e cópia do link
  styles/              tokens e estilos por área
scripts/               desenvolvimento, build e comandos
tests/                 testes e fixtures de compatibilidade
```

Consulte [a arquitetura](docs/architecture.md) e [o guia de contribuição](CONTRIBUTING.md). Os projetos continuam na versão 1 e os links anteriores `v1z` e `v1j` permanecem suportados.

## Licença

MIT © 2026 Guilherme Cardoso. Veja [LICENSE](LICENSE). O HTML inclui os avisos de licença das dependências incorporadas. As marcas e imagens demonstrativas pertencem aos respectivos titulares.

## Mensagens com botões e listas

Adicione uma mensagem da **Empresa** e escolha o **Formato da mensagem**:

- **Texto simples**: mantém a mensagem tradicional.
- **Botões de resposta**: de 1 a 3 botões, com até 20 caracteres por título.
- **Lista de opções**: até 10 opções distribuídas em seções, com título e descrição.

Configure cabeçalho, rodapé e a resposta usada no modo automático nas opções adicionais da mensagem. No modo manual, clique no botão ou abra a lista, selecione uma opção e confirme. A seleção aparece como resposta do cliente e libera a próxima etapa. O roteiro continua sendo linear: as respostas não criam ramificações entre etapas.

Os componentes visuais usam composição: `MessageFrame` recebe conteúdo e ações; `MessageAction` é reutilizado em botões de resposta e convites para listas. Veja [como estender as mensagens](docs/messages.md).

## Integração com ferramentas de IA

O projeto inclui `llms.txt` e uma API pública em `window.whatsappFakeFlows` para consultar, validar e carregar jornadas, gerar links e executar a prévia. Veja [o contrato e os exemplos](docs/automation.md).

`npm run build` também gera `dist/llms.txt`, o alias `dist/llm.txt`, `dist/llms-full.txt` e a documentação referenciada. Publique a pasta `dist/` para disponibilizá-los por URL. O HTML único continua independente: as instruções completas ficam embutidas nele e podem ser lidas por `getInstructions()` ou pelo elemento `#llms-txt`.

O arquivo de instruções não conecta um LLM automaticamente. A ferramenta precisa conseguir ler a página e, para utilizar a API, executar JavaScript nela.

## Prévia durante a edição

Clique em uma etapa ou foque um de seus campos para acompanhar a mensagem no celular enquanto edita. Texto, botões, listas e convites de Flow usam os mesmos componentes da conversa. Você pode experimentar as opções e abrir o formulário nessa prévia.

Use **Ver conversa** para retornar ao histórico da simulação. Iniciar a reprodução também retorna à conversa completa. A prévia de edição não adiciona mensagens ao histórico nem executa a sequência.

## Controles e acessibilidade

Os dois controles com ícones ficam à direita do celular: interação manual e reprodução automática. Durante a reprodução, passam a parar e reiniciar. Os tooltips funcionam por mouse e foco de teclado e podem ser fechados com Esc.

A interface usa nomes acessíveis, regiões, labels de campos e mensagens de erro vinculadas. Veja [os recursos de acessibilidade e suas verificações](docs/accessibility.md).

## Gravar vídeo

Use o botão **Gravar celular** na lateral da prévia. Escolha o modo manual ou automático, aguarde os 3 segundos e acompanhe o contador. No modo manual, finalize pelo botão; no automático, o vídeo termina 2 segundos após a última mensagem.

O resultado pode ser assistido e baixado como MP4 quando suportado, ou WebM. Apenas o celular é gravado, sem áudio, editor ou controles, em 720 × 1280. Tudo acontece localmente, com as bibliotecas incluídas no HTML único. Mantenha a aba visível durante a gravação.

Veja [como funciona a gravação e seus limites](docs/recording.md).

## Formatação das mensagens

Os corpos das mensagens de cliente, empresa e convites de Flow aceitam a sintaxe do WhatsApp:

- `*texto*` para **negrito**.
- `_texto_` para _itálico_.
- `~texto~` para tachado.

Os estilos podem ser combinados, por exemplo `*_negrito e itálico_*`. A prévia, a reprodução e os vídeos usam a mesma renderização. Os marcadores ficam preservados no editor, no projeto e no link compartilhado. Textos sem fechamento válido permanecem literais; HTML não é interpretado.

## Adicionar etapas

A área **Adicionar à conversa** permanece no rodapé do editor enquanto a lista rola. Novas etapas entram no final; o campo de texto recebe foco e o editor rola suavemente até a etapa quando necessário. A preferência de movimento reduzido do sistema é respeitada.
