use rusqlite::{Connection, Result};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

pub struct AppState {
    pub db: Mutex<Option<Connection>>,
}

pub fn init_db(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // Determine the directory of the executable
    let exe_path = std::env::current_exe()?;
    let app_dir = exe_path
        .parent()
        .ok_or("Could not determine executable directory")?;

    let db_path = app_dir.join("medicine_dispenser.db");

    // Open connection (removed mut as it's not needed for basic usage here)
    let conn = Connection::open(&db_path)?;

    // Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON", [])?;

    // Execute Schema - Hardcoded approach or reading from relative file
    // For reliability in Portable mode, we use the schema defined in our project
    let schema = include_str!("../../schema.sql");
    conn.execute_batch(schema)?;

    // --- MIGRATIONS: Ensure new columns exist for Insulin Overhaul ---
    // 1. Try simple ADD COLUMN for new installations or partial updates
    let _ = conn.execute(
        "ALTER TABLE insulin_codes ADD COLUMN type_id INTEGER NOT NULL DEFAULT 0",
        [],
    );
    let _ = conn.execute(
        "ALTER TABLE insulin_codes ADD COLUMN unit_id INTEGER NOT NULL DEFAULT 0",
        [],
    );
    let _ = conn.execute(
        "ALTER TABLE insulin_dispensed ADD COLUMN insulin_code_id INTEGER",
        [],
    );

    // 2. Fix the "NOT NULL constraint failed: insulin_codes.code" issue
    // This happens because old DBs have 'code' as NOT NULL, and we don't send it anymore.
    // Check if 'code' column exists and is causing trouble.
    let table_info: Result<Vec<String>, _> = conn
        .prepare("PRAGMA table_info(insulin_codes)")?
        .query_map([], |row| row.get(1))?
        .collect();
    if let Ok(columns) = table_info {
        if columns.contains(&"code".to_string()) {
            println!("Migrating insulin_codes table to remove problematic 'code' column...");
            // We use a transaction to ensure data safety
            conn.execute_batch(
                "
                BEGIN TRANSACTION;
                -- 1. Create temporary table with new schema
                CREATE TABLE insulin_codes_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    type_id INTEGER NOT NULL DEFAULT 0,
                    unit_id INTEGER NOT NULL DEFAULT 0,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                -- 2. Copy data from old table (ignoring code)
                -- We try to preserve type_id and unit_id if they already existed
                INSERT INTO insulin_codes_new (id, name, type_id, unit_id, description, created_at)
                SELECT id, name, type_id, unit_id, description, created_at FROM insulin_codes;
                -- 3. Drop old table and rename new one
                DROP TABLE insulin_codes;
                ALTER TABLE insulin_codes_new RENAME TO insulin_codes;
                COMMIT;
            ",
            )
            .map_err(|e| {
                let _ = conn.execute("ROLLBACK", []);
                e.to_string()
            })?;
        }
    }
    // -----------------------------------------------------------------

    // --- MIGRATION: Add pdf_path column to judicial_patients ---
    let _ = conn.execute("ALTER TABLE judicial_patients ADD COLUMN pdf_path TEXT", []);
    // --- MIGRATION: Add pdf_data column to judicial_patients ---
    let _ = conn.execute("ALTER TABLE judicial_patients ADD COLUMN pdf_data TEXT", []);

    // --- MIGRATION: Make clinic_id and area_id nullable in judicial_patients ---
    {
        let table_info: Result<Vec<(String, bool)>, _> = conn
            .prepare("PRAGMA table_info(judicial_patients)")?
            .query_map([], |row| {
                Ok((row.get::<_, String>(1)?, row.get::<_, bool>(3)?)) // (name, notnull)
            })?
            .collect();
        if let Ok(columns) = table_info {
            let clinic_notnull = columns
                .iter()
                .any(|(name, notnull)| name == "clinic_id" && *notnull);
            let area_notnull = columns
                .iter()
                .any(|(name, notnull)| name == "area_id" && *notnull);
            if clinic_notnull || area_notnull {
                println!("Migrating judicial_patients to make clinic_id/area_id nullable...");
                conn.execute_batch("
                    BEGIN TRANSACTION;
                    CREATE TABLE judicial_patients_new (
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
                    INSERT INTO judicial_patients_new (id, name, diagnosis, court_ruling_date, treatment_start_date, clinic_id, area_id, pdf_path, pdf_data, created_at)
                    SELECT id, name, diagnosis, court_ruling_date, treatment_start_date, clinic_id, area_id, pdf_path, pdf_data, created_at FROM judicial_patients;
                    DROP TABLE judicial_patients;
                    ALTER TABLE judicial_patients_new RENAME TO judicial_patients;
                    COMMIT;
                ").map_err(|e| {
                    let _ = conn.execute("ROLLBACK", []);
                    e.to_string()
                })?;
            }
        }
    }

    // --- MIGRATION: Make area_id and clinic_id nullable in detailed_drug_dispensed ---
    {
        let table_info: Result<Vec<(String, bool)>, _> = conn
            .prepare("PRAGMA table_info(detailed_drug_dispensed)")?
            .query_map([], |row| {
                Ok((row.get::<_, String>(1)?, row.get::<_, bool>(3)?)) // (name, notnull)
            })?
            .collect();
        if let Ok(columns) = table_info {
            let area_notnull = columns
                .iter()
                .any(|(name, notnull)| name == "area_id" && *notnull);
            let clinic_notnull = columns
                .iter()
                .any(|(name, notnull)| name == "clinic_id" && *notnull);

            if area_notnull || clinic_notnull {
                println!("Migrating detailed_drug_dispensed to make area_id/clinic_id nullable...");
                conn.execute_batch("
                    BEGIN TRANSACTION;
                    CREATE TABLE detailed_drug_dispensed_new (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        branch_id INTEGER NOT NULL,
                        area_id INTEGER,
                        clinic_id INTEGER,
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
                    INSERT INTO detailed_drug_dispensed_new (id, branch_id, area_id, clinic_id, dispense_month, drug_id, quantity, cases_count, unit_price, total_cost, created_at)
                    SELECT id, branch_id, area_id, clinic_id, dispense_month, drug_id, quantity, cases_count, unit_price, total_cost, created_at FROM detailed_drug_dispensed;
                    DROP TABLE detailed_drug_dispensed;
                    ALTER TABLE detailed_drug_dispensed_new RENAME TO detailed_drug_dispensed;
                    COMMIT;
                ").map_err(|e| {
                    let _ = conn.execute("ROLLBACK", []);
                    e.to_string()
                })?;
            }
        }
    }

    // --- MIGRATION: Support Hierarchy for insulin_dispensed ---
    {
        let table_info: Result<Vec<(String, bool)>, _> = conn
            .prepare("PRAGMA table_info(insulin_dispensed)")?
            .query_map([], |row| {
                Ok((row.get::<_, String>(1)?, row.get::<_, bool>(3)?)) // (name, notnull)
            })?
            .collect();
        if let Ok(columns) = table_info {
            let has_branch = columns.iter().any(|(name, _)| name == "branch_id");
            let area_notnull = columns
                .iter()
                .any(|(name, notnull)| name == "area_id" && *notnull);

            if !has_branch || area_notnull {
                println!("Migrating insulin_dispensed to support hierarchy and nullable IDs...");
                conn.execute_batch("
                    BEGIN TRANSACTION;
                    CREATE TABLE insulin_dispensed_new (
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
                        branch_id INTEGER NOT NULL DEFAULT 1,
                        area_id INTEGER,
                        clinic_id INTEGER,
                        dispense_month DATE NOT NULL,
                        insulin_code_id INTEGER,
                        FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE CASCADE,
                        FOREIGN KEY (area_id) REFERENCES areas (id) ON DELETE CASCADE,
                        FOREIGN KEY (clinic_id) REFERENCES clinics (id) ON DELETE CASCADE,
                        FOREIGN KEY (insulin_code_id) REFERENCES insulin_codes (id) ON DELETE SET NULL
                    );
                    INSERT INTO insulin_dispensed_new (id, name, type, unit, cases_count, quantity, price, cost, rate, balance, category, branch_id, area_id, clinic_id, dispense_month, insulin_code_id)
                    SELECT id, name, type, unit, cases_count, quantity, price, cost, rate, balance, category, 1, area_id, clinic_id, dispense_month, insulin_code_id FROM insulin_dispensed;
                    
                    DROP TABLE insulin_dispensed;
                    ALTER TABLE insulin_dispensed_new RENAME TO insulin_dispensed;
                    COMMIT;
                ").map_err(|e| {
                    let _ = conn.execute("ROLLBACK", []);
                    e.to_string()
                })?;
            }
        }
    }

    // --- MIGRATION: Create patient_pdfs and copy existing data ---
    conn.execute_batch("
        CREATE TABLE IF NOT EXISTS patient_pdfs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            file_name TEXT NOT NULL,
            pdf_data TEXT NOT NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES judicial_patients (id) ON DELETE CASCADE
        );
        -- Migrate any existing single PDFs from judicial_patients
        INSERT INTO patient_pdfs (patient_id, file_name, pdf_data)
        SELECT id, pdf_path, pdf_data 
        FROM judicial_patients 
        WHERE pdf_path IS NOT NULL AND pdf_data IS NOT NULL AND id NOT IN (SELECT patient_id FROM patient_pdfs);
    ")?;

    if let Ok(path) = std::fs::canonicalize(&db_path) {
        println!("Database initialized at: {:?}", path);
    } else {
        println!("Database initialized at: {:?}", db_path);
    }

    let state = app.state::<AppState>();
    // --- MIGRATION: Add dispensing_month_isolation table for global level locking ---
    let _ = conn.execute("
        CREATE TABLE IF NOT EXISTS dispensing_month_isolation (
            branch_id INTEGER NOT NULL,
            dispense_month TEXT NOT NULL,
            isolation_level TEXT NOT NULL, -- 'branch', 'area', 'clinic'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (branch_id, dispense_month),
            FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE CASCADE
        )
    ", []);

    if let Ok(mut db_lock) = state.db.lock() {
        *db_lock = Some(conn);
    }

    Ok(())
}
