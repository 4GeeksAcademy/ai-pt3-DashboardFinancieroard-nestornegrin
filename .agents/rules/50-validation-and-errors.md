# Validación y Manejo de Errores

**Alcance:** `backend/app/routes.py` (Query params), `frontend/src/App.tsx`.
**Razón:** de las 4 reglas propuestas (VALID-001..004), una ya está en práctica; el resto son
propuestas de mejora que requieren una dependencia nueva o son demasiado generales para verificar.

## Vigente — restricciones en query params vía Pydantic/FastAPI `Query`
Ya se usa: `limit: int = Query(default=5, ge=1, le=20)` en `/api/metrics/categories/top`,
`threshold: float = Query(default=0.3, ge=0)` en `/api/metrics/alerts`. Si agregas un query param
numérico nuevo, ponle límites razonables con `Query(ge=..., le=...)` en vez de validarlo a mano
dentro del handler.

## Backlog, requiere decisión — validación runtime en frontend con Zod
`App.tsx` hace `return response.json()` sin validar la forma de la respuesta. Es una mejora real,
pero añadir Zod (no está en `package.json`) es una decisión de dependencia, no algo que un agente
deba colar en una tarea no relacionada. Si el usuario lo pide explícitamente, es la primera
dependencia nueva a evaluar.

## Guía ligera, no regla dura — mensajes de error explícitos
El mensaje actual en español ("No se pudo cargar la información financiera...") ya es más útil que
un "Error" genérico — sigue ese nivel de detalle, sin necesidad de una regla formal adicional.

## Descartada por redundante — "documentar edge cases explícitamente"
Se solapa con `30-testing.md` (todo caso borde relevante debe tener un test, que es más verificable
que pedir un comentario).
