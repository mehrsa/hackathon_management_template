# {{PROJECT_NAME}}

A reusable Rayfin + React hackathon portal with registration, project submissions, judging assignments, scorecards, results, reports, and an admin-managed content system.

## Prerequisites

- Node.js 20 or later
- Docker Desktop for local Rayfin services
- A Microsoft Fabric workspace and account for deployment

## First-time setup

Install dependencies, then run the guided setup. Use the email address that should receive initial admin access.

```bash
npm install
npm run setup
```

The setup command updates the project identifier and initial administrator. Do this **before** the first database apply or deployment. The administrator can add more admins and judges later from the Admin Portal.

For automation, pass values without prompts:

```bash
npm run setup -- --project-name=my-hackathon --admin-email=owner@example.com
```

### Set the first admin email

Run setup **before the first local database apply or Fabric deployment**:

```bash
npm run setup -- --admin-email=owner@example.com
```

Replace `owner@example.com` with the exact email address the administrator uses to sign in to Microsoft Fabric. The command writes the address to `src/types/site.ts` as `DEFAULT_ADMIN_EMAIL`. That account becomes the protected initial entry in the admin allowlist and can open the Admin Portal after signing in.

To verify the configured address, open `src/types/site.ts` and confirm:

```ts
export const DEFAULT_ADMIN_EMAIL = 'owner@example.com';
```

After deployment, sign in with that account and use **Admin → Admin allowlist** to add other administrators. If the wrong address was configured, rerun setup with the correct address before deployment.

## Run locally

Make sure Docker Desktop is running, then start the app:

```bash
npm run dev
```

The command starts Rayfin's local services, applies the data schema, emits Vite environment variables, and opens the Vite server at [http://localhost:5173](http://localhost:5173).

Local authentication uses the configured initial admin email and a development-only password managed by the mock auth service.

## Customize the portal

1. Sign in locally with the automatic development account.
2. Open **Admin** in the site navigation.
3. Update the site title, announcement, links, timeline, deadlines, feature toggles, admins, and judges.
4. Replace sample URLs before publishing.

Default content lives in `src/content/defaultContent.ts` when code-level defaults are preferred. The banner image is in `src/assets/`.

## Deploy to Microsoft Fabric

```bash
npx rayfin login
npm run deploy
npx rayfin up status
```

`rayfin up` provisions a Fabric item, applies the schema, builds the frontend, and configures its generated hosting URL. Runtime and deployment files under `rayfin/.env*` and `rayfin/.deployments.json` are intentionally ignored by Git.

## Quality checks

```bash
npm test
npm run lint
npm run build
```

## Important files

| Path | Purpose |
| --- | --- |
| `rayfin/rayfin.yml` | Rayfin services, authentication, data, and hosting configuration |
| `rayfin/data/` | Data entities, permissions, and schema registration |
| `src/content/defaultContent.ts` | Initial editable portal content |
| `src/types/site.ts` | Initial admin and site content types |
| `src/pages/` | Participant, judge, results, and admin experiences |
| `scripts/setup-template.mjs` | One-time project and admin configuration |

## Create from the template repository

Once this template is published to Git, consumers can scaffold a clean project directly from a tagged release:

```bash
npx rayfin init my-hackathon -t https://github.com/YOUR_ORG/YOUR_REPO.git#v1.0.0
cd my-hackathon
npm run setup -- --admin-email=owner@example.com
npm run dev
```

Replace the example repository URL with the published template URL. Tags are recommended so generated projects are reproducible.
