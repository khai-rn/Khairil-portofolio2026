/* ===========================
   SCRIPT.JS — Portfolio Interactions
=========================== */

// ─── DARK MODE ────────────────────────────────
const darkToggle = document.getElementById('darkToggle');
const body = document.body;

// Persist preference
if (localStorage.getItem('darkMode') === 'false') {
  body.classList.remove('dark');
} else {
  body.classList.add('dark');
}

darkToggle.addEventListener('click', () => {
  body.classList.toggle('dark');
  localStorage.setItem('darkMode', body.classList.contains('dark'));
});

// ─── HAMBURGER MENU ───────────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

// Close menu on link click
navLinks.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
  });
});

// ─── ACTIVE NAV ON SCROLL ────────────────────
const sections = document.querySelectorAll('section[id]');
const navItems = document.querySelectorAll('.nav-link');

const observerNav = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navItems.forEach(link => link.classList.remove('active'));
      const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(section => observerNav.observe(section));

// ─── REVEAL ON SCROLL ─────────────────────────
const reveals = document.querySelectorAll('.reveal');

const observerReveal = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observerReveal.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

reveals.forEach(el => observerReveal.observe(el));

// ─── NAVBAR SCROLL STYLE ──────────────────────
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    navbar.style.borderBottomColor = 'var(--border)';
  } else {
    navbar.style.borderBottomColor = 'transparent';
  }
}, { passive: true });

// ─── CONTACT FORM ─────────────────────────────
const sendBtn = document.getElementById('sendBtn');

sendBtn.addEventListener('click', () => {
  const name = document.getElementById('formName').value.trim();
  const email = document.getElementById('formEmail').value.trim();
  const msg = document.getElementById('formMsg').value.trim();

  if (!name || !email || !msg) {
    showToast('Isi semua field dulu ya.', 'error');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast('Format email nggak valid.', 'error');
    return;
  }

  // Simulate send
  sendBtn.textContent = 'Sending...';
  sendBtn.disabled = true;

  setTimeout(() => {
    document.getElementById('formName').value = '';
    document.getElementById('formEmail').value = '';
    document.getElementById('formMsg').value = '';
    sendBtn.textContent = 'Send Message';
    sendBtn.disabled = false;
    showToast('Message sent! I\'ll hit you back soon.', 'success');
  }, 1200);
});

// ─── TOAST NOTIFICATION ───────────────────────
function showToast(message, type = 'success') {
  // Remove existing toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '32px',
    right: '32px',
    zIndex: '9999',
    padding: '14px 24px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: 'DM Sans, sans-serif',
    background: type === 'success' ? '#0071e3' : '#ff453a',
    color: '#fff',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    opacity: '0',
    transform: 'translateY(12px)',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    maxWidth: '280px',
    lineHeight: '1.4',
  });

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ─── FOLDER FLOAT ANIMATION ───────────────────
const folderWrapper = document.getElementById('folderWrapper');
if (folderWrapper) {
  let tick = 0;
  function floatFolder() {
    tick += 0.015;
    const y = Math.sin(tick) * 6;
    folderWrapper.style.transform = `translateY(${y}px)`;
    requestAnimationFrame(floatFolder);
  }
  floatFolder();
}

// ─── SMOOTH SCROLL POLYFILL FOR OLDER SAFARI ──
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ─── CAROUSEL LOGIC ───────────────────────────
const carousel = document.getElementById('galleryCarousel');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const dotsContainer = document.getElementById('carouselDots');

if (carousel && prevBtn && nextBtn && dotsContainer) {
  const items = Array.from(carousel.children);

  // Create dots
  items.forEach((_, idx) => {
    const dot = document.createElement('button');
    dot.className = `carousel-dot ${idx === 0 ? 'active' : ''}`;
    dot.setAttribute('aria-label', `Go to slide ${idx + 1}`);
    dot.addEventListener('click', () => {
      const scrollLeft = items[idx].offsetLeft - carousel.offsetLeft;
      carousel.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    });
    dotsContainer.appendChild(dot);
  });

  const dots = Array.from(dotsContainer.children);

  const updateControls = () => {
    const scrollPos = carousel.scrollLeft;
    const centerPos = scrollPos + carousel.offsetWidth / 2;

    let activeIdx = 0;
    let minDiff = Infinity;

    items.forEach((item, idx) => {
      const itemCenter = (item.offsetLeft - carousel.offsetLeft) + (item.offsetWidth / 2);
      const diff = Math.abs(centerPos - itemCenter);
      if (diff < minDiff) {
        minDiff = diff;
        activeIdx = idx;
      }
    });

    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === activeIdx);
    });

    const maxScroll = carousel.scrollWidth - carousel.clientWidth;
    prevBtn.disabled = scrollPos <= 5;
    nextBtn.disabled = scrollPos >= maxScroll - 5;
  };

  carousel.addEventListener('scroll', () => {
    requestAnimationFrame(updateControls);
  }, { passive: true });

  // Initialize state
  updateControls();
  window.addEventListener('resize', updateControls);

  // Arrow clicks
  prevBtn.addEventListener('click', () => {
    const itemWidth = items[0].offsetWidth + 20; // + gap
    carousel.scrollBy({ left: -itemWidth, behavior: 'smooth' });
  });

  nextBtn.addEventListener('click', () => {
    const itemWidth = items[0].offsetWidth + 20; // + gap
    carousel.scrollBy({ left: itemWidth, behavior: 'smooth' });
  });
}
