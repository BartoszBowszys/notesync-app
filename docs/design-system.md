# NoteSync — Design System

Wspólny design system dla PWA (`pwa/src/styles/theme.css`) i przyszłej aplikacji mobilnej (Expo). Wartości w tabelach to źródło prawdy — w mobile należy odwzorować te same hex-y w `mobile/src/theme.ts`.

## Kolory

| Token | Light | Dark | Użycie |
|---|---|---|---|
| `color-bg` | `#f8fafc` | `#0f172a` | tło aplikacji |
| `color-surface` | `#ffffff` | `#1e293b` | karty, panele |
| `color-surface-alt` | `#f1f5f9` | `#273549` | tło inputów, chipów |
| `color-border` | `#e2e8f0` | `#334155` | obramowania |
| `color-text` | `#0f172a` | `#f1f5f9` | tekst podstawowy |
| `color-text-muted` | `#64748b` | `#94a3b8` | tekst drugorzędny |
| `color-accent` | `#6366f1` | `#818cf8` | akcent (indygo/fiolet) — przyciski, linki, aktywne tagi |
| `color-accent-hover` | `#4f46e5` | `#a5b4fc` | hover/active accentu |
| `color-danger` | `#dc2626` | `#f87171` | usuwanie, błędy |
| `color-success` | `#16a34a` | `#4ade80` | potwierdzenia, sync OK |

## Typografia

- Font: **Inter** (fallback: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`)
- Skala: `xs` 0.75rem, `sm` 0.875rem, `base` 1rem, `lg` 1.25rem, `xl` 1.5rem

## Spacing / radius

- Spacing scale: 0.25 / 0.5 / 0.75 / 1 / 1.5 / 2 rem
- Radius: `sm` 6px, `md` 10px, `lg` 16px (karty notatek, modale)

## Komponenty

- **NoteCard** — karta notatki na liście: tytuł, skrócona treść, lista `TagBadge`, data ostatniej edycji
- **TagBadge** — pill/chip z nazwą tagu, wariant klikalny (filtr) i statyczny (wyświetlanie)
- **SearchBar** — pole wyszukiwania treści notatek z ikoną i debounce
- **NoteEditor** — formularz edycji notatki (tytuł, treść, wybór/dodawanie tagów)
- **AuthForm** — formularz logowania/rejestracji z przełącznikiem trybu i komunikatem błędu

## Dostępność

- Kontrast tekstu vs. tło ≥ 4.5:1 w obu motywach (sprawdzone dla podanych par kolorów)
- Motyw jasny/ciemny przełączany manualnie (przycisk w nawigacji) i domyślnie wg `prefers-color-scheme`
- Wszystkie interaktywne elementy mają widoczny `:focus-visible` outline w kolorze akcentu
