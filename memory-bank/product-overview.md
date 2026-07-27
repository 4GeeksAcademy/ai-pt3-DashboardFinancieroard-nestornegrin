# Overview del Producto

**Fuente de evidencia:** `README.md`, `AGENTS.md`, `backend/app/routes.py`, `frontend/src/App.tsx`,
`docs/phase-1-analysis.md`. Todo lo afirmado aquí se puede verificar abriendo esos archivos.

## Qué es
Financial Metrics Dashboard: un dashboard ejecutivo de métricas financieras. Muestra ingresos,
egresos, ganancia neta y margen de ganancia a partir de "movimientos financieros" (registros con
fecha, monto, tipo de operación, categoría y tipo de negocio).

Es un **proyecto de práctica de 4Geeks Academy** (fork de
`4GeeksAcademy/ai-eng-financial-dashboard-context-project`, ver `README.md`), no un producto en
producción con clientes reales. Cualquier decisión de arquitectura debe leerse en ese contexto:
prioriza claridad didáctica y facilidad de correr en Codespaces sobre robustez de producción.

## A quién sirve (según lo que el UI expone)
El único consumidor de datos hoy es el dashboard mismo (`frontend/src/App.tsx`), pensado para una
persona que necesita una vista ejecutiva rápida: 4 KPIs (ingreso total, egreso total, ganancia,
margen de ganancia) y 2 gráficos (ingreso vs. egreso mensual, evolución del margen). No hay login,
no hay roles, no hay multi-tenant — un solo dataset visible para cualquiera que abra la app.

## Alcance real verificado
- **Datos:** 100% mock, generados en memoria por `generate_mock_movements(seed=42)` en
  `backend/app/routes.py` — 360 movimientos por año (30/mes × 12 meses), siempre los mismos por el
  seed fijo. No hay base de datos ni persistencia (`requirements.txt` no incluye ningún driver de
  BD ni ORM).
- **Autenticación:** ninguna. `CORSMiddleware` en `backend/app/main.py` permite todos los orígenes
  (`allow_origins=["*"]`) — correcto para un mock de desarrollo, inaceptable si esto se conecta a
  datos reales.
- **Capacidades del backend que el producto NO usa todavía:** el backend ya soporta segmentar por
  tipo de negocio (B2B/B2C), comparar periodos, detectar alertas de gasto anómalo y rankear
  categorías top — pero el dashboard actual no expone ninguna de esas vistas (ver
  `memory-bank/current-state.md` para el detalle).

## Cómo se corre (verificado, no aspiracional)
```bash
docker compose up --build
```
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000` (docs interactivas en `/docs`)
- Debugger backend: puerto `5678` (`debugpy`)
