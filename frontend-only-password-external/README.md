# Frontend-Only with Password Protection — Azure Static Web App

A **zero-backend** reference project that deploys a static Next.js app to [Azure Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/overview) on the **Standard tier** with [password protection](https://learn.microsoft.com/azure/static-web-apps/password-protection) enabled on both production and staging environments.

Visitors are prompted for a shared password before they can view the site. No identity provider, app registration, or custom auth config needed — Azure SWA handles the password gate natively.

## Project Structure

```
frontend-only-password-external/
├── app/                    # Next.js App Router (pages + layout)
├── components/             # React components (memory game)
├── deploy-swa.ps1          # One-command Azure deployment with password protection
├── swa-cli.config.json     # SWA CLI configuration
├── next.config.ts          # Next.js config (static export)
├── package.json
└── tsconfig.json
```

## Prerequisites

| Tool | Install |
|------|---------|
| **Node.js** ≥ 18 | [nodejs.org](https://nodejs.org) |
| **Azure CLI** | [Install Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) |
| **SWA CLI** | Auto-installed by the deploy script, or `npm i -g @azure/static-web-apps-cli` |

## Quick Start

```powershell
# Install dependencies
npm install

# Run locally (no password gate locally)
npm run dev          # http://localhost:3000

# Build static export
npm run build        # produces ./out/
```

## Deploy to Azure (with Password Protection)

```powershell
# 1. Log in to Azure
az login

# 2. Deploy — builds, provisions Standard-tier SWA, enables password, deploys
.\deploy-swa.ps1

# Optional: customize names and region
.\deploy-swa.ps1 -ResourceGroup my-rg -AppName my-swa -Location westus2

# Optional: set a custom password
.\deploy-swa.ps1 -Password "MyP@ssw0rd!"

# Optional: skip build if out/ is already current
.\deploy-swa.ps1 -SkipBuild
```

### What the Deploy Script Does

1. Validates the password meets Azure's requirements (8+ chars, uppercase, lowercase, number, symbol)
2. Runs `npm ci` + `npm run build` to produce the `out/` folder
3. Creates the resource group and Static Web App (**Standard tier** — required for password protection)
4. Enables password protection on **both production and staging** via the ARM REST API (`basicAuth/default` endpoint)
5. Deploys the `out/` folder via SWA CLI
6. Prints the live URL

> **Note:** The default password is `Dontguess@123`. Azure requires passwords to contain at least 8 characters with an uppercase letter, a lowercase letter, a number, and a symbol.

## How Password Protection Works

[Password protection](https://learn.microsoft.com/azure/static-web-apps/password-protection) is a built-in Azure SWA feature (preview) that gates access with a shared visitor password. It does **not** use identity providers — it's a simple password prompt managed entirely by the platform.

```
Visitor navigates to the site
  → SWA checks for password cookie
  → No cookie → SWA displays a password prompt page
  → Visitor enters the shared password
  → SWA validates and sets cookie → site is displayed
```

### Requirements

- **Standard tier** — password protection is not available on the Free tier
- Password must be ≥ 8 characters with uppercase, lowercase, number, and symbol

### Changing the Password or Scope After Deployment

1. Azure Portal → your Static Web App → **Configuration** → **General settings**
2. Under **Password protection**, change the password or switch between:
   - **Protect staging environments only**
   - **Protect both production and staging environments**
3. Click **Save**
