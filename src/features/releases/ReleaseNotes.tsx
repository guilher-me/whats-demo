import { useState } from 'react';
import { version } from '../../../package.json';
import { Dialog } from '../../components/ui/Dialog';
import { useT } from '../../i18n';

const categoryLabels = {
  Added: 'changelog.added',
  Changed: 'changelog.changed',
  Deprecated: 'changelog.deprecated',
  Removed: 'changelog.removed',
  Fixed: 'changelog.fixed',
  Security: 'changelog.security',
} as const;

interface Release {
  version: string;
  date?: string;
  groups: { category: keyof typeof categoryLabels; items: string[] }[];
}

export function ReleaseNotes({ disabled }: { disabled?: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [releases] = useState<Release[]>(() => {
    const embedded = document.getElementById('release-notes')?.textContent;
    return embedded ? JSON.parse(embedded) : [];
  });

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title={t('changelog.title')}
      description={t('changelog.description', { v0: version })}
      trigger={
        <button
          type="button"
          className="app-version"
          disabled={disabled}
          aria-label={t('changelog.open', { v0: version })}
          title={t('changelog.title')}
        >
          v{version}
        </button>
      }
    >
      {releases
        .filter((release) => release.groups.length > 0)
        .map((release) => (
          <section className="release-notes-entry" key={release.version}>
            <h3>
              {release.version === 'Unreleased' ? t('changelog.unreleased') : `v${release.version}`}
              {release.date && <time dateTime={release.date}>{release.date}</time>}
            </h3>
            {release.groups.map(({ category, items }) => (
              <div key={category}>
                <h4>{t(categoryLabels[category])}</h4>
                <ul lang="en">
                  {items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      <div className="dialog-actions">
        <a
          className="button"
          href="https://github.com/guilher-me/whats-demo/blob/development/CHANGELOG.md"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('changelog.github')}
        </a>
      </div>
    </Dialog>
  );
}
