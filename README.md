# Notas & Tareas (Kimavec Notas)

Aplicación minimalista y de alto rendimiento para toma de notas reflexivas, gestión visual de tareas (**To do**) y red neuronal de conocimiento (**Sinapsis / Wikilinks**).

Inspirada en la estética **Liquid Glass** (estilo macOS Sequoia / visionOS) con soporte nativo de **Modo Oscuro OLED puro** (`#000000`).

---

## Características Principales

- **Lienzo de Escritura Sin Distracciones (*Zero-distraction Canvas*):** Hoja de edición flotante con microinteracciones fluidas, soporte de rich text con TipTap/ProseMirror, resaltado sintáctico con JetBrains Mono y guardado automático.
- **Red Neuronal Cognitiva (`[[Wikilinks]]`):** Conecta notas escribiendo `[[` o mediante `Ctrl + Espacio`. Visualiza las sinapsis y relaciones temáticas en un grafo de red interactivo con controles HUD.
- **Tablero Unificado To do:** Vista de 2 columnas para productividad ágil (*Tus tareas* en columna principal izquierda; *En progreso* y *Completadas* en columna derecha). Soporte de Drag & Drop nativo y marcado reactivo.
- **Jerarquía de Carpetas y Organización:** Árbol recursivo de carpetas y subcarpetas, arrastrar y soltar notas entre carpetas, y papelera con recuperación/eliminación definitiva.
- **Búsqueda Global Instantánea (`Ctrl + K`):** Paleta de comandos con uniones discriminadas estrictas para buscar notas, tareas y menciones al instante.
- **Arquitectura Robusta y Persistencia Segura:** Estado modularizado con Zustand Slices, Single Source of Truth (SSOT), soporte híbrido LocalStorage / Tauri SQLite, y regla estricta de no-persistencia de notas vacías.

---

## Documentación Técnica y Estándares

El proyecto cuenta con especificaciones completas en la carpeta [`docs/`](./docs/):

1. **[01 - Diseño UX / UI & Tokens de Diseño](./docs/01-diseno-ux-ui.md):** Filosofía de interfaz, tokens de color semánticos, escala tipográfica Inter, sistema Liquid Glass y reglas de minimalismo estricto en cabeceras.
2. **[02 - Stack Tecnológico](./docs/02-stack-tecnologico.md):** Arquitectura técnica por capas (React 19, Vite, TipTap, Tailwind CSS, Zustand, Tauri, SQLite).
3. **[03 - Patrones de Diseño](./docs/03-patrones-diseno.md):** SSOT, Composite Pattern (`subtasks?: Task[]`), Strategy Pattern (`RuleBasedTaskParser`), Command Pattern y Reference Pattern.
4. **[04 - Estándares de Código (Code Standards)](./docs/04-code-standards.md):** Principios Clean Code, SOLID, DRY, YAGNI, reglas estrictas de TypeScript (sin `any` ni `as` inseguro), seguridad y manejo de errores.
5. **[Índice del Sistema de Diseño](./docs/desing-system.md):** Guía maestra y mapa de navegación entre especificaciones.

---

## Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Verificación de tipos estricta
npx tsc --noEmit

# Compilar para producción
npm run build
```

