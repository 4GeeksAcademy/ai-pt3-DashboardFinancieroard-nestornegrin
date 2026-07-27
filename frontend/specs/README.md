# Contrato de Datos — Fase 5: Filtros, Alertas y Comparativa B2B/B2C

**Estado:** especificación de la capa frontend — sin implementar. Ningún componente React ni
llamada a la API fue construida a partir de este documento; es el contrato que debe seguir quien
lo implemente.

**Método de verificación:** cada endpoint, parámetro y campo de respuesta citado aquí fue
verificado contra `backend/app/routes.py` (código fuente real, equivalente a lo que expone
`/docs`), no contra la descripción original del PM tal cual — donde hubo diferencia, se documenta
explícitamente en la sección "Discrepancias encontradas" de cada funcionalidad.

Los tipos TypeScript completos están en [`api-types.ts`](./api-types.ts) (respuestas) y
[`param-types.ts`](./param-types.ts) (parámetros de consulta). El desglose de componentes está en
[`components.md`](./components.md).

---

## Funcionalidad 1 — Filtro de rango de fechas en el dashboard principal

### Endpoint(s)
- `GET /api/metrics/facets` — sin parámetros. Provee `min_date`/`max_date` para el texto de
  referencia y los límites de los date pickers.
- `GET /api/metrics` — **ya acepta `start_date` y `end_date` opcionales hoy** (verificado en
  `backend/app/routes.py::get_metrics`). Esta funcionalidad no requiere ningún cambio de backend,
  solo agregar los inputs en el frontend y pasar los params en la petición existente.

### Tipos usados
- Respuesta de facets: `FacetsResponse` (`api-types.ts`).
- Parámetros del filtro: `DateRangeFilter` (`param-types.ts`), enviado directamente como params de
  `GET /api/metrics` (junto con `category`/`operation_type` si esos filtros de una fase anterior
  siguen vigentes).

### Valores válidos y restricciones
- `start_date` / `end_date`: string `YYYY-MM-DD`, ambos opcionales de forma independiente.
- No hay restricción de la API sobre que `start_date <= end_date` — si se envía un rango invertido,
  el backend simplemente devuelve una lista vacía (el filtro `create_date >= start_date AND
  create_date <= end_date` nunca es verdadero). Es responsabilidad del frontend validar esto ANTES
  de enviar la petición, para no confundir "rango inválido" con "sin datos en el rango".

### Casos borde
1. **Ambos campos vacíos:** el dashboard debe mostrarse exactamente igual que hoy (sin filtro,
   dataset completo) — no se debe interpretar como "sin datos".
2. **Solo un campo de fecha relleno (el otro vacío):** es un estado válido, no un error ni un caso
   incompleto. Si solo `start_date` tiene valor, la petición se envía con `start_date` y sin
   `end_date` — el backend trae todos los movimientos desde esa fecha en adelante, sin límite
   superior. Si solo `end_date` tiene valor, ocurre lo simétrico: todos los movimientos hasta esa
   fecha, sin límite inferior. El frontend debe enviar la petición apenas cualquiera de los dos
   campos tenga un valor válido — no debe esperar a que ambos estén llenos para filtrar (la única
   validación que bloquea el envío es la regla 3 de abajo, cuando ambos están presentes y el rango
   es inválido).
3. **`start_date` posterior a `end_date`:** el frontend NO debe enviar la petición; debe mostrar un
   mensaje de validación inline y mantener el último dato válido visible (no vaciar el dashboard).
4. **Rango fuera de `[min_date, max_date]` de facets:** los date pickers deben tener esos valores
   como `min`/`max` de HTML, por lo que este caso no debería ser alcanzable desde la UI — pero si
   se alcanza igual (ej. escribiendo la fecha a mano), el backend simplemente no encuentra
   movimientos en ese sub-rango y responde `[]`, que debe verse como el estado "sin datos" ya
   existente en los charts, no como error.

### Discrepancias encontradas
Ninguna — el requerimiento del PM coincide con el comportamiento real de `GET /api/metrics`.

---

## Funcionalidad 2 — Tabla de alertas de anomalías

### Endpoint(s)
- `GET /api/metrics/alerts?threshold=<ratio>` (verificado en
  `backend/app/routes.py::get_metrics_alerts`).

### Tipos usados
- Respuesta: `AlertsResponse` = `AlertEntry[]` (`api-types.ts`).
- Parámetros: `AlertsParams` (`param-types.ts`) = `{ threshold, ...DateRangeFilter }`.

### Valores válidos y restricciones
- `threshold`: la UI debe restringir el input a `[0.01, 1.0]` (regla de producto). El backend solo
  exige `threshold >= 0` (`Query(default=0.3, ge=0)`, sin máximo) — el límite superior de `1.0` NO
  lo garantiza la API, debe validarse en el cliente.
- `start_date` / `end_date`: mismas reglas que en la Funcionalidad 1.
- El endpoint también acepta `group_by` (`"day" | "week" | "month"`, default `"month"`) y
  `business_type` — ninguno de los dos es parte de esta funcionalidad según el requerimiento del
  PM (la tabla es global, no separada por línea de negocio), así que no forman parte de
  `AlertsParams`, aunque el endpoint los soporte.

