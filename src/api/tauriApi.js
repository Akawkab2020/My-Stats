// Tauri API helper
// In desktop mode, uses Tauri invoke; in web mode, uses mock data

const isTauri = () => {
  return window.__TAURI_INTERNALS__ !== undefined;
};

export async function invoke(cmd, args = {}) {
  if (isTauri()) {
    const { invoke: tauriInvoke } = await import("@tauri-apps/api/core");
    return tauriInvoke(cmd, args);
  }
  // Mock data for web development
  console.warn(`[Tauri Mock] Calling command: ${cmd}`, args);
  return mockData(cmd, args);
}

let mockBranches = [
  { id: 1, name: "الفرع الرئيسي" },
  { id: 2, name: "الفرع الشمالي" },
  { id: 3, name: "الفرع الجنوبي" },
];
let mockAreas = [
  { id: 1, name: "المنطقة الأولى", branch_id: 1 },
  { id: 2, name: "المنطقة الثانية", branch_id: 1 },
  { id: 3, name: "المنطقة الثالثة", branch_id: 2 },
];
let mockClinics = [
  { id: 1, name: "عيادة الباطنية", area_id: 1 },
  { id: 2, name: "عيادة الأطفال", area_id: 1 },
  { id: 3, name: "عيادة الأسنان", area_id: 2 },
];

let mockDrugUnits = [
  { id: 1, name: "شريط" },
  { id: 2, name: "علبة" },
  { id: 3, name: "أمبول" },
  { id: 4, name: "فيال" },
];

let mockDrugCategories = [
  { id: 1, name: "مضادات حيوية" },
  { id: 2, name: "مسكنات" },
  { id: 3, name: "أدوية القلب" },
  { id: 4, name: "أدوية السكري" },
];

let mockDrugs = [
  {
    id: 1,
    name: "بانادول",
    scientific_name: "Paracetamol",
    category_id: 2,
    unit: "شريط",
  },
  {
    id: 2,
    name: "أوجمنتين",
    scientific_name: "Amoxicillin",
    category_id: 1,
    unit: "علبة",
  },
];

let mockInsulinUnits = [
  { id: 1, name: "وحدة" },
  { id: 2, name: "مل" },
];

let mockInsulinCategories = [
  { id: 1, name: "إنسولين مائي" },
  { id: 2, name: "إنسولين معكر" },
  { id: 3, name: "إنسولين مختلط" },
];

let mockInsulinTypes = [
  { id: 1, name: "حقن" },
  { id: 2, name: "قلم" },
];

let mockInsulinCodes = [
  {
    id: 1,
    code: 101,
    name: "إنسولين هيمولين ر",
    unit: "وحدة",
    type: "حقن",
    category: "إنسولين مائي",
  },
  {
    id: 2,
    code: 102,
    name: "إنسولين لانتوس",
    unit: "مل",
    type: "قلم",
    category: "إنسولين معكر",
  },
];

let mockSupplyCategories = [
  { id: 1, name: "خيوط جراحية" },
  { id: 2, name: "سرنجات وغيارات" },
];

let mockSupplies = [
  { id: 1, name: "خيط حرير 3/0", category_id: 1, unit: "بكرة" },
  { id: 2, name: "سرنجة 3 سم", category_id: 2, unit: "قطعة" },
];

let mockJudicialPatients = [
  {
    id: 1,
    name: "أحمد محمد علي",
    diagnosis: "فشل كلوي",
    court_ruling_date: "2024-01-01",
    clinic_id: 1,
    area_id: 1,
  },
];

let mockJudicialMedicines = [{ id: 1, name: "دواء قضائي 1", unit: "أمبول" }];

let mockDrugGroups = [
  { id: 1, name: "مجموعة أ" },
  { id: 2, name: "مجموعة ب" },
  { id: 3, name: "مجموعة ج" },
];

let nextId = 1000;

