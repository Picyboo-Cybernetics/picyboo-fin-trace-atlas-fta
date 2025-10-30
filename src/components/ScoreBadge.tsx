import { Badge } from './ui/Badge'

export function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) {
    return <Badge tone="outline">N/A</Badge>
  }

  const tone = score >= 80 ? 'success' : score >= 50 ? 'warning' : 'danger'

  return <Badge tone={tone}>{score}%</Badge>
}
