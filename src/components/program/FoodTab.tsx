import * as React from 'react'
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  History,
  Minus,
  Moon,
  Plus,
  ScanBarcode,
  Search,
  Star,
  Sun,
  Sunrise,
  Sunset,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { foodLog } from '@/lib/backend/api'
import { searchFoods } from '@/lib/foods/filipinoFoods'
import { isFavorite, loadFavorites, toggleFavorite } from '@/lib/foods/favorites'
import { CATEGORY_LABELS, RECIPES, filterRecipes, recipeToFood, type Recipe, type RecipeCategory } from '@/lib/cookbook/cookbook'
import { CookbookFilters, RecipeCard, RecipeDetail } from './CookbookParts'
import { BarcodeScan } from './BarcodeScan'
import { clearSearches, forgetSearch, loadRecentSearches, rememberSearch } from '@/lib/foods/recentSearches'
import { isFilipinoPlate, PLATES } from '@/lib/foods/plates'
import {
  fromBase,
  loadRegion,
  loadUnits,
  matchesRegion,
  regionFirst,
  saveUnits,
  toBase,
  unitLabel,
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

const MEAL_STYLE: Record<MealType, { icon: LucideIcon; tint: string }> = {
  breakfast: { icon: Sunrise, tint: 'bg-muted text-foreground' },
  lunch: { icon: Sun, tint: 'bg-muted text-foreground' },
  dinner: { icon: Sunset, tint: 'bg-muted text-foreground' },
  snack: { icon: Moon, tint: 'bg-muted text-foreground' },
}

/**
 * Every row of the diary uses the same five columns so the numbers line up from the top summary down through each meal and
 * each food: fat, carbs, protein, % of the day's calorie goal, then calories (or the buttons) on the right.
 */
const COLS = 'grid grid-cols-[1fr_1fr_1fr_4.5rem] items-center gap-1'
const NUM = 'text-center tabular-nums'
const f1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1)

/** One macro of the day's summary: what was eaten, its target and a slim bar. */
function SummaryFigure({ label, eaten }: { label: string; eaten: number }) {
  return (
    <div className="min-w-0 text-center">
      <div className="text-[11px] font-semibold text-muted-foreground">{label}</div>
      <div className="font-body text-lg font-bold leading-tight tabular-nums">{f1(eaten)}</div>
    </div>
  )
}

