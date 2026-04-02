use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::AppState;
use crate::commands::month_isolation::{enforce_isolation_lock, get_branch_id_from_clinic};

#[derive(Serialize, Deserialize, Debug)]
pub struct DrugGroup {
    pub id: Option<i32>,
    pub name: String,
    pub cost: f64,
    pub clinic_id: i32,
    pub area_id: i32,
    pub dispense_month: String, // YYYY-MM
    pub group_code_id: Option<i32>,
}

#[tauri::command]
pub fn save_drug_group(state: State<'_, AppState>, data: DrugGroup) -> Result<i32, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;

    // --- Global Month Isolation Lock ---
    let branch_id = get_branch_id_from_clinic(conn, data.clinic_id)?;
    enforce_isolation_lock(conn, branch_id, &data.dispense_month, "clinic")?;

    if let Some(id) = data.id {
        // Update
        conn.execute(
            "UPDATE drug_groups SET 
                name = ?1, cost = ?2, clinic_id = ?3, area_id = ?4, dispense_month = ?5, group_code_id = ?6
             WHERE id = ?7",
            rusqlite::params![
                data.name, data.cost, data.clinic_id, data.area_id, data.dispense_month, data.group_code_id, id
            ],
        ).map_err(|e| e.to_string())?;
        Ok(id)
    } else {
        // Insert
        conn.execute(
            "INSERT INTO drug_groups (
                name, cost, clinic_id, area_id, dispense_month, group_code_id
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![
                data.name, data.cost, data.clinic_id, data.area_id, data.dispense_month, data.group_code_id
            ],
        ).map_err(|e| e.to_string())?;
        Ok(conn.last_insert_rowid() as i32)
    }
}
