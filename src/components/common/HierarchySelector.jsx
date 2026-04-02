import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Hospital, Calendar, Layers, Lock } from 'lucide-react';
import invoke from '../../api/tauriApi';
import { useGlobalApp } from '../../context/GlobalAppContext';

const HierarchySelector = ({ 
  onSelectionChange, 
  initialBranch = '', 
  initialArea = '', 
  initialClinic = '', 
  initialMonth = '' 
}) => {
  const { workspaceMode, setWorkspaceMode, lockedLevel, setLockedLevel } = useGlobalApp();
  
  const [branches, setBranches] = useState([]);
  const [areas, setAreas] = useState([]);
  const [clinics, setClinics] = useState([]);
  
  const [selectedBranch, setSelectedBranch] = useState(initialBranch);
  const [selectedArea, setSelectedArea] = useState(initialArea);
  const [selectedClinic, setSelectedClinic] = useState(initialClinic);
  
  const [dispenseMonth, setDispenseMonth] = useState(() => {
    if (initialMonth) return initialMonth;
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Sync with initial props if they change (e.g. on navigation)
  useEffect(() => {
    if (initialBranch) setSelectedBranch(initialBranch);
    if (initialArea) setSelectedArea(initialArea);
    if (initialClinic) setSelectedClinic(initialClinic);
    if (initialMonth) setDispenseMonth(initialMonth);
  }, [initialBranch, initialArea, initialClinic, initialMonth]);

  // Fetch Month Isolation Lock
  useEffect(() => {
    const fetchLock = async () => {
      if (!selectedBranch || !dispenseMonth) {
        setLockedLevel(null);
        return;
      }
      try {
        const level = await invoke('get_month_isolation_rule', {
          branchId: parseInt(selectedBranch),
          dispenseMonth: dispenseMonth
        });
        setLockedLevel(level);
        
        // If locked, force workspace mode
        if (level) {
          const mode = level === 'branch' ? 'branches' : level === 'area' ? 'areas' : 'clinics';
          if (workspaceMode !== mode) {
            setWorkspaceMode(mode);
          }
        }
      } catch (err) {
        console.error('Failed to fetch isolation rule:', err);
      }
    };
    fetchLock();
  }, [selectedBranch, dispenseMonth]);

  // Clear sub-levels when mode changes to prevent data overlap
  useEffect(() => {
    if (workspaceMode === 'branches') {
      setSelectedArea('');
      setSelectedClinic('');
    } else if (workspaceMode === 'areas') {
      setSelectedClinic('');
    }
  }, [workspaceMode]);

  useEffect(() => {
    invoke('get_branches').then(data => setBranches(data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      invoke('get_areas', { branchId: parseInt(selectedBranch) })
        .then(data => { 
          setAreas(data); 
          setSelectedArea(prev => {
            if (prev && data.some(a => a.id.toString() === prev.toString())) return prev;
            setSelectedClinic('');
            setClinics([]);
            return '';
          });
        })
        .catch(console.error);
    } else {
      setAreas([]); setSelectedArea(''); setClinics([]); setSelectedClinic('');
    }
  }, [selectedBranch]);

  useEffect(() => {
    if (selectedArea) {
      invoke('get_clinics', { areaId: parseInt(selectedArea) })
        .then(data => { 
          setClinics(data); 
          setSelectedClinic(prev => {
            if (prev && data.some(c => c.id.toString() === prev.toString())) return prev;
            return '';
          });
        })
        .catch(console.error);
    } else {
      setClinics([]); setSelectedClinic('');
    }
  }, [selectedArea]);

  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange({
        level: workspaceMode === 'branches' ? 'branch' : workspaceMode === 'areas' ? 'area' : 'clinic',
        branchId: selectedBranch ? parseInt(selectedBranch) : null,
        areaId: selectedArea ? parseInt(selectedArea) : null,
        clinicId: selectedClinic ? parseInt(selectedClinic) : null,
        dispenseMonth,
      });
    }
  }, [workspaceMode, selectedBranch, selectedArea, selectedClinic, dispenseMonth]);

  return (
    <div className="neu-card p-6 md:p-8" dir="rtl">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 rounded-full bg-[var(--color-primary)]" />
          <div>
            <h2 className="text-xl font-black text-[var(--color-text)]">نطاق العمل الحالي</h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-widest leading-none">
                وضع العرض: {
                  workspaceMode === 'branches' ? 'تجميعي فروع' : 
                  workspaceMode === 'areas' ? 'تجميعي مناطق' : 'تفصيلي عيادات'
                }
              </p>
              {lockedLevel && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 animate-in fade-in zoom-in duration-300">
                  <Lock size={10} />
                  <span className="text-[9px] font-black uppercase">مستوى مؤمن</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Month Selector - Always visible */}
        <div className="flex items-center gap-3 p-2 px-4 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] shadow-sm">
           <Calendar size={18} className="text-[var(--color-primary-light)]" />
           <input
            type="month"
            value={dispenseMonth}
            onChange={(e) => setDispenseMonth(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-black text-[var(--color-text)] cursor-pointer"
          />
        </div>
      </div>

      <div className="w-full h-[1px] bg-[var(--color-border)] mb-8 opacity-50"></div>

      {/* Selectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Branch - Always visible */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-black text-[var(--color-text-muted)] uppercase tracking-tighter">
            <Building2 size={14} />
            <span>الفرع الرئيسي</span>
          </label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="neu-select py-3.5 font-bold"
          >
            <option value="">-- اختر الفرع --</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        {/* Area - Visible in Area or Clinic mode */}
        {(workspaceMode === 'areas' || workspaceMode === 'clinics') && (
          <div className="space-y-2 animate-fadeIn">
            <label className="flex items-center gap-2 text-xs font-black text-[var(--color-text-muted)] uppercase tracking-tighter">
              <MapPin size={14} />
              <span>المنطقة الإحصائية</span>
            </label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="neu-select py-3.5 font-bold"
              disabled={!selectedBranch}
            >
              <option value="">-- اختر المنطقة --</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        )}

        {/* Clinic - Only in Clinic mode */}
        {workspaceMode === 'clinics' && (
          <div className="space-y-2 animate-fadeIn">
            <label className="flex items-center gap-2 text-xs font-black text-[var(--color-text-muted)] uppercase tracking-tighter">
              <Hospital size={14} />
              <span>العيادة / الوحدة</span>
            </label>
            <select
              value={selectedClinic}
              onChange={(e) => setSelectedClinic(e.target.value)}
              className="neu-select py-3.5 font-bold"
              disabled={!selectedArea}
            >
              <option value="">-- اختر العيادة --</option>
              {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default HierarchySelector;