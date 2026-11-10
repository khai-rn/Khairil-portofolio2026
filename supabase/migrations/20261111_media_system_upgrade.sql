-- ==============================================================================
-- MEDIA SYSTEM UPGRADE MIGRATION
-- Enhances the media table with metadata, responsive info, and independent gallery support
-- ==============================================================================

-- 1. Add extra metadata columns to public.media if they don't already exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'media' AND column_name = 'bucket_id') THEN
        ALTER TABLE public.media ADD COLUMN bucket_id TEXT NOT NULL DEFAULT 'public-blog-images';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'media' AND column_name = 'content_type') THEN
        ALTER TABLE public.media ADD COLUMN content_type TEXT NOT NULL DEFAULT 'journal';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'media' AND column_name = 'file_size') THEN
        ALTER TABLE public.media ADD COLUMN file_size INT DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'media' AND column_name = 'mime_type') THEN
        ALTER TABLE public.media ADD COLUMN mime_type TEXT DEFAULT 'image/webp';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'media' AND column_name = 'width') THEN
        ALTER TABLE public.media ADD COLUMN width INT DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'media' AND column_name = 'height') THEN
        ALTER TABLE public.media ADD COLUMN height INT DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'media' AND column_name = 'thumbnail_url') THEN
        ALTER TABLE public.media ADD COLUMN thumbnail_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'media' AND column_name = 'is_private') THEN
        ALTER TABLE public.media ADD COLUMN is_private BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. Indexes for fast media browsing and search
CREATE INDEX IF NOT EXISTS idx_media_user_id ON public.media(user_id);
CREATE INDEX IF NOT EXISTS idx_media_content_type ON public.media(content_type);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON public.media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_is_private ON public.media(is_private);

-- 3. RLS Policies for Media:
-- Public can view media if it's public (not private) AND (it is either an independent gallery photo OR attached to a public published entry)
DROP POLICY IF EXISTS "Public entry media is viewable by anyone" ON public.media;
CREATE POLICY "Public media is viewable by anyone"
ON public.media FOR SELECT
USING (
    is_private = FALSE AND (
        entry_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM public.entries 
            WHERE entries.id = media.entry_id 
            AND entries.visibility = 'public' 
            AND entries.status = 'published'
        )
    )
);

-- Authenticated author can manage all their own media
DROP POLICY IF EXISTS "Authenticated authors can manage their media" ON public.media;
CREATE POLICY "Authenticated authors can manage their media" 
ON public.media FOR ALL TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

