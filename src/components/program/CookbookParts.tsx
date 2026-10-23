import * as React from 'react'
import { Clock, EggFried, IceCreamCone, Minus, Plus, Salad, Users, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CATEGORY_LABELS, FILTER_TAGS, type Recipe, type RecipeCategory } from '@/lib/cookbook/cookbook'
import { cn } from '@/lib/utils'

const CATEGORY_LOOK: Record<RecipeCategory, { icon: LucideIcon; tint: string }> = {
  dessert: { icon: IceCreamCone, tint: 'from-muted to-muted text-muted-foreground' },
  breakfast: { icon: EggFried, tint: 'from-muted to-muted text-muted-foreground' },
  main: { icon: UtensilsCrossed, tint: 'from-muted to-muted text-muted-foreground' },
  snack: { icon: Salad, tint: 'from-muted to-muted text-muted-foreground' },
}

/** The recipe photo, or a soft colored tile with an icon while a recipe has no photo (or the photo fails to load). */
export function RecipeImage({ recipe, className }: { recipe: Recipe; className?: string }) {
  const [failed, setFailed] = React.useState(false)
  const { icon: Icon, tint } = CATEGORY_LOOK[recipe.category]
  if (recipe.photo && !failed) {
    return (
      <img
        src={recipe.photo}
        alt={recipe.title}
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn('h-full w-full object-cover', className)}
      />
    )
  }
  return (
    <div className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br', tint, className)} aria-hidden>
      <Icon className="h-10 w-10 opacity-80" />
    </div>
  )
}

/** Category and filter chips above the recipe grid. */
export function CookbookFilters({
  category,
  onCategory,
  tags,
  onToggleTag,
}: {
  category: RecipeCategory | 'all'
  onCategory: (c: RecipeCategory | 'all') => void
  tags: string[]
  onToggleTag: (t: string) => void
}) {
  const cats: [RecipeCategory | 'all', string][] = [['all', 'All'], ...(Object.entries(CATEGORY_LABELS) as [RecipeCategory, string][])]
  return (
    <div className="space-y-2">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Recipe type">
        {cats.map(([id, label]) => (
          <button
            key={id}
            onClick={() => onCategory(id)}
            aria-pressed={category === id}
            className={cn(
              'min-h-[44px] shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition-colors',
              category === id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filters">
        {FILTER_TAGS.map((t) => (
          <button
            key={t}
            onClick={() => onToggleTag(t)}
            aria-pressed={tags.includes(t)}
            className={cn(
              'min-h-[36px] shrink-0 whitespace-nowrap rounded-full border px-3 text-xs font-semibold transition-colors',
              tags.includes(t) ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  )
}

export function RecipeCard({ recipe, onOpen }: { recipe: Recipe; onOpen: (r: Recipe) => void }) {
  return (
    <button onClick={() => onOpen(recipe)} className="group overflow-hidden rounded-2xl border border-border bg-card text-left transition-colors hover:border-primary/40">
      <div className="aspect-[4/3] w-full overflow-hidden">
        <RecipeImage recipe={recipe} className="transition-transform duration-300 group-hover:scale-105" />
      </div>
      <div className="p-3">
        <div className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-tight">{recipe.title}</div>
        <div className="mt-1.5 text-xs text-muted-foreground">
          {recipe.kcal} kcal · <span className="font-semibold text-foreground">{Math.round(recipe.proteinG)} g protein</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" /> {recipe.minutes} min
        </div>
      </div>
    </button>
  )
}

/** One recipe in full: photo, numbers, ingredients and the steps. The button at the bottom logs it. */
export function RecipeDetail({
  recipe,
  mealLabel,
  count,
  onCount,
  onAdd,
  saving,
  error,
}: {
  recipe: Recipe
  mealLabel: string
  count: number
  onCount: (n: number) => void
  onAdd: () => void
  saving: boolean
  error: string | null
}) {
  const stats = [
    ['kcal', Math.round(recipe.kcal * count)],
    ['Protein', `${Math.round(recipe.proteinG * count * 10) / 10}g`],
    ['Carbs', `${Math.round(recipe.carbsG * count * 10) / 10}g`],
    ['Fat', `${Math.round(recipe.fatG * count * 10) / 10}g`],
  ]
  return (
    <div className="-mx-4 -mt-4">
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <RecipeImage recipe={recipe} />
        {recipe.photo && recipe.photoCredit && (
          <a
            href={recipe.photoCredit.url}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-1.5 right-2 rounded bg-black/45 px-1.5 py-0.5 text-[10px] text-white/90"
          >
            Photo: {recipe.photoCredit.name} · {recipe.photoCredit.source}
          </a>
        )}
      </div>
      <div className="space-y-5 px-4 pt-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-primary">{CATEGORY_LABELS[recipe.category]}</div>
          <h2 className="mt-1 font-display text-3xl leading-tight tracking-wide">{recipe.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{recipe.blurb}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5">
              <Clock className="h-3.5 w-3.5" /> {recipe.minutes} min
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5">
              <Users className="h-3.5 w-3.5" /> Makes {recipe.servings} {recipe.servings === 1 ? 'serving' : 'servings'}
            </span>
            {recipe.tags.slice(0, 3).map((t) => (
              <span key={t} className="rounded-full border border-border px-3 py-1.5 text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Per serving ({recipe.serves})
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              ['kcal', recipe.kcal],
              ['Protein', `${recipe.proteinG}g`],
              ['Carbs', `${recipe.carbsG}g`],
              ['Fat', `${recipe.fatG}g`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-secondary/50 px-1 py-2">
                <div className="text-sm font-bold">{value}</div>
                <div className="text-[11px] text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Ingredients</div>
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {recipe.ingredients.map(([key, , label]) => (
              <li key={key + label} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {label}
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-xs text-muted-foreground">These amounts make {recipe.servings === 1 ? '1 serving' : `${recipe.servings} servings`}. Salt, pepper and water are up to you.</p>
        </div>

        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">How to make it</div>
          <ol className="space-y-3">
            {recipe.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-display text-base text-primary-foreground">
                  {i + 1}
                </span>
                <p className="pt-0.5 text-sm leading-relaxed">{s}</p>
              </li>
            ))}
          </ol>
        </div>

        <p className="text-xs text-muted-foreground">
          Numbers are worked out from the ingredients and are approximate. Brands and portions change them a little.
        </p>

        <div className="sticky bottom-0 -mx-4 space-y-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" aria-label="Less" disabled={count <= 0.5} onClick={() => onCount(Math.max(0.5, count - 0.5))}>
                <Minus className="h-4 w-4" />
              </Button>
              <div className="min-w-[4.5rem] text-center">
                <div className="font-display text-2xl leading-none tracking-wide">{count}</div>
                <div className="text-[11px] text-muted-foreground">{count === 1 ? recipe.serves : `× ${recipe.serves}`}</div>
              </div>
              <Button variant="outline" size="sm" aria-label="More" onClick={() => onCount(count + 0.5)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              {stats.map(([l, v]) => (
                <span key={l} className={l === 'kcal' ? 'block text-sm font-bold text-foreground' : 'mr-2'}>
                  {l === 'kcal' ? `${v} kcal` : `${String(l).charAt(0)} ${v}`}
                </span>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="h-12 w-full" disabled={saving} onClick={onAdd}>
            Add to {mealLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
