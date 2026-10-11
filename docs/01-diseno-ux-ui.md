# Diseño UX / UI & Tokens de Diseño

Este documento contiene la especificación completa de la experiencia de usuario (UX), los tokens visuales (UI), la geometría y la arquitectura del layout de la aplicación.

---

## 1. Filosofía de Experiencia de Usuario (UX)

- **Foco sin fricción (*Zero-distraction Canvas*):** El lienzo de edición simula una hoja física flotante con elevación suave sobre un canvas neutro (`#F5F6F8` / `#000000` en modo oscuro OLED), separando visualmente el espacio reflexivo de escritura de los paneles de navegación.
- **Gestión Unificada y Libre de Redundancias (To do):** Se eliminó el antiguo panel lateral flotante por redundante. Las tareas se gestionan con interactividad nativa dentro del propio texto de la nota (listas interactivas TipTap) y globalmente en la vista unificada **To do**, eliminando la duplicación de código y el ruido visual innecesario.
- **Jerarquía visual instantánea:** Uso intencional de badges (`badge-high-bg`, `badge-tag-bg`) para identificar al instante prioridades y menciones (`@Omar`) sin saturar la lectura.
- **Microinteracciones y feedback:**
  - *Checkbox interactivo:* Transición fluida de borde inactivo (`border-subtle`) a relleno activo con check (`action-primary`).
  - *Tachado y atenuación:* Texto tachado acompañado de cambio a `text-disabled` (`#9CA3AF`) para reducir carga cognitiva.
  - *Pill dock activo:* Contenedor gris suave (`#E8EAED` / `#1F1F23`) con radio `12px` que indica la ruta actual.
- **Minimalismo Estricto en Cabeceras y Vistas:**
  - *Solo el nombre/título:* Las cabeceras principales de vistas y paneles (ej. `Notas`, `To do`, `Inicio`) deben contener **únicamente el título conciso**.
  - *Sin subtítulos explicativos:* Prohibido colocar subtítulos o descripciones secundarias que saturen o añadan ruido visual innecesario.
  - *Sin badges ni contadores invasivos en títulos:* Mantener el título limpio y sin etiquetas decorativas redundantes en la cabecera.
  - *Sin buscadores innecesarios en paneles:* Mantener las cabeceras despojadas de cajas de búsqueda superfluas, priorizando el contenido limpio del usuario.

---

## 2. Tokens de Color (UI Tokens)

| Token | HEX / Valor | Aplicación en la Interfaz |
| :--- | :--- | :--- |
| `surface-canvas` | `#F5F6F8` | Fondo de la ventana general y margen perimetral. |
| `surface-editor` | `#FFFFFF` | Contenedor principal de la hoja de escritura flotante. |
| `surface-sidebar` | `#FBFBFD` | Fondo plano del panel derecho ("Tareas") y rail izquierdo. |
| `surface-active-pill` | `#E8EAED` | Fondo del contenedor del icono activo en el dock (ej. Home). |
| `text-primary` | `#111827` | Encabezados, títulos de nota y cuerpo de texto activo. |
| `text-secondary` | `#6B7280` | Iconos inactivos, metadatos y botones de barra de herramientas. |
| `text-disabled` | `#9CA3AF` | Tareas completadas con `text-decoration: line-through`. |
| `border-subtle` | `#E5E7EB` | Borde de checkboxes inactivos (`1.5px solid`) y divisores. |
| `action-primary` | `#0D0D0D` | Botón circular superior derecho `[+]`, checkbox activo `[✓]`. |
| `badge-high-bg` | `#FEE2E2` | Fondo de la pastilla "Prioridad Alta". |
| `badge-high-text` | `#B91C1C` | Texto de la pastilla "Prioridad Alta". |
| `badge-tag-bg` | `#F3F4F6` | Fondo de la etiqueta de mención/usuario (`@Omar`). |
| `badge-tag-text` | `#4B5563` | Icono y texto de la etiqueta `@Omar`. |

---

## 3. Tipografía y Geometría

### 3.1. Familia Tipográfica
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

### 3.2. Escala Tipográfica

