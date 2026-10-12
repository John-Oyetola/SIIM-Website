// js/auth.js — SIIM Pure Supabase Email & Password Auth Gateway & Role Router

// Route Guard & Session Protection: Strictly Bar role === 'pending' From Entering Protected Portal
window.protectRoute = function() {
    const path = window.location.pathname.toLowerCase().replace(/\\/g, '/');
    const page = path.split('/').filter(Boolean).pop() || 'index.html';

    const protectedPages = [
        'systems.html',
        'dashboard.html',
        'demo-dashboard.html',
        'custom-site.html',
        'facility-water.html',
        'water-dashboard.html',
        'engineer-portal.html',
        'east-data-center.html',
        'north-facility.html',
        'south-operations.html',
        'west-generator.html'
    ];

    if (protectedPages.includes(page)) {
        if (sessionStorage.getItem('siim_logged_out') === 'true') {
            window.location.replace('login.html');
            return false;
        }

        const session = typeof window.getSIIMSession === 'function' ? window.getSIIMSession() : null;
        const userRole = ((session && session.role) || localStorage.getItem('siim_user_role') || '').toLowerCase().trim();

        if (userRole === 'pending' || !userRole) {
            window.location.href = 'pending-approval.html';
            return false;
        }
    }
    return true;
};
window.checkAuth = window.protectRoute;

// Security Gate: Enforce credentials entry on login.html (no auto-redirects) and protect portal views
(function enforceLoginSecurity() {
    const page = window.location.pathname.toLowerCase().split('/').filter(Boolean).pop() || 'index.html';
    if (page === 'login.html') {
        sessionStorage.setItem('siim_logged_out', 'true');
        const savedReg = localStorage.getItem('siim_registered_users');
        localStorage.removeItem('siim_session');
        localStorage.removeItem('siim_user_role');
        localStorage.removeItem('heyServiceRole');
        localStorage.removeItem('heyServiceUser');
        localStorage.removeItem('heyServiceFullName');
        localStorage.removeItem('heyServiceCompany');
        localStorage.removeItem('heyServiceSiteId');
        localStorage.removeItem('heyServiceBrand');
        try {
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const k = localStorage.key(i);
                if (k && ((k.startsWith('sb-') && k.endsWith('-auth-token')) || k === 'supabase.auth.token')) {
                    localStorage.removeItem(k);
                }
            }
        } catch (e) {}
        if (savedReg && !localStorage.getItem('siim_registered_users')) {
            localStorage.setItem('siim_registered_users', savedReg);
        }
        if (window.supabaseClient && window.supabaseClient.auth) {
            window.supabaseClient.auth.signOut().catch(() => {});
        }
    } else {
        window.protectRoute();
    }
})();

// Helper to access production Supabase client instance
function getSupabase() {
    if (!window.supabaseClient) {
        throw new Error('Supabase client not initialized. Please verify internet connectivity and CDN scripts.');
    }
    return window.supabaseClient;
}

