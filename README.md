# Rapid Web App Demos

A collection of reference projects showing different ways to build and deploy web applications on Azure — from zero-backend static sites with various auth models to full-stack apps with **Microsoft Copilot Studio** integration.

Each subfolder is a self-contained project with its own README, deploy script, and dependencies.

---

## Projects

| Folder | Description | Azure Service | Auth | Cost |
|--------|-------------|---------------|------|------|
| [`copilot-studio-webapp-entra/`](copilot-studio-webapp-entra/) | Full-stack app — Next.js frontend + Python backend that proxies chat to a Copilot Studio agent grounded with SharePoint knowledge | Azure Container Apps | Entra ID (OAuth2 confidential client) | Pay-per-use |
| [`data-ai-webapp-demo/`](data-ai-webapp-demo/) | Static demo UI — chat, file browser, analytics panels with mock data; no backend, no auth | Azure Static Web Apps | None (public) | Free |
| [`frontend-only-public-external/`](frontend-only-public-external/) | Static web app — publicly accessible, no authentication | Azure Static Web Apps | None (public) | Free |
| [`frontend-only-password-external/`](frontend-only-password-external/) | Static web app — gated by a shared visitor password on both prod and staging | Azure Static Web Apps | Password protection (preview) | ~$9/mo (Standard) |
| [`frontend-only-auth-external/`](frontend-only-auth-external/) | Static web app — Free-tier auth with pre-configured Microsoft + GitHub providers (invitation-based) | Azure Static Web Apps | Entra ID + GitHub (pre-configured) | Free |
| [`frontend-only-auth-entra-internal/`](frontend-only-auth-entra-internal/) | Static web app — custom Entra ID auth locked to your organization's tenant | Azure Static Web Apps | Entra ID (custom app reg) | ~$9/mo (Standard) |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          This Repository                                  │
├───────────────────────────────┬──────────────────────────────────────────┤
│                               │                                          │
│  copilot-studio-webapp-entra/ │  Full-stack (Azure Container Apps)        │
│  ┌─────────────────────────┐  │  ┌────────────────────────────────────┐  │
│  │ Next.js + Python        │──│──│ Entra ID → Copilot Studio Agent   │  │
│  │ Docker container        │  │  │ (SharePoint knowledge)             │  │
│  └─────────────────────────┘  │  └────────────────────────────────────┘  │
│                               │                                          │
├───────────────────────────────┼──────────────────────────────────────────┤
│                               │                                          │
│  frontend-only-*/             │  Static sites (Azure Static Web Apps)     │
│  data-ai-webapp-demo/         │                                          │
│  ┌─────────────────────────┐  │  ┌────────────────────────────────────┐  │
│  │ Next.js static export   │──│──│ No backend — SWA handles auth,    │  │
│  │ out/ → deploy via CLI   │  │  │ password gate, or fully public    │  │
│  └─────────────────────────┘  │  └────────────────────────────────────┘  │
│                               │                                          │
└───────────────────────────────┴──────────────────────────────────────────┘
```

---

## Quick Start

Each project has its own setup instructions — click the folder link above to see the full README.

### Copilot Studio Full-Stack App

```powershell
cd copilot-studio-webapp-entra

# Configure environment
copy .env.template .env   # fill in your values

# Backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

See [copilot-studio-webapp-entra/DEPLOY.md](copilot-studio-webapp-entra/DEPLOY.md) for Azure Container Apps deployment.

### Static Web Apps (any frontend-only project)

```powershell
cd frontend-only-public-external   # or any frontend-only-* / data-ai-webapp-demo

npm install
npm run dev               # local dev at http://localhost:3000

az login
.\deploy-swa.ps1          # build + deploy to Azure Static Web Apps
```

---

## Choosing the Right Project

```
Do you need a Copilot Studio agent backend?
  ├── YES → copilot-studio-webapp-entra/
  └── NO  → Do you need authentication?
              ├── NO  → Do you just need a simple password gate?
              │           ├── YES → frontend-only-password-external/  (Standard, ~$9/mo)
              │           └── NO  → frontend-only-public-external/    (Free)
              └── YES → Do you need to restrict to your org's tenant?
                          ├── YES → frontend-only-auth-entra-internal/  (Standard, ~$9/mo)
                          └── NO  → frontend-only-auth-external/        (Free)
```

---

## Auth Comparison

| | `public-external` | `password-external` | `auth-external` | `auth-entra-internal` | `copilot-studio-webapp-entra` |
|---|---|---|---|---|---|
| **Access** | Anyone | Password holders | Invited users | Org tenant only | Org users (OAuth2) |
| **Providers** | — | Shared password | Microsoft + GitHub | Microsoft (custom) | Microsoft (MSAL) |
| **App registration** | No | No | No | Auto-created | Manual |
| **SKU** | Free | Standard | Free | Standard | Container Apps |
| **User management** | — | Share the password | Azure Portal invitations | Tenant-wide | Entra ID |

---

## Prerequisites

All projects need:
- **Node.js** ≥ 18
- **Azure CLI** (`az`)

The Copilot Studio project additionally needs:
- **Python** 3.9+
- **Docker Desktop** (for Azure deployment)
- **Azure Developer CLI** (`azd`)
- A published **Copilot Studio agent** with SharePoint knowledge
- An **Entra ID app registration** with Power Platform API permissions

---

## Repository Structure

```
rapid-web-app-demos/
│
├── copilot-studio-webapp-entra/       ← Full-stack Copilot Studio app
│   ├── app.py                         ← Python backend (auth + chat proxy)
│   ├── start_server.py                ← Alternative Agents SDK server
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── azure.yaml                     ← azd deployment config
│   ├── .env.template
│   ├── DEPLOY.md                      ← Azure Container Apps deploy guide
│   ├── DEPLOYMENT-OPTIONS.md          ← Hosting decision tree
│   ├── frontend/                      ← Next.js frontend (chat UI)
│   ├── infra/                         ← Bicep IaC templates
│   └── assets/                        ← Screenshots
│
├── data-ai-webapp-demo/               ← Static demo UI (chat + files + analytics)
│   ├── app/                           ← Next.js app
│   ├── components/                    ← Chat, file browser, analytics, sidebar
│   ├── deploy-swa.ps1
│   └── staticwebapp.config.json
│
├── frontend-only-public-external/     ← Static site — no auth
│   ├── app/                           ← Next.js app (Emoji Match game)
│   ├── components/
│   ├── deploy-swa.ps1
│   └── README.md
│
├── frontend-only-password-external/   ← Static site — password protection
│   ├── app/                           ← Next.js app (Emoji Match game)
│   ├── components/
│   ├── deploy-swa.ps1                 ← Provisions Standard SWA + enables password
│   └── README.md
│
├── frontend-only-auth-external/       ← Static site — Free tier auth
│   ├── app/                           ← Next.js app (Clean Sweep game)
│   ├── components/
│   ├── public/login.html              ← Login page (Microsoft + GitHub)
│   ├── staticwebapp.config.json       ← Auth route rules
│   ├── deploy-swa.ps1
│   └── README.md
│
├── frontend-only-auth-entra-internal/ ← Static site — Custom Entra ID auth
│   ├── app/                           ← Next.js app (Emoji Match + Tetris)
│   ├── components/
│   ├── staticwebapp.config.json       ← Entra ID provider config
│   ├── deploy-swa.ps1
│   └── README.md
│
├── _shared/                           ← Unified README covering all frontend-only variants
│   └── FRONTEND-ONLY-README.md
│
├── .gitignore
└── README.md                          ← This file
```
