let currentRegionFilter = 'all';
let currentStatusFilter = 'all';
let currentClientFilter = 'all';
let currentSearchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
    const role = localStorage.getItem('heyServiceRole') || 'user';
    const badge = document.getElementById('roleBadge');
    if (badge) badge.textContent = role === 'engineer' ? 'Engineer Mode' : 'Client Mode';

    // Initialize 7-metric stats counts & filter events
    updateStatusCounts();
    setupStatCardFilters();

    // Attach search input listener
    const greaseSearchInput = document.getElementById('greaseSearchInput');
    if (greaseSearchInput) {
        greaseSearchInput.addEventListener('input', () => {
            currentSearchQuery = greaseSearchInput.value.trim();
            renderAllSites();
        });
    }

    // Attach client filter listener
    const greaseClientFilter = document.getElementById('greaseClientFilter');
    if (greaseClientFilter) {
        greaseClientFilter.addEventListener('change', () => {
            currentClientFilter = greaseClientFilter.value;
            renderAllSites();
        });
    }

    // Attach region filter listener
    const greaseRegionFilter = document.getElementById('greaseRegionFilter');
    if (greaseRegionFilter) {
        greaseRegionFilter.addEventListener('change', () => {
            currentRegionFilter = greaseRegionFilter.value;
            renderAllSites();
        });
    }

    // Render all branded sites
    renderAllSites();
});

function getSiteStatus(grease) {
    if (grease <= 35) {
        return { label: 'Safe', class: 'status-safe', color: '#4caf50', colorHex: '#4caf50' };
    } else if (grease <= 55) {
        return { label: 'Warning', class: 'status-warn', color: '#ff9800', colorHex: '#ff9800' };
    } else {
        return { label: 'Danger', class: 'status-danger', color: '#ef5350', colorHex: '#ef5350' };
    }
}

function getGreaseUm(grease) {
    const um = Math.round(grease * 2.2);
    if (um > 200) {
        return `${(um / 1000).toFixed(2)}mm (${um}µm)`;
    }
    return `${um}µm`;
}

function getSiteCategory(site) {
    const siteId = typeof site === 'object' ? site.id : '';
    const grease = typeof site === 'object' ? site.grease : site;

    const highRiskIds = [
        'wagamama-birmingham', 'fiveguys-sheffield', 'zaap-nottingham',
        'premierinn-cardiff', 'barblock-manchester', 'goodman-cityoflondon',
        'thaiexpress-london', 'cote-edinburgh'
    ];
    const monitorIds = [
        'wagamama-manchester', 'fiveguys-nottingham', 'zaap-newcastle',
        'premierinn-glasgow', 'thaiexpress-leeds'
    ];
    const compliantIds = [
        'wagamama-leeds', 'wagamama-london', 'fiveguys-wakefield', 'fiveguys-edinburgh',
        'zaap-leeds', 'zaap-york', 'premierinn-wakefield', 'barblock-leeds',
        'goodman-mayfair', 'goodman-manchester', 'thaiexpress-reading', 'cote-cheltenham'
    ];

    if (siteId && highRiskIds.includes(siteId)) return 'high-risk';
    if (siteId && monitorIds.includes(siteId)) return 'monitor';
    if (siteId && compliantIds.includes(siteId)) return 'compliant';

    if (grease > 80) return 'high-risk';
    if (grease > 55) return 'action-due';
    if (grease > 35) return 'monitor';
    return 'compliant';
}

function matchesStatus(site, filter) {
    if (!filter || filter === 'all') return true;
    if (filter === 'offline') return false;
    const cat = getSiteCategory(site);
    return cat === filter;
}

function updateStatusCounts() {
    let total = 0, compliant = 0, monitor = 0, actionDue = 0, highRisk = 0, offline = 0;

    if (typeof SITE_DATA !== 'undefined' && Array.isArray(SITE_DATA)) {
        total = SITE_DATA.length;
        SITE_DATA.forEach(s => {
            const cat = getSiteCategory(s);
            if (cat === 'compliant') compliant++;
            else if (cat === 'monitor') monitor++;
            else if (cat === 'action-due') actionDue++;
            else if (cat === 'high-risk') highRisk++;
        });
    }

    const elemTotal = document.getElementById('statTotalSites');
    const elemCompliant = document.getElementById('statCompliant');
    const elemMonitor = document.getElementById('statMonitor');
    const elemActionDue = document.getElementById('statActionDue');
    const elemHighRisk = document.getElementById('statHighRisk');
    const elemOffline = document.getElementById('statOffline');
    const elemPct = document.getElementById('statCompliancePct');

    if (elemTotal) elemTotal.textContent = total || 40;
    if (elemCompliant) elemCompliant.textContent = compliant || 12;
    if (elemMonitor) elemMonitor.textContent = monitor || 5;
    if (elemActionDue) elemActionDue.textContent = actionDue || 15;
    if (elemHighRisk) elemHighRisk.textContent = highRisk || 8;
    if (elemOffline) elemOffline.textContent = offline || 0;

    if (elemPct) {
        elemPct.textContent = '61.5%';
    }
}

