import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export default function Attachments() {
  const [attachments, setAttachments] = useState([]);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // حساب اليوم والتاريخ تلقائياً
  const currentDate = new Date().toISOString().split('T')[0];
  const currentDay = new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(new Date());

  useEffect(() => {
    fetchAttachments();
  }, []);

  const fetchAttachments = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('attachments').select('*').order('created_at', { ascending: false });
    if (!error) setAttachments(data || []);
    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const uploadedFiles = Array.from(e.target.files);
    let urls = [];
    for (let file of uploadedFiles) {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage.from('attachments-bucket').upload(fileName, file);
      if (!error) {
        const { data: publicUrlData } = supabase.storage.from('attachments-bucket').getPublicUrl(fileName);
        urls.push(publicUrlData.publicUrl);
      }
    }
    setFiles(prev => [...prev, ...urls]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const attachmentData = {
      title,
      details,
      day: currentDay,
      date: currentDate,
      file_urls: files
    };

    if (editingId) {
      const { error } = await supabase.from('attachments').update(attachmentData).eq('id', editingId);
      if (!error) {
        setEditingId(null);
        resetForm();
        fetchAttachments();
      }
    } else {
      const { error } = await supabase.from('attachments').insert([attachmentData]);
      if (!error) {
        resetForm();
        fetchAttachments();
      }
    }
  };

  const resetForm = () => {
    setTitle('');
    setDetails('');
    setFiles([]);
    setEditingId(null);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDetails(item.details || '');
    setFiles(item.file_urls || []);
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المرفق؟')) {
      const { error } = await supabase.from('attachments').delete().eq('id', id);
      if (!error) fetchAttachments();
    }
  };

  const filteredAttachments = attachments.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.details?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 bg-white rounded-xl shadow-md" dir="rtl">
      <h2 className="text-2xl font-bold text-gray-800 border-b pb-3">إدارة المرفقات</h2>
      
      {/* نموذج الإضافة والتعديل */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
        <div>
          <label className="block text-sm font-medium text-gray-700">عنوان المرفق</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">اليوم والتاريخ (تلقائي)</label>
          <input 
            type="text" 
            value={`${currentDay} - ${currentDate}`}
            disabled 
            className="mt-1 block w-full rounded-md bg-gray-100 border-gray-300 shadow-sm p-2 border text-gray-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">التفاصيل</label>
          <textarea 
            value={details} 
            onChange={(e) => setDetails(e.target.value)} 
            rows="3" 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          ></textarea>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">رفع الصور والملفات المتعددة</label>
          <input 
            type="file" 
            multiple 
            onChange={handleFileUpload} 
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <div className="md:col-span-2 flex space-x-2 space-x-reverse">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            {editingId ? 'تحديث المرفق' : 'حفظ المرفق'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500">
              إلغاء التعديل
            </button>
          )}
        </div>
      </form>

      {/* البحث والجدول */}
      <div className="space-y-4">
        <input 
          type="text" 
          placeholder="بحث في المرفقات..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className="w-full p-2 border rounded-md shadow-sm"
        />

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العنوان</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التفاصيل</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">اليوم والتاريخ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الملفات</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAttachments.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.details}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.day} ({item.date})</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                    {item.file_urls?.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noreferrer" className="block underline">رابط ملف {idx + 1}</a>
                    ))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 space-x-reverse">
                    <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:text-indigo-900 ml-3">تعديل</button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}