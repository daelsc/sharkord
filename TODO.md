# TODO — daelsc/sharkord (custom fork)

Open items after the 2026-07-17 v0.0.23 rebase + deploy (see CHANGELOG.md).

## After a few days of stable production use of v0.0.23-custom.1

### Branch cleanup (origin) — verify each is fully contained in `development` before deleting
- [ ] `feature/ghcr-docker` — the GHCR workflow is now on `development`; `fba56a1` was the last deployed pre-v0.0.23 build.
- [ ] `feature/hardware-codec-priority` — superseded by upstream's simulcast + the H.264 codec commit on `development`.
- [ ] `feature/hide-own-screen-share` — feature already in upstream v0.0.23.
- [ ] `feature/vertical-layout` — net-zero (added then removed).
- [ ] `feature/disable-user-streams` — verify; the per-user stream disable is on `development`.
- [ ] `35-plugins`, `97-add-windows-build-info`, `239-bug-floating-media-controls-is-overlapping-the-left-panel` — unknown status; verify before touching.

### Local cleanup
- [ ] Delete local backup tags once confident:
      `backup/pre-rebase-2026-07-17-{development,ghcr-docker,hw-codec-priority}`
      (also pushed to origin — delete there too).
- [ ] Delete local backup branches:
      `backup/development-old`, `backup/feature-ghcr-docker-old`.

### Deployment artifacts cleanup (on duper)
- [ ] Delete rollback image once confident:
      `ghcr.io/daelsc/sharkord:rollback-pre-v0.0.23`
      (`docker rmi ghcr.io/daelsc/sharkord:rollback-pre-v0.0.23`).
- [ ] Remove appdata backups once confident:
      `/mnt/user/appdata/sharkord/_backups/`
      (`db.sqlite.pre-v0.0.23-…`, `config.ini.pre-v0.0.23-…`,
      `drizzle.pre-v0.0.23-…`).

## Optional / nice-to-have
- [ ] Consider retagging future custom builds consistently
      (e.g. `v0.0.<upstream>-custom.<n>`) and tagging the deployed
      commit each time, as done this round (`v0.0.23-custom.1`).
- [ ] The `ghcr-publish.yml` trigger is `push: [feature/ghcr-docker]` +
      `workflow_dispatch`. Since builds now come from `development`,
      consider changing the trigger to `push: [development]` (or adding
      it) so merges auto-build. Currently requires a manual
      `workflow_dispatch` run.

## Monitoring
- [ ] Watch `docker logs -f Sharkord-Custom` on duper over the next few
      days for any errors from the merged voice-card code path
      (StreamToggleButton / screen-share indicator) once users exercise
      voice. If a merged control misbehaves, rollback is the one-liner in
      CHANGELOG (old image preserved as
      `ghcr.io/daelsc/sharkord:rollback-pre-v0.0.23`).
