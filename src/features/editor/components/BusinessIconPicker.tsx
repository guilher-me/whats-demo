import { useId, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { BusinessAvatar } from '../../../components/ui/BusinessAvatar';
import {
  BUSINESS_ICON_GROUPS,
  DEFAULT_BUSINESS_ICON,
  DEFAULT_ICON_BACKGROUND,
  iconForeground,
} from '../../../core/business-avatar';
import type { Contact } from '../../../core/types';
import { useT } from '../../../i18n';

const palette = [
  ['green', DEFAULT_ICON_BACKGROUND],
  ['blue', '#2196F3'],
  ['pink', '#EC4899'],
  ['yellow', '#FACC15'],
  ['white', '#FFFFFF'],
  ['darkGreen', '#14532D'],
  ['darkBlue', '#1E3A8A'],
  ['red', '#DC2626'],
  ['orange', '#F97316'],
  ['black', '#000000'],
] as const;

function AvatarColorPicker({
  label,
  value,
  onChange,
  automatic,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  automatic?: { color: string; onSelect: () => void };
}) {
  const t = useT();
  const id = useId();
  const currentColor = value ?? automatic?.color ?? DEFAULT_ICON_BACKGROUND;
  return (
    <fieldset className="contact-avatar-picker contact-color-picker">
      <legend>{label}</legend>
      {automatic && (
        <Button
          variant="ghost"
          className="contact-color-auto"
          aria-pressed={!value}
          onClick={automatic.onSelect}
        >
          {t('contact.autoColor')}
        </Button>
      )}
      <div className="contact-color-grid">
        {palette.map(([name, color]) => (
          <label className="contact-color-option" key={name} title={t(`contact.color.${name}`)}>
            <input
              type="radio"
              className="visually-hidden"
              name={id}
              aria-label={t(`contact.color.${name}`)}
              checked={value === color}
              onChange={() => onChange(color)}
            />
            <span aria-hidden="true" style={{ backgroundColor: color }} />
          </label>
        ))}
      </div>
      <label className="contact-custom-color">
        <span
          aria-hidden="true"
          className="contact-custom-color-swatch"
          style={{ backgroundColor: currentColor }}
        />
        {t('contact.customColor')}
        <input
          type="color"
          value={currentColor.toLowerCase()}
          onChange={(event) => onChange(event.currentTarget.value.toUpperCase())}
        />
      </label>
    </fieldset>
  );
}

export function BusinessIconPicker({
  contact,
  onApply,
  onCancel,
}: {
  contact: Contact;
  onApply: (avatar: Pick<Contact, 'icon' | 'iconBackground' | 'iconForeground'>) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const id = useId();
  const [icon, setIcon] = useState(contact.icon ?? DEFAULT_BUSINESS_ICON);
  const [background, setBackground] = useState(contact.iconBackground ?? DEFAULT_ICON_BACKGROUND);
  const [foreground, setForeground] = useState(contact.iconForeground);
  const automaticColor = iconForeground(background) === '#fff' ? '#FFFFFF' : '#000000';
  const colors = { iconBackground: background, iconForeground: foreground };

  return (
    <form
      className="business-avatar-form"
      onSubmit={(event) => {
        event.preventDefault();
        onApply({
          icon: icon === DEFAULT_BUSINESS_ICON ? undefined : icon,
          iconBackground: background === DEFAULT_ICON_BACKGROUND ? undefined : background,
          iconForeground: foreground,
        });
      }}
    >
      <div className="business-avatar-body">
        <fieldset className="contact-avatar-picker contact-icon-list">
          <legend className="visually-hidden">{t('contact.icon')}</legend>
          {BUSINESS_ICON_GROUPS.map((group) => (
            <div key={group.id} className="contact-icon-group">
              <h3>{t(`contact.iconGroup.${group.id}`)}</h3>
              <div className="contact-icon-grid">
                {group.icons.map((choice) => (
                  <label className="contact-icon-option" key={choice}>
                    <input
                      type="radio"
                      className="visually-hidden"
                      name={id + '-icon'}
                      checked={icon === choice}
                      onChange={() => setIcon(choice)}
                    />
                    <BusinessAvatar icon={choice} {...colors} />
                    <span>{t(`contact.icon.${choice}`)}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </fieldset>
        <div className="contact-avatar-settings">
          <div className="contact-avatar-preview">
            <BusinessAvatar icon={icon} {...colors} />
            <div>
              <strong>{t(`contact.icon.${icon}`)}</strong>
              <span>
                {t('contact.avatarId')} <code>{icon}</code>
              </span>
            </div>
          </div>
          <AvatarColorPicker
            label={t('contact.background')}
            value={background}
            onChange={setBackground}
          />
          <AvatarColorPicker
            label={t('contact.foreground')}
            value={foreground}
            onChange={setForeground}
            automatic={{ color: automaticColor, onSelect: () => setForeground(undefined) }}
          />
          <Button
            variant="ghost"
            className="contact-avatar-reset"
            onClick={() => {
              setIcon(DEFAULT_BUSINESS_ICON);
              setBackground(DEFAULT_ICON_BACKGROUND);
              setForeground(undefined);
            }}
          >
            {t('contact.resetAvatar')}
          </Button>
        </div>
      </div>
      <div className="dialog-actions">
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary">
          {t('code.apply')}
        </Button>
      </div>
    </form>
  );
}
