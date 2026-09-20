import { GOAL_LABELS } from '@/lib/tdee'
import type { WorkoutProgram } from '@/lib/types'

export function ProgramPrintView({ program }: { program: WorkoutProgram }) {
  const { programData: p, nutrition: n } = program

  return (
    <div className="hidden print:block bg-white text-black p-8 font-sans text-sm leading-relaxed">
      <h1 className="text-3xl font-bold mb-1">{p.programName}</h1>
      <p className="text-gray-600 mb-4">{p.tagline}</p>
      <p className="text-xs text-gray-500 mb-6">
        Goal: {GOAL_LABELS[program.answers.goal]} &middot; Generated {new Date(program.createdAt).toLocaleDateString()} by FORGEFIT
      </p>

      <h2 className="text-xl font-bold border-b border-gray-300 pb-1 mb-2">Overview</h2>
      <p className="mb-2">{p.overview}</p>
      <p className="mb-1"><strong>Weekly Volume:</strong> {p.weeklyVolume}</p>
      <p className="mb-4"><strong>Progression:</strong> {p.progressionStrategy}</p>

      {p.personalizationNotes?.length > 0 && (
        <>
          <h2 className="text-xl font-bold border-b border-gray-300 pb-1 mb-2 mt-6">Why This Program Is Built For You</h2>
          <ul className="list-disc list-inside mb-4">
            {p.personalizationNotes.map((note, i) => <li key={i}>{note}</li>)}
          </ul>
        </>
      )}

      <h2 className="text-xl font-bold border-b border-gray-300 pb-1 mb-2 mt-6">Warm-Up</h2>
      <ul className="list-disc list-inside mb-4">
        {p.warmup.map((w, i) => <li key={i}>{w}</li>)}
      </ul>

      <h2 className="text-xl font-bold border-b border-gray-300 pb-1 mb-2 mt-6">Weekly Training Plan</h2>
      {p.days.map((day) => (
        <div key={day.day} className="mb-5 break-inside-avoid">
          <h3 className="text-lg font-bold mt-3">
            Day {day.day}: {day.name} <span className="font-normal text-gray-600">({day.duration})</span>
          </h3>
          <p className="text-gray-600 mb-1 capitalize">{day.focus}</p>
          <table className="w-full border-collapse text-xs mt-2">
            <thead>
              <tr className="border-b border-gray-400 text-left">
                <th className="py-1 pr-2">Exercise</th>
                <th className="py-1 pr-2">Sets</th>
                <th className="py-1 pr-2">Reps</th>
                <th className="py-1 pr-2">Rest</th>
                <th className="py-1">Notes</th>
              </tr>
            </thead>
            <tbody>
              {day.exercises.map((ex, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="py-1 pr-2 font-semibold">{ex.name}</td>
                  <td className="py-1 pr-2">{ex.sets}</td>
                  <td className="py-1 pr-2">{ex.reps}</td>
                  <td className="py-1 pr-2">{ex.rest}</td>
                  <td className="py-1 text-gray-600">{ex.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <h2 className="text-xl font-bold border-b border-gray-300 pb-1 mb-2 mt-6">Cool-Down</h2>
      <ul className="list-disc list-inside mb-4">
        {p.cooldown.map((w, i) => <li key={i}>{w}</li>)}
      </ul>

      <h2 className="text-xl font-bold border-b border-gray-300 pb-1 mb-2 mt-6">Calorie Blueprint</h2>
      <table className="w-full border-collapse text-xs mb-3">
        <tbody>
          <tr className="border-b border-gray-200"><td className="py-1 font-semibold pr-4">BMR</td><td>{n.bmr} kcal</td></tr>
          <tr className="border-b border-gray-200"><td className="py-1 font-semibold pr-4">TDEE</td><td>{n.tdee} kcal</td></tr>
          <tr className="border-b border-gray-200"><td className="py-1 font-semibold pr-4">Calorie Target</td><td>{n.calorieTarget} kcal</td></tr>
          <tr className="border-b border-gray-200"><td className="py-1 font-semibold pr-4">Protein</td><td>{n.proteinG}g</td></tr>
          <tr className="border-b border-gray-200"><td className="py-1 font-semibold pr-4">Carbs</td><td>{n.carbsG}g</td></tr>
          <tr><td className="py-1 font-semibold pr-4">Fat</td><td>{n.fatG}g</td></tr>
        </tbody>
      </table>
      <ul className="list-disc list-inside mb-4">
        {p.nutritionTips.map((t, i) => <li key={i}>{t}</li>)}
      </ul>

      <h2 className="text-xl font-bold border-b border-gray-300 pb-1 mb-2 mt-6">Recovery</h2>
      <p className="mb-2"><strong>Recovery Score:</strong> {n.recoveryScore}/100 ({n.recoveryTier})</p>
      <ul className="list-disc list-inside">
        {p.recoveryAdvice.map((a, i) => <li key={i}>{a}</li>)}
      </ul>
    </div>
  )
}
