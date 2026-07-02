# Production Deployment Guide: OAU Enviro Rank

This document outlines the Solutions Architecture and DevOps steps to transition the OAU Environmental Compliance and Cleanliness Assessment System from local development (SQLite) into a production-grade containerized environment utilizing **Supabase (Managed PostgreSQL)** and **Google Cloud Run**.

---

## 1. Environment Variables Checklist

Ensure these variables are configured in your Cloud Run service settings:

| Variable | Description | Example / Format |
| :--- | :--- | :--- |
| `DATABASE_URL` | Connection pooling string for Supabase database (transaction mode). | `postgres://postgres.xxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | Direct connection string for Supabase database (session mode). Used for migrations. | `postgres://postgres.xxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres` |
| `NEXT_PUBLIC_APP_URL` | Public production domain where this application is hosted (e.g. your Cloud Run URL). | `https://oau-enviro-rank-xxxxxx-uc.a.run.app` |
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

## 3. Google Cloud Run Deployment Guide

Google Cloud Run is a fully managed compute platform that automatically scales your stateless containers. Since our project includes a multi-stage `Dockerfile` configured for Next.js standalone builds, it is perfectly suited for deployment to Cloud Run.

### Prerequisites & Initial Setup

1. **Install Google Cloud SDK**: Ensure the `gcloud` CLI is installed and authenticated on your local machine.
2. **Select GCP Project**:
   ```bash
   gcloud config set project [YOUR_PROJECT_ID]
   ```
3. **Enable Required APIs**: Enable the Cloud Run, Artifact Registry, and Cloud Build APIs:
   ```bash
   gcloud services enable run.googleapis.com \
                          artifactregistry.googleapis.com \
                          cloudbuild.googleapis.com
   ```

---

### Option A: Direct Source Deployment (Simplest & Recommended)

This method uses Cloud Build to package your application and deploy it directly to Cloud Run in a single command. It reads your local `Dockerfile` and builds the image automatically without needing a manual registry push.

Run the following command in the project root:

```bash
gcloud run deploy oau-enviro-rank \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="[YOUR_SUPABASE_TRANSACTION_CONNECTION_STRING]",DIRECT_URL="[YOUR_SUPABASE_SESSION_CONNECTION_STRING]",NEXT_PUBLIC_APP_URL="[YOUR_CLOUD_RUN_URL]"
```

*Note: You can omit `NEXT_PUBLIC_APP_URL` on the first deploy, copy the service URL from the command output, and then redeploy with the `NEXT_PUBLIC_APP_URL` set.*

---

### Option B: Deploying via Artifact Registry & Cloud Build (Structured)

For team environments or structured CI/CD pipelines, you can build and publish the Docker container to Google Artifact Registry first, and then run it.

#### Step 1: Create a Docker Artifact Registry Repository
```bash
gcloud artifacts repositories create oau-enviro-rank-repo \
  --repository-format=docker \
  --location=us-central1 \
  --description="Docker repository for OAU Enviro Rank"
```

#### Step 2: Build and Tag the Image using Cloud Build
```bash
gcloud builds submit --tag us-central1-docker.pkg.dev/[YOUR_PROJECT_ID]/oau-enviro-rank-repo/oau-enviro-rank:latest .
```

#### Step 3: Deploy the Container Image to Cloud Run
```bash
gcloud run deploy oau-enviro-rank \
  --image us-central1-docker.pkg.dev/[YOUR_PROJECT_ID]/oau-enviro-rank-repo/oau-enviro-rank:latest \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="[YOUR_SUPABASE_TRANSACTION_CONNECTION_STRING]",DIRECT_URL="[YOUR_SUPABASE_SESSION_CONNECTION_STRING]",NEXT_PUBLIC_APP_URL="[YOUR_CLOUD_RUN_URL]"
```

---

### Security Best Practice: Using GCP Secret Manager for Environment Variables

Instead of passing secrets like database credentials directly in plain-text environment variables, use **Secret Manager**:

1. **Create the Secrets**:
   ```bash
   echo -n "YOUR_DATABASE_URL" | gcloud secrets create DB_URL_SECRET --data-file=-
   echo -n "YOUR_DIRECT_URL" | gcloud secrets create DIRECT_URL_SECRET --data-file=-
   ```
2. **Grant Secret Access Permission**:
   Cloud Run uses the Compute Engine Default Service Account (`[PROJECT_NUMBER]-compute@developer.gserviceaccount.com`) by default. Grant it accessor permission:
   ```bash
   gcloud secrets add-iam-policy-binding DB_URL_SECRET \
     --member="serviceAccount:[PROJECT_NUMBER]-compute@developer.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"

   gcloud secrets add-iam-policy-binding DIRECT_URL_SECRET \
     --member="serviceAccount:[PROJECT_NUMBER]-compute@developer.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"
   ```
3. **Deploy Reference to Secrets**:
   ```bash
   gcloud run deploy oau-enviro-rank \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --set-secrets=DATABASE_URL=DB_URL_SECRET:latest,DIRECT_URL=DIRECT_URL_SECRET:latest \
     --set-env-vars NEXT_PUBLIC_APP_URL="[YOUR_CLOUD_RUN_URL]"
   ```

## 4. Verification in Production

Once the deployment completes and your testing URL is generated, perform these verification checks:
1. Load the landing page URL and verify that the stats display correctly.
2. Confirm the active period is set to "June 2026" (or the seeded period).
3. Access `/survey` on a mobile browser to verify forms load smoothly.
4. Submit a survey and check that the landing page leaderboard updates the faculty rankings instantly without manual refresh.
