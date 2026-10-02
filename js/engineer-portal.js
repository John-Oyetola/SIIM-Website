// Hey Service - Field Engineer Portal Logic

document.addEventListener('DOMContentLoaded', () => {
    // Update user display badge if present
    const user = localStorage.getItem('heyServiceUser') || 'johnoyetolaoluwafemi113@gmail.com';
    const userBadge = document.getElementById('userBadge');
    if (userBadge) {
        userBadge.textContent = user;
    }

    renderTriageQueue();
});

function getServicedSites() {
    return JSON.parse(localStorage.getItem('siimCompletedJobs') || '[]');
}

function saveServicedSite(siteId, timestamp) {
    let list = JSON.parse(localStorage.getItem('siimCompletedJobs') || '[]');
    if (!list.includes(siteId)) {
        list.push(siteId);
        localStorage.setItem('siimCompletedJobs', JSON.stringify(list));
    }
    try {
        let logs = JSON.parse(localStorage.getItem('siimCompletedLogs') || '{}');
        logs[siteId] = timestamp || new Date().toLocaleString('en-GB');
        localStorage.setItem('siimCompletedLogs', JSON.stringify(logs));
    } catch(e) {}
}

window.renderTriageQueue = function() {
    const container = document.getElementById('triageQueueContainer');
    const servicedContainer = document.getElementById('recentlyServicedContainer');
    if (!container || typeof SITE_DATA === 'undefined') return;

    const completedIds = getServicedSites();
    
    // STRICT COMMERCIAL PRIVACY:
    // Fully compliant, healthy facilities (grease <= 45%) MUST BE HIDDEN.
    // Queue ONLY displays:
    // 1. Critical Telemetry Sites: Facilities where TR19 grease > 45% or hydraulic impedance indicates imminent blockage.
    let triageSites = SITE_DATA.filter(s => s.grease > 45 && !completedIds.includes(s.id));

    // 2. Merge Active Dispatched Work Orders (approved by admin from 'siim_dispatch_requests')
    try {
        const storedDispatches = JSON.parse(localStorage.getItem('siim_dispatch_requests') || '[]');
        storedDispatches.filter(d => d.status === 'dispatched' && !completedIds.includes(d.id)).forEach(d => {
            if (!triageSites.some(s => s.id === d.siteId || s.id === d.id)) {
                triageSites.unshift({
                    id: d.id,
                    brand: d.site ? d.site.split('(')[0].trim() : 'Scheduled Service',
                    location: d.site && d.site.includes('(') ? d.site.split('(')[1].replace(')', '').trim() : 'Assigned Location',
                    grease: 75,
                    temp: 38,
                    targetZone: 'Admin Dispatched Servicing Zone',
                    assignedTechnician: d.assignedEngineer || 'Marcus Vance',
                    isDispatchedOrder: true,
                    dispatchDetails: d
                });
            }
        });
    } catch(e) {}

    const servicedSites = SITE_DATA.filter(s => completedIds.includes(s.id));

    // Calculate stats
    const highRiskCount = triageSites.filter(s => s.grease > 80 || s.isDispatchedOrder).length;
    const actionDueCount = triageSites.filter(s => s.grease <= 80 && !s.isDispatchedOrder).length;

    const statTotalActive = document.getElementById('statTotalActive');
    const statHighRisk = document.getElementById('statHighRisk');
    const statActionDue = document.getElementById('statActionDue');
    const statServiced = document.getElementById('statServiced');

    if (statTotalActive) statTotalActive.textContent = triageSites.length;
    if (statHighRisk) statHighRisk.textContent = highRiskCount;
    if (statActionDue) statActionDue.textContent = actionDueCount;
    if (statServiced) statServiced.textContent = servicedSites.length;

    // Render active triage cards
    if (triageSites.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 3rem; text-align: center; background: rgba(58,138,51,0.08); border: 1px solid rgba(58,138,51,0.2); border-radius: 16px; color: #4caf50;">
                <h3 style="font-size: 1.4rem; margin-bottom: 0.5rem;">🎉 All Priority Interventions Completed!</h3>
                <p style="margin: 0; color: #a5d6a7;">All non-compliant commercial venue systems are currently fully serviced and certified.</p>
            </div>
        `;
    } else {
        container.innerHTML = triageSites.map(site => {
            const isDispatched = !!site.isDispatchedOrder;
            const isCritical = site.grease > 80 || isDispatched;
            
            const region = site.location || 'UK Operational Region';

            // Target Duct/Drain Zone
            const targetZone = site.targetZone || (site.brand.includes('Water') || site.isWater ? 'Zone B — Drainage Riser & Hydro-Trap' : 'Zone A — Primary Extraction Canopy & Exhaust Ductwork');

            // Calculated Urgency Level
            const urgencyLevel = isDispatched ? 'CRITICAL (Admin Dispatched Order)' : (isCritical ? 'CRITICAL (Immediate Action Required)' : 'HIGH URGENCY (Action Required within 48 Hours)');

            // Assigned Technician Name
            const assignedTech = site.assignedTechnician || (site.dispatchDetails?.assignedEngineer ? site.dispatchDetails.assignedEngineer : 'Marcus Vance');
            const assignedTechLabel = assignedTech.startsWith('Assigned:') ? assignedTech : `Assigned: ${assignedTech}`;

            const peakGreaseMm = (site.grease * 0.05).toFixed(1);
            const tr19Score = Math.max(5, 100 - site.grease);

            // 5-Point Sensor Array Status
            const sCanopy = isCritical ? { text: 'Elevated', color: '#ff9800' } : { text: 'Normal', color: '#4caf50' };
            const sDuct = isCritical ? { text: 'Critical', color: '#ef5350' } : { text: 'Elevated', color: '#ff9800' };
            const sRiser = site.temp > 40 ? { text: 'Elevated', color: '#ff9800' } : { text: 'Normal', color: '#4caf50' };
            const sFanInlet = site.grease > 75 ? { text: 'Critical', color: '#ef5350' } : { text: 'Elevated', color: '#ff9800' };
            const sOutlet = site.temp > 42 ? { text: 'Elevated', color: '#ff9800' } : { text: 'Normal', color: '#4caf50' };

            return `
                <div class="engineer-card" style="${isDispatched ? 'border-color: rgba(0, 229, 255, 0.4); background: rgba(0, 24, 44, 0.85);' : ''}">
                    <div>
                        <div class="engineer-card-header">
                            <div>
                                <h3 class="engineer-card-title">${site.brand}</h3>
                                <div class="engineer-card-location">📍 ${region}</div>
                            </div>
                            <span class="${isDispatched ? 'badge-serviced' : (isCritical ? 'badge-high-risk' : 'badge-action-due')}" style="${isDispatched ? 'background: rgba(0,229,255,0.15); color: #00e5ff; border-color: rgba(0,229,255,0.4);' : ''}">
                                ${isDispatched ? '🚚 Dispatched Order' : (isCritical ? '🔴 Critical' : '🟡 Action Due')}
                            </span>
                        </div>

                        <!-- Target Zone & Technician & Urgency -->
                        <div style="background: rgba(15, 23, 42, 0.6); padding: 0.75rem 0.9rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 1rem; font-size: 0.82rem;">
                            <div style="color: #00e5ff; font-weight: 700; margin-bottom: 0.25rem;">🎯 Target Zone: <span style="color: #ffffff;">${targetZone}</span></div>
                            <div style="color: #ff9800; font-weight: 700; margin-bottom: 0.25rem;">⚡ Urgency: <span style="color: #ffffff;">${urgencyLevel}</span></div>
                            <div style="color: #38bdf8; font-weight: 700;">👷 Technician: <span style="color: #ffffff;">${assignedTechLabel}</span></div>
                        </div>

                        ${isDispatched ? `
                            <div style="background: rgba(0, 0, 0, 0.3); padding: 0.65rem 0.85rem; border-radius: 8px; font-size: 0.82rem; margin-bottom: 1rem; border-left: 3px solid #00e5ff;">
                                <div style="color: #00e5ff; font-weight: 700; margin-bottom: 0.2rem;">🗓️ Scheduled Service Window:</div>
                                <div style="color: #ffffff;">${site.dispatchDetails.date || 'Tomorrow'} (${site.dispatchDetails.window || 'Post-Close'})</div>
                                <div style="color: #90a4ae; font-size: 0.78rem; margin-top: 0.2rem;">📝 Notes: ${site.dispatchDetails.notes || 'Standard access'}</div>
                            </div>
                        ` : ''}

                        <div class="metrics-list">
                            <div class="metrics-list-item"><span>Peak Grease:</span> <strong>${peakGreaseMm} mm</strong></div>
                            <div class="metrics-list-item"><span>Duct Temp:</span> <strong>${site.temp}°C</strong></div>
                            <div class="metrics-list-item"><span>TR19 Score:</span> <strong>${tr19Score}%</strong></div>
                            <div class="metrics-list-item"><span>Status:</span> <strong>Action Required</strong></div>
                        </div>

                        <div style="font-size: 0.75rem; color: #90a4ae; font-weight: 600; margin-top: 0.75rem; text-transform: uppercase;">
                            5-Point Diagnostic Sensor Array
                        </div>
                        <div class="sensor-array-grid">
                            <div class="sensor-cell">
                                <span class="sensor-cell-title">Canopy</span>
                                <span style="color: ${sCanopy.color};">${sCanopy.text}</span>
                            </div>
                            <div class="sensor-cell">
                                <span class="sensor-cell-title">Duct</span>
                                <span style="color: ${sDuct.color};">${sDuct.text}</span>
                            </div>
                            <div class="sensor-cell">
                                <span class="sensor-cell-title">Riser</span>
                                <span style="color: ${sRiser.color};">${sRiser.text}</span>
                            </div>
                            <div class="sensor-cell">
                                <span class="sensor-cell-title">Fan Inlet</span>
                                <span style="color: ${sFanInlet.color};">${sFanInlet.text}</span>
                            </div>
                            <div class="sensor-cell">
                                <span class="sensor-cell-title">Outlet</span>
                                <span style="color: ${sOutlet.color};">${sOutlet.text}</span>
                            </div>
                        </div>
                    </div>

                    <button onclick="markJobCompleted('${site.id}')" class="btn btn-primary" style="width: 100%; margin-top: 1.25rem; background: linear-gradient(135deg, #3A8A33, #2e7d32); border: none; font-weight: 700; padding: 0.8rem 1rem; border-radius: 8px; cursor: pointer;">
                        Certify &amp; Complete Servicing &check;
                    </button>
                </div>
            `;
        }).join('');
    }

    // Render Recently Serviced & Certified Historical Archive
    if (servicedSites.length > 0 && servicedContainer) {
        const logs = JSON.parse(localStorage.getItem('siimCompletedLogs') || '{}');
        servicedContainer.innerHTML = servicedSites.map(site => {
            const timeStr = logs[site.id] || new Date().toLocaleString('en-GB');
            const targetZone = site.brand.includes('Water') ? 'Zone B — Drainage Riser & Hydro-Trap' : 'Zone A — Primary Extraction Canopy & Exhaust Ductwork';
            return `
                <div class="engineer-card" style="opacity: 0.95; border-color: rgba(76, 175, 80, 0.35); background: rgba(0, 24, 44, 0.75);">
                    <div class="engineer-card-header">
                        <div>
                            <h3 class="engineer-card-title">${site.brand}</h3>
                            <div class="engineer-card-location">📍 ${site.location}</div>
                        </div>
                        <span class="badge-serviced">🟢 TR19 Certified</span>
                    </div>
                    <div style="font-size: 0.8rem; color: #38bdf8; margin-bottom: 0.75rem;">
                        <strong>Target Zone:</strong> ${targetZone}
                    </div>
                    <div class="metrics-list">
                        <div class="metrics-list-item"><span>Post-Clean Grease:</span> <strong style="color: #4caf50;">0.05 mm (10%)</strong></div>
                        <div class="metrics-list-item"><span>Certified On:</span> <strong style="color: #4caf50;">${timeStr}</strong></div>
                        <div class="metrics-list-item"><span>TR19 Score:</span> <strong style="color: #4caf50;">99% (Optimal)</strong></div>
                        <div class="metrics-list-item"><span>Technician:</span> <strong style="color: #4caf50;">Marcus Vance</strong></div>
                    </div>
                </div>
            `;
        }).join('');
    }
};

window.markJobCompleted = function(siteId) {
    // 1. Reset facility risk status to optimal in site data
    const site = typeof SITE_DATA !== 'undefined' ? SITE_DATA.find(s => s.id === siteId) : null;
    if (site) {
        site.grease = 10;
        site.temp = 25;
        site.airflow = 'GOOD';
    }

    const timestamp = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString('en-GB');
    saveServicedSite(siteId, timestamp);
    
    // 2. Clear from active dispatch requests if applicable
    try {
        let requests = JSON.parse(localStorage.getItem('siim_dispatch_requests') || '[]');
        const target = requests.find(r => r.id === siteId || r.siteId === siteId);
        if (target) {
            target.status = 'completed';
            target.completedAt = timestamp;
            localStorage.setItem('siim_dispatch_requests', JSON.stringify(requests));
        }
    } catch(e) {}

    // 3. Re-render queue
    renderTriageQueue();

    // 4. Display confirmation toast
    if (typeof window.showToast === 'function') {
        window.showToast("✅ TR19 Servicing Certified. Compliance certificate issued.");
    } else {
        alert("✅ TR19 Servicing Certified. Compliance certificate issued.");
    }
};
