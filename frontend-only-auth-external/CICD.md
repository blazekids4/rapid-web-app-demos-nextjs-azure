# CI/CD via GitHub Actions — Azure Static Web Apps

This guide sets up automatic redeployment every time you push code to your repository. The GitHub Actions workflow mirrors exactly what `deploy-swa.ps1` does manually.

## How It Works

On every push to `main` (or `master`), GitHub Actions will:

1. Check out the code
2. Install Node.js dependencies (`npm ci`)
3. Build the static export (`npm run build`)
4. Copy `staticwebapp.config.json` and `login.html` into `out/`
5. Deploy to Azure Static Web Apps using the SWA CLI and a deployment token

## Setup

### 1. Get Your Deployment Token

The deployment token authenticates the SWA CLI against your Azure Static Web App. Retrieve it with:

```powershell
az staticwebapp secrets list `
  --name swa-startup-evaluator `
  --resource-group rg-demo-apps `
  --query "properties.apiKey" `
  --output tsv
```

Copy the token value — you'll need it in the next step.

### 2. Add the Token as a GitHub Secret

1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
4. Value: paste the token from step 1
5. Click **Add secret**

### 3. Create the Workflow File

Create the file `.github/workflows/deploy.yml` in the root of the repository:

```yaml
name: Deploy to Azure Static Web Apps

on:
  push:
    branches:
      - main
      - master
    paths:
      - 'frontend-only-auth/**'

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend-only-auth/package-lock.json

      - name: Install dependencies
        working-directory: frontend-only-auth
        run: npm ci

      - name: Build static export
        working-directory: frontend-only-auth
        run: npm run build

      - name: Copy auth files into build output
        working-directory: frontend-only-auth
        run: |
          cp staticwebapp.config.json out/staticwebapp.config.json
          cp public/login.html out/login.html

      - name: Install SWA CLI
        run: npm install -g @azure/static-web-apps-cli

      - name: Deploy to Azure Static Web Apps
        working-directory: frontend-only-auth
        run: |
          swa deploy ./out \
            --deployment-token ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }} \
            --env production
```

> **Note:** The `paths` filter means the workflow only runs when files inside `frontend-only-auth/` change, since this is a monorepo with multiple projects.

## Triggering a Deployment

Once the workflow file is committed and pushed, any subsequent push to `main` or `master` that touches files in `frontend-only-auth/` will automatically trigger a deployment.

You can monitor runs under your repository's **Actions** tab.

## Rotating the Deployment Token

Deployment tokens do not expire, but you can regenerate one at any time:

```powershell
az staticwebapp secrets reset-api-key `
  --name swa-startup-evaluator `
  --resource-group rg-demo-apps
```

After resetting, retrieve the new token and update the `AZURE_STATIC_WEB_APPS_API_TOKEN` GitHub secret.

## Manual vs. CI/CD

| | Manual (`deploy-swa.ps1`) | CI/CD (GitHub Actions) |
|---|---|---|
| **When to use** | One-off deploys, first-time setup | Every day development |
| **Requires Azure CLI locally** | Yes | No |
| **Triggered by** | You running the script | Git push |
| **Token storage** | Retrieved at runtime via `az` | Stored as a GitHub secret |
