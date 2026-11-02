/** Turns a chosen photo into a small square JPEG (centred crop) so it stays light to store and fast to show. */
const SIZE = 256
const MAX_INPUT_BYTES = 15 * 1024 * 1024

export async function photoToAvatar(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose a photo (an image file).')
  if (file.size > MAX_INPUT_BYTES) throw new Error('That photo is too large. Please choose one under 15 MB.')
  let bitmap: ImageBitmap
  try {
    // "from-image" turns photos taken on a phone the right way up
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new Error('That photo could not be opened. Please try a different one.')
  }
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not prepare the photo.')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, SIZE, SIZE)
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.85)
}
