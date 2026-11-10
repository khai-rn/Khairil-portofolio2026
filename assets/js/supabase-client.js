/**
 * SUPABASE CLIENT & DATA ACCESS LAYER
 * Khairil Portfolio — Personal Journal & Blog System
 */

(function () {
  let supabaseInstance = null;

  function getClient() {
    if (supabaseInstance) return supabaseInstance;

    if (!window.supabase) {
      console.warn('[Journal] Supabase JS library not loaded yet.');
      return null;
    }

    const config = window.SUPABASE_CONFIG;
    if (!config || !config.isConfigured()) {
      return null;
    }

    try {
      supabaseInstance = window.supabase.createClient(config.getUrl(), config.getAnonKey(), {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      return supabaseInstance;
    } catch (err) {
      console.error('[Journal] Failed to initialize Supabase client:', err);
      return null;
    }
  }

  // Reload client if credentials changed
  function resetClient() {
    supabaseInstance = null;
    return getClient();
  }

  const JournalAPI = {
    getClient,
    resetClient,

    // ─── AUTHENTICATION ──────────────────────────────────────────────
    async signIn(email, password) {
      const client = getClient();
      if (!client) throw new Error('Supabase client belum dikonfigurasi.');
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },

    async signUp(email, password, fullName = 'M. Khairil Rahman') {
      const client = getClient();
      if (!client) throw new Error('Supabase client belum dikonfigurasi.');
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      });
      if (error) throw error;
      return data;
    },

    async signOut() {
      const client = getClient();
      if (!client) return;
      const { error } = await client.auth.signOut();
      if (error) throw error;
    },

    async getSession() {
      const client = getClient();
      if (!client) return null;
      const { data, error } = await client.auth.getSession();
      if (error || !data) return null;
      return data.session;
    },

    async getCurrentUser() {
      const client = getClient();
      if (!client) return null;
      const { data: { user }, error } = await client.auth.getUser();
      if (error || !user) return null;
      return user;
    },

    onAuthStateChange(callback) {
      const client = getClient();
      if (!client) return { unsubscribe: () => {} };
      const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
        callback(event, session);
      });
      return subscription;
    },

    // ─── PUBLIC JOURNAL ENTRIES ──────────────────────────────────────
    async getPublicEntries({ categorySlug = null, searchQuery = '', limit = 12, offset = 0, sort = 'desc' } = {}) {
      const client = getClient();
      if (!client) return { data: [], count: 0 };

      let query = client
        .from('entries')
        .select(`
          id, title, slug, excerpt, entry_type, visibility, status,
          cover_image, mood, reading_time_minutes, happened_at, published_at,
          category:categories(id, name, slug)
        `, { count: 'exact' })
        .eq('visibility', 'public')
        .eq('status', 'published')
        .lte('published_at', new Date().toISOString())
        .order('published_at', { ascending: sort === 'asc' })
        .range(offset, offset + limit - 1);

      if (categorySlug && categorySlug !== 'all') {
        const { data: cat } = await client.from('categories').select('id').eq('slug', categorySlug).single();
        if (cat) query = query.eq('category_id', cat.id);
      }

      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim();
        query = query.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`);
      }

      const { data, count, error } = await query;
      if (error) {
        console.error('[Journal] Error fetching public entries:', error);
        return { data: [], count: 0, error };
      }
      return { data, count };
    },

    async getEntryBySlug(slug) {
      const client = getClient();
      if (!client) return null;

      const { data, error } = await client
        .from('entries')
        .select(`
          *,
          category:categories(id, name, slug),
          media:media(*),
          tags:entry_tags(tag:tags(id, name, slug))
        `)
        .eq('slug', slug)
        .single();

      if (error) return null;
      return data;
    },

    async getUnlistedEntry(slug, token) {
      const client = getClient();
      if (!client) return null;

      // Call secure stored procedure for unlisted entries
      const { data, error } = await client.rpc('get_unlisted_entry', {
        target_slug: slug,
        token: token
      });

      if (error || !data || data.length === 0) return null;
      const entry = data[0];

      // Fetch category and media
      if (entry.category_id) {
        const { data: cat } = await client.from('categories').select('*').eq('id', entry.category_id).single();
        entry.category = cat;
      }
      const { data: media } = await client.from('media').select('*').eq('entry_id', entry.id).order('sort_order');
      entry.media = media || [];

      return entry;
    },

    /**
     * Personal Journal Calendar: Fetch entries for a given year & month
     * Handles public vs author queries, RLS, and date formatting
     */
    async getCalendarEntries({ year, month, contentType = 'all', isAuthor = false } = {}) {
      const client = getClient();
      if (!client) return [];

      // Format date range: YYYY-MM-01 to YYYY-MM-LastDay
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const daysInMonth = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

      let query = client
        .from('entries')
        .select(`
          id, title, slug, excerpt, entry_type, visibility, status,
          cover_image, mood, reading_time_minutes, happened_at, published_at,
          category:categories(id, name, slug),
          media:media(id)
        `)
        .gte('happened_at', startDate)
        .lte('happened_at', endDate)
        .order('happened_at', { ascending: true });

      if (!isAuthor) {
        // Public visitors only see public & published entries
        query = query.eq('visibility', 'public').eq('status', 'published');
      }

      if (contentType && contentType !== 'all') {
        query = query.eq('entry_type', contentType);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('[Journal Calendar] Fetch error:', error);
        return [];
      }

      return (data || []).map(entry => ({
        ...entry,
        photo_count: entry.media ? entry.media.length : 0
      }));
    },

    // ─── ADMIN JOURNAL MANAGEMENT ────────────────────────────────────
    async getAdminEntries({ status = null, visibility = null, categoryId = null, searchQuery = '', limit = 20, offset = 0 } = {}) {
      const client = getClient();
      if (!client) throw new Error('Supabase client not initialized');

      let query = client
        .from('entries')
        .select(`
          id, title, slug, excerpt, entry_type, visibility, status,
          cover_image, mood, unlisted_token, reading_time_minutes, happened_at,
          published_at, created_at, updated_at,
          category:categories(id, name, slug)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status && status !== 'all') query = query.eq('status', status);
      if (visibility && visibility !== 'all') query = query.eq('visibility', visibility);
      if (categoryId && categoryId !== 'all') query = query.eq('category_id', categoryId);
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim();
        query = query.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`);
      }

      const { data, count, error } = await query;
      if (error) throw error;
      return { data, count };
    },

    async getAdminEntryById(id) {
      const client = getClient();
      if (!client) throw new Error('Supabase client not initialized');

      const { data, error } = await client
        .from('entries')
        .select(`
          *,
          category:categories(id, name, slug),
          media:media(*),
          tags:entry_tags(tag:tags(id, name, slug))
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },

    async getStats() {
      const client = getClient();
      if (!client) return { total: 0, published: 0, draft: 0, private: 0, unlisted: 0 };

      const [totalRes, pubRes, draftRes, privRes, unlistRes] = await Promise.all([
        client.from('entries').select('id', { count: 'exact', head: true }),
        client.from('entries').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        client.from('entries').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
        client.from('entries').select('id', { count: 'exact', head: true }).eq('visibility', 'private'),
        client.from('entries').select('id', { count: 'exact', head: true }).eq('visibility', 'unlisted')
      ]);

      return {
        total: totalRes.count || 0,
        published: pubRes.count || 0,
        draft: draftRes.count || 0,
        private: privRes.count || 0,
        unlisted: unlistRes.count || 0
      };
    },

    async saveEntry(entryData, mediaItems = []) {
      const client = getClient();
      if (!client) throw new Error('Supabase client not initialized');

      const user = await this.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const payload = {
        title: entryData.title,
        slug: entryData.slug,
        excerpt: entryData.excerpt || '',
        content: entryData.content || {},
        content_html: entryData.content_html || '',
        entry_type: entryData.entry_type || 'daily_journal',
        category_id: entryData.category_id || null,
        visibility: entryData.visibility || 'public',
        status: entryData.status || 'published',
        cover_image: entryData.cover_image || null,
        mood: entryData.mood || null,
        reading_time_minutes: entryData.reading_time_minutes || 3,
        happened_at: entryData.happened_at || new Date().toISOString().split('T')[0],
        published_at: entryData.published_at || new Date().toISOString(),
        user_id: user.id
      };

      let savedEntry;
      if (entryData.id) {
        // Update existing entry
        const { data, error } = await client
          .from('entries')
          .update(payload)
          .eq('id', entryData.id)
          .select()
          .single();
        if (error) throw error;
        savedEntry = data;
      } else {
        // Insert new entry
        const { data, error } = await client
          .from('entries')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        savedEntry = data;
      }

      // Handle media items if provided
      if (mediaItems && mediaItems.length > 0) {
        // Remove existing media associations if updating
        if (entryData.id) {
          await client.from('media').delete().eq('entry_id', entryData.id);
        }
        const mediaPayload = mediaItems.map((m, idx) => ({
          entry_id: savedEntry.id,
          user_id: user.id,
          file_path: m.file_path,
          url: m.url,
          caption: m.caption || '',
          alt_text: m.alt_text || '',
          is_cover: !!m.is_cover,
          sort_order: idx
        }));
        await client.from('media').insert(mediaPayload);
      }

      return savedEntry;
    },

    async deleteEntry(id) {
      const client = getClient();
      if (!client) throw new Error('Supabase client not initialized');

      // 1. Fetch associated media to safely delete files from cloud storage
      try {
        const { data: mediaItems } = await client
          .from('media')
          .select('id, file_path, bucket_id, thumbnail_url')
          .eq('entry_id', id);

        if (mediaItems && mediaItems.length > 0) {
          for (const item of mediaItems) {
            const bucket = item.bucket_id || 'public-blog-images';
            const filesToRemove = [item.file_path];
            if (item.thumbnail_url && item.thumbnail_url.includes(bucket)) {
              // Extract thumbnail file path
              const thumbPath = item.file_path.replace('.webp', '_thumb.webp');
              filesToRemove.push(thumbPath);
            }
            await client.storage.from(bucket).remove(filesToRemove);
          }
        }
      } catch (mediaErr) {
        console.warn('[Journal] Warning: Failed to clean up media files during entry deletion:', mediaErr);
      }

      // 2. Cascade delete entry in PostgreSQL
      const { error } = await client.from('entries').delete().eq('id', id);
      if (error) throw error;
      return true;
    },

    // ─── CATEGORIES & TAGS ───────────────────────────────────────────
    async getCategories() {
      const client = getClient();
      if (!client) {
        return [
          { name: 'Daily Life', slug: 'daily-life' },
          { name: 'Personal Thoughts', slug: 'personal-thoughts' },
          { name: 'Experiences', slug: 'experiences' },
          { name: 'Reflections', slug: 'reflections' },
          { name: 'Memories', slug: 'memories' },
          { name: 'Learning', slug: 'learning' },
          { name: 'Creative Ideas', slug: 'creative-ideas' }
        ];
      }
      const { data, error } = await client.from('categories').select('*').order('name');
      if (error || !data || data.length === 0) {
        return [
          { name: 'Daily Life', slug: 'daily-life' },
          { name: 'Personal Thoughts', slug: 'personal-thoughts' },
          { name: 'Experiences', slug: 'experiences' },
          { name: 'Reflections', slug: 'reflections' },
          { name: 'Memories', slug: 'memories' },
          { name: 'Learning', slug: 'learning' },
          { name: 'Creative Ideas', slug: 'creative-ideas' }
        ];
      }
      return data;
    },

    // ─── MEDIA STORAGE & MEDIA LIBRARY ─────────────────────────────
    /**
     * Uploads and optimizes a photo to Supabase Storage with Year/Month organization
     * and inserts the metadata record into public.media
     */
    async uploadPhoto({
      file,
      contentType = 'journal',
      isPrivate = false,
      caption = '',
      altText = '',
      entryId = null,
      isCover = false
    }) {
      const client = getClient();
      if (!client) throw new Error('Supabase client not initialized');

      const user = await this.getCurrentUser();
      if (!user) throw new Error('User must be logged in to upload');

      // 1. Client-Side Image Optimization (WebP compression & thumbnail)
      let uploadFile = file;
      let thumbFile = null;
      let width = 0;
      let height = 0;
      let fileSize = file.size;
      let mimeType = file.type || 'image/jpeg';

      if (window.ImageOptimizer) {
        try {
          const opt = await window.ImageOptimizer.processImage(file);
          uploadFile = opt.file;
          thumbFile = opt.thumbnailFile;
          width = opt.width;
          height = opt.height;
          fileSize = opt.optimizedSize;
          mimeType = opt.mimeType;
        } catch (optErr) {
          console.warn('[Journal Media] Client optimization skipped/failed, uploading original:', optErr);
        }
      }

      // 2. Storage Organization by Year, Month, Content Type
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const ext = uploadFile.name.split('.').pop() || 'webp';

      const bucket = isPrivate ? 'private-blog-images' : 'public-blog-images';
      const storagePrefix = isPrivate ? `${user.id}/${contentType}/${year}/${month}` : `${contentType}/${year}/${month}`;
      const mainStoragePath = `${storagePrefix}/${timestamp}_${randomStr}.${ext}`;
      const thumbStoragePath = `${storagePrefix}/${timestamp}_${randomStr}_thumb.${ext}`;

      // 3. Upload Main File
      const { error: uploadError } = await client.storage.from(bucket).upload(mainStoragePath, uploadFile, {
        cacheControl: '31536000', // 1 year cache
        upsert: false,
        contentType: mimeType
      });
      if (uploadError) throw uploadError;

      // 4. Upload Thumbnail (if available)
      let thumbUrl = null;
      if (thumbFile && !isPrivate) {
        try {
          const { error: thumbErr } = await client.storage.from(bucket).upload(thumbStoragePath, thumbFile, {
            cacheControl: '31536000',
            upsert: false,
            contentType: 'image/webp'
          });
          if (!thumbErr) {
            const { data: thumbData } = client.storage.from(bucket).getPublicUrl(thumbStoragePath);
            thumbUrl = thumbData ? thumbData.publicUrl : null;
          }
        } catch (tErr) {
          console.warn('[Journal Media] Failed uploading thumbnail:', tErr);
        }
      }

      // 5. Generate URLs
      let publicUrl = '';
      if (!isPrivate) {
        const { data: urlData } = client.storage.from(bucket).getPublicUrl(mainStoragePath);
        publicUrl = urlData.publicUrl;
      } else {
        // Generate initial signed URL (valid 1 hour)
        const { data: signData } = await client.storage.from(bucket).createSignedUrl(mainStoragePath, 3600);
        publicUrl = signData ? signData.signedUrl : '';
      }

      // 6. Record metadata in public.media
      const mediaPayload = {
        user_id: user.id,
        entry_id: entryId || null,
        file_path: mainStoragePath,
        url: publicUrl,
        thumbnail_url: thumbUrl || publicUrl,
        caption: caption || file.name.replace(/\.[^/.]+$/, ""),
        alt_text: altText || caption || '',
        bucket_id: bucket,
        content_type: contentType,
        file_size: fileSize,
        mime_type: mimeType,
        width: width,
        height: height,
        is_cover: !!isCover,
        is_private: !!isPrivate
      };

      const { data: mediaRecord, error: dbError } = await client
        .from('media')
        .insert(mediaPayload)
        .select(`*, entry:entries(id, title, slug)`)
        .single();

      if (dbError) {
        // Rollback storage file if db insertion fails
        await client.storage.from(bucket).remove([mainStoragePath]);
        throw dbError;
      }

      return mediaRecord;
    },

    // Backward compatibility alias
    async uploadImage(file, isPrivate = false) {
      return this.uploadPhoto({ file, isPrivate, contentType: 'journal' });
    },

    async getSignedUrl(filePath) {
      const client = getClient();
      if (!client) return null;
      const { data, error } = await client.storage
        .from('private-blog-images')
        .createSignedUrl(filePath, 3600);
      if (error || !data) return null;
      return data.signedUrl;
    },

    /**
     * Media Library: Fetch all uploaded photos with optional filters
     */
    async getMediaList({
      contentType = null,
      isPrivate = null,
      searchQuery = '',
      entryId = null,
      limit = 30,
      offset = 0
    } = {}) {
      const client = getClient();
      if (!client) throw new Error('Supabase client not initialized');

      let query = client
        .from('media')
        .select(`
          id, entry_id, user_id, file_path, url, thumbnail_url, caption, alt_text,
          bucket_id, content_type, file_size, mime_type, width, height, is_cover, is_private,
          created_at,
          entry:entries(id, title, slug, status, visibility)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (contentType && contentType !== 'all') {
        query = query.eq('content_type', contentType);
      }
      if (isPrivate !== null && isPrivate !== 'all') {
        query = query.eq('is_private', isPrivate === true || isPrivate === 'true');
      }
      if (entryId) {
        query = query.eq('entry_id', entryId);
      }
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim();
        query = query.or(`caption.ilike.%${q}%,alt_text.ilike.%${q}%,file_path.ilike.%${q}%`);
      }

      const { data, count, error } = await query;
      if (error) throw error;
      return { data, count };
    },

    /**
     * Media Library: Update metadata (caption, alt text)
     */
    async updateMediaMetadata(id, updates) {
      const client = getClient();
      if (!client) throw new Error('Supabase client not initialized');

      const payload = {};
      if (updates.caption !== undefined) payload.caption = updates.caption;
      if (updates.alt_text !== undefined) payload.alt_text = updates.alt_text;
      if (updates.entry_id !== undefined) payload.entry_id = updates.entry_id;

      const { data, error } = await client
        .from('media')
        .update(payload)
        .eq('id', id)
        .select(`*, entry:entries(id, title, slug)`)
        .single();

      if (error) throw error;
      return data;
    },

    /**
     * Media Library: Safely delete image from Supabase Storage and database
     */
    async deleteMedia(id) {
      const client = getClient();
      if (!client) throw new Error('Supabase client not initialized');

      // 1. Get media record to obtain file paths
      const { data: media, error: fetchErr } = await client
        .from('media')
        .select('id, file_path, thumbnail_url, bucket_id')
        .eq('id', id)
        .single();

      if (fetchErr || !media) {
        throw new Error('Foto tidak ditemukan atau sudah terhapus.');
      }

      const bucket = media.bucket_id || 'public-blog-images';
      const pathsToRemove = [media.file_path];

      if (media.file_path.endsWith('.webp')) {
        const thumbPath = media.file_path.replace('.webp', '_thumb.webp');
        pathsToRemove.push(thumbPath);
      }

      // 2. Remove files from storage
      try {
        await client.storage.from(bucket).remove(pathsToRemove);
      } catch (storageErr) {
        console.warn('[Journal Media] Failed removing file from storage:', storageErr);
      }

      // 3. Delete database record
      const { error: dbErr } = await client.from('media').delete().eq('id', id);
      if (dbErr) throw dbErr;

      return true;
    }
  };

  window.JournalAPI = JournalAPI;
})();

