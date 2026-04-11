# Sistema de diseño — Gatekeeper (web)

Documento de referencia para **consistencia visual** entre humanos y agentes de IA que trabajen en `gatekeeper-frontend`. El producto es **SaaS B2B multi-tenant** de **control de asistencia y jornadas** (marcajes, roles, permisos). La interfaz debe transmitir **confianza, claridad operativa y trazabilidad**, sin parecer un template genérico de “app de IA”.

---

## 1. Principios de marca (look & feel)

| Principio | Qué significa en UI |
|-----------|---------------------|
| **Umbral claro** | El nombre *Gatekeeper* sugiere un punto de control definido: estados (entrada/salida, activo/cerrado) deben leerse al instante; evitar ambigüedad visual. |
| **Seriedad sin frialdad** | B2B y cumplimiento laboral: superficies sobrias, pero con **neutros cálidos** (no gris puro de hospital) para no sentirse robótico. |
| **Tiempo visible** | Horarios, duraciones y estados de turno son el núcleo: la jerarquía tipográfica y el color de **acento** refuerzan lo temporal (alertas, plazos, “ahora”). |
| **Roles explícitos** | Admin vs empleado: diferencias de alcance deben reflejarse en navegación y affordances, no solo en el copy. |

---

## 2. Anti-patrones (“AI slop” y UI genérica)

Evitar de forma explícita (y documentar en revisiones):

- **Gradientes decorativos** violeta/azul/rosa sin función semántica en dashboards operativos.
- **Tipografía única Inter/system sin escala**: todo el mismo peso y tamaño; falta de jerarquía.
- **Cards idénticas** con `rounded-3xl`, sombra fuerte y mucho padding en listas densas de datos.
- **Ilustraciones stock** homogéneas o iconos “de startup” que no reflejan dominio laboral/chileno.
- **Dark mode automático** solo por `prefers-color-scheme` sin tokens revisados: contrastes rotos en tablas y estados.
- **Estados solo por color** sin texto, ícono o etiqueta (accesibilidad y usuarios con daltonismo).
- **Microcopy en inglés** mezclado en flujos en español sin criterio por pantalla.

---

## 3. Paleta de color (canónica)

Los valores son la **fuente de verdad** hasta que se sincronicen en `globals.css` (`@theme` de Tailwind v4). Nombres semánticos alineados a componentes existentes (`primary`, `destructive`, etc.).

### 3.1 Marca y superficies (modo claro)

| Token semántico | Rol | Hex | Uso |
|-----------------|-----|-----|-----|
| `--color-canvas` | Fondo de aplicación | `#f6f4f0` | Fondo principal; neutro **cálido**. |
| `--color-surface` | Tarjetas, paneles, sidebar | `#fffcf8` | Superficie elevada; ligeramente más clara que el canvas. |
| `--color-border` | Bordes y separadores | `#e0dbd4` | Tablas, inputs, divisores. |
| `--color-border-strong` | Énfasis de borde | `#c4bdb2` | Focus rings secundarios, separación fuerte. |
| `--color-ink` | Texto principal | `#1c1917` | Títulos y cuerpo principal (stone-900). |
| `--color-ink-muted` | Texto secundario | `#57534e` | Metadatos, hints (stone-600). |
| `--color-ink-subtle` | Texto terciario | `#78716c` | Placeholders, timestamps (stone-500). |

### 3.2 Acción y marca (primario)

| Token | Hex | Uso |
|-------|-----|-----|
| `--color-primary` | `#156b7a` | Botones primarios, enlaces de acción principal, elementos de marca. **Teal profundo** (control, orden; distinto del azul “SaaS genérico”). |
| `--color-primary-foreground` | `#f4fafb` | Texto sobre primary. |
| `--color-primary-hover` | `#0f5663` | Hover/active de primary. |
| `--color-primary-muted` | `#e0f2f4` | Fondos suaves de badges o highlights de sección relacionados con la marca. |

### 3.3 Acento temporal y atención

| Token | Hex | Uso |
|-------|-----|-----|
| `--color-accent` | `#9a3412` | **Terracota / óxido**: alertas de tiempo, “requiere atención”, destacar plazos. Uso **moderado** para no competir con primary. |
| `--color-accent-foreground` | `#fff7ed` | Texto sobre accent cuando el fondo es sólido. |

### 3.4 Estados de sistema

| Token | Hex | Uso |
|-------|-----|-----|
| `--color-success` | `#166534` | Turno completado, confirmación, operación OK. |
| `--color-success-muted` | `#dcfce7` | Fondos de fila/badge de éxito. |
| `--color-warning` | `#a16207` | Advertencias no bloqueantes. |
| `--color-warning-muted` | `#fef3c7` | Fondos suaves de aviso. |
| `--color-destructive` | `#b91c1c` | Eliminar, error crítico, bloqueo. |
| `--color-destructive-foreground` | `#fef2f2` | Texto sobre destructive. |
| `--color-destructive-muted` | `#fee2e2` | Fondos de error en filas o banners. |

### 3.5 Modo oscuro (cuando se habilite de forma explícita)

