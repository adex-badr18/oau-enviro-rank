# Production Deployment Guide: OAU Enviro Rank

This document outlines the Solutions Architecture and DevOps steps to transition the OAU Environmental Compliance and Cleanliness Assessment System from local development (SQLite) into a production-grade serverless environment utilizing **Supabase (Managed PostgreSQL)** and cloud providers (**Vercel**, **Railway**, or **Render**).

---

## 1. Environment Variables Checklist

Ensure these variables are configured in your cloud hosting provider dashboard:

| Variable | Description | Example / Format |
| :--- | :--- | :--- |
| `DATABASE_URL` | Connection pooling string for Supabase database (transaction mode). | `postgres://postgres.xxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | Direct connection string for Supabase database (session mode). Used for migrations. | `postgres://postgres.xxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres` |
| `NEXT_PUBLIC_APP_URL` | Public production domain where this application is hosted. | `https://oau-enviro-rank.vercel.app` |
| `NODE_ENV` | Target environment. | `production` |

---

## 2. Transitioning Prisma to Supabase (PostgreSQL)

Prisma does not support dynamic database providers (e.g. SQLite and PostgreSQL at the same time in one configuration). Follow these steps to transition:

### Step A: Update `prisma/schema.prisma`
Modify the `datasource db` block in `prisma/schema.prisma` (lines 8-10) to use the `postgresql` provider and point to `DATABASE_URL` and `DIRECT_URL`:

```prisma
// prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### Step B: Generate the Prisma Client
Run the following command to rebuild the Prisma client with PostgreSQL drivers:
```bash
npx prisma generate
```

### Step C: Push Schema to Supabase
Run the database schema push command to sync the models and relations to your Supabase instance:
```bash
npx prisma db push
```

### Step D: Seed the Production Database
Run the seed script to populate default OAU faculties and set up the active assessment period (June 2026):
```bash
npx tsx prisma/seed.ts
```

*Note: The project's database client (`src/lib/db.ts`) will automatically recognize the PostgreSQL connection string and bypass SQLite.*

---

## 3. Serverless Deployment Guides

### Option A: Vercel (Recommended - Serverless Server & Frontend)

Vercel provides the easiest and most performant serverless hosting for Next.js App Router applications.

1. **Push your code** to a GitHub repository.
2. Go to the [Vercel Dashboard](https://vercel.com) and click **Add New Project**.
3. Import your repository.
4. Expand **Environment Variables** and add:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXT_PUBLIC_APP_URL`
5. In **Build and Development Settings**, override the **Build Command** to ensure client generation and database migrations occur before building static pages:
   ```bash
   npx prisma generate && npx prisma db push && next build
   ```
6. Click **Deploy**. Vercel will build the application and provide a direct shared URL (e.g., `https://oau-enviro-rank.vercel.app`).

---

### Option B: Railway (Docker Deployment)

Railway builds and runs applications in isolated containers, which works perfectly with the custom multi-stage `Dockerfile` we provided.

1. Create a project on [Railway](https://railway.app).
2. Click **New Service** -> **GitHub Repo** and select your repository.
3. Railway will automatically detect the root `Dockerfile` and build it.
4. Go to **Variables** and add:
   - `DATABASE_URL` (Supabase connection pooler string)
   - `DIRECT_URL` (Supabase direct connection string)
   - `NEXT_PUBLIC_APP_URL` (Your Railway app domain)
5. Go to **Settings** and click **Generate Domain** under the Public Networking section.
6. Trigger a deployment. Railway will build the Docker container and start the Next.js standalone server on port 3000.

---

### Option C: Render (Docker Web Service)

Render is another excellent platform for running Dockerized web services.

1. Sign in to [Render](https://render.com).
2. Click **New** -> **Web Service**.
3. Connect your GitHub repository.
4. Select **Docker** as the Runtime environment.
5. In **Environment**, add the following variables:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXT_PUBLIC_APP_URL`
6. Choose the **Free** instance type (or starter/pro for faster builds).
7. Click **Create Web Service**. Render will pull the code, execute the multi-stage build specified in the `Dockerfile`, and expose your service publicly.

---

## 4. Verification in Production

Once the deployment completes and your testing URL is generated, perform these verification checks:
1. Load the landing page URL and verify that the stats display correctly.
2. Confirm the active period is set to "June 2026" (or the seeded period).
3. Access `/survey` on a mobile browser to verify forms load smoothly.
4. Submit a survey and check that the landing page leaderboard updates the faculty rankings instantly without manual refresh.
