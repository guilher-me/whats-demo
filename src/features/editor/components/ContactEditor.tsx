import { useId, useRef } from 'react';
import type { Contact } from '../../../core/types';
import { avatarSource, FALLBACK_AVATAR } from '../../../core/defaults';
import { TextField } from '../../../components/ui/Field';
import { Checkbox } from '../../../components/ui/Checkbox';
import { Button } from '../../../components/ui/Button';
export function ContactEditor({
  contact,
  onChange,
  onError,
}: {
  contact: Contact;
  onChange: (contact: Contact) => void;
  onError: (message: string) => void;
}) {
  const id = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const upload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
      onError('Selecione uma imagem de até 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ ...contact, avatar: String(reader.result) });
      onError('');
    };
    reader.onerror = () => onError('Não foi possível ler a imagem.');
    reader.readAsDataURL(file);
  };
  return (
    <section className="contact-panel" aria-label="Perfil do contato">
      <div className="contact-image">
        <img
          src={avatarSource(contact.avatar)}
          alt={`Foto de ${contact.name.trim() || 'contato'}`}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = FALLBACK_AVATAR;
          }}
        />
        <Button
          variant="ghost"
          className="upload-button"
          aria-label="Trocar foto do contato"
          onClick={() => fileInput.current?.click()}
        >
          Trocar foto
        </Button>
        <input
          id={id}
          ref={fileInput}
          aria-label="Selecionar imagem do contato"
          hidden
          type="file"
          accept="image/*"
          onChange={(e) => {
            upload(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
      <div className="contact-fields">
        <TextField
          label="Nome do contato"
          value={contact.name}
          maxLength={80}
          onChange={(e) => onChange({ ...contact, name: e.target.value })}
        />
        <Checkbox
          label="Selo de conta verificada"
          checked={contact.verified}
          onChange={(e) => onChange({ ...contact, verified: e.target.checked })}
        />
        <Button variant="ghost" onClick={() => onChange({ ...contact, avatar: '' })}>
          Remover foto
        </Button>
      </div>
    </section>
  );
}
