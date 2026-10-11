# Patrones de Diseño

Este documento describe los patrones de diseño aplicados en la arquitectura de interfaz de usuario y en la ingeniería de software de la aplicación.

---

## 1. Patrones de Arquitectura de Interfaz

### 1.1. Workspace Modular con Carpetas y Tablero Unificado To do
- **Columna 1 (Dock - 64px):** Navegación global persistente y cambio rápido de vistas (Inicio/Nota rápida, Explorador de Carpetas y Notas, Tablero unificado To do, Grafo de Red, Ajustes).
- **Columna 2 (Navegador de Carpetas - 256px):** Gestión de carpetas personalizadas (`01`, `02`), árbol jerárquico de subcarpetas, y creación instantánea de notas.
- **Columna 3 (Lienzo / Editor Central):** Hoja física flotante aislada de distracciones (*Zero-distraction Canvas*), con flujo de arranque directo en **Nota Rápida** en blanco.
- **Vista Especial (Tablero Unificado To do):** Pantalla en 2 columnas (*Tus tareas* en 3/5 de ancho; *En Progreso* y *Completadas* en 2/5 de ancho) con arrastre fluido, checkboxes de auto-movimiento y vinculación a notas vivas.
- **Eliminación del Antiguo Panel Lateral:** Se retiró el 4º panel lateral para evitar duplicación de información y código muerto, concentrando la redacción en el editor y la gestión global en **To do**.

### 1.2. Single Source of Truth (SSOT) con Flujo Unidireccional
- El documento Markdown/AST de la nota es la única fuente de verdad para las tareas que residen en las notas.
- Las tareas dentro de las notas se leen y actualizan directamente en el cuerpo Markdown/HTML de la nota activa sin tablas paralelas.

### 1.3. Component-Driven Architecture (Diseño Atómico)
- **Átomos:** Botón de acción `action-primary`, Checkbox (`radius-checkbox`), Badges (`badge-high`, `badge-tag`).
- **Moléculas:** Tarjeta de tarea del tablero To do, botón de toolbar con tooltip y estado activo, píldora de enlace sináptico `[[Wikilink]]`.
- **Organismos:** Toolbar del editor de texto con cápsula de formato, Árbol de carpetas `FolderSidebar`, Dock de navegación lateral.
- **Templates:** Shell principal `AppShell` con soporte responsive y distribución limpia.

---

## 2. Patrones de Software y Estado (GoF & Reactivos)

### 2.1. Reactividad y Sincronización en Tiempo Real
- **Problema:** Cada vez que el usuario escribe o edita una tarea en el editor (ej. `- [ ] Preparar balance para @Omar`), las menciones, prioridades y tags deben estructurarse de inmediato sin retrasar el tipeo.
- **Solución:** El editor sincroniza reactivamente con debounce en el store de Zustand. El parser `RuleBasedTaskParser` analiza el AST de forma determinista para la paleta de comandos y el grafo sin bloquear el hilo principal.

### 2.2. Command Pattern (TipTap & ProseMirror Transactions)
- **Problema:** Los botones de formato (`B`, `I`, listas, citas) y atajos de teclado (`Ctrl+B`, `Ctrl+Z`) deben operar de forma consistente, atómica y reversible sobre la selección activa.
- **Solución:** En lugar de implementar clases de comando manuales y pesadas, la aplicación aprovecha el motor de transacciones y comandos encadenables de TipTap/ProseMirror (`editor.chain().focus().toggleBold().run()`). Cada mutación del documento se despacha como un comando inmutable que se añade al árbol de historial (`undoManager`), desacoplando la interfaz de usuario de las manipulaciones directas del DOM.

### 2.3. Composite Pattern (Jerarquía de Tareas y Subtareas)
- **Problema:** Una nota puede contener múltiples bloques de texto, subtareas anidadas o tareas compuestas en varios niveles de sangría.
- **Solución:** Se modela como una estructura jerárquica en árbol donde la entidad `Task` (con alias de compatibilidad `export type TaskItem = Task;`) contiene una colección recursiva de subtareas:

```typescript
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  priority?: TaskPriority;
  tags?: string[];
  subtasks?: Task[];
  noteId?: string;
  source?: 'markdown' | 'manual';
  createdAt?: number;
}
```
Los componentes visuales y extractores procesan este árbol recursivamente mediante utilitarios como `findTaskById` y `flattenTasks`.

### 2.4. Strategy Pattern (Extracción Modular de Metadatos)
- **Problema:** En el futuro se pueden agregar nuevas reglas de sintaxis (fechas, menciones, etiquetas, prioridades) sin modificar el núcleo del editor.
- **Solución:** Se aplican estrategias intercambiables de extracción:
  - `MentionExtractor`: Identifica tokens `@usuario`.
  - `PriorityExtractor`: Identifica flags de prioridad `!alta` o badges contextuales.
  - `DateExtractor`: Detecta expresiones temporales (`hoy`, `mañana`, `YYYY-MM-DD`).
  - `TagExtractor`: Detecta etiquetas `#tema`.
  - Todas implementan la interfaz `MetadataExtractorStrategy` y se conectan a `RuleBasedTaskParser`.

---

## 3. Reglas Arquitectónicas y Antipatrones Prohibidos (Lecciones de Auditoría)

Las siguientes reglas son de **obligatorio cumplimiento** en futuras modificaciones:

### 3.1. Prohibición de Persistencia Paralela (Respeto Estricto de SSOT)
- **Claridad arquitectónica:** Las tareas documentales nacen y mueren en el cuerpo de la nota. `RuleBasedTaskParser` las proyecta en memoria; no se duplican en tablas SQLite de Tauri. Por otro lado, las tareas rápidas creadas fuera de cualquier documento se guardan de forma aislada en `taskRepository.ts`.
- **Regla:** **Queda estrictamente prohibido crear esquemas de persistencia o tablas separadas para entidades que nacen del AST/Markdown de la nota.** Si el documento Markdown es la fuente única de verdad, las tareas se leen y se escriben directamente en el cuerpo de la nota.

### 3.2. Prohibición de Extracción Monolítica (Obligatoriedad de Strategy)
- **Error cometido en el pasado:** Acoplar todas las expresiones regulares de `@menciones`, prioridades y fechas dentro de una sola función procedural gigante.
- **Regla:** Cualquier extracción de sintaxis en el editor debe encapsularse en una clase que implemente `MetadataExtractorStrategy` y registrarse en `RuleBasedTaskParser`.

### 3.3. Obligatoriedad de Jerarquía en Tareas (Composite Pattern)
- **Error cometido en el pasado:** Tipar `Task` con un modelo plano y no renderizar subtareas en `TaskItem`, perdiendo la jerarquía que TipTap y Markdown permiten.
- **Regla:** El tipo de dominio debe mantener `subtasks?: Task[]` y los componentes de tareas (`TaskItem`) deben renderizarse de forma recursiva. Cualquier búsqueda por ID o conteo debe emplear utilitarios recursivos (`findTaskById`, `flattenTasks`).

### 3.4. Desacoplamiento de Tarjetas del Tablero vs Notas del Editor (Reference Pattern)
- **Regla:** Las tarjetas del tablero Kanban (`BoardCard`) son una entidad independiente de gestión ágil. Tienen su propio repositorio y ciclo de vida. Si bien pueden referenciar una nota normal mediante un puntero `linkedNoteId`, no deben sobreescribir ni mutar el documento Markdown de la nota ni forzar a una nota normal a ser una tarjeta del tablero. La relación es de asociación/referencia unidireccional y opcional.

