# update-fabryka-blysku.ps1
# Uruchom w katalogu, w którym leży style.css

$stylePath = "style.css"

if (-not (Test-Path $stylePath)) {
    Write-Host "Nie znaleziono pliku style.css w bieżącym katalogu." -ForegroundColor Red
    exit 1
}

# Wczytaj cały CSS
$css = Get-Content $stylePath -Raw

# Jeśli już wcześniej dodaliśmy tę sekcję, nie dubluj jej
$marker = "/* === AUTO-UPDATES: Fabryka Błysku custom tweaks === */"

if ($css -notlike "*$marker*") {

    $override = @"
$marker

/* 1. Większe logo w nawigacji */
.logo-img {
    height: 120px;
}

/* 2. Większy hero heading + tekst + przyciski */
.hero h1 {
    font-size: 2.8rem;
    line-height: 1.15;
}

.hero-subtitle {
    font-size: 1.05rem;
    max-width: 40rem;
}

.hero-cta .btn {
    font-size: 1rem;
    padding: 12px 26px;
}

/* Desktop - jeszcze większy nagłówek, żeby zapełnić przestrzeń */
@media (min-width: 768px) {
    .hero h1 {
        font-size: 3.6rem;
    }
}

@media (min-width: 1024px) {
    .hero h1 {
        font-size: 4.1rem;
    }
}

/* 3. Usunięcie kwadratowego "glowa" w rogu hero */
.hero-glow {
    display: none;
}
"@

    # Dopisz override na końcu pliku
    $css = $css + "`r`n`r`n" + $override
    Set-Content -Path $stylePath -Value $css -Encoding UTF8

    Write-Host "Zaktualizowano style.css: większe logo, większy hero + usunięty kwadrat." -ForegroundColor Green
} else {
    Write-Host "Sekcja AUTO-UPDATES już jest w style.css - nic nie zmieniono." -ForegroundColor Yellow
}
