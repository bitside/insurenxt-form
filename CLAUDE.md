# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A public-facing intake form for the InsureNXT demo — a German-language, mobile-optimised single-page form where users submit insurance case ideas. Submissions are uploaded as structured JSON to an S3-compatible bucket. The page is hosted on GitHub Pages at `https://bitside.github.io/insurenxt-form/`.

This is a companion to the dashboard demo in the `insurenxt-vis` repository (which is not deployed publicly).

## Running it locally

No build step, no dependencies. Open `index.html` directly in a browser, or serve over HTTP:

```
python3 -m http.server 8000
# → http://localhost:8000/
```

When run locally, `submit.js` still contains the `__S3_UPLOAD_BASE_URL__` placeholder token (never replaced), so the upload call will fail — that is expected. Everything else (form interactions, validation, avatar, success state) works without a network connection.

## Deployment

Pushes to `main` trigger `.github/workflows/pages.yml`, which:
1. Replaces the `__S3_UPLOAD_BASE_URL__` token in `submit.js` with the `S3_UPLOAD_BASE_URL` GitHub Secret via `sed`
2. Uploads the entire repo root as the Pages artifact
3. Deploys via `actions/deploy-pages`

**GitHub Pages must be configured** in the repo settings: Settings → Pages → Source: GitHub Actions.

The `S3_UPLOAD_BASE_URL` secret must be set in Settings → Secrets → Actions before submissions will actually land in the bucket.

## File structure

```
index.html      # Form markup + all CSS (inline <style>) + all JS (inline <script>)
submit.js       # S3 upload function — contains __S3_UPLOAD_BASE_URL__ token
.github/
  workflows/
    pages.yml   # CI/CD: inject secret, deploy to GitHub Pages on push to main
CLAUDE.md       # This file
README.md       # Repo description
```

There is intentionally **no build step, no package.json, no node_modules**. Keep it that way — the form is pure HTML/CSS/JS.

## Architecture

### `index.html`

All CSS lives in a single `<style>` block; all JS in a single `<script>` block at the bottom of `<body>`. The only external script tag is `<script src="submit.js"></script>`, loaded just before the inline script so `uploadSubmission()` is available.

**CSS custom properties** drive the entire theme. Two sets are defined:
- `:root { … }` — dark mode (default)
- `@media (prefers-color-scheme: light) { :root { … } }` — light mode override

Key variables: `--bg`, `--surface`, `--surface2`, `--border`, `--primary`, `--btn-bg`, `--btn-text`, `--text`, `--muted`, `--danger`, `--success`.

**JS responsibilities** (all in the inline `<script>`):
- Avatar: hashes the name to pick one of 6 colours; updates the initial circle live on `input`
- Placeholder swap: changes `<textarea>` placeholder when the category `<select>` changes
- Consent visibility: shows/hides the consent block when the email field has content
- Validation: fires on submit; marks invalid fields with the `.invalid` / `.bad` classes
- Submit: builds the JSON payload, calls `uploadSubmission()`, renders success or error state

### `submit.js`

Exports a single async function `uploadSubmission(data)` that does a `PUT` to `${S3_UPLOAD_BASE_URL}/${key}` where `key` is `submissions/<timestamp>-<random>.json`. The `S3_UPLOAD_BASE_URL` constant holds the `__S3_UPLOAD_BASE_URL__` token in source; `sed` replaces it at CI build time.

If the URL format of the bucket changes (e.g. the key must be a query param rather than a path segment), edit the URL construction in `uploadSubmission`.

### JSON payload schema

```json
{
  "id": "1714900000000-abc123",
  "submittedAt": "2026-05-05T10:00:00.000Z",
  "name": "Max Mustermann",
  "avatarInitial": "M",
  "avatarColor": "#2EA87A",
  "caseCategory": "KFZ-Schaden",
  "caseDescription": "Mein Fahrzeug wurde…",
  "email": "max@example.com",
  "consent": {
    "given": true,
    "text": "Ich bin einverstanden…",
    "version": "1.0",
    "timestamp": "2026-05-05T10:00:00.000Z"
  }
}
```

`email` and `consent` are `null` when the user leaves the email field empty.

## DSGVO notes

- The consent checkbox is **never pre-checked** — a hard DSGVO requirement.
- The `consent.text` field in the JSON payload stores the exact wording the user agreed to, plus a `version` string. Bump `CONSENT_VERSION` in `index.html` if the wording changes so old and new consents are distinguishable.
- The consent link currently points to `https://bitside.de/impressum`. **Before go-live**, this must be updated to a proper Datenschutzerklärung URL that covers: data controller identity, purpose, legal basis (Art. 6 Abs. 1 lit. a DSGVO), retention period, the S3 provider as data processor (AVV required), and data subject rights.

## Conventions

- All UI copy is **German**.
- Visual theme is dark by default, adapts to light via `prefers-color-scheme`. Primary accent is `#FFD663` (bitside brand yellow). In light mode `--primary` shifts to `#b8870a` for text readability; `--btn-bg` stays `#FFD663` for the button.
- No framework, no bundler, no CDN — changes are a direct edit to `index.html` and/or `submit.js`. There is no compilation step to run after editing.
