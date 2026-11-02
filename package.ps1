# ============================================================
#  package.ps1 — build the two upload-ready site folders + ZIPs
#  Run from anywhere:  powershell -ExecutionPolicy Bypass -File .\package.ps1
# ============================================================

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$dist = Join-Path $root 'dist'

$siteFiles = @('index.html', 'manifest.webmanifest', 'serve.cmd')
$assetFolders = @('css', 'js', 'img', 'svg')

function Copy-Site([string]$destination) {
  if (Test-Path -LiteralPath $destination) {
    Remove-Item -LiteralPath $destination -Recurse -Force
  }
  New-Item -ItemType Directory -Force -Path $destination | Out-Null

  foreach ($file in $siteFiles) {
    Copy-Item -LiteralPath (Join-Path $root $file) -Destination $destination -Force
  }

  $assetsDest = Join-Path $destination 'assets'
  New-Item -ItemType Directory -Force -Path $assetsDest | Out-Null
  foreach ($folder in $assetFolders) {
    Copy-Item -LiteralPath (Join-Path $root "assets\$folder") `
              -Destination (Join-Path $assetsDest $folder) -Recurse -Force
  }
  Copy-Item -LiteralPath (Join-Path $root 'assets\README.md') `
            -Destination (Join-Path $assetsDest 'README.md') -Force
}

function New-Zip([string]$source, [string]$zipPath) {
  if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
  $items = Get-ChildItem -LiteralPath $source -Force | Select-Object -ExpandProperty FullName
  Compress-Archive -Path $items -DestinationPath $zipPath -CompressionLevel Optimal -Force
}

New-Item -ItemType Directory -Force -Path $dist | Out-Null

# ── GitHub Pages ────────────────────────────────────────────
$gh = Join-Path $dist 'github-pages'
Copy-Site $gh
Copy-Item -LiteralPath (Join-Path $root 'packaging\github-pages-README.md') `
          -Destination (Join-Path $gh 'README.md') -Force
New-Item -ItemType File -Force -Path (Join-Path $gh '.nojekyll') | Out-Null
New-Zip $gh (Join-Path $dist 'NMS460-GitHub-Pages.zip')

# ── Bootstrap Studio ────────────────────────────────────────
$bss = Join-Path $dist 'bootstrap-studio'
Copy-Site $bss
Copy-Item -LiteralPath (Join-Path $root 'packaging\bootstrap-studio-README.md') `
          -Destination (Join-Path $bss 'README.md') -Force
New-Zip $bss (Join-Path $dist 'NMS460-Bootstrap-Studio.zip')

# ── developer note ──────────────────────────────────────────
@'
# Packages

- `github-pages/` - static site ready for a GitHub Pages repository. Contains `.nojekyll`.
- `bootstrap-studio/` - the same static site for importing into Bootstrap Studio or previewing locally.
- `NMS460-GitHub-Pages.zip` - ZIP of the GitHub Pages package contents.
- `NMS460-Bootstrap-Studio.zip` - ZIP of the Bootstrap Studio package contents.

Both folders are self-contained. Upload/open the **contents** so `index.html` remains at the site root.

Rebuild after editing the source with:

```powershell
powershell -ExecutionPolicy Bypass -File .\package.ps1
```
'@ | Set-Content -LiteralPath (Join-Path $dist 'README.md') -Encoding utf8

Write-Host ''
Write-Host 'Packages built:' -ForegroundColor Green
Get-ChildItem -LiteralPath $dist | Select-Object Name, Length | Format-Table
