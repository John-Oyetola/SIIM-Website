// Hey Service - Main JavaScript

// Exit Demo Mode function
window.exitDemo = function(e) {
    if (e) e.preventDefault();
    localStorage.removeItem('heyServiceDemo');
    localStorage.removeItem('heyServiceRole');
    localStorage.removeItem('heyServiceBrand');
    window.location.href = 'index.html';
};

// Helper to guarantee admin modal containers exist in DOM globally
window.ensureAdminModalsExist = function() {
    if (!document.getElementById('pendingApprovalsModal') && typeof window.injectPendingApprovalsModalHTML === 'function') {
        window.injectPendingApprovalsModalHTML();
    }
    if (!document.getElementById('macroAnalyticsModal') && typeof window.injectMacroAnalyticsModalHTML === 'function') {
        window.injectMacroAnalyticsModalHTML();
    }
};

// Dynamic Role-Aware Navbar Generator
window.renderDynamicNavbar = function() {
    const currentPath = window.location.pathname.toLowerCase();
    const isPublicPage = currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('fmp%20website/') || currentPath.endsWith('fmp website/') || currentPath.endsWith('login.html') || currentPath.endsWith('solutions.html') || currentPath.endsWith('technology.html') || currentPath.endsWith('contact.html');
    if (isPublicPage) {
        return;
    }

    const navElem = document.getElementById('dynamicNavLinks') || document.querySelector('nav .nav-links') || document.querySelector('nav');

    // Clear residual session role if user explicitly logged out
    if (sessionStorage.getItem('siim_logged_out') === 'true') {
        localStorage.removeItem('siim_user_role');
        localStorage.removeItem('heyServiceRole');
    }

    let role = localStorage.getItem('siim_user_role') || localStorage.getItem('heyServiceRole');
    if (!role && sessionStorage.getItem('siim_logged_out') !== 'true') {
        role = 'admin'; // default role fallback for active session
    }

    let siteId = localStorage.getItem('heyServiceSiteId') || 'wagamama-leeds';
    const isWaterPage = window.location.pathname.includes('water');
    const facilityUrl = isWaterPage ? `facility-water.html?id=${encodeURIComponent(siteId)}` : `custom-site.html?id=${encodeURIComponent(siteId)}`;

    let navHtml = '';

    if (role === 'admin') {
        // ADMIN NAVBAR (Home, Pending Approvals, Macro Analytics)
        navHtml = `
            <li><a href="index.html" class="nav-link">Home</a></li>
            <li><button type="button" class="nav-link btn-nav-modal" id="navPendingApprovals">Pending Approvals</button></li>
            <li><button type="button" class="nav-link btn-nav-modal" id="navMacroAnalytics">Macro Analytics</button></li>
        `;
    } else if (role === 'engineer') {
        // ENGINEER NAVBAR ([Home] [Engineer Portal])
        navHtml = `
            <li><a href="index.html" class="nav-link">Home</a></li>
            <li><a href="engineer-portal.html" class="nav-link" id="navEngineerPortal">Engineer Portal</a></li>
        `;
    } else if (role === 'client') {
        // CLIENT NAVBAR ([Home] [My Facility])
        navHtml = `
            <li><a href="index.html" class="nav-link">Home</a></li>
            <li><a href="${facilityUrl}" class="nav-link" id="navMyFacility">My Facility</a></li>
        `;
    } else {
        // Unauthenticated Navigation
        navHtml = `
            <li><a href="index.html" class="nav-link">Home</a></li>
            <li><a href="login.html" class="nav-link">Sign In</a></li>
        `;
    }

    if (navElem) {
        if (navElem.tagName.toLowerCase() === 'ul') {
            navElem.innerHTML = navHtml;
        } else if (navElem.tagName.toLowerCase() === 'nav') {
            navElem.innerHTML = `<ul id="dynamicNavLinks" class="nav-links">${navHtml}</ul>`;
        } else {
            navElem.innerHTML = `<ul class="nav-links">${navHtml}</ul>`;
        }
    }

    // Highlight active page link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const links = document.querySelectorAll('#dynamicNavLinks a, .nav-links a');
    links.forEach(a => {
        const href = a.getAttribute('href');
        if (href && href.includes(currentPage) && currentPage !== 'index.html' && href !== '#') {
            a.classList.add('active');
        }
    });

    if (typeof window.renderNavRightControls === 'function') {
        window.renderNavRightControls();
    }
};

// Right-Side Controls & User Avatar Component
window.renderNavRightControls = function() {
    const currentPath = window.location.pathname.toLowerCase();
    const isPublicPage = currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('fmp%20website/') || currentPath.endsWith('fmp website/') || currentPath.endsWith('login.html') || currentPath.endsWith('solutions.html') || currentPath.endsWith('technology.html') || currentPath.endsWith('contact.html');
    if (isPublicPage) {
        return;
    }

    const rightContainer = document.getElementById('navRightControls') || document.querySelector('.nav-right-controls') || document.querySelector('.header-actions');
    if (!rightContainer) return;

    if (sessionStorage.getItem('siim_logged_out') === 'true') {
        localStorage.removeItem('siim_user_role');
        localStorage.removeItem('heyServiceRole');
    }

    let role = localStorage.getItem('siim_user_role') || localStorage.getItem('heyServiceRole');
    if (!role && sessionStorage.getItem('siim_logged_out') !== 'true') {
        role = 'admin';
    }

    if (!role) {
        // Unauthenticated controls (Login / Signup)
        rightContainer.innerHTML = `
            <div class="nav-right-controls-group" style="display: flex; align-items: center; gap: 1rem;">
                <a href="login.html" class="btn btn-outline" style="padding: 0.45rem 1rem; font-size: 0.85rem; font-weight: 700; border-radius: 8px;">Sign In</a>
                <a href="signup.html" class="btn btn-primary" style="padding: 0.45rem 1rem; font-size: 0.85rem; font-weight: 700; border-radius: 8px;">Create Account</a>
                <button id="themeToggleBtn" class="btn-theme-toggle">NIGHT MODE</button>
            </div>
        `;
        return;
    }

    let fullName = localStorage.getItem('heyServiceFullName') || localStorage.getItem('heyServiceUser') || 'User';
    if (fullName.includes('@')) fullName = fullName.split('@')[0];

    let roleLabel = 'Client Manager';
    if (role === 'admin') roleLabel = 'Admin';
    else if (role === 'engineer') roleLabel = 'Field Engineer';
    else if (role === 'client') roleLabel = 'Client Manager';

    let switchConsoleBtn = role === 'admin' ? `<a href="systems.html" class="switch-console-pill" style="margin-right: 0.2rem;">&larr; Switch Console</a>` : '';

    rightContainer.innerHTML = `
        <div class="nav-right-controls-group" style="display: flex; align-items: center; gap: 1rem;">
            ${switchConsoleBtn}
            <button id="logoutBtn" onclick="window.logout && window.logout(event)" class="btn-logout">Logout</button>
            <button id="themeToggleBtn" class="btn-theme-toggle">NIGHT MODE</button>

            <div class="user-profile-badge" style="display: flex; align-items: center; gap: 0.6rem;">
                <div class="user-avatar-circle" style="width: 34px; height: 34px; border-radius: 50%; background: rgba(0, 229, 255, 0.12); border: 1px solid rgba(6, 182, 212, 0.4); display: flex; align-items: center; justify-content: center; color: #06b6d4; flex-shrink: 0;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </div>
                <div style="display: flex; flex-direction: column; text-align: left; line-height: 1.2;">
                    <span id="userBadgeName" style="font-weight: 700; font-size: 0.88rem; color: #ffffff;">${fullName}</span>
                    <span id="userBadgeRole" style="font-size: 0.75rem; color: #94a3b8; font-weight: 600;">${roleLabel}</span>
                </div>
            </div>
        </div>
    `;

    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('heyServiceTheme', isDark ? 'dark' : 'light');
        });
    }
};

