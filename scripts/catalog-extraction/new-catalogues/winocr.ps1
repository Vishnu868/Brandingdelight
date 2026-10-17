param([string]$InDir, [string]$OutFile)
# Windows.Media.Ocr over every PNG in $InDir -> JSON lines: {file, w, h, lines:[{t, x0,y0,x1,y1}]}
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation, ContentType = WindowsRuntime]
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Await($op, [Type]$t) { $task = $asTask.MakeGenericMethod($t).Invoke($null, @($op)); $task.Wait(-1) | Out-Null; $task.Result }
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
$sw = [System.IO.StreamWriter]::new($OutFile, $true, [System.Text.Encoding]::UTF8)
Get-ChildItem $InDir -Filter *.png | Sort-Object Name | ForEach-Object {
  $file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($_.FullName)) ([Windows.Storage.StorageFile])
  $stream = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
  $dec = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
  $bmp = Await ($dec.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
  $res = Await ($engine.RecognizeAsync($bmp)) ([Windows.Media.Ocr.OcrResult])
  $lines = @()
  foreach ($l in $res.Lines) {
    $x0 = 1e9; $y0 = 1e9; $x1 = 0; $y1 = 0
    foreach ($w in $l.Words) { $r = $w.BoundingRect; $x0 = [Math]::Min($x0, $r.X); $y0 = [Math]::Min($y0, $r.Y); $x1 = [Math]::Max($x1, $r.X + $r.Width); $y1 = [Math]::Max($y1, $r.Y + $r.Height) }
    $lines += @{ t = $l.Text; x0 = $x0; y0 = $y0; x1 = $x1; y1 = $y1 }
  }
  $obj = @{ file = $_.Name; w = $bmp.PixelWidth; h = $bmp.PixelHeight; lines = $lines }
  $sw.WriteLine(($obj | ConvertTo-Json -Compress -Depth 5))
  $stream.Dispose()
}
$sw.Close()