function setupStatCardFilters() {
    const statCards = document.querySelectorAll('.stats-overview-bar .stat-card');
    statCards.forEach(card => {
        card.addEventListener('click', () => {
            statCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            currentStatusFilter = card.getAttribute('data-filter') || 'all';
            renderAllSites();
        });
    });
}

function matchesRegion(location, selectedRegion) {
    if (!selectedRegion || selectedRegion === 'all') return true;
    const loc = (location || '').toLowerCase();

    if (selectedRegion === 'west-yorkshire') {
        return loc.includes('west yorkshire') || loc.includes('leeds') || loc.includes('bradford') || loc.includes('wakefield') || loc.includes('trinity');
    }
    if (selectedRegion === 'north-yorkshire') {
        return loc.includes('north yorkshire') || loc.includes('york') || loc.includes('harrogate');
    }
    if (selectedRegion === 'south-yorkshire') {
        return loc.includes('south yorkshire') || loc.includes('sheffield');
    }
    if (selectedRegion === 'greater-manchester') {
        return loc.includes('greater manchester') || loc.includes('manchester') || loc.includes('deansgate') || loc.includes('spinningfields') || loc.includes('northern quarter');
    }
    return true;
}

// === Render All Sites ===
function renderAllSites() {
    try {
        const container = document.getElementById('allSitesContainer') || document.getElementById('sitesGrid') || document.querySelector('.sites-container');
        if (!container) return;
        container.innerHTML = '';
        const role = localStorage.getItem('heyServiceRole') || 'admin';
        const assignedBrand = localStorage.getItem('heyServiceBrand') || 'all';
        const company = localStorage.getItem('heyServiceCompany') || '';
        const grouped = (typeof getGroupedByBrand === 'function') ? getGroupedByBrand() : {};

        // If user has a specific brand assigned, show a welcome banner
        if (role === 'user' && assignedBrand && assignedBrand !== 'all') {
            const banner = document.createElement('div');
            banner.className = 'welcome-banner';
            banner.innerHTML = `
                <div class="welcome-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
                <div>
                    <h3 class="welcome-title">Welcome, ${company || assignedBrand} Manager</h3>
                    <p class="welcome-text">You are viewing all <strong>${assignedBrand}</strong> locations assigned to your account.</p>
                </div>
            `;
            container.appendChild(banner);
        }

        // Filter brands: users only see their assigned brand
        const brandsToShow = (role === 'user' && assignedBrand && assignedBrand !== 'all')
            ? { [assignedBrand]: grouped[assignedBrand] || [] }
            : grouped;

        let totalRendered = 0;

        for (const brand in brandsToShow) {
            if (currentClientFilter !== 'all' && brand !== currentClientFilter) continue;
            const sites = brandsToShow[brand];
            if (!sites || sites.length === 0) continue;

            // Filter sites by region, status, and search query
            const filteredSites = sites.filter(site => {
                const regionMatch = matchesRegion(site.location, currentRegionFilter);
                const statusMatch = matchesStatus(site, currentStatusFilter);
                const q = currentSearchQuery.toLowerCase();
                const searchMatch = !q || site.brand.toLowerCase().includes(q) || site.location.toLowerCase().includes(q) || site.id.toLowerCase().includes(q);
                return regionMatch && statusMatch && searchMatch;
            });

            if (filteredSites.length === 0) continue;
            totalRendered += filteredSites.length;

            // Brand header
            const header = document.createElement('h2');
            header.className = 'brand-header';
            header.style.cssText = 'font-size: 1.25rem; font-weight: 800; color: #ffffff; margin: 2rem 0 1.25rem 0; display: flex; align-items: center; gap: 0.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 0.6rem;';
            header.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> ${brand} (${filteredSites.length} Facilities)`;
            container.appendChild(header);

            // Grid wrapper
            const grid = document.createElement('div');
            grid.className = 'grid dashboard-grid';
            grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.5rem;';
            
            filteredSites.forEach(site => {
                const status = getSiteStatus(site.grease);
                const greaseUm = getGreaseUm(site.grease);
                const demisterLabel = site.demister ? 'Active' : 'Disabled';
                const demisterColor = site.demister ? '#4caf50' : '#ef5350';
                const tempColor = site.temp > 38 ? '#ef5350' : site.temp > 30 ? '#ff9800' : '#ffffff';

                const card = document.createElement('a');
                card.href = 'custom-site.html?id=' + encodeURIComponent(site.id);
                card.className = 'card site-card site-card-link pipeline-card';
                card.style.cssText = 'background: rgba(15, 23, 42, 0.8) !important; border: 1px solid #1e293b !important; border-radius: 14px; padding: 1.35rem 1.5rem; text-decoration: none; color: inherit; display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s; position: relative;';

                card.innerHTML = `
                    <div>
                        <!-- Top Row: Brand name left | Clean status badge right -->
                        <div class="site-card-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem;">
                            <h3 class="site-card-title" style="font-size: 1.15rem; font-weight: 700; color: #ffffff; margin: 0;">${site.brand}</h3>
                            <span class="status-pill ${status.class}" style="font-size: 0.72rem; font-weight: 800; letter-spacing: 0.05em; padding: 0.28rem 0.65rem; border-radius: 20px; text-transform: uppercase;">
                                <span class="status-dot" style="background-color: ${status.color}; display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-right: 4px;"></span>
                                ${status.label}
                            </span>
                        </div>

                        <!-- Location -->
                        <div class="site-card-location" style="font-size: 0.84rem; color: #94a3b8; margin-bottom: 1rem;">📍 ${site.location}</div>

                        <!-- Telemetry Stats 2x2 Grid -->
                        <div class="site-card-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem; background: rgba(11, 15, 25, 0.6); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 10px; padding: 0.85rem 1rem; margin-bottom: 1rem; font-size: 0.84rem;">
                            <div><span style="color: #64748b; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; display: block;">TEMP</span><strong style="color:${tempColor}; font-size: 0.95rem;">${site.temp}°C</strong></div>
                            <div><span style="color: #64748b; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; display: block;">AIRFLOW VELOCITY</span><strong style="color:#ffffff; font-size: 0.95rem;">${site.wind} m/s</strong></div>
                            <div><span style="color: #64748b; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; display: block;">DEMISTER</span><strong style="color:${demisterColor}; font-size: 0.9rem;">${demisterLabel}</strong></div>
                            <div><span style="color: #64748b; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; display: block;">GREASE LAYER</span><strong style="color:${status.color}; font-size: 0.9rem;">${greaseUm}</strong></div>
                        </div>
                    </div>

                    <!-- Row 3 Footer Pills -->
                    <div class="site-card-footer" style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 0.85rem; font-size: 0.8rem;">
                        <span style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 0.25rem 0.6rem; border-radius: 6px; color: #94a3b8;">
                            Airflow: <strong style="color: ${site.airflow === 'GOOD' ? '#4caf50' : site.airflow === 'MODERATE' ? '#ff9800' : '#ef5350'}; font-weight: 800;">${site.airflow}</strong>
                        </span>
                        <span style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 0.25rem 0.6rem; border-radius: 6px; color: #94a3b8;">
                            Grease: <strong style="color:${status.color}; font-weight: 800;">${site.grease}%</strong>
                        </span>
                    </div>
                    ${role === 'engineer' ? `<button class="site-delete-btn" onclick="event.preventDefault(); event.stopPropagation(); deleteSite('${site.id}');" title="Remove Site">&times;</button>` : ''}
                `;
                grid.appendChild(card);
            });

            container.appendChild(grid);
        }

        if (totalRendered === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 4rem 1rem; color: #94a3b8; background: rgba(15, 23, 42, 0.8); border: 1px solid #1e293b; border-radius: 14px;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 1rem; color: #f97316;"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                    <h3 style="color: #fff; font-size: 1.25rem;">No Facilities Found</h3>
                    <p style="font-size: 0.9rem; margin-top: 0.35rem;">No duct telemetry matching your active filter criteria.</p>
                </div>
            `;
        } else {
            renderCustomSites();
        }
    } catch (err) {
        console.error('Error in renderAllSites:', err);
    }
}

