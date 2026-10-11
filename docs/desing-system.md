# Índice de Documentación del Sistema

La documentación del proyecto está modularizada en los siguientes archivos:

---

### 1. [01 - Diseño UX / UI & Tokens](file:///d:/PROYECTOS-PERSONALES/Notas-nose/docs/01-diseno-ux-ui.md)
- Filosofía de experiencia de usuario (*Zero-distraction Canvas*).
- Tokens de color, superficies, textos, bordes y badges.
- Tipografía (`Inter`), escala tipográfica, radios de esquina y sombras.
- Especificación estructural y layout (Dock 64px, Navegador de Carpetas 256px, Lienzo Central Zero-distraction y Tablero To do).
- Sistema **Liquid Glass** y componentes flotantes (tarjeta de neuronas, HUD, popovers y modales).
- **Regla de Minimalismo Estricto:** Cabeceras únicamente con el nombre de la vista (ej. `Notas`, `To do`, `Inicio`), sin subtítulos redundantes ni elementos decorativos que saturen.

---

### 2. [02 - Stack Tecnológico](file:///d:/PROYECTOS-PERSONALES/Notas-nose/docs/02-stack-tecnologico.md)
- Diagrama de capas arquitectónicas (Presentación, Edición, Estado, Persistencia).
- Selección técnica (React/Vite, TipTap/ProseMirror, Lucide Icons, Zustand, Tauri, SQLite).
- Configuración lista para producción de `tailwind.config.js`.

---

### 3. [03 - Patrones de Diseño](file:///d:/PROYECTOS-PERSONALES/Notas-nose/docs/03-patrones-diseno.md)
- Patrones de interfaz (3-Column Workspace, Single Source of Truth, Component-Driven Architecture).
- Patrones de software y reactividad (Observer/Pub-Sub, Command Pattern, Composite Pattern, Strategy Pattern).

---

### 4. [04 - Estándares de Código (Code Standards)](file:///d:/PROYECTOS-PERSONALES/Notas-nose/docs/04-code-standards.md)
- Principios fundamentales (Clean Code, SOLID, KISS, DRY, YAGNI).
- Buenas prácticas en TypeScript, React, Zustand y Hooks.
- Reglas para Rust, Tauri Commands, IPC y SQLite (Repositories y Transacciones).
- Manejo riguroso de errores, testing, dependencias y checklist de entrega.
