/**
 * frontend/specs/param-types.ts
 *
 * Contrato de PARÁMETROS DE CONSULTA (query params) que el frontend envía a la API para las
 * 3 funcionalidades del PM (fase 5). Los nombres de campo usan snake_case a propósito: son el
 * nombre literal del query param tal como lo espera FastAPI (`start_date`, `end_date`,
 * `operation_type`, etc.), no un modelo interno de la app — así se pueden serializar a
 * `URLSearchParams` sin una capa de traducción intermedia.
 *
 * Verificado línea por línea contra las firmas reales de `backend/app/routes.py`.
 */
import type { OperationType, BusinessType } from "../src/lib/financial-types";

/**
 * Filtro de rango de fechas, compartido por las 3 funcionalidades. Ambos campos son opcionales
 * de forma independiente (se puede mandar solo `start_date`, solo `end_date`, ninguno, o ambos).
 * Cuando un campo se omite, el backend no acota ese extremo del rango — NO significa "sin
 * resultados", significa "sin límite en ese lado".
 *
 * Endpoints reales que aceptan estos dos campos con este mismo significado:
 * `GET /api/metrics`, `GET /api/metrics/alerts`, `GET /api/metrics/categories/top`.
 */
export interface DateRangeFilter {
  /**
   * Fecha de inicio del rango (inclusive), formato `YYYY-MM-DD` (ISO 8601, sin componente de
   * hora). Omitir la clave (no enviar `undefined` como string) cuando el input de fecha esté
   * vacío. Debe ser `<= end_date` si ambos están presentes; ver caso borde en `README.md`.
   */
  start_date?: string;
  /**
   * Fecha de fin del rango (inclusive), formato `YYYY-MM-DD`. Mismas reglas que `start_date`.
   */
  end_date?: string;
}

/**
 * Parámetros de `GET /api/metrics/alerts`, usados por la Funcionalidad 2 (tabla de anomalías).
 */
export interface AlertsParams extends DateRangeFilter {
  /**
   * Umbral relativo de incremento de gasto que dispara una alerta, como fracción (`0.3` = 30%).
   * Valor por defecto en la UI: `0.3`.
   *
   * Restricción de PRODUCTO (input de la UI): el input numérico debe aceptar solo valores en
   * `[0.01, 1.0]`, con paso sugerido `0.01`.
   *
   * ⚠️ El backend NO impone ese máximo: la restricción real de la API es únicamente
   * `threshold >= 0` (`Query(default=0.3, ge=0)`, sin `le=`). Un valor de `1.5` sería aceptado
   * por el backend sin error. El límite superior de `1.0` debe validarse en el cliente antes de
   * construir la petición — no asumas que el backend lo va a rechazar por ti.
   */
  threshold: number;
}

/**
 * Parámetros de `GET /api/metrics/categories/top`, usados por la Funcionalidad 3 (comparativa
 * B2B vs B2C) para pedir el top de categorías de ingreso de CADA línea de negocio por separado.
 */
export interface TopCategoriesParams extends DateRangeFilter {
  /**
   * Tipo de operación a rankear. El backend por defecto usa `"outcome"` si el parámetro se
   * omite — la Funcionalidad 3 debe enviarlo SIEMPRE explícitamente como `"income"` (el
   * requerimiento pide "categorías de ingreso principales").
   */
  operation_type: OperationType;
  /**
   * Cantidad máxima de categorías a devolver. Restricción real del backend:
   * entero entre `1` y `20` (`Query(default=5, ge=1, le=20)`). La Funcionalidad 3 siempre
   * envía `5`. Si el dataset filtrado tiene menos de `limit` categorías con monto > 0, la
   * respuesta trae menos filas — no se rellena con ceros.
   */
  limit: number;
  /**
   * Línea de negocio a la que se restringe el ranking (`"B2B"` o `"B2C"`).
   *
   * CORRECCIÓN sobre la composición de tipo originalmente solicitada (que listaba solo
   * "tipo de operación, limit y el filtro de rango de fechas"): sin `business_type`, este tipo
   * no permite pedir el top de categorías de una sola línea de negocio — que es exactamente lo
   * que la Funcionalidad 3 necesita para sus dos tablas en paralelo (una por línea). El endpoint
   * real ya soporta `business_type` como parámetro opcional (`Query(default=None)`); aquí se
   * declara REQUERIDO porque la funcionalidad no tiene un caso de uso válido sin especificarlo
   * (mostrar categorías sin separar por línea de negocio no es lo que pidió el PM).
   */
  business_type: BusinessType;
}
