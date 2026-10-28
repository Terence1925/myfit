import { ChartColumn, House, Layers, ShieldCheck, UserRound, Utensils } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

/**
 * The tab bar at the bottom of the screen on phones (the same links are in the top bar on bigger screens).
 * Icons only, thin and quiet; the page you are on gets a soft rounded shape behind its icon. Each one is named for screen readers.
 */
export function BottomNav() {
  const { profile, role } = useAuth()
  if (!profile) return null

  const items = [
    { to: '/', label: 'Workout', icon: House, end: true },
    { to: '/food', label: 'Food', icon: Utensils, end: false },
    { to: '/progress', label: 'Progress', icon: ChartColumn, end: false },
    { to: '/saved', label: 'Programs', icon: Layers, end: false },
    ...(role === 'admin' ? [{ to: '/admin', label: 'Admin', icon: ShieldCheck, end: false }] : []),
    { to: '/account', label: 'Account', icon: UserRound, end: false },
  ]

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-3 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-40 rounded-full border border-border bg-card/95 shadow-lg backdrop-blur sm:hidden print:hidden"
    >
      <ul className="flex h-14 items-stretch">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              aria-label={label}
              title={label}
              className={({ isActive }) =>
                cn(
                  'flex h-full items-center justify-center transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground/70 active:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <span className={cn('flex h-10 w-12 items-center justify-center rounded-full transition-colors', isActive && 'bg-primary/15')}>
                  <Icon className="h-[22px] w-[22px]" strokeWidth={1.75} />
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
