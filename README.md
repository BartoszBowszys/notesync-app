# NoteSync

Organizer notatek z synchronizacją, tagami i wyszukiwaniem — projekt semestralny na przedmiot **"Projektowanie i programowanie aplikacji PWA i mobilnych cross-platform"** (WSB Merito Wrocław), realizowany przez:
Bartosz Bowszys 95957
Remigiusz Jasicki 96159
Oliwier Hanc 95941
Filip Sontowski 94602

Jedno konto, jeden backend, dwa kliencki: **PWA** (przeglądarka, offline-first) i **aplikacja mobilna** (Expo/React Native, z aparatem). Zmiana notatki w jednym kliencie jest widoczna w drugim po synchronizacji.

---

## 1. Cel aplikacji

NoteSync pozwala zapisywać notatki z tagami, przeszukiwać je po treści i tytule, filtrować po tagach oraz pracować offline — zarówno w przeglądarce, jak i na telefonie. Celem projektu było zbudowanie pełnego stosu (backend + REST API + PWA + mobile) z prawdziwym uwierzytelnianiem, synchronizacją offline i wdrożeniem produkcyjnym, a nie tylko prototypu działającego lokalnie.

---

## 2. Architektura

```
                     ┌──────────────────────┐
                     │     PostgreSQL        │
                     │   (Railway plugin)    │
                     └──────────┬─────────────┘
                                │ DATABASE_URL (private network)
                     ┌──────────┴─────────────┐
                     │   FastAPI backend       │
                     │   (Railway, Nixpacks)   │
                     │   /auth /notes /tags    │
                     └──────────┬─────────────┘
                                │ REST + JWT (Bearer)
                 ┌──────────────┴───────────────┐
                 │                              │
     ┌───────────┴───────────┐      ┌───────────┴───────────┐
     │      PWA (Vercel)      │      │   Mobile (Expo/EAS)    │
     │  React + Vite + SW     │      │  React Native + Expo   │
     │  IndexedDB (offline)   │      │  AsyncStorage (offline)│
     └─────────────────────────┘      └─────────────────────────┘
```

Oba klienci rozmawiają z tym samym REST API przez HTTPS i przechowują JWT lokalnie (PWA: `localStorage`, mobile: `expo-secure-store`). Każdy z nich ma własną warstwę cache'u offline z "outboxem" oczekujących zmian, synchronizowanym po powrocie online.

---

## 3. Uzasadnienie wyboru technologii

| Wybór | Dlaczego |
|---|---|
| **FastAPI** | Natywne wsparcie dla async, automatyczna walidacja przez Pydantic, darmowy Swagger UI pod `/docs` — szybka iteracja nad API i jego dokumentacją jednocześnie |
| **PostgreSQL** | Relacyjny model (User/Note/Tag/NoteTag z relacją wiele-do-wielu) naturalnie mapuje się na tabele z kluczami obcymi; dostępny jako zarządzany plugin na Railway |
| **SQLAlchemy 2.0 + Alembic** | Typowane modele ORM (`Mapped[...]`) i kontrolowane migracje schematu zamiast `create_all` na produkcji |
| **PyJWT + bcrypt** | Lżejsza alternatywa dla `python-jose`/`passlib` — mniej problemów z kompatybilnością wersji, ten sam efekt (HS256 JWT, bcrypt hash) |
| **React + Vite (PWA)** | Szybki dev server, natywne wsparcie ESM, łatwa integracja z `vite-plugin-pwa` (Workbox) bez ręcznej konfiguracji Service Workera |
| **IndexedDB (`idb`)** | Większy limit pojemności i strukturalne zapytania niż `localStorage` — potrzebne do cache'owania pełnych obiektów notatek offline |
| **React Native + Expo (mobile)** | Jeden kod na Android/iOS, dostęp do kamery przez `expo-image-picker` bez pisania natywnego kodu, EAS Build zdejmuje z dewelopera utrzymywanie Android Studio/Xcode |
| **React Navigation** | Standard w ekosystemie Expo, natywne przejścia między ekranami (stack) |
| **Railway (backend)** | Deploy z repo GitHub przez Nixpacks, wbudowany plugin PostgreSQL, automatyczne HTTPS |
| **Vercel (PWA)** | Natywne wsparcie Vite, deploy z CLI/GitHub, automatyczne HTTPS i CDN |

---

## 4. Endpointy API

Pełna interaktywna dokumentacja (Swagger) jest dostępna pod `/docs` na działającym backendzie, np. `https://notesync-app-production.up.railway.app/docs`.

### Auth (`/auth`)

| Metoda | Endpoint | Opis | Auth |
|---|---|---|---|
| POST | `/auth/register` | Rejestracja (email + hasło) | nie |
| POST | `/auth/login` | Logowanie, zwraca JWT (`access_token`) | nie |

### Notatki (`/notes`)

| Metoda | Endpoint | Opis | Auth |
|---|---|---|---|
| GET | `/notes` | Lista notatek; query: `?tag=<nazwa>`, `?search=<tekst>` (tytuł/treść) | tak |
| POST | `/notes` | Tworzenie notatki (`title`, `content`, `tag_ids`) | tak |
| GET | `/notes/{id}` | Szczegóły notatki | tak |
| PUT | `/notes/{id}` | Aktualizacja notatki | tak |
| DELETE | `/notes/{id}` | Usunięcie notatki | tak |

