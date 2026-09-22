# PostFlow

**Upload Once. Go Everywhere.**  
*Post to Instagram, Facebook and YouTube — all at once.*

PostFlow is a modern, production-ready SaaS dashboard built with Next.js (App Router), TypeScript, Tailwind CSS, Supabase, official Meta Graph APIs, and the official YouTube Data API.

It eliminates third-party workflow platforms (n8n, Make, Zapier, Buffer) in favor of a direct, high-performance architecture with client-to-storage video streaming, AES-256-GCM token encryption, background scheduling, and independent platform publishing.

---

## Key Features

- **One Video, One Caption, One Button**: Upload once; PostFlow dispatches the video to Instagram Reels, Facebook Page Videos, and YouTube Videos/Shorts simultaneously.
- **Direct-to-Storage Architecture**: Video binaries are uploaded directly from the user's browser to private Supabase Storage, bypassing Vercel's 4.5MB serverless payload limit.
- **Official Platform Integrations**:
  - **Instagram**: Official Graph API v20.0 Container Flow (`/media` -> status polling -> `/media_publish`).
  - **Facebook**: Official Graph API v20.0 Page Video/Reels API (`/{page_id}/videos`).
  - **YouTube**: Official YouTube Data API v3 Resumable Upload protocol with automatic OAuth token refresh.
- **Enterprise Token Security**: OAuth tokens are encrypted at rest with AES-256-GCM authenticated encryption and never exposed to the client browser.
- **Atomic Scheduling**: Database-level concurrency locking (`FOR UPDATE SKIP LOCKED`) ensures scheduled posts are published on time without duplicate execution.
- **Independent Failure Isolation & Retries**: If publishing fails on one platform (e.g. YouTube quota exceeded), Instagram and Facebook still succeed. The user can retry failed platforms independently.
- **Built-in Mock Mode (`SOCIAL_API_MOCK_MODE=true`)**: Test and demo the entire upload, queue, and multi-platform publishing flow locally without needing live Meta app approval or Google cloud verification.

---

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Dark Modern SaaS theme)
- **Icons**: Lucide React
- **Database & Auth**: Supabase PostgreSQL, Supabase Auth, Row-Level Security (RLS)
- **Storage**: Supabase Storage (`social-videos` private bucket)
- **Cryptography**: Node.js `crypto` (AES-256-GCM authenticated encryption)
- **APIs**: Meta Graph API v20.0, YouTube Data API v3

---

## Step-by-Step Setup Guide

Follow this guide to configure and deploy PostFlow from scratch.

### 1. Clone & Install Dependencies
```bash
cd AUTOMATION
npm install
```

### 2. Run Tests
Ensure all unit tests pass (encryption, platform validation, status aggregation, timezone, title generator):
```bash
npm test
```

