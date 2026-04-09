<#
.SYNOPSIS
    Deploys the frontend-only Next.js static site to Azure Static Web Apps
    (Standard tier) with password protection on both production and staging.

.DESCRIPTION
    This script:
    1. Builds the Next.js static export.
    2. Provisions an Azure Static Web App (Standard tier — required for password protection).
    3. Enables password protection on both production and staging environments.
    4. Deploys the out/ folder via the SWA CLI.

    Password protection is an Azure SWA feature (preview) that prompts visitors
    for a shared password before they can view the site. It does NOT use identity
    providers — it's a simple gate that blocks unauthenticated page views.

.PARAMETER ResourceGroup
    Name of the Azure resource group. Default: rg-frontend-password

.PARAMETER AppName
    Name of the Azure Static Web App. Default: swa-frontend-password

.PARAMETER Location
    Azure region. Default: eastus2

.PARAMETER Password
    The visitor password used for password protection.
    Must be at least 8 characters with uppercase, lowercase, number, and symbol.
    Default: Dontguess@123

.PARAMETER SkipBuild
    Skip the npm build step if the out/ folder is already up to date.

.EXAMPLE
    .\deploy-swa.ps1
    .\deploy-swa.ps1 -ResourceGroup my-rg -AppName my-swa -Location westus2
    .\deploy-swa.ps1 -Password "MyP@ssw0rd!"
    .\deploy-swa.ps1 -SkipBuild
#>

param(
    [string]$ResourceGroup = "rg-frontend-password",
    [string]$AppName       = "swa-frontend-password",
    [string]$Location      = "eastus2",
    [string]$Password      = "Dontguess@123",
    [switch]$SkipBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── Prerequisites check ──────────────────────────────────────────────
function Assert-Command([string]$Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        Write-Error "Required command '$Name' not found. Please install it first."
    }
}

Assert-Command "az"
Assert-Command "node"
Assert-Command "npm"

if (-not (Get-Command "swa" -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Azure Static Web Apps CLI..." -ForegroundColor Yellow
    npm install -g @azure/static-web-apps-cli
}

# ── Validate password ────────────────────────────────────────────────
if ($Password.Length -lt 8) {
    Write-Error "Password must be at least 8 characters."
}
if ($Password -cnotmatch '[A-Z]') {
    Write-Error "Password must contain at least one uppercase letter."
}
if ($Password -cnotmatch '[a-z]') {
    Write-Error "Password must contain at least one lowercase letter."
}
if ($Password -notmatch '\d') {
    Write-Error "Password must contain at least one number."
}
if ($Password -notmatch '[^a-zA-Z0-9]') {
    Write-Error "Password must contain at least one symbol."
}

# ── Ensure Azure login ───────────────────────────────────────────────
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "Not logged in to Azure. Running 'az login'..." -ForegroundColor Yellow
    az login
    $account = az account show | ConvertFrom-Json
}
Write-Host "Using subscription: $($account.name) ($($account.id))" -ForegroundColor Cyan

$subscriptionId = $account.id

# ── Build ─────────────────────────────────────────────────────────────
Push-Location $PSScriptRoot
try {
    if (-not $SkipBuild) {
        Write-Host "`n==> Installing dependencies..." -ForegroundColor Green
        npm ci

        Write-Host "==> Building static export..." -ForegroundColor Green
        npm run build

        if (-not (Test-Path "./out/index.html")) {
            Write-Error "Build failed: out/index.html not found."
        }
        Write-Host "==> Build complete. Output in ./out/" -ForegroundColor Green
    }
    else {
        if (-not (Test-Path "./out/index.html")) {
            Write-Error "out/index.html not found. Run without -SkipBuild first."
        }
        Write-Host "==> Skipping build (using existing ./out/ folder)" -ForegroundColor Yellow
    }

    # ── Provision Azure Static Web App (Standard tier) ────────────────
    Write-Host "`n==> Ensuring resource group '$ResourceGroup' exists..." -ForegroundColor Green
    az group create --name $ResourceGroup --location $Location --output none

    $existing = az staticwebapp show --name $AppName --resource-group $ResourceGroup 2>$null
    if ($existing) {
        Write-Host "==> Static Web App '$AppName' already exists." -ForegroundColor Cyan
    }
    else {
        Write-Host "==> Creating Static Web App '$AppName' (Standard tier)..." -ForegroundColor Green
        az staticwebapp create `
            --name $AppName `
            --resource-group $ResourceGroup `
            --location $Location `
            --sku Standard `
            --output none
    }

    # ── Enable password protection (production + staging) ─────────────
    # Password protection is configured via the ARM REST API.
    # applicableEnvironmentsMode: AllEnvironments = prod + staging
    Write-Host "`n==> Enabling password protection on all environments..." -ForegroundColor Green

    $uri = "/subscriptions/$subscriptionId/resourceGroups/$ResourceGroup/providers/Microsoft.Web/staticSites/$AppName/basicAuth/default?api-version=2022-09-01"

    $body = @{
        properties = @{
            applicableEnvironmentsMode = "AllEnvironments"
            password                   = $Password
        }
    } | ConvertTo-Json -Depth 3

    $bodyFile = Join-Path $env:TEMP "swa-password-body.json"
    Set-Content -Path $bodyFile -Value $body -Encoding utf8

    az rest --method PUT --uri $uri --body "@$bodyFile" --headers "Content-Type=application/json" --output none

    Remove-Item $bodyFile -ErrorAction SilentlyContinue

    Write-Host "==> Password protection enabled." -ForegroundColor Green

    # ── Get deployment token ──────────────────────────────────────────
    Write-Host "==> Retrieving deployment token..." -ForegroundColor Green
    $token = (az staticwebapp secrets list `
        --name $AppName `
        --resource-group $ResourceGroup `
        --query "properties.apiKey" `
        --output tsv)

    if (-not $token) {
        Write-Error "Failed to retrieve deployment token."
    }

    # ── Deploy with SWA CLI ───────────────────────────────────────────
    Write-Host "==> Deploying to Azure Static Web Apps..." -ForegroundColor Green
    swa deploy ./out `
        --deployment-token $token `
        --env production

    # ── Output URL & next steps ───────────────────────────────────────
    $hostname = (az staticwebapp show `
        --name $AppName `
        --resource-group $ResourceGroup `
        --query "defaultHostname" `
        --output tsv)

    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Deployment complete!" -ForegroundColor Green
    Write-Host "URL: https://$hostname" -ForegroundColor Cyan
    Write-Host "" -ForegroundColor Cyan
    Write-Host "Password protection is enabled on ALL environments." -ForegroundColor Yellow
    Write-Host "Visitors will be prompted for the password before" -ForegroundColor Yellow
    Write-Host "they can view the site." -ForegroundColor Yellow
    Write-Host "" -ForegroundColor Cyan
    Write-Host "To change the password or scope later:" -ForegroundColor Cyan
    Write-Host "  Azure Portal > Static Web App > Configuration > General settings" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}
finally {
    Pop-Location
}
