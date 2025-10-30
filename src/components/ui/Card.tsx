import { forwardRef, type HTMLAttributes } from 'react'
import { clsx } from 'clsx'

export type CardProps = HTMLAttributes<HTMLDivElement>

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card({ className, children, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={clsx(
        'group/card panel relative overflow-hidden rounded-3xl p-6 shadow-soft transition hover:shadow-elevated',
        className
      )}
      {...props}
    >
      <div className="relative z-10 flex h-full flex-col gap-4">{children}</div>
    </div>
  )
})