// === GLOBAL TOAST NOTIFICATION HELPER ===
window.showToast = function(message) {
    let toast = document.getElementById('siimToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'siimToast';
        toast.className = 'siim-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
};

// === MACRO ANALYTICS EXECUTIVE MODAL ENGINE ===
window.renderMacroAnalyticsContent = function() {
    const total = (typeof SITE_DATA !== 'undefined' && SITE_DATA.length) ? SITE_DATA.length : 40;
    const sites = typeof SITE_DATA !== 'undefined' ? SITE_DATA : [];
    const compliant = sites.filter(s => s.status === 'safe' || s.status === 'compliant').length;
    const actionDue = sites.filter(s => s.status === 'warning' || s.status === 'danger' || s.status === 'action-due' || s.status === 'critical').length;
    const highRisk = sites.filter(s => s.status === 'danger' || s.status === 'critical').length;
    const complianceRate = total > 0 ? ((compliant / total) * 100).toFixed(1) : '92.4';

    const gridContainer = document.getElementById('macroAnalyticsGrid');
    if (!gridContainer) return;

    gridContainer.innerHTML = `
        <div class="analytics-card">
          <div class="card-meta-tag">PORTFOLIO INTEGRITY</div>
          <h3 class="analytics-stat">${complianceRate}% Estate Compliance</h3>
          <p class="analytics-sub">${compliant} Optimal Facilities &nbsp;|&nbsp; ${actionDue} Action Required</p>
          <hr class="analytics-divider" />
          <p class="analytics-explainer">
            <strong>What this means:</strong> Real-time operational benchmark across all 40 commercial sites. Monitors combined ventilation duct safety and hydraulic drainage to verify environmental health standards.
          </p>
        </div>

        <div class="analytics-card">
          <div class="card-meta-tag">PREVENTATIVE FORECAST</div>
          <h3 class="analytics-stat" style="color: #f97316;">14-Day Servicing Load</h3>
          <p class="analytics-sub">${highRisk} Urgent Cleans &nbsp;|&nbsp; ${Math.max(0, actionDue - highRisk)} Descales Scheduled</p>
          <hr class="analytics-divider" />
          <p class="analytics-explainer">
            <strong>What this means:</strong> Predictive maintenance pipeline. Identifies facilities approaching maximum TR19 grease saturation or acoustic flow impedance before kitchen service disruptions occur.
          </p>
        </div>

        <div class="analytics-card">
          <div class="card-meta-tag">INSURANCE & WARRANTY</div>
          <h3 class="analytics-stat" style="color: #22c55e;">TR19 Certified Compliance</h3>
          <p class="analytics-sub">${highRisk === 0 ? 'Zero Breaches' : highRisk + ' High-Risk Attention Required'}</p>
          <hr class="analytics-divider" />
          <p class="analytics-explainer">
            <strong>What this means:</strong> Commercial property insurance compliance tier. Validates continuous sensor telemetry against UK insurer fire safety warranties to ensure liability protection.
          </p>
        </div>
    `;
};

window.injectMacroAnalyticsModalHTML = function() {
    if (document.getElementById('macroAnalyticsModal')) return;

    const modalDiv = document.createElement('div');
    modalDiv.id = 'macroAnalyticsModal';
    modalDiv.className = 'modal-overlay';
    modalDiv.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 17, 31, 0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); z-index: 9999; align-items: center; justify-content: center; padding: 1.5rem;';

    modalDiv.innerHTML = `
        <div class="modal-content glass-modal" style="background: rgba(0, 24, 44, 0.95); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 16px; width: 100%; max-width: 840px; max-height: 90vh; overflow-y: auto; padding: 2.25rem; box-shadow: 0 20px 50px rgba(0,0,0,0.8); position: relative; color: #ffffff;">
            <button type="button" class="modal-close-btn" id="closeMacroModalX" onclick="closeMacroAnalyticsModal()" aria-label="Close modal">&times;</button>
            
            <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.35rem;">
                <span style="font-size: 1.4rem;">📊</span>
                <h2 style="font-size: 1.5rem; font-weight: 800; color: #ffffff; margin: 0;">Network Macro Telemetry &amp; BESA TR19 Fleet Analytics</h2>
            </div>
            <p style="font-size: 0.9rem; color: #94a3b8; margin-top: 0; margin-bottom: 2rem; line-height: 1.5;">
                Estate-wide telemetry rollup, underwriter compliance scoring, and preventative servicing forecasting across 40 commercial venues.
            </p>

            <!-- Executive Metric Grid (3 Core KPI Cards) -->
            <div id="macroAnalyticsGrid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
                <!-- Populated dynamically -->
            </div>

            <!-- Actions -->
            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 1.5rem;">
                <button onclick="exportFleetAuditCsv()" class="btn btn-primary" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.7rem 1.4rem; font-weight: 700; background: linear-gradient(135deg, #06b6d4, #0284c7); border: none; border-radius: 8px; color: #ffffff; cursor: pointer;">
                    📄 Export Fleet Compliance Audit (CSV)
                </button>
                <button type="button" class="btn-cancel" id="closeMacroModalBtn" onclick="closeMacroAnalyticsModal()" style="padding: 0.7rem 1.4rem; font-weight: 600; background: transparent; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; color: #94a3b8; cursor: pointer;">
                    Close Modal
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modalDiv);

    modalDiv.addEventListener('click', (e) => {
        if (e.target === modalDiv) closeMacroAnalyticsModal();
    });

    renderMacroAnalyticsContent();
};

window.openMacroAnalyticsModal = function() {
    if (typeof window.ensureAdminModalsExist === 'function') {
        window.ensureAdminModalsExist();
    } else {
        window.injectMacroAnalyticsModalHTML();
    }
    renderMacroAnalyticsContent();
    const modal = document.getElementById('macroAnalyticsModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
    }
};

window.closeMacroAnalyticsModal = function() {
    const modal = document.getElementById('macroAnalyticsModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
};

window.exportFleetAuditCsv = function() {
    const sites = typeof SITE_DATA !== 'undefined' ? SITE_DATA : [];
    
    let csvRows = [];
    csvRows.push(['Site Name', 'Region', 'TR19 Score', 'Grease Level', 'Hydraulic Flow %', 'Compliance Status'].map(v => `"${v}"`).join(','));

    sites.forEach(site => {
        const siteName = `${site.brand} (${site.location.split(',')[0]})`;
        const region = site.location;
        const tr19Score = `${Math.max(5, 100 - site.grease)}%`;
        const greaseLevel = `${(site.grease * 0.05).toFixed(1)} mm (${site.grease}%)`;
        const flowPct = site.grease > 45 ? `${Math.max(35, 100 - site.grease)}%` : '92.4%';
        const status = site.grease <= 45 ? 'Insured & TR19 Certified' : (site.grease > 80 ? 'Non-Compliant (Critical Alert)' : 'Action Required (Servicing Due)');

        csvRows.push([siteName, region, tr19Score, greaseLevel, flowPct, status].map(v => `"${v.replace(/"/g, '""')}"`).join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'SIIM_Fleet_Audit_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (typeof window.showToast === 'function') {
        window.showToast("📄 Compliance report exported successfully.");
    }
};

