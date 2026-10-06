import React from'react';import{Page,Card,Input,Textarea,Button}from'../components/UI';export default function AnnualPlan(){return <Page title="الخطة السنوية" sub="الأهداف والمخرجات والأنشطة والمؤشرات"><Card><h3>بيانات النموذج</h3><Input label="الهدف" /><Input label="المخرج" /><Input label="النشاط" /><Input label="مؤشر الإنجاز" /><Input label="الفترة" /><Textarea label="ملاحظات إضافية"/><Button>حفظ النموذج</Button></Card></Page>}
<style id="mobile-final-adjustments">
@media (max-width: 700px){
  footer, .footer, .site-footer, .app-footer { transform: translateY(-38px) !important; }
  /* Hide only the text label immediately associated with the guidance logo. */
  .guidance-logo + .guidance-label, .guidance-logo-text, .guidance-logo + span, .guidance-logo + p { display:none !important; }
}
</style>
