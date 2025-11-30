# Tworzy archiwum fabryka_blysku.zip z bieżącego katalogu (bez .git)
$ErrorActionPreference = "Stop"
$Output = "fabryka_blysku.zip"
$here = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $here

if (Test-Path $Output) { Remove-Item $Output -Force }

$temp = Join-Path $env:TEMP "fabryka_blysku_pkg"
if (Test-Path $temp) { Remove-Item $temp -Recurse -Force }
New-Item -ItemType Directory -Path $temp | Out-Null

# Kopiujemy zawartość repo (bez .git, skryptów pakujących i istniejącego zipa)
$exclude = @('.git', '.gitignore', $Output, 'package.ps1', 'package.sh', 'drzewko.txt')
Get-ChildItem -Force | Where-Object { $exclude -notcontains $_.Name } | ForEach-Object {
    Copy-Item $_.FullName -Destination $temp -Recurse -Force
}

# Walidacja zawartości
if (-not (Get-ChildItem -Path $temp -Recurse | Where-Object { -not $_.PSIsContainer })) {
    throw "Brak plików do spakowania (staging pusty)."
}

# Tworzymy archiwum z katalogu staging
Compress-Archive -Path (Join-Path $temp '*') -DestinationPath $Output -Force

# Sprzątanie
erase $temp -Recurse -Force

Write-Host "Utworzono: $Output" -ForegroundColor Green
