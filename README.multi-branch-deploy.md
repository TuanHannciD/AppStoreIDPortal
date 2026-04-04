# Multi-branch deploy

Workflow `.github/workflows/deploy.yml` now supports 2 independent deploy targets:

- `main` -> `AppStoreIDPortal` -> `/www/wwwroot/AppStoreIDPortal` -> port `3000`
- `customer` -> `AppStoreIDPortalCustomer` -> `/www/wwwroot/AppStoreIDPortal-customer` -> port `3001`

## Required GitHub Secrets

Shared SSH secrets:

- `HOST_APPSTOREIDPORTAL`
- `USERNAME_APPSTOREIDPORTAL`
- `PORT_APPSTOREIDPORTAL`
- `SSH_KEY_APPSTOREIDPORTAL`

Environment secrets:

- `ENV_FILE_APPSTOREIDPORTAL`
- `ENV_FILE_APPSTOREIDPORTAL_CUSTOMER`

## Deploy behavior

- Push to `main`: verify and deploy the internal/default app.
- Push to `customer`: verify and deploy the customer app.
- Each app runs as a separate PM2 process and listens on its own port.
- The customer deploy clones from the existing server repo path on first run, then tracks `origin/customer`.

## Server requirements

1. The server must already have `git`, `pnpm`, `pm2`, and Node.js available for the deploy user.
2. The deploy user must have permission for:
   - `/www/wwwroot/AppStoreIDPortal`
   - `/www/wwwroot/AppStoreIDPortal-customer`
3. Reverse proxy must route each hostname to the correct local port.

Suggested proxy mapping:

- `panel.appstoreviet.com` -> `127.0.0.1:3000`
- `customer-panel.appstoreviet.com` -> `127.0.0.1:3001`

## Git steps

Create the customer branch locally and push it:

```powershell
git branch customer
git push origin customer
```

If you want a different branch name such as `client` or `staging-customer`, update the workflow branch conditions first.