### Tagi (`/tags`)

| Metoda | Endpoint | Opis | Auth |
|---|---|---|---|
| GET | `/tags` | Lista tagów użytkownika | tak |
| POST | `/tags` | Tworzenie tagu (`name`, unikalny per użytkownik) | tak |

### Inne

| Metoda | Endpoint | Opis |
|---|---|---|
| GET | `/health` | Healthcheck (`{"status": "ok"}`) |
| GET | `/docs` | Swagger UI |

Autoryzacja: nagłówek `Authorization: Bearer <token>`. Notatki i tagi są zawsze filtrowane po `owner_id` zalogowanego użytkownika — brak możliwości odczytu/edycji danych innego konta.

---

## 5. Design system

Wspólny dla PWA i mobile (pełne wartości tokenów: [`docs/design-system.md`](docs/design-system.md)).

- **Kolory:** neutralne tło (`#f8fafc` / `#0f172a` w dark mode), akcent indygo/fiolet (`#6366f1`)
- **Typografia:** font systemowy (`system-ui` na PWA, natywny font platformy w RN) — bez ładowania zewnętrznych fontów
- **Komponenty współdzielone (osobne implementacje, te same tokeny):** `NoteCard`, `TagBadge`, `SearchBar`, `AuthForm`, edytor notatki (`EditorPage` / `EditorScreen`)
- **Dostępność:** kontrast tekst/tło ≥ 4.5:1, widoczny `:focus-visible`, motyw jasny/ciemny wg `prefers-color-scheme` + przełącznik manualny

---

## 6. Zaimplementowane funkcje

**Backend**
- CRUD notatek i tagów, filtrowanie po tagu i treści
- Rejestracja/logowanie JWT, autoryzacja Bearer na wszystkich chronionych endpointach
- Izolacja danych między kontami (testowana jednostkowo)
- Migracje schematu przez Alembic (uruchamiane automatycznie przy starcie)

**PWA**
- 3 widoki: logowanie/rejestracja, lista notatek (wyszukiwanie + filtr tagów), edytor notatki
- Manifest + Service Worker (Workbox `generateSW`), instalowalna jako PWA
- Tryb offline: cache notatek w IndexedDB, tworzenie/edycja notatek offline z odznaką "oczekuje na sync"
- Automatyczna synchronizacja po powrocie online
- Responsywność mobile-first

**Mobile**
- 3 ekrany: logowanie/rejestracja, lista notatek, edytor
- Ten sam REST API co PWA, JWT w `expo-secure-store`
- AsyncStorage jako cache offline + ten sam wzorzec "outboxa" co w PWA
- Natywna funkcja: **kamera** — zdjęcie dołączane do notatki (skompresowane, zapisane jako osadzony znacznik w treści notatki)
- Nawigacja przez React Navigation (stack)

**Wspólne**
- Jeden design system, jedno konto działające w obu klientach
- Synchronizacja widoczna między PWA i mobile po online

---

## 7. Zabezpieczenia

- **Hasła:** hashowane przez `bcrypt` (nigdy nie przechowywane w postaci czystego tekstu)
- **Sesja:** JWT (HS256) z czasem wygaśnięcia (`ACCESS_TOKEN_EXPIRE_MINUTES`), podpisywane sekretem z env (`SECRET_KEY`) — nie ma go w repozytorium, ustawiany jako zmienna środowiskowa na Railway
- **Autoryzacja:** każdy endpoint notatek/tagów wymaga poprawnego Bearer tokenu i filtruje dane po `owner_id` — brak dostępu do danych innego użytkownika nawet przy znanym ID zasobu (zwraca `404`, nie `403`, żeby nie zdradzać istnienia zasobu)
- **Walidacja wejścia:** Pydantic v2 na wszystkich payloadach (typy, długości, format email)
- **CORS:** `CORS_ORIGINS` jako lista dozwolonych originów (lokalne porty dev + domena produkcyjna PWA na Vercel), bez `allow_origins=["*"]`
- **Transport:** HTTPS wszędzie na produkcji (Railway i Vercel dają to out-of-the-box)
- **Przechowywanie tokenu po stronie klienta:** PWA — `localStorage` (czytelne ryzyko XSS, zaakceptowane jako standard dla SPA bez własnego backendu sesji); mobile — `expo-secure-store` (szyfrowany keystore systemowy, bezpieczniejszy niż AsyncStorage)

---

## 8. Raport z testów

Pełny raport: [`docs/raport-testow.md`](docs/raport-testow.md).

| Warstwa | Narzędzie | Wynik |
|---|---|---|
| Backend | pytest | 22/22 passed |
| PWA | Jest + React Testing Library | 24/24 passed (5 plików) |
| Backend | testy manualne (Invoke-RestMethod) | wszystkie endpointy zweryfikowane ręcznie |
| PWA | E2E manualne (Playwright, jednorazowo, nie jest zależnością projektu) | rejestracja, CRUD notatek, offline reload, sync po powrocie online |
| Mobile | manualne (Expo Go na fizycznym Androidzie) | logowanie, CRUD notatek, kamera, cache offline |

