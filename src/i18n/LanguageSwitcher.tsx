import { i18n, useT, type Locale } from './index';
import englishFlag from '../../assets/flags/us.svg';
import spanishFlag from '../../assets/flags/es.svg';
import brazilianFlag from '../../assets/flags/br.svg';
const choices: { locale: Locale; name: string; flag: string }[] = [
  { locale: 'en', name: 'English', flag: englishFlag },
  { locale: 'es', name: 'Español', flag: spanishFlag },
  { locale: 'pt-BR', name: 'Português (Brasil)', flag: brazilianFlag },
];
export function LanguageSwitcher({ disabled = false }: { disabled?: boolean }) {
  const t = useT();
  return (
    <div className="language-switcher" role="group" aria-label={t('language.label')}>
      {choices.map((choice) => (
        <button
          key={choice.locale}
          type="button"
          lang={choice.locale}
          aria-label={choice.name}
          title={choice.name}
          aria-pressed={i18n.language === choice.locale}
          disabled={disabled}
          onClick={() => void i18n.changeLanguage(choice.locale)}
        >
          <img src={choice.flag} alt="" width="26" height="26" />
        </button>
      ))}
    </div>
  );
}
