// Hey Service - Site Data Registry
// All monitored facilities across all brands

const SITE_DATA = [
    // ===== WAGAMAMA =====
    { id: 'wagamama-leeds', brand: 'Wagamama', location: 'Leeds, West Yorkshire', grease: 10, temp: 28, wind: 14, demister: true, airflow: 'GOOD', status: 'safe' },
    { id: 'wagamama-manchester', brand: 'Wagamama', location: 'Manchester, Greater Manchester', grease: 52, temp: 34, wind: 8, demister: true, airflow: 'MODERATE', status: 'warning' },
    { id: 'wagamama-birmingham', brand: 'Wagamama', location: 'Birmingham, West Midlands', grease: 88, temp: 41, wind: 5, demister: false, airflow: 'POOR', status: 'warning' },
    { id: 'wagamama-london', brand: 'Wagamama', location: 'Soho, London', grease: 22, temp: 26, wind: 16, demister: true, airflow: 'GOOD', status: 'safe' },
    { id: 'wagamama-bristol', brand: 'Wagamama', location: 'Bristol, Somerset', grease: 67, temp: 33, wind: 7, demister: true, airflow: 'MODERATE', status: 'danger' },

    // ===== FIVE GUYS =====
    { id: 'fiveguys-wakefield', brand: 'Five Guys', location: 'Wakefield, West Yorkshire', grease: 15, temp: 27, wind: 13, demister: true, airflow: 'GOOD', status: 'safe' },
    { id: 'fiveguys-sheffield', brand: 'Five Guys', location: 'Sheffield, South Yorkshire', grease: 91, temp: 44, wind: 4, demister: false, airflow: 'POOR', status: 'danger' },
    { id: 'fiveguys-nottingham', brand: 'Five Guys', location: 'Nottingham, East Midlands', grease: 38, temp: 29, wind: 11, demister: true, airflow: 'GOOD', status: 'monitor' },
    { id: 'fiveguys-liverpool', brand: 'Five Guys', location: 'Liverpool, Merseyside', grease: 73, temp: 36, wind: 6, demister: true, airflow: 'MODERATE', status: 'warning' },
    { id: 'fiveguys-edinburgh', brand: 'Five Guys', location: 'Edinburgh, Scotland', grease: 8, temp: 24, wind: 18, demister: true, airflow: 'GOOD', status: 'safe' },

    // ===== ZAAP =====
    { id: 'zaap-leeds', brand: 'Zaap', location: 'Leeds City Centre, West Yorkshire', grease: 30, temp: 29, wind: 12, demister: true, airflow: 'GOOD', status: 'safe' },
    { id: 'zaap-nottingham', brand: 'Zaap', location: 'Nottingham, East Midlands', grease: 85, temp: 42, wind: 4, demister: false, airflow: 'POOR', status: 'danger' },
    { id: 'zaap-newcastle', brand: 'Zaap', location: 'Newcastle, Tyne and Wear', grease: 48, temp: 31, wind: 9, demister: true, airflow: 'MODERATE', status: 'warning' },
    { id: 'zaap-york', brand: 'Zaap', location: 'York, North Yorkshire', grease: 18, temp: 25, wind: 15, demister: true, airflow: 'GOOD', status: 'safe' },
    { id: 'zaap-manchester', brand: 'Zaap', location: 'Northern Quarter, Manchester', grease: 62, temp: 35, wind: 7, demister: true, airflow: 'MODERATE', status: 'warning' },

    // ===== PREMIER INN =====
    { id: 'premierinn-wakefield', brand: 'Premier Inn', location: 'Wakefield, West Yorkshire', grease: 5, temp: 23, wind: 17, demister: true, airflow: 'GOOD', status: 'safe' },
    { id: 'premierinn-london', brand: 'Premier Inn', location: 'Kings Cross, London', grease: 58, temp: 33, wind: 8, demister: true, airflow: 'MODERATE', status: 'warning' },
    { id: 'premierinn-cardiff', brand: 'Premier Inn', location: 'Cardiff, Wales', grease: 94, temp: 45, wind: 3, demister: false, airflow: 'POOR', status: 'danger' },
    { id: 'premierinn-glasgow', brand: 'Premier Inn', location: 'Glasgow, Scotland', grease: 41, temp: 30, wind: 10, demister: true, airflow: 'GOOD', status: 'monitor' },
    { id: 'premierinn-bath', brand: 'Premier Inn', location: 'Bath, Somerset', grease: 76, temp: 37, wind: 6, demister: true, airflow: 'MODERATE', status: 'warning' },

    // ===== BAR+BLOCK =====
    { id: 'barblock-leeds', brand: 'Bar+Block', location: 'Leeds, West Yorkshire', grease: 20, temp: 26, wind: 14, demister: true, airflow: 'GOOD', status: 'safe' },
    { id: 'barblock-manchester', brand: 'Bar+Block', location: 'Deansgate, Manchester', grease: 83, temp: 40, wind: 5, demister: false, airflow: 'POOR', status: 'warning' },
    { id: 'barblock-birmingham', brand: 'Bar+Block', location: 'Birmingham, West Midlands', grease: 55, temp: 32, wind: 8, demister: true, airflow: 'MODERATE', status: 'warning' },
    { id: 'barblock-london', brand: 'Bar+Block', location: 'Aldgate, London', grease: 35, temp: 28, wind: 12, demister: true, airflow: 'GOOD', status: 'safe' },
    { id: 'barblock-exeter', brand: 'Bar+Block', location: 'Exeter, Devon', grease: 70, temp: 35, wind: 7, demister: true, airflow: 'MODERATE', status: 'warning' },

    // ===== G.O.O.D.M.A.N =====
    { id: 'goodman-mayfair', brand: 'G.O.O.D.M.A.N', location: 'Mayfair, London', grease: 12, temp: 25, wind: 15, demister: true, airflow: 'GOOD', status: 'safe' },
    { id: 'goodman-canarywharf', brand: 'G.O.O.D.M.A.N', location: 'Canary Wharf, London', grease: 60, temp: 34, wind: 8, demister: true, airflow: 'MODERATE', status: 'monitor' },
    { id: 'goodman-cityoflondon', brand: 'G.O.O.D.M.A.N', location: 'City of London, London', grease: 90, temp: 43, wind: 4, demister: false, airflow: 'POOR', status: 'danger' },
    { id: 'goodman-manchester', brand: 'G.O.O.D.M.A.N', location: 'Spinningfields, Manchester', grease: 28, temp: 27, wind: 13, demister: true, airflow: 'GOOD', status: 'safe' },
    { id: 'goodman-leeds', brand: 'G.O.O.D.M.A.N', location: 'The Headrow, Leeds', grease: 75, temp: 36, wind: 6, demister: true, airflow: 'MODERATE', status: 'warning' },

    // ===== THAI EXPRESS =====
    { id: 'thaiexpress-leeds', brand: 'Thai Express', location: 'Trinity Centre, Leeds', grease: 42, temp: 30, wind: 10, demister: true, airflow: 'GOOD', status: 'monitor' },
    { id: 'thaiexpress-london', brand: 'Thai Express', location: 'Covent Garden, London', grease: 86, temp: 42, wind: 4, demister: false, airflow: 'POOR', status: 'danger' },
    { id: 'thaiexpress-reading', brand: 'Thai Express', location: 'Reading, Berkshire', grease: 25, temp: 26, wind: 14, demister: true, airflow: 'GOOD', status: 'safe' },
    { id: 'thaiexpress-brighton', brand: 'Thai Express', location: 'Brighton, East Sussex', grease: 64, temp: 34, wind: 7, demister: true, airflow: 'MODERATE', status: 'warning' },
    { id: 'thaiexpress-oxford', brand: 'Thai Express', location: 'Oxford, Oxfordshire', grease: 50, temp: 31, wind: 9, demister: true, airflow: 'MODERATE', status: 'warning' },

    // ===== COTE =====
    { id: 'cote-cheltenham', brand: 'Cote', location: 'Cheltenham, Gloucestershire', grease: 8, temp: 24, wind: 16, demister: true, airflow: 'GOOD', status: 'safe' },
    { id: 'cote-london', brand: 'Cote', location: 'Covent Garden, London', grease: 72, temp: 36, wind: 6, demister: true, airflow: 'MODERATE', status: 'warning' },
    { id: 'cote-edinburgh', brand: 'Cote', location: 'Edinburgh, Scotland', grease: 95, temp: 46, wind: 3, demister: false, airflow: 'POOR', status: 'danger' },
    { id: 'cote-cambridge', brand: 'Cote', location: 'Cambridge, Cambridgeshire', grease: 33, temp: 28, wind: 12, demister: true, airflow: 'GOOD', status: 'safe' },
    { id: 'cote-bath', brand: 'Cote', location: 'Bath, Somerset', grease: 57, temp: 33, wind: 8, demister: true, airflow: 'MODERATE', status: 'monitor' }
];

