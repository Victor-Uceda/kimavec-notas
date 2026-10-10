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
    #[serde(default, rename = "deletedAt")]
    pub deleted_at: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Folder {
    pub id: String,
    pub name: String,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
    pub color: Option<String>,
    #[serde(default, rename = "parentId")]
    pub parent_id: Option<String>,
    #[serde(default, rename = "deletedAt")]
    pub deleted_at: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BoardCard {
    pub id: String,
    pub title: String,
    #[serde(default)]
    pub content: String,
    pub status: String,
    #[serde(default, rename = "linkedNoteId")]
    pub linked_note_id: Option<String>,
    #[serde(default, rename = "dueDate")]
    pub due_date: Option<String>,
    #[serde(default)]
    pub completed: Option<bool>,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
    #[serde(rename = "updatedAt")]
    pub updated_at: i64,
    #[serde(default, rename = "deletedAt")]
    pub deleted_at: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: String,
    #[serde(default, rename = "noteId")]
    pub note_id: Option<String>,
    pub title: String,
    pub completed: bool,
    pub priority: Option<String>,
    pub assignee: Option<String>,
    #[serde(default, rename = "dueDate")]
    pub due_date: Option<String>,
    pub tags: Option<Vec<String>>,
    pub source: String,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
    #[serde(default, rename = "deletedAt")]
    pub deleted_at: Option<i64>,
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
                priority TEXT,
                deleted_at INTEGER
            );",
            [],
        )
        .map_err(|e| e.to_string())?;

        let _ = conn.execute("ALTER TABLE notes ADD COLUMN folder_id TEXT;", []);
        let _ = conn.execute("ALTER TABLE notes ADD COLUMN status TEXT;", []);
        let _ = conn.execute("ALTER TABLE notes ADD COLUMN priority TEXT;", []);
        let _ = conn.execute("ALTER TABLE notes ADD COLUMN deleted_at INTEGER;", []);

        conn.execute(
            "CREATE TABLE IF NOT EXISTS folders (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                color TEXT,
                parent_id TEXT,
                deleted_at INTEGER
            );",
            [],
        )
        .map_err(|e| e.to_string())?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS board_cards (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                status TEXT NOT NULL,
                linked_note_id TEXT,
                due_date TEXT,
                completed INTEGER NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                deleted_at INTEGER
            );",
            [],
        )
        .map_err(|e| e.to_string())?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                note_id TEXT,
                title TEXT NOT NULL,
                completed INTEGER NOT NULL,
                priority TEXT,
                assignee TEXT,
                due_date TEXT,
                tags TEXT,
                source TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                deleted_at INTEGER
            );",
            [],
        )
        .map_err(|e| e.to_string())?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS meta (
                key TEXT PRIMARY KEY
            );",
            [],
        )
        .map_err(|e| e.to_string())?;

        let seeded: bool = conn
            .query_row("SELECT 1 FROM meta WHERE key = 'seeded'", [], |_| Ok(true))
            .unwrap_or(false);

        if !seeded {
            conn.execute(
                "INSERT OR IGNORE INTO notes (id, title, content, updated_at, folder_id, status, priority, deleted_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                params![
                    "note-1",
                    "Notas de reunión con omar",
                    "<p>Alineación de objetivos de producto y arquitectura del cliente ligero.</p><h2>Acuerdos de la reunión</h2><ul data-type=\"taskList\"><li data-type=\"taskItem\" data-checked=\"false\"><label><input type=\"checkbox\"></label><div><p>Definir contratos de datos y esquema de persistencia @Omar</p></div></li><li data-type=\"taskItem\" data-checked=\"true\"><label><input type=\"checkbox\" checked></label><div><p>Tarea completada [Prioridad Alta] @Omar</p></div></li><li data-type=\"taskItem\" data-checked=\"false\"><label><input type=\"checkbox\"></label><div><p>Implementar sincronización reactiva en tiempo real</p></div></li></ul><h2>Siguientes pasos</h2><p>Se evaluará la integración nativa y el benchmark de consumo de memoria. Mantener interfaz limpia y tipografía cuidada.</p>",
                    1725900000000i64,
                    "folder-01",
                    "in_progress",
                    "high",
                    Option::<i64>::None
                ],
            ).ok();

            conn.execute(
                "INSERT INTO folders (id, name, created_at, color, parent_id, deleted_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params!["folder-01", "01", 1725900000000i64 - 7200000, Option::<String>::None, Option::<String>::None, Option::<i64>::None],
            ).ok();
            conn.execute(
                "INSERT INTO folders (id, name, created_at, color, parent_id, deleted_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params!["folder-02", "02", 1725900000000i64 - 3600000, Option::<String>::None, Option::<String>::None, Option::<i64>::None],
            ).ok();

            conn.execute(
                "INSERT INTO board_cards (id, title, content, status, linked_note_id, due_date, completed, created_at, updated_at, deleted_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
                params!["card-1", "Definir contratos de arquitectura", "Especificar esquemas de persistencia y contratos de comunicación ligera.", "in_progress", "note-1", Option::<String>::None, 0, 1725900000000i64, 1725900000000i64, Option::<i64>::None],
            ).ok();

            conn.execute(
                "INSERT INTO tasks (id, note_id, title, completed, priority, assignee, due_date, tags, source, created_at, deleted_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
                params!["task-1", Option::<String>::None, "Revisar diseño minimalista de la interfaz", 0, "medium", Option::<String>::None, Option::<String>::None, Option::<String>::None, "manual", 1725900000000i64, Option::<i64>::None],
            ).ok();

            let _ = conn.execute("INSERT OR IGNORE INTO meta (key) VALUES ('seeded')", []);
        }
        Ok(())
    }

    // --- NOTAS ---
    pub fn get_all_notes(&self) -> Result<Vec<Note>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare("SELECT id, title, content, updated_at, folder_id, status, priority, deleted_at FROM notes ORDER BY updated_at DESC")
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
                    deleted_at: row.get(7).unwrap_or(None),
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
            "INSERT INTO notes (id, title, content, updated_at, folder_id, status, priority, deleted_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
             ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                content = excluded.content,
                updated_at = excluded.updated_at,
                folder_id = excluded.folder_id,
                status = excluded.status,
                priority = excluded.priority,
                deleted_at = excluded.deleted_at;",
            params![note.id, note.title, note.content, note.updated_at, note.folder_id, note.status, note.priority, note.deleted_at],
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

    // --- CARPETAS ---
    pub fn get_all_folders(&self) -> Result<Vec<Folder>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare("SELECT id, name, created_at, color, parent_id, deleted_at FROM folders ORDER BY created_at ASC")
            .map_err(|e| e.to_string())?;

        let folder_iter = stmt
            .query_map([], |row| {
                Ok(Folder {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    created_at: row.get(2)?,
                    color: row.get(3).unwrap_or(None),
                    parent_id: row.get(4).unwrap_or(None),
                    deleted_at: row.get(5).unwrap_or(None),
                })
            })
            .map_err(|e| e.to_string())?;

        let mut folders = Vec::new();
        for folder in folder_iter {
            if let Ok(f) = folder {
                folders.push(f);
            }
        }
        Ok(folders)
    }

    pub fn save_folder(&self, folder: &Folder) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO folders (id, name, created_at, color, parent_id, deleted_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)
             ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                color = excluded.color,
                parent_id = excluded.parent_id,
                deleted_at = excluded.deleted_at;",
            params![folder.id, folder.name, folder.created_at, folder.color, folder.parent_id, folder.deleted_at],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_folder(&self, id: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM folders WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    // --- TABLERO (BOARD CARDS) ---
    pub fn get_all_board_cards(&self) -> Result<Vec<BoardCard>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare("SELECT id, title, content, status, linked_note_id, due_date, completed, created_at, updated_at, deleted_at FROM board_cards ORDER BY created_at DESC")
            .map_err(|e| e.to_string())?;

        let card_iter = stmt
            .query_map([], |row| {
                let comp_int: i32 = row.get(6).unwrap_or(0);
                Ok(BoardCard {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    content: row.get(2)?,
                    status: row.get(3)?,
                    linked_note_id: row.get(4).unwrap_or(None),
                    due_date: row.get(5).unwrap_or(None),
                    completed: Some(comp_int == 1),
                    created_at: row.get(7)?,
                    updated_at: row.get(8)?,
                    deleted_at: row.get(9).unwrap_or(None),
                })
            })
            .map_err(|e| e.to_string())?;

        let mut cards = Vec::new();
        for card in card_iter {
            if let Ok(c) = card {
                cards.push(c);
            }
        }
        Ok(cards)
    }

    pub fn save_board_card(&self, card: &BoardCard) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let completed_int = if card.completed.unwrap_or(false) { 1 } else { 0 };
        conn.execute(
            "INSERT INTO board_cards (id, title, content, status, linked_note_id, due_date, completed, created_at, updated_at, deleted_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
             ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                content = excluded.content,
                status = excluded.status,
                linked_note_id = excluded.linked_note_id,
                due_date = excluded.due_date,
                completed = excluded.completed,
                updated_at = excluded.updated_at,
                deleted_at = excluded.deleted_at;",
            params![card.id, card.title, card.content, card.status, card.linked_note_id, card.due_date, completed_int, card.created_at, card.updated_at, card.deleted_at],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_board_card(&self, id: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM board_cards WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    // --- TAREAS (TASKS) ---
    pub fn get_all_tasks(&self) -> Result<Vec<Task>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare("SELECT id, note_id, title, completed, priority, assignee, due_date, tags, source, created_at, deleted_at FROM tasks ORDER BY created_at DESC")
            .map_err(|e| e.to_string())?;

        let task_iter = stmt
            .query_map([], |row| {
                let comp_int: i32 = row.get(3).unwrap_or(0);
                let tags_str: Option<String> = row.get(7).unwrap_or(None);
                let tags: Option<Vec<String>> = tags_str.and_then(|s| serde_json::from_str(&s).ok());
                Ok(Task {
                    id: row.get(0)?,
                    note_id: row.get(1).unwrap_or(None),
                    title: row.get(2)?,
                    completed: comp_int == 1,
                    priority: row.get(4).unwrap_or(None),
                    assignee: row.get(5).unwrap_or(None),
                    due_date: row.get(6).unwrap_or(None),
                    tags,
                    source: row.get(8)?,
                    created_at: row.get(9)?,
                    deleted_at: row.get(10).unwrap_or(None),
                })
            })
            .map_err(|e| e.to_string())?;

        let mut tasks = Vec::new();
        for task in task_iter {
            if let Ok(t) = task {
                tasks.push(t);
            }
        }
        Ok(tasks)
    }

    pub fn save_task(&self, task: &Task) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let completed_int = if task.completed { 1 } else { 0 };
        let tags_str = task.tags.as_ref().and_then(|t| serde_json::to_string(t).ok());
        conn.execute(
            "INSERT INTO tasks (id, note_id, title, completed, priority, assignee, due_date, tags, source, created_at, deleted_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
             ON CONFLICT(id) DO UPDATE SET
                note_id = excluded.note_id,
                title = excluded.title,
                completed = excluded.completed,
                priority = excluded.priority,
                assignee = excluded.assignee,
                due_date = excluded.due_date,
                tags = excluded.tags,
                source = excluded.source,
                deleted_at = excluded.deleted_at;",
            params![task.id, task.note_id, task.title, completed_int, task.priority, task.assignee, task.due_date, tags_str, task.source, task.created_at, task.deleted_at],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_task(&self, id: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM tasks WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }
}
