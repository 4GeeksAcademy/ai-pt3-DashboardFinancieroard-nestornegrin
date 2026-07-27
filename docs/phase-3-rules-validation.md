# Fase 3: Creación y Validación de Reglas en `.agents/rules/`

**Fecha:** 2026-07-27
**Objetivo:** convertir las 26 reglas propuestas en `docs/phase-2-code-audit.md` en archivos
verificables dentro de `.agents/rules/`, validando cada una contra el código real y refinando o
descartando las que resultaron ambiguas, demasiado genéricas, o desconectadas del flujo real del
proyecto.

## Método de validación
Para cada regla propuesta se comprobó, leyendo el código fuente directamente (no por inferencia):
1. ¿El repo ya hace esto? → se documenta como **vigente**, con la evidencia (archivo/línea).
2. ¿Es una mejora real pero no implementada? → se documenta como **backlog**, sin bloquear tareas.
3. ¿Es genérica al punto de no poder guiar una decisión concreta, o asume infraestructura que este
   proyecto no tiene (staging, CI de imágenes, etc.)? → se **descarta**, con la razón explícita.

## Resultado por categoría

| Archivo | Reglas de origen | Vigentes | Backlog | Descartadas |
|---|---|---|---|---|
| `10-architecture.md` | ARCH-001..004 | 3 | 1 (config por env en backend) | 0 |
| `20-naming-and-style.md` | NAMING-001..003 | 2 | 1 (constantes nombradas) | 1 (regla de longitud de nombre vía linter) |
| `30-testing.md` | TEST-001..004 | 2 | 1 (tests de componentes React) | 1 (umbral de cobertura no configurado) |
| `40-documentation.md` | DOC-001..004 | 1 | 2 (docstrings, comentarios) | 1 ("actualizar README siempre", reemplazada por criterio concreto) |
| `50-validation-and-errors.md` | VALID-001..004 | 1 | 1 (Zod en frontend) | 2 (mensajes de error ya cubiertos por convención existente; edge cases redundante con testing) |
| `60-developer-experience.md` | DX-001..004, INFRA-001..003 | 2 (hot reload, health check ya existen) | 2 (`.env.example` backend, logging) | 3 (multi-stage builds, paridad de ambientes, límite de tamaño de imagen — asumen un pipeline de producción que este proyecto no tiene) |

**Total:** 26 reglas propuestas → 11 vigentes (verificadas con evidencia), 8 en backlog explícito,
7 descartadas con justificación.

## Por qué se descartaron 7 reglas
No es que sean "malas prácticas" en abstracto — es que no pasaron la prueba de "¿puede esto guiar
una tarea concreta en este repositorio, hoy?":
- **Longitud mínima de nombre de variable:** no hay linter que lo aplique y la alternativa
  ("nombres descriptivos", que sí se mantiene) ya cubre la intención real.
- **Umbral de cobertura ≥80%/≥70%:** no hay configuración (`pyproject.toml`/`pytest.ini`) que lo
  mida; citarlo como regla activa sería inventar un número no verificable.
- **"Actualizar README en cada cambio arquitectónico":** demasiado vago para decidir cuándo aplica;
  se reemplazó por un criterio concreto (cambios a `docker-compose.yml`, puertos, o flujo de
  arranque sí requieren README; endpoints o componentes nuevos no).
- **Mensajes de error / edge cases como reglas separadas:** se solapaban con reglas ya vigentes
  (estilo de error existente, cobertura de tests), así que se fusionaron en vez de duplicarse.
- **Multi-stage Docker builds, paridad de ambientes, límite de tamaño de imagen:** son prácticas de
  hardening para servicios en producción. Este proyecto es un ejercicio académico que corre en
  Codespaces/local con `docker compose up --build`; no hay staging ni CI de imágenes. Aplicarlas
  agregaría complejidad sin beneficio medible en el flujo real.

## Brechas reales identificadas (quedan documentadas, no resueltas)
- El backend no tiene `.env.example` ni lee variables de entorno (CORS hardcodeado a `*`).
- No hay tests de componentes React (`*.test.tsx`); `@testing-library/react` ni siquiera está en
  `package.json`.
- 5 de 6 modelos del backend no tienen tipo espejo ni UI en el frontend (`70-api-contract-sync.md`
  tiene la tabla completa).
- No hay logging estructurado en el backend.

## Próximos pasos sugeridos (Fase 4)
- [ ] Crear `.agents/skills/` con habilidades concretas del repo (agregar endpoint, agregar
      gráfico del dashboard, sincronizar tipos).
- [ ] Crear `./memory-bank/` con el contexto persistente del proyecto.
- [ ] Decidir, con el equipo, cuáles de las brechas "backlog" se convierten en tareas reales.

---
**Validación completada:** 2026-07-27
