# Estado Actual

**Fuente de evidencia:** `backend/app/routes.py`, `backend/tests/test_routes.py`,
`frontend/src/App.tsx`, `frontend/src/lib/*.ts`, `frontend/src/components/dashboard/*`,
`docs/phase-2-code-audit.md`, `docs/phase-3-rules-validation.md`. Última verificación: 2026-07-27.

## Features implementadas (verificadas con tests o código en uso real)

### Backend — 9 endpoints, todos con test en `test_routes.py`
| Endpoint | Qué hace |
|---|---|
| `GET /health` | Chequeo de salud, `{"status": "ok"}` |
| `GET /api/metrics` | Movimientos filtrables por fecha, categoría, tipo de operación |
| `GET /api/metrics/facets` | Valores disponibles para filtros (categorías, tipos, rango de fechas) |
| `GET /api/metrics/summary` | Totales de ingreso/egreso/neto agrupados por día, semana o mes |
| `GET /api/metrics/categories/top` | Top N categorías por monto total, para un tipo de operación |
| `GET /api/metrics/comparison` | Compara el neto del periodo actual vs. el periodo anterior equivalente |
| `GET /api/metrics/alerts` | Detecta periodos donde el egreso subió por encima de un umbral vs. el promedio histórico |
| `GET /api/metrics/b2b` | Movimientos filtrados a `business_type = B2B` |
| `GET /api/metrics/b2c` | Movimientos filtrados a `business_type = B2C` |

### Frontend — consume solo 1 de esos 9 endpoints
- `App.tsx` hace fetch únicamente a `GET /api/metrics` (sin filtros — trae todo el año).
- KPI row: ingreso total, egreso total, ganancia, margen de ganancia (`kpi-row.tsx` +
  `financial-utils.ts::computeKPIs`).
- Gráfico de línea ingreso vs. egreso por mes (`income-outcome-chart.tsx`, Recharts).
- Gráfico de línea de margen de ganancia por mes (`profit-percent-chart.tsx`, Recharts).
- Estado de carga (`loading`) con skeletons y estado de error visible si el fetch falla.
- Sin filtros de UI: no hay selector de fecha, categoría, ni toggle B2B/B2C — aunque el backend ya
  soporta todo eso.

### Testing
- Backend: 15 tests en `test_routes.py`, cubren los 9 endpoints + helpers de filtrado/generación.
- Frontend: tests solo de `financial-utils.ts` (cálculo de KPIs, agregación mensual, formatters) —
  0 tests de componentes.

## Gaps conocidos (documentados, no resueltos — ver `.agents/rules/70-api-contract-sync.md` para el detalle técnico)
1. **5 de 6 modelos del backend sin tipo ni UI en el frontend:** `MetricsSummaryItem`,
   `MetricsFacets`, `TopCategoryItem`, `MetricsComparison`, `MetricsAlert` existen y están
   probados en el backend, pero no tienen interface en `financial-types.ts` ni componente que los
   consuma.
2. **`frontend/src/lib/mock-data.ts` es código muerto:** define datos mock que ningún componente
   importa (`App.tsx` llama al backend real). Nadie ha decidido si borrarlo o reactivarlo.
3. **Backend sin configuración por entorno:** no hay `backend/.env.example`; CORS está hardcodeado
   a `allow_origins=["*"]`.
4. **Sin observabilidad:** no hay `logging` en el backend — ni un `print()`. Si algo falla en el
   cálculo de un endpoint, no queda rastro.
5. **Sin tests de componentes React:** `@testing-library/react` no está instalado.
6. **Dependencias del backend sin versión fijada** (`requirements.txt` sin pins) — riesgo de
   builds no reproducibles.

## Siguientes prioridades sugeridas (orden propuesto, a validar con el equipo/instructor)
1. **Decidir el destino de `mock-data.ts`:** borrarlo (si de verdad no se usa) o documentar por qué
   se mantiene. Es la limpieza más barata y elimina confusión inmediata.
2. **Cerrar la brecha de contrato API más visible primero:** conectar `/api/metrics/summary` (ya
   reemplazaría el cálculo manual de `computeMonthlyData` en el frontend por datos ya agregados en
   el backend) antes que las demás — es la que más valor da con menos esfuerzo.
3. **Agregar `backend/.env.example`** siguiendo el patrón que ya existe en `frontend/.env.example`,
   antes de que cualquier tarea futura necesite tocar configuración del backend.
4. **Decidir si se adopta testing de componentes** (agregar `@testing-library/react`) — es una
   decisión de dependencia nueva, no algo para colar en otra tarea.
5. **Fijar versiones en `requirements.txt`** (o migrar a `pyproject.toml` con lockfile) para
   reproducibilidad de builds.

Prioridades 2 en adelante son mejoras reales pero no bloqueantes; ninguna impide seguir trabajando
en el proyecto tal como está hoy.
