import React from'react';import{Page,Card,Input,Textarea,Button}from'../components/UI';export default function Absence(){return <Page title="الغياب" sub="تسجيل الغياب المتكرر ومتابعته"><Card><h3>بيانات النموذج</h3><Input label="الطالب" /><Input label="الصف والشعبة" /><Input label="عدد أيام الغياب" /><Input label="سبب الغياب" /><Input label="الإجراء" /><Input label="النتيجة" /><Textarea label="ملاحظات إضافية"/><Button>حفظ النموذج</Button></Card></Page>}
<style id="mobile-final-adjustments">
@media (max-width: 700px){
  footer, .footer, .site-footer, .app-footer { transform: translateY(-38px) !important; }
  /* Hide only the text label immediately associated with the guidance logo. */
  .guidance-logo + .guidance-label, .guidance-logo-text, .guidance-logo + span, .guidance-logo + p { display:none !important; }
}
</style>
