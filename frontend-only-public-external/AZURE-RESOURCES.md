# Azure Resources & Permissions

## Azure Resources

The deployment script (`deploy-swa.ps1`) provisions the following resources:

| Resource | Type | Default Name | Purpose |
|----------|------|-------------|---------|
| **Resource Group** | `Microsoft.Resources/resourceGroups` | `rg-frontend-only-poc` | Container for all project resources |
| **Static Web App** | `Microsoft.Web/staticSites` | `swa-frontend-only-poc` | Hosts the static site (Free tier) |

## Required Permissions

The deploying user or service principal needs the following permissions on the target subscription or resource group.

### Minimum Azure RBAC Roles

| Role | Scope | Why |
|------|-------|-----|
| **Contributor** | Subscription _or_ Resource Group | Create the resource group and Static Web App (`az group create`, `az staticwebapp create`) |

> If the resource group already exists, **Contributor** scoped to that resource group is sufficient.

### Granular Permissions (Least-Privilege Alternative)

If you prefer a custom role instead of the built-in Contributor role:

| Permission | Used By |
|------------|---------|
| `Microsoft.Resources/subscriptions/resourceGroups/write` | `az group create` |
| `Microsoft.Web/staticSites/write` | `az staticwebapp create` |
| `Microsoft.Web/staticSites/read` | `az staticwebapp show` |
| `Microsoft.Web/staticSites/listsecrets/action` | `az staticwebapp secrets list` (retrieve deployment token) |

### Azure CLI Authentication

The script requires an active Azure CLI session (`az login`). Supported identity types:

- **User account** — interactive login via `az login`
- **Service principal** — `az login --service-principal`
- **Managed identity** — `az login --identity`

## Local Tooling

These tools must be installed on the machine running the deployment:

| Tool | Purpose |
|------|---------|
| **Node.js** ≥ 18 | Build the Next.js project |
| **npm** | Install dependencies |
| **Azure CLI** (`az`) | Provision Azure resources and retrieve the deployment token |
| **SWA CLI** (`swa`) | Deploy static files to the Static Web App (auto-installed by the script if missing) |
