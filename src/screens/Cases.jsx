import React from'react';import{Page,Card,Input,Textarea,Button}from'../components/UI';export default function Cases(){return <Page title="دراسة الحالات" sub="ملف دراسة الحالة والمتابعة"><Card><h3>بيانات النموذج</h3><Input label="رمز الطالب" /><Input label="تاريخ فتح الحالة" type="date" /><Input label="سبب الإحالة" /><Input label="وصف المشكلة" /><Input label="التشخيص المهني" /><Input label="خطة التدخل" /><Input label="آلية المتابعة" /><Textarea label="ملاحظات إضافية"/><Button>حفظ النموذج</Button></Card></Page>}
<style id="mobile-final-adjustments">
@media (max-width: 700px){
  footer, .footer, .site-footer, .app-footer { transform: translateY(-38px) !important; }
  /* Hide only the text label immediately associated with the guidance logo. */
  .guidance-logo + .guidance-label, .guidance-logo-text, .guidance-logo + span, .guidance-logo + p { display:none !important; }
}
</style>
