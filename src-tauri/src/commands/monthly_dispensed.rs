use crate::db::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::commands::month_isolation::enforce_isolation_lock;

#[derive(Serialize, Deserialize, Debug)]
pub struct MonthlyDrugsDispensed {
    pub id: Option<i32>,
    pub clinic_id: i32,
    pub area_id: i32,
    pub branch_id: i32,
    pub dispense_month: String, // YYYY-MM
    pub drugs_free_authority: f64,
    pub drugs_free_students: f64,
    pub drugs_free_infants: f64,
    pub drugs_free_breadwinner_women: f64,
    pub drugs_supported_authority_value: f64,
    pub drugs_supported_authority_patient_share: f64,
    pub drugs_supported_students_value: f64,
    pub drugs_supported_students_patient_share: f64,
    pub drugs_supported_infants_value: f64,
    pub drugs_supported_infants_patient_share: f64,
    pub notes: Option<String>,
}

#[tauri::command]
pub fn save_monthly_drugs_dispensed(
    state: State<'_, AppState>,
    data: MonthlyDrugsDispensed,
) -> Result<i32, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;

    // --- Global Month Isolation Lock ---
    // This table is clinic-level by schema design
    enforce_isolation_lock(conn, data.branch_id, &data.dispense_month, "clinic")?;

    if let Some(id) = data.id {
        // Update
        conn.execute(
            "UPDATE monthly_drugs_dispensed SET 
                clinic_id = ?1, area_id = ?2, branch_id = ?3, dispense_month = ?4,
                drugs_free_authority = ?5, drugs_free_students = ?6, drugs_free_infants = ?7, drugs_free_breadwinner_women = ?8,
                drugs_supported_authority_value = ?9, drugs_supported_authority_patient_share = ?10,
                drugs_supported_students_value = ?11, drugs_supported_students_patient_share = ?12,
                drugs_supported_infants_value = ?13, drugs_supported_infants_patient_share = ?14, notes = ?15
             WHERE id = ?16",
            rusqlite::params![
                data.clinic_id, data.area_id, data.branch_id, data.dispense_month,
                data.drugs_free_authority, data.drugs_free_students, data.drugs_free_infants, data.drugs_free_breadwinner_women,
                data.drugs_supported_authority_value, data.drugs_supported_authority_patient_share,
                data.drugs_supported_students_value, data.drugs_supported_students_patient_share,
                data.drugs_supported_infants_value, data.drugs_supported_infants_patient_share,
                data.notes, id
            ],
        ).map_err(|e| e.to_string())?;
        Ok(id)
    } else {
        // Insert
        conn.execute(
            "INSERT INTO monthly_drugs_dispensed (
                clinic_id, area_id, branch_id, dispense_month,
                drugs_free_authority, drugs_free_students, drugs_free_infants, drugs_free_breadwinner_women,
                drugs_supported_authority_value, drugs_supported_authority_patient_share,
                drugs_supported_students_value, drugs_supported_students_patient_share,
                drugs_supported_infants_value, drugs_supported_infants_patient_share, notes
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
            rusqlite::params![
                data.clinic_id, data.area_id, data.branch_id, data.dispense_month,
                data.drugs_free_authority, data.drugs_free_students, data.drugs_free_infants, data.drugs_free_breadwinner_women,
                data.drugs_supported_authority_value, data.drugs_supported_authority_patient_share,
                data.drugs_supported_students_value, data.drugs_supported_students_patient_share,
                data.drugs_supported_infants_value, data.drugs_supported_infants_patient_share,
                data.notes
            ],
        ).map_err(|e| e.to_string())?;
        Ok(conn.last_insert_rowid() as i32)
    }
}