function getWaterMetricsForSite(site) {
    if (!site) return null;
    const status = site.status || (site.grease > 80 ? 'danger' : (site.grease > 45 ? 'warning' : 'safe'));

    let statusPillText, statusPillClass, flowRate, pressure, valveStatus, valveClass, consumption;

    if (status === 'danger' || status === 'critical') {
        statusPillText = 'CRITICAL';
        statusPillClass = 'status-pill-danger';
        flowRate = (14.0 + (site.grease % 5)).toFixed(1);
        pressure = (68.5 + (site.temp % 10)).toFixed(1);
        valveStatus = 'THROTTLED';
        valveClass = 'badge-valve-throttled';
        consumption = (24.8 + (site.grease % 5)).toFixed(1);
    } else if (status === 'warning' || status === 'action-due') {
        statusPillText = 'PRESSURE WARNING';
        statusPillClass = 'status-pill-warn';
        flowRate = (28.0 + (site.grease % 5)).toFixed(1);
        pressure = (54.2 + (site.temp % 8)).toFixed(1);
        valveStatus = 'OPEN';
        valveClass = 'badge-valve-open';
        consumption = (18.4 + (site.grease % 4)).toFixed(1);
    } else {
        statusPillText = 'SAFE (NOMINAL)';
        statusPillClass = 'status-pill-safe';
        flowRate = (43.0 + ((site.id.length * 2) % 5)).toFixed(1);
        pressure = (42.0 + ((site.id.length * 2) % 6)).toFixed(1);
        valveStatus = 'OPEN';
        valveClass = 'badge-valve-open';
        consumption = (12.5 + ((site.id.length * 3) % 5)).toFixed(1);
    }

    return {
        statusPillText,
        statusPillClass,
        flowRate,
        pressure,
        valveStatus,
        valveClass,
        consumption
    };
}

function getGroupedByBrand() {
    const grouped = {};
    if (typeof SITE_DATA !== 'undefined' && Array.isArray(SITE_DATA)) {
        SITE_DATA.forEach(site => {
            const brand = site.brand || 'Other';
            if (!grouped[brand]) {
                grouped[brand] = [];
            }
            grouped[brand].push(site);
        });
    }
    return grouped;
}

window.getGroupedByBrand = getGroupedByBrand;

