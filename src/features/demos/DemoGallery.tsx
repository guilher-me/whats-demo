import { useEffect, useId, useState } from 'react';
import { BusinessAvatar } from '../../components/ui/BusinessAvatar';
import { encode, shareHash } from '../../core/codec';
import { currentLocale, useT, type Locale } from '../../i18n';
import { demoProjects } from './demo-projects';

async function demoLinks(locale: Locale) {
  return Promise.all(
    demoProjects(locale).map(async ({ id, title, project }) => ({
      id,
      title,
      contact: project.contact,
      href: shareHash('demo', await encode(project), locale),
    })),
  );
}

export function DemoGallery() {
  const t = useT();
  const heading = useId();
  const locale = currentLocale();
  const [result, setResult] = useState<{
    locale: Locale;
    links?: Awaited<ReturnType<typeof demoLinks>>;
  }>();
  useEffect(() => {
    let active = true;
    void demoLinks(locale).then(
      (links) => {
        if (active) setResult({ locale, links });
      },
      () => {
        if (active) setResult({ locale });
      },
    );
    return () => {
      active = false;
    };
  }, [locale]);

  const current = result?.locale === locale ? result : undefined;
  return (
    <section className="demo-gallery" aria-labelledby={heading}>
      <h3 id={heading}>{t('demos.title')}</h3>
      <p>{t('demos.description')}</p>
      {!current ? (
        <p role="status">{t('errors.loading')}</p>
      ) : current.links ? (
        <ul className="demo-cards">
          {current.links.map(({ id, title, contact, href }) => (
            <li key={id}>
              <a className="demo-card" href={href}>
                <BusinessAvatar
                  icon={contact.icon}
                  iconBackground={contact.iconBackground}
                  iconForeground={contact.iconForeground}
                />
                <span>
                  <strong>{contact.name}</strong>
                  <small>{title}</small>
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p role="status">{t('demos.unavailable')}</p>
      )}
    </section>
  );
}
