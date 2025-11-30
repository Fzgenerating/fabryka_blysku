# Jak spakować projekt do ZIP (bez pustego archiwum)

Masz dwa warianty w zależności od środowiska. Skrypty same tworzą tymczasowy katalog staging i sprawdzają, czy nie jest pusty, więc archiwum zawsze zawiera realne pliki.

## Windows (PowerShell)
1. Otwórz PowerShell w katalogu repozytorium.
2. Uruchom:
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\package.ps1
   ```
3. Powstanie `fabryka_blysku.zip` bez katalogu `.git` i samych skryptów pakujących.

## Linux / macOS (bash)
1. W katalogu repozytorium wykonaj:
   ```bash
   ./package.sh
   ```
2. Skrypt utworzy staging, zweryfikuje, że nie jest pusty, a następnie zapisze `fabryka_blysku.zip` (bez `.git`, plików *.gitignore* i samych skryptów pakujących).

> Jeśli widzisz komunikat o pustym archiwum, sprawdź, czy uruchamiasz skrypt z katalogu projektu i masz uprawnienia do tworzenia plików w bieżącym katalogu.
