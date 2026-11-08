import * as React from 'react'
import { SubscribeSheet } from '@/components/billing/SubscribeSheet'

interface SubscribeSheetValue {
  /** Slides the plan picker up over the current screen. */
  openSubscribe: () => void
}

const SubscribeSheetContext = React.createContext<SubscribeSheetValue>({ openSubscribe: () => undefined })

/** One plan picker for the whole app: any "Subscribe" button calls `useSubscribeSheet().openSubscribe()` instead of going to another page. */
export function SubscribeSheetProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const value = React.useMemo(() => ({ openSubscribe: () => setOpen(true) }), [])
  const close = React.useCallback(() => setOpen(false), [])
  return (
    <SubscribeSheetContext.Provider value={value}>
      {children}
      <SubscribeSheet open={open} onClose={close} />
    </SubscribeSheetContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSubscribeSheet(): SubscribeSheetValue {
  return React.useContext(SubscribeSheetContext)
}
