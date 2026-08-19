// --- Sticky Header Shrink on Scroll ---
const headerWrapper = document.querySelector('.header-wrapper');
if (headerWrapper) {
  const updateHeaderScrolled = () => {
    headerWrapper.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', updateHeaderScrolled, { passive: true });
  updateHeaderScrolled();
}

// --- Navigation Toggle ---
const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.mobile-nav-container .site-nav');
const dropdowns = document.querySelectorAll('.site-nav .dropdown');

if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close nav when a link is clicked (for mobile)
  siteNav.addEventListener('click', (e) => {
    // Check if a link inside the nav was clicked, but not a dropdown toggle
    if (e.target.tagName === 'A' && !e.target.parentElement.classList.contains('dropdown')) {
      siteNav.classList.remove('open');
      navToggle.classList.remove('open');
    }
  });

  // Toggle dropdowns on click for mobile
  dropdowns.forEach(dropdown => {
    const dropdownLink = dropdown.querySelector('.dropdown > a');
    dropdownLink.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) { // Only on mobile
        e.preventDefault(); // Prevent navigating to parent link
        dropdown.classList.toggle('open');
      }
    });
  });
}

// --- Hero Carousel ---
const slides = Array.from(document.querySelectorAll('.carousel-slide'));
const dotsContainer = document.querySelector('.carousel-dots');
const prevBtn = document.querySelector('.carousel-control.prev');
const nextBtn = document.querySelector('.carousel-control.next');
let currentSlide = 0;
let autoplayTimer;

if (slides.length && dotsContainer) {
  // Create dots
  slides.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
    dot.addEventListener('click', () => showSlide(index));
    dotsContainer.appendChild(dot);
  });

  const dots = Array.from(dotsContainer.children);

  function updateDots() {
    dots.forEach((dot, idx) => dot.classList.toggle('active', idx === currentSlide));
  }

  function showSlide(index) {
    currentSlide = (index + slides.length) % slides.length;
    slides.forEach((slide, idx) => slide.classList.toggle('active', idx === currentSlide));
    updateDots();
  }

  function nextSlide() { showSlide(currentSlide + 1); }
  function startAutoplay() {
    clearInterval(autoplayTimer);
    autoplayTimer = setInterval(nextSlide, 6000); // Change slide every 6 seconds
  }

  const carousel = document.querySelector('.hero-carousel');
  if (carousel) {
    carousel.setAttribute('aria-live', 'polite');
    carousel.addEventListener('mouseenter', () => clearInterval(autoplayTimer));
    carousel.addEventListener('mouseleave', startAutoplay);
    carousel.addEventListener('focusin', () => clearInterval(autoplayTimer));
    carousel.addEventListener('focusout', startAutoplay);
  }

  prevBtn?.addEventListener('click', () => { showSlide(currentSlide - 1); startAutoplay(); });
  nextBtn?.addEventListener('click', () => { nextSlide(); startAutoplay(); });

  showSlide(0); // Initialize first slide
  startAutoplay(); // Start autoplay
}

// --- Course Detail Modal (Academics > Courses Offered) ---
const courseModal = document.getElementById('course-modal');
if (courseModal) {
  const courseModalBody = document.getElementById('course-modal-body');
  const courseModalClose = courseModal.querySelector('.modal-close');
  let lastFocusedRow = null;

  function openCourseModal(templateId, triggerEl) {
    const template = document.getElementById(templateId);
    if (!template) return;
    courseModalBody.innerHTML = '';
    courseModalBody.appendChild(template.content.cloneNode(true));
    courseModal.classList.add('open');
    courseModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lastFocusedRow = triggerEl || null;
    courseModalClose.focus();
  }

  function closeCourseModal() {
    courseModal.classList.remove('open');
    courseModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lastFocusedRow?.focus();
  }

  document.querySelectorAll('.course-table tbody tr[data-detail]').forEach((row) => {
    row.setAttribute('tabindex', '0');
    row.setAttribute('role', 'button');
    row.addEventListener('click', () => openCourseModal(row.dataset.detail, row));
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openCourseModal(row.dataset.detail, row);
      }
    });
  });

  courseModalClose.addEventListener('click', closeCourseModal);
  courseModal.addEventListener('click', (e) => {
    if (e.target === courseModal) closeCourseModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && courseModal.classList.contains('open')) closeCourseModal();
  });
}

