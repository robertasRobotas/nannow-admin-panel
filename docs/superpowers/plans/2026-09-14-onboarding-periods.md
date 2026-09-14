# Onboarding period freshness implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Make onboarding charts return fresh, consistent data for overlapping year, month, week, and day ranges.

**Architecture:** Retain monthly snapshots, introduce bounded freshness, bypass snapshots on explicit rebuilds, and avoid persisting future months. Preserve the endpoint response and existing registration-cohort metric.

**Tech Stack:** Express, TypeScript, Mongoose, Vitest; Next.js/React consumer.

**Spec:** User request: investigate `/analytics`, where year shows onboarding but shorter periods are empty, and plan the fix. This document records the investigation and proposed implementation; implementation is not yet performed.

## Evidence and limits

Backend paths below are relative to sibling repository `/Users/andriilazarev/Projects/nannow/nannow-api`.

- `src/api/admin/methods/getOnboardingRegistrationsByDay.ts:294`: `loadMonthlySnapshot` returns any existing snapshot without checking age, including empty snapshots.
- Same file, `getMonthKeysInRange`: a full-year request includes future months. `buildMonthlySnapshot` persists their empty results; those results remain cached when the months arrive.
- Same file, `rebuildOnboardingRegistrationsByDay`: the rebuild path calls the same cache reader, so the maintenance script does not actually refresh existing snapshots.
- Reproduced using the actual module transpiled with TypeScript and mocked model dependencies: March cached data, September cached empty data, and a database aggregation mock containing September registrations. Year returned March; September/month/week/day returned empty. Aggregate calls: 0. Snapshot writes: 0, including explicit rebuild calls.
- Frontend `components/Analytics/Analytics.tsx:1698` directly uses response `items`; the empty message at line 939 means the array is empty, not that the chart hides nonzero bars.
- The supplied year screenshot ends on June 6. It does not itself establish that current-month September data appears in the year view. Production responses and snapshot timestamps have not been inspected; the cache defect is confirmed locally, production attribution remains to verify.
- Additional issue: frontend custom date boundaries use browser timezone while requests specify Europe/Vilnius. This can shift boundary days, but does not explain several months of missing data. Handle separately from the cache fix.
- Metric semantics: both series are grouped by user `createdAt`; finished means currently complete among that registration cohort, not completions occurring on that day. Keep this definition for this fix.

## Global constraints

- No production data changes during diagnosis.
- Preserve `[dateFrom, dateTo)` and Europe/Vilnius day grouping.
- Keep historical snapshots refreshable because onboarding status can change after registration.
- Do not claim a day has registrations solely because its containing year does.

## Task 1: Correct snapshot freshness and rebuild semantics

**Files:** Modify `src/api/admin/methods/getOnboardingRegistrationsByDay.ts`; extend existing `src/api/admin/methods/getOnboardingRegistrationsByDay.test.ts`. Existing model timestamps already supply `updatedAt`.

**Interfaces:** Public get/rebuild signatures and response stay unchanged. Internally pass `forceRebuild: boolean` and a single request `now: Date` through range loading. Add `updatedAt?: Date` to the snapshot type.

- [ ] Add failing regressions using existing mocks. Representative test:

```ts
it("rebuilds an existing empty snapshot", async () => {
  const row = {
    day: "2026-09-14", clientRawRegistrations: 3,
    clientFinishedOnboarding: 1, providerRawRegistrations: 2,
    providerFinishedOnboarding: 1,
  };
  (AnalyticsOnboardingRegistrationsMonthlyModel.findOne as Mock).mockReturnValue({
    lean: vi.fn().mockResolvedValue({ items: [], updatedAt: new Date() }),
  });
  (UserModel.aggregate as Mock).mockResolvedValue([row]);
  const result = await rebuildOnboardingRegistrationsByDay({
    period: "custom", timezone: "Europe/Vilnius",
    dateFrom: new Date("2026-08-31T21:00:00Z"),
    dateTo: new Date("2026-09-30T21:00:00Z"),
  });
  expect(result.items).toEqual([row]);
  expect(UserModel.aggregate).toHaveBeenCalledTimes(1);
  expect(AnalyticsOnboardingRegistrationsMonthlyModel.updateOne).toHaveBeenCalledTimes(1);
});
```

