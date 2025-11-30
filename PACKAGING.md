# Jak spakować projekt do ZIP (bez pustego archiwum)

Masz dwa warianty w zależności od środowiska. Skrypty kopiują pliki śledzone przez Git (albo cały katalog roboczy, gdy Git nie jest dostępny), tworzą tymczasowy staging i sprawdzają, czy archiwum zawiera wpisy – dlatego wynikowy ZIP nie będzie pusty.

## Windows (PowerShell)
1. Otwórz PowerShell w katalogu repozytorium.
2. Uruchom:
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\package.ps1
   ```
3. Powstanie `fabryka_blysku.zip` bez katalogu `.git` i samych skryptów pakujących; skrypt przerwie działanie, jeśli staging lub archiwum byłyby puste.

## Linux / macOS (bash)
1. W katalogu repozytorium wykonaj:
   ```bash
   ./package.sh
   ```
2. Skrypt utworzy staging z plików śledzonych przez Git (fallback: cały katalog), zweryfikuje, że staging i archiwum zawierają pliki, a następnie zapisze `fabryka_blysku.zip` (bez `.git`, plików *.gitignore* i samych skryptów pakujących).

> Jeśli widzisz komunikat o pustym archiwum, sprawdź, czy uruchamiasz skrypt z katalogu projektu i masz uprawnienia do tworzenia plików w bieżącym katalogu.
