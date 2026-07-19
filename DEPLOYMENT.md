# Deployment Guide: OAU Enviro Rank on Render (Free Tier)

This document is a complete, step-by-step guide for deploying the OAU Environmental Compliance and Cleanliness Assessment System to **Render.com** using its free tier. The app uses **Next.js 16** with **Prisma 7** and a **PostgreSQL** database for both local development and production.

---

> [!IMPORTANT]
> **Free Tier Limitations** — Be aware of these constraints before deploying:
> - **Web Service:** Spins down after **15 minutes of inactivity**. The next request will experience a **30–60 second cold start** delay.
> - **PostgreSQL Database:** Free databases **expire after 30 days** and are limited to **1 GB of storage**. They are suitable for demos and prototypes. Upgrade to a paid plan for long-term persistence.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Required Codebase Modifications](#2-required-codebase-modifications)
3. [Provision a Free PostgreSQL Database on Render](#3-provision-a-free-postgresql-database-on-render)
4. [Create and Configure the Web Service](#4-create-and-configure-the-web-service)
5. [Set Environment Variables Securely](#5-set-environment-variables-securely)
6. [Configure the Build Pipeline](#6-configure-the-build-pipeline)
7. [Run Database Migrations and Seed](#7-run-database-migrations-and-seed)
8. [Using `render.yaml` (Infrastructure as Code — Optional but Recommended)](#8-using-renderyaml-infrastructure-as-code--optional-but-recommended)
9. [Security Checklist](#9-security-checklist)
10. [Post-Deployment Verification](#10-post-deployment-verification)
11. [Environment Variables Reference](#11-environment-variables-reference)

---

## 1. Prerequisites

Before you begin, ensure the following are in place:

- [ ] A **GitHub or GitLab account** with this repository pushed and up to date.
- [ ] A **Render account** — sign up for free at [render.com](https://render.com).
- [ ] The `.env` file is listed in `.gitignore` (it already is — **never commit it**).

---

## 2. Required Codebase Modifications

The following changes must be made to your local codebase before pushing to deploy. **Commit and push these changes to your repository.**

---

### 2.1 — Prisma 7 connection architecture (already correct ✅)

> [!IMPORTANT]
> **Prisma 7 removed `url` and `directUrl` from `schema.prisma`.** Do **not** add those fields to the schema — doing so will cause a `P1012` validation error and break the build.

This project already uses the correct Prisma 7 connection pattern — **no changes are needed**:

- **`prisma/schema.prisma`** — Only declares `provider = "postgresql"`. No `url` or `directUrl` here.
- **`prisma.config.ts`** — Provides `DATABASE_URL` to the Prisma CLI for `db push`, migrations, and seeding.
- **`src/lib/db.ts`** — Passes `DATABASE_URL` to the `PrismaPg` adapter for runtime queries at application startup.

All three files work together. You only need to set `DATABASE_URL` in the Render Environment tab and the whole chain resolves automatically.

---

### 2.2 — `src/lib/auth-session.ts`: Enforce `SESSION_SECRET` at runtime

The current session signing code falls back to a hardcoded string if `SESSION_SECRET` is not set:

```typescript
// Current (insecure fallback)
const SECRET = process.env.SESSION_SECRET || "fallback-secret-for-oau-enviro-rank-project-123456";
```

**Replace this line with a hard failure** so the app refuses to start without a proper secret:

```typescript
// Secure — throws at startup if SESSION_SECRET is missing
const SECRET = process.env.SESSION_SECRET;
if (!SECRET) {
  throw new Error("FATAL: SESSION_SECRET environment variable is not set. The application cannot start securely.");
}
```

---

### 2.3 — `next.config.ts`: Confirm `standalone` output (Already correct ✅)

Your `next.config.ts` already has `output: "standalone"` — **no change needed**.

---

### 2.4 — `package.json`: Confirm build script (Already correct ✅)

The `build` script already runs `prisma generate && next build` — **no change needed**.

---

## 3. Provision a Free PostgreSQL Database on Render

1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** → **PostgreSQL**.
3. Fill in the form:
   - **Name:** `oau-enviro-rank-db`
   - **Database Name:** `oau_enviro_rank`
   - **User:** `oau_admin`
   - **Region:** Choose the region closest to your users (e.g., **Frankfurt EU Central** for Nigeria proximity).
   - **Plan:** Select **Free**.
4. Click **Create Database**.
5. On the database detail page, note the following (you will need them in Step 5):
   - **Internal Database URL** — used as `DATABASE_URL` at runtime (within Render's private network).
   - **External Database URL** — used as `DIRECT_URL` for running migrations.

> [!WARNING]
> The free database **expires in 30 days**. Render will email you before expiry. Upgrade to a paid plan or migrate your data to avoid data loss.

---

## 4. Create and Configure the Web Service

### 4.1 Connect your Repository

1. In the Render Dashboard, click **New +** → **Web Service**.
2. Click **Connect a repository** and authorize Render to access your GitHub/GitLab account.
3. Select the `oau-enviro-rank` repository.
4. Click **Connect**.

### 4.2 Configure the Web Service

Fill in the service configuration form:

| Field | Value |
| :--- | :--- |
| **Name** | `oau-enviro-rank` |
| **Region** | Same region as your database (e.g., Frankfurt) |
| **Branch** | `main` (or your production branch) |
| **Runtime** | **Node** |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | **Free** |

---

## 5. Set Environment Variables Securely

> [!CAUTION]
> **Never hardcode secrets in `render.yaml` or commit them to Git.** Use Render's dashboard to set sensitive values. Variables set in the dashboard take precedence over those in `render.yaml`.

### 5.1 Set Variables in the Render Dashboard

Navigate to your Web Service → **Environment** tab → **Add Environment Variable**. Add each variable below:

| Variable | Value | Notes |
| :--- | :--- | :--- |
| `DATABASE_URL` | Internal Database URL from Step 3 | Used by both the app at runtime and Prisma CLI via `prisma.config.ts` |
| `SESSION_SECRET` | A long, random string (64 chars) | Signs auth session tokens — **generate with `openssl rand -hex 32`** |
| `NEXT_PUBLIC_APP_URL` | `https://oau-enviro-rank.onrender.com` | Your Render service URL (set after first deploy) |
| `NODE_ENV` | `production` | Instructs Next.js and Prisma to use production paths |

> [!TIP]
> To generate a secure `SESSION_SECRET`, run this command in your terminal:
> ```bash
> openssl rand -hex 32
> ```
> Copy the 64-character hex output and paste it as the value in the Render dashboard.

### 5.2 `NEXT_PUBLIC_` Prefix Security Rule

- Variables prefixed with `NEXT_PUBLIC_` are **bundled into the client-side JavaScript** and visible to all users in their browser.
- **Never** put `DATABASE_URL`, `SESSION_SECRET`, or any passwords under `NEXT_PUBLIC_`.

---

## 6. Configure the Build Pipeline

Render's Node runtime will automatically run your build script on every push:

- **Build Command:** `npm install && npm run build`
  - This runs `prisma generate` (from your `package.json` build script) then `next build`.
- **Start Command:** `npm start`
  - This runs `next start` which serves the standalone `.next` output.

> [!NOTE]
> Render caches `node_modules` between builds to speed up subsequent deploys. If you add new dependencies, it automatically reinstalls them.

---

## 7. Run Database Migrations and Seed

After the first successful deployment, you need to push the Prisma schema and seed the database.

### 7.1 Using the Render Shell (Recommended)

1. In the Render Dashboard, navigate to your Web Service.
2. Click the **Shell** tab.
3. Run the following commands **in order**:

```bash
# Step 1: Push the Prisma schema to create all tables
npx prisma db push

# Step 2: Seed the database with OAU faculties and the active assessment period
npx tsx prisma/seed.ts
```

### 7.2 Running Migrations Locally Against the Render Database

You can also run migrations from your local machine using the **External Database URL**:

```bash
# Replace with your actual Render External Database URL
DATABASE_URL="postgresql://oau_admin:YOURPASSWORD@oregon-postgres.render.com:5432/oau_enviro_rank" \
DIRECT_URL="postgresql://oau_admin:YOURPASSWORD@oregon-postgres.render.com:5432/oau_enviro_rank" \
npx prisma db push

# Then seed
DATABASE_URL="postgresql://oau_admin:YOURPASSWORD@oregon-postgres.render.com:5432/oau_enviro_rank" \
npx tsx prisma/seed.ts
```

> [!IMPORTANT]
> Use the **External Database URL** (not the internal one) when connecting from your local machine.

---

## 8. Using `render.yaml` (Infrastructure as Code — Optional but Recommended)

Create the file `render.yaml` in the project root:

```yaml
# render.yaml — Render Blueprint for OAU Enviro Rank
# https://render.com/docs/blueprint-spec

services:
  - type: web
    name: oau-enviro-rank
    runtime: node
    plan: free
    region: frankfurt   # Change to your preferred region
    branch: main
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      # Automatically wired from the database defined below
      - key: DATABASE_URL
        fromDatabase:
          name: oau-enviro-rank-db
          property: connectionString
      - key: DIRECT_URL
        fromDatabase:
          name: oau-enviro-rank-db
          property: connectionString
      - key: NODE_ENV
        value: production
      # sync: false means Render will NOT overwrite values you set manually in the Dashboard.
      # Set these sensitive values directly in the Render Dashboard.
      - key: SESSION_SECRET
        sync: false
      - key: NEXT_PUBLIC_APP_URL
        sync: false

databases:
  - name: oau-enviro-rank-db
    plan: free
    region: frankfurt   # Must match the web service region
    databaseName: oau_enviro_rank
    user: oau_admin
```

### Deploying via Blueprint

1. Push `render.yaml` to your repository.
2. Go to [dashboard.render.com](https://dashboard.render.com) → **New +** → **Blueprint**.
3. Connect your repository.
4. Render will auto-detect `render.yaml` and show a preview of all resources it will create.
5. Click **Apply**. Render provisions both the database and the web service automatically.
6. After provisioning, go to your Web Service → **Environment** tab and manually set all variables marked `sync: false`.
7. Trigger a new deploy from the **Deploys** tab so the new environment values take effect.

> [!WARNING]
> Do **not** put actual secret values inside `render.yaml` — this file is committed to Git. The `sync: false` pattern instructs Render to leave the value as-is if it was manually set in the dashboard.

---

## 9. Security Checklist

| # | Item | Status |
| :--- | :--- | :--- |
| 1 | `.env` is in `.gitignore` | ✅ Already done |
| 2 | `SESSION_SECRET` is a strong 64-char random string set only in the Render Dashboard | ⬜ Do this |
| 3 | `DATABASE_URL` is set only in the Render Dashboard (not as a plain value in `render.yaml`) | ⬜ Do this |
| 4 | `prisma/schema.prisma` does **not** contain `url` or `directUrl` (Prisma 7 removed these) | ✅ Already correct |
| 5 | `src/lib/auth-session.ts` throws a fatal error if `SESSION_SECRET` is missing | ⬜ Apply change from §2.2 |
| 6 | `BYPASS_AUTH_FOR_TEST` is **not** set in the Render Environment tab | ⬜ Verify this |
| 7 | `NODE_ENV` is set to `production` in the Render Environment tab | ⬜ Do this |
| 8 | All admin routes are protected by the middleware in `src/proxy.ts` | ✅ Already done |

---

## 10. Post-Deployment Verification

Once Render completes the deployment and your service URL is live (e.g., `https://oau-enviro-rank.onrender.com`), perform these checks:

1. **Landing Page**: Visit the root URL `/`. Verify the faculty leaderboard loads with seeded data.
2. **Survey Form**: Visit `/survey` on a mobile browser. Confirm the form renders correctly and a submission can be completed end-to-end.
3. **Admin Login**: Visit `/login`. Log in using the superadmin credentials you seeded. Verify you are redirected to `/admin/dashboard`.
4. **Admin Dashboard**: Confirm inspection scores, faculty management, and user management pages load without errors.
5. **Unauthorized Access**: Log out and try to access `/admin/dashboard` directly. Confirm you are redirected to `/login`.
6. **API Security**: Make a `curl` or Postman request to `POST /api/admin/users` without a valid session cookie. Confirm a `401 Unauthorized` response is returned.
7. **Environment Variable Leak Test**: Open browser DevTools → **Sources** and search for `SESSION_SECRET` or `DATABASE_URL` in the page source. These must **not** appear anywhere.

---

## 11. Environment Variables Reference

| Variable | Scope | Required | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Server-only | ✅ Yes | PostgreSQL connection string. Used by `prisma.config.ts` for CLI operations and by `src/lib/db.ts` for runtime queries. |
| `SESSION_SECRET` | Server-only | ✅ Yes | HMAC-SHA256 signing key for session tokens. Min 64 chars. **Never** expose client-side. |
| `NODE_ENV` | Server-only | ✅ Yes | Set to `production` on Render. Controls Next.js build mode. |
| `NEXT_PUBLIC_APP_URL` | Client + Server | ✅ Yes | The full public URL of the deployed app. Used for absolute URL construction. |
| `BYPASS_AUTH_FOR_TEST` | Server-only | ❌ Never in prod | Development/testing flag that disables authentication middleware. Must be absent or `false`. |

---

*Last updated: July 2026 | Target Platform: Render Free Tier | Stack: Next.js 16 · Prisma 7 · PostgreSQL*
