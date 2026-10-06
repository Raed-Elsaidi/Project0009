import React from'react';import{Page,Card,Input,Textarea,Button}from'../components/UI';export default function Reports(){return <Page title="التقارير الفصلية" sub="إعداد التقرير الفصلي للمرشد"><Card><h3>بيانات النموذج</h3><Input label="الفصل" /><Input label="المقدمة والسياق" /><Input label="الإنجازات" /><Input label="التحديات" /><Input label="الأنشطة القادمة" /><Input label="المرفقات" /><Textarea label="ملاحظات إضافية"/><Button>حفظ النموذج</Button></Card></Page>}
<style id="mobile-final-adjustments">
@media (max-width: 700px){
  footer, .footer, .site-footer, .app-footer { transform: translateY(-38px) !important; }
  /* Hide only the text label immediately associated with the guidance logo. */
  .guidance-logo + .guidance-label, .guidance-logo-text, .guidance-logo + span, .guidance-logo + p { display:none !important; }
}
</style>
