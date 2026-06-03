# Deployment Guide: English Learning Website

This guide walks through preparing the app for production deployment on Vercel with Supabase Auth and PostgreSQL.

## Prerequisites

- GitHub account with repo pushed
- Supabase account (free tier)
- Google Cloud OAuth credentials
- Vercel account

## Phase 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose organization and region
4. Create a strong password and save it
5. Wait for project to initialize
6. Navigate to "Settings" → "API" to find:
   - **Project URL** (save as `NEXT_PUBLIC_SUPABASE_URL`)
   - **Anon/Publishable Key** (save as `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)

### 1.2 Create Database Schema

1. In Supabase dashboard, go to "SQL Editor"
2. Click "New Query"
3. Copy and paste the entire contents of `supabase/sql/001_word_progress.sql`
4. Run the query
5. Verify table created: go to "Table Editor" → should see `word_progress` table

### 1.3 Enable Google OAuth Provider

1. In Supabase, go to "Authentication" → "Providers"
2. Enable "Google"
3. You'll need Google OAuth credentials (see next phase)

## Phase 2: Google Cloud OAuth Setup

### 2.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project called "English Learning Website"
3. Wait for project to be created

### 2.2 Create OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in app name: "Thai English Starter"
4. Add your email for support
5. Add scopes: `openid`, `email`, `profile`
6. Add test users (your Google account)
7. Save and publish

### 2.3 Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Choose "Web application"
4. Add authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://your-vercel-domain.vercel.app`
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback`
   - `https://your-vercel-domain.vercel.app/auth/callback`
6. Create and save the credentials
7. Copy: **Client ID** and **Client Secret**

### 2.4 Configure Supabase Google Provider

1. Back in Supabase → "Authentication" → "Providers" → Google
2. Paste **Client ID** and **Client Secret** from Google Cloud
3. Click "Save"

## Phase 3: Local Development Testing

### 3.1 Set Environment Variables

Create `.env.local` in project root:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url-from-supabase
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key-from-supabase
```

### 3.2 Test Locally

```bash
npm run dev
```

1. Open `http://localhost:3000`
2. Click "เข้าสู่ระบบด้วย Google"
3. Confirm redirects to `/auth/callback`
4. Check login button shows your email
5. Go to /progress and verify sync status shows "✓ กำลังบันทึกไปยังบัญชี"
6. Practice and review - verify progress saves
7. Refresh page - verify progress persists
8. Logout and verify you can still practice locally

### 3.3 Verify Build and Lint

```bash
npm run lint
npm run build
```

Both should pass without errors.

## Phase 4: Prepare GitHub Repo

### 4.1 Commit Changes

```bash
git add .
git commit -m "Add Supabase Auth and cloud progress storage

- Install @supabase/supabase-js and @supabase/ssr
- Create Supabase client helpers (browser and server)
- Add Google OAuth login flow
- Create word_progress table with RLS policies
- Build progressRepository abstraction layer
- Update Practice, Review, Progress components to use cloud storage
- Add login/logout UI in navbar
- Support hybrid mode: localStorage for anonymous users, Supabase for auth users
- Add environment variables and .env.example

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"

git push origin main
```

### 4.2 Verify Environment Variables Won't Be Committed

Check `.gitignore`:

```bash
grep ".env" .gitignore
# Should output: .env*
```

This ensures `.env.local` is never committed.

## Phase 5: Vercel Deployment

### 5.1 Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework**: Next.js
   - **Root Directory**: ./
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = (value from Supabase)
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = (value from Supabase)
6. Click "Deploy"

### 5.2 Update OAuth Redirect URLs

After deployment, Vercel will give you a production URL (e.g., `https://my-app.vercel.app`).

**In Google Cloud Console:**
- Go to "Credentials" → Edit OAuth client
- Add production URL to "Authorized JavaScript Origins":
  - `https://my-app.vercel.app`
- Add to "Authorized Redirect URIs":
  - `https://my-app.vercel.app/auth/callback`
- Save

**In Supabase:**
- Go to "Authentication" → "URL Configuration"
- Under "Site URL", make sure it includes your production URL
- Under "Redirect URLs", verify:
  - `http://localhost:3000/auth/callback` (for local dev)
  - `https://my-app.vercel.app/auth/callback` (for production)

### 5.3 Re-deploy After OAuth Setup

After updating OAuth settings:

```bash
git add .
git commit -m "Update OAuth redirect URLs for production"
git push
```

Vercel will auto-redeploy. Wait for deployment to complete.

## Phase 6: Post-Deploy Verification

### 6.1 Test Production URL

1. Open your production URL: `https://my-app.vercel.app`
2. Test without login:
   - Click "Practice"
   - Practice a few words
   - Verify localStorage saves progress
   - Refresh - progress persists
3. Test with login:
   - Click "เข้าสู่ระบบด้วย Google"
   - Complete OAuth flow
   - Verify redirects to `/progress`
   - Check status shows "✓ กำลังบันทึกไปยังบัญชี"
   - Verify local progress synced to Supabase
4. Test persistence:
   - Go to Practice and complete questions
   - Refresh page - progress persists
   - Logout - check localStorage still has data
   - Login again - verify same progress
5. Test multi-device sync:
   - Open app in different browser/device
   - Login with same Google account
   - Verify progress is synchronized

### 6.2 Monitor Errors

- Check Vercel deployment logs for build errors
- Check browser console for client-side errors
- Check Supabase logs for database errors:
  - Supabase dashboard → "Logs" → check for error patterns

## Security Checklist

- [ ] No `SUPABASE_SERVICE_ROLE_KEY` in environment variables
- [ ] All secret keys use `NEXT_PUBLIC_` prefix only for publishable keys
- [ ] `.env.local` in `.gitignore`
- [ ] `.env.example` has only placeholders
- [ ] RLS policies enabled on `word_progress` table
- [ ] Google OAuth client secret never appears in frontend code
- [ ] Supabase anon key used only in frontend (read-only via RLS)
- [ ] OAuth redirect URLs match exactly (http vs https, trailing slash)
- [ ] No hardcoded URLs - use environment variables

## Troubleshooting

### OAuth Login Not Working

1. Check redirect URL matches exactly in all three places:
   - Google Cloud Console (authorized redirect URIs)
   - Supabase Auth Config (redirect URLs)
   - App callback route (`app/auth/callback/route.ts`)
2. Check Google Client ID/Secret are correct
3. Check Supabase has Google provider enabled
4. Check browser console for CORS errors

### Progress Not Syncing

1. Verify user is authenticated: check Supabase Auth users list
2. Check RLS policies: run query in Supabase SQL editor:
   ```sql
   select * from public.word_progress 
   where user_id = auth.uid();
   ```
3. Check network tab in browser - verify POST to Supabase succeeds
4. Check Supabase logs for permission errors

### Build Fails on Vercel

1. Check Vercel deployment logs
2. Run `npm run build` locally and fix any errors
3. Check all imports are correct
4. Verify `.env.local` is not committed (it shouldn't be)
5. Verify environment variables are set in Vercel project settings

## Rollback

If deployment has issues:

```bash
# Revert to previous commit
git revert <commit-sha>
git push

# Or use Vercel dashboard to rollback deployment
```

## Maintenance

### Regular Tasks

- Monitor Supabase usage (auth users, database storage)
- Review error logs weekly
- Update Supabase secrets if compromised
- Rotate Google OAuth credentials annually

### Monitoring Dashboards

- Vercel: https://vercel.com/dashboard
- Supabase: https://app.supabase.com
- Google Cloud: https://console.cloud.google.com

## Support

For issues:
- Supabase docs: https://supabase.com/docs
- Next.js docs: https://nextjs.org/docs
- Vercel docs: https://vercel.com/docs
