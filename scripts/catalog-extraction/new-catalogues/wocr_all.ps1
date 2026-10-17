param([string[]]$Keys)
$base = "C:\Users\vishn\AppData\Local\Temp\claude\V--Chidhvianna\4be0ba60-9412-4f96-ac10-f18d6b5df70f\scratchpad\new"
foreach ($k in $Keys) {
  $in = Join-Path $base "wocr\$k"
  $out = Join-Path $base "wocr\$k.jsonl"
  if (Test-Path $out) { Remove-Item $out }
  & (Join-Path $base "winocr.ps1") -InDir $in -OutFile $out
  "done $k"
}
