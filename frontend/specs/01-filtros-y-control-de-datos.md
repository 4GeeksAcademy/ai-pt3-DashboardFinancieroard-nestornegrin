# Spec 1: Filtros y Control de Datos

**Feedback de origen:** "Quieren más control sobre los datos que ven."
**Endpoints backend involucrados:** `GET /api/metrics/facets`, `GET /api/metrics/summary`.
**Estado:** especificación — sin implementar.

## 1. Qué ve el usuario
Una barra de filtros arriba del dashboard existente (por encima de los KPI cards), con estos
controles:
1. **Rango de fechas** — dos date pickers (desde/hasta).
2. **Categoría** — un dropdown de selección única: "Todas las categorías" + las 5 categorías.
3. **Tipo de operación** — un dropdown de selección única: "Todas" / "Ingreso" / "Egreso".
4. **Tipo de negocio** — un dropdown de selección única: "Todos" / "B2B" / "B2C".
5. **Agrupar por** — un dropdown: "Día" / "Semana" / "Mes" (default: Mes).
6. Botón **"Limpiar filtros"** que vuelve todo a los defaults (sin filtros = rango completo).

Los filtros se aplican automáticamente al cambiar cualquier control, excepto el rango de fechas,
que solo dispara la petición cuando **ambas** fechas (desde y hasta) están seleccionadas — para
evitar peticiones con un rango a medio definir.

Los KPI cards y los dos gráficos existentes (Income vs Outcome, Profit Margin %) reaccionan a estos
filtros; no se crean componentes nuevos, se les cambia la fuente de datos.

## 2. Datos que necesita cada componente

### Al montar la vista (una sola vez)
`GET /api/metrics/facets` → sin parámetros, siempre devuelve el dominio completo del dataset (no
se filtra por nada — usarlo solo para poblar las opciones de los selects y los límites de los date
pickers, no para saber "qué queda después de filtrar"):
```json
{
  "operation_types": ["income", "outcome"],
  "business_types": ["B2B", "B2C"],
  "categories": ["administrative", "operational", "others", "sales", "suppliers"],
  "min_date": "2025-08-01",
  "max_date": "2026-07-31"
}
```
Usar `min_date`/`max_date` para acotar el rango seleccionable en los date pickers.

### Al cambiar cualquier filtro
`GET /api/metrics/summary` con estos query params (todos opcionales excepto ninguno — todos tienen
default):

| Param | Tipo | Default | Nota |
|---|---|---|---|
| `group_by` | `"day" \| "week" \| "month"` | `"month"` | Cambia el formato de `period` en la respuesta, ver más abajo |
| `start_date` | fecha ISO | ninguno (= sin límite inferior) | |
| `end_date` | fecha ISO | ninguno (= sin límite superior) | |
| `category` | una de las 5 categorías | ninguno (= todas) | **Un solo valor, no una lista** — la API no acepta múltiples categorías en una llamada |
| `operation_type` | `"income" \| "outcome"` | ninguno (= ambos) | Un solo valor |
| `business_type` | `"B2B" \| "B2C"` | ninguno (= ambos) | Un solo valor |

Respuesta: `list[MetricsSummaryItem]`, cada item:
```json
{ "period": "2026-03", "income": 84200.0, "outcome": 41100.0, "net": 43100.0 }
```

**Cambio de arquitectura requerido:** el dashboard actual llama a `GET /api/metrics` (lista cruda de
movimientos) y calcula KPIs/mensuales en el cliente con `computeKPIs`/`computeMonthlyData`. Esa ruta
**no acepta `business_type`** como parámetro. Para que el filtro de tipo de negocio funcione, el
dashboard debe migrar su fuente de datos a `/api/metrics/summary`, que sí soporta los 5 filtros de
la tabla de arriba en una sola llamada.

## 3. Reglas por campo

- **`period` cambia de formato según `group_by`** — esto es crítico y no es opcional de manejar:
  - `group_by=month` → `"2026-03"` (año-mes)
  - `group_by=week` → `"2026-W12"` (año-semana ISO)
  - `group_by=day` → `"2026-03-15"` (fecha ISO completa)
  El formateador de etiquetas del eje X del gráfico debe soportar los 3 formatos, no solo
  año-mes como hoy (`formatMonthYearLabel` en `financial-utils.ts` solo entiende `"YYYY-MM"`).
- **KPIs totales** = suma de `income`/`outcome` de todos los `MetricsSummaryItem` devueltos (no una
  sola llamada aparte): `totalIncome = Σ item.income`, `totalOutcome = Σ item.outcome`,
  `profit = totalIncome - totalOutcome`, `profitPercent = totalIncome > 0 ? profit/totalIncome*100 : 0`
  — misma fórmula que ya usa `computeKPIs`, solo que alimentada con datos ya agregados por el
  backend en vez de movimientos crudos.
- **Categoría/operación/negocio son excluyentes entre sí, no acumulativos con OR** — seleccionar
  "Egreso" + "B2B" trae solo movimientos que cumplen ambas condiciones (AND), no la unión.

## 4. Estados
- **Carga:** mismos skeletons que ya existen en `kpi-card.tsx` e `income-outcome-chart.tsx`.
- **Error:** mismo banner de error ya usado en `App.tsx`.
- **Vacío:** si `/api/metrics/summary` devuelve `[]` (ningún periodo cumple los filtros), mostrar el
  mismo mensaje "No data available to display" que ya usan los charts, no un error.

## 5. Fuera de alcance de esta especificación
- Selección múltiple de categoría (la API no lo soporta hoy).
- Filtro por rango de montos (no existe en la API).
- Persistir filtros en la URL o `localStorage`.
