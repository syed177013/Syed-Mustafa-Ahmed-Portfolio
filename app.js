document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  function getInitials(name) {
    if (!name) return '';
    return name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
  }

  let recipientEmail = '';

  function el(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  // ------------------------------------------------------------------
  // Fetch everything, then render
  // ------------------------------------------------------------------
  const files = [
    'profile', 'interests', 'currently-learning', 'stats', 'skills',
    'projects', 'experience', 'education', 'certifications',
    'achievements', 'timeline', 'socials'
  ];

  Promise.all(files.map(name =>
    fetch(`./data/${name}.json`).then(res => {
      if (!res.ok) throw new Error(`Failed to load ${name}.json`);
      return res.json();
    })
  ))
  .then(([profile, interests, learning, stats, skills, projects, experience, education, certifications, achievements, timeline, socials]) => {

    renderHero(profile, learning, interests);
    renderFigMilestones(timeline);
    renderStats(stats, projects, certifications);
    renderSkills(skills);
    renderProjects(projects);
    renderExperience(experience);
    renderEducation(education);
    renderCertifications(certifications);
    renderAchievements(achievements);
    renderTimeline(timeline);
    renderContact(profile, socials);

    // Everything is in the DOM now — wire up motion.
    initScrollReveal();
    initCurveDraw();
  })
  .catch(err => {
    console.error('Portfolio data failed to load:', err);
    console.error('If you opened this file directly (file://), browsers block local JSON fetches. Run a local server instead, e.g.: python3 -m http.server, then open http://localhost:8000');
  });

  // ------------------------------------------------------------------
  // Hero
  // ------------------------------------------------------------------
  function renderHero(profile, learning, interests) {
    document.title = `${profile.name} | ${profile.title}`;

    const brand = document.getElementById('brand-initials');
    if (brand) brand.innerHTML = `${getInitials(profile.name)} <span class="brand-tag"></span>`;

    document.getElementById('hero-name').textContent = profile.name;
    document.getElementById('hero-title').textContent = profile.title;
    document.getElementById('hero-tagline').textContent = profile.tagline || '';
    document.getElementById('hero-bio').textContent = profile.bio || '';
    document.getElementById('availability-text').textContent =
      `${profile.availability || 'Open to opportunities'} — ${profile.location || ''}`.trim();

    const learningContainer = document.getElementById('learning-tags');
    learningContainer.innerHTML = learning.map(item => `<span>#${item.toLowerCase().replace(/\s+/g, '-')}</span>`).join('');

    const interestsContainer = document.getElementById('interests-tags');
    interestsContainer.innerHTML = interests.map(item => `<span>${item}</span>`).join('');
  }

  function renderFigMilestones(timeline) {
    const container = document.getElementById('fig-milestones');
    if (!container || !timeline.length) return;
    const first = timeline[0];
    const mid = timeline[Math.floor(timeline.length / 2)];
    const later = timeline[Math.max(timeline.length - 2, 0)];
    const picks = [first, mid, later];
    container.innerHTML = picks.map(item => `<span>${truncate(item.title, 40)}</span>`).join('') + '<span>now</span>';
  }

  function truncate(str, n) {
    return str.length > n ? str.slice(0, n - 1).trim() + '…' : str;
  }

  // ------------------------------------------------------------------
  // Key metrics strip
  // ------------------------------------------------------------------
  function renderStats(stats, projects, certifications) {
    const container = document.getElementById('stats-strip');
    const items = [
      { label: 'CGPA', value: stats.cgpa ? `${stats.cgpa}` : null },
      { label: 'Model Accuracy', value: stats.modelAccuracy },
      { label: 'CSAT Score', value: stats.customerSatisfaction },
      { label: 'Students Mentored', value: stats.studentsMentored },
      { label: 'Team Members Led', value: stats.teamMembersLed },
      { label: 'Certifications', value: certifications.length },
      { label: 'Flagship Projects', value: projects.length }
    ].filter(item => item.value !== null && item.value !== undefined && item.value !== 0);

    container.innerHTML = items.map(item => `
      <div class="stat-item">
        <span class="stat-value">${item.value}</span>
        <span class="stat-label">${item.label}</span>
      </div>
    `).join('');
  }

  // ------------------------------------------------------------------
  // Skills
  // ------------------------------------------------------------------
  function renderSkills(skills) {
    const container = document.getElementById('skills-container');
    container.innerHTML = skills.map(cat => `
      <div class="skill-card reveal">
        <h3> ${cat.category}</h3>
        <div class="pill-row">
          ${cat.skills.map(s => `<span class="pill">${s.name}</span>`).join('')}
        </div>
      </div>
    `).join('');
  }


  // ------------------------------------------------------------------
  // Projects — brief cards (tagline, short description, tech, metrics, links)
  // ------------------------------------------------------------------
    // ------------------------------------------------------------------
      // Projects — center-focused showcase carousel
      // ------------------------------------------------------------------
      function renderProjects(projects) {
        const container = document.getElementById('projects-container');

        if (!container || !projects || !projects.length) return;

        const stage = container.querySelector('.projects-stage');
        const prevButton = container.querySelector('.projects-nav--prev');
        const nextButton = container.querySelector('.projects-nav--next');
        const counter = document.querySelector('.projects-counter');

        let currentIndex = 0;


        // ---------------------------------------------------------------
        // Build project cards
        // ---------------------------------------------------------------

        stage.innerHTML = projects.map((p) => {

          const metricsHtml = (p.metrics && p.metrics.length)
            ? `
              <div class="results-table">

                ${p.metrics.slice(0, 2).map(m => `
                  <div class="results-row">
                    <span class="r-label">${m.label}</span>
                    <span class="r-value">${m.value}</span>
                  </div>
                `).join('')}

              </div>
            `
            : '';


          const links = `
            <div class="project-links">

              ${p.github
                ? `
                  <a
                    href="${p.github}"
                    target="_blank"
                    rel="noopener"
                    class="project-link"
                  >
                    [ repo → ]
                  </a>
                `
                : ''
              }

              ${p.liveDemo
                ? `
                  <a
                    href="${p.liveDemo}"
                    target="_blank"
                    rel="noopener"
                    class="project-link"
                  >
                    [ live demo → ]
                  </a>
                `
                : ''
              }

            </div>
          `;


          return `
            <article class="project-card">

              <!-- =====================================================
                  IMAGE / VISUAL
                  ===================================================== -->

              ${
                p.thumbnail
                  ? `
                    <div class="project-visual">

                      <img
                        src="${p.thumbnail}"
                        alt="${p.title || p.name}"
                        loading="lazy"
                      >

                    </div>
                  `
                  : ''
              }


              <!-- =====================================================
                  PROJECT INFORMATION
                  ===================================================== -->

              <div class="project-content">

                <div class="project-head">

                  <span class="project-status">
                    ${p.status || ''}
                    ${p.year ? ' · ' + p.year : ''}
                  </span>

                  <h3>
                    ${p.title || p.name}
                  </h3>

                  <p class="project-tagline">
                    ${p.tagline || ''}
                  </p>

                </div>


                <p class="project-desc">
                  ${p.shortDescription || ''}
                </p>


                <div class="tech-row">

                  ${(p.tech || [])
                    .slice(0, 3)
                    .map(t => `
                      <span class="tech-tag">${t}</span>
                    `)
                    .join('')
                  }

                </div>


                ${metricsHtml}


                ${links}

              </div>


              <!-- =====================================================
                  SIDE-CARD TITLE
                  ===================================================== -->

              <span class="project-preview-title">
                ${p.title || p.name}
              </span>

            </article>
          `;

        }).join('');


        const cards = Array.from(
          stage.querySelectorAll('.project-card')
        );


        // ---------------------------------------------------------------
        // Update carousel state
        // ---------------------------------------------------------------

        function updateCarousel() {

          const total = cards.length;

          const previousIndex =
            (currentIndex - 1 + total) % total;

          const nextIndex =
            (currentIndex + 1) % total;


          cards.forEach((card, index) => {

            card.classList.remove(
              'is-active',
              'is-prev',
              'is-next',
              'is-hidden'
            );


            if (index === currentIndex) {

              card.classList.add('is-active');

            } else if (index === previousIndex) {

              card.classList.add('is-prev');

            } else if (index === nextIndex) {

              card.classList.add('is-next');

            } else {

              card.classList.add('is-hidden');

            }

          });


          // -------------------------------------------------------------
          // Counter
          // -------------------------------------------------------------

          if (counter) {

            counter.textContent =
              `${String(currentIndex + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;

          }


          // -------------------------------------------------------------
          // Navigation state
          // -------------------------------------------------------------

          if (total <= 1) {

            prevButton.disabled = true;
            nextButton.disabled = true;

          } else {

            prevButton.disabled = false;
            nextButton.disabled = false;

          }

        }


        // ---------------------------------------------------------------
        // Previous
        // ---------------------------------------------------------------

        function showPrevious() {

          currentIndex =
            (currentIndex - 1 + cards.length) % cards.length;

          updateCarousel();

        }


        // ---------------------------------------------------------------
        // Next
        // ---------------------------------------------------------------

        function showNext() {

          currentIndex =
            (currentIndex + 1) % cards.length;

          updateCarousel();

        }


        // ---------------------------------------------------------------
        // Buttons
        // ---------------------------------------------------------------

        prevButton.addEventListener(
          'click',
          showPrevious
        );

        nextButton.addEventListener(
          'click',
          showNext
        );


        // ---------------------------------------------------------------
        // Side-card click
        // ---------------------------------------------------------------

        cards.forEach((card, index) => {

          card.addEventListener('click', (event) => {

            /*
            * Don't hijack actual project links.
            */

            if (
              event.target.closest('a') ||
              event.target.closest('button')
            ) {
              return;
            }


            /*
            * Clicking the active card does nothing.
            */

            if (index === currentIndex) {
              return;
            }


            /*
            * Clicking either side project brings it to center.
            */

            currentIndex = index;

            updateCarousel();

          });

        });


        // ---------------------------------------------------------------
        // Keyboard navigation
        // ---------------------------------------------------------------

        container.setAttribute('tabindex', '0');

        container.addEventListener('keydown', (event) => {

          if (event.key === 'ArrowLeft') {

            event.preventDefault();

            showPrevious();

          }


          if (event.key === 'ArrowRight') {

            event.preventDefault();

            showNext();

          }

        });


        // ---------------------------------------------------------------
        // Touch / swipe
        // ---------------------------------------------------------------

        let touchStartX = 0;

        let touchEndX = 0;


        stage.addEventListener(
          'touchstart',
          (event) => {

            touchStartX =
              event.changedTouches[0].screenX;

          },
          { passive: true }
        );


        stage.addEventListener(
          'touchend',
          (event) => {

            touchEndX =
              event.changedTouches[0].screenX;


            const distance =
              touchEndX - touchStartX;


            const swipeThreshold = 50;


            if (Math.abs(distance) < swipeThreshold) {
              return;
            }


            if (distance < 0) {

              showNext();

            } else {

              showPrevious();

            }

          },
          { passive: true }
        );


        // ---------------------------------------------------------------
        // Initial render
        // ---------------------------------------------------------------

        updateCarousel();
      }

  // ------------------------------------------------------------------
  // Experience
  // ------------------------------------------------------------------
  function renderExperience(experience) {
    const container = document.getElementById('experience-container');
    container.innerHTML = experience.map(exp => `
      <div class="log-card reveal">
        <div class="log-head">
          <div>
            <div class="log-role">${exp.role}</div>
            <div class="log-org">${exp.company} &bull; ${exp.employmentType}</div>
          </div>
          <div class="log-date">${exp.start} — ${exp.currentlyWorking ? 'Present' : exp.end}</div>
        </div>
        <p class="log-desc">${exp.description || ''}</p>
        ${exp.responsibilities && exp.responsibilities.length ? `<ul class="log-bullets">${exp.responsibilities.map(r => `<li>${r}</li>`).join('')}</ul>` : ''}
        ${exp.achievements && exp.achievements.length ? `<ul class="log-achievements">${exp.achievements.map(a => `<li>✓ ${a}</li>`).join('')}</ul>` : ''}
        ${exp.technologies && exp.technologies.length ? `<div class="log-tags">${exp.technologies.map(t => `<span class="tech-tag">${t}</span>`).join('')}</div>` : ''}
      </div>
    `).join('');
  }

  // ------------------------------------------------------------------
  // Education
  // ------------------------------------------------------------------
  function renderEducation(education) {
    const container = document.getElementById('education-container');
    container.innerHTML = education.map(edu => `
      <div class="log-card reveal">
        <div class="log-head">
          <div>
            <div class="log-role">${edu.degree}, ${edu.field}</div>
            <div class="log-org">${edu.institution}</div>
          </div>
          <div class="log-date">${edu.start} — ${edu.end} &nbsp;|&nbsp; CGPA ${edu.cgpa}</div>
        </div>
        <p class="log-desc">${edu.description || ''}</p>
        ${edu.achievements && edu.achievements.length ? `<ul class="log-achievements">${edu.achievements.map(a => `<li>✓ ${a}</li>`).join('')}</ul>` : ''}
        ${edu.courses && edu.courses.length ? `<div class="log-tags">${edu.courses.map(c => `<span class="pill">${c}</span>`).join('')}</div>` : ''}
      </div>
    `).join('');
  }

  // ------------------------------------------------------------------
  // Certifications
  // ------------------------------------------------------------------

    function renderCertifications(certifications) {
    const container = document.getElementById('certifications-container');

    container.innerHTML = certifications.map(c => `
      <div class="cert-card reveal">

        ${c.certificateImage ? `
        <div class="cert-image">
        <a href="${c.certificateImage}" target="_blank">
        <img src="${c.certificateImage}" alt="${c.name}">
        </a>
        </div>
        ` : ''}

        <div class="cert-content">

          <div class="cert-name">${c.name}</div>

          <div class="cert-issuer">
            ${c.issuer}
          </div>

          

        </div>

      </div>
    `).join('');
  }

  // ------------------------------------------------------------------
  // Achievements
  // ------------------------------------------------------------------
  function renderAchievements(achievements) {
    const container = document.getElementById('achievements-container');
    container.innerHTML = achievements.map(a => `
      <div class="achievement-card reveal">
        <div class="achievement-icon"><i class="fas fa-${a.icon || 'star'}"></i></div>
        <div>
          <div class="achievement-title">${a.title}${a.date ? `<span class="achievement-date">${a.date}</span>` : ''}</div>
          <p class="achievement-desc">${a.description}</p>
        </div>
      </div>
    `).join('');


    
  }

  // ------------------------------------------------------------------
  // Changelog (timeline styled as commits)
  // ------------------------------------------------------------------
  // ------------------------------------------------------------------
  // Milestones — horizontal engineering journey
  // ------------------------------------------------------------------

  function renderTimeline(timeline) {

    const container = document.getElementById('timeline-container');

    if (!container || !timeline || !timeline.length) return;

    const nodes = container.querySelector('#milestone-nodes');
    const detail = container.querySelector('#milestone-detail');
    const counter = container.querySelector('#milestone-counter');
    const prevBtn = container.querySelector('#milestone-prev');
    const nextBtn = container.querySelector('#milestone-next');

    let activeIndex = 0;


    // --------------------------------------------------------------
    // Helpers
    // --------------------------------------------------------------

    function formatDate(dateString) {

      const date = new Date(`${dateString}-01`);

      if (Number.isNaN(date.getTime())) {
        return dateString;
      }

      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        year: 'numeric'
      }).format(date);
    }


    function getType(title) {

      if (/graduat|degree|b\.e\.|education/i.test(title)) {
        return 'Education';
      }

      if (/internship|intern/i.test(title)) {
        return 'Internship';
      }

      if (/lead|gdgc|mentor/i.test(title)) {
        return 'Leadership';
      }

      if (/join|employment|work|tech mahindra/i.test(title)) {
        return 'Career';
      }

      return 'Milestone';
    }


    // --------------------------------------------------------------
    // Render timeline nodes
    // --------------------------------------------------------------

    nodes.innerHTML = timeline.map((item, index) => `
      <button
        class="milestone-node ${index === 0 ? 'is-active' : ''}"
        type="button"
        data-index="${index}"
        aria-label="View milestone: ${item.title}"
        aria-current="${index === 0 ? 'step' : 'false'}"
      >

        <span class="milestone-node-dot"></span>

        <span class="milestone-node-date">
          ${formatDate(item.date)}
        </span>

        <span class="milestone-node-title">
          ${item.title}
        </span>

      </button>
    `).join('');


    // --------------------------------------------------------------
    // Render active milestone
    // --------------------------------------------------------------

    function updateMilestone(index, animate = true, shouldScroll = true) {

      if (index < 0 || index >= timeline.length) return;

      activeIndex = index;

      const item = timeline[index];

      if (animate) {
        detail.classList.add('is-changing');

        setTimeout(() => {
          renderDetail(item);
          detail.classList.remove('is-changing');
        }, 180);

      } else {
        renderDetail(item);
      }

      // Update node states
      nodes.querySelectorAll('.milestone-node').forEach((node, i) => {

        const isActive = i === activeIndex;

        node.classList.toggle('is-active', isActive);

        node.setAttribute(
          'aria-current',
          isActive ? 'step' : 'false'
        );

      });


      // Update counter
      counter.textContent =
        `${String(activeIndex + 1).padStart(2, '0')} / ${String(timeline.length).padStart(2, '0')}`;


      // Update navigation
      prevBtn.disabled = activeIndex === 0;
      nextBtn.disabled = activeIndex === timeline.length - 1;

      if (shouldScroll) {

        // Keep active node visible
        const activeNode =
          nodes.querySelector(`[data-index="${activeIndex}"]`);

        if (activeNode) {

          activeNode.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          });

        }
      }
  
    }  

    // --------------------------------------------------------------
    // Detail renderer
    // --------------------------------------------------------------

    function renderDetail(item) {

      detail.innerHTML = `
        <div class="milestone-detail-meta">

          <span class="milestone-detail-date">
            ${formatDate(item.date)}
          </span>

          <span class="milestone-detail-type">
            ${getType(item.title)}
          </span>

        </div>

        <h3>
          ${item.title}
        </h3>

        <p>
          ${item.description}
        </p>
      `;
    }


    // --------------------------------------------------------------
    // Node interaction
    // --------------------------------------------------------------

    nodes.addEventListener('click', event => {

      const node = event.target.closest('.milestone-node');

      if (!node) return;

      updateMilestone(
        Number(node.dataset.index)
      );

    });


    // --------------------------------------------------------------
    // Arrow controls
    // --------------------------------------------------------------

    prevBtn.addEventListener('click', () => {

      if (activeIndex > 0) {
        updateMilestone(activeIndex - 1);
      }

    });


    nextBtn.addEventListener('click', () => {

      if (activeIndex < timeline.length - 1) {
        updateMilestone(activeIndex + 1);
      }

    });


    // --------------------------------------------------------------
    // Keyboard navigation
    // --------------------------------------------------------------

    container.addEventListener('keydown', event => {

      if (event.key === 'ArrowLeft') {

        event.preventDefault();

        if (activeIndex > 0) {
          updateMilestone(activeIndex - 1);
        }

      }

      if (event.key === 'ArrowRight') {

        event.preventDefault();

        if (activeIndex < timeline.length - 1) {
          updateMilestone(activeIndex + 1);
        }

      }

    });


    // --------------------------------------------------------------
    // Initial state
    // --------------------------------------------------------------

    updateMilestone(0, false, false);

  }

  // ------------------------------------------------------------------
  // Contact / footer
  // ------------------------------------------------------------------
  function renderContact(profile, socials) {
    recipientEmail = profile.email || '';
    document.getElementById('footer-name').textContent = profile.name;

    const details = document.getElementById('contact-details');
    details.innerHTML = `
      ${profile.email ? `<a href="mailto:${profile.email}"><i class="fas fa-envelope"></i> ${profile.email}</a>` : ''}
      ${profile.phone ? `<a href="tel:${profile.phone.replace(/\s+/g, '')}"><i class="fas fa-phone"></i> ${profile.phone}</a>` : ''}
    `;

    const socialsContainer = document.getElementById('socials-container');
    let html = '';
    if (socials.github) html += `<a href="${socials.github}" target="_blank" rel="noopener" aria-label="GitHub"><i class="fab fa-github"></i></a>`;
    if (socials.linkedin) html += `<a href="${socials.linkedin}" target="_blank" rel="noopener" aria-label="LinkedIn"><i class="fab fa-linkedin"></i></a>`;
    if (socials.kaggle) html += `<a href="${socials.kaggle}" target="_blank" rel="noopener" aria-label="Kaggle"><i class="fab fa-kaggle"></i></a>`;
    if (socials.huggingface) html += `<a href="${socials.huggingface}" target="_blank" rel="noopener" aria-label="Hugging Face"><i class="fas fa-robot"></i></a>`;
    socialsContainer.innerHTML = html;

    const year = new Date().getFullYear();
    document.getElementById('current-year').textContent = year;

    
  }

  // ------------------------------------------------------------------
  // Motion: curve draw-in
  // ------------------------------------------------------------------
  function initCurveDraw() {
    const curve = document.getElementById('curve-path');
    if (!curve) return;
    if (prefersReducedMotion) return;
    const length = curve.getTotalLength();
    curve.style.strokeDasharray = length;
    curve.style.strokeDashoffset = length;
    curve.getBoundingClientRect();
    curve.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s';
    requestAnimationFrame(() => { curve.style.strokeDashoffset = '0'; });
  }

  // ------------------------------------------------------------------
  // Motion: scroll reveal
  // ------------------------------------------------------------------
  function initScrollReveal() {
    const targets = document.querySelectorAll('.reveal');
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach(t => t.classList.add('is-visible'));
      return;
    }
    const groups = new Map();
    targets.forEach(t => {
      const parent = t.parentElement;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(t);
    });
    groups.forEach(siblings => siblings.forEach((t, i) => {
      t.style.transitionDelay = `${Math.min(i * 70, 300)}ms`;
    }));

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    targets.forEach(t => observer.observe(t));
  }

  // ------------------------------------------------------------------
  // Theme toggle (dark by default, persisted, no flash on reload)
  // ------------------------------------------------------------------
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  // ------------------------------------------------------------------
  // Mobile nav
  // ------------------------------------------------------------------
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      toggle.classList.toggle('is-open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ------------------------------------------------------------------
  // Contact form — no server, so we hand off to the visitor's own email
  // client via a mailto: link (pre-filled), rather than faking success.
  // ------------------------------------------------------------------
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = form.querySelector('#name').value.trim();
      const senderEmail = form.querySelector('#email').value.trim();
      const message = form.querySelector('#message').value.trim();
      const btn = form.querySelector('.btn-submit');

      if (!recipientEmail) {
        console.error('No recipient email loaded from profile.json yet.');
        return;
      }

      const subject = `Portfolio contact from ${name || 'website visitor'}`;
      const body = `${message}\n\n— ${name}\nReply to: ${senderEmail}`;
      const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      window.location.href = mailtoUrl;

      const originalHtml = btn.innerHTML;
      btn.innerHTML = '<span>Opening your email app…</span>';
      setTimeout(() => { btn.innerHTML = originalHtml; }, 2500);
    });
  }

  
});