document.addEventListener('DOMContentLoaded', () => {

    // Guarantee admin modal containers exist globally
    if (typeof window.ensureAdminModalsExist === 'function') {
        window.ensureAdminModalsExist();
    }

    // Demo Mode URL check
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('demo') === 'true') {
        localStorage.setItem('heyServiceRole', 'user');
        localStorage.setItem('heyServiceBrand', 'all');
        localStorage.setItem('heyServiceDemo', 'true');
    }

    if (localStorage.getItem('heyServiceDemo') === 'true') {
        // Inject the demo banner at the top of the body
        if (!document.querySelector('.demo-banner')) {
            const banner = document.createElement('div');
            banner.className = 'demo-banner';
            banner.innerHTML = '<span>SIIM Live Preview — Read-Only Demo Mode</span> <a href="#" onclick="window.exitDemo(event)">Exit Demo</a>';
            document.body.insertBefore(banner, document.body.firstChild);
        }
        
        // Change any logout buttons to exit demo
        document.querySelectorAll('.btn-logout, .profile-signout').forEach(btn => {
            btn.textContent = 'Exit Demo';
            btn.onclick = function(e) {
                window.exitDemo(e);
            };
            btn.removeAttribute('onclick');
        });

        // Hide add site button on dashboard if present
        const addSiteBtn = document.querySelector('button[onclick="openAddSiteModal()"]');
        if (addSiteBtn) {
            addSiteBtn.style.display = 'none';
        }
    }




    // Universal Password Visibility Toggle Handler
    document.querySelectorAll('.password-toggle-btn, #togglePasswordBtn, #toggleRegPasswordBtn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const wrapper = btn.closest('div');
            const input = wrapper ? wrapper.querySelector('input') : null;
            if (!input) return;

            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';

            const eyeOpen = btn.querySelector('.eye-icon');
            const eyeOff = btn.querySelector('.eye-off-icon');
            if (eyeOpen && eyeOff) {
                eyeOpen.style.display = isPassword ? 'none' : 'block';
                eyeOff.style.display = isPassword ? 'block' : 'none';
            }
        });
    });

    // === Secure Server-Side Login Handler ===
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const usernameInput = document.getElementById('username').value.trim();
            const passwordInput = document.getElementById('password').value.trim();
            const errorMessage = document.getElementById('errorMessage');
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            // UI Feedback
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = 'Authenticating...';
            submitBtn.disabled = true;

            try {
                const response = await fetch('https://heyservicedashboard.onrender.com/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify({ username: usernameInput, password: passwordInput })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    sessionStorage.removeItem('siim_logged_out');
                    localStorage.setItem('siim_user_role', result.role || 'client');
                    localStorage.setItem('heyServiceRole', result.role || 'client');
                    localStorage.setItem('heyServiceUser', result.username);
                    localStorage.setItem('heyServiceBrand', result.assigned_brand || 'all');
                    localStorage.setItem('heyServiceCompany', result.company || '');
                    window.location.href = 'dashboard.html';
                } else {
                    if (errorMessage) {
                        errorMessage.style.display = 'block';
                        errorMessage.textContent = result.error || 'Invalid username or password.';
                    }
                    submitBtn.textContent = originalBtnText;
                    submitBtn.disabled = false;
                }
            } catch (error) {
                console.error('Login error:', error);
                if (errorMessage) {
                    errorMessage.style.display = 'block';
                    errorMessage.textContent = 'Connection error. Make sure server.py is running.';
                }
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

    // Dark Mode Toggle Logic
    const themeToggleBtn = document.getElementById('themeToggleBtn');

    const LOGO_HEADER_LIGHT = 'Images/logo_siim_final.png';
    const LOGO_HEADER_DARK  = 'Images/logo_siim_final_dark.png';
    const LOGO_FOOTER       = 'Images/logo_siim_final_dark.png';

    function applyLogos(isDark) {
        document.querySelectorAll('.logo-container img').forEach(img => {
            img.src = isDark ? LOGO_HEADER_DARK : LOGO_HEADER_LIGHT;
        });
        document.querySelectorAll('.footer-logo-container-rebranded img').forEach(img => {
            img.src = LOGO_FOOTER;
        });
    }

    function updateToggleSwitch(isDark) {
        const switchLabel = document.querySelector('.theme-toggle-switch .switch-label');
        if (switchLabel) {
            switchLabel.textContent = isDark ? 'Night Mode' : 'Day Mode';
        }
    }

    // Apply theme + logos on page load
    const savedTheme = localStorage.getItem('heyServiceTheme');
    
    // Default to dark theme for ALL pages if savedTheme is not set (or is set to 'dark')
    if (savedTheme === 'dark' || savedTheme === null) {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
    const isCurrentlyDark = document.body.classList.contains('dark-theme');
    applyLogos(isCurrentlyDark);
    updateToggleSwitch(isCurrentlyDark);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('heyServiceTheme', isDark ? 'dark' : 'light');
            applyLogos(isDark);
            updateToggleSwitch(isDark);
        });
    }

    // Update user badge elements to display strictly full name without raw email or appended roles
    let displayName = localStorage.getItem('heyServiceFullName');
    if (!displayName) {
        const loggedUserEmail = localStorage.getItem('heyServiceUser') || '';
        if (loggedUserEmail && loggedUserEmail.includes('@')) {
            displayName = loggedUserEmail.split('@')[0];
        } else {
            displayName = loggedUserEmail || 'User';
        }
    }
    document.querySelectorAll('#userBadge, #roleBadge').forEach(badge => {
        badge.textContent = displayName;
    });

    if (window.supabaseClient && window.supabaseClient.auth) {
        window.supabaseClient.auth.getUser().then(({ data }) => {
            if (data && data.user) {
                const meta = data.user.user_metadata || {};
                const name = meta.full_name || meta.name || (data.user.email ? data.user.email.split('@')[0] : null);
                if (name) {
                    localStorage.setItem('heyServiceFullName', name);
                    document.querySelectorAll('#userBadge, #roleBadge').forEach(badge => {
                        badge.textContent = name;
                    });
                }
            }
        }).catch(() => {});
    }

    // Role applier (Handles view based on stored role)
    const currentRole = localStorage.getItem('heyServiceRole');
    if (currentRole) {
        document.body.setAttribute('data-role', currentRole);

        // Update navigation UI conditionally based on role
        const engOnlyItems = document.querySelectorAll('.engineer-only');
        const clientOnlyItems = document.querySelectorAll('.client-only');

        if (currentRole === 'user' || currentRole === 'client') {
            engOnlyItems.forEach(item => item.style.display = 'none');
            clientOnlyItems.forEach(item => item.style.display = 'block');
        } else if (currentRole === 'engineer') {
            engOnlyItems.forEach(item => item.style.display = 'block');
            clientOnlyItems.forEach(item => item.style.display = 'none');
        }
    }

    // Render Dynamic Role-Based Navbar
    if (typeof window.renderDynamicNavbar === 'function') {
        window.renderDynamicNavbar();
    }

    // === Login Welcome Banner (dashboard page) ===
    const welcomeBanner = document.getElementById('loginWelcomeBanner');
    if (welcomeBanner) {
        const bannerShown = sessionStorage.getItem('welcomeBannerShown');
        if (!bannerShown) {
            const user    = localStorage.getItem('heyServiceUser')    || 'User';
            const role    = localStorage.getItem('heyServiceRole')    || 'user';
            const company = localStorage.getItem('heyServiceCompany') || 'SIIM';
            const roleLabel = role === 'engineer' ? 'Engineer (Admin)' : 'Client';

            welcomeBanner.innerHTML = `
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <div>
                    <strong>Logged in as: ${roleLabel}</strong><br>
                    <span>${user} &mdash; ${company}</span>
                </div>
                <button class="welcome-banner-close" onclick="this.parentElement.style.display='none'" aria-label="Dismiss">&times;</button>
            `;
            welcomeBanner.style.display = 'flex';
            sessionStorage.setItem('welcomeBannerShown', '1');

            // Auto-dismiss after 6 seconds
            setTimeout(() => {
                welcomeBanner.style.opacity = '0';
                setTimeout(() => welcomeBanner.style.display = 'none', 400);
            }, 6000);
        }
    }

    // === Quote / Contact Form Feedback ===
    const quoteForm = document.getElementById('quoteContactForm');
    if (quoteForm) {
        quoteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('quoteSubmitBtn');
            const successMsg = document.getElementById('quoteSuccessMsg');
            const originalText = btn.textContent;

            // Button loading state
            btn.textContent = 'Sending...';
            btn.disabled = true;

            try {
                const formData = new FormData(quoteForm);
                const response = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(Object.fromEntries(formData))
                });

                if (response.ok) {
                    // Real success — hide form, show confirmation
                    quoteForm.style.display = 'none';
                    if (successMsg) {
                        successMsg.style.display = 'flex';
                        successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                } else {
                    btn.textContent = originalText;
                    btn.disabled = false;
                    alert('Sorry, there was a problem sending your request. Please email us directly at enquiries@theheygroup.net');
                }
            } catch (err) {
                btn.textContent = originalText;
                btn.disabled = false;
                alert('Connection error. Please email us directly at enquiries@theheygroup.net');
            }
        });
    }

    // Close mobile nav when clicking any link and handle smooth scroll
    const navLinksList = document.querySelectorAll('.nav-links a');
    const navToggles = document.querySelectorAll('.hamburger-toggle');
    navLinksList.forEach(link => {
        link.addEventListener('click', (e) => {
            // Close mobile menu
            navToggles.forEach(toggle => toggle.checked = false);
            
            // Extract the target hash (e.g. #quote)
            const href = link.getAttribute('href');
            if (href) {
                let targetId = '';
                if (href.startsWith('#')) {
                    targetId = href;
                } else if (href.includes('#')) {
                    // Extract hash if it starts with index.html#quote
                    const urlObj = new URL(href, window.location.href);
                    if (urlObj.pathname === window.location.pathname) {
                        targetId = urlObj.hash;
                    }
                }
                
                if (targetId) {
                    const targetEl = document.querySelector(targetId);
                    if (targetEl) {
                        e.preventDefault();
                        // Small timeout lets the menu closing animation start before jumping
                        setTimeout(() => targetEl.scrollIntoView({ behavior: 'smooth' }), 150);
                    }
                }
            }
        });
    });

    // Global Search Logic
    const searchForm = document.getElementById('globalSearchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = document.getElementById('searchInput').value.toLowerCase().trim();
            if (!query) return;

            // Simple mock search index mapping keywords to pages
            const index = [
                { url: 'dashboard.html', terms: ['dashboard', 'sites', 'north', 'east', 'west', 'south', 'status', 'overview', 'monitored'] },
                { url: 'site-details.html', terms: ['details', 'demister', 'emergency', 'report', 'gauge', 'temperature', 'latency', 'cleaning'] },
                { url: 'login.html', terms: ['login', 'account', 'password', 'sign'] },
                { url: 'index.html', terms: ['home', 'monitoring', 'features', 'alert', 'operations', 'visualize'] }
            ];

            let foundUrl = 'index.html'; // default fallback pattern
            for (let page of index) {
                if (page.terms.some(term => query.includes(term) || term.includes(query))) {
                    foundUrl = page.url;
                    break;
                }
            }

            // Redirect with query parameter
            window.location.href = foundUrl + '?search=' + encodeURIComponent(query);
        });
    }

    // Auto-highlight exact text logic on load
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search');
    if (searchParam) {
        setTimeout(() => {
            window.find(searchParam); // Natively highlights searched text
        }, 500);
    }

    // === Mailto Email Submission Engine ===

    // Universal Mailto Form Handler
    const mailtoForms = document.querySelectorAll('.mailto-form');
    mailtoForms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // Extract Subject from form dataset
            const subject = encodeURIComponent(form.getAttribute('data-subject') || "New Website Submission");

            // Extract all inputs matching 'name'
            let bodyText = "Hello Admin,\n\nA new submission has been received from the SIIM Portal:\n\n";
            bodyText += "---------------------------------------\n";

            const inputs = form.querySelectorAll('input[name], select[name], textarea[name]');
            inputs.forEach(input => {
                const title = input.getAttribute('name');
                const val = input.value;
                bodyText += `${title}: ${val}\n`;
            });
            bodyText += "---------------------------------------\n";

            const bodyEncoded = encodeURIComponent(bodyText);

            // Re-route browser strictly to pre-filled email native client
            window.location.href = `mailto:johnoyetolaoluwafemi113@gmail.com?subject=${subject}&body=${bodyEncoded}`;

            // Reset and cleanly close out modal if it resides inside one
            form.reset();
            const modal = form.closest('.modal-overlay');
            if (modal) {
                modal.classList.remove('active');
                setTimeout(() => modal.style.display = 'none', 300);
            }
        });
    });

    // === Create Account Modal Triggers ===
    const openCreateBtn = document.getElementById('openCreateAccountBtn');
    const closeCreateBtn = document.getElementById('closeCreateAccountBtn');
    const createModal = document.getElementById('createAccountModal');

    if (openCreateBtn && createModal) {
        openCreateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            createModal.style.display = 'flex';
            setTimeout(() => createModal.classList.add('active'), 10);
        });
    }

    if (closeCreateBtn && createModal) {
        closeCreateBtn.addEventListener('click', () => {
            createModal.classList.remove('active');
            setTimeout(() => createModal.style.display = 'none', 300);
        });
        createModal.addEventListener('click', (e) => {
            if (e.target === createModal) {
                createModal.classList.remove('active');
                setTimeout(() => createModal.style.display = 'none', 300);
            }
        });
    }

    // === Create Account Form Submission (via API) ===
    const createAccountForm = document.getElementById('createAccountForm');
    if (createAccountForm) {
        createAccountForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('regSubmitBtn');
            const msg = document.getElementById('createAccountMsg');
            const origText = btn.textContent;
            btn.textContent = 'Creating...';
            btn.disabled = true;

            try {
                const response = await fetch('https://heyservicedashboard.onrender.com/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify({
                        company: document.getElementById('regCompany').value.trim(),
                        email: document.getElementById('regEmail').value.trim(),
                        username: document.getElementById('regUsername').value.trim(),
                        password: document.getElementById('regPassword').value.trim()
                    })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    msg.style.display = 'block';
                    msg.style.backgroundColor = 'rgba(46,125,50,0.1)';
                    msg.style.color = 'var(--color-success)';
                    msg.textContent = result.message;
                    createAccountForm.reset();
                    setTimeout(() => {
                        createModal.classList.remove('active');
                        setTimeout(() => { createModal.style.display = 'none'; msg.style.display = 'none'; }, 300);
                    }, 2500);
                } else {
                    msg.style.display = 'block';
                    msg.style.backgroundColor = 'rgba(198,40,40,0.1)';
                    msg.style.color = 'var(--color-danger)';
                    msg.textContent = result.error || 'Registration failed.';
                }
            } catch (error) {
                msg.style.display = 'block';
                msg.style.backgroundColor = 'rgba(198,40,40,0.1)';
                msg.style.color = 'var(--color-danger)';
                msg.textContent = 'Connection error. Make sure server.py is running.';
            }

            btn.textContent = origText;
            btn.disabled = false;
        });
    }

    // === Forgot Password Modal Triggers ===
    const openForgotBtn = document.getElementById('openForgotPasswordBtn');
    const closeForgotBtn = document.getElementById('closeForgotPasswordBtn');
    const forgotModal = document.getElementById('forgotPasswordModal');

    if (openForgotBtn && forgotModal) {
        openForgotBtn.addEventListener('click', (e) => {
            e.preventDefault();
            forgotModal.style.display = 'flex';
            setTimeout(() => forgotModal.classList.add('active'), 10);
        });
    }

    if (closeForgotBtn && forgotModal) {
        closeForgotBtn.addEventListener('click', () => {
            forgotModal.classList.remove('active');
            setTimeout(() => forgotModal.style.display = 'none', 300);
        });
        forgotModal.addEventListener('click', (e) => {
            if (e.target === forgotModal) {
                forgotModal.classList.remove('active');
                setTimeout(() => forgotModal.style.display = 'none', 300);
            }
        });
    }

    // === Forgot Password Form Submission (via API) ===
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('fpSubmitBtn');
            const msg = document.getElementById('forgotPasswordMsg');
            const origText = btn.textContent;
            btn.textContent = 'Resetting...';
            btn.disabled = true;

            try {
                const response = await fetch('https://heyservicedashboard.onrender.com/api/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify({
                        email: document.getElementById('fpEmail').value.trim(),
                        username: document.getElementById('fpUsername').value.trim(),
                        newPassword: document.getElementById('fpNewPassword').value.trim()
                    })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    msg.style.display = 'block';
                    msg.style.backgroundColor = 'rgba(46,125,50,0.1)';
                    msg.style.color = 'var(--color-success)';
                    msg.textContent = result.message;
                    forgotPasswordForm.reset();
                    setTimeout(() => {
                        forgotModal.classList.remove('active');
                        setTimeout(() => { forgotModal.style.display = 'none'; msg.style.display = 'none'; }, 300);
                    }, 2500);
                } else {
                    msg.style.display = 'block';
                    msg.style.backgroundColor = 'rgba(198,40,40,0.1)';
                    msg.style.color = 'var(--color-danger)';
                    msg.textContent = result.error || 'Password reset failed.';
                }
            } catch (error) {
                msg.style.display = 'block';
                msg.style.backgroundColor = 'rgba(198,40,40,0.1)';
                msg.style.color = 'var(--color-danger)';
                msg.textContent = 'Connection error. Make sure server.py is running.';
            }

            btn.textContent = origText;
            btn.disabled = false;
        });
    }

    // === Avatar Profile Dropdown & Alarm Logic ===
    const profileWidgets = document.querySelectorAll('.profile-widget');
    const profileDropdowns = document.querySelectorAll('#profileDropdown');
    const dropdownUsernameTexts = document.querySelectorAll('#dropdownUsernameText');
    const alarmToggles = document.querySelectorAll('#alarmToggle');
    const alarmModals = document.querySelectorAll('#alarmSummaryModal');

    // Grab the literal logged in user from caching engine natively
    const storedUsername = localStorage.getItem('heyServiceUser') || 'Demo User';

    // Inject literal username strictly into the dropdowns
    dropdownUsernameTexts.forEach(txt => txt.textContent = storedUsername);

    // Profile Dropdown Interactions
    profileWidgets.forEach((widget, index) => {
        widget.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent window click closure immediately
            const dropdown = profileDropdowns[index];
            if (dropdown) {
                const isHidden = dropdown.style.display === 'none';
                // Toggle display cleanly without destroying styles
                dropdown.style.display = isHidden ? 'block' : 'none';
                widget.style.borderColor = isHidden ? 'var(--theme-secondary)' : 'var(--border-color)';
            }
        });
    });

    // Close Modals on an outside native window click
    document.addEventListener('click', () => {
        profileDropdowns.forEach((dropdown, index) => {
            if (dropdown.style.display === 'block') {
                dropdown.style.display = 'none';
                if (profileWidgets[index]) profileWidgets[index].style.borderColor = 'var(--border-color)';
            }
        });
    });

    // Prevent dropdown self-closing blindly when interacting inside it
    profileDropdowns.forEach(dropdown => {
        dropdown.addEventListener('click', (e) => e.stopPropagation());
    });

    // Engineer Alarm Security Script Execution
    if (localStorage.getItem('heyServiceRole') === 'engineer') {
        alarmToggles.forEach((toggle, index) => {
            toggle.style.display = 'block'; // Visibly unhide button universally 
            toggle.addEventListener('click', () => {
                if (alarmModals[index]) alarmModals[index].style.display = 'block';
            });
        });

        // Auto-show daily alarm definitively on their very first session load
        if (!sessionStorage.getItem('engineerAlarmSeen')) {
            setTimeout(() => {
                if (alarmModals[0]) alarmModals[0].style.display = 'block';
                sessionStorage.setItem('engineerAlarmSeen', 'true');
            }, 1200);
        }
    }
});