---

## 9. Instrukcja uruchomienia lokalnego

### Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
copy .env.example .env   # i ustaw DATABASE_URL / SECRET_KEY
.venv\Scripts\alembic upgrade head
.venv\Scripts\uvicorn app.main:app --reload
```

Backend wystartuje na `http://localhost:8000`, Swagger pod `http://localhost:8000/docs`. Wymaga działającego PostgreSQL (lokalnie np. przez Docker: `docker run -p 5432:5432 -e POSTGRES_USER=notesync -e POSTGRES_PASSWORD=notesync -e POSTGRES_DB=notesync postgres`).

### PWA

```powershell
cd pwa
npm install
copy .env.example .env   # VITE_API_URL=http://localhost:8000
npm run dev
```

### Mobile

```powershell
cd mobile
npm install
npx expo start --tunnel
```

Zeskanuj QR kod aplikacją Expo Go (SDK 54) na telefonie.

### Testy

```powershell
cd backend; .venv\Scripts\python.exe -m pytest -v
cd pwa; npm test
```

---

## 10. Wdrożenie produkcyjne

- **Backend:** Railway (Nixpacks, `railway.toml` + `Procfile`) — `https://notesync-app-production.up.railway.app`. Baza: plugin PostgreSQL na Railway, połączenie po wewnętrznej sieci (`DATABASE_URL` jako referencja do usługi Postgres). Migracje uruchamiane automatycznie przy starcie procesu (`RUN_MIGRATIONS_ON_STARTUP=true`).
- **PWA:** Vercel (`vercel.json`, build Vite) — `https://notesync-pwa.vercel.app`. Zmienna `VITE_API_URL` wskazuje na backend Railway.
- **Mobile:** EAS Build, profil `preview` (`eas.json`) — buduje instalowalny APK ze zmienną `EXPO_PUBLIC_API_URL` ustawioną na backend Railway, bez zależności od Expo Go.

---

## 11. Napotkane problemy i rozwiązania

- **Expo Go nie obsługiwało aktualnej wersji SDK projektu** — zamiast trzymać się jednej wersji, projekt był testowany pod kątem zgodności z SDK zainstalowanym na fizycznym telefonie (Expo SDK 54), z `expo install --fix` do uzgodnienia wersji zależności (React Navigation, `react-native-screens` itd.).
- **Windows + `node:sea` w `@expo/cli`** — starsza wersja CLI próbowała stworzyć katalog o nazwie zawierającej `:`, co jest niedozwolone na Windows. Problem zniknął po aktualizacji do nowszej wersji `@expo/cli` (poprawione upstream).
- **Domena Railway routingowała na port 443 zamiast na port, na którym faktycznie słuchał kontener (8080)** — efekt: `502 Bad Gateway` / "Application failed to respond" mimo poprawnie wystartowanej aplikacji. Naprawione przez ręczne ustawienie target portu domeny.
- **Zmienna `DATABASE_URL` na Railway wskazywała na nieistniejącą bazę** (w projekcie nigdy nie dodano realnego pluginu PostgreSQL) — naprawione dodaniem usługi Postgres i podlinkowaniem `DATABASE_URL` jako referencji do niej.
- **Railway nie uruchamiał `startCommand` z `railway.toml`/`Procfile`** (najpewniej nadpisany wcześniej ręcznie w dashboardzie), więc migracje Alembic nigdy się nie wykonywały — naprawione przeniesieniem `alembic upgrade head` do `lifespan` FastAPI, włączane zmienną środowiskową, niezależnie od tego, jaką komendę startową faktycznie wywoła platforma.
- **Railway wstrzykuje `DATABASE_URL` ze schematem `postgres://`/`postgresql://` bez sterownika** — SQLAlchemy 2.0 wymaga `postgresql+psycopg2://`; dodano normalizację w `app/config.py`.
- **Brak natywnego pola na zdjęcie w schemacie notatki** — zamiast migracji bazy, zdjęcie z kamery jest kompresowane do base64 i osadzane jako dedykowana linia w treści notatki (`[notesync-photo]:<dataURI>`), parsowana/wyświetlana przez wspólny helper (`noteContent.ts`) w obu klientach.
- **Jest vs. Vite tsconfig** — ustawienia "bundler mode" Vite są niekompatybilne z transformacją CommonJS wymaganą przez `ts-jest`; rozwiązane osobnym `tsconfig.jest.json` tylko dla testów.

---

## 12. Możliwości rozwoju

- Wspólny mechanizm rozwiązywania konfliktów synchronizacji (obecnie: "ostatni zapis wygrywa")
- Współdzielenie notatek między kontami / linki publiczne
- Prawdziwe pole na obrazy w schemacie notatki (zamiast osadzania base64 w treści)
- Powiadomienia push (mobile) jako alternatywna druga funkcja natywna
- Testy integracyjne PWA↔backend i mobile↔backend w CI (obecnie manualne)
- Paginacja listy notatek przy większej skali danych
