import { parseTree, type Node } from 'jsonc-parser';

export interface StepRange {
  from: number;
  to: number;
}

function properties(node: Node, name: string) {
  return node.children?.filter((property) => property.children?.[0]?.value === name) ?? [];
}

export function stepRanges(text: string): Map<string, StepRange> {
  const ranges = new Map<string, StepRange>();
  let root: Node | undefined;
  try {
    root = parseTree(text);
  } catch {
    return ranges;
  }
  if (root?.type !== 'object') return ranges;
  const steps = properties(root, 'steps');
  const list = steps[0]?.children?.[1];
  if (steps.length !== 1 || list?.type !== 'array') return ranges;

  const seen = new Set<string>();
  for (const step of list.children ?? []) {
    if (step.type !== 'object') continue;
    const from = step.offset;
    const to = from + step.length;
    const ids = properties(step, 'id');
    for (const property of ids) {
      const id = property.children?.[1];
      if (id?.type !== 'string' || typeof id.value !== 'string' || !id.value) continue;
      if (seen.has(id.value)) {
        ranges.delete(id.value);
        continue;
      }
      seen.add(id.value);
      if (ids.length !== 1) continue;
      try {
        // A complete step stays navigable even when the surrounding draft is invalid.
        // Parse the slice strictly before trusting the recoverable tree's offsets.
        if (JSON.parse(text.slice(from, to)).id === id.value) ranges.set(id.value, { from, to });
      } catch {
        // Incomplete or structurally ambiguous blocks have no navigation target.
      }
    }
  }
  return ranges;
}