// Logout function
function logout(e) {
    if (e && e.preventDefault) e.preventDefault();

    localStorage.clear();
    sessionStorage.clear();

    if (window.supabaseClient && window.supabaseClient.auth) {
        window.supabaseClient.auth.signOut().catch(() => {});
    }

    window.location.href = 'login.html';
}
window.logout = logout;

// === Full Site Google Translate Integration ===
window.googleTranslateElementInit = function() {
    new google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'en,fr,es,de,it,pt,zh-CN,ja,ar,hi',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false
    }, 'google_translate_element');
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Remove the old custom lang toggle if it exists
    const oldToggle = document.getElementById('langToggle');
    if (oldToggle) {
        oldToggle.remove();
    }

    // 2. Create the Google Translate element container
    const translateDiv = document.createElement('div');
    translateDiv.id = 'google_translate_element';
    // Style it to fit neatly in the header
    translateDiv.style.display = 'inline-block';
    translateDiv.style.marginRight = '10px';
    translateDiv.style.verticalAlign = 'middle';
    translateDiv.style.overflow = 'hidden';

    // 3. Insert it into the header (before themeToggleBtn)
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn && themeBtn.parentNode) {
        themeBtn.parentNode.insertBefore(translateDiv, themeBtn);
    }

    // 4. Inject the Google Translate Script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.body.appendChild(script);
    
    // 5. Hide the Google Translate banner completely
    const style = document.createElement('style');
    style.innerHTML = `
        /* Hide the top translation banner */
        .goog-te-banner-frame.skiptranslate, .goog-te-banner-frame, iframe.goog-te-banner-frame { display: none !important; visibility: hidden !important; }
        /* Prevent body from shifting down */
        body { top: 0px !important; position: static !important; }
        html { top: 0px !important; position: static !important; }
        /* Hide the original text popup on hover */
        #goog-gt-tt, .goog-te-balloon-frame { display: none !important; visibility: hidden !important; }
        /* Remove the yellow highlight on translated text */
        .goog-text-highlight { background: none !important; background-color: transparent !important; box-shadow: none !important; border: none !important; }
        /* Clean up the dropdown widget styling */
        .goog-te-gadget-icon { display: none; }
        .goog-te-gadget-simple { background-color: transparent !important; border: 1px solid rgba(128,128,128,0.3) !important; padding: 4px 8px !important; border-radius: 4px; font-family: 'Inter', sans-serif !important; }
        .goog-te-gadget-simple span { color: var(--text-main) !important; }
    `;
    document.head.appendChild(style);
});

