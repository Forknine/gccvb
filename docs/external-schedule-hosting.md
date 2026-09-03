# External Schedule Hosting

The schedule can now be hosted outside the Wix visual editor.

## One-time GitHub Pages setup

1. Push `main` to GitHub.
2. Open the repository on GitHub.
3. Go to Settings > Pages.
4. Set Source to GitHub Actions.
5. Run the `Deploy schedule site` workflow if it does not run automatically.

The expected schedule URL is:

```text
https://forknine.github.io/gccvb/
```

## One-time Wix setup

On the Wix Schedule page, replace the pasted-code HTML component with an iframe URL/embed pointing to the GitHub Pages URL.

Use the URL/embed option instead of pasting the full HTML app code. After this, normal schedule UI updates only require code changes and a Git push.

## Data API

The standalone site reads this Wix HTTP function:

```text
https://www.gccvb.org/_functions/schedule
```

That endpoint is implemented in `src/backend/http-functions.js` and uses the existing Google Sheets-backed schedule service. The Google Sheet secret remains server-side in Wix.

## Future update flow

```bash
git add schedule-site src/backend docs .github
git commit -m "feat: update external schedule"
git push origin main
```

Then wait for the GitHub Actions deployment to finish. No Wix editor paste is needed for ordinary UI changes.
