import { useEffect, useId, useState } from 'react';
import { BusinessAvatar } from '../../components/ui/BusinessAvatar';
import { encode, shareHash } from '../../core/codec';
import { useT } from '../../i18n';
import { demoProjects } from './demo-projects';

const languageNames = { 'pt-BR': 'Português', en: 'English', es: 'Español' };

async function demoLinks() {
  return Promise.all(
    demoProjects().map(async ({ id, locale, project }) => ({
      id,
      locale,
      contact: project.contact,
      href: shareHash('demo', await encode(project), locale),
    })),
  );
}

export function DemoGallery() {
  const t = useT();
  const heading = useId();
  const [links, setLinks] = useState<Awaited<ReturnType<typeof demoLinks>> | null>();
  useEffect(() => {
    let active = true;
    void demoLinks().then(
      (result) => {
        if (active) setLinks(result);
      },
      () => {
        if (active) setLinks(null);
      },
    );
    return () => {
      active = false;
    };
  }, []);
  return (
    <section className="demo-gallery" aria-labelledby={heading}>
      <h3 id={heading}>{t('demos.title')}</h3>
      <p>{t('demos.description')}</p>
      {links === undefined ? (
        <p role="status">{t('errors.loading')}</p>
      ) : links ? (
        <ul className="demo-cards">
          {links.map(({ id, locale, contact, href }) => (
            <li key={id}>
              <a className="demo-card" href={href}>
                <BusinessAvatar
                  icon={contact.icon}
                  iconBackground={contact.iconBackground}
                  iconForeground={contact.iconForeground}
                />
                <span>
                  <strong>{contact.name}</strong>
                  <small>
                    {t(`demos.${id}`)} · <span lang={locale}>{languageNames[locale]}</span>
                  </small>
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
