// Run with: npm run test:macros
// Checks the macro split: 40% carbs / 30% protein / 30% fat of the calories, with protein kept between 1.6 and 2.4 g per kg.
import { calculateNutrition, MACROS } from '../src/lib/tdee'

const problems: string[] = []
const check = (label: string, ok: boolean, detail = '') => {
  if (!ok) problems.push(`${label}${detail ? ': ' + detail : ''}`)
}

const goals = ['lose-weight', 'build-muscle', 'strength-power', 'body-recomposition'] as const
const activity = ['sedentary', 'light', 'moderate', 'active', 'athlete'] as const
let people = 0
let exact = 0
let clamped = 0

for (const sex of ['male', 'female'] as const)
  for (const weight of [90, 110, 130, 150, 170, 190, 220, 260, 300, 340])
    for (const feet of [4, 5, 6])
      for (const act of activity)
        for (const goal of goals)
          for (const age of [18, 30, 55, 75]) {
            const answers: any = {
              sex, age, weight, weightUnit: 'lbs', heightFeet: feet, heightInches: 6, experience: '2-3', activityLevel: act,
              sleepHours: '7-8', sleepQuality: 'good', stressLevel: 'moderate', trainingDays: 4, goal, equipment: 'full-gym', focusAreas: [], injuries: 'none',
            }
            const n = calculateNutrition(answers)
            const kg = weight * 0.45359237
            const label = `${sex} ${weight}lb ${feet}ft ${act} ${goal} age ${age}`
            people++
            const pk = n.proteinG * 4
            const ck = n.carbsG * 4
            const fk = n.fatG * 9
            const total = pk + ck + fk
            // the three add up to the calorie target (within rounding)
            check(`calories add up (${label})`, Math.abs(total - n.calorieTarget) <= 25, `${total} vs ${n.calorieTarget}`)
            // protein within the safe range for body weight (a gram of rounding allowed)
            const perKg = n.proteinG / kg
            check(`protein per kg (${label})`, perKg >= MACROS.proteinMinPerKg - 0.02 && perKg <= MACROS.proteinMaxPerKg + 0.02, perKg.toFixed(2))
            check(`carbs and fat are positive (${label})`, n.carbsG > 0 && n.fatG > 0)
            // carbs and fat keep the 40:30 proportion of what protein leaves
            check(`carb:fat stays 4:3 (${label})`, Math.abs(ck / fk - 4 / 3) < 0.05, (ck / fk).toFixed(2))
            const pPct = pk / total
            if (Math.abs(pPct - 0.3) < 0.01) {
              exact++
              check(`exact split (${label})`, Math.abs(ck / total - 0.4) < 0.01 && Math.abs(fk / total - 0.3) < 0.01, `${Math.round(pPct * 100)}/${Math.round((ck / total) * 100)}/${Math.round((fk / total) * 100)}`)
            } else clamped++
          }

// The ordinary case is the exact 40/30/30
// (Where the 2.4 g/kg protein limit applies, the split sits a little off: that is the point of the limit.)
check('a good share of people get the exact split', exact / people > 0.4, `${exact} of ${people}`)

// A known example: a 170 lb man building muscle
const man = calculateNutrition({ sex: 'male', age: 30, weight: 170, weightUnit: 'lbs', heightFeet: 5, heightInches: 9, experience: '2-3', activityLevel: 'moderate', sleepHours: '7-8', sleepQuality: 'good', stressLevel: 'moderate', trainingDays: 4, goal: 'build-muscle', equipment: 'full-gym', focusAreas: [], injuries: 'none' } as any)
check('170 lb man, build muscle: protein held at 2.4 g/kg (185 g)', man.proteinG === 185, `${man.proteinG} g`)
check('170 lb man, build muscle: carbs and fat fill the rest', man.carbsG === 314 && man.fatG === 105, `${man.carbsG} / ${man.fatG}`)
const woman = calculateNutrition({ sex: 'female', age: 30, weight: 130, weightUnit: 'lbs', heightFeet: 5, heightInches: 4, experience: '2-3', activityLevel: 'moderate', sleepHours: '7-8', sleepQuality: 'good', stressLevel: 'moderate', trainingDays: 4, goal: 'lose-weight', equipment: 'full-gym', focusAreas: [], injuries: 'none' } as any)
check('130 lb woman, lose weight: the exact 40/30/30', Math.abs((woman.proteinG * 4) / woman.calorieTarget - 0.3) < 0.01 && Math.abs((woman.carbsG * 4) / woman.calorieTarget - 0.4) < 0.01, `${woman.proteinG}/${woman.carbsG}/${woman.fatG} g of ${woman.calorieTarget}`)

if (problems.length) {
  console.log('FAILED (' + problems.length + ')')
  for (const p of problems.slice(0, 20)) console.log(' - ' + p)
  process.exit(1)
}
console.log(`PASSED: ${people} people checked. ${exact} get the exact 40/30/30; ${clamped} have protein held inside 1.6-2.4 g/kg.`)
