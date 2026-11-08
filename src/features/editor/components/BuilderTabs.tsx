import { Button } from '../../../components/ui/Button';
import { useT } from '../../../i18n';

const tabs = ['visual', 'json'] as const;
export type BuilderTab = (typeof tabs)[number];

export function BuilderTabs({
  id,
  label,
  tab,
  onSelect,
}: {
  id: string;
  label: string;
  tab: BuilderTab;
  onSelect: (tab: BuilderTab) => void;
}) {
  const t = useT();
  return (
    <div role="tablist" aria-label={label} className="builder-tabs">
      {tabs.map((item) => (
        <Button
          key={item}
          variant="ghost"
          role="tab"
          id={id + '-' + item}
          aria-controls={id + '-panel-' + item}
          aria-selected={tab === item}
          tabIndex={tab === item ? 0 : -1}
          onClick={() => onSelect(item)}
          onKeyDown={(event) => {
            const alternate = item === 'visual' ? 'json' : 'visual';
            const next = {
              Home: 'visual',
              End: 'json',
              ArrowLeft: alternate,
              ArrowRight: alternate,
            } as const;
            if (!Object.hasOwn(next, event.key)) return;
            event.preventDefault();
            onSelect(next[event.key as keyof typeof next]);
          }}
        >
          {t(item === 'visual' ? 'builder.visual' : 'builder.json')}
        </Button>
      ))}
    </div>
  );
}
