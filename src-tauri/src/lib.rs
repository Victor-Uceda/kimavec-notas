mod commands;
mod db;

use db::Database;
use std::fs;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Almacenar notas.db en el directorio estándar de datos de la app (fuera de src-tauri)
            // Esto evita que el file watcher de Tauri detecte cambios en notas.db y reinicie la app en bucle.
            let app_data_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from(".data"));
            fs::create_dir_all(&app_data_dir).ok();
            let db_path = app_data_dir.join("notas.db");

            let db = Database::new(db_path.to_str().unwrap_or("notas.db"))
                .expect("Failed to initialize SQLite database");
            app.manage(db);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_notes,
            commands::save_note,
            commands::delete_note,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
