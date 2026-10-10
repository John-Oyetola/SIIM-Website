// js/mfa.js — Microsoft Authenticator TOTP Setup, Challenge & Verification Engine

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode') || 'enroll';

    const enrollSection = document.getElementById('mfaEnrollSection');
    const challengeSection = document.getElementById('mfaChallengeSection');
    const errBanner = document.getElementById('mfaErrorBanner');

    // Handle Mode Switching
    if (mode === 'enroll') {
        if (enrollSection) enrollSection.style.display = 'block';
        if (challengeSection) challengeSection.style.display = 'none';

        // Initialize Supabase TOTP Enrollment
        if (window.supabaseClient) {
            try {
                const userEmail = sessionStorage.getItem('pendingUserEmail') || localStorage.getItem('heyServiceUser') || 'user@theheygroup.net';
                const { data, error } = await window.supabaseClient.auth.mfa.enroll({
                    factorType: 'totp',
                    issuer: 'SIIM Telemetry',
                    friendlyName: userEmail
                });

                if (!error && data && data.totp) {
                    sessionStorage.setItem('mfaEnrolledFactorId', data.id);
                    window.currentMfaFactorId = data.id;

                    // Render live QR Code SVG / Data URI
                    const qrWrapper = document.getElementById('mfaQrWrapper');
                    if (qrWrapper && data.totp.qr_code) {
                        const qrStr = data.totp.qr_code.trim();
                        if (qrStr.startsWith('<svg') || qrStr.toLowerCase().includes('<svg')) {
                            qrWrapper.innerHTML = qrStr;
                            const svgEl = qrWrapper.querySelector('svg');
                            if (svgEl) {
                                svgEl.setAttribute('width', '200');
                                svgEl.setAttribute('height', '200');
                                svgEl.style.width = '200px';
                                svgEl.style.height = '200px';
                                svgEl.style.display = 'block';
                                svgEl.style.margin = '0 auto';
                                svgEl.style.background = '#ffffff';
                                svgEl.style.padding = '12px';
                                svgEl.style.borderRadius = '12px';
                                svgEl.style.boxSizing = 'border-box';
                                svgEl.style.shapeRendering = 'crispEdges';
                            }
                        } else {
                            qrWrapper.innerHTML = `<img src="${qrStr}" alt="Scan with Microsoft Authenticator" style="width: 200px; height: 200px; display: block; margin: 0 auto; background: #ffffff; padding: 12px; border-radius: 12px; box-sizing: border-box; shape-rendering: crispEdges;">`;
                        }
                    }

                    // Render Secret Key
                    const secretDisplay = document.getElementById('mfaSecretDisplay');
                    if (secretDisplay && data.totp.secret) {
                        secretDisplay.textContent = data.totp.secret;
                    }
                }
            } catch (e) {
                console.warn('MFA enrollment error:', e);
            }
        }
    } else {
        if (enrollSection) enrollSection.style.display = 'none';
        if (challengeSection) challengeSection.style.display = 'block';
    }

    // Copy Manual Key Button Listener
    const copyKeyBtn = document.getElementById('copyMfaKeyBtn');
    if (copyKeyBtn) {
        copyKeyBtn.onclick = () => {
            const secretDisplay = document.getElementById('mfaSecretDisplay');
            const key = secretDisplay ? secretDisplay.textContent.trim() : '';
            if (key) {
                navigator.clipboard.writeText(key);
                copyKeyBtn.textContent = 'Copied!';
                setTimeout(() => copyKeyBtn.textContent = 'Copy Key', 2000);
            }
        };
    }

    // MFA Verification Form Handler
    const mfaForm = document.getElementById('mfaForm');
    if (mfaForm) {
        mfaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const codeInput = document.getElementById('mfaCodeInput');
            const enteredCode = codeInput ? codeInput.value.trim() : '';

            if (errBanner) errBanner.style.display = 'none';

            if (enteredCode.length !== 6 || !/^\d+$/.test(enteredCode)) {
                showMfaError('Please enter a valid 6-digit numeric verification code.');
                return;
            }

            const btn = mfaForm.querySelector('button[type="submit"]');
            if (btn) {
                btn.disabled = true;
                btn.textContent = 'Verifying Authenticator Code...';
            }

            try {
                if (typeof window.verifyMfaTotp === 'function') {
                    const factorId = window.currentMfaFactorId || sessionStorage.getItem('mfaEnrolledFactorId');
                    await window.verifyMfaTotp(factorId, enteredCode);
                } else if (window.supabaseClient) {
                    const factorId = window.currentMfaFactorId || sessionStorage.getItem('mfaEnrolledFactorId');
                    if (!factorId) throw new Error('MFA factor ID is missing.');

                    const cRes = await window.supabaseClient.auth.mfa.challenge({ factorId });
                    if (cRes.error) throw cRes.error;

                    const vRes = await window.supabaseClient.auth.mfa.verify({
                        factorId,
                        challengeId: cRes.data.id,
                        code: enteredCode
                    });
                    if (vRes.error) throw vRes.error;
                }

                const email = sessionStorage.getItem('pendingUserEmail') || localStorage.getItem('heyServiceUser') || 'user@theheygroup.net';
                const role = sessionStorage.getItem('pendingUserRole') || localStorage.getItem('heyServiceRole') || 'client';
                const siteId = sessionStorage.getItem('pendingUserSiteId') || localStorage.getItem('heyServiceSiteId') || 'wagamama-leeds';
                const company = sessionStorage.getItem('pendingUserCompany') || localStorage.getItem('heyServiceCompany') || 'SIIM Monitored Facility';

                const userObj = { email, role, siteId, company };

                if (typeof handleRoleRouting === 'function') {
                    handleRoleRouting(userObj);
                } else {
                    window.location.href = 'systems.html';
                }
            } catch (err) {
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = mode === 'enroll' ? 'Verify & Activate Account →' : 'Verify Code →';
                }
                showMfaError(err.message || 'Invalid 6-digit code. Please check your authenticator clock and try again.');
            }
        });
    }
});

function showMfaError(msg) {
    const errBanner = document.getElementById('mfaErrorBanner');
    if (errBanner) {
        errBanner.style.display = 'block';
        errBanner.className = 'protocol-banner banner-danger';
        errBanner.textContent = msg;
    }
}
