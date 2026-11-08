# Gravação do celular

O botão **Gravar celular**, à direita da prévia, gera um vídeo local sem áudio. O arquivo mostra a carcaça com câmera e botões laterais, a barra de status e o conteúdo da tela, incluindo o cursor animado do modo automático. O editor, o cronômetro e os controles ficam fora do vídeo. O cursor do sistema não é capturado.

## Uso

A gravação automática usa o ritmo de usuário selecionado ao lado dos controles de reprodução: leitura, digitação e cliques. Os delays da empresa e as transições do sistema não são acelerados. Escolha entre 0,5× e 3× antes de gravar; o controle fica bloqueado durante a captura. A contagem inicial de 3 segundos, o cronômetro e os 2 segundos finais continuam usando tempo real. A gravação manual mantém os tempos originais.

1. Clique em **Gravar celular**.
2. Se precisar do aparelho recortado para uma apresentação, marque **Cantos transparentes (WebM)**. Escolha **Gravar manualmente** ou **Gravar automaticamente**.
3. Aguarde a preparação e a contagem de 3 segundos. A jornada começa do início.
4. No modo manual, interaja com o celular e clique em **Finalizar gravação**. A gravação continua mesmo que a jornada já tenha terminado.
5. No modo automático, a gravação termina 2 segundos depois da última mensagem. É possível finalizar antes pelo mesmo botão.
6. Na prévia do resultado, escolha **Baixar vídeo**, **Gravar novamente** ou **Descartar**. Fechar o diálogo também descarta a cópia mantida em memória; o arquivo já baixado permanece no computador.

Durante a preparação e a contagem, o botão permite cancelar sem gerar um arquivo. O contador usa minutos e segundos. A edição e os controles de reprodução ficam bloqueados enquanto há uma gravação, para preservar a jornada e o elemento capturado.

## Formato e compatibilidade

O aplicativo testa os codificadores nativos e tenta MP4 primeiro; caso não esteja disponível, usa WebM. A extensão do download corresponde ao formato efetivamente produzido. Para WebM, `fix-webm-duration` adiciona a duração ausente quando necessário.

A opção de cantos transparentes grava em WebM com VP8 e verifica se o arquivo preserva o canal alfa. O aplicativo de apresentações precisa reproduzir o WebM com transparência para mostrar o fundo do slide nos cantos. A prévia usa um quadriculado para destacar as áreas transparentes. [Transparência em WebM no Chromium](https://developer.chrome.com/blog/alpha-transparency-in-chrome-video)

O celular é mantido em 360 × 720 pixels durante a gravação, e os quadros são gerados em 720 × 1440. A captura busca 30 quadros por segundo. O cursor automático é desenhado sobre o quadro mais recente usando sua posição na tela. O conteúdo do celular é rasterizado separadamente, com até 15 atualizações por segundo quando há mudanças. A rasterização ignora as mensagens fora da área visível e mantém a posição de rolagem. O quadro final permanece na captura até o codificador ter tempo de recebê-lo. A taxa efetiva depende do navegador e do dispositivo.

Mantenha a aba visível durante a gravação. Navegadores podem reduzir a frequência de atualização em segundo plano. A implementação foi verificada em Chromium; navegadores sem as APIs necessárias ou que bloqueiem a rasterização recebem uma mensagem de erro. Chrome e Edge atualizados são os alvos recomendados para a primeira versão.

Não há upload, solicitação de captura de tela, áudio ou backend. `dom-to-image-more` rasteriza apenas o DOM do celular para canvas, e `MediaRecorder` grava esse canvas. As bibliotecas são incorporadas ao HTML único, com suas licenças MIT. Não há CDN ou conversor WebAssembly.

Os vídeos são temporários, mantidos em memória até baixar ou descartar. Eles não entram no projeto, no localStorage ou no link compartilhável. Ao publicar, o HTML continua independente dos demais arquivos do build.

## Organização

- `capture.ts`: rasterização, rolagem, seleções e texto dos campos. Serializa as chamadas porque o renderizador usa caches compartilhados.
- `session.ts`: canvas, escolha do codificador, MediaRecorder, montagem do Blob e encerramento das tracks.
- `useRecording.ts`: ciclo de preparação, contagem, gravação, finalização e descarte; conexão com a reprodução.
- `RecordingControls`: botão acessível, contador e estado anunciado.
- `RecordingDialogs`: escolha de modo, resultado com vídeo e download, erros.

O componente não altera o formato persistido do projeto. A API pública continua disponível para leitura e criação de links; operações que alteram a jornada ou a reprodução são rejeitadas durante a gravação.

## Testes

Há testes de fallback MP4/WebM, duração, captura de estados de campos, cancelamento durante preparação e contagem, descarte de URLs, cleanup ao desmontar, bloqueio da edição, download e acessibilidade do diálogo. O teste real no navegador validou gravação manual, automática, download de MP4 e a jornada completa com os dois Flows.

Referências:

- [dom-to-image-more](https://github.com/IDisposable/dom-to-image-more)
- [fix-webm-duration](https://github.com/yusitnikov/fix-webm-duration)
- [Canvas captureStream](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream)
- [MediaRecorder.isTypeSupported](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static)
