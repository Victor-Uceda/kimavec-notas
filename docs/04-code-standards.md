# CODE STANDARDS

## 1. Propósito

Este documento define las reglas obligatorias para escribir código en el proyecto.

El objetivo es mantener un código:

* limpio
* legible
* mantenible
* testeable
* predecible
* eficiente
* extensible
* simple

Aplicar estas reglas a todo código nuevo y al modificar código existente.

No introducir complejidad únicamente para cumplir un patrón.

---

## 2. PRINCIPIOS FUNDAMENTALES

Aplicar siempre:

* Clean Code
* SOLID
* DRY
* KISS
* YAGNI
* Separation of Concerns
* Single Responsibility
* Dependency Inversion
* Composition over Inheritance

Regla principal:

> La solución más simple que resuelve correctamente el problema es preferible a una arquitectura más compleja.

No sobreingenierizar.

No crear abstracciones "por si algún día se necesitan".

---

## 3. CLEAN CODE

### 3.1 Nombres

Los nombres deben explicar la intención.

Incorrecto:

```ts
const d = getData();
const x = filter(d);
```

Correcto:

```ts
const notes = getNotes();
const pendingTasks = filterPendingTasks(notes);
```

Preferir nombres específicos sobre nombres genéricos.

Evitar:

```text
data
item
thing
temp
obj
value
result
manager
helper
utils
misc
```

cuando exista un nombre más preciso.

---

## 4. VARIABLES

Una variable debe representar una sola idea.

Incorrecto:

```ts
const data = {
  n: "Meeting",
  t: true,
  p: 3
};
```

Correcto:

```ts
const task = {
  title: "Meeting",
  completed: true,
  priority: "high"
};
```

Evitar variables mutables cuando no sean necesarias.

Preferir:

```ts
const
```

sobre:

```ts
let
```

cuando el valor no necesita reasignación.

---

## 5. FUNCIONES

Una función debe hacer una sola cosa.

Incorrecto:

```ts
async function saveNote(note: Note) {
  validateNote(note);
  updateEditor();
  await database.save(note);
  showToast();
  refreshTasks();
}
```

La función mezcla:

* validación
* UI
* persistencia
* sincronización

Separar responsabilidades.

Ejemplo:

```ts
validateNote(note);

await saveNote(note);

refreshTasks(note);
```

Cada función debe tener una responsabilidad claramente identificable.

---

## 6. TAMAÑO DE FUNCIONES

Evitar funciones excesivamente largas.

Como referencia:

* ideal: menos de 30 líneas
* aceptable: hasta aproximadamente 50 líneas
* más de 50 líneas: revisar si puede dividirse

No dividir artificialmente una función únicamente para reducir líneas.

La responsabilidad es más importante que el número exacto de líneas.

---

## 7. COMPLEJIDAD

Evitar:

```ts
if (a) {
  if (b) {
    if (c) {
      if (d) {
        ...
      }
    }
  }
}
```

Preferir guard clauses:

```ts
if (!a) return;
if (!b) return;
if (!c) return;
if (!d) return;
```

Reducir nesting siempre que sea posible.

Evitar funciones con demasiadas ramas.

Si una función necesita demasiados `if`, `switch` o condiciones anidadas, evaluar un patrón como Strategy.

---

## 8. SOLID

### Single Responsibility Principle

Una clase, módulo o función debe tener una responsabilidad principal.

Incorrecto:

```text
NoteService
 ├── SQLite
 ├── editor
 ├── parser
 ├── UI
 ├── filesystem
 └── búsqueda
```

Correcto:

```text
NoteRepository
TaskParser
NoteService
SearchService
FileService
```

---

### Open/Closed Principle

El código debería poder extenderse sin modificar constantemente la lógica existente.

Ejemplo:

Para distintos algoritmos de extracción:

```ts
interface TaskParser {
  parse(content: string): ParsedTask[];
}
```

Implementaciones:

```text
RuleBasedTaskParser
AiTaskParser
```

No duplicar todo el sistema para cambiar el parser.

---

### Liskov Substitution Principle

Una implementación debe poder sustituir a la abstracción que representa sin romper el comportamiento esperado.

No crear interfaces artificiales solamente para aparentar arquitectura.

---

### Interface Segregation Principle

Preferir interfaces pequeñas y específicas.

Incorrecto:

