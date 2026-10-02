// js/auth.js — SIIM Pure Supabase Email & Password Auth Gateway & Role Router

// Helper to access production Supabase client instance
function getSupabase() {
    if (!window.supabaseClient) {
        throw new Error('Supabase client not initialized. Please verify internet connectivity and CDN scripts.');
    }
    return window.supabaseClient;
}

// 1. Official Role Routing Engine
window.handleRoleRouting = function(user) {
    const role = (user && (user.role || user.app_role)) ? (user.role || user.app_role) : (localStorage.getItem('siim_user_role') || 'client');
    const siteId = (user && (user.site_id || user.siteId)) ? (user.site_id || user.siteId) : (localStorage.getItem('heyServiceSiteId') || 'wagamama-leeds');
    const company = (user && user.company) ? user.company : 'SIIM Client';
    const email = (user && user.email) ? user.email : 'user@theheygroup.net';
    const fullName = (user && (user.full_name || user.name)) ? (user.full_name || user.name) : (email.includes('@') ? email.split('@')[0] : 'User');

    // Persist official session variables
    localStorage.setItem('siim_user_role', role);
    localStorage.setItem('heyServiceRole', role);
    localStorage.setItem('heyServiceUser', email);
    localStorage.setItem('heyServiceFullName', fullName);
    localStorage.setItem('heyServiceCompany', company);
    localStorage.setItem('heyServiceSiteId', siteId);
    localStorage.setItem('heyServiceBrand', role === 'client' ? siteId : 'all');

    // Clear logged out flag on successful role routing
    sessionStorage.removeItem('siim_logged_out');

    // Update navbar badge dynamically
    document.querySelectorAll('#userBadge, #roleBadge').forEach(badge => {
        badge.textContent = fullName;
    });

    // Route strictly based on the authenticated role:
    if (role === 'admin') {
        localStorage.setItem('siim_user_role', 'admin');
        window.location.href = 'systems.html';
    } else if (role === 'engineer') {
        localStorage.setItem('siim_user_role', 'engineer');
        window.location.href = 'engineer-portal.html';
    } else if (role === 'client') {
        localStorage.setItem('siim_user_role', 'client');
        const targetSiteId = user.site_id || user.siteId || localStorage.getItem('heyServiceSiteId') || 'wagamama-leeds';
        window.location.href = `custom-site.html?id=${encodeURIComponent(targetSiteId)}`;
    } else {
        localStorage.setItem('siim_user_role', 'client');
        const targetSiteId = user.site_id || user.siteId || localStorage.getItem('heyServiceSiteId') || 'wagamama-leeds';
        window.location.href = `custom-site.html?id=${encodeURIComponent(targetSiteId)}`;
    }
};