// 1. Official Role Routing Engine
window.handleRoleRouting = function(user) {
    const rawRole = (user && (user.role || user.app_role)) ? (user.role || user.app_role) : localStorage.getItem('siim_user_role');
    const userRole = (rawRole || '').toLowerCase().trim();

    // Strict validation: if role is pending or absent, redirect to pending-approval
    if (userRole === 'pending' || !userRole) {
        window.location.href = 'pending-approval.html';
        return;
    }

    if (userRole !== 'admin' && userRole !== 'engineer' && userRole !== 'client') {
        window.location.href = 'pending-approval.html';
        return;
    }

    const siteId = (user && (user.site_id || user.siteId)) ? (user.site_id || user.siteId) : (localStorage.getItem('heyServiceSiteId') || 'wagamama-leeds');
    const company = (user && user.company) ? user.company : 'SIIM Client';
    const email = (user && user.email) ? user.email : 'user@theheygroup.net';
    const fullName = (user && (user.full_name || user.name)) ? (user.full_name || user.name) : (email.includes('@') ? email.split('@')[0] : 'User');

    // Persist official session variables only for approved roles
    const sessionPayload = {
        role: userRole,
        email: email,
        fullName: fullName,
        company: company,
        siteId: siteId,
        timestamp: Date.now()
    };
    localStorage.setItem('siim_session', JSON.stringify(sessionPayload));
    localStorage.setItem('siim_user_role', userRole);
    localStorage.setItem('heyServiceRole', userRole);
    localStorage.setItem('heyServiceUser', email);
    localStorage.setItem('heyServiceFullName', fullName);
    localStorage.setItem('heyServiceCompany', company);
    localStorage.setItem('heyServiceSiteId', siteId);
    localStorage.setItem('heyServiceBrand', userRole === 'client' ? siteId : 'all');

    // Clear logged out flag on successful role routing
    sessionStorage.removeItem('siim_logged_out');

    // Update navbar badge dynamically
    document.querySelectorAll('#userBadge, #roleBadge').forEach(badge => {
        badge.textContent = fullName;
    });

    // Route strictly based on the authenticated role:
    if (userRole === 'admin') {
        window.location.href = 'systems.html';
    } else if (userRole === 'engineer') {
        window.location.href = 'engineer-portal.html';
    } else {
        const targetSiteId = user.site_id || user.siteId || localStorage.getItem('heyServiceSiteId') || 'wagamama-leeds';
        window.location.href = `custom-site.html?id=${encodeURIComponent(targetSiteId)}`;
    }
};

// 2. Strict Supabase Email & Password Sign In (Synchronous Gate)
window.signInWithEmail = async function(email, password) {
    const supabaseClient = getSupabase();

    // 1. Authenticate credentials
    const { data: authData, error: authErr } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (authErr || !authData || !authData.user) {
        throw new Error((authErr && authErr.message) ? authErr.message : 'Invalid login credentials.');
    }

    // Query the 'profiles' table for the user's id:
    const { data: profile, error: profileErr } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

    // Perform strict validation on the retrieved profile:
    const userRole = (profile?.role || '').toLowerCase().trim();
    const isApproved = profile?.is_approved === true || profile?.status === 'approved';

    // Strict gate: If role is explicitly 'pending', or profile is not approved, block entry immediately!
    if (userRole === 'pending' || profile?.status === 'pending' || !isApproved) {
        // Force terminate Supabase session
        await supabaseClient.auth.signOut();
        localStorage.clear();
        sessionStorage.clear();
        sessionStorage.setItem('siim_pending_email', authData.user.email);
        
        // Redirect immediately to pending approval page
        window.location.href = 'pending-approval.html';
        return;
    }

    // Only if status is explicitly approved and role is approved ('admin', 'client', 'engineer')
    if (userRole === 'admin' || userRole === 'engineer' || userRole === 'client') {
        const fullName = profile?.full_name || authData.user.user_metadata?.full_name || email.split('@')[0];
        const company = profile?.company || authData.user.user_metadata?.company || 'SIIM Client';
        const siteId = profile?.site_id || localStorage.getItem('heyServiceSiteId') || 'wagamama-leeds';

        const activeUser = {
            email: email,
            full_name: fullName,
            role: userRole,
            siteId: siteId,
            site_id: siteId,
            company: company
        };

        const sessionPayload = {
            role: userRole,
            email: activeUser.email,
            fullName: activeUser.full_name,
            company: activeUser.company,
            siteId: activeUser.siteId,
            timestamp: Date.now()
        };
        localStorage.setItem('siim_session', JSON.stringify(sessionPayload));
        localStorage.setItem('siim_user_role', userRole);
        localStorage.setItem('heyServiceRole', userRole);
        localStorage.setItem('heyServiceUser', activeUser.email);
        localStorage.setItem('heyServiceFullName', activeUser.full_name);
        localStorage.setItem('heyServiceCompany', activeUser.company);
        localStorage.setItem('heyServiceSiteId', activeUser.siteId);
        localStorage.setItem('heyServiceBrand', userRole === 'client' ? siteId : 'all');

        sessionStorage.removeItem('siim_logged_out');

        window.location.href = 'systems.html';
        return { user: activeUser };
    } else {
        await supabaseClient.auth.signOut().catch(() => {});
        localStorage.clear();
        sessionStorage.clear();
        sessionStorage.setItem('siim_pending_email', authData.user.email);
        window.location.href = 'pending-approval.html';
        return;
    }
};

