use crate::db::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Serialize, Deserialize, Debug)]
pub struct DrugCategory {
    pub id: i32,
    pub name: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Drug {
    pub id: i32,
    pub name: String,
    pub scientific_name: Option<String>,
    pub category_id: i32,
    pub unit: Option<String>,
}

// Drug Categories Commands
#[tauri::command]
pub fn get_drug_categories(state: State<'_, AppState>) -> Result<Vec<DrugCategory>, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;

    let mut stmt = conn
        .prepare("SELECT id, name FROM drug_categories")
        .map_err(|e| e.to_string())?;
    let categories = stmt
        .query_map([], |row| {
            Ok(DrugCategory {
                id: row.get(0)?,
                name: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for cat in categories {
        result.push(cat.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

#[tauri::command]
pub fn add_drug_category(state: State<'_, AppState>, name: String) -> Result<i32, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    
    // Check for duplicate
    let trimmed_name = name.trim().to_string();
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM drug_categories WHERE name = ?1").map_err(|e| e.to_string())?;
    let count: i32 = stmt.query_row([&trimmed_name], |row| row.get(0)).unwrap_or(0);
    if count > 0 { return Err("هذا التصنيف موجود بالفعل".to_string()); }

    conn.execute("INSERT INTO drug_categories (name) VALUES (?1)", [&trimmed_name])
        .map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid() as i32)
}

#[derive(Serialize, Deserialize)]
pub struct BulkResult {
    pub added: i32,
    pub skipped: i32,
}

#[tauri::command]
pub fn bulk_add_drug_categories(state: State<'_, AppState>, names: Vec<String>) -> Result<BulkResult, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    let mut added = 0;
    let mut skipped = 0;
    for name in names {
        let trimmed = name.trim().to_string();
        if trimmed.is_empty() { continue; }
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM drug_categories WHERE name = ?1").map_err(|e| e.to_string())?;
        let count: i32 = stmt.query_row([&trimmed], |row| row.get(0)).unwrap_or(0);
        if count > 0 {
            skipped += 1;
        } else {
            conn.execute("INSERT INTO drug_categories (name) VALUES (?1)", [&trimmed]).map_err(|e| e.to_string())?;
            added += 1;
        }
    }
    Ok(BulkResult { added, skipped })
}

#[tauri::command]
pub fn update_drug_category(
    state: State<'_, AppState>,
    id: i32,
    name: String,
) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    
    let trimmed_name = name.trim().to_string();
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM drug_categories WHERE name = ?1 AND id != ?2").map_err(|e| e.to_string())?;
    let count: i32 = stmt.query_row(rusqlite::params![trimmed_name, id], |row| row.get(0)).unwrap_or(0);
    if count > 0 { return Err("هذا التصنيف موجود بالفعل".to_string()); }

    conn.execute(
        "UPDATE drug_categories SET name = ?1 WHERE id = ?2",
        rusqlite::params![trimmed_name, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_drug_category(state: State<'_, AppState>, id: i32) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute("DELETE FROM drug_categories WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// Drugs Commands
#[tauri::command]
pub fn get_drugs(state: State<'_, AppState>) -> Result<Vec<Drug>, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;

    let mut stmt = conn
        .prepare("SELECT id, name, scientific_name, category_id, unit FROM drugs")
        .map_err(|e| e.to_string())?;
    let drugs = stmt
        .query_map([], |row| {
            Ok(Drug {
                id: row.get(0)?,
                name: row.get(1)?,
                scientific_name: row.get(2)?,
                category_id: row.get(3)?,
                unit: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for drug in drugs {
        result.push(drug.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

#[tauri::command]
pub fn add_drug(
    state: State<'_, AppState>,
    name: String,
    scientific_name: Option<String>,
    category_id: i32,
    unit: Option<String>,
) -> Result<i32, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    
    let trimmed_name = name.trim().to_string();
    
    // Check for duplicate drug with SAME unit AND category
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM drugs WHERE name = ?1 AND ifnull(unit, '') = ifnull(?2, '') AND category_id = ?3").map_err(|e| e.to_string())?;
    let count: i32 = stmt.query_row(rusqlite::params![trimmed_name, unit, category_id], |row| row.get(0)).unwrap_or(0);
    if count > 0 { return Err("هذا الدواء موجود بالفعل بنفس الوحدة والتصنيف".to_string()); }

    conn.execute(
        "INSERT INTO drugs (name, scientific_name, category_id, unit) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![trimmed_name, scientific_name, category_id, unit],
    )
    .map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid() as i32)
}

#[tauri::command]
pub fn update_drug(
    state: State<'_, AppState>,
    id: i32,
    name: String,
    scientific_name: Option<String>,
    category_id: i32,
    unit: Option<String>,
) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    
    let trimmed_name = name.trim().to_string();
    
    // Check for duplicate drug with SAME unit AND category, excluding current drug
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM drugs WHERE name = ?1 AND ifnull(unit, '') = ifnull(?2, '') AND category_id = ?3 AND id != ?4").map_err(|e| e.to_string())?;
    let count: i32 = stmt.query_row(rusqlite::params![trimmed_name, unit, category_id, id], |row| row.get(0)).unwrap_or(0);
    if count > 0 { return Err("هذا الدواء موجود بالفعل بنفس الوحدة والتصنيف".to_string()); }

    conn.execute(
        "UPDATE drugs SET name = ?1, scientific_name = ?2, category_id = ?3, unit = ?4 WHERE id = ?5", 
        rusqlite::params![trimmed_name, scientific_name, category_id, unit, id]
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_drug(state: State<'_, AppState>, id: i32) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute("DELETE FROM drugs WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn bulk_add_drugs(
    state: State<'_, AppState>,
    names: Vec<String>,
    category_id: i32,
    unit: Option<String>,
) -> Result<BulkResult, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    let mut added = 0;
    let mut skipped = 0;
    
    for name in names {
        let trimmed = name.trim().to_string();
        if trimmed.is_empty() { continue; }
        
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM drugs WHERE name = ?1 AND ifnull(unit, '') = ifnull(?2, '') AND category_id = ?3").map_err(|e| e.to_string())?;
        let count: i32 = stmt.query_row(rusqlite::params![trimmed, unit, category_id], |row| row.get(0)).unwrap_or(0);
        
        if count > 0 {
            skipped += 1;
        } else {
            conn.execute(
                "INSERT INTO drugs (name, category_id, unit) VALUES (?1, ?2, ?3)",
                rusqlite::params![trimmed, category_id, unit],
            ).map_err(|e| e.to_string())?;
            added += 1;
        }
    }
    Ok(BulkResult { added, skipped })
}

// Insulin Management
#[tauri::command]
pub fn get_insulin_codes(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;

    let mut stmt = conn
        .prepare("
            SELECT ic.id, ic.name, it.name, iu.name, ic.description 
            FROM insulin_codes ic
            LEFT JOIN insulin_types it ON ic.type_id = it.id
            LEFT JOIN insulin_units iu ON ic.unit_id = iu.id
        ")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(serde_json::json!({
                "id": row.get::<_, i32>(0)?,
                "name": row.get::<_, String>(1)?,
                "type": row.get::<_, Option<String>>(2)?,
                "unit": row.get::<_, Option<String>>(3)?,
                "description": row.get::<_, Option<String>>(4)?,
            }))
        })
        .map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

#[tauri::command]
pub fn add_insulin_code(
    state: State<'_, AppState>,
    name: String,
    type_id: i32,
    unit_id: i32,
    description: Option<String>,
) -> Result<i32, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    
    let trimmed = name.trim().to_string();
    
    // Duplicate check: Same name + type + unit (ignoring category)
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM insulin_codes WHERE name = ?1 AND type_id = ?2 AND unit_id = ?3").map_err(|e| e.to_string())?;
    let count: i32 = stmt.query_row(rusqlite::params![trimmed, type_id, unit_id], |row| row.get(0)).unwrap_or(0);
    if count > 0 { return Err("هذا الصنف موجود بالفعل بنفس النوع والوحدة".to_string()); }

    conn.execute(
        "INSERT INTO insulin_codes (name, type_id, unit_id, description) VALUES (?1, ?2, ?3, ?4)", 
        rusqlite::params![trimmed, type_id, unit_id, description]
    ).map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid() as i32)
}

#[tauri::command]
pub fn update_insulin_code(
    state: State<'_, AppState>,
    id: i32,
    name: String,
    type_id: i32,
    unit_id: i32,
    description: Option<String>,
) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    
    let trimmed = name.trim().to_string();
    
    // Duplicate check, excluding self (ignoring category)
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM insulin_codes WHERE name = ?1 AND type_id = ?2 AND unit_id = ?3 AND id != ?4").map_err(|e| e.to_string())?;
    let count: i32 = stmt.query_row(rusqlite::params![trimmed, type_id, unit_id, id], |row| row.get(0)).unwrap_or(0);
    if count > 0 { return Err("هذا الصنف موجود بالفعل بنفس النوع والوحدة".to_string()); }

    conn.execute(
        "UPDATE insulin_codes SET name = ?1, type_id = ?2, unit_id = ?3, description = ?4 WHERE id = ?5", 
        rusqlite::params![trimmed, type_id, unit_id, description, id]
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_insulin_code(state: State<'_, AppState>, id: i32) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute("DELETE FROM insulin_codes WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn bulk_add_insulin_codes(
    state: State<'_, AppState>,
    names: Vec<String>,
    type_id: i32,
    unit_id: i32,
) -> Result<BulkResult, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    let mut added = 0;
    let mut skipped = 0;
    
    for name in names {
        let trimmed = name.trim().to_string();
        if trimmed.is_empty() { continue; }
        
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM insulin_codes WHERE name = ?1 AND type_id = ?2 AND unit_id = ?3").map_err(|e| e.to_string())?;
        let count: i32 = stmt.query_row(rusqlite::params![trimmed, type_id, unit_id], |row| row.get(0)).unwrap_or(0);
        
        if count > 0 {
            skipped += 1;
        } else {
            conn.execute(
                "INSERT INTO insulin_codes (name, type_id, unit_id) VALUES (?1, ?2, ?3)",
                rusqlite::params![trimmed, type_id, unit_id],
            ).map_err(|e| e.to_string())?;
            added += 1;
        }
    }
    Ok(BulkResult { added, skipped })
}

// Supplies Management
#[tauri::command]
pub fn get_supply_categories(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    let mut stmt = conn
        .prepare("SELECT id, name, description FROM supply_categories")
        .map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(serde_json::json!({ "id": row.get::<_, i32>(0)?, "name": row.get::<_, String>(1)?, "description": row.get::<_, Option<String>>(2)? }))
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for r in rows {
        result.push(r.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

#[tauri::command]
pub fn add_supply_category(
    state: State<'_, AppState>,
    name: String,
    description: Option<String>,
) -> Result<i32, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute(
        "INSERT INTO supply_categories (name, description) VALUES (?1, ?2)",
        rusqlite::params![name, description],
    )
    .map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid() as i32)
}

#[tauri::command]
pub fn get_supplies(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    let mut stmt = conn
        .prepare("SELECT id, name, category_id, unit, description FROM supplies")
        .map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, i32>(0)?, "name": row.get::<_, String>(1)?, "category_id": row.get::<_, i32>(2)?,
            "unit": row.get::<_, Option<String>>(3)?, "description": row.get::<_, Option<String>>(4)?
        }))
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for r in rows {
        result.push(r.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

#[tauri::command]
pub fn add_supply(
    state: State<'_, AppState>,
    name: String,
    category_id: i32,
    unit: Option<String>,
    description: Option<String>,
) -> Result<i32, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute(
        "INSERT INTO supplies (name, category_id, unit, description) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![name, category_id, unit, description],
    )
    .map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid() as i32)
}

#[tauri::command]
pub fn update_supply(
    state: State<'_, AppState>,
    id: i32,
    name: String,
    category_id: i32,
    unit: Option<String>,
    description: Option<String>,
) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute(
        "UPDATE supplies SET name = ?1, category_id = ?2, unit = ?3, description = ?4 WHERE id = ?5",
        rusqlite::params![name, category_id, unit, description, id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_supply(state: State<'_, AppState>, id: i32) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute("DELETE FROM supplies WHERE id = ?1", [id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn update_supply_category(state: State<'_, AppState>, id: i32, name: String, description: Option<String>) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute(
        "UPDATE supply_categories SET name = ?1, description = ?2 WHERE id = ?3",
        rusqlite::params![name, description, id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_supply_category(state: State<'_, AppState>, id: i32) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute("DELETE FROM supply_categories WHERE id = ?1", [id]).map_err(|e| e.to_string())?;
    Ok(())
}

// ─── Drug Units ──────────────────────────────────────
#[tauri::command]
pub fn get_drug_units(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    let mut stmt = conn.prepare("SELECT id, name FROM drug_units").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, i32>(0)?,
            "name": row.get::<_, String>(1)?
        }))
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for r in rows { result.push(r.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn add_drug_unit(state: State<'_, AppState>, name: String) -> Result<i32, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    
    let trimmed_name = name.trim().to_string();
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM drug_units WHERE name = ?1").map_err(|e| e.to_string())?;
    let count: i32 = stmt.query_row([&trimmed_name], |row| row.get(0)).unwrap_or(0);
    if count > 0 { return Err("هذه الوحدة موجودة بالفعل".to_string()); }

    conn.execute("INSERT INTO drug_units (name) VALUES (?1)", [&trimmed_name]).map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid() as i32)
}

#[tauri::command]
pub fn update_drug_unit(state: State<'_, AppState>, id: i32, name: String) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    
    let trimmed_name = name.trim().to_string();
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM drug_units WHERE name = ?1 AND id != ?2").map_err(|e| e.to_string())?;
    let count: i32 = stmt.query_row(rusqlite::params![trimmed_name, id], |row| row.get(0)).unwrap_or(0);
    if count > 0 { return Err("هذه الوحدة موجودة بالفعل".to_string()); }

    conn.execute("UPDATE drug_units SET name = ?1 WHERE id = ?2", rusqlite::params![trimmed_name, id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_drug_unit(state: State<'_, AppState>, id: i32) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute("DELETE FROM drug_units WHERE id = ?1", [id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn bulk_add_drug_units(state: State<'_, AppState>, names: Vec<String>) -> Result<BulkResult, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    let mut added = 0;
    let mut skipped = 0;
    for name in names {
        let trimmed = name.trim().to_string();
        if trimmed.is_empty() { continue; }
        
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM drug_units WHERE name = ?1").map_err(|e| e.to_string())?;
        let count: i32 = stmt.query_row([&trimmed], |row| row.get(0)).unwrap_or(0);
        
        if count > 0 {
            skipped += 1;
        } else {
            conn.execute("INSERT INTO drug_units (name) VALUES (?1)", [&trimmed]).map_err(|e| e.to_string())?;
            added += 1;
        }
    }
    Ok(BulkResult { added, skipped })
}

// ─── Insulin Categories ──────────────────────────────
#[tauri::command]
pub fn get_insulin_categories(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    let mut stmt = conn.prepare("SELECT id, name FROM insulin_categories ORDER BY name").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(serde_json::json!({ "id": row.get::<_, i32>(0)?, "name": row.get::<_, String>(1)? }))
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for r in rows { result.push(r.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn add_insulin_category(state: State<'_, AppState>, name: String) -> Result<i32, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    let trimmed = name.trim().to_string();
    
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM insulin_categories WHERE name = ?1").map_err(|e| e.to_string())?;
    let count: i32 = stmt.query_row([&trimmed], |row| row.get(0)).unwrap_or(0);
    if count > 0 { return Err("هذه الفئة موجودة بالفعل".to_string()); }

    conn.execute("INSERT INTO insulin_categories (name) VALUES (?1)", [&trimmed]).map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid() as i32)
}

#[tauri::command]
pub fn update_insulin_category(state: State<'_, AppState>, id: i32, name: String) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    let trimmed = name.trim().to_string();
    
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM insulin_categories WHERE name = ?1 AND id != ?2").map_err(|e| e.to_string())?;
    let count: i32 = stmt.query_row(rusqlite::params![trimmed, id], |row| row.get(0)).unwrap_or(0);
    if count > 0 { return Err("هذه الفئة موجودة بالفعل".to_string()); }

    conn.execute("UPDATE insulin_categories SET name = ?1 WHERE id = ?2", rusqlite::params![trimmed, id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_insulin_category(state: State<'_, AppState>, id: i32) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute("DELETE FROM insulin_categories WHERE id = ?1", [id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn bulk_add_insulin_categories(state: State<'_, AppState>, names: Vec<String>) -> Result<BulkResult, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    let mut added = 0; let mut skipped = 0;
    for name in names {
        let trimmed = name.trim().to_string();
        if trimmed.is_empty() { continue; }
        
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM insulin_categories WHERE name = ?1").map_err(|e| e.to_string())?;
        let count: i32 = stmt.query_row([&trimmed], |row| row.get(0)).unwrap_or(0);
        
        if count > 0 { skipped += 1; } 
        else {
            conn.execute("INSERT INTO insulin_categories (name) VALUES (?1)", [&trimmed]).map_err(|e| e.to_string())?;
            added += 1;
        }
    }
    Ok(BulkResult { added, skipped })
}

// ─── Insulin Types ──────────────────────────────────
#[tauri::command]
pub fn get_insulin_types(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    let mut stmt = conn.prepare("SELECT id, name FROM insulin_types ORDER BY name").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(serde_json::json!({ "id": row.get::<_, i32>(0)?, "name": row.get::<_, String>(1)? }))
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for r in rows { result.push(r.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn add_insulin_type(state: State<'_, AppState>, name: String) -> Result<i32, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    let trimmed = name.trim().to_string();
    
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM insulin_types WHERE name = ?1").map_err(|e| e.to_string())?;
    let count: i32 = stmt.query_row([&trimmed], |row| row.get(0)).unwrap_or(0);
    if count > 0 { return Err("هذا النوع موجود بالفعل".to_string()); }

    conn.execute("INSERT INTO insulin_types (name) VALUES (?1)", [&trimmed]).map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid() as i32)
}

#[tauri::command]
pub fn update_insulin_type(state: State<'_, AppState>, id: i32, name: String) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    let trimmed = name.trim().to_string();
    
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM insulin_types WHERE name = ?1 AND id != ?2").map_err(|e| e.to_string())?;
    let count: i32 = stmt.query_row(rusqlite::params![trimmed, id], |row| row.get(0)).unwrap_or(0);
    if count > 0 { return Err("هذا النوع موجود بالفعل".to_string()); }

    conn.execute("UPDATE insulin_types SET name = ?1 WHERE id = ?2", rusqlite::params![trimmed, id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_insulin_type(state: State<'_, AppState>, id: i32) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute("DELETE FROM insulin_types WHERE id = ?1", [id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn bulk_add_insulin_types(state: State<'_, AppState>, names: Vec<String>) -> Result<BulkResult, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    let mut added = 0; let mut skipped = 0;
    for name in names {
        let trimmed = name.trim().to_string();
        if trimmed.is_empty() { continue; }
        
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM insulin_types WHERE name = ?1").map_err(|e| e.to_string())?;
        let count: i32 = stmt.query_row([&trimmed], |row| row.get(0)).unwrap_or(0);
        
        if count > 0 { skipped += 1; } 
        else {
            conn.execute("INSERT INTO insulin_types (name) VALUES (?1)", [&trimmed]).map_err(|e| e.to_string())?;
            added += 1;
        }
    }
    Ok(BulkResult { added, skipped })
}

// ─── Insulin Units ──────────────────────────────────
#[tauri::command]
pub fn get_insulin_units(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    let mut stmt = conn.prepare("SELECT id, name FROM insulin_units ORDER BY name").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(serde_json::json!({ "id": row.get::<_, i32>(0)?, "name": row.get::<_, String>(1)? }))
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for r in rows { result.push(r.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn add_insulin_unit(state: State<'_, AppState>, name: String) -> Result<i32, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    let trimmed = name.trim().to_string();
    
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM insulin_units WHERE name = ?1").map_err(|e| e.to_string())?;
    let count: i32 = stmt.query_row([&trimmed], |row| row.get(0)).unwrap_or(0);
    if count > 0 { return Err("هذه الوحدة موجودة بالفعل".to_string()); }

    conn.execute("INSERT INTO insulin_units (name) VALUES (?1)", [&trimmed]).map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid() as i32)
}

#[tauri::command]
pub fn update_insulin_unit(state: State<'_, AppState>, id: i32, name: String) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    let trimmed = name.trim().to_string();
    
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM insulin_units WHERE name = ?1 AND id != ?2").map_err(|e| e.to_string())?;
    let count: i32 = stmt.query_row(rusqlite::params![trimmed, id], |row| row.get(0)).unwrap_or(0);
    if count > 0 { return Err("هذه الوحدة موجودة بالفعل".to_string()); }

    conn.execute("UPDATE insulin_units SET name = ?1 WHERE id = ?2", rusqlite::params![trimmed, id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_insulin_unit(state: State<'_, AppState>, id: i32) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute("DELETE FROM insulin_units WHERE id = ?1", [id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn bulk_add_insulin_units(state: State<'_, AppState>, names: Vec<String>) -> Result<BulkResult, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    let mut added = 0; let mut skipped = 0;
    for name in names {
        let trimmed = name.trim().to_string();
        if trimmed.is_empty() { continue; }
        
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM insulin_units WHERE name = ?1").map_err(|e| e.to_string())?;
        let count: i32 = stmt.query_row([&trimmed], |row| row.get(0)).unwrap_or(0);
        
        if count > 0 { skipped += 1; } 
        else {
            conn.execute("INSERT INTO insulin_units (name) VALUES (?1)", [&trimmed]).map_err(|e| e.to_string())?;
            added += 1;
        }
    }
    Ok(BulkResult { added, skipped })
}

// ─── Judicial Patients ──────────────────────────────
#[tauri::command]
pub fn get_judicial_patients(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    let mut stmt = conn.prepare(
        "SELECT id, name, diagnosis, court_ruling_date, treatment_start_date, clinic_id, area_id, pdf_path FROM judicial_patients"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, i32>(0)?,
            "name": row.get::<_, String>(1)?,
            "diagnosis": row.get::<_, Option<String>>(2)?,
            "court_ruling_date": row.get::<_, String>(3)?,
            "treatment_start_date": row.get::<_, String>(4)?,
            "clinic_id": row.get::<_, i32>(5)?,
            "area_id": row.get::<_, i32>(6)?,
            "pdf_path": row.get::<_, Option<String>>(7)?,
        }))
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for r in rows { result.push(r.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn add_judicial_patient(
    state: State<'_, AppState>,
    name: String,
    diagnosis: Option<String>,
    court_ruling_date: String,
    treatment_start_date: String,
    clinic_id: Option<i32>,
    area_id: Option<i32>,
) -> Result<i32, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute(
        "INSERT INTO judicial_patients (name, diagnosis, court_ruling_date, treatment_start_date, clinic_id, area_id) VALUES (?1,?2,?3,?4,?5,?6)",
        rusqlite::params![name, diagnosis, court_ruling_date, treatment_start_date, clinic_id, area_id],
    ).map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid() as i32)
}

#[tauri::command]
pub fn update_judicial_patient(
    state: State<'_, AppState>,
    id: i32,
    name: String,
    diagnosis: Option<String>,
    court_ruling_date: String,
    treatment_start_date: String,
    clinic_id: Option<i32>,
    area_id: Option<i32>,
) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute(
        "UPDATE judicial_patients SET name=?1, diagnosis=?2, court_ruling_date=?3, treatment_start_date=?4, clinic_id=?5, area_id=?6 WHERE id=?7",
        rusqlite::params![name, diagnosis, court_ruling_date, treatment_start_date, clinic_id, area_id, id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_judicial_patient(state: State<'_, AppState>, id: i32) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute("DELETE FROM judicial_patients WHERE id = ?1", [id]).map_err(|e| e.to_string())?;
    Ok(())
}

// ─── Judicial Medicines ──────────────────────────────
#[tauri::command]
pub fn get_judicial_medicines(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    let mut stmt = conn.prepare(
        "SELECT id, name, unit, description FROM judicial_medicines"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, i32>(0)?,
            "name": row.get::<_, String>(1)?,
            "unit": row.get::<_, String>(2)?,
            "description": row.get::<_, Option<String>>(3)?,
        }))
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for r in rows { result.push(r.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn add_judicial_medicine(state: State<'_, AppState>, name: String, unit: String, description: Option<String>) -> Result<i32, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute(
        "INSERT INTO judicial_medicines (name, unit, description) VALUES (?1,?2,?3)",
        rusqlite::params![name, unit, description],
    ).map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid() as i32)
}

#[tauri::command]
pub fn update_judicial_medicine(state: State<'_, AppState>, id: i32, name: String, unit: String, description: Option<String>) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute(
        "UPDATE judicial_medicines SET name=?1, unit=?2, description=?3 WHERE id=?4",
        rusqlite::params![name, unit, description, id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_judicial_medicine(state: State<'_, AppState>, id: i32) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute("DELETE FROM judicial_medicines WHERE id = ?1", [id]).map_err(|e| e.to_string())?;
    Ok(())
}

// ─── Bulk Add Supplies ──────────────────────────────
#[tauri::command]
pub fn bulk_add_supplies(
    state: State<'_, AppState>,
    names: Vec<String>,
    category_id: i32,
    unit: Option<String>,
) -> Result<BulkResult, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    let mut added = 0;
    let mut skipped = 0;
    for name in names {
        let trimmed = name.trim().to_string();
        if trimmed.is_empty() { continue; }
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM supplies WHERE name = ?1 AND category_id = ?2").map_err(|e| e.to_string())?;
        let count: i32 = stmt.query_row(rusqlite::params![trimmed, category_id], |row| row.get(0)).unwrap_or(0);
        if count > 0 {
            skipped += 1;
        } else {
            conn.execute(
                "INSERT INTO supplies (name, category_id, unit) VALUES (?1, ?2, ?3)",
                rusqlite::params![trimmed, category_id, unit],
            ).map_err(|e| e.to_string())?;
            added += 1;
        }
    }
    Ok(BulkResult { added, skipped })
}

#[tauri::command]
pub fn bulk_add_supply_categories(
    state: State<'_, AppState>,
    names: Vec<String>,
) -> Result<BulkResult, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    let mut added = 0;
    let mut skipped = 0;
    for name in names {
        let trimmed = name.trim().to_string();
        if trimmed.is_empty() { continue; }
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM supply_categories WHERE name = ?1").map_err(|e| e.to_string())?;
        let count: i32 = stmt.query_row([&trimmed], |row| row.get(0)).unwrap_or(0);
        if count > 0 { skipped += 1; }
        else {
            conn.execute("INSERT INTO supply_categories (name) VALUES (?1)", [&trimmed]).map_err(|e| e.to_string())?;
            added += 1;
        }
    }
    Ok(BulkResult { added, skipped })
}

// ─── Bulk Add Judicial Medicines ────────────────────
#[tauri::command]
pub fn bulk_add_judicial_medicines(
    state: State<'_, AppState>,
    names: Vec<String>,
    unit: String,
) -> Result<BulkResult, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    let mut added = 0;
    let mut skipped = 0;
    for name in names {
        let trimmed = name.trim().to_string();
        if trimmed.is_empty() { continue; }
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM judicial_medicines WHERE name = ?1").map_err(|e| e.to_string())?;
        let count: i32 = stmt.query_row([&trimmed], |row| row.get(0)).unwrap_or(0);
        if count > 0 { skipped += 1; }
        else {
            conn.execute(
                "INSERT INTO judicial_medicines (name, unit) VALUES (?1, ?2)",
                rusqlite::params![trimmed, unit],
            ).map_err(|e| e.to_string())?;
            added += 1;
        }
    }
    Ok(BulkResult { added, skipped })
}

// ─── Judicial Patient PDF (Multiple Files) ────────────────
#[tauri::command]
pub fn add_patient_pdf(
    state: State<'_, AppState>,
    patient_id: i32,
    file_name: String,
    pdf_data: String,
) -> Result<i32, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute(
        "INSERT INTO patient_pdfs (patient_id, file_name, pdf_data) VALUES (?1, ?2, ?3)",
        rusqlite::params![patient_id, file_name, pdf_data],
    ).map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid() as i32)
}

#[tauri::command]
pub fn get_patient_pdfs_list(
    state: State<'_, AppState>,
    patient_id: i32,
) -> Result<Vec<serde_json::Value>, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    let mut stmt = conn.prepare(
        "SELECT id, file_name, uploaded_at FROM patient_pdfs WHERE patient_id = ?1 ORDER BY uploaded_at DESC"
    ).map_err(|e| e.to_string())?;
    
    let rows = stmt.query_map([patient_id], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, i32>(0)?,
            "file_name": row.get::<_, String>(1)?,
            "uploaded_at": row.get::<_, String>(2)?,
        }))
    }).map_err(|e| e.to_string())?;
    
    let mut result = Vec::new();
    for r in rows {
        result.push(r.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

#[tauri::command]
pub fn get_patient_pdf_data(
    state: State<'_, AppState>,
    pdf_id: i32,
) -> Result<String, String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    let result = conn.query_row(
        "SELECT pdf_data FROM patient_pdfs WHERE id = ?1",
        [pdf_id],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;
    Ok(result)
}

#[tauri::command]
pub fn delete_patient_pdf(
    state: State<'_, AppState>,
    pdf_id: i32,
) -> Result<(), String> {
    let conn_guard = state.db.lock().map_err(|e| e.to_string())?;
    let conn = conn_guard.as_ref().ok_or("Database not initialized")?;
    conn.execute(
        "DELETE FROM patient_pdfs WHERE id = ?1",
        [pdf_id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}
