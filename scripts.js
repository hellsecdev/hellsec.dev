(function () {
  const READY = (fn) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  };

  READY(() => {
    document.documentElement.classList.add('js');

    // Mobile navigation drawer
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    const closeMenu = () => {
      if (!mobileToggle || !navMenu) return;
      mobileToggle.setAttribute('aria-expanded', 'false');
      navMenu.classList.remove('open');
      document.body.classList.remove('menu-open');
    };

    if (mobileToggle && navMenu) {
      mobileToggle.addEventListener('click', () => {
        const willOpen = mobileToggle.getAttribute('aria-expanded') !== 'true';
        mobileToggle.setAttribute('aria-expanded', String(willOpen));
        navMenu.classList.toggle('open', willOpen);
        document.body.classList.toggle('menu-open', willOpen);
      });
      navMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeMenu();
      });
      window.addEventListener('resize', () => {
        if (window.innerWidth > 820) closeMenu();
      }, { passive: true });
    }

    // Native details remains fully operable without JS. Animate measured heights,
    // keeping [open] until collapse finishes so closing content is not removed early.
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    document.querySelectorAll('details.faq-item').forEach((item, index) => {
      const summary = item.querySelector('summary');
      if (!summary || !item.animate) return;
      const answer = document.createElement('div');
      answer.className = 'faq-answer';
      answer.id = `faq-answer-${index}`;
      while (summary.nextSibling) answer.append(summary.nextSibling);
      item.append(answer);
      summary.setAttribute('aria-controls', answer.id);
      let expanded = item.open;
      let animation;
      let fade;
      const settle = () => {
        animation?.cancel();
        fade?.cancel();
        animation = fade = null;
        item.open = expanded;
        item.style.height = '';
        item.style.overflow = '';
      };
      const sync = () => {
        summary.setAttribute('aria-expanded', String(expanded));
        answer.inert = !expanded;
      };
      const move = () => {
        const from = item.getBoundingClientRect().height;
        const opacity = item.open ? getComputedStyle(answer).opacity : '0';
        animation?.cancel();
        fade?.cancel();
        item.open = true;
        item.style.height = '';
        const styles = getComputedStyle(item);
        const border = parseFloat(styles.borderTopWidth) + parseFloat(styles.borderBottomWidth);
        const to = summary.getBoundingClientRect().height + border + (expanded ? answer.getBoundingClientRect().height : 0);
        if (motionPreference.matches) { settle(); return; }
        item.style.overflow = 'clip';
        const options = {duration: 300, easing: 'cubic-bezier(.22, 1, .36, 1)'};
        animation = item.animate({height: [`${from}px`, `${to}px`]}, options);
        fade = answer.animate({opacity: [opacity, expanded ? '1' : '0']}, options);
        animation.onfinish = settle;
      };
      sync();
      summary.addEventListener('pointerdown', () => summary.classList.add('pointer-focus'));
      summary.addEventListener('keydown', () => summary.classList.remove('pointer-focus'));
      summary.addEventListener('blur', () => summary.classList.remove('pointer-focus'));
      summary.addEventListener('click', event => {
        event.preventDefault();
        expanded = !expanded;
        sync();
        move();
      });
      // Re-target from the current rendered height if wrapping/fonts/content change
      // during motion; once settled the panel uses intrinsic auto height.
      if ('ResizeObserver' in window) {
        let lastSize = '';
        const observer = new ResizeObserver(() => {
          const size = `${answer.offsetWidth}:${answer.offsetHeight}:${summary.offsetHeight}`;
          if (lastSize && size !== lastSize && animation) move();
          lastSize = size;
        });
        observer.observe(answer);
        observer.observe(summary);
      }
      motionPreference.addEventListener('change', () => {
        if (motionPreference.matches) settle();
      });
    });

    // Smooth scrolling for anchors
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (event) => {
        const href = anchor.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (!target) return;
        event.preventDefault();
        const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
        target.scrollIntoView({ behavior, block: 'start' });
        if (href !== '#main' && history.replaceState) {
          history.replaceState(null, '', href);
        }
        // Move keyboard focus too, so "Skip to content" and section links work for keyboard and screen reader users.
        if (!target.matches('a, button, input, select, textarea, [tabindex]')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });

    // Analytics consent banner. Google Analytics only loads after "Accept" (see /assets/analytics.js).
    // The footer "Cookie settings" button reopens it so visitors can change their choice.
    (function initConsentBanner() {
      const KEY = 'hellsec-consent';
      const lang = document.documentElement.lang || 'en';
      const t = {
        en: { text: 'We use Google Analytics cookies to understand how the site is used. Only with your consent.', accept: 'Accept', decline: 'Decline', more: 'Privacy Policy', href: '/privacy.html' },
        ru: { text: 'Мы используем cookies Google Analytics, чтобы понимать, как пользуются сайтом. Только с вашего согласия.', accept: 'Принять', decline: 'Отклонить', more: 'Политика конфиденциальности', href: '/ru/privacy.html' },
        he: { text: 'אנחנו משתמשים בעוגיות של Google Analytics כדי להבין איך משתמשים באתר. רק בהסכמתכם.', accept: 'אישור', decline: 'דחייה', more: 'מדיניות פרטיות', href: '/he/privacy.html' }
      }[lang];
      if (!t) return;
      const read = () => { try { return localStorage.getItem(KEY); } catch (e) { return 'unavailable'; } };
      // Declining after an earlier "Accept" also removes the Google Analytics cookies already set.
      const clearAnalyticsCookies = () => {
        document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter((name) => /^_ga/.test(name)).forEach((name) => {
          [location.hostname, '.' + location.hostname.replace(/^www\./, '')].forEach((domain) => {
            document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}`;
          });
          document.cookie = `${name}=; Max-Age=0; path=/`;
        });
      };
      let bar = null;
      const show = (focus) => {
        if (bar) return;
        bar = document.createElement('div');
        bar.className = 'consent-banner';
        bar.setAttribute('role', 'region');
        bar.setAttribute('aria-label', t.more);
        const p = document.createElement('p');
        p.textContent = t.text + ' ';
        const link = document.createElement('a');
        link.href = t.href;
        link.textContent = t.more;
        p.appendChild(link);
        const actions = document.createElement('div');
        actions.className = 'consent-actions';
        const decide = (value) => {
          const previous = read();
          try { localStorage.setItem(KEY, value); } catch (e) { /* ignore */ }
          if (value === 'granted' && window.hellsecLoadAnalytics) window.hellsecLoadAnalytics();
          if (value === 'denied') {
            clearAnalyticsCookies();
            // Analytics may already be running on this page; a reload stops it.
            if (previous === 'granted') { location.reload(); return; }
          }
          bar.remove();
          bar = null;
        };
        [['decline', 'ghost-btn', 'denied'], ['accept', 'neural-btn', 'granted']].forEach(([label, cls, value]) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = cls;
          b.textContent = t[label];
          b.addEventListener('click', () => decide(value));
          actions.appendChild(b);
        });
        bar.append(p, actions);
        document.body.appendChild(bar);
        if (focus === true) actions.lastChild.focus({ preventScroll: true });
      };
      document.querySelectorAll('.cookie-settings').forEach((btn) => {
        btn.hidden = false;
        btn.addEventListener('click', () => show(true));
      });
      const choice = read();
      if (choice !== 'granted' && choice !== 'denied' && choice !== 'unavailable') show(false);
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

    // Section entrance animation (progressive enhancement).
    // Content is fully visible by default. The observer only adds a one-shot
    // `.reveal` animation whose end-state matches the default, so a JS or
    // observer failure (or a full-page render) never leaves the page blank.
    const sections = Array.from(document.querySelectorAll('.fade-in, .faq-item'));
    const reduceMotionReveal = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (sections.length) {
      if (reduceMotionReveal || !('IntersectionObserver' in window)) {
        sections.forEach((section) => section.classList.add('reveal'));
      } else {
        const io = new IntersectionObserver((entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('reveal');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
        sections.forEach((section) => io.observe(section));
        // Safety: never leave above-the-fold content waiting on a missed observer fire.
        window.setTimeout(() => {
          sections.forEach((section) => {
            const rect = section.getBoundingClientRect();
            if (rect.top < window.innerHeight * 1.15) section.classList.add('reveal');
          });
        }, 900);
      }
    }

    // Premium pointer glow for elevated cards. Desktop only; mobile keeps static, fast UI.
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      document.querySelectorAll('.glass-card, .command-console, .control-panel, .abcc-dashboard, .product-frame').forEach((card) => {
        card.addEventListener('pointermove', (event) => {
          const rect = card.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
          const y = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 100;
          card.style.setProperty('--mx', `${x.toFixed(1)}%`);
          card.style.setProperty('--my', `${y.toFixed(1)}%`);
        });
      });
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

    const getCurrentLang = () => {
      const docLang = (document.documentElement.lang || '').slice(0, 2);
      if (['en', 'ru', 'he'].includes(docLang)) return docLang;
      const path = window.location.pathname;
      if (path.startsWith('/ru/') || path === '/ru') return 'ru';
      if (path.startsWith('/he/') || path === '/he') return 'he';
      return 'en';
    };

    const translations = {
      en: {
        nameRequired: 'Please enter your name.',
        emailInvalid: 'Enter a valid email address.',
        messageMinLength: 'Message should be at least 10 characters.',
        messageMaxLength: 'Message should not exceed 1500 characters.',
        messageInvalidChars: 'Message contains unsupported control characters.',
        sending: 'Sending...',
        success: 'Message sent. We reply within 24 hours.',
        error: 'Failed to send message. Try again later.',
        errorDetails: 'Details: ',
        errorConnection: 'An error occurred. Please check your internet connection.'
      },
      ru: {
        nameRequired: 'Пожалуйста, введите ваше имя.',
        emailInvalid: 'Введите действительный адрес электронной почты.',
        messageMinLength: 'Сообщение должно содержать не менее 10 символов.',
        messageMaxLength: 'Сообщение не должно превышать 1500 символов.',
        messageInvalidChars: 'Сообщение содержит неподдерживаемые служебные символы.',
        sending: 'Отправка...',
        success: 'Сообщение отправлено. Мы ответим в течение 24 часов.',
        error: 'Не удалось отправить сообщение. Попробуйте позже.',
        errorDetails: 'Подробности: ',
        errorConnection: 'Произошла ошибка. Проверьте подключение к интернету.'
      },
      he: {
        nameRequired: 'הזינו את השם שלכם.',
        emailInvalid: 'הזינו כתובת אימייל תקינה.',
        messageMinLength: 'ההודעה צריכה להכיל לפחות 10 תווים.',
        messageMaxLength: 'ההודעה לא צריכה לעלות על 1500 תווים.',
        messageInvalidChars: 'ההודעה מכילה תווי בקרה שאינם נתמכים.',
        sending: 'שולחים...',
        success: 'ההודעה נשלחה. נחזור אליכם תוך 24 שעות.',
        error: 'שליחת ההודעה נכשלה. נסו שוב מאוחר יותר.',
        errorDetails: 'פרטים: ',
        errorConnection: 'אירעה שגיאה. בדקו את חיבור האינטרנט שלכם.'
      }
    };

    const validateForm = (form) => {
      const lang = getCurrentLang();
      const t = translations[lang];
      const name = form.querySelector('#contact-name');
      const email = form.querySelector('#contact-email');
      const message = form.querySelector('#contact-message');
      let valid = true;

      if (!name.value.trim()) {
        setFieldError(name, t.nameRequired);
        valid = false;
      } else {
        setFieldError(name, '');
      }

      const emailValue = email.value.trim();
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
      if (!emailValid) {
        setFieldError(email, t.emailInvalid);
        valid = false;
      } else {
        setFieldError(email, '');
      }

      const messageValue = message.value.trim();
      
      if (messageValue.length < 10) {
        setFieldError(message, t.messageMinLength);
        valid = false;
      } else if (messageValue.length > 1500) {
        setFieldError(message, t.messageMaxLength);
        valid = false;
      } else {
        // Reject only control characters while allowing normal punctuation, currency signs, URLs and project notes.
        const allowedPattern = /^[^\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]*$/;
        if (!allowedPattern.test(messageValue)) {
          setFieldError(message, t.messageInvalidChars);
          valid = false;
        } else {
          setFieldError(message, '');
        }
      }

      return valid;
    };

    if (contactForm) {
      // Strip unsupported control characters from the message field as the user types
      const messageField = contactForm.querySelector('#contact-message');
      const messageCounter = contactForm.querySelector('#message-counter');

      const updateCounter = () => {
        if (!messageField || !messageCounter) return;
        const length = messageField.value.length;
        messageCounter.textContent = `${length}/1500`;
        if (length > 1400) {
          messageCounter.style.color = 'var(--accent)';
        } else if (length > 1200) {
          messageCounter.style.color = 'var(--secondary)';
        } else {
          messageCounter.style.color = 'var(--text-secondary)';
        }
      };

      if (messageField) {
        // Remove only unsupported control characters; keep normal punctuation, currency signs, URLs and project details.
        const sanitizeMessage = (value) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

        // Filter on input
        messageField.addEventListener('input', (e) => {
          const originalValue = e.target.value;
          const sanitized = sanitizeMessage(originalValue);

          if (originalValue !== sanitized) {
            const cursorPos = e.target.selectionStart;
            e.target.value = sanitized;
            // Restore the caret position
            e.target.setSelectionRange(cursorPos - 1, cursorPos - 1);
          }

          // Cap at 1500 characters
          if (e.target.value.length > 1500) {
            e.target.value = e.target.value.substring(0, 1500);
          }

          updateCounter();
          validateForm(contactForm);
        });

        // Initialise the character counter
        updateCounter();
      }

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
        const lang = getCurrentLang();
        const t = translations[lang];

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = t.sending;
        }
        if (statusEl) {
          statusEl.classList.remove('success', 'error');
          statusEl.textContent = t.sending;
        }

        // Sanitise the message before sending: drop only control characters, keep normal punctuation and currency signs.
        const sanitizeMessage = (value) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').substring(0, 1500);

        // Service-page forms tag the request so the team sees which service it came from.
        const context = form.dataset.context ? `[${form.dataset.context}] ` : '';
        const payload = {
          name: data.get('name'),
          email: data.get('email'),
          message: sanitizeMessage(context + (data.get('message') || '')),
          lang
        };

        try {
          const response = await fetch('https://sender.hellsec.dev/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (response.ok) {
            if (statusEl) {
              statusEl.textContent = t.success;
              statusEl.classList.remove('error');
              statusEl.classList.add('success');
            }
            form.reset();
            updateCounter();
          } else {
            const text = await response.text().catch(() => '');
            const messageText = t.error + (text ? ` ${t.errorDetails}${text}` : '');
            if (statusEl) {
              statusEl.textContent = messageText;
              statusEl.classList.remove('success');
              statusEl.classList.add('error');
            }
          }
        } catch (error) {
          console.error(error);
          if (statusEl) {
            statusEl.textContent = t.errorConnection;
            statusEl.classList.remove('success');
            statusEl.classList.add('error');
          }
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            const submitTexts = { en: 'Send message', ru: 'Отправить', he: 'שליחת הודעה' };
            submitBtn.textContent = originalText || submitTexts[lang] || 'Send message';
          }
        }
      });
    }


    // UNREGISTER Service Worker to fix caching issues
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    }

    // Active nav link state
    try {
      const allNavLinks = Array.from(document.querySelectorAll('.nav-menu a'));
      const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
      allNavLinks.forEach((link) => {
        const href = link.getAttribute('href');
        if (!href) return;
        const linkPath = href.split('#')[0].replace(/\/$/, '') || '/';
        if (linkPath === currentPath && currentPath !== '/' && currentPath !== '/ru' && currentPath !== '/he') {
          link.setAttribute('aria-current', 'page');
        }
      });

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
        let current = '';
        for (const section of observed) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= 180) current = section.id;
        }
        if (observed.length && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 40) {
          current = observed[observed.length - 1].id;
        }
        setAriaCurrent(current);
      };

      window.addEventListener('scroll', updateActiveLink, { passive: true });
      updateActiveLink();
    } catch (error) {
      console.warn('Nav highlight failed:', error);
    }

    // Back to top button
    (function initBackToTop() {
      const backToTopBtn = document.getElementById('back-to-top');
      if (!backToTopBtn) return;

      const toggleButton = () => {
        if (window.scrollY > 600) {
          backToTopBtn.classList.add('visible');
        } else {
          backToTopBtn.classList.remove('visible');
        }
      };

      backToTopBtn.addEventListener('click', () => {
        const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
        window.scrollTo({ top: 0, behavior });
      });

      window.addEventListener('scroll', toggleButton, { passive: true });
      toggleButton();
    })();

    // Footer year stamp
    const yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    // Language selector active state
    (function initLanguageSelector() {
      const langSelector = document.getElementById('language-selector');
      if (!langSelector) return;

      const currentPath = window.location.pathname;
      let currentLang = 'en';
      if (currentPath.startsWith('/ru/') || currentPath === '/ru') {
        currentLang = 'ru';
      } else if (currentPath.startsWith('/he/') || currentPath === '/he') {
        currentLang = 'he';
      }

      const langButtons = langSelector.querySelectorAll('.lang-btn');
      langButtons.forEach((btn) => {
        const lang = btn.getAttribute('data-lang');
        if (lang === currentLang) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    })();

    // Case discuss mini-forms (name + channel + context) -> sender.hellsec.dev
    const caseForms = Array.from(document.querySelectorAll('.case-mini-form'));
    caseForms.forEach((form) => {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const lang = getCurrentLang();
        const t = translations[lang] || translations.en;
        const nameInput = form.querySelector('[name="name"]');
        const channelInput = form.querySelector('[name="channel"]');
        const contextInput = form.querySelector('[name="context"]');
        const honey = form.querySelector('[name="honey"]');
        if (honey && honey.value) return;
        const name = (nameInput?.value || '').trim();
        const channel = (channelInput?.value || '').trim();
        const context = (contextInput?.value || '').trim();
        let valid = true;
        const setErr = (input, msg) => {
          const group = input?.closest('.form-group');
          const err = group ? group.querySelector('.field-error') : null;
          if (input) {
            if (msg) input.setAttribute('aria-invalid', 'true');
            else input.removeAttribute('aria-invalid');
          }
          if (err) err.textContent = msg || '';
        };
        if (!name) { setErr(nameInput, t.nameRequired); valid = false; } else setErr(nameInput, '');
        if (!channel) { setErr(channelInput, lang === 'ru' ? 'Укажите канал связи.' : lang === 'he' ? 'נא למלא ערוץ יצירת קשר.' : 'Please enter a contact channel.'); valid = false; } else setErr(channelInput, '');
        if (context.length < 10) { setErr(contextInput, t.messageMinLength); valid = false; } else setErr(contextInput, '');
        if (!valid) {
          form.querySelector('[aria-invalid="true"]')?.focus();
          return;
        }
        const statusEl = form.querySelector('.form-status');
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = t.sending; }
        if (statusEl) { statusEl.classList.remove('success', 'error'); statusEl.textContent = t.sending; }
        const emailLike = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(channel);
        const caseTitle = form.getAttribute('data-case') || document.title || 'Case discuss';
        const payload = {
          name,
          email: emailLike ? channel : 'case-lead@hellsec.dev',
          message: `Case discuss: ${caseTitle}\nPreferred channel: ${channel}\n\n${context}`.substring(0, 1500),
          lang
        };
        try {
          const response = await fetch('https://sender.hellsec.dev/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (response.ok) {
            if (statusEl) { statusEl.textContent = t.success; statusEl.classList.add('success'); statusEl.classList.remove('error'); }
            form.reset();
          } else {
            const text = await response.text().catch(() => '');
            if (statusEl) { statusEl.textContent = t.error + (text ? ` ${t.errorDetails}${text}` : ''); statusEl.classList.add('error'); statusEl.classList.remove('success');
            }
          }
        } catch (err) {
          if (statusEl) { statusEl.textContent = t.errorConnection; statusEl.classList.add('error'); statusEl.classList.remove('success'); }
        } finally {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
        }
      });
    });

    // Interactive card cursor spotlight (Linear / CrowdStrike design)
    if (window.matchMedia('(hover: hover)').matches) {
      const cards = document.querySelectorAll('.service-card, .product-teaser, .stat-row li, .operator-card, .case-card, .case-index-card');
      cards.forEach((card) => {
        card.addEventListener('pointermove', (event) => {
          const rect = card.getBoundingClientRect();
          card.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
          card.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
        }, { passive: true });
      });
    }

  });
})();
