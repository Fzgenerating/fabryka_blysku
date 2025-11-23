# Jak podłączyć prawdziwe opinie z Google

Sekcja opinii na stronie oczekuje, że podasz w HTML-u elementowi `#reviews-container` atrybut `data-endpoint` wskazujący Twój backend. Backend musi wywołać Google Places Details (lub Nearby Search + Place Details) i zwrócić listę recenzji w formacie JSON.

## Co musisz mi dostarczyć
- **Adres endpointu HTTPS**, z którego można pobrać recenzje. To może być Twój serwer/proxy do Google Places/Maps.
- **Identyfikator miejsca (`place_id`)** Twojej wizytówki Google (np. `ChIJe103_2QzGUcRIfVGtLDCsEM`).
- **Sposób autoryzacji** dla żądań (np. nagłówek `Authorization: Bearer <token>` lub klucz w query stringu). Jeśli endpoint jest publiczny bez autoryzacji, napisz to wprost.
- **Format JSON** zwracany przez endpoint. Minimalnie potrzebne pola na każdy wpis:
  - `author_name` – nazwa autora,
  - `rating` – liczba (szukamy tylko 5★),
  - `relative_time_description` – np. "2 tygodnie temu",
  - `text` – treść opinii,
  - `profile_photo_url` – URL do awatara (opcjonalne),
  - `url` – link do oryginalnej opinii na Google (opcjonalne, ale mile widziane).

## Jak to zostanie wpięte
1. W HTML ustawimy: `<section id="reviews-container" data-endpoint="https://twoj-serwer.pl/api/google-reviews"></section>`.
2. Skrypt `script.js` pobierze dane z `data-endpoint`. Gdy odpowiedź będzie poprawna i zawiera 5★ recenzje, zostaną wyrenderowane zamiast danych przykładowych.
3. Jeśli endpoint zwróci błąd lub pustą listę, pozostanie fallback z lokalnego `data/reviews.json`.

## Wymagania po stronie backendu
- Musi filtrować lub przekazywać pełne dane z Google; frontend i tak wybierze tylko wpisy z `rating === 5`.
- Powinien ustawić nagłówki CORS, aby frontend mógł pobrać dane z domeny, na której stoi Twoja strona (np. `Access-Control-Allow-Origin: https://fabrykablysku.pl`).
- Dobrze, jeśli cache'ujesz odpowiedź (np. 5–15 minut), żeby nie przekraczać limitów Google.

## Dane testowe
Jeśli nie podasz endpointu lub coś pójdzie nie tak, frontend automatycznie użyje lokalnych przykładowych opinii 5★ z `data/reviews.json`, więc sekcja nigdy nie będzie pusta.
