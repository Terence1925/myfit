import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { GOAL_LABELS } from '@/lib/tdee'
import type { WorkoutProgram } from '@/lib/types'

const MARGIN = 40
const PAGE_W = 595 // A4 in points
const PAGE_H = 842
const CONTENT_W = PAGE_W - MARGIN * 2

/**
 * Builds the program as a real PDF and either downloads it (web) or opens the phone's share sheet
 * (native app). window.print() can't be used: the Android WebView ignores it, so "Export PDF" did
 * nothing on the phone.
 */
export async function exportProgramPdf(program: WorkoutProgram): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const { programData: p, nutrition: n } = program
  let y = MARGIN

  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE_H - MARGIN) {
      doc.addPage()
      y = MARGIN
    }
  }

  const text = (
    value: string,
    opts: { size?: number; bold?: boolean; color?: number; indent?: number; gap?: number } = {},
  ) => {
    const { size = 10, bold = false, color = 20, indent = 0, gap = 4 } = opts
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    doc.setTextColor(color)
    const lines = doc.splitTextToSize(value, CONTENT_W - indent) as string[]
    const lineH = size * 1.35
    for (const line of lines) {
      ensureSpace(lineH)
      doc.text(line, MARGIN + indent, y + size)
      y += lineH
    }
    y += gap
  }

  const heading = (value: string) => {
    ensureSpace(40)
    y += 10
    text(value, { size: 15, bold: true, gap: 2 })
    doc.setDrawColor(190)
    doc.line(MARGIN, y, PAGE_W - MARGIN, y)
    y += 8
  }

  const bullets = (items: string[]) => items.forEach((item) => text(`•  ${item}`, { indent: 8, gap: 2 }))

  text(p.programName, { size: 24, bold: true, gap: 2 })
  text(p.tagline, { size: 11, color: 90 })
  text(
    `Goal: ${GOAL_LABELS[program.answers.goal]}  ·  Generated ${new Date(program.createdAt).toLocaleDateString()} by FORGEFIT`,
    { size: 8, color: 130, gap: 8 },
  )

  heading('Overview')
  text(p.overview)
  text(`Weekly Volume: ${p.weeklyVolume}`)
  text(`Progression: ${p.progressionStrategy}`)

  if (p.personalizationNotes?.length) {
    heading('Why This Program Is Built For You')
    bullets(p.personalizationNotes)
  }

  heading('Warm-Up')
  bullets(p.warmup)

  heading('Weekly Training Plan')
  for (const day of p.days) {
    ensureSpace(60)
    y += 6
    text(`Day ${day.day}: ${day.name}  (${day.duration})`, { size: 12, bold: true, gap: 0 })
    text(day.focus, { size: 9, color: 100, gap: 4 })
    for (const [i, ex] of day.exercises.entries()) {
      // Yoga: held for time. Pilates: reps (and rounds). Lifting: sets and rest.
      const detail =
        ex.format === 'yoga'
          ? `${ex.reps}${ex.eachSide ? ' each side' : ''}`
          : ex.format === 'pilates'
            ? `${ex.reps}${/sec|min|pumps/.test(ex.reps) ? '' : ' reps'}${ex.eachSide ? ' each side' : ''}${ex.sets > 1 ? `  ·  ${ex.sets} rounds` : ''}`
            : `${ex.sets} sets × ${ex.reps}  ·  rest ${ex.rest}`
      text(`${i + 1}. ${ex.name}  —  ${detail}`, {
        bold: true,
        indent: 8,
        gap: 0,
      })
      if (ex.notes) text(ex.notes, { size: 8.5, color: 110, indent: 20, gap: 4 })
    }
  }

  heading('Cool-Down')
  bullets(p.cooldown)

  heading('Calorie Blueprint')
  text(`BMR: ${n.bmr} kcal    TDEE: ${n.tdee} kcal    Calorie target: ${n.calorieTarget} kcal`)
  text(`Protein: ${n.proteinG}g    Carbs: ${n.carbsG}g    Fat: ${n.fatG}g`)
  bullets(p.nutritionTips)

  heading('Recovery')
  text(`Recovery Score: ${n.recoveryScore}/100 (${n.recoveryTier})`)
  bullets(p.recoveryAdvice)

  const fileName = `${p.programName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'FORGEFIT-program'}.pdf`

  if (!Capacitor.isNativePlatform()) {
    doc.save(fileName)
    return
  }

  const dataUri = doc.output('datauristring')
  const base64 = dataUri.slice(dataUri.indexOf('base64,') + 'base64,'.length)
  const saved = await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache })
  await Share.share({ title: p.programName, files: [saved.uri], dialogTitle: 'Save or share your program' })
}
