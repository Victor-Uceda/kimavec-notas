use crate::db::{Database, Note};
use tauri::State;

#[tauri::command]
pub fn get_notes(db: State<'_, Database>) -> Result<Vec<Note>, String> {
    db.get_all_notes()
}

#[tauri::command]
pub fn save_note(db: State<'_, Database>, note: Note) -> Result<(), String> {
    db.save_note(&note)
}

#[tauri::command]
pub fn delete_note(db: State<'_, Database>, id: String) -> Result<(), String> {
    db.delete_note(&id)
}
