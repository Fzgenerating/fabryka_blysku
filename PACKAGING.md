# Jak spakować projekt do ZIP (bez pustego archiwum)

Domyślnie skrypty pakują **pełne repozytorium wraz z katalogiem `.git`**, aby po rozpakowaniu można było od razu tworzyć własne gałęzie. Jeśli zależy Ci na lżejszym archiwum bez historii, dodaj przełącznik `--lite` lub `--no-git`. W obu trybach skrypty pilnują, by wynikowy ZIP nie był pusty (kontrola stagingu i samego archiwum).

## Windows (PowerShell)
1. Otwórz PowerShell w katalogu repozytorium.
2. Uruchom (domyślnie z `.git`, gotowe do pracy na branchach):
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\package.ps1
   ```
   Lub wariant lekki bez `.git`:
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\package.ps1 --lite
   ```
3. W trybie lekkim skrypt najpierw spróbuje `git archive` (HEAD). Jeśli Git jest niedostępny lub potrzebujesz pełnej kopii z historią, kopiuje pliki do stagingu (zależnie od opcji, z lub bez `.git`), pakuje Compress-Archive i przerwie działanie, jeśli staging lub archiwum byłyby puste.

## Linux / macOS (bash)
1. W katalogu repozytorium wykonaj (domyślnie z `.git`):
   ```bash
   ./package.sh
   ```
   Lub wariant lekki bez `.git`:
   ```bash
   ./package.sh --lite
   ```
2. W trybie lekkim skrypt zaczyna od `git archive -o fabryka_blysku.zip HEAD`. W trybie domyślnym lub gdy archive się nie powiedzie, tworzy staging (z lub bez `.git`), pakuje zipem i kończy błędem, gdy staging lub archiwum są puste.

> Jeśli widzisz komunikat o pustym archiwum, sprawdź, czy uruchamiasz skrypt z katalogu projektu i masz uprawnienia do tworzenia plików w bieżącym katalogu.
