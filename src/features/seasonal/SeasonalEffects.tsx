import { createContext, useContext, useState, type ReactNode } from 'react';
import { useT } from '../../i18n';
import { Snowfall } from './Snowfall';

function SnowflakeIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 2v20M3.34 7l17.32 10M3.34 17l17.32-10M9 4l3 3 3-3m-6 16 3-3 3 3M3.57 10.6l4.1-1.1-1.1-4.1m10.86 13.2-1.1-4.1 4.1-1.1M3.57 13.4l4.1 1.1-1.1 4.1M17.43 5.4l-1.1 4.1 4.1 1.1" />
    </svg>
  );
}

const seasonalEffects = {
  christmas: { label: 'app.christmasSnow', Icon: SnowflakeIcon, Overlay: Snowfall },
} as const;

type SeasonalEffect = keyof typeof seasonalEffects;

const SeasonalContext = createContext<{
  active: SeasonalEffect | null;
  toggle: (effect: SeasonalEffect) => void;
}>({ active: null, toggle: () => {} });

export function SeasonalEffects({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<SeasonalEffect | null>(null);
  const toggle = (effect: SeasonalEffect) =>
    setActive((current) => (current === effect ? null : effect));
  const Overlay = active ? seasonalEffects[active].Overlay : null;

  return (
    <SeasonalContext.Provider value={{ active, toggle }}>
      {children}
      {Overlay && <Overlay />}
    </SeasonalContext.Provider>
  );
}

export function SeasonalEffectButton({
  effect,
  disabled,
}: {
  effect: SeasonalEffect;
  disabled?: boolean;
}) {
  const { active, toggle } = useContext(SeasonalContext);
  const t = useT();
  const { label, Icon } = seasonalEffects[effect];
  const name = t(label);

  return (
    <div className="header-seasonal">
      <button
        type="button"
        className="seasonal-toggle"
        aria-label={name}
        title={name}
        aria-pressed={active === effect}
        disabled={disabled}
        onClick={() => toggle(effect)}
      >
        <Icon />
      </button>
    </div>
  );
}
