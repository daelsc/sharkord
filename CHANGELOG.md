# Changelog — daelsc/sharkord (custom fork)

Notable changes on the `development` branch of this fork. Upstream is
`Sharkord/sharkord`; release tags there (`v0.0.x`) are the upstream baseline.

## 2026-07-19 — Login JWT TTL bumped to 10 years + deployed to duper

### Summary
Users had to re-authenticate roughly weekly because the login JWT
expired after 7 days (`expiresIn: '604800s'`) and there is no
refresh-token / session-table layer — the client `auto-login` merely
persists the *same* JWT in `localStorage`, so once `exp` passed the
user was bounced to the connect screen. Bumped the TTL to 10 years so
normal users effectively never re-authenticate.

### Change
- `apps/server/src/http/login.ts` — single change: `expiresIn: '604800s'`
  → `expiresIn: '10y'` (one line + comment). No DB migration, no client
  change, no config change.
- Design spec (option A1, approved):
  `docs/superpowers/specs/2026-07-19-login-token-ttl-10y-design.md`
  (commit `ec9f977`). Alternatives A2 (named constant), A3 (DB-backed
  setting), B (session table / revocation), and C (refresh tokens) were
  considered and rejected in favor of the inline bump.

### Security tradeoff (acknowledged and accepted)
A 10-year bearer JWT cannot be revoked per-token: a leaked token grants
access for up to 10 years; banning a user or changing their password
does **not** invalidate an already-issued token; the only revocation
lever is rotating the server secret, which invalidates *all* tokens
(forces a global re-login). Explicit tradeoff for "never re-auth",
not an oversight. Revisit option B or C if revocation is ever needed.

### Verification (local, pre-deploy)
- `bun run check-types`: 0 errors, 7/7 workspaces
- `bun run test`: 775 pass, 0 fail
- `bun run lint`: 0 errors (warnings pre-existing)
- `bun run format:check`: 0 errors, 7/7 workspaces

### Deployment
- `development` @ `cd05bf0` pushed to origin.
- GHCR build via `ghcr-publish.yml` (`workflow_dispatch` on
  `development`), run `29712053984` → `build-and-publish` green in
  1m28s. Image `ghcr.io/daelsc/sharkord:latest` + `:cd05bf0`
  (digest `sha256:00ba58cf8d7612c0f85bbeaf3badaccbb121a1745891101b3db259c4a4fadcdd`).
- Deployed to `Sharkord-Custom` on `duper` (Unraid): tagged the running
  image as `ghcr.io/daelsc/sharkord:rollback-pre-ttl-bump`
  (old image `eca4f98f11bf`); backed up `db.sqlite` + `config.ini` +
  `drizzle/` to
  `/mnt/user/appdata/sharkord/_backups/20260719-191156-pre-ttl-bump/`;
  pulled new image (`1b27189c03e3`); `docker stop`→`rm`→`run` with
  identical params (name `Sharkord-Custom`, ports 4991/40000, volume
  `/mnt/user/appdata/sharkord:/home/bun/.config/sharkord`, env
  `SHARKORD_WEBRTC_ANNOUNCED_ADDRESS=sharkord.thesemite.com` + `TZ` +
  `RUNNING_IN_DOCKER=true`); verified boot banner `SHARKORD v0.0.23`,
  HTTP 200 (local + public via Nginx Proxy Manager), 0 restarts, no
  error lines; a real client (`DaveFiveFiddy`) auto-reconnected on
  boot, confirming the auth/tRPC path on the new image.
- **Rollout:** only newly issued tokens get the 10y TTL; existing 7-day
  tokens keep working until their own `exp`, then the user re-logs in
  once and gets a 10y token. No forced global re-login (no secret
  rotation).
- **Rollback (one-liner):** `docker stop`→`rm` + `docker run ...`
  `ghcr.io/daelsc/sharkord:rollback-pre-ttl-bump` (old image preserved).

### Repo state
- `development` @ `cd05bf0` pushed to origin (this entry added in a
  follow-up commit).
- No tag cut for this change (single-line TTL bump; not a release).

## 2026-07-17 — Rebased onto upstream v0.0.23 + deployed to duper

### Summary
Jumped the fork from v0.0.16 (7 releases behind) to upstream **v0.0.23**
and carried over the custom patches that were previously deployed via the
`feature/ghcr-docker` branch. Built and deployed the result to the live
server (`Sharkord-Custom` on `duper`, Unraid) running at
`sharkord.thesemite.com`.

