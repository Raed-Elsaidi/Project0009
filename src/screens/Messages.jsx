import React,{useEffect,useMemo,useRef,useState} from 'react'
import {Mail,Send,Inbox,Plus,RefreshCw,Search,CheckCheck,MessageCircle,ArrowRight,Trash2,Smile,Users,UserRound,Building2,Clock3,Paperclip,FileText,ExternalLink,X} from 'lucide-react'
import {Page,Card,Button,Input,Select,Empty,ErrorNotice} from '../components/UI'
import {currentProfile,listMessageRecipients,listMessageDepartments,listMessages,sendMessage,markMessageRead,deleteMessage,uploadMessageAttachment,listMessageAttachments,openMessageAttachment} from '../services/data'

const emptyForm={recipient_type:'person',recipient_id:'',department_id:'',subject:'',body:'',priority:'عادي'}
const emojis=['😀','😊','😂','😍','🥰','👍','👏','❤️','🌷','🌟','✨','📌','📚','📝','📅','⏰','✅','⚠️','🙏','💡','🎯','🤝','📣','📩']

function formatDate(value){
  if(!value)return '—'
  return new Date(value).toLocaleString('en-GB',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})
}

export default function Messages(){
  const [profile,setProfile]=useState(null),[messages,setMessages]=useState([]),[recipients,setRecipients]=useState([]),[departments,setDepartments]=useState([]),[tab,setTab]=useState('inbox')
  const [selected,setSelected]=useState(null),[form,setForm]=useState(emptyForm),[loading,setLoading]=useState(true),[sending,setSending]=useState(false)
  const [error,setError]=useState(''),[notice,setNotice]=useState(''),[search,setSearch]=useState(''),[emojiOpen,setEmojiOpen]=useState(false),[attachment,setAttachment]=useState(null),[attachments,setAttachments]=useState([]),[attachmentLoading,setAttachmentLoading]=useState(false)
  const bodyRef=useRef(null),fileRef=useRef(null)

  const load=async()=>{
    setLoading(true);setError('')
    try{
      const p=await currentProfile();setProfile(p)
      const [m,r,d]=await Promise.all([listMessages(),listMessageRecipients(),listMessageDepartments()])
      setMessages(m);setRecipients(r);setDepartments(d)
    }catch(e){setError(e.message||'تعذر تحميل المراسلات.')}
    finally{setLoading(false)}
  }
  useEffect(()=>{load()},[])

  const unread=messages.filter(m=>m.recipient_id===profile?.id&&!m.read_at&&!m.recipient_deleted_at).length

  const visible=useMemo(()=>{
    const q=search.trim().toLowerCase()
    return messages.filter(m=>{
      const ownInbox=m.recipient_id===profile?.id&&!m.recipient_deleted_at
      const ownSent=m.sender_id===profile?.id&&!m.sender_deleted_at
      const inTrash=(m.sender_id===profile?.id&&m.sender_deleted_at)||(m.recipient_id===profile?.id&&m.recipient_deleted_at)
      const tabMatch=tab==='inbox'?ownInbox:tab==='sent'?ownSent:inTrash
      if(!tabMatch)return false
      if(!q)return true
      return [m.subject,m.body,m.sender?.full_name,m.recipient?.full_name].filter(Boolean).join(' ').toLowerCase().includes(q)
    })
  },[messages,tab,profile,search])

  const openMessage=async m=>{
    setSelected(m);setAttachments([])
    try{const a=await listMessageAttachments(m.id);setAttachments(a)}catch{}
    if(m.recipient_id===profile?.id&&!m.read_at&&!m.recipient_deleted_at){
      try{await markMessageRead(m.id);setMessages(x=>x.map(row=>row.id===m.id?{...row,read_at:new Date().toISOString()}:row))}catch{}
    }
  }

  const addEmoji=(emoji)=>{
    const el=bodyRef.current
    const value=form.body||''
    const start=el?.selectionStart??value.length
    const end=el?.selectionEnd??value.length
    const next=value.slice(0,start)+emoji+value.slice(end)
    setForm({...form,body:next})
    setEmojiOpen(false)
    requestAnimationFrame(()=>{if(el){el.focus();const pos=start+emoji.length;el.setSelectionRange(pos,pos)}})
  }

  const submit=async e=>{
    e.preventDefault();setError('');setNotice('')
    if(!form.subject.trim()||!form.body.trim()){setError('يرجى كتابة عنوان ونص الرسالة.');return}

    let targetIds=[]
    if(form.recipient_type==='person'){
      if(!form.recipient_id){setError('يرجى اختيار الشخص المستلم.');return}
      targetIds=[form.recipient_id]
    }else if(form.recipient_type==='department'){
      if(!form.department_id){setError('يرجى اختيار القسم.');return}
      targetIds=recipients.filter(r=>r.directorate_id===form.department_id).map(r=>r.id)
      if(!targetIds.length){setError('لا يوجد مستخدمون نشطون في القسم المحدد.');return}
    }else{
      targetIds=recipients.map(r=>r.id)
      if(!targetIds.length){setError('لا يوجد مستخدمون نشطون لإرسال الرسالة إليهم.');return}
    }

    setSending(true)
    try{
      const created=await sendMessage({...form,recipient_ids:targetIds})
      if(attachment && created?.length) await uploadMessageAttachment(created.map(x=>x.id),attachment)
      const text=form.recipient_type==='everyone'
        ?'تم إرسال الرسالة إلى جميع المستخدمين في النظام.'
        :form.recipient_type==='department'
          ?'تم إرسال الرسالة إلى جميع مستخدمي القسم المحدد.'
          :'تم إرسال الرسالة بنجاح.'
      setForm(emptyForm);setAttachment(null);setTab('sent');setSelected(null);setEmojiOpen(false);if(fileRef.current)fileRef.current.value=''
      await load()
      setNotice(text)
      window.setTimeout(()=>setNotice(''),2000)
    }catch(e){setError(e.message||'تعذر إرسال الرسالة.')}
    finally{setSending(false)}
  }

  const remove=async m=>{
    try{
      const side=m.sender_id===profile?.id?'sent':'inbox'
      await deleteMessage(m.id,side)
      setMessages(x=>x.map(row=>row.id===m.id?{...row,...(side==='sent'?{sender_deleted_at:new Date().toISOString()}:{recipient_deleted_at:new Date().toISOString()})}:row))
      if(selected?.id===m.id)setSelected(null)
    }catch(e){setError(e.message||'تعذر حذف الرسالة.')}
  }

  const recipientLabel=r=>r?`${r.full_name} — ${r.role==='DIRECTORATE'?'رئيس القسم':r.role==='PRINCIPAL'?'المشرف التربوي':r.role==='MINISTRY'?'مسؤول الإرشاد':'المرشد التربوي'}`:'—'

  return <Page title="المراسلات" sub="مراسلات داخلية رسمية بين مستخدمي نظام الإرشاد التربوي" actions={<Button onClick={load} variant="secondary"><RefreshCw size={16}/> تحديث</Button>}>
    <div className="message-tabs">
      <button className={tab==='inbox'?'active':''} onClick={()=>{setTab('inbox');setSelected(null)}}><Inbox size={17}/> الوارد <b>{unread}</b></button>
      <button className={tab==='sent'?'active':''} onClick={()=>{setTab('sent');setSelected(null)}}><Send size={17}/> الصادر</button>
      <button className={tab==='trash'?'active':''} onClick={()=>{setTab('trash');setSelected(null)}}><Trash2 size={17}/> سلة المحذوفات</button>
      <button className={tab==='compose'?'active':''} onClick={()=>{setTab('compose');setSelected(null);setError('');setNotice('')}}><Plus size={17}/> رسالة جديدة</button>
    </div>

    {error&&<ErrorNotice>{error}</ErrorNotice>}
    {notice&&<div className="notice message-success">{notice}</div>}

    {tab==='compose'?<Card className="message-compose-card">
      <div className="section-title"><h2><Send size={18}/> رسالة جديدة</h2><span>اختر جهة الإرسال ثم اكتب الرسالة وأرسلها مباشرة.</span></div>
      <form onSubmit={submit}>
        <div className="form-grid two">
          <Select label="إرسال إلى" value={form.recipient_type} onChange={e=>setForm({...form,recipient_type:e.target.value,recipient_id:'',department_id:''})}>
            <option value="person">شخص</option><option value="department">قسم</option><option value="everyone">الجميع</option>
          </Select>
          {form.recipient_type==='person'?<Select label="المستلم" value={form.recipient_id} onChange={e=>setForm({...form,recipient_id:e.target.value})}>
            <option value="">اختر الشخص</option>{recipients.map(r=><option key={r.id} value={r.id}>{recipientLabel(r)}</option>)}
          </Select>:form.recipient_type==='department'?<Select label="القسم" value={form.department_id} onChange={e=>setForm({...form,department_id:e.target.value})}>
            <option value="">اختر القسم</option>{departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>:<div className="broadcast-info"><Users size={18}/><div><strong>الجميع</strong><span>سيتم إرسال الرسالة إلى جميع المستخدمين النشطين في النظام.</span></div></div>}
        </div>

        <div className="form-grid two">
          <Input label="عنوان الرسالة" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} placeholder="مثال: متابعة خطة الإرشاد"/>
          <Select label="الأولوية" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option>عادي</option><option>مهم</option><option>عاجل</option></Select>
        </div>

        <label className="field message-body-field">
          <span>نص الرسالة</span>
          <div className="message-editor">
            <textarea ref={bodyRef} value={form.body} onChange={e=>setForm({...form,body:e.target.value})} placeholder="اكتب المراسلة هنا..."/>
            <div className="emoji-wrap">
              <button type="button" className="emoji-button" title="إضافة رمز تعبيري" onClick={()=>setEmojiOpen(v=>!v)}><Smile size={19}/></button>
              {emojiOpen&&<div className="emoji-picker">{emojis.map(em=><button type="button" key={em} onClick={()=>addEmoji(em)}>{em}</button>)}</div>}
            </div>
          </div>
        </label>

        <div className="message-attachment-row">
          <input ref={fileRef} type="file" hidden onChange={e=>setAttachment(e.target.files?.[0]||null)} />
          <button type="button" className="attachment-button" onClick={()=>fileRef.current?.click()}><Paperclip size={17}/> إضافة مرفق</button>
          {attachment&&<div className="attachment-chip"><FileText size={15}/><span title={attachment.name}>{attachment.name}</span><small>{(attachment.size/1024/1024).toFixed(2)} MB</small><button type="button" onClick={()=>{setAttachment(null);if(fileRef.current)fileRef.current.value='' }}><X size={14}/></button></div>}
          <small>الحد الأقصى للمرفق 10 MB.</small>
        </div>

        <div className="message-compose-footer"><span><Mail size={15}/> ستظهر رسالة تأكيد بعد الإرسال وتختفي تلقائيًا.</span><Button loading={sending}><Send size={16}/> إرسال الرسالة</Button></div>
      </form>
    </Card>:<div className="message-workspace">
      <Card className="message-table-card">
        <div className="message-list-head"><strong>{tab==='inbox'?'الوارد':tab==='sent'?'الصادر':'سلة المحذوفات'}</strong><span>{visible.length} رسالة</span></div>
        <div className="searchbar"><Search size={16}/><input value={search} placeholder="بحث في الرسائل..." onChange={e=>setSearch(e.target.value)}/></div>
        {loading?<div className="loading">جارٍ تحميل المراسلات...</div>:visible.length===0?<Empty title={tab==='trash'?'سلة المحذوفات فارغة':'لا توجد مراسلات'} text="ستظهر الرسائل هنا في جدول منظم."/>:
          <div className="message-table-scroll"><table className="message-table"><thead><tr><th>مسلسل</th><th>المرسل</th><th>المستقبل</th><th>عنوان الرسالة</th><th>تاريخ ووقت الإرسال</th><th>التسليم</th><th>القراءة</th><th>حذف</th></tr></thead><tbody>
            {visible.map((m,i)=><tr key={m.id} className={!m.read_at&&tab==='inbox'?'unread-row':''}>
              <td>{i+1}</td>
              <td>{m.sender?.full_name||'—'}</td>
              <td>{m.recipient?.full_name||'—'}</td>
              <td className="subject-cell"><button type="button" className="subject-link" onClick={()=>openMessage(m)}>{m.subject}</button></td>
              <td dir="ltr">{formatDate(m.created_at)}</td>
              <td><span className="status-check">{m.delivered_at?'✓':'—'}</span></td>
              <td><span className={m.read_at?'status-check':'status-pending'}>{m.read_at?'✓':'—'}</span></td>
              <td><button type="button" className="table-delete" title="حذف" onClick={e=>{e.stopPropagation();remove(m)}}><Trash2 size={15}/></button></td>
            </tr>)}
          </tbody></table></div>}
      </Card>

      <Card className="message-detail message-detail-card">{selected?<><button className="back-message" onClick={()=>setSelected(null)}><ArrowRight size={16}/> العودة للقائمة</button>
        <div className="message-detail-head"><div className="message-avatar large"><MessageCircle size={20}/></div><div><strong>{tab==='inbox'?selected.sender?.full_name:selected.recipient?.full_name}</strong><span>{tab==='inbox'?'رسالة واردة':tab==='sent'?'رسالة صادرة':'مراسلة'} • {formatDate(selected.created_at)}</span></div><em>{selected.priority}</em></div>
        <hr/><h2>{selected.subject}</h2><p className="message-body">{selected.body}</p>
        {attachments.length>0&&<div className="message-attachments"><strong><Paperclip size={16}/> المرفقات</strong>{attachments.map(a=><button key={a.id} type="button" className="message-attachment-link" onClick={async()=>{try{setAttachmentLoading(true);await openMessageAttachment(a.storage_path)}catch(e){setError(e.message||'تعذر فتح المرفق.')}finally{setAttachmentLoading(false)}}} disabled={attachmentLoading}><FileText size={17}/><span>{a.file_name}</span><ExternalLink size={14}/></button>)}</div>}:null}</>:<div className="message-placeholder"><Mail size={36}/><strong>اختر رسالة لعرضها</strong><span>يمكنك قراءة الرسالة ومعرفة حالة التسليم والقراءة.</span></div>}</Card>
    </div>}
  </Page>
}

<style id="mobile-final-adjustments">
@media (max-width: 700px){
  footer, .footer, .site-footer, .app-footer { transform: translateY(-38px) !important; }
  /* Hide only the text label immediately associated with the guidance logo. */
  .guidance-logo + .guidance-label, .guidance-logo-text, .guidance-logo + span, .guidance-logo + p { display:none !important; }
}
</style>
