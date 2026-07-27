/**
 * frontend/specs/api-types.ts
 *
 * Contrato de RESPUESTA de la API para las 3 funcionalidades del PM (fase 5).
 * Verificado línea por línea contra `backend/app/routes.py` (modelos Pydantic) y contra
 * `/docs` (Swagger). No son tipos aspiracionales: cada campo mapea 1:1 a lo que el backend
 * serializa hoy.
 *
 * Los tipos de dominio (OperationType, Category, BusinessType) NO se redefinen aquí — se
 * importan desde la fuente de verdad existente del frontend para no duplicar el contrato y
 * arriesgar que diverja (ver `.agents/rules/70-api-contract-sync.md`).
 */
import type {
  OperationType,
  Category,
  BusinessType,
} from "../src/lib/financial-types";

/**
 * Respuesta de `GET /api/metrics/facets`. Sin parámetros de entrada — siempre describe el
 * dominio COMPLETO del dataset (no se reduce si hay otros filtros aplicados en otra
 * funcionalidad). Se usa para: (a) mostrar el rango de fechas disponible en la Funcionalidad 1,
 * y (b) poblar las categorías disponibles en la Funcionalidad 3.
 * Fuente: `backend/app/routes.py::MetricsFacets` + `get_metrics_facets`.
 */
export interface FacetsResponse {
  /** Valores de `operation_type` presentes en el dataset. Hoy siempre `["income", "outcome"]`. */
  operation_types: OperationType[];
  /** Valores de `business_type` presentes en el dataset. Hoy siempre `["B2B", "B2C"]`. */
  business_types: BusinessType[];
  /** Las 5 categorías del dominio, en orden alfabético (así las serializa el backend). */
  categories: Category[];
  /**
   * Fecha del movimiento más antiguo del dataset completo, formato `YYYY-MM-DD`.
   * Úsala como límite inferior (`min`) del input de fecha de inicio.
   */
  min_date: string;
  /**
   * Fecha del movimiento más reciente del dataset completo, formato `YYYY-MM-DD`.
   * Úsala como límite superior (`max`) del input de fecha de fin.
   */
  max_date: string;
}

/**
 * Una fila de la respuesta de `GET /api/metrics/alerts`: un período cuyo gasto (`outcome`) subió
 * por encima del `threshold` solicitado, respecto al promedio histórico de períodos anteriores.
 *
 * ⚠️ DISCREPANCIA CON EL REQUERIMIENTO DEL PM: el PM describe `baseline_average` como "media móvil
 * de los 3 períodos anteriores". Verificado en `backend/app/routes.py::detect_outcome_alerts`:
 * el backend NO usa una ventana fija de 3 períodos — usa el promedio de **todos** los períodos
 * anteriores dentro del rango solicitado (promedio expansivo/acumulativo, no una media móvil de
 * ventana fija). Este tipo documenta lo que la API realmente devuelve; la discrepancia queda
 * registrada en `README.md` para que el PM decida si el copy de producto se ajusta o si se pide
 * un cambio de backend antes de construir la UI.
 */
export interface AlertEntry {
  /**
   * Identificador del período, cuyo formato depende del `group_by` enviado en la petición:
   * `"YYYY-MM"` si `group_by="month"` (default), `"YYYY-Www"` si `"week"` (ej. `"2026-W12"`),
   * `"YYYY-MM-DD"` si `"day"`. La Funcionalidad 2 usa siempre el default `"month"`.
   */
  period: string;
  /** Total de egresos (`outcome`) de ese período, en dólares, redondeado a 2 decimales. */
  outcome_total: number;
  /**
   * Promedio de `outcome` de todos los períodos ANTERIORES a este dentro de la serie filtrada
   * (no una ventana fija de 3 — ver nota de discrepancia arriba). Redondeado a 2 decimales.
   */
  baseline_average: number;
  /**
   * Incremento relativo de `outcome_total` sobre `baseline_average`, como fracción
   * (ej. `0.42` = 42% por encima del promedio). Redondeado a 4 decimales por el backend;
   * en la UI se muestra como porcentaje con 1 decimal: `(increase_ratio * 100).toFixed(1)`.
   * Siempre `> threshold` enviado en la petición (si no, ese período no aparece en la respuesta).
   */
  increase_ratio: number;
}

/**
 * Respuesta completa de `GET /api/metrics/alerts`: una lista de `AlertEntry`, en el orden
 * cronológico en que el backend recorre los períodos (NO viene ordenada por severidad).
 * Si no hay períodos que superen el `threshold`, la respuesta es un arreglo vacío `[]`
 * (200 OK, no error) — ver caso borde en `README.md`.
 */
export type AlertsResponse = AlertEntry[];

/**
 * Una fila de la respuesta de `GET /api/metrics/categories/top`: una categoría rankeada por
 * monto total para un `operation_type` dado.
 */
export interface CategoryEntry {
  /** Una de las 5 categorías del dominio (`suppliers`, `sales`, `operational`, `administrative`, `others`). */
  category: Category;
  /**
   * El `operation_type` que se pidió en la petición (siempre el mismo valor repetido en todas
   * las filas de una misma respuesta — el backend no mezcla income y outcome en una sola llamada).
   * La Funcionalidad 3 siempre pide `"income"`.
   */
  operation_type: OperationType;
  /** Suma de montos de esa categoría para ese `operation_type`, redondeada a 2 decimales. */
  total_amount: number;
}

/**
 * Respuesta completa de `GET /api/metrics/categories/top`: lista ordenada de mayor a menor
 * `total_amount`, truncada a `limit` elementos (el backend ya ordena y trunca — el frontend NO
 * necesita reordenar). Si `limit=5` pero el dataset filtrado solo tiene 3 categorías con montos
 * distintos de cero, la respuesta trae 3 elementos, no 5 rellenados con ceros.
 */
export type TopCategoriesResponse = CategoryEntry[];
