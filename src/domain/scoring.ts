// placeholder for future metrics
export function compositeScore(a?: number | null, b?: number | null, c?: number | null) {
  const parts = [a, b, c].filter((x): x is number => typeof x === 'number')
  if (!parts.length) return null
  return Math.round(parts.reduce((p, q) => p + q, 0) / parts.length)
}
