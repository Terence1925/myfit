# Shrinks every photo in public/recipes to 900 px wide at JPEG quality 80, so the app stays light.
# Run from the project folder:  powershell -File scripts/shrink-recipe-photos.ps1
Add-Type -AssemblyName System.Drawing
$dir = Join-Path $PSScriptRoot '..\public\recipes'
$jpeg = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$params = New-Object System.Drawing.Imaging.EncoderParameters(1)
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]80)
foreach ($file in Get-ChildItem $dir -Filter *.jpg) {
  $src = [System.Drawing.Image]::FromFile($file.FullName)
  try {
    if ($src.Width -le 900) { continue }
    $h = [int]($src.Height * 900 / $src.Width)
    $bmp = New-Object System.Drawing.Bitmap(900, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($src, 0, 0, 900, $h)
    $g.Dispose()
    $tmp = $file.FullName + '.tmp'
    $bmp.Save($tmp, $jpeg, $params)
    $bmp.Dispose()
  } finally {
    $src.Dispose()
  }
  if (Test-Path ($file.FullName + '.tmp')) { Move-Item -Force ($file.FullName + '.tmp') $file.FullName }
}
Write-Output 'done'
