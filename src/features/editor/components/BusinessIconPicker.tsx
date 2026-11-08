import { useId, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { BusinessAvatar } from '../../../components/ui/BusinessAvatar';
import { FieldError, TextField } from '../../../components/ui/Field';
import {
  BUSINESS_ICON_GROUPS,
  DEFAULT_BUSINESS_ICON,
  DEFAULT_ICON_BACKGROUND,
  isIconBackground,
  type BusinessIcon,
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
] as const;

function readHex(input: string): string | undefined {
  const hex = '#' + input.trim().replace(/^#/, '');
  return isIconBackground(hex) ? hex.toUpperCase() : undefined;
}

export function BusinessIconPicker({
  contact,
  onApply,
  onCancel,
}: {
  contact: Contact;
  onApply: (icon: BusinessIcon, background: string) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const id = useId();
  const [icon, setIcon] = useState(contact.icon ?? DEFAULT_BUSINESS_ICON);
  const [background, setBackground] = useState(contact.iconBackground ?? DEFAULT_ICON_BACKGROUND);
  const [hexText, setHexText] = useState(background);
  const invalid = !readHex(hexText);
  const selectColor = (color: string) => {
    setBackground(color);
    setHexText(color);
  };

  return (
    <form
      className="business-avatar-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!invalid) onApply(icon, background);
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
                    <BusinessAvatar icon={choice} iconBackground={background} />
                    <span>{t(`contact.icon.${choice}`)}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </fieldset>
        <div className="contact-avatar-settings">
          <div className="contact-avatar-preview">
            <BusinessAvatar icon={icon} iconBackground={background} />
            <div>
              <strong>{t(`contact.icon.${icon}`)}</strong>
              <span>
                {t('contact.avatarId')} <code>{icon}</code>
              </span>
            </div>
          </div>
          <fieldset className="contact-avatar-picker">
            <legend>{t('contact.background')}</legend>
            <div className="contact-color-grid">
              {palette.map(([name, color]) => (
                <label
                  className="contact-color-option"
                  key={name}
                  title={t(`contact.color.${name}`)}
                >
                  <input
                    type="radio"
                    className="visually-hidden"
                    name={id + '-color'}
                    aria-label={t(`contact.color.${name}`)}
                    checked={!invalid && background === color}
                    onChange={() => selectColor(color)}
                  />
                  <span aria-hidden="true" style={{ backgroundColor: color }} />
                </label>
              ))}
            </div>
          </fieldset>
          <TextField
            label={t('contact.hex')}
            value={hexText}
            spellCheck={false}
            autoComplete="off"
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? id + '-error' : undefined}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setHexText(value);
              const parsed = readHex(value);
              if (parsed) setBackground(parsed);
            }}
            onBlur={() => {
              if (!invalid) setHexText(background);
            }}
          />
          <FieldError id={id + '-error'}>{invalid && t('contact.invalidHex')}</FieldError>
          <Button
            variant="ghost"
            className="contact-avatar-reset"
            onClick={() => {
              setIcon(DEFAULT_BUSINESS_ICON);
              selectColor(DEFAULT_ICON_BACKGROUND);
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