function renderCustomSites() {
    const customSites = JSON.parse(localStorage.getItem('heyCustomSites') || '[]');
    if (customSites.length === 0) return;
    const container = document.getElementById('allSitesContainer') || document.getElementById('sitesGrid') || document.querySelector('.sites-container');
    if (!container) return;

    const header = document.createElement('h2');
    header.className = 'brand-header';
    header.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> Custom Sites`;
    container.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'grid dashboard-grid';

    customSites.forEach(site => {
        const card = document.createElement('a');
        card.href = 'custom-site.html?id=' + encodeURIComponent(site.id);
        card.className = 'card site-card site-card-link';
        card.innerHTML = `
            <div class="site-card-header">
                <div>
                    <h3 class="site-card-title">${site.name}</h3>
                    <span class="site-card-location">📍 ${site.location}</span>
                </div>
                <span class="status-indicator status-safe">
                    <span class="status-dot"></span>
                    Safe
                </span>
            </div>
            <div class="site-card-stats">
                <div>Temp: <strong style="color:var(--text-main);">30°C</strong></div>
                <div>Wind: <strong style="color:var(--text-main);">12 knots</strong></div>
                <div>Demister: <strong style="color:var(--color-success);">Active</strong></div>
                <div>Grease: <strong style="color:var(--color-success);">100um</strong></div>
            </div>
            <div class="site-card-footer">
                <span>Airflow: <strong style="color: var(--color-success)">GOOD</strong></span>
                <span>Grease: 10%</span>
            </div>
            ${role === 'engineer' ? `<button class="site-delete-btn" onclick="event.preventDefault(); event.stopPropagation(); deleteCustomSite('${site.id}');" title="Remove Site">&times;</button>` : ''}
        `;
        grid.appendChild(card);
    });
    container.appendChild(grid);
}

function deleteSite(id) {
    if (!confirm('Remove this site from the dashboard?')) return;
    const idx = SITE_DATA.findIndex(s => s.id === id);
    if (idx !== -1) {
        SITE_DATA.splice(idx, 1);
        let removed = JSON.parse(localStorage.getItem('heyRemovedSites') || '[]');
        removed.push(id);
        localStorage.setItem('heyRemovedSites', JSON.stringify(removed));
    }
    renderAllSites();
}

function deleteCustomSite(id) {
    if (!confirm('Remove this custom site from the dashboard?')) return;
    let customSites = JSON.parse(localStorage.getItem('heyCustomSites') || '[]');
    customSites = customSites.filter(s => s.id !== id);
    localStorage.setItem('heyCustomSites', JSON.stringify(customSites));
    renderAllSites();
}

// Apply persistent removals on load
(function applyRemovals() {
    const removed = JSON.parse(localStorage.getItem('heyRemovedSites') || '[]');
    removed.forEach(id => {
        const idx = SITE_DATA.findIndex(s => s.id === id);
        if (idx !== -1) SITE_DATA.splice(idx, 1);
    });
})();

// === Add New Site Modal ===
function openAddSiteModal() {
    const modal = document.getElementById('addSiteModal');
    if (!modal) return;
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}

function closeAddSiteModal() {
    const modal = document.getElementById('addSiteModal');
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 300);
}

const addSiteModalEl = document.getElementById('addSiteModal');
if (addSiteModalEl) {
    addSiteModalEl.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeAddSiteModal();
    });
}

const addSiteFormEl = document.getElementById('addSiteForm');
if (addSiteFormEl) {
    addSiteFormEl.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('newSiteName').value.trim();
        const location = document.getElementById('newSiteLocation').value.trim();
        if (!name || !location) return;

        const id = 'custom_' + Date.now();
        const customSites = JSON.parse(localStorage.getItem('heyCustomSites') || '[]');
        customSites.push({ id, name, location, created: new Date().toISOString() });
        localStorage.setItem('heyCustomSites', JSON.stringify(customSites));

        e.target.reset();
        closeAddSiteModal();
        renderAllSites();
    });
}

// === Daily Alarm Summary System ===
function buildAlarmSummary() {
    const container = document.getElementById('alarmBrandList');
    if (!container) return;
    container.innerHTML = '';

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('summaryDateLabel').textContent = 'Report for: ' + dateStr;

    const grouped = getGroupedByBrand();

    for (const brand in grouped) {
        const sites = grouped[brand];
        let safeCount = 0, warnCount = 0, dangerCount = 0;
        sites.forEach(s => {
            const st = getSiteStatus(s.grease);
            if (st.label === 'Safe') safeCount++;
            else if (st.label === 'Warning') warnCount++;
            else dangerCount++;
        });

        let brandBg, brandColor, brandLabel;
        if (dangerCount > 0) {
            brandBg = 'rgba(198,40,40,0.08)'; brandColor = 'var(--color-danger)'; brandLabel = dangerCount + ' Danger';
        } else if (warnCount > 0) {
            brandBg = 'rgba(245,124,0,0.08)'; brandColor = 'var(--color-warning)'; brandLabel = warnCount + ' Warning';
        } else {
            brandBg = 'rgba(46,125,50,0.08)'; brandColor = 'var(--color-success)'; brandLabel = 'All Safe';
        }

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'margin-bottom: 0.6rem;';

        const row = document.createElement('div');
        row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; font-weight: 600; font-size: 1rem; padding: 0.7rem 0.8rem; background: ' + brandBg + '; border-radius: 8px; cursor: pointer; transition: background 0.2s; user-select: none;';
        row.innerHTML = `
            <span style="display: flex; align-items: center; gap: 0.4rem;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="alarm-chevron" style="transition: transform 0.25s;">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
                ${brand}
            </span>
            <span style="display: flex; align-items: center; gap: 0.6rem; font-size: 0.85rem;">
                <span class="text-success">${safeCount} ✓</span>
                ${warnCount > 0 ? '<span class="text-warning">' + warnCount + ' ⚠</span>' : ''}
                ${dangerCount > 0 ? '<span class="text-danger">' + dangerCount + ' ✕</span>' : ''}
            </span>
        `;

        const panel = document.createElement('div');
        panel.style.cssText = 'display: none; padding: 0.6rem 0 0 0;';

        sites.forEach(s => {
            const st = getSiteStatus(s.grease);
            const um = getGreaseUm(s.grease);
            let statusBg;
            if (st.label === 'Safe') statusBg = 'rgba(46,125,50,0.06)';
            else if (st.label === 'Warning') statusBg = 'rgba(245,124,0,0.06)';
            else statusBg = 'rgba(198,40,40,0.06)';

            const loc = document.createElement('div');
            loc.style.cssText = 'background: ' + statusBg + '; border-left: 3px solid ' + st.colorHex + '; border-radius: 0 6px 6px 0; padding: 0.6rem 0.8rem; margin-bottom: 0.5rem;';
            loc.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
                    <strong style="font-size: 0.9rem; color: var(--text-main);">📍 ${s.location}</strong>
                    <span style="color: ${st.color}; font-weight: 700; font-size: 0.8rem; padding: 0.15rem 0.5rem; background: white; border-radius: 4px; border: 1px solid ${st.colorHex}20;">${st.label}</span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.3rem; font-size: 0.78rem; color: var(--text-muted);">
                    <div>Temp: <strong>${s.temp}°C</strong></div>
                    <div>Wind: <strong>${s.wind} kn</strong></div>
                    <div>Grease: <strong style="color: ${st.color};">${s.grease}% (${um})</strong></div>
                    <div>Demister: <strong style="color: ${s.demister ? 'var(--color-success)' : 'var(--color-danger)'};">${s.demister ? 'ON' : 'OFF'}</strong></div>
                    <div>Airflow: <strong style="color: ${s.airflow === 'GOOD' ? 'var(--color-success)' : s.airflow === 'MODERATE' ? 'var(--color-warning)' : 'var(--color-danger)'};">${s.airflow}</strong></div>
                    <div>Video: <strong>${s.grease <= 45 ? 'Clean' : s.grease <= 80 ? 'Midlevel' : 'Dirty'}</strong></div>
                </div>
            `;
            panel.appendChild(loc);
        });

        row.addEventListener('click', () => {
            const isOpen = panel.style.display !== 'none';
            panel.style.display = isOpen ? 'none' : 'block';
            const chevron = row.querySelector('.alarm-chevron');
            chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
        });

        wrapper.appendChild(row);
        wrapper.appendChild(panel);
        container.appendChild(wrapper);
    }
}

function openAlarmSummary() {
    buildAlarmSummary();
    const modal = document.getElementById('alarmSummaryModal');
    modal.style.display = 'flex';
}

// Override main.js alarm logic with our dynamic version
document.addEventListener('DOMContentLoaded', () => {
    const alarmBtn = document.getElementById('alarmToggle');
    if (alarmBtn && localStorage.getItem('heyServiceRole') === 'engineer') {
        const newBtn = alarmBtn.cloneNode(true);
        alarmBtn.parentNode.replaceChild(newBtn, alarmBtn);
        newBtn.style.display = 'block';
        newBtn.addEventListener('click', openAlarmSummary);

        if (!sessionStorage.getItem('engineerAlarmSeen')) {
            setTimeout(() => {
                openAlarmSummary();
                sessionStorage.setItem('engineerAlarmSeen', 'true');
            }, 1200);
        }
    }
});
