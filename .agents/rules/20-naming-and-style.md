# Nombres y Estilo

**Alcance:** `backend/app/routes.py`, componentes de `frontend/src`.
**Razón:** de las 3 reglas de naming propuestas en la auditoría (NAMING-001..003), solo dos son
accionables sin ser arbitrarias. Se refinó la tercera abajo.

## Vigente — funciones privadas con prefijo `_`
`_build_movement`, `_year_for_month` ya siguen este patrón en `routes.py`. Mantenlo: si una función
es un helper interno de `routes.py` que no se expone como endpoint ni se importa desde tests, dale
prefijo `_`.

## Vigente, con criterio — nombres descriptivos en vez de abreviaturas
`income_probability`, `movement_date`, `outcome_categories` son el estándar real del código. Sigue
ese nivel de claridad en código nuevo. **Descartado:** la propuesta original de forzar "≥3
caracteres vía linter" (NAMING-002) — es una regla arbitraria y no hay linter configurado que la
implemente; no aporta guía real más allá de "nombres claros", que ya cubre este punto.

## Backlog, no regla — constantes con nombre para "números mágicos"
`routes.py` tiene rangos sin explicar (`random.randint(1, 28)`, `random.uniform(0.45, 0.7)`,
`random.uniform(800, 12000)`). Es una mejora real pero de bajo riesgo — no bloquea tareas. Si tocas
esa función por otra razón, nombra las constantes que edites; no es excusa para reescribir todo el
generador de datos mock en una tarea no relacionada.
