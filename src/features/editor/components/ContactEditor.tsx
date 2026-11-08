import { useId, useState } from 'react';
import {
  BUSINESS_ICONS,
  DEFAULT_BUSINESS_ICON,
  DEFAULT_ICON_BACKGROUND,
  isIconBackground,
} from '../../../core/business-avatar';
import { FormSection } from '../../../components/ui/FormSection';
import { Button } from '../../../components/ui/Button';
import { useT } from '../../../i18n';
import type { Contact } from '../../../core/types';
import { BusinessAvatar } from '../../../components/ui/BusinessAvatar';
import { FieldError, TextField } from '../../../components/ui/Field';
import { VerifiedBadgeCheckbox } from '../../../components/ui/VerifiedBadgeCheckbox';

const palette = {
  green: DEFAULT_ICON_BACKGROUND,
  blue: '#1D4ED8',
  teal: '#0F766E',
  purple: '#6D28D9',
  red: '#B91C1C',
  amber: '#B45309',
  slate: '#334155',
  light: '#F1F5F9',
} as const;

function readHex(input: string): string | undefined {
  const hex = '#' + input.trim().replace(/^#/, '');
  return isIconBackground(hex) ? hex.toUpperCase() : undefined;
}

export function ContactEditor({
  contact,
  onChange,
}: {
  contact: Contact;
  onChange: (contact: Contact) => void;
}) {
  const t = useT();
  const id = useId();
  const [draft, setDraft] = useState<string>();
  const [invalidHex, setInvalidHex] = useState(false);
  const icon = contact.icon ?? DEFAULT_BUSINESS_ICON;
  const background = contact.iconBackground ?? DEFAULT_ICON_BACKGROUND;
  const changeBackground = (hex: string) =>
    onChange({
      ...contact,
      iconBackground: hex === DEFAULT_ICON_BACKGROUND ? undefined : hex,
    });
  const clearDraft = () => {
    setDraft(undefined);
    setInvalidHex(false);
  };
  return (
    <section className="contact-panel" aria-label={t('contact.region')}>
      <div className="contact-image">
        <BusinessAvatar icon={icon} iconBackground={background} />
      </div>
      <div className="contact-fields">
        <TextField
          label={t('contact.name')}
          value={contact.name}
          maxLength={80}
          onChange={(event) => onChange({ ...contact, name: event.target.value })}
        />
        <VerifiedBadgeCheckbox
          label={t('contact.verified')}
          checked={contact.verified}
          onChange={(verified) => onChange({ ...contact, verified })}
        />
      </div>
      <FormSection title={t('contact.appearance')} className="contact-avatar-editor">
        <fieldset className="contact-avatar-picker">
          <legend>{t('contact.icon')}</legend>
          <div className="contact-icon-grid">
            {BUSINESS_ICONS.map((choice) => (
              <label className="contact-icon-option" key={choice}>
                <input
                  type="radio"
                  className="visually-hidden"
                  name={id + '-icon'}
                  checked={icon === choice}
                  onChange={() =>
                    onChange({
                      ...contact,
                      icon: choice === DEFAULT_BUSINESS_ICON ? undefined : choice,
                    })
                  }
                />
                <BusinessAvatar icon={choice} iconBackground={background} />
                <span>{t(`contact.icon.${choice}`)}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="contact-avatar-picker">
          <legend>{t('contact.background')}</legend>
          <div className="contact-color-grid">
            {(Object.keys(palette) as (keyof typeof palette)[]).map((name) => {
              const color = palette[name];
              return (
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
                    checked={background === color}
                    onClick={background === color ? clearDraft : undefined}
                    onChange={() => {
                      clearDraft();
                      changeBackground(color);
                    }}
                  />
                  <span aria-hidden="true" style={{ backgroundColor: color }} />
                </label>
              );
            })}
          </div>
        </fieldset>
        <div className="contact-avatar-controls">
          <TextField
            label={t('contact.hex')}
            value={draft ?? background}
            spellCheck={false}
            autoComplete="off"
            aria-invalid={invalidHex || undefined}
            aria-describedby={invalidHex ? id + '-error' : undefined}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setDraft(value);
              const hex = readHex(value);
              if (hex) {
                setInvalidHex(false);
                if (hex !== background) changeBackground(hex);
              }
            }}
            onBlur={() => {
              if (draft === undefined || readHex(draft)) clearDraft();
              else setInvalidHex(true);
            }}
          />
          <Button
            variant="ghost"
            onClick={() => {
              clearDraft();
              onChange({ ...contact, icon: undefined, iconBackground: undefined });
            }}
          >
            {t('contact.resetAvatar')}
          </Button>
        </div>
        <FieldError id={id + '-error'}>{invalidHex && t('contact.invalidHex')}</FieldError>
      </FormSection>
    </section>
  );
}
