# Génère : video-assistant.user.js, bookmarklet.txt, installer.html à partir de src/va-core.js
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$core = [IO.File]::ReadAllText("$here\src\va-core.js")
$utf8 = New-Object Text.UTF8Encoding $false

$header = @'
// ==UserScript==
// @name         Video Assistant (lecteur façon Samsung)
// @namespace    video-assistant
// @version      1.0
// @description  Bouton flottant qui ouvre n'importe quelle vidéo dans un lecteur plein écran avec gestes et raccourcis.
// @match        *://*/*
// @grant        none
// @run-at       document-idle
// @all-frames   true
// @noframes     false
// ==/UserScript==

'@
[IO.File]::WriteAllText("$here\video-assistant.user.js", $header + $core + "`nwindow.__VA.installButton();`n", $utf8)

# Bookmarklet : on enlève les lignes de commentaire pour gagner de la place.
$lines = $core -split "`r?`n" | Where-Object { $_.Trim() -notmatch '^(//|/\*.*\*/$)' } | ForEach-Object { $_.Trim() }
$body = ($lines -join "`n") + "`nwindow.__VA.open();"
$bm = 'javascript:' + [Uri]::EscapeDataString("void function(){$body}()")
[IO.File]::WriteAllText("$here\bookmarklet.txt", $bm, $utf8)

$tpl = [IO.File]::ReadAllText("$here\src\installer.template.html")
[IO.File]::WriteAllText("$here\installer.html", $tpl.Replace('{{CORE}}', $core), $utf8)
# Extension (Chrome / Edge / Firefox) : toujours active sur tous les sites.
$ext = "$here\extension"
New-Item -ItemType Directory -Force $ext | Out-Null
Copy-Item "$here\src\extension\*" $ext -Force
$listener = @'

(function () {
  var api = typeof browser !== 'undefined' ? browser : chrome;
  api.runtime.onMessage.addListener(function (msg) { if (msg === 'va-open' && window.__VA.find()) window.__VA.open(null, true); });
  window.__VA.installButton();
})();
'@
[IO.File]::WriteAllText("$ext\va.js", $core + $listener, $utf8)

Add-Type -AssemblyName System.Drawing
foreach ($s in 16, 48, 128) {
  $bmp = New-Object Drawing.Bitmap $s, $s
  $g = [Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.FillEllipse((New-Object Drawing.SolidBrush ([Drawing.Color]::FromArgb(62, 123, 250))), 0, 0, $s - 1, $s - 1)
  $pen = New-Object Drawing.Pen ([Drawing.Color]::White), ([Math]::Max(1.5, $s / 12))
  $a = $s * 0.3; $b = $s * 0.7; $h = $s * 0.16
  $g.DrawLine($pen, $a, $b, $b, $a)
  $g.DrawLines($pen, [Drawing.PointF[]]@((New-Object Drawing.PointF ($b - $h), $a), (New-Object Drawing.PointF $b, $a), (New-Object Drawing.PointF $b, ($a + $h))))
  $g.DrawLines($pen, [Drawing.PointF[]]@((New-Object Drawing.PointF $a, ($b - $h)), (New-Object Drawing.PointF $a, $b), (New-Object Drawing.PointF ($a + $h), $b)))
  $bmp.Save("$ext\icon$s.png", [Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}
Remove-Item "$here\video-assistant-extension.zip" -ErrorAction SilentlyContinue
Compress-Archive -Path "$ext\*" -DestinationPath "$here\video-assistant-extension.zip"

"OK - bookmarklet: $($bm.Length) caractères, extension dans .\extension"
