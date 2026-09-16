import { useNavigate } from 'react-router-dom'
import { Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center px-4">
      <Dumbbell className="h-12 w-12 text-primary" />
      <h1 className="font-display text-6xl tracking-wide text-gradient-gold">404</h1>
      <p className="font-body text-muted-foreground">This page doesn't exist.</p>
      <Button onClick={() => navigate('/')}>Back to FORGEFIT</Button>
    </div>
  )
}
