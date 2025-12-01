# Tworzy archiwum fabryka_blysku.zip z bieżącego katalogu
$ErrorActionPreference = "Stop"
$Output = "fabryka_blysku.zip"
$IncludeGit = $true

foreach ($arg in $args) {
    switch ($arg) {
        "--lite" { $IncludeGit = $false }
        "--no-git" { $IncludeGit = $false }
        "--with-git" { $IncludeGit = $true }
        "--help" { Write-Host "Usage: .\\package.ps1 [--lite|--no-git]"; exit 0 }
    }
}

$here = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $here

$gitRoot = $null
try {
    $gitRoot = git -C $here rev-parse --show-toplevel 2>$null
} catch {}

if (Test-Path $Output) { Remove-Item $Output -Force }

$temp = Join-Path $env:TEMP "fabryka_blysku_pkg"
if (Test-Path $temp) { Remove-Item $temp -Recurse -Force }
New-Item -ItemType Directory -Path $temp | Out-Null

# Staging całego drzewa roboczego (łącznie z plikami nie-commitowanymi)
$exclude = @($Output, 'drzewko.txt')
if (-not $IncludeGit) {
    $exclude += '.git'
}

Get-ChildItem -Force $here | Where-Object { $exclude -notcontains $_.Name } | ForEach-Object {
    Copy-Item $_.FullName -Destination $temp -Recurse -Force
}

$fileCount = (Get-ChildItem -Path $temp -File -Recurse | Measure-Object).Count
if ($fileCount -lt 1) { throw "Brak plików do spakowania (staging pusty)." }

Compress-Archive -Path (Join-Path $temp '*') -DestinationPath $Output -Force

$zipInfo = Get-Item $Output
if (-not $zipInfo -or $zipInfo.Length -le 0) {
    throw "Archiwum wygląda na puste – przerwano."
}

# Weryfikujemy, że zip zawiera faktyczne pliki (nie tylko puste katalogi)
Add-Type -AssemblyName System.IO.Compression.FileSystem
$entries = [System.IO.Compression.ZipFile]::OpenRead($Output).Entries | Where-Object { -not $_.FullName.EndsWith('/') -and $_.Length -gt 0 }
if (-not $entries -or $entries.Count -lt 1) {
    throw "Archiwum nie zawiera żadnych plików (>0B)."
}

erase $temp -Recurse -Force

Write-Host "Utworzono: $Output" -ForegroundColor Green