```ts
interface ApplicationManager {
  saveNote();
  search();
  deleteTask();
  uploadFile();
  authenticate();
  exportData();
}
```

Correcto:

```ts
interface NoteRepository {}
interface TaskRepository {}
interface SearchService {}
```

---

### Dependency Inversion Principle

Las capas superiores no deben depender directamente de implementaciones concretas cuando exista una razón real para desacoplarlas.

Preferir:

```text
Service
  ↓
Repository interface
  ↓
SQLiteRepository
```

Pero NO crear interfaces innecesarias para cada función trivial.

---

## 9. DRY

No duplicar lógica de negocio.

Incorrecto:

```ts
function createTask() {
  validateTitle();
  ...
}

function updateTask() {
  validateTitle();
  ...
}
```

Si la validación representa la misma regla:

```ts
validateTaskTitle(title);
```

Sin embargo:

> DRY no significa eliminar toda repetición visual o textual.

No abstraer código únicamente porque dos fragmentos "se parecen".

Solo compartir código cuando representan realmente la misma responsabilidad.

---

## 10. KISS

Preferir:

```text
función simple
+
datos claros
+
flujo directo
```

sobre:

```text
factory
+
manager
+
adapter
+
facade
+
wrapper
```

para resolver un problema sencillo.

La complejidad debe estar justificada.

---

## 11. YAGNI

No implementar funcionalidades que todavía no son necesarias.

No crear anticipadamente:

* sistemas de sincronización
* abstracciones de plugins
* event buses
* microservicios
* sistemas de permisos
* caches complejas
* repositorios remotos

cuando el proyecto todavía no los necesita.

Preparar extensibilidad sin implementar infraestructura innecesaria.

---

## 12. COMPOSICIÓN

Preferir composición sobre herencia.

En React:

```tsx
<TaskPanel>
  <TaskList />
</TaskPanel>
```

en lugar de crear jerarquías de componentes mediante herencia.

En Rust, preferir composición mediante structs, traits y funciones pequeñas.

---

## 13. PATRONES DE DISEÑO

Los patrones deben utilizarse únicamente cuando resuelvan un problema real.

Patrones permitidos cuando sean apropiados:

```text
Repository
Service Layer
Strategy
Adapter
Factory
Command
Observer/Event-driven
State
Builder
Dependency Injection
```

No utilizar un patrón únicamente porque "es buena práctica".

Antes de crear un patrón preguntar:

1. ¿Existe un problema real?
2. ¿La abstracción reduce complejidad?
3. ¿Facilita testing o mantenimiento?
4. ¿La solución seguiría siendo clara sin el patrón?

Si no aporta valor, no utilizarlo.

---

## 14. REACT

### Componentes

Un componente debe tener una responsabilidad clara.

Evitar:

```tsx
<App.tsx>
```

con cientos de líneas y toda la lógica del sistema.

Separar:

```text
AppShell
NoteEditor
EditorToolbar
TaskPanel
TaskList
TaskItem
TaskForm
```

---

## 15. REACT STATE

No convertir todos los datos en estado global.

Usar:

### Local state

Para:

* inputs
* modales
* estados temporales
* selección local

### Zustand

Para:

* estado de UI compartido
* navegación
* filtros
* preferencias de interfaz

### SQLite

Para:

* notas
* tareas
* tags
* historial
* datos persistentes

SQLite es la fuente de verdad.

---

## 16. PROPS

Evitar prop drilling excesivo.

Si un componente necesita demasiadas props relacionadas, revisar:

* composición
* extracción de componente
* estado local
* Zustand

No utilizar Zustand automáticamente para solucionar cualquier prop drilling.

---

## 17. HOOKS

Crear un custom hook cuando una lógica:

* se reutiliza
* contiene comportamiento complejo
* necesita aislar efectos

Ejemplo:

```ts
useNoteAutosave()
useTaskSync()
useNoteSearch()
```

No crear hooks para simples wrappers innecesarios.

---

## 18. EFFECTS

No utilizar `useEffect` para lógica que pueda ejecutarse directamente.

Incorrecto:

```tsx
useEffect(() => {
  setFilteredTasks(tasks.filter(...));
}, [tasks]);
```

Preferir:

```ts
const filteredTasks = tasks.filter(...);
```

Usar `useEffect` únicamente cuando exista una interacción real con:

* sistema externo
* API
* IPC
* filesystem
* eventos
* lifecycle externo

---

