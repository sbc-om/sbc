# Copilot instructions for this repo

## Project overview
- Next.js 16 App Router + React 19 + TypeScript + Tailwind v4.
- Locale-prefixed routing lives under [src/app/[locale]](src/app/%5Blocale%5D). Root layout reads the `x-locale` header and sets `dir` via `localeDir()` in [src/app/layout.tsx](src/app/layout.tsx#L45).
- Locale redirect/auth proxy logic is centralized in [src/proxy.ts](src/proxy.ts).

## I18n + layout patterns
- Dictionaries are dynamic imports in [src/lib/i18n/getDictionary.ts](src/lib/i18n/getDictionary.ts) and provided via `DictionaryProvider` in [src/lib/i18n/DictionaryProvider.tsx](src/lib/i18n/DictionaryProvider.tsx).
- For RTL/LTR decisions, use `localeDir()` from [src/lib/i18n/locales.ts](src/lib/i18n/locales.ts).
- The inline theme/scrollbar bootstrap script in [src/app/layout.tsx](src/app/layout.tsx#L72-L88) must stay first in `<head>` to avoid flash.

## Data + auth
- Data is stored in PostgreSQL via [src/lib/db/postgres.ts](src/lib/db/postgres.ts); entity operations are in [src/lib/db](src/lib/db).
- Auth is JWT-in-cookie using `jose` in [src/lib/auth/jwt.ts](src/lib/auth/jwt.ts); session lookup is `getCurrentUser()` in [src/lib/auth/currentUser.ts](src/lib/auth/currentUser.ts).

## API conventions
- App Router API routes live under [src/app/api](src/app/api). Most handlers parse input with `zod` and return `NextResponse.json({ ok: ... })`.
- Swagger JSDoc blocks on routes are used alongside the OpenAPI spec in [src/lib/api/openapi.ts](src/lib/api/openapi.ts) and UI at [src/app/api-docs/page.tsx](src/app/api-docs/page.tsx).

## Store/client split
- Server-only store access is in [src/lib/store/products.ts](src/lib/store/products.ts); client cart state is in [src/components/store/CartProvider.tsx](src/components/store/CartProvider.tsx) and UI in [src/components/store/CartFloating.tsx](src/components/store/CartFloating.tsx).

## Dev workflows
- Use pnpm scripts from package.json: `dev`, `build`, `start`, `lint`, plus data/ops scripts `seed`, `generate-vapid`, `generate-icons`, `generate-encryption-key`.