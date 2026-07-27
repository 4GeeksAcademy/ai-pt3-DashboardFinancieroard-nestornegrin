# Convenciones del Proyecto

**Alcance:** todo el repositorio.
**Razón:** dar a cualquier agente el mapa mínimo para no perderse antes de tocar código.

## Qué es este proyecto
Dashboard de métricas financieras: frontend React 19 + TypeScript (Vite 8, Tailwind v4,
componentes estilo shadcn, Recharts 3) consumiendo un backend FastAPI que sirve movimientos
financieros mock (ingresos/egresos con categoría y tipo de negocio).

## Mapa de directorios
```
backend/app/main.py     App FastAPI, CORS, monta el router (sin lógica de negocio)
backend/app/routes.py   TODA la lógica: modelos Pydantic, generación mock, filtros, endpoints
backend/tests/          pytest, un test por endpoint real (via TestClient)
frontend/src/App.tsx    Único punto que hace fetch; orquesta estado y componentes
frontend/src/lib/       financial-types.ts (tipos), financial-utils.ts (cálculos puros)
frontend/src/components/dashboard/  Componentes de feature (header, KPIs, gráficos)
frontend/src/components/ui/         Primitivas genéricas (Card, Skeleton)
docs/                   Bitácora de fases del agente (análisis, auditoría, reglas)
```

## Cómo correr el proyecto
```bash
docker compose up --build
```
Frontend `:5173`, backend `:8000`, docs de API en `:8000/docs`, debugger en `:5678`.

## Notas
- `frontend/src/lib/mock-data.ts` no se usa: `App.tsx` llama al backend real, no a este archivo.
  No agregar funcionalidad ahí; si lo tocas, decide si debe borrarse (ver `memory-bank` o
  `docs/phase-2-code-audit.md`).
- Este archivo es contexto, no una regla verificable por sí sola. Las reglas accionables están en
  los demás archivos de `.agents/rules/`.
