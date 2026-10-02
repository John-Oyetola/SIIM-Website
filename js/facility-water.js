// facility-water.js — Facility Water & Drainage Telemetry Diagnostics Engine
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const siteId = urlParams.get('id');

    // Retrieve site data from SITE_DATA registry or localStorage fallback
    const currentSite = (typeof SITE_DATA !== 'undefined' && Array.isArray(SITE_DATA))
        ? (SITE_DATA.find(s => s.id === siteId || s.slug === siteId) || SITE_DATA[0])
        : null;

    let site = currentSite;

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
                airflow: 'GOOD',
                status: 'safe'
            };
        }
    }

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
            airflow: 'GOOD',
            status: 'safe'
        };
    }

    const siteDisplayName = site.name || site.brand || 'Facility';
    const facilityTitle = siteDisplayName.toLowerCase().includes('drainage') ? siteDisplayName : `${siteDisplayName} Drainage`;
    const locationStr = site.location || 'Location';
    
    // Status determination matching status string directly
    const statusKey = site.status || (site.grease > 80 ? 'danger' : (site.grease > 45 ? 'warning' : 'safe'));

    // Page title & navigation elements
    document.title = `${facilityTitle} (${locationStr}) | Hydro-Diagnostics | SIIM`;
    
    const waterTitleEl = document.getElementById('waterSiteTitle');
    const waterLocEl = document.getElementById('waterSiteLocation');
    const breadcrumbNameEl = document.getElementById('breadcrumbSiteName');

    if (waterTitleEl) waterTitleEl.textContent = facilityTitle;
    if (waterLocEl) waterLocEl.textContent = locationStr;
    if (breadcrumbNameEl) breadcrumbNameEl.innerHTML = `${facilityTitle} &mdash; ${locationStr}`;

    // ==========================================
    // Telemetry Diagnostic Data Mapping
    // ==========================================
    const statusBadgeEl = document.getElementById('waterSiteStatusBadge');
    const actionBannerHeader = document.getElementById('waterActionProtocolHeader');
    const actionTextEl = document.getElementById('waterActionText');

    const gaugeNeedle = document.getElementById('waterGaugeNeedle');
    const gaugeVal = document.getElementById('waterGaugeVal');
    const gaugeArc = document.getElementById('waterGaugeArc');
    const gaugeBg = document.getElementById('waterGaugeBg');

    const pipeCapEl = document.getElementById('pipeCapacityVal');
    const flowRateEl = document.getElementById('flowRateVal');
    const ratioEl = document.getElementById('transmissionRatioVal');
    const daysToDescaleEl = document.getElementById('daysToDescaleVal');
    const drainHealthEl = document.getElementById('drainHealthVal');
    const impedanceRiskEl = document.getElementById('impedanceRiskVal');
    const valveBadge = document.getElementById('waterValveBadge');
    const flowBadge = document.getElementById('waterFlowBadge');

    const a0ValEl = document.getElementById('a0EnergyVal');
    const a1ValEl = document.getElementById('a1EnergyVal');
    const ratioPctEl = document.getElementById('ratioPercentVal');
    const a0StatusEl = document.getElementById('a0Status');
    const a1StatusEl = document.getElementById('a1Status');

    let baseA0 = 281.2;
    let baseA1 = 279.0;

    if (statusKey === 'danger' || statusKey === 'critical') {
        // TIER 1: DANGER / CRITICAL
        baseA1 = 180.5;

        // 1. Gauge: 86% (Red arc)
        const loadPct = 86;
        const rotationDeg = (loadPct * 1.8) - 90; // 64.8deg
        if (gaugeNeedle) gaugeNeedle.style.transform = `rotate(${rotationDeg}deg)`;
        if (gaugeVal) {
            gaugeVal.textContent = '86%';
            gaugeVal.style.color = '#ef4444';
        }
        if (gaugeArc) {
            gaugeArc.style.stroke = '#ef4444';
            gaugeArc.style.strokeDashoffset = '27.7'; // 197.9 * (1 - 0.86)
        }
        if (gaugeBg) {
            gaugeBg.style.background = 'conic-gradient(from 270deg, #ef4444 0deg, #ef4444 154.8deg, rgba(255,255,255,0.08) 154.8deg 180deg, transparent 180deg)';
        }

        // 2. Status Badge: "CRITICAL IMPEDANCE"
        if (statusBadgeEl) {
            statusBadgeEl.className = 'badge badge-danger';
            statusBadgeEl.textContent = 'CRITICAL IMPEDANCE';
        }

        // 3. Action Banner: background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5;
        if (actionBannerHeader) {
            actionBannerHeader.className = 'protocol-banner banner-danger';
            actionBannerHeader.style.cssText = 'display: block; background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5; padding: 1.25rem; border-radius: 12px;';
        }
        if (actionTextEl) {
            actionTextEl.textContent = '⚡ CRITICAL HAZARD: Immediate hydraulic blockage detected. Acoustic transmission collapsed.';
        }

        // 4. KPI Tiles
        if (pipeCapEl) pipeCapEl.textContent = '86%';
        if (flowRateEl) flowRateEl.textContent = '14 L/min — Throttled';
        if (ratioEl) ratioEl.textContent = '0.642 (Severe Calcification Breach)';
        if (daysToDescaleEl) daysToDescaleEl.textContent = '1 Day (Immediate Service Required)';
        if (drainHealthEl) drainHealthEl.textContent = '24/100 (Critical Failure Risk)';
        if (impedanceRiskEl) {
            impedanceRiskEl.textContent = 'HIGH RISK (Emergency Dispatch Queue)';
            impedanceRiskEl.style.color = '#ef4444';
        }

        // 5. Badges
        if (valveBadge) {
            valveBadge.textContent = 'THROTTLED';
            valveBadge.className = 'badge badge-danger';
        }
        if (flowBadge) {
            flowBadge.textContent = 'CRITICAL';
            flowBadge.className = 'badge badge-danger';
        }

        // 6. Sensor Array Table
        if (a0ValEl) a0ValEl.textContent = '281.2';
        if (a1ValEl) a1ValEl.textContent = '180.5';
        if (ratioPctEl) ratioPctEl.textContent = '64.2%';
        if (a0StatusEl) {
            a0StatusEl.textContent = 'Optimal';
            a0StatusEl.className = 'badge badge-success';
        }
        if (a1StatusEl) {
            a1StatusEl.textContent = 'Severe Impedance';
            a1StatusEl.className = 'badge badge-danger';
        }

    } else if (statusKey === 'warning' || statusKey === 'action-due') {
        // TIER 2: WARNING / ACTION DUE
        baseA1 = 228.3;

        // 1. Gauge: 64% (Amber arc)
        const loadPct = 64;
        const rotationDeg = (loadPct * 1.8) - 90; // 25.2deg
        if (gaugeNeedle) gaugeNeedle.style.transform = `rotate(${rotationDeg}deg)`;
        if (gaugeVal) {
            gaugeVal.textContent = '64%';
            gaugeVal.style.color = '#f59e0b';
        }
        if (gaugeArc) {
            gaugeArc.style.stroke = '#f59e0b';
            gaugeArc.style.strokeDashoffset = '71.2'; // 197.9 * (1 - 0.64)
        }
        if (gaugeBg) {
            gaugeBg.style.background = 'conic-gradient(from 270deg, #f59e0b 0deg, #f59e0b 115.2deg, rgba(255,255,255,0.08) 115.2deg 180deg, transparent 180deg)';
        }

        // 2. Status Badge: "RESTRICTED FLOW"
        if (statusBadgeEl) {
            statusBadgeEl.className = 'badge badge-warn';
            statusBadgeEl.textContent = 'RESTRICTED FLOW';
        }

        // 3. Action Banner: background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; color: #fcd34d;
        if (actionBannerHeader) {
            actionBannerHeader.className = 'protocol-banner banner-warn';
            actionBannerHeader.style.cssText = 'display: block; background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; color: #fcd34d; padding: 1.25rem; border-radius: 12px;';
        }
        if (actionTextEl) {
            actionTextEl.textContent = '⚡ ACTION REQUIRED: Acoustic impedance elevated. Pipeline descaling required within 14 days.';
        }

        // 4. KPI Tiles
        if (pipeCapEl) pipeCapEl.textContent = '64%';
        if (flowRateEl) flowRateEl.textContent = '28 L/min — Restricted';
        if (ratioEl) ratioEl.textContent = '0.812 (Sediment Accumulation)';
        if (daysToDescaleEl) daysToDescaleEl.textContent = '14 Days';
        if (drainHealthEl) drainHealthEl.textContent = '58/100 (Degraded Flow)';
        if (impedanceRiskEl) {
            impedanceRiskEl.textContent = 'ELEVATED (Service Scheduled)';
            impedanceRiskEl.style.color = '#f59e0b';
        }

        // 5. Badges
        if (valveBadge) {
            valveBadge.textContent = 'OPEN';
            valveBadge.className = 'badge badge-warn';
        }
        if (flowBadge) {
            flowBadge.textContent = 'RESTRICTED';
            flowBadge.className = 'badge badge-warn';
        }

        // 6. Sensor Array Table
        if (a0ValEl) a0ValEl.textContent = '281.2';
        if (a1ValEl) a1ValEl.textContent = '228.3';
        if (ratioPctEl) ratioPctEl.textContent = '81.2%';
        if (a0StatusEl) {
            a0StatusEl.textContent = 'Optimal';
            a0StatusEl.className = 'badge badge-success';
        }
        if (a1StatusEl) {
            a1StatusEl.textContent = 'Sediment Accumulation';
            a1StatusEl.className = 'badge badge-warn';
        }

    } else {
        // TIER 3: SAFE / COMPLIANT (DEFAULT)
        baseA1 = 279.0;

        // 1. Gauge: 16% (Green arc)
        const loadPct = 16;
        const rotationDeg = (loadPct * 1.8) - 90; // -61.2deg
        if (gaugeNeedle) gaugeNeedle.style.transform = `rotate(${rotationDeg}deg)`;
        if (gaugeVal) {
            gaugeVal.textContent = '16%';
            gaugeVal.style.color = '#22c55e';
        }
        if (gaugeArc) {
            gaugeArc.style.stroke = '#22c55e';
            gaugeArc.style.strokeDashoffset = '166.2'; // 197.9 * (1 - 0.16)
        }
        if (gaugeBg) {
            gaugeBg.style.background = 'conic-gradient(from 270deg, #22c55e 0deg, #22c55e 28.8deg, rgba(255,255,255,0.08) 28.8deg 180deg, transparent 180deg)';
        }

        // 2. Status Badge: "OPTIMAL FLOW"
        if (statusBadgeEl) {
            statusBadgeEl.className = 'badge badge-success';
            statusBadgeEl.textContent = 'OPTIMAL FLOW';
        }

        // 3. Action Banner: background: rgba(34, 197, 94, 0.15); border: 1px solid #22c55e; color: #86efac;
        if (actionBannerHeader) {
            actionBannerHeader.className = 'protocol-banner banner-safe';
            actionBannerHeader.style.cssText = 'display: block; background: rgba(34, 197, 94, 0.15); border: 1px solid #22c55e; color: #86efac; padding: 1.25rem; border-radius: 12px;';
        }
        if (actionTextEl) {
            actionTextEl.textContent = '✓ Normal Hydraulic Flow: Routine Monitoring Cycle';
        }

        // 4. KPI Tiles
        if (pipeCapEl) pipeCapEl.textContent = '16%';
        if (flowRateEl) flowRateEl.textContent = '43 L/min';
        if (ratioEl) ratioEl.textContent = '0.992 (Nominal Hydro-Acoustic Wave)';
        if (daysToDescaleEl) daysToDescaleEl.textContent = '175 Days';
        if (drainHealthEl) drainHealthEl.textContent = '97/100 (Optimal)';
        if (impedanceRiskEl) {
            impedanceRiskEl.textContent = 'LOW RISK';
            impedanceRiskEl.style.color = '#22c55e';
        }

        // 5. Badges
        if (valveBadge) {
            valveBadge.textContent = 'OPEN';
            valveBadge.className = 'badge badge-success';
        }
        if (flowBadge) {
            flowBadge.textContent = 'OPTIMAL';
            flowBadge.className = 'badge badge-info';
        }

        // 6. Sensor Array Table
        if (a0ValEl) a0ValEl.textContent = '281.2';
        if (a1ValEl) a1ValEl.textContent = '279.0';
        if (ratioPctEl) ratioPctEl.textContent = '99.2%';
        if (a0StatusEl) {
            a0StatusEl.textContent = 'Optimal';
            a0StatusEl.className = 'badge badge-success';
        }
        if (a1StatusEl) {
            a1StatusEl.textContent = 'Optimal';
            a1StatusEl.className = 'badge badge-success';
        }
    }

    const fluidTempEl = document.getElementById('fluidTempVal');
    if (fluidTempEl) {
        fluidTempEl.textContent = site.temp ? `${site.temp}°C` : '36°C';
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
                        CAM 0${i} &mdash; Hydro Zone ${i}
                    </div>
                </div>
            `;
        }
    }

    // ==========================================
    // Multi-Line Live Rolling Acoustic Canvas
    // ==========================================
    const waterCanvas = document.getElementById('liveWaterAcousticChart');
    let canvasCtx = null;
    let a0Points = [];
    let a1Points = [];
    let combinedPoints = [];
    const maxPoints = 40;

    if (waterCanvas) {
        canvasCtx = waterCanvas.getContext('2d');
        // Pre-fill points for initial rendering based on site baseline
        for (let i = 0; i < maxPoints; i++) {
            const base0 = baseA0 + Math.sin(i * 0.3) * 6;
            const base1 = baseA1 + Math.cos(i * 0.3) * 5;
            a0Points.push(base0);
            a1Points.push(base1);
            combinedPoints.push((base0 + base1) / 2);
        }
    }

    function renderAcousticChart(currentA0, currentA1) {
        if (!waterCanvas || !canvasCtx) return;

        const width = waterCanvas.width = waterCanvas.parentElement.clientWidth || 800;
        const height = waterCanvas.height = 220;

        canvasCtx.clearRect(0, 0, width, height);

        // Grid lines
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

        // Push new points
        a0Points.push(currentA0);
        a1Points.push(currentA1);
        combinedPoints.push((currentA0 + currentA1) / 2);

        if (a0Points.length > maxPoints) a0Points.shift();
        if (a1Points.length > maxPoints) a1Points.shift();
        if (combinedPoints.length > maxPoints) combinedPoints.shift();

        const step = width / (maxPoints - 1);
        const minVal = 150;
        const maxVal = 320;

        // Draw Line Function
        function drawLine(points, color, widthLine, glow) {
            canvasCtx.beginPath();
            points.forEach((val, idx) => {
                const x = idx * step;
                const normalized = (val - minVal) / (maxVal - minVal);
                const y = height - (normalized * (height - 60) + 30);
                if (idx === 0) canvasCtx.moveTo(x, y);
                else canvasCtx.lineTo(x, y);
            });
            canvasCtx.strokeStyle = color;
            canvasCtx.lineWidth = widthLine;
            if (glow) {
                canvasCtx.shadowColor = color;
                canvasCtx.shadowBlur = 8;
            } else {
                canvasCtx.shadowBlur = 0;
            }
            canvasCtx.stroke();
            canvasCtx.shadowBlur = 0;
        }

        // Line 1: A0 (Inlet Energy - Cyan)
        drawLine(a0Points, '#00e5ff', 2.5, true);

        // Line 2: A1 (Downpipe Energy - Orange/Red)
        const a1Color = statusKey === 'danger' ? '#ef4444' : (statusKey === 'warning' ? '#f59e0b' : '#FF5A00');
        drawLine(a1Points, a1Color, 2, true);

        // Line 3: Combined Hydro Energy (Gradient Fill under curve)
        const gradient = canvasCtx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(58, 138, 51, 0.25)');
        gradient.addColorStop(1, 'rgba(58, 138, 51, 0.0)');

        canvasCtx.beginPath();
        combinedPoints.forEach((val, idx) => {
            const x = idx * step;
            const normalized = (val - minVal) / (maxVal - minVal);
            const y = height - (normalized * (height - 60) + 30);
            if (idx === 0) canvasCtx.moveTo(x, y);
            else canvasCtx.lineTo(x, y);
        });
        canvasCtx.lineTo((combinedPoints.length - 1) * step, height);
        canvasCtx.lineTo(0, height);
        canvasCtx.closePath();
        canvasCtx.fillStyle = gradient;
        canvasCtx.fill();

        // Draw pulse dot at latest A0 point
        const lastIdx = a0Points.length - 1;
        const lastX = lastIdx * step;
        const lastNorm = (a0Points[lastIdx] - minVal) / (maxVal - minVal);
        const lastY = height - (lastNorm * (height - 60) + 30);

        canvasCtx.beginPath();
        canvasCtx.arc(lastX, lastY, 5, 0, Math.PI * 2);
        canvasCtx.fillStyle = '#ffffff';
        canvasCtx.fill();
        canvasCtx.strokeStyle = '#00e5ff';
        canvasCtx.lineWidth = 2;
        canvasCtx.stroke();
    }

    let lastWaterTelemetry = {
        site: site.brand,
        location: site.location,
        A0: baseA0.toFixed(1),
        A1: baseA1.toFixed(1),
        ratio: (baseA1 / baseA0).toFixed(3),
        flowRate: statusKey === 'danger' ? 14 : (statusKey === 'warning' ? 28 : 43),
        capacity: statusKey === 'danger' ? 86 : (statusKey === 'warning' ? 64 : 16),
        fluidTemp: site.temp || 36,
        drainHealth: statusKey === 'danger' ? 24 : (statusKey === 'warning' ? 58 : 97),
        impedanceRisk: statusKey === 'danger' ? 'HIGH RISK' : (statusKey === 'warning' ? 'ELEVATED' : 'LOW RISK')
    };

    function updateLiveAcousticStream(A0, A1) {
        lastWaterTelemetry.A0 = A0.toFixed(1);
        lastWaterTelemetry.A1 = A1.toFixed(1);

        const acousticBadge = document.getElementById('acousticStreamBadge');
        if (acousticBadge) acousticBadge.textContent = `A0: ${A0.toFixed(1)} | A1: ${A1.toFixed(1)}`;
        renderAcousticChart(A0, A1);
    }

    // Telemetry Stream Pulse Simulator
    window.initMqttStream = function(onDataCallback) {
        setInterval(() => {
            const noiseA0 = (Math.random() * 3 - 1.5) + Math.sin(Date.now() / 4000) * 3;
            const noiseA1 = (Math.random() * 3 - 1.5) + Math.cos(Date.now() / 3500) * 2;
            const A0 = baseA0 + noiseA0;
            const A1 = baseA1 + noiseA1;
            onDataCallback(A0, A1);
        }, 3000);
    };

    window.initMqttStream(updateLiveAcousticStream);
    updateLiveAcousticStream(baseA0, baseA1);

    // ==========================================
    // Action Buttons & Interaction Handlers
    // ==========================================

    // 1. Download Water Compliance Log (CSV)
    const downloadWaterCsvBtn = document.getElementById('downloadWaterCsvBtn');
    if (downloadWaterCsvBtn) {
        downloadWaterCsvBtn.addEventListener('click', () => {
            const timestamp = new Date().toISOString();
            const siteName = site.brand;
            const loc = site.location;

            let csvContent = "Timestamp,Facility,Location,Sensor_Position,Raw_Acoustic_Energy,Transmission_Ratio,Flow_Rate_Lmin,Capacity_Percent,Fluid_Temp_C,Drain_Health,Risk\n";
            csvContent += `"${timestamp}","${siteName} Drainage","${loc}","Inlet / Before U-Bend (A0)",${lastWaterTelemetry.A0},1.000,${lastWaterTelemetry.flowRate},${lastWaterTelemetry.capacity},${lastWaterTelemetry.fluidTemp},${lastWaterTelemetry.drainHealth},"${lastWaterTelemetry.impedanceRisk}"\n`;
            csvContent += `"${timestamp}","${siteName} Drainage","${loc}","Downpipe Vertical +500mm (A1)",${lastWaterTelemetry.A1},${lastWaterTelemetry.ratio},${lastWaterTelemetry.flowRate},${lastWaterTelemetry.capacity},${lastWaterTelemetry.fluidTemp},${lastWaterTelemetry.drainHealth},"${lastWaterTelemetry.impedanceRisk}"\n`;

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `SIIM_Water_Compliance_${siteName.replace(/\s+/g, '_')}_${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
    }

    // 2. Dispatch Drainage Specialist Button
    const dispatchWaterSpecialistBtn = document.getElementById('dispatchWaterSpecialistBtn');
    if (dispatchWaterSpecialistBtn) {
        dispatchWaterSpecialistBtn.addEventListener('click', () => {
            const origText = dispatchWaterSpecialistBtn.innerHTML;
            dispatchWaterSpecialistBtn.disabled = true;
            dispatchWaterSpecialistBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                Specialist Dispatched!
            `;

            alert(`✅ Dispatch Confirmed!\n\nSpecialist Drainage Unit dispatched for ${site.brand} Drainage (${site.location}).\nDispatch Ticket: #HYDRO-${Math.floor(10000 + Math.random() * 90000)}`);

            setTimeout(() => {
                dispatchWaterSpecialistBtn.disabled = false;
                dispatchWaterSpecialistBtn.innerHTML = origText;
            }, 3000);
        });
    }

    // 3. Send Urgent Drainage Report Button
    const sendWaterReportBtn = document.getElementById('sendWaterReportBtn');
    if (sendWaterReportBtn) {
        sendWaterReportBtn.addEventListener('click', () => {
            const subject = encodeURIComponent(`URGENT DRAINAGE TELEMETRY REPORT: ${site.brand} (${site.location})`);
            const body = encodeURIComponent(
                `SIIM URGENT DRAINAGE DISPATCH REPORT\n` +
                `------------------------------------\n` +
                `Facility: ${site.brand} Drainage\n` +
                `Location: ${site.location}\n` +
                `Acoustic Transmission Ratio: ${lastWaterTelemetry ? lastWaterTelemetry.ratio : 0.984}\n` +
                `Flow Rate: ${lastWaterTelemetry ? lastWaterTelemetry.flowRate : 42} L/min\n` +
                `Drain Health Score: ${lastWaterTelemetry ? lastWaterTelemetry.drainHealth : 96}/100\n` +
                `Hydraulic Impedance Risk: ${lastWaterTelemetry ? lastWaterTelemetry.impedanceRisk : 'Low Risk'}\n` +
                `Timestamp: ${new Date().toLocaleString()}\n` +
                `------------------------------------\n` +
                `Please dispatch an emergency hydro-jetting team immediately.`
            );

            window.location.href = `mailto:johnoyetolaoluwafemi113@gmail.com?subject=${subject}&body=${body}`;
        });
    }
});
