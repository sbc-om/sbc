# DB Type-Safety Checklist

Use this checklist for every new or modified file in `src/lib/db` to keep a consistent type-safe pattern.

## 1) Define Row Types
- Define an explicit `type ...Row` for each table/query result.
- Mark nullable database columns explicitly with `| null`.
- Keep field names in snake_case to match database columns.

## 2) Require query<RowType>
- Every `SELECT ...` or `RETURNING *` query should use an explicit generic:
  - `query<UserRow>(...)`
  - `query<WebsitePageRow>(...)`
- For aggregate/projection outputs (`COUNT`, `SUM`, custom aliases), define a dedicated type:
  - `query<{ count: string }>(...)`

## 3) Use Strongly Typed Mappers
- Write mappers with RowType input, not `QueryResultRow`:
  - `function rowToUser(row: UserRow): User`
- Keep mapping logic centralized in mapper functions:
  - snake_case -> camelCase
  - `null -> undefined` for optional fields
  - `Date -> ISO string`

## 4) Standardize null/undefined
- If a field is optional in `types.ts`, convert DB `null` to `undefined`.
- For required fields, provide safe fallbacks:
  - Dates: `row.created_at?.toISOString() || new Date().toISOString()`
  - Arrays: `row.features || []`

## 5) Avoid Scattered Casts
- Avoid these patterns:
  - `result.rows as SomeRow[]`
  - `const r = row as SomeRow` (except truly rare edge cases)
- Prefer explicit `query<RowType>` generics instead of local casts.

## 6) Transaction queries
- Inside `transaction`, add explicit generics to `client.query` as well:
  - `client.query<UserRow>(...)`
- Map transaction outputs before returning.

## 7) Keep API-Compatible Outputs Typed
- Alias functions (`export const ... = ...`) must preserve the same typed return shape.
- For joined outputs, define a composed RowType:
  - `type SubscriptionWithUserRow = ProgramSubscriptionRow & { user_email: string | null; ... }`

## 8) Required Pre-Merge Checks
- `pnpm tsc --noEmit --pretty false`
- `pnpm lint`
- Both commands must pass without errors.

## 9) Quick grep audit
Before merge, these should be zero/minimal (except truly necessary cases):
- `QueryResultRow`
- `rows as ...Row[]`
- `as ...Row`

## 10) Definition of Done
- All output-producing queries use explicit generics.
- Mappers are strongly typed.
- null/undefined conversions are consistent with `types.ts`.
- `tsc` and `lint` both pass.
