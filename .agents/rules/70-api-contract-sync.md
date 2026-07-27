# Sincronía del Contrato de API

**Alcance:** modelos Pydantic en `backend/app/routes.py` vs. tipos en
`frontend/src/lib/financial-types.ts`.
**Razón:** no hay generación automática de tipos (no OpenAPI codegen); el contrato se sincroniza a
mano y ya está desalineado hoy. Cualquier agente debe conocer el estado real antes de tocar
cualquiera de los dos lados.

## Estado verificado (no asumido)
| Modelo backend         | Tipo frontend equivalente | ¿Algún componente lo consume? |
|-------------------------|----------------------------|-------------------------------|
| `FinancialMovement`     | `FinancialMovement`        | Sí — el único conectado hoy |
| `MetricsSummaryItem`    | *(no existe)*              | No |
| `MetricsFacets`         | *(no existe)*              | No |
| `TopCategoryItem`       | *(no existe)*               | No |
| `MetricsComparison`     | *(no existe)*               | No |
| `MetricsAlert`          | *(no existe)*               | No |

`App.tsx` solo llama a `GET /api/metrics`. Los otros 5 endpoints (`/summary`, `/facets`,
`/categories/top`, `/comparison`, `/alerts`, más `/b2b` y `/b2c`) existen, tienen tests en el
backend, pero no tienen tipo, fetch ni UI en el frontend.

## Regla
1. Si cambias campos de un modelo Pydantic existente, actualiza `financial-types.ts` en el mismo
   cambio y actualiza esta tabla.
2. Si conectas uno de los endpoints "no consumidos" a la UI, quita esa fila de la lista de
   pendientes (o márcala como resuelta) en el mismo PR.
3. No agregues un endpoint nuevo sin decidir, en el mismo cambio, si el frontend lo va a consumir
   ahora o si queda documentado aquí como pendiente.
