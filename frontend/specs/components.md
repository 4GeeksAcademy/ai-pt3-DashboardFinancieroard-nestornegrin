# Especificación de Componentes — Fase 5

Desglose de componentes por funcionalidad. Los tipos referenciados (`FacetsResponse`,
`AlertEntry`, `CategoryEntry`, `DateRangeFilter`, `AlertsParams`, `TopCategoriesParams`) están
definidos en `api-types.ts` y `param-types.ts` de esta misma carpeta — este documento no repite
sus definiciones, solo indica qué componente usa cuál.

**Recordatorio de alcance:** esto es especificación, no implementación. Ningún nombre de
componente aquí es una promesa de estructura de carpetas final — es la unidad mínima que un
desarrollador necesita para no tener que adivinar props ni estados.

---

## Funcionalidad 1 — Filtro de rango de fechas (dashboard principal)

### Ubicación
Parte superior de `App.tsx`, encima de `KPIRow` (reemplaza el header actual o se agrega justo
debajo de `DashboardHeader`).

### Árbol de componentes
```
DateRangeFilterBar
├─ props: { minDate: string; maxDate: string; value: DateRangeFilter; onChange: (v: DateRangeFilter) => void; loading?: boolean }
├─ DateInput (fecha de inicio)     — value: value.start_date, max: value.end_date ?? maxDate, min: minDate
├─ DateInput (fecha de fin)        — value: value.end_date,   min: value.start_date ?? minDate, max: maxDate
└─ <span> texto de referencia: "Rango disponible: {minDate} – {maxDate}"
```
`minDate`/`maxDate` vienen de `FacetsResponse.min_date` / `.max_date` (fetch único al montar
`App.tsx`, no se refetchea con cada cambio de filtro — el dominio completo no cambia).

### Reglas de interacción
- Al cambiar cualquiera de los dos inputs, se dispara `onChange` con el `DateRangeFilter`
  actualizado; `App.tsx` es responsable de re-fetchear `/api/metrics` con esos params y de pasar
  los datos resultantes a `KPIRow`, `IncomeOutcomeChart`, `ProfitPercentChart` — esos 3
  componentes NO cambian su interfaz de props, solo reciben datos ya filtrados.
- **Solo un campo relleno:** si el usuario llena `start_date` y deja `end_date` vacío (o
  viceversa), el fetch SÍ se dispara — se envía solo el campo con valor, el otro se omite del
  query string. No hace falta esperar a que ambos campos tengan valor. Ver caso borde 2 en
  `README.md`.
- Si `start_date > end_date` (ambos presentes), no se dispara el fetch — se muestra un mensaje de
  validación inline bajo los inputs ("La fecha de inicio no puede ser posterior a la de fin") y se
  deshabilita visualmente cualquier estado de carga.
- Ambos campos vacíos = sin filtro = comportamiento actual del dashboard (trae todo el dataset).

### Estados
- **Carga inicial de facets:** mientras `FacetsResponse` no ha llegado, los inputs se muestran
  deshabilitados (no se puede filtrar sin saber el rango válido).
- **Carga de datos filtrados:** reutiliza los skeletons ya existentes de `KPIRow` y los charts.
- **Error:** mismo banner de error ya existente en `App.tsx`.

---

## Funcionalidad 2 — Tabla de alertas de anomalías

### Ubicación
Nueva sección debajo de `IncomeOutcomeChart` / `ProfitPercentChart`, dentro del mismo `App.tsx`.

### Árbol de componentes
```
AnomalyAlertsSection
├─ props: { dateRange: DateRangeFilter }   // recibido desde el estado de la Funcionalidad 1
├─ ThresholdInput
│   ├─ props: { value: number; min: 0.01; max: 1.0; step: 0.01; onChange: (v: number) => void }
│   └─ value por defecto: 0.3 (se guarda en el estado de AnomalyAlertsSection, no en App.tsx)
└─ AnomalyAlertsTable
    ├─ props: { alerts: AlertEntry[] | null; loading: boolean; error: string | null }
    ├─ columnas: Período | Outcome registrado | Promedio histórico previo | Incremento %
    ├─ orden de filas: por `increase_ratio` DESCENDENTE (client-side — el backend devuelve
    │   cronológico, ver `api-types.ts::AlertsResponse`)
    └─ EmptyState (cuando `alerts !== null && alerts.length === 0`):
        mensaje explícito, ej. "No se detectaron gastos inusuales con el umbral actual (30%)."
        — no es un error, es un resultado válido; no debe verse como el banner de error.
```

### Datos
`GET /api/metrics/alerts` con `AlertsParams` = `{ threshold, ...dateRange }`. Se re-fetchea cada
vez que cambia `threshold` (con debounce sugerido de ~300ms si el input es un slider) o cuando
cambia `dateRange` (propagado desde la Funcionalidad 1).

