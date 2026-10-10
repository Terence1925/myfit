import type { ReactNode } from 'react'
import {
  UserPlus,
  LogIn,
  LogOut,
  ClipboardCheck,
  Dumbbell,
  RefreshCw,
  Trash2,
  ShieldCheck,
  ShieldOff,
  Activity as ActivityIcon,
} from 'lucide-react'

export const ACTION_ICON: Record<string, ReactNode> = {
  signed_up: <UserPlus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
  signed_in: <LogIn className="h-4 w-4 text-primary" />,
  signed_out: <LogOut className="h-4 w-4 text-muted-foreground" />,
  completed_intake: <ClipboardCheck className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />,
  generated_program: <Dumbbell className="h-4 w-4 text-primary" />,
  swapped_exercise: <RefreshCw className="h-4 w-4 text-accent" />,
  deleted_program: <Trash2 className="h-4 w-4 text-destructive" />,
  promoted_to_admin: <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
  demoted_to_user: <ShieldOff className="h-4 w-4 text-orange-600 dark:text-orange-400" />,
}

export function actionIcon(action: string) {
  return ACTION_ICON[action] ?? <ActivityIcon className="h-4 w-4 text-muted-foreground" />
}

export function actionLabel(action: string): string {
  return action.replace(/_/g, ' ')
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}
