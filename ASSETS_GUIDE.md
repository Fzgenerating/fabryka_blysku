# Instrukcja dodania własnych plików binarnych

Ten repozytorium nie zawiera binarnych grafik, żeby uniknąć błędów przy generowaniu ZIP/PR. Dodaj je ręcznie po wypakowaniu, korzystając z poniższych ścieżek i nazw.

## Logo
- **Plik:** `assets/img/logo-klasyk-portowy.jpg`
- **Zalecenia:** JPG 500–800 px szerokości, tło przezroczyste lub ciemne; pozostaw plik SVG (`assets/img/logo-klasyk-portowy.svg`) jako fallback.
- **Użycie:** nawigacja i favicon/zakładki w `index.html`.

## Galeria
- **Folder:** `assets/img/gallery/`
- **Pliki przykładowe:** `slide1.jpg|png|webp`, `slide2...`, `slide3...` (możesz dodać kolejne `slide4` itd.).
- **Zalecenia:** minimum 1600 px dłuższy bok, proporcje dowolne; opis alt/etykiety możesz edytować w `data/gallery.json`.
- **Fallback:** jeśli folder jest pusty, strona pokaże placeholder `placeholder.svg` i komunikat.

## Tło hero (wnętrze barbershopu)
- **Plik:** `assets/img/hero/interior.jpg`
- **Zalecenia:** poziome ujęcie wnętrza, min. 1800 px szerokości; ciemniejsze brzegi pomagają w czytelności tekstu.
- **Użycie:** pełnoekranowe tło sekcji startowej w `index.html` (styl w `style.css`).

## Zespół (sekcja „O nas”)
- **Folder:** `assets/img/barbers/`
- **Nazwy:**
  - `sergiusz.jpg`
  - `olka.jpg`
  - `slawek.jpg`
  - `kamil.jpg`
  - `sandra.jpg`
- **Zalecenia:** kadry w poziomie lub kwadrat, ~800 px, bez tła wrażliwego na kompresję. Bez pliku użyje się `placeholder.svg`.

## Stare logo myjni
- **Opcjonalnie:** `assets/img/logo-fabryka-blysku.png` – tylko jeśli potrzebujesz archiwalnej wersji; nie jest używana na stronie barbershopu.

Po dodaniu plików odśwież stronę (Ctrl/Cmd+Shift+R), aby galeria i sekcje wczytały nowe grafiki.
