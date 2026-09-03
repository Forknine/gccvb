# Schedule Development Notes

## Local Editor setup

The schedule page now expects one Wix HTML Component on the Schedule page:

- Element type: HTML Component / Embed
- Element ID: `#scheduleApp`
- HTML source: copy the contents of `src/public/schedule/schedule.html` into the component

Keep the component wide enough to fill the schedule section. The HTML app handles desktop, tablet, and phone layouts internally with responsive CSS.

## Legacy Wix elements

After verifying the new `#scheduleApp` component in Local Editor Preview, these old Schedule page elements can be removed or hidden in the Wix editor:

- `#table3`
- `#mobileschedule`
- `#dropdown1`
- `#button1`
- `#button2`
- `#Section1Regular`, if it existed only to support the old schedule/debug hook

References to similarly named elements on other pages are unrelated and should be left alone.

## Data source

The schedule still uses the Google Sheet secret named `sheetId` through `src/backend/googlesheet-wrapper.jsw`.

The public schedule service reads `Schedule!A1:G350`. Blank rows are discarded. Column F is treated as optional league data and column G as optional division data because the previous page fetched those columns but did not use them.

## Cache duration

The schedule service caches successful normalized responses for five minutes. To change that value, update `SCHEDULE_CACHE_TTL_MS` in `src/backend/schedule-config.js`.

## Preview

Run the existing Wix local workflow:

```bash
npm install
npm run dev
```

or:

```bash
wix dev
```

Do not publish until the Schedule page has been checked in Local Editor Preview and the HTML Component has been added.
