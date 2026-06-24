# NoteSync — Raport z testów

Data ostatniego pełnego przebiegu: 2026-06-24.

## 1. Backend — pytest

**Lokalizacja:** `backend/app/tests/`
**Uruchomienie:** `cd backend && .venv\Scripts\python.exe -m pytest -v`
**Strategia:** każdy test dostaje świeżą bazę SQLite in-memory (fixture `db_session` w `conftest.py`, podstawiona pod zależność `get_db` FastAPI), więc testy są w pełni izolowane i nie wymagają działającego kontenera PostgreSQL. Sama logika ORM (modele, relacje, zapytania) jest identyczna jak na produkcji — różni się tylko silnik bazy.

**Wynik:** `22 passed in 6.97s`

| Plik | Liczba testów | Co sprawdza |
|---|---|---|
| `test_auth.py` | 7 | rejestracja (sukces, duplikat e-maila, zbyt krótkie hasło), logowanie (sukces, błędne hasło, nieistniejący e-mail), brak tokenu → `403` na `/notes` |
| `test_notes.py` | 11 | pełny CRUD notatek, 404 dla nieistniejącej/cudzej notatki, filtrowanie po tagu (`?tag=`), wyszukiwanie po treści (`?search=`), izolacja notatek i tagów między kontami |
| `test_tags.py` | 5 | tworzenie/listowanie tagów, odrzucenie duplikatu, wymóg autoryzacji, izolacja tagów między kontami |

**Pokrycie:** wszystkie endpointy z `/auth`, `/notes`, `/tags` mają co najmniej jeden test happy-path i jeden test błędu/uprawnień. Nie są objęte testami: Alembic (migracje weryfikowane manualnie przy wdrożeniu), CORS (weryfikacja manualna w przeglądarce — patrz sekcja PWA).

## 2. PWA — Jest + React Testing Library

**Lokalizacja:** `pwa/src/**/*.test.{ts,tsx}`
**Uruchomienie:** `cd pwa && npm test`
**Konfiguracja:** `jest.config.cjs` (preset `ts-jest`, środowisko `jest-environment-jsdom`, własny `tsconfig.jest.json` — projekt główny używa ustawień "bundler mode" Vite niekompatybilnych z transformacją CommonJS, której wymaga Jest, dlatego testy mają osobny tsconfig). Pliki testowe i `src/test/setup.ts` są wykluczone z `tsconfig.app.json`, żeby nie wchodziły do właściwego builda produkcyjnego.

**Wynik:** `5 suites, 24 passed`

| Plik | Liczba testów | Co sprawdza |
|---|---|---|
| `utils/noteContent.test.ts` | 7 | parsowanie/serializacja treści notatki ze zdjęciami (znacznik `[notesync-photo]:`), round-trip parse→serialize |
| `components/TagBadge.test.tsx` | 4 | renderowanie nazwy tagu, wariant statyczny vs. klikalny, `aria-pressed` dla aktywnego tagu, wywołanie `onClick` |
| `components/SearchBar.test.tsx` | 2 | wyświetlanie aktualnej wartości, debounce 300 ms przed wywołaniem `onChange` |
| `components/NoteCard.test.tsx` | 6 | tytuł/treść/tagi, placeholder "Bez tytułu", odznaka "oczekuje na sync" dla notatek z `temp-` id, ukrywanie surowego base64 zdjęcia za ikoną 📷, link do `/notes/:id` |
| `components/AuthForm.test.tsx` | 5 | teksty w trybie logowania/rejestracji, wywołanie `onSubmit` z danymi formularza, wyświetlenie błędu po odrzuceniu, przełączanie trybu |

**Pokrycie:** komponenty prezentacyjne i czysta logika (`noteContent`) są przetestowane jednostkowo. Strony (`AuthPage`, `NotesPage`, `EditorPage`) oraz warstwa offline (`offline/*`) nie mają testów jednostkowych — zależą od `import.meta.env` (Vite) i są zweryfikowane end-to-end manualnie (patrz sekcja 4).

## 3. Backend — testy manualne endpointów

Przed napisaniem pytest wszystkie endpointy zostały też przetestowane ręcznie przez `Invoke-RestMethod` na żywym serwerze (PostgreSQL w Dockerze): rejestracja, duplikat e-maila, logowanie błędne/poprawne, dostęp bez tokenu, CRUD notatek, filtrowanie po tagu, wyszukiwanie po treści, izolacja danych między kontami, Swagger UI pod `/docs`. Wyniki — wszystkie zgodne z oczekiwaniami (patrz historia commitów `feat: backend FastAPI...`).

## 4. PWA — testy end-to-end (manualne, Playwright jednorazowo)

Podczas budowy PWA przepływ użytkownika został zweryfikowany w prawdziwej przeglądarce (Chromium) na **production buildzie** (`npm run build && npm run preview`) — testowanie trybu offline na `vite dev` nie ma sensu, bo serwer deweloperski serwuje surowe moduły ES przez sieć i "offline" w przeglądarce blokuje całą stronę, nie tylko wywołania API.

Zweryfikowano: rejestracja → przekierowanie na `/notes`, tworzenie notatki z tagiem, wyszukiwanie po treści, filtrowanie po tagu, **przeładowanie strony offline** (Service Worker + IndexedDB serwują dane bez sieci), **tworzenie notatki offline** (odznaka "oczekuje na sync"), powrót online → automatyczna synchronizacja (odznaka znika, notatka trafia na serwer). Narzędzie (Playwright) było użyte tylko do tej jednorazowej weryfikacji i nie jest zależnością projektu.

## 5. Aplikacja mobilna — testy manualne (Expo Go)

Brak automatycznych testów dla `mobile/` (poza statyczną weryfikacją `tsc --noEmit` i `expo-doctor`, które przechodzą bez błędów). Aplikacja została uruchomiona i przetestowana ręcznie na fizycznym telefonie Android przez Expo Go (połączenie tunelowane `npx expo start --tunnel`):

- logowanie/rejestracja (AuthScreen)
- lista notatek z wyszukiwarką i filtrami tagów (NotesScreen)
- edytor notatki: tytuł, treść, tagi, **zdjęcie z kamery** (EditorScreen + `expo-image-picker`/`expo-image-manipulator`)
- AsyncStorage jako cache offline (ten sam wzorzec co IndexedDB w PWA — `offline/notesRepository.ts`)

**Ograniczenie:** test ręczny, nie zautomatyzowany — instrukcja w sekcji 7 pozwala go powtórzyć.

## 6. Znane ograniczenia pokrycia testami

- Brak testów migracji Alembic (weryfikacja manualna przy każdym `alembic upgrade head`)
- Brak testów integracyjnych PWA↔backend i mobile↔backend w CI — wymagałyby działającego kontenera Postgres i są obecnie wykonywane manualnie
- Brak testów wydajnościowych/obciążeniowych (poza zakresem projektu semestralnego)

## 7. Jak odtworzyć testy lokalnie

```powershell
# Backend
cd backend
.venv\Scripts\python.exe -m pytest -v

# PWA
cd pwa
npm test

# Mobile (weryfikacja statyczna)
cd mobile
npx tsc --noEmit
npx expo-doctor
```
