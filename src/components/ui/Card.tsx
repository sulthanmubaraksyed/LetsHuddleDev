import { cn } from '@/utils/cn'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export function Card({ children, className, onClick, hover, padding = 'md' }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-sm',
        paddings[padding],
        hover && 'cursor-pointer hover:shadow-md hover:border-slate-300 transition-all',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('font-semibold text-slate-900', className)}>{children}</h3>
}
