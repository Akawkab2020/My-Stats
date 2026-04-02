use crate::db::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::commands::month_isolation::{enforce_isolation_lock, get_branch_id_from_clinic};

#[derive(Serialize, Deserialize, Debug)]
pub struct JudicialDispensed {
    pub id: Option<i32>,
    pub patient_id: i32,
    pub diagnosis: String,
    pub medicine_name: String,
    pub unit: String,
    pub unit_price: f64,
    pub monthly_dose: f64,
    pub monthly_cost: f64,
    pub dispense_month: String, // YYYY-MM
    pub clinic_id: i32,
    pub area_id: i32,
}

#[tauri::command]
pub fn save_judicial_dispensed(
    state: State<'_, AppState>,
    data: JudicialDispensed,
) -> Result<i32, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;

    // --- Global Month Isolation Lock ---
    let branch_id = get_branch_id_from_clinic(conn, data.clinic_id)?;
    enforce_isolation_lock(conn, branch_id, &data.dispense_month, "clinic")?;

    if let Some(id) = data.id {
        // Update
        conn.execute(
            "UPDATE judicial_dispensed SET 
                patient_id = ?1, diagnosis = ?2, medicine_name = ?3, unit = ?4, unit_price = ?5,
                monthly_dose = ?6, monthly_cost = ?7, dispense_month = ?8, clinic_id = ?9, area_id = ?10
             WHERE id = ?11",
            rusqlite::params![
                data.patient_id, data.diagnosis, data.medicine_name, data.unit, data.unit_price,
                data.monthly_dose, data.monthly_cost, data.dispense_month, data.clinic_id, data.area_id, id
            ],
        ).map_err(|e| e.to_string())?;
        Ok(id)
    } else {
        // Insert
        conn.execute(
            "INSERT INTO judicial_dispensed (
                patient_id, diagnosis, medicine_name, unit, unit_price,
                monthly_dose, monthly_cost, dispense_month, clinic_id, area_id
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            rusqlite::params![
                data.patient_id,
                data.diagnosis,
                data.medicine_name,
                data.unit,
                data.unit_price,
                data.monthly_dose,
                data.monthly_cost,
                data.dispense_month,
                data.clinic_id,
                data.area_id
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(conn.last_insert_rowid() as i32)
    }
}

#[tauri::command]
pub fn get_judicial_dispensed(
    state: State<'_, AppState>,
    clinic_id: i32,
    dispense_month: String,
) -> Result<Vec<JudicialDispensed>, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;

    let mut stmt = conn.prepare(
        "SELECT id, patient_id, diagnosis, medicine_name, unit, unit_price, monthly_dose, monthly_cost, dispense_month, clinic_id, area_id 
         FROM judicial_dispensed 
         WHERE clinic_id = ?1 AND dispense_month = ?2"
    ).map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(rusqlite::params![clinic_id, dispense_month], |row| {
            Ok(JudicialDispensed {
                id: Some(row.get(0)?),
                patient_id: row.get(1)?,
                diagnosis: row.get(2)?,
                medicine_name: row.get(3)?,
                unit: row.get(4)?,
                unit_price: row.get(5)?,
                monthly_dose: row.get(6)?,
                monthly_cost: row.get(7)?,
                dispense_month: row.get(8)?,
                clinic_id: row.get(9)?,
                area_id: row.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }
    Ok(result)
}
