# WhatsApp Fake Flows

Editor local de roteiros de WhatsApp com mensagens e WhatsApp Flows. HTML, CSS e JavaScript sem framework ou dependências de execução. Não envia mensagens à Meta.

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

- `index.html`: estrutura do editor e do celular.
- `styles.css`: visual e layout responsivo.
- `app.js`: edição, armazenamento, conversa e reprodução.
- `engine.js`: referências, condições, validações e leitura de Flow JSON.
- `defaults.js`: sequência inicial e os dois Flows de exemplo.
- `share.js`: codificação e leitura dos links de experiência.
- `assets/prevent-senior.png`: imagem inicial do contato, substituível pelo editor.

## Verificação

Com Node.js instalado: `node test-engine.cjs` e `node test-share.cjs`.

## Compartilhar experiências

O link inclui textos, Flows, respostas automáticas, delays, nome, foto e selo do contato. Não inclui respostas digitadas no modo manual nem o ponto atual da reprodução: a experiência abre pronta para iniciar desde o começo. Edições posteriores não alteram um link já copiado.

Para compartilhar com outras pessoas, o app precisa estar disponível em um endereço HTTP/HTTPS que elas possam acessar. Um endereço `file:///` contém a localização do arquivo no seu computador e não disponibiliza os arquivos ao destinatário. `localhost` também se refere ao computador de quem abre o link.

Imagens ficam dentro do link; fotos grandes deixam o endereço longo. Existe um limite de 4 MB para a configuração descomprimida. O navegador oferece compressão nativa; se indisponível, o botão usa JSON em Base64, que gera um link maior. Quem recebe o link pode ler a configuração; Base64 e compressão não são criptografia. Use dados fictícios na demonstração.

Se o navegador impedir acesso à área de transferência, o botão abre uma caixa com o link selecionado para copiar com Ctrl+C.
