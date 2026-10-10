import { Logo } from '@/components/ui/Logo'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center px-4">
      <Logo className="h-16 w-16 rounded-2xl" />
      <h1 className="font-display text-6xl tracking-wide text-gradient-gold">404</h1>
      <p className="font-body text-muted-foreground">This page doesn't exist.</p>
      <Button onClick={() => navigate('/')}>Back to MyFit</Button>
    </div>
  )
}
