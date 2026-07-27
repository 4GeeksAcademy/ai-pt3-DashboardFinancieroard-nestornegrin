# Fase 2: Auditoría de Código - Buenas Prácticas y Riesgos

**Fecha:** 2026-07-27  
**Objetivo:** Identificar patrones de calidad, riesgos técnicos y proponer un set de reglas para garantizar consistencia y mantenibilidad.

---

## 1. Buenas Prácticas Identificadas

### 1.1 Type Safety (Backend + Frontend)

**Evidencia Backend:** [`backend/app/routes.py`](../backend/app/routes.py#L1-L15)
```python
from typing import Literal
from pydantic import BaseModel

OperationType = Literal["income", "outcome"]
Category = Literal["suppliers", "sales", "operational", "administrative", "others"]

class FinancialMovement(BaseModel):
    create_date: date
    amount: float
    operation_type: OperationType
    category: Category
```

**Evidencia Frontend:** [`frontend/src/lib/financial-types.ts`](../frontend/src/lib/financial-types.ts)
```typescript
export type OperationType = 'income' | 'outcome'
export type Category = 'suppliers' | 'sales' | 'operational' | 'administrative' | 'others'

export interface FinancialMovement {
  create_date: string
  amount: number
  operation_type: OperationType
  category: Category
}
```

✅ **Beneficio:** Tipos compartidos entre backend y frontend, validación en tiempo de compilación (TypeScript) y runtime (Pydantic).

---

### 1.2 Comprehensive Testing

**Backend Tests:** [`backend/tests/test_routes.py`](../backend/tests/test_routes.py)
```python
def test_generate_mock_movements_returns_full_year_sorted_data():
    movements = generate_mock_movements(seed=42)
    assert len(movements) == 360
    assert movements == sorted(movements, key=lambda item: item.create_date)

def test_filter_movements_by_date_includes_range_edges():
    movements = generate_mock_movements(seed=42)
    target_date = movements[0].create_date
    filtered = filter_movements_by_date(movements, target_date, target_date)
    assert filtered
```

**Frontend Tests:** [`frontend/src/lib/financial-utils.test.ts`](../frontend/src/lib/financial-utils.test.ts)
```typescript
describe("computeKPIs", () => {
  it("calculates totals and profit values", () => {
    const metrics = computeKPIs(sampleMovements);
    expect(metrics).toEqual({
      totalIncome: 1500,
      totalOutcome: 250,
      profit: 1250,
      profitPercent: (1250 / 1500) * 100,
    });
  });
});
```

✅ **Beneficio:** Cobertura de tests en funciones críticas (cálculos, filtros, generación de datos).

---

### 1.3 Separation of Concerns

**Frontend Structure:**
- `src/components/dashboard/` - Componentes específicos del dashboard
- `src/components/ui/` - Componentes genéricos reutilizables
- `src/lib/` - Lógica de negocio y tipos

**Backend Structure:**
- `app/routes.py` - Definición de API y modelos
- `app/main.py` - Configuración de FastAPI
- Tests separados en `tests/`

✅ **Beneficio:** Facilita mantenimiento, testing y reutilización de código.

---

### 1.4 Clean Code - Single Responsibility Principle

**Evidencia:** [`backend/app/routes.py`](../backend/app/routes.py#L60-L75)
```python
def _year_for_month(month: int, today: date) -> int:
    """Helper: calcula año correcto para mes (maneja años anteriores)"""
    if month < today.month:
        return today.year
    return today.year - 1

def _build_movement(month: int, income_probability: float, today: date) -> FinancialMovement:
    """Helper: construye un movimiento financiero individual"""
    operation_type: OperationType = "income" if random.random() < income_probability else "outcome"
    # ... lógica
    return FinancialMovement(...)
```

✅ **Beneficio:** Funciones pequeñas, testables y con propósitos claros.

---

### 1.5 Component Composition & Reusability

**Evidencia:** [`frontend/src/components/dashboard/kpi-card.tsx`](../frontend/src/components/dashboard/kpi-card.tsx)
```typescript
interface KPICardProps {
  label: string
  value: string
  helperText: string
  icon: LucideIcon
  variant: 'income' | 'outcome' | 'profit' | 'profitPercent'
  loading?: boolean
}

const variantStyles: Record<KPICardProps['variant'], { badge: string; icon: string }> = {
  income: { badge: 'bg-[var(--income-badge)]', icon: 'text-[var(--income-badge-fg)]' },
  // ... otros variantes
}

export function KPICard({ label, value, helperText, icon: Icon, variant, loading }: KPICardProps) {
  if (loading) { return <Skeleton loading state> }
  return <Card>...</Card>
}
```

✅ **Beneficio:** Componente flexible, reutilizable, con loading state integrado.

---

### 1.6 Configuration & Infrastructure as Code

**Evidencia:** [`docker-compose.yml`](../docker-compose.yml)
```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports: ["8000:8000", "5678:5678"]
    volumes:
      - ./backend:/app
    depends_on:
      - backend

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports: ["5173:5173"]
    volumes:
      - ./frontend:/app
```

✅ **Beneficio:** Hot-reload habilitado, servicios orquestados, fácil reproducibilidad.

---

### 1.7 Error Handling en Frontend

**Evidencia:** [`frontend/src/App.tsx`](../frontend/src/App.tsx#L14-L30)
```typescript
async function fetchFinancialData(): Promise<FinancialMovement[]> {
  const response = await fetch(`${API_BASE_URL}/api/metrics`);
  if (!response.ok) {
    throw new Error(`Failed to fetch financial data: ${response.status}`);
  }
  return response.json();
}

function App() {
  useEffect(() => {
    fetchFinancialData()
      .then((movements) => { /* ... */ })
      .catch(() => {
        setError("No se pudo cargar la información financiera. Revisa la API de backend.");
      })
      .finally(() => { setLoading(false); });
  }, []);

  return (
    <>
      {error ? <div className="rounded-lg border border-destructive...">{error}</div> : null}
    </>
  );
}
```

✅ **Beneficio:** Gestión de errores con feedback al usuario.

---

### 1.8 Pydantic Validation

**Evidencia:** [`backend/app/routes.py`](../backend/app/routes.py#L22-L28)
```python
class FinancialMovement(BaseModel):
    create_date: date
    amount: float
    operation_type: OperationType
    category: Category
    business_type: BusinessType
```

✅ **Beneficio:** Validación automática de tipos, serialización JSON, documentación OpenAPI automática.

---

## 2. Malas Prácticas y Riesgos Identificados

### 2.1 Magic Numbers y Hard-Coded Values

**Evidencia:** [`backend/app/routes.py`](../backend/app/routes.py#L94-L111)
```python
def _build_movement(month: int, income_probability: float, today: date) -> FinancialMovement:
    operation_type: OperationType = "income" if random.random() < income_probability else "outcome"
    movement_day = random.randint(1, 28)  # ⚠️ Hard-coded (¿por qué 28 y no 31?)
    # ...
    if operation_type == "income":
        category: Category = "sales" if random.random() < 0.9 else "others"  # ⚠️ 0.9 sin explicación
        amount = round(random.uniform(800, 12000), 2)  # ⚠️ Rangos sin documentar
    else:
        amount = round(random.uniform(500, 9000), 2)  # ⚠️ Diferentes rangos sin lógica clara

def generate_mock_movements(seed: int | None = None) -> list[FinancialMovement]:
    # ...
    for month in range(1, 13):  # ⚠️ 12 meses hard-coded
        income_probability = random.uniform(0.45, 0.7)  # ⚠️ Rangos arbitrarios
        for _ in range(30):  # ⚠️ 30 movimientos/mes sin razón
```

⚠️ **Riesgo:**
- Difícil de mantener y entender la intención
- Imposible calibrar sin editar código
- Difícil testear con diferentes parámetros

---

### 2.2 Falta de Logging

⚠️ **Riesgo:**
- Backend no registra errores, advertencias o eventos
- Debugging en producción es prácticamente imposible
- No hay trazabilidad de cambios de datos

**Ejemplo de lo que falta:**
```python
# Backend debería tener:
import logging
logger = logging.getLogger(__name__)

@router.get("/api/metrics")
async def get_metrics():
    try:
        movements = generate_mock_movements()
        logger.info(f"Generated {len(movements)} movements")
        return movements
    except Exception as e:
        logger.error(f"Error generating movements: {str(e)}", exc_info=True)
        raise
```

---

### 2.3 Falta de Validación en Frontend

**Evidencia:** [`frontend/src/App.tsx`](../frontend/src/App.tsx#L18-19)
```typescript
async function fetchFinancialData(): Promise<FinancialMovement[]> {
  const response = await fetch(`${API_BASE_URL}/api/metrics`);
  if (!response.ok) {
    throw new Error(`Failed to fetch financial data: ${response.status}`);
  }
  return response.json();  // ⚠️ Sin validación de tipos runtime
}
```

⚠️ **Riesgo:**
- Datos malformados no se detectan hasta que se usan
- TypeScript no valida en runtime
- Backend podría enviar datos inesperados sin error en frontend

**Lo ideal:**
```typescript
import { z } from 'zod';

const FinancialMovementSchema = z.object({
  create_date: z.string(),
  amount: z.number(),
  operation_type: z.enum(['income', 'outcome']),
  category: z.enum(['suppliers', 'sales', 'operational', 'administrative', 'others']),
  business_type: z.enum(['B2B', 'B2C']),
});

async function fetchFinancialData(): Promise<FinancialMovement[]> {
  const response = await fetch(`${API_BASE_URL}/api/metrics`);
  const data = await response.json();
  return z.array(FinancialMovementSchema).parse(data);  // ✅ Validación runtime
}
```

---

### 2.4 Falta de Variables de Entorno

⚠️ **Riesgo:**
- Configuración hard-coded imposible de cambiar en diferentes ambientes
- Secretos (si los hay) estarían en el código
- Backend no tiene forma de diferenciar dev/prod

**Debería tener:**
```python
# backend/app/main.py
import os
from fastapi import FastAPI

APP_ENV = os.getenv("APP_ENV", "development")
DEBUG = APP_ENV == "development"

app = FastAPI(
    title="Financial Metrics API",
    debug=DEBUG,
)

# backend/.env.example
APP_ENV=development
DATABASE_URL=sqlite:///./test.db
LOG_LEVEL=DEBUG
```

---

### 2.5 Datos Mock Acoplados a Producción

⚠️ **Riesgo:**
- `generate_mock_movements()` se usa incluso en endpoints de producción
- Sin forma de usar datos reales
- Imposible tener dos versiones de endpoints (dev vs prod)

**Debería tener:**
```python
# backend/app/services/data_service.py
class DataService:
    @staticmethod
    def get_movements(use_mock: bool = False) -> list[FinancialMovement]:
        if use_mock or os.getenv("USE_MOCK_DATA") == "true":
            return generate_mock_movements()
        else:
            return get_from_database()  # Implementar con BD real
```

---

### 2.6 Falta de Tests en Componentes React

⚠️ **Riesgo:**
- Componentes React no tienen tests unitarios
- Cambios visuales rompen sin notificarse
- Difícil refactorizar componentes

**Falta:**
```typescript
// frontend/src/components/dashboard/kpi-card.test.tsx
import { render, screen } from '@testing-library/react';
import { KPICard } from './kpi-card';
import { TrendingUp } from 'lucide-react';

describe('KPICard', () => {
  it('renders with income variant', () => {
    render(
      <KPICard
        label="Total Income"
        value="$100,000"
        helperText="This month"
        icon={TrendingUp}
        variant="income"
      />
    );
    expect(screen.getByText('Total Income')).toBeInTheDocument();
    expect(screen.getByText('$100,000')).toBeInTheDocument();
  });

  it('renders loading skeleton', () => {
    render(
      <KPICard
        label="Total Income"
        value="$100,000"
        helperText="This month"
        icon={TrendingUp}
        variant="income"
        loading
      />
    );
    expect(screen.queryByText('Total Income')).not.toBeInTheDocument();
  });
});
```

---

### 2.7 Falta de Documentación de API

**Evidencia:** [`backend/app/routes.py`](../backend/app/routes.py)
- No hay docstrings en funciones
- No hay comentarios explicando qué endpoints existen
- No hay describe de query parameters

⚠️ **Riesgo:**
- Desarrolladores frontend no saben qué esperar
- Endpoints no self-documenting más allá de FastAPI/Swagger

**Debería tener:**
```python
@router.get("/api/metrics", response_model=list[FinancialMovement], summary="Get Financial Movements")
async def get_metrics(
    start_date: date | None = Query(None, description="Start date for filtering (ISO format)"),
    end_date: date | None = Query(None, description="End date for filtering (ISO format)"),
    category: Category | None = Query(None, description="Filter by category"),
) -> list[FinancialMovement]:
    """
    Get financial movements.

    Returns a list of financial movements with optional filtering by date range and category.

    **Query Parameters:**
    - `start_date`: Optional start date (YYYY-MM-DD)
    - `end_date`: Optional end date (YYYY-MM-DD)
    - `category`: Optional category filter

    **Response:**
    - 200: List of FinancialMovement objects
    - 400: Invalid date format
    """
    # ...
```

---

### 2.8 Falta de Validación en Backend

⚠️ **Riesgo:**
- No hay validación de query parameters en endpoints
- No hay bounds checking en filtros
- Riesgos de SQL injection (si hubiese BD real)

---

### 2.9 Seed Aleatorio sin Documentación

**Evidencia:** [`backend/app/routes.py`](../backend/app/routes.py#L121)
```python
def generate_mock_movements(seed: int | None = None) -> list[FinancialMovement]:
    if seed is not None:
        random.seed(seed)
    # ...
```

⚠️ **Riesgo:**
- No hay documentación de cuándo/cómo usar seed
- Tests no pueden reproducir datos consistentemente
- Diferentes builds generan diferentes datos

---

### 2.10 Falta de Normalización de Tipos

**Evidencia:** [`frontend/src/lib/financial-utils.ts`](../frontend/src/lib/financial-utils.ts#L23)
```typescript
export function computeKPIs(movements: FinancialMovement[]): KPIMetrics {
  const totalIncome = movements
    .filter((m) => m.operation_type === "income")
    .reduce((sum, m) => sum + m.amount, 0);
  // ... sin edge case checks explícitos
}
```

⚠️ **Riesgo:**
- Aunque hay un check de division by zero, hay otros edge cases
- Arraysvacías no se documentan
- Valores null/undefined no se manejan explícitamente

---

## 3. Reglas Propuestas por Categoría

### 📐 Arquitectura

**ARCH-001:** Backend REST separation
- ✅ DO: Mantener endpoints REST sin side effects
- ❌ DON'T: Cambiar estado global en endpoints
- **Validar:** Todos los endpoints deben ser idempotentes o claramente documentados como no-idempotentes

**ARCH-002:** Type-driven development
- ✅ DO: Definir tipos/interfaces/modelos primero, luego implementar
- ❌ DON'T: `any`, `unknown` sin justificación
- **Validar:** No permitir `any` en archivos principales (solo en código legacy marcado)

**ARCH-003:** Config as environment variables
- ✅ DO: Toda configuración en `.env`, valores por defecto sensatos
- ❌ DON'T: Hard-code valores de producción, secretos, URLs
- **Validar:** Usar `python-dotenv` (backend) y `dotenv` (frontend)

**ARCH-004:** Frontend-Backend contract
- ✅ DO: Compartir tipos Pydantic ↔ TypeScript (o usar OpenAPI schema)
- ❌ DON'T: Tipos diferentes en frontend y backend
- **Validar:** Tests verifican que tipos coinciden

---

### 🏷️ Naming & Code Style

**NAMING-001:** Magic numbers → Named constants
- ✅ DO: `DAYS_PER_MONTH = 28`, `INCOME_PROBABILITY_MIN = 0.45`
- ❌ DON'T: `random.randint(1, 28)`, `random.uniform(0.45, 0.7)`
- **Validar:** No permitir números sin explicación en valores hardcoded

**NAMING-002:** Descriptive variable names
- ✅ DO: `income_probability`, `outcome_categories`, `movement_date`
- ❌ DON'T: `prob`, `cats`, `d`
- **Validar:** Linting: variable names deben ser ≥3 caracteres (excepto índices, i, j, k)

**NAMING-003:** Private functions con prefix
- ✅ DO: `_build_movement()`, `_year_for_month()`
- ❌ DON'T: `build_movement()` (ambigüedad sobre si es público)
- **Validar:** Funciones internas deben empezar con `_`

---

### ✅ Testing

**TEST-001:** Unit tests para lógica crítica
- ✅ DO: Tests para KPI calculations, date filtering, data generation
- ❌ DON'T: Tests solo para happy path
- **Validar:** Coverage ≥80% en backend (`pytest-cov`), ≥70% en utils frontend

**TEST-002:** Tests include edge cases
- ✅ DO: Zero income, empty arrays, dates at boundaries
- ❌ DON'T: Solo casos normales
- **Validar:** Cada función debe tener test para al menos 1 edge case

**TEST-003:** Component tests en React
- ✅ DO: Tests para componentes visuales usando `@testing-library/react`
- ❌ DON'T: Solo tests de utils, ignorar componentes
- **Validar:** Componentes dashboard/ deben tener `.test.tsx` files

**TEST-004:** Reproducible tests
- ✅ DO: Usar seeds fijos en tests, datos determinísticos
- ❌ DON'T: Tests que dependen de random
- **Validar:** `generate_mock_movements(seed=42)` en todos los tests

---

### 📝 Documentation

**DOC-001:** API endpoints with docstrings
- ✅ DO: Docstring en cada endpoint con descripción, parámetros, respuesta
- ❌ DON'T: Endpoints sin documentación
- **Validar:** Cada `@router.get/post` debe tener docstring

**DOC-002:** Type hints everywhere
- ✅ DO: Tipo de retorno en cada función
- ❌ DON'T: Funciones sin type hints
- **Validar:** Linting enforce `return` type hints

**DOC-003:** Justify hard-coded values
- ✅ DO: `MONTH_DAYS = 28  # Using 28 to avoid edge cases with varying month lengths`
- ❌ DON'T: `28` sin explicación
- **Validar:** Constants deben tener comentario explicativo

**DOC-004:** README updates para cambios arquitectónicos
- ✅ DO: Actualizar README cuando se cambia estructura
- ❌ DON'T: Documentación desfasada
- **Validar:** PR check: README actualizado si hay cambios en estructura

---

### 🔍 Validation & Error Handling

**VALID-001:** Input validation in endpoints
- ✅ DO: Validar query params, body, types en endpoints
- ❌ DON'T: Asumir que datos son correctos
- **Validar:** Usar Pydantic validators, `Query()` constraints

**VALID-002:** Runtime type validation in frontend
- ✅ DO: Usar Zod/io-ts para validar respuestas API
- ❌ DON'T: `fetch()` sin validación de tipos
- **Validar:** Adoptar Zod para validación runtime

**VALID-003:** Explicit error messages
- ✅ DO: User-friendly messages + internal logs
- ❌ DON'T: Generic "Error"
- **Validar:** Errores deben describir problema + solución potencial

**VALID-004:** Edge case handling
- ✅ DO: Documentar qué pasa con arrays vacíos, valores null, división por cero
- ❌ DON'T: Asumir que no ocurren
- **Validar:** Funciones deben documentar edge cases

---

### 🔧 Developer Experience (DX)

**DX-001:** Logging for debugging
- ✅ DO: `logger.info()`, `logger.error()` en backend para eventos importantes
- ❌ DON'T: `print()` statements
- **Validar:** Backend debe tener `logging` configurado

**DX-002:** Env setup documentation
- ✅ DO: `.env.example` con todas las variables requeridas
- ❌ DON'T: Documentación vaga
- **Validar:** `.env.example` debe existir con comentarios

**DX-003:** Hot reload by default
- ✅ DO: Mantener `--reload` en uvicorn, hot-reload en Vite
- ❌ DON'T: Requiere reinicio manual
- **Validar:** Docker Compose ya lo tiene configurado

**DX-004:** Debugpy available
- ✅ DO: Debugpy en puerto 5678 (backend)
- ❌ DON'T: Imposible debugguear código
- **Validar:** Backend Dockerfile expone puerto 5678

---

### 🐳 Infrastructure & DevOps

**INFRA-001:** Docker multi-stage builds
- ✅ DO: Separar build stage de runtime stage (reducir tamaño imagen)
- ❌ DON'T: Todas las dependencias en imagen final
- **Validar:** Si tamaño imagen > 500MB para frontend, optimizar

**INFRA-002:** Environment parity
- ✅ DO: Dev, staging, prod deben ser lo más similares posible
- ❌ DON'T: Funcionan diferente en cada ambiente
- **Validar:** Docker Compose refleja producción lo máximo posible

**INFRA-003:** Health checks
- ✅ DO: Implementar `/health` endpoint
- ❌ DON'T: Sin forma de verificar si servicio está listo
- **Validar:** `docker-compose` puede hacer health checks

---

## 4. Matriz de Aplicación de Reglas

| Categoría | # Reglas | Prioridad | Aplicabilidad |
|-----------|---------|-----------|--------------|
| Arquitectura | 4 | ALTA | Críticas para escalabilidad |
| Naming | 3 | MEDIA | Mejora legibilidad |
| Testing | 4 | ALTA | Críticas para confiabilidad |
| Documentación | 4 | MEDIA | Importante para onboarding |
| Validación | 4 | ALTA | Críticas para robustez |
| DX | 4 | MEDIA | Mejora productividad |
| Infrastructure | 3 | MEDIA | Importante para CI/CD |

**Total:** 26 reglas propuestas

---

## 5. Mapa de Implementación

### Fase 2 Actual (Auditoría)
✅ Identificar buenas prácticas  
✅ Identificar riesgos  
✅ Proponer reglas  

### Fase 3 (Crear Infrastructure)
- [ ] Crear `./.agents/rules/` con archivos markdown por categoría
- [ ] Crear `./.agents/skills/` con validadores
- [ ] Crear `./memory-bank/` con decisiones de proyecto

### Fase 4 (Implementar Mejoras)
- [ ] Backend: Agregar logging
- [ ] Backend: Agregar `.env` y validación
- [ ] Frontend: Agregar Zod para validación runtime
- [ ] Frontend: Agregar tests a componentes
- [ ] Backend: Agregar docstrings a endpoints

---

## 6. Conclusiones

### Fortalezas del Proyecto
✅ **Type Safety:** TypeScript + Pydantic bien implementados  
✅ **Testing:** Cobertura inicial buena  
✅ **Separación de Concerns:** Estructura clara  
✅ **DX:** Hot-reload, debugpy, docker-compose  

### Áreas de Mejora
⚠️ **Logging:** Ausente en backend  
⚠️ **Configuration:** Hard-coded valores  
⚠️ **Validación:** Falta en frontend  
⚠️ **Testing:** Componentes React sin tests  
⚠️ **Documentación:** Faltan docstrings en endpoints  

### Próximos Pasos
1. Implementar 26 reglas propuestas en `.agents/rules/`
2. Crear skills de validación en `.agents/skills/`
3. Aplicar reglas en mejoras a código existente
4. Usar rules como guía para future PRs

---

**Auditoría completada:** 2026-07-27  
**Analista:** GitHub Copilot (Phase 2 Code Audit)