### Reglas de formato por columna
- **Período:** tal cual viene en `AlertEntry.period` (formato `YYYY-MM`, ver nota en `api-types.ts`).
- **Outcome registrado / Promedio histórico previo:** `formatCurrency()` (USD, sin decimales).
- **Incremento %:** `(increase_ratio * 100).toFixed(1) + "%"`, con un signo `+` explícito
  (siempre es positivo porque el backend solo incluye períodos donde `increase_ratio > threshold`).

### Estados
- **Carga:** skeleton de tabla (filas grises), input de threshold deshabilitado.
- **Error:** banner de error existente; la tabla no se renderiza.
- **Vacío (0 alertas):** `EmptyState` descrito arriba — estado explícito, nunca "la sección
  desaparece".

---

## Funcionalidad 3 — Vista de comparativa B2B vs B2C

### Ubicación
Página/ruta nueva y separada del dashboard principal (ej. `/comparison`, fuera del alcance de esta
spec decidir el router exacto — Vite/React no tiene uno instalado hoy, ver `README.md`).

### Árbol de componentes
```
BusinessComparisonPage
├─ props: ninguno (fetch de FacetsResponse propio al montar, para el texto de rango de fechas)
├─ DateRangeFilterBar          — mismo componente de la Funcionalidad 1, instancia independiente
│                                 (esta vista tiene su propio estado de fecha, no comparte el del
│                                 dashboard principal — ver "Fuera de alcance" más abajo)
├─ ComparisonSection (business_type="B2B")
│   ├─ props: { businessType: "B2B"; dateRange: DateRangeFilter }
│   └─ TopCategoriesTable
│       ├─ props: { categories: CategoryEntry[] | null; loading: boolean; groupTotal: number }
│       └─ columnas: Categoría | Total de ingresos | % sobre el total del grupo
│           (% calculado client-side: `category.total_amount / groupTotal * 100`,
│            donde `groupTotal = Σ categories[].total_amount` de ESE MISMO lado)
├─ ComparisonSection (business_type="B2C")
│   └─ (idéntica estructura, con business_type="B2C")
└─ IncomeComparisonChart
    ├─ props: { b2bTotal: number; b2cTotal: number; loading: boolean }
    └─ gráfico de barras con 2 barras: Total de ingresos B2B vs. Total de ingresos B2C
```

### Datos
Dos llamadas independientes a `GET /api/metrics/categories/top` con `TopCategoriesParams`:
- `{ operation_type: "income", limit: 5, business_type: "B2B", ...dateRange }`
- `{ operation_type: "income", limit: 5, business_type: "B2C", ...dateRange }`

Más `GET /api/metrics/facets` (sin params) al montar, solo para poblar el rango de fechas del
`DateRangeFilterBar` de esta página (las categorías disponibles ya se conocen de forma implícita:
son las mismas 5 del dominio, pero la respuesta real de `/categories/top` puede traer menos si
alguna categoría no tiene ingresos — ver caso borde en `README.md`).

**Decisión de diseño — de dónde sale el dato del `IncomeComparisonChart`:** `b2bTotal` y `b2cTotal`
se calculan sumando `total_amount` de las filas ya recibidas en `TopCategoriesTable` de cada lado
(`groupTotal` de la tabla B2B y de la tabla B2C respectivamente) — **no** se hace una tercera
llamada a la API para el total. Esto es válido porque el dominio de categorías es pequeño (solo 5
posibles) y `limit=5` ya captura el 100% de las categorías con ingreso de esa línea de negocio
(ver caso borde en `README.md` sobre por qué el ingreso solo aparece en 2 de las 5 categorías).

### Estados
- **Carga:** ambas `TopCategoriesTable` muestran skeleton simultáneamente; el chart no se
  renderiza hasta que ambos lados resolvieron.
- **Error:** si CUALQUIERA de las 2 llamadas falla, se muestra el banner de error y no se
  renderiza ninguna tabla ni el chart (evita comparar un lado completo contra un lado a medias).
- **Vacío:** si una tabla trae `[]` (esa línea de negocio no tuvo ingresos en el rango filtrado),
  esa tabla muestra su propio `EmptyState` ("Sin ingresos registrados para B2B en este rango") y
  el chart muestra esa barra en `0`, no oculta la barra.

### Fuera de alcance de esta especificación
- Compartir el estado de `DateRangeFilter` entre el dashboard principal y esta vista (cada uno
  mantiene su propio filtro independiente, a menos que el PM pida explícitamente sincronizarlos).
- Enrutamiento (routing) — el proyecto no tiene `react-router` ni equivalente instalado hoy; cómo
  se navega a esta página es una decisión de implementación, no de esta spec.
