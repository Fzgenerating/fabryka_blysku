# Jak spakować projekt do ZIP (bez pustego archiwum)

Masz dwa warianty w zależności od środowiska:

## Windows (PowerShell)
1. Otwórz PowerShell w katalogu repozytorium.
2. Uruchom:
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\package.ps1
   ```
3. Po zakończeniu pojawi się plik `fabryka_blysku.zip` (bez katalogu `.git`).

## Linux / macOS (bash)
1. W katalogu repozytorium wykonaj:
   ```bash
   ./package.sh
   ```
2. Powstanie plik `fabryka_blysku.zip` z pełną zawartością strony (bez `.git`).

Jeśli podczas rozpakowywania widzisz komunikat o pustym archiwum, upewnij się, że skrypt był uruchomiony w katalogu projektu i że plik `.git` został wykluczony, a reszta plików była dostępna.
