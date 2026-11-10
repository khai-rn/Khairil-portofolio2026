/**
 * SUPABASE CONFIGURATION
 * Khairil Portfolio — Personal Journal & Blog System
 *
 * Credentials can be set here directly, or dynamically via the Admin Settings modal
 * (persisted in localStorage).
 */

const SUPABASE_CONFIG = {
  // Replace these with your actual Supabase project credentials:
  defaultUrl: 'https://zaepmjogneoloqlbrahm.supabase.co',
  defaultAnonKey: 'sb_publishable_Utbg0dFFEzFMJaaokXntwg_FOl_Pmnf',

  getUrl() {
    let url = localStorage.getItem('KAI_SUPABASE_URL');
    if (!url || url.includes('placeholder')) {
      url = this.defaultUrl;
    }
    if (url) {
      url = url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
    }
    return url;
  },

  getAnonKey() {
    let key = localStorage.getItem('KAI_SUPABASE_ANON_KEY');
    if (!key || key.includes('placeholder')) {
      key = this.defaultAnonKey;
    }
    return key;
  },

  setCredentials(url, key) {
    if (url) {
      const cleanUrl = url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
      localStorage.setItem('KAI_SUPABASE_URL', cleanUrl);
    }
    if (key) localStorage.setItem('KAI_SUPABASE_ANON_KEY', key.trim());
  },

  clearCredentials() {
    localStorage.removeItem('KAI_SUPABASE_URL');
    localStorage.removeItem('KAI_SUPABASE_ANON_KEY');
  },

  isConfigured() {
    const url = this.getUrl();
    const key = this.getAnonKey();
    return (
      url &&
      key &&
      !url.includes('placeholder-project') &&
      !key.includes('placeholder-anon-key')
    );
  }
};

window.SUPABASE_CONFIG = SUPABASE_CONFIG;