function mockData(cmd, args) {
  // Support both camelCase and snake_case for parameters in mock data
  const branch_id = args.branch_id || args.branchId;
  const area_id = args.area_id || args.areaId;

  switch (cmd) {
    case "get_branches":
      return mockBranches;
    case "get_areas":
      return mockAreas.filter(a => a.branch_id === branch_id);
    case "get_clinics":
      return mockClinics.filter(c => c.area_id === area_id);

    // CRUD - Branches
    case "add_branch":
      { const b = { id: ++nextId, name: args.name }; mockBranches.push(b); return b; }
    case "update_branch":
      { const b = mockBranches.find(x => x.id === args.id); if (b) b.name = args.name; return { success: true }; }
    case "delete_branch":
      { mockBranches = mockBranches.filter(x => x.id !== args.id); return { success: true }; }

    // CRUD - Areas
    case "add_area":
      { const a = { id: ++nextId, name: args.name, branch_id: branch_id }; mockAreas.push(a); return a; }
    case "update_area":
      { const a = mockAreas.find(x => x.id === args.id); if (a) { a.name = args.name; a.branch_id = branch_id; } return { success: true }; }
    case "delete_area":
      { mockAreas = mockAreas.filter(x => x.id !== args.id); return { success: true }; }

    // CRUD - Clinics
    case "add_clinic":
      { const c = { id: ++nextId, name: args.name, area_id: area_id }; mockClinics.push(c); return c; }
    case "update_clinic":
      { const c = mockClinics.find(x => x.id === args.id); if (c) { c.name = args.name; c.area_id = area_id; } return { success: true }; }
    case "delete_clinic":
      { mockClinics = mockClinics.filter(x => x.id !== args.id); return { success: true }; }

    // Master Data - Drug Units
    case "get_drug_units":
      return mockDrugUnits;
    case "add_drug_unit":
      { 
        if (mockDrugUnits.some(u => u.name === args.name)) return Promise.reject("هذه الوحدة موجودة بالفعل");
        const u = { id: ++nextId, name: args.name }; mockDrugUnits.push(u); return u; 
      }
    case "update_drug_unit":
      { 
        if (mockDrugUnits.some(u => u.name === args.name && u.id !== args.id)) return Promise.reject("هذه الوحدة موجودة بالفعل");
        const u = mockDrugUnits.find(x => x.id === args.id); if (u) u.name = args.name; return { success: true }; 
      }
    case "delete_drug_unit":
      { mockDrugUnits = mockDrugUnits.filter(x => x.id !== args.id); return { success: true }; }
    case "bulk_add_drug_units":
      { 
        const names = args.names || []; let added = 0; let skipped = 0; 
        for (const n of names) { 
          if (n.trim()) { 
            if (mockDrugUnits.some(u => u.name === n.trim())) { skipped++; }
            else { mockDrugUnits.push({ id: ++nextId, name: n.trim() }); added++; }
          } 
        } 
        return { added, skipped }; 
      }

    // Master Data - Drug Categories
    case "get_drug_categories":
      return mockDrugCategories;
    case "add_drug_category":
      { 
        if (mockDrugCategories.some(c => c.name === args.name)) return Promise.reject("هذا التصنيف موجود بالفعل");
        const c = { id: ++nextId, name: args.name }; mockDrugCategories.push(c); return c; 
      }
    case "update_drug_category":
      { 
        if (mockDrugCategories.some(c => c.name === args.name && c.id !== args.id)) return Promise.reject("هذا التصنيف موجود بالفعل");
        const c = mockDrugCategories.find(x => x.id === args.id); if (c) c.name = args.name; return { success: true }; 
      }
    case "delete_drug_category":
      { mockDrugCategories = mockDrugCategories.filter(x => x.id !== args.id); return { success: true }; }
    case "bulk_add_drug_categories":
      { 
        const names = args.names || []; let added = 0; let skipped = 0; 
        for (const n of names) { 
          if (n.trim()) { 
            if (mockDrugCategories.some(c => c.name === n.trim())) { skipped++; }
            else { mockDrugCategories.push({ id: ++nextId, name: n.trim() }); added++; }
          } 
        } 
        return { added, skipped }; 
      }

    // Master Data - Drugs
    case "get_drugs":
      {
        let res = [...mockDrugs];
        const category_id = args.category_id || args.categoryId;
        if (category_id) res = res.filter(d => d.category_id === category_id);
        if (args.search) res = res.filter(d => d.name.includes(args.search) || d.scientific_name?.includes(args.search));
        return res;
      }
    case "add_drug":
      { 
        const category_id = args.categoryId || args.category_id;
        if (mockDrugs.some(d => d.name === args.name && (d.unit || '') === (args.unit || '') && d.category_id === category_id)) return Promise.reject("هذا الدواء موجود بالفعل بنفس الوحدة والتصنيف");
        const d = { id: ++nextId, name: args.name, scientific_name: args.scientificName || args.scientific_name, category_id, unit: args.unit }; 
        mockDrugs.push(d); 
        return d; 
      }
    case "update_drug":
      { 
        const category_id = args.categoryId || args.category_id;
        if (mockDrugs.some(d => d.name === args.name && (d.unit || '') === (args.unit || '') && d.category_id === category_id && d.id !== args.id)) return Promise.reject("هذا الدواء موجود بالفعل بنفس الوحدة والتصنيف");
        const idx = mockDrugs.findIndex(x => x.id === args.id); 
        if (idx !== -1) mockDrugs[idx] = { ...mockDrugs[idx], name: args.name, scientific_name: args.scientificName || args.scientific_name, category_id, unit: args.unit }; 
        return { success: true }; 
      }
    case "delete_drug":
      { mockDrugs = mockDrugs.filter(x => x.id !== args.id); return { success: true }; }
    case "bulk_add_drugs":
      { 
        const category_id = args.categoryId || args.category_id;
        const names = args.names || []; let added = 0; let skipped = 0; 
        for (const n of names) { 
          if (n.trim()) { 
            if (mockDrugs.some(d => d.name === n.trim() && (d.unit || '') === (args.unit || '') && d.category_id === category_id)) { skipped++; }
            else { mockDrugs.push({ id: ++nextId, name: n.trim(), category_id, unit: args.unit }); added++; }
          } 
        } 
        return { added, skipped }; 
      }

    // Master Data - Insulin
    // Master Data - Insulin Units
    case "get_insulin_units":
      return mockInsulinUnits;
    case "add_insulin_unit":
      { 
        if (mockInsulinUnits.some(u => u.name === args.name)) return Promise.reject("هذه الوحدة موجودة بالفعل");
        const u = { id: ++nextId, name: args.name }; mockInsulinUnits.push(u); return u; 
      }
    case "update_insulin_unit":
      { 
        if (mockInsulinUnits.some(u => u.name === args.name && u.id !== args.id)) return Promise.reject("هذه الوحدة موجودة بالفعل");
        const u = mockInsulinUnits.find(x => x.id === args.id); if (u) u.name = args.name; return { success: true }; 
      }
    case "delete_insulin_unit":
      { mockInsulinUnits = mockInsulinUnits.filter(x => x.id !== args.id); return { success: true }; }
    case "bulk_add_insulin_units":
      { 
        const names = args.names || []; let added = 0; let skipped = 0; 
        for (const n of names) { 
          if (n.trim()) { 
            if (mockInsulinUnits.some(u => u.name === n.trim())) { skipped++; }
            else { mockInsulinUnits.push({ id: ++nextId, name: n.trim() }); added++; }
          } 
        } 
        return { added, skipped }; 
      }

    case "get_insulin_categories":
      return mockInsulinCategories;
    case "add_insulin_category":
      { 
        if (mockInsulinCategories.some(c => c.name === args.name)) return Promise.reject("هذه الفئة موجودة بالفعل");
        const c = { id: ++nextId, name: args.name }; mockInsulinCategories.push(c); return c; 
      }
    case "update_insulin_category":
      { 
        if (mockInsulinCategories.some(c => c.name === args.name && c.id !== args.id)) return Promise.reject("هذه الفئة موجودة بالفعل");
        const c = mockInsulinCategories.find(x => x.id === args.id); if (c) c.name = args.name; return { success: true }; 
      }
    case "delete_insulin_category":
      { mockInsulinCategories = mockInsulinCategories.filter(x => x.id !== args.id); return { success: true }; }
    case "bulk_add_insulin_categories":
      { 
        const names = args.names || []; let added = 0; let skipped = 0; 
        for (const n of names) { 
          if (n.trim()) { 
            if (mockInsulinCategories.some(c => c.name === n.trim())) { skipped++; }
            else { mockInsulinCategories.push({ id: ++nextId, name: n.trim() }); added++; }
          } 
        } 
        return { added, skipped }; 
      }

    case "get_insulin_types":
      return mockInsulinTypes;
    case "add_insulin_type":
      { 
        if (mockInsulinTypes.some(t => t.name === args.name)) return Promise.reject("هذا النوع موجود بالفعل");
        const t = { id: ++nextId, name: args.name }; mockInsulinTypes.push(t); return t; 
      }
    case "update_insulin_type":
      { 
        if (mockInsulinTypes.some(t => t.name === args.name && t.id !== args.id)) return Promise.reject("هذا النوع موجود بالفعل");
        const t = mockInsulinTypes.find(x => x.id === args.id); if (t) t.name = args.name; return { success: true }; 
      }
    case "delete_insulin_type":
      { mockInsulinTypes = mockInsulinTypes.filter(x => x.id !== args.id); return { success: true }; }
    case "bulk_add_insulin_types":
      { 
        const names = args.names || []; let added = 0; let skipped = 0; 
        for (const n of names) { 
          if (n.trim()) { 
            if (mockInsulinTypes.some(t => t.name === n.trim())) { skipped++; }
            else { mockInsulinTypes.push({ id: ++nextId, name: n.trim() }); added++; }
          } 
        } 
        return { added, skipped }; 
      }

    case "get_insulin_codes":
      return mockInsulinCodes;
    case "get_insulin_dispensed":
      return [];
    case "add_insulin_code":
      { 
        const type_id = args.typeId || args.type_id;
        const unit_id = args.unitId || args.unit_id;
        if (mockInsulinCodes.some(i => i.name === args.name && i.type_id === type_id && i.unit_id === unit_id)) return Promise.reject("هذا الصنف موجود بالفعل بنفس النوع والوحدة");
        const i = { id: ++nextId, ...args, type_id, unit_id }; 
        mockInsulinCodes.push(i); 
        return i; 
      }
    case "update_insulin_code":
      { 
        const type_id = args.typeId || args.type_id;
        const unit_id = args.unitId || args.unit_id;
        if (mockInsulinCodes.some(i => i.name === args.name && i.type_id === type_id && i.unit_id === unit_id && i.id !== args.id)) return Promise.reject("هذا الصنف موجود بالفعل بنفس النوع والوحدة");
        const idx = mockInsulinCodes.findIndex(x => x.id === args.id); 
        if (idx !== -1) mockInsulinCodes[idx] = { ...mockInsulinCodes[idx], ...args, type_id, unit_id }; 
        return { success: true }; 
      }
    case "delete_insulin_code":
      { mockInsulinCodes = mockInsulinCodes.filter(x => x.id !== args.id); return { success: true }; }
    case "bulk_add_insulin_codes":
      { 
        const type_id = args.typeId || args.type_id;
        const unit_id = args.unitId || args.unit_id;
        const names = args.names || []; let added = 0; let skipped = 0; 
        for (const n of names) { 
          if (n.trim()) { 
            if (mockInsulinCodes.some(i => i.name === n.trim() && i.type_id === type_id && i.unit_id === unit_id)) { skipped++; }
            else { mockInsulinCodes.push({ id: ++nextId, name: n.trim(), type_id, unit_id }); added++; }
          } 
        } 
        return { added, skipped }; 
      }

    // Master Data - Supplies
    case "get_supply_categories":
      return mockSupplyCategories;
    case "add_supply_category":
      { const c = { id: ++nextId, name: args.name }; mockSupplyCategories.push(c); return c; }
    case "update_supply_category":
      { const c = mockSupplyCategories.find(x => x.id === args.id); if (c) c.name = args.name; return { success: true }; }
    case "delete_supply_category":
      { mockSupplyCategories = mockSupplyCategories.filter(x => x.id !== args.id); return { success: true }; }
    case "bulk_add_supply_categories":
      { 
        const names = args.names || []; let added = 0; let skipped = 0; 
        for (const n of names) { 
          if (n.trim()) { 
            if (mockSupplyCategories.some(c => c.name === n.trim())) { skipped++; }
            else { mockSupplyCategories.push({ id: ++nextId, name: n.trim() }); added++; }
          } 
        } 
        return { added, skipped }; 
      }

    case "get_supplies":
      return mockSupplies;
    case "add_supply":
      { const s = { id: ++nextId, ...args }; mockSupplies.push(s); return s; }
    case "update_supply":
      { const idx = mockSupplies.findIndex(x => x.id === args.id); if (idx !== -1) mockSupplies[idx] = { ...mockSupplies[idx], ...args }; return { success: true }; }
    case "delete_supply":
      { mockSupplies = mockSupplies.filter(x => x.id !== args.id); return { success: true }; }
    case "bulk_add_supplies":
      { 
        const categoryId = args.categoryId || args.category_id;
        const names = args.names || []; let added = 0; let skipped = 0; 
        for (const n of names) { 
          if (n.trim()) { 
            if (mockSupplies.some(s => s.name === n.trim() && s.category_id === categoryId)) { skipped++; }
            else { mockSupplies.push({ id: ++nextId, name: n.trim(), category_id: categoryId, unit: args.unit }); added++; }
          } 
        } 
        return { added, skipped }; 
      }

    // Master Data - Judicial
    case "get_judicial_patients":
      return mockJudicialPatients;
    case "add_judicial_patient":
      { const p = { id: ++nextId, ...args }; mockJudicialPatients.push(p); return p; }
    case "update_judicial_patient":
      { const idx = mockJudicialPatients.findIndex(x => x.id === args.id); if (idx !== -1) mockJudicialPatients[idx] = { ...mockJudicialPatients[idx], ...args }; return { success: true }; }
    case "delete_judicial_patient":
      { mockJudicialPatients = mockJudicialPatients.filter(x => x.id !== args.id); return { success: true }; }

    case "get_judicial_medicines":
      return mockJudicialMedicines;
    case "get_judicial_dispensed":
      return [];
    case "add_judicial_medicine":
      { const m = { id: ++nextId, ...args }; mockJudicialMedicines.push(m); return m; }
    case "update_judicial_medicine":
      { const idx = mockJudicialMedicines.findIndex(x => x.id === args.id); if (idx !== -1) mockJudicialMedicines[idx] = { ...mockJudicialMedicines[idx], ...args }; return { success: true }; }
    case "delete_judicial_medicine":
      { mockJudicialMedicines = mockJudicialMedicines.filter(x => x.id !== args.id); return { success: true }; }
    case "bulk_add_judicial_medicines":
      { 
        const names = args.names || []; let added = 0; let skipped = 0; 
        for (const n of names) { 
          if (n.trim()) { 
            if (mockJudicialMedicines.some(m => m.name === n.trim())) { skipped++; }
            else { mockJudicialMedicines.push({ id: ++nextId, name: n.trim(), unit: args.unit }); added++; }
          } 
        } 
        return { added, skipped }; 
      }
    case "save_patient_pdf":
      { 
        const p = mockJudicialPatients.find(x => x.id === (args.patientId || args.patient_id)); 
        if (p) p.pdf_path = args.pdfPath || args.pdf_path; 
        return { success: true }; 
      }
    case "get_patient_pdf":
      { 
        const p = mockJudicialPatients.find(x => x.id === (args.patientId || args.patient_id)); 
        return p?.pdf_path || null; 
      }

    // Save operations
    case "save_monthly_drugs_dispensed":
      return { success: true, id: ++nextId };
    case "get_monthly_drugs_dispensed":
      return null;
    case "save_detailed_drug_dispensed":
      return ++nextId;
    case "get_detailed_drug_dispensed":
      return [];
    case "update_detailed_drug_dispensed":
    case "delete_detailed_drug_dispensed":
      return { success: true };
    case "save_medical_tickets":
    case "get_drug_groups":
      return [];
    case "save_drug_group_cost":
    case "save_insulin_dispensed":
    case "save_drug_group":
    case "save_judicial_dispensed":
      return { success: true, id: ++nextId };

    default:
      console.warn(`[Tauri Mock] Command not found: ${cmd}`);
      return { success: true };
  }
}

export default invoke;