### Casos borde
1. **Ningún período supera el `threshold` actual:** la respuesta es `[]` (200 OK). La tabla debe
   mostrar un mensaje de estado vacío explícito ("No se detectaron gastos inusuales con el umbral
   actual"), nunca desaparecer silenciosamente ni mostrarse en blanco.
2. **El primer período del rango filtrado:** nunca puede aparecer como alerta, sin importar cuánto
   gaste, porque el algoritmo necesita al menos un período anterior para calcular
   `baseline_average` (ver `detect_outcome_alerts` en `routes.py`). No es un bug si el usuario
   espera ver el primer mes marcado y no aparece.
3. **`threshold` muy bajo (ej. `0.01`):** puede devolver casi todos los períodos como "alerta",
   incluyendo incrementos triviales. Es comportamiento esperado del backend, no un error a
   manejar especialmente en el frontend — pero vale la pena que el input tenga el default en `0.3`
   para no aterrizar en ese caso por accidente.

### Discrepancias encontradas
**`baseline_average` NO es una "media móvil de los 3 períodos anteriores"** como describe el
requerimiento del PM. Verificado en `backend/app/routes.py::detect_outcome_alerts`: el backend
calcula el promedio de **todos** los períodos anteriores dentro del rango filtrado (promedio
expansivo desde el inicio de la serie, no una ventana fija de 3). Por ejemplo, para el 6º período
de una serie, `baseline_average` es el promedio de los 5 períodos anteriores, no de los últimos 3.

Esta especificación documenta lo que la API **realmente devuelve** (el promedio expansivo), no la
descripción original del PM. Antes de construir la UI, alguien debe decidir entre estas dos
opciones — no se puede resolver dentro de esta spec porque implica un cambio de comportamiento del
backend:
- (a) ajustar el copy de producto para describir correctamente "promedio histórico" en vez de
  "media móvil de 3 períodos", o
- (b) pedir que se modifique `detect_outcome_alerts` en el backend para usar una ventana fija de 3
  períodos, si el negocio realmente necesita esa semántica.

---

## Funcionalidad 3 — Vista de comparativa B2B vs B2C

### Endpoint(s)
- `GET /api/metrics/categories/top?operation_type=income&limit=5&business_type=<B2B|B2C>`
  (verificado en `backend/app/routes.py::get_top_categories`) — se llama DOS veces, una por línea
  de negocio.
- `GET /api/metrics/facets` — sin parámetros, para poblar el rango de fechas de esta vista.

### Tipos usados
- Respuesta: `TopCategoriesResponse` = `CategoryEntry[]` (`api-types.ts`), una instancia por línea
  de negocio.
- Facets: `FacetsResponse` (`api-types.ts`).
- Parámetros: `TopCategoriesParams` (`param-types.ts`) = `{ operation_type: "income", limit: 5,
  business_type, ...DateRangeFilter }`.

### Valores válidos y restricciones
- `operation_type`: fijo en `"income"` para esta funcionalidad (el backend acepta también
  `"outcome"`, pero el requerimiento pide específicamente ingresos).
- `limit`: fijo en `5`. Restricción real del backend: entero entre `1` y `20` (`ge=1, le=20`) — `5`
  está dentro de rango, no hace falta validación adicional en el cliente para este valor fijo.
- `business_type`: obligatorio para esta funcionalidad, uno de `"B2B"` / `"B2C"` — ver
  "Discrepancias encontradas" abajo, este campo no estaba en la composición de tipo originalmente
  pedida.
- `start_date` / `end_date`: mismas reglas que en la Funcionalidad 1, compartidas por ambas
  secciones (B2B y B2C usan el mismo rango de fechas).

### Casos borde
1. **Una línea de negocio no tuvo ingresos en el rango filtrado:** la respuesta para ese lado es
   `[]`. Esa tabla debe mostrar su propio estado vacío ("Sin ingresos registrados para B2B en este
   rango"), y la barra correspondiente en `IncomeComparisonChart` debe mostrarse en `0`, no
   ocultarse ni omitir la comparación completa.
2. **`limit=5` pero solo existen 2 categorías con ingreso > 0:** esto va a pasar SIEMPRE con los
   datos mock actuales, no es un caso raro. Verificado en
   `backend/app/routes.py::_build_movement`: cuando el movimiento generado es de tipo `"income"`,
   la categoría solo puede ser `"sales"` (90% de las veces) o `"others"` (10%) — nunca
   `"suppliers"`, `"operational"` ni `"administrative"` (esas 3 categorías solo se generan para
   `"outcome"`). Por lo tanto, cada tabla de esta funcionalidad va a mostrar como máximo 2 filas,
   nunca 5, aunque `limit=5`. La UI no debe tratar esto como una respuesta incompleta ni intentar
   "rellenar" hasta 5 filas.
3. **Ambas líneas de negocio fallan la petición al mismo tiempo vs. solo una:** si CUALQUIERA de
   las 2 llamadas falla (no ambas necesariamente), la vista completa debe mostrar el estado de
   error y no renderizar ninguna tabla ni el chart — mostrar un lado completo y el otro roto sería
   una comparación engañosa.

### Discrepancias encontradas
**`business_type` no estaba en la composición de `TopCategoriesParams` originalmente solicitada**
(que listaba solo "tipo de operación, limit y el filtro de rango de fechas"). Sin este campo, el
tipo no permite pedir el top de categorías de una sola línea de negocio — que es precisamente lo
que esta funcionalidad necesita para sus dos secciones en paralelo. El endpoint real
(`get_top_categories`) ya soporta `business_type` como parámetro opcional; en `param-types.ts` se
declaró como **requerido** para este caso de uso, porque la funcionalidad no tiene un caso de uso
válido sin especificarlo.
