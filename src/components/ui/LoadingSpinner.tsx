import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  fullPage?: boolean
  label?: string
}

const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }

export function LoadingSpinner({ size = 'md', className, fullPage, label }: LoadingSpinnerProps) {
  if (fullPage) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/80 z-50">
        <Loader2 className={cn('animate-spin text-blue-600', sizes[size], className)} />
        {label && <p className="mt-3 text-sm text-slate-500">{label}</p>}
      </div>
    )
  }
  return (
    <div className={cn('flex items-center justify-center py-8', className)}>
      <Loader2 className={cn('animate-spin text-blue-600', sizes[size])} />
      {label && <span className="ml-2 text-sm text-slate-500">{label}</span>}
    </div>
  )
}
