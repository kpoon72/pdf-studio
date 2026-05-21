import { SplitRange } from '../types';

export function parseRanges(input: string, maxPage: number): SplitRange[] {
  const ranges: SplitRange[] = [];
  const parts = input.split(',').map(s => s.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const segments = part.split('-');
      const start = parseInt(segments[0].trim(), 10);
      const end = parseInt(segments[1].trim(), 10);
      if (!isNaN(start) && !isNaN(end) && start >= 1 && end <= maxPage && start <= end) {
        ranges.push({ start, end, label: `pages_${start}-${end}` });
      }
    } else {
      const page = parseInt(part, 10);
      if (!isNaN(page) && page >= 1 && page <= maxPage) {
        ranges.push({ start: page, end: page, label: `page_${page}` });
      }
    }
  }

  return ranges;
}
