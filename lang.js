const translations = {
  id: {
    // Nav
    "nav.home": "Beranda",
    "nav.about": "Tentang",
    "nav.skills": "Keahlian",
    "nav.education": "Pendidikan",
    "nav.projects": "Proyek",
    "nav.blog": "Blog",
    "nav.contact": "Kontak",
    "nav.downloadcv": "Unduh CV",

    // Hero
    "hero.greeting": "HAI, SAYA KHAIRIL.",
    "hero.title": "MERANCANG PENGALAMAN DIGITAL",
    "hero.subtitle": "Saya seorang UI/UX Designer & Frontend Developer yang berbasis di Lombok Tengah, menciptakan antarmuka yang bersih dan pengalaman yang ramah pengguna.",

    // About
    "about.title": "01 — Tentang",
    "about.windowTitle": "My_Profile.png",
    "about.label.name": "Name",
    "about.label.born": "Born",
    "about.label.city": "City",
    "about.label.religion": "Religion",
    "about.label.language": "Language",
    "about.desc": "Graphic Designer yang berfokus pada pembuatan visual kreatif untuk media sosial, promosi digital, dan kebutuhan branding. Memiliki pengalaman mengelola berbagai proyek desain, editing visual, dokumentasi, hingga administrasi operasional yang mendukung aktivitas bisnis. Terbiasa bekerja secara kolaboratif, memahami tren desain digital, serta memanfaatkan AI tools untuk menghasilkan proses kerja yang lebih cepat, efisien, dan berkualitas tanpa mengurangi nilai kreativitas.",

    // Skills
    "skills.title": "02 — Keahlian",
    "skills.soft": "KETERAMPILAN NON-TEKNIS",
    "skills.hard": "KETERAMPILAN TEKNIS",

    // Education
    "edu.title": "03 — Pendidikan",

    // Experience
    "exp.title": "04 — Pengalaman",

    // Projects
    "proj.title": "05 — Proyek",
    "proj.view": "Lihat Proyek",
    "proj.button": "Lihat Karya Saya",

    // Blog
    "blog.title": "06 — Blog",
    "blog.desc": "Tulisan terbaru seputar desain, branding, dan teknologi.",
    "blog.read": "Baca Artikel",

    // Contact
    "contact.title": "07 — Kontak",
    "contact.heading": "Mari<br><em>Bekerja</em><br>Bersama.",
    "contact.sub": "Tersedia untuk proyek lepas, kolaborasi, dan pekerjaan penuh waktu.",
    "contact.send": "Kirim Pesan",
    "contact.name": "Nama Anda",
    "contact.email": "Email Anda",
    "contact.msg": "Pesan Anda"
  },
  en: {
    // Nav
    "nav.home": "Home",
    "nav.about": "About",
    "nav.skills": "Skills",
    "nav.education": "Education",
    "nav.projects": "Projects",
    "nav.blog": "Blog",
    "nav.contact": "Contact",
    "nav.downloadcv": "Download CV",

    // Hero
    "hero.greeting": "HI, I'M KHAIRIL.",
    "hero.title": "CRAFTING DIGITAL EXPERIENCES",
    "hero.subtitle": "I'm a UI/UX Designer & Frontend Developer based in Central Lombok, crafting clean interfaces and user-friendly experiences.",

    // About
    "about.title": "01 — About",
    "about.windowTitle": "My_Profile.png",
    "about.label.name": "Name",
    "about.label.born": "Born",
    "about.label.city": "City",
    "about.label.religion": "Religion",
    "about.label.language": "Language",
    "about.desc": "Graphic Designer focused on creating creative visuals for social media, digital promotions, and branding needs. Experienced in managing various design projects, visual editing, documentation, and operational administration that support business activities. Accustomed to working collaboratively, understanding digital design trends, and utilizing AI tools to produce faster, more efficient, and high-quality workflows without compromising creativity.",

    // Skills
    "skills.title": "02 — Skills",
    "skills.soft": "SOFT SKILLS",
    "skills.hard": "HARD SKILLS",

    // Education
    "edu.title": "03 — Education",

    // Experience
    "exp.title": "04 — Experience",

    // Projects
    "proj.title": "05 — Projects",
    "proj.view": "View Project",
    "proj.button": "View My Work",

    // Blog
    "blog.title": "06 — Blog",
    "blog.desc": "Latest writings on design, branding, and technology.",
    "blog.read": "Read Article",

    // Contact
    "contact.title": "07 — Contact",
    "contact.heading": "Let's<br><em>Work</em><br>Together.",
    "contact.sub": "Available for freelance projects, collaborations, and full-time.",
    "contact.send": "Send Message",
    "contact.name": "Your name",
    "contact.email": "Your email",
    "contact.msg": "Your message"
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const langToggle = document.getElementById('langToggle');
  if (!langToggle) return;
  
  let currentLang = localStorage.getItem('siteLang') || 'en';

  const updateLanguage = () => {
    langToggle.innerText = currentLang.toUpperCase();
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[currentLang] && translations[currentLang][key]) {
        // preserve the icon in readmore buttons etc
        const iconHTML = el.querySelector('svg') ? el.querySelector('svg').outerHTML : '';
        if (iconHTML) {
            el.innerHTML = translations[currentLang][key] + " " + iconHTML;
        } else {
            el.innerHTML = translations[currentLang][key];
        }
      }
    });
  };

  langToggle.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'id' : 'en';
    localStorage.setItem('siteLang', currentLang);
    updateLanguage();
  });

  // Initial load
  updateLanguage();
});