## 19. MEMORIZACIÓN

No utilizar automáticamente:

```ts
useMemo
useCallback
React.memo
```

Usarlos cuando exista una razón de rendimiento comprobable o una referencia estable necesaria.

La optimización prematura aumenta complejidad.

---

## 20. TYPESCRIPT

Usar TypeScript strict.

No utilizar:

```ts
any
```

salvo una situación excepcional y documentada.

Preferir:

```ts
unknown
```

cuando el tipo realmente sea desconocido.

Nunca usar `as` para ocultar errores de tipado.

Incorrecto:

```ts
const task = response as Task;
```

cuando no se ha validado realmente el objeto.

Preferir validación explícita.

---

## 21. TYPES

Los tipos deben representar el dominio.

Ejemplo:

```ts
type TaskPriority = "low" | "medium" | "high";

type TaskSource = "manual" | "automatic";

interface Task {
  id: string;
  noteId: string;
  title: string;
  completed: boolean;
  priority: TaskPriority;
  assignee: string | null;
  source: TaskSource;
}
```

Evitar tipos excesivamente genéricos.

---

## 22. ENUMS

Cuando un conjunto de valores es cerrado y pequeño, utilizar unions tipadas o enums según la necesidad.

Preferir frecuentemente:

```ts
type TaskPriority = "low" | "medium" | "high";
```

en lugar de enums innecesarios.

---

## 23. ASYNC / AWAIT

Preferir:

```ts
const note = await getNote(id);
```

sobre cadenas complejas de `.then()`.

Manejar errores explícitamente.

Nunca ignorar silenciosamente una operación fallida.

---

## 24. ERRORES

No ocultar errores.

Incorrecto:

```ts
try {
  await saveNote();
} catch {}
```

Correcto:

```ts
try {
  await saveNote();
} catch (error) {
  logger.error("Failed to save note", error);
  throw error;
}
```

Los errores deben:

* registrarse apropiadamente
* propagarse cuando corresponda
* convertirse en mensajes útiles para la UI

---

## 25. RUST

Utilizar Rust idiomático.

Preferir:

```rust
Result<T, E>
```

sobre devolver valores ambiguos.

Evitar:

```rust
unwrap()
expect()
```

en código de producción cuando el error pueda manejarse correctamente.

`unwrap()` puede utilizarse cuando la invariancia esté garantizada y sea realmente imposible fallar, pero debe ser una decisión consciente.

---

## 26. RUST OWNERSHIP

Evitar clones innecesarios.

No utilizar:

```rust
.clone()
```

simplemente para silenciar problemas de ownership.

Antes evaluar:

* referencias
* borrowing
* ownership
* lifetimes
* mover valores cuando sea apropiado

Optimizar únicamente después de mantener claridad.

---

## 27. TAURI COMMANDS

Los comandos Tauri deben ser pequeños.

Incorrecto:

```rust
#[tauri::command]
fn update_note(...) {
    // validación
    // lógica
    // SQL
    // parser
    // eventos
    // filesystem
    // etc.
}
```

Correcto:

```text
Tauri Command
      ↓
Service
      ↓
Repository
      ↓
SQLite
```

Los comandos son una frontera de comunicación, no un lugar para colocar toda la lógica del sistema.

---

## 28. IPC

No utilizar IPC excesivamente.

Incorrecto:

```text
cada tecla
→ IPC
→ Rust
→ SQLite
```

Correcto:

```text
teclado
→ estado local
→ debounce
→ IPC
→ Rust
→ SQLite
```

Agrupar operaciones cuando sea razonable.

No transferir datos innecesariamente grandes entre React y Rust.

---

## 29. SQL

Nunca dispersar SQL por los componentes React.

Prohibido:

```tsx
// SQL aquí
```

El acceso debe estar aislado en repositories.

Ejemplo:

```text
TaskRepository
NoteRepository
SearchRepository
```

Las queries deben ser:

* claras
* parametrizadas
* pequeñas
* testeables

Evitar N+1 queries.

---

## 30. TRANSACCIONES

Usar transacciones cuando varias operaciones deban ser atómicas.

Ejemplo:

```text
crear nota
+
crear tareas
+
actualizar relaciones
```

Si una operación falla y puede dejar datos inconsistentes, debe utilizar una transacción.

---

## 31. PERFORMANCE

No optimizar mediante suposiciones.

Primero identificar:

