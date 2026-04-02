mod commands;
mod db;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(db::AppState {
            db: std::sync::Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            commands::hierarchy::get_branches,
            commands::hierarchy::add_branch,
            commands::hierarchy::update_branch,
            commands::hierarchy::delete_branch,
            commands::hierarchy::get_areas,
            commands::hierarchy::add_area,
            commands::hierarchy::update_area,
            commands::hierarchy::delete_area,
            commands::hierarchy::get_clinics,
            commands::hierarchy::add_clinic,
            commands::hierarchy::update_clinic,
            commands::hierarchy::delete_clinic,
            // Drug Categories & Drugs
            commands::master_data::get_drug_categories,
            commands::master_data::add_drug_category,
            commands::master_data::update_drug_category,
            commands::master_data::delete_drug_category,
            commands::master_data::bulk_add_drug_categories,
            commands::master_data::get_drugs,
            commands::master_data::add_drug,
            commands::master_data::update_drug,
            commands::master_data::delete_drug,
            commands::master_data::bulk_add_drugs,
            commands::master_data::get_drug_units,
            commands::master_data::add_drug_unit,
            commands::master_data::update_drug_unit,
            commands::master_data::delete_drug_unit,
            commands::master_data::bulk_add_drug_units,
            commands::master_data::get_insulin_codes,
            commands::master_data::add_insulin_code,
            commands::master_data::update_insulin_code,
            commands::master_data::delete_insulin_code,
            commands::master_data::bulk_add_insulin_codes,
            commands::master_data::get_insulin_categories,
            commands::master_data::add_insulin_category,
            commands::master_data::update_insulin_category,
            commands::master_data::delete_insulin_category,
            commands::master_data::bulk_add_insulin_categories,
            commands::master_data::get_insulin_types,
            commands::master_data::add_insulin_type,
            commands::master_data::update_insulin_type,
            commands::master_data::delete_insulin_type,
            commands::master_data::bulk_add_insulin_types,
            commands::master_data::get_insulin_units,
            commands::master_data::add_insulin_unit,
            commands::master_data::update_insulin_unit,
            commands::master_data::delete_insulin_unit,
            commands::master_data::bulk_add_insulin_units,
            // Supply Categories & Supplies
            commands::master_data::get_supply_categories,
            commands::master_data::add_supply_category,
            commands::master_data::update_supply_category,
            commands::master_data::delete_supply_category,
            commands::master_data::bulk_add_supply_categories,
            commands::master_data::get_supplies,
            commands::master_data::add_supply,
            commands::master_data::update_supply,
            commands::master_data::delete_supply,
            commands::master_data::bulk_add_supplies,
            // Judicial Patients & Medicines
            commands::master_data::get_judicial_patients,
            commands::master_data::add_judicial_patient,
            commands::master_data::update_judicial_patient,
            commands::master_data::delete_judicial_patient,
            commands::master_data::add_patient_pdf,
            commands::master_data::get_patient_pdfs_list,
            commands::master_data::get_patient_pdf_data,
            commands::master_data::delete_patient_pdf,
            commands::master_data::get_judicial_medicines,
            commands::master_data::add_judicial_medicine,
            commands::master_data::update_judicial_medicine,
            commands::master_data::delete_judicial_medicine,
            commands::master_data::bulk_add_judicial_medicines,
            // Dispensing Operations
            commands::monthly_dispensed::save_monthly_drugs_dispensed,
            commands::monthly_dispensed::get_monthly_drugs_dispensed,
            commands::monthly_dispensed::save_detailed_drug_dispensed,
            commands::monthly_dispensed::get_detailed_drug_dispensed,
            commands::monthly_dispensed::update_detailed_drug_dispensed,
            commands::monthly_dispensed::delete_detailed_drug_dispensed,
            commands::monthly_dispensed::get_drug_previous_prices,
            commands::insulin_dispensed::save_insulin_dispensed,
            commands::insulin_dispensed::get_insulin_dispensed,
            commands::insulin_dispensed::get_insulin_previous_prices,
            commands::insulin_dispensed::delete_insulin_dispensed,
            commands::drug_groups::save_drug_group,
            commands::judicial_dispensed::save_judicial_dispensed,
            commands::judicial_dispensed::get_judicial_dispensed,
            commands::month_isolation::get_month_isolation_rule,
            commands::month_isolation::set_month_isolation_rule,
            commands::month_isolation::check_month_data_exists,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Initialize Database
            if let Err(e) = db::init_db(app.handle()) {
                eprintln!("Failed to initialize database: {}", e);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
