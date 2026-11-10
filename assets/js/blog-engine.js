/**
 * BLOG & JOURNAL ENGINE
 * Powers real-time search, category filtering, and dynamic entry rendering
 * for the #blog section in index.html, strictly preserving the existing visual layout.
 */

(function () {
  const DEFAULT_STATIC_ENTRIES = [
    {
      title: "Cara Membuat Logo yang Profesional dan Berdampak",
      excerpt: "Memahami fundamental desain logo, sistem grid, dan mengapa kesederhanaan adalah kunci identitas abadi.",
      cover_image: "assets/Project Image/logofolio.png",
      category: { name: "Desain Grafis", slug: "creative-ideas" },
      url: "blog-logo.html"
    },
    {
      title: "Membangun Identitas Visual (Branding) yang Kuat",
      excerpt: "Pentingnya konsistensi, psikologi warna, dan panduan merek untuk menciptakan persepsi positif audiens.",
      cover_image: "https://images.unsplash.com/photo-1542744094-3a31f272c490?q=80&w=1000",
      category: { name: "Branding", slug: "creative-ideas" },
      url: "blog-branding.html"
    },
    {
      title: "AI untuk Desainer: Ancaman atau Alat Bantu?",
      excerpt: "Mengeksplorasi cara memanfaatkan kecerdasan buatan sebagai asisten kreatif tanpa menghilangkan sentuhan manusiawi.",
      cover_image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000",
      category: { name: "AI & Teknologi", slug: "learning" },
      url: "blog-ai.html"
    },
    {
      title: "10 AI Tools yang Wajib Saya Gunakan Sebagai Graphic Designer di 2026",
      excerpt: "Bagaimana AI membantu menghemat waktu untuk pekerjaan berulang, mulai dari ChatGPT hingga Midjourney.",
      cover_image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000",
      category: { name: "AI Tools", slug: "learning" },
      url: "blog-10-ai-tools.html"
    },
    {
      title: "AI untuk Brainstorming Ide Desain: Menghasilkan Ide Cepat Tanpa Kehilangan Kreativitas",
      excerpt: "Bagaimana AI dapat menjadi partner diskusi dan memancing sudut pandang baru dalam memecahkan masalah visual.",
      cover_image: "assets/Project Image/ai_brainstorming_hero.png",
      category: { name: "Brainstorming", slug: "creative-ideas" },
      url: "blog-ai-brainstorming.html"
    }
  ];

  let currentCategory = 'all';
  let searchQuery = '';
  let searchTimeout = null;

  async function initBlogSection() {
    const blogSection = document.getElementById('blog');
    if (!blogSection) return;

    const blogGrid = blogSection.querySelector('.blog-grid');
    if (!blogGrid) return;

    // Check if controls bar already injected
    if (!document.getElementById('journal-controls')) {
      injectControlsBar(blogSection, blogGrid);
    }

    // Attempt to load live entries from Supabase
    await loadEntries(blogGrid);
  }

  function injectControlsBar(section, grid) {
    const controls = document.createElement('div');
    controls.id = 'journal-controls';
    controls.className = 'reveal visible';
    controls.style.cssText = `
      max-width: 1200px;
      margin: 0 auto 32px auto;
      padding: 0 20px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    `;

    controls.innerHTML = `
      <div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; align-items: center;">
        <!-- Search Input -->
        <div style="position: relative; flex: 1; min-width: 260px; max-width: 420px;">
          <svg style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--text-muted); pointer-events: none;" 
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <input type="text" id="journalSearchInput" placeholder="Cari tulisan atau topik..." 
            style="width: 100%; padding: 10px 14px 10px 40px; border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--surface); color: var(--text); font-family: var(--font-sans); font-size: 0.9rem; outline: none; transition: border-color 0.2s;" />
        </div>

        <!-- Admin Shortcut & RSS / Total Counter -->
        <div style="display: flex; gap: 10px; align-items: center;">
          <span id="journalCountBadge" style="font-size: 0.82rem; color: var(--text-muted); font-weight: 500;">
            5 Tulisan
          </span>
          <a href="journal.html" 
             style="display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 999px; background: rgba(255,255,255,0.06); border: 1px solid var(--border); color: var(--text); font-size: 0.78rem; font-weight: 600; text-decoration: none; transition: background 0.2s;">
            Buka Arsip Jurnal →
          </a>
        </div>
      </div>

      <!-- Category Filter Pills -->
      <div id="journalCategoryPills" style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: none;">
        <button class="journal-cat-pill active" data-cat="all">Semua</button>
        <button class="journal-cat-pill" data-cat="daily-life">Daily Life</button>
        <button class="journal-cat-pill" data-cat="personal-thoughts">Personal Thoughts</button>
        <button class="journal-cat-pill" data-cat="experiences">Experiences</button>
        <button class="journal-cat-pill" data-cat="reflections">Reflections</button>
        <button class="journal-cat-pill" data-cat="memories">Memories</button>
        <button class="journal-cat-pill" data-cat="learning">Learning</button>
        <button class="journal-cat-pill" data-cat="creative-ideas">Creative Ideas</button>
      </div>
    `;

    // Add inline styling for category pills
    const style = document.createElement('style');
    style.textContent = `
      .journal-cat-pill {
        padding: 6px 14px;
        border-radius: 999px;
        background: var(--surface);
        border: 1px solid var(--border);
        color: var(--text-muted);
        font-size: 0.82rem;
        font-weight: 500;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s ease;
        font-family: var(--font-sans);
      }
      .journal-cat-pill:hover {
        color: var(--text);
        border-color: var(--glass-border);
      }
      .journal-cat-pill.active {
        background: var(--text);
        color: var(--bg);
        border-color: var(--text);
      }
      body.dark .journal-cat-pill.active {
        background: #ffffff;
        color: #0a0a0c;
        border-color: #ffffff;
      }
    `;
    document.head.appendChild(style);

    section.insertBefore(controls, grid);

    // Event Listeners
    const searchInput = controls.querySelector('#journalSearchInput');
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchQuery = e.target.value.trim().toLowerCase();
        loadEntries(grid);
      }, 300);
    });

    const pills = controls.querySelectorAll('.journal-cat-pill');
    pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        pills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        currentCategory = pill.getAttribute('data-cat');
        loadEntries(grid);
      });
    });
  }

  async function loadEntries(grid) {
    let entries = [];
    const isSupabaseReady = window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured() && window.JournalAPI;

    if (isSupabaseReady) {
      try {
        const { data } = await window.JournalAPI.getPublicEntries({
          categorySlug: currentCategory,
          searchQuery: searchQuery,
          limit: 30
        });
        if (data && data.length > 0) {
          entries = data.map((d) => ({
            title: d.title,
            excerpt: d.excerpt,
            cover_image: d.cover_image || 'https://images.unsplash.com/photo-1542744094-3a31f272c490?q=80&w=1000',
            category: d.category || { name: 'Journal', slug: 'reflections' },
            url: `blog-post.html?slug=${encodeURIComponent(d.slug)}`,
            date: d.published_at ? new Date(d.published_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) : ''
          }));
        }
      } catch (err) {
        console.warn('[Journal] Failed to fetch dynamic entries, falling back to static posts:', err);
      }
    }

    // If no dynamic entries found, fallback to static entries filtered client-side
    if (entries.length === 0) {
      entries = DEFAULT_STATIC_ENTRIES.filter((item) => {
        const matchCategory = currentCategory === 'all' || item.category.slug === currentCategory;
        const matchSearch =
          !searchQuery ||
          item.title.toLowerCase().includes(searchQuery) ||
          item.excerpt.toLowerCase().includes(searchQuery);
        return matchCategory && matchSearch;
      });
    }

    // Update Counter badge
    const badge = document.getElementById('journalCountBadge');
    if (badge) {
      badge.textContent = `${entries.length} Tulisan`;
    }

    // Render HTML inside existing .blog-grid
    if (entries.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
          <p style="font-size: 1.1rem; margin-bottom: 8px;">Tidak ada tulisan yang cocok dengan filter ini.</p>
          <span style="font-size: 0.85rem;">Coba pilih kategori lain atau reset pencarian.</span>
        </div>
      `;
      return;
    }

    grid.innerHTML = entries
      .map(
        (item) => `
        <a href="${item.url}" class="blog-card">
          <img src="${item.cover_image}" alt="${escapeHtml(item.title)}" class="blog-img" loading="lazy" />
          <div class="blog-content">
            <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: var(--blue); margin-bottom: 8px; display: block;">
              ${escapeHtml(item.category.name)}
            </span>
            <h3 class="blog-title">${escapeHtml(item.title)}</h3>
            <p class="blog-desc">${escapeHtml(item.excerpt)}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
              <span class="blog-link">Baca Artikel</span>
              ${item.date ? `<span style="font-size: 0.78rem; color: var(--text-muted);">${item.date}</span>` : ''}
            </div>
          </div>
        </a>
      `
      )
      .join('');
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Self initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBlogSection);
  } else {
    initBlogSection();
  }
})();

