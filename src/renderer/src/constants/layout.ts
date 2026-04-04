export type LayoutMode = 'auto' | 'fix-cols' | 'fix-rows'

export interface LayoutGrid {
  rows: number
  cols: number
  /** Total CSS grid columns (≥ cols, expanded via LCM to support orphan spanning) */
  totalGridCols: number
  /** column-span for panels in full rows */
  normalSpan: number
  /** column-span for panels in the last partial row */
  orphanSpan: number
  /** how many panels are in the last partial row (0 = last row is full) */
  lastRowCount: number
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

function lcm(a: number, b: number): number {
  return (a / gcd(a, b)) * b
}

/**
 * Pick columns count that minimises a combined score of:
 *   - aspect-ratio deviation from 16:9 (panels assumed roughly square)
 *   - wasted empty cells (weighted ×2)
 */
function autoGridCols(count: number): number {
  if (count <= 1) return 1
  const TARGET = 16 / 9
  let bestCols = 1
  let bestScore = Infinity
  for (let c = 1; c <= count; c++) {
    const r = Math.ceil(count / c)
    const waste = r * c - count
    const ratio = c / r
    const score = Math.abs(ratio - TARGET) / TARGET + (waste / count) * 2
    if (score < bestScore) {
      bestScore = score
      bestCols = c
    }
  }
  return bestCols
}

/**
 * Compute the full grid geometry for a given layout mode + count.
 *
 * Orphan expansion: when the last row is incomplete, all panels in that row
 * are widened proportionally via LCM so they fill the full row width.
 *
 *   e.g. 5 panels, 3 cols → lastRowCount=2
 *   LCM(3,2)=6, normal span=2, orphan span=3
 *   Row 1: [span2][span2][span2] = 6 ✓
 *   Row 2: [span3][span3]        = 6 ✓
 */
export function computeLayoutGrid(
  mode: LayoutMode,
  fixedValue: number,
  count: number
): LayoutGrid {
  if (count === 0) {
    return { rows: 0, cols: 1, totalGridCols: 1, normalSpan: 1, orphanSpan: 1, lastRowCount: 0 }
  }

  let cols: number
  let rows: number

  if (mode === 'fix-cols') {
    cols = Math.max(1, Math.min(fixedValue, count))
    rows = Math.ceil(count / cols)
  } else if (mode === 'fix-rows') {
    rows = Math.max(1, Math.min(fixedValue, count))
    cols = Math.ceil(count / rows)
  } else {
    // auto
    cols = autoGridCols(count)
    rows = Math.ceil(count / cols)
  }

  const lastRowCount = count % cols // 0 means last row is full

  if (lastRowCount === 0) {
    return { rows, cols, totalGridCols: cols, normalSpan: 1, orphanSpan: 1, lastRowCount: 0 }
  }

  const totalGridCols = lcm(cols, lastRowCount)
  const normalSpan = totalGridCols / cols
  const orphanSpan = totalGridCols / lastRowCount

  return { rows, cols, totalGridCols, normalSpan, orphanSpan, lastRowCount }
}
