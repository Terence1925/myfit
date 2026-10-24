import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TabsContextValue {
  value: string
  setValue: (v: string) => void
  // Unique per <Tabs> so two tab rows on one page don't fight over the same animated highlight.
  pillId: string
}
const TabsContext = React.createContext<TabsContextValue | null>(null)

export function Tabs({
  value,
  onValueChange,
  className,
  id,
  children,
}: {
  value: string
  onValueChange: (v: string) => void
  className?: string
  id?: string
  children: React.ReactNode
}) {
  const pillId = React.useId()
  return (
    <TabsContext.Provider value={{ value, setValue: onValueChange, pillId }}>
      <div id={id} className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('relative flex overflow-x-auto border-b border-border', className)}>{children}</div>
}

export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error('TabsTrigger must be used within Tabs')
  const active = ctx.value === value
  return (
    <button
      onClick={() => ctx.setValue(value)}
      aria-selected={active}
      role="tab"
      className={cn(
        'relative flex-1 whitespace-nowrap px-1 py-3 text-sm font-semibold font-body transition-colors',
        active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      {children}
      {active && (
        <motion.div
          layoutId={ctx.pillId}
          className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-primary"
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        />
      )}
    </button>
  )
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error('TabsContent must be used within Tabs')
  if (ctx.value !== value) return null
  return (
    <motion.div
      key={value}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
