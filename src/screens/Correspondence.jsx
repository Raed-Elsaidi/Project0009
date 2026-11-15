import React, { useEffect, useRef, useState } from 'react';
import { Paperclip, Pencil, Trash2, Plus, FileText, Eye, X, Inbox, Send } from 'lucide-react';
import { Page, Card, Button, Input, Textarea, Select, ErrorNotice, Empty } from '../components/UI';
import { currentProfile, listActiveAcademicData, listMinistryCorrespondence, createMinistryCorrespondence, updateMinistryCorrespondence, deleteMinistryCorrespondence, addMinistryCorrespondenceAttachment, openMinistryCorrespondenceAttachment } from '../services/data';

const fresh = (yearId = '') => ({ school_year_id: yearId, correspondence_date: new Date().toISOString().slice(0,10), title: '', details: '' });

export default function Correspondence() {
  const [profile, setProfile] = useState(null);
  const [years, setYears] = useState([]);
  const [yearId, setYearId] = useState('');
  const [type, setType] = useState('outgoing');
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(fresh());
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef(null);
  const [uploadFor, setUploadFor] = useState(null);

  async function refresh(selectedYear = yearId, selectedType = type) {
    if (!selectedYear) { setRows([]); return; }
    setLoading(true); setError('');
    try { setRows(await listMinistryCorrespondence(selectedYear, selectedType)); }
    catch (e) { setError(e.message || 'تعذر تحميل المعاملات.'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    (async () => {
      try {
        const [p, academic] = await Promise.all([currentProfile(), listActiveAcademicData()]);
        setProfile(p);
        const allYears = academic.years || [];
        setYears(allYears);
        const active = allYears.find(y => y.is_active) || allYears[0];
        if (active) { setYearId(active.id); setForm(fresh(active.id)); }
      } catch (e) { setError(e.message || 'تعذر تحميل بيانات الشاشة.'); }
    })();
  }, []);

  useEffect(() => { if (yearId) refresh(yearId, type); }, [yearId, type]);

  function reset() { setEditing(null); setForm(fresh(yearId)); }
  async function save(e) {
    e.preventDefault(); setError('');
    if (!yearId || !form.title.trim() || !form.correspondence_date) {
      setError('اختاري السنة الأكاديمية واكتبي العنوان والتاريخ.'); return;
    }
    setLoading(true);
    try {
      const payload = { ...form, school_year_id: yearId, record_type: type };
      if (editing) await updateMinistryCorrespondence(editing.id, payload);
      else await createMinistryCorrespondence(payload);
      reset(); await refresh(yearId, type);
    } catch (e) { setError(e.message || 'تعذر حفظ المعاملة.'); }
    finally { setLoading(false); }
  }
  function startEdit(row) {
    setEditing(row);
    setForm({ school_year_id: row.school_year_id, correspondence_date: row.correspondence_date, title: row.title || '', details: row.details || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  async function remove(row) {
    if (!window.confirm(`حذف المعاملة رقم ${row.serial_number}؟ سيتم حذف مرفقاتها أيضًا.`)) return;
    setLoading(true);
    try { await deleteMinistryCorrespondence(row.id); if (editing?.id === row.id) reset(); await refresh(); }
    catch (e) { setError(e.message || 'تعذر حذف المعاملة.'); }
    finally { setLoading(false); }
  }
  function chooseFile(row) { setUploadFor(row); fileInput.current?.click(); }
  async function uploadFile(e) {
    const file = e.target.files?.[0];
    if (!file || !uploadFor) return;
    setLoading(true); setError('');
    try { await addMinistryCorrespondenceAttachment(uploadFor.id, file); await refresh(); }
    catch (err) { setError(err.message || 'تعذر رفع المرفق.'); }
    finally { setLoading(false); e.target.value = ''; setUploadFor(null); }
  }
  async function openFile(path) {
    try { await openMinistryCorrespondenceAttachment(path); }
    catch (e) { setError(e.message || 'تعذر فتح المرفق.'); }
  }

  return <Page title="الصادر والوارد" sub="سجل الكتب والملفات المتبادلة مع وزارة التربية والتعليم">
    {error && <ErrorNotice>{error}</ErrorNotice>}
    <Card>
      <div className="section-title"><h2><FileText size={19}/> تسجيل معاملة جديدة</h2><span>{editing ? `تعديل المعاملة رقم ${editing.serial_number}` : 'إضافة كتاب صادر أو وارد'}</span></div>
      <form onSubmit={save}>
        <div className="form-grid three">
          <Select label="السنة الأكاديمية" value={yearId} onChange={e => { setYearId(e.target.value); setForm(fresh(e.target.value)); setEditing(null); }}>
            <option value="">اختاري السنة الأكاديمية</option>
            {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
          </Select>
          <Input label="تاريخ المعاملة" type="date" value={form.correspondence_date} onChange={e => setForm(f => ({ ...f, correspondence_date: e.target.value }))} />
          <Input label="عنوان المعاملة" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="عنوان الكتاب أو الملف" />
        </div>
        <Textarea label="التفاصيل" rows={3} value={form.details} onChange={e => setForm(f => ({ ...f, details: e.target.value }))} placeholder="اكتبي تفاصيل المعاملة أو ملخصها..." />
        <div className="row-actions">
          <Button type="submit" loading={loading}><Plus size={16}/>{editing ? 'حفظ التعديلات' : 'إضافة المعاملة'}</Button>
          {editing && <Button type="button" variant="secondary" onClick={reset}><X size={16}/> إلغاء التعديل</Button>}
        </div>
      </form>
    </Card>

    <Card>
      <div className="message-tabs">
        <button type="button" className={type === 'outgoing' ? 'active' : ''} onClick={() => { setType('outgoing'); reset(); }}><Send size={16}/> الصادر</button>
        <button type="button" className={type === 'incoming' ? 'active' : ''} onClick={() => { setType('incoming'); reset(); }}><Inbox size={16}/> الوارد</button>
        <div style={{ marginInlineStart: 'auto', alignSelf: 'center', color: 'var(--muted)', fontSize: 11 }}>عدد المعاملات: {rows.length}</div>
      </div>
      <input ref={fileInput} type="file" hidden onChange={uploadFile} accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" />
      {loading && !rows.length ? <div className="loading">جارٍ تحميل المعاملات...</div> : rows.length === 0 ? <Empty title="لا توجد معاملات مسجلة" text="أضيفي أول معاملة في هذا القسم." /> :
        <div className="table-wrap"><table className="table">
          <thead><tr><th>المسلسل</th><th>السنة الأكاديمية</th><th>التاريخ</th><th>العنوان</th><th>التفاصيل</th><th>المرفقات</th><th>الإجراءات</th></tr></thead>
          <tbody>{rows.map(row => <tr key={row.id}>
            <td><strong>{row.serial_number}</strong></td>
            <td>{row.school_years?.name || years.find(y => y.id === row.school_year_id)?.name || '—'}</td>
            <td>{row.correspondence_date}</td><td>{row.title}</td><td style={{ whiteSpace: 'normal', minWidth: 180 }}>{row.details || '—'}</td>
            <td><div style={{ display: 'grid', gap: 6 }}>
              <Button type="button" variant="secondary" onClick={() => chooseFile(row)}><Paperclip size={14}/> إضافة مرفق</Button>
              {(row.ministry_correspondence_attachments || []).map(a => <button key={a.id} type="button" className="btn secondary" onClick={() => openFile(a.storage_path)}><Eye size={14}/>{a.file_name}</button>)}
            </div></td>
            <td><div className="row-actions"><Button type="button" variant="secondary" onClick={() => startEdit(row)}><Pencil size={14}/> تعديل</Button><Button type="button" variant="danger" onClick={() => remove(row)}><Trash2 size={14}/> حذف</Button></div></td>
          </tr>)}</tbody>
        </table></div>}
    </Card>
    <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 8 }}>يُنشأ الرقم المسلسل تلقائيًا لكل نوع معاملة ولكل مرشد ضمن السنة الأكاديمية.</div>
  </Page>;
}
