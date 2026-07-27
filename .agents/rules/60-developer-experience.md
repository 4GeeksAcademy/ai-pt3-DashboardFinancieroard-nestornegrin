# Developer Experience e Infraestructura

**Alcance:** `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`.
**Razón:** de las 7 reglas propuestas entre DX (4) e Infra (3), 2 describen algo que ya existe
(no son "reglas" sino hechos de la config actual), 1 es una brecha real, y 3 se descartan por estar
desconectadas del propósito del proyecto (una app de práctica académica, no un servicio en
producción).

## Ya existe, no requiere acción — hot reload y debugpy
`uvicorn --reload` y `npm run dev` ya dan hot-reload; `debugpy` ya escucha en `:5678`. Esto es
contexto (ver `00-project-conventions.md`), no algo que un agente deba "implementar".

## Ya existe, no requiere acción — health check
El endpoint `GET /health` ya existe en `routes.py` y tiene test. La auditoría lo listaba como
pendiente por error. Si necesitas health-check a nivel de Docker Compose (para dependencias
condicionadas a "healthy"), ahí sí falta wiring — pero es una mejora de orquestación, no una
regla de código.

## Brecha real — falta `.env.example` en el backend
El frontend tiene `frontend/.env.example`; el backend no tiene equivalente y no lee ninguna
variable de entorno (CORS está hardcodeado a `*`). Si una tarea toca configuración del backend,
crear `backend/.env.example` siguiendo el patrón del frontend es razonable. No es bloqueante para
tareas que no tocan configuración.

## Backlog de bajo riesgo — logging estructurado en el backend
Hoy no hay `logging` ni `print()` en `routes.py` (está limpio, pero sin observabilidad). Añadirlo
es válido si una tarea lo requiere explícitamente; no lo agregues "de paso" en una tarea de otro
alcance.

## Descartadas — multi-stage Docker builds, "paridad de ambientes", límites de tamaño de imagen
Estas 3 reglas de la auditoría asumen un pipeline de producción (staging, prod, CI de tamaño de
imagen) que este proyecto no tiene: es un ejercicio de práctica que corre en Codespaces/local via
`docker compose up --build`. Aplicarlas agregaría complejidad sin beneficio real para el flujo
actual. Si el proyecto evoluciona a un despliegue real, revisar esta decisión.