// 3. Supabase Email Registration (Step 1: Create Account)
window.signUpWithEmail = async function(email, password, fullName = '', company = '', phone = '') {
    const assignedRole = 'client';
    const accountStatus = 'pending';

    const sanitizedPhone = (phone || '').trim();
    if (!sanitizedPhone) {
        throw new Error('A valid phone number is required for SMS & account security.');
    }

    // 1. Write user to persistent localStorage key 'siim_registered_users'
    try {
        let registeredList = JSON.parse(localStorage.getItem('siim_registered_users') || '[]');
        const existingIndex = registeredList.findIndex(u => u.email && u.email.toLowerCase() === email.toLowerCase());
        const userRecord = {
            id: 'usr_' + Date.now(),
            email: email,
            phone: sanitizedPhone,
            full_name: fullName || email.split('@')[0],
            company: company,
            role: assignedRole,
            status: accountStatus,
            is_approved: false,
            site_id: null,
            created_at: new Date().toISOString()
        };
        if (existingIndex >= 0) {
            registeredList[existingIndex] = { ...registeredList[existingIndex], ...userRecord };
        } else {
            registeredList.push(userRecord);
        }
        localStorage.setItem('siim_registered_users', JSON.stringify(registeredList));
    } catch (e) {
        console.error('Error persisting to siim_registered_users:', e);
    }

    // 2. Supabase Auth signup with metadata including phone
    let data = null;
    let error = null;
    try {
        const client = getSupabase();
        const res = await client.auth.signUp({
            email,
            password,
            options: {
                data: {
                    phone: sanitizedPhone,
                    full_name: fullName,
                    company,
                    role: assignedRole,
                    status: accountStatus,
                    is_approved: false,
                    site_id: null
                }
            }
        });
        data = res.data;
        if (res.error) error = res.error;
    } catch (err) {
        error = err;
    }

    if (error && (!data || !data.user)) {
        throw new Error(error.message || 'Registration failed.');
    }

    // Ensure an active session is established for subsequent MFA enrollment
    const client = getSupabase();
    if (client && (!data || !data.session)) {
        try {
            const loginRes = await client.auth.signInWithPassword({ email, password });
            if (loginRes.data && loginRes.data.session) {
                data = loginRes.data;
            }
        } catch (e) {
            console.warn('Post-signup session login attempt:', e);
        }
    }

    const displayName = fullName || email.split('@')[0] || 'User';
    localStorage.setItem('heyServiceUser', email);
    localStorage.setItem('heyServiceFullName', displayName);

    sessionStorage.setItem('pendingUserEmail', email);
    sessionStorage.setItem('pendingUserFullName', displayName);
    sessionStorage.setItem('pendingUserRole', assignedRole);
    sessionStorage.setItem('pendingUserCompany', company || 'SIIM Monitored Facility');

    return data;
};

