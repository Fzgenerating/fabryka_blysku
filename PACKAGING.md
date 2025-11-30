# Jak spakować projekt do ZIP (bez pustego archiwum)

Masz dwa warianty w zależności od środowiska. Skrypty najpierw próbują użyć `git archive`, a gdy to niemożliwe, budują staging i sprawdzają, czy archiwum zawiera wpisy – dzięki temu wynikowy ZIP nie będzie pusty.

## Windows (PowerShell)
1. Otwórz PowerShell w katalogu repozytorium.
2. Uruchom:
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\package.ps1
   ```
3. Skrypt najpierw spróbuje `git archive` (HEAD). Jeśli Git jest niedostępny, kopiuje pliki do stagingu (preferuje ścieżki Git), pakuje Compress-Archive i przerwie działanie, jeśli staging lub archiwum byłyby puste.

## Linux / macOS (bash)
1. W katalogu repozytorium wykonaj:
   ```bash
   ./package.sh
   ```
2. Skrypt zaczyna od `git archive -o fabryka_blysku.zip HEAD` (najszybszy i bez zależności). Jeśli archive się nie powiedzie, tworzy staging (preferuje pliki Git) i pakuje zipem, kończąc błędem gdy staging lub archiwum są puste.

> Jeśli widzisz komunikat o pustym archiwum, sprawdź, czy uruchamiasz skrypt z katalogu projektu i masz uprawnienia do tworzenia plików w bieżącym katalogu.
