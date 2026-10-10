use crate::db::{BoardCard, Database, Folder, Note, Task};
use tauri::State;

// --- NOTAS ---
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

// --- CARPETAS ---
#[tauri::command]
pub fn get_folders(db: State<'_, Database>) -> Result<Vec<Folder>, String> {
    db.get_all_folders()
}

#[tauri::command]
pub fn save_folder(db: State<'_, Database>, folder: Folder) -> Result<(), String> {
    db.save_folder(&folder)
}

#[tauri::command]
pub fn delete_folder(db: State<'_, Database>, id: String) -> Result<(), String> {
    db.delete_folder(&id)
}

// --- TABLERO (BOARD CARDS) ---
#[tauri::command]
pub fn get_board_cards(db: State<'_, Database>) -> Result<Vec<BoardCard>, String> {
    db.get_all_board_cards()
}

#[tauri::command]
pub fn save_board_card(db: State<'_, Database>, card: BoardCard) -> Result<(), String> {
    db.save_board_card(&card)
}

#[tauri::command]
pub fn delete_board_card(db: State<'_, Database>, id: String) -> Result<(), String> {
    db.delete_board_card(&id)
}

// --- TAREAS (TASKS) ---
#[tauri::command]
pub fn get_tasks(db: State<'_, Database>) -> Result<Vec<Task>, String> {
    db.get_all_tasks()
}

#[tauri::command]
pub fn save_task(db: State<'_, Database>, task: Task) -> Result<(), String> {
    db.save_task(&task)
}

#[tauri::command]
pub fn delete_task(db: State<'_, Database>, id: String) -> Result<(), String> {
    db.delete_task(&id)
}
