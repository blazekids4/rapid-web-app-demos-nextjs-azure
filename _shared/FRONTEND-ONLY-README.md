# Frontend-Only Azure Static Web Apps

A family of **zero-backend** reference projects that deploy a static Next.js app to [Azure Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/overview) using a single PowerShell deploy script. Each variant in this family demonstrates a different access model — from fully public to org-restricted authentication.

## Variants at a Glance

| Folder | Access | SWA Tier | Auth Provider | App Registration | Cost |
|--------|--------|----------|---------------|-----------------|------|
| [`frontend-only-public-external`](../frontend-only-public-external/) | Public (anyone) | Free | None | Not needed | Free |
| [`frontend-only-password-external`](../frontend-only-password-external/) | Password-gated | Standard | Password protection (preview) | Not needed | ~$9/mo |
| [`frontend-only-auth-external`](../frontend-only-auth-external/) | Sign-in required | Free | Entra ID + GitHub (pre-configured) | Not needed | Free |
| [`frontend-only-auth-entra-internal`](../frontend-only-auth-entra-internal/) | Org sign-in required | Standard | Entra ID (custom) | Created by deploy script | ~$9/mo |

Choose the variant that matches your access requirements and pick it up — each is self-contained with its own deploy script.

---

## Project Structure

All three variants share the same layout, with minor additions per variant:

```
frontend-only-*/
├── app/                         # Next.js App Router (pages + layout)
├── components/                  # React components
├── public/                      # Static assets (if present)
├── deploy-swa.ps1               # One-command Azure deployment
├── staticwebapp.config.json     # (auth variants only) Route rules + auth config
├── swa-cli.config.json          # SWA CLI configuration
├── next.config.ts               # Next.js config (static export mode)
├── package.json
└── tsconfig.json
```

**Variant-specific extras:**
- `frontend-only-auth-external` — includes `public/login.html` (custom login page with Microsoft + GitHub buttons) and `staticwebapp.config.json`
- `frontend-only-auth-entra-internal` — includes `staticwebapp.config.json` (patched with tenant ID at deploy time)
- `frontend-only-public-external` — includes `ENABLE-AUTH.md` (guide for adding auth later)

---

## Prerequisites

