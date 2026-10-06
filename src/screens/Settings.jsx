import React from'react';import{Page,Card}from'../components/UI';export default function Settings(){return <Page title="الإعدادات"><Card><h3>إعدادات النظام</h3><p>الاتصال بقاعدة البيانات يتم عبر Supabase، والصلاحيات عبر RLS.</p></Card></Page>}
<style id="mobile-final-adjustments">
@media (max-width: 700px){
  footer, .footer, .site-footer, .app-footer { transform: translateY(-38px) !important; }
  /* Hide only the text label immediately associated with the guidance logo. */
  .guidance-logo + .guidance-label, .guidance-logo-text, .guidance-logo + span, .guidance-logo + p { display:none !important; }
}
</style>