// ======================================================================
// PENDING APPROVALS MODAL ENGINE & LIVE ROLE MANAGEMENT
// ======================================================================

// ======================================================================
// PENDING APPROVALS MODAL ENGINE & LIVE ROLE MANAGEMENT
// ======================================================================

let localPendingUsersList = [];

let localDispatchesList = [
    {
        id: 'disp-1',
        site: 'Wagamama Manchester',
        urgency: '<span style="color:#ef5350; font-weight:700;">🔴 High Risk (Urgent)</span>',
        date: 'Tomorrow (14 Sep 2026)',
        protocol: 'BESA TR19 Deep Duct Extraction Clean',
        status: 'pending'
    },
    {
        id: 'disp-2',
        site: 'Premier Inn Cardiff',
        urgency: '<span style="color:#ef5350; font-weight:700;">🔴 High Risk (Urgent)</span>',
        date: '15 Sep 2026',
        protocol: 'Acoustic Pipe Impedance & Descaling',
        status: 'pending'
    },
    {
        id: 'disp-3',
        site: 'Five Guys Liverpool',
        urgency: '<span style="color:#ffb74d; font-weight:700;">🟡 Action Due</span>',
        date: '17 Sep 2026',
        protocol: 'Optical Sensor Array Calibration',
        status: 'pending'
    }
];

window.injectPendingApprovalsModalHTML = function() {
    if (document.getElementById('pendingApprovalsModal')) return;

    const modalDiv = document.createElement('div');
    modalDiv.id = 'pendingApprovalsModal';
    modalDiv.className = 'modal-overlay';
    modalDiv.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 17, 31, 0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); z-index: 9999; align-items: center; justify-content: center; padding: 1.5rem;';

    modalDiv.innerHTML = `
        <div class="modal-content glass-modal" style="background: rgba(0, 24, 44, 0.95); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 16px; width: 100%; max-width: 960px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.7);">
            
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.75rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); background: rgba(0, 0, 0, 0.25);">
                <div>
                    <h2 style="font-size: 1.35rem; font-weight: 800; color: #ffffff; margin: 0;">Access &amp; Service Approvals Queue</h2>
                    <p style="font-size: 0.85rem; color: #90a4ae; margin: 0.25rem 0 0 0;">Review pending user account registrations and maintenance dispatches.</p>
                </div>
                <button type="button" class="modal-close-btn" id="closeApprovalsModalBtn" onclick="closePendingApprovalsModal()" aria-label="Close modal">&times;</button>
            </div>

            <div style="display: flex; gap: 0.75rem; padding: 0.75rem 1.75rem; border-bottom: 1px solid rgba(255, 255, 255, 0.08); background: rgba(0, 0, 0, 0.15);">
                <button id="tabUserRequestsBtn" class="approval-tab-btn active" onclick="switchPendingApprovalsTab('userRequests')">
                    User Access Approvals (<span id="userReqBadgeCount">0</span>)
                </button>
                <button id="tabServiceDispatchesBtn" class="approval-tab-btn" onclick="switchPendingApprovalsTab('serviceDispatches')">
                    Service Dispatches &amp; Descaling (<span id="dispatchBadgeCount">0</span>)
                </button>
            </div>

            <div style="padding: 1.5rem 1.75rem; overflow-y: auto; flex: 1;">
                
                <div id="modalAlertBanner" class="protocol-banner banner-safe" style="display: none; padding: 0.75rem 1rem; font-size: 0.88rem; margin-bottom: 1.25rem; border-radius: 8px;"></div>

                <div id="tabUserRequestsContent">
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
                            <thead>
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.15); color: #b0bec5; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px;">
                                    <th style="padding: 0.75rem;">User Name &amp; Email</th>
                                    <th style="padding: 0.75rem;">Company / Brand</th>
                                    <th style="padding: 0.75rem;">Pre-Provisioned Facility Dropdown</th>
                                    <th style="padding: 0.75rem;">Assigned Role</th>
                                    <th style="padding: 0.75rem; text-align: right;">Action Buttons</th>
                                </tr>
                            </thead>
                            <tbody id="userRequestsTableBody">
                                <!-- Dynamically populated -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <div id="tabServiceDispatchesContent" style="display: none;">
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
                            <thead>
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.15); color: #b0bec5; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px;">
                                    <th style="padding: 0.75rem;">Facility Name &amp; Location</th>
                                    <th style="padding: 0.75rem;">Requested Date &amp; Window</th>
                                    <th style="padding: 0.75rem;">Urgency &amp; Access Notes</th>
                                    <th style="padding: 0.75rem;">Available Regional Engineer Selector</th>
                                    <th style="padding: 0.75rem; text-align: right;">Action Buttons</th>
                                </tr>
                            </thead>
                            <tbody id="serviceDispatchesTableBody">
                                <!-- Dynamically populated -->
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            <div style="display: flex; justify-content: flex-end; padding: 1rem 1.75rem; border-top: 1px solid rgba(255, 255, 255, 0.1); background: rgba(0,0,0,0.2);">
                <button type="button" class="btn-cancel" id="btnBottomCloseApprovals" onclick="closePendingApprovalsModal()" style="padding: 0.5rem 1.25rem; font-size: 0.88rem; background: transparent; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #94a3b8; cursor: pointer;">Close</button>
            </div>

        </div>
    `;

    document.body.appendChild(modalDiv);

    modalDiv.addEventListener('click', (e) => {
        if (e.target === modalDiv) {
            window.closePendingApprovalsModal();
        }
    });
};

window.loadPendingUserApprovals = async function() {
    await renderPendingUserRequests();
};

window.openPendingApprovalsModal = function() {
    if (typeof window.ensureAdminModalsExist === 'function') {
        window.ensureAdminModalsExist();
    } else {
        window.injectPendingApprovalsModalHTML();
    }
    const modal = document.getElementById('pendingApprovalsModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        renderPendingUserRequests();
        renderServiceDispatches();
    }
};

