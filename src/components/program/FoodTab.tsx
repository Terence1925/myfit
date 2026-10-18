import * as React from 'react'
import {
  Apple,
  Beef,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Cookie,
  Carrot,
  Drumstick,
  Droplet,
  Dumbbell,
  EggFried,
  Fish,
  Globe,
  Ham,
  Minus,
  Pizza,
  Plus,
  Soup,
  Star,
  Trash2,
  Wheat,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/context/AuthContext'
import { foodLog } from '@/lib/backend/api'
import { hasProAccess } from '@/lib/billing'
import { searchFoods } from '@/lib/foods/filipinoFoods'
import { FOOD_CATEGORIES, foodsInCategory, type FoodCategoryId } from '@/lib/foods/categories'
import { isFavorite, loadFavorites, toggleFavorite } from '@/lib/foods/favorites'
import { isFilipinoPlate, PLATES } from '@/lib/foods/plates'
import {
  fromBase,
  isFilipinoFood,
  loadRegion,
  loadUnits,
  matchesRegion,
  REGION_LABELS,
  regionFirst,
  saveRegion,
  saveUnits,
  toBase,
  unitLabel,
  type FoodRegion,
  type FoodUnits,
} from '@/lib/foods/region'
import type { FoodItem, FoodLogEntry, MealType, NutritionPlan } from '@/lib/types'
import { cn } from '@/lib/utils'

const MEALS: { id: MealType; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snacks' },
]

/** YYYY-MM-DD in the person's own time zone (not UTC, so "today" flips at their midnight). */
function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function shiftDay(key: string, delta: number): string {
  const [y, m, d] = key.split('-').map(Number)
  return dayKey(new Date(y, m - 1, d + delta))
}

function dayLabel(key: string): string {
  const today = dayKey(new Date())
  if (key === today) return 'Today'
  if (key === shiftDay(today, -1)) return 'Yesterday'
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })
}

const r1 = (n: number) => Math.round(n * 10) / 10
const r0 = (n: number) => Math.round(n)

function MacroRow({
  icon,
  label,
  eaten,
  target,
  barClass,
}: {
  icon: React.ReactNode
  label: string
  eaten: number
  target: number
  barClass: string
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-semibold">
          {icon} {label}
        </span>
        <span className="text-muted-foreground">
          {r0(eaten)} / {target} g
        </span>
      </div>
      <Progress value={target ? (eaten / target) * 100 : 0} barClassName={barClass} />
    </div>
  )
}

