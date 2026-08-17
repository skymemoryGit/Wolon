# Genera assets/img/ dalle foto originali in media/.
# Usa System.Drawing, integrato in Windows: nessuna dipendenza da installare.
#
#   powershell -ExecutionPolicy Bypass -File tools\prepara-immagini.ps1
#
# Le originali in media/ non vengono mai modificate.

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$media = Join-Path $root 'media'
$out = Join-Path $root 'assets\img'
New-Item -ItemType Directory -Force $out | Out-Null

function Save-Jpeg($bmp, $path, $q) {
  $enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $ps = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $ps.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [int]$q)
  $bmp.Save($path, $enc, $ps)
  $ps.Dispose()
}

function Render($src, $sx, $sy, $sw, $sh, $dw, $dh, $dest, $q) {
  $img = [System.Drawing.Image]::FromFile($src)
  $bmp = New-Object System.Drawing.Bitmap($dw, $dh)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.PixelOffsetMode = 'HighQuality'
  $g.SmoothingMode = 'HighQuality'
  $rect = New-Object System.Drawing.Rectangle(0, 0, $dw, $dh)
  $g.DrawImage($img, $rect, $sx, $sy, $sw, $sh, 'Pixel')
  $g.Dispose()
  Save-Jpeg $bmp $dest $q
  $bmp.Dispose()
  $img.Dispose()
}

# Sorgenti: nome finale -> file in media/
$src = @{
  'cetrioli' = 'SaveClip.App_730559212_122119601144775783_4631863194838449337_n.jpg'
  'wonton'   = 'SaveClip.App_730713629_122119601132775783_2558863853510290482_n.jpg'
  'riso'     = 'SaveClip.App_730558753_122119601168775783_5732953328736129935_n.jpg'
  'padthai'  = 'SaveClip.App_730992698_122119601138775783_4253222640007839864_n.jpg'
  'tavola'   = '710799584_122115682514775783_5843944207659054885_n.jpeg'
  'sala'     = '723574019_122117207858775783_9036298603646624323_n.jpeg'
  'sala-2'   = 'SaveClip.App_746557568_122122358636775783_1317510161568315043_n.jpg'
  'wok'      = 'SaveClip.App_710960498_122114693570775783_3099226623143899234_n (1).jpg'
}

# --- piatti del tavolo rotante: ritaglio quadrato centrale a 400px ---
# Sul piano non superano i 165px CSS: 400px copre anche gli schermi a 2x.
foreach ($n in @('cetrioli', 'wonton', 'riso', 'padthai')) {
  $f = Join-Path $media $src[$n]
  $img = [System.Drawing.Image]::FromFile($f)
  $w = $img.Width
  $h = $img.Height
  $img.Dispose()
  $side = [Math]::Min($w, $h)
  $offX = [int](($w - $side) * 0.5)
  $offY = [int](($h - $side) * 0.5)
  Render $f $offX $offY $side $side 400 400 (Join-Path $out "dish-$n.jpg") 84
}

# --- wok: taglio solo la striscia in fondo. "SCORRI IL CAROSELLO" e la freccia
#     partono a y=1210 e non hanno senso fuori da Instagram; il titolo e il
#     sottotitolo restano. 1140 lascia anche un po' di respiro sotto il testo. ---
Render (Join-Path $media $src['wok']) 0 0 1080 1140 900 950 (Join-Path $out 'wok-crop.jpg') 84

# --- foto ambiente: lato lungo a 900px ---
foreach ($n in @('tavola', 'sala', 'sala-2')) {
  $f = Join-Path $media $src[$n]
  $img = [System.Drawing.Image]::FromFile($f)
  $w = $img.Width
  $h = $img.Height
  $img.Dispose()
  $nh = [int][Math]::Round($h * 900 / $w)
  Render $f 0 0 $w $h 900 $nh (Join-Path $out "$n-sm.jpg") 84
}

$all = Get-ChildItem $out -File
$all | Select-Object Name, @{n = 'KB'; e = { [int]($_.Length / 1kb) } } | Format-Table -AutoSize
"TOTALE: {0} KB" -f [int](($all | Measure-Object Length -Sum).Sum / 1kb)
