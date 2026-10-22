import { Dumbbell, LayoutList, LineChart, Settings, UserRound, Utensils } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

/** The tab bar at the bottom of the screen on phones (the same links are in the top bar on bigger screens). Icons only; each one is named for screen readers. */
export function BottomNav() {
  const { profile, role } = useAuth()
  if (!profile) return null

  const items = [
    { to: '/', label: 'Workout', icon: Dumbbell, end: true },
    { to: '/food', label: 'Food', icon: Utensils, end: false },
    { to: '/progress', label: 'Progress', icon: LineChart, end: false },
    { to: '/saved', label: 'Programs', icon: LayoutList, end: false },
    ...(role === 'admin' ? [{ to: '/admin', label: 'Admin', icon: Settings, end: false }] : []),
    { to: '/account', label: 'Account', icon: UserRound, end: false },
  ]

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 bg-card z-40 border-t border-border sm:hidden print:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
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
                  isActive ? 'text-primary' : 'text-muted-foreground active:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
