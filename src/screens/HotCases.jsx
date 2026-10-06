import React from'react';import{Page,Card,Input,Textarea,Button}from'../components/UI';export default function HotCases(){return <Page title="الحالات الساخنة" sub="إدارة الحالات ذات الأولوية ومسار المتابعة"><Card><h3>بيانات النموذج</h3><Input label="رمز الطالب" /><Input label="نوع الحالة" /><Input label="تاريخ الإحالة" type="date" /><Input label="سبب الإحالة" /><Input label="وصف الحالة" /><Input label="الإجراء العاجل" /><Input label="خطة المتابعة" /><Textarea label="ملاحظات إضافية"/><Button>حفظ النموذج</Button></Card></Page>}
<style id="mobile-final-adjustments">
@media (max-width: 700px){
  footer, .footer, .site-footer, .app-footer { transform: translateY(-38px) !important; }
  /* Hide only the text label immediately associated with the guidance logo. */
  .guidance-logo + .guidance-label, .guidance-logo-text, .guidance-logo + span, .guidance-logo + p { display:none !important; }
}
</style>