| Token | Tamaño | Font Weight | Line Height | Letter Spacing | Uso / Contexto |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `text-title-panel` | `18px` | 600 (Semi-bold) | `24px` | Normal | Título de panel ("Tareas"). |
| `text-h1` | `17px` | 700 (Bold) | `24px` | Normal | Título principal de nota ("Notas de reunión con omar"). |
| `text-body` | `14px` | 400 (Regular) | `22px` | Normal | Párrafos y cuerpo de la nota. |
| `text-task` | `13px` | 450 (Book/Normal) | `18px` | Normal | Ítems de tareas en panel lateral. |
| `text-badge` | `11px` | 500 (Medium) | `14px` | `-0.01em` | Pastillas de tags y prioridades. |

### 3.3. Radios de Esquina (`border-radius`)

| Token | Valor | Elemento Aplicado |
| :--- | :--- | :--- |
| `radius-editor-sheet` | `24px` | Hoja blanca central de escritura. |
| `radius-dock-item` | `12px` | Contenedor selector del menú en dock izquierdo. |
| `radius-checkbox` | `6px` | Checkboxes de tareas pendientes y completadas. |
| `radius-pill-badge` | `6px` | Pastillas de prioridad alta y etiquetas de usuario. |
| `radius-button-action` | `9999px` | Botón circular de añadir `[+]` y chips redondeados. |

### 3.4. Elevación y Sombras

| Token | Valor | Comportamiento |
| :--- | :--- | :--- |
| `shadow-sheet` | `0 4px 20px -2px rgba(0,0,0,0.04), 0 2px 6px -1px rgba(0,0,0,0.02)` | Da el efecto de lienzo flotante a la hoja de notas. |
| `shadow-none` | `none` | Paneles laterales y dock completamente planos (*flat design*). |

---

## 4. Arquitectura Estructural y Layout

### 4.1. Diagrama de la Interfaz (Wireframe ASCII)

#### Vista 1: Explorador de Notas y Escritura
```plaintext
+----+------------+-----------------------------------------------------------+
|    | FOLDERS    | Toolbar: [X] [📄] [ℹ️] [📁] [🗑️]                          |
| D  | (256px)    +-----------------------------------------------------------+
| O  | 📁 01      | Barra de Formato: [↶] [↷] [B] [I] [S] [U] [≡] [•] [H1] [H2]|
| C  | 📁 02      | [Lienzo Editor Blanco - Hoja Flotante Zero-Distraction]   |
| K  |            |                                                           |
|    |            | **Título de la nota...**                                  |
| 64 | [+] Carpeta| Redacción inmediata sin fricción...                       |
| px | [📝] Nota  | - [ ] Tareas interactivas en el propio texto TipTap       |
+----+------------+-----------------------------------------------------------+
```

#### Vista 2: Tablero Unificado To do
```plaintext
+----+-----------------------------------------+-------------------------------+
| D  | TUS TAREAS (3/5 ancho - Todo el alto)   | EN PROGRESO (2/5 sup)         |
| O  | [ + Añadir Tarea ]                      | [ + ]                         |
| C  | [ ] Tarea pendiente A                   | [ ] Tarea en marcha           |
| K  | [ ] Tarea pendiente B                   +-------------------------------+
| 64 |                                         | COMPLETADAS (2/5 inf)         |
| px |                                         | [✓] Tarea terminada           |
+----+-----------------------------------------+-------------------------------+
```

### 4.2. Desglose de Secciones

1. **Dock Izquierdo (`64px` ancho fijo):**
   - **Navegación principal:**
     - Editor de notas e inicio rápido (`Home`).
     - Explorador de carpetas y notas (`Notes`).
     - Tablero unificado de tareas: Tus tareas, En Progreso, Completadas (`To do`).
     - Grafo de red neuronal cognitiva (`Network`).
     - Alternador de tema Claro / Oscuro OLED.
     - Ajustes del sistema (`Settings`).