// 4. Supabase MFA TOTP Enrollment (Step 2 of Signup)
window.enrollMfaTotp = async function(email) {
    const supabaseClient = getSupabase();
    const { data: enrollData, error: enrollError } = await supabaseClient.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'SIIM Telemetry',
        friendlyName: email
    });

    if (enrollError) {
        alert('MFA Enrollment failed: ' + enrollError.message);
        throw new Error('MFA Enrollment failed: ' + enrollError.message);
    }

    // Inject the genuine SVG QR code returned by Supabase
    const qrContainer = document.getElementById('mfaQrWrapper');
    if (qrContainer && enrollData && enrollData.totp && enrollData.totp.qr_code) {
        qrContainer.innerHTML = '';
        const qrCodeData = enrollData.totp.qr_code.trim();

        if (qrCodeData.startsWith('<svg')) {
            qrContainer.innerHTML = qrCodeData;
            const svgEl = qrContainer.querySelector('svg');
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
                svgEl.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
            }
        } else {
            const qrImg = document.createElement('img');
            qrImg.src = qrCodeData;
            qrImg.alt = 'Scan with Microsoft Authenticator';
            qrImg.style.width = '200px';
            qrImg.style.height = '200px';
            qrImg.style.display = 'block';
            qrImg.style.margin = '0 auto';
            qrImg.style.background = '#ffffff';
            qrImg.style.padding = '12px';
            qrImg.style.borderRadius = '12px';
            qrImg.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
            qrContainer.appendChild(qrImg);
        }
    }

    // Inject the genuine Base32 secret string returned by Supabase
    const secretDisplay = document.getElementById('mfaSecretDisplay');
    if (secretDisplay && enrollData && enrollData.totp && enrollData.totp.secret) {
        secretDisplay.textContent = enrollData.totp.secret;
    }

    window.currentMfaFactorId = enrollData ? enrollData.id : null;
    return enrollData;
};

// Global Copy Key button handler setup
document.addEventListener('DOMContentLoaded', () => {
    const copyBtn = document.getElementById('copyMfaKeyBtn');
    if (copyBtn) {
        copyBtn.onclick = () => {
            const secretElem = document.getElementById('mfaSecretDisplay');
            const key = secretElem ? secretElem.textContent.trim() : '';
            if (key) {
                navigator.clipboard.writeText(key);
                copyBtn.textContent = 'Copied!';
                setTimeout(() => { copyBtn.textContent = 'Copy Key'; }, 2000);
            }
        };
    }
});

// 5. Supabase MFA TOTP Challenge & Verification (Step 4 of Signup)
window.verifyMfaTotp = async function(factorId, code) {
    const supabaseClient = getSupabase();
    const fId = factorId || window.currentMfaFactorId || sessionStorage.getItem('mfaEnrolledFactorId');

    if (!fId) {
        throw new Error('MFA factor ID is missing.');
    }

    const challengeRes = await supabaseClient.auth.mfa.challenge({ factorId: fId });
    if (challengeRes.error) {
        throw new Error('MFA challenge failed: ' + challengeRes.error.message);
    }

    const challengeId = challengeRes.data.id;
    const verifyRes = await supabaseClient.auth.mfa.verify({
        factorId: fId,
        challengeId,
        code: code.trim()
    });

    if (verifyRes.error) {
        throw new Error('Invalid MFA verification code: ' + verifyRes.error.message);
    }

    // Insert or update profile record in public.profiles with status: 'pending', role: 'pending'
    try {
        const { data: userData } = await supabaseClient.auth.getUser();
        const user = userData ? userData.user : null;
        if (user) {
            await supabaseClient.from('profiles').upsert({
                id: user.id,
                email: user.email,
                role: 'pending',
                status: 'pending',
                is_approved: false,
                full_name: user.user_metadata?.full_name || '',
                company: user.user_metadata?.company || '',
                phone: user.user_metadata?.phone || '',
                updated_at: new Date().toISOString()
            });
        }
    } catch (e) {
        console.warn('Profile status update on MFA verification:', e);
    }

    // Update local storage fallback record to pending status
    try {
        const pendingEmail = sessionStorage.getItem('pendingUserEmail');
        if (pendingEmail) {
            let registeredList = JSON.parse(localStorage.getItem('siim_registered_users') || '[]');
            const idx = registeredList.findIndex(u => u.email && u.email.toLowerCase() === pendingEmail.toLowerCase());
            if (idx >= 0) {
                registeredList[idx].status = 'pending';
                registeredList[idx].role = 'pending';
                registeredList[idx].is_approved = false;
                localStorage.setItem('siim_registered_users', JSON.stringify(registeredList));
            }
        }
    } catch (e) {}

    // Immediately sign out user so they are not left authenticated
    try {
        await supabaseClient.auth.signOut();
    } catch (e) {}

    sessionStorage.clear();
    localStorage.removeItem('siim_user_role');
    localStorage.removeItem('heyServiceRole');

    return verifyRes.data;
};

