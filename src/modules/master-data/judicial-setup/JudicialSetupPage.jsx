import React, { useState, useEffect, useRef } from 'react';
import PageHeader from '../../../components/ui/PageHeader';
import Breadcrumb from '../../../components/ui/Breadcrumb';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import { useToast } from '../../../components/ui/Toast';
import invoke from '../../../api/tauriApi';
import { Users, Pill, Plus, Scale, Search, Upload, FileText, Copy, FolderOpen, Trash2, Eye } from 'lucide-react';

const JudicialSetupPage = () => {
  const [activeTab, setActiveTab] = useState('patients');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const [patients, setPatients] = useState([]);
  const [medicines, setMedicines] = useState([]);

  // Single Add/Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  // Bulk Import Modal (medicines only)
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkUnit, setBulkUnit] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Patient PDFs Manager
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [activePatientForFiles, setActivePatientForFiles] = useState(null);
  const [patientFiles, setPatientFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  
  // File Upload
  const pdfInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  // PDF Viewer
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfViewerData, setPdfViewerData] = useState(null);
  const [pdfViewerName, setPdfViewerName] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  // Search
  const [search, setSearch] = useState('');

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'patients') {
        const p = await invoke('get_judicial_patients');
        setPatients(p);
      } else {
        setMedicines(await invoke('get_judicial_medicines'));
      }
    } catch (err) {
      console.error(err);
      toast.error(`خطأ في تحميل البيانات: ${err}`);
    } finally { setLoading(false); }
  };

  const handleOpenAdd = () => { setEditId(null); setFormData({}); setShowModal(true); };
  const handleOpenEdit = (item) => {
    setEditId(item.id);
    setFormData({ ...item });
    setShowModal(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`هل أنت متأكد من حذف "${item.name}"؟`)) return;
    try {
      const cmd = activeTab === 'patients' ? 'delete_judicial_patient' : 'delete_judicial_medicine';
      await invoke(cmd, { id: item.id });
      toast.success('تم الحذف بنجاح');
      fetchData();
    } catch (err) { toast.error(`فشل الحذف: ${err}`); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.name.trim()) { toast.warning('يرجى إدخال الاسم'); return; }
    setSaving(true);
    try {
      if (activeTab === 'patients') {
        if (!formData.court_ruling_date || !formData.treatment_start_date) {
          toast.warning('يرجى إدخال التواريخ المطلوبة');
          setSaving(false); return;
        }
        const payload = {
          name: formData.name.trim(),
          diagnosis: formData.diagnosis || null,
          courtRulingDate: formData.court_ruling_date,
          treatmentStartDate: formData.treatment_start_date,
          clinicId: null,
          areaId: null,
        };
        if (editId) await invoke('update_judicial_patient', { id: editId, ...payload });
        else await invoke('add_judicial_patient', payload);
      } else {
        if (!formData.unit) { toast.warning('يرجى إدخال الوحدة'); setSaving(false); return; }
        const payload = { name: formData.name.trim(), unit: formData.unit, description: formData.description || null };
        if (editId) await invoke('update_judicial_medicine', { id: editId, ...payload });
        else await invoke('add_judicial_medicine', payload);
      }
      toast.success(editId ? 'تم التعديل بنجاح' : 'تمت الإضافة بنجاح');
      setShowModal(false);
      fetchData();
    } catch (err) { toast.error(`فشل الحفظ: ${err}`); }
    finally { setSaving(false); }
  };

  // ─── Patient PDFs Manager ─────────────────────────
  const handleOpenFiles = async (patient) => {
    setActivePatientForFiles(patient);
    setShowFilesModal(true);
    await loadPatientFiles(patient.id);
  };

  const loadPatientFiles = async (patientId) => {
    setLoadingFiles(true);
    try {
      const files = await invoke('get_patient_pdfs_list', { patientId });
      setPatientFiles(files);
    } catch (err) {
      toast.error(`خطأ في تحميل الملفات: ${err}`);
      setPatientFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handlePdfFileSelected = async (e) => {
    const file = e.target.files[0];
    if (!file || !activePatientForFiles) return;
    
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          // Calculate proper sequence number avoiding duplicates
          const maxNum = patientFiles.reduce((max, f) => {
            const match = f.file_name.match(/_(\d+)\.pdf$/);
            return match ? Math.max(max, parseInt(match[1], 10)) : max;
          }, 0);
          const fileCount = maxNum + 1;
          const safeName = `${activePatientForFiles.name.replace(/[^a-zA-Z0-9\u0600-\u06FF.-]/g, '_')}_${fileCount}.pdf`;
          
          // Convert to base64
          const arrayBuffer = reader.result;
          const uint8Array = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
          }
          const base64Data = btoa(binary);
          
          // Save to backend
          await invoke('add_patient_pdf', { 
            patientId: activePatientForFiles.id, 
            fileName: safeName, 
            pdfData: base64Data 
          });
          
          toast.success(`تم رفع الملف بنجاح`);
          await loadPatientFiles(activePatientForFiles.id);
        } catch (err) {
          toast.error(`فشل رفع الملف: ${err}`);
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      toast.error(`فشل قراءة الملف: ${err}`);
      setIsUploading(false);
    }
    
    e.target.value = '';
  };

  const handleDeleteFile = async (file) => {
    if (!window.confirm(`هل أنت متأكد من حذف ملف "${file.file_name}"؟`)) return;
    try {
      await invoke('delete_patient_pdf', { pdfId: file.id });
      toast.success('تم حذف الملف بنجاح');
      await loadPatientFiles(activePatientForFiles.id);
    } catch (err) {
      toast.error(`فشل حذف الملف: ${err}`);
    }
  };

  // ─── PDF Viewer ──────────────────────────────────
  const handleViewPdf = async (file) => {
    setPdfLoading(true);
    setPdfViewerName(file.file_name);
    try {
      const data = await invoke('get_patient_pdf_data', { pdfId: file.id });
      if (data) {
        setPdfViewerData(data);
        setShowPdfModal(true);
      } else {
        toast.warning('لا توجد بيانات PDF محفوظة. يرجى إعادة رفع الملف.');
      }
    } catch (err) {
      toast.error(`فشل تحميل الملف: ${err}`);
    } finally {
      setPdfLoading(false);
    }
  };

  // ─── Bulk Import (Medicines only) ─────────────────
  const handleOpenBulk = () => {
    setBulkText(''); setBulkUnit(''); setShowBulkModal(true);
  };

  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') {
      try {
        const XLSX = await import('xlsx');
        const ab = await file.arrayBuffer();
        const wb = XLSX.read(ab, { type: 'array' });
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
        const names = [];
        for (const row of rows) {
          if (!row || row.length === 0) continue;
          let nameVal = '';
          for (let i = 0; i < row.length; i++) {
            const cell = (row[i] || '').toString().trim();
            if (cell && isNaN(Number(cell))) { nameVal = cell; break; }
            else if (cell && !nameVal) nameVal = cell;
          }
          if (nameVal) names.push(nameVal);
        }
        setBulkText(names.join('\n'));
        toast.success(`تم استيراد ${names.length} اسم من ملف Excel`);
      } catch { toast.error('فشل قراءة ملف Excel'); }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const lines = event.target.result.split('\n').map(line => {
          const parts = line.split(',');
          let nameVal = '';
          for (let i = 0; i < parts.length; i++) {
            const cell = (parts[i] || '').trim();
            if (cell && isNaN(Number(cell))) { nameVal = cell; break; }
            else if (cell && !nameVal) nameVal = cell;
          }
          return nameVal;
        }).filter(n => n.length > 0);
        setBulkText(lines.join('\n'));
        toast.success(`تم استيراد ${lines.length} اسم من الملف`);
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const bulkPreviewCount = bulkText.split('\n').map(n => n.trim()).filter(n => n.length > 0).length;

  const handleBulkSave = async () => {
    if (!bulkUnit.trim()) { toast.warning('يرجى إدخال الوحدة'); return; }
    if (!bulkText.trim()) { toast.warning('يرجى إدخال أسماء الأدوية'); return; }
    const names = bulkText.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    if (names.length === 0) { toast.warning('لم يتم العثور على أسماء صالحة'); return; }
    setBulkSaving(true);
    try {
      const result = await invoke('bulk_add_judicial_medicines', { names, unit: bulkUnit.trim() });
      const { added, skipped } = result;
      let msg = `تم إضافة ${added} دواء بنجاح.`;
      if (skipped > 0) msg += ` وتم تخطي ${skipped} لأنها موجودة مسبقاً.`;
      toast.success(msg);
      setShowBulkModal(false);
      fetchData();
    } catch (err) { toast.error(`فشل الإضافة الجماعية: ${err}`); }
    finally { setBulkSaving(false); }
  };

  // ─── Filtered Data ──────────────────────────────────
  const filteredPatients = patients.filter(p => !search || p.name?.includes(search) || p.diagnosis?.includes(search));
  const filteredMedicines = medicines.filter(m => !search || m.name?.includes(search));

  const patientColumns = [
    { header: '#', accessor: 'id' },
    { header: 'اسم المريض', accessor: 'name' },
    { header: 'التشخيص', accessor: 'diagnosis' },
    { header: 'تاريخ الحكم', accessor: 'court_ruling_date' },
    { header: 'تاريخ بدء العلاج', accessor: 'treatment_start_date' },
    { header: 'الملفات', render: (p) => (
      <Button 
        variant="ghost" 
        icon={FolderOpen} 
        onClick={(e) => { e.stopPropagation(); handleOpenFiles(p); }}
        style={{ fontSize: '12px', padding: '4px 8px', border: '1px solid var(--color-border)' }}
      >
        إدارة الملفات
      </Button>
    )},
  ];

  const medicineColumns = [
    { header: '#', accessor: 'id' },
    { header: 'اسم الدواء', accessor: 'name' },
    { header: 'الوحدة', accessor: 'unit' },
    { header: 'ملاحظات', accessor: 'description' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      <Breadcrumb items={[{ label: 'البيانات الأساسية' }, { label: 'إدارة أحكام المحكمة' }]} />
      
      <PageHeader 
        title="إدارة أحكام المحكمة" 
        icon={Scale} 
        description="تكويد المرضى الحاصلين على أحكام وأدويتهم القضائية وملفاتهم."
        actions={
          <div className="flex gap-2 flex-wrap">
            {activeTab === 'medicines' && (
              <Button variant="ghost" icon={Upload} onClick={handleOpenBulk}
                style={{ border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }}>
                إدخال جماعي
              </Button>
            )}
            <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
              {activeTab === 'patients' ? 'إضافة مريض' : 'إضافة دواء قضائي'}
            </Button>
          </div>
        }
      />

      {/* Hidden PDF Input */}
      <input ref={pdfInputRef} type="file" accept=".pdf" onChange={handlePdfFileSelected} style={{ display: 'none' }} />

      {/* Tabs */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        <button className={`neu-tab ${activeTab === 'patients' ? 'active' : ''}`} onClick={() => { setActiveTab('patients'); setSearch(''); }}>
          <Users size={18} />المرضى
        </button>
        <button className={`neu-tab ${activeTab === 'medicines' ? 'active' : ''}`} onClick={() => { setActiveTab('medicines'); setSearch(''); }}>
          <Pill size={18} />الأدوية القضائية
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1" style={{ minWidth: '200px' }}>
          <Input icon={Search} placeholder={activeTab === 'patients' ? 'بحث باسم المريض أو التشخيص...' : 'بحث باسم الدواء...'}
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Data Table */}
      <Card className="p-0 overflow-hidden">
        {activeTab === 'patients' && (
          <Table columns={patientColumns} data={filteredPatients} onEdit={handleOpenEdit} onDelete={handleDelete}
            emptyMessage="لا يوجد مرضى مسجلون. أضف مريض جديد." />
        )}
        {activeTab === 'medicines' && (
          <Table columns={medicineColumns} data={filteredMedicines} onEdit={handleOpenEdit} onDelete={handleDelete}
            emptyMessage="لا توجد أدوية قضائية. أضف أدوية جديدة أو استخدم الإدخال الجماعي." />
        )}
      </Card>

      {/* ─── Single Add/Edit Modal ──────────────────── */}
      <Modal 
        isOpen={showModal} onClose={() => setShowModal(false)} 
        title={editId ? `تعديل ${activeTab === 'patients' ? 'المريض' : 'الدواء'}` : `إضافة ${activeTab === 'patients' ? 'مريض جديد' : 'دواء قضائي جديد'}`}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="الاسم *" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required style={{ textAlign: 'right' }} />
          
          {activeTab === 'patients' && (
            <>
              <Input label="التشخيص" value={formData.diagnosis || ''} onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })} style={{ textAlign: 'right' }} />
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1" style={{ minWidth: '180px' }}>
                  <Input label="تاريخ حكم المحكمة *" type="date" value={formData.court_ruling_date || ''}
                    onChange={(e) => setFormData({ ...formData, court_ruling_date: e.target.value })} required />
                </div>
                <div className="flex-1" style={{ minWidth: '180px' }}>
                  <Input label="تاريخ بدء العلاج *" type="date" value={formData.treatment_start_date || ''}
                    onChange={(e) => setFormData({ ...formData, treatment_start_date: e.target.value })} required />
                </div>
              </div>
            </>
          )}

          {activeTab === 'medicines' && (
            <>
              <Input label="الوحدة *" value={formData.unit || ''} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} required style={{ textAlign: 'right' }} />
              <Input label="ملاحظات (اختياري)" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ textAlign: 'right' }} />
            </>
          )}

          <div className="flex gap-4 pt-4">
            <Button variant="primary" type="submit" loading={saving} className="flex-1">{editId ? 'تحديث' : 'إضافة'}</Button>
            <Button variant="ghost" type="button" onClick={() => setShowModal(false)} className="flex-1">إلغاء</Button>
          </div>
        </form>
      </Modal>

      {/* ─── Bulk Import Modal (Medicines) ─────────────── */}
      <Modal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} title="إدخال جماعي للأدوية القضائية" wide>
        <div className="space-y-4">
          <div className="p-3 rounded-xl text-sm" style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
            💡 الصق أسماء الأدوية (كل اسم في سطر) أو استورد من ملف. سيتم إضافة الكل بنفس الوحدة.
          </div>

          <Input label="الوحدة *" value={bulkUnit} onChange={(e) => setBulkUnit(e.target.value)} placeholder="مثال: أمبول، قرص..." style={{ textAlign: 'right' }} />

          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>أسماء الأدوية (كل اسم في سطر) *</label>
            <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder={"دواء 1\nدواء 2\nدواء 3\n..."} rows={6}
              className="neu-input w-full" style={{ resize: 'vertical', minHeight: '100px', maxHeight: '200px', textAlign: 'right', fontFamily: 'inherit' }} />
            {bulkText.trim() && <p className="text-xs mt-1 font-bold" style={{ color: 'var(--color-primary)' }}>سيتم إضافة {bulkPreviewCount} دواء</p>}
          </div>

          <div className="flex gap-2 flex-wrap">
            <input ref={fileInputRef} type="file" accept=".txt,.csv,.xlsx,.xls" onChange={handleFileImport} style={{ display: 'none' }} />
            <Button variant="ghost" type="button" icon={FileText} onClick={() => fileInputRef.current?.click()}
              style={{ border: '1px dashed var(--color-border)', fontSize: '13px' }}>استيراد من ملف (TXT / CSV / Excel)</Button>
            <Button variant="ghost" type="button" icon={Copy} onClick={async () => {
              try { const text = await navigator.clipboard.readText(); setBulkText(text); toast.success('تم اللصق من الحافظة'); }
              catch { toast.error('فشل القراءة من الحافظة'); }
            }} style={{ border: '1px dashed var(--color-border)', fontSize: '13px' }}>لصق من الحافظة</Button>
          </div>

          <div className="flex gap-4 pt-2" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
            <Button variant="primary" type="button" onClick={handleBulkSave} loading={bulkSaving} className="flex-1" icon={Upload}>
              إضافة {bulkPreviewCount > 0 ? `(${bulkPreviewCount})` : ''} دواء
            </Button>
            <Button variant="ghost" type="button" onClick={() => setShowBulkModal(false)} className="flex-1">إلغاء</Button>
          </div>
        </div>
      </Modal>

      {/* ─── Manage Files Modal ───────────────────────── */}
      <Modal isOpen={showFilesModal} onClose={() => setShowFilesModal(false)} title={`ملفات المريض: ${activePatientForFiles?.name || ''}`} wide>
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-[var(--color-bg)] p-4 rounded-xl border border-[var(--color-border)]">
            <div className="text-sm font-bold opacity-80">
              إجمالي الملفات المرفقة: {patientFiles.length}
            </div>
            <Button variant="primary" icon={Upload} onClick={() => pdfInputRef.current?.click()} loading={isUploading}>
              رفع ملف جديد
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
            {loadingFiles ? (
              <div className="p-8 text-center text-sm opacity-60">جارٍ التحميل...</div>
            ) : patientFiles.length === 0 ? (
              <div className="p-8 text-center text-sm opacity-60">لا توجد ملفات مرفقة لهذا المريض</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                  <tr>
                    <th className="px-4 py-3 text-right font-bold opacity-70">اسم الملف</th>
                    <th className="px-4 py-3 text-right font-bold opacity-70">تاريخ الرفع</th>
                    <th className="px-4 py-3 text-center font-bold opacity-70">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {patientFiles.map(file => (
                    <tr key={file.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg)] transition-colors">
                      <td className="px-4 py-3 font-medium align-middle" dir="ltr" style={{ textAlign: 'right' }}>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md ml-2">PDF</span>
                        {file.file_name}
                      </td>
                      <td className="px-4 py-3 opacity-80 align-middle" dir="ltr" style={{ textAlign: 'right' }}>{file.uploaded_at}</td>
                      <td className="px-4 py-3 text-center align-middle">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleViewPdf(file)} title="عرض الملف"
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => handleDeleteFile(file)} title="حذف الملف"
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowFilesModal(false)} className="w-full">إغلاق</Button>
          </div>
        </div>
      </Modal>

      {/* ─── PDF Viewer Modal (Nested) ────────────────── */}
      {showPdfModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="neu-modal w-full max-w-[95vw] lg:max-w-[90vw] h-[95vh] flex flex-col p-0 overflow-hidden animate-slideUp">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-bg)] shrink-0">
              <h3 className="text-lg sm:text-xl font-black tracking-tight" style={{ color: 'var(--color-primary)' }}>
                عرض PDF - {pdfViewerName}
              </h3>
              <button onClick={() => { setShowPdfModal(false); setPdfViewerData(null); }} className="p-2 rounded-xl transition-colors hover:bg-red-100 bg-red-50 text-red-600 border border-red-200">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <div className="flex-1 w-full relative bg-gray-50/50">
              {pdfLoading ? (
                <div className="absolute inset-0 flex items-center justify-center h-full" style={{ color: 'var(--color-text-muted)' }}>
                  <p>جارٍ تحميل الملف...</p>
                </div>
              ) : pdfViewerData ? (
                <iframe
                  src={`data:application/pdf;base64,${pdfViewerData}`}
                  className="absolute inset-0 w-full h-full border-none"
                  title="PDF Viewer"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center h-full" style={{ color: 'var(--color-text-muted)' }}>
                  <p>فشل تحميل الملف</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JudicialSetupPage;
