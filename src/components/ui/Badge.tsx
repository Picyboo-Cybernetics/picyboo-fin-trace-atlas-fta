import { clsx } from 'clsx'
import type { HTMLAttributes } from 'react'

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'outline'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone
  pill?: boolean
}

const toneStyles: Record<BadgeTone, string> = {
  neutral: 'badge-surface',
  primary: 'badge-primary',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  outline: 'badge-outline'
}

export function Badge({ tone = 'neutral', pill = true, className, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
        pill ? 'rounded-full' : 'rounded-md',
        toneStyles[tone],
        className
      )}
      {...props}
    />
  )
}
