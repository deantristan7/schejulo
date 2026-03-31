'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './button'

interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    open: boolean
    options: ConfirmOptions
    resolve: (val: boolean) => void
  } | null>(null)

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ open: true, options, resolve })
    })
  }, [])

  function handleClose(result: boolean) {
    state?.resolve(result)
    setState(null)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => handleClose(false)} />
          <div className="relative z-10 w-full max-w-sm mx-4 rounded-2xl bg-white shadow-xl p-6">
            <div className="flex items-start gap-4">
              <div className={`rounded-xl p-2.5 flex-shrink-0 ${state.options.variant === 'danger' ? 'bg-red-100' : 'bg-indigo-100'}`}>
                <AlertTriangle className={`h-5 w-5 ${state.options.variant === 'danger' ? 'text-red-600' : 'text-indigo-600'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{state.options.title}</h3>
                {state.options.description && (
                  <p className="mt-1 text-sm text-gray-500">{state.options.description}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="secondary" size="sm" onClick={() => handleClose(false)}>
                {state.options.cancelLabel ?? 'Batal'}
              </Button>
              <Button
                variant={state.options.variant === 'danger' ? 'danger' : 'primary'}
                size="sm"
                onClick={() => handleClose(true)}
              >
                {state.options.confirmLabel ?? 'Konfirmasi'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx.confirm
}
