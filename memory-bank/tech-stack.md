# Stack Tecnológico

**Fuente de evidencia:** `frontend/package.json`, `backend/requirements.txt`, `docker-compose.yml`,
`frontend/Dockerfile`, `backend/Dockerfile`, `frontend/vite.config.ts`, `frontend/eslint.config.js`.
Versiones citadas tal cual aparecen en esos archivos al momento de escribir esto (2026-07-27);
revisa los archivos si ha pasado tiempo, pueden haberse actualizado.

## Frontend
| Capa | Herramienta | Versión (package.json) |
|---|---|---|
| Framework UI | React + React DOM | ^19.2.4 |
| Lenguaje | TypeScript | ~6.0.2 |
| Build tool | Vite | ^8.0.4 |
| Estilos | Tailwind CSS (`@tailwindcss/vite`) | ^4.2.2 |
| Gráficos | Recharts | ^3.8.1 |
| Íconos | lucide-react | ^1.8.0 |
| Utilidades de clases | class-variance-authority, clsx, tailwind-merge | ^0.7.1 / ^2.1.1 / ^3.5.0 |
| Testing | Vitest + @vitest/coverage-v8 | ^4.1.4 |
| Linting | ESLint + typescript-eslint + eslint-plugin-react-hooks/react-refresh | ^9.39.4 / ^8.58.0 |

**Patrón de componentes:** estilo shadcn/ui (componentes en `src/components/ui/`, no una librería
instalada vía npm — son archivos propios: `card.tsx`, `skeleton.tsx`).

**Alias de imports:** `@/` → `frontend/src/` (configurado en `vite.config.ts` y `tsconfig`).

**Proxy de desarrollo:** `vite.config.ts` redirige `/api` → `http://backend:8000` — por eso el
frontend no necesita `VITE_API_BASE_URL` en local/Codespaces (solo si se apunta a otro origen,
ver `frontend/.env.example`).

## Backend
| Dependencia | Rol | Versión (requirements.txt) |
|---|---|---|
| fastapi | Framework de API | sin pin de versión |
| uvicorn[standard] | Servidor ASGI | sin pin de versión |
| debugpy | Debugger remoto (puerto 5678) | sin pin de versión |
| pytest | Test runner | sin pin de versión |
| pytest-cov | Cobertura de tests | sin pin de versión |
| httpx | Cliente HTTP (usado por `TestClient` de FastAPI) | sin pin de versión |

**Nota de riesgo real:** ninguna dependencia de `requirements.txt` tiene versión fijada — un
`pip install` en fechas distintas puede traer versiones distintas. No hay `pyproject.toml` ni
lockfile (`pip freeze` / `poetry.lock` / `uv.lock`) que lo resuelva hoy.

**Lenguaje:** Python 3.13 (según `backend/Dockerfile`, imagen `python:3.13-slim`).

**Patrón:** un solo router (`APIRouter`) en `app/routes.py`, modelos con `Literal` + `BaseModel` de
Pydantic, sin capa de servicios/repositorio separada — todo (modelos, generación mock, filtros,
endpoints) vive en un archivo.

## Infraestructura y tooling de desarrollo
| Pieza | Detalle |
|---|---|
| Orquestación | `docker-compose.yml`: 2 servicios, `frontend` y `backend`, con `depends_on` (frontend espera a backend) |
| Imagen frontend | `node:24-alpine`, corre `npm run dev -- --host 0.0.0.0 --port 5173` |
| Imagen backend | `python:3.13-slim`, corre `uvicorn` con `--reload` bajo `debugpy --listen 0.0.0.0:5678` |
| Puertos expuestos | Frontend `5173`; Backend `8000` (API) y `5678` (debugger) |
| Hot reload | Sí, en ambos servicios (volúmenes montados: `./frontend:/app`, `./backend:/app`) |
| CI/CD | No existe (`.github/workflows` no está presente en el repo) |
| Contenerización multi-stage | No — ambos Dockerfiles son de una sola etapa (aceptable para dev; ver `.agents/rules/60-developer-experience.md` sobre por qué no se exige hardening de producción aquí) |

## Ausencias verificadas (no son suposiciones)
- Sin base de datos ni ORM.
- Sin sistema de autenticación/autorización.
- Sin `backend/.env.example` ni lectura de variables de entorno en `app/main.py`.
- Sin librería de validación runtime en frontend (no hay `zod` ni similar en `package.json`).
- Sin `@testing-library/react` — no hay tests de componentes, solo de `financial-utils.ts`.
