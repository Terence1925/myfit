import * as React from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/shared/Avatar'
import { profiles } from '@/lib/backend/api'
import { photoToAvatar } from '@/lib/avatarImage'
import type { Profile } from '@/lib/types'

/** The round profile picture on the Account page: tap it (or Change photo) to pick a photo, Remove to go back to the letter. */
export function ProfilePhoto({ profile, onChanged }: { profile: Profile; onChanged: () => void }) {
  const input = React.useRef<HTMLInputElement>(null)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const save = async (avatarUrl: string | null) => {
    setBusy(true)
    setError(null)
    try {
      await profiles.updateAvatar(profile.id, avatarUrl)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your photo.')
    } finally {
      setBusy(false)
    }
  }

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // so choosing the same photo again still counts
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      await save(await photoToAvatar(file))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not use that photo.')
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 pb-3">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        aria-label="Change profile photo"
        className="relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Avatar url={profile.avatarUrl} className="h-24 w-24" />
        <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </span>
      </button>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={onPick} data-testid="avatar-input" />
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={busy} onClick={() => input.current?.click()}>
          {profile.avatarUrl ? 'Change photo' : 'Add photo'}
        </Button>
        {profile.avatarUrl && (
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => void save(null)}>
            Remove
          </Button>
        )}
      </div>
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
    </div>
  )
}
