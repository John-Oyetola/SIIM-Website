// js/supabase-config.js — SIIM Production Supabase Client Configuration

const SUPABASE_URL = 'https://xysdsuxwldxjjgmftrop.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qhSCfWuIs8UWhqwj31CeRg_ZUmdxJKi';

let supabaseClient = null;

if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
    try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('SIIM Auth: Supabase client initialized successfully.');
    } catch (err) {
        console.error('SIIM Auth: Error initializing Supabase client:', err);
    }
} else {
    console.error('SIIM Auth: Supabase SDK not found. Ensure @supabase/supabase-js CDN is loaded.');
}

window.supabaseClient = supabaseClient;