Misma semántica; valores orientativos:

| Token | Hex | Notas |
|-------|-----|--------|
| Canvas | `#0c1014` | Azul-gris muy oscuro, no negro puro. |
| Surface | `#151b22` | Paneles y cards. |
| Ink | `#f5f5f4` | Texto principal. |
| Ink muted | `#a8a29e` | Secundario. |
| Primary | `#2dd4bf` o `#5eead4` | Probar contraste WCAG sobre surface; ajustar si hace falta. |
| Border | `#272f3a` | Separadores discretos. |

**Regla:** no depender solo de `prefers-color-scheme` hasta que todos los tokens y componentes estén auditados.

---

## 4. Tipografía

| Uso | Familia | Notas |
|-----|---------|--------|
| UI | **Geist Sans** (ya cargada en `layout.tsx`) | Mantener; es neutra y legible. Evitar cambiar a Inter como “default AI”. |
| Datos tabulares, RUT, códigos | **Geist Mono** | RUT, IDs, horas exactas en tablas densas. |
| Escala sugerida | | `text-xs` metadatos; `text-sm` UI densa; `text-base` formularios; `text-lg`/`text-xl` secciones; `text-2xl+` solo títulos de página. |

**Regla:** máximo **dos pesos** por vista (p. ej. regular + semibold) para no dispersar la jerarquía.

---

## 5. Espaciado, radios y elevación

| Aspecto | Directriz |
|---------|-----------|
| **Espaciado** | Base **4px**; usar escala Tailwind (`p-4`, `gap-3`, etc.). Listas administrativas: preferir **compacto** (`py-2` en filas) frente a cards enormes. |
| **Radio** | Default **`rounded-md` (6px)** para inputs y botones; `rounded-lg` para cards y modales. Evitar `rounded-3xl` como estilo por defecto. |
| **Sombras** | Sutiles: `shadow-sm` para elevación; reservar `shadow-md+` para modales y dropdowns. |
| **Bordes** | Preferir **1px** `border-border` antes que sombras fuertes para separar regiones. |

---

## 6. Componentes y patrones

- **Botones:** Ya prevén variantes (`primary`, `secondary`, `outline`, `ghost`, `destructive`). Primary = `primary` + `primary-foreground`; destructive solo para acciones irreversibles.
- **Navegación lateral:** Fondo `surface` o `canvas`; ítem activo con fondo `primary-muted` + texto `primary` o borde lateral `primary`.
- **Tablas:** Cabecera con fondo sutil (`surface` o `primary-muted` muy ligero); zebra opcional con `--color-canvas` vs `surface`.
- **Formularios:** Labels visibles; errores con `destructive` + mensaje textual (no solo borde rojo).
- **Toasts / notificaciones:** Éxito → verde semántico; error → destructive; info → primary o ink según importancia.

---

## 7. Accesibilidad (mínimo acordado)

- Contraste texto/fondo **≥ 4.5:1** para cuerpo; **≥ 3:1** para texto grande y componentes UI.
- **Focus visible:** `focus-visible:ring-2` con color alineado a `primary` o `ring` dedicado.
- **No solo color:** estados de turno (p. ej. activo/completado) incluyen **etiqueta o icono**, no solo tinte de fila.

---

## 8. Implementación técnica (Tailwind v4)

Los componentes deben usar **tokens semánticos** (`bg-primary`, `text-ink-muted`, etc.), definidos en `src/app/globals.css` bajo `@theme inline` mapeando a las variables CSS de las tablas anteriores.

Ejemplo de mapeo (referencia; al implementar, unificar nombres con `Button` y el resto de UI):

```css
@theme inline {
  --color-background: var(--canvas);
  --color-foreground: var(--ink);
  --color-primary: var(--brand-primary);
  --color-primary-foreground: var(--brand-on-primary);
  /* …destructive, border, etc. */
}
```

Mantener **una sola fuente de tokens** (CSS variables + `@theme`) para que agentes y humanos no dupliquen hex en class arbitrary por archivo.

---

## 9. Checklist para agentes de IA (frontend)

Antes de dar por cerrada una pantalla o PR de UI:

1. ¿Los colores vienen de **tokens** (`primary`, `destructive`, `canvas`, etc.) y no de hex sueltos salvo excepción local?
2. ¿La jerarquía **título / sección / dato** es clara sin depender de tamaños arbitrarios?
3. ¿Los estados críticos (error, éxito, advertencia) tienen **texto o icono** además de color?
4. ¿El modo claro (y oscuro si aplica) mantiene **contraste** en tablas y botones?
5. ¿Se evitan patrones listados en la sección **Anti-patrones**?

---

## 10. Relación con otros documentos

- Dominio y términos: `docs/product/glossary.md`.
- Capacidades: `docs/product/capability-map.md`.
- Convenciones de código frontend: `.cursor/rules/frontend.mdc` y `.agents/frontend-developer.md`.

**Versión:** 1.0 (MVP → branded elevation). Actualizar este documento cuando cambie la paleta o los tokens globales.
