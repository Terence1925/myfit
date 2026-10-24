import * as React from 'react'
import { Loader2, ScanBarcode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { foodLog } from '@/lib/backend/api'
import { cleanBarcode, onNativeApp, scanOnPhone, scanWithCamera, webCameraScanning } from '@/lib/barcodeScan'
import type { FoodItem } from '@/lib/types'

type Phase = 'ready' | 'scanning' | 'looking' | 'notfound' | 'error'

/**
 * The scan screen inside the food search: opens the scanner by itself, looks the product up, and hands it back.
 * The barcode can always be typed, for a phone without the scanner or a product with a damaged code.
 */
export function BarcodeScan({
  onFood,
  onAddOwn,
}: {
  onFood: (food: FoodItem) => void
  onAddOwn: () => void
}) {
  const [phase, setPhase] = React.useState<Phase>('ready')
  const [message, setMessage] = React.useState('')
  const [typed, setTyped] = React.useState('')
  const [code, setCode] = React.useState('')
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const stopCamera = React.useRef<(() => void) | null>(null)
  const alive = React.useRef(true)

  const lookUp = React.useCallback(
    (barcode: string) => {
      setCode(barcode)
      setPhase('looking')
      foodLog
        .lookupBarcode(barcode)
        .then((food) => {
          if (!alive.current) return
          if (food) onFood(food)
          else setPhase('notfound')
        })
        .catch((err) => {
          if (!alive.current) return
          setMessage(err instanceof Error ? err.message : 'Could not look that up.')
          setPhase('error')
        })
    },
    [onFood],
  )

  const start = React.useCallback(async () => {
    setMessage('')
    try {
      if (onNativeApp()) {
        setPhase('scanning')
        const found = await scanOnPhone()
        if (!alive.current) return
        if (found) lookUp(found)
        else setPhase('ready')
      } else if (webCameraScanning()) {
        setPhase('scanning')
        // the video element exists as soon as the phase is 'scanning'
        await new Promise((r) => setTimeout(r, 0))
        if (!videoRef.current) return
        stopCamera.current = await scanWithCamera(videoRef.current, lookUp)
      }
    } catch (err) {
      if (!alive.current) return
      setMessage(
        err instanceof Error && /scanner/i.test(err.message)
          ? err.message
          : 'The camera could not start. Type the number under the barcode instead.',
      )
      setPhase('error')
    }
  }, [lookUp])

  React.useEffect(() => {
    alive.current = true
    void start()
    return () => {
      alive.current = false
      stopCamera.current?.()
    }
  }, [start])

  const submitTyped = () => {
    const c = cleanBarcode(typed)
    if (!c) {
      setMessage('A barcode is 8 to 14 digits. Check the number under the bars.')
      setPhase('error')
      return
    }
    stopCamera.current?.()
    lookUp(c)
  }

  const canScan = onNativeApp() || webCameraScanning()

  return (
    <div className="space-y-5">
      {phase === 'scanning' && !onNativeApp() && (
        <div className="overflow-hidden rounded-2xl border border-border bg-black">
          <video ref={videoRef} playsInline muted className="aspect-[4/3] w-full object-cover" />
          <p className="bg-card px-3 py-2 text-center text-xs text-muted-foreground">Hold the barcode inside the picture</p>
        </div>
      )}

      {phase === 'scanning' && onNativeApp() && (
        <div className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Opening the scanner…</p>
        </div>
      )}

      {phase === 'looking' && (
        <div className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Looking up {code}…</p>
        </div>
      )}

      {phase === 'notfound' && (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <p className="font-body text-base font-bold">We could not find that product</p>
          <p className="text-sm text-muted-foreground">
            Barcode {code} is not in the food databases yet. You can scan another one, or add it yourself from the label.
          </p>
          <Button className="w-full" onClick={onAddOwn}>
            Add your own food
          </Button>
        </div>
      )}

      {phase === 'error' && message && <p className="rounded-xl border border-border bg-card p-3 text-sm">{message}</p>}

      {(phase === 'ready' || phase === 'notfound' || phase === 'error') && canScan && (
        <Button variant="outline" className="w-full gap-2" onClick={() => void start()}>
          <ScanBarcode className="h-5 w-5" /> Scan {phase === 'ready' ? 'a barcode' : 'again'}
        </Button>
      )}

      {phase !== 'looking' && (
        <div className="space-y-2">
          <label htmlFor="barcode-number" className="text-sm font-semibold">
            {canScan ? 'Or type the number under the bars' : 'Type the number under the bars'}
          </label>
          <div className="flex gap-2">
            <Input
              id="barcode-number"
              inputMode="numeric"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitTyped()}
              placeholder="e.g. 4800016644801"
              className="h-12"
            />
            <Button className="h-12 shrink-0" onClick={submitTyped} disabled={typed.trim() === ''}>
              Look up
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
