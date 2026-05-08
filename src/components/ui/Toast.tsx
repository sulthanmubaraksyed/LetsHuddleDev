import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/utils/cn'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const icons = {
  success: <CheckCircle2 className="w-4 h-4 text-green-600" />,
  error: <XCircle className="w-4 h-4 text-red-600" />,
  warning: <AlertCircle className="w-4 h-4 text-amber-600" />,
  info: <Info className="w-4 h-4 text-blue-600" />,
}

const styles = {
  success: 'border-green-200 bg-green-50',
  error: 'border-red-200 bg-red-50',
  warning: 'border-amber-200 bg-amber-50',
  info: 'border-blue-200 bg-blue-50',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => dismiss(id), 4000)
  }, [dismiss])

  const success = useCallback((m: string) => toast('success', m), [toast])
  const error = useCallback((m: string) => toast('error', m), [toast])
  const warning = useCallback((m: string) => toast('warning', m), [toast])
  const info = useCallback((m: string) => toast('info', m), [toast])

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg border shadow-lg animate-in slide-in-from-right-5',
              styles[t.type]
            )}
          >
            <div className="mt-0.5 shrink-0">{icons[t.type]}</div>
            <p className="flex-1 text-sm text-slate-800">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="shrink-0 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
