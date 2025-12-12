## Nexo — Copilot Instructions (Ergänzung)

Kurz: Dieses Projekt ist ein Produktiv-Repo; Frontend/Hosting-Code wird lokal angepasst und dann zu Firebase / Git gepusht.

Wichtig: Bitte verändere NICHT das Client-Frontend (`client/`, `client-mobile/`) direkt in Branches dieses Repo ohne Absprache. Die Auslieferung erfolgt lokal von Entwickler-PCs und wird dann per `firebase deploy` und `git push` ausgeführt.

- **Workers / Agents Regeln**
  - **Nicht**: Ändere keine UI-komponenten unter `client/` oder `client-mobile/` ohne Einverständnis. Du darfst Änderungen vorschlagen, aber nicht committen.
  - **Erlaubt**: Updates an Server-/API-Code (`server/`, `functions/`, `server/_core`) können gemacht werden; auf Änderungen an `functions` achten, da Firebase Console manchmal andere (funktionierende) Versionen enthält — siehe `SYNC_SOLUTION.md` / `sync-firebase-to-github-safe.ps1`.

- **Lokaler Workflow (für Entwickler zuhause)**
  - Setup & Install:
    - `pnpm install` (root) und `cd functions && pnpm install`.
    - Setze lokale `.env` / Firebase config (siehe `README.md` und `client/src/lib/firebase.ts`).
  - Dev server - Desktop (Vite + server):
    - `pnpm dev` → startet `server/_core/index.ts` (Express + tRPC) + Vite middleware for client.
  - Dev server - Mobile:
    - `pnpm dev:mobile` → Vite dev server using `vite.config.mobile.ts`.
  - Functions emulate & test:
    - `cd functions && npm run serve` (build + `firebase emulators:start --only functions`).
  - Running tests and lint:
    - `pnpm test` (vitest), `pnpm check` (tsc), `pnpm format` (prettier).

- **Safe Git / Firebase deploys (empfohlen)**
  - Always create a feature branch and open a PR for server changes.
  - For `functions/` changes: run tests locally, then `cd functions && npm run build`. Validate using Cloud Functions emulator (`firebase emulators:start`) before real deploy.
  - Production deploys require `GOOGLE_APPLICATION_CREDENTIALS` and `firebase login` with project access. Deploy commands:
    - `firebase deploy --only functions` (functions only)
    - `firebase deploy --only hosting` (hosting only) — build beforehand with `pnpm build`
    - Combined: `firebase deploy --only functions,hosting`

- **Secrets & API keys**
  - Use `firebase functions:secrets:set SECRET_NAME` for API keys (see `SETUP_OPENAI.md`). Do not commit secrets or service account files.
  - For local development supply secrets via `.env` or `firebase functions:secrets` and `firebase emulators:start --only functions --project <project-id> --import=emulator-data` if needed.

- **When I (the AI agent) can deploy**
  - I cannot and will not perform production `firebase deploy` without your credentials and explicit approval. Deploy requires either your Firebase token/auth or `GOOGLE_APPLICATION_CREDENTIALS` key and you must confirm it.
  - I can run local builds, tsc checks, tests, and spin up the Firebase emulator in the current environment to validate changes.

- **If you want me to help with deploys**
  - Provide a secure method for me to authenticate (e.g., ephemeral CI job or instructions to run deploy commands). I will provide a step-by-step checklist including pre-deploy tests.

- **References**
  - Frontend entry: `client/src/main.tsx`
  - Development devserver: `server/_core/index.ts` (start with `pnpm dev`)
  - Server API: `server/routers.ts` and `server/_core/trpc.ts`
  - Firebase functions: `functions/src` and `functions/package.json` scripts
  - Sync utilities: `sync-firebase-to-github-safe.ps1` and `SYNC_SOLUTION.md`

Wenn du möchtest, kann ich: 1) die Datei um eine PR-Checkliste erweitern, 2) Beispiel-Commands für Emulator-Import/Export hinzufügen oder 3) eine kurze Anleitung bauen, wie du sicher per CI deployst. Welches der drei möchtest du zuerst?

- **CI / GitHub Actions**
  - Workflow file: `.github/workflows/firebase-deploy.yml` (manual `workflow_dispatch` recommended).
  - Required repo secrets for CI deploys: `FIREBASE_SERVICE_ACCOUNT` (sa JSON, preferred) OR `FIREBASE_TOKEN`, plus `FIREBASE_PROJECT_ID`. Optional: `FIREBASE_PREVIEW_PROJECT_ID`.
  - The workflow runs tests and builds before deployment, and includes a safety check preventing `hosting` deploy if `client/` or `client-mobile/` changed.
    - Optional `AUTO_DEPLOY`/`AUTO_DEPLOY_HOSTING` secrets: set `AUTO_DEPLOY=true` to auto-deploy on main push; set `AUTO_DEPLOY_HOSTING=true` to allow automatic hosting deploys (recommended to keep off unless you want automatic UI releases).
    - To enable automatic production deploy on main push:
      - Add `AUTO_DEPLOY=true` as a repo secret to enable auto deploy on `main`.
      - Optionally add `AUTO_DEPLOY_HOSTING=true` to enable automatic hosting deploys. Beware: enabling hosting auto deploys releases the UI automatically.
      - Use GitHub Branch Protections and Environments to require approvals and passing tests before merge/deploy.
  - You can keep deploying from your local machine as usual — the CI workflow does not replace local workflow; it provides a safe, auditable CI path for staging/production deploys.
    - PR Preview workflow: `.github/workflows/firebase-preview.yml` deploys PRs to the preview project (FIREBASE_PREVIEW_PROJECT_ID), used for early checks.

See `.github/DEPLOY_CHECKLIST.md` for a step-by-step checklist.
