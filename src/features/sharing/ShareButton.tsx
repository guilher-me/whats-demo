import { useState } from 'react';
import type { Project } from '../../core/types';
import { createURL } from '../../core/codec';
import { validateProject } from '../../core/engine';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { TextArea } from '../../components/ui/Field';
export function ShareButton({
  project,
  disabled,
  onError,
}: {
  project: Project;
  disabled?: boolean;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false),
    [copied, setCopied] = useState(false),
    [link, setLink] = useState(''),
    [open, setOpen] = useState(false);
  const share = async () => {
    setBusy(true);
    try {
      const url = await createURL(validateProject(project), location.href);
      let success = false;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
          success = true;
        }
      } catch {
        /* The dialog is the accessible fallback. */
      }
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        setLink(url);
        setOpen(true);
      }
      onError('');
    } catch (error) {
      onError((error as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Button variant="primary" disabled={disabled || busy} onClick={() => void share()}>
        {busy ? 'Gerando link…' : copied ? 'Link copiado ✓' : 'Copiar link'}
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Link da experiência"
        description="Copie o endereço abaixo com Ctrl+C."
      >
        <TextArea
          label="Link da experiência"
          value={link}
          readOnly
          onFocus={(e) => e.target.select()}
        />
        {location.protocol === 'file:' && (
          <p>
            Para compartilhar entre computadores, disponibilize o app em um endereço web acessível.
          </p>
        )}
      </Dialog>
    </>
  );
}
