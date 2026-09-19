# Calyrn product demo recorder

This folder contains the Playwright script used by the manual GitHub Actions workflow
`Record Calyrn Demo`.

The recording uses the public production experience only. It does not require Auth0,
Vercel, database, or CoinGecko secrets in GitHub Actions.

## Flow

The script records a short product walkthrough:

1. Open Markets.
2. Open global search and type `Bitcoin`.
3. Navigate to Bitcoin Research.
4. Switch the chart to `30D`.
5. Switch from line mode to real OHLC candles.
6. Open the Fundamentals research tab.
7. Scroll to Continue research.
8. Navigate to a nearby asset.

The browser recording is created at 1440x900. The workflow converts Playwright's WebM
output to H.264 MP4 for easier LinkedIn upload.

## Run from GitHub

After this workflow is merged into the default branch:

1. Open the repository on GitHub.
2. Open **Actions**.
3. Select **Record Calyrn Demo**.
4. Choose **Run workflow**.
5. Keep the default production URL unless you want to record another deployment.
6. When the run finishes, download the `calyrn-linkedin-demo` artifact.

## Run locally

From the repository root:

```bash
pnpm --dir demo install --no-lockfile
pnpm --dir demo exec playwright install chromium
pnpm --dir demo run record
```

The raw recording is written to `demo/artifacts/calyrn-demo.webm`.
