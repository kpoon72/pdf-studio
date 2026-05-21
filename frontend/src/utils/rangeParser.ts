import type { ParsedRange } from '../types';

let idCounter = 0;
function genId(): string {
  return `range-${++idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

export function parseRangeInput(input: string, maxPage: number): ParsedRange[] {
  if (!input.trim()) return [];
  const parts = input.split(',').map(s => s.trim()).filter(Boolean);
  const results: ParsedRange[] = [];

  for (const part of parts) {
    const id = genId();
    if (part.includes('-')) {
      const [a, b] = part.split('-').map(s => s.trim());
      const start = parseInt(a, 10);
      const end = parseInt(b, 10);
      if (isNaN(start) || isNaN(end)) {
        results.push({ id, input: part, start: 0, end: 0, label: part, isValid: false, error: 'Invalid numbers' });
      } else if (start < 1) {
        results.push({ id, input: part, start, end, label: part, isValid: false, error: 'Page must be ≥ 1' });
      } else if (end > maxPage) {
        results.push({ id, input: part, start, end, label: part, isValid: false, error: `Max page is ${maxPage}` });
      } else if (start > end) {
        results.push({ id, input: part, start, end, label: part, isValid: false, error: 'Start must be ≤ end' });
      } else {
        results.push({ id, input: part, start, end, label: `Pages ${start}–${end}`, isValid: true });
      }
    } else {
      const page = parseInt(part, 10);
      if (isNaN(page)) {
        results.push({ id, input: part, start: 0, end: 0, label: part, isValid: false, error: 'Invalid number' });
      } else if (page < 1 || page > maxPage) {
        results.push({ id, input: part, start: page, end: page, label: part, isValid: false, error: `Must be 1–${maxPage}` });
      } else {
        results.push({ id, input: part, start: page, end: page, label: `Page ${page}`, isValid: true });
      }
    }
  }
  return results;
}

export function validRangesOnly(ranges: ParsedRange[]): Array<{ start: number; end: number; label: string }> {
  return ranges.filter(r => r.isValid).map(r => ({ start: r.start, end: r.end, label: r.label }));
}
