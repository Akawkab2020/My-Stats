import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import PageHeader from '../../../components/ui/PageHeader';
import Breadcrumb from '../../../components/ui/Breadcrumb';
import HierarchySelector from '../../../components/common/HierarchySelector';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { useToast } from '../../../components/ui/Toast';
import invoke from '../../../api/tauriApi';
import { 
  Syringe, Hash, Save, History, Tag, Layers, 
  Trash2, Edit2, Search, BarChart3, Package, CheckCircle2, DollarSign, Lock, Calendar, Info, AlertCircle
} from 'lucide-react';
import { useGlobalApp } from '../../../context/GlobalAppContext';
import { isMonthLocked } from '../../../utils/dateUtils';

const InsulinDispensingPage = () => {
  const toast = useToast();
  const location = useLocation();
  const { isMasterUnlocked } = useGlobalApp();
  
  const [hierarchy, setHierarchy] = useState({
    branchId: location.state?.branchId || '',
    areaId: location.state?.areaId || '',
    clinicId: location.state?.clinicId || '',
    dispenseMonth: location.state?.dispenseMonth || new Date().toISOString().substring(0, 7)
  });

  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [codes, setCodes] = useState([]);
  const [filteredCodes, setFilteredCodes] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [subList, setSubList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  const [previousPrices, setPreviousPrices] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    quantity: '',
    casesCount: '',
    unitPrice: '',
    totalCost: '0.00'
  });

  // Form State
  const [formData, setFormData] = useState({
    categoryId: '',
    typeId: '',
    codeId: '',
    quantity: '',
    casesCount: '',
    unitPrice: '',
    totalCost: '0.00'
  });

  useEffect(() => {
    loadMetaData();
  }, []);

  useEffect(() => {
    let filtered = [...codes];
    // Filtering items is ONLY by type (Supported/Free) per user request
    if (formData.typeId) filtered = filtered.filter(c => c.type === formData.typeId);
    setFilteredCodes(filtered);
  }, [formData.typeId, codes]);

  // Handle previous prices fetch when codeId changes
  useEffect(() => {
    if (formData.codeId) {
      const selectedId = parseInt(formData.codeId);
      const insulinName = codes.find(c => c.id === selectedId)?.name;
      if (insulinName) {
        invoke('get_insulin_previous_prices', { name: insulinName })
          .then(data => {
            const unique = [...new Set(data.map(p => parseFloat(p).toFixed(2)))];
            setPreviousPrices(unique);
          })
          .catch(err => console.error('Failed to load insulin prices:', err));
      }
    } else {
      setPreviousPrices([]);
    }
  }, [formData.codeId, codes]);

  const loadMetaData = async () => {
    setLoading(true);
    try {
      const [cats, ts, cs] = await Promise.all([
        invoke('get_insulin_categories'),
        invoke('get_insulin_types'),
        invoke('get_insulin_codes')
      ]);
      setCategories(cats);
      setTypes(ts);
      setCodes(cs);
    } catch (err) {
      toast.error('خطأ في تحميل البيانات الأساسية');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!hierarchy.branchId || !hierarchy.dispenseMonth) return;
    setLoading(true);
    try {
      const data = await invoke('get_insulin_dispensed', {
        branchId: parseInt(hierarchy.branchId),
        areaId: hierarchy.areaId ? parseInt(hierarchy.areaId) : null,
        clinicId: hierarchy.clinicId ? parseInt(hierarchy.clinicId) : null,
        dispenseMonth: hierarchy.dispenseMonth
      });
      
      const mapped = (data || []).map(item => ({
        ...item,
        priceFormatted: parseFloat(item.price).toFixed(2),
        quantityFormatted: parseFloat(item.quantity).toFixed(2)
      }));
      setHistory(mapped);
    } catch (err) {
      toast.error('فشل في تحميل سجل الصرف');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [hierarchy.branchId, hierarchy.areaId, hierarchy.clinicId, hierarchy.dispenseMonth]);

  const handlePriceSelection = (p) => {
    const price = parseFloat(p);
    const qty = parseFloat(formData.quantity || 0);
    setFormData({ ...formData, unitPrice: p, totalCost: (price * qty).toFixed(2) });
  };

  const handleAddToSubList = (e) => {
    e.preventDefault();
    if (!formData.codeId || !formData.quantity || !formData.unitPrice || !formData.casesCount) {
      toast.warning('يرجى إكمال بيانات الصنف (بما في ذلك عدد الحالات)');
      return;
    }
    const selected = codes.find(c => c.id === parseInt(formData.codeId));
    if (!selected) return;

    const selectedCategory = categories.find(c => c.id === parseInt(formData.categoryId))?.name || '--';

    // Duplicate Check: same category, same item, same type, same price, same quantity
    const isDuplicate = subList.some(item => 
      item.codeId === formData.codeId && 
      item.categoryId === formData.categoryId && 
      item.branchId === hierarchy.branchId &&
      item.areaId === hierarchy.areaId &&
      item.clinicId === hierarchy.clinicId &&
      parseFloat(item.unitPrice).toFixed(2) === parseFloat(formData.unitPrice).toFixed(2) && 
      parseFloat(item.quantity).toFixed(2) === parseFloat(formData.quantity).toFixed(2)
    ) || history.some(item => 
      item.insulin_code_id === parseInt(formData.codeId) && 
      item.category === selectedCategory && 
      item.type_ === selected.type &&
      parseFloat(item.price).toFixed(2) === parseFloat(formData.unitPrice).toFixed(2) && 
      parseFloat(item.quantity).toFixed(2) === parseFloat(formData.quantity).toFixed(2)
    );

    if (isDuplicate) {
      toast.error('هذا الصنف مكرر بنفس البيانات في القائمة أو في السجلات المحفوظة مسبقاً لهذا الموقع والوقت.');
      return;
    }

    setSubList([...subList, { 
      ...formData, 
      id: Date.now(), 
      name: selected.name, 
      type: selected.type, 
      category: selectedCategory,
      unit: selected.unit,
      insulin_code_id: selected.id,
      branchId: hierarchy.branchId,
      areaId: hierarchy.areaId,
      clinicId: hierarchy.clinicId
    }]);
    
    // Clear only entry fields
    setFormData(prev => ({ ...prev, codeId: '', quantity: '', casesCount: '', unitPrice: '', totalCost: '0.00' }));
  };

  const handleSaveAll = async () => {
    if (subList.length === 0) return;
    setSavingAll(true);
    let successCount = 0;
    let skipCount = 0;
    let lastError = '';

    try {
      for (const item of subList) {
        try {
          const payload = {
            id: null,
            name: item.name,
            type_: item.type,
            unit: item.unit,
            cases_count: parseInt(item.casesCount),
            quantity: parseFloat(item.quantity),
            price: parseFloat(item.unitPrice),
            cost: parseFloat(item.totalCost),
            rate: 0, balance: 0,
            category: item.category,
            branch_id: parseInt(item.branchId),
            area_id: item.areaId ? parseInt(item.areaId) : null,
            clinic_id: item.clinicId ? parseInt(item.clinicId) : null,
            dispense_month: hierarchy.dispenseMonth,
            insulin_code_id: item.insulin_code_id
          };
          await invoke('save_insulin_dispensed', { data: payload });
          successCount++;
        } catch (err) {
          if (err?.toString().includes("مكرر")) {
            skipCount++;
          } else {
            lastError = err;
          }
        }
      }

      if (successCount > 0) {
        let msg = `تم حفظ ${successCount} سجلات بنجاح.`;
        if (skipCount > 0) msg += ` وتم تخطي ${skipCount} سجل مكرر سبق إدخاله بنفس البيانات.`;
        toast.success(msg);
        setSubList([]);
        setFormData({ ...formData, codeId: '', quantity: '', casesCount: '', unitPrice: '', totalCost: '0.00' });
      } else if (skipCount > 0) {
        toast.info(`تم تخطي ${skipCount} سجلات مكررة، لم يتم إضافة بيانات جديدة.`);
        setSubList([]);
      } else if (lastError) {
        toast.error(`فشل الحفظ: ${lastError}`);
      }
      loadHistory();
    } catch (err) {
      toast.error('خطأ غير متوقع في الحفظ');
    } finally {
      setSavingAll(false);
    }
  };

  const handleDeleteSubItem = (id) => setSubList(subList.filter(item => item.id !== id));

  const handleDeleteHistory = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
    try {
      await invoke('delete_insulin_dispensed', { id });
      toast.success('تم حذف السجل بنجاح');
      loadHistory();
    } catch (err) {
      toast.error(`فشل الحذف: ${err}`);
    }
  };

  const startEdit = (reg) => {
    setEditingId(reg.id);
    setEditFormData({
      quantity: reg.quantity,
      casesCount: reg.cases_count,
      unitPrice: reg.price,
      totalCost: parseFloat(reg.cost).toFixed(2)
    });
  };

  const handleUpdateEdit = async (id, reg) => {
    try {
      const payload = {
        id,
        name: reg.name,
        type_: reg.type_,
        unit: reg.unit,
        cases_count: parseInt(editFormData.casesCount),
        quantity: parseFloat(editFormData.quantity),
        price: parseFloat(editFormData.unitPrice),
        cost: parseFloat(editFormData.totalCost),
        rate: reg.rate,
        balance: reg.balance,
        category: reg.category,
        branch_id: reg.branch_id,
        area_id: reg.area_id,
        clinic_id: reg.clinic_id,
        dispense_month: reg.dispense_month,
        insulin_code_id: reg.insulin_code_id
      };
      await invoke('save_insulin_dispensed', { data: payload });
      toast.success('تم تحديث السجل بنجاح');
      setEditingId(null);
      loadHistory();
    } catch (err) {
      toast.error(`فشل التحديث: ${err}`);
    }
  };

  const displayHistory = useMemo(() => {
    return history.filter(reg => {
      const matchesSearch = reg.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === '' || reg.category === filterCategory;
      const matchesType = filterType === '' || reg.type_ === filterType;
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [history, searchTerm, filterCategory, filterType]);

  const stats = useMemo(() => {
    const freeItems = history.filter(item => item.type_ === 'مجاني');
    const supportedItems = history.filter(item => item.type_ === 'مدعم');

    return {
      free: {
        cost: freeItems.reduce((sum, item) => sum + item.cost, 0),
        qty: freeItems.reduce((sum, item) => sum + item.quantity, 0),
        count: freeItems.length
      },
      supported: {
        cost: supportedItems.reduce((sum, item) => sum + item.cost, 0),
        qty: supportedItems.reduce((sum, item) => sum + item.quantity, 0),
        count: supportedItems.length
      },
      total: {
        cost: history.reduce((sum, item) => sum + item.cost, 0),
        qty: history.reduce((sum, item) => sum + item.quantity, 0),
        count: history.length
      }
    };
  }, [history]);

  return (
    <div className="space-y-6 animate-fadeIn p-2 md:p-6" dir="rtl">
      <Breadcrumb items={[{ label: 'العمليات' }, { label: 'صرف الإنسولين' }]} />
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <PageHeader 
          title="صرف الإنسولين" 
          icon={Syringe} 
          description="إدارة صرف الأنسولين بمستويات الفرع، المنطقة، والعيادة."
        />
        
        {/* Quick Stats Dashboard */}
        <div className="flex gap-3 overflow-x-auto pb-2">
           {/* Free Stats */}
           <Card className="flex flex-col gap-1 p-3 min-w-[150px] border-emerald-100 bg-emerald-50/20 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-emerald-500 rounded-lg text-white shadow-sm"><Tag size={14}/></div>
                <p className="text-[10px] text-emerald-700 font-black">أنسولين مجاني</p>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] text-slate-400 font-bold">الكمية</p>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200">{stats.free.qty.toLocaleString()}</p>
                </div>
                <div className="text-left">
                  <p className="text-[9px] text-slate-400 font-bold">التكلفة</p>
                  <p className="text-xs font-black text-emerald-600">{stats.free.cost.toLocaleString()} ج.م</p>
                </div>
              </div>
           </Card>

           {/* Supported Stats */}
           <Card className="flex flex-col gap-1 p-3 min-w-[150px] border-sky-100 bg-sky-50/20 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-sky-500 rounded-lg text-white shadow-sm"><Layers size={14}/></div>
                <p className="text-[10px] text-sky-700 font-black">أنسولين مدعم</p>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] text-slate-400 font-bold">الكمية</p>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200">{stats.supported.qty.toLocaleString()}</p>
                </div>
                <div className="text-left">
                  <p className="text-[9px] text-slate-400 font-bold">التكلفة</p>
                  <p className="text-xs font-black text-sky-600">{stats.supported.cost.toLocaleString()} ج.م</p>
                </div>
              </div>
           </Card>

           {/* Summary Total */}
           <Card className="flex items-center gap-4 p-3 min-w-[150px] border-slate-200 bg-slate-50/30 shadow-sm">
              <div className="p-2 bg-slate-800 rounded-xl text-white shadow-md"><BarChart3 size={18}/></div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold">إجمالي المنصرف</p>
                <p className="text-lg font-black text-slate-800 dark:text-slate-100">{stats.total.cost.toLocaleString()} <span className="text-[10px]">ج.م</span></p>
              </div>
           </Card>
        </div>
      </div>

      <HierarchySelector 
        onSelectionChange={(data) => setHierarchy({ ...hierarchy, ...data })}
        initialBranch={hierarchy.branchId}
        initialArea={hierarchy.areaId}
        initialClinic={hierarchy.clinicId}
        initialMonth={hierarchy.dispenseMonth}
      />

      {/* Main Structure: Vertical Stack for better readability */}
      <div className="space-y-6">
        {/* Entry Section */}
        <Card className="p-6 border-primary/10 shadow-xl shadow-primary/5">
          <div className="flex items-center gap-2 mb-6 text-primary border-b dark:border-slate-800 pb-4">
             <div className="p-2 bg-primary/10 rounded-xl"><Layers size={20}/></div>
             <h3 className="font-black text-lg">تسجيل صرف إنسولين جديد</h3>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Input Form */}
            <form onSubmit={handleAddToSubList} className="xl:col-span-5 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select 
                    label="الفئة (هيئة/طلاب)" icon={Layers}
                    options={categories.map(c => ({ value: c.id, label: c.name }))}
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value, codeId: '' })}
                  />
                  <Select 
                    label="النوع (مدعم/مجاني)" icon={Tag}
                    options={types.map(t => ({ value: t.name, label: t.name }))}
                    value={formData.typeId}
                    onChange={(e) => setFormData({ ...formData, typeId: e.target.value, codeId: '' })}
                  />
               </div>

               <Select 
                  label="صنف الإنسولين" 
                  options={filteredCodes.map(c => ({ value: c.id, label: c.name }))}
                  value={formData.codeId}
                  onChange={(e) => setFormData({ ...formData, codeId: e.target.value })}
                  required
               />

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Input 
                    label="الكمية" type="number" step="0.01" icon={Hash}
                    value={formData.quantity}
                    onChange={(e) => {
                       const q = e.target.value;
                       setFormData({ ...formData, quantity: q, totalCost: (parseFloat(q || 0) * parseFloat(formData.unitPrice || 0)).toFixed(2) });
                    }}
                    required
                  />
                  <Input 
                    label="عدد الحالات" type="number" icon={Hash}
                    value={formData.casesCount}
                    onChange={(e) => setFormData({ ...formData, casesCount: e.target.value })}
                    required
                  />
                  <div className="space-y-2">
                     <div className="flex items-center justify-between">
                        <label className="field-label mb-0"><DollarSign size={16}/><span>سعر الوحدة</span></label>
                        {previousPrices.length > 0 && (
                          <select 
                            className="text-[10px] font-bold text-primary bg-primary/5 border-none outline-none rounded px-1 cursor-pointer"
                            onChange={(e) => handlePriceSelection(e.target.value)}
                            value=""
                          >
                            <option value="" disabled>أسعار سابقة...</option>
                            {previousPrices.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        )}
                     </div>
                     <Input 
                       type="number" step="0.01"
                       value={formData.unitPrice}
                       onChange={(e) => {
                          const p = e.target.value;
                          setFormData({ ...formData, unitPrice: p, totalCost: (parseFloat(formData.quantity || 0) * parseFloat(p || 0)).toFixed(2) });
                       }}
                       required
                       inputClassName="py-3"
                     />
                  </div>
               </div>

               <div className="p-4 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">الإجمالي المتوقع:</span>
                  <span className="font-black text-cyan-700 dark:text-cyan-300">{formData.totalCost} ج.م</span>
               </div>

               <Button variant="primary" type="submit" className="w-full flex items-center justify-center gap-2 py-4">
                  <Layers size={18}/><span>إضافة للقائمة المؤقتة</span>
               </Button>
            </form>

            {/* Sub-list (Temporary) */}
            <div className="xl:col-span-7 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl p-4 border border-dashed border-slate-200 dark:border-slate-800 flex flex-col min-h-[300px]">
               <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <Package size={18} className="text-amber-500"/>
                    <h4 className="font-black text-slate-700 dark:text-slate-200">القائمة المؤقتة</h4>
                    <span className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {subList.length} أصناف
                    </span>
                  </div>
                  {subList.length > 0 && (
                    <button onClick={() => setSubList([])} className="text-[10px] text-red-500 font-bold hover:underline">مسح الكل</button>
                  )}
               </div>

               {subList.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-60">
                    <History size={48} className="mb-4 text-slate-200 dark:text-slate-700"/>
                    <p className="text-sm font-bold">القائمة فارغة، ابدأ بإضافة أصناف</p>
                 </div>
               ) : (
                 <div className="flex flex-col h-full">
                    <div className="space-y-2 max-h-[350px] overflow-y-auto mb-4 custom-scrollbar flex-1">
                       {subList.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 group shadow-sm hover:shadow-md transition-all">
                             <div className="flex flex-col">
                                <span className="font-black text-sm text-slate-700 dark:text-slate-200">{item.name}</span>
                                <div className="flex items-center gap-2 text-[10px] mt-1 font-bold">
                                   <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 rounded">{item.type}</span>
                                   <span className="text-slate-400">الكمية: {item.quantity} | السعر: {item.unitPrice}</span>
                                </div>
                             </div>
                             <div className="flex items-center gap-3">
                                <span className="font-black text-primary text-xs">{item.totalCost}</span>
                                <button onClick={() => handleDeleteSubItem(item.id)} className="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button>
                             </div>
                          </div>
                       ))}
                    </div>
                    <Button onClick={handleSaveAll} loading={savingAll} className="w-full mt-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 dark:shadow-none">
                       <CheckCircle2 size={20}/><span>تأكيد وحفظ الكل في السجلات</span>
                    </Button>
                 </div>
               )}
            </div>
          </div>
        </Card>

        {/* History / Records Section */}
        <Card className="p-0 overflow-hidden border-slate-200 flex flex-col bg-[var(--color-bg-card)]">
          <div className="p-4 bg-slate-50/50 dark:bg-slate-900/20 border-b dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="flex items-center gap-2 font-black text-slate-700 dark:text-slate-200">
                <History size={18} className="text-primary"/>
                <span>سجلات الصرف المحفوظة</span>
             </div>
             
             <div className="flex items-center gap-2">
                <select 
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold bg-[var(--color-bg-card)] text-[var(--color-text)] outline-none"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                   <option value="">الفئة: الكل</option>
                   {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <select 
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold bg-[var(--color-bg-card)] text-[var(--color-text)] outline-none"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                   <option value="">النوع: الكل</option>
                   {types.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
                <div className="relative">
                   <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                   <input 
                     type="text" placeholder="بحث..."
                     className="p-2 pr-9 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold outline-none w-40 bg-[var(--color-bg-card)]"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                   />
                </div>
             </div>
          </div>

          <div className="overflow-x-auto">
             <table className="w-full text-right">
                <thead className="bg-slate-50/30 dark:bg-slate-900/10 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b dark:border-slate-800">
                   <tr>
                      <th className="p-4">الصنف</th>
                      <th className="p-4 text-center">الكمية</th>
                      <th className="p-4 text-center">الحالات</th>
                      <th className="p-4 text-center">السعر</th>
                      <th className="p-4 text-center">التكلفة</th>
                      <th className="p-4 text-center">الإجراءات</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                   {displayHistory.map(reg => {
                      const isLocked = isMonthLocked(reg.dispense_month) && !isMasterUnlocked;
                      const isEditing = editingId === reg.id;

                      return (
                      <tr key={reg.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors ${isLocked ? 'opacity-70' : ''} ${isEditing ? 'bg-primary/5' : ''}`}>
                         <td className="p-4">
                            <div className="flex items-center gap-2">
                               {isLocked && <Lock size={12} className="text-amber-500"/>}
                               <p className="font-bold text-[var(--color-text)]">{reg.name}</p>
                            </div>
                            <div className="flex flex-col gap-1 mt-1">
                               <p className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-md w-fit font-black">
                                  {reg.type_}
                               </p>
                               <p className="text-[9px] text-slate-400 font-bold opacity-70">
                                  {reg.category}
                               </p>
                            </div>
                         </td>
                         <td className="p-4 text-center">
                            {isEditing ? (
                               <input 
                                 type="number" step="0.01"
                                 className="w-20 p-1 border rounded text-xs text-center font-bold dark:bg-slate-800 dark:border-slate-700"
                                 value={editFormData.quantity}
                                 onChange={(e) => {
                                    const q = e.target.value;
                                    setEditFormData({ ...editFormData, quantity: q, totalCost: (parseFloat(q || 0) * parseFloat(editFormData.unitPrice || 0)).toFixed(2) });
                                 }}
                               />
                            ) : (
                               <span className="font-black text-slate-600 dark:text-slate-300">{reg.quantity} {reg.unit}</span>
                            )}
                         </td>
                         <td className="p-4 text-center">
                            {isEditing ? (
                               <input 
                                 type="number"
                                 className="w-16 p-1 border rounded text-xs text-center font-bold dark:bg-slate-800 dark:border-slate-700"
                                 value={editFormData.casesCount}
                                 onChange={(e) => setEditFormData({ ...editFormData, casesCount: e.target.value })}
                               />
                            ) : (
                               <span className="font-bold text-slate-600 dark:text-slate-300">{reg.cases_count}</span>
                            )}
                         </td>
                         <td className="p-4 text-center">
                            {isEditing ? (
                               <input 
                                 type="number" step="0.01"
                                 className="w-20 p-1 border rounded text-xs text-center font-bold dark:bg-slate-800 dark:border-slate-700"
                                 value={editFormData.unitPrice}
                                 onChange={(e) => {
                                    const p = e.target.value;
                                    setEditFormData({ ...editFormData, unitPrice: p, totalCost: (parseFloat(editFormData.quantity || 0) * parseFloat(p || 0)).toFixed(2) });
                                 }}
                               />
                            ) : (
                               <span className="font-bold text-slate-500 dark:text-slate-400">{parseFloat(reg.price || 0).toFixed(2)}</span>
                            )}
                         </td>
                         <td className="p-4 text-center font-black text-emerald-600">
                            {isEditing ? editFormData.totalCost : parseFloat(reg.cost || 0).toFixed(2)}
                         </td>
                         <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                               {isEditing ? (
                                  <>
                                     <button 
                                       onClick={() => handleUpdateEdit(reg.id, reg)}
                                       className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all shadow-sm"
                                     >
                                        <Save size={14}/>
                                     </button>
                                     <button 
                                       onClick={() => setEditingId(null)}
                                       className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-all shadow-sm"
                                     >
                                        <Hash size={14}/>
                                     </button>
                                  </>
                               ) : (
                                  <>
                                     <button 
                                       disabled={isLocked}
                                       onClick={() => startEdit(reg)} 
                                       className={`p-2 rounded-lg transition-all ${isLocked ? 'text-slate-200 cursor-not-allowed' : 'text-primary hover:bg-primary/5'}`}
                                     >
                                        <Edit2 size={16}/>
                                     </button>
                                     <button 
                                       disabled={isLocked}
                                       onClick={() => handleDeleteHistory(reg.id)} 
                                       className={`p-2 rounded-lg transition-all ${isLocked ? 'text-slate-200 cursor-not-allowed' : 'text-red-400 hover:bg-red-50 hover:text-red-600'}`}
                                     >
                                        <Trash2 size={16}/>
                                     </button>
                                  </>
                               )}
                            </div>
                         </td>
                      </tr>
                      );
                   })}
                </tbody>
             </table>
             {displayHistory.length === 0 && (
               <div className="p-12 text-center">
                  <div className="mb-2 text-slate-300 dark:text-slate-700 flex justify-center"><History size={48}/></div>
                  <p className="text-slate-400 dark:text-slate-500 font-bold text-sm italic">لا توجد سجلات مطابقة للبحث.</p>
               </div>
             )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InsulinDispensingPage;
