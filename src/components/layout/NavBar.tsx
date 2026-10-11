import { LayoutList, Settings, LogOut, Crown, LineChart, ShieldCheck, UserRound, Utensils } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/Logo'
import { Wordmark } from '@/components/ui/Wordmark'
import { Badge } from '@/components/ui/badge'
import { hasProAccess, isPro } from '@/lib/billing'

export function NavBar() {
  const { profile, role, signOut } = useAuth()
  const navigate = useNavigate()

  if (!profile) return null
  const isAdmin = role === 'admin'
  const pro = isPro(profile)
  const proAccess = hasProAccess(profile, role)

  return (
    <header className="sticky top-0 z-50 w-full print:hidden">
      <div className="glass border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <Logo className="h-9 w-9 rounded-lg" />
            <Wordmark className="text-xl sm:text-2xl" />
          </Link>

          <div className="flex items-center gap-1 sm:gap-4">
            <span className="hidden sm:block font-body text-sm text-muted-foreground">
              Welcome, <span className="text-foreground font-semibold">{profile.displayName}</span>
            </span>

            <button onClick={() => navigate('/account')} className="hidden sm:block">
              <Badge variant={proAccess ? 'default' : 'outline'} className="gap-1 cursor-pointer">
                {isAdmin ? <ShieldCheck className="h-3 w-3" /> : pro && <Crown className="h-3 w-3" />}
                {isAdmin ? 'Admin' : pro ? 'Pro' : 'Free'}
              </Badge>
            </button>

            {!proAccess && (
              <Button size="sm" className="gap-1.5 px-2 sm:px-3" onClick={() => navigate('/pricing')}>
                <Crown className="h-4 w-4" />
                <span className="hidden sm:inline">Upgrade</span>
              </Button>
            )}

            <Button variant="ghost" size="sm" onClick={() => navigate('/food')} className="gap-1.5 px-2 sm:px-3" aria-label="Food log">
              <Utensils className="h-4 w-4" />
              <span className="hidden sm:inline">Food</span>
            </Button>

            <Button variant="ghost" size="sm" onClick={() => navigate('/progress')} className="gap-1.5 px-2 sm:px-3">
              <LineChart className="h-4 w-4" />
              <span className="hidden sm:inline">Progress</span>
            </Button>

            <Button variant="ghost" size="sm" onClick={() => navigate('/saved')} className="gap-1.5 px-2 sm:px-3">
              <LayoutList className="h-4 w-4" />
              <span className="hidden sm:inline">My Programs</span>
            </Button>

            {role === 'admin' && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="gap-1.5 px-2 sm:px-3">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            )}

            {/* Phones don't have room for Sign Out here — it lives on the Account page instead. */}
            <Button variant="ghost" size="sm" onClick={() => navigate('/account')} className="px-2 sm:hidden" aria-label="Account">
              <UserRound className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                signOut()
                navigate('/auth')
              }}
              className="hidden sm:inline-flex gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
