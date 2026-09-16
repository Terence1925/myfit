import { Dumbbell, LayoutList, Settings, LogOut, Crown, LineChart, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-gradient shadow-glow transition-transform group-hover:scale-110">
              <Dumbbell className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-display text-2xl tracking-wider text-gradient-gold">FORGEFIT</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden sm:block font-body text-sm text-muted-foreground">
              Welcome, <span className="text-foreground font-semibold">{profile.displayName}</span>
            </span>

            <button onClick={() => navigate('/account')}>
              <Badge variant={proAccess ? 'default' : 'outline'} className="gap-1 cursor-pointer">
                {isAdmin ? <ShieldCheck className="h-3 w-3" /> : pro && <Crown className="h-3 w-3" />}
                {isAdmin ? 'Admin' : pro ? 'Pro' : 'Free'}
              </Badge>
            </button>

            {!proAccess && (
              <Button size="sm" className="gap-1.5" onClick={() => navigate('/pricing')}>
                <Crown className="h-4 w-4" />
                <span className="hidden sm:inline">Upgrade</span>
              </Button>
            )}

            <Button variant="ghost" size="sm" onClick={() => navigate('/progress')} className="gap-1.5">
              <LineChart className="h-4 w-4" />
              <span className="hidden sm:inline">Progress</span>
            </Button>

            <Button variant="ghost" size="sm" onClick={() => navigate('/saved')} className="gap-1.5">
              <LayoutList className="h-4 w-4" />
              <span className="hidden sm:inline">My Programs</span>
            </Button>

            {role === 'admin' && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="gap-1.5">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                signOut()
                navigate('/auth')
              }}
              className="gap-1.5"
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