### Base
- Reset `development` from `e3275d4` (v0.0.16 + 2 net-zero codec commits)
  to upstream `v0.0.23` (`06ef133`). The 2 old codec commits cancelled each
  other out (verified empty diff) and were dropped.

### Patches carried onto v0.0.23 (9 commits on top of base)
- GHCR docker publish workflow (`.github/workflows/ghcr-publish.yml`)
- Per-user video/screen stream disable with bandwidth saving — uses
  mediasoup `consumer.pause()`/`resume()` via new `pauseConsumer`/
  `resumeConsumer` tRPC routes. Merged into upstream's rewritten
  simulcast/voice stack (kept both `StreamToggleButton` and upstream's
  `QualityButton` + `PictureInPictureButton`).
- Make video/screen icons clickable to toggle streams in the sidebar
- Clicking own screen-share icon toggles hide-own-screen-share
- Streaming/camera indicator above the voice status bar
- Show app/window name in the screen-share indicator (uses the
  `MediaStreamTrack` label from `getDisplayMedia`)
- Show friendly name instead of raw track ID in the screen-share indicator
- Prefer H.264 codec order for NVENC hardware encoding (see note below)
- `style`: prettier-format `voice-provider` after merge

### Notes on patches that were intentionally NOT carried
- **Hide own screen share** (`8815896`) — upstream v0.0.23 already
  implements the same feature (`useHideOwnScreenShare` hook, selector,
  reducer, toggle). Redundant.
- **Vertical layout / responsive grid + mute-stream-audio-by-default**
  (`62854db`, `1094230`, `d6f93cc`) — net-zero across the three commits;
  the final deployed branch (`feature/ghcr-docker` @ `fba56a1`) had
  already removed vertical layout in favor of upstream's dynamic grid and
  reverted mute-by-default. Nothing to keep.
- The 4 codec-preference commits from the old `development` branch
  cancelled/superseded. (The H.264 NVENC preference was re-applied
  cleanly on top of v0.0.23's codec entries — see commit `2e395f2`.)

### Codec note (important)
The previously-deployed build reordered mediasoup video codecs to
H.264-first for NVENC. Upstream v0.0.23 kept VP9-first and added
`x-google-start-bitrate` hints for its new simulcast support (#735).
Re-applied the H.264-first *order* while *preserving* upstream's bitrate
hints. Safe because v0.0.23's simulcast is hardcoded to VP8 client-side
(`getSimulcastCodec` only matches VP8), so codec order only affects the
non-simulcast publish path and cannot regress simulcast.

### Verification (all on the final pre-push state)
- `bun run check-types`: 0 errors, 7/7 workspaces
- `bun run test`: 775 pass, 0 fail
- `bun run lint`: 0 errors (warnings pre-existing)
- `bun run format:check`: 0 errors, 7/7 workspaces
- client build (vite) + server build (tsc + cross-compiled win/mac): exit 0
- server boot smoke test: HTTP listens, mediasoup worker loads, voice
  runtime initializes, tRPC router registers — no crash

### Deployment
- Image built via `ghcr-publish.yml` (workflow_dispatch on `development`)
  → pushed `ghcr.io/daelsc/sharkord:latest`
  (digest `sha256:5587542c84b79c60d124e16218409a69d29c1f4d8d3dc491254b6eaddbacd820`)
  and `:<sha>`.
- Deployed to `Sharkord-Custom` on `duper` (Unraid): backed up
  `db.sqlite` + `config.ini` + `drizzle/` to
  `/mnt/user/appdata/sharkord/_backups/` (timestamped 20260717-224841);
  tagged the old image as `ghcr.io/daelsc/sharkord:rollback-pre-v0.0.23`;
  pulled new image; `docker stop`→`rm`→`run` with identical params
  (autostart preserved); verified boot banner `SHARKORD v0.0.23`, HTTP 200
  (local + public via Nginx Proxy Manager), mediasoup worker alive,
  migrations 0012–0016 applied, 0 restarts, no error lines.
- Confirmed live with a real login + voice check.

### Repo state
- `development` @ `2e395f2` pushed to origin.
- `main` fast-forwarded from v0.0.15 → `2e395f2` (clean FF, no force).
- Tag `v0.0.23-custom.1` marks the deployed commit (annotated).
- Backup tags pushed offsite:
  `backup/pre-rebase-2026-07-17-{development,ghcr-docker,hw-codec-priority}`.
- Upstream release tags `v0.0.16`–`v0.0.23` deliberately NOT pushed
  (they belong to `Sharkord/sharkord`).