window.closePendingApprovalsModal = function() {
    const modal = document.getElementById('pendingApprovalsModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
};

window.switchPendingApprovalsTab = function(tabName) {
    const tabUserBtn = document.getElementById('tabUserRequestsBtn');
    const tabDispatchBtn = document.getElementById('tabServiceDispatchesBtn');

    const tabUserContent = document.getElementById('tabUserRequestsContent');
    const tabDispatchContent = document.getElementById('tabServiceDispatchesContent');

    if (!tabUserBtn || !tabDispatchBtn) return;

    if (tabName === 'userRequests') {
        tabUserBtn.classList.add('active');
        tabDispatchBtn.classList.remove('active');

        tabUserContent.style.display = 'block';
        tabDispatchContent.style.display = 'none';
    } else {
        tabDispatchBtn.classList.add('active');
        tabUserBtn.classList.remove('active');

        tabUserContent.style.display = 'none';
        tabDispatchContent.style.display = 'block';
    }
};

async function renderPendingUserRequests() {
    const tbody = document.getElementById('userRequestsTableBody');
    if (!tbody) return;

    let users = [];

    if (window.supabaseClient) {
        try {
            const { data, error } = await window.supabaseClient
                .from('profiles')
                .select('*')
                .eq('is_approved', false);
            if (!error && data) {
                users = data;
            }
        } catch (e) {
            console.warn('Supabase fetch unapproved profiles error:', e);
        }
    }

    // Merge offline / persistent demo registered users where is_approved === false or status === 'pending'
    try {
        const stored = JSON.parse(localStorage.getItem('siim_registered_users') || '[]');
        stored.forEach(su => {
            if ((su.is_approved === false || su.status === 'pending') && !users.some(u => u.id === su.id || u.email === su.email)) {
                users.push(su);
            }
        });
    } catch (e) {}

    window.currentPendingUsersList = users;

    const badgeCount = document.getElementById('userReqBadgeCount');
    if (badgeCount) badgeCount.textContent = users.length;

    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #64748b; padding: 2rem;">
                    ✓ All account registrations have been reviewed. No pending approvals.
                </td>
            </tr>
        `;
        return;
    }

    const siteOptionsHtml = (typeof SITE_DATA !== 'undefined' ? SITE_DATA : [
        { id: 'wagamama-leeds', brand: 'Wagamama', location: 'Leeds, West Yorkshire' },
        { id: 'fiveguys-sheffield', brand: 'Five Guys', location: 'Sheffield, South Yorkshire' },
        { id: 'zaap-york', brand: 'Zaap', location: 'York, North Yorkshire' },
        { id: 'thaiexpress-manchester', brand: 'Thai Express', location: 'Manchester, Greater Manchester' }
    ]).map(s => `<option value="${s.id}">${s.brand} &mdash; ${s.location}</option>`).join('');

    tbody.innerHTML = users.map(u => `
        <tr id="row_user_${u.id}" style="border-bottom: 1px solid rgba(255,255,255,0.08);">
            <td style="padding: 0.85rem 0.75rem;">
                <strong style="color: #fff; display: block; font-size: 0.95rem;">${u.full_name || u.name || 'New User'}</strong>
                <small style="color: #94a3b8;">${u.email}</small>
            </td>
            <td style="padding: 0.85rem 0.75rem;">
                <input type="text" class="input-table" id="company_${u.id}" value="${u.company || ''}" placeholder="Enter Company" style="background: rgba(11, 15, 25, 0.9); color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 0.45rem 0.65rem; border-radius: 6px; font-size: 0.82rem; width: 100%;">
            </td>
            <td style="padding: 0.85rem 0.75rem;">
                <select id="site_${u.id}" class="assign-facility-select" style="background: rgba(11, 15, 25, 0.9); color: #00e5ff; border: 1px solid rgba(6, 182, 212, 0.4); padding: 0.45rem 0.65rem; border-radius: 6px; font-size: 0.82rem; width: 100%; max-width: 260px;">
                    ${siteOptionsHtml}
                </select>
            </td>
            <td style="padding: 0.85rem 0.75rem;">
                <select id="role_${u.id}" class="approval-role-select" style="background: rgba(11, 15, 25, 0.9); color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 0.45rem 0.65rem; border-radius: 6px; font-size: 0.82rem;">
                    <option value="client" ${u.role === 'client' ? 'selected' : ''}>Client / Facility Manager</option>
                    <option value="engineer" ${u.role === 'engineer' ? 'selected' : ''}>Field Engineer</option>
                    <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>System Administrator</option>
                </select>
            </td>
            <td style="padding: 0.85rem 0.75rem; text-align: right; white-space: nowrap;">
                <button onclick="approveUserAccess('${u.id}')" class="btn btn-primary" style="padding: 0.45rem 0.85rem; font-size: 0.78rem; background: linear-gradient(135deg, #2e7d32, #1b5e20); border: none; margin-right: 0.4rem; font-weight: 700;">
                    Approve Access &check;
                </button>
                <button onclick="declineUserAccess('${u.id}')" class="btn btn-outline" style="padding: 0.45rem 0.75rem; font-size: 0.78rem; border-color: rgba(239,83,80,0.4); color: #ef5350; font-weight: 700;">
                    Decline
                </button>
            </td>
        </tr>
    `).join('');

    users.forEach(u => {
        const siteSel = document.getElementById(`site_${u.id}`);
        if (siteSel) {
            const desiredSite = u.site_id || u.siteId || 'wagamama-leeds';
            if ([...siteSel.options].some(opt => opt.value === desiredSite)) {
                siteSel.value = desiredSite;
            }
        }
    });
}

async function renderServiceDispatches() {
    const tbody = document.getElementById('serviceDispatchesTableBody');
    if (!tbody) return;

    let dispatches = [...localDispatchesList];
    try {
        const stored = JSON.parse(localStorage.getItem('siim_dispatch_requests') || '[]');
        stored.forEach(sd => {
            if (!dispatches.some(d => d.id === sd.id)) {
                dispatches.unshift(sd);
            }
        });
    } catch (e) {}

    const badgeCount = document.getElementById('dispatchBadgeCount');
    const pendingCount = dispatches.filter(d => d.status === 'pending').length;
    if (badgeCount) badgeCount.textContent = pendingCount;

    if (dispatches.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="padding: 2rem; text-align: center; color: #4caf50;">
                    🎉 No active service dispatches. All maintenance requests handled.
                </td>
            </tr>
        `;
        return;
    }

    // Fetch dynamic registered engineers from Supabase + localStorage roster
    let registeredEngineers = [];
    if (window.supabaseClient) {
        try {
            const { data } = await window.supabaseClient.from('profiles').select('*').eq('role', 'engineer');
            if (data && data.length > 0) {
                registeredEngineers = data;
            }
        } catch (e) {}
    }
    try {
        const localRoster = JSON.parse(localStorage.getItem('siim_engineers_roster') || '[]');
        localRoster.forEach(eng => {
            if (!registeredEngineers.some(e => e.id === eng.id || e.email === eng.email)) {
                registeredEngineers.push(eng);
            }
        });
    } catch (e) {}

    let engineerOptionsHtml = '';
    if (registeredEngineers.length > 0) {
        engineerOptionsHtml = registeredEngineers.map(eng => {
            const engName = eng.full_name || eng.name || (eng.email ? eng.email.split('@')[0] : 'Engineer');
            const region = eng.region || eng.company || 'Regional';
            const val = `${engName} (${region} — Available)`;
            return `<option value="${val}">${val}</option>`;
        }).join('');
    } else {
        engineerOptionsHtml = `
            <option value="Marcus Vance (Leeds Metro — Available)">Marcus Vance (Leeds Metro — Available)</option>
            <option value="Liam Davies (West Yorkshire — Available)">Liam Davies (West Yorkshire — Available)</option>
            <option value="Kareem Adeyemi (Yorkshire Field Team — Available)">Kareem Adeyemi (Yorkshire Field Team — Available)</option>
            <option value="Regional Duty Pool (First Available Field Tech)">Regional Duty Pool (First Available Field Tech)</option>
        `;
    }

    tbody.innerHTML = dispatches.map(d => `
        <tr id="row_disp_${d.id}" style="border-bottom: 1px solid rgba(255,255,255,0.08);">
            <td style="padding: 0.85rem 0.75rem;">
                <strong style="color: #fff; display: block; font-size: 0.95rem;">${d.site}</strong>
            </td>
            <td style="padding: 0.85rem 0.75rem;">
                <span style="color: #00e5ff; font-weight: 700; display: block; font-size: 0.85rem;">${d.date || 'Tomorrow'}</span>
                <span style="color: #94a3b8; font-size: 0.78rem;">${d.window || 'Night Shutdown (23:00 - 03:00)'}</span>
            </td>
            <td style="padding: 0.85rem 0.75rem;">
                <span style="color: #ff9800; font-weight: 700; display: block; font-size: 0.82rem;">${d.urgency || 'Routine Preventative'}</span>
                <span style="font-size: 0.78rem; color: #94a3b8; display: block; max-width: 200px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                    📝 ${d.notes || 'Standard keyholder access'}
                </span>
            </td>
            <td style="padding: 0.85rem 0.75rem;">
                <select id="engineerSelect_${d.id}" class="engineer-assign-select" style="background: rgba(11, 15, 25, 0.9); color: #00e5ff; border: 1px solid rgba(6, 182, 212, 0.4); padding: 0.45rem 0.65rem; border-radius: 6px; font-size: 0.82rem; width: 100%; max-width: 250px;">
                    ${engineerOptionsHtml}
                </select>
            </td>
            <td style="padding: 0.85rem 0.75rem; text-align: right; white-space: nowrap;">
                ${d.status === 'dispatched' ? `<span style="color:#4caf50; font-weight:700; font-size: 0.82rem;">🚚 Dispatched (${d.assignedEngineer ? d.assignedEngineer.split(' ')[0] : 'Engineer'})</span>` : `
                    <button onclick="approveAndDispatchEngineer('${d.id}')" class="btn btn-primary" style="padding: 0.45rem 0.85rem; font-size: 0.78rem; background: linear-gradient(135deg, #f97316, #ea580c); border: none; margin-right: 0.4rem; font-weight: 700;">
                        Approve &amp; Dispatch Engineer 🚚
                    </button>
                    <button onclick="declineOrReschedule('${d.id}')" class="btn btn-outline" style="padding: 0.45rem 0.75rem; font-size: 0.78rem; border-color: rgba(239,83,80,0.4); color: #ef5350; font-weight: 700;">
                        Decline / Reschedule
                    </button>
                `}
            </td>
        </tr>
    `).join('');
}

