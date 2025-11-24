'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastVariant = 'default' | 'success' | 'error' | 'warning'

export type ToastOptions = {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
  actionLabel?: string
  onAction?: () => void
}

type ToastMessage = ToastOptions & {
  id: string
}

const ToastContext = createContext<{
  showToast: (options: ToastOptions) => string
  dismissToast: (id: string) => void
} | null>(null)

const variantClasses: Record<ToastVariant, string> = {
  default: 'border-slate-200 bg-white/95 text-slate-900 dark:border-slate-700 dark:bg-slate-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  error: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200',
  warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timeout = timers.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      timers.current.delete(id)
    }
  }, [])

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`
      const duration = options.duration ?? 5000

      setToasts((current) => [...current, { ...options, id, variant: options.variant ?? 'default' }])

      if (duration > 0) {
        const timeout = setTimeout(() => dismissToast(id), duration)
        timers.current.set(id, timeout)
      }

      return id
    },
    [dismissToast],
  )

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-6 z-[9999] mx-auto flex w-full max-w-md flex-col gap-3 sm:inset-auto sm:right-6 sm:top-auto sm:w-auto">
        {toasts.map((toast) => {
          const variant = toast.variant ?? 'default'
          return (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto rounded-2xl border px-4 py-3 shadow-xl backdrop-blur transition',
                variantClasses[variant],
              )}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold">{toast.title}</p>
                  {toast.description && <p className="text-sm text-slate-600 dark:text-slate-300">{toast.description}</p>}
                  {toast.actionLabel && (
                    <button
                      type="button"
                      className="text-sm font-semibold text-primary hover:underline"
                      onClick={() => {
                        toast.onAction?.()
                        dismissToast(toast.id)
                      }}
                    >
                      {toast.actionLabel}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800"
                  onClick={() => dismissToast(toast.id)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Dismiss notification</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

