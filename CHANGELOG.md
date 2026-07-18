# Changelog — daelsc/sharkord (custom fork)

Notable changes on the `development` branch of this fork. Upstream is
`Sharkord/sharkord`; release tags there (`v0.0.x`) are the upstream baseline.

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
