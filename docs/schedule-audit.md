# Schedule Audit

## Existing implementation

- Public schedule page code: `src/pages/Schedule.hj4y9.js`
- Google Sheets wrapper: `src/backend/googlesheet-wrapper.jsw`
- Legacy table helper: `src/backend/schedule-table.jsw`
- Current schedule range: `Schedule!A1:G350`

## Schedule sheet columns

The public schedule page currently uses these columns from `Schedule!A:G`:

- A: date
- B: time
- C: teams / matchup
- D: location
- E: result/status tokens, currently split on commas and rendered as coloured symbols
- F: fetched but unused by current schedule page
- G: fetched but unused by current schedule page

The score submission page also reads `Schedule!A2:E300`, confirming columns A through E are shared schedule data.

## Current schedule Wix element IDs

- `#table3`: desktop Wix Table receiving schedule rows
- `#mobileschedule`: mobile-only legacy element shown by device detection
- `#dropdown1`: legacy team/location link/filter selector
- `#button1`: legacy navigation button
- `#button2`: legacy filter button
- `#Section1Regular`: legacy debug double-click hook

## Repository references checked

- `src/pages/Schedule.hj4y9.js` contains all schedule page references to `#table3`, `#mobileschedule`, `#dropdown1`, `#button1`, `#button2`, and `#Section1Regular`.
- `src/pages/Home.c1dmp.js` and `src/pages/Register Here.xu2az.js` contain only starter comments referencing `#button1`.
- `src/pages/Peer Reviews.gr66u.js` and `src/pages/Testing.w4i7k.js` use their own `#button1` or `#dropdown1` IDs on other pages.
- `src/pages/Roster.iwmhw.js`, `src/pages/Peer Reviews.gr66u.js`, and `src/pages/Submit Score.n999p.js` also import `googlesheet-wrapper.jsw`, so the wrapper should remain compatible and should not be replaced globally.

## Refactor direction

This repository uses the older Wix Git Integration layout documented in its README. Backend web modules are `.jsw` files here, so the schedule backend will use a schedule-specific `.jsw` service while leaving the shared Google Sheets wrapper in place.