// --- Coverflow Carousel (Campus & Infrastructure) ---
const coverflowTrack = document.querySelector('.coverflow-track');
if (coverflowTrack) {
  const coverflowItems = Array.from(coverflowTrack.children);
  const coverflowTotal = coverflowItems.length;
  const coverflowPositions = { '-2': 'left2', '-1': 'left1', '0': 'center', '1': 'right1', '2': 'right2' };
  let coverflowActive = Math.floor(coverflowTotal / 2);

  function renderCoverflow() {
    coverflowItems.forEach((item, i) => {
      let diff = i - coverflowActive;
      if (diff > coverflowTotal / 2) diff -= coverflowTotal;
      if (diff < -coverflowTotal / 2) diff += coverflowTotal;
      item.dataset.pos = coverflowPositions[String(diff)] || 'hidden';
    });
  }

  function goToCoverflow(index) {
    coverflowActive = (index + coverflowTotal) % coverflowTotal;
    renderCoverflow();
  }

  coverflowItems.forEach((item, i) => {
    item.addEventListener('click', () => goToCoverflow(i));
  });

  const coverflowEl = document.querySelector('.coverflow');
  const coverflowPrev = document.querySelector('.coverflow-prev');
  const coverflowNext = document.querySelector('.coverflow-next');
  coverflowPrev?.addEventListener('click', () => goToCoverflow(coverflowActive - 1));
  coverflowNext?.addEventListener('click', () => goToCoverflow(coverflowActive + 1));

  // Scrolls toward whichever side (left = previous, right = next) of the carousel is hovered/focused.
  // Direction is tracked on the container (not per-item) so images sliding under a still cursor
  // don't re-trigger the hover and speed up the interval.
  let coverflowTimer = null;
  let coverflowDirection = 1;

  function coverflowDirectionFromEvent(e) {
    const rect = coverflowEl.getBoundingClientRect();
    return e.clientX - rect.left < rect.width / 2 ? -1 : 1;
  }

  coverflowEl?.addEventListener('mouseenter', (e) => {
    coverflowDirection = coverflowDirectionFromEvent(e);
    clearInterval(coverflowTimer);
    coverflowTimer = setInterval(() => goToCoverflow(coverflowActive + coverflowDirection), 1400);
  });
  coverflowEl?.addEventListener('mousemove', (e) => {
    coverflowDirection = coverflowDirectionFromEvent(e);
  });
  coverflowEl?.addEventListener('mouseleave', () => clearInterval(coverflowTimer));
  coverflowEl?.addEventListener('focusin', () => {
    clearInterval(coverflowTimer);
    coverflowTimer = setInterval(() => goToCoverflow(coverflowActive + coverflowDirection), 1400);
  });
  coverflowEl?.addEventListener('focusout', () => clearInterval(coverflowTimer));

  renderCoverflow();
}

// --- Counter Animation for Statistics ---
const counters = document.querySelectorAll('[data-count]');
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.5 // Trigger when 50% of the element is visible
};

const counterObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const counter = entry.target;
      const target = Number(counter.getAttribute('data-count'));
      let value = 0;
      const step = Math.max(1, Math.round(target / 60)); // Adjust step for smoother animation
      const timer = setInterval(() => {
        value += step;
        if (value >= target) {
          counter.textContent = target.toLocaleString(); // Add .toLocaleString() for thousands separator
          clearInterval(timer);
        } else {
          counter.textContent = value.toLocaleString();
        }
      }, 20); // Faster interval
      observer.unobserve(counter); // Stop observing once animated
    }
  });
}, observerOptions);

counters.forEach(counter => {
  counterObserver.observe(counter);
});

// --- Dynamic Year for Copyright ---
const yearSpan = document.getElementById('year');
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

