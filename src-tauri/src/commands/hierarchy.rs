use crate::db::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Serialize, Deserialize, Debug)]
pub struct Branch {
    pub id: i32,
    pub name: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Area {
    pub id: i32,
    pub name: String,
    pub branch_id: i32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Clinic {
    pub id: i32,
    pub name: String,
    pub area_id: i32,
}

#[tauri::command]
pub fn get_branches(state: State<'_, AppState>) -> Result<Vec<Branch>, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;

    let mut stmt = conn
        .prepare("SELECT id, name FROM branches")
        .map_err(|e| e.to_string())?;
    let branches = stmt
        .query_map([], |row| {
            Ok(Branch {
                id: row.get(0)?,
                name: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for branch in branches {
        result.push(branch.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

#[tauri::command]
pub fn get_areas(state: State<'_, AppState>, branch_id: i32) -> Result<Vec<Area>, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;

    let mut stmt = conn
        .prepare("SELECT id, name, branch_id FROM areas WHERE branch_id = ?1")
        .map_err(|e| e.to_string())?;
    let areas = stmt
        .query_map([branch_id], |row| {
            Ok(Area {
                id: row.get(0)?,
                name: row.get(1)?,
                branch_id: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for area in areas {
        result.push(area.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

#[tauri::command]
pub fn add_branch(state: State<'_, AppState>, name: String) -> Result<i32, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute("INSERT INTO branches (name) VALUES (?1)", [name])
        .map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid() as i32)
}

#[tauri::command]
pub fn update_branch(state: State<'_, AppState>, id: i32, name: String) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute(
        "UPDATE branches SET name = ?1 WHERE id = ?2",
        rusqlite::params![name, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_branch(state: State<'_, AppState>, id: i32) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute("DELETE FROM branches WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn add_area(state: State<'_, AppState>, name: String, branch_id: i32) -> Result<i32, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute(
        "INSERT INTO areas (name, branch_id) VALUES (?1, ?2)",
        rusqlite::params![name, branch_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid() as i32)
}

#[tauri::command]
pub fn update_area(
    state: State<'_, AppState>,
    id: i32,
    name: String,
    branch_id: i32,
) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute(
        "UPDATE areas SET name = ?1, branch_id = ?2 WHERE id = ?3",
        rusqlite::params![name, branch_id, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_area(state: State<'_, AppState>, id: i32) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute("DELETE FROM areas WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_clinics(state: State<'_, AppState>, area_id: i32) -> Result<Vec<Clinic>, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;

    let mut stmt = conn
        .prepare("SELECT id, name, area_id FROM clinics WHERE area_id = ?1")
        .map_err(|e| e.to_string())?;
    let clinics = stmt
        .query_map([area_id], |row| {
            Ok(Clinic {
                id: row.get(0)?,
                name: row.get(1)?,
                area_id: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for clinic in clinics {
        result.push(clinic.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

#[tauri::command]
pub fn add_clinic(state: State<'_, AppState>, name: String, area_id: i32) -> Result<i32, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute(
        "INSERT INTO clinics (name, area_id) VALUES (?1, ?2)",
        rusqlite::params![name, area_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid() as i32)
}

#[tauri::command]
pub fn update_clinic(
    state: State<'_, AppState>,
    id: i32,
    name: String,
    area_id: i32,
) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute(
        "UPDATE clinics SET name = ?1, area_id = ?2 WHERE id = ?3",
        rusqlite::params![name, area_id, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_clinic(state: State<'_, AppState>, id: i32) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute("DELETE FROM clinics WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