2. **Barra Lateral de Carpetas (`FolderSidebar` - `256px` ancho):**
   - **Cabecera:** Título *"Notas"*, badge de notificación y botón `+ Crear carpeta`.
   - **Estructura jerárquica:** Carpetas personalizadas (`01`, `02`, etc.) con conteo dinámico de notas, vista en acordeón desplegable y notas sin carpeta.
   - **Pie de panel:** Acciones rápidas para `[Crear nota]`, `[Crear carpeta]`, acceso directo a `[To do]` y `[Papelera]`.

3. **Lienzo Central (Editor de Nota / Estado Vacío):**
   - **Experiencia de Inicio (Nota Rápida):** Al abrir la aplicación, el lienzo presenta inmediatamente una hoja en blanco lista para redactar una nota rápida, sin abrir notas pasadas de forma automática.
   - **Estado Vacío de Carpeta (`FolderEmptyState`):** Si una carpeta no tiene notas abiertas, se despliega una ilustración con icono de carpeta y botón *"Selecciona una nota para comenzar a editarla"*.
   - **Barra de herramientas integrada:** Botón cerrar, ver en grafo, estadísticas, selector de carpeta y eliminación; seguida de la cápsula de formato de texto (B, I, S, U, alineación, listas, encabezados).

4. **Tablero Unificado To do (`NotesBoardView`):**
   - Vista moderna en 2 columnas:
     - **Columna izquierda (3/5 de ancho):** *Tus tareas* (tareas pendientes y planificadas con formulario directo de añadir).
     - **Columna derecha (2/5 de ancho):** *En progreso* (arriba) y *Completadas* (abajo).
   - **Interactividad Total:** Arrastre nativo con cursor de agarre (`cursor-grab` / `cursor-grabbing`), checkboxes sincronizados (al marcar como completada se mueve automáticamente a Completadas y viceversa), y vinculación opcional a notas vivas (`linkedNoteId`).

---

## 5. Sistema Liquid Glass & Componentes Flotantes

### 5.1. Filosofía Liquid Glass
El sistema **Liquid Glass** adopta una estética translúcida inspirada en interfaces modernas de alta gama (Apple visionOS / macOS Sequoia). Prioriza la pureza visual, el desenfoque óptico profundo (*backdrop blur*), la saturación de color subyacente y los reflejos especulares de luz incidente en los bordes para separar planos de información sin saturar el lienzo.

### 5.2. Clases Utilitarias y Tokens de Cristal

| Clase CSS | Fondo / Gradiente | Desenfoque / Saturación | Borde & Reflejo Especular | Sombra Profunda | Uso en Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `.liquid-glass` | `rgba(255, 255, 255, 0.76)` | `blur(24px) saturate(200%)` | `border: 1px solid rgba(255, 255, 255, 0.9)`<br>`inset 0 1.5px 1px rgba(255,255,255,0.95)` | `0 12px 32px -4px rgba(0,0,0,0.05)` | Barras HUD flotantes, cabecera de canvas. |
| `.liquid-glass-card` | `linear-gradient(135deg, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.68))` | `blur(30px) saturate(210%)` | `border: 1px solid rgba(255, 255, 255, 0.95)`<br>`inset 0 2px 1.5px rgba(255,255,255,1)` | `0 24px 48px -12px rgba(0,0,0,0.08)` | Tarjetas de ayuda, popovers, paleta de comandos, modales. |
| `.liquid-glass-pill` | `rgba(255, 255, 255, 0.82)` | `blur(18px) saturate(190%)` | `border: 1px solid rgba(255, 255, 255, 0.92)`<br>`inset 0 1px 1px rgba(255,255,255,0.95)` | `0 4px 16px rgba(0,0,0,0.04)` | Botones flotantes, controles de zoom, selector de filtros. |

### 5.3. Especificación de la Tarjeta Flotante "Cómo Formar Neuronas"

```plaintext
+-------------------------------------------------------------+
| [✨] Cómo Formar Neuronas                               [X] |
|                                                             |
| [[Título]]  Escribe el título de otra nota entre            |
|             corchetes dobles para crear un enlace directo.  |
|                                                             |
| #tema       Usa hashtags para agrupar múltiples             |
|             notas alrededor de un núcleo temático.         |
|                                                             |
| @persona    Menciona colaboradores para vincularlos         |
|             con notas de proyectos y tareas.                |
+-------------------------------------------------------------+
```

