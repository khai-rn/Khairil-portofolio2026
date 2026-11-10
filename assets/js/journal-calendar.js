/**
 * PERSONAL JOURNAL CALENDAR
 * "A Journal of Becoming" — Documenting life, one day at a time.
 *
 * Interactive monthly calendar with date indicators, photo counts,
 * daily timeline feed, and admin quick-create integration.
 */

(function () {
  class JournalCalendar {
    constructor(containerId, options = {}) {
      this.container = document.getElementById(containerId);
      if (!this.container) return;

      this.isAuthor = !!options.isAuthor;
      this.onDateSelect = options.onDateSelect || null;

      // Current calendar view state
      const now = new Date();
      this.currentYear = now.getFullYear();
      this.currentMonth = now.getMonth() + 1; // 1-12
      this.selectedDateStr = this.formatDate(now);

      this.contentType = 'all';
      this.monthEntries = []; // Array of entries for visible month
      this.entriesByDate = {}; // Map: 'YYYY-MM-DD' => [entries]
      this.isLoading = false;

      this.MONTH_NAMES = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      this.DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      this.FULL_DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

      this.init();
    }

    formatDate(dateObj) {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    async init() {
      this.renderSkeleton();
      await this.fetchMonthData();
      this.render();
    }

    renderSkeleton() {
      this.container.innerHTML = `
        <div class="glass-card rounded-3xl p-6 md:p-8 max-w-5xl mx-auto border border-white/10">
          <div class="py-20 text-center text-slate-400">
            <div class="inline-block w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p class="text-xs">Menyiapkan kalender jurnal...</p>
          </div>
        </div>
      `;
    }

    async fetchMonthData() {
      this.isLoading = true;
      this.entriesByDate = {};

      if (window.JournalAPI && window.SUPABASE_CONFIG.isConfigured()) {
        try {
          const entries = await window.JournalAPI.getCalendarEntries({
            year: this.currentYear,
            month: this.currentMonth,
            contentType: this.contentType,
            isAuthor: this.isAuthor
          });

          this.monthEntries = entries || [];
          this.monthEntries.forEach(entry => {
            const dateKey = (entry.happened_at || '').split('T')[0];
            if (dateKey) {
              if (!this.entriesByDate[dateKey]) {
                this.entriesByDate[dateKey] = [];
              }
              this.entriesByDate[dateKey].push(entry);
            }
          });
        } catch (err) {
          console.warn('[JournalCalendar] Error fetching entries:', err);
          this.monthEntries = [];
        }
      } else {
        // Fallback demo/static entries for first visit
        this.monthEntries = [];
      }
      this.isLoading = false;
    }

    render() {
      const monthTitle = `${this.MONTH_NAMES[this.currentMonth - 1]} ${this.currentYear}`;
      const totalCount = this.monthEntries.length;

      this.container.innerHTML = `
        <div class="glass-card rounded-3xl p-6 md:p-8 max-w-6xl mx-auto border border-white/10 relative overflow-hidden">
          <!-- Calendar Header Controls -->
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-white/10">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm">
                📅
              </div>
              <div>
                <h3 class="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>${monthTitle}</span>
                  <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    ${totalCount} Entri
                  </span>
                </h3>
                <p class="text-xs text-slate-400">Jelajahi riwayat catatan harian berdasarkan tanggal.</p>
              </div>
            </div>

            <!-- Month Navigator Buttons -->
            <div class="flex items-center gap-2 self-start md:self-auto">
              <button id="calTodayBtn" type="button"
                class="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition-colors">
                Hari Ini
              </button>
              <div class="flex items-center bg-white/5 rounded-xl border border-white/10 p-0.5">
                <button id="calPrevBtn" type="button" title="Bulan Sebelumnya"
                  class="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                </button>
                <button id="calNextBtn" type="button" title="Bulan Selanjutnya"
                  class="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Main Layout: 2 Columns on Desktop (Calendar on Left, Selected Day Feed on Right) -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <!-- Left: Calendar Grid (7 cols on lg) -->
            <div class="lg:col-span-7 bg-white/[0.015] p-5 md:p-6 rounded-2xl border border-white/5">
              <!-- Days of week header -->
              <div class="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                ${this.DAY_NAMES.map(d => `<div class="py-2">${d}</div>`).join('')}
              </div>

              <!-- Days Grid -->
              <div class="grid grid-cols-7 gap-1.5" id="calDaysGrid">
                ${this.buildDaysHtml()}
              </div>

              <!-- Legend Footer -->
              <div class="mt-6 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
                <div class="flex items-center gap-3">
                  <span class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-cyan-400"></span> Ada Jurnal
                  </span>
                  <span class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-amber-400"></span> Ada Foto
                  </span>
                </div>
                <span>Klik tanggal untuk melihat</span>
              </div>
            </div>

            <!-- Right: Selected Day Timeline & Article Card (5 cols on lg) -->
            <div class="lg:col-span-5 bg-white/[0.015] p-5 md:p-6 rounded-2xl border border-white/5 min-h-[420px] flex flex-col" id="calDayFeed">
              ${this.buildDayFeedHtml()}
            </div>

          </div>
        </div>
      `;

      this.attachEventListeners();
    }

    buildDaysHtml() {
      const year = this.currentYear;
      const month = this.currentMonth; // 1-12

      // First day of month (0 = Sunday, 1 = Monday, ...)
      const firstDayIndex = new Date(year, month - 1, 1).getDay();
      const totalDays = new Date(year, month, 0).getDate();
      const prevMonthTotalDays = new Date(year, month - 1, 0).getDate();

      const todayStr = this.formatDate(new Date());
      let html = '';

      // 1. Previous month padding days
      for (let i = firstDayIndex - 1; i >= 0; i--) {
        const dayNum = prevMonthTotalDays - i;
        html += `
          <div class="aspect-square flex flex-col items-center justify-center p-1 rounded-xl text-xs text-slate-600 opacity-40 select-none">
            <span>${dayNum}</span>
          </div>
        `;
      }

      // 2. Current month days
      for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = dateStr === todayStr;
        const isSelected = dateStr === this.selectedDateStr;
        const entries = this.entriesByDate[dateStr] || [];
        const hasEntry = entries.length > 0;
        const hasPhotos = entries.some(e => e.photo_count > 0 || e.cover_image);

        let activeClasses = 'text-slate-200 hover:bg-white/10';
        if (isSelected) {
          activeClasses = 'bg-cyan-600 text-white font-bold shadow-lg shadow-cyan-600/30 ring-2 ring-cyan-400/50';
        } else if (isToday) {
          activeClasses = 'bg-white/5 text-cyan-300 font-bold border border-cyan-400/40';
        }

        html += `
          <button type="button" data-date="${dateStr}"
            class="cal-day-btn aspect-square flex flex-col items-center justify-center p-1 rounded-xl text-xs relative transition-all ${activeClasses}">
            <span class="${isSelected ? 'scale-110' : ''}">${day}</span>

            <!-- Indicators container -->
            <div class="flex items-center gap-0.5 mt-0.5 h-1.5">
              ${hasEntry ? `
                <span class="w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-cyan-400'}"></span>
              ` : ''}
              ${hasPhotos ? `
                <span class="w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-200' : 'bg-amber-400'}"></span>
              ` : ''}
            </div>
          </button>
        `;
      }

      // 3. Next month padding days to fill 35 or 42 cells
      const totalCellsRendered = firstDayIndex + totalDays;
      const nextMonthDays = (totalCellsRendered > 35 ? 42 : 35) - totalCellsRendered;
      for (let day = 1; day <= nextMonthDays; day++) {
        html += `
          <div class="aspect-square flex flex-col items-center justify-center p-1 rounded-xl text-xs text-slate-600 opacity-40 select-none">
            <span>${day}</span>
          </div>
        `;
      }

      return html;
    }

    buildDayFeedHtml() {
      const selectedEntries = this.entriesByDate[this.selectedDateStr] || [];
      const dateParts = this.selectedDateStr.split('-');
      const d = parseInt(dateParts[2]);
      const m = parseInt(dateParts[1]);
      const y = parseInt(dateParts[0]);

      const dateObj = new Date(y, m - 1, d);
      const dayName = this.FULL_DAY_NAMES[dateObj.getDay()];
      const monthName = this.MONTH_NAMES[m - 1];

      // Clean editorial date headline (inspired by the reference UI: "06 On Sunday In December 2018")
      let html = `
        <div class="flex items-start justify-between pb-4 border-b border-white/10 mb-5">
          <div class="flex items-baseline gap-3">
            <span class="text-4xl font-extrabold text-white tracking-tight">${String(d).padStart(2, '0')}</span>
            <div>
              <p class="text-xs font-semibold text-slate-300">${dayName}</p>
              <p class="text-[11px] text-slate-500 font-medium">${monthName} ${y}</p>
            </div>
          </div>

          ${this.isAuthor ? `
            <a href="editor.html?date=${this.selectedDateStr}"
              class="px-3 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/30 text-cyan-200 text-xs font-semibold flex items-center gap-1 transition-colors">
              <span>+ Tulis</span>
            </a>
          ` : ''}
        </div>
      `;

      if (selectedEntries.length === 0) {
        html += `
          <div class="flex-grow flex flex-col items-center justify-center py-10 text-center text-slate-400">
            <div class="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 mb-3 text-lg">
              📝
            </div>
            <p class="text-sm font-semibold text-slate-300">Tidak ada catatan jurnal</p>
            <p class="text-xs text-slate-500 mt-1 max-w-xs">
              Belum ada peristiwa atau refleksi yang didokumentasikan pada tanggal ini.
            </p>

            ${this.isAuthor ? `
              <a href="editor.html?date=${this.selectedDateStr}"
                class="mt-5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all">
                + Tulis Sesuatu di Tanggal Ini
              </a>
            ` : ''}
          </div>
        `;
      } else {
        html += `
          <div class="space-y-4 overflow-y-auto max-h-[460px] pr-1">
            ${selectedEntries.map(entry => {
              const detailUrl = this.isAuthor
                ? `editor.html?id=${entry.id}`
                : `blog-post.html?slug=${encodeURIComponent(entry.slug)}${entry.visibility === 'unlisted' && entry.unlisted_token ? `&token=${entry.unlisted_token}` : ''}`;

              return `
                <div class="glass-card rounded-2xl p-4 border border-white/10 hover:border-cyan-400/50 transition-all flex flex-col">
                  ${entry.cover_image ? `
                    <div class="w-full h-40 rounded-xl overflow-hidden mb-3 bg-black/40">
                      <img src="${entry.cover_image}" alt="${escapeHtml(entry.title)}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  ` : ''}

                  <div class="flex items-center gap-2 mb-1.5">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                      ${escapeHtml(entry.category ? entry.category.name : 'Journal')}
                    </span>
                    ${entry.mood ? `
                      <span class="text-[10px] text-purple-300 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                        ${escapeHtml(entry.mood)}
                      </span>
                    ` : ''}
                    ${entry.photo_count > 0 ? `
                      <span class="text-[10px] text-amber-300 ml-auto flex items-center gap-1">
                        📷 ${entry.photo_count} Foto
                      </span>
                    ` : ''}
                  </div>

                  <h4 class="text-base font-bold text-white mb-1.5 line-clamp-2">
                    ${escapeHtml(entry.title)}
                  </h4>

                  <p class="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed font-light">
                    ${escapeHtml(entry.excerpt || 'Klik untuk membaca selengkapnya...')}
                  </p>

                  <div class="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] mt-auto">
                    <span class="text-slate-500">${entry.reading_time_minutes || 3} menit baca</span>
                    <a href="${detailUrl}"
                      class="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1">
                      ${this.isAuthor ? 'Edit Jurnal ↗' : 'Baca Selengkapnya →'}
                    </a>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }

      return html;
    }

    attachEventListeners() {
      // Prev month
      document.getElementById('calPrevBtn')?.addEventListener('click', async () => {
        if (this.currentMonth === 1) {
          this.currentMonth = 12;
          this.currentYear--;
        } else {
          this.currentMonth--;
        }
        await this.fetchMonthData();
        this.render();
      });

      // Next month
      document.getElementById('calNextBtn')?.addEventListener('click', async () => {
        if (this.currentMonth === 12) {
          this.currentMonth = 1;
          this.currentYear++;
        } else {
          this.currentMonth++;
        }
        await this.fetchMonthData();
        this.render();
      });

      // Today
      document.getElementById('calTodayBtn')?.addEventListener('click', async () => {
        const now = new Date();
        this.currentYear = now.getFullYear();
        this.currentMonth = now.getMonth() + 1;
        this.selectedDateStr = this.formatDate(now);
        await this.fetchMonthData();
        this.render();
      });

      // Date click
      this.container.querySelectorAll('.cal-day-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.selectedDateStr = btn.getAttribute('data-date');
          this.render();
          if (this.onDateSelect) {
            this.onDateSelect(this.selectedDateStr, this.entriesByDate[this.selectedDateStr] || []);
          }
        });
      });
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  window.JournalCalendar = JournalCalendar;
})();

