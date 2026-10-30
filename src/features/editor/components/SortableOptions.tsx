import { useT } from '../../../i18n';
import { useId, type ReactNode } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import type { MessageOption } from '../../../core/types';

function SortableOption({
  option,
  index,
  children,
}: {
  option: MessageOption;
  index: number;
  children: (handle: ReactNode) => ReactNode;
}) {
  const t = useT();

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id });
  const label = t('dnd.handle', { v0: index + 1, v1: option.title || t('common.untitled') });
  return (
    <div
      ref={setNodeRef}
      className={`sortable-option${isDragging ? ' is-dragging' : ''}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      {children(
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="option-drag-handle"
          aria-label={label}
          title={t('dnd.hint')}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
            {[6, 12, 18].flatMap((y) =>
              [9, 15].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" />),
            )}
          </svg>
        </button>,
      )}
    </div>
  );
}

/** Shared sorting behavior; option IDs and payloads survive an order change. */
export function SortableOptions({
  options,
  onChange,
  children,
}: {
  options: MessageOption[];
  onChange: (options: MessageOption[]) => void;
  children: (option: MessageOption, index: number, handle: ReactNode) => ReactNode;
}) {
  const t = useT();

  const id = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const position = (id: string | number) => options.findIndex((option) => option.id === id) + 1;
  return (
    <DndContext
      id={id}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      accessibility={{
        screenReaderInstructions: {
          draggable: t('dnd.instructions'),
        },
        announcements: {
          onDragStart: ({ active }) => t('dnd.start', { v0: position(active.id) }),
          onDragOver: ({ over }) =>
            over
              ? t('dnd.position', { v0: position(over.id), v1: options.length })
              : t('dnd.outside'),
          onDragEnd: ({ over }) =>
            over ? t('dnd.end', { v0: position(over.id) }) : t('dnd.unchanged'),
          onDragCancel: () => t('dnd.cancel'),
        },
      }}
      onDragEnd={({ active, over }) => {
        if (!over || active.id === over.id) return;
        const from = options.findIndex((option) => option.id === active.id);
        const to = options.findIndex((option) => option.id === over.id);
        if (from >= 0 && to >= 0) onChange(arrayMove(options, from, to));
      }}
    >
      <SortableContext
        items={options.map((option) => option.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="sortable-options">
          {options.map((option, index) => (
            <SortableOption key={option.id} option={option} index={index}>
              {(handle) => children(option, index, handle)}
            </SortableOption>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
