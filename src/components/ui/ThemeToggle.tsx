import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/theme'

/** A round lime button that flips between light and dark mode. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { resolved, setChoice } = useTheme()
  const next = resolved === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      onClick={() => setChoice(next)}
      aria-label={`Switch to ${next} mode`}
      className={`flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95 ${className}`}
    >
      {resolved === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  )
}
