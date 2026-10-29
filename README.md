# WhatsApp Fake Flows

Editor local de roteiros de WhatsApp com mensagens e WhatsApp Flows. HTML, CSS e JavaScript sem framework ou dependências de execução. Não envia mensagens à Meta.

## Gerar um único HTML

Requer Node.js 18+ e npm apenas no computador de quem gera o arquivo. Execute na raiz:

```sh
npm run build
```

O resultado é `dist/whatsapp-fake-flows.html`. Envie somente esse arquivo para seus pares: eles abrem com dois cliques no navegador, sem Node, npm, instalação ou servidor. CSS, JavaScript e imagem inicial estão incorporados. Não é necessário executar `npm install`: o build não tem dependências externas.

O build contém o editor completo e o roteiro de exemplo definido em `src/defaults.js`. As configurações que alguém editou no navegador continuam no salvamento local ou no link compartilhado; não são lidas pelo comando de build.

Para desenvolvimento, continue usando `index.html`, que carrega os arquivos separados de `src/`. Após alterar os fontes, execute o build novamente para atualizar o HTML de distribuição.

## Usar

Abra `index.html` no navegador. Também é possível servir a pasta com `python3 -m http.server 8080` e abrir `http://localhost:8080`.

- Esquerda: nome/foto do contato, mensagens, ordem das etapas, delays em segundos e indicador de digitando.
- Adicione etapas de cliente, empresa ou Flow. Use as setas para reordenar e o botão de duplicar para reutilizar uma etapa.
- Em cada Flow, abra **JSON do Flow e respostas automáticas**. Cole o Flow JSON e configure um objeto de respostas cujas chaves correspondam aos nomes dos campos. IDs das opções são usados como valores; grupos de checkbox usam listas.
- **Iniciar manual** espera a mensagem do cliente no campo de envio. Abra e preencha os Flows; ao concluir cada um, o roteiro continua.
- **Automático** digita os textos, toca nos componentes com o cursor redondo, preenche as respostas configuradas e navega entre as telas.
- **Só celular** esconde o editor e os controles para gravação. Use Esc para sair.
- **Copiar link** gera um endereço com a configuração completa no fragmento `#project=`, comprimida com deflate e codificada em Base64 URL-safe. Ao abrir o endereço, o roteiro do link tem prioridade sobre a configuração local. Não usa banco de dados ou serviço de links; o conteúdo do fragmento não é enviado nas requisições HTTP. O editor também tenta salvar as configurações no armazenamento local do navegador. Fotos são incorporadas à configuração; limite de 2 MB por imagem.

O exemplo vem com “oi”, identificação, menus, protocolo e mensagem final da atendente. Os balões não têm nomes de remetente. Os dados de exemplo são fictícios. Respostas preenchidas durante a simulação ficam apenas em memória; as respostas automáticas configuradas são parte do projeto exportado e salvo, portanto use dados fictícios nelas.

## Suporte a Flows

Suporta `TextHeading`, `TextSubheading`, `TextBody`, `TextCaption`, `TextInput`, `TextArea`, `DatePicker`, `RadioButtonsGroup`, `CheckboxGroup`, `Dropdown`, `OptIn`, `Footer`, `Form` e `If`. Resolve referências simples `${data.campo}` e `${form.campo}`, payloads de `navigate` e conclusão por `complete`. `If` aceita comparação simples `==`, `!=`, `===`, `!==`, `>`, `<`, `>=`, `<=`.

É um simulador, não o renderizador oficial da Meta: componentes não listados, expressions avançadas, uploads, mídia e `data_exchange` com backend não são implementados. Erros de JSON bloqueiam a reprodução. Ações de backend não suportadas são exibidas como erro no Flow. O editor não altera nem publica Flows oficiais.

## Arquivos

- `index.html`: estrutura do editor e do celular, usada também como template do build.
- `src/styles.css`: visual e layout responsivo.
- `src/ui.js`: criação de campos e elementos da interface.
- `src/profile.js`: nome, selo, foto e compatibilidade da imagem em links antigos.
- `src/app.js`: coordenação do editor, armazenamento, conversa e reprodução dos Flows.
- `src/engine.js`: referências, condições e validações de Flow JSON.
- `src/defaults.js`: sequência inicial e Flows de exemplo.
- `src/share.js`: codificação e leitura dos links de experiência.
- `scripts/build.cjs`: gera o HTML independente sem dependências de terceiros.
- `tests/`: testes do motor, links e build portátil.
- `assets/prevent-senior.png`: imagem inicial, incorporada automaticamente no build.
- `dist/whatsapp-fake-flows.html`: resultado gerado, ignorado pelo Git.
## Verificação

Execute `npm test`. A suíte cobre o motor, a restauração dos links e o HTML independente (scripts válidos, CSS/JS incorporados e imagem sem dependência de arquivo externo).

## Compartilhar experiências

O link inclui textos, Flows, respostas automáticas, delays, nome, foto e selo do contato. Não inclui respostas digitadas no modo manual nem o ponto atual da reprodução: a experiência abre pronta para iniciar desde o começo. Edições posteriores não alteram um link já copiado.

Para compartilhar com outras pessoas, o app precisa estar disponível em um endereço HTTP/HTTPS que elas possam acessar. Um endereço `file:///` contém a localização do arquivo no seu computador e não disponibiliza os arquivos ao destinatário. `localhost` também se refere ao computador de quem abre o link.

Imagens ficam dentro do link; fotos grandes deixam o endereço longo. Existe um limite de 4 MB para a configuração descomprimida. O navegador oferece compressão nativa; se indisponível, o botão usa JSON em Base64, que gera um link maior. Quem recebe o link pode ler a configuração; Base64 e compressão não são criptografia. Use dados fictícios na demonstração.

Se o navegador impedir acesso à área de transferência, o botão abre uma caixa com o link selecionado para copiar com Ctrl+C.
