# 3 subagentes para Claude Code

Cada tarea va al modelo que corresponde: **opus** planifica, **sonnet** implementa, **haiku** busca y lee.

## Cómo probarlo

1. Creá la carpeta `.claude/agents/` dentro de tu proyecto (o en `~/.claude/agents/` para usarlos en todos tus proyectos).
2. Copiá ahí `planner.md`, `coder.md` y `explorer.md`.
3. Abrí Claude Code en ese proyecto y escribí `/agents`. Tienen que aparecer los 3.
4. Poné la sesión principal en Sonnet con `/model sonnet`, así la conversación base no gasta Opus.
5. Pedile una tarea real, por ejemplo: *"agregá un formulario de contacto: primero planificá, después implementá"*.

Claude lee la descripción de cada agente y decide solo a cuál mandarle cada tarea.

Si algún agente no se usa o se usa de más, ajustá su `description`.
