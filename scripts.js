(function () {
    const onReady = (fn) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn, { once: true });
        } else {
            fn();
        }
    };

    onReady(() => {
        const canvas = document.getElementById('neural-bg');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            let nodes = [];
            // track mouse if needed later
            let mouse = { x: 0, y: 0 };
            let dpr = 1;
            let logicalWidth = 0;
            let logicalHeight = 0;

            const resizeCanvas = () => {
                dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
                const cssWidth = window.innerWidth;
                const cssHeight = window.innerHeight;
                logicalWidth = cssWidth;
                logicalHeight = cssHeight;
                canvas.width = Math.floor(cssWidth * dpr);
                canvas.height = Math.floor(cssHeight * dpr);
                canvas.style.width = cssWidth + 'px';
                canvas.style.height = cssHeight + 'px';
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            };

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

                    if (this.x < 0 || this.x > logicalWidth) this.vx *= -1;
                    if (this.y < 0 || this.y > logicalHeight) this.vy *= -1;
                }

                draw() {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.fillStyle = '#00ffff';
                    ctx.fill();
                }
            }

            function init() {
                nodes = [];
                const count = 100;
                for (let i = 0; i < count; i++) {
                    nodes.push(new Node(
                        Math.random() * logicalWidth,
                        Math.random() * logicalHeight
                    ));
                }
            }

            function connectNodes() {
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
            }

            let running = true;
            function animate() {
                if (!running) return;
                ctx.clearRect(0, 0, logicalWidth, logicalHeight);

                nodes.forEach(node => {
                    node.update();
                    node.draw();
                });

                connectNodes();
                requestAnimationFrame(animate);
            }

            resizeCanvas();
            init();
            running = true;
            animate();

            const handleVisibility = () => {
                if (document.hidden) {
                    running = false;
                } else {
                    if (!running) {
                        running = true;
                        requestAnimationFrame(animate);
                    }
                }
            };
            document.addEventListener('visibilitychange', handleVisibility);

            window.addEventListener('resize', () => {
                resizeCanvas();
                init();
            }, { passive: true });

            window.addEventListener('mousemove', (e) => {
                mouse.x = e.clientX;
                mouse.y = e.clientY;
            });
        }

        const mobileToggle = document.getElementById('mobile-toggle');
        const navMenu = document.getElementById('nav-menu');
        if (mobileToggle && navMenu) {
            mobileToggle.addEventListener('click', () => {
                mobileToggle.classList.toggle('active');
                navMenu.classList.toggle('active');
                mobileToggle.setAttribute('aria-expanded', mobileToggle.classList.contains('active') ? 'true' : 'false');
            });

            mobileToggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    mobileToggle.click();
                }
            });

            document.querySelectorAll('.nav-menu a').forEach(link => {
                link.addEventListener('click', () => {
                    mobileToggle.classList.remove('active');
                    navMenu.classList.remove('active');
                    mobileToggle.setAttribute('aria-expanded', 'false');
                });
            });
        }

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (!href || href === '#') return; // ignore empty anchors
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        const navbar = document.getElementById('navbar');
        const sections = Array.from(document.querySelectorAll('.fade-in'));

        const onScroll = () => {
            if (navbar) {
                if (window.scrollY > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        if ('IntersectionObserver' in window && sections.length) {
            const io = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        io.unobserve(entry.target);
                    }
                });
            }, { root: null, rootMargin: '0px', threshold: 0.2 });
            sections.forEach(sec => io.observe(sec));
        } else if (sections.length) {
            const revealOnScroll = () => {
                const vh = window.innerHeight;
                sections.forEach(section => {
                    const rect = section.getBoundingClientRect();
                    if (rect.top < vh * 0.8) {
                        section.classList.add('visible');
                    }
                });
            };
            window.addEventListener('scroll', revealOnScroll, { passive: true });
            revealOnScroll();
        }

        const contactForm = document.querySelector('.contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const form = e.target;
                const formData = new FormData(form);

                if (formData.get('honey')) {
                    return;
                }

                const statusEl = form.querySelector('.form-status');

                const submitBtn = form.querySelector('button[type="submit"]');
                const prevText = submitBtn ? submitBtn.textContent : '';
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Sending...';
                }
                if (statusEl) {
                    statusEl.classList.remove('success', 'error');
                    statusEl.textContent = 'Sending...';
                }

                const payload = {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    message: formData.get('message')
                };

                try {
                    const response = await fetch('https://sender.pumalabs.io/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });

                    if (response.ok) {
                        if (statusEl) {
                            statusEl.textContent = 'Message sent successfully!';
                            statusEl.classList.remove('error');
                            statusEl.classList.add('success');
                        } else {
                            console.log('Message sent successfully!');
                        }
                        form.reset();
                    } else {
                        const text = await response.text().catch(() => '');
                        const msg = 'Failed to send message. Try again later.' + (text ? ` Details: ${text}` : '');
                        if (statusEl) {
                            statusEl.textContent = msg;
                            statusEl.classList.remove('success');
                            statusEl.classList.add('error');
                        } else {
                            console.warn(msg);
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
                        submitBtn.textContent = prevText || 'SEND MESSAGE';
                    }
                }
            });
        }
        // Register Service Worker for basic offline caching
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(err => console.warn('Service worker registration failed:', err));
            });
        }

        // Active nav link highlight and aria-current
        try {
            const navLinks = Array.from(document.querySelectorAll('.nav-menu a[href^="#"]'));
            const sectionIds = navLinks
                .map(l => l.getAttribute('href') || '')
                .filter(h => h.startsWith('#'))
                .map(h => h.slice(1));
            const observedSections = sectionIds
                .map(id => document.getElementById(id))
                .filter(Boolean);

            const setAriaCurrent = (id) => {
                navLinks.forEach(link => {
                    const target = (link.getAttribute('href') || '').slice(1);
                    if (target === id) {
                        link.setAttribute('aria-current', 'true');
                    } else {
                        link.removeAttribute('aria-current');
                    }
                });
            };

            const updateActiveLink = () => {
                let currentId = observedSections.length ? observedSections[0].id : '';
                for (const sec of observedSections) {
                    const rect = sec.getBoundingClientRect();
                    if (rect.top <= 120) {
                        currentId = sec.id;
                    }
                }
                if (currentId) setAriaCurrent(currentId);
            };

            window.addEventListener('scroll', updateActiveLink, { passive: true });
            updateActiveLink();
        } catch (e) {
            // no-op
        }

        // Footer year
        const yearEl = document.getElementById('current-year');
        if (yearEl) {
            yearEl.textContent = String(new Date().getFullYear());
        }
    });
})();