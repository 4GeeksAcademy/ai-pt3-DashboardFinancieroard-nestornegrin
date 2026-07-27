# Spec 2: Detección de Gastos Inusuales

**Feedback de origen:** "una forma de detectar gastos inusuales sin revisar filas una a una."
**Endpoint backend involucrado:** `GET /api/metrics/alerts`.
**Estado:** especificación — sin implementar.

## 1. Qué ve el usuario
Una nueva sección "Alertas de Gasto Inusual" en el dashboard (card independiente, debajo de los
gráficos existentes), con:
1. Un selector de **sensibilidad**: "Baja" / "Media" (default) / "Alta" — mapeado a un `threshold`
   fijo, no a un input numérico libre (ver regla 3 más abajo, sobre por qué no se expone el número
   crudo al usuario final).
2. Una lista de alertas, cada fila mostrando: periodo, monto de gasto de ese periodo, y cuánto se
   desvió del promedio histórico (ej. "Marzo 2026 — $41,100 — 42% por encima del promedio").
3. Si no hay alertas: un estado positivo, no un error (ver sección 4).

## 2. Datos que necesita el componente
`GET /api/metrics/alerts` con estos query params:

| Param | Tipo | Default | Mapeo UI |
|---|---|---|---|
| `threshold` | float, `>= 0` | `0.3` | Sensibilidad Baja → `0.5` · Media → `0.3` · Alta → `0.15` |
| `group_by` | `"day" \| "week" \| "month"` | `"month"` | Fijo en `"month"` para esta vista (no expuesto como control) |
| `start_date` / `end_date` | fecha ISO | ninguno | Opcional, si se reutiliza el filtro de fecha de la Spec 1 |
| `business_type` | `"B2B" \| "B2C"` | ninguno (= ambos combinados) | Opcional, si se reutiliza el filtro de negocio de la Spec 1 |

Respuesta: `list[MetricsAlert]`, cada item:
```json
{ "period": "2026-03", "outcome_total": 41100.0, "baseline_average": 28950.5, "increase_ratio": 0.4197 }
```

## 3. Reglas de negocio por campo (cómo funciona el algoritmo del backend, verificado en `routes.py::detect_outcome_alerts`)
- `baseline_average` es el **promedio del gasto de todos los periodos anteriores** dentro de la
  serie ya filtrada (no todo el histórico completo si hay `start_date`/`end_date` aplicados) — es
  un promedio móvil expansivo, no una ventana fija.
- **El primer periodo de cualquier serie nunca puede generar una alerta** — no tiene periodos
  anteriores para calcular `baseline_average`. No es un bug si el primer mes con gasto alto no
  aparece en la lista.
- Si `baseline_average` es `0` (no hubo gasto en ningún periodo anterior), ese periodo se omite del
  cálculo de alerta — pero sí se suma al histórico para periodos futuros.
- `increase_ratio` ya viene redondeado a 4 decimales desde el backend. Mostrarlo como
  `(increase_ratio * 100).toFixed(1) + "%"`.
- **El backend devuelve los items en orden cronológico, no por severidad.** El frontend debe
  reordenar client-side por `increase_ratio` descendente — es lo que cumple el objetivo de "sin
  revisar fila por fila" (la más grave primero).
- No expongas `threshold` como número libre en la UI: es un umbral relativo (30% = "el gasto subió
  30% sobre su propio promedio histórico"), no un monto en dólares — un input numérico sin contexto
  confundiría al equipo de finanzas más de lo que ayudaría. Por eso el mapeo a 3 niveles con
  nombres (Baja/Media/Alta).

## 4. Estados
- **Carga:** skeleton (mismo patrón que el resto del dashboard).
- **Error:** mismo banner de error existente.
- **Vacío (sin alertas):** mensaje positivo explícito, ej. "No se detectaron gastos inusuales en el
  periodo seleccionado" con un ícono de check — **no** debe verse ni sonar como un error.

## 5. Fuera de alcance de esta especificación
- Alertas sobre `income` — el algoritmo del backend solo evalúa `outcome` (egresos), no hay
  endpoint que detecte picos de ingreso.
- Notificaciones push, email o webhooks — la alerta solo se muestra al cargar el dashboard.
- Un input de threshold totalmente libre (ver regla anterior).