// --- Scroll to Top functionality (for floating button) ---
const scrollToTopBtn = document.querySelector('.floating-actions a[href="#home"]');
if (scrollToTopBtn) {
  scrollToTopBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// --- Lightbox (Photo Gallery Viewer) ---
// Two ways to feed it:
//   1. data-lightbox-group="name" on repeated elements — clicking one cycles through all
//      elements sharing that group, using each element's <img> src/alt.
//   2. data-lightbox-photos='[{"src":"...","caption":"..."}, ...]' on a single tile — opens
//      straight into that embedded photo list (used for event cover tiles).
(function initLightbox() {
  const triggers = document.querySelectorAll('[data-lightbox-group], [data-lightbox-photos]');
  if (!triggers.length) return;

  let overlay, imgEl, captionEl, counterEl, titleEl, closeBtn, prevBtn, nextBtn;
  let currentPhotos = [];
  let currentIndex = 0;

  function buildOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = `
      <button class="lightbox-close" aria-label="Close">&times;</button>
      <button class="lightbox-nav lightbox-prev" aria-label="Previous photo">&#10094;</button>
      <button class="lightbox-nav lightbox-next" aria-label="Next photo">&#10095;</button>
      <div class="lightbox-stage">
        <img class="lightbox-img" alt="" />
        <div class="lightbox-meta">
          <span class="lightbox-title"></span>
          <span class="lightbox-caption"></span>
          <span class="lightbox-counter"></span>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    imgEl = overlay.querySelector('.lightbox-img');
    captionEl = overlay.querySelector('.lightbox-caption');
    counterEl = overlay.querySelector('.lightbox-counter');
    titleEl = overlay.querySelector('.lightbox-title');
    closeBtn = overlay.querySelector('.lightbox-close');
    prevBtn = overlay.querySelector('.lightbox-prev');
    nextBtn = overlay.querySelector('.lightbox-next');

    closeBtn.addEventListener('click', closeLightbox);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeLightbox(); });
    prevBtn.addEventListener('click', () => step(-1));
    nextBtn.addEventListener('click', () => step(1));
    document.addEventListener('keydown', (e) => {
      if (!overlay.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  }

  function render() {
    const photo = currentPhotos[currentIndex];
    imgEl.src = photo.src;
    imgEl.alt = photo.caption || '';
    captionEl.textContent = photo.caption || '';
    counterEl.textContent = `${currentIndex + 1} / ${currentPhotos.length}`;
    prevBtn.style.display = currentPhotos.length > 1 ? '' : 'none';
    nextBtn.style.display = currentPhotos.length > 1 ? '' : 'none';
  }

  function step(dir) {
    currentIndex = (currentIndex + dir + currentPhotos.length) % currentPhotos.length;
    render();
  }

  function openLightbox(photos, startIndex, groupTitle) {
    if (!overlay) buildOverlay();
    currentPhotos = photos;
    currentIndex = startIndex;
    titleEl.textContent = groupTitle || '';
    render();
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  // Group-based triggers (existing simple galleries)
  const groups = {};
  document.querySelectorAll('[data-lightbox-group]').forEach((el) => {
    const group = el.dataset.lightboxGroup;
    if (!groups[group]) groups[group] = [];
    groups[group].push(el);
  });
  Object.keys(groups).forEach((group) => {
    const els = groups[group];
    const photos = els.map((el) => {
      const img = el.tagName === 'IMG' ? el : el.querySelector('img');
      return { src: el.dataset.lightboxSrc || img.src, caption: el.dataset.lightboxCaption || img.alt || '' };
    });
    els.forEach((el, i) => {
      el.style.cursor = 'zoom-in';
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openLightbox(photos, i, '');
      });
    });
  });

  // Embedded-JSON triggers (event cover tiles)
  document.querySelectorAll('[data-lightbox-photos]').forEach((el) => {
    let photos = [];
    try {
      photos = JSON.parse(el.dataset.lightboxPhotos);
    } catch (err) {
      return;
    }
    el.style.cursor = 'zoom-in';
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openLightbox(photos, 0, el.dataset.lightboxTitle || '');
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(photos, 0, el.dataset.lightboxTitle || '');
      }
    });
  });
})();