### 3. Create Supabase Project
1. Go to [database.new](https://database.new) and create a new project.
2. Note your **Project URL**, **Anon Key**, and **Service Role Key** under **Project Settings -> API**.

### 4. Run SQL Migrations
1. Open the Supabase SQL Editor.
2. Copy the contents of [`supabase/migrations/20260920000000_init_schema.sql`](file:///c:/Users/sasat/Downloads/AUTOMATION/supabase/migrations/20260920000000_init_schema.sql) and execute it.
   - This creates `profiles`, `social_accounts`, `posts`, and `post_targets` tables with RLS and indexes.
   - It also creates the atomic claim stored procedure `claim_scheduled_posts()`.

### 5. Create Storage Bucket
1. In the Supabase SQL Editor, run [`supabase/storage.sql`](file:///c:/Users/sasat/Downloads/AUTOMATION/supabase/storage.sql).
2. This creates the private `social-videos` bucket and configures storage policies allowing authenticated creators to upload into their own folder (`userId/*`).

### 6. Configure Supabase Authentication
1. In Supabase Dashboard -> **Authentication -> Providers**, enable **Email**.
2. (Optional) Disable email confirmation for instant local onboarding during development (**Auth -> URL Configuration / Email Templates**).

### 7. Configure Meta Developer App
1. Go to [developers.facebook.com](https://developers.facebook.com) and create a new App (Type: **Business**).
2. Add **Facebook Login for Business** and **Instagram Graph API** products.
3. In **App Settings -> Basic**, copy your **App ID** and **App Secret**.

### 8. Configure Facebook Page & Instagram Professional Account
1. Create a Facebook Page (or use an existing Page where you have Admin access).
2. Convert your Instagram account to a **Professional (Business or Creator)** account in the Instagram mobile app.
3. In Facebook Page Settings -> **Linked Accounts**, connect your Instagram Professional account to the Facebook Page.
   > **Note**: Meta's Content Publishing API strictly requires Instagram accounts to be Professional accounts linked to a Facebook Page.

### 9. Configure Meta OAuth Redirect URL
1. In Facebook Login Settings, add the Valid OAuth Redirect URI:
   - For local development: `http://localhost:3000/api/oauth/meta/callback`
   - For production: `https://your-domain.vercel.app/api/oauth/meta/callback`

### 10. Configure Google Cloud Console & YouTube Data API
1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a project.
2. Go to **APIs & Services -> Library**, search for **YouTube Data API v3**, and click **Enable**.
3. In **APIs & Services -> OAuth Consent Screen**:
   - Set user type to **External**.
   - Add the scopes:
     - `https://www.googleapis.com/auth/youtube.upload`
     - `https://www.googleapis.com/auth/youtube.readonly`
   - In **Test Users**, add the Google email address of your test account.
4. In **APIs & Services -> Credentials**:
   - Create an **OAuth 2.0 Client ID** (Application type: Web application).
   - Add Authorized redirect URIs:
     - Local: `http://localhost:3000/api/oauth/google/callback`
     - Production: `https://your-domain.vercel.app/api/oauth/google/callback`
   - Copy the **Client ID** and **Client Secret**.

### 11. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in the values:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
SOCIAL_API_MOCK_MODE=false
NEXT_PUBLIC_SOCIAL_API_MOCK_MODE=false

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

TOKEN_ENCRYPTION_KEY=your-32-byte-hex-or-passphrase-here

META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret
META_REDIRECT_URI=http://localhost:3000/api/oauth/meta/callback

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback

CRON_SECRET=your-cron-secret
```

### 12. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Development Mock Mode

If you don't yet have Meta Developer approval or Google OAuth credentials, you can test everything using Mock Mode:

1. Set `SOCIAL_API_MOCK_MODE=true` and `NEXT_PUBLIC_SOCIAL_API_MOCK_MODE=true` in `.env.local`.
2. Launch the app (`npm run dev`).
3. Sign in using the **"Instant Demo / Sandbox Sign In"** button on `/login`.
4. Create a post:
   - Drag and drop a video (or sample MP4).
   - Enter a caption and select platforms.
   - Click **Post to Selected Platforms**.
5. Watch the publishing status update through:
   `Uploading -> Processing -> Published ✅`
6. You will see simulated post links for Instagram, Facebook, and YouTube.
7. **Test Retry Flow**: Include `#fail_youtube` in your caption to simulate a failed YouTube upload. You can then click **Retry** on the post details screen.

---

## Background Scheduling (Vercel Cron & Supabase)

### Option 1: Vercel Cron
Add a `vercel.json` file in the root directory:
```json
{
  "crons": [
    {
      "path": "/api/cron/publish",
      "schedule": "* * * * *"
    }
  ]
}
```
In Vercel Project Settings, set `CRON_SECRET`.

### Option 2: Supabase pg_cron (Database Level)
Run in Supabase SQL Editor:
```sql
SELECT cron.schedule(
  'postflow-publisher',
  '* * * * *',
  $$
  SELECT net.http_get(
    url := 'https://your-domain.vercel.app/api/cron/publish',
    headers := '{"Authorization": "Bearer your-cron-secret"}'::jsonb
  );
  $$
);
```

---

## Deployment to Vercel

1. Push this repository to GitHub or GitLab.
2. Import the project into [Vercel](https://vercel.com).
3. Under **Environment Variables**, add all keys from `.env.example`.
4. Deploy!
5. Update your Meta App and Google Cloud Console with the production OAuth redirect URIs:
   - `https://your-app.vercel.app/api/oauth/meta/callback`
   - `https://your-app.vercel.app/api/oauth/google/callback`

---

## Testing & Quality Checklist

| Area | Status | Verified |
| :--- | :--- | :--- |
| **Token Encryption** | AES-256-GCM authenticated cipher with random IV | `tests/encryption.test.mjs` |
| **Direct Upload** | Signed upload sessions straight to Supabase Storage | `/api/upload/sign` |
| **Meta OAuth** | Page access token & IG Business detection | `lib/oauth/meta.ts` |
| **YouTube OAuth** | Auto-refreshing tokens & Channel info | `lib/oauth/google.ts` |
| **Idempotency** | Prevents double-publishing already published targets | `lib/platforms/dispatcher.ts` |
| **Scheduler** | Atomic row locking `claim_scheduled_posts()` | `lib/scheduler/worker.ts` |
| **Post Status** | Aggregates draft, queued, publishing, partial, completed, failed | `tests/post-status.test.mjs` |
| **Timezone** | Converts local time to UTC and displays in user timezone | `tests/timezone.test.mjs` |
| **Next.js Build** | Zero TypeScript errors, all 23 routes built | `npm run build` |
