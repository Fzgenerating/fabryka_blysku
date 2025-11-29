# Tworzy archiwum fabryka_blysku.zip z bieżącego katalogu (bez .git)
$ErrorActionPreference = "Stop"
$Output = "fabryka_blysku.zip"
$here = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $here

if (Test-Path $Output) { Remove-Item $Output -Force }

# Zbieramy wszystkie elementy poza repozytoryjnymi i samymi skryptami pakującymi
$items = Get-ChildItem -Force | Where-Object { $_.Name -notin @('.git', '.gitignore', 'fabryka_blysku.zip', 'package.ps1', 'package.sh') }

if (-not $items) {
    Write-Error "Brak plików do spakowania (katalog jest pusty?)."
}

Compress-Archive -Path $items -DestinationPath $Output -Force
Write-Host "Utworzono: $Output" -ForegroundColor Green
