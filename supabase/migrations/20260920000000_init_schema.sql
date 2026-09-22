-- PostFlow Database Schema Migration
-- 20260920000000_init_schema.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. PROFILES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    display_name TEXT,
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==============================================================================
-- 2. SOCIAL ACCOUNTS TABLE
-- Stores OAuth connection details for Meta (Instagram + FB) and YouTube
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.social_accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('meta', 'youtube')),
    account_name TEXT,
    account_id TEXT,
    facebook_page_id TEXT,
    instagram_account_id TEXT,
    youtube_channel_id TEXT,
    encrypted_access_token TEXT NOT NULL,
    encrypted_refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    connected_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT unique_user_provider UNIQUE (user_id, provider)
);

-- ==============================================================================
-- 3. POSTS TABLE
-- Master record for every video post created by a user
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.posts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    caption TEXT NOT NULL,
    youtube_title TEXT,
    video_storage_path TEXT NOT NULL,
    video_filename TEXT NOT NULL,
    video_size BIGINT NOT NULL,
    video_duration NUMERIC,
    video_width INT,
    video_height INT,
    post_mode TEXT NOT NULL CHECK (post_mode IN ('now', 'scheduled')),
    scheduled_at TIMESTAMPTZ,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    status TEXT NOT NULL CHECK (status IN ('draft', 'queued', 'publishing', 'completed', 'partial', 'failed')) DEFAULT 'queued',
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==============================================================================
-- 4. POST TARGETS TABLE
-- Status and tracking per platform (Instagram, Facebook, YouTube)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.post_targets (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'youtube')),
    status TEXT NOT NULL CHECK (status IN ('queued', 'uploading', 'processing', 'published', 'failed')) DEFAULT 'queued',
    platform_post_id TEXT,
    platform_url TEXT,
    error_code TEXT,
    error_message TEXT,
    attempt_count INT NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT unique_post_platform UNIQUE (post_id, platform)
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status_scheduled ON public.posts(status, scheduled_at) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS idx_post_targets_post_id ON public.post_targets(post_id);
CREATE INDEX IF NOT EXISTS idx_post_targets_user_id ON public.post_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_post_targets_status ON public.post_targets(status);
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_provider ON public.social_accounts(user_id, provider);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_targets ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can select and update their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Social Accounts: Users can select non-sensitive details of their accounts
-- (Tokens should only be selected server-side using service_role, but for client UI we permit viewing their own account)
CREATE POLICY "Users can view own social accounts"
    ON public.social_accounts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own social accounts"
    ON public.social_accounts FOR DELETE
    USING (auth.uid() = user_id);

-- Posts: Full CRUD on user's own posts
CREATE POLICY "Users can view own posts"
    ON public.posts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own posts"
    ON public.posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
    ON public.posts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
    ON public.posts FOR DELETE
    USING (auth.uid() = user_id);

-- Post Targets: Read and update own post targets
CREATE POLICY "Users can view own post targets"
    ON public.post_targets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own post targets"
    ON public.post_targets FOR UPDATE
    USING (auth.uid() = user_id);

-- ==============================================================================
-- SCHEDULER ATOMIC CLAIM FUNCTION
-- Claims queued scheduled posts whose scheduled_at <= NOW() in an atomic transaction
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.claim_scheduled_posts(batch_size INT DEFAULT 10)
RETURNS SETOF public.posts AS $$
BEGIN
    RETURN QUERY
    WITH candidate_posts AS (
        SELECT id
        FROM public.posts
        WHERE status = 'queued'
          AND post_mode = 'scheduled'
          AND scheduled_at <= TIMEZONE('utc'::text, NOW())
        ORDER BY scheduled_at ASC
        LIMIT batch_size
        FOR UPDATE SKIP LOCKED
    )
    UPDATE public.posts
    SET status = 'publishing',
        updated_at = TIMEZONE('utc'::text, NOW())
    FROM candidate_posts
    WHERE public.posts.id = candidate_posts.id
    RETURNING public.posts.*;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
