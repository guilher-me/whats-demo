import { useId, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { BusinessAvatar } from '../../../components/ui/BusinessAvatar';
import { FieldError, TextField } from '../../../components/ui/Field';
import {
  BUSINESS_ICON_GROUPS,
  DEFAULT_BUSINESS_ICON,
  DEFAULT_ICON_BACKGROUND,
  isAvatarColor,
} from '../../../core/business-avatar';
import type { Contact } from '../../../core/types';
import { useT } from '../../../i18n';

const palette = [
  ['green', DEFAULT_ICON_BACKGROUND],
  ['blue', '#1D4ED8'],
  ['teal', '#0F766E'],
  ['purple', '#6D28D9'],
  ['red', '#B91C1C'],
  ['amber', '#B45309'],
  ['slate', '#334155'],
  ['light', '#F1F5F9'],
  ['black', '#000000'],
  ['white', '#FFFFFF'],
] as const;

type ColorDraft = { text: string; color?: string };

function colorDraft(color?: string): ColorDraft {
  return { text: color ?? '', color };
}

function readHex(input: string): string | undefined {
  const hex = '#' + input.trim().replace(/^#/, '');
  return isAvatarColor(hex) ? hex.toUpperCase() : undefined;
}

function invalidHex(value: ColorDraft, allowAuto: boolean) {
  return !(allowAuto && !value.text.trim()) && !readHex(value.text);
}

function AvatarColorPicker({
  label,
  hexLabel,
  value,
  onChange,
  allowAuto = false,
}: {
  label: string;
  hexLabel: string;
  value: ColorDraft;
  onChange: (value: ColorDraft) => void;
  allowAuto?: boolean;
}) {
  const t = useT();
  const id = useId();
  const invalid = invalidHex(value, allowAuto);
  return (
    <fieldset className="contact-avatar-picker contact-color-picker">
      <legend>{label}</legend>
      {allowAuto && (
        <Button
          variant="ghost"
          className="contact-color-auto"
          aria-pressed={!invalid && !value.color}
          onClick={() => onChange(colorDraft())}
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
              checked={!invalid && value.color === color}
              onChange={() => onChange(colorDraft(color))}
            />
            <span aria-hidden="true" style={{ backgroundColor: color }} />
          </label>
        ))}
      </div>
      <TextField
        label={hexLabel}
        value={value.text}
        placeholder={allowAuto ? t('contact.autoColor') : undefined}
        spellCheck={false}
        autoComplete="off"
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? id + '-error' : undefined}
        onChange={(event) => {
          const text = event.currentTarget.value;
          if (allowAuto && !text.trim()) onChange(colorDraft());
          else onChange({ text, color: readHex(text) ?? value.color });
        }}
        onBlur={() => {
          if (!invalid) onChange(colorDraft(value.color));
        }}
      />
      <FieldError id={id + '-error'}>{invalid && t('contact.invalidHex')}</FieldError>
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
  const [background, setBackground] = useState(() =>
    colorDraft(contact.iconBackground ?? DEFAULT_ICON_BACKGROUND),
  );
  const [foreground, setForeground] = useState(() => colorDraft(contact.iconForeground));
  const invalid = invalidHex(background, false) || invalidHex(foreground, true);
  const colors = { iconBackground: background.color, iconForeground: foreground.color };

  return (
    <form
      className="business-avatar-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (invalid) return;
        onApply({
          icon: icon === DEFAULT_BUSINESS_ICON ? undefined : icon,
          iconBackground:
            background.color === DEFAULT_ICON_BACKGROUND ? undefined : background.color,
          iconForeground: foreground.color,
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
            hexLabel={t('contact.hex')}
            value={background}
            onChange={setBackground}
          />
          <AvatarColorPicker
            label={t('contact.foreground')}
            hexLabel={t('contact.foregroundHex')}
            value={foreground}
            onChange={setForeground}
            allowAuto
          />
          <Button
            variant="ghost"
            className="contact-avatar-reset"
            onClick={() => {
              setIcon(DEFAULT_BUSINESS_ICON);
              setBackground(colorDraft(DEFAULT_ICON_BACKGROUND));
              setForeground(colorDraft());
            }}
          >
            {t('contact.resetAvatar')}
          </Button>
        </div>
      </div>
      <div className="dialog-actions">
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" disabled={invalid}>
          {t('code.apply')}
        </Button>
      </div>
    </form>
  );
}
