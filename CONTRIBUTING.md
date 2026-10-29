# Contribuindo

Contribuições para interface, novos componentes de Flows, acessibilidade e documentação são bem-vindas. Descreva o problema e o comportamento esperado em uma issue ou pull request; inclua uma sequência pequena para reproduzir alterações no motor.

## Preparação

Use Node.js 22.12+, 24 ou 26+ e execute `npm ci`, seguido de `npm run dev`. A implementação está em `src/`; o HTML de `dist/` é gerado e não deve ser editado nem versionado.

## Componentes

- Coloque elementos genéricos em `src/components/ui`. Reutilize os componentes existentes antes de criar variações.
- Coloque comportamentos de uma funcionalidade em `src/features/<funcionalidade>`, com componentes e hooks próximos uns dos outros.
- Mantenha regras do motor e o formato persistido em `src/core`, sem dependência de React ou do DOM.
- Componentes recebem dados e callbacks por props. Hooks coordenam estado e efeitos; a busca no DOM fica restrita ao cursor de reprodução.
- Use tipos nas fronteiras, nomes acessíveis, botões nativos e os tokens de `src/styles/tokens.css`.
- Evite misturar uma funcionalidade com uma reorganização ampla de arquivos.

Para adicionar um campo de Flow, atualize a validação em `core/engine.ts`, o renderizador em `features/flows/components/FlowField.tsx` e o preenchimento automático em `features/playback/hooks/usePlayback.ts`. Inclua testes de validação, navegação e reprodução quando o comportamento mudar.

## Links salvos

Não altere o significado dos prefixos `v1z` e `v1j`. Preserve as fixtures antigas e seus testes. Uma alteração incompatível deve criar uma nova versão, com migração explícita. Consulte [a arquitetura](docs/architecture.md).

## Antes de abrir uma pull request

```sh
npm run format
npm run typecheck
npm test
npm run build
```

Confira a interação manual, a reprodução automática e a abertura direta do HTML gerado. Descreva o que mudou, como foi validado e eventuais limitações. Para mudanças visuais, inclua uma captura; use dados fictícios.

## Traduções da interface

Componentes reutilizáveis usam `useT()` e chaves semânticas dos catálogos em `src/i18n/locales/`. Novos textos precisam de versões em inglês, espanhol e português do Brasil. Veja [a estratégia de localização](docs/localization.md); mensagens e JSONs criados pelo usuário não devem ser traduzidos automaticamente.
