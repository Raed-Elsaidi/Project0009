// تم إلغاء نظام المصادقة نهائيًا من تطبيق الإرشاد التربوي.
// هذا الملف متروك للتوافق مع النسخ القديمة فقط ولا يتم استدعاؤه من التطبيق.
export const getCustomSession=()=>null
export const clearCustomSession=()=>{}
export const logoutEmployee=async()=>{}
export const validateCustomSession=async()=>true
export const loginWithEmployeeCredentials=async()=>{throw new Error('تسجيل الدخول غير مستخدم في وضع التشغيل المباشر.')}

<style id="mobile-final-adjustments">
@media (max-width: 700px){
  footer, .footer, .site-footer, .app-footer { transform: translateY(-38px) !important; }
  /* Hide only the text label immediately associated with the guidance logo. */
  .guidance-logo + .guidance-label, .guidance-logo-text, .guidance-logo + span, .guidance-logo + p { display:none !important; }
}
</style>
