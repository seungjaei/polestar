/* ============================================================
   POLESTAR — Supabase client
   Public URL + publishable (anon) key are safe to expose in
   client-side code; access is enforced by Row Level Security.
   ============================================================ */
(() => {
  'use strict';
  const SUPABASE_URL = 'https://lrfocfydxxhvfwtwbjss.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_15RiV4_MDZ_g2fmeZtHSrQ_9Ab3ogUe';

  window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
})();