#[tauri::command]
pub fn get_monthly_drugs_dispensed(
    state: State<'_, AppState>,
    clinic_id: i32,
    dispense_month: String,
) -> Result<Option<MonthlyDrugsDispensed>, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;

    let mut stmt = conn.prepare(
        "SELECT id, clinic_id, area_id, branch_id, dispense_month, 
                drugs_free_authority, drugs_free_students, drugs_free_infants, drugs_free_breadwinner_women,
                drugs_supported_authority_value, drugs_supported_authority_patient_share,
                drugs_supported_students_value, drugs_supported_students_patient_share,
                drugs_supported_infants_value, drugs_supported_infants_patient_share, notes
         FROM monthly_drugs_dispensed 
         WHERE clinic_id = ?1 AND dispense_month = ?2"
    ).map_err(|e| e.to_string())?;

    let mut rows = stmt
        .query_map(rusqlite::params![clinic_id, dispense_month], |row| {
            Ok(MonthlyDrugsDispensed {
                id: Some(row.get(0)?),
                clinic_id: row.get(1)?,
                area_id: row.get(2)?,
                branch_id: row.get(3)?,
                dispense_month: row.get(4)?,
                drugs_free_authority: row.get(5)?,
                drugs_free_students: row.get(6)?,
                drugs_free_infants: row.get(7)?,
                drugs_free_breadwinner_women: row.get(8)?,
                drugs_supported_authority_value: row.get(9)?,
                drugs_supported_authority_patient_share: row.get(10)?,
                drugs_supported_students_value: row.get(11)?,
                drugs_supported_students_patient_share: row.get(12)?,
                drugs_supported_infants_value: row.get(13)?,
                drugs_supported_infants_patient_share: row.get(14)?,
                notes: row.get(15)?,
            })
        })
        .map_err(|e| e.to_string())?;

    if let Some(row) = rows.next() {
        Ok(Some(row.map_err(|e| e.to_string())?))
    } else {
        Ok(None)
    }
}

// ===== Detailed Drug Dispensing (per-item records) =====

#[tauri::command]
#[allow(non_snake_case)]
pub fn save_detailed_drug_dispensed(
    state: State<'_, AppState>,
    branchId: i32,
    areaId: Option<i32>,
    clinicId: Option<i32>,
    dispenseMonth: String,
    drugId: i32,
    quantity: f64,
    casesCount: i32,
    unitPrice: f64,
    totalCost: f64,
) -> Result<i32, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;

    // --- 0. Global Month Isolation Lock ---
    let current_level = if clinicId.is_some() { "clinic" } 
                        else if areaId.is_some() { "area" } 
                        else { "branch" };
    
    enforce_isolation_lock(conn, branchId, &dispenseMonth, current_level)?;

    // --- 1. Triple-Layer Isolation & Duplicate Check ---
    // Check for ANY existing records for this (drug, month, branch)
    let mut stmt = conn.prepare(
        "SELECT area_id, clinic_id, quantity, unit_price 
         FROM detailed_drug_dispensed 
         WHERE branch_id = ?1 AND drug_id = ?2 AND dispense_month = ?3"
    ).map_err(|e| e.to_string())?;

    let existing_rows = stmt.query_map(rusqlite::params![branchId, drugId, dispenseMonth], |row| {
        Ok((
            row.get::<_, Option<i32>>(0)?, 
            row.get::<_, Option<i32>>(1)?,
            row.get::<_, f64>(2)?,
            row.get::<_, f64>(3)?
        ))
    }).map_err(|e| e.to_string())?;

    for row_res in existing_rows {
        let (ex_area, ex_clinic, ex_qty, ex_price) = row_res.map_err(|e| e.to_string())?;
        
        // --- Refined Isolation Logic ---
        
        // 1. If we are saving at Branch level (areaId is None)
        if areaId.is_none() {
            // Must have NO ex_area (existing must also be Branch level)
            if ex_area.is_some() {
                return Err("عذراً، هذا الصنف مسجل مسبقاً لهذا الشهر في عيادات أو مناطق تفصيلية تابعة لهذا الفرع. لا يمكن إدخاله كفرع مجمع منعاً لتضارب البيانات.".to_string());
            }
        } 
        
        // 2. If we are saving at Area level (areaId is Some, clinicId is None)
        else if areaId.is_some() && clinicId.is_none() {
            // Check if existing is Branch level (forbidden)
            if ex_area.is_none() {
                return Err("عذراً، هذا الصنف مسجل مسبقاً كـ 'فرع مجمع'. لا يمكن إدخاله كمناطق تفصيلية لنفس الفرع منعاً للتكرار.".to_string());
            }
            // If same area, existing must also have NO clinic
            if ex_area == areaId && ex_clinic.is_some() {
                return Err("عذراً، هذا الصنف مسجل مسبقاً في عيادات تفصيلية تابعة لهذه المنطقة. لا يمكن إدخاله كمنطقة مجمعة.".to_string());
            }
        }
        
        // 3. If we are saving at Clinic level (clinicId is Some)
        else {
            // Check if existing is Branch level (forbidden)
            if ex_area.is_none() {
                return Err("عذراً، هذا الصنف مسجل مسبقاً كـ 'فرع مجمع'. لا يمكن إدخاله كعيادات لهذا الفرع منعاً للتكرار.".to_string());
            }
            // Check if existing is Area level for THIS area (forbidden)
            if ex_area == areaId && ex_clinic.is_none() {
                return Err("عذراً، هذا الصنف مسجل مسبقاً كـ 'منطقة مجمعة' لهذه المنطقة. لا يمكن إدخاله كعيادات تفصيلية تابعة لها.".to_string());
            }
        }

        // Duplicate check for EXACT SAME level
        if ex_area == areaId && ex_clinic == clinicId {
            if (ex_qty - quantity).abs() < 0.0001 && (ex_price - unitPrice).abs() < 0.0001 {
                return Err("هذا الصنف مسجل مسبقاً بنفس الكمية والسعر لهذا الموقع في هذا الشهر.".to_string());
            }
        }
    }

    // --- 2. Insert ---
    conn.execute(
        "INSERT INTO detailed_drug_dispensed (
            branch_id, area_id, clinic_id, dispense_month, drug_id,
            quantity, cases_count, unit_price, total_cost
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        rusqlite::params![
            branchId, areaId, clinicId, dispenseMonth, drugId,
            quantity, casesCount, unitPrice, totalCost
        ],
    ).map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid() as i32)
}