window.approveAndDispatchEngineer = function(dispatchId) {
    const engSelect = document.getElementById(`engineerSelect_${dispatchId}`);
    const selectedEng = engSelect ? engSelect.value : 'Marcus Vance (Leeds Metro — Available)';

    let requests = JSON.parse(localStorage.getItem('siim_dispatch_requests') || '[]');
    let target = requests.find(r => r.id === dispatchId) || localDispatchesList.find(d => d.id === dispatchId);

    if (!target) {
        target = { id: dispatchId, site: 'Wagamama Leeds', date: 'Tomorrow', window: 'Night Shutdown (23:00 - 03:00)' };
        requests.push(target);
    }

    target.status = 'dispatched';
    target.assignedEngineer = selectedEng;

    localStorage.setItem('siim_dispatch_requests', JSON.stringify(requests));

    const userEmail = localStorage.getItem('heyServiceUser') || 'johnoyetolaoluwafemi113@gmail.com';
    const dateStr = target.date || 'Tomorrow';
    const windowStr = target.window || 'Night Shutdown (23:00 - 03:00)';

    showModalAlert(`📧 Client Email Dispatched to ${userEmail}: Your Hey Service Group descaling service for ${dateStr} (${windowStr}) is CONFIRMED. Assigned Engineer: ${selectedEng}.`, 'safe');
    renderServiceDispatches();
};

window.declineOrReschedule = function(dispatchId) {
    const proposedSlot = prompt('Enter alternate proposed date or operational window for client:', '2026-09-18 (Afternoon Service Lull)');
    if (proposedSlot) {
        let requests = JSON.parse(localStorage.getItem('siim_dispatch_requests') || '[]');
        let target = requests.find(r => r.id === dispatchId) || localDispatchesList.find(d => d.id === dispatchId);
        if (target) {
            target.status = 'reschedule_proposed';
            target.proposedSlot = proposedSlot;
        }
        localStorage.setItem('siim_dispatch_requests', JSON.stringify(requests));
        showModalAlert(`📅 Reschedule proposal (${proposedSlot}) transmitted to client facility manager.`, 'safe');
        renderServiceDispatches();
    }
};