* dónde ocurre el coste
* por qué ocurre
* cómo medirlo

Después optimizar.

Prioridades:

```text
Correctitud
↓
Simplicidad
↓
Medición
↓
Optimización
```

---

## 32. LOGGING

Los logs deben aportar información útil.

Evitar:

```ts
console.log("a");
console.log(data);
console.log("here");
console.log("test");
```

Preferir mensajes con contexto:

```ts
logger.error("Failed to persist note", {
  noteId,
  error
});
```

No registrar información sensible.

Eliminar logs temporales antes de producción.

---

## 33. COMENTARIOS

El código debe explicarse principalmente mediante nombres y estructura.

Evitar:

```ts
// Incrementamos i en 1
i++;
```

Los comentarios deben explicar:

* por qué existe una decisión
* una restricción técnica
* una optimización no obvia
* una regla de negocio

No explicar lo que el código ya deja claro.

---

## 34. MAGIC NUMBERS

Evitar valores mágicos.

Incorrecto:

```ts
if (tasks.length > 100) {}
```

Preferir:

```ts
const MAX_VISIBLE_TASKS = 100;
```

Cuando el valor representa una regla conceptual.

---

## 35. CONSTANTES

Las constantes relacionadas deben estar agrupadas de manera clara.

No crear un archivo global gigantesco de constantes sin necesidad.

Colocar una constante cerca del dominio al que pertenece cuando sea posible.

---

## 36. VALIDACIÓN

Validar datos en los límites del sistema.

Ejemplo:

```text
UI
 ↓
Tauri command
 ↓
validation
 ↓
service
 ↓
repository
```

No confiar únicamente en la validación del frontend.

Los comandos Rust deben validar entradas importantes.

---

## 37. ARCHIVOS

Evitar archivos gigantes.

Como referencia:

* un componente principal no debería convertirse en un archivo de cientos de líneas
* separar responsabilidades cuando la lectura comience a deteriorarse

No dividir archivos arbitrariamente.

La división debe representar una responsabilidad real.

---

## 38. ORGANIZACIÓN

Organizar por funcionalidad cuando sea útil.

Preferir:

```text
features/
  notes/
  tasks/
  search/
```

sobre carpetas genéricas gigantes:

```text
components/
utils/
helpers/
services/
```

No crear carpetas "utils" que terminen conteniendo cualquier cosa.

---

## 39. UTILIDADES

Una utilidad debe tener una responsabilidad clara.

Evitar:

```text
utils.ts
```

con cientos de funciones no relacionadas.

Preferir:

```text
date.ts
string.ts
task.ts
validation.ts
```

cuando exista suficiente complejidad para justificarlo.

---

## 40. DEPENDENCIAS

Antes de instalar una librería:

1. verificar si ya existe una solución en el proyecto
2. verificar si el problema es suficientemente complejo
3. revisar tamaño y mantenimiento de la dependencia
4. evaluar impacto en el bundle
5. evaluar impacto en rendimiento
6. considerar si puede resolverse con código propio pequeño

No agregar dependencias por comodidad cuando unas pocas líneas resuelven el problema de manera más clara.

---

## 41. SEGURIDAD

Nunca:

* confiar en input del usuario
* ejecutar comandos del sistema sin validación
* almacenar secretos en código
* introducir credenciales hardcodeadas
* desactivar controles de seguridad para simplificar desarrollo

Las operaciones nativas deben pasar por las APIs controladas de Tauri.

Mantener el principio de mínimo privilegio.

---

## 42. TESTABILIDAD

La lógica de negocio debe poder probarse sin depender de React.

Ejemplo:

```text
TaskParser
TaskSynchronizer
TaskService
```

deben poder probarse independientemente de la UI.

Preferir funciones puras para lógica determinista.

---

## 43. REFACTORIZACIÓN

Cuando se modifique código existente:

1. comprender primero el código
2. no reescribir todo innecesariamente
3. mantener comportamiento existente
4. mejorar únicamente lo necesario
5. ejecutar tests/build después

No realizar refactors masivos sin justificación.

---

## 44. REGLA DE ABSTRACCIÓN

Crear una abstracción únicamente cuando exista al menos una razón concreta:

* reutilización real
* complejidad real
* necesidad de testing
* desacoplamiento necesario
* múltiples implementaciones
* límite arquitectónico claro

No crear:

```text
BaseManager
AbstractService
GenericProcessor
CommonHelper
UniversalFactory
```

