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
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id });
  const label = `Reordenar opção ${index + 1}: ${option.title || 'Sem título'}`;
  return (
    <div
      ref={setNodeRef}
      className={`sortable-option${isDragging ? ' is-dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {children(
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="option-drag-handle"
          aria-label={label}
          title="Arraste para reordenar. Pelo teclado: espaço e setas."
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
          draggable:
            'Pressione espaço para pegar a opção. Use as setas para mudar a posição, espaço para soltar ou Escape para cancelar.',
        },
        announcements: {
          onDragStart: ({ active }) => `Opção ${position(active.id)} selecionada para mover.`,
          onDragOver: ({ over }) =>
            over ? `Posição ${position(over.id)} de ${options.length}.` : 'Fora da lista.',
          onDragEnd: ({ over }) =>
            over ? `Opção movida para a posição ${position(over.id)}.` : 'Ordem mantida.',
          onDragCancel: () => 'Movimento cancelado. Ordem mantida.',
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
