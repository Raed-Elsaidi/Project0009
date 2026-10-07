// تم إلغاء نظام المصادقة نهائيًا من تطبيق الإرشاد التربوي.
// هذا الملف متروك للتوافق مع النسخ القديمة فقط ولا يتم استدعاؤه من التطبيق.
export const getCustomSession=()=>null
export const clearCustomSession=()=>{}
export const logoutEmployee=async()=>{}
export const validateCustomSession=async()=>true
export const loginWithEmployeeCredentials=async()=>{throw new Error('تسجيل الدخول غير مستخدم في وضع التشغيل المباشر.')}

