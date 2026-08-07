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
        <h3>// ${cat.category}</h3>
        <div class="pill-row">
          ${cat.skills.map(s => `<span class="pill">${s.name}</span>`).join('')}
        </div>
      </div>
    `).join('');
  }

  // ------------------------------------------------------------------
  // Projects — brief cards (tagline, short description, tech, top metrics, link)
  // ------------------------------------------------------------------
  // ------------------------------------------------------------------
// Projects — brief cards (tagline, short description, tech, metrics, links)
// ------------------------------------------------------------------
  function renderProjects(projects) {
    const container = document.getElementById('projects-container');

    container.innerHTML = projects.map((p) => {

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
            ? `<a href="${p.github}" target="_blank" rel="noopener" class="project-link">[ repo → ]</a>`
            : ''
          }
          ${p.liveDemo
            ? `<a href="${p.liveDemo}" target="_blank" rel="noopener" class="project-link">[ live demo → ]</a>`
            : ''
          }
        </div>
      `;

      return `
        <article class="project-card reveal">

          ${p.thumbnail
            ? `
              <div class="project-image">
                <img src="${p.thumbnail}" alt="${p.name}">
              </div>
            `
            : ''
          }

          <div class="project-head">
            <span class="project-status">
              ${p.status || ''}${p.year ? ' · ' + p.year : ''}
            </span>

            <h3>${p.title || p.name}</h3>

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
              .map(t => `<span class="tech-tag">${t}</span>`)
              .join('')}
          </div>

          ${metricsHtml}

          ${links}

        </article>
      `;
    }).join('');
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
  function renderTimeline(timeline) {
    const container = document.getElementById('timeline-container');
    let major = 1, minor = 0;

    container.innerHTML = timeline.map(item => {
      const tag = `v${major}.${minor}.0`;
      if (/graduat/i.test(item.title)) { major += 1; minor = 0; } else { minor += 1; }

      return `
        <div class="commit reveal">
          <span class="commit-hash">${tag}</span>
          <span class="commit-date">${item.date}</span>
          <span class="commit-msg"><strong>${verb(item.title)}:</strong> ${item.description}</span>
        </div>
      `;
    }).join('');
  }

  function verb(title) {
    if (/started|began/i.test(title)) return 'init';
    if (/graduat/i.test(title)) return 'release';
    if (/built|built|designed|developed/i.test(title)) return 'feat';
    if (/joined|internship/i.test(title)) return 'merge';
    if (/completed|concluded/i.test(title)) return 'close';
    return 'update';
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