export function FoodTab({ nutrition, userId }: { nutrition: NutritionPlan; userId: string }) {
  const [date, setDate] = React.useState(() => dayKey(new Date()))
  const [entries, setEntries] = React.useState<FoodLogEntry[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [addMeal, setAddMeal] = React.useState<MealType | null>(null)
  // Meals whose items are opened (they start closed, like the macro row under each meal)
  const [openMeals, setOpenMeals] = React.useState<Set<MealType>>(new Set())
  // True until the first load finishes (then switching days does not flash the placeholders again)
  const firstLoad = React.useRef(true)

  const load = React.useCallback(async () => {
    try {
      setEntries(await foodLog.listForDate(userId, date))
      setError(null)
    } catch {
      setError('Could not load your food log. Check your connection and try again.')
    } finally {
      setLoading(false)
      firstLoad.current = false
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
  const today = dayKey(new Date())

  const remove = async (id: string) => {
    setEntries((list) => list.filter((e) => e.id !== id))
    try {
      await foodLog.delete(id, userId)
    } catch {
      setError('Could not delete that item.')
      void load()
    }
  }

  const toggleMeal = (id: MealType) =>
    setOpenMeals((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  if (loading && firstLoad.current && !error) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" aria-label="Previous day" onClick={() => setDate((d) => shiftDay(d, -1))}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="font-display text-xl tracking-wide">{dayLabel(date)}</div>
        <div className="flex items-center">
          {/* A calendar button: the real date picker sits invisibly on top, so the phone's own picker opens */}
          <label className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-foreground hover:bg-secondary" aria-label="Pick a day">
            <CalendarDays className="h-5 w-5" />
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => e.target.value && e.target.value <= today && setDate(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Pick a day"
            />
          </label>
          <Button variant="ghost" size="sm" aria-label="Next day" disabled={date >= today} onClick={() => setDate((d) => shiftDay(d, 1))}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* The day at a glance: fat, carbs and protein eaten so far, and calories */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-start gap-3">
            <SummaryFigure label="Fat" eaten={totals.f} />
            <SummaryFigure label="Carbs" eaten={totals.c} />
            <SummaryFigure label="Protein" eaten={totals.p} />
            <div className="min-w-0 text-right">
              <div className="text-[11px] font-semibold text-muted-foreground">Calories</div>
              <div className="font-display text-3xl leading-none tracking-wide tabular-nums">{r0(totals.kcal).toLocaleString('en-PH')}</div>
              <div className={cn('text-[10px]', over ? 'text-destructive' : 'text-muted-foreground')}>
                {Math.abs(r0(left)).toLocaleString('en-PH')} {over ? 'over' : 'left'}
              </div>
            </div>
          </div>
          <Progress value={(totals.kcal / target) * 100} barClassName={over ? 'bg-destructive' : undefined} className="mt-3 h-2" />
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {MEALS.map(({ id, label }) => {
        const items = entries.filter((e) => e.meal === id)
        const kcal = items.reduce((s, e) => s + e.kcal, 0)
        const sum = items.reduce((t, e) => ({ p: t.p + e.proteinG, c: t.c + e.carbsG, f: t.f + e.fatG }), { p: 0, c: 0, f: 0 })
        const { icon: Icon, tint } = MEAL_STYLE[id]
        const opened = openMeals.has(id)
        return (
          <Card key={id} className="overflow-hidden">
            <div className="flex items-center gap-3 p-3 pl-4">
              <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', tint)}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1 font-body text-lg font-bold">{label}</div>
              {items.length > 0 && (
                <div className="text-right">
                  <div className="font-display text-2xl leading-none tracking-wide tabular-nums">{r0(kcal).toLocaleString('en-PH')}</div>
                  <div className="text-[11px] text-muted-foreground">Calories</div>
                </div>
              )}
              <button
                aria-label={`Add food to ${label}`}
                onClick={() => setAddMeal(id)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform active:scale-95"
              >
                <Plus className="h-6 w-6" />
              </button>
            </div>
            {items.length > 0 && (
              <>
                <button
                  onClick={() => toggleMeal(id)}
                  aria-expanded={opened}
                  aria-label={`${opened ? 'Hide' : 'Show'} what is in ${label}`}
                  className={cn(COLS, 'min-h-[44px] w-full bg-secondary/60 px-4 text-sm text-foreground')}
                >
                  <span className={NUM}>{f1(sum.f)}</span>
                  <span className={NUM}>{f1(sum.c)}</span>
                  <span className={NUM}>{f1(sum.p)}</span>
                  <span className="flex justify-end">
                    <ChevronDown className={cn('h-5 w-5 text-muted-foreground transition-transform', opened && 'rotate-180')} />
                  </span>
                </button>
                {opened && (
                  <ul className="divide-y divide-border px-4">
                    {items.map((e) => (
                      <li key={e.id} className="py-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-bold">{e.name}</div>
                            <div className="text-xs font-semibold text-primary">{e.servings === 1 ? e.serving : `${e.servings} × ${e.serving}`}</div>
                          </div>
                          <div className="shrink-0 text-base font-bold tabular-nums">{r0(e.kcal)}</div>
                        </div>
                        <div className={cn(COLS, 'mt-1 text-sm text-muted-foreground')}>
                          <span className={NUM}>{f1(e.fatG)}</span>
                          <span className={NUM}>{f1(e.carbsG)}</span>
                          <span className={NUM}>{f1(e.proteinG)}</span>
                          <span className="flex justify-end">
                            <button
                              aria-label={`Remove ${e.name}`}
                              className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive"
                              onClick={() => void remove(e.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
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
        onAdded={(m) => {
          setAddMeal(null)
          // Show what was just added
          setOpenMeals((s) => new Set(s).add(m))
          void load()
        }}
      />
    </div>
  )
}

type Step = 'search' | 'amount' | 'custom' | 'recipe' | 'scan'

/** A number for display in a box: whole when it can be, else one decimal. */
const shown = (n: number) => String(Math.round(n * 10) / 10)
type BrowseTab = 'cookbook' | 'food' | 'meals' | 'recent' | 'saved'

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
  onAdded: (meal: MealType) => void
}) {
  const [step, setStep] = React.useState<Step>('search')
  const [query, setQuery] = React.useState('')
  const [picked, setPicked] = React.useState<FoodItem | null>(null)
  const [servings, setServings] = React.useState(1)
  // 'servings' = count of the food's own serving; 'amount' = an exact grams or ml figure
  const [mode, setMode] = React.useState<'servings' | 'amount'>('servings')
  const [amountText, setAmountText] = React.useState('')
  const [recent, setRecent] = React.useState<FoodLogEntry[]>([])
  const [tab, setTab] = React.useState<BrowseTab>('food')
  // The meal can be changed from the title; it starts as the one that was tapped
  const [mealSel, setMealSel] = React.useState<MealType>(meal ?? 'breakfast')
  const [searches, setSearches] = React.useState<string[]>([])
  // The cookbook: what is being browsed and which recipe is open
  const [cbCategory, setCbCategory] = React.useState<RecipeCategory | 'all'>('all')
  const [cbTags, setCbTags] = React.useState<string[]>([])
  const [openRecipe, setOpenRecipe] = React.useState<Recipe | null>(null)
  const [recipeCount, setRecipeCount] = React.useState(1)
  // Which foods come first follows where the person is (the Philippines: everything, elsewhere: everyday foods first)
  const region = React.useMemo(loadRegion, [])
  const [units, setUnitsState] = React.useState<FoodUnits>(loadUnits)
  const [favs, setFavs] = React.useState<FoodItem[]>([])
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
    setTab('food')
    setFavs(loadFavorites())
    setSearches(loadRecentSearches())
    setCbCategory('all')
    setCbTags([])
    setOpenRecipe(null)
    setRecipeCount(1)
    if (meal) setMealSel(meal)
    setError(null)
    setCustom({ name: '', kcal: '', p: '', c: '', f: '' })
    foodLog.listRecent(userId, 40).then(setRecent).catch(() => setRecent([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId])

  const results = React.useMemo(() => regionFirst(searchFoods(query, 60), region).slice(0, 25), [query, region])

  const plates = React.useMemo(() => PLATES.filter((p) => matchesRegion(isFilipinoPlate(p), region)), [region])

  // Pro: also search the big online database, shortly after the person stops typing
  React.useEffect(() => {
    setOnline([])
    setOnlineError(null)
    const q = query.trim()
    if (q.length < 3 || tab === 'cookbook') {
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
  }, [query, tab])

  const choose = (food: FoodItem) => {
    // A search that led to a food is worth remembering
    if (query.trim()) setSearches(rememberSearch(query))
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
    const chosen = mealSel
    setSaving(true)
    setError(null)
    try {
      await foodLog.add(userId, {
        date,
        meal: chosen,
        name: food.name,
        serving: label ?? food.serving,
        servings: label ? 1 : count,
        kcal: r1(food.kcal * count),
        proteinG: r1(food.proteinG * count),
        carbsG: r1(food.carbsG * count),
        fatG: r1(food.fatG * count),
      })
      // Lets badges notice a first meal or a week of logging
      window.dispatchEvent(new Event('myfit:food-saved'))
      onAdded(chosen)
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

  const mealLabel = MEALS.find((m) => m.id === mealSel)?.label ?? ''
  const num = (v: string) => Math.max(0, Number(v) || 0)

  // Foods the person ate before, newest first, each one once
  const recentFoods = React.useMemo(() => {
    const seen = new Set<string>()
    return recent.filter((e) => {
      const key = `${e.name}|${e.serving}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [recent])

  const heading =
    step === 'amount' ? 'Amount' : step === 'custom' ? 'Add your own food' : step === 'recipe' ? 'Recipe' : step === 'scan' ? 'Scan barcode' : null

  const cookbookList = React.useMemo(() => filterRecipes(RECIPES, { category: cbCategory, tags: cbTags }), [cbCategory, cbTags])
  // Typing in the search box on the Cookbook tab searches the recipes; on every other tab it searches foods only
  const matchingRecipes = React.useMemo(() => filterRecipes(RECIPES, { query, category: cbCategory, tags: cbTags }), [query, cbCategory, cbTags])
  const showRecipe = (r: Recipe) => {
    setOpenRecipe(r)
    setRecipeCount(1)
    setStep('recipe')
  }

  return (
    <Dialog open={open} onClose={onClose} title={`Add to ${mealLabel}`} screen>
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex shrink-0 items-center gap-1 border-b border-border px-2 py-2">
          <button
            aria-label={step === 'search' ? 'Close' : 'Back'}
            onClick={step === 'search' ? onClose : () => setStep('search')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-muted"
          >
            {step === 'search' ? <X className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
          </button>
          <div className="relative min-w-0">
            <div className="flex items-center gap-1 font-body text-xl font-bold leading-tight">
              {heading ?? mealLabel}
              {!heading && <ChevronDown className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div className="text-xs text-muted-foreground">{heading ? `${mealLabel} · ${dayLabel(date)}` : dayLabel(date)}</div>
            {/* The meal can be changed without leaving: the phone's own list opens on top of the title */}
            {!heading && (
              <select
                value={mealSel}
                onChange={(e) => setMealSel(e.target.value as MealType)}
                aria-label="Meal"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              >
                {MEALS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </header>

        <div className={cn('min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4', step === 'recipe' ? 'pb-0' : 'pb-10')}>
          {step === 'search' && (
            <>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={region === 'everyday' ? 'Search food, e.g. chicken, rice, egg' : 'Search food, e.g. adobo, rice, egg'}
                  className="h-12 rounded-full pl-11 pr-11"
                />
                {query !== '' ? (
                  <button
                    aria-label="Clear search"
                    onClick={() => setQuery('')}
                    className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                ) : (
                  <button
                    aria-label="Scan a barcode"
                    onClick={() => setStep('scan')}
                    className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <ScanBarcode className="h-5 w-5" />
                  </button>
                )}
              </div>

              {query.trim() === '' && (
                <>
                  <div className="-mx-4 flex overflow-x-auto border-b border-border px-4" role="tablist">
                    {([['cookbook', 'Cookbook'], ['food', 'Food'], ['meals', 'Meals'], ['recent', 'Recent'], ['saved', 'Saved']] as const).map(([id, label]) => (
                      <button
                        key={id}
                        role="tab"
                        aria-selected={tab === id}
                        onClick={() => setTab(id)}
                        className={cn(
                          'min-h-[44px] shrink-0 whitespace-nowrap border-b-2 px-3 text-sm font-bold uppercase tracking-wide transition-colors',
                          tab === id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {tab === 'cookbook' && (
                    <div className="space-y-4">
                      <CookbookFilters
                        category={cbCategory}
                        onCategory={setCbCategory}
                        tags={cbTags}
                        onToggleTag={(t) => setCbTags((list) => (list.includes(t) ? list.filter((x) => x !== t) : [...list, t]))}
                      />
                      {cbCategory === 'all' && cbTags.length === 0 && (
                        <div className="rounded-2xl border border-border bg-card p-4">
                          <div className="text-xs font-bold uppercase tracking-widest text-primary">New in the cookbook</div>
                          <p className="mt-1 text-sm">
                            Protein desserts: cookie dough bites, pancakes, ice cream and more. Sweet, with real protein and a photo and steps for every recipe.
                          </p>
                          <button onClick={() => setCbCategory('dessert')} className="mt-2 min-h-[44px] text-sm font-bold text-primary">
                            See {CATEGORY_LABELS.dessert.toLowerCase()}
                          </button>
                        </div>
                      )}
                      {cookbookList.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                          {cookbookList.map((r) => (
                            <RecipeCard key={r.id} recipe={r} onOpen={showRecipe} />
                          ))}
                        </div>
                      ) : (
                        <p className="py-4 text-sm text-muted-foreground">No recipes match these filters. Try removing one.</p>
                      )}
                    </div>
                  )}

                  {tab === 'food' && (
                    <>
                      {searches.length > 0 ? (
                        <div>
                          <div className="mb-1 flex items-center justify-between">
                            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recent searches</div>
                            <button onClick={() => setSearches(clearSearches())} className="min-h-[44px] px-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
                              Clear
                            </button>
                          </div>
                          <ul className="divide-y divide-border">
                            {searches.map((q) => (
                              <li key={q} className="flex items-center">
                                <button onClick={() => setQuery(q)} className="flex min-h-[48px] flex-1 items-center gap-4 text-left">
                                  <History className="h-5 w-5 shrink-0 text-muted-foreground" />
                                  <span className="truncate text-base">{q}</span>
                                </button>
                                <button
                                  aria-label={`Remove ${q} from recent searches`}
                                  onClick={() => setSearches(forgetSearch(q))}
                                  className="flex h-11 w-11 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="py-4 text-sm text-muted-foreground">Type a food above to search. Your searches will show up here.</p>
                      )}
                    </>
                  )}

                  {tab === 'meals' && (
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">A whole plate in one tap. You can change the servings next.</p>
                      <FoodRows foods={plates} onPick={choose} />
                    </div>
                  )}

                  {tab === 'recent' &&
                    (recentFoods.length > 0 ? (
                      <ul className="divide-y divide-border">
                        {recentFoods.map((e) => (
                          <li key={e.id}>
                            <button className="flex min-h-[52px] w-full items-center gap-3 py-2 text-left" onClick={() => chooseRecent(e)}>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-semibold">{e.name}</div>
                                <div className="truncate text-xs text-muted-foreground">{e.serving}</div>
                              </div>
                              <div className="shrink-0 text-sm font-semibold">{r0(e.kcal / e.servings)} kcal</div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="py-4 text-sm text-muted-foreground">Foods you log will show up here, so adding them again takes one tap.</p>
                    ))}

                  {tab === 'saved' &&
                    (favs.length > 0 ? (
                      <FoodRows foods={favs} onPick={choose} />
                    ) : (
                      <p className="py-4 text-sm text-muted-foreground">Tap the star on any food to keep it here for quick adding.</p>
                    ))}
                </>
              )}

              {query.trim() !== '' && tab === 'cookbook' && (
                <div className="space-y-3">
                  {matchingRecipes.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {matchingRecipes.map((r) => (
                        <RecipeCard key={r.id} recipe={r} onOpen={showRecipe} />
                      ))}
                    </div>
                  ) : (
                    <p className="py-3 text-sm text-muted-foreground">No recipes match. Try another word.</p>
                  )}
                </div>
              )}
              {query.trim() !== '' && tab !== 'cookbook' && (
                <>
                  <FoodRows foods={results} onPick={choose} />
                  {results.length === 0 && online.length === 0 && !onlineLoading && (
                    <p className="py-3 text-sm text-muted-foreground">No match. Try another word, or add it yourself.</p>
                  )}
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
                </>
              )}
              <Button variant="outline" className="w-full gap-2" onClick={() => setStep('scan')}>
                <ScanBarcode className="h-4 w-4" /> Scan a barcode
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setStep('custom')}>
                Can't find it? Add your own food
              </Button>
            </>
          )}

          {step === 'scan' && (
            <BarcodeScan onFood={choose} onAddOwn={() => setStep('custom')} />
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
                          'min-h-[44px] rounded-full border px-4 font-semibold transition-colors sm:min-h-0 sm:px-3 sm:py-1',
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
              <Button
                className="h-12 w-full"
                disabled={saving || !(factor > 0)}
                onClick={() =>
                  void save(picked, factor, mode === 'amount' && picked.amount ? `${amountText.trim() || 0} ${unitName}` : undefined)
                }
              >
                Add to {mealLabel}
              </Button>
            </>
          )}

          {step === 'recipe' && openRecipe && (
            <RecipeDetail
              recipe={openRecipe}
              mealLabel={mealLabel}
              count={recipeCount}
              onCount={setRecipeCount}
              saving={saving}
              error={error}
              onAdd={() => void save(recipeToFood(openRecipe), recipeCount)}
            />
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
              <Button
                className="h-12 w-full"
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
            </>
          )}
        </div>
      </div>
    </Dialog>
  )
}
