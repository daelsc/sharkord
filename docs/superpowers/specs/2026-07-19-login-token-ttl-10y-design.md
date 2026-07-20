# Design: Bump login JWT TTL to 10 years

**Date:** 2026-07-19
**Branch:** `development`
**Status:** Approved (option A1)

## Problem

Users must re-authenticate roughly weekly. Login issues a JWT with
`expiresIn: '604800s'` (7 days) at `apps/server/src/http/login.ts:283-284`.
There is no refresh-token / session-table layer — the client "auto-login"
feature (`apps/client/src/components/routing/auto-login-controller.tsx`)
merely persists the *same* JWT in `localStorage`, so once the JWT's `exp`
passes, server-side verification fails and the user is bounced to the
connect screen. The user wants login to be effectively permanent for
normal use.

## Decision (A1 — inline string bump)

Change the single `expiresIn` value in `login.ts`:

```ts
const token = jwt.sign({ userId: existingUser.id }, await getServerToken(), {
  expiresIn: '10y' // 10 years — effectively no re-auth for normal use
});
```

`jsonwebtoken` accepts the `'10y'` shorthand (resolved via `ms`). Value is
used in exactly one place, so a named constant in `packages/shared` is
not warranted. The `// 10 years …` comment keeps it self-documenting.

## Alternatives considered and rejected

- **A2 — named constant in `packages/shared/src/statics/storage.ts`**:
  matches the repo's existing TTL-constant pattern, but adds an export +
  import for a single-use value. Rejected in favor of the inline bump.
- **A3 — DB-backed server setting** (like `storageSignedUrlsTtlSeconds`):
  admin-tunable without redeploy. Far more work and not needed for this
  fork. Rejected.
- **B — long-lived login + server-side session table** (revocation,
  ban/password-change enforcement): rejected; user chose pure
  convenience (option A).
- **C — refresh-token / sliding sessions**: rejected; user chose pure
  convenience (option A).

## Security tradeoff (acknowledged and accepted)

A 10-year bearer JWT cannot be revoked per-token. Consequences, all
accepted by the user as the cost of "never re-authenticate":

- A leaked token (XSS, stolen laptop, leaked `localStorage` backup)
  grants access to that account for up to 10 years.
- Banning a user or changing their password does **not** invalidate an
  already-issued token.
- The only revocation lever is rotating the server secret
  (`getServerToken()`), which invalidates **all** tokens (forces a
  global re-login).

This is an explicit tradeoff, not an oversight. If revocation ever
becomes a requirement, revisit option B or C.

## Rollout

- The TTL change only affects **newly issued** tokens. Existing 7-day
  tokens continue to work until their own `exp`, then the user re-logs in
  once and receives a 10-year token. **No forced global re-login** (no
  server-secret rotation).
- No database migration. No client change. No config change.

## Scope of change

- `apps/server/src/http/login.ts` — one line (`expiresIn` value) + its
  comment.

## Testing

- Existing login tests (`apps/server/src/http/__tests__/login.test.ts`)
  assert only that `exp` and `iat` *exist* on the decoded JWT, not their
  values — so no test edits are required, and they remain green.
- No new tests needed for a constant change; the existing token-shape
  assertions cover it.
