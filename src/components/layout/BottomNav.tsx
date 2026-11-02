import { House, Layers, ShieldCheck, UserRound, Utensils } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { ProgressBarsIcon } from './NavIcons'
import { useAuth } from '@/context/AuthContext'
import { Avatar } from '@/components/shared/Avatar'
import { cn } from '@/lib/utils'

/**
 * The tab bar at the bottom of the screen on phones (the same links are in the top bar on bigger screens).
 * Each tab is an icon with its name under it, regular black (white in dark mode); the page you are on turns green with a soft rounded shape behind its icon and name.
 */
export function BottomNav() {
  const { profile, role } = useAuth()
  if (!profile) return null

  const items = [
    { to: '/', label: 'Home', icon: House, end: true },
    { to: '/food', label: 'Food', icon: Utensils, end: false },
    { to: '/progress', label: 'Progress', icon: ProgressBarsIcon, end: false },
    { to: '/saved', label: 'Programs', icon: Layers, end: false },
    ...(role === 'admin' ? [{ to: '/admin', label: 'Admin', icon: ShieldCheck, end: false }] : []),
    { to: '/account', label: 'Account', icon: UserRound, end: false },
  ]

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-3 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-40 rounded-full border border-border bg-card/95 shadow-lg backdrop-blur sm:hidden print:hidden"
    >
      <ul className="flex h-16 items-stretch px-1">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex h-full items-center justify-center py-1 transition-colors',
                  isActive ? 'text-primary' : 'text-black dark:text-white',
                )
              }
            >
              {({ isActive }) => (
                <span className={cn('flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-full transition-colors', isActive && 'bg-primary/15')}>
                  {to === '/account' ? (
                    <Avatar url={profile.avatarUrl} className={cn('h-[26px] w-[26px]', isActive && 'ring-2 ring-primary')} />
                  ) : (
                    <Icon className="h-[22px] w-[22px]" strokeWidth={2} />
                  )}
                  <span className="text-[10px] font-semibold leading-none">{label}</span>
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
