import {
  Fragment,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { Button } from '../components/ui/Button';
import { ControlIcon } from '../components/icons/ControlIcon';
import { useT, type MessageKey } from '../i18n';

const panels = ['code', 'editor', 'preview'] as const;
export type Panel = (typeof panels)[number];
const labels: Record<Panel, MessageKey> = {
  code: 'workspace.code',
  editor: 'workspace.editor',
  preview: 'workspace.preview',
};
const minWidth = { code: 216, editor: 312, preview: 306 };
const minHeight = { code: 220, editor: 280, preview: 360 };
const desktopQuery = '(min-width: 960px)';
const measure = (desktop: boolean, event: PointerEvent) =>
  desktop ? event.clientX : event.clientY;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function subscribe(listener: () => void) {
  const query = window.matchMedia?.(desktopQuery);
  query?.addEventListener('change', listener);
  return () => query?.removeEventListener('change', listener);
}

function snapshot() {
  return window.matchMedia?.(desktopQuery).matches ?? true;
}

export function Workbench({
  contents,
  collapsed,
  onToggle,
  locked,
  journeyControls,
}: {
  journeyControls: ReactNode;
  contents: Record<Panel, ReactNode>;
  collapsed: Partial<Record<Panel, boolean>>;
  onToggle: (panel: Panel) => void;
  locked: boolean;
}) {
  const t = useT();
  const desktop = useSyncExternalStore(subscribe, snapshot);
  const [weights, setWeights] = useState({ code: 1, editor: 2, preview: 2.2 });
  const [heights, setHeights] = useState({ code: 410, editor: 540, preview: 690 });
  const drag = useRef<{ pointer: number; resize: (delta: number) => void; origin: number }>(null);
  const nodes = useRef<Partial<Record<Panel, HTMLDivElement | null>>>({});
  const visible = panels.filter((panel) => !collapsed[panel]);
  const visibleWeight = visible.reduce((total, panel) => total + weights[panel], 0);
  const effectiveWeights = visibleWeight ? weights : { code: 1, editor: 1, preview: 1 };

  const resizer = (before: Panel, after: Panel) => {
    if (desktop) {
      const left = nodes.current[before]?.getBoundingClientRect().width ?? minWidth[before];
      const right = nodes.current[after]?.getBoundingClientRect().width ?? minWidth[after];
      const extra = left + right - minWidth[before] - minWidth[after];
      const total = effectiveWeights[before] + effectiveWeights[after];
      return (delta: number) => {
        if (extra <= 0 || total <= 0) return;
        const beforeWeight = total * clamp((left - minWidth[before] + delta) / extra, 0, 1);
        setWeights((sizes) => ({
          ...sizes,
          [before]: beforeWeight,
          [after]: total - beforeWeight,
        }));
      };
    }
    const total = heights[before] + heights[after];
    return (delta: number) => {
      const height = clamp(heights[before] + delta, minHeight[before], total - minHeight[after]);
      setHeights((sizes) => ({ ...sizes, [before]: height, [after]: total - height }));
    };
  };

  const keyboardResize = (event: KeyboardEvent, before: Panel, after: Panel) => {
    const shrink = desktop ? 'ArrowLeft' : 'ArrowUp';
    const grow = desktop ? 'ArrowRight' : 'ArrowDown';
    const key = event.key;
    if (locked || ![shrink, grow, 'Home', 'End'].includes(key)) return;
    event.preventDefault();
    const step = event.shiftKey ? 64 : 24;
    const deltas = { [shrink]: -step, [grow]: step, Home: -Infinity, End: Infinity };
    resizer(before, after)(deltas[key]);
  };

  return (
    <main className="workspace">
      <div className="workspace-toolbar">
        {journeyControls}
        <div className="workspace-panel-controls" role="group" aria-label={t('workspace.panels')}>
          {panels.map((panel) => {
            const name = t(labels[panel]);
            const open = !collapsed[panel];
            const action = t(open ? 'workspace.collapse' : 'workspace.expand', { name });
            return (
              <Button
                key={panel}
                variant="ghost"
                className="workspace-toggle"
                aria-label={action}
                title={action}
                aria-expanded={open}
                aria-controls={'workspace-' + panel}
                disabled={locked || (open && visible.length === 1)}
                onClick={() => onToggle(panel)}
              >
                {name}
                <ControlIcon name="chevron" width="14" height="14" />
              </Button>
            );
          })}
        </div>
      </div>
      <div className="workspace-panels">
        {panels.map((panel) => {
          const index = visible.indexOf(panel);
          const before = visible[index - 1];
          const sizes = desktop ? effectiveWeights : heights;
          const total = before ? sizes[before] + sizes[panel] : 0;
          const range = total - (desktop || !before ? 0 : minHeight[before] + minHeight[panel]);
          const value = before ? sizes[before] - (desktop ? 0 : minHeight[before]) : 0;
          const minimum = desktop ? minWidth[panel] : minHeight[panel];
          return (
            <Fragment key={panel}>
              {index > 0 && before && (
                <div
                  className="workspace-divider"
                  role="separator"
                  aria-label={t('workspace.resize', {
                    first: t(labels[before]),
                    second: t(labels[panel]),
                  })}
                  aria-controls={'workspace-' + before}
                  aria-orientation={desktop ? 'vertical' : 'horizontal'}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={range ? Math.round((value / range) * 100) : 0}
                  aria-disabled={locked || undefined}
                  tabIndex={locked ? -1 : 0}
                  onKeyDown={(event) => keyboardResize(event, before, panel)}
                  onPointerDown={(event) => {
                    if (locked || event.button !== 0) return;
                    event.preventDefault();
                    event.currentTarget.focus();
                    event.currentTarget.setPointerCapture?.(event.pointerId);
                    drag.current = {
                      origin: measure(desktop, event),
                      pointer: event.pointerId,
                      resize: resizer(before, panel),
                    };
                  }}
                  onPointerMove={(event) => {
                    const active = drag.current;
                    if (!locked && active?.pointer === event.pointerId)
                      active.resize(measure(desktop, event) - active.origin);
                  }}
                  onLostPointerCapture={() => {
                    drag.current = null;
                  }}
                  onPointerUp={() => {
                    drag.current = null;
                  }}
                  onPointerCancel={() => {
                    drag.current = null;
                  }}
                />
              )}
              <div
                id={'workspace-' + panel}
                className="workspace-panel"
                data-panel={panel}
                hidden={index < 0}
                ref={(node) => {
                  nodes.current[panel] = node;
                }}
                style={
                  {
                    '--panel-min': minimum + 'px',
                    '--panel-weight': effectiveWeights[panel] / (visibleWeight || visible.length),
                    '--panel-height': heights[panel] + 'px',
                  } as CSSProperties
                }
              >
                {contents[panel]}
              </div>
            </Fragment>
          );
        })}
      </div>
    </main>
  );
}
