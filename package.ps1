# Tworzy archiwum fabryka_blysku.zip z bieżącego katalogu (bez .git)
$ErrorActionPreference = "Stop"
$Output = "fabryka_blysku.zip"
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

# 1) Najpierw próbujemy git archive (HEAD) – prościej i pewnie, gdy repo jest dostępne
if ($gitRoot) {
    try {
        git -C $gitRoot archive -o (Join-Path $temp $Output) HEAD *> $null
    } catch {}
    $archived = Join-Path $temp $Output
    if (Test-Path $archived -and (Get-Item $archived).Length -gt 0) {
        Move-Item $archived $Output -Force
        Write-Host "Użyto git archive (HEAD)" -ForegroundColor Yellow
        Write-Host "Utworzono: $Output" -ForegroundColor Green
        exit 0
    }
}

# 2) Fallback – staging kopiowany i pakowany Compress-Archive
$exclude = @('.git', '.gitignore', $Output, 'package.ps1', 'package.sh', 'drzewko.txt')
if ($gitRoot) {
    git -C $gitRoot ls-files | ForEach-Object {
        $source = Join-Path $gitRoot $_
        $dest = Join-Path $temp $_
        $destDir = Split-Path $dest -Parent
        if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
        Copy-Item $source -Destination $dest -Force
    }
} else {
    Get-ChildItem -Force | Where-Object { $exclude -notcontains $_.Name } | ForEach-Object {
        Copy-Item $_.FullName -Destination $temp -Recurse -Force
    }
}

$fileCount = (Get-ChildItem -Path $temp -File -Recurse | Measure-Object).Count
if ($fileCount -lt 1) { throw "Brak plików do spakowania (staging pusty)." }

Compress-Archive -Path (Join-Path $temp '*') -DestinationPath $Output -Force

$zipInfo = Get-Item $Output
if (-not $zipInfo -or $zipInfo.Length -le 0) {
    throw "Archiwum wygląda na puste – przerwano."
}

erase $temp -Recurse -Force

Write-Host "Utworzono: $Output" -ForegroundColor Green
