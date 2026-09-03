# GCCVB Schedule Site

This is the standalone schedule app intended for GitHub Pages.

It loads schedule JSON from:

```text
https://www.gccvb.org/_functions/schedule
```

Future UI changes should be made here and pushed to `main`. After GitHub Pages is enabled for this repository with the source set to GitHub Actions, the workflow in `.github/workflows/schedule-pages.yml` deploys this folder automatically.

## Wix embed

Once deployed, the Wix Schedule page only needs one iframe/HTML embed by URL. Use the GitHub Pages URL, usually:

```text
https://forknine.github.io/gccvb/
```

If you later configure a custom domain such as `schedule.gccvb.org`, update the Wix iframe URL to that domain.
