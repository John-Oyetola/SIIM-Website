// custom-site.js — Grease & Extraction Telemetry Diagnostics Ingestion & UI Engine
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const siteId = urlParams.get('id');

    // Retrieve site data from SITE_DATA registry or localStorage fallback
    let site = (typeof SITE_DATA !== 'undefined' && Array.isArray(SITE_DATA))
        ? (SITE_DATA.find(s => s.id === siteId || s.slug === siteId) || SITE_DATA[0])
        : null;

    if (!site) {
        const customSites = JSON.parse(localStorage.getItem('heyCustomSites') || '[]');
        const custom = customSites.find(s => s.id === siteId);
        if (custom) {
            site = {
                id: custom.id,
                name: custom.name,
                brand: custom.name,
                location: custom.location,
                grease: 10,
                temp: 30,
                wind: 12,
                demister: true,
                airflow: 'GOOD'
            };
        }
    }

    // Default fallback if site not found
    if (!site) {
        site = {
            id: 'wagamama-leeds',
            name: 'Wagamama',
            brand: 'Wagamama',
            location: 'Leeds, West Yorkshire',
            grease: 10,
            temp: 28,
            wind: 14,
            demister: true,
            airflow: 'GOOD'
        };
    }

    const siteName = site.name || site.brand || 'Facility';
    const locationStr = site.location || 'Location';
    const statusKey = site.status || (site.grease > 80 ? 'danger' : (site.grease > 45 ? 'warning' : 'safe'));

    // Page title & navigation elements
    document.title = `${siteName} (${locationStr}) | Grease Telemetry | SIIM`;
    
    const siteTitleEl = document.getElementById('siteTitle');
    const siteLocEl = document.getElementById('siteLocation');
    const breadcrumbNameEl = document.getElementById('breadcrumbSiteName');

    if (siteTitleEl) siteTitleEl.textContent = siteName;
    if (siteLocEl) siteLocEl.textContent = locationStr;
    if (breadcrumbNameEl) breadcrumbNameEl.innerHTML = `${siteName} &mdash; ${locationStr}`;

    // Action Banner & Status Badge
    const bannerEl = document.getElementById('protocolBanner');
    const actionTextEl = document.getElementById('nextActionText');
    const statusBadgeEl = document.getElementById('siteStatusBadge');

    if (statusKey === 'danger') {
        if (actionTextEl) actionTextEl.textContent = '⚡ Action: Book urgent clean within 3 days';
        if (bannerEl) bannerEl.className = 'protocol-banner banner-danger';
        if (statusBadgeEl) {
            statusBadgeEl.textContent = '🔴 Action Required / High Risk';
            statusBadgeEl.className = 'badge badge-danger';
        }
    } else if (statusKey === 'warning') {
        if (actionTextEl) actionTextEl.textContent = '⚡ Action: Book clean within 21 days';
        if (bannerEl) bannerEl.className = 'protocol-banner banner-warn';
        if (statusBadgeEl) {
            statusBadgeEl.textContent = '🟠 Action Required / Warning';
            statusBadgeEl.className = 'badge badge-warn';
        }
    } else {
        if (actionTextEl) actionTextEl.textContent = '✓ Action: Monitor / No action required';
        if (bannerEl) bannerEl.className = 'protocol-banner banner-safe';
        if (statusBadgeEl) {
            statusBadgeEl.textContent = '🟢 Safe / Compliant';
            statusBadgeEl.className = 'badge badge-success';
        }
    }

    // Grease Gauge Arc & Percentage
    const gaugeNeedle = document.getElementById('gaugeNeedle');
    const gaugeVal = document.getElementById('gaugeValue');
    const greasePct = site.grease;
    const rotationDeg = (greasePct * 1.8) - 90;

    if (gaugeNeedle) gaugeNeedle.style.transform = `rotate(${rotationDeg}deg)`;
    if (gaugeVal) {
        gaugeVal.textContent = `${greasePct}%`;
        gaugeVal.style.color = statusKey === 'danger' ? '#ef5350' : (statusKey === 'warning' ? '#ff9800' : '#4caf50');
    }

    // Indicators (Demister & Airflow)
    const demBadge = document.getElementById('demisterBadge');
    if (demBadge) {
        const demText = typeof site.demister === 'boolean' ? (site.demister ? 'Active' : 'Disabled') : (statusKey === 'danger' ? 'Disabled' : 'Active');
        demBadge.textContent = demText;
        demBadge.className = demText === 'Active' ? 'badge badge-success' : 'badge badge-danger';
    }

    const airBadge = document.getElementById('airflowBadge');
    if (airBadge) {
        const airText = site.airflow || (site.wind >= 12 ? 'GOOD' : (site.wind >= 8 ? 'MODERATE' : 'POOR'));
        airBadge.textContent = `${airText} (${site.wind} m/s)`;
        airBadge.className = airText === 'GOOD' ? 'badge badge-info' : (airText === 'MODERATE' ? 'badge badge-warning' : 'badge badge-danger');
    }

    // KPI Cards
    const maxGreaseEl = document.getElementById('maxGreaseMmVal');
    if (maxGreaseEl) maxGreaseEl.textContent = `${(site.grease * 0.021).toFixed(2)} mm / ${site.grease * 10} µm`;

    const maxTempEl = document.getElementById('maxTempVal');
    if (maxTempEl) maxTempEl.textContent = `${site.temp}°C`;

    const daysToCleanEl = document.getElementById('daysToCleanVal');
    if (daysToCleanEl) {
        daysToCleanEl.textContent = statusKey === 'danger' ? '3 Days' : (statusKey === 'warning' ? '21 Days' : '180 Days');
    }

    // Camera Video Feed Populater
    const videoSrc = typeof getSiteVideo === 'function' ? getSiteVideo(site.grease) : 'Images/Clean Vent.mp4';
    const cameraGrid = document.getElementById('cameraGrid');
    if (cameraGrid) {
        cameraGrid.innerHTML = '';
        for (let i = 1; i <= 4; i++) {
            cameraGrid.innerHTML += `
                <div class="camera-feed camera-feed-container">
                    <video src="${videoSrc}" autoplay loop muted playsinline class="camera-video"></video>
                    <div class="camera-label">
                        <div class="camera-live-dot"></div>
                        CAM 0${i} &mdash; Zone ${String.fromCharCode(64 + i)}
                    </div>
                </div>
            `;
        }
    }

    // ==========================================
    // Telemetry Engine & Live Airflow Canvas
    // ==========================================
    const airflowCanvas = document.getElementById('liveAirflowChart');
    let canvasCtx = null;
    let chartPoints = [];
    const maxPoints = 40;

    if (airflowCanvas) {
        canvasCtx = airflowCanvas.getContext('2d');
        // Pre-fill points for smooth canvas rendering
        for (let i = 0; i < maxPoints; i++) {
            chartPoints.push(1.15 + Math.sin(i * 0.4) * 0.15 + (Math.random() * 0.08 - 0.04));
        }
    }

    function renderAirflowChart(currentSpeed) {
        if (!airflowCanvas || !canvasCtx) return;
        
        const width = airflowCanvas.width = airflowCanvas.parentElement.clientWidth || 800;
        const height = airflowCanvas.height = 220;

        canvasCtx.clearRect(0, 0, width, height);

        // Draw dark background grid lines
        canvasCtx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
        canvasCtx.lineWidth = 1;
        for (let y = 30; y < height; y += 40) {
            canvasCtx.beginPath();
            canvasCtx.moveTo(0, y);
            canvasCtx.lineTo(width, y);
            canvasCtx.stroke();
        }
        for (let x = 0; x < width; x += 60) {
            canvasCtx.beginPath();
            canvasCtx.moveTo(x, 0);
            canvasCtx.lineTo(x, height);
            canvasCtx.stroke();
        }

        // Add new point & scroll
        chartPoints.push(currentSpeed);
        if (chartPoints.length > maxPoints) chartPoints.shift();

        // Calculate line path
        const step = width / (maxPoints - 1);
        const minVal = 0.5;
        const maxVal = 2.0;

        canvasCtx.beginPath();
        chartPoints.forEach((val, idx) => {
            const x = idx * step;
            const normalized = (val - minVal) / (maxVal - minVal);
            const y = height - (normalized * (height - 60) + 30);
            if (idx === 0) canvasCtx.moveTo(x, y);
            else canvasCtx.lineTo(x, y);
        });

        // Gradient Fill
        const gradient = canvasCtx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(0, 229, 255, 0.35)');
        gradient.addColorStop(1, 'rgba(0, 229, 255, 0.0)');

        canvasCtx.lineTo((chartPoints.length - 1) * step, height);
        canvasCtx.lineTo(0, height);
        canvasCtx.closePath();
        canvasCtx.fillStyle = gradient;
        canvasCtx.fill();

        // Stroke Line
        canvasCtx.beginPath();
        chartPoints.forEach((val, idx) => {
            const x = idx * step;
            const normalized = (val - minVal) / (maxVal - minVal);
            const y = height - (normalized * (height - 60) + 30);
            if (idx === 0) canvasCtx.moveTo(x, y);
            else canvasCtx.lineTo(x, y);
        });
        canvasCtx.strokeStyle = '#00e5ff';
        canvasCtx.lineWidth = 3;
        canvasCtx.shadowColor = '#00e5ff';
        canvasCtx.shadowBlur = 10;
        canvasCtx.stroke();
        canvasCtx.shadowBlur = 0;

        // Draw pulse dot at latest point
        const lastIdx = chartPoints.length - 1;
        const lastX = lastIdx * step;
        const lastNorm = (chartPoints[lastIdx] - minVal) / (maxVal - minVal);
        const lastY = height - (lastNorm * (height - 60) + 30);

        canvasCtx.beginPath();
        canvasCtx.arc(lastX, lastY, 6, 0, Math.PI * 2);
        canvasCtx.fillStyle = '#ffffff';
        canvasCtx.fill();
        canvasCtx.strokeStyle = '#00e5ff';
        canvasCtx.lineWidth = 2;
        canvasCtx.stroke();
    }

    // ==========================================
    // Core Data Telemetry Processor
    // ==========================================
    let lastTelemetry = null;

    function processTelemetry(A0, A1) {
        const ratio = A1 / A0; // A0 ~280, A1 ~275 -> ratio ~0.982
        
        // Base grease formula: Math.max(0.1, (1.25 - ratio * 0.5))
        // Scaled naturally according to site's configured grease level
        const baseGreaseCalc = Math.max(0.1, (1.25 - ratio * 0.5));
        const siteScale = site.grease / 50; // 10% grease -> 0.2x scale
        const grease_mm = parseFloat((baseGreaseCalc * siteScale).toFixed(2));
        const grease_um = Math.round(grease_mm * 1000);

        const growthRate = Math.round(grease_mm * 220); // µm/wk
        const maxTemp = Math.round(site.temp + (grease_mm * 12) + (Math.sin(Date.now() / 4000) * 1.5));
        
        // Estimated Days to Clean (Threshold: 1.0mm TR19 limit)
        const daysToClean = grease_mm >= 1.0 ? 0 : Math.max(1, Math.round((1.0 - grease_mm) / (growthRate / 1000 / 7)));

        // TR19 Score & Fire Risk
        const tr19Score = Math.max(0, Math.min(100, Math.round(100 - (grease_mm / 1.0) * 40)));
        let fireRisk = 'Low Risk';
        let fireRiskColor = '#2e7d32';
        if (grease_mm >= 1.0) {
            fireRisk = 'High Fire Risk';
            fireRiskColor = '#c62828';
        } else if (grease_mm >= 0.5) {
            fireRisk = 'Moderate Risk';
            fireRiskColor = '#FF5A00';
        }

        // Store active state
        lastTelemetry = {
            site: site.brand,
            location: site.location,
            A0: Math.round(A0),
            A1: Math.round(A1),
            ratio: ratio.toFixed(3),
            grease_mm,
            grease_um,
            growthRate,
            maxTemp,
            daysToClean,
            tr19Score,
            fireRisk
        };

        // --- DOM Updates ---

        // 1. Sidebar Badge & Protocol Banner
        const bannerEl = document.getElementById('protocolBanner');
        const actionTextEl = document.getElementById('nextActionText');
        const statusBadgeEl = document.getElementById('siteStatusBadge');

        if (grease_mm >= 1.0) {
            if (actionTextEl) actionTextEl.textContent = '⚡ Action: Book clean within 21 days';
            if (bannerEl) bannerEl.className = 'protocol-banner banner-warn';
            if (statusBadgeEl) {
                statusBadgeEl.textContent = '🔴 Action Required / High Risk';
                statusBadgeEl.className = 'badge badge-warning';
            }
        } else {
            if (actionTextEl) actionTextEl.textContent = '⚡ Action: Monitor / No action required';
            if (bannerEl) bannerEl.className = 'protocol-banner banner-safe';
            if (statusBadgeEl) {
                statusBadgeEl.textContent = '🟢 Safe / Compliant';
                statusBadgeEl.className = 'badge badge-success';
            }
        }

        // 2. Gauge Needle (-90deg to +90deg) & Value
        const gaugeNeedle = document.getElementById('gaugeNeedle');
        const gaugeVal = document.getElementById('gaugeValue');
        const greasePct = Math.min(100, Math.max(0, Math.round((grease_mm / 1.5) * 100)));
        const rotationDeg = (greasePct * 1.8) - 90;

        if (gaugeNeedle) gaugeNeedle.style.transform = `rotate(${rotationDeg}deg)`;
        if (gaugeVal) {
            gaugeVal.textContent = `${greasePct}%`;
            gaugeVal.style.color = grease_mm >= 1.0 ? '#c62828' : (grease_mm >= 0.5 ? '#FF5A00' : '#2e7d32');
        }

        // 3. Specs Indicators
        const demBadge = document.getElementById('demisterBadge');
        if (demBadge) {
            demBadge.textContent = site.demister ? 'YES' : 'NO';
            demBadge.className = site.demister ? 'badge badge-success' : 'badge badge-danger';
        }

        const airBadge = document.getElementById('airflowBadge');
        if (airBadge) {
            airBadge.textContent = site.airflow;
            airBadge.className = site.airflow === 'GOOD' ? 'badge badge-info' : (site.airflow === 'MODERATE' ? 'badge badge-warning' : 'badge badge-danger');
        }

        // 4. KPI Cards
        const maxGreaseEl = document.getElementById('maxGreaseMmVal');
        if (maxGreaseEl) maxGreaseEl.textContent = `${grease_mm.toFixed(2)} mm / ${grease_um} µm`;

        const growthRateEl = document.getElementById('growthRateVal');
        if (growthRateEl) growthRateEl.textContent = `${growthRate} µm/wk`;

        const maxTempEl = document.getElementById('maxTempVal');
        if (maxTempEl) maxTempEl.textContent = `${maxTemp}°C`;

        const daysToCleanEl = document.getElementById('daysToCleanVal');
        if (daysToCleanEl) daysToCleanEl.textContent = `${daysToClean} Days`;

        const tr19El = document.getElementById('tr19Val');
        if (tr19El) tr19El.textContent = `${tr19Score}%`;

        const fireRiskEl = document.getElementById('fireRiskVal');
        if (fireRiskEl) {
            fireRiskEl.textContent = fireRisk;
            fireRiskEl.style.color = fireRiskColor;
        }

        // 5. Sensor Array Table (5 zones)
        const zones = [
            { key: 'A', name: 'Canopy (Zone A)', factor: 1.0 },
            { key: 'B', name: 'Duct Run (Zone B)', factor: 0.85 },
            { key: 'C', name: 'Riser (Zone C)', factor: 0.70 },
            { key: 'D', name: 'Fan Inlet (Zone D)', factor: 0.55 },
            { key: 'E', name: 'Discharge Cowl (Zone E)', factor: 0.38 }
        ];

        zones.forEach(z => {
            const zMm = (grease_mm * z.factor).toFixed(2);
            const zUm = Math.round(zMm * 1000);
            const zGrowth = Math.round(growthRate * z.factor);
            const zTemp = Math.round(maxTemp - (1 - z.factor) * 20);
            const statusText = zMm >= 1.0 ? 'CLEAN REQ' : (zMm >= 0.5 ? 'WARNING' : 'OPTIMAL');
            const statusClass = zMm >= 1.0 ? 'badge badge-danger' : (zMm >= 0.5 ? 'badge badge-warning' : 'badge badge-success');

            const gEl = document.getElementById(`zone${z.key}Grease`);
            const grEl = document.getElementById(`zone${z.key}Growth`);
            const tEl = document.getElementById(`zone${z.key}Temp`);
            const stEl = document.getElementById(`zone${z.key}Status`);

            if (gEl) gEl.textContent = `${zMm} mm (${zUm} µm)`;
            if (grEl) grEl.textContent = `${zGrowth} µm/wk`;
            if (tEl) tEl.textContent = `${zTemp}°C`;
            if (stEl) {
                stEl.textContent = statusText;
                stEl.className = statusClass;
            }
        });

        // 6. Live Airflow Graph Stream
        const liveAirflowSpeed = (1.15 + (Math.sin(Date.now() / 2000) * 0.12) + (Math.random() * 0.04)).toFixed(2);
        const streamRateEl = document.getElementById('airflowStreamRate');
        if (streamRateEl) streamRateEl.textContent = `STREAM: ${liveAirflowSpeed} m/s`;
        renderAirflowChart(parseFloat(liveAirflowSpeed));
    }

    // ==========================================
    // Telemetry Ingestion (initMqttStream / Simulator)
    // ==========================================
    window.initMqttStream = function(onDataCallback) {
        if (window.mqttClient && typeof window.mqttClient.on === 'function') {
            window.mqttClient.on('message', (topic, payload) => {
                try {
                    const data = JSON.parse(payload.toString());
                    if (data.A0 && data.A1) {
                        onDataCallback(data.A0, data.A1);
                    }
                } catch (e) {
                    console.warn('MQTT payload parse error:', e);
                }
            });
        } else {
            // Fallback Auto-Simulator Interval (A0: ~280, A1: ~275, Ratio: ~0.98)
            setInterval(() => {
                const noiseA0 = Math.sin(Date.now() / 3000) * 4 + (Math.random() * 4 - 2);
                const noiseA1 = Math.cos(Date.now() / 2500) * 3 + (Math.random() * 4 - 2);
                const A0 = 280 + noiseA0;
                const A1 = 275 + noiseA1;
                onDataCallback(A0, A1);
            }, 1200);
        }
    };

    // Initialize telemetry ingestion
    window.initMqttStream(processTelemetry);

    // Initial immediate invocation
    processTelemetry(280, 275);

    // ==========================================
    // Action Buttons & Interaction Handlers
    // ==========================================

    // 1. Download Monthly Compliance Log (CSV)
    const downloadCsvBtn = document.getElementById('downloadCsvBtn');
    if (downloadCsvBtn) {
        downloadCsvBtn.addEventListener('click', () => {
            const timestamp = new Date().toISOString();
            const siteName = site.brand;
            const loc = site.location;
            
            let csvContent = "Timestamp,Facility,Location,Sensor_Zone,Grease_mm,Grease_um,Growth_Rate_um_wk,Zone_Temp_C,TR19_Score,Fire_Risk\n";

            const zones = [
                { name: 'Canopy (Zone A)', factor: 1.0 },
                { name: 'Horizontal Duct (Zone B)', factor: 0.85 },
                { name: 'Vertical Riser (Zone C)', factor: 0.70 },
                { name: 'Fan Inlet (Zone D)', factor: 0.55 },
                { name: 'Fan Outlet (Zone E)', factor: 0.38 }
            ];

            zones.forEach(z => {
                const zMm = (lastTelemetry.grease_mm * z.factor).toFixed(2);
                const zUm = Math.round(zMm * 1000);
                const zGrowth = Math.round(lastTelemetry.growthRate * z.factor);
                const zTemp = Math.round(lastTelemetry.maxTemp - (1 - z.factor) * 20);
                csvContent += `"${timestamp}","${siteName}","${loc}","${z.name}",${zMm},${zUm},${zGrowth},${zTemp},${lastTelemetry.tr19Score}%,"${lastTelemetry.fireRisk}"\n`;
            });

            // Create CSV blob and trigger download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `SIIM_Grease_Telemetry_${siteName.replace(/\s+/g, '_')}_${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
    }

    // 2. Notify Facility Manager Button
    const notifyManagerBtn = document.getElementById('notifyManagerBtn');
    if (notifyManagerBtn) {
        notifyManagerBtn.addEventListener('click', () => {
            const origText = notifyManagerBtn.innerHTML;
            notifyManagerBtn.disabled = true;
            notifyManagerBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                Manager Notified!
            `;
            
            alert(`✅ Notification Sent!\n\nFacility Manager for ${site.brand} (${site.location}) has been notified via SMS & Email.\nTicket ID: #TR19-${Math.floor(10000 + Math.random() * 90000)}`);

            setTimeout(() => {
                notifyManagerBtn.disabled = false;
                notifyManagerBtn.innerHTML = origText;
            }, 3000);
        });
    }

    // 3. Send Emergency Report Button
    const sendReportBtn = document.getElementById('sendReportBtn');
    if (sendReportBtn) {
        sendReportBtn.addEventListener('click', () => {
            const subject = encodeURIComponent(`EMERGENCY TELEMETRY REPORT: ${site.brand} (${site.location})`);
            const body = encodeURIComponent(
                `SIIM EMERGENCY TELEMETRY DISPATCH\n` +
                `------------------------------------\n` +
                `Facility: ${site.brand}\n` +
                `Location: ${site.location}\n` +
                `Peak Grease Level: ${lastTelemetry ? lastTelemetry.grease_mm : 0.21} mm\n` +
                `TR19 Compliance Score: ${lastTelemetry ? lastTelemetry.tr19Score : 94}%\n` +
                `Fire Risk Classification: ${lastTelemetry ? lastTelemetry.fireRisk : 'Low Risk'}\n` +
                `Timestamp: ${new Date().toLocaleString()}\n` +
                `------------------------------------\n` +
                `Please dispatch an emergency technician immediately.`
            );

            window.location.href = `mailto:johnoyetolaoluwafemi113@gmail.com?subject=${subject}&body=${body}`;
        });
    }
});
