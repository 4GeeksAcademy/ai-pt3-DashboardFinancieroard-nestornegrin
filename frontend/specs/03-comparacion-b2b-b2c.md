# Spec 3: Comparación B2B vs B2C

**Feedback de origen:** "una vista dedicada para comparar ingresos entre sus dos líneas de negocio."
**Endpoints backend involucrados:** `GET /api/metrics/b2b`, `GET /api/metrics/b2c`.
**Estado:** especificación — sin implementar.

## 1. Qué ve el usuario
Una vista/sección dedicada "Comparación B2B vs B2C" con:
1. Dos grupos de KPI cards lado a lado (uno por línea de negocio: B2B / B2C), cada uno con:
   Ingreso Total, Egreso Total, Ganancia, Margen — reutilizando el componente `KPICard` ya
   existente, sin crear una variante nueva.
2. Un gráfico de línea con **2 series de ingreso** (Ingreso B2B vs. Ingreso B2C) a lo largo de los
   meses del año, en el mismo eje X.

No hay un total "combinado" en esta vista — el dashboard principal ya muestra el combinado; esta
vista es específicamente para comparar las dos líneas entre sí.

## 2. Datos que necesita cada componente
Dos llamadas en paralelo (sin parámetro `business_type` porque cada endpoint ya fuerza su propio
tipo de negocio):
- `GET /api/metrics/b2b` → `list[FinancialMovement]` (solo movimientos B2B)
- `GET /api/metrics/b2c` → `list[FinancialMovement]` (solo movimientos B2C)

Ambos aceptan opcionalmente `start_date`, `end_date`, `category`, `operation_type` — **no**
aceptan `business_type` (no tendría sentido, ya está forzado).

**Decisión de diseño:** alimentar `computeKPIs(movements)` y `computeMonthlyData(movements)` —
las dos funciones ya existentes y probadas en `financial-utils.ts` — con cada una de las dos
listas por separado, en vez de llamar a `/api/metrics/summary?business_type=...` dos veces. Se
descarta la alternativa de `/summary` porque obligaría a reimplementar el cálculo de KPI totales
que `computeKPIs` ya resuelve; con `/b2b` y `/b2c` se reutiliza código existente tal cual.

## 3. Reglas por campo
- Cada línea de negocio se calcula **100% independiente** — no se cruzan datos entre B2B y B2C en
  ningún cálculo.
- El gráfico usa el mismo eje X (meses) para ambas series. Como son 2 fetches independientes, hay
  que **unir (merge) los dos `MonthlyDataPoint[]` por mes**; si un mes no tiene movimientos para una
  de las dos líneas, ese punto vale `0` (no `null`, no se omite el mes) — mismo criterio que ya usa
  `computeMonthlyData` cuando no hay movimientos de un tipo en un mes dado.
- Formato: reusar `formatCurrency` (USD, sin decimales) y `formatPercent` (1 decimal) tal cual
  existen hoy — no se definen formatos nuevos para esta vista.

## 4. Estados
- **Carga:** ambas columnas (B2B y B2C) muestran skeleton simultáneamente mientras las 2 llamadas
  están en curso.
- **Error:** si **cualquiera** de las 2 llamadas falla, mostrar el banner de error existente y
  **no** renderizar datos parciales de una sola línea de negocio — mostrar solo una mitad de la
  comparación sería engañoso para quien lo lee.
- **Vacío:** si ambas listas vienen vacías para el rango seleccionado, mensaje "No hay movimientos
  registrados para el periodo seleccionado".

## 5. Fuera de alcance de esta especificación
- Comparación de categorías top por línea de negocio (`/api/metrics/categories/top` con
  `business_type`) — es una extensión natural, pero el feedback pidió específicamente comparar
  ingresos, no categorías. Queda como posible fase futura.
- Filtros de fecha propios de esta vista — se puede reusar el filtro de la Spec 1 más adelante,
  pero no es parte de esta especificación v1.
- Exportar a CSV/PDF.