- [ ] Run `npm test -- src/api/admin/methods/getOnboardingRegistrationsByDay.test.ts` in the API repo; confirm the new regression fails on the existing implementation.
- [ ] Separate normal reads from explicit rebuilds. Normal reads use `forceRebuild=false`; explicit rebuilds use `true`. Rebuild each requested nonfuture month via `buildMonthlySnapshot` when forced.
- [ ] Apply a proposed five-minute TTL to all snapshots, including historical months. Missing/invalid timestamps are stale. Capture `now` once per request. Cache reuse predicate:

```ts
const SNAPSHOT_TTL_MS = 5 * 60 * 1000;
const updatedAtMs = cached?.updatedAt
  ? new Date(cached.updatedAt).getTime()
  : Number.NaN;
const ageMs = now.getTime() - updatedAtMs;
if (!forceRebuild && cached && Number.isFinite(ageMs) &&
    ageMs >= 0 && ageMs < SNAPSHOT_TTL_MS) return cached;
return buildMonthlySnapshot(monthKey, timezone);
```

- [ ] Exclude future month keys before snapshot loading, including on rebuild. Keep requested date bounds in the response:

```ts
const currentMonthKey = getMonthKeyFromDate(now, timezone);
const monthKeys = getMonthKeysInRange(range.dateFrom, range.dateTo, timezone)
  .filter((monthKey) => monthKey <= currentMonthKey);
```

- [ ] Add mock-based tests with frozen time `2026-09-14T12:00:00Z`: stale empty September refreshes; fresh snapshot reuses cache; missing timestamp refreshes; stale historical completion counts refresh; forced rebuild ignores fresh cache; year does not load/write October–December; an October-only range is empty without writes. Restore real timers after each test.
- [ ] Check overlapping-range consistency using a September 14 row: compare that day's four counts in year, current month, current week, and custom September 14 responses; confirm exclusive end excludes September 15. Also cover a Vilnius DST month and a week crossing a month boundary.
- [ ] Run the focused Vitest file, then `npm test` and `npm run build`. Review failures against baseline and commit the focused API fix.

## Task 2: Verify the deployed cause and recover stale snapshots

**Files:** Existing `src/scripts/rebuildOnboardingRegistrationsMonthlyAll.ts` uses the corrected rebuild function; no new script required.

- [ ] Before production mutation, capture year/month/week/day endpoint responses using the same timezone and inspect `dateFrom`, `dateTo`, day keys, and counts. Inspect relevant snapshot `updatedAt` values and compare a known registration against the source database aggregation. If the year truly contains the same day's data while the shorter range excludes it, investigate actual request bounds/deployed version rather than attributing that inconsistency to cache alone.
- [ ] Deploy the tested API change through the normal release process. Normal reads should self-heal stale snapshots. Measure year-request latency because many months may refresh together.
- [ ] If immediate full history refresh is needed, run `npm run admin:rebuild-onboarding-registrations-monthly-all` after deployment; verify existing snapshots receive new timestamps and counts. Do not run the old script expecting it to repair existing snapshots.
- [ ] In `/analytics`, compare the same known registration date in year/month/week/day; check both client and provider series and totals. Empty days remain legitimately empty. Rapid period switching should also be checked for stale-response overwrites, which the current frontend does not guard against.

## Acceptance

Normal requests converge to source data within five minutes; explicit rebuilds recompute immediately; year requests do not poison future months with permanent empty snapshots; matching dates have matching counts across periods when evaluated against the same snapshot generation. No frontend chart redesign or metric-definition change is included.
