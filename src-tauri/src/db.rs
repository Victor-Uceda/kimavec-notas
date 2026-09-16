use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub content: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: i64,
    #[serde(default, rename = "folderId")]
    pub folder_id: Option<String>,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub priority: Option<String>,
}

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new(path: &str) -> Result<Self, String> {
        let conn = Connection::open(path).map_err(|e| e.to_string())?;
        let db = Database {
            conn: Mutex::new(conn),
        };
        db.init()?;
        Ok(db)
    }

    fn init(&self) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                updated_at INTEGER NOT NULL,
                folder_id TEXT,
                status TEXT,
                priority TEXT
            );",
            [],
        )
        .map_err(|e| e.to_string())?;

        // Migración idéntica para bases de datos existentes
        let _ = conn.execute("ALTER TABLE notes ADD COLUMN folder_id TEXT;", []);
        let _ = conn.execute("ALTER TABLE notes ADD COLUMN status TEXT;", []);
        let _ = conn.execute("ALTER TABLE notes ADD COLUMN priority TEXT;", []);

        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM notes", [], |r| r.get(0))
            .unwrap_or(0);

        if count == 0 {
            conn.execute(
                "INSERT INTO notes (id, title, content, updated_at, folder_id, status, priority) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    "note-1",
                    "Notas de reunión con omar",
                    "<p>Alineación de objetivos de producto y arquitectura del cliente ligero.</p><h2>Acuerdos de la reunión</h2><ul data-type=\"taskList\"><li data-type=\"taskItem\" data-checked=\"false\"><label><input type=\"checkbox\"></label><div><p>Definir contratos de datos y esquema de persistencia @Omar</p></div></li><li data-type=\"taskItem\" data-checked=\"true\"><label><input type=\"checkbox\" checked></label><div><p>Tarea completada [Prioridad Alta] @Omar</p></div></li><li data-type=\"taskItem\" data-checked=\"false\"><label><input type=\"checkbox\"></label><div><p>Implementar sincronización reactiva en tiempo real</p></div></li></ul><h2>Siguientes pasos</h2><p>Se evaluará la integración nativa y el benchmark de consumo de memoria. Mantener interfaz limpia y tipografía cuidada.</p>",
                    1725900000000i64,
                    "folder-01",
                    "in_progress",
                    "high"
                ],
            )
            .map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    pub fn get_all_notes(&self) -> Result<Vec<Note>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare("SELECT id, title, content, updated_at, folder_id, status, priority FROM notes ORDER BY updated_at DESC")
            .map_err(|e| e.to_string())?;

        let note_iter = stmt
            .query_map([], |row| {
                Ok(Note {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    content: row.get(2)?,
                    updated_at: row.get(3)?,
                    folder_id: row.get(4).unwrap_or(None),
                    status: row.get(5).unwrap_or(None),
                    priority: row.get(6).unwrap_or(None),
                })
            })
            .map_err(|e| e.to_string())?;

        let mut notes = Vec::new();
        for note in note_iter {
            if let Ok(n) = note {
                notes.push(n);
            }
        }
        Ok(notes)
    }

    pub fn save_note(&self, note: &Note) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO notes (id, title, content, updated_at, folder_id, status, priority)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
             ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                content = excluded.content,
                updated_at = excluded.updated_at,
                folder_id = excluded.folder_id,
                status = excluded.status,
                priority = excluded.priority;",
            params![note.id, note.title, note.content, note.updated_at, note.folder_id, note.status, note.priority],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_note(&self, id: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM notes WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }
}
