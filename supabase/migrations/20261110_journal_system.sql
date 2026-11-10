-- ==============================================================================
-- JOURNAL & BLOG SYSTEM MIGRATION FOR KHAIRIL PORTFOLIO
-- "A Journal of Becoming" — Documenting life, one day at a time.
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT 'M. Khairil Rahman',
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Create Tags Table
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Create Entries Table
CREATE TABLE IF NOT EXISTS public.entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    content_html TEXT NOT NULL DEFAULT '',
    entry_type TEXT NOT NULL DEFAULT 'daily_journal' 
        CHECK (entry_type IN ('daily_journal', 'personal_thoughts', 'daily_activities', 'reflections', 'experiences', 'learning_notes', 'memories')),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    visibility TEXT NOT NULL DEFAULT 'public' 
        CHECK (visibility IN ('public', 'unlisted', 'private')),
    status TEXT NOT NULL DEFAULT 'published' 
        CHECK (status IN ('draft', 'published')),
    cover_image TEXT,
    mood TEXT,
    unlisted_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    reading_time_minutes INT DEFAULT 3,
    happened_at DATE DEFAULT CURRENT_DATE,
    published_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Create Entry Tags Join Table
CREATE TABLE IF NOT EXISTS public.entry_tags (
    entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (entry_id, tag_id)
);

-- 7. Create Media Table (Gallery & Inline Photos)
CREATE TABLE IF NOT EXISTS public.media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID REFERENCES public.entries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    url TEXT NOT NULL,
    caption TEXT,
    alt_text TEXT,
    is_cover BOOLEAN DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_entries_slug ON public.entries(slug);
CREATE INDEX IF NOT EXISTS idx_entries_visibility_status ON public.entries(visibility, status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_entries_category ON public.entries(category_id);
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON public.entries(user_id);
CREATE INDEX IF NOT EXISTS idx_media_entry_id ON public.media(entry_id);

-- ==============================================================================
-- TRIGGER FOR AUTOMATIC UPDATED_AT
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_entries_updated_at ON public.entries;
CREATE TRIGGER trigger_entries_updated_at
    BEFORE UPDATE ON public.entries
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'M. Khairil Rahman'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- Categories & Tags: Anyone can read, only authenticated author can modify
CREATE POLICY "Categories are viewable by everyone" 
    ON public.categories FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage categories" 
    ON public.categories FOR ALL TO authenticated USING (true);

CREATE POLICY "Tags are viewable by everyone" 
    ON public.tags FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage tags" 
    ON public.tags FOR ALL TO authenticated USING (true);

-- Profiles: Anyone can view profile, only owner can update
CREATE POLICY "Profiles are viewable by everyone" 
    ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Entries:
-- 1. Public published entries can be read by anyone
CREATE POLICY "Public published entries are viewable by anyone" 
    ON public.entries FOR SELECT 
    USING (visibility = 'public' AND status = 'published' AND published_at <= timezone('utc'::text, now()));

-- 2. Authenticated user can read, create, update, delete ALL their own entries (public, unlisted, or private, draft or published)
CREATE POLICY "Authors have full access to their own entries" 
    ON public.entries FOR ALL TO authenticated 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Entry Tags:
CREATE POLICY "Public entry tags are viewable by anyone" 
    ON public.entry_tags FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.entries 
            WHERE entries.id = entry_tags.entry_id 
            AND entries.visibility = 'public' 
            AND entries.status = 'published'
        )
    );
CREATE POLICY "Authenticated authors can manage entry tags" 
    ON public.entry_tags FOR ALL TO authenticated 
    USING (true);

-- Media:
CREATE POLICY "Public entry media is viewable by anyone" 
    ON public.media FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.entries 
            WHERE entries.id = media.entry_id 
            AND entries.visibility = 'public' 
            AND entries.status = 'published'
        )
    );
CREATE POLICY "Authenticated authors can manage their media" 
    ON public.media FOR ALL TO authenticated 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- SECURE FUNCTION TO RETRIEVE UNLISTED ENTRIES BY UNGUESSABLE TOKEN
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_unlisted_entry(target_slug TEXT, token TEXT)
RETURNS SETOF public.entries
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.entries
    WHERE slug = target_slug
      AND unlisted_token = token
      AND visibility = 'unlisted'
      AND status = 'published';
END;
$$;

-- ==============================================================================
-- SEED DEFAULT CATEGORIES
-- ==============================================================================
INSERT INTO public.categories (name, slug, description) VALUES
    ('Daily Life', 'daily-life', 'Everyday experiences, routine, and living moments.'),
    ('Personal Thoughts', 'personal-thoughts', 'Deep reflections, philosophy, and internal monologue.'),
    ('Experiences', 'experiences', 'Trips, events, projects, and personal encounters.'),
    ('Reflections', 'reflections', 'Life lessons, introspection, and personal evolution.'),
    ('Memories', 'memories', 'Moments, photographs, and tokens of times gone by.'),
    ('Learning', 'learning', 'New skills, books, AI experiments, and technical notes.'),
    ('Creative Ideas', 'creative-ideas', 'Design concepts, brainstorms, and artistic discoveries.')
ON CONFLICT (slug) DO NOTHING;