// 6. Supabase Password Reset Email Dispatch
window.resetPassword = async function(email) {
    const client = getSupabase();
    const { data, error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/forgot-password.html'
    });
    if (error) throw new Error(error.message || 'Password reset request failed.');
    return data;
};

// 7. Supabase Update User Password with Required MFA Verification
window.updateUserPassword = async function(newPassword, mfaCode = null) {
    const client = getSupabase();

    // Check if user has an enrolled TOTP factor
    let totpFactor = null;
    try {
        const listRes = await client.auth.mfa.listFactors();
        if (listRes.data && listRes.data.totp) {
            totpFactor = listRes.data.totp.find(f => f.status === 'verified') || listRes.data.totp[0];
        }
    } catch (e) {}

    // MFA Verification Required for Password Reset
    if (!mfaCode || mfaCode.trim().length !== 6 || !/^\d+$/.test(mfaCode.trim())) {
        throw new Error('Microsoft Authenticator 6-digit verification code is required to complete password reset.');
    }

    if (totpFactor) {
        const challengeRes = await client.auth.mfa.challenge({ factorId: totpFactor.id });
        if (challengeRes.error) throw new Error('MFA challenge failed: ' + challengeRes.error.message);

        const verifyRes = await client.auth.mfa.verify({
            factorId: totpFactor.id,
            challengeId: challengeRes.data.id,
            code: mfaCode.trim()
        });
        if (verifyRes.error) throw new Error('Invalid 6-digit MFA code: ' + verifyRes.error.message);
    }

    const { data, error } = await client.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message || 'Failed to update password.');

    return data;
};

// 8. Supabase Logout Handler
window.logout = function(e) {
    if (e && e.preventDefault) e.preventDefault();

    sessionStorage.setItem('siim_logged_out', 'true');
    const savedReg = localStorage.getItem('siim_registered_users');
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem('siim_logged_out', 'true');
    if (savedReg) {
        localStorage.setItem('siim_registered_users', savedReg);
    }

    if (window.supabaseClient && window.supabaseClient.auth) {
        window.supabaseClient.auth.signOut().catch(() => {});
    }

    window.location.href = 'login.html';
};

// 9. Global Password Visibility Eye Toggle Delegation
document.addEventListener('click', function(e) {
    const toggleBtn = e.target.closest('#togglePasswordBtn, #toggleSignupPassword, .toggle-password-btn, .toggle-password, .password-toggle-btn');
    if (toggleBtn) {
        e.preventDefault();
        const container = toggleBtn.closest('.input-group, .password-wrapper, .password-input-wrapper, .field-wrapper') || toggleBtn.parentElement;
        if (!container) return;
        const input = container.querySelector('input[type="password"], input[type="text"]');
        if (input) {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            toggleBtn.classList.toggle('active', isPassword);

            const eyeOpen = toggleBtn.querySelector('.eye-icon');
            const eyeOff = toggleBtn.querySelector('.eye-off-icon');
            if (eyeOpen && eyeOff) {
                eyeOpen.style.display = isPassword ? 'none' : 'block';
                eyeOff.style.display = isPassword ? 'block' : 'none';
            }
        }
    }
});
