import React from'react';import{Page,Card,Input,Textarea,Button}from'../components/UI';export default function Lateness(){return <Page title="التأخر الصباحي" sub="تسجيل حالات التأخر ومتابعتها"><Card><h3>بيانات النموذج</h3><Input label="الطالب" /><Input label="الصف والشعبة" /><Input label="عدد مرات التأخر" /><Input label="السبب" /><Input label="الإجراء" /><Input label="النتيجة" /><Textarea label="ملاحظات إضافية"/><Button>حفظ النموذج</Button></Card></Page>}
<style id="mobile-final-adjustments">
@media (max-width: 700px){
  footer, .footer, .site-footer, .app-footer { transform: translateY(-38px) !important; }
  /* Hide only the text label immediately associated with the guidance logo. */
  .guidance-logo + .guidance-label, .guidance-logo-text, .guidance-logo + span, .guidance-logo + p { display:none !important; }
}
</style>
