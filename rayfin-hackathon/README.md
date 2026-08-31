# Rayfin Hackathon Portal Template

This repository is an external Rayfin template for a complete React + Vite hackathon portal.

## Create a project

After publishing this repository, scaffold from a tagged release:

```bash
npx rayfin init my-hackathon -t https://github.com/YOUR_ORG/YOUR_REPO.git#v1.0.0
cd my-hackathon
npm run setup -- --admin-email=owner@example.com
npm run dev
```

For direct repository development, enter the `rayfin-hackathon` directory and follow its README.

## Set the first admin email

Set the first administrator **before the first local database apply or Fabric deployment**. From the generated project directory, run:

```bash
npm run setup -- --admin-email=owner@example.com
```

Replace `owner@example.com` with the exact email address the administrator uses to sign in to Microsoft Fabric. The setup command writes that address to `src/types/site.ts` as `DEFAULT_ADMIN_EMAIL`; it becomes the protected initial entry in the admin allowlist.

To configure the project name at the same time:

```bash
npm run setup -- --project-name=my-hackathon --admin-email=owner@example.com
```

After deployment, sign in with that account and use **Admin → Admin allowlist** to grant access to additional administrators.

## Maintainer validation

Test the template locally before tagging a release:

```bash
npx rayfin init template-smoke-test -t . --yes
cd template-smoke-test
npm run setup -- --project-name=template-smoke-test --admin-email=owner@example.com
npm test
npm run lint
npm run build
```

Publish immutable version tags so consumers can generate reproducible projects.
