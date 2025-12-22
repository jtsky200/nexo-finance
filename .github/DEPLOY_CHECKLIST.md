## Firebase Deploy Checklist (Safe Deploy via GitHub Actions)

This checklist helps ensure safe, consistent deploys using the `Firebase Safe Deploy` GitHub Action (`.github/workflows/firebase-deploy.yml`). It also shows how to continue working locally.

- Preconditions:
  - You have a GitHub secret for your Firebase service account JSON (recommended): `FIREBASE_SERVICE_ACCOUNT`.
  - Or you have a CI token secret: `FIREBASE_TOKEN` (less recommended than service account in many cases).
  - `FIREBASE_PROJECT_ID` must be set in Secrets for the production project.
  - Optionally: `FIREBASE_PREVIEW_PROJECT_ID` for preview non-production deploys.

- Steps before running deploy workflow:
  - Note: the workflow runs `build_and_test` on PRs and `main` pushes; the `deploy` job runs only on manual `workflow_dispatch`.
  1. Create a PR with your server changes. Run tests locally: `pnpm test` and `cd functions && npm run build`.
  2. Run `pnpm build` locally and double-check that `dist/` and `functions/lib` are produced successfully.
  3. Avoid editing `client/` or `client-mobile/` in this PR unless you are only changing environment keys.
  4. When ready, run the GitHub Action manually or merge to `main` and run the action via `workflow_dispatch`.

- When running the workflow via `workflow_dispatch`:
  - Select `deploy_to` as `functions`, `hosting`, or `all`.
  - Set `production` to `true` to deploy to production project (or `false` to use preview project).

- Safety checks done by the workflow:
  - The workflow runs `pnpm test` and `pnpm check` before deploying.
  - If `hosting` is selected and the workflow detects changes in `client/` or `client-mobile/`, it will abort with an error — this prevents accidental hosting deploys containing UI changes you didn't intend to release.
  - Use GitHub Environments to require approvals before the deploy job runs.

- Local deploys (developer laptop):
  - For local development and personal deploys, prefer the commands below. You can still use them as before:
    ```bash
    pnpm build
    cd functions && npm run build
    firebase deploy --only functions --project <your-project-id>
    firebase deploy --only hosting --project <your-project-id>
    ```

- Notes:
  - The workflow is intentionally safe-by-default. If you want continuous automatic deploy to production on `main` push, consider adding the `deploy_on_push` flag and protecting the `production` environment with GitHub review requirements.
  - Keep secrets out of repo. Use GitHub Secrets and Firebase Console `functions:secrets` for runtime secrets.

## How to create the required GitHub Secrets

- Service Account (preferred):
  1. Go to Google Cloud IAM & Admin → Service Accounts.
 2. Create or use an existing service account with `Firebase Admin` permissions.
 3. Create a JSON key and download it.
 4. In GitHub repository settings → Secrets → Actions, add a new secret `FIREBASE_SERVICE_ACCOUNT` and paste the whole JSON content.

- Firebase CLI Token (alternative):
  1. Run `firebase login:ci` locally and copy the token.
  2. Add it as `FIREBASE_TOKEN` in the repository secrets.

## Local preview deploy to a non-production project (optional)
- For preview deploys, set up `FIREBASE_PREVIEW_PROJECT_ID` as a secret and choose `production=false` when running the workflow.
 - When a preview deploy runs for a PR, the workflow posts a comment on the PR with the preview URL (hosting channel `pr-<PR_NUMBER>`), so reviewers can easily open the deployed preview.

## Enabling Auto Deploy on main branch

- To enable automatic deploys on pushes to `main`, set the following repository secrets:
  - `AUTO_DEPLOY` = `true` (enables automatic deploys to `main`)
  - `AUTO_DEPLOY_HOSTING` = `true` (optional — enables automatic hosting deploys; keep false unless you trust `main` and want automatic hosting releases)
  - have `FIREBASE_SERVICE_ACCOUNT` or `FIREBASE_TOKEN` as described above

- Recommendations:
  - Set up GitHub Branch protection for `main` requiring PR reviews and passing status checks before merge.
  - Configure a `production` environment in GitHub with required reviewers or approval steps; link deploy job to this environment.
  ## Creating a `production` Environment with required reviewers

  - Steps:
    1. In your GitHub repo, go to `Settings -> Environments` and create environment 'production'.
    2. Under `Protection rules`, add `Required reviewers` and choose one or more approvers (e.g., team leads or maintainers).
    3. In `.github/workflows/firebase-deploy.yml`, make sure the `deploy` job uses `environment: production` (already configured). This causes GitHub to require the configured approvals for the deploy job to proceed on `workflow_dispatch` and forced deploys.

  ## Creating a `preview` Environment (optional)

  - Steps:
    1. In your GitHub repo, go to `Settings -> Environments` and create environment 'preview'.
    2. Use this environment for PR preview deployments (this is optional).
    3. Configure `FIREBASE_PREVIEW_PROJECT_ID` as a repo secret (or default to production if not set).


  - If you only want to auto-deploy functions and not hosting, set `AUTO_DEPLOY_HOSTING=false`.