export function FoodTab({ nutrition, userId }: { nutrition: NutritionPlan; userId: string }) {
  const [date, setDate] = React.useState(() => dayKey(new Date()))
  const [entries, setEntries] = React.useState<FoodLogEntry[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [addMeal, setAddMeal] = React.useState<MealType | null>(null)

  const load = React.useCallback(async () => {
    try {
      setEntries(await foodLog.listForDate(userId, date))
      setError(null)
    } catch {
      setError('Could not load your food log. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [userId, date])

  React.useEffect(() => {
    setLoading(true)
    void load()
  }, [load])

  const totals = entries.reduce(
    (t, e) => ({ kcal: t.kcal + e.kcal, p: t.p + e.proteinG, c: t.c + e.carbsG, f: t.f + e.fatG }),
    { kcal: 0, p: 0, c: 0, f: 0 },
  )
  const target = nutrition.calorieTarget
  const left = target - totals.kcal
  const over = left < 0

  const remove = async (id: string) => {
    setEntries((list) => list.filter((e) => e.id !== id))
    try {
      await foodLog.delete(id, userId)
    } catch {
      setError('Could not delete that item.')
      void load()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" aria-label="Previous day" onClick={() => setDate((d) => shiftDay(d, -1))}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="font-display text-xl tracking-wide">{dayLabel(date)}</div>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Next day"
          disabled={date >= dayKey(new Date())}
          onClick={() => setDate((d) => shiftDay(d, 1))}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-5 p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Eaten</div>
              <div className="font-display text-4xl tracking-wide text-gradient-gold">{r0(totals.kcal).toLocaleString('en-PH')}</div>
              <div className="text-xs text-muted-foreground">of {target.toLocaleString('en-PH')} kcal goal</div>
            </div>
            <div className="text-right">
              <div className={cn('font-display text-3xl tracking-wide', over && 'text-destructive')}>
                {Math.abs(r0(left)).toLocaleString('en-PH')}
              </div>
              <div className="text-xs text-muted-foreground">{over ? 'kcal over' : 'kcal left'}</div>
            </div>
          </div>
          <Progress value={(totals.kcal / target) * 100} barClassName={over ? 'bg-destructive' : undefined} className="h-3" />
          <div className="space-y-3">
            <MacroRow
              icon={<Beef className="h-4 w-4 text-red-600 dark:text-red-400" />}
              label="Protein"
              eaten={totals.p}
              target={nutrition.proteinG}
              barClass="bg-red-500"
            />
            <MacroRow
              icon={<Wheat className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
              label="Carbs"
              eaten={totals.c}
              target={nutrition.carbsG}
              barClass="bg-amber-500"
            />
            <MacroRow
              icon={<Droplet className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />}
              label="Fat"
              eaten={totals.f}
              target={nutrition.fatG}
              barClass="bg-cyan-500"
            />
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {MEALS.map(({ id, label }) => {
        const items = entries.filter((e) => e.meal === id)
        const kcal = items.reduce((s, e) => s + e.kcal, 0)
        return (
          <Card key={id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-body font-bold">{label}</div>
                  <div className="text-xs text-muted-foreground">{r0(kcal)} kcal</div>
                </div>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => setAddMeal(id)}>
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
              {items.length > 0 && (
                <ul className="mt-3 divide-y divide-border">
                  {items.map((e) => (
                    <li key={e.id} className="flex items-center gap-3 py-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{e.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {e.servings === 1 ? e.serving : `${e.servings} × ${e.serving}`} · P {r0(e.proteinG)} · C {r0(e.carbsG)} · F {r0(e.fatG)}
                        </div>
                      </div>
                      <div className="shrink-0 text-sm font-semibold">{r0(e.kcal)}</div>
                      <button
                        aria-label={`Remove ${e.name}`}
                        className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                        onClick={() => void remove(e.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {!loading && items.length === 0 && (
                <p className="mt-3 text-xs text-muted-foreground">Nothing logged yet.</p>
              )}
            </CardContent>
          </Card>
        )
      })}

      <p className="text-center text-xs text-muted-foreground">
        Food numbers are approximate; real servings vary. Use them as a guide, not a lab result.
      </p>

      <AddFoodDialog
        meal={addMeal}
        date={date}
        userId={userId}
        onClose={() => setAddMeal(null)}
        onAdded={() => {
          setAddMeal(null)
          void load()
        }}
      />
    </div>
  )
}

type Step = 'search' | 'amount' | 'custom'

/** A number for display in a box: whole when it can be, else one decimal. */
const shown = (n: number) => String(Math.round(n * 10) / 10)
type BrowseTab = 'browse' | 'meals' | 'saved'

const CATEGORY_ICONS: Record<FoodCategoryId, LucideIcon> = {
  'rice-breakfast': EggFried,
  beef: Beef,
  pork: Ham,
  chicken: Drumstick,
  seafood: Fish,
  vegetables: Carrot,
  'soups-noodles': Soup,
  snacks: Cookie,
  fruit: Apple,
  drinks: Coffee,
  'fast-food': Pizza,
  international: Globe,
  pantry: Dumbbell,
}

/** A tappable list of foods with their calories. */
function FoodRows({ foods, onPick }: { foods: FoodItem[]; onPick: (f: FoodItem) => void }) {
  return (
    <ul className="divide-y divide-border">
      {foods.map((f) => (
        <li key={f.id}>
          <button className="flex w-full items-center gap-3 py-2.5 text-left" onClick={() => onPick(f)}>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{f.name}</div>
              <div className="truncate text-xs text-muted-foreground">{f.note ?? f.serving}</div>
            </div>
            <div className="shrink-0 text-sm font-semibold">{f.kcal} kcal</div>
          </button>
        </li>
      ))}
    </ul>
  )
}

function AddFoodDialog({
  meal,
  date,
  userId,
  onClose,
  onAdded,
}: {
  meal: MealType | null
  date: string
  userId: string
  onClose: () => void
  onAdded: () => void
}) {
  const [step, setStep] = React.useState<Step>('search')
  const [query, setQuery] = React.useState('')
  const [picked, setPicked] = React.useState<FoodItem | null>(null)
  const [servings, setServings] = React.useState(1)
  // 'servings' = count of the food's own serving; 'amount' = an exact grams or ml figure
  const [mode, setMode] = React.useState<'servings' | 'amount'>('servings')
  const [amountText, setAmountText] = React.useState('')
  const [recent, setRecent] = React.useState<FoodLogEntry[]>([])
  const [tab, setTab] = React.useState<BrowseTab>('browse')
  const [category, setCategory] = React.useState<FoodCategoryId | null>(null)
  // Which foods to show first (Everyday / Filipino / All) and whether amounts are in grams or ounces. Both are remembered.
  const [region, setRegionState] = React.useState<FoodRegion>(loadRegion)
  const [units, setUnitsState] = React.useState<FoodUnits>(loadUnits)
  const setRegion = (r: FoodRegion) => {
    setRegionState(r)
    saveRegion(r)
  }
  const [favs, setFavs] = React.useState<FoodItem[]>([])
  const { profile, role } = useAuth()
  const proAccess = hasProAccess(profile, role)
  const [online, setOnline] = React.useState<FoodItem[]>([])
  const [onlineLoading, setOnlineLoading] = React.useState(false)
  const [onlineError, setOnlineError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [custom, setCustom] = React.useState({ name: '', kcal: '', p: '', c: '', f: '' })
  const open = meal !== null

  React.useEffect(() => {
    if (!open) return
    setStep('search')
    setQuery('')
    setPicked(null)
    setServings(1)
    setMode('servings')
    setTab('browse')
    setCategory(null)
    setFavs(loadFavorites())
    setError(null)
    setCustom({ name: '', kcal: '', p: '', c: '', f: '' })
    foodLog.listRecent(userId, 8).then(setRecent).catch(() => setRecent([]))
  }, [open, userId])

  const results = React.useMemo(() => regionFirst(searchFoods(query, 60), region).slice(0, 25), [query, region])

  // Groups and plates that have something to show for the chosen region
  const categories = React.useMemo(
    () =>
      FOOD_CATEGORIES.map((c) => ({
        ...c,
        foods: foodsInCategory(c.id).filter((f) => matchesRegion(isFilipinoFood(f), region)),
      })).filter((c) => c.foods.length > 0),
    [region],
  )
  const plates = React.useMemo(() => PLATES.filter((p) => matchesRegion(isFilipinoPlate(p), region)), [region])

  // Pro: also search the big online database, shortly after the person stops typing
  React.useEffect(() => {
    setOnline([])
    setOnlineError(null)
    const q = query.trim()
    if (!proAccess || q.length < 3) {
      setOnlineLoading(false)
      return
    }
    setOnlineLoading(true)
    let cancelled = false
    const timer = setTimeout(() => {
      foodLog
        .searchOnline(q)
        .then((foods) => !cancelled && setOnline(foods))
        // Whatever went wrong on the server (a blocked address, a daily limit), the person just sees this
        .catch(() => !cancelled && setOnlineError('More foods are temporarily unavailable. Your own list still works.'))
        .finally(() => !cancelled && setOnlineLoading(false))
    }, 450)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, proAccess])

  const choose = (food: FoodItem) => {
    setPicked(food)
    setServings(1)
    setMode('servings')
    setAmountText(food.amount ? shown(fromBase(food.amount, food.unit ?? 'g', units)) : '')
    setStep('amount')
  }

  const chooseRecent = (e: FoodLogEntry) =>
    choose({
      id: e.id,
      name: e.name,
      serving: e.serving,
      kcal: e.kcal / e.servings,
      proteinG: e.proteinG / e.servings,
      carbsG: e.carbsG / e.servings,
      fatG: e.fatG / e.servings,
      source: 'custom',
    })

  const save = async (food: FoodItem, count: number, label?: string) => {
    if (!meal) return
    setSaving(true)
    setError(null)
    try {
      await foodLog.add(userId, {
        date,
        meal,
        name: food.name,
        serving: label ?? food.serving,
        servings: label ? 1 : count,
        kcal: r1(food.kcal * count),
        proteinG: r1(food.proteinG * count),
        carbsG: r1(food.carbsG * count),
        fatG: r1(food.fatG * count),
      })
      onAdded()
    } catch {
      setError('Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // What the person typed is in their unit (g/ml or oz/fl oz); the food's numbers are per gram or ml
  const baseUnit = picked?.unit ?? 'g'
  const typedAmount = Math.max(0, Number(amountText) || 0)
  const exactAmount = toBase(typedAmount, baseUnit, units)
  const factor = picked ? (mode === 'amount' && picked.amount ? exactAmount / picked.amount : servings) : 0
  const unitName = unitLabel(baseUnit, units)
  const pickUnits = (u: FoodUnits) => {
    if (u === units) return
    // keep the same amount, just shown in the other unit
    if (amountText.trim() !== '') setAmountText(shown(fromBase(toBase(typedAmount, baseUnit, units), baseUnit, u)))
    setUnitsState(u)
    saveUnits(u)
  }
  const quickAmounts = units === 'metric' ? [50, 100, 150, 200, 250] : baseUnit === 'ml' ? [4, 8, 12, 16, 20] : [2, 4, 6, 8, 10]

  const mealLabel = MEALS.find((m) => m.id === meal)?.label ?? ''
  const num = (v: string) => Math.max(0, Number(v) || 0)

  return (
    <Dialog open={open} onClose={onClose} title={`Add to ${mealLabel}`} className="max-w-lg">
      <div className="max-h-[70vh] space-y-4 overflow-y-auto">
        {step === 'search' && (
          <>
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={region === 'everyday' ? 'Search food, e.g. chicken, rice, egg' : 'Search food, e.g. adobo, rice, egg'}
            />
            {query.trim() === '' && (
              <>
                <div className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-secondary/40 p-1">
                  {([['browse', 'Browse'], ['meals', 'Meals'], ['saved', 'Saved']] as const).map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => {
                        setTab(id)
                        setCategory(null)
                      }}
                      className={cn(
                        'rounded-lg py-2 text-sm font-semibold transition-colors',
                        tab === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {(tab === 'meals' || (tab === 'browse' && category === null)) && (
                  <div className="flex items-center gap-2" role="group" aria-label="Which foods to show">
                    <span className="text-xs font-semibold text-muted-foreground">Show</span>
                    {(['everyday', 'filipino', 'all'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRegion(r)}
                        aria-pressed={region === r}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                          region === r
                            ? 'border-primary bg-primary/15 text-primary'
                            : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {REGION_LABELS[r]}
                      </button>
                    ))}
                  </div>
                )}

                {tab === 'browse' && category === null && (
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map(({ id, label, foods }) => {
                      const Icon = CATEGORY_ICONS[id]
                      return (
                        <button
                          key={id}
                          onClick={() => setCategory(id)}
                          className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-3 py-3 text-left hover:bg-secondary"
                        >
                          <Icon className="h-5 w-5 shrink-0 text-primary" />
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold leading-tight">{label}</span>
                            <span className="block text-xs text-muted-foreground">{foods.length} foods</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {tab === 'browse' && category !== null && (
                  <div>
                    <button
                      onClick={() => setCategory(null)}
                      className="mb-1 flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
                    >
                      <ChevronLeft className="h-4 w-4" /> {FOOD_CATEGORIES.find((c) => c.id === category)?.label}
                    </button>
                    <FoodRows foods={foodsInCategory(category).filter((f) => matchesRegion(isFilipinoFood(f), region))} onPick={choose} />
                  </div>
                )}

                {tab === 'meals' && (
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">A whole plate in one tap. You can change the servings next.</p>
                    <FoodRows foods={plates} onPick={choose} />
                  </div>
                )}

                {tab === 'saved' && (
                  <div className="space-y-4">
                    <div>
                      <div className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Favorites</div>
                      {favs.length > 0 ? (
                        <FoodRows foods={favs} onPick={choose} />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Tap the star on any food to keep it here for quick adding.
                        </p>
                      )}
                    </div>
                    {recent.length > 0 && (
                      <div>
                        <div className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Recent</div>
                        <div className="flex flex-wrap gap-2">
                          {recent.map((e) => (
                            <button
                              key={e.id}
                              onClick={() => chooseRecent(e)}
                              className="rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                            >
                              {e.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            {query.trim() !== '' && (
              <>
                <FoodRows foods={results} onPick={choose} />
                {results.length === 0 && online.length === 0 && !onlineLoading && (
                  <p className="py-3 text-sm text-muted-foreground">No match. Try another word, or add it yourself.</p>
                )}
                {proAccess ? (
                  <div className="pt-3">
                    <div className="mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      <span>More foods</span>
                      <span className="normal-case tracking-normal font-semibold">
                        <a href="https://fdc.nal.usda.gov" target="_blank" rel="noreferrer" className="hover:text-foreground">
                          USDA
                        </a>
                        {' & '}
                        <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer" className="hover:text-foreground">
                          Open Food Facts
                        </a>
                      </span>
                    </div>
                    {onlineLoading && <p className="py-2 text-sm text-muted-foreground">Searching…</p>}
                    {onlineError && <p className="py-2 text-sm text-muted-foreground">{onlineError}</p>}
                    {online.length > 0 && <FoodRows foods={online} onPick={choose} />}
                  </div>
                ) : (
                  query.trim().length >= 3 && (
                    <p className="pt-3 text-xs text-muted-foreground">
                      Go Pro to search thousands more foods and brands.
                    </p>
                  )
                )}
              </>
            )}
            <Button variant="outline" className="w-full" onClick={() => setStep('custom')}>
              Can't find it? Add your own food
            </Button>
          </>
        )}

        {step === 'amount' && picked && (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-body text-lg font-bold">{picked.name}</div>
                <div className="text-sm text-muted-foreground">1 serving = {picked.serving}</div>
                {picked.note && <div className="mt-1 text-xs text-muted-foreground">{picked.note}</div>}
              </div>
              <button
                aria-label={favs.some((f) => f.name === picked.name && f.serving === picked.serving) ? 'Remove from favorites' : 'Add to favorites'}
                className="shrink-0 rounded-lg p-2 hover:bg-muted"
                onClick={() => setFavs(toggleFavorite(picked))}
              >
                <Star
                  className={cn(
                    'h-5 w-5',
                    isFavorite(picked) ? 'fill-primary text-primary' : 'text-muted-foreground',
                  )}
                />
              </button>
            </div>
            {picked.amount && (
              <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-secondary/40 p-1">
                {(['servings', 'amount'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={cn(
                      'rounded-lg py-2 text-sm font-semibold transition-colors',
                      mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {m === 'servings' ? 'Servings' : units === 'metric' ? (picked.unit === 'ml' ? 'Milliliters (ml)' : 'Grams (g)') : picked.unit === 'ml' ? 'Fluid ounces (fl oz)' : 'Ounces (oz)'}
                  </button>
                ))}
              </div>
            )}
            {mode === 'amount' && picked.amount ? (
              <div>
                <div className="flex items-center justify-center gap-2">
                  <Input
                    inputMode="decimal"
                    value={amountText}
                    onChange={(e) => setAmountText(e.target.value)}
                    className="h-14 w-32 text-center font-display text-3xl"
                    aria-label={`Amount in ${unitName}`}
                  />
                  <span className="text-lg font-semibold text-muted-foreground">{unitName}</span>
                </div>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {quickAmounts.map((v) => (
                    <button
                      key={v}
                      onClick={() => setAmountText(String(v))}
                      className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-semibold hover:bg-secondary"
                    >
                      {v} {unitName}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <span>Measure in</span>
                  {(['metric', 'imperial'] as const).map((u) => (
                    <button
                      key={u}
                      onClick={() => pickUnits(u)}
                      aria-pressed={units === u}
                      className={cn(
                        'rounded-full border px-3 py-1 font-semibold transition-colors',
                        units === u ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-secondary/50 hover:text-foreground',
                      )}
                    >
                      {unitLabel(baseUnit, u)}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                aria-label="Less"
                disabled={servings <= 0.5}
                onClick={() => setServings((s) => Math.max(0.5, s - 0.5))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="min-w-[5rem] text-center">
                <div className="font-display text-3xl tracking-wide">{servings}</div>
                <div className="text-xs text-muted-foreground">serving{servings === 1 ? '' : 's'}</div>
              </div>
              <Button variant="outline" size="sm" aria-label="More" onClick={() => setServings((s) => s + 0.5)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            )}
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                ['kcal', r0(picked.kcal * factor)],
                ['Protein', `${r1(picked.proteinG * factor)}g`],
                ['Carbs', `${r1(picked.carbsG * factor)}g`],
                ['Fat', `${r1(picked.fatG * factor)}g`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-secondary/50 px-1 py-2">
                  <div className="text-sm font-bold">{value}</div>
                  <div className="text-[11px] text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep('search')}>
                Back
              </Button>
              <Button
                className="flex-1"
                disabled={saving || !(factor > 0)}
                onClick={() =>
                  void save(picked, factor, mode === 'amount' && picked.amount ? `${amountText.trim() || 0} ${unitName}` : undefined)
                }
              >
                Add to {mealLabel}
              </Button>
            </div>
          </>
        )}

        {step === 'custom' && (
          <>
            <Input
              autoFocus
              value={custom.name}
              maxLength={80}
              onChange={(e) => setCustom({ ...custom, name: e.target.value })}
              placeholder="Food name"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                inputMode="decimal"
                value={custom.kcal}
                onChange={(e) => setCustom({ ...custom, kcal: e.target.value })}
                placeholder="Calories"
              />
              <Input
                inputMode="decimal"
                value={custom.p}
                onChange={(e) => setCustom({ ...custom, p: e.target.value })}
                placeholder="Protein g"
              />
              <Input
                inputMode="decimal"
                value={custom.c}
                onChange={(e) => setCustom({ ...custom, c: e.target.value })}
                placeholder="Carbs g"
              />
              <Input
                inputMode="decimal"
                value={custom.f}
                onChange={(e) => setCustom({ ...custom, f: e.target.value })}
                placeholder="Fat g"
              />
            </div>
            <p className="text-xs text-muted-foreground">Numbers for what you ate, in total.</p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep('search')}>
                Back
              </Button>
              <Button
                className="flex-1"
                disabled={saving || !custom.name.trim() || !(num(custom.kcal) > 0)}
                onClick={() =>
                  void save(
                    {
                      id: 'custom',
                      name: custom.name.trim(),
                      serving: '1 serving',
                      kcal: num(custom.kcal),
                      proteinG: num(custom.p),
                      carbsG: num(custom.c),
                      fatG: num(custom.f),
                      source: 'custom',
                    },
                    1,
                  )
                }
              >
                Add to {mealLabel}
              </Button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  )
}