- **Contenedor:** `w-[360px]`, `rounded-sheet` (`24px`), clase `.liquid-glass-card`, `border border-white/90`, `shadow-2xl`.
- **Padding:** Generoso perimetral estricto `p-5 sm:p-6` (`20px` a `24px`).
- **Superficie Continua:** Cero líneas divisorias duras (`border-b` / `border-t` omitidas); separación lograda mediante márgenes orgánicos (`mb-4` en cabecera, `space-y-3.5` entre filas).
- **Cero Elementos Redundantes:** Sin bloques de tips inferiores para mantener foco exclusivo en la sintaxis sináptica.
- **Chips de Sintaxis Sináptica:**
  - `[[Título]]`: `font-mono text-badge font-semibold px-2.5 py-1 rounded-md bg-white/95 text-app-text-primary border border-black/10 shadow-2xs`.
  - `#tema`: `font-sans text-badge font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/70`.
  - `@persona`: `font-sans text-badge font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200/70`.
- **Control HUD:** Botón interactivo `[ ✨ ¿Cómo conectar? ] / [ ✨ Ocultar Guía ]` en la barra superior flotante para alternar visibilidad con un solo clic.

### 5.4. Cohesión de Liquid Glass en la Aplicación
1. **Lienzo de Red Cognitiva (`GraphCanvas`):** Cabecera HUD superior y controles de zoom (`liquid-glass` y `liquid-glass-pill`).
2. **Menú de Notas en Dock (`Dock`):** Desplegable de notas flotante con `.liquid-glass-card` y `backdrop-blur-2xl`.
3. **Búsqueda Rápida (`CommandPalette`):** Ventana modal central en `.liquid-glass-card rounded-3xl`.
4. **Configuración (`SettingsModal`):** Contenedor de preferencias en cristal líquido.
5. **Menús Desplegables del Editor (`EditorToolbar`):** Menú de tipos de bloques y panel de estadísticas de lectura.

### 5.5. Autocompletado de Sinapsis (`[[Wikilinks]]`) y Ciclo de Vida de Notas Vacías
- **Regla de No-Persistencia de Notas Vacías:** Si el usuario crea una nueva nota y no escribe título ni contenido, dicha nota **nunca se persiste** en la base de datos SQLite / LocalStorage. Al navegar a otra nota o cambiar de vista, la nota vacía se descarta de la memoria de inmediato, evitando notas fantasma.
- **Autocompletado Reactivo de Enlaces (`[[`):**
  - Al tipear corchetes dobles `[[` o presionar el atajo **`Ctrl + Espacio`** (o `Cmd + Espacio`), se despliega un popover flotante en `liquid-glass-card` anclado a las coordenadas exactas del cursor.
  - El menú filtra en tiempo real las notas existentes según el texto ingresado (`[[consulta`).
  - Navegación completa por teclado con `↑ / ↓`, inserción inmediata con `Enter` / `Tab` (que genera `[[Título de la Nota]] ` y ubica el cursor tras el corchete de cierre), y descarte con `Esc`.

### 5.6. Tablero Kanban de Notas: Entidad Independiente y Enlace Opcional
- **Separación de Entidades:** Las tarjetas del tablero (`BoardCard`) constituyen una entidad desacoplada de las notas normales (`Note`). Crear, mover o eliminar una tarjeta no muta ni genera notas en las carpetas del editor.
- **Minimalismo Estricto:** Cada tarjeta en las columnas *Planeadas*, *En Progreso* y *Completadas* muestra exclusivamente su título y descripción/contenido, eliminando símbolos y etiquetas ajenas.
- **Arrastre con la Mano:** Soporte nativo de Drag & Drop con cursor de agarre (`cursor-grab` y `active:cursor-grabbing`).
- **Referenciación Cruzada Opcional:** Una tarjeta del tablero puede vincularse opcionalmente a una nota normal existente mediante `linkedNoteId`. Si está vinculada, expone una píldora discreta para navegar directamente a la nota en el editor sin fusionar sus estados.