sin una necesidad real.

---

## 45. REGLA DE PRIORIDAD

Cuando dos buenas prácticas entren en conflicto:

```text
Correctitud
>
Seguridad
>
Claridad
>
Mantenibilidad
>
Rendimiento
>
Abstracción
```

El rendimiento debe optimizarse sin destruir claridad, salvo que exista una necesidad medida que justifique el compromiso.

---

## 46. CHECKLIST ANTES DE TERMINAR CÓDIGO

Antes de considerar terminada una implementación comprobar:

### Diseño

* ¿Cada componente tiene una responsabilidad clara?
* ¿Existe alguna abstracción innecesaria?
* ¿Se está sobreingenierizando?
* ¿Hay lógica duplicada?

### TypeScript

* ¿Existe `any`?
* ¿Los tipos representan correctamente el dominio?
* ¿Se están ocultando errores mediante `as`?

### React

* ¿Se está usando estado global innecesariamente?
* ¿Existe un `useEffect` innecesario?
* ¿Hay componentes demasiado grandes?
* ¿Se puede simplificar la composición?

### Rust

* ¿Hay `unwrap()` innecesarios?
* ¿Hay clones innecesarios?
* ¿Los errores están correctamente manejados?
* ¿Las responsabilidades están separadas?

### Tauri

* ¿Se están realizando demasiadas llamadas IPC?
* ¿El command contiene demasiada lógica?
* ¿Se están enviando datos innecesarios?

### Database

* ¿La query está parametrizada?
* ¿Existe N+1?
* ¿Hace falta una transacción?
* ¿Existen índices adecuados?

### General

* ¿El código es fácil de leer sin documentación adicional?
* ¿El nombre de las funciones explica qué hacen?
* ¿La solución puede ser más simple?
* ¿Se agregaron dependencias innecesarias?

---

## 47. REGLA FINAL

Antes de añadir código, preguntarse:

> ¿Cuál es la solución más simple, clara, segura y mantenible que resuelve exactamente este problema?

Implementar esa solución.

No aplicar patrones por obligación.

No añadir abstracciones por anticipación.

No añadir dependencias sin necesidad.

No duplicar lógica.

No esconder errores.

No sacrificar claridad por una falsa arquitectura "enterprise".

El código debe ser lo suficientemente bueno para crecer, pero suficientemente simple para entenderse.

---

## 48. LECCIONES DE AUDITORÍA Y ANTIPATRONES PROHIBIDOS (LISTA NEGRA)

Esta sección recopila malas prácticas y errores reales detectados durante la auditoría del proyecto. **Quedan terminantemente prohibidos en cualquier contribución futura**:

### 48.1. Arquitectura Híbrida de Tareas y Respeto de SSOT
- **Claridad de diseño:** La aplicación distingue formalmente dos tipos de tareas:
  1. **Tareas Documentales / Contextuales (SSOT = Markdown/SQLite):** Tareas redactadas dentro de las notas (`- [ ] tarea`). Su única fuente de verdad es el cuerpo Markdown/HTML de la nota. Se parsean con `RuleBasedTaskParser`. SQLite (`db.rs`) solo persiste la tabla `notes`; no almacena tablas redundantes de tareas embebidas.
  2. **Tareas Rápidas / Independientes (Standalone Tasks):** Tareas creadas directamente en la vista To-Do sin asociarse a una nota. Tienen su propio ciclo de vida persistido en `taskRepository.ts` (`LocalStorageTaskRepository`).
- **Regla:** Queda prohibido duplicar la persistencia de una misma tarea. Si una tarea vive dentro del Markdown de una nota, jamás debe crearse un registro paralelo en `taskRepository` ni en bases de datos separadas.

### 48.2. Prohibido usar `as Type` en Colecciones Heterogéneas (TypeScript Strict)
- **Error histórico:** En `CommandPalette.tsx` se agrupaban notas y tareas y luego se forzaba su tipo con `(target.item as Note).id` y `const task = target.item as Task;`.
- **Regla:** Está prohibido usar `as` para eludir la inferencia de TypeScript. Se deben definir **uniones discriminadas estrictas**:
  ```typescript
  type SearchResult =
    | { type: 'note'; item: Note }
    | { type: 'task'; item: Task };
  ```
  TypeScript estrechará (*type narrowing*) el tipo de forma automática y 100% segura al evaluar `if (res.type === 'note')`.

