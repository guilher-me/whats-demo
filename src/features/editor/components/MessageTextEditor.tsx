import { useId, useLayoutEffect, useRef, useState } from 'react';
import { useT } from '../../../i18n';
import { TextArea } from '../../../components/ui/Field';
import { Button } from '../../../components/ui/Button';
import type { VariableOption } from '../../../core/journey-variables';

export function MessageTextEditor({
  label,
  value,
  onChange,
  maxLength,
  variables,
}: {
  label: string;
  value: string;
  onChange: (text: string) => void;
  maxLength?: number;
  variables?: VariableOption[];
}) {
  const t = useT();
  const hint = useId();
  const listId = hint + '-variables';
  const input = useRef<HTMLTextAreaElement>(null);
  const restore = useRef<number>(null);
  const [menu, setMenu] = useState<{ from: number; to: number; query: string }>();
  const [active, setActive] = useState(0);
  const [limit, setLimit] = useState(false);
  const query = menu?.query.toLocaleLowerCase() ?? '';
  const matches = (menu ? (variables ?? []) : []).filter(({ path, group, label }) =>
    [path, group, label].some((text) => text.toLocaleLowerCase().includes(query)),
  );
  const current = Math.min(active, Math.max(0, matches.length - 1));
  const groups = new Map<string, { item: VariableOption; index: number }[]>();
  matches.forEach((item, index) => {
    const group = groups.get(item.group);
    if (group) group.push({ item, index });
    else groups.set(item.group, [{ item, index }]);
  });

  useLayoutEffect(() => {
    if (restore.current === null) return;
    const position = restore.current;
    restore.current = null;
    input.current?.focus({ preventScroll: true });
    input.current?.setSelectionRange(position, position);
  }, [value]);

  const insert = (item: VariableOption) => {
    if (!menu) return;
    const token = '{{' + item.path + '}}';
    const next = value.slice(0, menu.from) + token + value.slice(menu.to);
    if (maxLength !== undefined && next.length > maxLength) {
      setLimit(true);
      return;
    }
    restore.current = menu.from + token.length;
    setMenu(undefined);
    setLimit(false);
    if (next === value) {
      input.current?.focus({ preventScroll: true });
      input.current?.setSelectionRange(restore.current, restore.current);
      restore.current = null;
    } else onChange(next);
  };

  return (
    <div
      className="message-text-editor"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setMenu(undefined);
      }}
    >
      <TextArea
        ref={input}
        label={label}
        value={value}
        maxLength={maxLength}
        aria-describedby={hint}
        aria-autocomplete={variables?.length ? 'list' : undefined}
        aria-controls={menu ? listId : undefined}
        aria-activedescendant={menu && matches.length ? listId + '-' + current : undefined}
        onChange={(event) => {
          const field = event.currentTarget;
          const position = field.selectionStart;
          const match =
            variables?.length && field.value.slice(0, position).match(/\{\{([^{}\n?]*?)$/);
          const suffix = field.value.slice(position).match(/^[\w.[\]" -]*\}\}/)?.[0];
          setMenu(
            match
              ? { from: match.index!, to: position + (suffix?.length ?? 0), query: match[1].trim() }
              : undefined,
          );
          setActive(0);
          setLimit(false);
          onChange(field.value);
        }}
        onKeyDown={(event) => {
          if (!menu) return;
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            setMenu(undefined);
          } else if (matches.length && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            event.preventDefault();
            const index =
              (current + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length;
            setActive(index);
            document.getElementById(listId + '-' + index)?.scrollIntoView?.({ block: 'nearest' });
          } else if (event.key === 'Enter' && matches[current]) {
            event.preventDefault();
            insert(matches[current]);
          }
        }}
      />
      <p className="formatting-hint" id={hint}>
        {t('editor.formatHint')}
      </p>
      {!!variables?.length && (
        <Button
          variant="ghost"
          className="variable-trigger"
          data-editor-action
          aria-expanded={!!menu}
          aria-controls={menu ? listId : undefined}
          onClick={() => {
            const field = input.current!;
            if (menu) setMenu(undefined);
            else {
              setMenu({ from: field.selectionStart, to: field.selectionEnd, query: '' });
              setActive(0);
              setLimit(false);
              field.focus({ preventScroll: true });
            }
          }}
        >
          {t('variables.insert')}
        </Button>
      )}
      {menu && (
        <div className="variable-menu">
          <div id={listId} role="listbox" aria-label={t('variables.insert')}>
            {[...groups].map(([group, entries]) => (
              <div role="group" aria-label={group} key={group}>
                <small aria-hidden="true">{group}</small>
                {entries.map(({ item, index }) => (
                  <button
                    type="button"
                    role="option"
                    key={item.path}
                    id={listId + '-' + index}
                    aria-selected={current === index}
                    tabIndex={-1}
                    data-editor-action
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => insert(item)}
                  >
                    <span>{item.label}</span>
                    <code>{item.path}</code>
                  </button>
                ))}
              </div>
            ))}
          </div>
          {!matches.length && <small role="status">{t('variables.noMatches')}</small>}
          {limit && <small role="alert">{t('variables.limit')}</small>}
        </div>
      )}
    </div>
  );
}
