(function () {
  const READY = (fn) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  };

  const THEME_KEY = 'theme';

  READY(() => {
    // Canvas background network
    const canvas = document.getElementById('neural-bg');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      let nodes = [];
      let dpr = 1;
      let width = 0;
      let height = 0;

      class Node {
        constructor(x, y) {
          this.x = x;
          this.y = y;
          this.vx = (Math.random() - 0.5) * 0.5;
          this.vy = (Math.random() - 0.5) * 0.5;
          this.radius = Math.random() * 3 + 1;
        }
        update() {
          this.x += this.vx;
          this.y += this.vy;
          if (this.x < 0 || this.x > width) this.vx *= -1;
          if (this.y < 0 || this.y > height) this.vy *= -1;
        }
        draw() {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
          ctx.fillStyle = '#00ffff';
          ctx.fill();
        }
      }

      const resizeCanvas = () => {
        dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
        const doc = document.documentElement;
        const body = document.body;
        const viewportWidth = window.innerWidth || doc.clientWidth || (body ? body.clientWidth : 0) || 0;
        const viewportHeight = window.innerHeight || doc.clientHeight || (body ? body.clientHeight : 0) || 0;
        const nextWidth = Math.max(viewportWidth, doc.clientWidth || 0, body ? body.clientWidth || 0 : 0);
        const nextHeight = Math.max(
          viewportHeight,
          doc.scrollHeight,
          body ? body.scrollHeight : 0
        );
        width = nextWidth;
        height = nextHeight;
        canvas.width = Math.floor(nextWidth * dpr);
        canvas.height = Math.floor(nextHeight * dpr);
        canvas.style.width = nextWidth + 'px';
        canvas.style.height = nextHeight + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };

      const initNodes = () => {
        nodes = [];
        const area = width * height;
        const suggested = Math.round(area / 18000);
        const count = Math.max(100, Math.min(220, suggested));
        for (let i = 0; i < count; i++) {
          nodes.push(new Node(Math.random() * width, Math.random() * height));
        }
      };

      const connectNodes = () => {
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 150) {
              ctx.beginPath();
              ctx.moveTo(nodes[i].x, nodes[i].y);
              ctx.lineTo(nodes[j].x, nodes[j].y);
              ctx.strokeStyle = `rgba(0, 255, 255, ${1 - distance / 150})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }
      };

      let running = true;
      const animate = () => {
        if (!running) return;
        ctx.clearRect(0, 0, width, height);
        nodes.forEach((node) => {
          node.update();
          node.draw();
        });
        connectNodes();
        requestAnimationFrame(animate);
      };

      resizeCanvas();
      initNodes();
      animate();

      document.addEventListener('visibilitychange', () => {
        running = !document.hidden;
        if (running) requestAnimationFrame(animate);
      });

      const handleResize = () => {
        const prevWidth = width;
        const prevHeight = height;
        resizeCanvas();
        if (Math.abs(width - prevWidth) > 1 || Math.abs(height - prevHeight) > 1) {
          initNodes();
        }
      };

      window.addEventListener('resize', handleResize, { passive: true });

      if ('ResizeObserver' in window) {
        const bodyObserver = new ResizeObserver(() => handleResize());
        bodyObserver.observe(document.body);
      }
    }

    // Mobile navigation toggle
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (mobileToggle && navMenu) {
      const closeMenu = () => {
        mobileToggle.classList.remove('active');
        navMenu.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
      };

      mobileToggle.addEventListener('click', () => {
        const isOpen = mobileToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        mobileToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      mobileToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          mobileToggle.click();
        }
      });

      navMenu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', closeMenu);
      });
    }

    // Smooth scrolling for anchors
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (event) => {
        const href = anchor.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // Theme toggle dark/light
    (function initThemeToggle() {
      const root = document.documentElement;
      const btn = document.getElementById('theme-toggle');
      if (!btn) return;

      const applyTheme = (theme) => {
        const safeTheme = theme === 'light' ? 'light' : 'dark';
        root.setAttribute('data-theme', safeTheme);
        localStorage.setItem(THEME_KEY, safeTheme);
        const label = safeTheme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
        btn.setAttribute('aria-label', label);
        btn.setAttribute('title', label);
      };

      const saved = localStorage.getItem(THEME_KEY);
      applyTheme(saved === 'light' ? 'light' : 'dark');

      btn.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        applyTheme(next);
      });
    })();

    // Navbar scrolled shadow
    const navbar = document.getElementById('navbar');
    const handleScroll = () => {
      if (!navbar) return;
      if (window.scrollY > 50) navbar.classList.add('scrolled');
      else navbar.classList.remove('scrolled');
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Section fade-in reveal
    const sections = Array.from(document.querySelectorAll('.fade-in'));
    if ('IntersectionObserver' in window && sections.length) {
      const io = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      sections.forEach((section) => io.observe(section));
    } else if (sections.length) {
      const reveal = () => {
        const vh = window.innerHeight;
        sections.forEach((section) => {
          const rect = section.getBoundingClientRect();
          if (rect.top < vh * 0.8) section.classList.add('visible');
        });
      };
      window.addEventListener('scroll', reveal, { passive: true });
      reveal();
    }

    // Contact form validation + submission
    const contactForm = document.querySelector('.contact-form');
    const setFieldError = (input, message) => {
      const group = input.closest('.form-group');
      const error = group ? group.querySelector('.field-error') : null;
      if (message) {
        input.setAttribute('aria-invalid', 'true');
        if (error) error.textContent = message;
      } else {
        input.removeAttribute('aria-invalid');
        if (error) error.textContent = '';
      }
    };

    const validateForm = (form) => {
      const name = form.querySelector('#contact-name');
      const email = form.querySelector('#contact-email');
      const message = form.querySelector('#contact-message');
      let valid = true;

      if (!name.value.trim()) {
        setFieldError(name, 'Please enter your name.');
        valid = false;
      } else {
        setFieldError(name, '');
      }

      const emailValue = email.value.trim();
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
      if (!emailValid) {
        setFieldError(email, 'Enter a valid email address.');
        valid = false;
      } else {
        setFieldError(email, '');
      }

      if (message.value.trim().length < 10) {
        setFieldError(message, 'Message should be at least 10 characters.');
        valid = false;
      } else {
        setFieldError(message, '');
      }

      return valid;
    };

    if (contactForm) {
      contactForm.addEventListener('input', () => validateForm(contactForm));
      contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = event.target;
        const data = new FormData(form);
        if (data.get('honey')) return;
        if (!validateForm(form)) {
          const firstInvalid = form.querySelector('[aria-invalid="true"]');
          firstInvalid?.focus();
          return;
        }

        const statusEl = form.querySelector('.form-status');
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : '';

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Sending...';
        }
        if (statusEl) {
          statusEl.classList.remove('success', 'error');
          statusEl.textContent = 'Sending...';
        }

        const payload = {
          name: data.get('name'),
          email: data.get('email'),
          message: data.get('message')
        };

        try {
          const response = await fetch('https://sender.pumalabs.io/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (response.ok) {
            if (statusEl) {
              statusEl.textContent = 'Message sent successfully!';
              statusEl.classList.remove('error');
              statusEl.classList.add('success');
            }
            form.reset();
          } else {
            const text = await response.text().catch(() => '');
            const messageText = 'Failed to send message. Try again later.' + (text ? ` Details: ${text}` : '');
            if (statusEl) {
              statusEl.textContent = messageText;
              statusEl.classList.remove('success');
              statusEl.classList.add('error');
            }
          }
        } catch (error) {
          console.error(error);
          if (statusEl) {
            statusEl.textContent = 'An error occurred. Please check your internet connection.';
            statusEl.classList.remove('success');
            statusEl.classList.add('error');
          }
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText || 'SEND MESSAGE';
          }
        }
      });
    }

    // Focus trap for mobile menu when open
    (function initFocusTrap() {
      const menu = document.getElementById('nav-menu');
      const toggle = document.getElementById('mobile-toggle');
      if (!menu || !toggle) return;
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && menu.classList.contains('active')) {
          toggle.click();
          return;
        }
        if (event.key !== 'Tab' || !menu.classList.contains('active')) return;
        const focusables = menu.querySelectorAll('a,button,[tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      });
    })();

    // Register service worker once
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('Service worker registration failed:', err);
        });
      });
    }

    // Active nav link state
    try {
      const navLinks = Array.from(document.querySelectorAll('.nav-menu a[href^="#"]'));
      const sectionIds = navLinks
        .map((link) => link.getAttribute('href') || '')
        .filter((href) => href.startsWith('#'))
        .map((href) => href.slice(1));
      const observed = sectionIds
        .map((id) => document.getElementById(id))
        .filter(Boolean);

      const setAriaCurrent = (id) => {
        navLinks.forEach((link) => {
          if ((link.getAttribute('href') || '').slice(1) === id) {
            link.setAttribute('aria-current', 'true');
          } else {
            link.removeAttribute('aria-current');
          }
        });
      };

      const updateActiveLink = () => {
        let current = observed.length ? observed[0].id : '';
        for (const section of observed) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= 120) current = section.id;
        }
        if (current) setAriaCurrent(current);
      };

      window.addEventListener('scroll', updateActiveLink, { passive: true });
      updateActiveLink();
    } catch (error) {
      console.warn('Nav highlight failed:', error);
    }

    // Footer year stamp
    const yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  });
})();
