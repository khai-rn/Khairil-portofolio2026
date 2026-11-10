-- ==============================================================================
-- ADD VIEW COUNT TO ENTRIES TABLE
-- ==============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'entries' AND column_name = 'view_count') THEN
        ALTER TABLE public.entries ADD COLUMN view_count INT NOT NULL DEFAULT 1;
    END IF;
END $$;

-- Increment view count function (callable by public anon)
CREATE OR REPLACE FUNCTION public.increment_entry_views(target_slug TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.entries
    SET view_count = view_count + 1
    WHERE slug = target_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
