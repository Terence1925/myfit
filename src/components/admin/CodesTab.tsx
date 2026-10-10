import * as React from 'react'
import { Check, ChevronDown, Copy, Loader2, Plus, Trash2, Wand2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { codes as codesApi } from '@/lib/backend/api'
import { cn } from '@/lib/utils'
import type { CodeRedemption, DiscountCode, DiscountCodeKind, Profile } from '@/lib/types'

const PLAN_LABEL = { monthly: 'Monthly', yearly: 'Yearly' } as const

const CODE_PATTERN = /^[A-Z0-9_-]{3,32}$/

function suggestCode(source: string): string {
  const letters = source.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || 'FORGE'
  return `${letters}${Math.floor(10 + Math.random() * 90)}`
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}

const EMPTY_FORM = {
  kind: 'campaign' as DiscountCodeKind,
  label: '',
  ownerName: '',
  code: '',
  percentOff: '',
  offerTag: '',
  maxRedemptions: '',
  expiresAt: '',
}

export function CodesTab({ people }: { people: Profile[] }) {
  const [codes, setCodes] = React.useState<DiscountCode[]>([])
  const [redemptions, setRedemptions] = React.useState<CodeRedemption[]>([])
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [formOpen, setFormOpen] = React.useState(false)
  const [form, setForm] = React.useState(EMPTY_FORM)
  const [saving, setSaving] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [expanded, setExpanded] = React.useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    try {
      const data = await codesApi.listAll()
      setCodes(data.codes)
      setRedemptions(data.redemptions)
      setLoadError(null)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load codes.')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  const personById = React.useMemo(() => new Map(people.map((p) => [p.id, p])), [people])

  const statsFor = (id: string) => {
    const rows = redemptions.filter((r) => r.codeId === id)
    const subs = rows.filter((r) => r.subscribedAt)
    return {
      applied: rows.length,
      subscribed: subs.length,
      monthly: subs.filter((r) => r.plan === 'monthly').length,
      yearly: subs.filter((r) => r.plan === 'yearly').length,
      rows,
    }
  }

  const set = (patch: Partial<typeof EMPTY_FORM>) => {
    setForm((f) => ({ ...f, ...patch }))
    setFormError(null)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = form.code.trim().toUpperCase()
    const percent = form.percentOff ? Number(form.percentOff) : undefined
    const max = form.maxRedemptions ? Number(form.maxRedemptions) : undefined
    if (!form.label.trim()) return setFormError('Give the code a name, like "Summer sale".')
    if (form.kind === 'influencer' && !form.ownerName.trim()) return setFormError("Enter the influencer's name.")
    if (!CODE_PATTERN.test(code)) return setFormError('The code must be 3 to 32 characters: letters, numbers, dash or underscore.')
    if (!form.offerTag.trim()) return setFormError('Enter the Google Play offer tag this code unlocks.')
    if (percent !== undefined && (!Number.isInteger(percent) || percent < 1 || percent > 100))
      return setFormError('Discount % must be a whole number from 1 to 100.')
    if (max !== undefined && (!Number.isInteger(max) || max < 1)) return setFormError('Max uses must be a whole number, 1 or more.')

    setSaving(true)
    try {
      await codesApi.create({
        code,
        label: form.label,
        kind: form.kind,
        ownerName: form.ownerName,
        percentOff: percent,
        offerTag: form.offerTag,
        maxRedemptions: max,
        // End of the chosen day, local time.
        expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : undefined,
      })
      setForm(EMPTY_FORM)
      setFormOpen(false)
      await load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create the code.')
    } finally {
      setSaving(false)
    }
  }

  const run = async (fn: () => Promise<void>) => {
    try {
      await fn()
      await load()
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(code)
      setTimeout(() => setCopied((c) => (c === code ? null : c)), 1500)
    } catch {
      // Clipboard blocked — the code is visible on screen anyway.
    }
  }

  // Influencer leaderboard: who is actually bringing in paying customers.
  const influencers = React.useMemo(() => {
    const byName = new Map<string, { codes: number; applied: number; subscribed: number; monthly: number; yearly: number }>()
    for (const c of codes) {
      if (c.kind !== 'influencer' || !c.ownerName) continue
      const rows = redemptions.filter((r) => r.codeId === c.id)
      const cur = byName.get(c.ownerName) ?? { codes: 0, applied: 0, subscribed: 0, monthly: 0, yearly: 0 }
      cur.codes += 1
      cur.applied += rows.length
      cur.subscribed += rows.filter((r) => r.subscribedAt).length
      cur.monthly += rows.filter((r) => r.subscribedAt && r.plan === 'monthly').length
      cur.yearly += rows.filter((r) => r.subscribedAt && r.plan === 'yearly').length
      byName.set(c.ownerName, cur)
    }
    return [...byName.entries()].sort((a, b) => b[1].subscribed - a[1].subscribed || b[1].applied - a[1].applied)
  }, [codes, redemptions])

  if (loading) return <p className="text-sm text-muted-foreground">Loading codes…</p>

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl tracking-wide">Discount Codes</h3>
          <p className="text-sm text-muted-foreground">
            Make a code for a sale or an influencer, then see who used it and who actually subscribed.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Entered code</span> = typed it into the app.{' '}
            <span className="font-semibold text-foreground">Subscribed</span> = went on to buy a plan with it.
          </p>
        </div>
        <Button className="gap-1.5" onClick={() => setFormOpen((v) => !v)}>
          <Plus className="h-4 w-4" /> {formOpen ? 'Close' : 'New Code'}
        </Button>
      </div>

      {loadError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {loadError}
        </div>
      )}

      {formOpen && (
        <Card className="border-primary/30">
          <CardContent className="p-5 sm:p-6">
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <span className="text-sm font-semibold">What is this code for?</span>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {(
                    [
                      ['campaign', 'A sale or promo', 'Summer sale, year-end, etc.'],
                      ['influencer', 'An influencer', 'Tracks who they bring in.'],
                    ] as const
                  ).map(([value, title, sub]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set({ kind: value })}
                      className={cn(
                        'rounded-lg border p-3 text-left transition-colors',
                        form.kind === value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40',
                      )}
                    >
                      <div className="text-sm font-bold">{title}</div>
                      <div className="text-xs text-muted-foreground">{sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name (only you see this)">
                  <Input
                    value={form.label}
                    onChange={(e) => set({ label: e.target.value })}
                    placeholder={form.kind === 'influencer' ? 'Maria TikTok launch' : 'Summer sale 2026'}
                  />
                </Field>
                {form.kind === 'influencer' && (
                  <Field label="Influencer name" hint="Codes with the same name are added up together.">
                    <Input
                      value={form.ownerName}
                      onChange={(e) => set({ ownerName: e.target.value })}
                      placeholder="Maria Santos"
                    />
                  </Field>
                )}
                <Field label="Code customers type" hint="Letters and numbers only. Not case sensitive.">
                  <div className="flex gap-2">
                    <Input
                      value={form.code}
                      onChange={(e) => set({ code: e.target.value.toUpperCase() })}
                      placeholder="SUMMER20"
                      maxLength={32}
                      autoCapitalize="characters"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0 gap-1.5"
                      onClick={() => set({ code: suggestCode(form.kind === 'influencer' ? form.ownerName : form.label) })}
                    >
                      <Wand2 className="h-4 w-4" /> Suggest
                    </Button>
                  </div>
                </Field>
                <Field
                  label="Google Play offer tag"
                  hint="The tag you gave the discounted offer in Google Play Console (for example promo20)."
                >
                  <Input
                    value={form.offerTag}
                    onChange={(e) => set({ offerTag: e.target.value.trim() })}
                    placeholder="promo20"
                    autoCapitalize="none"
                  />
                </Field>
                <Field label="Discount % (optional)" hint="Just shown to customers. The real price comes from Google Play.">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={form.percentOff}
                    onChange={(e) => set({ percentOff: e.target.value })}
                    placeholder="20"
                  />
                </Field>
                <Field label="Max customers (optional)" hint="Stops working after this many people subscribe with it.">
                  <Input
                    type="number"
                    min={1}
                    value={form.maxRedemptions}
                    onChange={(e) => set({ maxRedemptions: e.target.value })}
                    placeholder="No limit"
                  />
                </Field>
                <Field label="Expires on (optional)">
                  <Input type="date" value={form.expiresAt} onChange={(e) => set({ expiresAt: e.target.value })} />
                </Field>
              </div>

              {formError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                  {formError}
                </div>
              )}
              <Button type="submit" disabled={saving} className="gap-1.5">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Create Code
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {influencers.length > 0 && (
        <div>
          <h4 className="mb-3 font-body text-sm font-bold uppercase tracking-widest text-muted-foreground">
            By influencer
          </h4>
          <Card>
            <CardContent className="divide-y divide-border/60 p-0">
              {influencers.map(([name, s]) => (
                <div key={name} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                  <div>
                    <div className="font-bold">{name}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.codes} {s.codes === 1 ? 'code' : 'codes'}
                    </div>
                  </div>
                  <div className="flex gap-4 text-right">
                    <div>
                      <div className="font-display text-2xl tabular-nums">{s.applied}</div>
                      <div className="text-xs text-muted-foreground">entered code</div>
                    </div>
                    <div>
                      <div className="font-display text-2xl tabular-nums text-emerald-600 dark:text-emerald-400">{s.subscribed}</div>
                      <div className="text-xs text-muted-foreground">subscribed</div>
                      {s.subscribed > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {s.monthly} monthly · {s.yearly} yearly
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <div>
        <h4 className="mb-3 font-body text-sm font-bold uppercase tracking-widest text-muted-foreground">
          All codes ({codes.length})
        </h4>
        {codes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No codes yet. Tap <span className="font-semibold text-foreground">New Code</span> to make your first one.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {codes.map((c) => {
              const s = statsFor(c.id)
              const expired = !!c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()
              const full = c.maxRedemptions != null && s.subscribed >= c.maxRedemptions
              const live = c.active && !expired && !full
              const open = expanded === c.id
              return (
                <Card key={c.id} className={cn(!live && 'opacity-70')}>
                  <CardContent className="space-y-3 p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-body font-bold">{c.label}</span>
                          <Badge variant={live ? 'success' : 'outline'}>
                            {!c.active ? 'Turned off' : expired ? 'Expired' : full ? 'Limit reached' : 'Active'}
                          </Badge>
                          {c.kind === 'influencer' && <Badge variant="default">Influencer: {c.ownerName}</Badge>}
                        </div>
                        <button
                          type="button"
                          onClick={() => copy(c.code)}
                          className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-border bg-background/60 px-2.5 py-1 font-mono text-sm font-bold tracking-wider hover:border-primary/50"
                          aria-label={`Copy code ${c.code}`}
                        >
                          {c.code}
                          {copied === c.code ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                        </button>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {c.percentOff ? `${c.percentOff}% off · ` : ''}Play offer tag: <span className="font-mono">{c.offerTag}</span>
                          {c.maxRedemptions ? ` · limit ${c.maxRedemptions}` : ''}
                          {c.expiresAt ? ` · expires ${new Date(c.expiresAt).toLocaleDateString()}` : ''}
                        </div>
                      </div>
                      <div className="flex gap-4 text-right">
                        <div>
                          <div className="font-display text-2xl tabular-nums">{s.applied}</div>
                          <div className="text-xs text-muted-foreground">entered code</div>
                        </div>
                        <div>
                          <div className="font-display text-2xl tabular-nums text-emerald-600 dark:text-emerald-400">{s.subscribed}</div>
                          <div className="text-xs text-muted-foreground">subscribed</div>
                          {s.subscribed > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {s.monthly} monthly · {s.yearly} yearly
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => run(() => codesApi.setActive(c.id, !c.active))}>
                        {c.active ? 'Turn off' : 'Turn on'}
                      </Button>
                      {s.applied > 0 && (
                        <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => setExpanded(open ? null : c.id)}>
                          Who used it <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
                        </Button>
                      )}
                      <div className="ml-auto">
                        {confirmDelete === c.id ? (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Delete this code and its history?</span>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setConfirmDelete(null)
                                void run(() => codesApi.remove(c.id))
                              }}
                            >
                              Delete
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setConfirmDelete(null)}>
                              Keep
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground" onClick={() => setConfirmDelete(c.id)}>
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </Button>
                        )}
                      </div>
                    </div>

                    {open && (
                      <div className="divide-y divide-border/60 rounded-lg border border-border/60">
                        {s.rows
                          .slice()
                          .sort((a, b) => b.redeemedAt.localeCompare(a.redeemedAt))
                          .map((r) => {
                            const person = personById.get(r.userId)
                            return (
                              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                                <div className="min-w-0">
                                  <div className="truncate font-semibold">{person?.displayName ?? 'Deleted user'}</div>
                                  <div className="truncate text-xs text-muted-foreground">{person?.email}</div>
                                </div>
                                <div className="text-right text-xs">
                                  <Badge variant={r.subscribedAt ? 'success' : 'outline'}>
                                    {r.subscribedAt ? `Subscribed${r.plan ? ` · ${PLAN_LABEL[r.plan]}` : ''}` : 'Only entered the code'}
                                  </Badge>
                                  <div className="mt-1 text-muted-foreground">
                                    {new Date(r.subscribedAt ?? r.redeemedAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
