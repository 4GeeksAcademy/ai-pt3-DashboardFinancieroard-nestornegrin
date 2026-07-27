# Testing

**Alcance:** `backend/tests/**`, `frontend/src/**/*.test.ts(x)`.
**Razón:** de las 4 reglas de testing propuestas (TEST-001..004), 3 ya están vigentes en el
repo tal cual está; la cuarta es una brecha real, no una regla que se pueda hacer cumplir hoy.

## Vigente — tests para lógica crítica, incluyendo bordes
Cada endpoint en `backend/tests/test_routes.py` tiene su test vía `TestClient`, y
`financial-utils.test.ts` cubre el caso borde de "sin ingresos → 0% de margen". Todo endpoint o
función pura nueva necesita al menos un test feliz + un caso borde, siguiendo ese patrón.

## Vigente — datos reproducibles con seed fijo
`generate_mock_movements(seed=42)` se usa en producción y en tests: 360 movimientos/año, siempre
los mismos. No lo hagas aleatorio por defecto ni cambies el seed en tests existentes — el test
`test_generate_mock_movements_returns_full_year_sorted_data` depende del valor exacto (360).

## Descartado como número — cobertura "≥80%/≥70%"
La auditoría proponía umbrales de cobertura. `pytest-cov` está instalado pero no hay
`pyproject.toml`/`pytest.ini` que fije un mínimo, así que ese número no es verificable hoy. No lo
cites como si fuera una regla activa; si quieres fijar un umbral real, hay que configurarlo primero
(ver `60-developer-experience.md`).

## Brecha real, no vigente — componentes React sin test
No existe ningún `*.test.tsx`; solo hay tests de `financial-utils.ts`. Añadir
`@testing-library/react` y tests de componentes (`kpi-card`, los charts) es válido como tarea,
pero no lo trates como bloqueante de otras tareas hasta que se decida adoptarlo — la dependencia ni
siquiera está en `package.json` todavía.
