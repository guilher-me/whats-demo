import { useId, type ReactNode } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import type { Step } from '../../../core/types';
import { useT } from '../../../i18n';

function SortableStep({
  step,
  index,
  children,
}: {
  step: Step;
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
  } = useSortable({ id: step.id });
  return (
    <div
      ref={setNodeRef}
      className={`sortable-step${isDragging ? ' is-dragging' : ''}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      {children(
        <button
          type="button"
          data-step-drag
          className="option-drag-handle step-drag-handle"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={t('editor.dragStep', { v0: index + 1 })}
          title={t('editor.dragStepsHint')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            {[6, 12, 18].flatMap((y) =>
              [9, 15].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" />),
            )}
          </svg>
        </button>,
      )}
    </div>
  );
}
export function SortableSteps({
  steps,
  onChange,
  children,
}: {
  steps: Step[];
  onChange: (steps: Step[]) => void;
  children: (step: Step, index: number, handle: ReactNode) => ReactNode;
}) {
  const id = useId();
  const t = useT();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  return (
    <DndContext
      id={id}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      accessibility={{
        screenReaderInstructions: { draggable: t('editor.dragStepsHint') },
        announcements: {
          onDragStart: ({ active }) =>
            t('editor.dragPicked', { v0: steps.findIndex((step) => step.id === active.id) + 1 }),
          onDragOver: ({ over }) =>
            over
              ? t('editor.dragPosition', { v0: steps.findIndex((step) => step.id === over.id) + 1 })
              : undefined,
          onDragEnd: ({ over }) =>
            over
              ? t('editor.dragPlaced', { v0: steps.findIndex((step) => step.id === over.id) + 1 })
              : t('editor.dragCancelled'),
          onDragCancel: () => t('editor.dragCancelled'),
        },
      }}
      onDragEnd={({ active, over }) => {
        if (over && active.id !== over.id)
          onChange(
            arrayMove(
              steps,
              steps.findIndex((step) => step.id === active.id),
              steps.findIndex((step) => step.id === over.id),
            ),
          );
      }}
    >
      <SortableContext items={steps.map((step) => step.id)} strategy={verticalListSortingStrategy}>
        <div className="journey-list">
          {steps.map((step, index) => (
            <SortableStep key={step.id} step={step} index={index}>
              {(handle) => children(step, index, handle)}
            </SortableStep>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