// === CLIENT OFF-PEAK CALENDAR BOOKING MODAL ENGINE ===
window.injectBookingModalHTML = function() {
    if (document.getElementById('cleaningBookingModal')) return;

    const modalDiv = document.createElement('div');
    modalDiv.id = 'cleaningBookingModal';
    modalDiv.className = 'modal-overlay';
    modalDiv.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 17, 31, 0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); z-index: 9999; align-items: center; justify-content: center; padding: 1.5rem;';

    modalDiv.innerHTML = `
        <div class="modal-content glass-modal" style="background: rgba(0, 24, 44, 0.95); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 16px; width: 100%; max-width: 620px; padding: 2rem; box-shadow: 0 20px 50px rgba(0,0,0,0.8); position: relative;">
            <button onclick="closeBookingModal()" style="position: absolute; top: 1.25rem; right: 1.25rem; background: none; border: none; color: #b0bec5; font-size: 1.85rem; cursor: pointer; line-height: 1;" aria-label="Close modal">&times;</button>
            
            <h2 style="font-size: 1.4rem; font-weight: 800; color: #ffffff; margin-top: 0; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.5rem;">
                <span>🗓️ Off-Peak Calendar Service Booking</span>
            </h2>
            <p style="font-size: 0.88rem; color: #94a3b8; margin-bottom: 1.5rem;">
                Schedule proactive descaling or extraction duct cleaning during non-operational kitchen hours.
            </p>

            <form id="cleaningBookingForm">
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.35rem;">FACILITY LOCATION</label>
                    <input type="text" id="bookingFacilityDisplay" readonly style="width: 100%; background: rgba(15, 23, 42, 0.8); color: #00e5ff; border: 1px solid rgba(255,255,255,0.15); padding: 0.65rem 0.85rem; border-radius: 8px; font-weight: 700; font-size: 0.9rem;" value="Wagamama — Leeds Trinity (West Yorkshire)">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div>
                        <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.35rem;">CALENDAR DATE</label>
                        <input type="date" id="bookingDate" required style="width: 100%; background: rgba(15, 23, 42, 0.8); color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 0.6rem 0.85rem; border-radius: 8px; font-size: 0.88rem;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.35rem;">KITCHEN OPERATIONAL WINDOW</label>
                        <select id="bookingWindow" style="width: 100%; background: rgba(15, 23, 42, 0.8); color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 0.6rem 0.85rem; border-radius: 8px; font-size: 0.85rem;">
                            <option value="Night Shutdown / Post-Close (23:00 - 03:00) — [Recommended]">Night Shutdown / Post-Close (23:00 - 03:00) — [Recommended]</option>
                            <option value="Early Morning / Pre-Service (05:00 - 08:30)">Early Morning / Pre-Service (05:00 - 08:30)</option>
                            <option value="Afternoon Service Lull (14:30 - 16:30)">Afternoon Service Lull (14:30 - 16:30)</option>
                        </select>
                    </div>
                </div>

                <div style="margin-bottom: 1rem;">
                    <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.35rem;">SERVICE URGENCY LEVEL</label>
                    <select id="bookingUrgency" style="width: 100%; background: rgba(15, 23, 42, 0.8); color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 0.6rem 0.85rem; border-radius: 8px; font-size: 0.85rem;">
                        <option value="Routine Preventative Maintenance">Routine Preventative Maintenance</option>
                        <option value="Urgent Descaling / Grease Extraction">Urgent Descaling / Grease Extraction</option>
                    </select>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.35rem;">KITCHEN ACCESS &amp; DELIVERY NOTES</label>
                    <textarea id="bookingNotes" rows="3" style="width: 100%; background: rgba(15, 23, 42, 0.8); color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 0.65rem 0.85rem; border-radius: 8px; font-size: 0.85rem; resize: vertical;" placeholder="e.g., Rear delivery buzzer code #4921, keys held by night duty manager..."></textarea>
                </div>

                <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
                    <button type="button" onclick="closeBookingModal()" class="btn btn-outline" style="padding: 0.6rem 1.25rem;">Cancel</button>
                    <button type="submit" class="btn btn-primary" style="padding: 0.6rem 1.5rem; background: linear-gradient(135deg, #00838f, #00acc1); border: none; font-weight: 700;">
                        Submit Service Booking Request &rarr;
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modalDiv);

    modalDiv.addEventListener('click', (e) => {
        if (e.target === modalDiv) closeBookingModal();
    });

    const form = document.getElementById('cleaningBookingForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const facilityDisplay = document.getElementById('bookingFacilityDisplay').value;
            const dateVal = document.getElementById('bookingDate').value;
            const windowVal = document.getElementById('bookingWindow').value;
            const urgencyVal = document.getElementById('bookingUrgency').value;
            const notesVal = document.getElementById('bookingNotes').value.trim();

            const siteId = localStorage.getItem('heyServiceSiteId') || 'wagamama-leeds';

            const newBooking = {
                id: 'disp_' + Date.now(),
                site: facilityDisplay,
                siteId: siteId,
                date: dateVal,
                window: windowVal,
                urgency: urgencyVal,
                protocol: urgencyVal.includes('Urgent') ? 'Urgent Hydraulic Descaling' : 'Off-Peak Preventative Cleaning',
                notes: notesVal || 'Standard keyholder access',
                status: 'pending',
                created_at: new Date().toISOString()
            };

            try {
                let requests = JSON.parse(localStorage.getItem('siim_dispatch_requests') || '[]');
                requests.unshift(newBooking);
                localStorage.setItem('siim_dispatch_requests', JSON.stringify(requests));
            } catch (err) {}

            if (typeof localDispatchesList !== 'undefined') {
                localDispatchesList.unshift(newBooking);
            }

            closeBookingModal();

            alert(`✅ Service Booking Submitted: Your request for ${dateVal} (${windowVal}) has been logged. Our dispatch team is assigning an available regional engineer.`);

            const siteBadge = document.getElementById('siteStatusBadge') || document.getElementById('waterSiteStatusBadge');
            if (siteBadge) {
                siteBadge.textContent = '⏳ Service Booking: Pending Dispatch Review';
                siteBadge.className = 'badge badge-warning';
            }

            const statusContainer = document.getElementById('waterActionProtocolHeader') || document.getElementById('protocolBanner') || document.querySelector('.main-content-panel');
            if (statusContainer && !document.getElementById('bookingPendingBadge')) {
                const badgeHtml = `<div id="bookingPendingBadge" class="protocol-banner banner-warn" style="margin-top: 1rem; padding: 0.75rem 1rem; font-size: 0.88rem; border-radius: 8px;">⏳ Service Booking: Pending Dispatch Review (${dateVal} &mdash; ${windowVal})</div>`;
                statusContainer.insertAdjacentHTML('afterend', badgeHtml);
            }
        });
    }
};

window.openBookingModal = function(siteTitle, siteLocation) {
    window.injectBookingModalHTML();
    const modal = document.getElementById('cleaningBookingModal');
    if (!modal) return;

    let siteNameDisplay = siteTitle ? `${siteTitle} (${siteLocation})` : null;
    if (!siteNameDisplay) {
        const titleElem = document.getElementById('waterSiteTitle') || document.getElementById('siteTitleHeading');
        const locElem = document.getElementById('waterSiteLocation') || document.getElementById('siteLocationSub');
        if (titleElem && locElem) {
            siteNameDisplay = `${titleElem.textContent.trim()} (${locElem.textContent.trim()})`;
        } else {
            siteNameDisplay = 'Wagamama — Leeds Trinity (West Yorkshire)';
        }
    }

    const facInput = document.getElementById('bookingFacilityDisplay');
    if (facInput) facInput.value = siteNameDisplay;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
        dateInput.min = `${yyyy}-${mm}-${dd}`;
        dateInput.value = `${yyyy}-${mm}-${dd}`;
    }

    modal.style.display = 'flex';
};

window.closeBookingModal = function() {
    const modal = document.getElementById('cleaningBookingModal');
    if (modal) modal.style.display = 'none';
};

window.approveUserAccess = async function(userId) {
    const companyInput = document.getElementById(`company_${userId}`);
    const siteSelect = document.getElementById(`site_${userId}`);
    const roleSelect = document.getElementById(`role_${userId}`);

    const selectedCompany = companyInput ? companyInput.value.trim() : '';
    const selectedSiteId = siteSelect ? siteSelect.value : 'wagamama-leeds';
    const selectedRole = roleSelect ? roleSelect.value : 'client';

    let userEmail = 'user@company.com';
    let userName = 'New User';

    if (window.currentPendingUsersList) {
        const targetUser = window.currentPendingUsersList.find(u => u.id === userId);
        if (targetUser) {
            userEmail = targetUser.email || userEmail;
            userName = targetUser.full_name || targetUser.name || userName;
        }
    }

    if (window.supabaseClient) {
        try {
            await window.supabaseClient.from('profiles').update({
                is_approved: true,
                status: 'approved',
                role: selectedRole,
                company: selectedCompany,
                site_id: selectedSiteId
            }).eq('id', userId);

            const { data } = await window.supabaseClient.auth.getUser();
            if (data && data.user && data.user.id === userId) {
                await window.supabaseClient.auth.updateUser({
                    data: { role: selectedRole, is_approved: true, status: 'approved', site_id: selectedSiteId, company: selectedCompany }
                });
            }
        } catch (e) {
            console.warn('Error updating Supabase profile:', e);
        }
    }

    try {
        let registeredList = JSON.parse(localStorage.getItem('siim_registered_users') || '[]');
        const target = registeredList.find(u => u.id === userId || u.email === userEmail);
        if (target) {
            target.is_approved = true;
            target.status = 'approved';
            target.role = selectedRole;
            target.company = selectedCompany;
            target.site_id = selectedSiteId;
            localStorage.setItem('siim_registered_users', JSON.stringify(registeredList));
        }
    } catch (e) {}

    if (selectedRole === 'engineer') {
        try {
            let roster = JSON.parse(localStorage.getItem('siim_engineers_roster') || '[]');
            if (!roster.some(e => e.id === userId || e.email === userEmail)) {
                roster.push({
                    id: userId,
                    full_name: userName,
                    email: userEmail,
                    company: selectedCompany,
                    region: 'Regional'
                });
                localStorage.setItem('siim_engineers_roster', JSON.stringify(roster));
            }
        } catch (e) {}
    }

    const currentEmail = localStorage.getItem('heyServiceUser');
    if (currentEmail && userEmail === currentEmail) {
        localStorage.setItem('heyServiceRole', selectedRole);
        localStorage.setItem('heyServiceSiteId', selectedSiteId);
        localStorage.setItem('heyServiceCompany', selectedCompany);
    }

    const emailMsg = `📧 Automated Approval Email Dispatched to ${userEmail}: 'Your SIIM account has been approved as ${selectedRole.toUpperCase()}. You may now log in to the portal.'`;
    showModalAlert(emailMsg, 'safe');
    if (typeof window.showToast === 'function') {
        window.showToast(emailMsg);
    }

    await renderPendingUserRequests();
};

window.declineUserAccess = async function(userId) {
    if (confirm('Decline and reject access request for this user?')) {
        let userEmail = '';
        if (window.currentPendingUsersList) {
            const u = window.currentPendingUsersList.find(x => x.id === userId);
            if (u) userEmail = u.email;
        }

        if (window.supabaseClient) {
            try {
                await window.supabaseClient.from('profiles').update({ is_approved: false, status: 'rejected' }).eq('id', userId);
            } catch (e) {}
        }

        try {
            let registeredList = JSON.parse(localStorage.getItem('siim_registered_users') || '[]');
            const target = registeredList.find(u => u.id === userId || u.email === userEmail);
            if (target) {
                target.status = 'rejected';
                target.is_approved = false;
                localStorage.setItem('siim_registered_users', JSON.stringify(registeredList));
            }
        } catch (e) {}

        showModalAlert('⚠️ User access request rejected.', 'danger');
        await renderPendingUserRequests();
    }
};

window.dispatchFieldTeam = function(dispatchId, siteName) {
    const item = localDispatchesList.find(d => d.id === dispatchId);
    if (item) {
        item.status = 'dispatched';
        showModalAlert(`🚚 Engineering Field Team dispatched to ${siteName}. Task logged in Triage Queue.`, 'safe');
        renderServiceDispatches();
    }
};

window.acknowledgeDispatch = function(dispatchId, siteName) {
    const item = localDispatchesList.find(d => d.id === dispatchId);
    if (item) {
        item.status = 'acknowledged';
        showModalAlert(`✓ Dispatch acknowledged for ${siteName}.`, 'safe');
        renderServiceDispatches();
    }
};

function showModalAlert(message, type) {
    const banner = document.getElementById('modalAlertBanner');
    if (banner) {
        banner.style.display = 'block';
        banner.className = type === 'safe' ? 'protocol-banner banner-safe' : 'protocol-banner banner-danger';
        banner.textContent = message;
        setTimeout(() => {
            banner.style.display = 'none';
        }, 4000);
    }
}

// Active document event delegation for Pending Approvals & Macro Analytics modal triggers
document.addEventListener('click', function(e) {
  const approvalsBtn = e.target.closest('#navPendingApprovals, .trigger-pending-approvals');
  if (approvalsBtn) {
    e.preventDefault();
    e.stopPropagation();
    if (!document.getElementById('pendingApprovalsModal') && typeof window.injectPendingApprovalsModalHTML === 'function') {
      window.injectPendingApprovalsModalHTML();
    }
    const modal = document.getElementById('pendingApprovalsModal');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('active');
      if (typeof renderPendingUserRequests === 'function') renderPendingUserRequests();
      if (typeof renderServiceDispatches === 'function') renderServiceDispatches();
    }
  }
  
  const analyticsBtn = e.target.closest('#navMacroAnalytics, .trigger-macro-analytics');
  if (analyticsBtn) {
    e.preventDefault();
    e.stopPropagation();
    if (!document.getElementById('macroAnalyticsModal') && typeof window.injectMacroAnalyticsModalHTML === 'function') {
      window.injectMacroAnalyticsModalHTML();
    }
    const modal = document.getElementById('macroAnalyticsModal');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('active');
    }
  }

  // Modal close buttons
  if (e.target.closest('.modal-close, .btn-modal-close, .modal-close-btn, .btn-cancel, #closeApprovalsModalBtn, #closeMacroModalBtn, #closeMacroModalX, #btnBottomCloseApprovals, #btnBottomCloseMacro, [data-dismiss="modal"]')) {
    e.preventDefault();
    document.querySelectorAll('#pendingApprovalsModal, #macroAnalyticsModal, #cleaningBookingModal').forEach(m => {
      m.style.display = 'none';
      m.classList.remove('active');
    });
  }
});

// ESC Key listener to close modal cleanly
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('#pendingApprovalsModal, #macroAnalyticsModal, #cleaningBookingModal').forEach(m => {
            m.style.display = 'none';
            m.classList.remove('active');
        });
    }
});