| Tool | Install |
|------|---------|
| **Node.js** ≥ 18 | [nodejs.org](https://nodejs.org) |
| **Azure CLI** | [Install Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) |
| **SWA CLI** | Auto-installed by the deploy script, or `npm i -g @azure/static-web-apps-cli` |

For `frontend-only-auth-entra-internal` only: you need permission to create **app registrations** in your Entra ID tenant (Application Developer role or higher).

---

## Quick Start (Local Dev)

Auth is not enforced locally — all variants behave identically in development.

```powershell
# Install dependencies
npm install

# Start the dev server
npm run dev          # http://localhost:3000

# Build the static export
npm run build        # produces ./out/
```

---

## Deploy to Azure

### `frontend-only-public-external` — No auth, Free tier

```powershell
az login

.\deploy-swa.ps1

# Customize names and region
.\deploy-swa.ps1 -ResourceGroup my-rg -AppName my-swa -Location eastus2

# Skip rebuild if out/ is current
.\deploy-swa.ps1 -SkipBuild
```

The script:
1. Runs `npm ci` + `npm run build`
2. Creates the resource group and Static Web App (Free tier) if they don't exist
3. Deploys `out/` via the SWA CLI
4. Prints the live URL

---

### `frontend-only-password-external` — Password protection, Standard tier

Visitors are prompted for a shared password before they can view the site. No identity provider or app registration needed — Azure SWA handles the password gate natively. Requires the **Standard** tier.

```powershell
az login

.\deploy-swa.ps1

# Customize names, region, or password
.\deploy-swa.ps1 -ResourceGroup my-rg -AppName my-swa -Location eastus2
.\deploy-swa.ps1 -Password "MyP@ssw0rd!"

# Skip rebuild if out/ is current
.\deploy-swa.ps1 -SkipBuild
```

The script:
1. Validates the password meets Azure's requirements (8+ chars, uppercase, lowercase, number, symbol)
2. Runs `npm ci` + `npm run build`
3. Creates the resource group and Static Web App (**Standard tier**)
4. Enables password protection on **both production and staging** via the ARM REST API
5. Deploys `out/` via the SWA CLI
6. Prints the live URL

> **Note:** The default password is `Dontguess@123`. Azure requires passwords to contain at least 8 characters with an uppercase letter, a lowercase letter, a number, and a symbol.

#### How Password Protection Works

```
Visitor navigates to the site
  → SWA checks for password cookie
  → No cookie → SWA displays a password prompt page
  → Visitor enters the shared password
  → SWA validates and sets cookie → site is displayed
```

To change the password or scope after deployment:
**Azure Portal → Static Web App → Configuration → General settings → Password protection**

---

### `frontend-only-auth-external` — Pre-configured auth, Free tier

No app registration required. The Free tier uses Microsoft's shared Entra ID and GitHub identity providers. User access is managed via the invitation system in the Azure Portal.

```powershell
az login

.\deploy-swa.ps1

# Customize names and region
.\deploy-swa.ps1 -ResourceGroup my-rg -AppName my-swa -Location eastus2

# Skip rebuild if out/ is current
.\deploy-swa.ps1 -SkipBuild
```

The script:
1. Runs `npm ci` + `npm run build`
2. Copies `staticwebapp.config.json` and `login.html` into `out/`
3. Creates the resource group and Static Web App (Free tier)
4. Deploys via the SWA CLI
5. Prints the live URL

#### Auth Flow

```
User visits any page
  → SWA checks for auth cookie
  → No cookie → 302 redirect to /login.html
  → User clicks "Sign in with Microsoft" or "Sign in with GitHub"
  → /.auth/login/aad  OR  /.auth/login/github
  → Provider authenticates the user
  → SWA sets auth cookie → redirected to original page
```

#### Granting Access to Users

Because the Free tier uses shared providers, you must explicitly invite each user:

1. Azure Portal → your Static Web App → **Role management**
2. **Invite** → enter the user's email → assign the `authenticated` role
3. The user receives an invite link; they must accept it before they can sign in

---

### `frontend-only-auth-entra-internal` — Custom Entra ID auth, Standard tier

Locks the app to your organization's Entra ID tenant via a dedicated app registration. Only members of your tenant can sign in; no invitation system is needed.

```powershell
az login

.\deploy-swa.ps1

# Customize names and tenant
.\deploy-swa.ps1 -ResourceGroup my-rg -AppName my-swa -EntraAppName my-app-reg

# Specify tenant explicitly
.\deploy-swa.ps1 -TenantId "00000000-0000-0000-0000-000000000000"

# Skip rebuild if out/ is current
.\deploy-swa.ps1 -SkipBuild
```

The script:
1. Runs `npm ci` + `npm run build`
2. Creates the resource group and Static Web App (**Standard tier** — required for custom auth)
3. Creates (or reuses) an Entra ID app registration with the correct redirect URI
4. Creates a client secret on the app registration
5. Patches `staticwebapp.config.json` with your tenant ID and copies it into `out/`
6. Sets `AAD_CLIENT_ID` and `AAD_CLIENT_SECRET` on the SWA app settings
7. Deploys `out/` via the SWA CLI
8. Prints the live URL, tenant ID, and client ID

#### Auth Flow

```
User visits site
  → SWA checks for auth cookie
  → No cookie → 401 → redirect to /.auth/login/aad
  → User signs in with their org account
  → Entra ID validates against your tenant
  → SWA sets auth cookie → redirected to original page
```

---

## Enabling CI/CD via GitHub Actions

After deploying manually once, you can automate future deployments on push.

### 1. Get the Deployment Token

```powershell
az staticwebapp secrets list `
  --name <your-app-name> `
  --resource-group <your-rg> `
  --query "properties.apiKey" `
  --output tsv
```

### 2. Add a GitHub Secret

In your repository: **Settings → Secrets and variables → Actions → New repository secret**

- Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
- Value: the token from step 1

### 3. Add a Workflow File

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Azure Static Web Apps

on:
  push:
    branches:
      - main
      - master

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: upload
          app_location: out
          skip_app_build: true
```

---

## Switching Frameworks

The deploy pattern is **framework-agnostic** — Azure Static Web Apps serves any static file output. Only two things need to change when switching frameworks:

1. **Build command** — what produces the static output
2. **Output directory** — where the built files land

Update these in `swa-cli.config.json`.

| Framework | Create Project | Build Command | Output Dir |
|-----------|---------------|---------------|------------|
| **Next.js** (current) | `npx create-next-app@latest` | `npm run build` | `out` |
| **React (Vite)** | `npm create vite@latest -- --template react-ts` | `npm run build` | `dist` |
| **Vue (Vite)** | `npm create vite@latest -- --template vue-ts` | `npm run build` | `dist` |
| **Svelte (SvelteKit)** | `npx sv create` | `npm run build` | `build` |
| **Angular** | `npx @angular/cli new my-app` | `npm run build` | `dist/<app-name>/browser` |
| **Astro** | `npm create astro@latest` | `npm run build` | `dist` |
