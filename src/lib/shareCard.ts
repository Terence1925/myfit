import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import type { BadgeDef } from './badges'
import type { Recap } from './weeklyRecap'

// Pictures people can share (a badge or the weekly recap): a 4:5 card that looks good on Facebook and Instagram.

const W = 1080
const H = 1350
const LIME = '#b5f13b'
const INK = '#14161a'

const TIER_COLORS = { bronze: ['#f59e0b', '#b45309'], silver: ['#e5e7eb', '#9ca3af'], gold: ['#fde047', '#f59e0b'] } as const

function newCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not draw the picture.')
  return { canvas, ctx }
}

function background(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = INK
  ctx.fillRect(0, 0, W, H)
  const glow = ctx.createRadialGradient(W * 0.8, 120, 40, W * 0.8, 120, 900)
  glow.addColorStop(0, 'rgba(181,241,59,0.35)')
  glow.addColorStop(1, 'rgba(181,241,59,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)
  // brand
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 64px Outfit, Barlow, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('MyFit', 72, 120)
  ctx.fillStyle = LIME
  ctx.fillRect(72, 138, 120, 8)
  // footer
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = '600 34px Barlow, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('getmyfit.vercel.app', W / 2, H - 60)
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else line = test
  }
  if (line) lines.push(line)
  return lines
}

async function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not make the picture.'))), 'image/png'))
}

export async function renderBadgeCard(badge: BadgeDef): Promise<Blob> {
  await document.fonts?.ready
  const { canvas, ctx } = newCanvas()
  background(ctx)
  const [light, dark] = TIER_COLORS[badge.tier]
  const cx = W / 2
  const cy = 600
  const ring = ctx.createLinearGradient(cx - 260, cy - 260, cx + 260, cy + 260)
  ring.addColorStop(0, light)
  ring.addColorStop(1, dark)
  ctx.beginPath()
  ctx.arc(cx, cy, 270, 0, Math.PI * 2)
  ctx.fillStyle = ring
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx, cy, 235, 0, Math.PI * 2)
  ctx.fillStyle = '#1d2026'
  ctx.fill()
  ctx.font = '240px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(badge.emoji, cx, cy + 12)

  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = LIME
  ctx.font = '700 40px Barlow, sans-serif'
  ctx.fillText('BADGE UNLOCKED', cx, 1000)
  ctx.fillStyle = '#ffffff'
  ctx.font = '120px "Bebas Neue", Barlow, sans-serif'
  ctx.fillText(badge.title.toUpperCase(), cx, 1115)
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.font = '600 42px Barlow, sans-serif'
  ctx.fillText(badge.blurb, cx, 1190)
  return toBlob(canvas)
}

export async function renderRecapCard(recap: Recap): Promise<Blob> {
  await document.fonts?.ready
  const { canvas, ctx } = newCanvas()
  background(ctx)
  ctx.textAlign = 'left'
  ctx.fillStyle = LIME
  ctx.font = '700 40px Barlow, sans-serif'
  ctx.fillText('MY WEEK', 72, 280)
  ctx.fillStyle = '#ffffff'
  ctx.font = '130px "Bebas Neue", Barlow, sans-serif'
  ctx.fillText(recap.label.toUpperCase(), 72, 400)

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 62px Barlow, sans-serif'
  wrap(ctx, recap.headline, W - 144).forEach((l, i) => ctx.fillText(l, 72, 500 + i * 78))

  const tiles: [string, string][] = [
    [recap.workouts > recap.planned ? `${recap.workouts}` : `${recap.workouts}/${recap.planned}`, 'workouts'],
    [`${recap.sets}`, 'sets done'],
    [`${recap.foodDays}`, 'days of food'],
    [`${recap.streakWeeks}`, recap.streakWeeks === 1 ? 'week streak' : 'weeks streak'],
  ]
  tiles.forEach(([value, name], i) => {
    const x = 72 + (i % 2) * 456
    const y = 700 + Math.floor(i / 2) * 230
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.beginPath()
    ctx.roundRect(x, y, 432, 200, 32)
    ctx.fill()
    ctx.fillStyle = LIME
    ctx.font = '130px "Bebas Neue", Barlow, sans-serif'
    ctx.fillText(value, x + 36, y + 120)
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    ctx.font = '600 36px Barlow, sans-serif'
    ctx.fillText(name, x + 36, y + 168)
  })

  ctx.fillStyle = '#ffffff'
  ctx.font = '600 46px Barlow, sans-serif'
  wrap(ctx, recap.note, W - 144).forEach((l, i) => ctx.fillText(l, 72, 1215 + i * 58))
  return toBlob(canvas)
}

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(String(reader.result).split('base64,')[1] ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

/** Opens the phone's share sheet with the picture (or saves it, in a browser that cannot share files). */
export async function shareImage(blob: Blob, fileName: string, title: string): Promise<'shared' | 'saved'> {
  if (Capacitor.isNativePlatform()) {
    const saved = await Filesystem.writeFile({ path: fileName, data: await blobToBase64(blob), directory: Directory.Cache })
    await Share.share({ title, files: [saved.uri], dialogTitle: 'Share your progress' })
    return 'shared'
  }
  const file = new File([blob], fileName, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title })
    return 'shared'
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'saved'
}
