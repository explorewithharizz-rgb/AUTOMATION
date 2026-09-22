-- PostFlow Storage Bucket Configuration
-- Bucket: social-videos (private)

-- 1. Create the private bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'social-videos',
    'social-videos',
    FALSE,
    524288000, -- 500MB limit per video
    ARRAY['video/mp4', 'video/quicktime', 'video/x-m4v', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
    public = FALSE,
    file_size_limit = 524288000,
    allowed_mime_types = ARRAY['video/mp4', 'video/quicktime', 'video/x-m4v', 'video/webm'];

-- 2. Storage RLS Policies
-- Allow authenticated users to upload only to their own directory (userId/postId/video.mp4)
CREATE POLICY "Users can upload video to own folder"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'social-videos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow authenticated users to view/download their own uploaded videos
CREATE POLICY "Users can view own videos"
    ON storage.objects FOR SELECT TO authenticated
    USING (
        bucket_id = 'social-videos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow authenticated users to delete their own uploaded videos
CREATE POLICY "Users can delete own videos"
    ON storage.objects FOR DELETE TO authenticated
    USING (
        bucket_id = 'social-videos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );
