import { Capacitor, registerPlugin } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { plainEffort } from '@/lib/effortWords'
import { goalLabelOf } from '@/lib/goalLabel'
import type { WorkoutProgram } from '@/lib/types'

const MARGIN = 52
const PAGE_W = 595 // A4 in points
const PAGE_H = 842
const CONTENT_W = PAGE_W - MARGIN * 2

/**
 * Builds the program as a real PDF and either downloads it (web) or opens the phone's share sheet
 * (native app). window.print() can't be used: the Android WebView ignores it, so "Export PDF" did
 * nothing on the phone.
 */
// Our own small Android plugin (android/app/src/main/java/com/myfit/app/DownloadsPlugin.java): saves straight into Downloads.
interface DownloadsPlugin {
  saveFile(options: { fileName: string; data: string; mimeType: string }): Promise<{ uri: string }>
}
const Downloads = registerPlugin<DownloadsPlugin>('Downloads')

/**
 * Makes the PDF. 'downloaded': saved by the browser. 'saved': saved into the phone's Downloads folder (Android).
 * 'shared': handed to the share sheet (iPhone, or an Android phone that cannot save straight to Downloads).
 */
export async function exportProgramPdf(program: WorkoutProgram): Promise<'downloaded' | 'saved' | 'shared'> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const { programData: p, nutrition: n } = program
  let y = MARGIN

  type Color = number | [number, number, number]
  const INK: Color = 24
  const GREY: Color = 125
  const LIGHT: Color = 225
  const GREEN: Color = [63, 154, 34]
  const setColor = (c: Color) => (Array.isArray(c) ? doc.setTextColor(c[0], c[1], c[2]) : doc.setTextColor(c))

  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE_H - MARGIN - 10) {
      doc.addPage()
      y = MARGIN
    }
  }

  const rule = (gapAfter = 0) => {
    doc.setDrawColor(LIGHT as number)
    doc.setLineWidth(0.5)
    doc.line(MARGIN, y, PAGE_W - MARGIN, y)
    y += gapAfter
  }

  const text = (
    value: string,
    opts: { size?: number; bold?: boolean; color?: Color; indent?: number; gap?: number; spaced?: boolean } = {},
  ) => {
    const { size = 10, bold = false, color = INK, indent = 0, gap = 4, spaced = false } = opts
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    setColor(color)
    const lines = doc.splitTextToSize(value, CONTENT_W - indent) as string[]
    const lineH = size * 1.5
    for (const line of lines) {
      ensureSpace(lineH)
      doc.text(line, MARGIN + indent, y + size, spaced ? { charSpace: 1.6 } : undefined)
      y += lineH
    }
    y += gap
  }

  // Section label: small, spaced capitals, then a hairline.
  const heading = (value: string, needed = 90) => {
    ensureSpace(needed)
    y += 26
    text(value.toUpperCase(), { size: 8, bold: true, color: GREEN, gap: 6, spaced: true })
    rule(14)
  }

  const bullets = (items: string[]) => items.forEach((item) => text(item, { indent: 14, gap: 5, size: 9.5 }))

  // A row of numbers (bold, with a small unit) and a small label under each.
  const stats = (items: { label: string; value: string; unit?: string; green?: boolean }[]) => {
    ensureSpace(50)
    const colW = CONTENT_W / items.length
    items.forEach((it, i) => {
      const x = MARGIN + i * colW
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(15)
      setColor(it.green ? GREEN : INK)
      doc.text(it.value, x, y + 15)
      if (it.unit) {
        const w = doc.getTextWidth(it.value)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        setColor(GREY)
        doc.text(it.unit, x + w + 3, y + 15)
      }
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      setColor(GREY)
      doc.text(it.label.toUpperCase(), x, y + 29, { charSpace: 1.2 })
    })
    y += 50
  }
  const num = (v: number) => v.toLocaleString('en-US')

  // Cover block
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  setColor(GREEN)
  doc.text('MYFIT', MARGIN, y + 8, { charSpace: 3 })
  y += 36
  text(p.programName, { size: 30, bold: true, gap: 6 })
  text(p.tagline, { size: 11.5, color: GREY, gap: 14 })
  text(`${goalLabelOf(program.answers)}   ·   ${new Date(program.createdAt).toLocaleDateString()}`, {
    size: 8.5,
    color: GREY,
    gap: 6,
    spaced: true,
  })
  doc.setDrawColor(GREEN[0], GREEN[1], GREEN[2])
  doc.setLineWidth(1.5)
  doc.line(MARGIN, y, MARGIN + 36, y)
  y += 4

  heading('Overview')
  text(p.overview, { gap: 10 })
  text(`Weekly volume   ${p.weeklyVolume}`, { size: 9.5, color: GREY, gap: 2 })
  text(`Progression   ${p.progressionStrategy}`, { size: 9.5, color: GREY })

  if (p.personalizationNotes?.length) {
    heading('Built for you')
    bullets(p.personalizationNotes)
  }

  heading('Warm-up')
  bullets(p.warmup)

  heading('Weekly training plan', 200)
  for (const day of p.days) {
    ensureSpace(90)
    y += 12
    text(`DAY ${day.day}`, { size: 7.5, bold: true, color: GREEN, gap: 2, spaced: true })
    text(day.name, { size: 15, bold: true, gap: 1 })
    text(`${day.focus}   ·   ${day.duration}`, { size: 9, color: GREY, gap: 10 })
    // One table per day. Lifting: sets, reps, rest. Pilates: reps, rounds. Yoga: held for time.
    const kind = day.exercises.every((e) => e.format === 'yoga') ? 'yoga' : day.exercises.every((e) => e.format === 'pilates') ? 'pilates' : 'lifting'
    const cols = kind === 'yoga' ? [{ h: 'Hold / reps', w: 150 }] : kind === 'pilates' ? [{ h: 'Reps', w: 110 }, { h: 'Rounds', w: 70 }] : [{ h: 'Sets', w: 55 }, { h: 'Reps', w: 80 }, { h: 'Rest', w: 90 }]
    const dataW = cols.reduce((sum, c) => sum + c.w, 0)
    const nameX = MARGIN + 26
    const nameW = CONTENT_W - 26 - dataW - 10
    const colX = (ci: number) => PAGE_W - MARGIN - dataW + cols.slice(0, ci).reduce((sum, c) => sum + c.w, 0)
    const cellsOf = (ex: (typeof day.exercises)[number]) => {
      const side = ex.eachSide ? ' each side' : ''
      if (kind === 'yoga') return [`${ex.reps}${side}`]
      if (kind === 'pilates') return [`${ex.reps}${/sec|min|pumps/.test(ex.reps) ? '' : ' reps'}${side}`, `${ex.sets}`]
      return [`${ex.sets}`, `${ex.reps}${side}`, `${ex.rest}`]
    }

    const header = () => {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      setColor(GREY)
      doc.text('#', MARGIN, y + 7, { charSpace: 1.2 })
      doc.text('EXERCISE', nameX, y + 7, { charSpace: 1.2 })
      cols.forEach((c, ci) => doc.text(c.h.toUpperCase(), colX(ci), y + 7, { charSpace: 1.2 }))
      y += 14
      doc.setDrawColor(INK as number)
      doc.setLineWidth(0.6)
      doc.line(MARGIN, y, PAGE_W - MARGIN, y)
      y += 1
    }
    ensureSpace(80)
    header()

    for (const [i, ex] of day.exercises.entries()) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      const nameLines = doc.splitTextToSize(ex.name, nameW) as string[]
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      const noteLines = ex.notes ? (doc.splitTextToSize(plainEffort(ex.notes), nameW) as string[]) : []
      const rowH = 10 + nameLines.length * 13 + noteLines.length * 11 + (noteLines.length ? 2 : 0) + 8
      if (y + rowH > PAGE_H - MARGIN - 10) {
        doc.addPage()
        y = MARGIN
        header()
      }
      const top = y + 10
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      setColor(GREY)
      doc.text(String(i + 1).padStart(2, '0'), MARGIN, top + 8)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      setColor(INK)
      nameLines.forEach((line, li) => doc.text(line, nameX, top + 9 + li * 13))
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      cellsOf(ex).forEach((cell, ci) => doc.text(cell, colX(ci), top + 9))
      doc.setFontSize(8)
      setColor(150)
      noteLines.forEach((line, li) => doc.text(line, nameX, top + 9 + nameLines.length * 13 + 2 + li * 11))
      y += rowH
      doc.setDrawColor(235)
      doc.setLineWidth(0.4)
      doc.line(MARGIN, y, PAGE_W - MARGIN, y)
    }
    y += 10
  }

  heading('Cool-down')
  bullets(p.cooldown)

  heading('Calorie blueprint')
  stats([
    { label: 'At rest', value: num(n.bmr), unit: 'kcal' },
    { label: 'Maintenance', value: num(n.tdee), unit: 'kcal' },
    { label: 'Daily target', value: num(n.calorieTarget), unit: 'kcal', green: true },
  ])
  stats([
    { label: 'Protein', value: `${n.proteinG}`, unit: 'g' },
    { label: 'Carbs', value: `${n.carbsG}`, unit: 'g' },
    { label: 'Fat', value: `${n.fatG}`, unit: 'g' },
  ])
  bullets(p.nutritionTips)

  heading('Recovery')
  stats([{ label: `Recovery score · ${n.recoveryTier}`, value: `${n.recoveryScore}`, unit: '/ 100' }])
  bullets(p.recoveryAdvice)

  // Footer on every page
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    setColor(150)
    doc.text('MYFIT', MARGIN, PAGE_H - 28, { charSpace: 2 })
    doc.text(`${i} / ${pages}`, PAGE_W - MARGIN, PAGE_H - 28, { align: 'right' })
  }

  const fileName = `${p.programName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'MyFit-program'}.pdf`

  if (!Capacitor.isNativePlatform()) {
    doc.save(fileName)
    return 'downloaded'
  }

  const dataUri = doc.output('datauristring')
  const base64 = dataUri.slice(dataUri.indexOf('base64,') + 'base64,'.length)

  // Android: save straight into the Downloads folder, no share sheet
  if (Capacitor.getPlatform() === 'android') {
    try {
      await Downloads.saveFile({ fileName, data: base64, mimeType: 'application/pdf' })
      return 'saved'
    } catch {
      // An older phone, or the save failed: fall back to the share sheet below
    }
  }

  const saved = await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache })
  await Share.share({ title: p.programName, files: [saved.uri], dialogTitle: 'Save or share your program' })
  return 'shared'
}
