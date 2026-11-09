import { expect, it } from 'vitest';
import { stepRanges } from '../src/features/code/step-ranges';

it('locates complete step objects by their own IDs in partially invalid JSON', () => {
  const text =
    '{"steps":[{"flow":{"id":"nested"},"id":"second"},{"id":"f\\u0069rst"},{"id":"unfinished"';
  const ranges = stepRanges(text);
  expect([...ranges.keys()]).toEqual(['second', 'first']);
  expect([...ranges.values()].map(({ from, to }) => JSON.parse(text.slice(from, to)).id)).toEqual([
    'second',
    'first',
  ]);
});

it('does not link duplicate IDs, duplicate ID properties or ambiguous step lists', () => {
  expect([
    ...stepRanges(
      '{"steps":[{"id":"repeat"},{"id":"repeat"},{"id":"x","id":"y"},{"id":"safe"}]}',
    ).keys(),
  ]).toEqual(['safe']);
  expect(stepRanges('{"steps":[{"id":"step"}],"steps":[]}').size).toBe(0);
});