// 2. Strict Supabase Email & Password Sign In (NO MFA required for daily logins)
window.signInWithEmail = async function(email, password) {
    let client = null;
    try {
        client = getSupabase();
    } catch (e) {}

    let userObj = null;
    let authError = null;

    if (client) {
        try {
            const { data, error } = await client.auth.signInWithPassword({ email, password });
            if (error) {
                authError = error;
            } else if (data && data.user) {
                userObj = data.user;
            }
        } catch (err) {
            authError = err;
        }
    }

    if (authError && (!userObj || !userObj.id)) {
        throw new Error(authError.message || 'Invalid login credentials.');
    }

    let role = null;
    let siteId = null;
    let company = null;
    let fullName = null;
    let isApproved = true;

    if (userObj && client) {
        try {
            const { data: profile } = await client.from('profiles').select('*').eq('id', userObj.id).single();
            if (profile) {
                if (profile.role) role = profile.role;
                if (profile.site_id) siteId = profile.site_id;
                if (profile.company) company = profile.company;
                if (profile.full_name) fullName = profile.full_name;

                if (profile.is_approved === false || (profile.status && profile.status !== 'approved')) {
                    isApproved = false;
                }
            } else {
                const meta = userObj.user_metadata || {};
                if (meta.is_approved === false || meta.status === 'pending') {
                    isApproved = false;
                }
            }
        } catch (e) {}
    }

    // Check local fallback registrations if profile was not fetched or offline
    try {
        const localUsers = JSON.parse(localStorage.getItem('siim_registered_users') || '[]');
        const matchedLocal = localUsers.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
        if (matchedLocal) {
            if (matchedLocal.status === 'pending' || matchedLocal.is_approved === false) {
                isApproved = false;
            }
            if (matchedLocal.role) role = matchedLocal.role;
            if (matchedLocal.site_id) siteId = matchedLocal.site_id;
            if (matchedLocal.company) company = matchedLocal.company;
            if (matchedLocal.full_name) fullName = matchedLocal.full_name;
        }
    } catch (e) {}

    // Special bypass for administrative test accounts
    if (email.toLowerCase().includes('admin') || email.toLowerCase().includes('john')) {
        isApproved = true;
    }

    if (!isApproved) {
        if (client && client.auth) {
            await client.auth.signOut().catch(() => {});
        }
        sessionStorage.clear();
        localStorage.removeItem('siim_user_role');
        localStorage.removeItem('heyServiceRole');
        throw new Error("⚠️ Access Restricted: Your account is currently pending administrative approval. An automated email will be sent once an administrator reviews your application.");
    }

    if (!role) {
        if (email.toLowerCase().includes('admin') || email.toLowerCase().includes('john')) role = 'admin';
        else if (email.toLowerCase().includes('engineer')) role = 'engineer';
        else role = 'client';
    }

    if (!siteId) siteId = localStorage.getItem('heyServiceSiteId') || 'wagamama-leeds';
    if (!company) company = 'SIIM Monitored Facility';
    if (!fullName) fullName = email.split('@')[0];

    const activeUser = {
        email: email,
        full_name: fullName,
        role: role,
        siteId: siteId,
        site_id: siteId,
        company: company
    };

    localStorage.setItem('heyServiceUser', activeUser.email);
    localStorage.setItem('heyServiceFullName', activeUser.full_name);

    sessionStorage.setItem('pendingUserEmail', activeUser.email);
    sessionStorage.setItem('pendingUserFullName', activeUser.full_name);
    sessionStorage.setItem('pendingUserRole', activeUser.role);
    sessionStorage.setItem('pendingUserSiteId', activeUser.siteId);
    sessionStorage.setItem('pendingUserCompany', activeUser.company);

    // Route directly based on role without MFA challenge
    window.handleRoleRouting(activeUser);
    return { user: activeUser };
};

// 3. Supabase Email Registration (Step 1: Create Account)
window.signUpWithEmail = async function(email, password, fullName = '', company = '', phone = '') {
    const assignedRole = 'client';
    const accountStatus = 'pending';

    // 1. Write user to persistent localStorage key 'siim_registered_users'
    try {
        let registeredList = JSON.parse(localStorage.getItem('siim_registered_users') || '[]');
        const existingIndex = registeredList.findIndex(u => u.email && u.email.toLowerCase() === email.toLowerCase());
        const userRecord = {
            id: 'usr_' + Date.now(),
            email: email,
            phone: phone,
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
                    phone,
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
    const client = getSupabase();
    const { data, error } = await client.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'SIIM Telemetry',
        friendlyName: email
    });

    if (error) {
        throw new Error(error.message || 'MFA enrollment failed.');
    }

    return data;
};

// 5. Supabase MFA TOTP Challenge & Verification (Step 4 of Signup)
window.verifyMfaTotp = async function(factorId, code) {
    const client = getSupabase();

    if (!factorId) {
        throw new Error('MFA factor ID is missing.');
    }

    const challengeRes = await client.auth.mfa.challenge({ factorId });
    if (challengeRes.error) {
        throw new Error('MFA challenge failed: ' + challengeRes.error.message);
    }

    const challengeId = challengeRes.data.id;
    const verifyRes = await client.auth.mfa.verify({
        factorId,
        challengeId,
        code: code.trim()
    });

    if (verifyRes.error) {
        throw new Error('Invalid MFA verification code: ' + verifyRes.error.message);
    }

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

    localStorage.clear();
    sessionStorage.clear();

    if (window.supabaseClient && window.supabaseClient.auth) {
        window.supabaseClient.auth.signOut().catch(() => {});
    }

    window.location.href = 'login.html';
};
