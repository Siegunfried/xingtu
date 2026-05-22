import React, { useMemo } from 'react'

interface DiffPanelProps {
  oldContent: string
  newContent: string
  onAccept: () => void
  onReject: () => void
  title: string
}

export default function DiffPanel({ oldContent, newContent, onAccept, onReject, title }: DiffPanelProps) {
  const diffLines = useMemo(() => computeDiff(oldContent, newContent), [oldContent, newContent])

  return (
    <div
      className="animate-fade-in rounded-xl overflow-hidden"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
            {title}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
            {diffLines.filter((d) => d.type === 'added').length} 行新增,
            {diffLines.filter((d) => d.type === 'removed').length} 行删除
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReject}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium smooth-transition"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            拒绝
          </button>
          <button
            onClick={onAccept}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium smooth-transition"
            style={{ background: '#22c55e', color: '#fff' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            应用更改
          </button>
        </div>
      </div>

      {/* Diff lines */}
      <div
        className="overflow-auto max-h-[400px] overflow-y-auto"
        style={{ fontFamily: 'SF Mono, Consolas, monospace', fontSize: '12px' }}
      >
        {diffLines.map((line, i) => (
          <div
            key={i}
            className="flex px-4 py-0.5 leading-6"
            style={{
              background: line.type === 'added'
                ? 'rgba(34,197,94,0.08)'
                : line.type === 'removed'
                  ? 'rgba(239,68,68,0.08)'
                  : 'transparent',
              borderLeft: line.type === 'added'
                ? '3px solid #22c55e'
                : line.type === 'removed'
                  ? '3px solid #ef4444'
                  : '3px solid transparent',
            }}
          >
            {/* Line number gutter */}
            <span className="w-10 flex-shrink-0 text-right pr-3 select-none"
              style={{ color: 'var(--text-tertiary)', opacity: 0.5 }}>
              {line.oldLine || ''}
            </span>
            <span className="w-10 flex-shrink-0 text-right pr-3 select-none"
              style={{ color: 'var(--text-tertiary)', opacity: 0.5 }}>
              {line.newLine || ''}
            </span>
            {/* Sign */}
            <span className="w-4 flex-shrink-0 select-none" style={{
              color: line.type === 'added' ? '#22c55e' : line.type === 'removed' ? '#ef4444' : 'transparent'
            }}>
              {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
            </span>
            {/* Content */}
            <span className="whitespace-pre-wrap break-all" style={{
              color: line.type === 'added'
                ? '#22c55e'
                : line.type === 'removed'
                  ? '#ef4444'
                  : 'var(--text-primary)',
            }}>
              {line.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface DiffLine {
  type: 'added' | 'removed' | 'same'
  text: string
  oldLine?: number
  newLine?: number
}

function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  const result: DiffLine[] = []

  // Simple LCS-based diff
  const m = oldLines.length
  const n = newLines.length

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack to build diff
  let i = m, j = n
  const temp: DiffLine[] = []

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      temp.push({ type: 'same', text: oldLines[i - 1], oldLine: i, newLine: j })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      temp.push({ type: 'added', text: newLines[j - 1], newLine: j })
      j--
    } else {
      temp.push({ type: 'removed', text: oldLines[i - 1], oldLine: i })
      i--
    }
  }

  temp.reverse()

  // Add context: show unchanged lines only when near changes (3 lines of context)
  for (let k = 0; k < temp.length; k++) {
    if (temp[k].type !== 'same') {
      // Include surrounding context
      const start = Math.max(0, k - 3)
      const end = Math.min(temp.length - 1, k + 3)
      for (let x = start; x <= end; x++) {
        if (x === start && x > 0 && temp[x].type === 'same') {
          result.push({ type: 'same', text: '...', oldLine: -1, newLine: -1 })
        }
        result.push(temp[x])
        if (x === end && x < temp.length - 1 && temp[x].type === 'same') {
          result.push({ type: 'same', text: '...', oldLine: -1, newLine: -1 })
        }
      }
      k = end
    }
  }

  // Deduplicate
  const seen = new Map<string, number>()
  const deduped: DiffLine[] = []
  for (const line of result) {
    const key = `${line.type}:${line.text}:${line.oldLine}:${line.newLine}`
    const count = seen.get(key) || 0
    if (count < 2) {
      deduped.push(line)
      seen.set(key, count + 1)
    }
  }

  return deduped.length > 0 ? deduped : oldLines.map((text, idx) => ({
    type: 'same' as const, text, oldLine: idx + 1, newLine: idx + 1,
  }))
}