#[tauri::command]
#[allow(non_snake_case)]
pub fn update_detailed_drug_dispensed(
    state: State<'_, AppState>,
    id: i32,
    quantity: f64,
    casesCount: i32,
    unitPrice: f64,
    totalCost: f64,
) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;

    conn.execute(
        "UPDATE detailed_drug_dispensed 
         SET quantity = ?1, cases_count = ?2, unit_price = ?3, total_cost = ?4 
         WHERE id = ?5",
        rusqlite::params![quantity, casesCount, unitPrice, totalCost, id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_detailed_drug_dispensed(
    state: State<'_, AppState>,
    id: i32,
) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;

    conn.execute(
        "DELETE FROM detailed_drug_dispensed WHERE id = ?1",
        rusqlite::params![id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DetailedDrugDispensedRow {
    pub id: i32,
    pub branch_id: i32,
    pub area_id: Option<i32>,
    pub clinic_id: Option<i32>,
    pub dispense_month: String,
    pub drug_id: i32,
    pub quantity: f64,
    pub cases_count: i32,
    pub unit_price: f64,
    pub total_cost: f64,
}

#[tauri::command]
pub fn get_detailed_drug_dispensed(
    state: State<'_, AppState>,
    branch_id: i32,
    area_id: Option<i32>,
    clinic_id: Option<i32>,
    dispense_month: String,
) -> Result<Vec<DetailedDrugDispensedRow>, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;

    // We use "IS" for NULL-safe comparison in SQLite
    let query = "SELECT id, branch_id, area_id, clinic_id, dispense_month, drug_id,
                        quantity, cases_count, unit_price, total_cost
                 FROM detailed_drug_dispensed
                 WHERE branch_id = ?1 AND area_id IS ?2 AND clinic_id IS ?3 AND dispense_month = ?4
                 ORDER BY id DESC";

    let mut stmt = conn.prepare(query).map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(rusqlite::params![branch_id, area_id, clinic_id, dispense_month], |row| {
            Ok(DetailedDrugDispensedRow {
                id: row.get(0)?,
                branch_id: row.get(1)?,
                area_id: row.get(2)?,
                clinic_id: row.get(3)?,
                dispense_month: row.get(4)?,
                drug_id: row.get(5)?,
                quantity: row.get(6)?,
                cases_count: row.get(7)?,
                unit_price: row.get(8)?,
                total_cost: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

#[tauri::command]
pub fn get_drug_previous_prices(
    state: State<'_, AppState>,
    drug_id: i32,
) -> Result<Vec<f64>, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;

    let mut stmt = conn.prepare(
        "SELECT DISTINCT unit_price 
         FROM detailed_drug_dispensed 
         WHERE drug_id = ?1 
         ORDER BY unit_price DESC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(rusqlite::params![drug_id], |row| {
        row.get::<_, f64>(0)
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }
    Ok(result)
}
