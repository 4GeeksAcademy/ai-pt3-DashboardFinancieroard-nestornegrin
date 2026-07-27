# Arquitectura

**Alcance:** `backend/app/**`, `frontend/src/**`, contrato entre ambos.
**Razón:** son las 4 reglas de `docs/phase-2-code-audit.md` (ARCH-001..004), validadas contra el
código real. Se mantienen porque describen restricciones verificables, no buenas intenciones.

## ARCH-001 — Endpoints sin efectos secundarios
**Estado:** vigente y verificado. Los 9 endpoints en `routes.py` son `GET` puros: generan datos con
`generate_mock_movements(seed=42)` y filtran; no escriben estado. Si agregas un endpoint que
modifica algo (POST/PUT/DELETE), documéntalo explícitamente como no-idempotente en el docstring y
en `docs/`.

## ARCH-002 — Los tipos van antes que la implementación
**Estado:** vigente. Todo dato que cruza la frontera backend/frontend nace como `Literal`/
`BaseModel` en `routes.py` o como `type`/`interface` en `financial-types.ts` antes de usarse en
lógica. No introduzcas `any` en TypeScript ni objetos sin tipar en Python para "ya resolver
después".

## ARCH-003 — Configuración por variables de entorno
**Estado:** parcialmente vigente, no lo trates como regla dura todavía. El frontend sí sigue esto
(`VITE_API_BASE_URL` en `frontend/.env.example`). El backend **no** tiene `.env.example` ni lee
variables de entorno — `CORSMiddleware` tiene `allow_origins=["*"]` hardcodeado. Si vas a tocar
configuración del backend, sigue el patrón del frontend (variable con default sensato) en vez de
hardcodear; no es bloqueante para tareas que no tocan configuración.

## ARCH-004 — Contrato frontend-backend
**Estado:** vigente y con brecha conocida. Ver `70-api-contract-sync.md` para la tabla completa:
5 de 6 modelos Pydantic no tienen tipo espejo en el frontend porque solo `/api/metrics` está
consumido. No es un bug, es deuda documentada — no la "arregles" sin que te lo pidan, pero no la
agrandes (todo modelo nuevo en el backend necesita su tipo en el frontend el mismo día).
