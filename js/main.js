document.addEventListener('DOMContentLoaded', function () {
    /* ---------- Mobile menu ---------- */
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');

    function closeMenu() {
        if (!navMenu || !hamburger) return;
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
    }

    if (hamburger && navMenu) {
        hamburger.setAttribute('aria-expanded', 'false');

        hamburger.addEventListener('click', () => {
            const open = navMenu.classList.toggle('active');
            hamburger.classList.toggle('active', open);
            hamburger.setAttribute('aria-expanded', String(open));
        });

        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 900) closeMenu();
        });
    }

    /* ---------- Scroll handlers (header, active link, back to top) ---------- */
    const header = document.getElementById('header');
    const backToTop = document.getElementById('backToTop');
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    function onScroll() {
        const y = window.scrollY;

        if (header) header.classList.toggle('scrolled', y > 50);
        if (backToTop) backToTop.classList.toggle('visible', y > 400);

        let current = '';
        sections.forEach(section => {
            if (y >= section.offsetTop - 120) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ---------- Quote form (Web3Forms) ---------- */
    const form = document.getElementById('quote-form');
    const status = document.getElementById('form-status');

    function showStatus(type, msg) {
        if (!status) return;
        status.className = 'form-status show ' + type;
        status.textContent = msg;
    }

    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            const btn = form.querySelector('button[type="submit"]');
            const originalHTML = btn.innerHTML;

            const data = Object.fromEntries(new FormData(form).entries());
            const sel = form.querySelector('#service');
            data.service = sel && sel.value ? sel.options[sel.selectedIndex].text : 'Not selected';

            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            if (status) status.className = 'form-status';

            try {
                const res = await fetch(form.action, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(data)
                });
                const json = await res.json();

                if (res.ok && json.success) {
                    showStatus('success', 'Thank you! Your quote request has been sent. We will contact you within 24 hours.');
                    form.reset();
                } else {
                    showStatus('error', json.message || 'Something went wrong. Please call us at +1 602-823-5741.');
                }
            } catch (err) {
                showStatus('error', 'Network error. Please try again or call us at +1 602-823-5741.');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalHTML;
            }
        });
    }

    /* ---------- Reveal on scroll ---------- */
    const revealEls = document.querySelectorAll('.service-card, .review-card, .step, .why-item');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (revealEls.length && 'IntersectionObserver' in window && !reduceMotion) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el = entry.target;

                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';

                // Clear inline styles afterwards so the CSS hover effects work again
                setTimeout(() => {
                    el.style.transition = '';
                    el.style.opacity = '';
                    el.style.transform = '';
                }, 700);

                observer.unobserve(el);
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        revealEls.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }
});
