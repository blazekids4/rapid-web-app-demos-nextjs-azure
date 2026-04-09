# Azure Static Web Apps Authentication

## Microsoft Personal Accounts (MSA) — How It Actually Works

### Overview

Azure Static Web Apps (SWA) includes built-in authentication using **Microsoft Entra ID**. By default, this authentication model allows **both organizational (work/school) accounts and Microsoft personal accounts** to sign in.

This behavior is **intentional** and requires **no additional configuration** unless you explicitly want to restrict access.

---

## What Is a Microsoft Personal Account?

A **Microsoft personal account (MSA)** is a consumer identity managed by Microsoft. It is separate from organizational Microsoft Entra ID tenants but is authenticated through the same Microsoft identity platform.

Key characteristics of Microsoft personal accounts:

- Used by consumers (not tied to a corporate tenant)
- Authenticated through Microsoft’s identity infrastructure
- Issued OAuth / OIDC tokens signed by Microsoft
- **Not tied to a fixed or closed set of email domains**

Azure Static Web Apps trusts **Microsoft as the identity authority**, not the user’s email domain.

---

## Default Behavior in Azure Static Web Apps

When using the **preconfigured Microsoft Entra ID provider** in Azure Static Web Apps:

- ✅ Any Microsoft Entra ID (work or school) account can sign in
- ✅ Any Microsoft personal account can sign in

This includes users from any organizational tenant and Microsoft consumer identities. No tenant restriction is applied by default.

---

## Microsoft-Owned Personal Account Email Domains (Common)

The following **Microsoft-owned email domains** are commonly associated with Microsoft personal accounts and are accepted by Azure Static Web Apps authentication:

### Core consumer domains

- outlook.com
- live.com
- hotmail.com
- msn.com

### Regional Outlook and Hotmail domains (examples)

- outlook.co.uk
- outlook.de
- outlook.fr
- outlook.it
- outlook.com.au
- hotmail.co.uk
- hotmail.fr
- hotmail.de
- live.se
- live.nl

**Important:** This list is **not exhaustive**. Microsoft operates many regional consumer domains, and the set may change over time.

---

## Custom Email Addresses as Microsoft Accounts

Microsoft personal accounts are **not limited to Microsoft-owned domains**.

These email addresses can also authenticate successfully:

- <user@gmail.com>
- <user@yahoo.com>
- <user@icloud.com>
- <user@customdomain.com>

This is true **only if** the email address has been registered as a **Microsoft Account**.

The email domain itself does not determine trust.

---

## Why There Is No Complete Domain List

There is **no authoritative or complete list** of “Microsoft personal account domains” because:

1.  Microsoft allows nearly any email address to be used to create a Microsoft Account
2.  Identity trust is based on **OAuth token issuance**, not domain matching
3.  Email domains are treated as **user attributes**, not security boundaries

Trying to control access based on email suffix alone is inherently unreliable.

---

## What Azure Static Web Apps Actually Validates

Azure Static Web Apps does **not** validate email domains.

It validates:

- The OAuth token signature (Microsoft signing keys)
- The token issuer (Microsoft identity platform)
- The token audience (the Static Web App)
- Token lifetime and validity

It does **not** validate:

- Email domain
- Mail provider
- Whether an account “looks” personal or organizational

Email information exists only as a claim inside the token.

---

## Microsoft Consumer Identity Tenant

When a Microsoft personal account signs in, the issued token typically includes a tenant ID that represents Microsoft’s **consumer identity tenant**.

Azure Static Web Apps accepts this tenant **by default**, which is why personal accounts such as outlook.com or live.com users can authenticate without extra configuration.

---

## How to Block Microsoft Personal Accounts

To **disallow personal Microsoft accounts**, you must override the default provider and explicitly scope authentication to an organizational tenant.

This requires:

- Using a **custom Microsoft Entra ID provider**
- Specifying a tenant-specific OpenID issuer

Once tenant scoping is applied:

- ✅ Organizational users are allowed
- ❌ Microsoft personal accounts are blocked

---

## Summary

- Azure Static Web Apps accepts **any Microsoft personal account by default**
- There is **no fixed domain allowlist**
- Trust is established through **Microsoft’s identity platform**, not email domains
- Email domains are informational, not a security control
- Blocking personal accounts requires **explicit tenant restriction**

---

### Executive One-Liner

**Azure Static Web Apps authenticates identities, not email domains. Any Microsoft personal account—regardless of email address—is accepted by default because trust is established through Microsoft’s identity platform and token issuance, not the domain string.**
