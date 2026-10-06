import { createClient } from '@supabase/supabase-js'
const url=import.meta.env.VITE_SUPABASE_URL
const key=import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase=url&&key?createClient(url,key):null
export const requireSupabase=()=>{if(!supabase) throw new Error('ضع VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في ملف .env.local'); return supabase}

<style id="mobile-final-adjustments">
@media (max-width: 700px){
  footer, .footer, .site-footer, .app-footer { transform: translateY(-38px) !important; }
  /* Hide only the text label immediately associated with the guidance logo. */
  .guidance-logo + .guidance-label, .guidance-logo-text, .guidance-logo + span, .guidance-logo + p { display:none !important; }
}
</style>
