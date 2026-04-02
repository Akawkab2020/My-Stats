-- مخطط قاعدة البيانات المتكامل لتطبيق منصرف الأدوية
-- يضمن هذا الملف إنشاء كافة الجداول المطلوبة مع العلاقات الصحيحة

PRAGMA foreign_keys = ON;

-- 1. الأساسيات (الهيكل التنظيمي)
CREATE TABLE IF NOT EXISTS branches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS areas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    branch_id INTEGER NOT NULL,
    FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS clinics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    area_id INTEGER NOT NULL,
    FOREIGN KEY (area_id) REFERENCES areas (id) ON DELETE CASCADE
);

-- 2. تصنيفات ومنتجات
CREATE TABLE IF NOT EXISTS drug_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS drug_units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS drugs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    scientific_name TEXT,
    category_id INTEGER NOT NULL,
    unit TEXT,
    FOREIGN KEY (category_id) REFERENCES drug_categories (id) ON DELETE CASCADE
);

-- 3. المجموعات الدوائية
CREATE TABLE IF NOT EXISTS drug_group_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS drug_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cost REAL NOT NULL,
    clinic_id INTEGER NOT NULL,
    area_id INTEGER NOT NULL,
    dispense_month DATE NOT NULL,
    group_code_id INTEGER,
    FOREIGN KEY (clinic_id) REFERENCES clinics (id) ON DELETE CASCADE,
    FOREIGN KEY (area_id) REFERENCES areas (id) ON DELETE CASCADE,
    FOREIGN KEY (group_code_id) REFERENCES drug_group_codes (id) ON DELETE SET NULL
);

-- 4. الإنسولين
CREATE TABLE IF NOT EXISTS insulin_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS insulin_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS insulin_units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS insulin_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type_id INTEGER NOT NULL,
    unit_id INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (type_id) REFERENCES insulin_types (id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES insulin_units (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS insulin_dispensed (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    unit TEXT NOT NULL,
    cases_count INTEGER NOT NULL,
    quantity REAL NOT NULL,
    price REAL NOT NULL,
    cost REAL NOT NULL,
    rate REAL NOT NULL,
    balance REAL NOT NULL,
    category TEXT NOT NULL,
    clinic_id INTEGER NOT NULL,
    area_id INTEGER NOT NULL,
    dispense_month DATE NOT NULL,
    insulin_code_id INTEGER,
    FOREIGN KEY (clinic_id) REFERENCES clinics (id) ON DELETE CASCADE,
    FOREIGN KEY (area_id) REFERENCES areas (id) ON DELETE CASCADE,
    FOREIGN KEY (insulin_code_id) REFERENCES insulin_codes (id) ON DELETE SET NULL
);

-- 5. أحكام المحكمة
CREATE TABLE IF NOT EXISTS judicial_patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    diagnosis TEXT,
    court_ruling_date DATE NOT NULL,
    treatment_start_date DATE NOT NULL,
    clinic_id INTEGER,
    area_id INTEGER,
    pdf_path TEXT,
    pdf_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinic_id) REFERENCES clinics (id) ON DELETE CASCADE,
    FOREIGN KEY (area_id) REFERENCES areas (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS patient_pdfs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    pdf_data TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES judicial_patients (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS judicial_medicines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    unit TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS judicial_dispensed (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    diagnosis TEXT NOT NULL,
    medicine_name TEXT NOT NULL,
    unit TEXT NOT NULL,
    unit_price REAL NOT NULL,
    monthly_dose REAL NOT NULL,
    monthly_cost REAL NOT NULL,
    dispense_month TEXT NOT NULL,
    clinic_id INTEGER NOT NULL,
    area_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES judicial_patients (id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics (id) ON DELETE CASCADE,
    FOREIGN KEY (area_id) REFERENCES areas (id) ON DELETE CASCADE
);

-- 6. التذاكر الطبية
CREATE TABLE IF NOT EXISTS medical_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    period TEXT NOT NULL,
    tickets_56c INTEGER DEFAULT 0,
    tickets_56b INTEGER DEFAULT 0,
    is_supported_clinic BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dispense_month TEXT,
    FOREIGN KEY (clinic_id) REFERENCES clinics (id) ON DELETE CASCADE
);

-- 7a. المنصرف التفصيلي للأدوية
CREATE TABLE IF NOT EXISTS detailed_drug_dispensed (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER NOT NULL,
    area_id INTEGER, -- Allowed NULL for branch-level dispensing
    clinic_id INTEGER, -- Allowed NULL for area-level dispensing
    dispense_month TEXT NOT NULL,
    drug_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    cases_count INTEGER NOT NULL DEFAULT 0,
    unit_price REAL NOT NULL DEFAULT 0,
    total_cost REAL NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE CASCADE,
    FOREIGN KEY (area_id) REFERENCES areas (id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics (id) ON DELETE CASCADE,
    FOREIGN KEY (drug_id) REFERENCES drugs (id) ON DELETE CASCADE
);

-- 7b. المنصرف الشهري الإجمالي
CREATE TABLE IF NOT EXISTS monthly_drugs_dispensed (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_id INTEGER NOT NULL,
    area_id INTEGER NOT NULL,
    branch_id INTEGER NOT NULL,
    dispense_month TEXT NOT NULL,
    drugs_free_authority REAL DEFAULT 0,
    drugs_free_students REAL DEFAULT 0,
    drugs_free_infants REAL DEFAULT 0,
    drugs_free_breadwinner_women REAL DEFAULT 0,
    drugs_supported_authority_value REAL DEFAULT 0,
    drugs_supported_authority_patient_share REAL DEFAULT 0,
    drugs_supported_students_value REAL DEFAULT 0,
    drugs_supported_students_patient_share REAL DEFAULT 0,
    drugs_supported_infants_value REAL DEFAULT 0,
    drugs_supported_infants_patient_share REAL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinic_id) REFERENCES clinics (id) ON DELETE CASCADE,
    FOREIGN KEY (area_id) REFERENCES areas (id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE CASCADE
);

-- 8. المستلزمات الطبية
CREATE TABLE IF NOT EXISTS supply_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS supplies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    category_id INTEGER NOT NULL,
    unit TEXT,
    description TEXT,
    FOREIGN KEY (category_id) REFERENCES supply_categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS monthly_supplies_dispensed (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_id INTEGER NOT NULL,
    area_id INTEGER NOT NULL,
    branch_id INTEGER NOT NULL,
    supply_id INTEGER NOT NULL,
    consumer_value REAL DEFAULT 0,
    collective_entities_value REAL DEFAULT 0,
    dispense_month TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinic_id) REFERENCES clinics (id) ON DELETE CASCADE,
    FOREIGN KEY (area_id) REFERENCES areas (id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE CASCADE,
    FOREIGN KEY (supply_id) REFERENCES supplies (id) ON DELETE CASCADE
);

-- 9. بيانات افتراضية
INSERT OR IGNORE INTO branches (id, name) VALUES (1, 'الفرع الرئيسي');
INSERT OR IGNORE INTO drug_categories (id, name) VALUES (1, 'مضادات حيوية'), (2, 'مسكنات'), (3, 'أدوية القلب'), (4, 'أدوية السكري'), (5, 'أدوية الضغط');
