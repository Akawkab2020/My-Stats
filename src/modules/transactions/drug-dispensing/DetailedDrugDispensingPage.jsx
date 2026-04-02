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
  ShoppingCart, Pill, DollarSign, Hash, Save, History, 
  Trash2, Edit2, Search, BarChart3, Package, CheckCircle2, Lock
} from 'lucide-react';
import { useGlobalApp } from '../../../context/GlobalAppContext';
import { isMonthLocked } from '../../../utils/dateUtils';

const DetailedDrugDispensingPage = () => {
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
  const [drugs, setDrugs] = useState([]);
  const [filteredDrugs, setFilteredDrugs] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [subList, setSubList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [previousPrices, setPreviousPrices] = useState([]);
  
  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Form State
  const [formData, setFormData] = useState({
    categoryId: '',
    drugId: '',
    quantity: '',
    casesCount: '',
    unitPrice: '',
    totalCost: 0
  });

  useEffect(() => {
    loadMetaData();
  }, []);

  useEffect(() => {
    if (hierarchy.branchId && hierarchy.dispenseMonth && drugs.length > 0) {
      loadHistory();
    }
  }, [hierarchy.branchId, hierarchy.areaId, hierarchy.clinicId, hierarchy.dispenseMonth, drugs]);

  useEffect(() => {
    if (formData.categoryId) {
      setFilteredDrugs(drugs.filter(d => d.category_id === parseInt(formData.categoryId)));
    } else {
      setFilteredDrugs([]);
    }
  }, [formData.categoryId, drugs]);

  useEffect(() => {
    const q = parseFloat(formData.quantity) || 0;
    const p = parseFloat(formData.unitPrice) || 0;
    setFormData(prev => ({ ...prev, totalCost: (q * p).toFixed(2) }));
  }, [formData.quantity, formData.unitPrice]);

  const loadMetaData = async () => {
    setLoading(true);
    try {
      const [cats, allDrugs] = await Promise.all([
        invoke('get_drug_categories'),
        invoke('get_drugs')
      ]);
      setCategories(cats);
      setDrugs(allDrugs);
    } catch (err) {
      toast.error('خطأ في تحميل البيانات الأساسية');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData.drugId) {
      invoke('get_drug_previous_prices', { drugId: parseInt(formData.drugId) })
        .then(data => {
          // Fuzzy grouping: round to 2 decimals and unique
          const uniquePrices = [...new Set(data.map(p => parseFloat(p).toFixed(2)))];
          setPreviousPrices(uniquePrices);
        })
        .catch(err => console.error('Failed to load prices:', err));
    } else {
      setPreviousPrices([]);
    }
  }, [formData.drugId]);

  const loadHistory = async () => {
    try {
      const records = await invoke('get_detailed_drug_dispensed', {
        branchId: parseInt(hierarchy.branchId),
        areaId: hierarchy.areaId ? parseInt(hierarchy.areaId) : null,
        clinicId: hierarchy.clinicId ? parseInt(hierarchy.clinicId) : null,
        dispenseMonth: hierarchy.dispenseMonth
      });
      
      const mappedHistory = records.map(reg => {
        const drug = drugs.find(d => d.id === reg.drug_id);
        const category = categories.find(c => c.id === drug?.category_id);
        return {
          ...reg,
          drugName: drug ? drug.name : 'صنف غير معروف',
          categoryName: category ? category.name : '--',
          categoryId: category ? category.id : null, // Add categoryId for filtering
          total_cost: reg.total_cost.toFixed(2)
        };
      });
      setHistory(mappedHistory);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  // --- Search Filtering ---
  const displayHistory = useMemo(() => {
    // Filtered History
    const filtered = history.filter(reg => {
      const matchesSearch = reg.drugName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === '' || reg.categoryId?.toString() === filterCategory.toString();
      return matchesSearch && matchesCategory;
    });
    return filtered;
  }, [history, searchTerm, filterCategory]);

  // --- Statistics for Dashboard ---
  const stats = useMemo(() => {
    const totalCost = history.reduce((sum, item) => sum + parseFloat(item.total_cost), 0);
    const distinctDrugs = new Set(history.map(item => item.drug_id)).size;
    const totalQty = history.reduce((sum, item) => sum + item.quantity, 0);
    return { totalCost, distinctDrugs, totalQty };
  }, [history]);

  const handleAddToSubList = (e) => {
    e.preventDefault();
    if (!hierarchy.branchId) {
      toast.warning('يرجى اختيار الفرع');
      return;
    }
    
    // Check local duplication in subList
    const isDuplicate = subList.some(item => 
      item.drugId === formData.drugId &&
      parseFloat(item.quantity) === parseFloat(formData.quantity) &&
      parseFloat(item.unitPrice) === parseFloat(formData.unitPrice)
    );

    if (isDuplicate) {
      toast.error('هذا الصنف موجود بالفعل بنفس الكمية والسعر في القائمة المؤقتة.');
      return;
    }

    const drugName = drugs.find(d => d.id === parseInt(formData.drugId))?.name;
    const categoryName = categories.find(c => c.id === parseInt(formData.categoryId))?.name;

    const newItem = {
      id: Date.now(),
      ...formData,
      drugName,
      categoryName
    };

    setSubList([...subList, newItem]);

    setFormData(prev => ({
      ...prev,
      drugId: '',
      quantity: '',
      casesCount: '',
      unitPrice: '',
      totalCost: 0
    }));
  };

  const handleSaveAll = async () => {
    if (subList.length === 0) return;
    setSavingAll(true);
    let errorCount = 0;
    let lastError = '';

    try {
      for (const item of subList) {
        try {
          const payload = {
            branchId: parseInt(hierarchy.branchId),
            areaId: hierarchy.areaId ? parseInt(hierarchy.areaId) : null,
            clinicId: hierarchy.clinicId ? parseInt(hierarchy.clinicId) : null,
            dispenseMonth: hierarchy.dispenseMonth,
            drugId: parseInt(item.drugId),
            quantity: parseFloat(item.quantity),
            casesCount: parseInt(item.casesCount),
            unitPrice: parseFloat(item.unitPrice),
            totalCost: parseFloat(item.totalCost)
          };
          await invoke('save_detailed_drug_dispensed', payload);
        } catch (err) {
          errorCount++;
          lastError = err;
        }
      }
      
      if (errorCount > 0) {
        if (errorCount === subList.length) {
          toast.error(`فشل الحفظ: ${lastError}`);
        } else {
          toast.warning(`تم حفظ البعض، وفشل ${errorCount} أصناف: ${lastError}`);
        }
      } else {
        toast.success('تم حفظ القائمة بالسجلات بنجاح!');
        setSubList([]);
        setFormData({ categoryId: '', drugId: '', quantity: '', casesCount: '', unitPrice: '', totalCost: '0.00' });
      }
      
      await loadHistory();
    } catch (err) {
      toast.error('حدث خطأ غير متوقع.');
    } finally {
      setSavingAll(false);
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
    try {
      await invoke('delete_detailed_drug_dispensed', { id });
      toast.success('تم حذف السجل');
      await loadHistory();
    } catch (err) {
      toast.error(`فشل الحذف: ${err}`);
    }
  };

  const startEdit = (record) => {
    setEditingId(record.id);
    setEditFormData({
      quantity: record.quantity,
      casesCount: record.cases_count,
      unitPrice: record.unit_price,
      totalCost: (record.quantity * record.unit_price).toFixed(2)
    });
  };

  const handleUpdateEdit = async (id) => {
    try {
      await invoke('update_detailed_drug_dispensed', {
        id,
        quantity: parseFloat(editFormData.quantity),
        casesCount: parseInt(editFormData.casesCount),
        unitPrice: parseFloat(editFormData.unitPrice),
        totalCost: parseFloat(editFormData.totalCost)
      });
      toast.success('تم التعديل بنجاح');
      setEditingId(null);
      await loadHistory();
    } catch (err) {
      toast.error(`فشل التعديل: ${err}`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumb items={[{ label: 'العمليات اليومية' }, { label: 'صرف الأدوية (تفصيلي)' }]} />
      
      <PageHeader 
        title="صرف الأدوية (تفصيلي)" 
        icon={ShoppingCart} 
        description="تسجيل منصرف الأدوية بالتفصيل لكل صنف على حدة."
      />

      <HierarchySelector 
        onSelectionChange={(data) => setHierarchy({ ...hierarchy, ...data })}
        initialBranch={hierarchy.branchId}
        initialArea={hierarchy.areaId}
        initialClinic={hierarchy.clinicId}
        initialMonth={hierarchy.dispenseMonth}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side: Interactive Dashboard */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-5 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] text-white border-none shadow-xl border-t-4 border-t-white/20">
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-60 mb-4 flex items-center gap-2">
              <BarChart3 size={16} /> لوحة الإحصائيات (المستوى المختار)
            </h3>
            <div className="space-y-6">
              <div>
                <p className="text-xs opacity-70 mb-1">إجمالي التكلفة</p>
                <h2 className="text-3xl font-black text-emerald-400">
                  {stats.totalCost.toLocaleString()} <span className="text-sm">ج.م</span>
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-[10px] opacity-60">عدد الأصناف</p>
                  <p className="text-xl font-bold flex items-center gap-2">
                    <Package size={16} className="text-indigo-400" /> {stats.distinctDrugs}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] opacity-60">إجمالي الكميات</p>
                  <p className="text-xl font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-cyan-400" /> {stats.totalQty}
                  </p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 border-dashed border-2 bg-slate-50/50">
             <p className="text-xs text-slate-500 leading-relaxed italic">
               💡 تلميح: يتم عزل السجلات حسب مستوى الاختيار العلوي. إذا أدخلت كفرع مجمع، لن تظهر السجلات في العيادات التفصيلية.
             </p>
          </Card>
        </div>

        {/* Center: Entry Form */}
        <div className="lg:col-span-3">
          <Card className="p-6 h-full">
            <form onSubmit={handleAddToSubList} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select 
                  label="تصنيف الدواء"
                  options={categories.map(c => ({ value: c.id, label: c.name }))}
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value, drugId: '' })}
                  required
                />
                <Select 
                  label="الدواء"
                  options={filteredDrugs.map(d => ({ value: d.id, label: d.name }))}
                  value={formData.drugId}
                  onChange={(e) => setFormData({ ...formData, drugId: e.target.value })}
                  disabled={!formData.categoryId}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input 
                  label="الكمية المنصرفة" 
                  type="number" step="0.01" icon={Hash}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
                 <Input 
                   label="عدد الحالات" 
                   type="number" icon={Hash}
                   value={formData.casesCount}
                   onChange={(e) => setFormData({ ...formData, casesCount: e.target.value })}
                   required
                 />
                 <div className="space-y-2">
                   <div className="flex items-center justify-between">
                     <label className="field-label mb-0">
                       <DollarSign size={16} />
                       <span>سعر الوحدة</span>
                     </label>
                     {previousPrices.length > 0 && (
                       <select 
                         className="text-[10px] font-bold text-primary bg-primary/5 border-none outline-none rounded px-1 cursor-pointer"
                         onChange={(e) => {
                           if (e.target.value) {
                             const p = parseFloat(e.target.value);
                             setFormData({ ...formData, unitPrice: p, totalCost: (parseFloat(formData.quantity || 0) * p).toFixed(2) });
                           }
                         }}
                         value=""
                       >
                         <option value="" disabled>أسعار سابقة...</option>
                         {previousPrices.map(price => <option key={price} value={price}>{price} ج.م</option>)}
                       </select>
                     )}
                   </div>
                   <Input 
                     type="number" step="0.01"
                     value={formData.unitPrice}
                     onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                     required
                     inputClassName="py-3"
                   />
                 </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-cyan-50 border border-cyan-100 shadow-inner">
                <span className="text-sm font-bold text-cyan-700">إجمالي التكلفة المتوقع:</span>
                <span className="text-2xl font-black text-cyan-900">{formData.totalCost} ج.م</span>
              </div>

              <Button variant="ghost" type="submit" icon={ShoppingCart} className="w-full py-4 text-lg border-2 border-dashed border-primary text-primary hover:bg-primary hover:text-white transition-all shadow-sm">
                إضافة للقائمة الفرعية
              </Button>
            </form>
          </Card>
        </div>

        {/* Sub List Card */}
        {subList.length > 0 && (
          <Card className="lg:col-span-4 p-6 border-2 border-primary/30 bg-primary/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                <ShoppingCart size={24} />
                القائمة الفرعية المؤقتة (بانتظار الحفظ)
              </h3>
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full font-bold text-sm">
                {subList.length} أصناف
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-3 font-bold text-slate-600">التصنيف</th>
                    <th className="p-3 font-bold text-slate-600">الدواء</th>
                    <th className="p-3 font-bold text-slate-600">الكمية</th>
                    <th className="p-3 font-bold text-slate-600">الحالات</th>
                    <th className="p-3 font-bold text-slate-600">التكلفة</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {subList.map(item => (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="p-3 text-sm text-slate-500">{item.categoryName}</td>
                      <td className="p-3 font-bold text-primary">{item.drugName}</td>
                      <td className="p-3 font-medium">{item.quantity}</td>
                      <td className="p-3 text-sm">{item.casesCount}</td>
                      <td className="p-3 font-bold text-emerald-600">{item.totalCost} ج.م</td>
                      <td className="p-3 text-left">
                        <button 
                          onClick={() => setSubList(subList.filter(s => s.id !== item.id))}
                          className="text-red-500 hover:text-white hover:bg-red-500 p-2 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button onClick={() => setSubList([])} variant="ghost" className="text-red-500 hover:bg-red-50">
                إلغاء الكل
              </Button>
              <Button onClick={handleSaveAll} loading={savingAll} variant="primary" icon={Save} className="px-10 py-3 text-lg font-bold shadow-lg shadow-primary/20">
                تأكيد الحفظ النهائي
              </Button>
            </div>
          </Card>
        )}

        {/* History Section */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-lg">
              <History size={22} className="text-primary" />
              <span>سجلات الصرف المحفوظة</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select 
                className="p-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-[var(--color-bg-card)] text-[var(--color-text)] font-bold"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">كل التصنيفات</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <div className="relative w-full md:w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="ابحث باسم الدواء..."
                  className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all bg-[var(--color-bg-card)] text-[var(--color-text)] font-bold"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Card className="p-0 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-[var(--color-bg)] text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                    <th className="p-4 text-sm font-bold">الدواء</th>
                    <th className="p-4 text-sm font-bold">الكمية</th>
                    <th className="p-4 text-sm font-bold">الحالات</th>
                    <th className="p-4 text-sm font-bold">سعر الوحدة</th>
                    <th className="p-4 text-sm font-bold">الإجمالي</th>
                    <th className="p-4 text-sm font-bold">تاريخ الإدخال</th>
                    <th className="p-4 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayHistory.map((reg) => {
                    const isRecordLocked = isMonthLocked(reg.dispense_month) && !isMasterUnlocked;
                    
                    return (
                    <tr key={reg.id} className={`hover:bg-slate-50/50 transition-colors ${isRecordLocked ? 'opacity-70 bg-slate-50/10' : ''}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                           {isRecordLocked && <Lock size={12} className="text-amber-500" title="هذا السجل مغلق مرور الزمن (4 أشهر)" />}
                           <p className="font-bold text-[var(--color-text)]">{reg.drugName}</p>
                        </div>
                        <p className="text-[10px] text-[var(--color-text-muted)]">{reg.categoryName}</p>
                      </td>
                      <td className="p-4 font-mono font-medium">
                        {editingId === reg.id ? (
                          <input 
                            type="number"
                            className="w-20 p-1 border rounded"
                            value={editFormData.quantity}
                            onChange={(e) => {
                              const q = parseFloat(e.target.value) || 0;
                              setEditFormData({...editFormData, quantity: e.target.value, totalCost: (q * editFormData.unitPrice).toFixed(2)});
                            }}
                          />
                        ) : reg.quantity}
                      </td>
                      <td className="p-4">
                        {editingId === reg.id ? (
                          <input 
                            type="number"
                            className="w-20 p-1 border rounded"
                            value={editFormData.casesCount}
                            onChange={(e) => setEditFormData({...editFormData, casesCount: e.target.value})}
                          />
                        ) : reg.cases_count}
                      </td>
                      <td className="p-4 text-sm text-slate-500">
                        {editingId === reg.id ? (
                          <input 
                            type="number"
                            className="w-20 p-1 border rounded"
                            value={editFormData.unitPrice}
                            onChange={(e) => {
                              const p = parseFloat(e.target.value) || 0;
                              setEditFormData({...editFormData, unitPrice: e.target.value, totalCost: (editFormData.quantity * p).toFixed(2)});
                            }}
                          />
                        ) : `${reg.unit_price} ج.م`}
                      </td>
                      <td className="p-4 font-bold text-primary">
                        {editingId === reg.id ? `${editFormData.totalCost} ج.م` : `${reg.total_cost} ج.م`}
                      </td>
                      <td className="p-4 text-[10px] text-slate-400">
                        {new Date(reg.created_at || Date.now()).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {editingId === reg.id ? (
                            <>
                              <button onClick={() => handleUpdateEdit(reg.id)} className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600">
                                <Save size={14} />
                              </button>
                              <button onClick={() => setEditingId(null)} className="bg-slate-200 text-slate-600 p-2 rounded-lg hover:bg-slate-300">
                                <Hash size={14} /> {/* Placeholder for cancel */}
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => startEdit(reg)} 
                                disabled={isRecordLocked}
                                className={`p-2 rounded-lg transition-all ${isRecordLocked ? 'text-slate-300 cursor-not-allowed' : 'text-primary hover:bg-primary/10'}`} 
                                title={isRecordLocked ? "السجل مغلق" : "تعديل"}
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteRecord(reg.id)} 
                                disabled={isRecordLocked}
                                className={`p-2 rounded-lg transition-all ${isRecordLocked ? 'text-slate-300 cursor-not-allowed' : 'text-red-500 hover:bg-red-50'}`} 
                                title={isRecordLocked ? "السجل مغلق" : "حذف"}
                              >
                                <Trash2 size={16} />
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
                <div className="p-12 text-center text-slate-400 text-sm italic">
                  لا توجد سجلات مطابقة لهذا الاختيار والبحث.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DetailedDrugDispensingPage;
