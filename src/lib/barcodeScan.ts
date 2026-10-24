import { Capacitor } from '@capacitor/core'

// Scanning a food barcode. On the Android app Google's own scanner screen opens (no camera permission needed). In a web
// browser the camera is read with the browser's BarcodeDetector where it exists. Anywhere else the barcode is typed in.

/** The barcodes on food packaging: EAN-13 and EAN-8 (most of the world), UPC-A and UPC-E (US and Canada). */
const WEB_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e']

export const onNativeApp = () => Capacitor.isNativePlatform()

export function webCameraScanning(): boolean {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia
}

/** Digits only, 8 to 14 long. Null when it cannot be a barcode. */
export function cleanBarcode(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  return digits.length >= 8 && digits.length <= 14 ? digits : null
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Opens Google's scanner. Returns the barcode, or null when the person closed it. Throws when the scanner cannot run on this phone. */
export async function scanOnPhone(): Promise<string | null> {
  const { BarcodeScanner, BarcodeFormat } = await import('@capacitor-mlkit/barcode-scanning')
  try {
    // The scanner part comes from Google Play services. The first time, it may still have to download (a few seconds).
    if (!(await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable()).available) {
      await BarcodeScanner.installGoogleBarcodeScannerModule()
      for (let i = 0; i < 30; i++) {
        await wait(1000)
        if ((await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable()).available) break
      }
    }
    const { barcodes } = await BarcodeScanner.scan({
      formats: [BarcodeFormat.Ean13, BarcodeFormat.Ean8, BarcodeFormat.UpcA, BarcodeFormat.UpcE],
    })
    return barcodes[0]?.rawValue ?? null
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (/cancel/i.test(message)) return null
    throw new Error('The scanner could not open on this phone. Type the number under the barcode instead.')
  }
}

/** Reads the camera into `video` until a barcode is seen. Call the returned function to stop. */
export async function scanWithCamera(video: HTMLVideoElement, onCode: (code: string) => void): Promise<() => void> {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
  video.srcObject = stream
  await video.play().catch(() => undefined)
  const detector = new (window as any).BarcodeDetector({ formats: WEB_FORMATS })
  let stopped = false
  const stop = () => {
    stopped = true
    stream.getTracks().forEach((t) => t.stop())
    video.srcObject = null
  }
  void (async () => {
    while (!stopped) {
      try {
        const found = await detector.detect(video)
        const code = found[0]?.rawValue ? cleanBarcode(String(found[0].rawValue)) : null
        if (code && !stopped) {
          stop()
          onCode(code)
          return
        }
      } catch {
        // a frame that cannot be read is skipped
      }
      await wait(250)
    }
  })()
  return stop
}
