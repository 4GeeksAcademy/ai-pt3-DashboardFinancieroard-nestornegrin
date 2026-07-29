# Progreso de sesión — Skills de agente (accesibilidad + buenas prácticas)

**Rama:** `feature/agent-skills` · **Fecha:** 2026-07-29
**Fuente de evidencia:** cambios reales en `frontend/src/**`, `frontend/index.html`,
`.claude/skills/*/SKILL.md` (instalados vía `npx skills`), build/test output real
(`npm run build`, `npx vitest run`), y `.skills/kpi-variant-convention/SKILL.md`.

## Skills descubiertas y cargadas

- `vercel-react-best-practices` (vercel-labs/agent-skills) — instalada con
  `npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices`.
  70 reglas priorizadas; la mayoría son agnósticas de framework (re-renders,
  bundle, JS perf) y sí aplican a este proyecto Vite. Las reglas específicas de
  Next.js (`next/image`, `next/dynamic`, metadata API, `server-*`) **no aplican
  literalmente** porque este proyecto usa Vite, no Next.js — se adaptaron a su
  equivalente en Vite/React (ver abajo).
- **"accessibility" no existe como skill con ese nombre exacto** en el
  ecosistema real de skills.sh (verificado consultando `skills.sh` y el
  catálogo de `vercel-labs/agent-skills`). Se usó `web-design-guidelines`
  (misma fuente, "Vercel's Web Interface Guidelines covering spacing,
  typography, interaction, and accessibility") como sustituto documentado.
- **Limitación de entorno:** `npx skills find <query>` no devolvió resultados
  para ningún término (ni siquiera "react") en este entorno porque el sandbox
  no tiene acceso a `api.github.com` (solo a `github.com` para `git clone`).
  Se usó `npx skills add <owner/repo> --list` contra fuentes conocidas
  (`vercel-labs/agent-skills`, `anthropics/skills`) y las páginas de
  `skills.sh/topic/*` como alternativa confiable para descubrir skills.

## Cambios aplicados — accesibilidad (`web-design-guidelines`)

| Archivo | Cambio | Por qué |
|---|---|---|
| `dashboard-header.tsx` | `aria-hidden="true"` en el icono `LayoutDashboard` | Icono decorativo; sin esto, algunos lectores de pantalla lo anuncian sin aportar información |
| `kpi-card.tsx` | `aria-hidden="true"` en el icono de cada KPI | Mismo motivo, se repite en las 4 tarjetas vía `KPIRow` |
| `ui/card.tsx` | `CardTitle` ahora renderiza `<h2>` en vez de `<div>` | Los títulos de cada gráfico ("Income vs. Outcome", "Profit Margin %") no eran heading real; usuarios de lector de pantalla que navegan por encabezados no los encontraban |
| `income-outcome-chart.tsx`, `profit-percent-chart.tsx` | `accessibilityLayer` explícito en `<LineChart>` | Habilita navegación por teclado (Tab + flechas) y descripciones ARIA por punto de dato en Recharts. **Ya viene `true` por defecto en recharts 3.8.1** (verificado en `node_modules/recharts/types/chart/CartesianChart.d.ts`) — se dejó explícito solo para que quede documentado y no se desactive por accidente |

**Contraste de color** — no se "verificó a ojo": se calculó con un script
(oklch → sRGB lineal → luminancia relativa → ratio WCAG) contra los tokens
reales de `index.css` en modo oscuro (el único que se usa: `App.tsx` fuerza
`className="dark ..."`):

| Par | Ratio | Resultado |
|---|---|---|
| foreground / background | 16.88:1 | PASA AA |
| muted-foreground / background | 5.53:1 | PASA AA |
| muted-foreground / card | 5.17:1 | PASA AA |
| destructive-foreground / bg-destructive\/10 | 16.49:1 | PASA AA |

**Alt text / navegación por teclado** — no hay ningún `<img>` en el proyecto
(verificado con grep) y no había, antes de esta sesión, ningún elemento
interactivo nativo (botón, link, input) en el dashboard — es un panel de solo
lectura. El único elemento ahora navegable por teclado es el gráfico
(`accessibilityLayer`). Esto se documenta explícitamente en vez de forzar
`tabIndex`/`role="button"` artificiales donde no hay interacción real.

**Verificación:** se intentó una pasada real con Playwright (skill
`webapp-testing`, ver más abajo) pero el sandbox no tiene permisos de root
para instalar las dependencias de sistema de Chromium
(`sudo playwright install-deps` falla sin root). Como alternativa se verificó
que los atributos sobrevivieron el build de producción real
(`grep -c aria-hidden dist/assets/*.js` → 3 ocurrencias;
`grep -c accessibilityLayer dist/assets/LineChart-*.js` → 14; `<h2>` presente
en el chunk de `ui/card`). Recomendado: repetir una pasada manual de teclado
(Tab a través del dashboard) en un navegador real como confirmación final.

## Cambios aplicados — `vercel-react-best-practices` (adaptado a Vite)

| Regla | Archivo | Cambio |
|---|---|---|
| `js-combine-iterations` | `financial-utils.ts::computeKPIs` | Combinó 2 pasadas (`.filter().reduce()` para income + outcome) en 1 sola pasada con `for` |
| `bundle-dynamic-imports` (adaptado — `next/dynamic` → `React.lazy`) | `App.tsx` | `IncomeOutcomeChart` y `ProfitPercentChart` (que cargan `recharts`, la dependencia más pesada) ahora se cargan con `React.lazy` + `Suspense`, no en el bundle principal |
| next/image, metadata API de Next.js | — | **No aplican**: no hay Next.js ni `<img>` en el proyecto (verificado con grep). El equivalente real para "title/meta description" en un SPA Vite es editar `index.html` directamente (ver abajo) |
| `bundle-barrel-imports` | `lucide-react` imports | **Evaluado, sin cambio de código**: la regla recomienda `optimizePackageImports` (solo Next.js) o imports profundos — pero la propia regla advierte que los imports profundos de `lucide-react` rompen los tipos de TypeScript. Se verificó que `lucide-react` ya declara `"sideEffects": false` y ESM real, así que Vite/Rollup ya hace tree-shaking del barrel sin cambios manuales |

**`frontend/index.html`** — `<title>` genérico ("frontend") reemplazado por
"Financial Overview Dashboard" + `<meta name="description">` agregado (no
existía ninguno).

**Resultado del build** (antes → después, mismo `npm run build`):

| | Antes | Después |
|---|---|---|
| Bundle principal | 584.26 kB (advertencia: ">500kB") | 187.83 kB |
| Chart pesado (recharts) | dentro del bundle principal | chunk separado `LineChart-*.js`, 342.29 kB, carga async |
| Advertencias del build | 1 (chunk grande) | 0 |

`npx vitest run` — 5/5 tests siguen pasando sin cambios (confirma que
`computeKPIs` produce los mismos valores tras combinar las iteraciones).

## Skill adicional explorada y aplicada: `webapp-testing`

Se exploraron los topics `react`, `testing` y `design` en skills.sh. Se eligió
instalar `webapp-testing` (anthropics/skills) para intentar una verificación
real en navegador de los fixes de accesibilidad (cerrar el ciclo entre "la
skill dice X" y "X es cierto en la app corriendo"), en vez de una skill de
estilo/diseño ya cubierta por `web-design-guidelines`. Se instaló y se dejó
el backend real corriendo (`uvicorn`) + build de producción listo para probar,
pero Playwright no pudo lanzar Chromium por falta de dependencias de sistema
sin acceso root en este sandbox — limitación de entorno documentada arriba,
no un fallo de la skill.

## Skill propia creada

`.skills/kpi-variant-convention/SKILL.md` — documenta la convención real de
este proyecto para agregar una nueva variante de KPI card (tipo → mapa de
estilos → tokens CSS en ambos temas → wiring en `KPIRow`), incluyendo el
precedente de que `profitPercent` reutiliza la paleta de `profit` en vez de
tener tokens propios. Ninguna skill genérica (accesibilidad o rendimiento)
conoce esta convención porque es específica de cómo este dashboard nombra y
cablea sus tokens de color — no un patrón general de React.

## Pendiente / no cubierto en esta sesión

- Verificación de accesibilidad con navegador real (Playwright) — bloqueada
  por falta de permisos root en este sandbox; recomendada como paso manual.
- `src/assets/hero.png` (44KB) no se referencia en ningún componente —
  candidato a limpieza en una sesión futura, fuera del alcance de "mejora
  dirigida" de esta tarea.

## Corrección posterior — la skill "accessibility" sí existe

Al pedir verificación cruzada, se corrió `npx skills find accessibility` desde
un entorno con acceso real a internet (Codespace del usuario, no este
sandbox). Resultado real: **sí existe** una skill llamada exactamente
`accessibility` — `addyosmani/web-quality-skills@accessibility` (40K
instalaciones, top resultado). La conclusión anterior ("no existe ninguna
skill con ese nombre exacto") era incorrecta — reflejaba una limitación de
red de este sandbox, no la realidad del ecosistema. Se corrige aquí en vez
de dejarlo sin señalar.

Se instaló y revisó el SKILL.md real (WCAG 2.2, principios POUR). Comparado
contra lo ya aplicado con `web-design-guidelines`:

- Alt text, contraste, teclado, ARIA-en-divs, idioma de página: ya cubiertos
  correctamente, coinciden con esta skill real.
- **Dos gaps genuinos encontrados y corregidos:**
  - **Motion (2.3):** no se respetaba `prefers-reduced-motion` — el pulso del
    `Skeleton` y la transición de hover en `KPICard` corrían siempre. Se
    agregó el media query estándar en `index.css` (mismo patrón que muestra
    la skill) para desactivar animaciones/transiciones cuando el usuario
    prefiere movimiento reducido.
  - **Live regions / errores (4.1.3, 3.3.1):** el banner de error en
    `App.tsx` se insertaba sin anunciarse a lectores de pantalla. Se agregó
    `role="alert"` para que sea una región viva asertiva.
- Confirmado no aplicable a este dashboard (sin formularios, sin navegación,
  sin login, sin video/audio, sin drag): skip links, form labels,
  autenticación accesible, tamaño de objetivo táctil, timing.

`npm run build` y `npx vitest run` (5/5) verificados de nuevo tras estos
dos cambios — sin regresiones.
