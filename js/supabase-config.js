const OPERATIONS_CONFIG = window.RESTAURANT_CONFIG?.operations || {};

// Initialize Supabase Client with Realtime configuration
const supabaseClient = window.supabase?.createClient && OPERATIONS_CONFIG.url && OPERATIONS_CONFIG.anonKey
    ? window.supabase.createClient(OPERATIONS_CONFIG.url, OPERATIONS_CONFIG.anonKey, {
    realtime: {
        params: {
            eventsPerSecond: 20
        },
        multiTab: true
    }
    })
    : null;
