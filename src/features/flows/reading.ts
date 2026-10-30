import { resolve } from '../../core/engine';
import type { ExpressionContext, FlowComponent, Value } from '../../core/types';

/** Read only the current component, including dynamically supplied choices. */
export function flowReadingText(component: FlowComponent, context: ExpressionContext): string {
  const source = resolve(component['data-source'] as Value, context);
  const choices = Array.isArray(source)
    ? source.map((option) =>
        option && typeof option === 'object' && !Array.isArray(option) ? option.title : '',
      )
    : [];
  return [component.text, component.label, component['helper-text'], ...choices]
    .map((text) => resolve(text, context))
    .filter((text) => typeof text === 'string' || typeof text === 'number')
    .join(' ');
}