### 48.3. Prohibido el `unwrap()` en Conexiones y Mutexes de Rust
- **Error histórico:** En `db.rs` se usaba `let conn = self.conn.lock().unwrap();`. Si el mutex se envenena ante cualquier panic previo, la aplicación completa se cierra abruptamente.
- **Regla:** En código de producción de Tauri, usar siempre manejo de errores idiomático:
  ```rust
  let conn = self.conn.lock().map_err(|e| e.to_string())?;
  ```

### 48.4. Prohibido Ignorar Operaciones de Base de Datos con `let _ = ...`
- **Error histórico:** En llamadas a base de datos de Tauri, ignorar los `Result` con `let _ = conn.execute(...)` oculta fallos de persistencia sin transacciones atómicas.
- **Regla:** Cualquier operación con efectos en la base de datos debe evaluar sus errores (`conn.execute(...)?`). Si se ejecutan múltiples sentencias relacionadas, **deben** estar dentro de una transacción (`conn.transaction()`).

### 48.5. Prohibido Parsear Metadatos con Regex Monolíticas
- **Error histórico:** Se agrupaban todas las regexes de `@menciones` y prioridades en una única función procedimental.
- **Regla:** Siempre usar el **Strategy Pattern** (`MetadataExtractorStrategy` y `RuleBasedTaskParser`). Cada nueva regla de sintaxis (fechas, etiquetas, asignados) debe ser una clase aislada y testeable independientemente.

### 48.6. Prohibido Aplanar el Modelo de Tareas (Composite Pattern Obligatorio)
- **Error histórico:** Se ignoraba la propiedad `subtasks` en `Task`, rompiendo la jerarquía cuando el usuario anidaba tareas en el editor.
- **Regla:** El modelo `Task` debe soportar `subtasks?: Task[]`, y los componentes visuales (`TaskItem`) deben renderizarse recursivamente. Las operaciones de búsqueda y conteo deben usar utilitarios recursivos como `findTaskById` y `flattenTasks`.

### 48.7. Prohibido Ignorar Errores Asíncronos Silenciosamente
- **Error histórico:** En el store se hacía `noteRepository.save(note).catch(console.error)`. Si la base de datos o el almacenamiento fallan, el usuario continúa escribiendo sin saber que sus cambios no se guardan.
- **Regla:** Todo fallo de persistencia debe registrarse y reflejarse de forma visible para el usuario (mediante un estado de error, toast o banner).

### 48.8. Ciclo de Persistencia y Salvaguarda de Notas (`noteSaveManager.ts`)
- **`isNoteEmpty(note)`:** Determina si una nota carece de título y contenido significativo (tras eliminar etiquetas HTML). Evita persistir notas basura o creadas por error al hacer clic rápido.
- **`debouncedSaveNote(note)`:** Encola el guardado en segundo plano con un temporizador de 400ms para evitar escrituras continuas a disco mientras el usuario tipea.
- **`flushPendingSave()`:** Fuerza el guardado inmediato y cancela el temporizador pendiente. Se ejecuta obligatoriamente al navegar entre pestañas, cambiar de vista o cerrar el editor, garantizando cero pérdida de datos.
- **`cleanEmptyNotes()`:** Rutina de limpieza que purga notas temporales vacías (sin título y sin contenido) del store y de la persistencia para mantener el grafo y el árbol de carpetas limpios.

### 48.9. Editor Rápido de Inicio (`HomeQuickNoteView`)
- La vista de Inicio incorpora su propia instancia aislada de TipTap configurada con `TaskList`, `TaskItem` y autoguardado en `localStorage`. Funciona como borrador / inbox rápido sin requerir seleccionar o crear una carpeta previa.

### 48.10. Soft-Delete en Tableros (`BoardCard.deletedAt`)
- El modelo `BoardCard` incluye `deletedAt?: number` para soportar borrado lógico / papelera en las tarjetas del tablero Kanban sin destruir inmediatamente la integridad referencial con notas vinculadas (`linkedNoteId`).

### 48.11. Navegación Unificada Tablero / Tareas (`NavigationItem`)
- La unión de tipos `NavigationItem` incluye `'board'` y `'todo'`. En `Dock.tsx`, el botón "To do" activa la vista del tablero Kanban/Tareas (`onSelectItem('board')`), manteniendo compatibilidad semántica en el router interno.

