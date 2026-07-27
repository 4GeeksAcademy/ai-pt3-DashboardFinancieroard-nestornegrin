# Documentación

**Alcance:** `backend/app/routes.py`, `README.md`, `docs/`.
**Razón:** de las 4 reglas de documentación propuestas (DOC-001..004), solo una describe algo que
el código ya hace; las otras son mejoras futuras, no reglas para bloquear una tarea.

## Vigente — type hints en todas las funciones
`routes.py` anota tipo de retorno en cada función (`-> list[FinancialMovement]`, `-> float`, etc.).
Mantén esa disciplina en Python y en TypeScript (no dejes retornos implícitos `any`).

## Backlog — docstrings en endpoints
Ningún endpoint tiene docstring hoy; FastAPI ya genera Swagger en `/docs` a partir de los modelos
Pydantic, así que la falta de docstrings no rompe nada operativamente. Si agregas un endpoint
nuevo, un docstring de una línea es bienvenido pero no obligatorio para que la tarea se considere
terminada.

## Backlog — comentarios justificando valores hardcoded
Ligado a `20-naming-and-style.md`: útil, no bloqueante.

## Descartada tal cual — "actualizar README en cada cambio de arquitectura"
Demasiado genérica para ser verificable ("¿qué cuenta como cambio de arquitectura?"). Se reemplaza
por algo concreto: si cambias el `docker-compose.yml`, los puertos, o el flujo de
`Recommended steps` del README, actualiza el README en el mismo cambio. Si solo agregas un
endpoint o componente, no hace falta tocar el README.
