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
    try {
      const canvas = document.getElementById('neural-bg');
      if (canvas) {
        // ... (existing canvas code logic is kept implicitly safe by wrapping the block)
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
    } catch (err) {
      console.warn('Canvas init failed:', err);
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
            entry.target.classList.remove('hidden-initially'); // Remove hiding class
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      
      sections.forEach((section) => {
        section.classList.add('hidden-initially'); // Hide only when JS is ready
        io.observe(section);
      });
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

    const getCurrentLang = () => {
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
        messageMaxLength: 'Message should not exceed 500 characters.',
        messageInvalidChars: 'Message can only contain letters, numbers, spaces, periods, commas, and exclamation marks.',
        sending: 'Sending...',
        success: 'Message sent successfully!',
        error: 'Failed to send message. Try again later.',
        errorDetails: 'Details: ',
        errorConnection: 'An error occurred. Please check your internet connection.'
      },
      ru: {
        nameRequired: 'Пожалуйста, введите ваше имя.',
        emailInvalid: 'Введите действительный адрес электронной почты.',
        messageMinLength: 'Сообщение должно содержать не менее 10 символов.',
        messageMaxLength: 'Сообщение не должно превышать 500 символов.',
        messageInvalidChars: 'Сообщение может содержать только буквы, цифры, пробелы, точки, запятые и восклицательные знаки.',
        sending: 'Отправка...',
        success: 'Сообщение успешно отправлено!',
        error: 'Не удалось отправить сообщение. Попробуйте позже.',
        errorDetails: 'Детали: ',
        errorConnection: 'Произошла ошибка. Проверьте подключение к интернету.'
      },
      he: {
        nameRequired: 'אנא הזן את השם שלך.',
        emailInvalid: 'הזן כתובת אימייל תקינה.',
        messageMinLength: 'ההודעה צריכה להכיל לפחות 10 תווים.',
        messageMaxLength: 'ההודעה לא צריכה לעלות על 500 תווים.',
        messageInvalidChars: 'ההודעה יכולה להכיל רק אותיות, מספרים, רווחים, נקודות, פסיקים וסימני קריאה.',
        sending: 'שולח...',
        success: 'ההודעה נשלחה בהצלחה!',
        error: 'שליחת ההודעה נכשלה. נסה שוב מאוחר יותר.',
        errorDetails: 'פרטים: ',
        errorConnection: 'אירעה שגיאה. אנא בדוק את חיבור האינטרנט שלך.'
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
      } else if (messageValue.length > 500) {
        setFieldError(message, t.messageMaxLength);
        valid = false;
      } else {
        // Проверка на допустимые символы: буквы, цифры, пробелы, точки, запятые, восклицательные знаки, переносы строк
        const allowedPattern = /^[a-zA-Zа-яА-ЯёЁא-ת0-9\s.,!\n\r]*$/;
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
      // Обработчик для фильтрации символов в поле сообщения
      const messageField = contactForm.querySelector('#contact-message');
      const messageCounter = contactForm.querySelector('#message-counter');
      
      if (messageField) {
        // Функция для фильтрации недопустимых символов
        const sanitizeMessage = (value) => {
          // Разрешаем только буквы, цифры, пробелы, точки, запятые, восклицательные знаки, переносы строк
          return value.replace(/[^a-zA-Zа-яА-ЯёЁא-ת0-9\s.,!\n\r]/g, '');
        };
        
        // Обновление счетчика символов
        const updateCounter = () => {
          const length = messageField.value.length;
          if (messageCounter) {
            messageCounter.textContent = `${length}/500`;
            if (length > 450) {
              messageCounter.style.color = 'var(--accent)';
            } else if (length > 400) {
              messageCounter.style.color = 'var(--secondary)';
            } else {
              messageCounter.style.color = 'var(--text-secondary)';
            }
          }
        };
        
        // Фильтрация при вводе
        messageField.addEventListener('input', (e) => {
          const originalValue = e.target.value;
          const sanitized = sanitizeMessage(originalValue);
          
          if (originalValue !== sanitized) {
            const cursorPos = e.target.selectionStart;
            e.target.value = sanitized;
            // Восстанавливаем позицию курсора
            e.target.setSelectionRange(cursorPos - 1, cursorPos - 1);
          }
          
          // Ограничение до 500 символов
          if (e.target.value.length > 500) {
            e.target.value = e.target.value.substring(0, 500);
          }
          
          updateCounter();
          validateForm(contactForm);
        });
        
        // Инициализация счетчика
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

        // Санитизация сообщения перед отправкой
        const sanitizeMessage = (value) => {
          return value.replace(/[^a-zA-Zа-яА-ЯёЁא-ת0-9\s.,!\n\r]/g, '').substring(0, 500);
        };
        
        const payload = {
          name: data.get('name'),
          email: data.get('email'),
          message: sanitizeMessage(data.get('message') || '')
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
            const submitTexts = { en: 'SEND MESSAGE', ru: 'ОТПРАВИТЬ СООБЩЕНИЕ', he: 'שלח הודעה' };
            submitBtn.textContent = originalText || submitTexts[lang] || 'SEND MESSAGE';
          }
        }
      });
    }


    // UNREGISTER Service Worker to fix caching issues
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
          console.log('Service Worker unregistered');
        }
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

    // Back to top button
    (function initBackToTop() {
      const backToTopBtn = document.getElementById('back-to-top');
      const aboutSection = document.getElementById('about');
      
      if (!backToTopBtn || !aboutSection) return;
      
      const toggleButton = () => {
        const aboutRect = aboutSection.getBoundingClientRect();
        const aboutBottom = aboutRect.bottom;
        
        if (aboutBottom < window.innerHeight) {
          backToTopBtn.classList.add('visible');
        } else {
          backToTopBtn.classList.remove('visible');
        }
      };
      
      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
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
  });
})();
