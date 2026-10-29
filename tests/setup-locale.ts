import { beforeEach } from 'vitest';
import { i18n } from '../src/i18n';
// Existing behavioral fixtures and journey content are in Brazilian Portuguese.
// Locale-specific tests explicitly select their language after this shared setup.
beforeEach(async () => {
  await i18n.changeLanguage('pt-BR');
});
